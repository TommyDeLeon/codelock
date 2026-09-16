import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALL_PROBLEMS } from '../../corpus/problems/index.js';
import { emptySkillSnapshot, skillsRequiredBy, type SkillSnapshot } from '../skills.js';
import { deriveAccomplishment, type AccomplishmentInput, type PriorSolve } from './accomplishment.js';

const NOW = new Date('2026-09-15T12:00:00Z');
const DAY = 86_400_000;

function input(slug: string, over: Partial<AccomplishmentInput> = {}): AccomplishmentInput {
  const def = ALL_PROBLEMS.find((p) => p.slug === slug)!;
  return {
    problem: {
      slug: def.slug,
      title: def.title,
      patternTags: def.patternTags,
      tests: def.tests,
      signatureId: def.signatureId,
    },
    help: { hints: 0, maxLevel: 0, workedSolution: false },
    attempts: 2,
    priorSolves: [],
    now: NOW,
    requiredSkills: skillsRequiredBy(def),
    skillsBefore: emptySkillSnapshot(),
    skillsAfter: emptySkillSnapshot(),
    fallbackVariation: null,
    feedbackDue: false,
    ...over,
  };
}

const prior = (slug: string, daysAgo: number, assisted: boolean): PriorSolve => {
  const def = ALL_PROBLEMS.find((p) => p.slug === slug)!;
  return {
    slug,
    title: def.title,
    solvedAt: new Date(NOW.getTime() - daysAgo * DAY),
    assisted,
    patternTags: def.patternTags,
    problem: def,
  };
};

describe('success moment', () => {
  it('names an independent solve and what the tests covered', () => {
    const a = deriveAccomplishment(input('sum-of-array'));
    assert.equal(a.kind, 'independent');
    assert.equal(a.headline, 'You solved Sum of an Array without a hint.');
    assert.ok(a.details.includes('You handled an empty list.'));
    assert.ok(a.details.includes('Negative numbers work too.'));
    assert.match(a.helpSummary, /independent/);
  });

  it('never calls assisted work independent', () => {
    const a = deriveAccomplishment(
      input('sum-of-array', { help: { hints: 2, maxLevel: 3, workedSolution: false } }),
    );
    assert.equal(a.kind, 'assisted');
    assert.match(a.headline, /with 2 hints/);
    assert.match(a.helpSummary, /Saved as assisted/);
    assert.ok(!a.details.some((d) => /without (a hint|help)|on your own|first submission/.test(d)));
  });

  it('marks a worked solution as reproduced, and offers a check on a different problem', () => {
    const a = deriveAccomplishment(
      input('sum-of-array', { help: { hints: 5, maxLevel: 5, workedSolution: true } }),
    );
    assert.equal(a.kind, 'worked_solution');
    assert.equal(a.variation?.slug, 'product-of-list');
  });

  it('claims improvement only against the same problem solved before with help', () => {
    const noHistory = deriveAccomplishment(input('sum-of-array'));
    assert.ok(!noHistory.details.some((d) => /Last time/.test(d)));
    const comparable = deriveAccomplishment(
      input('sum-of-array', { priorSolves: [prior('sum-of-array', 1, true)] }),
    );
    assert.ok(comparable.details.some((d) => /Last time you solved this one with help/.test(d)));
    const unrelated = deriveAccomplishment(
      input('sum-of-array', { priorSolves: [prior('largest-number', 1, true)] }),
    );
    assert.ok(!unrelated.details.some((d) => /Last time/.test(d)));
  });

  it('recognises later recall after a gap', () => {
    const a = deriveAccomplishment(
      input('largest-number', { priorSolves: [prior('largest-number', 5, false)] }),
    );
    assert.equal(a.kind, 'recall');
    assert.match(a.headline, /5 days after last time/);
    const tooSoon = deriveAccomplishment(
      input('largest-number', { priorSolves: [prior('largest-number', 0.5, false)] }),
    );
    assert.equal(tooSoon.kind, 'independent');
  });

  it('recognises transfer: an idea learned with help, used unaided on a new problem', () => {
    const a = deriveAccomplishment(
      input('product-of-list', { priorSolves: [prior('sum-of-array', 1, true)] }),
    );
    assert.equal(a.kind, 'transfer');
    assert.match(a.headline, /running-total idea from Sum of an Array/);
    const notAfterHelp = deriveAccomplishment(
      input('product-of-list', { priorSolves: [prior('sum-of-array', 1, false)] }),
    );
    assert.equal(notAfterHelp.kind, 'independent');
  });

  it('states skill changes by the rule that produced them', () => {
    const before: SkillSnapshot = emptySkillSnapshot();
    const after: SkillSnapshot = emptySkillSnapshot();
    before.loops = { state: 'practised_with_help', unaidedSolves: 1, assistedSolves: 1 };
    after.loops = { state: 'demonstrated', unaidedSolves: 2, assistedSolves: 1 };
    const a = deriveAccomplishment(input('sum-of-array', { skillsBefore: before, skillsAfter: after }));
    assert.ok(a.details.some((d) => /you have now solved two separate problems without help/.test(d)));
    assert.equal(a.skills.find((s) => s.skill === 'loops')?.stateLabel, 'Solved on your own twice');
  });

  it('offers the same related problem with or without help', () => {
    assert.equal(deriveAccomplishment(input('sum-of-array')).variation?.slug, 'product-of-list');
    const assisted = deriveAccomplishment(
      input('sum-of-array', { help: { hints: 1, maxLevel: 2, workedSolution: false } }),
    );
    assert.equal(assisted.variation?.slug, 'product-of-list');
  });
});


