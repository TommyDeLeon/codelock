import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { env } from '../env.js';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No such route' } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Request failed validation',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({
      error: { code: 'CONFLICT', message: 'That value is already taken' },
    });
    return;
  }

  // A database outage is not the user's fault and is not permanent. Give it a
  // distinct status and a message worth reading, in every environment — the
  // generic 500 below would otherwise tell someone their request was broken
  // when the real answer is "come back in a minute". 503 also stops load
  // balancers and uptime checks from treating it as a healthy response.
  if (isDatabaseUnavailable(err)) {
    logger.error({ err }, 'database unavailable');
    res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message:
          'CodeLock cannot reach its database right now. Your progress is safe — try again in a moment.',
      },
    });
    return;
  }

  logger.error({ err }, 'unhandled error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isProd ? 'Something went wrong' : String(err),
    },
  });
}

/**
 * Is this a connectivity failure rather than a bad request?
 *
 * P1001 unreachable, P1002 timed out, P1008 operation timeout, P1017 server
 * closed the connection. Initialization and panic errors mean the client never
 * got a usable connection at all. Everything else is a real query problem and
 * should keep its 500.
 */
function isDatabaseUnavailable(err: unknown): boolean {
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    return true;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1001', 'P1002', 'P1008', 'P1017'].includes(err.code);
  }
  // Connection drops surface as an unknown request error with the reason only
  // in the message, so this is the one place a string check earns its keep.
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return /closed the connection|connection reset|ECONNREFUSED/i.test(err.message);
  }
  return false;
}

/** Wrap async handlers so rejected promises reach errorHandler. */
export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: T, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
