import { Difficulty, Prisma, type PatternFamily, type Problem, type Tier } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { env } from '../env.js';
import { bucketedPick } from './valueSelection.js';

/** Do not serve a problem the user has already seen within this window. */
const REPEAT_COOLDOWN_DAYS = 21;

/** How many candidates the weighted pick chooses between. */
const CANDIDATE_POOL = 25;

/**
 * Take a random sample of the rows matching `where`, not the first page of them.
 *
 * `findMany({ take: 25 })` with no `orderBy` is not a sample — Prisma orders by
 * id, so it returns the same 25 lowest-id rows on every call. Measured against
 * the real corpus: a new user reached 23 of 48 Tier 0 problems, and the other 25
 * were unreachable until the cooldown rotated the window. It also quietly
 * undercut the value ranker, which was weighting a fixed subset rather than the
 * eligible pool.
 *
 * Two queries instead of one, on purpose. The first selects ids only, so even
 * the whole corpus is a few hundred integers rather than a few hundred rows of
 * markdown and six reference solutions each. The second fetches only the sample.
 * `ORDER BY random()` in raw SQL would be one query, but it would have to be
 * repeated at each fallback rung and would lose the type safety of the query
 * builder for no measurable gain at this table size.
 */
async function sampleCandidates(
  where: Prisma.ProblemWhereInput,
  random: () => number = Math.random,
): Promise<Problem[]> {
  const ids = await prisma.problem.findMany({ where, select: { id: true } });
  if (ids.length === 0) return [];

  // Partial Fisher-Yates: shuffle only as far as the pool needs.
  const pool = ids.map((row) => row.id);
  const wanted = Math.min(CANDIDATE_POOL, pool.length);
  for (let i = 0; i < wanted; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j] as string, pool[i] as string];
  }

  // The full predicate is re-applied, not just the sampled ids. The ids already
  // satisfy it, so this is redundant by construction — but it closes the window
  // where a problem is deactivated between the two queries, and it keeps the
  // invariant "no query for a servable problem omits isActive" literally true
  // rather than true-by-argument. Overriding `id` is safe: the sample is drawn
  // from rows that already passed any `id: { notIn: seen }` filter.
  return prisma.problem.findMany({ where: { ...where, id: { in: pool.slice(0, wanted) } } });
}

/**
 * Pick the problem for a lock session.
 *
 * The tier comes from the rule engine; this only chooses *within* the tier.
 * In `hybrid` mode an LLM ranks the shortlist by topic variety — a cheap,
 * strictly optional layer that falls back to random on any failure, because a
 * user staring at a lock screen must never wait on OpenAI.
 */
