import {
  Difficulty,
  LockState,
  UnlockOutcome,
  type LockSession,
  type Problem,
} from '@prisma/client';
// The cross-client contract. Declaring these locally is how `pausedAt` drifted
// between the API and the clients once already.
import type { LockSessionView, PublicProblem } from '@codelock/shared';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { signUnlockToken, sha256 } from '../lib/tokens.js';
import { pickProblem } from './problemSelector.js';
import { recordStep } from './learningLog.js';
import {
  availableFamiliesForTiers,
  availableTiers,
  loadProgressSnapshot,
} from './progression.js';
import { isWithinActiveWindow } from './schedule.js';
import { recordUnlock, secondsLocked } from './audit.js';

/** A session left LOCKED longer than this is reaped as ABANDONED. */
export const SESSION_MAX_AGE_HOURS = 12;

/**
 * Arm a timer for a device. Idempotent per device: re-arming while a session is
 * already ARMED or LOCKED returns the existing one rather than granting a fresh
 * countdown — otherwise "restart the app" would be a free reset.
 */
export async function armSession(params: {
  userId: string;
  deviceId?: string | null;
  durationMinutesOverride?: number;
}): Promise<LockSessionView> {
  const { userId, deviceId } = params;

  const existing = await prisma.lockSession.findFirst({
    where: { userId, deviceId: deviceId ?? null, state: { in: [LockState.ARMED, LockState.LOCKED] } },
    orderBy: { armedAt: 'desc' },
  });
  if (existing) return toView(existing, await loadProblem(existing.problemId));

  const [config, progress, user] = await Promise.all([
    prisma.timerConfig.findUnique({ where: { userId } }),
    prisma.userProgress.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ]);
  if (!config?.enabled) throw ApiError.conflict('Timer is disabled for this account');

  // The schedule is enforced here, at arm time, rather than at fire time. A
  // session that starts inside the window is allowed to finish even if it runs
  // past the end — being locked out mid-session because the clock struck 17:00
  // would be worse than the occasional overrun.
  const window = isWithinActiveWindow(config, user?.timezone ?? 'UTC');
  if (!window.active) {
    throw new ApiError(409, 'OUTSIDE_ACTIVE_HOURS', window.reason ?? 'Outside your active hours');
  }

  const minutes = params.durationMinutesOverride ?? config.durationMinutes;
  const session = await prisma.lockSession.create({
    data: {
      userId,
      deviceId: deviceId ?? null,
      difficulty: progress?.currentDifficulty ?? Difficulty.EASY,
      fireAt: new Date(Date.now() + minutes * 60_000),
    },
  });
  void recordStep(userId, { kind: 'TIMER_ARMED', detail: { minutes } });
  return toView(session, null);
}

/**
 * Transition ARMED -> LOCKED and assign the problem.
 *
 * The problem is chosen here, server-side, at fire time. Assigning it earlier
 * would let a client prefetch and pre-solve it before the lock ever appeared.
 */
export async function engageLock(params: {
  userId: string;
  sessionId: string;
}): Promise<LockSessionView> {
  const session = await requireOwnedSession(params.userId, params.sessionId);

  if (session.state === LockState.LOCKED) {
    return toView(session, await loadProblem(session.problemId));
  }
  if (session.state !== LockState.ARMED) {
    throw ApiError.conflict(`Session is ${session.state.toLowerCase()}, cannot lock`);
  }
  // A paused countdown has no deadline. Its fireAt is frozen and will sail past
  // "now" while the user is away from the desk; without this check the sweep
  // would engage a lock the user had explicitly stopped.
  if (session.pausedAt) {
    throw ApiError.conflict('Timer is paused');
  }
  // Trust the server clock, never the client's claim that time is up.
  if (session.fireAt.getTime() > Date.now()) {
    throw ApiError.conflict('Timer has not expired yet');
  }

  const claimed = await claimDueSession(session.id, session.userId, session.difficulty);
  if (!claimed) {
    // Someone else engaged it between the read above and the write: the
    // background sweep, or a second client. Report their result rather than
    // assigning a second problem over the top of theirs.
    const current = await requireOwnedSession(params.userId, params.sessionId);
    return toView(current, await loadProblem(current.problemId));
  }
  return toView(claimed.session, claimed.problem);
}

