import { Tier } from '@prisma/client';

/**
 * How much a problem is worth being asked, and why.
 *
 * The user pays for every problem with their screen. That is the whole reason
 * this exists: a corpus of 695 problems assembled from mixed sources will
 * contain trivia, and serving trivia under a lock is a small betrayal the
 * 21-day cooldown cannot fix.
 *
 * Two properties are load-bearing:
 *
 * 1. **Every component is stored, not just the total.** "Why is this rank S?"
 *    must answer with six numbers. A single opaque score is unarguable, and an
 *    unarguable score is one nobody can correct.
 *
 * 2. **Nothing here is a special case.** A Project Euler problem falls out of
 *    the unlock pool because its answer is a single published integer, which is
 *    what `answerLookupRisk` measures — not because a branch names Project
 *    Euler. Add a new source with the same property and it falls out too,
 *    without anyone editing this file.
 *
 * Pure functions only. No Prisma, no clock, no I/O: this is the part that has
 * to be arguable, and an argument you cannot run in isolation is a bad one.
 */

/** The six components. Each is 0..1. */
export interface Components {
  /** Does solving this teach something that transfers to other problems? */
  patternTransfer: number;
  /** How often this pattern actually appears in interviews. */
  interviewFrequency: number;
  /** Does it fit the time a lock gives you? */
  lockWindowFit: number;
  /** Is there an explanation good enough to learn from after the fact? */
  explanationQuality: number;
  /** Can the judge decide it correctly and quickly? */
  judgeability: number;
  /** Can the answer be looked up whole, without solving? */
  answerLookupRisk: number;
}

/**
 * Weights, straight from the brief.
 *
 * `explanationQuality` is **positive**. A well-explained problem is better for
 * a learner, and the editorial is gated behind the resolution, so a good
 * editorial is not a leak — it is the payoff. Getting this sign wrong would
 * systematically demote exactly the problems this audience needs most.
 *
 * `answerLookupRisk` is the only negative, and it is weighted as heavily as the
 * largest positive: a problem you can look up whole does not unlock anything,
 * it just costs the user their evening.
 */
export const WEIGHTS = {
  patternTransfer: 0.3,
  interviewFrequency: 0.25,
  lockWindowFit: 0.2,
  explanationQuality: 0.15,
  judgeability: 0.1,
  answerLookupRisk: -0.3,
} as const;

/** Below this, a problem is not served as an unlock. */
export const DEFAULT_UNLOCK_THRESHOLD = 0.4;

/**
 * A risk at or above this means the answer is effectively public.
 *
 * Separate from the threshold on purpose. A high-risk problem must be excluded
 * even if it scores well on everything else, because "scores well and is
 * trivially searchable" is precisely the dangerous combination.
 */
export const ANSWER_LOOKUP_CEILING = 0.5;

export type Rank = 'S' | 'A' | 'B' | 'C';

/**
 * Rank cutoffs.
 *
 * Calibrated against the cold start below so the brief's requirement holds out
 * of the box: a Tier 1 canonical problem lands S, a Tier 0.5 "build the
 * structure" problem lands A. The tests assert exactly that, rather than
 * asserting these numbers.
 */
export const RANK_CUTOFFS: Record<Exclude<Rank, 'C'>, number> = {
  S: 0.85,
  A: 0.7,
  B: 0.55,
};

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Weighted sum. Can exceed 1 or go negative; that is intended, not clamped. */
export function valueScore(c: Components): number {
  return (
    WEIGHTS.patternTransfer * clamp01(c.patternTransfer) +
    WEIGHTS.interviewFrequency * clamp01(c.interviewFrequency) +
    WEIGHTS.lockWindowFit * clamp01(c.lockWindowFit) +
    WEIGHTS.explanationQuality * clamp01(c.explanationQuality) +
    WEIGHTS.judgeability * clamp01(c.judgeability) +
    WEIGHTS.answerLookupRisk * clamp01(c.answerLookupRisk)
  );
}

export function rankOf(score: number): Rank {
  if (score >= RANK_CUTOFFS.S) return 'S';
  if (score >= RANK_CUTOFFS.A) return 'A';
  if (score >= RANK_CUTOFFS.B) return 'B';
  return 'C';
}

/**
 * Eligible to be served as an unlock.
 *
 * Both conditions, per the brief. The ceiling is not redundant with the
 * threshold: a searchable problem with an excellent editorial can clear the
 * threshold comfortably and still be worthless as a lock.
 */
