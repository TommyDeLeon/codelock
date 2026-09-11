import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import { withLocalUser, currentUser } from '../middleware/localUser.js';
import { idParamSchema } from '../validation/schemas.js';
import { pickProblem } from '../services/problemSelector.js';
import {
  availableFamiliesForTiers,
  availableTiers,
  loadProgressSnapshot,
} from '../services/progression.js';
import { toPublicProblem } from '../services/lockSessions.js';

export const problemsRouter = Router();
problemsRouter.use(withLocalUser);

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
    const snapshot = await loadProgressSnapshot(user.id);
    const tiers = availableTiers(snapshot);
    const families = availableFamiliesForTiers(snapshot, tiers);
    const selection = await pickProblem(user.id, progress.currentDifficulty, tiers, families);
    res.json({
      problem: await toPublicProblem(selection.problem),
      difficulty: progress.currentDifficulty,
      // Reported, not hidden. Practice is where an out-of-depth problem is
      // cheapest to admit to, and a learner who can see *why* something looks
      // unfamiliar is in a different position from one who just feels stupid.
      skillEligible: selection.skillEligible,
      skillNote: selection.skillNote,
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
