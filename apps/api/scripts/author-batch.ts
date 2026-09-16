/**
 * Author a batch of problems with Gemini, verify every one on the judge, and
 * add the survivors to the corpus.
 *
 * ## Why this exists
 *
 * The corpus is ~700 problems and thin above Tier 0. The owner's goal is to be
 * ready for LeetCode-style problems, which means the library needs to grow
 * toward the thousands, in that format, without anyone copying LeetCode's
 * text. A model can draft; only the judge can admit.
 *
 * ## The gate, in order
 *
 * 1. Gemini drafts N problems as schema-enforced JSON: LeetCode-format
 *    statement (constraints, three examples, follow-up), six reference
 *    solutions, at least eight tests including edge cases.
 * 2. Local checks: slug and title unused, signature known, tags known, tier
 *    and family as requested, no LeetCode titles or wording, every language
 *    present.
 * 3. The judge runs every reference solution against every test, through the
 *    same driver the grader uses. One failure anywhere rejects the problem.
 * 4. Optionally Codex reads the surviving statements for ambiguity. If Codex
 *    is unavailable (rate limit), that step is recorded as skipped, never
 *    silently passed.
 * 5. Survivors are written to `src/corpus/problems/<out>.ts` with
 *    `provenance: GENERATED` and registered in `index.ts`. Nothing is imported
 *    into the database here; run `npm run import:corpus` after review.
 *
 * ## Two modes
 *
 * Family mode drafts N problems for one family/tier/difficulty:
 *
 *   npm run author:batch -- --family ARRAYS_HASHING --tier TIER_1 \
 *     --difficulty EASY --count 6 --out gen-t1-arrays-hashing-a [--codex] [--dry-run]
 *
 * Anchored mode takes the next N uncovered entries from a public problem
 * index (title, slug, difficulty, paid flag — metadata only, never statement
 * text) and asks for one original problem per entry that exercises the same
 * underlying technique at the same difficulty. The anchor is a pointer to a
 * pattern interviewers ask about; the statement, scenario, tests and
 * solutions are ours. Coverage is kept in `src/corpus/coverage.json` so the
 * job can resume over days:
 *
 *   npm run author:batch -- --anchors path/to/index.json --count 6 \
 *     --out gen-lc-001 [--codex] [--dry-run]
 *
 * Batches are small on purpose: at twenty, drafts lost their examples and
 * slid to Tier 0 difficulty. Six holds the level.
 *
 * Needs the judge reachable at JUDGE0_URL and the `agy` CLI on PATH.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Difficulty, PatternFamily, Tier } from '@prisma/client';
import { ALL_PROBLEMS } from '../src/corpus/problems/index.js';
import type { ProblemDefinition } from '../src/corpus/problem.js';
import { SIGNATURES, driversFor } from '../src/corpus/signatures.js';
import { LANGUAGES, type Lang } from '../src/corpus/types.js';
import { skillsRequiredBy } from '../src/services/skills.js';
import { failureDetail, isJudgeUp, normalise, runBatch, unb64, type Run } from './judge-client.js';

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

function arg(name: string, fallback?: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || !process.argv[i + 1]) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing --${name}`);
  }
  return process.argv[i + 1]!;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const anchorsPath = process.argv.includes('--anchors') ? arg('anchors') : null;
const family = (anchorsPath ? null : arg('family')) as PatternFamily | null;
const tier = (anchorsPath ? null : arg('tier')) as Tier | null;
const difficulty = (anchorsPath ? null : arg('difficulty')) as Difficulty | null;
const count = Number(arg('count', '6'));
const out = arg('out');
const model = arg('model', 'gemini-3.1-pro-low');
const useCodex = flag('codex');
const dryRun = flag('dry-run');

if (!/^[a-z0-9-]+$/.test(out)) throw new Error('--out must be kebab-case');

const FAMILIES: PatternFamily[] = [
  'ARRAYS_HASHING', 'TWO_POINTERS', 'SLIDING_WINDOW', 'STACK', 'BINARY_SEARCH', 'LINKED_LIST',
  'TREES', 'TRIES', 'HEAP_PRIORITY_QUEUE', 'BACKTRACKING', 'GRAPHS', 'ADVANCED_GRAPHS', 'DP_1D',
  'DP_2D', 'GREEDY', 'INTERVALS', 'MATH_GEOMETRY', 'BIT_MANIPULATION',
];
const TIERS: Tier[] = ['TIER_1', 'TIER_2', 'TIER_3'];
const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

// ---------------------------------------------------------------------------
// Anchors and the coverage ledger
// ---------------------------------------------------------------------------

/** One entry of the public index: metadata only. */
interface Anchor {
  title: string;
  slug: string;
  /** 1 easy, 2 medium, 3 hard. */
  level: 1 | 2 | 3;
  paidOnly: boolean;
}