export function isEligibleForUnlock(
  score: number,
  risk: number,
  threshold: number = DEFAULT_UNLOCK_THRESHOLD,
): boolean {
  return score >= threshold && risk < ANSWER_LOOKUP_CEILING;
}

// --- cold start -------------------------------------------------------------

/**
 * Seeds for `patternTransfer` and `interviewFrequency`, by tier.
 *
 * These come from the canonical list taxonomy — Tier 1 *is* the set of patterns
 * the lists agree on, which is the definition of high interview frequency — and
 * they are only a starting point. Solve data adjusts them later
 * (`adjustFromSolveData`).
 *
 * Tier 0 scores low on interview frequency, and that is correct: nobody is
 * asked to reverse a string in a final round. It is not a judgement on the
 * problem's worth to a beginner, which is what tier gating in Phase 5 is for. A
 * Tier 0 problem is served because the user is not ready for Tier 1, not
 * because it out-ranked one.
 */
const COLD_START: Record<Tier, { patternTransfer: number; interviewFrequency: number }> = {
  TIER_0: { patternTransfer: 0.55, interviewFrequency: 0.25 },
  // High transfer, moderate frequency: you are rarely asked to implement a heap,
  // but everything you are asked assumes you could.
  TIER_0_5: { patternTransfer: 0.85, interviewFrequency: 0.55 },
  TIER_1: { patternTransfer: 0.95, interviewFrequency: 0.9 },
  // A variation teaches recognition rather than the pattern itself.
  TIER_2: { patternTransfer: 0.7, interviewFrequency: 0.6 },
  TIER_3: { patternTransfer: 0.55, interviewFrequency: 0.45 },
};

/** What the ranker needs to know about a problem. A subset of `Problem`. */
export interface RankInput {
  tier: Tier;
  source: string;
  /** Rolling mean of accepted solve times, seconds. */
  avgSolveSeconds: number;
  editorialMarkdown?: string | null;
  editorialUrl?: string | null;
  /** How many test cases the problem ships. */
  testCaseCount: number;
  /** Whether the answer is a single value published somewhere as *the* answer. */
  hasPublishedSingleAnswer?: boolean;
  /** Overrides, for hand-tuning a specific row. */
  overrides?: Partial<Components>;
}

/**
 * How well the problem fits the time a lock actually gives you.
 *
 * Peaks around ten minutes and falls off both ways. Too fast and the lock was
 * pointless; too slow and the user is trapped in front of a problem they cannot
 * finish — the failure mode this product has to avoid hardest. The escape hatch
 * exists because that state is intolerable, and serving a 40-minute problem is
 * choosing to put people there.
 */
export function lockWindowFit(avgSolveSeconds: number): number {
  const ideal = 600;
  const seconds = Math.max(1, avgSolveSeconds);
  const ratio = seconds / ideal;
  if (ratio <= 1) {
    // Under ten minutes: a two-minute problem still scores 0.5, not 0. Quick is
    // a mild demerit, not a disqualification.
    return clamp01(0.5 + 0.5 * ratio);
  }
  // Over ten minutes, decay: 20 min -> 0.5, 30 min -> 0.33, 60 min -> 0.17.
  return clamp01(1 / ratio);
}

/** Is there something worth reading after the lock lifts? */
export function explanationQuality(input: RankInput): number {
  if (input.editorialMarkdown && input.editorialMarkdown.trim().length > 200) return 0.95;
  if (input.editorialMarkdown && input.editorialMarkdown.trim().length > 0) return 0.7;
  if (input.editorialUrl) return 0.55;
  // No explanation at all. A user who fails leaves with nothing, which is the
  // one outcome the product exists to prevent.
  return 0.15;
}

/**
 * Can the judge decide this correctly?
 *
 * Driven by test-case count, because that is what actually decides whether a
 * wrong solution gets through. Three cases is the floor MBPP ships; below that
 * a problem is barely judged at all.
 */
export function judgeability(testCaseCount: number): number {
  if (testCaseCount === 0) return 0;
  if (testCaseCount < 3) return 0.4;
  if (testCaseCount < 6) return 0.7;
  if (testCaseCount < 12) return 0.9;
  return 0.95;
}

