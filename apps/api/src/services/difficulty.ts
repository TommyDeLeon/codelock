import { Difficulty, DifficultyMode, type UserProgress } from '@prisma/client';

/**
 * Adaptive difficulty.
 *
 * Deliberately a deterministic rule engine, not a model call. The tier decision
 * runs on every graded submission while a user is staring at a lock screen; it
 * has to be instant, free, reproducible, and explainable ("3 fast solves ->
 * promoted"). `DIFFICULTY_MODE=hybrid` layers an LLM on top for *problem
 * selection within a tier*, which is where taste actually helps — see
 * pickProblem() in problems.ts.
 */

/** Promote after this many consecutive fast solves at the current tier. */
export const PROMOTE_AFTER_FAST_SOLVES = 3;
/** Demote after this many consecutive failed sessions at the current tier. */
export const DEMOTE_AFTER_FAILURES = 2;
/** A solve counts as "fast" at or under this fraction of the problem average. */
export const FAST_SOLVE_RATIO = 1.0;
/** Weight of the newest sample in the solve-time EMA. */
const EMA_ALPHA = 0.3;

const LADDER: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

const step = (d: Difficulty, delta: number): Difficulty => {
  const i = LADDER.indexOf(d);
  return LADDER[Math.min(LADDER.length - 1, Math.max(0, i + delta))]!;
};

export interface SessionOutcome {
  solved: boolean;
  /** Seconds from lock start to the accepted submission. Absent when failed. */
  elapsedSeconds?: number;
  /** Community average for the problem that was served. */
  problemAvgSeconds: number;
  /** True when the very first submission of the session was accepted. */
  firstTry: boolean;
  /**
   * True when the learner changed the problem during this session.
   *
   * The ladder is a measurement engine: consecutive fast solves promote,
   * consecutive failures demote, and both readings assume the session measured
   * one problem chosen for the learner. Once they can ask for a smaller or a
   * larger one mid-lock, that assumption is gone — the clock still runs from
   * the original lock, and the problem at the end is one they picked.
   *
   * So an adjusted session is counted but not read. The solve or the failure
   * goes into the totals, because it happened, and nothing else moves: no
   * promotion, no demotion, no streak change, and no contribution to the
   * solve-time or first-try averages.
   *
   * The alternative is worse in both directions. Counted normally, "this is
   * too easy" becomes a way to farm promotions, and "this is too hard" becomes
   * a demotion for saying so — a punishment for telling the truth, which is
   * the mechanism this product rules out.
   */
  adjusted?: boolean;
  /**
   * True when the session was armed under a manual difficulty focus, read
   * from the session's own snapshot rather than the current preference.
   *
   * Treated like `adjusted`: counted in the totals, never read by the ladder.
   * The learner picked the band, so a solve there is not evidence the
   * automatic tier should move, and a failure at a level they chose to try
   * must not cost them the tier they had earned.
   */
  manualFocus?: boolean;
}

/**
 * The difficulty a newly armed lock should use. Pure, so the one rule that
 * decides it is testable without a database.
 *
 * A MANUAL mode with no focus cannot be stored (the API and a CHECK
 * constraint both refuse it), but if one ever arrives it falls back to the
 * automatic tier rather than guessing.
 */
export function resolveDifficulty(
  automatic: Difficulty | null | undefined,
  preference: { difficultyMode: DifficultyMode; focusDifficulty: Difficulty | null } | null | undefined,
): { difficulty: Difficulty; source: DifficultyMode } {
  if (preference?.difficultyMode === DifficultyMode.MANUAL && preference.focusDifficulty) {
    return { difficulty: preference.focusDifficulty, source: DifficultyMode.MANUAL };
  }
  return { difficulty: automatic ?? Difficulty.EASY, source: DifficultyMode.AUTOMATIC };
}

export interface ProgressUpdate {
  currentDifficulty: Difficulty;
  consecutiveFastSolves: number;
  consecutiveFailures: number;
  totalSolved: number;
  totalFailed: number;
  emaSolveSeconds: number;
  firstTryRate: number;
  lastPromotedAt?: Date;
  lastDemotedAt?: Date;
  /** For the UI: "Promoted to Medium — 3 fast solves in a row." */
  transition: 'promoted' | 'demoted' | 'held';
  reason: string;
}

/**
 * Pure. Given current progress and how the session went, return the next
 * progress row. No I/O, so it is trivially unit-testable — and it is the one
 * piece of logic where a bug silently makes the whole product feel wrong.
 */