interface Coverage {
  [anchorSlug: string]: { ours: string; batch: string; date: string };
}

const coveragePath = join('src', 'corpus', 'coverage.json');

function readCoverage(): Coverage {
  try {
    return JSON.parse(readFileSync(coveragePath, 'utf8')) as Coverage;
  } catch {
    return {};
  }
}

/**
 * Read the saved index. Accepts the raw `/api/problems/all/` shape or an
 * already-flattened array of anchors. Only titles, slugs, levels and the paid
 * flag are read; nothing else in the file is looked at.
 */
function readAnchors(path: string): Anchor[] {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  if (Array.isArray(raw)) return raw as Anchor[];
  const pairs = (raw as { stat_status_pairs?: unknown[] }).stat_status_pairs ?? [];
  return pairs.map((p) => {
    const x = p as {
      stat: { question__title: string; question__title_slug: string };
      difficulty: { level: number };
      paid_only: boolean;
    };
    return {
      title: x.stat.question__title,
      slug: x.stat.question__title_slug,
      level: x.difficulty.level as 1 | 2 | 3,
      paidOnly: Boolean(x.paid_only),
    };
  });
}

const LEVEL_TO: Record<1 | 2 | 3, { difficulty: Difficulty; tier: Tier }> = {
  1: { difficulty: 'EASY', tier: 'TIER_1' },
  2: { difficulty: 'MEDIUM', tier: 'TIER_2' },
  3: { difficulty: 'HARD', tier: 'TIER_2' },
};

/** The next `count` anchors not yet covered, easy first so the ramp fills first. */
function nextAnchors(): Anchor[] {
  if (!anchorsPath) return [];
  const covered = readCoverage();
  return readAnchors(anchorsPath)
    .filter((a) => !covered[a.slug])
    .sort((a, b) => a.level - b.level || a.slug.localeCompare(b.slug))
    .slice(0, count);
}

const anchors = nextAnchors();

// ---------------------------------------------------------------------------
// What the model is told
// ---------------------------------------------------------------------------

const existing = family
  ? ALL_PROBLEMS.filter((p) => p.patternFamily === family)
  : ALL_PROBLEMS.filter((p) => p.tier !== 'TIER_0' && p.tier !== 'TIER_0_5');
const usedSlugs = new Set(ALL_PROBLEMS.map((p) => p.slug));
const usedTitles = new Set(ALL_PROBLEMS.map((p) => p.title.toLowerCase()));
const knownTags = [...new Set(ALL_PROBLEMS.flatMap((p) => p.patternTags))].sort();
const familyTags = [...new Set(existing.flatMap((p) => p.patternTags))].sort();
const functionSignatures = SIGNATURES.filter((s) => s.kind === 'function');

/** One real problem of this family, as the style reference. */
const exemplar =
  existing.find((p) => p.difficulty === (difficulty ?? 'EASY') && p.tier === (tier ?? 'TIER_1')) ??
  existing[0] ??
  ALL_PROBLEMS[0]!;

const WIRE_FORMAT = `
Wire format (stdin is one parameter per line; stdout is the return value):
- int: decimal, e.g. "42" or "-7"
- double: printed with 6 decimals, e.g. "2.500000"
- bool: "true" or "false"
- string: the raw line (may be empty)
- int[]: space-separated ints on one line; empty list is an empty line, e.g. "3 1 2"
- string[]: whitespace-separated tokens on one line (so tokens cannot contain spaces)
- int[][]: rows separated by ";", values by space, e.g. "1 2;3 4"
- tree: level order with "null" for missing children, e.g. "1 2 3 null 4"
- list (linked list): space-separated values in order
For fn:X,Y->Z the stdin has two lines: X then Y. Expected stdout is Z in the same format.
The reference solution is a bare function named solve in each language, exactly in the shape of the exemplar below:
- JAVASCRIPT: function solve(a, b) { ... }
- TYPESCRIPT: function solve(a: number[], b: number): number { ... }
- PYTHON: def solve(a, b): ...
- JAVA: static method inside a class the harness provides: "    static int solve(int[] a, int b) { ... }" (4-space indent, no class wrapper)
- CPP: int solve(vector<int> a, int b) { ... } (vector, string, unordered_map etc. are already included)
- GO: func solve(a []int, b int) int { ... } (only bufio, fmt, os, strconv, strings are imported; do NOT use sort or any other package, and do not add imports — write your own loops instead)
`;

