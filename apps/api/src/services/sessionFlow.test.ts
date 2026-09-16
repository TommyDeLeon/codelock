import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Difficulty, type UserProgress } from '@prisma/client';
import { DEMOTE_AFTER_FAILURES, PROMOTE_AFTER_FAST_SOLVES, applyOutcome } from './difficulty.js';
import { ACTIVITY_RESPONSE_LIMIT, bandFor, rankReplacements, rungsFor, scoreForRequest } from './sessionFlow.js';
import { restate } from './restate.js';
import {
  advanceSkillState,
  emptySkillSnapshot,
  type SkillProblem,
  type SkillSnapshot,
} from './skills.js';

/**
 * Tests for the session-flow controls.
 *
 * The decision rules are pure and tested here. What is *not* covered, recorded
 * as such rather than implied: `swapProblem`, `offerActivity` and
 * `completeActivity` all query and write, so their persistence, their
 * conditional transitions and their races need a disposable database.
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

const problem = (over: Partial<SkillProblem> = {}): SkillProblem => ({
  signatureId: 'fn:int->int',
  patternTags: ['arithmetic'],
  tier: 'TIER_0',
  patternFamily: 'FOUNDATIONS',
  ...over,
});

describe('an adjusted session is counted but not measured', () => {
  /** Every field the ladder reads, so a leak anywhere is caught. */
  const LADDER_FIELDS = [
    'currentDifficulty',
    'consecutiveFastSolves',
    'consecutiveFailures',
    'emaSolveSeconds',
    'firstTryRate',
  ] as const;

  it('records the solve and moves nothing else', () => {
    const before = progress();
    const after = applyOutcome(before, {
      solved: true,
      elapsedSeconds: 1,
      problemAvgSeconds: 600,
      firstTry: true,
      adjusted: true,
    });

    assert.equal(after.totalSolved, before.totalSolved + 1, 'the solve happened and must count');
    for (const field of LADDER_FIELDS) {
      assert.deepEqual(after[field], before[field], `${field} must not move`);
    }
    assert.equal(after.transition, 'held');
    assert.equal(after.lastPromotedAt, undefined);
  });

  it('cannot be used to farm a promotion', () => {
    // Without this rule, "this is too easy" plus a fast first-try solve is a
    // free step up the ladder, one click away, repeatable.
    const onePromotionAway = progress({ consecutiveFastSolves: PROMOTE_AFTER_FAST_SOLVES - 1 });
    const after = applyOutcome(onePromotionAway, {
      solved: true,
      elapsedSeconds: 1,
      problemAvgSeconds: 3600,
      firstTry: true,
      adjusted: true,
    });

    assert.equal(after.transition, 'held');
    assert.equal(after.currentDifficulty, onePromotionAway.currentDifficulty);
    assert.equal(after.consecutiveFastSolves, onePromotionAway.consecutiveFastSolves);
  });

  it('cannot demote someone for saying a problem was too hard', () => {
    // The case that matters most: one failure from a demotion, then a swap and
    // a failure. Telling the truth must not cost a level.
    const oneFailureAway = progress({
      consecutiveFailures: DEMOTE_AFTER_FAILURES - 1,
      currentDifficulty: Difficulty.HARD,
    });
    const after = applyOutcome(oneFailureAway, {
      solved: false,
      problemAvgSeconds: 600,
      firstTry: false,
      adjusted: true,
    });

    assert.equal(after.transition, 'held');
    assert.equal(after.currentDifficulty, Difficulty.HARD);
    assert.equal(after.consecutiveFailures, oneFailureAway.consecutiveFailures);
    assert.equal(after.totalFailed, oneFailureAway.totalFailed + 1, 'it still happened');
    assert.equal(after.lastDemotedAt, undefined);
  });

  it('still demotes an ordinary session, so the protection is not blanket', () => {
    const oneFailureAway = progress({
      consecutiveFailures: DEMOTE_AFTER_FAILURES - 1,
      currentDifficulty: Difficulty.HARD,
    });
    const after = applyOutcome(oneFailureAway, {
      solved: false,
      problemAvgSeconds: 600,
      firstTry: false,
    });
    assert.equal(after.transition, 'demoted');
  });

  it('says nothing about levels or streaks in its message', () => {
    const after = applyOutcome(progress(), {
      solved: false,
      problemAvgSeconds: 600,
      firstTry: false,
      adjusted: true,
    });
    assert.ok(!/reset|demot|fail/i.test(after.reason), after.reason);
  });
});

