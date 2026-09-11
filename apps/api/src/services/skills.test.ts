import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MAX_NEW_SKILLS_PER_PROBLEM,
  SKILLS,
  SKILL_LABELS,
  SKILL_PREREQUISITES,
  UNAIDED_SOLVES_TO_DEMONSTRATE,
  advanceSkillState,
  allPrerequisites,
  emptySkillRecord,
  emptySkillSnapshot,
  fitForLearner,
  isIntroduced,
  isSatisfied,
  isSkillReady,
  markDueForReview,
  nextSkillToLearn,
  scoreProblemForLearner,
  skillsRequiredBy,
  type Skill,
  type SkillProblem,
  type SkillSnapshot,
} from './skills.js';

/**
 * Unit tests for the beginner skill path.
 *
 * Node's built-in runner rather than a framework: `apps/api` had no test
 * infrastructure at all, and Node 24 ships `node:test`, so this adds a real
 * safety net without a dependency, a config file, or a build step. The
 * repository already depends on `tsx`, which is what lets these run directly
 * as TypeScript.
 *
 * Everything here is pure. No database, no network, no disk, which is the
 * point of keeping the selection logic separate from its storage.
 */

const problem = (over: Partial<SkillProblem> = {}): SkillProblem => ({
  signatureId: 'fn:int->int',
  patternTags: ['arithmetic'],
  tier: 'TIER_0',
  patternFamily: 'FOUNDATIONS',
  ...over,
});

/** A snapshot with the named skills demonstrated and the rest untouched. */
function withDemonstrated(...skills: Skill[]): SkillSnapshot {
  const snap = emptySkillSnapshot();
  for (const skill of skills) {
    snap[skill] = { state: 'demonstrated', unaidedSolves: 2, assistedSolves: 0 };
  }
  return snap;
}

/** A snapshot with the named skills merely introduced. */
function withIntroduced(...skills: Skill[]): SkillSnapshot {
  const snap = emptySkillSnapshot();
  for (const skill of skills) {
    snap[skill] = { state: 'practised_with_help', unaidedSolves: 1, assistedSolves: 0 };
  }
  return snap;
}

describe('the prerequisite graph', () => {
  it('is acyclic', () => {
    for (const skill of SKILLS) {
      assert.ok(
        !allPrerequisites(skill).includes(skill),
        `${skill} is its own prerequisite, directly or transitively`,
      );
    }
  });

  it('names only real skills', () => {
    for (const skill of SKILLS) {
      for (const prereq of SKILL_PREREQUISITES[skill]) {
        assert.ok(SKILLS.includes(prereq), `${skill} requires unknown skill ${prereq}`);
      }
    }
  });

  it('lists every prerequisite before the skill that needs it', () => {
    // Declaration order is the teaching order, and `nextSkillToLearn` walks it.
    for (const skill of SKILLS) {
      for (const prereq of SKILL_PREREQUISITES[skill]) {
        assert.ok(
          SKILLS.indexOf(prereq) < SKILLS.indexOf(skill),
          `${prereq} is declared after ${skill}, which needs it`,
        );
      }
    }
  });

  it('has exactly one root', () => {
    const roots = SKILLS.filter((s) => SKILL_PREREQUISITES[s].length === 0);
    assert.deepEqual(roots, ['values']);
  });
});