const prompt = `You are drafting original programming problems for CodeLock, an open-source (CC0) learning app.

${
  anchorsPath
    ? `Draft exactly ${anchors.length} NEW problems, one per anchor below. An anchor names a well-known interview problem only to identify the underlying TECHNIQUE and its difficulty. Do not restate, rename or lightly disguise that problem: invent a different scenario, and where possible a different input shape, that exercises the same technique at the same difficulty. Each result carries the anchor's slug in "anchor" so coverage can be tracked, and chooses its own patternFamily from: ${FAMILIES.join(', ')}.

Anchors:
${anchors.map((a) => `- anchor: ${a.slug} | technique known from: "${a.title}" | difficulty: ${LEVEL_TO[a.level].difficulty} | tier: ${LEVEL_TO[a.level].tier}`).join('\n')}
`
    : `Draft exactly ${count} NEW problems for:
- patternFamily: ${family}
- tier: ${tier}
- difficulty: ${difficulty}
`
}
Difficulty means what it means in interviews: EASY is Two-Sum level (one hash map or one pass with a small idea), not "count the even numbers". MEDIUM needs a real pattern applied with a twist. HARD combines two ideas or needs a non-obvious invariant.

Hard rules:
1. ORIGINAL. Do not reproduce LeetCode, HackerRank, Codeforces or textbook problem text or titles. Invent your own scenario and wording for each. Never mention those sites.
2. FORMAT like a serious interview problem: a clear statement; a "**Constraints**" section with explicit bounds; three worked "**Example**" blocks with input, output and a one-line explanation; and a "**Follow-up**" line about time or space complexity where meaningful. Markdown, no HTML.
3. The editorialMarkdown explains the intended approach, names the pattern, states the complexity, and names the one trap most solvers hit.
4. Each problem uses one signatureId from this list and its parameters exactly: ${functionSignatures.map((s) => s.id).join(', ')}
5. Tests: at least 8 per problem, first 2 marked isSample true and matching the first two examples. Include: an empty or minimal input, a single element, negatives where the type allows, duplicates, and the largest size that is still readable (≤ 40 values). Expected output must be exactly what a correct solution prints in the wire format.
6. Six reference solutions (JAVASCRIPT, TYPESCRIPT, PYTHON, JAVA, CPP, GO) that all pass every test. They will be executed; a single failure rejects the problem.
7. patternTags: 2–4 tags from this vocabulary only: ${knownTags.join(', ')}. Tags common in this family: ${familyTags.join(', ') || '(none yet)'}.
8. slug: kebab-case, unique, not in the used list. title: unique, not a known LeetCode title.
9. avgSolveSeconds: an honest estimate for a learner who knows the pattern (300–1500).
10. Do not use these slugs: ${[...usedSlugs].slice(0, 400).join(', ')}
${WIRE_FORMAT}
Exemplar (house style; match its shape, not its content):
${JSON.stringify(
  {
    slug: exemplar.slug,
    title: exemplar.title,
    patternTags: exemplar.patternTags,
    signatureId: exemplar.signatureId,
    promptMarkdown: exemplar.promptMarkdown,
    editorialMarkdown: exemplar.editorialMarkdown,
    referenceSolution: exemplar.referenceSolution,
    tests: exemplar.tests.slice(0, 4),
  },
  null,
  1,
)}

Return JSON only, matching the schema.`;

