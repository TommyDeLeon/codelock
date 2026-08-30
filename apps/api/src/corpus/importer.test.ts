import { describe, expect, it, vi } from 'vitest';

// The importer imports prisma at module load. These tests exercise only its
// pure parts, so the client is stubbed rather than connected.
vi.mock('../lib/prisma.js', () => ({ prisma: {} }));

import { blockingGaps, generateNotice, validateDefinition } from './importer.js';
import { AUTHORED, type ProblemDefinition } from './problem.js';
import { ALL_PROBLEMS, TIER_0_PROBLEMS } from './problems/index.js';
import { SIGNATURE_IDS } from './signatures.js';

const def = (over: Partial<ProblemDefinition> = {}): ProblemDefinition => ({
  slug: 'example',
  title: 'Example',
  difficulty: 'EASY',
  tier: 'TIER_0',
  patternFamily: 'FOUNDATIONS',
  patternTags: [],
  signatureId: 'fn:ints->int',
  promptMarkdown: 'Do the thing.',
  editorialMarkdown: 'Here is how.',
  referenceSolution: { JAVASCRIPT: 'function solve(a) { return 0; }' },
  tests: [{ stdin: '1', expectedStdout: '1' }],
  provenance: AUTHORED,
  ...over,
});

describe('what stops a problem being served', () => {
  it('accepts a complete definition with measured runtimes', () => {
    expect(blockingGaps(def(), { JAVASCRIPT: 40 })).toEqual([]);
  });

  it.each([
    ['no test cases', def({ tests: [] }), /test cases/],
    ['no reference solution', def({ referenceSolution: {} }), /reference solution/],
    ['no signature', def({ signatureId: '' }), /signatureId/],
  ])('refuses to activate a problem with %s', (_label, definition, pattern) => {
    const gaps = blockingGaps(definition, { JAVASCRIPT: 40 });
    expect(gaps.some((g) => pattern.test(g))).toBe(true);
  });

  it('refuses to activate an unmeasured problem', () => {
    // An uncalibrated speed gate is not a slightly wrong number, it is a
    // lockout: the reference itself may not beat it.
    expect(blockingGaps(def(), undefined).some((g) => /referenceRuntimeMs/.test(g))).toBe(true);
    expect(blockingGaps(def(), {}).some((g) => /referenceRuntimeMs/.test(g))).toBe(true);
  });

  it('treats runtimes carried over from an earlier measured run as measured', () => {
    // Regression. `blockingGaps` is given the *effective* runtimes — this run's
    // measurements, or the ones already stored on the row. It used to be given
    // only what this run measured, so a plain `import:corpus` with no --measure
    // deactivated every problem that was already measured and live: a silent,
    // total corpus outage triggered by a routine command.
    const carriedOver = { JAVASCRIPT: 40, PYTHON: 90 };
    expect(blockingGaps(def(), carriedOver)).toEqual([]);
  });

  it('explains every gap rather than just saying no', () => {
    const gaps = blockingGaps(def({ tests: [], referenceSolution: {} }), undefined);
    expect(gaps.length).toBe(3);
    for (const gap of gaps) expect(gap.length).toBeGreaterThan(10);
  });
});

describe('validation', () => {
  it('rejects a signature the registry does not have', () => {
    expect(() => validateDefinition(def({ signatureId: 'fn:made->up' }))).toThrowError(
      /Unknown signatureId/,
    );
  });

  it.each(['source', 'sourceUrl', 'sourceLicense', 'sourceRef'] as const)(
    'rejects a missing provenance.%s',
    (field) => {
      const broken = def({ provenance: { ...AUTHORED, [field]: '  ' } });
      expect(() => validateDefinition(broken)).toThrowError(new RegExp(`provenance.${field}`));
    },
  );

  it('demands attribution wording for every licence except CC0', () => {
    // Project Euler supplies its own sentence and requires it verbatim. An
    // empty string here would under-attribute a licence we rely on.
    const nc = def({
      provenance: {
        source: 'project-euler',
        sourceUrl: 'https://projecteuler.net/',
        sourceLicense: 'CC-BY-NC-SA-4.0',
        attributionText: '',
        sourceRef: 'project-euler:1',
      },
    });
    expect(() => validateDefinition(nc)).toThrowError(/requires attributionText/);

    nc.provenance.attributionText = 'The following problem is taken from Project Euler';
    expect(() => validateDefinition(nc)).not.toThrow();
  });

  it('lets CC0 leave attribution empty, since it genuinely requires none', () => {
    expect(() => validateDefinition(def())).not.toThrow();
  });
});