/** Called after a submission passes every test case. Issues the unlock proof. */
export async function releaseLock(params: {
  userId: string;
  sessionId: string;
  /** Carried through purely so the audit row can explain the verdict. */
  submissionId?: string | null;
  runtimeMs?: number | null;
  gateMs?: number | null;
}): Promise<{ unlockToken: string; expiresInSeconds: number }> {
  const session = await requireOwnedSession(params.userId, params.sessionId);
  if (session.state !== LockState.LOCKED) {
    throw ApiError.conflict('Session is not locked');
  }

  const unlockToken = signUnlockToken(params.userId, session.id);
  const resolvedAt = new Date();
  await prisma.lockSession.update({
    where: { id: session.id },
    data: {
      state: LockState.UNLOCKED,
      resolvedAt,
      unlockTokenHash: sha256(unlockToken),
    },
  });

  await recordUnlock({
    userId: params.userId,
    lockSessionId: session.id,
    problemId: session.problemId,
    outcome: UnlockOutcome.SOLVED,
    submissionId: params.submissionId ?? null,
    runtimeMs: params.runtimeMs ?? null,
    gateMs: params.gateMs ?? null,
    secondsLocked: secondsLocked(session.lockedAt, resolvedAt),
  });

  await rearmAfterSolve(params.userId);

  return { unlockToken, expiresInSeconds: 300 };
}

/**
 * Start the next countdown, if the user asked for that.
 *
 * Called only from the solved path. A lock ended by the kill switch or left to
 * be abandoned must not re-arm: holding Escape for ten seconds would then buy
 * ten seconds of freedom before the next timer, which turns the one documented
 * way out into a trap.
 *
 * Failures are swallowed on purpose. `armSession` refuses outside the active
 * hours and when the timer is disabled, and both are correct answers here — the
 * day is over, or the user turned it off. Neither is a reason to fail a release
 * the user has already earned: the screen is theirs the moment the token is
 * signed, and nothing after that point may take it back.
 */
async function rearmAfterSolve(userId: string): Promise<void> {
  const config = await prisma.timerConfig.findUnique({ where: { userId } });
  if (!config?.autoRearm) return;

  try {
    await armSession({ userId });
  } catch (err) {
    // Expected whenever the window has closed; logged rather than raised.
    logger.info({ err, userId }, 'auto re-arm skipped');
  }
}

/** Spend one of the day's skip allowances, if any remain. */
export async function bypassLock(params: {
  userId: string;
  sessionId: string;
}): Promise<{ skipsRemaining: number }> {
  const session = await requireOwnedSession(params.userId, params.sessionId);
  if (session.state !== LockState.LOCKED) throw ApiError.conflict('Session is not locked');

  const config = await prisma.timerConfig.findUnique({ where: { userId: params.userId } });
  const allowance = config?.dailySkipAllowance ?? 0;
  if (allowance <= 0) throw ApiError.forbidden('Skips are disabled on this account');

  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const usedToday = await prisma.lockSession.count({
    where: {
      userId: params.userId,
      state: LockState.BYPASSED,
      escapeReason: 'skip_allowance',
      resolvedAt: { gte: midnight },
    },
  });
  if (usedToday >= allowance) throw ApiError.forbidden('No skips left today');

  const resolvedAt = new Date();
  await prisma.lockSession.update({
    where: { id: session.id },
    data: { state: LockState.BYPASSED, resolvedAt, escapeReason: 'skip_allowance' },
  });

  await recordUnlock({
    userId: params.userId,
    lockSessionId: session.id,
    problemId: session.problemId,
    outcome: UnlockOutcome.SKIPPED,
    secondsLocked: secondsLocked(session.lockedAt, resolvedAt),
    reason: 'skip_allowance',
  });

  // A skip is part of the history too. Hiding the nights you walked away makes
  // the log a highlight reel, which is the one thing it must not be.
  void recordStep(params.userId, {
    kind: 'LOCK_BYPASSED',
    detail: { skipsRemaining: allowance - usedToday - 1 },
  });

  return { skipsRemaining: allowance - usedToday - 1 };
}

export async function getActiveSession(userId: string): Promise<LockSessionView | null> {
  // One query, not three. This is the most-polled endpoint in the product — the
  // lock screen hits it every 5 seconds and the dashboard every 15 — and the
  // previous shape was session, then problem, then sample test cases in series.
  const session = await prisma.lockSession.findFirst({
    where: { userId, state: { in: [LockState.ARMED, LockState.LOCKED] } },
    orderBy: { armedAt: 'desc' },
    include: {
      problem: {
        include: {
          testCases: {
            where: { isSample: true },
            orderBy: { ordinal: 'asc' },
            select: { ordinal: true, stdin: true, expectedStdout: true },
          },
        },
      },
    },
  });
  if (!session) return null;

  return {
    ...(await toView(session, null)),
    problem: session.problem
      ? {
          id: session.problem.id,
          slug: session.problem.slug,
          title: session.problem.title,
          difficulty: session.problem.difficulty,
          promptMarkdown: session.problem.promptMarkdown,
          starterCode: session.problem.starterCode as Record<string, string>,
          sampleCases: session.problem.testCases,
          avgSolveSeconds: session.problem.avgSolveSeconds,
        }
      : null,
  };
}

