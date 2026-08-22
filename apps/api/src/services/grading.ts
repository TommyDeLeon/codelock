import { Language, LockState, SubmissionStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { env } from '../env.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { runBatch, JUDGE0_STATUS, type CaseResult } from './judge0.js';
import { applyOutcome, type ProgressUpdate } from './difficulty.js';
import { releaseLock, requireOwnedSession } from './lockSessions.js';
import { mirrorSubmission } from './integrations.js';
import {
  bestOfRuns,
  evaluatePerformance,
  evaluateStanding,
  withNewBest,
  worstCaseRuntime,
  type PerformanceVerdict,
  type RuntimeMap,
  type SolveStanding,
} from './performance.js';

/** Hard cap on stored source. Generous for a solution, hostile to a payload. */
const MAX_SOURCE_BYTES = 64 * 1024;
/** Compiler output can be enormous; keep the first slice, drop the rest. */
const MAX_MESSAGE_CHARS = 4_000;

export interface GradeResult {
  submissionId: string;
  status: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  runtimeMs: number | null;
  memoryKb: number | null;
  message: string | null;
  cases: Array<{
    ordinal: number;
    isSample: boolean;
    passed: boolean;
    status: string;
    timeMs: number;
  }>;
  /** Every test passed. Necessary for an unlock, but not sufficient. */
  correct: boolean;
  /** Present whenever the answer was correct: how it fared against the gate. */
  performance: PerformanceVerdict | null;
  /** True only when correct AND fast enough. This is what releases the lock. */
  accepted: boolean;
  /** Rank, personal best and record break. Present whenever the answer was correct. */
  standing: SolveStanding | null;
  unlockToken: string | null;
  progress: ProgressUpdate | null;
}

/**
 * Grade one submission end to end.
 *
 * Order matters: correctness first (cheap to reject), then the timed re-runs,
 * then the lock release. A wrong answer never costs the extra judge capacity.
 */
export async function gradeSubmission(params: {
  userId: string;
  problemId: string;
  lockSessionId?: string | null;
  language: Language;
  sourceCode: string;
}): Promise<GradeResult> {
  const { userId, problemId, language, sourceCode } = params;

  if (Buffer.byteLength(sourceCode, 'utf8') > MAX_SOURCE_BYTES) {
    throw ApiError.badRequest('Source code exceeds 64 KB');
  }

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { testCases: { orderBy: { ordinal: 'asc' } } },
  });
  if (!problem || !problem.isActive) throw ApiError.notFound('Problem not found');
  if (problem.testCases.length === 0) {
    throw new ApiError(500, 'PROBLEM_MISCONFIGURED', 'Problem has no test cases');
  }

  // A submission tied to a lock session must belong to *that* session's problem,
  // or a user could unlock by solving an easy problem of their own choosing.
  let session = null;
  if (params.lockSessionId) {
    session = await requireOwnedSession(userId, params.lockSessionId);
    if (session.state !== LockState.LOCKED) throw ApiError.conflict('Session is not locked');
    if (session.problemId !== problemId) {
      throw ApiError.forbidden('That is not the problem assigned to this lock');
    }
  }

  const elapsedSeconds = session?.lockedAt
    ? Math.round((Date.now() - session.lockedAt.getTime()) / 1000)
    : null;

  const submission = await prisma.submission.create({
    data: {
      userId,
      problemId,
      lockSessionId: session?.id ?? null,
      language,
      sourceCode,
      status: SubmissionStatus.RUNNING,
      totalCount: problem.testCases.length,
      elapsedSeconds,
    },
  });

  const fullSource = assembleSource(
    (problem.driverCode as Record<string, string>)[language],
    sourceCode,
  );
  const cases = problem.testCases.map((c) => ({
    stdin: c.stdin,
    expectedOutput: c.expectedStdout,
  }));
  const runOnce = () =>
    runBatch({
      language,
      sourceCode: fullSource,
      cases,
      cpuTimeLimit: problem.cpuTimeLimit,
      memoryLimitKb: problem.memoryLimitKb,
    });

  let results: CaseResult[];
  let tokens: string[];
  try {
    const batch = await runOnce();
    results = batch.results;
    tokens = batch.token;
  } catch (err) {
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: SubmissionStatus.INTERNAL_ERROR, message: 'Execution service unavailable' },
    });
    logger.error({ err, submissionId: submission.id }, 'grading failed');
    throw err;
  }

  const passedCount = results.filter((r) => r.passed).length;
  const correct = passedCount === results.length;
  const memoryKb = Math.max(0, ...results.map((r) => r.memoryKb));
  const message = firstMessage(results);
  const caseViews = problem.testCases.map((tc, i) => ({
    ordinal: tc.ordinal,
    isSample: tc.isSample,
    passed: results[i]?.passed ?? false,
    status: results[i]?.statusDescription ?? 'Unknown',
    timeMs: results[i]?.timeMs ?? 0,
  }));

  if (session) {
    await prisma.lockSession.update({
      where: { id: session.id },
      data: { attempts: { increment: 1 } },
    });
  }

  // --- wrong answer: stop here, no timing, no lock release -----------------
  if (!correct) {
    const status = deriveStatus(results);
    const runtimeMs = worstCaseRuntime(results.map((r) => r.timeMs));
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status, passedCount, runtimeMs, memoryKb, message, judgeTokens: tokens },
    });
    return {
      submissionId: submission.id,
      status,
      passedCount,
      totalCount: results.length,
      runtimeMs,
      memoryKb,
      message,
      cases: caseViews,
      correct: false,
      performance: null,
      standing: null,
      accepted: false,
      unlockToken: null,
      progress: null,
    };
  }

  // --- correct: time it properly -------------------------------------------
  // Re-run to reject transient spikes. Without this, an optimal solution can be
  // rejected because the judge host happened to be busy for 30 ms, which on a
  // device lock means being shut out of your own machine for no reason.
  const runs: number[] = [worstCaseRuntime(results.map((r) => r.timeMs))];
  for (let i = 1; i < env.PERF_BEST_OF; i++) {
    try {
      const extra = await runOnce();
      // A re-run that stops agreeing on correctness means non-determinism
      // (uninitialised memory, hash iteration order); do not reward it.
      if (extra.results.every((r) => r.passed)) {
        runs.push(worstCaseRuntime(extra.results.map((r) => r.timeMs)));
      }
    } catch (err) {
      logger.warn({ err, submissionId: submission.id }, 'timing re-run failed; using first run');
      break;
    }
  }

  const runtimeMs = bestOfRuns(runs);
  const performance = evaluatePerformance({
    runtimeMs,
    reference: problem.referenceRuntimeMs as RuntimeMap,
    best: problem.bestRuntimeMs as RuntimeMap,
    language,
  });

  const status = performance.passed
    ? SubmissionStatus.ACCEPTED
    : SubmissionStatus.ACCEPTED_TOO_SLOW;

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status,
      passedCount,
      runtimeMs,
      memoryKb,
      message,
      judgeTokens: tokens,
      gateMs: performance.gateMs,
    },
  });

  // The user's own bar, from before this run. Both correct statuses count: a
  // solve that was right but too slow is still a time they beat.
  const previous = await prisma.submission.findFirst({
    where: {
      userId,
      problemId,
      language,
      id: { not: submission.id },
      runtimeMs: { not: null },
      status: { in: [SubmissionStatus.ACCEPTED, SubmissionStatus.ACCEPTED_TOO_SLOW] },
    },
    orderBy: { runtimeMs: 'asc' },
    select: { runtimeMs: true },
  });

  const standing = evaluateStanding({
    runtimeMs,
    bestKnownMs: performance.targetMs,
    previousBestMs: previous?.runtimeMs ?? null,
    accepted: performance.passed,
  });

  const base: GradeResult = {
    submissionId: submission.id,
    status,
    passedCount,
    totalCount: results.length,
    runtimeMs,
    memoryKb,
    message,
    cases: caseViews,
    correct: true,
    performance,
    standing,
    accepted: performance.passed,
    unlockToken: null,
    progress: null,
  };

  // Correct but slow. The lock stays on; try a better algorithm.
  if (!performance.passed) return base;

  await prisma.problem.update({
    where: { id: problem.id },
    data: {
      solveCount: { increment: 1 },
      // Ratchet the gate down for everyone once someone proves a faster answer.
      bestRuntimeMs: withNewBest(
        problem.bestRuntimeMs as RuntimeMap,
        language,
        runtimeMs,
      ) as object,
      ...(elapsedSeconds
        ? {
            avgSolveSeconds: Math.round(
              (problem.avgSolveSeconds * problem.solveCount + elapsedSeconds) /
                (problem.solveCount + 1),
            ),
          }
        : {}),
    },
  });

  if (!session) return base;

  const priorAttempts = await prisma.submission.count({
    where: { lockSessionId: session.id, id: { not: submission.id } },
  });

  const progress = await advanceProgress(userId, {
    solved: true,
    elapsedSeconds: elapsedSeconds ?? undefined,
    problemAvgSeconds: problem.avgSolveSeconds,
    firstTry: priorAttempts === 0,
  });

  const { unlockToken } = await releaseLock({
    userId,
    sessionId: session.id,
    // Passed through so the audit row can explain *why* this unlocked, not
    // merely that it did.
    submissionId: submission.id,
    runtimeMs,
    gateMs: performance.gateMs,
  });

  // Push to GitHub only after the lock is released, and never await it: a
  // GitHub outage must not keep anyone locked out of their own machine.
  mirrorSubmission(userId, submission.id);

  return { ...base, unlockToken, progress };
}

