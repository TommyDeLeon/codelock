import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALL_PROBLEMS } from '../../corpus/problems/index.js';
import { STARTER_PACKS } from './starter.js';

/**
 * The reference tracers are shown to learners as "values from a checked
 * reference solution". This is the check: every tracer must end in the
 * expected output of every one of its problem's tests, hidden ones included.
 */
describe('starter packs', () => {
  for (const pack of Object.values(STARTER_PACKS)) {
    const def = ALL_PROBLEMS.find((p) => p.slug === pack.slug);

    it(`${pack.slug} exists in the corpus`, () => {
      assert.ok(def, `no corpus problem named ${pack.slug}`);
    });

    it(`${pack.slug} tracer agrees with every test`, () => {
      for (const test of def!.tests) {
        const table = pack.trace(test.stdin);
        assert.ok(table, `tracer returned null for ${JSON.stringify(test.stdin)}`);
        assert.equal(table.result, test.expectedStdout.trim(), `input ${JSON.stringify(test.stdin)}`);
      }
    });

    it(`${pack.slug} smaller example is traceable and smaller`, () => {
      for (const test of def!.tests.filter((t) => t.isSample)) {
        const smaller = pack.smaller(test.stdin);
        if (smaller === null) continue;
        assert.ok(smaller.length < test.stdin.length, 'smaller input is not smaller');
        assert.ok(pack.trace(smaller), 'smaller input cannot be traced');
      }
    });

    it(`${pack.slug} outline has exactly one gap and is not the whole reference`, () => {
      assert.equal(pack.outline.split('___').length - 1, 1);
      // Pseudocode may share a trivial line with the reference ("total = 0");
      // what it must not do is contain every substantive line of it.
      const reference = (def!.referenceSolution as Record<string, string>).PYTHON ?? '';
      const lines = reference
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 8 && !l.startsWith('def '));
      assert.ok(
        lines.length === 0 || lines.some((line) => !pack.outline.includes(line)),
        'outline reproduces the reference solution',
      );
    });

    it(`${pack.slug} check-understanding problem exists and differs`, () => {
      assert.notEqual(pack.checkUnderstanding.slug, pack.slug);
      assert.ok(ALL_PROBLEMS.some((p) => p.slug === pack.checkUnderstanding.slug));
    });
  }

});
