import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptySkillSnapshot, type Skill, type SkillRecord, type SkillSnapshot } from '../skills.js';
import { CONTENT_VERSION } from './catalog.js';
import {
  nextNewSkill,
  recommendLesson,
  type BlockerEvidence,
  type LearnerEvidence,
} from './recommend.js';

/**
 * One fixture per history the brief names. Each asserts the reason code and
 * the one thing the copy must and must not say, so a future rule change that
 * starts claiming more than the evidence supports fails here.
 */

const NOW = new Date('2026-09-18T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

function snapshotWith(states: Partial<Record<Skill, Partial<SkillRecord>>>): SkillSnapshot {
  const snapshot = emptySkillSnapshot();
  for (const [skill, record] of Object.entries(states) as [Skill, Partial<SkillRecord>][]) {
    snapshot[skill] = { ...snapshot[skill], ...record };
  }
  return snapshot;
}

const demonstrated = (): Partial<SkillRecord> => ({ state: 'demonstrated', unaidedSolves: 2 });
const withHelp = (): Partial<SkillRecord> => ({ state: 'practised_with_help', assistedSolves: 1 });

function evidence(overrides: Partial<LearnerEvidence> = {}): LearnerEvidence {
  return {
    snapshot: emptySkillSnapshot(),
    available: true,
    lastPractised: {},
    fluency: {},
    blockers: [],
    activeLesson: null,
    corrections: [],
    recentProblem: null,
    ...overrides,
  };
}

const blocker = (diagnosis: BlockerEvidence['diagnosis'], episodes: number): BlockerEvidence => ({
  diagnosis,
  episodes,
  eventIds: Array.from({ length: episodes }, (_, i) => `evt-${diagnosis}-${i}`),
  lastAt: daysAgo(1),
});

/** Both pattern lessons marked known, for tests about what comes after them. */
const patternsKnown = [
  { lessonId: 'hash-map-pair', kind: 'known' as const, at: daysAgo(0) },
  { lessonId: 'two-pointers-ends', kind: 'known' as const, at: daysAgo(0) },
];

const recentProblem = (over: Partial<import('./recommend.js').RecentProblem> = {}) => ({
  slug: 'snake-case',
  title: 'Snake Case',
  patternFamily: 'FOUNDATIONS' as const,
  patternTags: ['strings', 'split', 'join'],
  outcome: 'assisted' as const,
  at: daysAgo(0),
  eventId: 'evt-served-1',
  ...over,
});

describe('recommendLesson', () => {
  it('a recent problem not solved on your own maps to the lesson for its technique', () => {
    const snapshot = snapshotWith({ values: demonstrated(), comparisons: demonstrated() });
    const plan = recommendLesson(evidence({ snapshot, recentProblem: recentProblem() }), 'PYTHON', NOW);
    assert.equal(plan.primary.reasonCode, 'problem');
    assert.equal(plan.primary.lessonId, 'strings-build');
    assert.match(plan.primary.reason, /problems like “Snake Case”/);
    assert.match(plan.primary.reason, /solved with help/);
    assert.deepEqual(plan.primary.evidence.map((e) => e.id), ['evt-served-1']);
  });

  it('a recent problem solved on your own does not pull the recommendation', () => {
    const snapshot = snapshotWith({ values: demonstrated() });
    const plan = recommendLesson(evidence({ snapshot, recentProblem: recentProblem({ outcome: 'unaided' }) }), 'PYTHON', NOW);
    assert.equal(plan.primary.reasonCode, 'frontier');
  });

  it('a hash-map problem left unsolved maps to the pattern lesson, or its unmet prerequisite', () => {
    const all = Object.fromEntries((['values', 'comparisons', 'strings', 'indexing', 'lists', 'loops', 'functions', 'combining'] as Skill[]).map((s) => [s, demonstrated()]));
    const ready = recommendLesson(
      evidence({ snapshot: snapshotWith(all), recentProblem: recentProblem({ title: 'Pair Sum', patternFamily: 'ARRAYS_HASHING', patternTags: ['hash-map'], outcome: 'unsolved' }) }),
      'JAVA',
      NOW,
    );
    assert.equal(ready.primary.reasonCode, 'problem');
    assert.equal(ready.primary.lessonId, 'hash-map-pair');
    assert.match(ready.primary.reason, /did not finish/);

    const beginner = recommendLesson(
      evidence({ snapshot: snapshotWith({ values: demonstrated() }), recentProblem: recentProblem({ patternFamily: 'ARRAYS_HASHING', patternTags: ['hash-map'], outcome: 'unsolved' }) }),
      'JAVA',
      NOW,
    );
    assert.equal(beginner.primary.reasonCode, 'prerequisite');
  });

  it('foundations marked known move on to the patterns, by the recent problem family first', () => {
    const known = ['values-arithmetic', 'comparisons-boundaries', 'strings-build', 'indexing-bounds', 'lists-append', 'loops-running-total', 'functions-return', 'combining-count-map']
      .map((lessonId) => ({ lessonId, kind: 'known' as const, at: daysAgo(0) }));
    const plan = recommendLesson(evidence({ corrections: known }), 'PYTHON', NOW);
    assert.equal(plan.primary.reasonCode, 'pattern');
    assert.equal(plan.primary.lessonId, 'hash-map-pair');
    const nudged = recommendLesson(
      evidence({ corrections: known, recentProblem: recentProblem({ patternFamily: 'TWO_POINTERS', patternTags: ['two-pointers'], outcome: 'unaided' }) }),
      'PYTHON',
      NOW,
    );
    assert.equal(nudged.primary.lessonId, 'two-pointers-ends');
  });

  it('no history: the first lesson, with no invented weakness', () => {
    const plan = recommendLesson(evidence(), 'PYTHON', NOW);
    assert.equal(plan.primary.reasonCode, 'frontier');
    assert.equal(plan.primary.lessonId, 'values-arithmetic');
    assert.match(plan.primary.reason, /Nothing here is based on your history/);
    assert.doesNotMatch(plan.primary.reason, /struggl|weak|wrong/i);
    assert.equal(plan.primary.evidence.length, 0);
    assert.equal(plan.review, null);
    assert.equal(plan.primary.contentVersion, CONTENT_VERSION);
    assert.equal(plan.primary.language, 'PYTHON');
  });

  it('history unavailable: says so, and does not present a beginner', () => {
    const plan = recommendLesson(evidence({ available: false }), 'PYTHON', NOW);
    assert.equal(plan.primary.reasonCode, 'history_unavailable');
    assert.equal(plan.primary.confidence, 'possible');
    assert.match(plan.primary.reason, /could not be read/);
    assert.match(plan.primary.reason, /not an empty history/);
    assert.equal(plan.review, null);
  });

  it('repeated index_bound diagnoses: the bounds lesson, with a cautious reason', () => {
    const snapshot = snapshotWith({ values: demonstrated(), strings: demonstrated(), indexing: withHelp() });
    const plan = recommendLesson(evidence({ snapshot, blockers: [blocker('index_bound', 3)] }), 'PYTHON', NOW);
    assert.equal(plan.primary.reasonCode, 'blocker');
    assert.equal(plan.primary.lessonId, 'indexing-bounds');
    assert.equal(plan.primary.confidence, 'likely');
    assert.equal(plan.primary.evidence.length, 3);
    assert.match(plan.primary.reason, /3 different attempts/);
    assert.match(plan.primary.reason, /not a verdict/);
  });

  it('one index_bound diagnosis is not a blocker', () => {
    const snapshot = snapshotWith({ values: demonstrated(), strings: demonstrated(), indexing: withHelp() });
    const plan = recommendLesson(evidence({ snapshot, blockers: [blocker('index_bound', 1)] }), 'PYTHON', NOW);
    assert.notEqual(plan.primary.reasonCode, 'blocker');
    assert.equal(plan.primary.reasonCode, 'frontier');
  });

  it('syntax errors and timeouts never become a concept claim, however many', () => {
    const snapshot = snapshotWith({ values: demonstrated() });
    const plan = recommendLesson(
      evidence({ snapshot, blockers: [blocker('syntax_error', 5), blocker('timeout', 4), blocker('name_error', 3)] }),
      'JAVA',
      NOW,
    );
    assert.equal(plan.primary.reasonCode, 'frontier');
    assert.equal(plan.primary.evidence.length, 0);
  });

  it('a blocker whose lesson has an unmet prerequisite recommends the prerequisite', () => {
    // accumulator_reset -> loops, which needs lists and comparisons introduced.
    const snapshot = snapshotWith({ values: demonstrated() });
    const plan = recommendLesson(evidence({ snapshot, blockers: [blocker('accumulator_reset', 2)] }), 'GO', NOW);
    assert.equal(plan.primary.reasonCode, 'prerequisite');
    assert.equal(plan.primary.lessonId, 'comparisons-boundaries');
    assert.match(plan.primary.reason, /comes first/);
  });

  it('assisted solves: the skill is frontier, and the copy says "with help", not mastery', () => {
    const snapshot = snapshotWith({ values: demonstrated(), comparisons: withHelp() });
    const plan = recommendLesson(evidence({ snapshot }), 'PYTHON', NOW);
    assert.equal(plan.primary.reasonCode, 'frontier');
    assert.equal(plan.primary.lessonId, 'comparisons-boundaries');
    assert.match(plan.primary.reason, /practised with help but not yet on your own/);
    assert.doesNotMatch(plan.primary.reason, /master/i);
  });

  it('a due review is offered beside new learning and does not replace it', () => {
    const snapshot = snapshotWith({
      values: { state: 'due_for_review', unaidedSolves: 2 },
      comparisons: demonstrated(),
      strings: withHelp(),
    });
    const plan = recommendLesson(evidence({ snapshot }), 'PYTHON', NOW);
    assert.equal(plan.primary.reasonCode, 'frontier');
    assert.equal(plan.primary.lessonId, 'strings-build');
    assert.ok(plan.review);
    assert.equal(plan.review.reasonCode, 'review');
    assert.equal(plan.review.lessonId, 'values-arithmetic');
    assert.match(plan.review.reason, /nothing you earned is lost/);
  });

  it('a due review becomes primary only when nothing new is ready', () => {
    const all = Object.fromEntries((['values', 'comparisons', 'strings', 'indexing', 'lists', 'loops', 'functions', 'combining'] as Skill[]).map((s) => [s, demonstrated()]));
    const snapshot = snapshotWith({ ...all, loops: { state: 'due_for_review', unaidedSolves: 2 } });
    const plan = recommendLesson(evidence({ snapshot, corrections: patternsKnown }), 'PYTHON', NOW);
    assert.equal(plan.primary.reasonCode, 'review');
    assert.equal(plan.primary.lessonId, 'loops-running-total');
    assert.equal(plan.review, null);
  });

  it('Python -> Java: concept history is kept, the Java variant is chosen, fluency is named as unknown', () => {
    const snapshot = snapshotWith({ values: demonstrated(), comparisons: demonstrated(), strings: withHelp() });
    const plan = recommendLesson(
      evidence({ snapshot, fluency: { values: { PYTHON: 2 }, comparisons: { PYTHON: 2 }, strings: { PYTHON: 0 } } }),
      'JAVA',
      NOW,
    );
    assert.equal(plan.primary.lessonId, 'strings-build');
    assert.equal(plan.primary.language, 'JAVA');
    assert.equal(plan.primary.variantAvailable, true);
    // strings has no unaided Python solve either, so no note claims fluency anywhere.
    assert.equal(plan.primary.fluencyNote, null);

    const withValuesDue = snapshotWith({ values: { state: 'due_for_review', unaidedSolves: 2 }, comparisons: demonstrated(), strings: withHelp() });
    const plan2 = recommendLesson(
      evidence({ snapshot: withValuesDue, fluency: { values: { PYTHON: 2 } } }),
      'JAVA',
      NOW,
    );
    assert.ok(plan2.review);
    assert.match(plan2.review.fluencyNote ?? '', /applied this in Python/);
    assert.match(plan2.review.fluencyNote ?? '', /no record of it in Java/);
  });

  it('a resumed lesson wins over everything else', () => {
    const snapshot = snapshotWith({ values: demonstrated() });
    const plan = recommendLesson(
      evidence({
        snapshot,
        blockers: [blocker('index_bound', 3)],
        activeLesson: { lessonId: 'comparisons-boundaries', language: 'PYTHON', contentVersion: CONTENT_VERSION, step: 2 },
      }),
      'PYTHON',
      NOW,
    );
    assert.equal(plan.primary.reasonCode, 'resumed');
    assert.equal(plan.primary.lessonId, 'comparisons-boundaries');
  });

  it('"I know this" moves the next recommendation on without rewriting evidence', () => {
    const base = evidence();
    const before = recommendLesson(base, 'PYTHON', NOW);
    assert.equal(before.primary.lessonId, 'values-arithmetic');

    const after = recommendLesson(
      { ...base, corrections: [{ lessonId: 'values-arithmetic', kind: 'known', at: daysAgo(0) }] },
      'PYTHON',
      NOW,
    );
    assert.equal(after.primary.lessonId, 'comparisons-boundaries');
    // The snapshot is untouched: values is still not_introduced.
    assert.equal(base.snapshot.values.state, 'not_introduced');

    const stale = recommendLesson(
      { ...base, corrections: [{ lessonId: 'values-arithmetic', kind: 'known', at: daysAgo(40) }] },
      'PYTHON',
      NOW,
    );
    assert.equal(stale.primary.lessonId, 'values-arithmetic');
  });

  it('"too hard" steps back to a prerequisite lesson', () => {
    const snapshot = snapshotWith({ values: demonstrated(), comparisons: demonstrated(), strings: demonstrated(), indexing: demonstrated(), lists: demonstrated() });
    const plan = recommendLesson(
      evidence({ snapshot, corrections: [{ lessonId: 'loops-running-total', kind: 'too_hard', at: daysAgo(0) }] }),
      'PYTHON',
      NOW,
    );
    assert.equal(plan.primary.reasonCode, 'prerequisite');
    assert.equal(plan.primary.lessonId, 'comparisons-boundaries');
  });

  it('consolidation uses the most recently practised skill, not iteration order', () => {
    const all = Object.fromEntries((['values', 'comparisons', 'strings', 'indexing', 'lists', 'loops', 'functions', 'combining'] as Skill[]).map((s) => [s, demonstrated()]));
    const plan = recommendLesson(
      evidence({ snapshot: snapshotWith(all), lastPractised: { values: daysAgo(3), functions: daysAgo(1), loops: daysAgo(2) }, corrections: patternsKnown }),
      'CPP',
      NOW,
    );
    assert.equal(plan.primary.reasonCode, 'consolidation');
    assert.equal(plan.primary.lessonId, 'functions-return');
  });

  it('is deterministic and breaks ties in catalog order', () => {
    const snapshot = snapshotWith({ values: demonstrated(), comparisons: demonstrated(), strings: demonstrated(), indexing: demonstrated(), lists: demonstrated() });
    // Two blockers with equal episodes and time: loops (accumulator_reset) and functions (missing_return).
    const two = [blocker('missing_return', 2), blocker('accumulator_reset', 2)];
    const a = recommendLesson(evidence({ snapshot, blockers: two }), 'PYTHON', NOW);
    const b = recommendLesson(evidence({ snapshot, blockers: [...two].reverse() }), 'PYTHON', NOW);
    assert.equal(a.primary.lessonId, b.primary.lessonId);
    // Equal episodes and time: the lesson earlier in the catalog wins.
    assert.equal(a.primary.lessonId, 'loops-running-total');
  });
});

describe('nextNewSkill', () => {
  it('ignores due_for_review and returns the first unfinished ready skill', () => {
    const snapshot = snapshotWith({ values: { state: 'due_for_review', unaidedSolves: 2 }, comparisons: withHelp() });
    assert.equal(nextNewSkill(snapshot), 'comparisons');
  });

  it('returns null when everything is satisfied', () => {
    const all = Object.fromEntries((['values', 'comparisons', 'strings', 'indexing', 'lists', 'loops', 'functions', 'combining'] as Skill[]).map((s) => [s, demonstrated()]));
    assert.equal(nextNewSkill(snapshotWith(all)), null);
  });
});
