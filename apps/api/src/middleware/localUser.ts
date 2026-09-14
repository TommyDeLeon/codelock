import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

/**
 * The single local learner.
 *
 * CodeLock is a commitment device that runs on one person's machine. Accounts
 * existed to sync a profile across devices and to authorise integrations; with
 * both gone there is nobody to authenticate against and nothing to protect that
 * the operating system does not already protect. A sign-in screen in front of a
 * local database is a lock on a door in an open field.
 *
 * Removing it is not only simplification. The lock screen borrowed a session
 * from the desktop shell, and a query that fired before that borrow finished
 * stranded the user on "Missing bearer token" with a running timer — an
 * authentication failure at exactly the moment the product must not fail. That
 * whole class of bug goes away when there is no token to be missing.
 *
 * Progress still hangs off a `User` row because every table references it, so
 * this resolves that row and creates it once on first use.
 */

/** Stable marker for the local row. Not an address, and never emailed. */
const LOCAL_USER_EMAIL = 'local@codelock.invalid';

/**
 * Resolved on every request, deliberately not cached.
 *
 * A process-lifetime cache survived a database reset: the API kept handing out
 * a user id that no longer existed, and the dashboard showed "User progress
 * missing" until the server was restarted. One indexed upsert per request is
 * cheap for a single local learner, and it also repairs a user row whose
 * progress or timer settings are missing.
 */
export async function resolveLocalUser(): Promise<string> {
  // upsert, not findFirst-then-create: two requests can arrive together on a
  // cold start, and the unique constraint is what makes the race harmless.
  const user = await prisma.user.upsert({
    where: { email: LOCAL_USER_EMAIL },
    update: {
      progress: { upsert: { create: {}, update: {} } },
      timerConfig: { upsert: { create: {}, update: {} } },
    },
    create: {
      email: LOCAL_USER_EMAIL,
      displayName: 'You',
      progress: { create: {} },
      timerConfig: { create: {} },
    },
    select: { id: true },
  });
  return user.id;
}

/**
 * Attach the local learner to every request.
 *
 * Replaces requireAuth. It cannot reject: there is no credential to be wrong.
 */
export function withLocalUser(req: Request, _res: Response, next: NextFunction): void {
  resolveLocalUser()
    .then((id) => {
      req.user = { id };
      next();
    })
    .catch(next);
}

/** Narrow `req.user` for handlers that already ran through withLocalUser. */
export function currentUser(req: Request): { id: string } {
  if (!req.user) throw new Error('withLocalUser did not run before this handler');
  return req.user;
}

/** Tests create their own users; let them reset the memoised id. */
export function resetLocalUserCache(): void {
  // Nothing to reset: the user is resolved on every request. Kept so existing
  // database tests that call it keep compiling.
}