describe('reward events and surface on the accomplishment', () => {
  const demonstrated = (snap: SkillSnapshot, skills: readonly (keyof SkillSnapshot)[]) => {
    for (const s of skills) snap[s] = { state: 'demonstrated', unaidedSolves: 2, assistedSolves: 0 };
    return snap;
  };

  it('a plain solve of mastered skills carries only solved and a quiet surface', () => {
    const required = skillsRequiredBy({
      signatureId: 'fn:string->string', patternTags: ['strings'], tier: 'TIER_0', patternFamily: 'FOUNDATIONS',
    });
    const before = demonstrated(emptySkillSnapshot(), required);
    const after = demonstrated(emptySkillSnapshot(), required);
    const a = deriveAccomplishment(input('shout-the-line', { skillsBefore: before, skillsAfter: after, requiredSkills: required }));
    assert.deepEqual(a.events?.map((e) => e.kind), ['solved']);
    assert.equal(a.surface, 'quiet');
  });

  it('a solve that demonstrates a skill gets the full surface', () => {
    const required = skillsRequiredBy({
      signatureId: 'fn:string->string', patternTags: ['strings'], tier: 'TIER_0', patternFamily: 'FOUNDATIONS',
    });
    const before = demonstrated(emptySkillSnapshot(), required);
    const after = demonstrated(emptySkillSnapshot(), required);
    before.strings = { state: 'practised_with_help', unaidedSolves: 1, assistedSolves: 0 };
    const a = deriveAccomplishment(input('shout-the-line', { skillsBefore: before, skillsAfter: after, requiredSkills: required }));
    assert.ok(a.events?.some((e) => e.kind === 'skill_demonstrated'));
    assert.equal(a.surface, 'full');
  });

  it('offers a due solved problem as the follow-up, never as the lock', () => {
    const required = skillsRequiredBy({
      signatureId: 'fn:string->string', patternTags: ['strings'], tier: 'TIER_0', patternFamily: 'FOUNDATIONS',
    });
    const before = demonstrated(emptySkillSnapshot(), required);
    const after = demonstrated(emptySkillSnapshot(), required);
    before.strings = { state: 'due_for_review', unaidedSolves: 2, assistedSolves: 0 };
    after.strings = { state: 'due_for_review', unaidedSolves: 2, assistedSolves: 0 };
    const a = deriveAccomplishment(
      input('sum-of-array', {
        skillsBefore: before,
        skillsAfter: after,
        priorSolves: [prior('shout-the-line', 10, false), prior('shout-the-line', 12, false)],
        fallbackVariation: null,
      }),
    );
    assert.equal(a.variation?.slug, 'shout-the-line');
    assert.match(a.variation?.why ?? '', /due/i);
  });
});