describe('one correct answer is not mastery', () => {
  it('does not demonstrate a skill on the first unaided solve', () => {
    const once = advanceSkillState(emptySkillRecord(), false);
    assert.equal(once.state, 'practised_with_help');
    assert.equal(isSatisfied(once), false);
  });

  it('demonstrates it on the second', () => {
    // The number is asserted, not looped over. Reading the constant and then
    // applying it that many times would pass whatever the constant said, so
    // the test would keep its name while the behaviour changed underneath it.
    assert.equal(UNAIDED_SOLVES_TO_DEMONSTRATE, 2, 'the name of this test says two');

    const once = advanceSkillState(emptySkillRecord(), false);
    const twice = advanceSkillState(once, false);

    assert.equal(once.state, 'practised_with_help');
    assert.equal(twice.state, 'demonstrated');
    assert.equal(isSatisfied(twice), true);
  });

  it('never demonstrates a skill from assisted solves, however many', () => {
    let record = emptySkillRecord();
    for (let i = 0; i < 20; i++) record = advanceSkillState(record, true);
    assert.equal(record.state, 'practised_with_help');
    assert.equal(record.assistedSolves, 20);
    assert.equal(record.unaidedSolves, 0);
    assert.equal(isSatisfied(record), false);
  });

  it('does not let an assisted solve pull a demonstrated skill back down', () => {
    const demonstrated = withDemonstrated('values').values;
    assert.equal(advanceSkillState(demonstrated, true).state, 'demonstrated');
  });

  it('counts assisted and unaided solves separately', () => {
    let record = advanceSkillState(emptySkillRecord(), true);
    record = advanceSkillState(record, false);
    assert.equal(record.assistedSolves, 1);
    assert.equal(record.unaidedSolves, 1);
    assert.equal(record.state, 'practised_with_help');
  });
});

describe('review is not a demotion', () => {
  it('only marks a demonstrated skill as due', () => {
    assert.equal(markDueForReview(emptySkillRecord()).state, 'not_introduced');
    const practised = advanceSkillState(emptySkillRecord(), false);
    assert.equal(markDueForReview(practised).state, 'practised_with_help');
  });

  it('keeps a due skill satisfied, so nothing downstream re-locks', () => {
    const due = markDueForReview(withDemonstrated('values').values);
    assert.equal(due.state, 'due_for_review');
    assert.equal(isSatisfied(due), true, 'a due review must not re-lock later skills');

    // Checked downstream, not only on the record itself. The claim in the name
    // is about what a due review does to the rest of the path, and asserting
    // `isSatisfied` alone never visits the rest of the path.
    const snapshot = withDemonstrated('values', 'strings');
    snapshot.values = due;
    assert.equal(isSkillReady('comparisons', snapshot), true, 'comparisons re-locked');
    assert.equal(isSkillReady('indexing', snapshot), true, 'indexing re-locked');
    assert.equal(
      fitForLearner(problem({ patternTags: ['comparison'] }), snapshot).eligible,
      true,
      'a problem built on the due skill became ineligible',
    );
  });

  it('does not lose the solve count when a review comes due', () => {
    const due = markDueForReview(withDemonstrated('values').values);
    assert.equal(due.unaidedSolves, 2);
    assert.equal(advanceSkillState(due, false).state, 'demonstrated');
  });
});

describe('what a problem requires', () => {
  it('always requires values, because every problem has a value in it', () => {
    assert.ok(skillsRequiredBy(problem({ patternTags: [] })).includes('values'));
  });

  it('requires lists for a collection argument even when untagged', () => {
    const required = skillsRequiredBy(problem({ signatureId: 'fn:ints->int', patternTags: [] }));
    assert.ok(required.includes('lists'), 'a list argument needs the lists skill');
  });

  it('includes the prerequisites of everything it requires', () => {
    const required = skillsRequiredBy(problem({ patternTags: ['loops'] }));
    for (const prereq of allPrerequisites('loops')) {
      assert.ok(required.includes(prereq), `loops implies ${prereq}`);
    }
  });

  it('treats anything above the foundations tier as combining', () => {
    assert.ok(skillsRequiredBy(problem({ tier: 'TIER_1' })).includes('combining'));
  });

  it('ignores tags it does not recognise rather than throwing', () => {
    const required = skillsRequiredBy(problem({ patternTags: ['not-a-real-tag', 'arithmetic'] }));
    assert.deepEqual(required, ['values']);
  });

  it('returns skills in teaching order, not tag order', () => {
    const required = skillsRequiredBy(problem({ patternTags: ['loops', 'arithmetic'] }));
    const indexes = required.map((s) => SKILLS.indexOf(s));
    assert.deepEqual(indexes, [...indexes].sort((a, b) => a - b));
  });
});

/**
 * The eligibility rules themselves. Named for what it tests: `pickProblem`,
 * which applies these rules to real queries, is not covered here and has no
 * test yet — it needs a disposable Postgres database.
 */
