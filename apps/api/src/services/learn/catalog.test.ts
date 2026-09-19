import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Language } from '@prisma/client';
import { ALL_PROBLEMS } from '../../corpus/problems/index.js';
import { SKILLS } from '../skills.js';
import { DIAGNOSIS_IDS } from '../tutor/diagnose.js';
import { CATALOG, RESOURCE_ENTRIES, validateCatalog, type Lesson, type ResourceEntry } from './catalog.js';

/**
 * The catalog as shipped must validate against the real corpus, and the
 * validator must actually catch each class of mistake it claims to. The
 * second half builds a broken lesson from a good one and checks the message.
 */

const LANGUAGES = Object.values(Language);
const clone = (lesson: Lesson): Lesson => JSON.parse(JSON.stringify(lesson)) as Lesson;

describe('lesson catalog', () => {
  it('validates as shipped, against the active corpus', () => {
    const problems = validateCatalog(CATALOG, RESOURCE_ENTRIES, ALL_PROBLEMS);
    assert.deepEqual(problems, []);
  });

  it('covers every foundation skill in every supported language', () => {
    for (const skill of SKILLS) {
      const lesson = CATALOG.find((l) => l.skill === skill);
      assert.ok(lesson, `no lesson for ${skill}`);
      for (const language of LANGUAGES) {
        const variant = lesson.variants[language];
        assert.ok(variant, `${lesson.id} has no ${language} variant`);
        assert.ok(variant.example.stdout.length > 0, `${lesson.id} ${language} example has no expected output`);
        assert.ok(variant.task.stdout.length > 0, `${lesson.id} ${language} task has no expected output`);
      }
    }
  });

  it('names only real diagnoses as misconceptions', () => {
    for (const lesson of CATALOG) {
      for (const id of lesson.misconceptions) {
        assert.ok((DIAGNOSIS_IDS as readonly string[]).includes(id), `${lesson.id}: unknown diagnosis ${id}`);
      }
    }
  });

  it('lists a resource entry for every non-foundation family', () => {
    const families = new Set(RESOURCE_ENTRIES.map((e) => e.family));
    for (const family of [
      'ARRAYS_HASHING', 'TWO_POINTERS', 'SLIDING_WINDOW', 'STACK', 'BINARY_SEARCH', 'LINKED_LIST', 'TREES', 'TRIES',
      'HEAP_PRIORITY_QUEUE', 'BACKTRACKING', 'GRAPHS', 'ADVANCED_GRAPHS', 'DP_1D', 'DP_2D', 'GREEDY', 'INTERVALS',
      'MATH_GEOMETRY', 'BIT_MANIPULATION', 'DATA_STRUCTURES',
    ] as const) {
      assert.ok(families.has(family), `no resources for ${family}`);
    }
    for (const entry of RESOURCE_ENTRIES) assert.equal(entry.coverage, 'resources_only');
  });
});

describe('validateCatalog', () => {
  const good = CATALOG[0]!;

  it('rejects a prerequisite that is not in the skill graph', () => {
    const bad = clone(good);
    bad.prerequisites = ['loops'];
    const problems = validateCatalog([bad], [], []);
    assert.ok(problems.some((p) => p.includes('not a prerequisite')), problems.join('\n'));
  });

  it('rejects a lesson that lists itself', () => {
    const bad = clone(good);
    bad.prerequisites = [bad.skill];
    assert.ok(validateCatalog([bad], [], []).some((p) => p.includes('itself')));
  });

  it('rejects an unknown language id', () => {
    const bad = clone(good);
    (bad.variants as Record<string, unknown>)['RUST'] = bad.variants.PYTHON;
    assert.ok(validateCatalog([bad], [], []).some((p) => p.includes('unknown language id RUST')));
  });

  it('rejects a missing variant', () => {
    const bad = clone(good);
    delete (bad.variants as Partial<typeof bad.variants>).GO;
    assert.ok(validateCatalog([bad], [], []).some((p) => p.includes('no GO variant')));
  });

  it('rejects a lesson with no sources, and a source without a section', () => {
    const bad = clone(good);
    bad.sources = [];
    assert.ok(validateCatalog([bad], [], []).some((p) => p.includes('no sources')));
    const bad2 = clone(good);
    bad2.variants.PYTHON.sources[0]!.section = ' ';
    assert.ok(validateCatalog([bad2], [], []).some((p) => p.includes('no section')));
  });

  it('rejects a practice skill no Tier 0 problem needs', () => {
    const bad = clone(good);
    bad.practiceSkill = 'combining';
    const problems = validateCatalog([bad], [], [
      { signatureId: 'fn:int->int', patternTags: ['arithmetic'], tier: 'TIER_0', patternFamily: 'FOUNDATIONS' },
    ]);
    assert.ok(problems.some((p) => p.includes('no Tier 0 problem needs practice skill combining')));
  });

  it('rejects a check whose answer is out of range', () => {
    const bad = clone(good);
    bad.check.answer = 99;
    assert.ok(validateCatalog([bad], [], []).some((p) => p.includes('out of range')));
  });

  it('rejects duplicate ids and duplicate resource families', () => {
    assert.ok(validateCatalog([good, clone(good)], [], []).some((p) => p.includes('duplicate id')));
    const entry: ResourceEntry = RESOURCE_ENTRIES[0]!;
    assert.ok(validateCatalog([], [entry, entry], []).some((p) => p.includes('duplicate family')));
  });
});
