import { Router } from 'express';
import { LockState, UnlockOutcome } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, currentUser } from '../middleware/auth.js';
import { lockActionLimiter } from '../middleware/rateLimit.js';
import { abandonSchema, armSessionSchema, idParamSchema } from '../validation/schemas.js';
import {
  armSession,
  bypassLock,
  engageLock,
  getActiveSession,
  requireOwnedSession,
} from '../services/lockSessions.js';
import { recordFailure } from '../services/grading.js';
import { recordUnlock, secondsLocked } from '../services/audit.js';

export const lockRouter = Router();
lockRouter.use(requireAuth);

/** POST /lock/arm — start (or resume) the countdown for a device. */
lockRouter.post(
  '/arm',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = armSessionSchema.parse(req.body ?? {});
    const view = await armSession({
      userId: user.id,
      deviceId: body.deviceId ?? null,
      durationMinutesOverride: body.durationMinutes,
    });
    res.status(201).json(view);
  }),
);

/**
 * GET /lock/active — the client's heartbeat.
 *
 * Returns `serverNow` alongside `fireAt` so clients render the countdown from
 * server time. A device whose clock is rolled back gets no extra minutes.
 */
lockRouter.get(
  '/active',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    res.json({ session: await getActiveSession(user.id) });
  }),
);

/** POST /lock/:id/engage — timer expired; assign the problem and lock. */
lockRouter.post(
  '/:id/engage',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = idParamSchema.parse(req.params);
    res.json(await engageLock({ userId: user.id, sessionId: id }));
  }),
);

/**
 * POST /lock/:id/cancel — stop a countdown that has not fired yet.
 *
 * Only ever valid while ARMED. A LOCKED session is refused, and that refusal is
 * the whole security of this endpoint: if a live lock could be cancelled, the
 * product would ship with a one-click unlock and the speed gate would be
 * decorative. Giving up on a *locked* session is `/abandon`, which resolves it
 * as a failure and leaves the overlay up.
 *
 * Cancelling before the lock lands is not a failure and does not touch the
 * difficulty ladder — no problem was ever assigned, so there was nothing to
 * fail at. It is just stopping a timer.
 */
lockRouter.post(
  '/:id/cancel',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = idParamSchema.parse(req.params);
    const session = await requireArmed(user.id, id, 'cancelled');

    const cancelled = await prisma.lockSession.update({
      where: { id: session.id },
      data: { state: LockState.ABANDONED, resolvedAt: new Date() },
      select: { id: true, state: true },
    });

    res.json({ session: cancelled });
  }),
);

/**
 * POST /lock/:id/pause — hold the countdown where it is.
 *
 * ARMED only, like cancel, and for the same reason: pausing a LOCKED session
 * would be an unlock with extra steps. Pausing before the lock lands is not a
 * bypass — the session has no problem assigned and nothing has been taken away
 * yet, so this is the difference between a tool and a trap.
 */
lockRouter.post(
  '/:id/pause',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = idParamSchema.parse(req.params);
    const session = await requireArmed(user.id, id, 'paused');

    if (session.pausedAt) return res.json({ session: await getActiveSession(user.id) });

    await prisma.lockSession.update({
      where: { id: session.id },
      data: { pausedAt: new Date() },
    });
    res.json({ session: await getActiveSession(user.id) });
  }),
);

/**
 * POST /lock/:id/resume — start the clock again.
 *
 * `fireAt` moves forward by exactly the time spent paused, so the user gets
 * back the interval they had left and not a minute more.
 */
lockRouter.post(
  '/:id/resume',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = idParamSchema.parse(req.params);
    const session = await requireArmed(user.id, id, 'resumed');

    if (!session.pausedAt) return res.json({ session: await getActiveSession(user.id) });

    const pausedMs = Date.now() - session.pausedAt.getTime();
    await prisma.lockSession.update({
      where: { id: session.id },
      data: { fireAt: new Date(session.fireAt.getTime() + pausedMs), pausedAt: null },
    });
    res.json({ session: await getActiveSession(user.id) });
  }),
);

/**
 * Shared guard for the three controls that only make sense before the lock
 * lands. Keeping it in one place means a new control cannot accidentally ship
 * without the LOCKED check.
 */
async function requireArmed(userId: string, id: string, verb: string) {
  const session = await requireOwnedSession(userId, id);
  if (session.state !== LockState.ARMED) {
    throw ApiError.conflict(
      session.state === LockState.LOCKED
        ? `A locked session cannot be ${verb}. Solve it, or abandon it.`
        : 'That session has already been resolved.',
    );
  }
  return session;
}

/** POST /lock/:id/skip — spend a daily skip allowance, if configured. */
lockRouter.post(
  '/:id/skip',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = idParamSchema.parse(req.params);
    res.json(await bypassLock({ userId: user.id, sessionId: id }));
  }),
);

/**
 * POST /lock/:id/abandon — the user gave up.
 *
 * This is not an unlock: no token is issued, the overlay stays. It exists so a
 * genuine give-up is recorded as a failure (and can demote) rather than being
 * silently reaped hours later.
 */
lockRouter.post(
  '/:id/abandon',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = idParamSchema.parse(req.params);
    const body = abandonSchema.parse(req.body ?? {});
    const session = await requireOwnedSession(user.id, id);

    const problem = session.problemId
      ? await prisma.problem.findUnique({ where: { id: session.problemId } })
      : null;

    const resolvedAt = new Date();
    await prisma.lockSession.update({
      where: { id: session.id },
      data: { state: LockState.ABANDONED, resolvedAt },
    });

    // Giving up is the one path that ends a lock with no passing submission,
    // which makes it the row an audit exists to capture.
    await recordUnlock({
      userId: user.id,
      lockSessionId: session.id,
      problemId: session.problemId,
      outcome: UnlockOutcome.ABANDONED,
      secondsLocked: secondsLocked(session.lockedAt, resolvedAt),
      reason: body.reason === 'kill_switch' ? 'kill_switch' : 'user_gave_up',
    });

    const progress = await recordFailure(user.id, problem?.avgSolveSeconds ?? 600);
    res.json({ progress });
  }),
);
