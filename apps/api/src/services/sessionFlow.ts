import { Difficulty, LockState, UnlockOutcome, type Problem } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { recordStep } from './learningLog.js';
import { loadSkillSnapshot } from './skillState.js';
import { secondsLocked } from './audit.js';
import {
  fitForLearner,
  nextSkillToLearn,
  skillsRequiredBy,
  type SkillProblem,
  type SkillSnapshot,
} from './skills.js';

/**
 * The controls a stuck learner needs, and what they are allowed to cost.
 *
 * ## Why none of them ends the session
 *
 * There were already three ways out of a live lock and all three are
 * expensive. A skip spends a bounded daily allowance and resolves the session.
 * Abandoning it records a failure, which feeds the difficulty ladder and can
 * demote. Solving it is the thing the learner cannot currently do. So a
 * problem that lands wrong leaves them choosing between a punishment and a
 * wall, and the honest answer — "this is not the right problem for me right
 * now" — is not among the options.
 *
 * These controls add that answer. They keep the lock up, keep the countdown
 * spent, spend no allowance, and touch the difficulty ladder not at all.
 *
 * ## Why they must not move the difficulty ladder
 *
 * The ladder in `difficulty.ts` runs on graded submissions: consecutive fast
 * solves promote, consecutive failures demote. Its inputs are measurements. A
 * self-report is different evidence entirely, and wiring it into the same
 * engine would make saying "this is too hard" cost a demotion — which is to
 * say, it would make telling the truth expensive. That is the mechanism the
 * owner ruled out.
 *
 * ## What a swap costs
 *
 * Nothing, and unboundedly so. There is no swap allowance, because a bounded
 * one is a punishment with a counter on it, and because a learner who swaps
 * ten times still has to solve something to open the lock. The lock is not
 * weakened by letting them choose what they solve.
 *
 * Nothing about the session's own record is rewritten either. Attempts stand,
 * earlier submissions stand, and the clock still runs from `lockedAt`. The
 * first draft of this reset the attempt count, on the reasoning that two
 * attempts at a problem they set aside should not follow them onto a different
 * one — which was true but fixed the wrong thing, and opened a hole: a reset
 * count makes the next solve a first-try solve, so "this is too easy" became a
 * way to farm promotions.
 *
 * What protects the learner instead is that an adjusted session is counted but
 * not measured. The ladder records the solve or the failure and moves nothing
 * else. See `adjusted` in `difficulty.ts`, and the `adjusted` column on the
 * session, which the swap sets in the same conditional update that changes the
 * problem.
 *
 * ## Why the session carries a revision
 *
 * An earlier version inferred "this session was adjusted" by counting served
 * log rows. Those rows are written fire-and-forget, so a lost one silently
 * removed the ladder protection. It also guarded the release on the problem id
 * alone, which cannot tell "A now" from "A before the learner swapped to B and
 * back" — so a judge result for the first A could release the lock on the
 * second. Both were found in review. The revision increments on every swap,
 * every submission records the revision it was graded against, and every
 * release is conditional on it.
 */
export type FlowRequest = 'too_hard' | 'too_easy';

/** Longest response the warm-up accepts. Bounded so the field cannot be abused. */
export const ACTIVITY_RESPONSE_LIMIT = 400;

/** What the warm-up asks, and the one real example it asks it about. */
export interface ActivityOffer {
  question: string;
  stdin: string;
  /** Kept visible on purpose: this is not a test, so the answer is not hidden. */
  expectedStdout: string;
  /** The assignment this example belongs to. Required to complete it. */
  revision: number;
}

/** What completing the warm-up did, in the words the screen should use. */
export interface ActivityResult {
  released: true;
  message: string;
}

/** What a swap produced, for the caller to show. */
export interface SwapResult {
  problem: Problem;
  request: FlowRequest;
  /** Plain-words account of the new problem's fit. */
  skillNote: string;
  skillEligible: boolean;
  /**
   * True when the replacement is at the same difficulty band as the problem it
   * replaced, because the band the learner asked for had nothing suitable.
   *
   * Surfaced rather than smoothed over: offering another EASY problem to
   * someone who said "too hard" is a reasonable thing to do and a dishonest
   * thing to label "easier".
   */
  sameBand: boolean;
}

/**
 * Swap the problem under a live lock.
 *
 * The lock stays up and the session keeps its identity, so help already given
 * stays attached to the problem it was given for: hint and debrief rows carry
 * the problem slug, and both the capability record and the skill snapshot read
 * help scoped to session *and* problem for exactly this reason.
 *
 * Throws when nothing suitable exists, and that is the right answer here even
 * though `pickProblem` serves something anyway. The difference is what failure
 * costs: an empty pool at lock time means a lock that cannot open, while an
 * empty pool here leaves the learner on a problem they can still get hints
 * for, still restate, and still work at. Serving an unsuitable problem under
 * the label "easier" would be worse than saying there isn't one.
 */
