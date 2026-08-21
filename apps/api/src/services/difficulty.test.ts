import { describe, expect, it } from 'vitest';
import { Difficulty, type UserProgress } from '@prisma/client';
import { applyOutcome, DEMOTE_AFTER_FAILURES, PROMOTE_AFTER_FAST_SOLVES } from './difficulty.js';

const progress = (over: Partial<UserProgress> = {}): UserProgress =>
  ({
    id: 'p',
    userId: 'u',
    currentDifficulty: Difficulty.EASY,
    consecutiveFastSolves: 0,
    consecutiveFailures: 0,
    totalSolved: 0,
    totalFailed: 0,
    emaSolveSeconds: 600,
    firstTryRate: 500,
    lastPromotedAt: null,
    lastDemotedAt: null,
    updatedAt: new Date(),
    ...over,
  }) as UserProgress;

const fastSolve = { solved: true as const, elapsedSeconds: 200, problemAvgSeconds: 600, firstTry: true };
const slowSolve = { solved: true as const, elapsedSeconds: 900, problemAvgSeconds: 600, firstTry: false };
const failure = { solved: false as const, problemAvgSeconds: 600, firstTry: false };

describe('promotion', () => {
  it('promotes after three consecutive fast solves', () => {
    const before = progress({ consecutiveFastSolves: PROMOTE_AFTER_FAST_SOLVES - 1 });
    const after = applyOutcome(before, fastSolve);

    expect(after.currentDifficulty).toBe(Difficulty.MEDIUM);
    expect(after.transition).toBe('promoted');
    // Streak resets so the next tier earns its own three.
    expect(after.consecutiveFastSolves).toBe(0);
  });

  it('does not promote on the second fast solve', () => {
    const after = applyOutcome(progress({ consecutiveFastSolves: 1 }), fastSolve);
    expect(after.currentDifficulty).toBe(Difficulty.EASY);
    expect(after.consecutiveFastSolves).toBe(2);
  });

  it('resets the streak on a slow solve', () => {
    const after = applyOutcome(progress({ consecutiveFastSolves: 2 }), slowSolve);
    expect(after.consecutiveFastSolves).toBe(0);
    expect(after.totalSolved).toBe(1);
    expect(after.transition).toBe('held');
  });

  it('never climbs past HARD', () => {
    const before = progress({
      currentDifficulty: Difficulty.HARD,
      consecutiveFastSolves: PROMOTE_AFTER_FAST_SOLVES + 5,
    });
    expect(applyOutcome(before, fastSolve).currentDifficulty).toBe(Difficulty.HARD);
  });
});

describe('demotion', () => {
  it('drops to EASY after two failures at MEDIUM', () => {
    const before = progress({
      currentDifficulty: Difficulty.MEDIUM,
      consecutiveFailures: DEMOTE_AFTER_FAILURES - 1,
    });
    const after = applyOutcome(before, failure);

    expect(after.currentDifficulty).toBe(Difficulty.EASY);
    expect(after.transition).toBe('demoted');
    expect(after.consecutiveFailures).toBe(0);
  });

  it('holds at EASY — there is no floor below it', () => {
    const before = progress({ consecutiveFailures: 5 });
    const after = applyOutcome(before, failure);
    expect(after.currentDifficulty).toBe(Difficulty.EASY);
    expect(after.transition).toBe('held');
  });

  it('clears the fast-solve streak on any failure', () => {
    const after = applyOutcome(progress({ consecutiveFastSolves: 2 }), failure);
    expect(after.consecutiveFastSolves).toBe(0);
  });
});

describe('metrics', () => {
  it('moves the solve-time EMA toward the new sample', () => {
    const after = applyOutcome(progress({ emaSolveSeconds: 600 }), fastSolve);
    expect(after.emaSolveSeconds).toBeGreaterThan(200);
    expect(after.emaSolveSeconds).toBeLessThan(600);
  });

  it('treats a solve exactly at the average as fast', () => {
    const after = applyOutcome(progress(), {
      solved: true,
      elapsedSeconds: 600,
      problemAvgSeconds: 600,
      firstTry: true,
    });
    expect(after.consecutiveFastSolves).toBe(1);
  });
});
