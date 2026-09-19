import { Router } from 'express';
import { LockState } from '@prisma/client';
import type { HintLevel, HintView, Language } from '@codelock/shared';
import type { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { asyncHandler } from '../middleware/error.js';
import { withLocalUser, currentUser } from '../middleware/localUser.js';
import { lockActionLimiter } from '../middleware/rateLimit.js';
import { feedbackSchema, tutorHintSchema } from '../validation/schemas.js';
import { requireOwnedSession } from '../services/lockSessions.js';
import { runCode } from '../services/run.js';
import { runBatch } from '../services/judge0.js';
import { assembleSource } from '../services/grading.js';
import { BY_FAMILY } from '../services/hints.js';
import { recordStep, recordStepConfirmed } from '../services/learningLog.js';
import { SKILL_LABELS, skillsRequiredBy } from '../services/skills.js';
import { loadSkillSnapshot } from '../services/skillState.js';
import { diagnose, type Evidence, type ExecCase } from '../services/tutor/diagnose.js';
import { buildHint, hashCode, type HintHistoryItem } from '../services/tutor/ladder.js';

export const tutorRouter = Router();
tutorRouter.use(withLocalUser);

/** A hint must never wait long on the runner; reading the code is the fallback. */
const HINT_RUN_TIMEOUT_MS = 12_000;
/** How far back practice hints (no lock session) count as the same sitting. */
export const PRACTICE_WINDOW_MS = 12 * 60 * 60 * 1000;

/** Lines of driver above the learner's code, so error line numbers map back. */
export function solutionLineOffset(driver: string | undefined): number {
  const marker = ' CODELOCK_SOLUTION_MARKER ';
  const assembled = assembleSource(driver, marker);
  const at = assembled.indexOf(marker);
  return at <= 0 ? 0 : assembled.slice(0, at).split('\n').length - 1;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('hint run timed out')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

const normalise = (code: string) => code.replace(/\s+/g, '');

/**
 * Run one hidden case against the current code. Returns it only if it fails,
 * without its expected output. Any runner problem means "no hidden evidence".
 */
async function verifyHiddenFailure(
  problem: { driverCode: unknown; cpuTimeLimit: number; memoryLimitKb: number },
  row: { ordinal: number; stdin: string; expectedStdout: string },
  language: Language,
  code: string,
): Promise<ExecCase | null> {
  try {
    const { results } = await withTimeout(
      runBatch({
        language,
        sourceCode: assembleSource((problem.driverCode as Record<string, string>)[language], code),
        cases: [{ stdin: row.stdin, expectedOutput: row.expectedStdout }],
        cpuTimeLimit: problem.cpuTimeLimit,
        memoryLimitKb: problem.memoryLimitKb,
      }),
      HINT_RUN_TIMEOUT_MS,
    );
    const result = results[0];
    if (!result || result.passed) return null;
    return {
      ordinal: row.ordinal,
      stdin: row.stdin,
      expected: null,
      actual: result.stdout,
      stderr: result.stderr ?? result.compileOutput,
      status: result.statusDescription,
      passed: false,
      hidden: true,
    };
  } catch {
    return null;
  }
}

/**
 * POST /tutor/hint — one next step, built from the learner's current code.
 *
 * Runs the current code on the SAMPLE cases only (the same path as Run), so
 * nothing about a hidden test's expected output can reach the hint. A hidden
 * failure is used only as the learner already saw it: its input from the
 * server's own test row, and the output their submission printed.
 *
 * The help is recorded, confirmed, before the hint is returned. A hint that
 * reached the learner but not the log would make a later solve look unaided.
 *
 * Works with a live lock session, or with none for practice.
 *
 * The body lives in `produceHint` so the Learn practice route can share it.
 */
/**
 * Build one hint for one learner. Shared by POST /tutor/hint and the Learn
 * practice route, which calls it with no `lockSessionId` so a lesson can
 * never read or touch a lock. Records the help before returning it.
 */
export async function produceHint(userId: string, body: z.infer<typeof tutorHintSchema>): Promise<HintView> {
  const user = { id: userId };

  const problem = await prisma.problem.findUnique({
    where: { id: body.problemId },
    include: { testCases: { orderBy: { ordinal: 'asc' } } },
  });
  if (!problem || !problem.isActive) throw ApiError.notFound('Problem not found');

  let sessionId: string | null = null;
  let attempts: number | null = null;
  if (body.lockSessionId) {
    const session = await requireOwnedSession(user.id, body.lockSessionId);
    if (session.state !== LockState.LOCKED) {
      throw ApiError.conflict('Hints for a lock are available while it is live');
    }
    if (session.problemId !== problem.id) {
      throw ApiError.forbidden('That is not the problem assigned to this lock');
    }
    sessionId = session.id;
    attempts = session.attempts;
  }

  const language = body.language as Language;
  const code = body.sourceCode;
  const codeHash = hashCode(code);
  const starter = (problem.starterCode as Record<string, string>)[language] ?? null;

  // A hidden case the last submission failed is verified below by running it
  // against the CURRENT code; only a case that still fails is used, and its
  // expected output is never attached. That is exactly what grading already
  // reveals for a failed hidden case, so a stale or guessed ordinal can
  // neither mislabel fixed code nor reveal a passing case's input.
  const hiddenFailure: ExecCase | null = null;
  const hiddenRow = body.hiddenFailure
    ? (problem.testCases.find((t) => t.ordinal === body.hiddenFailure!.ordinal && !t.isSample) ?? null)
    : null;

  // History for this problem: this lock session, or recent practice.
  const events = await prisma.learningEvent.findMany({
    where: {
      userId: user.id,
      kind: 'HINT_REVEALED',
      problemSlug: problem.slug,
      ...(sessionId
        ? { sessionId }
        : { sessionId: null, at: { gte: new Date(Date.now() - PRACTICE_WINDOW_MS) } }),
    },
    orderBy: { at: 'asc' },
    select: { detail: true },
  });
  const history: HintHistoryItem[] = events
    .map((e) => e.detail as Record<string, unknown> | null)
    .filter((d): d is Record<string, unknown> => d !== null && d.source === 'tutor')
    .map((d) => ({
      level: Number(d.level) as HintLevel,
      strategy: String(d.strategy ?? ''),
      diagnosis: String(d.diagnosis ?? ''),
      codeHash: String(d.codeHash ?? ''),
    }));

  // Evidence: run the current code, unless there is nothing to run or the
  // request is only for a word's meaning.
  let evidence: Evidence;
  if (code.trim() === '' || (starter !== null && normalise(code) === normalise(starter))) {
    evidence = { ran: false, reason: 'unchanged_starter', hiddenFailure };
  } else if (body.request === 'explain_word') {
    evidence = { ran: false, reason: 'not_needed', hiddenFailure };
  } else {
    try {
      const run = await withTimeout(
        runCode({
          userId: user.id,
          problemId: problem.id,
          lockSessionId: sessionId,
          language,
          sourceCode: code,
        }),
        HINT_RUN_TIMEOUT_MS,
      );
      evidence = {
        ran: true,
        cases: run.cases.map((c) => ({
          ordinal: c.ordinal,
          stdin: c.stdin,
          expected: c.expectedStdout,
          actual: c.stdout,
          stderr: c.stderr,
          status: c.status,
          passed: c.matched === true,
          hidden: false,
        })),
        compileError: run.compileError,
        hiddenFailure: hiddenRow ? await verifyHiddenFailure(problem, hiddenRow, language, code) : null,
      };
    } catch (err) {
      // Oversized source and similar mistakes are the learner's to fix; a
      // runner that is down or slow is not, and must not block help.
      if (err instanceof ApiError && err.status < 500) throw err;
      logger.warn({ err, problemId: problem.id }, 'hint run unavailable; reading code only');
      evidence = { ran: false, reason: 'judge_unavailable', hiddenFailure };
    }
  }

  const diagnoses = diagnose({
    language,
    code,
    starterCode: starter,
    signatureId: problem.signatureId,
    promptMarkdown: problem.promptMarkdown,
    patternTags: problem.patternTags,
    evidence,
    lineOffset: solutionLineOffset((problem.driverCode as Record<string, string>)[language]),
  });

  // Prerequisites not yet met here, named plainly so the explanation can
  // start from the beginning. Never fatal.
  let prerequisiteNote: string | null = null;
  try {
    const snapshot = await loadSkillSnapshot(user.id);
    const unmet = skillsRequiredBy(problem)
      .filter((s) => s !== 'values' && snapshot[s].state === 'not_introduced')
      .map((s) => SKILL_LABELS[s].toLowerCase());
    if (unmet.length > 0) {
      prerequisiteNote = `This problem uses ${unmet.join(' and ')}, which you have not practised in CodeLock yet. That is fine: this explanation starts from the beginning.`;
    }
  } catch {
    prerequisiteNote = null;
  }

  const hint = buildHint({
    problem: {
      slug: problem.slug,
      title: problem.title,
      signatureId: problem.signatureId,
      promptMarkdown: problem.promptMarkdown,
      patternTags: problem.patternTags,
      editorialMarkdown: problem.editorialMarkdown,
      referenceSolution: problem.referenceSolution as Partial<Record<Language, string>>,
      sampleCases: problem.testCases
        .filter((t) => t.isSample)
        .map((t) => ({ stdin: t.stdin, expectedStdout: t.expectedStdout })),
      familyConcept: BY_FAMILY[problem.patternFamily][1],
    },
    language,
    code,
    codeHash,
    evidence,
    diagnoses,
    request: body.request,
    level: body.level as HintLevel | undefined,
    term: body.term,
    history,
    prerequisiteNote,
  });

  await recordStepConfirmed(user.id, {
    kind: 'HINT_REVEALED',
    problem,
    sessionId,
    language,
    detail: {
      source: 'tutor',
      level: hint.level,
      strategy: hint.strategy,
      diagnosis: hint.diagnosis,
      codeHash,
      request: body.request,
      ran: evidence.ran,
      ...(attempts !== null ? { attempts } : {}),
    },
  });
  return hint;
}

tutorRouter.post(
  '/hint',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = tutorHintSchema.parse(req.body ?? {});
    res.json(await produceHint(user.id, body));
  }),
);

/**
 * POST /tutor/feedback — an optional, dismissible answer.
 *
 * Whether a hint helped, or how a solve felt. Kept for the learner and for
 * improving the hints; nothing reads it to change rewards or pressure anyone.
 */
tutorRouter.post(
  '/feedback',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = feedbackSchema.parse(req.body ?? {});
    const problem = body.problemSlug
      ? await prisma.problem.findUnique({ where: { slug: body.problemSlug } })
      : null;
    void recordStep(user.id, {
      kind: 'FEEDBACK',
      problem,
      detail: {
        kind: body.kind,
        ...(body.helpful !== undefined ? { helpful: body.helpful } : {}),
        ...(body.feeling ? { feeling: body.feeling } : {}),
        ...(body.hintLevel ? { hintLevel: body.hintLevel } : {}),
        ...(body.strategy ? { strategy: body.strategy } : {}),
        ...(body.note ? { note: body.note } : {}),
      },
    });
    res.json({ ok: true });
  }),
);
