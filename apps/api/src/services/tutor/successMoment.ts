import type { Problem } from '@prisma/client';
import type { Accomplishment, LadderMove} from '@codelock/shared';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { recordStep } from '../learningLog.js';
import { skillsRequiredBy } from '../skills.js';
import { loadSolveRecords, PRACTICE_HELP_WINDOW_MS, replaySkillSnapshot } from '../skillState.js';
import { deriveAccomplishment } from './accomplishment.js';
import { starterPack } from './starter.js';

/**
 * Work out a solve's success moment and save it.
 *
 * Deliberately not part of the graded response. The unlock token goes back the
 * moment the lock is released; this runs afterwards and writes an
 * ACCOMPLISHMENT event, which the success screen fetches by submission id.
 * If it is slow or fails, the screen says the progress is saved and offers the
 * same ways forward — nobody waits behind it.
 */

/** Ask how a solve felt at most this often. */
const FEEDBACK_EVERY_MS = 3 * 24 * 60 * 60 * 1000;

export interface SuccessParams {
  userId: string;
  problem: Problem & { testCases: Array<{ stdin: string; expectedStdout: string }> };
  sessionId: string | null;
  submission: { id: string; createdAt: Date };
  /**
   * Where this solve left the difficulty ladder, or null when it stayed put.
   *
   * Optional because the practice path has no ladder move to report: a
   * submission outside a lock never advances anything.
   */
  ladder?: LadderMove | null;
}

/** Fire and forget. Never throws. */
export function recordSuccess(params: SuccessParams): void {
  void deriveSuccess(params)
    .then((accomplishment) =>
      recordStep(params.userId, {
        kind: 'ACCOMPLISHMENT',
        problem: params.problem,
        sessionId: params.sessionId,
        submissionId: params.submission.id,
        detail: {
          kind: accomplishment.kind,
          headline: accomplishment.headline,
          accomplishment: accomplishment as unknown as Record<string, unknown>,
        } as never,
      }),
    )
    .catch((err: unknown) => {
      logger.warn({ err, submissionId: params.submission.id }, 'success moment unavailable');
    });
}

export async function deriveSuccess(params: SuccessParams): Promise<Accomplishment> {
  const { userId, problem, sessionId, submission } = params;
  const solvedAt = submission.createdAt;
  const practiceStart = new Date(solvedAt.getTime() - PRACTICE_HELP_WINDOW_MS);

  const [helpEvents, attempts, priorSolves, recentFeedback] = await Promise.all([
    prisma.learningEvent.findMany({
      where: {
        userId,
        problemSlug: problem.slug,
        kind: { in: ['HINT_REVEALED', 'DEBRIEF_OPENED'] },
        ...(sessionId
          ? { sessionId, at: { lt: solvedAt } }
          : {
              at: { lt: solvedAt, gte: practiceStart },
              // Practice hints carry no session. A debrief opened after a
              // lock carries that lock's session but is still the answer on
              // screen, so it counts for a practice solve soon after.
              OR: [{ sessionId: null }, { kind: 'DEBRIEF_OPENED' }],
            }),
      },
      select: { kind: true, detail: true },
    }),
    prisma.submission.count({
      where: sessionId
        ? { lockSessionId: sessionId, problemId: problem.id, createdAt: { lte: solvedAt } }
        : { userId, problemId: problem.id, lockSessionId: null, createdAt: { lte: solvedAt, gte: practiceStart } },
    }),
    loadSolveRecords(userId, solvedAt),
    prisma.learningEvent.findFirst({
      where: { userId, kind: 'FEEDBACK', at: { gte: new Date(Date.now() - FEEDBACK_EVERY_MS) } },
      select: { id: true },
    }),
  ]);

  const levels = helpEvents.map((e) => Number((e.detail as { level?: number } | null)?.level ?? 0));
  const workedSolution = helpEvents.some((e) => e.kind === 'DEBRIEF_OPENED') || levels.includes(5);
  const help = {
    hints: helpEvents.filter((e) => e.kind === 'HINT_REVEALED').length,
    maxLevel: Math.max(0, ...levels),
    workedSolution,
  };

  const skillProblem = {
    signatureId: problem.signatureId,
    patternTags: problem.patternTags,
    tier: problem.tier,
    patternFamily: problem.patternFamily,
  };
  const assisted = help.hints > 0 || workedSolution;
  const skillsBefore = replaySkillSnapshot(priorSolves, solvedAt);
  const skillsAfter = replaySkillSnapshot(
    [...priorSolves, { problemId: problem.id, sessionId, problem: skillProblem, assisted, solvedAt }],
    solvedAt,
  );

  // A similar problem for when no reviewed variation exists.
  let fallbackVariation: { slug: string; title: string } | null = null;
  if (!starterPack(problem.slug)) {
    fallbackVariation = await prisma.problem.findFirst({
      where: {
        isActive: true,
        signatureId: problem.signatureId,
        patternFamily: problem.patternFamily,
        difficulty: problem.difficulty,
        slug: { notIn: [problem.slug, ...priorSolves.map((p) => p.slug)] },
      },
      orderBy: { slug: 'asc' },
      select: { slug: true, title: true },
    });
  }

  return deriveAccomplishment({
    ladder: params.ladder ?? null,
    problem: {
      slug: problem.slug,
      title: problem.title,
      patternTags: problem.patternTags,
      tests: problem.testCases,
      signatureId: problem.signatureId,
    },
    help,
    attempts,
    priorSolves,
    now: solvedAt,
    requiredSkills: skillsRequiredBy(skillProblem),
    skillsBefore,
    skillsAfter,
    fallbackVariation,
    feedbackDue: recentFeedback === null,
  });
}
