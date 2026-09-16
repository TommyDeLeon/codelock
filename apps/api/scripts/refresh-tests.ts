/**
 * Replace the test data of hand-authored problems whose examples mirror a
 * well-known problem's, then let the statement pass rewrite them around the
 * new data.
 *
 * ## Why
 *
 * The statement rewrite (`upgrade-statements.ts`) keeps tests fixed, so a
 * problem whose *tests* reuse a famous example — "flower flow flight" for
 * a common prefix — can only ever be paraphrased around that example. The
 * reviewer flags it every time, and skipping keeps the exposure. The fix is
 * new inputs. Expected outputs are never invented: every candidate input is
 * run through all six reference solutions on the judge, and only inputs on
 * which all six agree become tests. The references were already verified
 * against the old tests, so their agreement on new inputs is the ground
 * truth.
 *
 * ## The gate
 *
 * 1. Takes problems recorded as `skipped` in `upgrades.ts` for "closely
 *    follows" (not for ambiguity — that is a wording problem, not a data
 *    problem), a few at a time.
 * 2. A model proposes ≥ 10 fresh inputs per problem in the wire format,
 *    told what the old inputs were and to avoid them and any well-known
 *    values.
 * 3. The judge runs each input through the six references. An input is
 *    kept only if all six produce the same output; a problem is kept only
 *    if ≥ 8 inputs survive.
 * 4. The new tests are written to the overlay (`tests` on the upgrade
 *    entry) and the `skipped` mark is cleared, so the statement pass will
 *    rewrite the statement around them on its next round.
 *
 *   npm run refresh:batch -- --count 4 [--model gemini-3.1-pro-low] [--dry-run]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ALL_PROBLEMS } from '../src/corpus/problems/index.js';
import type { ProblemDefinition } from '../src/corpus/problem.js';
import { driversFor } from '../src/corpus/signatures.js';
import { LANGUAGES, type Lang } from '../src/corpus/types.js';
import { UPGRADES, type StatementUpgrade } from '../src/corpus/upgrades.js';
import { isJudgeUp, normalise, runBatch, unb64, type Run } from './judge-client.js';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 || !process.argv[i + 1] ? fallback : process.argv[i + 1]!;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const count = Number(arg('count', '4'));
const model = arg('model', 'gemini-3.1-pro-low');
const dryRun = flag('dry-run');
const upgradesPath = join('src', 'corpus', 'upgrades.ts');

/** Skipped for borrowed examples, and not yet refreshed. */
const pending = ALL_PROBLEMS.filter((p) => {
  const up = UPGRADES[p.slug];
  return up?.skipped && /closely follows/i.test(up.skipped) && !up.tests;
});
const batch = pending.slice(0, count);

const WIRE_FORMAT = `
Wire format (stdin is one parameter per line; stdout is the return value):
- int: decimal · double: 6 decimals · bool: "true"/"false" · string: raw line
- int[]: space-separated on one line (empty list = empty line) · string[]: whitespace-separated tokens
- int[][]: rows separated by ";" · tree: level order with "null" · linked list: space-separated values
- operation-log (class) problems: first line is the number of lines that follow, second line is the class name, then one operation per line, exactly as the old inputs show.
`;

function brief(problems: ProblemDefinition[]): string {
  return `You are proposing NEW TEST INPUTS for programming problems in CodeLock, an open-source (CC0) learning app. For each problem below, propose at least 10 inputs (stdin strings) in the wire format. Do not propose expected outputs; they will be computed by running verified reference solutions.

Rules:
- Every input must be valid for the problem (respect the statement's constraints and the parameter shapes shown by the old inputs).
- None may equal any of the old inputs listed, and avoid the well-known example values of the famous problem this one resembles: invent different numbers, words and sizes.
- Cover: a minimal or empty case where the constraints allow it, a single element, duplicates, negatives where the type allows, an "answer is zero / false / empty" case, and one larger case (≤ 40 values) that is still readable.
- The first two inputs should be small and illustrative, since they become the visible examples.
${WIRE_FORMAT}
${problems
  .map(
    (p) => `## ${p.slug}
signature: ${p.signatureId}
Statement:
${p.promptMarkdown}
Old inputs (do not reuse):
${p.tests.map((t) => JSON.stringify(t.stdin)).join('\n')}`,
  )
  .join('\n\n')}

Return JSON matching the schema.`;
}