describe('the authored corpus', () => {
  // Runs over every batch, not just Tier 0. Batches are authored in parallel by
  // different hands, so these are the checks that keep the corpus one corpus.

  it('passes validation, every problem', () => {
    for (const problem of ALL_PROBLEMS) {
      expect(() => validateDefinition(problem), problem.slug).not.toThrow();
    }
  });

  it('has no duplicate slugs, across every batch', () => {
    // Two authors independently reaching for `reverse-a-string` is the obvious
    // failure mode of parallel authoring. The database's unique constraint
    // would catch it only halfway through an import.
    const slugs = ALL_PROBLEMS.map((x) => x.slug);
    const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    expect(duplicates, `duplicate slugs: ${duplicates.join(', ')}`).toEqual([]);
  });

  it('uses kebab-case slugs, so the URL space stays predictable', () => {
    for (const problem of ALL_PROBLEMS) {
      expect(problem.slug, problem.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('points every problem at a real signature', () => {
    for (const problem of ALL_PROBLEMS) {
      expect(SIGNATURE_IDS, problem.slug).toContain(problem.signatureId);
    }
  });

  it('keeps Tier 0 and Tier 0.5 in their own pattern families', () => {
    // FOUNDATIONS and DATA_STRUCTURES have no structural prerequisites, which
    // is what makes them the way in. A Tier 1 family leaking into them would
    // hand a beginner a gated problem on their first lock.
    for (const problem of ALL_PROBLEMS) {
      if (problem.tier === 'TIER_0') expect(problem.patternFamily, problem.slug).toBe('FOUNDATIONS');
      if (problem.tier === 'TIER_0_5') {
        expect(problem.patternFamily, problem.slug).toBe('DATA_STRUCTURES');
      }
    }
  });

  it('gives every Tier 0.5 problem a class signature', () => {
    // Tier 0.5 is "build the structure". A free-function signature there would
    // quietly turn it into an ordinary problem.
    for (const problem of ALL_PROBLEMS.filter((x) => x.tier === 'TIER_0_5')) {
      expect(problem.signatureId, problem.slug).toMatch(/^cls:/);
    }
  });

  it('ships an editorial and a reference solution for every problem', () => {
    // A user who fails must not leave with nothing. That is the product's
    // purpose for this audience, so it is a property of the corpus, not a hope.
    for (const problem of ALL_PROBLEMS) {
      expect(problem.editorialMarkdown.length, problem.slug).toBeGreaterThan(200);
      expect(Object.keys(problem.referenceSolution).length, problem.slug).toBe(6);
    }
  });

  it('ships a reference solution in all six languages', () => {
    // Five out of six means somebody's debrief is empty.
    for (const problem of ALL_PROBLEMS) {
      for (const lang of ['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CPP', 'GO'] as const) {
        expect(problem.referenceSolution[lang], `${problem.slug} ${lang}`).toBeTruthy();
      }
    }
  });

  it('ships enough test cases to judge each problem meaningfully', () => {
    for (const problem of ALL_PROBLEMS) {
      expect(problem.tests.length, problem.slug).toBeGreaterThanOrEqual(4);
      expect(problem.tests.filter((t) => t.isSample).length, problem.slug).toBeGreaterThanOrEqual(1);
    }
  });

  it('still has its Tier 0 foundations', () => {
    expect(TIER_0_PROBLEMS.length).toBeGreaterThanOrEqual(12);
  });
});

describe('the generated NOTICE', () => {
  const rows = [
    {
      source: 'codelock-authored',
      sourceUrl: 'https://example.invalid',
      sourceLicense: 'CC0-1.0',
      attributionText: '',
    },
    {
      source: 'codelock-authored',
      sourceUrl: 'https://example.invalid',
      sourceLicense: 'CC0-1.0',
      attributionText: '',
    },
    {
      source: 'project-euler',
      sourceUrl: 'https://projecteuler.net/',
      sourceLicense: 'CC-BY-NC-SA-4.0',
      attributionText: 'The following problem is taken from Project Euler',
    },
  ];

  it('groups by source and counts each', () => {
    const notice = generateNotice(rows);
    expect(notice).toContain('## codelock-authored (2 problems)');
    expect(notice).toContain('## project-euler (1 problem)');
  });

  it('reproduces required attribution wording verbatim', () => {
    expect(generateNotice(rows)).toContain('The following problem is taken from Project Euler');
  });

  it('names every licence it relies on', () => {
    const notice = generateNotice(rows);
    expect(notice).toContain('CC0-1.0');
    expect(notice).toContain('CC-BY-NC-SA-4.0');
  });

  it('tells the reader not to edit it by hand', () => {
    // A hand-edited notice drifts from the data, and a licence notice that does
    // not match what shipped is worse than none — it is a false claim.
    expect(generateNotice(rows)).toMatch(/Do not edit by\s*\n?hand/);
  });

  it('produces something coherent for an empty corpus', () => {
    expect(generateNotice([])).toContain('Sources: 0. Problems: 0.');
  });
});