export async function swapProblem(params: {
  userId: string;
  sessionId: string;
  request: FlowRequest;
}): Promise<SwapResult> {
  const session = await prisma.lockSession.findFirst({
    where: { id: params.sessionId, userId: params.userId },
    include: { problem: { select: { id: true, difficulty: true } } },
  });
  if (!session) throw ApiError.notFound('Session not found');
  if (session.state !== LockState.LOCKED || !session.problem) {
    throw ApiError.conflict('A different problem can only be asked for while a lock is live');
  }

  const snapshot = await loadSkillSnapshot(params.userId);
  const wanted = bandFor(session.problem.difficulty, params.request);
  const chosen = await chooseReplacement({
    snapshot,
    request: params.request,
    excludeId: session.problem.id,
    wanted,
    currentBand: session.problem.difficulty,
  });

  const fit = fitForLearner(chosen.problem, snapshot);

  // Conditional on the session still holding the assignment it held when this
  // started. Two swap requests racing, or a swap racing a solve, must not both
  // win: the loser sees a conflict rather than quietly overwriting.
  //
  // The revision and the adjusted flag change in this same statement, so a
  // swap that happened can never be missing its protection, and a submission
  // graded against the previous assignment can never release this one.
  const claimed = await prisma.lockSession.updateMany({
    where: {
      id: session.id,
      state: LockState.LOCKED,
      problemId: session.problem.id,
      problemRevision: session.problemRevision,
    },
    data: {
      problemId: chosen.problem.id,
      problemRevision: { increment: 1 },
      adjusted: true,
    },
  });
  if (claimed.count !== 1) {
    throw ApiError.conflict('This lock has already moved on');
  }

  await prisma.problem.update({
    where: { id: chosen.problem.id },
    data: { attemptCount: { increment: 1 } },
  });

  // Two rows, not one. `SESSION_FLOW` says what the learner asked for, which is
  // a fact about them and true whether or not a replacement was found;
  // `PROBLEM_SERVED` says what they were given, the same kind the first problem
  // of a session gets, because that is what happened. Recording the second this
  // way also means the lock screen picks up the new fit note with no extra
  // plumbing, since it reads the latest `PROBLEM_SERVED` row for the session.
  void recordStep(params.userId, {
    kind: 'SESSION_FLOW',
    sessionId: session.id,
    problem: chosen.problem,
    detail: {
      action: params.request,
      result: 'replaced',
      replacedProblemId: session.problem.id,
      fromBand: session.problem.difficulty,
      toBand: chosen.problem.difficulty,
      sameBand: chosen.sameBand,
    },
  });
  void recordStep(params.userId, {
    kind: 'PROBLEM_SERVED',
    sessionId: session.id,
    problem: chosen.problem,
    detail: {
      request: params.request,
      replacedProblemId: session.problem.id,
      problemRevision: session.problemRevision + 1,
      skillEligible: fit.eligible,
      skillNote: fit.reason,
    },
  });

  logger.info(
    { userId: params.userId, request: params.request, slug: chosen.problem.slug },
    'problem swapped at the learner request',
  );

  return {
    problem: chosen.problem,
    request: params.request,
    skillNote: fit.reason,
    skillEligible: fit.eligible,
    sameBand: chosen.sameBand,
  };
}

const BANDS: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

/**
 * The band to look in, one step from the problem actually on screen and
 * bounded at both ends.
 *
 * Measured from the displayed problem rather than from `UserProgress`, because
 * after one swap those two disagree and the learner is talking about what they
 * can see.
 */
export function bandFor(current: Difficulty, request: FlowRequest): Difficulty {
  const delta = request === 'too_easy' ? 1 : -1;
  const i = BANDS.indexOf(current);
  return BANDS[Math.min(BANDS.length - 1, Math.max(0, i + delta))]!;
}

/** The columns the choice needs. Whole rows are fetched only for the winner. */
const CHOICE_COLUMNS = {
  id: true,
  signatureId: true,
  patternTags: true,
  tier: true,
  patternFamily: true,
} as const;

/**
 * Score a candidate for one of the three requests. Higher wins.
 *
 * "Too hard" wants the least to hold in the head at once; "too easy" wants a
 * genuinely new idea.
 *
 * Pure, so the ordering is testable without a database.
 */