describe('the eligibility rules', () => {
  const loopProblem = problem({ signatureId: 'fn:ints->int', patternTags: ['loops', 'arrays'] });

  it('refuses a loop problem to someone who has met nothing', () => {
    const fit = fitForLearner(loopProblem, emptySkillSnapshot());
    assert.equal(fit.eligible, false);
    assert.ok(fit.reason.length > 0);
  });

  it('names the earliest missing skill rather than listing them all', () => {
    const fit = fitForLearner(loopProblem, emptySkillSnapshot());
    // Readability matters: this string is shown to a stuck beginner.
    assert.ok(fit.reason.startsWith('starts with'), fit.reason);
    assert.ok(fit.reason.length < 90, `reason too long to read: ${fit.reason}`);
  });

  it('points at the skill they can start on, not the one they cannot', () => {
    // The named skill must be actionable today. Naming a blocked skill would
    // hand a stuck beginner the destination and call it the starting line.
    const fit = fitForLearner(loopProblem, emptySkillSnapshot());
    const earliest = skillsRequiredBy(loopProblem)[0]!;

    assert.equal(earliest, 'values', 'teaching order should put the root first');
    assert.ok(
      fit.reason.includes(SKILL_LABELS[fit.missing[0]!].toLowerCase()),
      `named something other than the earliest missing skill: ${fit.reason}`,
    );
    assert.ok(!fit.reason.includes('loops'), `named a blocked skill: ${fit.reason}`);
  });

  it('scores an ineligible problem as null, so ranking cannot bypass a gate', () => {
    assert.equal(scoreProblemForLearner(loopProblem, emptySkillSnapshot(), 'values'), null);
  });

  it('introduces at most one new skill at a time', () => {
    // Both new skills have to be independently ready, or the refusal proves
    // nothing about the limit — an unready skill is refused by the
    // prerequisite rule regardless of how many there are. From an empty
    // snapshot only `values` is ready, so the groundwork is laid first.
    const snap = withIntroduced('values', 'strings');
    assert.equal(isSkillReady('comparisons', snap), true);
    assert.equal(isSkillReady('indexing', snap), true);

    const oneNew = fitForLearner(problem({ patternTags: ['comparison'] }), snap);
    const twoNew = fitForLearner(problem({ patternTags: ['comparison', 'bounds'] }), snap);

    assert.equal(oneNew.eligible, true, 'one new skill is allowed');
    assert.equal(MAX_NEW_SKILLS_PER_PROBLEM, 1, 'the rest of this test assumes the limit is one');
    assert.equal(twoNew.eligible, false, 'two independently ready new skills must be refused');
    assert.ok(
      twoNew.reason.includes('new ideas at once'),
      `refused for the wrong reason: ${twoNew.reason}`,
    );
  });

  it('allows a problem once its prerequisites are introduced, not only demonstrated', () => {
    // The deadlock this guards: demonstrating a skill needs two unaided solves,
    // and only one problem in the corpus needs `values` alone. If unlocking
    // required demonstration, that problem would be served forever.
    const snap = withIntroduced('values');
    assert.equal(isIntroduced(snap.values), true);
    assert.equal(isSatisfied(snap.values), false);
    assert.equal(isSkillReady('comparisons', snap), true);
    assert.equal(isSkillReady('indexing', snap), false, 'strings is still untouched');
  });

  it('keeps the teaching order: nothing unlocks before its own groundwork', () => {
    const snap = emptySkillSnapshot();
    assert.equal(isSkillReady('values', snap), true, 'the root is always ready');
    for (const skill of SKILLS.filter((s) => s !== 'values')) {
      assert.equal(isSkillReady(skill, snap), false, `${skill} must not be ready first`);
    }
  });
});

describe('what to work on next', () => {
  it('starts at the root', () => {
    assert.equal(nextSkillToLearn(emptySkillSnapshot()), 'values');
  });

  it('prefers a review over new material', () => {
    const snap = withDemonstrated('values', 'comparisons');
    snap.values = markDueForReview(snap.values);
    assert.equal(nextSkillToLearn(snap), 'values');
  });

  it('moves on once a skill is demonstrated', () => {
    assert.equal(nextSkillToLearn(withDemonstrated('values')), 'comparisons');
  });

  it('returns null when everything is demonstrated and nothing is due', () => {
    assert.equal(nextSkillToLearn(withDemonstrated(...SKILLS)), null);
  });

  it('never suggests a skill whose groundwork is missing', () => {
    const snap = emptySkillSnapshot();
    for (let i = 0; i < SKILLS.length + 2; i++) {
      const next = nextSkillToLearn(snap);
      if (next === null) break;
      assert.equal(isSkillReady(next, snap), true, `${next} suggested before it was ready`);
      snap[next] = { state: 'demonstrated', unaidedSolves: 2, assistedSolves: 0 };
    }
  });
});

