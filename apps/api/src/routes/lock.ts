import { Router } from 'express';
import { LockState } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, currentUser } from '../middleware/auth.js';
import { armSessionSchema, idParamSchema } from '../validation/schemas.js';
import {
  armSession,
  bypassLock,
  engageLock,
  getActiveSession,
  requireOwnedSession,
} from '../services/lockSessions.js';
import { recordFailure } from '../services/grading.js';

export const lockRouter = Router();
lockRouter.use(requireAuth);

/** POST /lock/arm — start (or resume) the countdown for a device. */
lockRouter.post(
  '/arm',
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
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = idParamSchema.parse(req.params);
    res.json(await engageLock({ userId: user.id, sessionId: id }));
  }),
);

/** POST /lock/:id/skip — spend a daily skip allowance, if configured. */
lockRouter.post(
  '/:id/skip',
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
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = idParamSchema.parse(req.params);
    const session = await requireOwnedSession(user.id, id);

    const problem = session.problemId
      ? await prisma.problem.findUnique({ where: { id: session.problemId } })
      : null;

    await prisma.lockSession.update({
      where: { id: session.id },
      data: { state: LockState.ABANDONED, resolvedAt: new Date() },
    });
    const progress = await recordFailure(user.id, problem?.avgSolveSeconds ?? 600);
    res.json({ progress });
  }),
);