export function scoreForRequest(
  problem: SkillProblem,
  snapshot: SkillSnapshot,
  request: FlowRequest,
): number {
  const required = skillsRequiredBy(problem);
  const fit = fitForLearner(problem, snapshot);

  if (request === 'too_easy') {
    const target = nextSkillToLearn(snapshot);
    let score = 0;
    if (target && required.includes(target)) score += 40;
    score += fit.missing.length * 20;
    score += required.length * 2;
    return score;
  }

  let score = 100 - required.length * 6;
  if (fit.missing.length === 0) score += 25;
  if (fit.shaky.length === 0) score += 10;
  return score;
}

/** How many of the best candidates the final choice is drawn from. */
export const SHORTLIST = 8;

/**
 * Which bands a swap may look in. Pure, so the rule is testable.
 *
 * Only the band asked for. The single exception is the end of the ladder,
 * where the band asked for *is* the current one — "too hard" on an EASY
 * problem — and another problem at that level is the only honest offer, which
 * the caller labels as such.
 *
 * An earlier version fell back to the current band whenever the requested one
 * was empty, so "too hard" on a MEDIUM problem could quietly serve another
 * MEDIUM. Found in review, and it broke the requirement that the control
 * refuses rather than offer something that is not what was asked for.
 */
export function rungsFor(
  wanted: Difficulty,
  current: Difficulty,
): Array<{ band: Difficulty; sameBand: boolean }> {
  return [{ band: wanted, sameBand: wanted === current }];
}

/**
 * Find the problem to swap in.
 *
 * Refuses when nothing suitable exists, unlike `pickProblem`. See `swapProblem`
 * for why refusing is the right answer here.
 */
async function chooseReplacement(params: {
  request: FlowRequest;
  snapshot: SkillSnapshot;
  excludeId: string;
  wanted: Difficulty;
  currentBand: Difficulty;
}): Promise<{ problem: Problem; sameBand: boolean }> {
  // Filtered to what the learner is ready for, with no fallback to anything
  // they are not: an ineligible problem is not a smaller ask dressed up, and
  // serving it would make the control a lie.
  for (const rung of rungsFor(params.wanted, params.currentBand)) {
    const rows = await prisma.problem.findMany({
      where: { isActive: true, difficulty: rung.band, id: { not: params.excludeId } },
      select: CHOICE_COLUMNS,
    });
    const eligible = rows.filter((row) => fitForLearner(row, params.snapshot).eligible);
    if (eligible.length === 0) continue;

    const ranked = [...eligible].sort(
      (a, b) =>
        scoreForRequest(b, params.snapshot, params.request) -
        scoreForRequest(a, params.snapshot, params.request),
    );

    // A little randomness among the best few, so the control cannot become a
    // way to summon one known problem on demand and pre-solve it.
    const shortlist = ranked.slice(0, Math.min(SHORTLIST, ranked.length));
    const pick = shortlist[Math.floor(Math.random() * shortlist.length)] ?? ranked[0]!;
    const problem = await prisma.problem.findUniqueOrThrow({ where: { id: pick.id } });
    return { problem, sameBand: rung.sameBand };
  }

  throw ApiError.notFound(
    params.request === 'too_easy'
      ? 'There is nothing harder that you have the groundwork for yet.'
      : 'There is nothing smaller available right now. The hints are still free.',
  );
}

// ---------------------------------------------------------------------------
// No energy tonight
// ---------------------------------------------------------------------------

/**
 * One small thing, then the evening is allowed to end.
 *
 * ## What this is for
 *
 * The other controls assume the learner wants a problem, just not this one.
 * This one is for the night when that is not true. The realistic alternative
 * is not a heroic solve: it is the kill switch, or sitting in front of a
 * locked screen until the reaper closes it — and neither leaves anything
 * behind worth having.
 *
 * So: one public example from the problem in front of them, and one question
 * about it. Answer it in your own words and the lock opens.
 *
 * ## Why correctness is not required
 *
 * Because it is not a test, and a gate that can be failed on a low-energy
 * night is a gate that gets avoided instead of used. The expected output is
 * shown alongside the question for the same reason. What the answer is worth
 * is the two minutes of attention on a real example, which is the entry
 * activity this product is built around.
 *
 * ## What it is allowed to record
 *
 * That the learner responded to one example. Nothing else. Specifically not:
 * an accepted submission, a passed attempt, a capability record, or any skill
 * credit — an assisted solve would be the worst of these, because two of those
 * make a skill count as practised and would quietly change what gets served
 * next. The release is its own outcome, `PARTICIPATED`, so no later reader can
 * mistake it for a solve, and it spends no skip allowance.
 */
