import { describe, expect, it } from 'vitest';
import type { Problem } from '@prisma/client';
import { weightedPick } from './problemSelector.js';

/**
 * Selection has to be biased and still unpredictable.
 *
 * Biased, because the user pays for a badly chosen problem with their screen.
 * Unpredictable, because a guessable next problem can be pre-solved before the
 * lock appears — which would defeat the product rather than merely annoy.
 *
 * A single draw shows neither property, so these assert over a thousand.
 */

const problem = (slug: string, popularity: number) =>
  ({ id: slug, slug, popularity }) as unknown as Problem;

function distribution(candidates: Problem[], draws = 1000) {
  const counts = new Map<string, number>();
  for (let i = 0; i < draws; i++) {
    const picked = weightedPick(candidates);
    counts.set(picked.slug, (counts.get(picked.slug) ?? 0) + 1);
  }
  return counts;
}

describe('weightedPick', () => {
  it('favours the higher-scoring problem without ever excluding the lower one', () => {
    const counts = distribution([problem('loved', 10_000), problem('obscure', 0)]);

    expect(counts.get('loved')!).toBeGreaterThan(counts.get('obscure')!);
    // The point of the floor: unpopular is not unreachable.
    expect(counts.get('obscure') ?? 0).toBeGreaterThan(0);
  });

  /**
   * Newly authored problems have no popularity yet. If weight were proportional
   * to popularity alone they would be weight zero — unreachable — and the
   * corpus could never grow past whatever was ranked first.
   */
  it('still serves problems that have no popularity data at all', () => {
    const counts = distribution([
      problem('ranked', 5_000),
      problem('brand-new-a', 0),
      problem('brand-new-b', 0),
    ]);

    expect(counts.get('brand-new-a') ?? 0).toBeGreaterThan(0);
    expect(counts.get('brand-new-b') ?? 0).toBeGreaterThan(0);
  });

  /**
   * Raw like counts span orders of magnitude. Without the square root a single
   * famous problem takes almost every draw in its tier, and the cooldown spends
   * its life fighting the ranker.
   */
  it('flattens a runaway favourite instead of letting it take the tier', () => {
    const counts = distribution([
      problem('famous', 40_000),
      problem('good-a', 2_000),
      problem('good-b', 2_000),
      problem('good-c', 2_000),
    ]);

    // Weighting by popularity directly would give the famous problem about 87%
    // of draws (40000 / 46000).
    //
    // Since the value ranker landed, popularity is no longer the primary
    // signal — it is a tiebreak *within* a rank bucket, capped at 2x, so an
    // 8-vs-1 bucket spread cannot be swamped by like counts that span orders of
    // magnitude. These fixtures carry no valueScore, so they all sit in one
    // bucket and popularity is the only thing separating them: the famous
    // problem lands near a quarter of draws rather than the old ~60%.
    //
    // It still comes up more often than an unloved one, which is the part worth
    // keeping.
    const famousShare = counts.get('famous')! / 1000;
    expect(famousShare).toBeLessThan(0.45);
    expect(famousShare).toBeGreaterThan(0.2);
    expect(counts.get('famous')!).toBeGreaterThan(counts.get('good-a')!);

    // And none of the others gets squeezed out of the rotation.
    for (const slug of ['good-a', 'good-b', 'good-c']) {
      expect(counts.get(slug) ?? 0).toBeGreaterThan(50);
    }
  });

  it('treats equal scores as a fair coin', () => {
    const counts = distribution([problem('a', 100), problem('b', 100)], 2000);
    const ratio = counts.get('a')! / counts.get('b')!;
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(1.25);
  });

  it('always returns a candidate, including at the extremes of the roll', () => {
    const candidates = [problem('a', 3), problem('b', 7)];
    expect(candidates).toContain(weightedPick(candidates, () => 0));
    expect(candidates).toContain(weightedPick(candidates, () => 0.999999));
    expect(weightedPick([problem('only', 0)], () => 0.5).slug).toBe('only');
  });

  // Negative popularity should never happen, but a bad import must not produce
  // a negative weight that quietly steals draws from its neighbours.
  it('clamps a negative score rather than distorting the distribution', () => {
    const counts = distribution([problem('bad-data', -50), problem('normal', 0)]);
    expect(counts.get('bad-data') ?? 0).toBeGreaterThan(0);
    const ratio = counts.get('bad-data')! / counts.get('normal')!;
    expect(ratio).toBeGreaterThan(0.7);
    expect(ratio).toBeLessThan(1.4);
  });
});
