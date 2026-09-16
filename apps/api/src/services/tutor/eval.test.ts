import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import type { HintLevel, HintRequestKind, HintView, Language } from '@codelock/shared';
import { ALL_PROBLEMS } from '../../corpus/problems/index.js';
import { driversFor } from '../../corpus/signatures.js';
import { BY_FAMILY } from '../hints.js';
import { diagnose, type Diagnosis, type Evidence } from './diagnose.js';
import { EVAL_CASES, type EvalCase } from './evalset.js';
import { buildHint, hashCode, topDiagnosis, type HintHistoryItem } from './ladder.js';

/**
 * Hint quality, checked against real execution.
 *
 * Every case's evidence comes from `fixtures/eval-runs.json`, recorded by
 * running the case's code on the actual judge. The checks follow the brief:
 * technically correct, about the actual problem, one actionable next step,
 * respectful of valid alternatives, meaningfully stronger at each level, no
 * premature answer at level 1, and no invented execution evidence.
 *
 * What this cannot establish: whether a beginner actually finds a hint
 * understandable. That needs people, and the panel collects feedback for it.
 */

interface RecordedRun {
  ran: boolean;
  compileError: string | null;
  cases: Array<{
    ordinal: number | null;
    stdin: string;
    stdout: string | null;
    stderr: string | null;
    status: string;
    expectedStdout: string | null;
    matched: boolean | null;
  }>;
}

// Resolved from the working directory rather than import.meta, which the
// CommonJS build does not allow. Tests run from apps/api or the repository root.
const FIXTURE = ['src/services/tutor/fixtures/eval-runs.json', 'apps/api/src/services/tutor/fixtures/eval-runs.json']
  .map((p) => resolve(process.cwd(), p))
  .find((p) => existsSync(p));
assert.ok(FIXTURE, 'eval-runs.json not found; run tests from apps/api');
const fixtures = JSON.parse(readFileSync(FIXTURE, 'utf8')) as { runs: Record<string, RecordedRun> };

function evidenceFor(kase: EvalCase): Evidence {
  const run = fixtures.runs[kase.id];
  assert.ok(run, `no recorded run for ${kase.id}; run npm run record:hint-fixtures`);
  return {
    ran: true,
    compileError: run.compileError,
    hiddenFailure: null,
    cases: run.cases.map((c) => ({
      ordinal: c.ordinal,
      stdin: c.stdin,
      expected: c.expectedStdout,
      actual: c.stdout,
      stderr: c.stderr,
      status: c.status,
      passed: c.matched === true,
      hidden: false,
    })),
  };
}

function setup(kase: EvalCase, evidence: Evidence = evidenceFor(kase)) {
  const def = ALL_PROBLEMS.find((p) => p.slug === kase.slug);
  assert.ok(def, kase.slug);
  const drivers = driversFor(def.signatureId) as Record<string, string>;
  const driver = drivers[kase.language] ?? '';
  const lineOffset = driver.includes('{{SOLUTION}}')
    ? driver.split('{{SOLUTION}}')[0]!.split('\n').length - 1
    : 0;
  const diagnoses = diagnose({
    language: kase.language,
    code: kase.code,
    starterCode: null,
    signatureId: def.signatureId,
    promptMarkdown: def.promptMarkdown,
    patternTags: def.patternTags,
    evidence,
    lineOffset,
  });
  const hint = (
    request: HintRequestKind,
    extra: { level?: HintLevel; term?: string; history?: HintHistoryItem[] } = {},
  ) =>
    buildHint({
      problem: {
        slug: def.slug,
        title: def.title,
        signatureId: def.signatureId,
        promptMarkdown: def.promptMarkdown,
        patternTags: def.patternTags,
        editorialMarkdown: def.editorialMarkdown ?? null,
        referenceSolution: def.referenceSolution as Partial<Record<Language, string>>,
        sampleCases: def.tests
          .filter((t) => t.isSample)
          .map((t) => ({ stdin: t.stdin, expectedStdout: t.expectedStdout })),
        familyConcept: BY_FAMILY[def.patternFamily][1],
      },
      language: kase.language,
      code: kase.code,
      codeHash: hashCode(kase.code),
      evidence,
      diagnoses,
      request,
      level: extra.level,
      term: extra.term,
      history: extra.history ?? [],
      prerequisiteNote: null,
    });
  return { def, diagnoses, evidence, hint, top: topDiagnosis(diagnoses) };
}

