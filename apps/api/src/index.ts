import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { reapStaleSessions } from './services/lockSessions.js';
import { verifyLanguageIds } from './services/judge0.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'CodeLock API listening');
  // Surfaces a judge/language mismatch at boot rather than as an opaque 422 on
  // someone's first locked submission.
  void verifyLanguageIds();
});

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
process.on('unhandledRejection', (err) => logger.error({ err }, 'unhandled rejection'));