describe('meeting a skill once is not practising it', () => {
  /**
   * The state observed in the running app: every skill introduced by a single
   * assisted solve, nothing demonstrated. Eligibility keyed on
   * `not_introduced` alone judged all 695 problems fair, Tier 2 included, and
   * described them as using only what the learner had already practised.
   */
  const helpedOnce = (): SkillSnapshot => {
    const snap = emptySkillSnapshot();
    for (const skill of SKILLS) {
      snap[skill] = { state: 'practised_with_help', unaidedSolves: 0, assistedSolves: 1 };
    }
    return snap;
  };

  it('refuses a problem leaning on three barely-met skills', () => {
    const deep = problem({
      signatureId: 'cls:hash-map',
      patternTags: ['hash-map', 'loops'],
      tier: 'TIER_2',
    });
    const fit = fitForLearner(deep, helpedOnce());
    assert.equal(fit.eligible, false);
    assert.ok(fit.reason.includes('new ideas at once'), fit.reason);
    assert.ok(fit.reason.length < 90, `reason too long to read: ${fit.reason}`);
  });

  it('never says "already practised" about a skill with no unaided solve', () => {
    // The honesty rule: the sentence shown to the learner has to be true.
    const snap = helpedOnce();
    const loopy = problem({ signatureId: 'fn:ints->int', patternTags: ['loops'] });
    const fit = fitForLearner(loopy, snap);
    assert.ok(!fit.reason.includes('already practised'), fit.reason);
  });

  it('counts one unaided solve as enough to lean on', () => {
    const snap = helpedOnce();
    for (const skill of SKILLS) snap[skill] = advanceSkillState(snap[skill], false);
    const loopy = problem({ signatureId: 'fn:ints->int', patternTags: ['loops'] });
    assert.equal(fitForLearner(loopy, snap).eligible, true);
  });

  it('counts a second assisted solve as enough to lean on', () => {
    // Not mastery — the state stays practised_with_help — but real work with
    // the idea, and the alternative is serving one problem forever to someone
    // who needs help every time.
    const snap = helpedOnce();
    for (const skill of SKILLS) snap[skill] = advanceSkillState(snap[skill], true);
    for (const skill of SKILLS) assert.equal(isSatisfied(snap[skill]), false);
    const loopy = problem({ signatureId: 'fn:ints->int', patternTags: ['loops'] });
    assert.equal(fitForLearner(loopy, snap).eligible, true);
  });
});

describe('every reason completes the sentence it is shown in', () => {
  // The UI renders each of these as "It <reason>." A reason that does not fit
  // that carrier reads as broken English to the person it is written for.
  const CASES: Array<[string, SkillSnapshot, SkillProblem]> = [
    ['blocked', emptySkillSnapshot(), problem({ patternTags: ['loops'] })],
    [
      'too many new ideas',
      withIntroduced('values', 'strings'),
      problem({ patternTags: ['comparison', 'bounds'] }),
    ],
    ['one new idea', emptySkillSnapshot(), problem({ patternTags: ['arithmetic'] })],
    ['nothing new', withDemonstrated('values'), problem({ patternTags: ['arithmetic'] })],
  ];

  for (const [name, snapshot, candidate] of CASES) {
    it(`reads as a sentence for the ${name} case`, () => {
      const { reason } = fitForLearner(candidate, snapshot);
      assert.ok(reason.length > 0, 'a reason is always given');
      assert.ok(/^[a-z]/.test(reason), `should start lower case to follow "It": ${reason}`);
      assert.ok(
        /^(starts|brings|builds|uses) /.test(reason),
        `should start with a verb so "It ${reason}" parses: ${reason}`,
      );
      assert.ok(!reason.endsWith('.'), `the caller adds the full stop: ${reason}`);
      assert.ok(reason.length < 90, `too long to read: ${reason}`);
    });
  }
});

