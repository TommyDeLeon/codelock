import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  STRETCH_WEIGHT,
  choosePool,
  needsRelief,
  poolOf,
  splitPools,
  type LockOutcome,
} from './stretch.js';
import { advanceSkillState, emptySkillSnapshot, type SkillProblem, type SkillSnapshot } from './skills.js';

/**
 * Difficulty targeting: which pool a problem belongs to, which pool a lock
 * draws from, and when the learner gets a breather.
 *
 * The snapshot below is the owner's real one from 2026-09-15: values,
 * comparisons, strings and indexing demonstrated; lists never met; functions
 * met once. `capitalise-each-word` needed only demonstrated skills and was
 * served four times that day; `swap-first-and-last` introduced lists and was
 * never served.
 */

const problem = (over: Partial<SkillProblem> = {}): SkillProblem => ({
  signatureId: 'fn:string->string',
  patternTags: ['strings'],
  tier: 'TIER_0',
  patternFamily: 'FOUNDATIONS',
  ...over,
});

const ownerSnapshot = (): SkillSnapshot => {
  const snap = emptySkillSnapshot();
  for (const skill of ['values', 'comparisons', 'strings', 'indexing'] as const) {
    snap[skill] = advanceSkillState(advanceSkillState(snap[skill], false), false);
  }
  snap.functions = advanceSkillState(snap.functions, false);
  return snap;
};

const mastered = problem({ patternTags: ['strings', 'case-conversion'] }); // capitalise-each-word
const introducesLists = problem({ patternTags: ['strings', 'indexing', 'lists'] }); // swap-first-and-last
const leansOnFunctions = problem({ signatureId: 'fn:string,int->string', patternTags: ['indexing'] }); // nth-character

describe('which pool a fair problem belongs to', () => {
  it('is stretch when it introduces a skill the learner has not met', () => {
    assert.equal(poolOf(introducesLists, ownerSnapshot()), 'stretch');
  });

  it('is stretch when it leans on a skill met but not yet demonstrated', () => {
    assert.equal(poolOf(leansOnFunctions, ownerSnapshot()), 'stretch');
  });

  it('is consolidating when every skill it needs is demonstrated', () => {
    assert.equal(poolOf(mastered, ownerSnapshot()), 'consolidating');
  });

  it('is null for a problem the learner is not ready for', () => {
    const threeNew = problem({ signatureId: 'fn:ints,int->int', patternTags: ['loops', 'hash-map'] });
    assert.equal(poolOf(threeNew, ownerSnapshot()), null);
  });

  it('splits a pool without losing or duplicating anything fair', () => {
    const rows = [
      { id: 'a', ...mastered },
      { id: 'b', ...introducesLists },
      { id: 'c', ...leansOnFunctions },
    ];
    const pools = splitPools(rows, ownerSnapshot());
    assert.deepEqual(pools.stretch.map((r) => r.id), ['b', 'c']);
    assert.deepEqual(pools.consolidating.map((r) => r.id), ['a']);
  });
});

describe('which pool a lock draws from', () => {
  it('draws stretch at least 70% of the time when both pools exist', () => {
    let seed = 1;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let stretch = 0;
    for (let i = 0; i < 2000; i++) {
      if (choosePool({ stretch: 3, consolidating: 5 }, false, random) === 'stretch') stretch++;
    }
    assert.ok(stretch / 2000 >= 0.7, `stretch share ${stretch / 2000} below 0.7`);
    assert.equal(STRETCH_WEIGHT, 0.8);
  });

  it('falls back to consolidating when there is nothing to stretch to', () => {
    assert.equal(choosePool({ stretch: 0, consolidating: 4 }, false, () => 0.1), 'consolidating');
  });

  it('serves stretch when consolidating is empty, whatever the draw', () => {
    assert.equal(choosePool({ stretch: 2, consolidating: 0 }, false, () => 0.99), 'stretch');
  });

  it('serves consolidating for one lock when relief is due', () => {
    assert.equal(choosePool({ stretch: 3, consolidating: 2 }, true, () => 0.1), 'consolidating');
  });

  it('returns null when both pools are empty so the ladder can relax', () => {
    assert.equal(choosePool({ stretch: 0, consolidating: 0 }, false, () => 0.5), null);
  });
});

describe('relief after a hard run', () => {
  const hard: LockOutcome = { pool: 'stretch', ending: 'worked_solution' };
  const fine: LockOutcome = { pool: 'stretch', ending: 'solved' };
  const easy: LockOutcome = { pool: 'consolidating', ending: 'bypassed' };

  it('is due after two consecutive stretch locks that ended badly', () => {
    assert.equal(needsRelief([hard, { pool: 'stretch', ending: 'bypassed' }]), true);
    assert.equal(needsRelief([hard, { pool: 'stretch', ending: 'abandoned' }]), true);
  });

  it('is not due after one bad lock', () => {
    assert.equal(needsRelief([fine, hard]), false);
  });

  it('is not due when the bad locks were not stretch', () => {
    assert.equal(needsRelief([easy, easy]), false);
  });

  it('clears once a consolidating lock has been served', () => {
    // newest first: the relief lock came after the two bad ones
    assert.equal(needsRelief([easy, hard, hard]), false);
  });

  it('is never due with no history', () => {
    assert.equal(needsRelief([]), false);
  });
});
