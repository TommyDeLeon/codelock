import { Router } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { withLocalUser, currentUser } from '../middleware/localUser.js';
import { runLimiter } from '../middleware/rateLimit.js';
import { runSchema } from '../validation/schemas.js';
import { runCode } from '../services/run.js';
import { acquireGradeSlot } from '../services/gradeQueue.js';

export const runRouter = Router();
runRouter.use(withLocalUser);

/**
 * POST /run — execute code against the samples, or against your own input.
 *
 * Separate from POST /submissions on purpose. Everything a submission does to
 * a session — the attempt counter, the difficulty ladder, the unlock — is
 * absent here, and keeping the two apart is what makes that structural rather
 * than a matter of remembering a flag.
 *
 * It shares the grade queue, though, because it shares the cost: a run is a
 * container holding a CPU core, and admission control does not care what the
 * caller meant by it.
 */
runRouter.post(
  '/',
  runLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = runSchema.parse(req.body);

    const release = await acquireGradeSlot(user.id);
    try {
      res.json(
        await runCode({
          userId: user.id,
          problemId: body.problemId,
          lockSessionId: body.lockSessionId ?? null,
          language: body.language,
          sourceCode: body.sourceCode,
          stdin: body.stdin ?? null,
        }),
      );
    } finally {
      release();
    }
  }),
);
