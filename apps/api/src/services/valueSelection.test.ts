import { describe, expect, it } from 'vitest';
import {
  BUCKET_WEIGHTS,
  bucketOf,
  bucketedPick,
  eligibleOrAll,
  popularityFactor,
  weightOf,
  type Selectable,
} from './valueSelection.js';
import { RANK_CUTOFFS } from './valueRanker.js';

/**
 * Selection is asserted over a *distribution*, not a draw.
 *
 * A single pick tells you nothing about a weighted sampler — it passes with a
 * broken implementation roughly as often as with a correct one. Everything here
 * that matters runs 1000 draws against a seeded generator.
 */

/** Deterministic and uniform enough for distribution assertions. */
function seededRandom(seed = 12_345): () => number {
  let state = seed;
  return () => {
    // mulberry32
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const p = (id: string, valueScore: number, over: Partial<Selectable> = {}): Selectable => ({
  id,
  valueScore,
  eligibleForUnlock: true,
  popularity: 0,
  ...over,
});

/** One problem per bucket, at a score comfortably inside each band. */
const oneOfEach = (): Selectable[] => [
  p('s', RANK_CUTOFFS.S + 0.05),
  p('a', RANK_CUTOFFS.A + 0.05),
  p('b', RANK_CUTOFFS.B + 0.05),
  p('c', RANK_CUTOFFS.B - 0.1),
];

function draw(candidates: Selectable[], n = 1000, seed = 12_345): Record<string, number> {
  const random = seededRandom(seed);
  const counts: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const chosen = bucketedPick(candidates, random);
    counts[chosen.id] = (counts[chosen.id] ?? 0) + 1;
  }
  return counts;
}

describe('bucket weights', () => {
  it('are 8/5/3/1, per the brief', () => {
    expect(BUCKET_WEIGHTS).toEqual({ S: 8, A: 5, B: 3, C: 1 });
  });

  it('labels each problem by its score band', () => {
    const [s, a, b, c] = oneOfEach();
    expect(bucketOf(s!)).toBe('S');
    expect(bucketOf(a!)).toBe('A');
    expect(bucketOf(b!)).toBe('B');
    expect(bucketOf(c!)).toBe('C');
  });
});

describe('distribution over 1000 draws', () => {
  it('follows the 8/5/3/1 shape', () => {
    const counts = draw(oneOfEach());
    const total = 8 + 5 + 3 + 1;
    const expected = {
      s: 1000 * (8 / total),
      a: 1000 * (5 / total),
      b: 1000 * (3 / total),
      c: 1000 * (1 / total),
    };

    // Generous tolerance: this asserts the shape, not the seed.
    for (const [id, want] of Object.entries(expected)) {
      expect(counts[id] ?? 0).toBeGreaterThan(want * 0.7);
      expect(counts[id] ?? 0).toBeLessThan(want * 1.3);
    }
  });

  it('orders the buckets S > A > B > C', () => {
    const counts = draw(oneOfEach());
    expect(counts.s!).toBeGreaterThan(counts.a!);
    expect(counts.a!).toBeGreaterThan(counts.b!);
    expect(counts.b!).toBeGreaterThan(counts.c!);
  });

  it('reaches every eligible problem — rank biases, it does not dictate', () => {
    // The property that stops the corpus collapsing to a top-20 list, and stops
    // the next problem being guessable (and so pre-solvable before the lock).
    const counts = draw(oneOfEach());
    for (const id of ['s', 'a', 'b', 'c']) {
      expect(counts[id] ?? 0).toBeGreaterThan(0);
    }
  });

  it('still reaches a lone C problem buried among many S problems', () => {
    const many = [
      ...Array.from({ length: 30 }, (_, i) => p(`s${i}`, RANK_CUTOFFS.S + 0.05)),
      p('lonely-c', 0.1),
    ];
    const counts = draw(many, 4000);
    expect(counts['lonely-c'] ?? 0).toBeGreaterThan(0);
  });

  it('is stable across seeds', () => {
    for (const seed of [1, 999, 424_242]) {
      const counts = draw(oneOfEach(), 1000, seed);
      expect(counts.s!).toBeGreaterThan(counts.c!);
    }
  });
});

describe('eligibility', () => {
  it('serves only eligible problems when some are eligible', () => {
    const candidates = [p('ok', 0.9), p('searchable', 0.9, { eligibleForUnlock: false })];
    const counts = draw(candidates);
    expect(counts.searchable).toBeUndefined();
    expect(counts.ok).toBe(1000);
  });

  it('falls back to the whole pool rather than leaving a user locked out', () => {
    // A user whose screen is taken must be able to give it back. "Nothing
    // eligible" is a reason to serve a worse problem, never to serve none.
    const none = [p('x', 0.9, { eligibleForUnlock: false }), p('y', 0.2, { eligibleForUnlock: false })];
    expect(eligibleOrAll(none)).toHaveLength(2);
    expect(() => bucketedPick(none, seededRandom())).not.toThrow();
  });

  it('throws only when there is genuinely nothing to pick', () => {
    expect(() => bucketedPick([], seededRandom())).toThrowError(/no candidates/);
  });
});

describe('popularity as a tiebreak', () => {
  it('never exceeds a 2x nudge', () => {
    expect(popularityFactor(0)).toBe(1);
    expect(popularityFactor(1_000_000)).toBeLessThanOrEqual(2);
  });

  it('treats missing or negative data as neutral, so a new problem is reachable', () => {
    // Every newly authored problem has no popularity data. A zero weight here
    // would mean the corpus could never grow past whatever was ranked first.
    expect(popularityFactor(0)).toBe(1);
    expect(popularityFactor(-5)).toBe(1);
    expect(weightOf(p('new', 0.1))).toBeGreaterThan(0);
  });

  it('cannot let a wildly popular C problem outrank an S problem', () => {
    // The failure this bound exists to prevent: popularity spans orders of
    // magnitude, rank weights span 8x. Unbounded, rank would be decoration.
    const popularC = p('c', 0.1, { popularity: 10_000_000 });
    const plainS = p('s', RANK_CUTOFFS.S + 0.05);
    expect(weightOf(plainS)).toBeGreaterThan(weightOf(popularC));
  });

  it('still separates two problems inside the same bucket', () => {
    const loved = p('loved', RANK_CUTOFFS.S + 0.05, { popularity: 5000 });
    const ignored = p('ignored', RANK_CUTOFFS.S + 0.05, { popularity: 0 });
    const counts = draw([loved, ignored]);
    expect(counts.loved!).toBeGreaterThan(counts.ignored!);
  });
});
