import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { chooseSurface, deriveRewardEvents, nearMissImproved } from './reward.js';
import {
  advanceSkillState,
  emptySkillSnapshot,
  markDueForReview,
  type SkillRecord,
  type SkillSnapshot,
} from '../skills.js';

/**
 * Reward as prediction error: events fire on what the learner could not do
 * before, and the full success moment is reserved for those. A plain solve
 * is recorded exactly as before and shown quietly.
 */

const demonstrated = (): SkillRecord =>
  advanceSkillState(advanceSkillState(emptySkillSnapshot().values, false), false);
const withHelpOnly = (): SkillRecord => advanceSkillState(emptySkillSnapshot().values, true);
const onceUnaided = (): SkillRecord => advanceSkillState(emptySkillSnapshot().values, false);

const snap = (over: Partial<SkillSnapshot>): SkillSnapshot => ({ ...emptySkillSnapshot(), ...over });

const kinds = (events: ReturnType<typeof deriveRewardEvents>) => events.map((e) => e.kind);

describe('which reward events a solve produces', () => {
  it('fires skill_demonstrated when a required skill crosses into demonstrated', () => {
    const events = deriveRewardEvents({
      requiredSkills: ['values', 'strings'],
      skillsBefore: snap({ values: demonstrated(), strings: onceUnaided() }),
      skillsAfter: snap({ values: demonstrated(), strings: demonstrated() }),
      assisted: false,
      kind: 'independent',
    });
    assert.ok(kinds(events).includes('skill_demonstrated'));
    assert.equal(events.find((e) => e.kind === 'skill_demonstrated')?.skill, 'strings');
  });

  it('fires first_unaided when a skill met only with help is solved with none', () => {
    const events = deriveRewardEvents({
      requiredSkills: ['values', 'strings'],
      skillsBefore: snap({ values: demonstrated(), strings: withHelpOnly() }),
      skillsAfter: snap({ values: demonstrated(), strings: onceUnaided() }),
      assisted: false,
      kind: 'independent',
    });
    assert.ok(kinds(events).includes('first_unaided'));
  });

  it('does not fire first_unaided for a solve that used hints', () => {
    const events = deriveRewardEvents({
      requiredSkills: ['values', 'strings'],
      skillsBefore: snap({ values: demonstrated(), strings: withHelpOnly() }),
      skillsAfter: snap({ values: demonstrated(), strings: advanceSkillState(withHelpOnly(), true) }),
      assisted: true,
      kind: 'assisted',
    });
    assert.deepEqual(kinds(events), ['solved']);
  });

  it('fires review_held when a due skill comes back to demonstrated', () => {
    const events = deriveRewardEvents({
      requiredSkills: ['values'],
      skillsBefore: snap({ values: markDueForReview(demonstrated()) }),
      skillsAfter: snap({ values: demonstrated() }),
      assisted: false,
      kind: 'recall',
    });
    assert.ok(kinds(events).includes('review_held'));
  });

  it('carries transfer and recall through from the accomplishment kind', () => {
    const base = {
      requiredSkills: ['values'] as const,
      skillsBefore: snap({ values: demonstrated() }),
      skillsAfter: snap({ values: demonstrated() }),
      assisted: false,
    };
    assert.ok(kinds(deriveRewardEvents({ ...base, kind: 'transfer' })).includes('transfer'));
    assert.ok(kinds(deriveRewardEvents({ ...base, kind: 'recall' })).includes('recall'));
  });

  it('a plain solve of mastered skills produces only solved', () => {
    const events = deriveRewardEvents({
      requiredSkills: ['values', 'strings'],
      skillsBefore: snap({ values: demonstrated(), strings: demonstrated() }),
      skillsAfter: snap({ values: demonstrated(), strings: demonstrated() }),
      assisted: false,
      kind: 'independent',
    });
    assert.deepEqual(kinds(events), ['solved']);
  });

  it('lists solved last, after anything rarer', () => {
    const events = deriveRewardEvents({
      requiredSkills: ['values', 'strings'],
      skillsBefore: snap({ values: demonstrated(), strings: onceUnaided() }),
      skillsAfter: snap({ values: demonstrated(), strings: demonstrated() }),
      assisted: false,
      kind: 'independent',
    });
    assert.equal(kinds(events).at(-1), 'solved');
  });
});

describe('which surface the success moment gets', () => {
  it('is full only when something rarer than a solve happened', () => {
    assert.equal(chooseSurface([{ kind: 'solved', note: '' }]), 'quiet');
    assert.equal(
      chooseSurface([
        { kind: 'skill_demonstrated', skill: 'strings', note: '' },
        { kind: 'solved', note: '' },
      ]),
      'full',
    );
    assert.equal(chooseSurface([{ kind: 'recall', note: '' }, { kind: 'solved', note: '' }]), 'full');
  });

  it('is never decided by chance', () => {
    const events = [{ kind: 'solved' as const, note: '' }];
    const seen = new Set(Array.from({ length: 50 }, () => chooseSurface(events)));
    assert.deepEqual([...seen], ['quiet']);
  });
});

describe('a failed attempt that improved', () => {
  it('is a near miss when more cases pass than last attempt', () => {
    const out = nearMissImproved({ passedCount: 2, totalCount: 6 }, { passedCount: 4, totalCount: 6 }, false);
    assert.deepEqual(out, { passed: 4, total: 6, previousPassed: 2 });
  });

  it('is nothing on the first attempt', () => {
    assert.equal(nearMissImproved(null, { passedCount: 4, totalCount: 6 }, false), null);
  });

  it('is nothing when the count did not rise', () => {
    assert.equal(nearMissImproved({ passedCount: 4, totalCount: 6 }, { passedCount: 4, totalCount: 6 }, false), null);
    assert.equal(nearMissImproved({ passedCount: 4, totalCount: 6 }, { passedCount: 3, totalCount: 6 }, false), null);
  });

  it('fires at most once per problem per session', () => {
    assert.equal(nearMissImproved({ passedCount: 2, totalCount: 6 }, { passedCount: 4, totalCount: 6 }, true), null);
  });
});
