import { Router } from 'express';
import { LockState, UnlockOutcome } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import { withLocalUser, currentUser } from '../middleware/localUser.js';
import { lockActionLimiter } from '../middleware/rateLimit.js';
import {
  abandonSchema,
  shortenSchema,
  armSessionSchema,
  hintRequestSchema,
  idParamSchema,
} from '../validation/schemas.js';
import {
  armSession,
  bypassLock,
  claimResolution,
  engageLock,
  getActiveSession,
  requireOwnedSession,
  getDebrief,
} from '../services/lockSessions.js';
import { recordFailure } from '../services/grading.js';
import { HINT_COUNT, hintAt } from '../services/hints.js';
import { recordUnlock, secondsLocked } from '../services/audit.js';
import { recordStep } from '../services/learningLog.js';

export const lockRouter = Router();
lockRouter.use(withLocalUser);

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

/**
 * GET /lock/:id/debrief — the pattern, the editorial, and a worked solution.
 *
 * Available only once the session has resolved, however it resolved. A user who
 * bypassed or gave up gets the same debrief as one who solved it: they need it
 * most, and the lock is over either way.
 *
 * The gate lives in `getDebrief`, not here, because this is the *only* route
 * that serves these fields — `toPublicProblem` does not carry them at all.
 */
lockRouter.get(
  '/:id/debrief',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = idParamSchema.parse(req.params);
    res.json({ debrief: await getDebrief(user.id, id) });
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

    const won = await claimResolution(session.id, [LockState.ARMED], {
      state: LockState.ABANDONED,
      resolvedAt: new Date(),
    });
    if (!won) throw ApiError.conflict('That session has already been resolved');

    res.json({ session: { id: session.id, state: LockState.ABANDONED } });
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

    // Conditional on still being unpaused, so two clicks cannot each stamp a
    // pausedAt — the second would move the mark forward and shorten the credit
    // the user gets back on resume.
    await prisma.lockSession.updateMany({
      where: { id: session.id, state: LockState.ARMED, pausedAt: null },
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
    // Guarded on `pausedAt` still being set, and that is not a nicety: resume
    // pushes the deadline forward by the paused interval, so two resumes that
    // both read the same `pausedAt` would push it forward twice. Double-clicking
    // Resume would have been free time — a race that weakens the lock rather
    // than merely duplicating a row.
    // Match the exact pausedAt this request read, not merely "some pause".
    //
    // `pausedAt IS NOT NULL` is an ABA guard: the value can change away and back
    // between the read and the write. Two resumes both read pause A; the first
    // resumes, someone pauses again as pause B, and the second still matches —
    // clearing pause B while crediting pause A's interval, which both restarts a
    // timer the user meant to hold and moves the deadline by the wrong amount.
    // Matching the timestamp makes the write apply to the pause it was computed
    // from, or to nothing.
    await prisma.lockSession.updateMany({
      where: { id: session.id, state: LockState.ARMED, pausedAt: session.pausedAt },
      data: { fireAt: new Date(session.fireAt.getTime() + pausedMs), pausedAt: null },
    });
    res.json({ session: await getActiveSession(user.id) });
  }),
);

/**
 * POST /lock/:id/shorten — bring the lock forward.
 *
 * ARMED only, like pause and cancel, but for the opposite reason to the others:
 * this one is refused on a LOCKED session because there is nothing left to
 * shorten, not because allowing it would be a bypass. Shortening only ever
 * moves the deadline *towards* now, so the worst a caller can do with it is
 * lock themselves sooner than they meant to.
 *
 * Clamped at the current moment rather than rejected when it overshoots: asking
 * to take twenty minutes off a five-minute countdown means "lock me now", and
 * answering that with a 400 would be pedantry. The session goes due and the
 * ordinary engage path picks it up — this endpoint never assigns a problem
 * itself, because a problem chosen anywhere but at fire time is a problem a
 * client could have prefetched.
 */
