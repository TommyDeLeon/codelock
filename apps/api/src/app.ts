import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/error.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { authRouter } from './routes/auth.js';
import { lockRouter } from './routes/lock.js';
import { problemsRouter } from './routes/problems.js';
import { submissionsRouter } from './routes/submissions.js';
import { settingsRouter } from './routes/settings.js';
import { statsRouter } from './routes/stats.js';
import { integrationsRouter } from './routes/integrations.js';

export function createApp(): Express {
  const app = express();

  // Render/Fly/Vercel put a proxy in front; without this, rate limiting keys on
  // the proxy IP and throttles every user as one.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Native clients (Electron/Expo) send no Origin header at all.
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        cb(new Error('Origin not allowed'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '256kb' }));
  app.use(pinoHttp({ logger }));

  // Liveness: the process is up. Says nothing about whether it can serve.
  app.get('/healthz', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

  /**
   * Health with a dependency check, for clients rather than load balancers.
   *
   * The web and desktop clients poll this to tell 'the server is down' apart
   * from 'you have no session'. It is deliberately unauthenticated and cheap:
   * a client that cannot authenticate still needs to know why.
   */
  app.get('/v1/health', async (_req, res) => {
    const startedAt = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, database: 'up', latencyMs: Date.now() - startedAt });
    } catch {
      res.status(503).json({
        ok: false,
        database: 'down',
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'CodeLock cannot reach its database right now.',
        },
      });
    }
  });

  // Readiness proves the DB is actually reachable, so a rolling deploy does not
  // send traffic to an instance that cannot serve a single request.
  app.get(
    '/readyz',
    asyncHandler(async (_req, res) => {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true });
    }),
  );

  app.use('/v1', generalLimiter);
  app.use('/v1/auth', authRouter);
  app.use('/v1/lock', lockRouter);
  app.use('/v1/problems', problemsRouter);
  app.use('/v1/submissions', submissionsRouter);
  app.use('/v1/settings', settingsRouter);
  app.use('/v1/stats', statsRouter);
  app.use('/v1/integrations', integrationsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
