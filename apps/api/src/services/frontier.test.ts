import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PASS_RATE_BAND, PASS_RATE_WINDOW, describeFrontier, type FrontierLock } from './frontier.js';
import { advanceSkillState, emptySkillSnapshot, type SkillSnapshot } from './skills.js';

/**
 * The frontier: which skill is next, how close, what the last attempt proved,
 * and the first-try pass rate as an observable. Competence information,
 * never a bar to fill.
 */

const owner = (): SkillSnapshot => {
  const snap = emptySkillSnapshot();
  for (const skill of ['values', 'comparisons', 'strings', 'indexing'] as const) {
    snap[skill] = advanceSkillState(advanceSkillState(snap[skill], false), false);
  }
  snap.functions = advanceSkillState(snap.functions, false);
  return snap;
};

const lock = (over: Partial<FrontierLock> = {}): FrontierLock => ({
  requiredSkills: ['values', 'strings'],
  firstTryPass: true,
  assisted: false,
  ending: 'solved',
  nearMiss: null,
  ...over,
});

describe('which skill is next and how far', () => {
  it('names the earliest unfinished ready skill', () => {
    const f = describeFrontier(owner(), []);
    assert.equal(f.next?.skill, 'lists');
    assert.equal(f.distance, 'not met yet');
  });

  it('says "practised with help" for a skill met only with help', () => {
    const snap = owner();
    snap.lists = advanceSkillState(snap.lists, true);
    assert.equal(describeFrontier(snap, []).distance, 'practised with help');
  });

  it('names the one-step case in words', () => {
    const snap = owner();
    snap.lists = advanceSkillState(snap.lists, false);
    assert.equal(describeFrontier(snap, []).distance, 'one unaided solve away');
  });

  it('is empty when everything is demonstrated and nothing is due', () => {
    const snap = emptySkillSnapshot();
    for (const skill of Object.keys(snap) as (keyof SkillSnapshot)[]) {
      snap[skill] = advanceSkillState(advanceSkillState(snap[skill], false), false);
    }
    assert.equal(describeFrontier(snap, []).next, null);
  });
});

describe('what the last attempt on that skill proved', () => {
  it('reports a near miss as progress', () => {
    const f = describeFrontier(owner(), [
      lock({ requiredSkills: ['values', 'lists'], firstTryPass: false, ending: 'abandoned', nearMiss: { passed: 4, total: 6, previousPassed: 2 } }),
    ]);
    assert.match(f.lastProved ?? '', /4 of 6/);
  });

  it('is null when the next skill has never been attempted', () => {
    assert.equal(describeFrontier(owner(), [lock()]).lastProved, null);
  });
});

describe('first-try pass rate as an observable', () => {
  it('is null with no locks and a fraction otherwise, over the window', () => {
    assert.equal(describeFrontier(owner(), []).passRate.rate, null);
    const locks = [lock(), lock({ firstTryPass: false }), lock(), lock()];
    const f = describeFrontier(owner(), locks);
    assert.equal(f.passRate.rate, 0.75);
    assert.equal(f.passRate.locks, 4);
    assert.deepEqual(f.passRate.band, PASS_RATE_BAND);
    assert.equal(PASS_RATE_WINDOW, 20);
  });
});
