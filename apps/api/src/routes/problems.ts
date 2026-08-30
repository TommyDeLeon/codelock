import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, currentUser } from '../middleware/auth.js';
import { idParamSchema } from '../validation/schemas.js';
import { pickProblem } from '../services/problemSelector.js';
import { availableTiers, loadProgressSnapshot } from '../services/progression.js';
import { toPublicProblem } from '../services/lockSessions.js';

export const problemsRouter = Router();
problemsRouter.use(requireAuth);

/**
 * GET /problems/next — the adaptive pick for this user, at their current tier.
 *
 * Practice endpoint. It does NOT create a lock session, and solving whatever it
 * returns cannot unlock anything: unlock requires the problem the server bound
 * to a LOCKED session.
 */
problemsRouter.get(
  '/next',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const progress = await prisma.userProgress.findUnique({ where: { userId: user.id } });
    if (!progress) throw ApiError.notFound('User progress missing');

    // Gated the same way a real lock is. Practice that ignores the curriculum
    // would hand a first-week user a "build an LRU cache" problem — the same
    // discouragement the lock path is careful to avoid — and would let them
    // meet a pattern here before the tier that teaches it.
    const tiers = availableTiers(await loadProgressSnapshot(user.id));
    const problem = await pickProblem(user.id, progress.currentDifficulty, tiers);
    res.json({
      problem: await toPublicProblem(problem),
      difficulty: progress.currentDifficulty,
    });
  }),
);

/** GET /problems/:id — full statement. Hidden test cases are never included. */
problemsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem || !problem.isActive) throw ApiError.notFound('Problem not found');
    res.json({ problem: await toPublicProblem(problem) });
  }),
);