const schema = {
  type: 'object',
  properties: {
    problems: {
      type: 'array',
      items: {
        type: 'object',
        properties: { slug: { type: 'string' }, inputs: { type: 'array', items: { type: 'string' } } },
        required: ['slug', 'inputs'],
      },
    },
  },
  required: ['problems'],
};

function propose(problems: ProblemDefinition[]): Array<{ slug: string; inputs: string[] }> {
  const dir = mkdtempSync(join(tmpdir(), 'codelock-refresh-'));
  const schemaPath = join(dir, 'schema.json');
  const briefPath = join(dir, 'brief.md');
  writeFileSync(schemaPath, JSON.stringify(schema));
  writeFileSync(briefPath, brief(problems));
  console.log(`  asking ${model} for fresh inputs for ${problems.length} problem(s) ...`);
  const raw = execFileSync(
    'agy',
    [
      `--print=Read the brief at ${briefPath} and do exactly what it says. Return JSON matching the schema.`,
      '--mode', 'plan', '--dangerously-skip-permissions', '--add-dir', dir,
      '--model', model, '--output-format', 'json', '--json-schema', schemaPath,
      '--print-timeout', '15m', '--disable-slash-commands',
    ],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true },
  );
  const parsed = JSON.parse(raw) as {
    status?: string;
    structured_output?: { problems?: Array<{ slug: string; inputs: string[] }> };
  };
  if (parsed.status !== 'SUCCESS' || !parsed.structured_output?.problems) {
    throw new Error(`${model} returned nothing usable: ${raw.slice(0, 300)}`);
  }
  return parsed.structured_output.problems;
}

/** Expected output per input, or null where the six references disagree or fail. */
async function computeExpected(
  p: ProblemDefinition,
  inputs: string[],
): Promise<Array<{ stdin: string; expectedStdout: string } | null>> {
  const drivers = driversFor(p.signatureId);
  const runs: Run[] = [];
  const keys: Array<{ i: number; lang: Lang }> = [];
  for (const lang of LANGUAGES) {
    const source = drivers[lang].replace('{{SOLUTION}}', p.referenceSolution[lang] ?? '');
    inputs.forEach((stdin, i) => {
      runs.push({ language: lang, source, stdin });
      keys.push({ i, lang });
    });
  }
  const results = await runBatch(runs);
  const byInput = new Map<number, Map<Lang, string | null>>();
  results.forEach((r, k) => {
    const { i, lang } = keys[k]!;
    const ok = (typeof r.status === 'number' ? r.status : (r.status?.id ?? 0)) === 3;
    const m = byInput.get(i) ?? new Map<Lang, string | null>();
    m.set(lang, ok ? normalise(unb64(r.stdout)) : null);
    byInput.set(i, m);
  });
  return inputs.map((stdin, i) => {
    const outs = [...(byInput.get(i)?.values() ?? [])];
    if (outs.length !== LANGUAGES.length || outs.some((o) => o === null)) return null;
    const first = outs[0]!;
    return outs.every((o) => o === first) ? { stdin, expectedStdout: first } : null;
  });
}