/**
 * How much of the answer is already public, as a single value.
 *
 * The distinction the brief insists on: a problem with a thorough editorial is
 * *not* high risk. Editorials are gated behind the resolution, and a user who
 * wanted to cheat would search the statement, not our database. What is
 * genuinely unsafe is a problem whose entire answer is one published number —
 * Project Euler's model — because then "solving" is copying a digit string.
 */
export function answerLookupRisk(input: RankInput): number {
  if (input.hasPublishedSingleAnswer) return 0.95;
  // An editorial we host is not a leak; if anything it means the problem is
  // well understood, and well-understood problems are judged more reliably.
  return input.editorialMarkdown ? 0.1 : 0.25;
}

/** Derive all six components for a problem. */
export function scoreComponents(input: RankInput): Components {
  const cold = COLD_START[input.tier];
  const base: Components = {
    patternTransfer: cold.patternTransfer,
    interviewFrequency: cold.interviewFrequency,
    lockWindowFit: lockWindowFit(input.avgSolveSeconds),
    explanationQuality: explanationQuality(input),
    judgeability: judgeability(input.testCaseCount),
    answerLookupRisk: answerLookupRisk(input),
  };
  return { ...base, ...input.overrides };
}

/** Everything the ranker concluded, and the numbers it concluded it from. */
export interface Ranking extends Components {
  valueScore: number;
  rank: Rank;
  eligibleForUnlock: boolean;
}

export function rank(input: RankInput, threshold: number = DEFAULT_UNLOCK_THRESHOLD): Ranking {
  const components = scoreComponents(input);
  const score = valueScore(components);
  return {
    ...components,
    valueScore: score,
    rank: rankOf(score),
    eligibleForUnlock: isEligibleForUnlock(score, components.answerLookupRisk, threshold),
  };
}

/**
 * A sentence per component, for the "why is this rank S?" answer.
 *
 * Prose rather than a number dump because the audience is a learner asking why
 * they were handed this problem, not an operator reading a dashboard.
 */
export function explain(ranking: Ranking): string[] {
  const pct = (n: number): string => `${Math.round(n * 100)}%`;
  return [
    `Rank ${ranking.rank} (score ${ranking.valueScore.toFixed(2)}).`,
    `Pattern transfer ${pct(ranking.patternTransfer)} — how much this teaches that carries to other problems.`,
    `Interview frequency ${pct(ranking.interviewFrequency)} — how often this pattern actually comes up.`,
    `Lock-window fit ${pct(ranking.lockWindowFit)} — how well it fits the time a lock gives you.`,
    `Explanation quality ${pct(ranking.explanationQuality)} — how much you can learn from it afterwards.`,
    `Judgeability ${pct(ranking.judgeability)} — how reliably the judge can decide it.`,
    `Answer-lookup risk ${pct(ranking.answerLookupRisk)} — how much of the answer is already published.`,
    ranking.eligibleForUnlock
      ? 'Eligible to be served as an unlock.'
      : ranking.answerLookupRisk >= ANSWER_LOOKUP_CEILING
        ? 'Not served as an unlock: the answer is a single published value.'
        : 'Not served as an unlock: score below threshold.',
  ];
}

/**
 * Let observed solves move the two seeded components.
 *
 * Only the seeded ones. The other four are measured from the problem itself and
 * do not become truer because people solved it.
 *
 * Blends toward the observed rate rather than replacing it: one user failing a
 * good problem is noise, and a corpus that re-ranks itself on the first data
 * point will chase that noise. `confidence` is what stops it.
 */
export function adjustFromSolveData(
  seeded: Pick<Components, 'patternTransfer' | 'interviewFrequency'>,
  observed: { attempts: number; solves: number },
): Pick<Components, 'patternTransfer' | 'interviewFrequency'> {
  if (observed.attempts < 10) return seeded;

  const solveRate = observed.solves / observed.attempts;
  // A problem nobody can solve teaches nothing; one everybody solves instantly
  // teaches little either. Peak transfer sits in the middle.
  const observedTransfer = 1 - Math.abs(solveRate - 0.5) * 1.5;
  const confidence = Math.min(0.5, observed.attempts / 200);

  return {
    patternTransfer: clamp01(
      seeded.patternTransfer * (1 - confidence) + clamp01(observedTransfer) * confidence,
    ),
    // Interview frequency is a fact about the world, not about our users.
    interviewFrequency: seeded.interviewFrequency,
  };
}