describe('which band a request looks in', () => {
  it('steps down for too hard and up for too easy', () => {
    assert.equal(bandFor(Difficulty.MEDIUM, 'too_hard'), Difficulty.EASY);
    assert.equal(bandFor(Difficulty.MEDIUM, 'too_easy'), Difficulty.HARD);
  });

  it('stays inside the ladder at both ends', () => {
    assert.equal(bandFor(Difficulty.EASY, 'too_hard'), Difficulty.EASY);
    assert.equal(bandFor(Difficulty.HARD, 'too_easy'), Difficulty.HARD);
  });

  it('looks only in the band asked for, never falling back to the current one', () => {
    // The defect review found: "too hard" on MEDIUM with no suitable EASY
    // problem quietly served another MEDIUM. It must refuse instead.
    // Exactly one rung, in the band asked for. The deep equality is the whole
    // claim: a second rung in the current band is precisely the defect.
    const rungs = rungsFor(bandFor(Difficulty.MEDIUM, 'too_hard'), Difficulty.MEDIUM);
    assert.deepEqual(rungs, [{ band: Difficulty.EASY, sameBand: false }]);
  });

  it('offers the same band only at the end of the ladder, and says so', () => {
    const floor = rungsFor(bandFor(Difficulty.EASY, 'too_hard'), Difficulty.EASY);
    const ceiling = rungsFor(bandFor(Difficulty.HARD, 'too_easy'), Difficulty.HARD);
    assert.deepEqual(floor, [{ band: Difficulty.EASY, sameBand: true }]);
    assert.deepEqual(ceiling, [{ band: Difficulty.HARD, sameBand: true }]);
  });
});

describe('what each request prefers', () => {
  const ready = (): SkillSnapshot => {
    const snap = emptySkillSnapshot();
    for (const skill of ['values', 'comparisons', 'strings', 'indexing'] as const) {
      snap[skill] = advanceSkillState(advanceSkillState(snap[skill], false), false);
    }
    return snap;
  };

  const small = problem({ patternTags: ['arithmetic'] });
  const large = problem({ signatureId: 'fn:ints,int->int', patternTags: ['loops', 'arrays'] });

  it('prefers the smaller problem when the learner said too hard', () => {
    const snap = ready();
    assert.ok(
      scoreForRequest(small, snap, 'too_hard') > scoreForRequest(large, snap, 'too_hard'),
      'too_hard should rank the problem with fewer skills higher',
    );
  });

  it('prefers the problem with a new idea when the learner said too easy', () => {
    const snap = ready();
    assert.ok(
      scoreForRequest(large, snap, 'too_easy') > scoreForRequest(small, snap, 'too_easy'),
      'too_easy should rank the problem that introduces something higher',
    );
  });

  it('ranks the two requests in opposite directions', () => {
    const snap = ready();
    const hard = scoreForRequest(small, snap, 'too_hard') - scoreForRequest(large, snap, 'too_hard');
    const easy = scoreForRequest(small, snap, 'too_easy') - scoreForRequest(large, snap, 'too_easy');
    assert.ok(hard > 0 && easy < 0, 'one control must not be a slower version of the other');
  });
});

