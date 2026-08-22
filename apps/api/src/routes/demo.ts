import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.js';
import { demoPublicView, gradeDemo } from '../services/demo.js';
import { acquireGradeSlot } from '../services/gradeQueue.js';

export const demoRouter = Router();

/**
 * The public demo.
 *
 * This is the only unauthenticated path in the product that executes code, so
 * it is worth being explicit about what stops it becoming free compute for the
 * internet:
 *
 *   - A hard rate limit per IP, far tighter than the authenticated one.
 *   - A fixed problem. No parameter names what to run against, so it cannot be
 *     aimed at anything else.
 *   - The same admission control as real grading, keyed by IP, so a burst of
 *     demo traffic queues behind the same global ceiling instead of competing
 *     for the host with someone actually locked out of their machine.
 *   - The sandbox itself: no network, dropped capabilities, read-only root,
 *     uid 65534, capped memory and pids. See apps/judge/README.md.
 *
 * And what it cannot do, which is the part that matters: there is no session
 * here, no user, and `DemoGradeResult` has no field an unlock token could go
 * in. Minting one would mean changing the shared contract, the service and this
 * route together — not a slip.
 */

/**
 * Five submissions a minute. Generous for a person reading a problem and
 * writing an answer; useless as an execution service.
 */
const demoLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'The demo allows five runs a minute. Install CodeLock for the real thing.',
    },
  },
});

/** Reading the problem is cheap, but should not be a free proxy for load either. */
const demoReadLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const demoSubmitSchema = z.object({
  language: z.enum(['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CPP', 'GO']),
  // Smaller than the authenticated limit. A demo answer to one small problem
  // has no legitimate reason to be 64KB of source.
  sourceCode: z.string().min(1).max(20_000),
});

demoRouter.get(
  '/problem',
  demoReadLimiter,
  asyncHandler(async (_req, res) => {
    res.json({ problem: demoPublicView() });
  }),
);

demoRouter.post(
  '/grade',
  demoLimiter,
  asyncHandler(async (req, res) => {
    const body = demoSubmitSchema.parse(req.body);

    // Keyed by IP because there is no user. The prefix keeps demo traffic from
    // colliding with a signed-in user's per-user slot.
    const release = await acquireGradeSlot(`demo:${req.ip ?? 'unknown'}`);
    try {
      const result = await gradeDemo({
        language: body.language,
        sourceCode: body.sourceCode,
      });
      res.json(result);
    } finally {
      release();
    }
  }),
);
