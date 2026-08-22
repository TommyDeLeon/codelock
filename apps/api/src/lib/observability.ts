import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { env } from '../env.js';
import { logger } from './logger.js';

/**
 * Request correlation and error reporting.
 *
 * Two rules that shape everything here:
 *
 *  1. **Nothing leaves the machine unless configured.** With `SENTRY_DSN`
 *     unset — the default, and what a self-hosted install runs — no network
 *     call is made and no data is collected. A lock app knows when you are at
 *     your desk and what you are failing to solve; shipping that to a third
 *     party by default would be indefensible.
 *  2. **Observability never breaks the request.** Every path here is wrapped
 *     or optional. A reporting failure is a reporting failure, not a 500.
 */

/**
 * A request id per request, echoed as `x-request-id`.
 *
 * Honours an inbound header so a proxy's id wins and one trace spans the whole
 * hop — but only when it looks like an id, because it ends up in log lines and
 * in an error body the user can read back to you.
 */
export function requestIdFor(req: Request): string {
  const inbound = req.header('x-request-id');
  if (inbound && /^[A-Za-z0-9._-]{8,128}$/.test(inbound)) return inbound;
  return randomUUID();
}

let sentry: typeof import('@sentry/node') | null = null;

/**
 * Load Sentry only when a DSN is configured.
 *
 * A dynamic import rather than a top-level one so the SDK is not even evaluated
 * on a self-hosted install, and so the API still boots if the package is
 * missing entirely.
 */
export async function initErrorTracking(): Promise<void> {
  if (!env.SENTRY_DSN) {
    logger.info('error tracking disabled (SENTRY_DSN unset)');
    return;
  }

  try {
    const mod = await import('@sentry/node');
    mod.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      release: env.RELEASE_SHA,
      tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
      // Submitted source code is the user's work and is never ours to send.
      // The logger redacts it too; this is the second of the two places that
      // would otherwise leak it.
      beforeSend(event) {
        if (event.request?.data) delete event.request.data;
        return event;
      },
    });
    sentry = mod;
    logger.info({ release: env.RELEASE_SHA }, 'error tracking enabled');
  } catch (err) {
    // Not fatal. An API that refuses to start because its error reporter is
    // missing has turned observability into an outage.
    logger.warn({ err }, 'SENTRY_DSN is set but @sentry/node could not be loaded');
  }
}

/** Report an exception, if reporting is on. Never throws. */
export function captureError(err: unknown, context: Record<string, unknown> = {}): void {
  if (!sentry) return;
  try {
    sentry.captureException(err, { extra: context });
  } catch {
    // Swallowed by design: see rule 2.
  }
}

/** Attach the request id to a response so a user can quote it in a bug report. */
export function tagResponse(res: Response, requestId: string): void {
  res.setHeader('x-request-id', requestId);
}