describe('every skill is reachable', () => {
  /**
   * Problem shapes taken from the real corpus signature vocabulary, with the
   * tags such problems actually carry. Not exhaustive — enough to answer one
   * question: can a learner starting from nothing reach every skill by solving
   * only problems the gate calls eligible?
   *
   * This is the test that catches an unreachable skill. `functions` had no tag
   * in the corpus vocabulary and no signature rule, so it could only arrive as
   * a prerequisite of `combining` — which requires it, making every combining
   * problem two new skills at once and therefore permanently ineligible. The
   * walk below failed on exactly that.
   */
  const CORPUS: SkillProblem[] = [
    problem({ signatureId: 'fn:int->int', patternTags: ['arithmetic'] }),
    problem({ signatureId: 'fn:int->bool', patternTags: ['booleans'] }),
    problem({ signatureId: 'fn:string->int', patternTags: ['strings'] }),
    problem({ signatureId: 'fn:string->string', patternTags: ['case-conversion'] }),
    problem({ signatureId: 'fn:string->bool', patternTags: ['characters', 'indexing'] }),
    problem({ signatureId: 'fn:string->int', patternTags: ['indexing', 'bounds'] }),
    problem({ signatureId: 'fn:ints->int', patternTags: ['arrays'] }),
    problem({ signatureId: 'fn:ints->ints', patternTags: ['arrays', 'filtering'] }),
    problem({ signatureId: 'fn:ints->int', patternTags: ['loops', 'accumulator'] }),
    problem({ signatureId: 'fn:int,int->int', patternTags: ['arithmetic'] }),
    problem({ signatureId: 'fn:ints,int->int', patternTags: ['arrays', 'search'] }),
    problem({ signatureId: 'fn:matrix->int', patternTags: ['loops'], tier: 'TIER_1' }),
    problem({ signatureId: 'cls:stack', patternTags: ['hash-map'], tier: 'TIER_1' }),
  ];

  it('can be walked from nothing to every skill demonstrated', () => {
    const snapshot = emptySkillSnapshot();
    const served: string[] = [];

    // Generous bound: every skill needs two unaided solves, so the walk has
    // room to spare and still terminates if it stalls.
    for (let step = 0; step < SKILLS.length * 4; step++) {
      const target = nextSkillToLearn(snapshot);
      if (target === null) break;

      const best = CORPUS.filter((p) => fitForLearner(p, snapshot).eligible).sort(
        (a, b) =>
          (scoreProblemForLearner(b, snapshot, target) ?? 0) -
          (scoreProblemForLearner(a, snapshot, target) ?? 0),
      )[0];
      if (!best) break;

      served.push(best.signatureId);
      for (const skill of skillsRequiredBy(best)) {
        snapshot[skill] = advanceSkillState(snapshot[skill], false);
      }
    }

    const unreached = SKILLS.filter((skill) => snapshot[skill].state === 'not_introduced');
    assert.deepEqual(unreached, [], `never reachable: ${unreached.join(', ')}`);

    const undemonstrated = SKILLS.filter((skill) => !isSatisfied(snapshot[skill]));
    assert.deepEqual(
      undemonstrated,
      [],
      `reached but never demonstrable: ${undemonstrated.join(', ')}`,
    );
    assert.ok(served.length > 0);
  });

  it('requires text handling for a string problem carrying no useful tags', () => {
    // An untagged problem must not look easier than it is. Classifying by
    // shape is what keeps an unsafe gate from presenting text handling as a
    // first problem.
    const untagged = problem({ signatureId: 'fn:string->string', patternTags: [] });
    assert.ok(skillsRequiredBy(untagged).includes('strings'));
    assert.equal(fitForLearner(untagged, emptySkillSnapshot()).eligible, false);
  });

  it('requires functions for a two-argument problem', () => {
    const twoArgs = problem({ signatureId: 'fn:int,int->int', patternTags: ['arithmetic'] });
    assert.ok(skillsRequiredBy(twoArgs).includes('functions'));
  });
});
