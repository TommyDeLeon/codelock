import type { Language } from '@prisma/client';
import { env } from '../env.js';

/**
 * The performance gate: correctness alone does not unlock the device.
 *
 * A submission must pass every test case AND run at or under a per-language
 * time budget derived from the best known solution. A working O(n^2) answer to
 * a sliding-window problem passes the tests and still leaves you locked.
 *
 * Two realities shape the formula:
 *
 * 1. **Runtimes are noisy.** Judge0 reports wall-clock CPU time on shared
 *    hardware; the same binary varies by tens of milliseconds run to run. A
 *    literal "must equal the fastest ever" gate would be unwinnable — a
 *    genuinely optimal solution would be rejected on an unlucky sample and the
 *    user would be locked out of their own machine indefinitely. So the gate is
 *    the best known time plus a tolerance band, and the *fastest of N runs* is
 *    what gets measured.
 *
 * 2. **Languages are not comparable.** A JVM cold start is ~100 ms before any
 *    user code executes; an equivalent C++ program finishes in single digits.
 *    A single global budget would make the gate unreachable in Java and free in
 *    C++, so every budget is per language.
 */

export type RuntimeMap = Partial<Record<Language, number>>;

export interface PerformanceVerdict {
  /** Worst-case runtime across test cases, best of N runs, in ms. */
  runtimeMs: number;
  /** The best known time for this problem in this language. */
  targetMs: number;
  /** The budget the user actually had to beat: target * tolerance + floor. */
  gateMs: number;
  passed: boolean;
  /** 1.0 means exactly on target; 2.0 means twice as slow as the best. */
  ratio: number;
  /** UI copy explaining the verdict in one sentence. */
  reason: string;
}

/**
 * The bar to beat. Falls back to the seeded reference when nobody has solved
 * the problem in this language yet, and always takes the faster of the two so
 * the gate ratchets down as people find better solutions.
 */
export function targetRuntimeMs(
  reference: RuntimeMap,
  best: RuntimeMap,
  language: Language,
): number {
  const ref = reference[language];
  const bestSoFar = best[language];

  // No reference for this language: fall back to the slowest reference we have
  // rather than gating on a number that was never calibrated.
  if (ref === undefined) {
    const known = Object.values(reference).filter((n): n is number => typeof n === 'number');
    const fallback = known.length > 0 ? Math.max(...known) : 1_000;
    return bestSoFar === undefined ? fallback : Math.min(fallback, bestSoFar);
  }

  return bestSoFar === undefined ? ref : Math.min(ref, bestSoFar);
}

export function evaluatePerformance(params: {
  runtimeMs: number;
  reference: RuntimeMap;
  best: RuntimeMap;
  language: Language;
}): PerformanceVerdict {
  const targetMs = targetRuntimeMs(params.reference, params.best, params.language);

  // The floor absorbs measurement noise on very fast problems, where a 35%
  // tolerance on an 8 ms target would be a 3 ms band — smaller than the jitter
  // of the judge itself.
  const gateMs = Math.ceil(targetMs * env.PERF_TOLERANCE) + env.PERF_FLOOR_MS;
  const passed = params.runtimeMs <= gateMs;
  const ratio = targetMs === 0 ? 1 : params.runtimeMs / targetMs;

  return {
    runtimeMs: params.runtimeMs,
    targetMs,
    gateMs,
    passed,
    ratio: Number(ratio.toFixed(2)),
    reason: passed
      ? `${params.runtimeMs} ms — within the ${gateMs} ms budget.`
      : `${params.runtimeMs} ms against a ${gateMs} ms budget. Correct, but roughly ` +
        `${ratio.toFixed(1)}x slower than the best known solution. Look for a better algorithm.`,
  };
}

/** Fold a new accepted runtime into the per-language record. */
export function withNewBest(best: RuntimeMap, language: Language, runtimeMs: number): RuntimeMap {
  const current = best[language];
  if (current !== undefined && current <= runtimeMs) return best;
  return { ...best, [language]: runtimeMs };
}

/**
 * Worst case across test cases. The gate is about the algorithm, and only the
 * largest input reveals complexity — averaging would let a fast path on tiny
 * cases hide a quadratic blow-up on the big one.
 */
export function worstCaseRuntime(perCaseMs: number[]): number {
  return perCaseMs.length === 0 ? 0 : Math.max(...perCaseMs);
}

/** Best of N independent measurements, to reject transient scheduler spikes. */
export function bestOfRuns(runs: number[]): number {
  return runs.length === 0 ? 0 : Math.min(...runs);
}
