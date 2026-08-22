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

/**
 * The budget derived from a target time.
 *
 * The floor absorbs measurement noise on very fast problems, where a 35%
 * tolerance on an 8 ms target would be a 3 ms band — smaller than the jitter of
 * the judge itself.
 */
export function gateFor(targetMs: number): number {
  return Math.ceil(targetMs * env.PERF_TOLERANCE) + env.PERF_FLOOR_MS;
}

export function evaluatePerformance(params: {
  runtimeMs: number;
  reference: RuntimeMap;
  best: RuntimeMap;
  language: Language;
}): PerformanceVerdict {
  const targetMs = targetRuntimeMs(params.reference, params.best, params.language);

  const gateMs = gateFor(targetMs);
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

/**
 * Where one correct run stands: against the record, and against the user's own
 * previous attempt at the same problem.
 *
 * These are the three numbers the interface is allowed to celebrate, and all
 * three are measurements rather than points. `ratio` is the rank readout,
 * `personalBestDeltaMs` is the private one, and `recordBroken` is the only
 * event rare enough to earn a moment of its own — it moves the budget for
 * everyone who attempts the problem afterwards.
 */
export interface SolveStanding {
  /** The best known time before this run, i.e. the bar it was measured against. */
  bestKnownMs: number;
  /** runtimeMs / bestKnownMs. 1.24 means 24% off the record. */
  ratio: number;
  /** The user's own fastest correct run before this one, if there was one. */
  previousBestMs: number | null;
  /** Signed: negative is an improvement. Null when there was no previous run. */
  personalBestDeltaMs: number | null;
  /** This run is the user's fastest correct answer to this problem so far. */
  personalBest: boolean;
  /** This run beat the global record, so the gate just moved for everyone. */
  recordBroken: boolean;
  /** The budget every future solver now faces. Null unless the record broke. */
  newGateMs: number | null;
}

export function evaluateStanding(params: {
  runtimeMs: number;
  /** Best known before this submission — evaluatePerformance's targetMs. */
  bestKnownMs: number;
  /** The user's fastest prior correct run on this problem in this language. */
  previousBestMs: number | null;
  /** Whether the run cleared the gate. Only an accepted run moves the record. */
  accepted: boolean;
}): SolveStanding {
  const { runtimeMs, bestKnownMs, previousBestMs, accepted } = params;
  const recordBroken = accepted && runtimeMs < bestKnownMs;

  return {
    bestKnownMs,
    ratio: bestKnownMs === 0 ? 1 : Number((runtimeMs / bestKnownMs).toFixed(2)),
    previousBestMs,
    // A first solve has nothing to improve on. Reporting a delta of zero there
    // would read as "no progress" rather than "no comparison".
    personalBestDeltaMs: previousBestMs === null ? null : runtimeMs - previousBestMs,
    // Deliberately not gated on `accepted`: beating your own time by 40 ms is
    // worth stating even when the answer is still too slow to unlock.
    personalBest: previousBestMs === null || runtimeMs < previousBestMs,
    recordBroken,
    newGateMs: recordBroken ? gateFor(runtimeMs) : null,
  };
}
