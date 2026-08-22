import { Router } from 'express';
import { LockState, SubmissionStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, currentUser } from '../middleware/auth.js';
import { PROMOTE_AFTER_FAST_SOLVES, DEMOTE_AFTER_FAILURES } from '../services/difficulty.js';

export const statsRouter = Router();
statsRouter.use(requireAuth);

/** GET /stats/summary — everything the dashboard header needs, in one query set. */
statsRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

    const [progress, totals, accepted, byDifficulty, recentLocks] = await Promise.all([
      prisma.userProgress.findUnique({ where: { userId: user.id } }),
      prisma.submission.count({ where: { userId: user.id } }),
      prisma.submission.count({
        where: { userId: user.id, status: SubmissionStatus.ACCEPTED },
      }),
      prisma.submission.groupBy({
        by: ['status'],
        where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
        _count: { _all: true },
      }),
      prisma.lockSession.findMany({
        where: { userId: user.id, resolvedAt: { not: null } },
        orderBy: { resolvedAt: 'desc' },
        take: 30,
        select: {
          id: true,
          state: true,
          difficulty: true,
          lockedAt: true,
          resolvedAt: true,
          attempts: true,
          problem: { select: { slug: true, title: true } },
        },
      }),
    ]);

    if (!progress) throw ApiError.notFound('User progress missing');

    // The rank readout. Computed in JS rather than SQL because bestRuntimeMs is
    // a per-language JSON map, which SQL would have to unpack awkwardly for a
    // figure this small.
    const recentAccepted = await prisma.submission.findMany({
      where: { userId: user.id, status: SubmissionStatus.ACCEPTED, runtimeMs: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        runtimeMs: true,
        language: true,
        problem: { select: { slug: true, title: true, bestRuntimeMs: true } },
      },
    });

    const ratios: number[] = [];
    let recordsHeld = 0;
    for (const submission of recentAccepted) {
      const best = (submission.problem.bestRuntimeMs as Record<string, number> | null)?.[
        submission.language
      ];
      // No record yet means no ratio to report — inventing 1.0 would flatter.
      if (!best || best <= 0 || submission.runtimeMs === null) continue;
      ratios.push(submission.runtimeMs / best);
      if (submission.runtimeMs <= best) recordsHeld += 1;
    }

    // Personal bests: the user's own fastest run per problem and language, and
    // how it sits against the record. One row per pairing — a second, slower
    // solve of the same problem is not a separate achievement.
    const bests = new Map<string, PersonalBest>();
    for (const submission of recentAccepted) {
      if (submission.runtimeMs === null) continue;
      const key = `${submission.problem.slug}:${submission.language}`;
      const existing = bests.get(key);
      if (existing && existing.runtimeMs <= submission.runtimeMs) continue;
      const best = (submission.problem.bestRuntimeMs as Record<string, number> | null)?.[
        submission.language
      ];
      bests.set(key, {
        slug: submission.problem.slug,
        title: submission.problem.title,
        language: submission.language,
        runtimeMs: submission.runtimeMs,
        bestKnownMs: best && best > 0 ? best : null,
        ratio: best && best > 0 ? Number((submission.runtimeMs / best).toFixed(2)) : null,
        holdsRecord: Boolean(best && best > 0 && submission.runtimeMs <= best),
      });
    }

    const unlocked = recentLocks.filter((l) => l.state === LockState.UNLOCKED);
    const medianUnlockSeconds = median(
      unlocked
        .filter((l) => l.lockedAt && l.resolvedAt)
        .map((l) => (l.resolvedAt!.getTime() - l.lockedAt!.getTime()) / 1000),
    );

    res.json({
      progress: {
        ...progress,
        // Surface the ladder rules so the UI can render "2 of 3 fast solves"
        // rather than hard-coding thresholds that live in the backend.
        promoteAfterFastSolves: PROMOTE_AFTER_FAST_SOLVES,
        demoteAfterFailures: DEMOTE_AFTER_FAILURES,
      },
      personalBests: [...bests.values()].sort((a, b) => {
        // Records first, then closest to the record: the rows worth reading.
        if (a.holdsRecord !== b.holdsRecord) return a.holdsRecord ? -1 : 1;
        return (a.ratio ?? Infinity) - (b.ratio ?? Infinity);
      }),
      speed: {
        medianRatio: ratios.length === 0 ? null : Number(median(ratios)!.toFixed(2)),
        recordsHeld,
        sampleSize: ratios.length,
      },
      submissions: {
        total: totals,
        accepted,
        acceptanceRate: totals === 0 ? 0 : Math.round((accepted / totals) * 100),
        last30DaysByStatus: Object.fromEntries(
          byDifficulty.map((row) => [row.status, row._count._all]),
        ),
      },
      locks: {
        recent: recentLocks,
        unlockedCount: unlocked.length,
        medianUnlockSeconds,
      },
    });
  }),
);

/** GET /stats/activity — daily counts for the last 90 days (heatmap). */
statsRouter.get(
  '/activity',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const rows = await prisma.$queryRaw<Array<{ day: Date; solved: bigint; attempted: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS day,
             COUNT(*) FILTER (WHERE status = 'ACCEPTED') AS solved,
             COUNT(*) AS attempted
      FROM submissions
      WHERE "userId" = ${user.id}::uuid
        AND "createdAt" >= NOW() - INTERVAL '90 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    res.json({
      days: rows.map((r) => ({
        date: r.day.toISOString().slice(0, 10),
        solved: Number(r.solved),
        attempted: Number(r.attempted),
      })),
    });
  }),
);

interface PersonalBest {
  slug: string;
  title: string;
  language: string;
  runtimeMs: number;
  bestKnownMs: number | null;
  ratio: number | null;
  holdsRecord: boolean;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return Math.round(
    sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!,
  );
}