export async function pickProblem(
  userId: string,
  difficulty: Difficulty,
  tiers?: Tier[],
  families?: PatternFamily[],
): Promise<Problem> {
  const since = new Date(Date.now() - REPEAT_COOLDOWN_DAYS * 86_400_000);

  const recent = await prisma.submission.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { problemId: true },
    distinct: ['problemId'],
  });
  const seen = recent.map((r) => r.problemId);

  // `tiers` comes from the progression gate: what this user is ready for, which
  // is a different question from how hard they find things. Omitted only by
  // callers that genuinely want the whole pool.
  const tierFilter = tiers && tiers.length > 0 ? { tier: { in: tiers } } : {};

  // `families` comes from the same gate, and answers the question the tier
  // cannot: *which* patterns this user has reached. Both the structural
  // prerequisites ("build the heap before heap problems") and the roadmap
  // ordering ("two pointers before trees") arrive here already resolved.
  //
  // Without this the gate was computed, unit-tested and then discarded — the
  // query filtered on tier alone, so a user one lock into Tier 1 could be
  // served any family in the corpus. It was invisible only because Arrays &
  // Hashing is currently the sole authored Tier 1 family; the second family
  // authored would have made it a live bug.
  const familyFilter =
    families && families.length > 0 ? { patternFamily: { in: families } } : {};
  const curriculum = { ...tierFilter, ...familyFilter };

  // An empty-but-present gate result is not the same as "no gate requested",
  // and the `.length > 0` checks above cannot tell them apart — both degrade to
  // "match everything". Falling through is the right behaviour (a user who
  // cannot unlock is worse than one served off-curriculum), but doing it
  // silently is not: an empty set means the progression gate is broken, and
  // that is exactly the kind of fault that stayed invisible here before.
  //
  // `availableFamiliesForTiers` cannot currently return empty — Tier 0 always
  // contributes FOUNDATIONS — so this firing at all indicates a regression.
  if (tiers?.length === 0 || families?.length === 0) {
    logger.warn(
      { userId, tiers, families },
      'progression gate returned an empty set; selection is unfiltered',
    );
  }

  let candidates = await sampleCandidates({
    difficulty,
    isActive: true,
    ...curriculum,
    id: { notIn: seen },
  });

  // Everything at this tier is on cooldown — better to repeat than to fail open
  // and leave the device unlockable.
  if (candidates.length === 0) {
    logger.info({ userId, difficulty }, 'selection relaxed: cooldown dropped');
    candidates = await sampleCandidates({ difficulty, isActive: true, ...curriculum });
  }

  // The family gate and this difficulty do not intersect: the user has reached
  // Two Pointers but every Two Pointers problem is MEDIUM and they are on EASY.
  // Widen to the tier before widening to the corpus — an off-pattern problem at
  // the right tier is a smaller wrong than one from six families ahead.
  if (candidates.length === 0 && families && families.length > 0 && tiers && tiers.length > 0) {
    logger.info({ userId, difficulty, families }, 'selection relaxed: pattern family dropped');
    candidates = await sampleCandidates({ difficulty, isActive: true, ...tierFilter });
  }

  // Still nothing: the tier gate and this difficulty do not intersect yet. Drop
  // the tier filter rather than the lock — a user who cannot unlock is a worse
  // outcome than a user served something slightly off-curriculum.
  if (candidates.length === 0 && tiers && tiers.length > 0) {
    logger.warn({ userId, difficulty, tiers }, 'selection relaxed: tier gate dropped');
    candidates = await sampleCandidates({ difficulty, isActive: true });
  }

  // Last resort: relax difficulty as well.
  //
  // The ladder promotes a user to HARD after three fast solves, and if the
  // corpus has no HARD problems yet, every later lock fails to engage — the
  // user gets good at this and the product stops working for them. Serving an
  // easier problem is a far smaller wrong than a lock that cannot open.
  //
  // Same principle as the cooldown fallback above: repeat rather than fail.
  if (candidates.length === 0) {
    candidates = await sampleCandidates({ isActive: true });
    if (candidates.length > 0) {
      logger.warn(
        { difficulty, tiers },
        'no problems at this difficulty; serving from the whole active pool',
      );
    }
  }

  if (candidates.length === 0) {
    throw ApiError.notFound('No active problems at any difficulty');
  }

  if (env.DIFFICULTY_MODE === 'hybrid' && env.OPENAI_API_KEY) {
    const chosen = await rankWithLlm(candidates, seen.length).catch((err) => {
      logger.warn({ err }, 'LLM problem ranking failed; falling back to random');
      return null;
    });
    if (chosen) return chosen;
  }

  return bucketedPick(candidates);
}

/**
 * Random, but biased toward problems worth being asked.
 *
 * Two failure modes, in opposite directions. Pure random serves a piece of
 * trivia as readily as a foundational problem, and the user pays for that with
 * their screen. Pure ranking serves the same handful forever, which the 21-day
 * cooldown then has to fight — and makes the next problem guessable, which
 * means pre-solvable before the lock ever appears.
 *
 * So: weight, never dictate. Every eligible problem keeps a real chance.
 *
 * The weighting itself now lives in valueSelection.ts, which buckets by
 * valueScore (8/5/3/1 by rank) and keeps popularity as a bounded tiebreak.
 * This wrapper stays because it is the name the rest of the codebase and its
 * tests already know.
 */
export function weightedPick(candidates: Problem[], random: () => number = Math.random): Problem {
  return bucketedPick(candidates, random);
}

async function rankWithLlm(candidates: Problem[], seenCount: number): Promise<Problem | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4_000);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You pick one coding problem for a focus-break exercise. Favour topic variety ' +
              'and a clean, self-contained statement. Reply as {"slug": "<slug>"} only.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              problemsSolvedRecently: seenCount,
              candidates: candidates.map((c) => ({ slug: c.slug, title: c.title, tags: c.tags })),
            }),
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return null;
    const { slug } = JSON.parse(content) as { slug?: string };
    return candidates.find((c) => c.slug === slug) ?? null;
  } finally {
    clearTimeout(timer);
  }
}