export function applyOutcome(progress: UserProgress, outcome: SessionOutcome): ProgressUpdate {
  const now = new Date();

  if (outcome.manualFocus && !outcome.adjusted) {
    return {
      ...held(progress, outcome),
      reason: outcome.solved
        ? 'Solved during a focus session. It counts toward your totals; your automatic level stays where it was.'
        : 'Focus sessions never lower your automatic level.',
    };
  }

  if (outcome.adjusted) {
    return {
      currentDifficulty: progress.currentDifficulty,
      consecutiveFastSolves: progress.consecutiveFastSolves,
      consecutiveFailures: progress.consecutiveFailures,
      totalSolved: progress.totalSolved + (outcome.solved ? 1 : 0),
      totalFailed: progress.totalFailed + (outcome.solved ? 0 : 1),
      emaSolveSeconds: progress.emaSolveSeconds,
      firstTryRate: progress.firstTryRate,
      transition: 'held',
      reason: outcome.solved
        ? 'Solved a problem you chose yourself, so it counts but does not move the level.'
        : 'You changed problems this session, so this does not count against your level.',
    };
  }


  if (!outcome.solved) {
    const failures = progress.consecutiveFailures + 1;
    const shouldDemote =
      failures >= DEMOTE_AFTER_FAILURES && progress.currentDifficulty !== Difficulty.EASY;
    const next = shouldDemote ? step(progress.currentDifficulty, -1) : progress.currentDifficulty;

    return {
      currentDifficulty: next,
      // Both counters reset on a tier change: the streak belongs to the tier.
      consecutiveFastSolves: 0,
      consecutiveFailures: shouldDemote ? 0 : failures,
      totalSolved: progress.totalSolved,
      totalFailed: progress.totalFailed + 1,
      emaSolveSeconds: progress.emaSolveSeconds,
      firstTryRate: ema(progress.firstTryRate, 0),
      ...(shouldDemote ? { lastDemotedAt: now } : {}),
      transition: shouldDemote ? 'demoted' : 'held',
      reason: shouldDemote
        ? `${failures} failed sessions in a row — easing back to ${next.toLowerCase()}.`
        : `Failed session ${failures}/${DEMOTE_AFTER_FAILURES} at ${progress.currentDifficulty.toLowerCase()}.`,
    };
  }

  const elapsed = outcome.elapsedSeconds ?? outcome.problemAvgSeconds;
  const wasFast = elapsed <= outcome.problemAvgSeconds * FAST_SOLVE_RATIO;
  const fastStreak = wasFast ? progress.consecutiveFastSolves + 1 : 0;
  const shouldPromote =
    fastStreak >= PROMOTE_AFTER_FAST_SOLVES && progress.currentDifficulty !== Difficulty.HARD;
  const next = shouldPromote ? step(progress.currentDifficulty, 1) : progress.currentDifficulty;

  return {
    currentDifficulty: next,
    consecutiveFastSolves: shouldPromote ? 0 : fastStreak,
    consecutiveFailures: 0,
    totalSolved: progress.totalSolved + 1,
    totalFailed: progress.totalFailed,
    emaSolveSeconds: Math.round(
      progress.emaSolveSeconds * (1 - EMA_ALPHA) + elapsed * EMA_ALPHA,
    ),
    firstTryRate: ema(progress.firstTryRate, outcome.firstTry ? 1000 : 0),
    ...(shouldPromote ? { lastPromotedAt: now } : {}),
    transition: shouldPromote ? 'promoted' : 'held',
    reason: shouldPromote
      ? `${PROMOTE_AFTER_FAST_SOLVES} fast solves in a row — stepping up to ${next.toLowerCase()}.`
      : wasFast
        ? `Fast solve ${fastStreak}/${PROMOTE_AFTER_FAST_SOLVES} at ${progress.currentDifficulty.toLowerCase()}.`
        : `Solved, but over the ${Math.round(outcome.problemAvgSeconds / 60)} min average — streak reset.`,
  };
}

/** Totals move, nothing the ladder reads does. */
function held(progress: UserProgress, outcome: SessionOutcome): ProgressUpdate {
  return {
    currentDifficulty: progress.currentDifficulty,
    consecutiveFastSolves: progress.consecutiveFastSolves,
    consecutiveFailures: progress.consecutiveFailures,
    totalSolved: progress.totalSolved + (outcome.solved ? 1 : 0),
    totalFailed: progress.totalFailed + (outcome.solved ? 0 : 1),
    emaSolveSeconds: progress.emaSolveSeconds,
    firstTryRate: progress.firstTryRate,
    transition: 'held',
    reason: '',
  };
}

function ema(current: number, sample: number): number {
  return Math.round(current * (1 - EMA_ALPHA) + sample * EMA_ALPHA);
}