/** Record a failed or abandoned session against the difficulty ladder. */
export async function recordFailure(
  userId: string,
  problemAvgSeconds: number,
): Promise<ProgressUpdate> {
  return advanceProgress(userId, { solved: false, problemAvgSeconds, firstTry: false });
}

async function advanceProgress(
  userId: string,
  outcome: Parameters<typeof applyOutcome>[1],
): Promise<ProgressUpdate> {
  const current = await prisma.userProgress.findUnique({ where: { userId } });
  if (!current) throw ApiError.notFound('User progress missing');

  const update = applyOutcome(current, outcome);
  const { transition, reason, ...persisted } = update;
  void transition;
  void reason;
  await prisma.userProgress.update({ where: { userId }, data: persisted });
  return update;
}

/**
 * Splice the user's solution into the problem's per-language driver, which owns
 * stdin parsing and stdout formatting. Keeps test cases language-agnostic and
 * keeps users from having to write boilerplate I/O under time pressure.
 */
export function assembleSource(driver: string | undefined, solution: string): string {
  if (!driver) throw ApiError.badRequest('That language is not supported for this problem');
  if (!driver.includes('{{SOLUTION}}')) {
    throw new ApiError(500, 'PROBLEM_MISCONFIGURED', 'Driver is missing the {{SOLUTION}} slot');
  }
  return driver.replace('{{SOLUTION}}', solution);
}

function deriveStatus(results: CaseResult[]): SubmissionStatus {
  // Report the most diagnostic failure, not merely the first one.
  const ids = new Set(results.map((r) => r.statusId));
  if (ids.has(JUDGE0_STATUS.COMPILATION_ERROR)) return SubmissionStatus.COMPILE_ERROR;
  if (ids.has(JUDGE0_STATUS.TIME_LIMIT_EXCEEDED)) return SubmissionStatus.TIME_LIMIT_EXCEEDED;
  if ([...ids].some((id) => id >= 7 && id <= 12)) return SubmissionStatus.RUNTIME_ERROR;
  if (ids.has(JUDGE0_STATUS.WRONG_ANSWER)) return SubmissionStatus.WRONG_ANSWER;
  return SubmissionStatus.INTERNAL_ERROR;
}

function firstMessage(results: CaseResult[]): string | null {
  const raw =
    results.find((r) => r.compileOutput)?.compileOutput ??
    results.find((r) => r.stderr)?.stderr ??
    null;
  return raw ? raw.slice(0, MAX_MESSAGE_CHARS) : null;
}