function withLock<T>(fn: () => T): T {
  const lockDir = join('src', 'corpus', '.author-lock');
  const started = Date.now();
  for (;;) {
    try {
      mkdirSync(lockDir);
      break;
    } catch {
      let age = 0;
      try {
        age = Date.now() - statSync(lockDir).mtimeMs;
      } catch {
        continue;
      }
      if (age > 10 * 60_000) {
        try {
          rmSync(lockDir, { recursive: true, force: true });
        } catch {
          /* taken by another worker */
        }
        continue;
      }
      if (Date.now() - started > 5 * 60_000) throw new Error('could not take the corpus lock');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
  try {
    return fn();
  } finally {
    rmSync(lockDir, { recursive: true, force: true });
  }
}

function emit(all: Record<string, StatementUpgrade>): void {
  const body = Object.keys(all)
    .sort()
    .map((slug) => `  ${JSON.stringify(slug)}: ${JSON.stringify(all[slug], null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n');
  writeFileSync(
    upgradesPath,
    `/**
 * Rewritten statements and editorials for hand-authored problems, keyed by
 * slug. Generated and extended by \`scripts/upgrade-statements.ts\` and
 * \`scripts/refresh-tests.ts\`; applied by \`upgrade.ts\`. Do not edit by
 * hand — rerun the scripts.
 */
export interface StatementUpgrade {
  promptMarkdown: string;
  editorialMarkdown: string;
  /** stdin of tests a new example draws on, made visible as samples. */
  promoteSamples: string[];
  model: string;
  date: string;
  /** Set when the reviewer would not pass a rewrite; the original statement stays. */
  skipped?: string;
  /**
   * Replacement tests, when the originals reused a famous problem's example
   * data. Every expected output was produced by all six reference solutions
   * agreeing on the judge.
   */
  tests?: Array<{ stdin: string; expectedStdout: string; isSample?: boolean }>;
}

export const UPGRADES: Record<string, StatementUpgrade> = {
${body}
};
`,
  );
}

async function main() {
  if (batch.length === 0) {
    console.log('  no skipped problems need fresh tests');
    console.log(JSON.stringify({ mode: 'refresh', pending: 0, accepted: 0, rejected: 0 }));
    return;
  }
  if (!(await isJudgeUp())) throw new Error('judge is not reachable');
  console.log(`  ${pending.length} pending; taking ${batch.length}`);
  const proposals = propose(batch);

  const accepted: Array<{
    p: ProblemDefinition;
    tests: Array<{ stdin: string; expectedStdout: string; isSample?: boolean }>;
  }> = [];
  const rejected: Array<{ slug: string; why: string }> = [];
  for (const p of batch) {
    const prop = proposals.find((x) => x.slug === p.slug);
    const old = new Set(p.tests.map((t) => normalise(t.stdin)));
    const inputs = [...new Set((prop?.inputs ?? []).map((s) => s.replace(/\r/g, '')))].filter(
      (s) => !old.has(normalise(s)),
    );
    if (inputs.length < 8) {
      rejected.push({ slug: p.slug, why: `only ${inputs.length} usable new inputs proposed` });
      continue;
    }
    console.log(`  judging ${inputs.length} inputs × 6 languages for ${p.slug} ...`);
    const computed = (await computeExpected(p, inputs)).filter(
      (t): t is { stdin: string; expectedStdout: string } => t !== null,
    );
    if (computed.length < 8) {
      rejected.push({ slug: p.slug, why: `only ${computed.length} inputs on which all six references agree` });
      continue;
    }
    const tests = computed.slice(0, 12).map((t, i) => (i < 2 ? { ...t, isSample: true } : t));
    accepted.push({ p, tests });
  }

  for (const a of accepted) console.log(`    + ${a.p.slug}: ${a.tests.length} new tests`);
  for (const r of rejected) console.log(`    - ${r.slug}: ${r.why}`);

  if (!dryRun && accepted.length > 0) {
    withLock(() => {
      const all: Record<string, StatementUpgrade> = { ...UPGRADES };
      for (const a of accepted) {
        const prev = all[a.p.slug]!;
        // Clearing `skipped` puts the problem back in the statement pass,
        // which will now see the new tests and write examples from them.
        const { skipped: _skipped, ...rest } = prev;
        all[a.p.slug] = { ...rest, tests: a.tests, promoteSamples: [], date: new Date().toISOString().slice(0, 10) };
      }
      emit(all);
      console.log(`  wrote ${upgradesPath}`);
    });
  }
  console.log(
    JSON.stringify({
      mode: 'refresh',
      pending: pending.length - accepted.length,
      accepted: accepted.length,
      rejected: rejected.length,
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