lockRouter.post(
  '/:id/shorten',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = idParamSchema.parse(req.params);
    const { minutes } = shortenSchema.parse(req.body ?? {});
    const session = await requireArmed(user.id, id, 'shortened');

    // While paused `fireAt` is a stale deadline that resume will move forward
    // by however long the pause lasted, so subtracting from it here would be
    // arithmetic against a number that is about to change. Refused with the
    // move that makes it work rather than silently doing the wrong sum.
    if (session.pausedAt) {
      throw ApiError.conflict('Resume the timer before shortening it.');
    }

    const next = new Date(Math.max(Date.now(), session.fireAt.getTime() - minutes * 60_000));

    // Matched on the exact `fireAt` this request read, the same guard resume
    // uses. Two clicks that both read the same deadline would otherwise each
    // subtract from it, taking off twice what the user asked for. Stricter than
    // intended is still not what they asked for.
    await prisma.lockSession.updateMany({
      where: {
        id: session.id,
        state: LockState.ARMED,
        pausedAt: null,
        fireAt: session.fireAt,
      },
      data: { fireAt: next },
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
 * POST /lock/:id/hint — one nudge, while the lock is still up.
 *
 * Deliberately *not* gated behind the solve, unlike the editorial. Someone
 * stuck with no way forward has two moves otherwise — abandon the session, or
 * stare at it — and neither one teaches anything. A hint that names the idea
 * without writing the code is what keeps them working.
 *
 * Free, and never counted against difficulty: charging for help is how a
 * learning tool teaches people not to ask for it. It is written to the log
 * though, because which problems needed help is the most useful thing that log
 * can tell its owner later.
 */
lockRouter.post(
  '/:id/hint',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = idParamSchema.parse(req.params);
    const { index } = hintRequestSchema.parse(req.body ?? {});

    const session = await requireOwnedSession(user.id, id);
    // Only a live lock. Before the lock there is no problem to hint at, and
    // after it the debrief has the editorial and the worked solution.
    if (session.state !== LockState.LOCKED || !session.problemId) {
      throw ApiError.conflict('Hints are available while a lock is live');
    }

    const problem = await prisma.problem.findUnique({ where: { id: session.problemId } });
    if (!problem) throw ApiError.notFound('No problem was assigned to this session');

    const text = hintAt(problem, index);
    if (text === null) throw ApiError.badRequest('No hint at that index');

    void recordStep(user.id, {
      kind: 'HINT_REVEALED',
      problem,
      sessionId: session.id,
      detail: { index, attempts: session.attempts },
    });

    res.json({ index, total: HINT_COUNT, text });
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
    // Guarded on the states that can still be given up on, and atomic.
    //
    // This route used to check ownership and nothing else, then write
    // unconditionally. Abandoning an already-UNLOCKED session therefore
    // overwrote a solve with ABANDONED, wrote an audit row contradicting the
    // one already there, and called recordFailure — so calling it repeatedly
    // after solving was a way to walk the difficulty ladder *down* on a
    // problem that had actually been solved. Everything below the guard now
    // happens only for the caller that genuinely ended the session.
    // LOCKED first, then ARMED, rather than one guard accepting both.
    //
    // The difference is which state the *database* transitioned from, and that
    // is the fact the ladder decision below depends on. Reading `session.state`
    // and then writing under a guard that accepts either state reintroduces
    // exactly the read-then-decide gap this change exists to close: the sweep
    // can engage the timer in between, so a session read as ARMED is written as
    // LOCKED and the failure goes unrecorded. Two narrow attempts make the
    // state that decides the same state that moved.
    // Try LOCKED, then ARMED, and retry the pair once.
    //
    // Two narrow guards rather than one broad one, because the ladder decision
    // below depends on which state the *database* moved from, not on a state
    // read earlier. But two guards leave their own gap: a session that is ARMED
    // when the first attempt runs can be engaged by the sweep before the second
    // runs, so both miss and a live session is wrongly reported as resolved —
    // dropping a genuine give-up. One retry closes that, because ARMED to
    // LOCKED happens at most once per session; there is no path back.
    let wasLocked = false;
    let resolvedHere = false;
    for (let attempt = 0; attempt < 2 && !resolvedHere; attempt++) {
      wasLocked = await claimResolution(session.id, [LockState.LOCKED], {
        state: LockState.ABANDONED,
        resolvedAt,
      });
      resolvedHere =
        wasLocked ||
        (await claimResolution(session.id, [LockState.ARMED], {
          state: LockState.ABANDONED,
          resolvedAt,
        }));
    }
    if (!resolvedHere) {
      throw ApiError.conflict('That session has already been resolved');
    }

    // Re-read the fields the sweep can fill in. If it engaged this session
    // after the read above, the in-memory copy still has null for both, and
    // the audit row would claim a lock held for no time over no problem.
    const resolved = await prisma.lockSession.findUnique({
      where: { id: session.id },
      select: { lockedAt: true, problemId: true },
    });
    const problemId = resolved?.problemId ?? session.problemId;

    // Giving up is the one path that ends a lock with no passing submission,
    // which makes it the row an audit exists to capture.
    await recordUnlock({
      userId: user.id,
      lockSessionId: session.id,
      problemId,
      outcome: UnlockOutcome.ABANDONED,
      secondsLocked: secondsLocked(resolved?.lockedAt ?? session.lockedAt, resolvedAt),
      reason: body.reason === 'kill_switch' ? 'kill_switch' : 'user_gave_up',
    });

    // Only a lock that actually landed can be failed. Giving up on a countdown
    // that never engaged assigned no problem, so there is nothing to have
    // failed at — the same reasoning /cancel already applies.
    const progress = wasLocked
      ? await recordFailure(user.id, problem?.avgSolveSeconds ?? 600)
      : null;
    res.json({ progress });
  }),
);
