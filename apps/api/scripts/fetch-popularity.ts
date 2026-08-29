/**
 * Rank problems by how much the equivalent problem is liked, upstream.
 *
 * Reads the public like/dislike counts for each problem's `leetcodeSlug` and
 * stores the result in `popularity`. Ranking is the only thing taken: no
 * statement, no test case, no editorial. Those are LeetCode's, and an MIT
 * licence on someone's solutions repository covers that author's code, not the
 * text of the question. A like count is a fact about a problem's reception; the
 * problem itself is not ours to copy.
 *
 * Why not rank by our own solveCount: that measures what CodeLock happened to
 * serve, so ranking by it would amplify whatever it served first — a feedback
 * loop that mistakes its own history for a judgement.
 *
 * The endpoint is unofficial and can change without notice, which is why every
 * failure here is non-fatal and the previous score simply stands.
 *
 *   npx tsx scripts/fetch-popularity.ts            # dry run, prints a table
 *   npx tsx scripts/fetch-popularity.ts --write    # persist
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ENDPOINT = 'https://leetcode.com/graphql';
const TIMEOUT_MS = 10_000;
/** Courtesy gap between requests. This is someone else's service. */
const DELAY_MS = 1_200;

const QUERY = `
  query codelockPopularity($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      titleSlug
      likes
      dislikes
      isPaidOnly
    }
  }
`;

interface Upstream {
  titleSlug: string;
  likes: number | null;
  dislikes: number | null;
  isPaidOnly: boolean | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchOne(slug: string): Promise<Upstream | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Referer: `https://leetcode.com/problems/${slug}/`,
        'User-Agent': 'CodeLock/1.0 (popularity ranking; +https://github.com/TommyDeLeon/codelock)',
      },
      body: JSON.stringify({ query: QUERY, variables: { titleSlug: slug } }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { question?: Upstream | null } };
    return body.data?.question ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Likes minus dislikes, floored at zero.
 *
 * A problem people actively dislike is not one to hand someone locked out of
 * their machine — the raw like count alone would rank a famously badly
 * specified question highly simply because many people have seen it.
 */
export function scoreOf(likes: number | null, dislikes: number | null): number {
  return Math.max(0, (likes ?? 0) - (dislikes ?? 0));
}

async function main() {
  const write = process.argv.includes('--write');

  const problems = await prisma.problem.findMany({
    where: { leetcodeSlug: { not: null } },
    select: { id: true, slug: true, leetcodeSlug: true, popularity: true },
    orderBy: { slug: 'asc' },
  });

  if (problems.length === 0) {
    console.log('No problems carry a leetcodeSlug, so there is nothing to rank.');
    console.log('Set Problem.popularity by hand for problems with no upstream counterpart.');
    return;
  }

  console.log(`${problems.length} problem(s) with an upstream slug.\n`);
  let updated = 0;
  let failed = 0;

  for (const p of problems) {
    const upstream = await fetchOne(p.leetcodeSlug!);
    if (!upstream) {
      failed++;
      console.log(`  ${p.slug.padEnd(32)} unavailable (keeping ${p.popularity})`);
      await sleep(DELAY_MS);
      continue;
    }

    const score = scoreOf(upstream.likes, upstream.dislikes);
    const note = upstream.isPaidOnly ? '  [subscriber-only upstream]' : '';
    console.log(
      `  ${p.slug.padEnd(32)} ${String(p.popularity).padStart(6)} -> ${String(score).padStart(6)}` +
        `  (+${upstream.likes ?? 0} / -${upstream.dislikes ?? 0})${note}`,
    );

    if (write) {
      await prisma.problem.update({
        where: { id: p.id },
        data: {
          popularity: score,
          popularitySource: 'leetcode:likes',
          popularityCheckedAt: new Date(),
        },
      });
      updated++;
    }
    await sleep(DELAY_MS);
  }

  console.log(
    `\n${write ? `wrote ${updated}` : 'dry run'}` +
      `${failed > 0 ? `, ${failed} unavailable` : ''}` +
      `${write ? '' : '. Pass --write to persist.'}`,
  );
}

main()
  .catch((err) => {
    console.error('popularity fetch failed:', err);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