/**
 * Move one due session ARMED -> LOCKED, exactly once.
 *
 * The problem is picked before the claim so both land in a single conditional
 * write: a session is never briefly LOCKED with no problem attached, and two
 * racers cannot each assign one. The loser's pick is simply discarded — it has
 * had no effect on anything, since attemptCount is only incremented by the
 * winner below.
 *
 * The `where` repeats every precondition rather than trusting the caller's
 * earlier read. That read is what makes this a race in the first place.
 */
async function claimDueSession(
  sessionId: string,
  userId: string,
  difficulty: Difficulty,
): Promise<{ session: LockSession; problem: Problem } | null> {
  // Difficulty says how hard; the progression gate says what this user is ready
  // for. Both narrow the pool, and they are not the same question — a fast
  // beginner is HARD at Tier 0 and still has no business being shown DP.
  const snapshot = await loadProgressSnapshot(userId);
  const tiers = availableTiers(snapshot);
  const families = availableFamiliesForTiers(snapshot, tiers);
  const problem = await pickProblem(userId, difficulty, tiers, families);
  const lockedAt = new Date();

  const claimed = await prisma.lockSession.updateMany({
    where: {
      id: sessionId,
      state: LockState.ARMED,
      pausedAt: null,
      fireAt: { lte: lockedAt },
    },
    data: { state: LockState.LOCKED, lockedAt, problemId: problem.id },
  });
  if (claimed.count !== 1) return null;

  await prisma.problem.update({
    where: { id: problem.id },
    data: { attemptCount: { increment: 1 } },
  });

  const session = await prisma.lockSession.findUniqueOrThrow({ where: { id: sessionId } });

  // Two steps, not one: the lock landing and the problem it landed on are
  // different facts, and reading the history later you want to see a lock that
  // engaged even on a night that never produced an attempt.
  void recordStep(userId, { kind: 'LOCK_ENGAGED', detail: { difficulty } });
  void recordStep(userId, { kind: 'PROBLEM_SERVED', problem });

  return { session, problem };
}

/**
 * Engage every timer whose deadline has passed.
 *
 * Until this existed the transition depended entirely on a client noticing and
 * asking. That is fine while the app is open and wrong the rest of the time: a
 * timer that expired with the desktop app closed stayed ARMED, so when the app
 * came back it covered the screen over a session the API did not consider
 * locked — and a submission against an ARMED session is refused, which left no
 * way to earn the unlock. The deadline is the server's fact, so the server
 * keeps it.
 *
 * Paused timers are skipped: their fireAt is frozen and sails past "now" while
 * the user is away from the desk, and engaging one would lock someone out on a
 * timer they had explicitly stopped.
 */
export async function engageDueSessions(): Promise<number> {
  const due = await prisma.lockSession.findMany({
    where: { state: LockState.ARMED, pausedAt: null, fireAt: { lte: new Date() } },
    select: { id: true, userId: true, difficulty: true },
  });

  let engaged = 0;
  for (const session of due) {
    // One failure must not strand the rest: a user whose problem pool is empty
    // should not keep everyone else's timer from firing.
    try {
      if (await claimDueSession(session.id, session.userId, session.difficulty)) engaged++;
    } catch {
      // Reported by the caller's logger via the count mismatch; nothing here
      // can usefully recover, and the next sweep tries again.
    }
  }
  return engaged;
}

/** Background sweep: close out sessions nobody ever resolved. */
export async function reapStaleSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - SESSION_MAX_AGE_HOURS * 3_600_000);

  // Read before updating: updateMany returns a count, not rows, and the audit
  // needs to name each session it closed. A sweep that says "4" and nothing
  // else is exactly the log entry that is useless at 3am.
  const stale = await prisma.lockSession.findMany({
    where: { state: { in: [LockState.ARMED, LockState.LOCKED] }, armedAt: { lt: cutoff } },
    select: { id: true, userId: true, problemId: true, lockedAt: true },
  });
  if (stale.length === 0) return 0;

  const resolvedAt = new Date();
  const { count } = await prisma.lockSession.updateMany({
    where: { id: { in: stale.map((s) => s.id) } },
    data: { state: LockState.ABANDONED, resolvedAt },
  });

  for (const session of stale) {
    await recordUnlock({
      userId: session.userId,
      lockSessionId: session.id,
      problemId: session.problemId,
      outcome: UnlockOutcome.REAPED,
      secondsLocked: secondsLocked(session.lockedAt, resolvedAt),
      reason: 'stale_sweep',
    });
  }

  return count;
}

