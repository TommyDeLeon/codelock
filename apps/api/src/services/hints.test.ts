import { describe, expect, it } from 'vitest';
import { HINT_COUNT, hintAt, hintsFor } from './hints.js';

/**
 * The contract the corpus depends on: every problem has three hints, whether
 * or not anyone has written any.
 *
 * Authoring 2,000 hints across ~695 problems was never going to happen before
 * the feature shipped, so the derived set is not a fallback in the apologetic
 * sense — it is the normal case, and an authored trio is the exception that
 * overrides it.
 */
const problem = (over: Partial<Parameters<typeof hintsFor>[0]> = {}) => ({
  hints: [] as string[],
  patternFamily: 'TWO_POINTERS' as const,
  patternTags: [] as string[],
  ...over,
});

describe('hintsFor', () => {
  it('always returns exactly three hints', () => {
    expect(hintsFor(problem())).toHaveLength(HINT_COUNT);
  });

  it('derives from the pattern family when nothing is authored', () => {
    const hints = hintsFor(problem({ patternFamily: 'SLIDING_WINDOW' }));
    expect(hints[0]).toContain('contiguous');
    expect(hints.every((h) => h.length > 0)).toBe(true);
  });

  it('never hands back code', () => {
    // A hint that writes the solution is the editorial, which is gated behind
    // the solve for a reason.
    for (const family of ['DP_1D', 'GRAPHS', 'FOUNDATIONS', 'BIT_MANIPULATION'] as const) {
      for (const hint of hintsFor(problem({ patternFamily: family }))) {
        expect(hint).not.toMatch(/[;{}]|=>|def |return /);
      }
    }
  });

  it('sharpens the middle hint with the problem’s own tag', () => {
    const generic = hintsFor(problem({ patternFamily: 'ARRAYS_HASHING' }));
    const tagged = hintsFor(problem({ patternFamily: 'ARRAYS_HASHING', patternTags: ['kadane'] }));

    expect(tagged[1]).not.toBe(generic[1]);
    expect(tagged[1]).toContain('best run ending here');
    // Only the middle one is specialised; the bookends stay family-level.
    expect(tagged[0]).toBe(generic[0]);
    expect(tagged[2]).toBe(generic[2]);
  });

  it('ignores tags it has nothing to say about', () => {
    const generic = hintsFor(problem({ patternFamily: 'STACK' }));
    expect(hintsFor(problem({ patternFamily: 'STACK', patternTags: ['no-such-tag'] }))).toEqual(
      generic,
    );
  });

  it('lets authored hints win, position by position', () => {
    // Partial authoring is honoured rather than thrown away: someone who wrote
    // a good first hint and stopped should get it, plus derived seconds and
    // thirds — not all-or-nothing.
    const derived = hintsFor(problem({ patternFamily: 'TREES' }));
    const hints = hintsFor(problem({ patternFamily: 'TREES', hints: ['Recurse on children.'] }));

    expect(hints[0]).toBe('Recurse on children.');
    expect(hints[1]).toBe(derived[1]);
    expect(hints[2]).toBe(derived[2]);
  });

  it('treats a blank authored hint as unwritten', () => {
    const derived = hintsFor(problem({ patternFamily: 'GREEDY' }));
    expect(hintsFor(problem({ patternFamily: 'GREEDY', hints: ['   ', ''] }))).toEqual(derived);
  });
});

describe('hintAt', () => {
  it('returns the hint at a valid index', () => {
    expect(hintAt(problem(), 0)).toBe(hintsFor(problem())[0]);
    expect(hintAt(problem(), 2)).toBe(hintsFor(problem())[2]);
  });

  it('refuses an index outside the trio', () => {
    // The route turns null into a 400. A fourth hint does not exist, and
    // silently wrapping round to the first would be worse than saying so.
    expect(hintAt(problem(), 3)).toBeNull();
    expect(hintAt(problem(), -1)).toBeNull();
    expect(hintAt(problem(), 1.5)).toBeNull();
  });
});