const schema = {
  type: 'object',
  properties: {
    problems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          title: { type: 'string' },
          anchor: { type: 'string' },
          patternFamily: { type: 'string', enum: FAMILIES },
          difficulty: { type: 'string', enum: DIFFICULTIES },
          tier: { type: 'string', enum: TIERS },
          patternTags: { type: 'array', items: { type: 'string' } },
          signatureId: { type: 'string' },
          avgSolveSeconds: { type: 'integer' },
          promptMarkdown: { type: 'string' },
          editorialMarkdown: { type: 'string' },
          referenceSolution: {
            type: 'object',
            properties: Object.fromEntries(LANGUAGES.map((l) => [l, { type: 'string' }])),
            required: [...LANGUAGES],
          },
          tests: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                stdin: { type: 'string' },
                expectedStdout: { type: 'string' },
                isSample: { type: 'boolean' },
              },
              required: ['stdin', 'expectedStdout'],
            },
          },
        },
        required: [
          'slug',
          'title',
          'patternFamily',
          'difficulty',
          'tier',
          'patternTags',
          'signatureId',
          'avgSolveSeconds',
          'promptMarkdown',
          'editorialMarkdown',
          'referenceSolution',
          'tests',
        ],
      },
    },
  },
  required: ['problems'],
};

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

type Draft = Omit<ProblemDefinition, 'provenance'> & {
  referenceSolution: Record<Lang, string>;
  anchor?: string;
};

function draftWithGemini(): Draft[] {
  const dir = mkdtempSync(join(tmpdir(), 'codelock-author-'));
  const schemaPath = join(dir, 'schema.json');
  const briefPath = join(dir, 'brief.md');
  writeFileSync(schemaPath, JSON.stringify(schema));
  writeFileSync(briefPath, prompt);
  console.log(`  asking ${model} for ${count} problems (${family} / ${tier} / ${difficulty}) ...`);
  // The brief is far past the Windows argv limit, so it goes in a file the
  // model reads. Plan mode forbids edits; the permission skip only lets it
  // read the brief without a prompt nobody is there to answer.
  const raw = execFileSync(
    'agy',
    [
      `--print=Read the brief at ${briefPath} and do exactly what it says. Return JSON matching the schema.`,
      '--mode',
      'plan',
      '--dangerously-skip-permissions',
      '--add-dir',
      dir,
      '--model',
      model,
      '--output-format',
      'json',
      '--json-schema',
      schemaPath,
      '--print-timeout',
      '20m',
      '--disable-slash-commands',
    ],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true },
  );
  const parsed = JSON.parse(raw) as { status?: string; structured_output?: { problems?: Draft[] } };
  if (parsed.status !== 'SUCCESS' || !parsed.structured_output?.problems) {
    throw new Error(`Gemini did not return problems: ${raw.slice(0, 400)}`);
  }
  return parsed.structured_output.problems;
}

// ---------------------------------------------------------------------------
// Local checks
// ---------------------------------------------------------------------------

const FORBIDDEN = /leetcode|hackerrank|codeforces|neetcode/i;