const textOf = (h: HintView) =>
  [h.notice, h.explain, h.tryThis, h.body, h.trace?.divergence, h.code?.text].filter(Boolean).join('\n');
const promptText = (h: HintView) => [h.notice, h.explain, h.tryThis].filter(Boolean).join('\n');
const record = (h: HintView, code: string): HintHistoryItem => ({
  level: h.level,
  strategy: h.strategy,
  diagnosis: h.diagnosis,
  codeHash: hashCode(code),
});

const VAGUE = /edge cases|think about|be careful|double[- ]check|consider (the|all)|make sure your code works/i;
const ACTIONABLE =
  /\?(\s|$)|^(Tick|Write|Press|Submit|Work|Read|Temporarily|Trace|Look|Find|Follow|Remove|Take|Print|Before|Turn|Run|Finish|Reread|Search)\b/;

describe('hint evaluation set (real execution)', () => {
  it('covers every required category', () => {
    const categories = new Set(EVAL_CASES.map((c) => c.category));
    for (const needed of [
      'off_by_one',
      'empty_input',
      'comparison',
      'unnecessary_loop',
      'return_in_loop',
      'print_vs_return',
      'syntax',
      'alternative',
    ]) {
      assert.ok(categories.has(needed as EvalCase['category']), needed);
    }
  });

  for (const kase of EVAL_CASES) {
    describe(kase.id, () => {
      it('leads with an accurate diagnosis', () => {
        const { top, diagnoses } = setup(kase);
        assert.ok(
          kase.expect.includes(top.id),
          `top was ${top.id} (${top.confidence}); all: ${diagnoses
            .map((d: Diagnosis) => `${d.id}:${d.confidence}:${d.blocking}`)
            .join(', ')}`,
        );
      });

      it('gives one actionable, grounded first step', () => {
        const { hint, def, top } = setup(kase);
        const first = hint('next');
        assert.equal(first.level, 1);
        const text = promptText(first);
        assert.ok(first.tryThis, 'no next step');
        assert.ok(ACTIONABLE.test(first.tryThis!), `not actionable: ${first.tryThis}`);
        assert.ok(!VAGUE.test(text), `vague: ${text}`);

        const opening = def.promptMarkdown.split('\n')[0]!.trim();
        assert.ok(!text.includes(opening), 'restates the problem');

        for (const mention of kase.mentions ?? []) {
          assert.ok(textOf(first).includes(mention), `missing "${mention}" in:\n${textOf(first)}`);
        }
        // Syntax and name errors do not depend on the input, so they are
        // grounded in the line instead.
        if (top.kase && !top.kase.hidden && !['syntax_error', 'name_error'].includes(top.id)) {
          const firstLine = top.kase.stdin.split('\n')[0]!.trim();
          const grounded = firstLine === '' ? /empty/i.test(text) : text.includes(firstLine);
          assert.ok(grounded, `does not point at the failing input ${JSON.stringify(top.kase.stdin)}:\n${text}`);
        }
      });

      it('does not reveal the answer at level 1', () => {
        const { hint, def } = setup(kase);
        const first = hint('next');
        assert.equal(first.code, null);
        const reference = (def.referenceSolution as Record<string, string>)[kase.language] ?? '';
        const learnerLines = new Set(kase.code.split('\n').map((l) => l.trim()));
        for (const line of reference.split('\n').map((l) => l.trim())) {
          if (line.length < 12 || learnerLines.has(line)) continue;
          assert.ok(!textOf(first).includes(line), `level 1 contains reference line "${line}"`);
        }
      });

      if (kase.expect.includes('passing')) {
        it('respects a valid alternative', () => {
          const { hint, diagnoses } = setup(kase);
          assert.ok(!diagnoses.some((d) => d.blocking), 'a blocking finding on passing code');
          const first = hint('next');
          assert.equal(first.diagnosis, 'passing');
          assert.match(first.notice ?? '', /passes all/);
          assert.ok(!/\b(wrong|bug|mistake|incorrect|broken)\b/i.test(promptText(first)), promptText(first));
          assert.equal(first.evidence.suspicion, null);
        });
      }

      it('never invents execution evidence when the code was not run', () => {
        const { hint } = setup(kase, { ran: false, reason: 'judge_unavailable', hiddenFailure: null });
        for (const level of [1, 2, 3] as HintLevel[]) {
          const h = hint('level', { level });
          assert.equal(h.evidence.ran, false);
          assert.match(h.analysisNote, /not run/);
          assert.match(h.evidence.summary, /could not be run/);
          assert.ok(
            !/your code (printed|stopped|gave back|ran until)|Ran your current code|passes all/i.test(textOf(h)),
            textOf(h),
          );
          if (h.trace) assert.notEqual(h.trace.grounding, 'executed');
          if (h.evidence.suspicion) assert.notEqual(h.evidence.suspicion.confidence, 'confirmed');
        }
      });
    });
  }
});

