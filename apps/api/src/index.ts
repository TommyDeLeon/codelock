import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { engageDueSessions, reapStaleSessions } from './services/lockSessions.js';
import { verifyLanguageIds } from './services/judge0.js';
const app = createApp();
const server = app.listen(env.PORT, env.HOST, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'CodeLock API listening');
  // Surfaces a judge/language mismatch at boot rather than as an opaque 422 on
  // someone's first locked submission.
  void verifyLanguageIds();
});

/**
 * The deadline belongs to the server, so the server enforces it.
 *
 * Every fifteen seconds, because this is the difference between a timer that
 * fires and one that cannot be escaped: a session left ARMED past its deadline
 * refuses submissions, so a screen covered against it has no way to earn an
 * unlock. Clients still call POST /lock/:id/engage — that path is immediate and
 * remains the normal one — but nothing now depends on a client being awake to
 * notice that time is up.
 */
const ENGAGE_INTERVAL_MS = 15_000;
const engager = setInterval(() => {
  engageDueSessions()
    .then((count) => count > 0 && logger.info({ count }, 'engaged due lock sessions'))
    .catch((err) => logger.error({ err }, 'engage sweep failed'));
}, ENGAGE_INTERVAL_MS);
engager.unref();

// Sessions nobody ever resolved would otherwise block re-arming forever.
const REAP_INTERVAL_MS = 15 * 60_000;
const reaper = setInterval(() => {
  reapStaleSessions()
    .then((count) => count > 0 && logger.info({ count }, 'reaped stale lock sessions'))
    .catch((err) => logger.error({ err }, 'reaper failed'));
}, REAP_INTERVAL_MS);
reaper.unref();

/** Finish in-flight grading before exiting; a killed submission looks like a bug. */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'shutting down');
  clearInterval(engager);
  clearInterval(reaper);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('forced exit after 15s grace period');
    process.exit(1);
  }, 15_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'unhandled rejection');
});

// An uncaught exception leaves the process in an unknown state. Report it, give
// the reporter a moment to flush, then die — a lock API limping along with
// corrupted state is worse than one that restarts.
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception');
  setTimeout(() => process.exit(1), 1000).unref();
});
