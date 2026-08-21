import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, currentUser } from '../middleware/auth.js';
import { submitLimiter } from '../middleware/rateLimit.js';
import { listQuerySchema, submitSchema, idParamSchema } from '../validation/schemas.js';
import { gradeSubmission } from '../services/grading.js';

export const submissionsRouter = Router();
submissionsRouter.use(requireAuth);

/**
 * POST /submissions — run code against every test case.
 *
 * Synchronous: the caller is looking at a lock screen and wants a verdict now.
 * Judge0 batch + polling is bounded by JUDGE0_TIMEOUT_MS, so the request cannot
 * hang indefinitely. If grading ever outgrows this, move it behind a queue and
 * have the client poll GET /submissions/:id.
 */
submissionsRouter.post(
  '/',
  submitLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = submitSchema.parse(req.body);

    const result = await gradeSubmission({
      userId: user.id,
      problemId: body.problemId,
      lockSessionId: body.lockSessionId ?? null,
      language: body.language,
      sourceCode: body.sourceCode,
    });

    res.status(201).json(result);
  }),
);

/** GET /submissions — this user's history, newest first, cursor-paginated. */
submissionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { limit, cursor } = listQuerySchema.parse(req.query);

    const rows = await prisma.submission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        status: true,
        language: true,
        passedCount: true,
        totalCount: true,
        runtimeMs: true,
        elapsedSeconds: true,
        createdAt: true,
        problem: { select: { id: true, slug: true, title: true, difficulty: true } },
      },
    });

    const hasMore = rows.length > limit;
    res.json({
      submissions: hasMore ? rows.slice(0, limit) : rows,
      nextCursor: hasMore ? rows[limit - 1]?.id ?? null : null,
    });
  }),
);

/** GET /submissions/:id — one submission, including the source the user sent. */
submissionsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = idParamSchema.parse(req.params);
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { problem: { select: { id: true, slug: true, title: true, difficulty: true } } },
    });
    if (!submission || submission.userId !== user.id) {
      throw ApiError.notFound('Submission not found');
    }
    res.json({ submission });
  }),
);
