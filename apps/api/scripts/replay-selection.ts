/**
 * Replay problem selection against the local learner's real history, and
 * report the measurements docs/reward-and-stretch.md asks for.
 *
 * Read-only: calls `pickProblem` N times with the real progression gate and
 * reports what would be served. Nothing is written. Run before and after a
 * selector change to compare the served-problem distribution.
 *
 *   LOG_LEVEL=silent npx tsx --env-file-if-exists=.env scripts/replay-selection.ts [runs]
 */
import { LockState } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import { pickProblem } from '../src/services/problemSelector.js';
import { loadSkillSnapshot } from '../src/services/skillState.js';
import {
  availableFamiliesForTiers,
  availableTiers,
  loadProgressSnapshot,
} from '../src/services/progression.js';
import { skillsRequiredBy } from '../src/services/skills.js';
import { loadFrontierLocks, describeFrontier } from '../src/services/frontier.js';

const pct = (n: number, of: number) => (of === 0 ? 'n/a' : `${((100 * n) / of).toFixed(0)}%`);
const median = (xs: number[]) => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? null;
};

async function main() {
  const runs = Number(process.argv[2] ?? 200);
  const user = await prisma.user.findFirstOrThrow();
  const snapshot = await loadSkillSnapshot(user.id);
  const progress = await loadProgressSnapshot(user.id);
  const tiers = availableTiers(progress);
  const families = availableFamiliesForTiers(progress, tiers);
  const up = await prisma.userProgress.findUnique({ where: { userId: user.id } });
  const difficulty = up?.currentDifficulty ?? 'EASY';
  const solved = new Set(
    (
      await prisma.submission.findMany({
        where: { userId: user.id, status: { in: ['ACCEPTED', 'ACCEPTED_TOO_SLOW'] } },
        select: { problemId: true },
      })
    ).map((r) => r.problemId),
  );

  // --- what the selector would serve now ------------------------------------
  const counts = new Map<string, number>();
  let stretch = 0;
  let repeats = 0;
  let outOfDepth = 0;
  for (let i = 0; i < runs; i++) {
    const { problem, skillEligible, pool } = await pickProblem(user.id, difficulty, tiers, families);
    counts.set(problem.slug, (counts.get(problem.slug) ?? 0) + 1);
    const needsUndemonstrated = skillsRequiredBy(problem).some(
      (s) => snapshot[s].state !== 'demonstrated' && snapshot[s].state !== 'due_for_review',
    );
    if (!skillEligible) outOfDepth++;
    if (needsUndemonstrated || pool === 'stretch') stretch++;
    if (solved.has(problem.id)) repeats++;
  }
  console.log('== selection replay');
  console.log(
    JSON.stringify({
      runs,
      difficulty,
      tiers,
      families,
      stretch: pct(stretch, runs),
      masteredOnly: pct(runs - stretch, runs),
      repeatsOfSolved: pct(repeats, runs),
      outOfDepth: pct(outOfDepth, runs),
    }),
  );
  for (const [slug, n] of [...counts].sort((a, b) => b[1] - a[1])) {
    console.log(`${String(n).padStart(4)} ${slug}${solved.has(slug) ? ' (solved)' : ''}`);
  }

  // --- what the history shows, per pool ------------------------------------
  const sessions = await prisma.lockSession.findMany({
    where: {
      userId: user.id,
      state: { in: [LockState.UNLOCKED, LockState.BYPASSED, LockState.ABANDONED] },
      lockedAt: { not: null },
    },
    orderBy: { lockedAt: 'desc' },
    select: {
      id: true,
      lockedAt: true,
      resolvedAt: true,
      state: true,
      problem: { select: { slug: true } },
      submissions: { orderBy: { createdAt: 'asc' }, select: { status: true, createdAt: true } },
    },
  });
  const events = await prisma.learningEvent.findMany({
    where: {
      userId: user.id,
      sessionId: { in: sessions.map((s) => s.id) },
      kind: { in: ['PROBLEM_SERVED', 'HINT_REVEALED', 'ATTEMPT_FAILED'] },
    },
    select: { sessionId: true, kind: true, detail: true },
  });
  type Row = { pool: string; firstTry: boolean; seconds: number | null; maxHint: number; slug: string };
  const rows: Row[] = sessions
    .filter((s) => s.problem)
    .map((s) => {
      const mine = events.filter((e) => e.sessionId === s.id);
      const served = mine.filter((e) => e.kind === 'PROBLEM_SERVED').at(-1);
      const pool = String((served?.detail as { pool?: string } | null)?.pool ?? 'unrecorded');
      const first = s.submissions[0];
      const accepted = s.submissions.find((x) => x.status === 'ACCEPTED' || x.status === 'ACCEPTED_TOO_SLOW');
      const seconds =
        accepted && s.lockedAt ? Math.round((accepted.createdAt.getTime() - s.lockedAt.getTime()) / 1000) : null;
      const maxHint = Math.max(
        0,
        ...mine
          .filter((e) => e.kind === 'HINT_REVEALED')
          .map((e) => Number((e.detail as { level?: number } | null)?.level ?? 0)),
      );
      return {
        pool,
        firstTry: first?.status === 'ACCEPTED' || first?.status === 'ACCEPTED_TOO_SLOW',
        seconds,
        maxHint,
        slug: s.problem!.slug,
      };
    });
  console.log('== history by pool (pool is recorded from this change on; older locks read "unrecorded")');
  for (const pool of ['stretch', 'consolidating', 'unrecorded']) {
    const inPool = rows.filter((r) => r.pool === pool);
    if (inPool.length === 0) continue;
    console.log(
      JSON.stringify({
        pool,
        locks: inPool.length,
        firstTryPass: pct(inPool.filter((r) => r.firstTry).length, inPool.length),
        medianSecondsToSolve: median(inPool.map((r) => r.seconds).filter((x): x is number => x !== null)),
        medianMaxHintLevel: median(inPool.map((r) => r.maxHint)),
      }),
    );
  }
  const perProblem = new Map<string, { served: number; firstTry: number }>();
  for (const r of rows.filter((r) => r.pool === 'stretch')) {
    const p = perProblem.get(r.slug) ?? { served: 0, firstTry: 0 };
    p.served++;
    if (r.firstTry) p.firstTry++;
    perProblem.set(r.slug, p);
  }
  const hardStretch = [...perProblem].filter(([, p]) => p.served >= 3 && p.firstTry / p.served < 0.25);
  console.log('== stretch problems failing nearly everyone (served ≥3, first-try <25%):', hardStretch.length ? hardStretch : 'none yet');

  // --- return, kept out of the UI ------------------------------------------
  const days = new Set(sessions.map((s) => s.lockedAt!.toISOString().slice(0, 10)));
  const span = sessions.length
    ? Math.max(1, Math.ceil((Date.now() - sessions.at(-1)!.lockedAt!.getTime()) / 86_400_000))
    : 0;
  console.log('== active days per week:', span ? ((7 * days.size) / span).toFixed(1) : 'n/a', `(${days.size} days over ${span})`);

  // --- what the Progress tab would say -------------------------------------
  console.log('== frontier:', JSON.stringify(describeFrontier(snapshot, await loadFrontierLocks(user.id))));

  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
