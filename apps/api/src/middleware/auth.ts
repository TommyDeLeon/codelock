import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/tokens.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing bearer token'));
  }
  try {
    const claims = verifyAccessToken(header.slice('Bearer '.length).trim());
    req.user = { id: claims.sub, email: claims.email };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

/** Narrow `req.user` for handlers that already ran through requireAuth. */
export function currentUser(req: Request): { id: string; email: string } {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}