function localReject(d: Draft, seen: Set<string>): string | null {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)) return 'slug not kebab-case';
  if (usedSlugs.has(d.slug) || seen.has(d.slug)) return 'slug already used';
  if (usedTitles.has(d.title.toLowerCase())) return 'title already used';
  if (!functionSignatures.some((s) => s.id === d.signatureId)) return `unknown signature ${d.signatureId}`;
  if (!FAMILIES.includes(d.patternFamily)) return `unknown family ${d.patternFamily}`;
  if (!TIERS.includes(d.tier)) return `unknown tier ${d.tier}`;
  if (!DIFFICULTIES.includes(d.difficulty)) return `unknown difficulty ${d.difficulty}`;
  if (family && (d.patternFamily !== family || d.tier !== tier || d.difficulty !== difficulty)) {
    return 'drifted from the requested family/tier/difficulty';
  }
  if (anchorsPath) {
    const a = anchors.find((x) => x.slug === d.anchor);
    if (!a) return `unknown anchor ${d.anchor}`;
    if (LEVEL_TO[a.level].difficulty !== d.difficulty) return `difficulty drifted from anchor (${a.slug})`;
    // A title that reuses almost every word of the anchor's is a rename, not
    // an original. Short titles are compared loosely; the judge decides the rest.
    const words = a.title.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const shared = words.filter((w) => d.title.toLowerCase().includes(w));
    if (words.length > 0 && shared.length >= Math.max(2, words.length - 1)) {
      return `title too close to anchor "${a.title}"`;
    }
  }
  if (FORBIDDEN.test(d.promptMarkdown) || FORBIDDEN.test(d.title) || FORBIDDEN.test(d.editorialMarkdown)) {
    return 'mentions a problem site';
  }
  if (!/\*\*Constraints\*\*/.test(d.promptMarkdown)) return 'no Constraints section';
  if ((d.promptMarkdown.match(/\*\*Example/g) ?? []).length < 3) return 'fewer than three examples';
  if (d.tests.length < 8) return `only ${d.tests.length} tests`;
  if (d.tests.filter((t) => t.isSample).length < 2) return 'fewer than two sample tests';
  const badTag = d.patternTags.find((t) => !knownTags.includes(t));
  if (badTag) return `unknown tag ${badTag}`;
  if (d.patternTags.length < 1) return 'no tags';
  for (const lang of LANGUAGES) {
    const src = d.referenceSolution[lang];
    if (!src || !src.includes('solve')) return `missing ${lang} solution`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// The judge
// ---------------------------------------------------------------------------

async function judgeReject(drafts: Draft[]): Promise<Map<string, string[]>> {
  const runs: Run[] = [];
  const keys: Array<{ slug: string; lang: Lang; test: number; expected: string }> = [];
  for (const d of drafts) {
    const drivers = driversFor(d.signatureId);
    for (const lang of LANGUAGES) {
      const source = drivers[lang].replace('{{SOLUTION}}', d.referenceSolution[lang]);
      d.tests.forEach((t, i) => {
        runs.push({ language: lang, source, stdin: t.stdin });
        keys.push({ slug: d.slug, lang, test: i, expected: t.expectedStdout });
      });
    }
  }
  console.log(`  judging ${runs.length} runs (${drafts.length} problems × 6 languages × tests) ...`);
  const results = await runBatch(runs);
  const failures = new Map<string, string[]>();
  results.forEach((r, i) => {
    const k = keys[i]!;
    const actual = normalise(unb64(r.stdout));
    if (actual !== normalise(k.expected)) {
      const list = failures.get(k.slug) ?? [];
      if (list.length < 4) list.push(`${k.lang} test ${k.test}: ${failureDetail(r, k.expected, actual)}`);
      failures.set(k.slug, list);
    }
  });
  return failures;
}

// ---------------------------------------------------------------------------
// Codex, read-only, optional
// ---------------------------------------------------------------------------

function codexReview(accepted: Draft[]): string {
  const text = accepted
    .map(
      (d) =>
        `### ${d.slug}\n${d.promptMarkdown}\n\nSample tests:\n${d.tests
          .filter((t) => t.isSample)
          .map((t) => `stdin: ${JSON.stringify(t.stdin)} -> ${JSON.stringify(t.expectedStdout)}`)
          .join('\n')}`,
    )
    .join('\n\n');
  const ask = `Read-only review. For each problem statement below, say whether it is unambiguous enough that a careful reader would produce exactly the sample outputs, and flag any statement that reads like a known LeetCode problem's wording. Output one line per slug: "<slug>: OK" or "<slug>: <issue>". No edits.\n\n${text}`;
  try {
    const bin = process.platform === 'win32' ? 'codex.cmd' : 'codex';
    return execFileSync(bin, ['exec', '--sandbox', 'read-only', '--skip-git-repo-check', ask], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
      timeout: 10 * 60_000,
    });
  } catch (err) {
    return `SKIPPED: codex unavailable (${(err as Error).message.split('\n')[0]})`;
  }
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

const constName = `${out.replace(/^gen-/, 'gen_').replace(/-/g, '_').toUpperCase()}_PROBLEMS`;

function emit(accepted: Draft[]): void {
  const body = accepted
    .map((d) =>
      [
        '  p({',
        '    ...base,',
        `    slug: ${JSON.stringify(d.slug)},`,
        `    difficulty: ${JSON.stringify(d.difficulty)},`,
        `    tier: ${JSON.stringify(d.tier)},`,
        `    patternFamily: ${JSON.stringify(d.patternFamily)},`,
        `    title: ${JSON.stringify(d.title)},`,
        `    patternTags: ${JSON.stringify(d.patternTags)},`,
        `    signatureId: ${JSON.stringify(d.signatureId)},`,
        `    avgSolveSeconds: ${Math.round(d.avgSolveSeconds ?? 600)},`,
        `    promptMarkdown: ${JSON.stringify(d.promptMarkdown)},`,
        `    editorialMarkdown: ${JSON.stringify(d.editorialMarkdown)},`,
        '    referenceSolution: {',
        ...LANGUAGES.map((l) => `      ${l}: ${JSON.stringify(d.referenceSolution[l])},`),
        '    },',
        '    tests: [',
        ...d.tests.map(
          (t) =>
            `      { stdin: ${JSON.stringify(t.stdin)}, expectedStdout: ${JSON.stringify(t.expectedStdout)}${t.isSample ? ', isSample: true' : ''} },`,
        ),
        '    ],',
        '  }),',
      ].join('\n'),
    )
    .join('\n\n');

  const file = `import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch \`${out}\`${anchorsPath ? ' (anchored to a public problem index; metadata only)' : ` — ${family}, ${tier}, ${difficulty}`}.
 *
 * Drafted with ${model} on ${new Date().toISOString().slice(0, 10)} and admitted only after
 * every reference solution passed every test on the judge
 * (\`scripts/author-batch.ts\`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const ${constName}: ProblemDefinition[] = [
${body}
];
`;
  const path = join('src', 'corpus', 'problems', `${out}.ts`);
  writeFileSync(path, file);

  const indexPath = join('src', 'corpus', 'problems', 'index.ts');
  let index = readFileSync(indexPath, 'utf8');
  if (!index.includes(constName)) {
    index = index.replace(
      "import type { ProblemDefinition } from '../problem.js';\n",
      `import type { ProblemDefinition } from '../problem.js';\nimport { ${constName} } from './${out}.js';\n`,
    );
    index = index.replace(
      'export const ALL_PROBLEMS: ProblemDefinition[] = [\n',
      `export const ALL_PROBLEMS: ProblemDefinition[] = [\n  ...${constName},\n`,
    );
    writeFileSync(indexPath, index);
  }
  console.log(`  wrote ${path} and registered ${constName} in index.ts`);

  if (anchorsPath) {
    const coverage = readCoverage();
    const date = new Date().toISOString().slice(0, 10);
    for (const d of accepted) if (d.anchor) coverage[d.anchor] = { ours: d.slug, batch: out, date };
    writeFileSync(coveragePath, JSON.stringify(coverage, null, 2) + '\n');
    console.log(`  coverage: ${Object.keys(coverage).length} anchors covered`);
  }
}

// ---------------------------------------------------------------------------

async function main() {
  if (!(await isJudgeUp())) throw new Error('judge is not reachable; set JUDGE0_URL to a host-published judge');
  if (anchorsPath && anchors.length === 0) {
    console.log('  every anchor in the index is covered; nothing to do');
    return;
  }

  const drafts = draftWithGemini();
  console.log(`  drafted ${drafts.length}`);

  const seen = new Set<string>();
  const rejected: Array<{ slug: string; why: string[] }> = [];
  const local: Draft[] = [];
  for (const d of drafts) {
    const why = localReject(d, seen);
    if (why) rejected.push({ slug: d.slug, why: [why] });
    else {
      seen.add(d.slug);
      local.push(d);
    }
  }
  console.log(`  passed local checks: ${local.length}/${drafts.length}`);

  const failures = await judgeReject(local);
  const accepted = local.filter((d) => !failures.has(d.slug));
  for (const [slug, why] of failures) rejected.push({ slug, why });
  console.log(`  passed the judge: ${accepted.length}/${local.length}`);

  for (const d of accepted) {
    const skills = skillsRequiredBy(d);
    const from = d.anchor ? `  <- ${d.anchor}` : '';
    console.log(`    + ${d.slug}  ${d.patternFamily}/${d.tier}/${d.difficulty}${from}  [${skills.join(', ')}]`);
  }
  for (const r of rejected) console.log(`    - ${r.slug}: ${r.why.join(' | ')}`);

  let codex = 'not requested';
  if (useCodex && accepted.length > 0) {
    console.log('  asking Codex to read the statements ...');
    codex = codexReview(accepted);
    console.log(codex.split('\n').map((l) => '    ' + l).join('\n'));
  }

  if (dryRun) {
    console.log('  dry run: nothing written');
  } else if (accepted.length > 0) {
    emit(accepted);
  }

  console.log(
    JSON.stringify({
      mode: anchorsPath ? 'anchored' : 'family',
      family,
      tier,
      difficulty,
      anchors: anchors.map((a) => a.slug),
      drafted: drafts.length,
      accepted: accepted.length,
      rejected: rejected.length,
      codex: codex.startsWith('SKIPPED') ? codex : useCodex ? 'ran' : 'not requested',
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
