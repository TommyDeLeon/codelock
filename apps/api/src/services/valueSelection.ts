import { rankOf, type Rank } from './valueRanker.js';

/**
 * Which problem, inside the tier the rule engine already chose.
 *
 * The rule engine decides *what the user is ready for*; this decides which of
 * those to serve. Keeping the two apart matters: readiness is a fact about the
 * user, value is a fact about the problem, and collapsing them produces a
 * selector that hands a beginner a hard problem because it ranked well.
 *
 * The governing rule, from the brief: **rank biases, never dictates.** Pure
 * ranking serves the same handful forever, which the 21-day cooldown then has
 * to fight — and worse, it makes the next problem guessable, which means
 * pre-solvable before the lock ever appears. So every eligible problem keeps a
 * real chance, and the C bucket has weight 1, not 0.
 */

/**
 * Sampling weight per rank bucket, from the brief.
 *
 * An S problem is eight times as likely as a C one, not eight hundred. That
 * ratio is the design: enough bias to make good problems the norm, little
 * enough that the corpus does not collapse to a top-20 list.
 */
export const BUCKET_WEIGHTS: Record<Rank, number> = {
  S: 8,
  A: 5,
  B: 3,
  C: 1,
};

/** The fields selection needs. A structural subset of `Problem`. */
export interface Selectable {
  id: string;
  valueScore: number;
  eligibleForUnlock: boolean;
  popularity: number;
}

/**
 * Popularity survives as a bounded tiebreak, not as a second ranking.
 *
 * It was earning its keep before the ranker existed and still discriminates
 * usefully *within* a bucket. But raw like counts span orders of magnitude, and
 * left unbounded `sqrt(popularity)` would swamp an 8-vs-1 bucket spread
 * entirely — the rank weights would become decoration. Capping the factor at 2x
 * keeps rank the primary signal and popularity the nudge.
 */
export function popularityFactor(popularity: number): number {
  return 1 + Math.min(1, Math.sqrt(Math.max(0, popularity)) / 50);
}

/** Sampling weight for one candidate. Always positive, so nothing is stranded. */
export function weightOf(candidate: Selectable): number {
  return BUCKET_WEIGHTS[rankOf(candidate.valueScore)] * popularityFactor(candidate.popularity);
}

/**
 * Narrow to what may be served as an unlock, without ever emptying the pool.
 *
 * The fallback is not defensive clutter. A user whose screen is taken must be
 * able to give it back, and "no eligible problems at this tier" is a state
 * where the honest choice is a worse problem, not a locked machine. Same
 * reasoning as the existing cooldown fallback in `problemSelector`.
 */
export function eligibleOrAll<T extends Selectable>(candidates: readonly T[]): readonly T[] {
  const eligible = candidates.filter((c) => c.eligibleForUnlock);
  return eligible.length > 0 ? eligible : candidates;
}

/**
 * Sample one candidate, biased by rank bucket.
 *
 * `random` is injectable so the distribution can be asserted over many draws
 * rather than hoped for over one.
 */
export function bucketedPick<T extends Selectable>(
  candidates: readonly T[],
  random: () => number = Math.random,
): T {
  if (candidates.length === 0) {
    throw new Error('bucketedPick called with no candidates');
  }

  const pool = eligibleOrAll(candidates);
  const weights = pool.map(weightOf);
  const total = weights.reduce((sum, w) => sum + w, 0);

  let roll = random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return pool[i]!;
  }
  // Floating-point drift only; the loop covers the range in practice.
  return pool[pool.length - 1]!;
}

/** Bucket label for one problem, for logging and for the "why this?" answer. */
export function bucketOf(candidate: Selectable): Rank {
  return rankOf(candidate.valueScore);
}