// --- helpers ---------------------------------------------------------------

export async function requireOwnedSession(
  userId: string,
  sessionId: string,
): Promise<LockSession> {
  const session = await prisma.lockSession.findUnique({ where: { id: sessionId } });
  // Same response for "missing" and "someone else's" so ids cannot be probed.
  if (!session || session.userId !== userId) throw ApiError.notFound('Lock session not found');
  return session;
}

async function loadProblem(problemId: string | null): Promise<Problem | null> {
  if (!problemId) return null;
  return prisma.problem.findUnique({ where: { id: problemId } });
}

export async function toPublicProblem(problem: Problem): Promise<PublicProblem> {
  const samples = await prisma.testCase.findMany({
    where: { problemId: problem.id, isSample: true },
    orderBy: { ordinal: 'asc' },
    select: { ordinal: true, stdin: true, expectedStdout: true },
  });
  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    promptMarkdown: problem.promptMarkdown,
    starterCode: problem.starterCode as PublicProblem['starterCode'],
    sampleCases: samples,
    avgSolveSeconds: problem.avgSolveSeconds,
  };
}

/**
 * States in which the answer may be shown.
 *
 * BYPASSED and ABANDONED are here on purpose. The temptation is to reward only
 * a solve, but a user who failed is the user who most needs the explanation —
 * withholding it turns a hard evening into a wasted one, and this audience does
 * not have many evenings to waste. The lock is over either way; there is
 * nothing left to protect.
 */
const RESOLVED_STATES: readonly LockState[] = [
  LockState.UNLOCKED,
  LockState.BYPASSED,
  LockState.ABANDONED,
];

export interface Debrief {
  patternFamily: string;
  patternTags: string[];
  editorialMarkdown: string | null;
  editorialUrl: string | null;
  referenceSolution: Record<string, string>;
  outcome: LockState;
}

/**
 * What to show once the lock is over: the pattern, the editorial, the solution.
 *
 * This is the product's purpose for this audience. Everything else — the timer,
 * the overlay, the judge — is machinery in service of the moment the screen
 * comes back and the user finds out what the problem *was*.
 *
 * Refuses while the session is still live. That refusal is the whole security
 * property: `toPublicProblem` never carries these fields, so this function is
 * the only path to them, and it checks state before it reads.
 */
export async function getDebrief(userId: string, sessionId: string): Promise<Debrief> {
  const session = await requireOwnedSession(userId, sessionId);

  if (!RESOLVED_STATES.includes(session.state)) {
    // Deliberately not a 404: the session exists and is theirs. Telling them
    // "not yet" is honest and leaks nothing a countdown would not.
    throw ApiError.conflict('The debrief is available once the lock is resolved');
  }

  const problem = await loadProblem(session.problemId);
  if (!problem) throw ApiError.notFound('No problem was assigned to this session');

  // Opening the debrief is the moment the pattern gets named, so it belongs in
  // the history: a solve you never read back is a different event from one you
  // did, and later the difference is the only way to tell luck from learning.
  void recordStep(userId, { kind: 'DEBRIEF_OPENED', problem });

  return {
    patternFamily: problem.patternFamily,
    patternTags: problem.patternTags,
    editorialMarkdown: problem.editorialMarkdown,
    editorialUrl: problem.editorialUrl,
    referenceSolution: (problem.referenceSolution ?? {}) as Record<string, string>,
    outcome: session.state,
  };
}

async function toView(session: LockSession, problem: Problem | null): Promise<LockSessionView> {
  const now = Date.now();
  // A paused countdown does not advance. Measuring from `pausedAt` rather than
  // from now is what freezes the figure without having to write to the row on
  // every poll.
  const reference = session.pausedAt ? session.pausedAt.getTime() : now;
  return {
    id: session.id,
    state: session.state,
    difficulty: session.difficulty,
    fireAt: session.fireAt.toISOString(),
    serverNow: new Date(now).toISOString(),
    pausedAt: session.pausedAt?.toISOString() ?? null,
    secondsRemaining: Math.max(0, Math.round((session.fireAt.getTime() - reference) / 1000)),
    attempts: session.attempts,
    problem: problem ? await toPublicProblem(problem) : null,
  };
}
