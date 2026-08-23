import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ApiError } from './lib/errors.js';
import pinoHttp from 'pino-http';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/error.js';
import { requestIdFor, tagResponse } from './lib/observability.js';
import { generalLimiter, healthLimiter } from './middleware/rateLimit.js';
import { authRouter } from './routes/auth.js';
import { oauthRouter } from './routes/oauth.js';
import { lockRouter } from './routes/lock.js';
import { problemsRouter } from './routes/problems.js';
import { submissionsRouter } from './routes/submissions.js';
import { settingsRouter } from './routes/settings.js';
import { statsRouter } from './routes/stats.js';
import { integrationsRouter } from './routes/integrations.js';
import { demoRouter } from './routes/demo.js';

/**
 * The origin the Electron shell's bundled renderer is served from.
 * Must match APP_ORIGIN in apps/desktop/src/main.ts.
 */
const DESKTOP_ORIGIN = 'app://codelock';

export function createApp(): Express {
  const app = express();

  // Render/Fly/Vercel put a proxy in front; without this, rate limiting keys on
  // the proxy IP and throttles every user as one.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Expo sends no Origin header at all.
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);

        // The desktop shell's bundled renderer. It is served from a custom
        // standard scheme rather than file:// precisely so that it has a real
        // origin, and this is that origin. No browser can navigate to it, so it
        // cannot be used to mount a cross-site request from a web page;
        // impersonating it requires already running code on the machine.
        if (origin === DESKTOP_ORIGIN) return cb(null, true);

        // A bare Error here surfaces through the error handler as a 500
        // INTERNAL_ERROR, which reads as "the server is broken" when the truth
        // is "your origin is not on the list".
        cb(ApiError.forbidden('Origin not allowed'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '256kb' }));
  // Every log line carries a request id, and the client gets it back in a
  // header. When someone says "it failed at 3pm" that id is the difference
  // between finding the request and grepping an hour of traffic.
  app.use(
    pinoHttp({
      logger,
      genReqId(req, res) {
        const id = requestIdFor(req as never);
        tagResponse(res as never, id);
        return id;
      },
      // The default logs every 2xx at info, which buries the interesting lines
      // under a lock screen polling every five seconds.
      customLogLevel(_req, res, err) {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'debug';
      },
    }),
  );

  // Liveness: the process is up. Says nothing about whether it can serve.
  app.get('/healthz', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

  /**
   * Health with a dependency check, for clients rather than load balancers.
   *
   * The web and desktop clients poll this to tell 'the server is down' apart
   * from 'you have no session'. It is deliberately unauthenticated and cheap:
   * a client that cannot authenticate still needs to know why.
   */
  app.get('/v1/health', healthLimiter, async (_req, res) => {
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
  // Mounted before nothing in particular, but kept separate from authRouter:
  // provider sign-in has its own failure modes and its own rate limiting.
  app.use('/v1/auth/oauth', oauthRouter);
  app.use('/v1/lock', lockRouter);
  app.use('/v1/problems', problemsRouter);
  app.use('/v1/submissions', submissionsRouter);
  app.use('/v1/settings', settingsRouter);
  app.use('/v1/stats', statsRouter);
  app.use('/v1/integrations', integrationsRouter);
  // Unauthenticated on purpose, and the only such route that runs code. Its own
  // limits live in the router; see the note there for why that is safe.
  app.use('/v1/demo', demoRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
