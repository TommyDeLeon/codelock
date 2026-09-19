import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Difficulty, DifficultyMode, type UserProgress } from '@prisma/client';
import { PROMOTE_AFTER_FAST_SOLVES, applyOutcome, resolveDifficulty } from './difficulty.js';
import { difficultyFocusSchema, timerConfigSchema } from '../validation/schemas.js';

/**
 * The difficulty-focus rules that need no database: which band a new lock
 * asks for, how a focus session is read by the ladder, and what the API
 * boundary accepts. Persistence, arming and grading wiring are covered in
 * difficultyFocus.dbtest.ts.
 */

const progress = (over: Partial<UserProgress> = {}): UserProgress =>
  ({
    userId: 'u1',
    currentDifficulty: Difficulty.MEDIUM,
    consecutiveFastSolves: 2,
    consecutiveFailures: 1,
    totalSolved: 9,
    totalFailed: 4,
    emaSolveSeconds: 300,
    firstTryRate: 500,
    lastPromotedAt: null,
    lastDemotedAt: null,
    updatedAt: new Date(),
    ...over,
  }) as unknown as UserProgress;

const LADDER_FIELDS = [
  'currentDifficulty',
  'consecutiveFastSolves',
  'consecutiveFailures',
  'emaSolveSeconds',
  'firstTryRate',
] as const;

describe('resolveDifficulty', () => {
  it('defaults to the automatic tier when there is no preference at all', () => {
    assert.deepEqual(resolveDifficulty(Difficulty.MEDIUM, null), {
      difficulty: Difficulty.MEDIUM,
      source: DifficultyMode.AUTOMATIC,
    });
    assert.deepEqual(resolveDifficulty(undefined, undefined), {
      difficulty: Difficulty.EASY,
      source: DifficultyMode.AUTOMATIC,
    });
  });

  it('AUTOMATIC reads the ladder, whatever focus might be lying around', () => {
    const r = resolveDifficulty(Difficulty.EASY, {
      difficultyMode: DifficultyMode.AUTOMATIC,
      focusDifficulty: Difficulty.HARD,
    });
    assert.deepEqual(r, { difficulty: Difficulty.EASY, source: DifficultyMode.AUTOMATIC });
  });

  for (const focus of [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]) {
    it(`MANUAL ${focus} uses the focus regardless of the automatic tier`, () => {
      const r = resolveDifficulty(Difficulty.MEDIUM, {
        difficultyMode: DifficultyMode.MANUAL,
        focusDifficulty: focus,
      });
      assert.deepEqual(r, { difficulty: focus, source: DifficultyMode.MANUAL });
    });
  }

  it('an incoherent MANUAL with no focus falls back to automatic', () => {
    const r = resolveDifficulty(Difficulty.HARD, {
      difficultyMode: DifficultyMode.MANUAL,
      focusDifficulty: null,
    });
    assert.deepEqual(r, { difficulty: Difficulty.HARD, source: DifficultyMode.AUTOMATIC });
  });
});

describe('a focus session is counted but never moves the automatic ladder', () => {
  it('a fast solve that would have promoted counts, and promotes nothing', () => {
    const before = progress({ consecutiveFastSolves: PROMOTE_AFTER_FAST_SOLVES - 1 });
    const after = applyOutcome(before, {
      solved: true,
      elapsedSeconds: 10,
      problemAvgSeconds: 600,
      firstTry: true,
      manualFocus: true,
    });
    for (const f of LADDER_FIELDS) assert.equal(after[f], before[f], f);
    assert.equal(after.totalSolved, before.totalSolved + 1);
    assert.equal(after.totalFailed, before.totalFailed);
    assert.equal(after.transition, 'held');
    assert.equal(after.lastPromotedAt, undefined);
  });

  it('a failure that would have demoted counts, and demotes nothing', () => {
    const before = progress({ currentDifficulty: Difficulty.HARD, consecutiveFailures: 1 });
    const after = applyOutcome(before, {
      solved: false,
      problemAvgSeconds: 600,
      firstTry: false,
      manualFocus: true,
    });
    for (const f of LADDER_FIELDS) assert.equal(after[f], before[f], f);
    assert.equal(after.totalFailed, before.totalFailed + 1);
    assert.equal(after.transition, 'held');
    assert.equal(after.lastDemotedAt, undefined);
  });

  it('adjusted and focused together is still held', () => {
    const before = progress();
    const after = applyOutcome(before, {
      solved: true,
      elapsedSeconds: 10,
      problemAvgSeconds: 600,
      firstTry: true,
      manualFocus: true,
      adjusted: true,
    });
    for (const f of LADDER_FIELDS) assert.equal(after[f], before[f], f);
    assert.equal(after.transition, 'held');
  });

  it('without the flag, the ladder behaves exactly as before', () => {
    const before = progress({ consecutiveFastSolves: PROMOTE_AFTER_FAST_SOLVES - 1 });
    const after = applyOutcome(before, {
      solved: true,
      elapsedSeconds: 10,
      problemAvgSeconds: 600,
      firstTry: true,
    });
    assert.equal(after.transition, 'promoted');
    assert.equal(after.currentDifficulty, Difficulty.HARD);
  });
});

describe('PUT /settings/difficulty accepts only coherent input', () => {
  const ok = (v: unknown) => difficultyFocusSchema.safeParse(v).success;

  it('accepts Automatic and each manual band', () => {
    assert.ok(ok({ mode: 'AUTOMATIC' }));
    for (const d of ['EASY', 'MEDIUM', 'HARD']) assert.ok(ok({ mode: 'MANUAL', difficulty: d }));
  });

  it('rejects a manual mode without a band, a band under automatic, and junk', () => {
    assert.ok(!ok({ mode: 'MANUAL' }));
    assert.ok(!ok({ mode: 'AUTOMATIC', difficulty: 'HARD' }));
    assert.ok(!ok({ mode: 'MANUAL', difficulty: 'EXPERT' }));
    assert.ok(!ok({ mode: 'MANUAL', difficulty: 'hard' }));
    assert.ok(!ok({ mode: 'FOCUS', difficulty: 'HARD' }));
    assert.ok(!ok({ difficulty: 'HARD' }));
    assert.ok(!ok({ mode: 'MANUAL', difficulty: 'HARD', currentDifficulty: 'HARD' }));
    assert.ok(!ok(null));
  });

  it('the timer PATCH cannot be used to set the focus behind the validator', () => {
    const parsed = timerConfigSchema.parse({ difficultyMode: 'MANUAL', focusDifficulty: 'HARD' });
    assert.deepEqual(parsed, {});
  });
});