export async function offerActivity(params: {
  userId: string;
  sessionId: string;
}): Promise<ActivityOffer> {
  const session = await prisma.lockSession.findFirst({
    where: { id: params.sessionId, userId: params.userId },
    include: { problem: true },
  });
  if (!session) throw ApiError.notFound('Session not found');
  if (session.state !== LockState.LOCKED || !session.problem) {
    throw ApiError.conflict('This is only offered while a lock is live');
  }

  const sample = await prisma.testCase.findFirst({
    where: { problemId: session.problem.id, isSample: true },
    orderBy: { ordinal: 'asc' },
    select: { stdin: true, expectedStdout: true },
  });
  if (!sample) {
    throw ApiError.conflict('This problem has no worked example to look at');
  }

  // Offered is not completed, and the log says so. A learner who opens this
  // and closes it again has done nothing that needs recording as a decision.
  void recordStep(params.userId, {
    kind: 'SESSION_FLOW',
    sessionId: session.id,
    problem: session.problem,
    detail: { action: 'low_energy', result: 'offered', problemRevision: session.problemRevision },
  });

  return {
    question: 'In your own words, what should this input produce, and why?',
    stdin: sample.stdin,
    expectedStdout: sample.expectedStdout,
    // Carried back on completion. The example was about this assignment, so
    // the release is only allowed while the session still holds it.
    revision: session.problemRevision,
  };
}

/**
 * Finish the warm-up and release the lock as participation.
 *
 * The release is conditional on the session still being locked, so this cannot
 * race a solve or a skip into two endings for one evening.
 *
 * No re-arm. Every other ending re-arms the recurring timer, and that is right
 * for a solve — but re-arming after someone has said they have no energy is
 * how an exit becomes a trap, which this file's own lifecycle notes already
 * warn about. Starting the next timer stays a thing they choose.
 */
export async function completeActivity(params: {
  userId: string;
  sessionId: string;
  response: string;
  /** The `revision` the offer returned. Must still be the session's. */
  revision: number;
}): Promise<ActivityResult> {
  const response = params.response.trim();
  if (response === '') {
    throw ApiError.badRequest('Write anything at all about the example, then this will go through');
  }
  if (response.length > ACTIVITY_RESPONSE_LIMIT) {
    throw ApiError.badRequest(`Keep it under ${ACTIVITY_RESPONSE_LIMIT} characters`);
  }

  const session = await prisma.lockSession.findFirst({
    where: { id: params.sessionId, userId: params.userId },
    include: { problem: true },
  });
  if (!session) throw ApiError.notFound('Session not found');
  if (session.state !== LockState.LOCKED) {
    throw ApiError.conflict('This lock has already ended');
  }
  if (session.problemRevision !== params.revision) {
    throw ApiError.conflict('The problem changed since that example was shown. Open it again.');
  }

  const resolvedAt = new Date();
  const seconds = secondsLocked(session.lockedAt, resolvedAt);

  // One transaction for the three facts that make up this ending: the lock
  // released, what the learner did, and the audit of why it released. Written
  // separately they could disagree — a released lock with no record of the
  // participation, or a participation record for a lock that never released —
  // and the ordinary audit writer swallows its failures, which is right for a
  // solve and wrong for an ending whose only evidence is these rows.
  //
  // The release is conditional on the session still being locked and still
  // holding the assignment the example was about, so it cannot race a solve, a
  // skip or a swap into two endings for one evening. Losing that condition
  // throws inside the transaction, which rolls back the other two writes.
  await prisma.$transaction(async (tx) => {
    const released = await tx.lockSession.updateMany({
      where: {
        id: session.id,
        state: LockState.LOCKED,
        problemRevision: params.revision,
      },
      data: { state: LockState.BYPASSED, resolvedAt, escapeReason: 'low_energy_activity' },
    });
    if (released.count !== 1) throw ApiError.conflict('This lock has already ended');

    await tx.learningEvent.create({
      data: {
        userId: params.userId,
        kind: 'SESSION_FLOW',
        sessionId: session.id,
        problemSlug: session.problem?.slug ?? null,
        problemTitle: session.problem?.title ?? null,
        difficulty: session.problem?.difficulty ?? null,
        tier: session.problem?.tier ?? null,
        patternFamily: session.problem?.patternFamily ?? null,
        sourceCode: response,
        detail: {
          action: 'low_energy',
          result: 'completed',
          problemRevision: params.revision,
          // Read by anything that might later be tempted to count this. It is
          // the whole claim: they took part, and nothing about their ability
          // follows.
          participationOnly: true,
        },
      },
    });

    await tx.unlockAudit.create({
      data: {
        userId: params.userId,
        lockSessionId: session.id,
        problemId: session.problemId,
        outcome: UnlockOutcome.PARTICIPATED,
        secondsLocked: seconds,
        reason: 'low_energy_activity',
      },
    });
  });

  logger.info(
    { audit: 'unlock', userId: params.userId, sessionId: session.id, outcome: 'PARTICIPATED' },
    'lock released as participation',
  );

  return {
    released: true,
    message:
      'You worked through one example. That is recorded as taking part, and this problem was not recorded as solved.',
  };
}