describe('progressive help', () => {
  const bugs = EVAL_CASES.filter((c) => !c.expect.includes('passing'));

  for (const kase of bugs) {
    it(`${kase.id}: each level is a different kind of help`, () => {
      const { hint, def } = setup(kase);
      const levels = ([1, 2, 3, 4, 5] as HintLevel[]).map((level) => hint('level', { level }));
      assert.deepEqual(
        levels.map((h) => h.level),
        [1, 2, 3, 4, 5],
      );
      assert.equal(new Set(levels.map(textOf)).size, 5, 'two levels produced identical text');
      assert.ok(levels[1]!.trace, 'level 2 has no trace');
      assert.ok(levels[2]!.body, 'level 3 has no explanation');
      assert.ok(
        levels[3]!.code?.text.includes('___') || levels[3]!.body?.includes('no reviewed outline'),
        'level 4 has no gap',
      );
      const reference = (def.referenceSolution as Record<string, string>)[kase.language];
      assert.equal(levels[4]!.code?.text, reference, 'level 5 is not the worked solution');
      assert.ok(levels[4]!.body && levels[4]!.body.length > 80, 'level 5 has no reasoning');
    });

    it(`${kase.id}: "that didn't help" changes the approach`, () => {
      const { hint } = setup(kase);
      const first = hint('next');
      const second = hint('didnt_help', { history: [record(first, kase.code)] });
      assert.notEqual(second.strategy, first.strategy);
      assert.notEqual(textOf(second), textOf(first));
      assert.ok(second.escalationNote);
      const third = hint('didnt_help', { history: [record(first, kase.code), record(second, kase.code)] });
      assert.ok(third.level > second.level, 'did not step up once strategies ran out');
      assert.notEqual(textOf(third), textOf(second));
    });
  }

  it('"show a different explanation" switches the explanation', () => {
    const { hint } = setup(EVAL_CASES.find((c) => c.id === 'sum-reset-in-loop-py')!);
    const concept = hint('level', { level: 3 });
    const other = hint('different_explanation', { history: [record(concept, 'x')] });
    assert.equal(other.level, 3);
    assert.notEqual(other.strategy, concept.strategy);
    assert.notEqual(other.body, concept.body);
  });

  it('"give me a smaller example" shrinks the input and labels it', () => {
    const { hint } = setup(EVAL_CASES.find((c) => c.id === 'sum-reset-in-loop-py')!);
    const smaller = hint('smaller_example');
    assert.equal(smaller.trace?.grounding, 'reference');
    assert.match(smaller.trace!.groundingNote, /not run/);
    assert.match(smaller.trace!.title, /smaller/i);
  });

  it('"show the values step by step" traces the failing example with the real output', () => {
    const { hint } = setup(EVAL_CASES.find((c) => c.id === 'sum-reset-in-loop-py')!);
    const trace = hint('step_by_step');
    assert.equal(trace.level, 2);
    assert.deepEqual(trace.trace!.rows.at(-1), ['after the loop: return', '', '10']);
    assert.match(trace.trace!.divergence ?? '', /printed `4`/);
    assert.match(trace.trace!.divergence ?? '', /last number/);
  });

  it('"explain this word" defines it plainly', () => {
    const { hint } = setup(EVAL_CASES.find((c) => c.id === 'nth-unguarded-py')!);
    const word = hint('explain_word', { term: 'index' });
    assert.match(word.body ?? '', /Counting starts at 0/);
  });

  it('names the words it uses so they can be explained', () => {
    const { hint } = setup(EVAL_CASES.find((c) => c.id === 'nth-unguarded-py')!);
    const first = hint('next');
    assert.ok(first.terms.some((t) => t.term === 'index'), JSON.stringify(first.terms));
  });
});

