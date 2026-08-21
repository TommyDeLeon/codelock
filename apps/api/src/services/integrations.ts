import { IntegrationProvider, SyncStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { commitSolution } from './github.js';
import { fetchLeetCodeStats } from './leetcode.js';

/** Give up after this many failed pushes; the token or repo is likely gone. */
const MAX_SYNC_ATTEMPTS = 3;
/** Serve cached provider stats for this long before refetching. */
const STATS_TTL_MS = 30 * 60_000;

/**
 * Mirror an accepted submission to GitHub.
 *
 * Explicitly fire-and-forget: this runs *after* the unlock token is issued and
 * its failure can never keep someone locked out of their own device. A GitHub
 * outage is not a reason to hold a user hostage.
 */
export function mirrorSubmission(userId: string, submissionId: string): void {
  void runMirror(userId, submissionId).catch((err) =>
    logger.warn({ err, submissionId }, 'submission mirror failed'),
  );
}

async function runMirror(userId: string, submissionId: string): Promise<void> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: IntegrationProvider.GITHUB } },
  });
  if (!integration?.enabled || !integration.accessTokenCipher || !integration.repoFullName) {
    return;
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { problem: true },
  });
  if (!submission) return;

  const record = await prisma.syncRecord.upsert({
    where: { integrationId_submissionId: { integrationId: integration.id, submissionId } },
    create: { integrationId: integration.id, submissionId, status: SyncStatus.PENDING },
    update: { attempts: { increment: 1 } },
  });
  if (record.attempts >= MAX_SYNC_ATTEMPTS) return;

  try {
    const commit = await commitSolution({
      tokenCipher: integration.accessTokenCipher,
      repoFullName: integration.repoFullName,
      branch: integration.repoBranch,
      problemSlug: submission.problem.slug,
      problemTitle: submission.problem.title,
      difficulty: submission.problem.difficulty,
      language: submission.language,
      sourceCode: submission.sourceCode,
      runtimeMs: submission.runtimeMs,
      gateMs: submission.gateMs,
      leetcodeSlug: submission.problem.leetcodeSlug,
    });

    await prisma.$transaction([
      prisma.syncRecord.update({
        where: { id: record.id },
        data: { status: SyncStatus.SUCCEEDED, detail: commit.sha, externalUrl: commit.url },
      }),
      prisma.integration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date(), lastError: null },
      }),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const exhausted = record.attempts + 1 >= MAX_SYNC_ATTEMPTS;
    await prisma.$transaction([
      prisma.syncRecord.update({
        where: { id: record.id },
        data: {
          status: exhausted ? SyncStatus.DISABLED : SyncStatus.FAILED,
          detail: message.slice(0, 500),
        },
      }),
      prisma.integration.update({
        where: { id: integration.id },
        data: { lastError: message.slice(0, 500) },
      }),
    ]);
    throw err;
  }
}

/**
 * LeetCode stats, cached.
 *
 * The upstream endpoint is unofficial, so we cache aggressively and fall back
 * to the last good snapshot on failure — a dashboard showing slightly stale
 * numbers beats one showing an error.
 */
export async function getLeetCodeStats(
  userId: string,
  options: { force?: boolean } = {},
): Promise<{ stats: unknown; stale: boolean } | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: IntegrationProvider.LEETCODE } },
  });
  if (!integration?.enabled) return null;

  const fresh =
    integration.lastSyncAt !== null &&
    Date.now() - integration.lastSyncAt.getTime() < STATS_TTL_MS;

  if (fresh && !options.force && integration.cachedStats) {
    return { stats: integration.cachedStats, stale: false };
  }

  try {
    const stats = await fetchLeetCodeStats(integration.externalUsername);
    await prisma.integration.update({
      where: { id: integration.id },
      data: { cachedStats: stats as object, lastSyncAt: new Date(), lastError: null },
    });
    return { stats, stale: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastError: message.slice(0, 500) },
    });
    if (integration.cachedStats) return { stats: integration.cachedStats, stale: true };
    return null;
  }
}
