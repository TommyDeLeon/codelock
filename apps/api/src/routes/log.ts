import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.js';
import { withLocalUser, currentUser } from '../middleware/localUser.js';
import { renderReviewPacket, reviewPacket, summary, timeline } from '../services/learningLog.js';

/**
 * The learner's own history, read back.
 *
 * Nothing here leaves the machine on its own. These routes exist so the app can
 * show you what you have actually done, and so you can export it if you want to.
 */
export const logRouter = Router();
logRouter.use(withLocalUser);

const KINDS = [
  'TIMER_ARMED',
  'LOCK_ENGAGED',
  'PROBLEM_SERVED',
  'ATTEMPT_FAILED',
  'ATTEMPT_PASSED',
  'DEBRIEF_OPENED',
  'LOCK_BYPASSED',
  'DIFFICULTY_CHANGED',
] as const;

const timelineQuery = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  before: z.coerce.date().optional(),
  // ?kind=ATTEMPT_PASSED&kind=ATTEMPT_FAILED, or a single value.
  kind: z
    .union([z.enum(KINDS), z.array(z.enum(KINDS))])
    .optional()
    .transform((v) => (v === undefined ? undefined : Array.isArray(v) ? v : [v])),
});

/** GET /log — most recent steps first. */
logRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, before, kind } = timelineQuery.parse(req.query);
    const user = currentUser(req);
    res.json({
      events: await timeline(user.id, { limit, before, kinds: kind }),
    });
  }),
);

const summaryQuery = z.object({ sinceDays: z.coerce.number().int().min(1).max(3650).optional() });

/** GET /log/summary — counts worth reading, over an optional window. */
logRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const { sinceDays } = summaryQuery.parse(req.query);
    const since = sinceDays ? new Date(Date.now() - sinceDays * 86_400_000) : undefined;
    const user = currentUser(req);
    res.json({ sinceDays: sinceDays ?? null, summary: await summary(user.id, since) });
  }),
);

const slugParam = z.object({ slug: z.string().min(1).max(120) });

/**
 * GET /log/review/:slug — everything about one problem, for reflection.
 *
 * `?format=markdown` returns the same thing as prose with a prompt attached,
 * ready to paste into a model. JSON is the default so the app can render it.
 */
logRouter.get(
  '/review/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = slugParam.parse(req.params);
    const user = currentUser(req);
    const packet = await reviewPacket(user.id, slug);
    if (!packet) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'No history for that problem yet' },
      });
      return;
    }
    if (req.query.format === 'markdown') {
      res.type('text/markdown').send(renderReviewPacket(packet));
      return;
    }
    res.json({ review: packet });
  }),
);