describe('saying the problem a different way', () => {
  const sample = { stdin: '1234', expectedStdout: '4' };

  it('names what goes in and what comes out', () => {
    const text = restate({ title: 'The Last Digit', signatureId: 'fn:int->int' }, [sample]);
    assert.ok(text.includes('a whole number'), text);
    assert.ok(text.includes('1234'), 'the real example belongs in it');
    assert.ok(text.includes('`4`'), text);
  });

  it('reads a two-argument signature as two things', () => {
    const text = restate({ title: 'Pair Sum', signatureId: 'fn:ints,int->int' }, []);
    assert.ok(text.includes('a list of whole numbers'), text);
    assert.ok(text.includes('a whole number'), text);
  });

  it('tells a yes-or-no problem that it can stop early', () => {
    const text = restate({ title: 'Is Sorted', signatureId: 'fn:ints->bool' }, []);
    assert.ok(text.includes('yes or no'), text);
  });

  it('explains that a class problem is a script of operations', () => {
    const text = restate({ title: 'Hash Map', signatureId: 'cls:hash-map' }, []);
    assert.ok(text.includes('instructions'), text);
    assert.ok(!text.includes('You are given a'), 'a class problem is not one call');
  });

  it('says something honest when the signature means nothing to it', () => {
    const text = restate({ title: 'Mystery', signatureId: 'weird' }, []);
    assert.ok(text.length > 0, 'a control that renders nothing is worse than one that admits it');
  });

  it('handles an expected output of nothing without claiming a value', () => {
    const text = restate({ title: 'Silent', signatureId: 'fn:int->int' }, [
      { stdin: '0', expectedStdout: '' },
    ]);
    assert.ok(text.includes('nothing is printed'), text);
  });

  it('does not quote an input too long to read', () => {
    const long = Array.from({ length: 60 }, (_, i) => i).join(' ');
    const text = restate({ title: 'Long', signatureId: 'fn:ints->int' }, [
      { stdin: long, expectedStdout: '1' },
    ]);
    assert.ok(!text.includes(long), 'a wall of numbers is not an example');
  });

  it('never leaks a solution, only shapes and public samples', () => {
    const text = restate({ title: 'The Last Digit', signatureId: 'fn:int->int' }, [sample]);
    // Code syntax, not English words. "You return a whole number" is a
    // sentence about the output and must pass; a `def` line or a brace would
    // be the start of an answer.
    assert.ok(!/\bdef\s+\w+\(|\bfunction\s*\w*\(|=>|[{};]/.test(text), text);
  });
});

describe('the warm-up response bound', () => {
  it('is short enough to be a sentence and long enough to be an answer', () => {
    assert.ok(ACTIVITY_RESPONSE_LIMIT >= 100 && ACTIVITY_RESPONSE_LIMIT <= 1000);
  });
});

describe('a swap never walks back to a problem already solved', () => {
  // The owner's history on 2026-09-15: seven "too hard" swaps, and every one
  // of them served a problem solved earlier that same day. The replacement
  // pool excluded only the problem on screen.
  const ready = (): SkillSnapshot => {
    const snap = emptySkillSnapshot();
    for (const skill of ['values', 'comparisons', 'strings', 'indexing'] as const) {
      snap[skill] = advanceSkillState(advanceSkillState(snap[skill], false), false);
    }
    return snap;
  };
  const row = (id: string, over: Partial<SkillProblem> = {}) => ({ id, ...problem(over) });
  const onScreen = row('capitalise-each-word', { signatureId: 'fn:string->string', patternTags: ['strings'] });
  const solvedSmall = row('shout-the-line', { signatureId: 'fn:string->string', patternTags: ['strings'] });
  const unseenSmall = row('to-snake-case', { signatureId: 'fn:string->string', patternTags: ['strings'] });

  it('prefers an unseen problem over a solved one, even a smaller solved one', () => {
    const ranked = rankReplacements(
      [onScreen, solvedSmall, unseenSmall],
      ready(),
      'too_hard',
      { excludeId: onScreen.id, excluded: new Set([solvedSmall.id]) },
    );
    assert.deepEqual(
      ranked.map((r) => r.id),
      [unseenSmall.id],
      'the solved problem must not be in the pool at all',
    );
  });

  it('refuses rather than repeat when only solved problems remain', () => {
    const ranked = rankReplacements([onScreen, solvedSmall], ready(), 'too_hard', {
      excludeId: onScreen.id,
      excluded: new Set([solvedSmall.id]),
    });
    assert.equal(ranked.length, 0, 'an empty pool is a refusal; the current problem still opens the lock');
  });
});

describe('a "too hard" swap still keeps the learner at the frontier', () => {
  const ready = (): SkillSnapshot => {
    const snap = emptySkillSnapshot();
    for (const skill of ['values', 'comparisons', 'strings', 'indexing'] as const) {
      snap[skill] = advanceSkillState(advanceSkillState(snap[skill], false), false);
    }
    return snap;
  };
  const row = (id: string, over: Partial<SkillProblem> = {}) => ({ id, ...problem(over) });
  const onScreen = row('big-stretch', { signatureId: 'fn:ints,int->int', patternTags: ['lists', 'indexing'] });
  const smallStretch = row('small-stretch', { patternTags: ['strings', 'indexing', 'lists'] });
  const mastered = row('mastered', { signatureId: 'fn:string->string', patternTags: ['strings'] });

  it('ranks a smaller problem with one new idea above a fully mastered one', () => {
    const ranked = rankReplacements([onScreen, mastered, smallStretch], ready(), 'too_hard', {
      excludeId: onScreen.id,
      excluded: new Set(),
    });
    assert.equal(ranked[0]?.id, smallStretch.id, 'a swap must not be a route back to mastered work');
  });

  it('offers a mastered problem only when no stretch problem fits', () => {
    const ranked = rankReplacements([onScreen, mastered], ready(), 'too_hard', {
      excludeId: onScreen.id,
      excluded: new Set(),
    });
    assert.deepEqual(ranked.map((r) => r.id), [mastered.id]);
  });
});
