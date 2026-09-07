import { Language, LockState } from '@prisma/client';
import type { RunResult, RunCase } from '@codelock/shared';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { runBatch, JUDGE0_STATUS } from './judge0.js';
import { assembleSource } from './grading.js';
import { requireOwnedSession } from './lockSessions.js';

/**
 * Run code without submitting it.
 *
 * The gap this fills: a locked session had exactly one button, and it graded.
 * Trying a print statement, checking whether a loop terminates, or seeing what
 * an off-by-one actually produces all cost an attempt — so the attempt counter
 * measured curiosity rather than wrong answers, and the rational response to
 * that incentive is to guess less and stare more. That is the opposite of what
 * a learning tool should reward.
 *
 * So a run does none of the things a submission does. It writes no Submission
 * row, does not touch `attempts`, does not move the difficulty ladder, records
 * no learning event, and cannot produce an unlock token — see `RunResult`,
 * which has no field for one.
 *
 * What it will not do is run hidden cases. It reports stdout verbatim, and
 * verbatim output for a hidden input is that case's answer handed over one run
 * at a time. Samples and typed input only; both are already public.
 */

/** Typed input is a scratchpad, not a payload. */
const MAX_STDIN_BYTES = 8 * 1024;
/** The same ceiling grading uses. */
const MAX_SOURCE_BYTES = 64 * 1024;
/** A compile error worth reading is short; a template explosion is not. */
const MAX_MESSAGE_CHARS = 4_000;

export async function runCode(params: {
  userId: string;
  problemId: string;
  lockSessionId?: string | null;
  language: Language;
  sourceCode: string;
  /** Input to run against. Omitted or null means "the samples". */
  stdin?: string | null;
}): Promise<RunResult> {
  const { userId, problemId, language, sourceCode } = params;

  if (Buffer.byteLength(sourceCode, 'utf8') > MAX_SOURCE_BYTES) {
    throw ApiError.badRequest('Source code exceeds 64 KB');
  }
  if (params.stdin != null && Buffer.byteLength(params.stdin, 'utf8') > MAX_STDIN_BYTES) {
    throw ApiError.badRequest('Input exceeds 8 KB');
  }

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { testCases: { where: { isSample: true }, orderBy: { ordinal: 'asc' } } },
  });
  if (!problem || !problem.isActive) throw ApiError.notFound('Problem not found');

  // The same ownership rules as grading, for the same reason: a run against
  // someone else's session, or against a problem this lock did not assign, has
  // no legitimate use. It reveals less than a grade does, but "less" is not a
  // reason to check less.
  if (params.lockSessionId) {
    const session = await requireOwnedSession(userId, params.lockSessionId);
    if (session.state !== LockState.LOCKED) throw ApiError.conflict('Session is not locked');
    if (session.problemId !== problemId) {
      throw ApiError.forbidden('That is not the problem assigned to this lock');
    }
  }

  // Typed input wins when present, including when it is deliberately empty —
  // "what does this print with no input" is a real question. Only an absent
  // field means "use the samples".
  const custom = params.stdin != null;
  const cases = custom
    ? [{ stdin: params.stdin as string, expectedOutput: '' }]
    : problem.testCases.map((tc) => ({ stdin: tc.stdin, expectedOutput: tc.expectedStdout }));

  if (cases.length === 0) {
    throw ApiError.badRequest('This problem has no sample cases to run. Type your own input.');
  }

  const { results } = await runBatch({
    language,
    sourceCode: assembleSource(
      (problem.driverCode as Record<string, string>)[language],
      sourceCode,
    ),
    cases,
    cpuTimeLimit: problem.cpuTimeLimit,
    memoryLimitKb: problem.memoryLimitKb,
  });

  const runCases: RunCase[] = cases.map((c, i) => {
    const result = results[i];
    return {
      ordinal: custom ? null : (problem.testCases[i]?.ordinal ?? null),
      stdin: c.stdin,
      stdout: result?.stdout ?? null,
      stderr: result?.stderr ?? null,
      status: result?.statusDescription ?? 'Unknown',
      timeMs: result?.timeMs ?? 0,
      // Nothing to be right about when the learner chose the input, so the
      // panel is told to show output rather than a verdict.
      expectedStdout: custom ? null : (problem.testCases[i]?.expectedStdout ?? null),
      matched: custom ? null : (result?.passed ?? false),
    };
  });

  const compileError =
    results.find((r) => r.statusId === JUDGE0_STATUS.COMPILATION_ERROR)?.compileOutput ?? null;

  return {
    ran: true,
    cases: runCases,
    compileError: compileError ? compileError.slice(0, MAX_MESSAGE_CHARS) : null,
  };
}
