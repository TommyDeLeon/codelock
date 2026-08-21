import { describe, expect, it } from 'vitest';
import {
  bestOfRuns,
  evaluatePerformance,
  targetRuntimeMs,
  withNewBest,
  worstCaseRuntime,
} from './performance.js';

// Mirrors the defaults in env.ts (tolerance 1.35, floor 40 ms).
const reference = { JAVASCRIPT: 100, CPP: 8, JAVA: 130 } as const;

describe('targetRuntimeMs', () => {
  it('uses the seeded reference when nobody has solved it yet', () => {
    expect(targetRuntimeMs(reference, {}, 'JAVASCRIPT')).toBe(100);
  });

  it('ratchets down to a user-set record', () => {
    expect(targetRuntimeMs(reference, { JAVASCRIPT: 60 }, 'JAVASCRIPT')).toBe(60);
  });

  it('ignores a record slower than the reference', () => {
    expect(targetRuntimeMs(reference, { JAVASCRIPT: 250 }, 'JAVASCRIPT')).toBe(100);
  });

  it('falls back to the slowest known reference for an uncalibrated language', () => {
    // GO has no reference here; gating it on C++'s 8 ms would be unwinnable.
    expect(targetRuntimeMs(reference, {}, 'GO')).toBe(130);
  });
});

describe('evaluatePerformance', () => {
  it('passes a solution at the target', () => {
    const v = evaluatePerformance({ runtimeMs: 100, reference, best: {}, language: 'JAVASCRIPT' });
    expect(v.passed).toBe(true);
    expect(v.gateMs).toBe(Math.ceil(100 * 1.35) + 40); // 175
  });

  it('passes a solution inside the tolerance band', () => {
    const v = evaluatePerformance({ runtimeMs: 170, reference, best: {}, language: 'JAVASCRIPT' });
    expect(v.passed).toBe(true);
  });

  it('rejects a correct but algorithmically slower solution', () => {
    const v = evaluatePerformance({ runtimeMs: 900, reference, best: {}, language: 'JAVASCRIPT' });
    expect(v.passed).toBe(false);
    expect(v.ratio).toBe(9);
    expect(v.reason).toMatch(/better algorithm/);
  });

  it('keeps very fast problems winnable via the noise floor', () => {
    // 8 ms target: a 35% band alone would be 3 ms, far below judge jitter.
    const v = evaluatePerformance({ runtimeMs: 45, reference, best: {}, language: 'CPP' });
    expect(v.gateMs).toBe(51);
    expect(v.passed).toBe(true);
  });

  it('gets harder once someone sets a record', () => {
    const before = evaluatePerformance({
      runtimeMs: 150,
      reference,
      best: {},
      language: 'JAVASCRIPT',
    });
    const after = evaluatePerformance({
      runtimeMs: 150,
      reference,
      best: { JAVASCRIPT: 50 },
      language: 'JAVASCRIPT',
    });
    expect(before.passed).toBe(true);
    expect(after.passed).toBe(false);
  });
});

describe('measurement', () => {
  it('takes the worst case across test cases, not the average', () => {
    // The big hidden case is the only one that exposes quadratic behaviour.
    expect(worstCaseRuntime([5, 6, 5, 800])).toBe(800);
  });

  it('takes the fastest of repeated runs', () => {
    expect(bestOfRuns([220, 95])).toBe(95);
  });

  it('only records a new best when it is actually faster', () => {
    expect(withNewBest({ CPP: 10 }, 'CPP', 14)).toEqual({ CPP: 10 });
    expect(withNewBest({ CPP: 10 }, 'CPP', 7)).toEqual({ CPP: 7 });
    expect(withNewBest({}, 'GO', 5)).toEqual({ GO: 5 });
  });
});