describe('the example from the brief', () => {
  it('asks what must be true before a[b] is safe, with the real sizes', () => {
    const { hint } = setup(EVAL_CASES.find((c) => c.id === 'nth-unguarded-py')!);
    const first = hint('next');
    assert.match(first.notice ?? '', /has 5 characters, so its positions are 0 to 4/);
    assert.match(first.notice ?? '', /b = 9/);
    assert.match(first.tryThis ?? '', /What must be true about `b` before `a\[b\]` is safe\?/);
    // This problem says positions are never negative, so no negative-index note.
    assert.ok(!/negative/.test(first.tryThis ?? ''));
  });

  it('mentions Python negative indexes when the problem does not rule them out', () => {
    const kase = EVAL_CASES.find((c) => c.id === 'nth-unguarded-py')!;
    const { def, evidence } = setup(kase);
    // Strip whatever sentence or bullet rules negatives out; the statement's
    // exact wording is rewritten over time and the rule in `ladder.ts` reads
    // any of these phrasings.
    const prompt = def.promptMarkdown.replace(/[^.\n]*(never negative|not negative|non-?negative)[^.\n]*[.\n]?/gi, '');
    assert.ok(!/never negative|not negative|non-?negative/i.test(prompt), 'the rule must be gone for this test');
    const diagnoses = diagnose({
      language: 'PYTHON',
      code: kase.code,
      starterCode: null,
      signatureId: def.signatureId,
      promptMarkdown: prompt,
      patternTags: def.patternTags,
      evidence,
      lineOffset: 0,
    });
    const h = buildHint({
      problem: {
        slug: 'custom-no-negative-rule',
        title: 'Custom',
        signatureId: def.signatureId,
        promptMarkdown: prompt,
        patternTags: def.patternTags,
        editorialMarkdown: null,
        referenceSolution: {},
        sampleCases: [],
        familyConcept: 'x',
      },
      language: 'PYTHON',
      code: kase.code,
      codeHash: 'h',
      evidence,
      diagnoses,
      request: 'next',
      history: [],
      prerequisiteNote: null,
    });
    assert.match(h.tryThis ?? '', /negative positions/);
  });
});

describe('reassessing after the code changes', () => {
  it('stops discussing a mistake that was fixed', () => {
    const broken = EVAL_CASES.find((c) => c.id === 'sum-reset-in-loop-py')!;
    const fixed = EVAL_CASES.find((c) => c.id === 'sum-builtin-py')!;
    const before = setup(broken).hint('next');
    assert.equal(before.diagnosis, 'accumulator_reset');
    const after = setup(fixed).hint('next', { history: [record(before, broken.code)] });
    assert.equal(after.diagnosis, 'passing');
    assert.ok(after.resolvedNote, 'no note that the earlier issue was fixed');
    assert.ok(!/total = 0/.test(promptText(after)), 'still talks about the fixed line');
  });

  it('starts a new issue at level 1 instead of continuing the old ladder', () => {
    const first = EVAL_CASES.find((c) => c.id === 'sum-missing-colon-py')!;
    const second = EVAL_CASES.find((c) => c.id === 'sum-reset-in-loop-py')!;
    const syntax = setup(first).hint('level', { level: 3 });
    const next = setup(second).hint('next', { history: [record(syntax, first.code)] });
    assert.equal(next.diagnosis, 'accumulator_reset');
    assert.equal(next.level, 1);
  });
});

describe('regressions from review', () => {
  it('does not call an expression-bodied arrow "no return"', () => {
    const diagnoses = diagnose({
      language: 'JAVASCRIPT',
      code: 'const solve = a => a.reduce((sum, n) => sum + n, 0);',
      starterCode: null,
      signatureId: 'fn:ints->int',
      promptMarkdown: 'Add up every number in a list.',
      patternTags: ['accumulator'],
      evidence: {
        ran: true,
        compileError: null,
        hiddenFailure: null,
        cases: [{ ordinal: 0, stdin: '1 2', expected: '3', actual: 'undefined', stderr: null, status: 'Wrong Answer', passed: false, hidden: false }],
      },
      lineOffset: 0,
    });
    // The arrow does return, so this can never be a confirmed 'no return'
    // or a print-instead-of-return claim.
    assert.ok(!diagnoses.some((d) => d.id === 'print_not_return'));
    assert.ok(!diagnoses.some((d) => d.id === 'missing_return' && d.confidence === 'confirmed'));
  });
});
