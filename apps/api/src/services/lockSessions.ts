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
import { signUnlockToken, sha256 } from '../lib/tokens.js';
import { pickProblem } from './problemSelector.js';
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

  const problem = await pickProblem(params.userId, session.difficulty);
  const locked = await prisma.lockSession.update({
    where: { id: session.id },
    data: { state: LockState.LOCKED, lockedAt: new Date(), problemId: problem.id },
  });
  await prisma.problem.update({
    where: { id: problem.id },
    data: { attemptCount: { increment: 1 } },
  });

  return toView(locked, problem);
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

  return { unlockToken, expiresInSeconds: 300 };
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
          tags: session.problem.tags,
          starterCode: session.problem.starterCode as Record<string, string>,
          sampleCases: session.problem.testCases,
          avgSolveSeconds: session.problem.avgSolveSeconds,
        }
      : null,
  };
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
    tags: problem.tags,
    starterCode: problem.starterCode as PublicProblem['starterCode'],
    sampleCases: samples,
    avgSolveSeconds: problem.avgSolveSeconds,
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
