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
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
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

/**
 * `ours` names the admitted problem. `ours: null` records an anchor that was
 * drafted and rejected (typically a JavaScript-only or SQL problem that has
 * no six-language function shape), so the run moves on instead of redrawing
 * it every batch. Delete the entry to try it again.
 */
interface Coverage {
  [anchorSlug: string]: { ours: string | null; batch: string; date: string; reason?: string };
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
/**
 * `--shard k/N` gives parallel workers disjoint slices of the index: an
 * anchor belongs to worker k when a stable hash of its slug mod N is k. The
 * judge idles while a model drafts, so two or three workers overlap those
 * phases; the shared files are written under `withLock` below.
 */
const shard = (() => {
  const raw = process.argv.includes('--shard') ? arg('shard') : '0/1';
  const m = /^(\d+)\/(\d+)$/.exec(raw);
  if (!m) throw new Error('--shard must look like k/N');
  const k = Number(m[1]);
  const n = Number(m[2]);
  if (!(n >= 1 && k >= 0 && k < n)) throw new Error('--shard k/N needs 0 <= k < N');
  return { k, n };
})();

function shardOf(slug: string): number {
  let h = 2166136261;
  for (const ch of slug) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h % shard.n;
}

function nextAnchors(): Anchor[] {
  if (!anchorsPath) return [];
  const covered = readCoverage();
  return readAnchors(anchorsPath)
    .filter((a) => !covered[a.slug] && shardOf(a.slug) === shard.k)
    .sort((a, b) => a.level - b.level || a.slug.localeCompare(b.slug))
    .slice(0, count);
}

/**
 * A directory as a mutex: `mkdir` is atomic, so exactly one worker holds it.
 * Guards the read-modify-write of `index.ts` and `coverage.json`. A stale
 * lock older than ten minutes is taken over; nothing here holds it for more
 * than a second.
 */
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
          /* another worker got there first */
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
          // Required only when there are anchors to carry; one batch came
          // back without the field and every draft was rejected for it.
          ...(anchorsPath ? ['anchor'] : []),
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

/**
 * The second model pool `agy` exposes (Claude Sonnet, Claude Opus, GPT-OSS)
 * has its own quota. It drafts when Gemini's window is exhausted, so the
 * loop never idles on a quota reset, and it reviews when Codex is capped.
 */
const fallbackModel = arg('fallback-model', 'claude-sonnet-4-6');
// The second reviewer comes from the other pool than the drafter, so no
// model reads its own draft.
const reviewModel = arg('review-model', model.startsWith('gemini') ? 'claude-sonnet-4-6' : 'gemini-3.1-pro-low');

function draftWith(which: string): Draft[] {
  const dir = mkdtempSync(join(tmpdir(), 'codelock-author-'));
  const schemaPath = join(dir, 'schema.json');
  const briefPath = join(dir, 'brief.md');
  writeFileSync(schemaPath, JSON.stringify(schema));
  writeFileSync(briefPath, prompt);
  console.log(`  asking ${which} for ${count} problems (${family} / ${tier} / ${difficulty}) ...`);
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
      which,
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
  const parsed = JSON.parse(raw) as {
    status?: string;
    error?: string;
    structured_output?: { problems?: Draft[] };
  };
  if (parsed.status !== 'SUCCESS' || !parsed.structured_output?.problems) {
    const err = new Error(`${which} did not return problems: ${raw.slice(0, 400)}`);
    (err as Error & { quota?: boolean }).quota = /quota|usage limit|rate limit/i.test(raw);
    throw err;
  }
  return parsed.structured_output.problems;
}

/**
 * Drafting stays with Gemini. On a quota error the batch fails with the
 * error text intact — the loop reads the "Resets in …" from it and waits —
 * unless `--draft-fallback` asks for the second pool to draft instead. The
 * owner's call: wait for the reset rather than switch models.
 */
const draftFallback = flag('draft-fallback');

function draftWithGemini(): Draft[] {
  try {
    return draftWith(model);
  } catch (err) {
    if (!draftFallback || !(err as { quota?: boolean }).quota || fallbackModel === model) throw err;
    console.log(`  ${model} is out of quota; drafting with ${fallbackModel} instead`);
    return draftWith(fallbackModel);
  }
}

/**
 * One repair round. Each rejected draft goes back to Gemini with the judge's
 * exact failures; the model returns a corrected draft with the same slug and
 * anchor. The result is re-checked and re-judged like anything else — a
 * repair earns nothing until it passes.
 */
function repairWithGemini(rejected: Array<{ draft: Draft; why: string[] }>): Draft[] {
  if (rejected.length === 0) return [];
  const dir = mkdtempSync(join(tmpdir(), 'codelock-repair-'));
  const schemaPath = join(dir, 'schema.json');
  const briefPath = join(dir, 'brief.md');
  writeFileSync(schemaPath, JSON.stringify(schema));
  const brief = `You drafted the problems below for CodeLock. Each one FAILED verification for the stated reason. Fix each problem so it passes, keeping its slug${anchorsPath ? ', anchor' : ''}, family, tier and difficulty. If a reference solution is wrong, fix the solution; if the expected output is wrong, fix the test; if the statement is ambiguous, fix the statement and keep tests consistent. Return all ${rejected.length} problems, corrected, matching the schema.
${WIRE_FORMAT}
${rejected
  .map(
    (r) => `## ${r.draft.slug}
Failures:
${r.why.map((w) => `- ${w}`).join('\n')}

Draft:
${JSON.stringify(r.draft, null, 1)}`,
  )
  .join('\n\n')}`;
  writeFileSync(briefPath, brief);
  console.log(`  asking ${model} to repair ${rejected.length} rejected draft(s) ...`);
  try {
    const raw = execFileSync(
      'agy',
      [
        `--print=Read the brief at ${briefPath} and do exactly what it says. Return JSON matching the schema.`,
        '--mode', 'plan', '--dangerously-skip-permissions', '--add-dir', dir,
        '--model', model, '--output-format', 'json', '--json-schema', schemaPath,
        '--print-timeout', '20m', '--disable-slash-commands',
      ],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true },
    );
    const parsed = JSON.parse(raw) as { status?: string; structured_output?: { problems?: Draft[] } };
    const fixed = parsed.structured_output?.problems ?? [];
    // Only repairs of what was sent; a model inventing a new slug here is ignored.
    const sent = new Set(rejected.map((r) => r.draft.slug));
    return fixed.filter((d) => sent.has(d.slug));
  } catch (err) {
    console.log(`  repair skipped: ${(err as Error).message.split('\n')[0]}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Local checks
// ---------------------------------------------------------------------------

const FORBIDDEN = /leetcode|hackerrank|codeforces|neetcode/i;

/**
 * A source that contains the two characters `\n` and no real newline was
 * escaped twice on the way out of the model. Seen in one whole batch of
 * JavaScript solutions, each rejected by the judge as a one-line syntax
 * error. Unescaping here is exact: a real one-line solution never contains
 * a literal backslash-n.
 */
function unescapeSources(d: Draft): void {
  for (const lang of LANGUAGES) {
    const src = d.referenceSolution[lang];
    if (src && !src.includes('\n') && src.includes('\\n')) {
      d.referenceSolution[lang] = src.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
    }
  }
  d.promptMarkdown = cleanMarkdown(d.promptMarkdown);
  d.editorialMarkdown = cleanMarkdown(d.editorialMarkdown);
}

/**
 * Markdown as the app renders it: real newlines, and no `$…$` math — the
 * lock screen has no LaTeX, so `$O(n \\log n)$` would show its dollar signs.
 */
function cleanMarkdown(s: string): string {
  if (!s.includes('\n') && s.includes('\\n')) s = s.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  return s.replace(/\$([^$\n]{1,80})\$/g, (_, m: string) =>
    m
      .replace(/\\times/g, '×')
      .replace(/\\cdot/g, '·')
      .replace(/\\leq?\b/g, '≤')
      .replace(/\\geq?\b/g, '≥')
      .replace(/\\log/g, 'log')
      .replace(/\\sqrt/g, 'sqrt')
      .replace(/\\text\{([^}]*)\}/g, '$1')
      .replace(/\^\{([^}]*)\}/g, '^$1')
      .replace(/\\/g, ''),
  );
}

function localReject(d: Draft, seen: Set<string>): string | null {
  unescapeSources(d);
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

/**
 * Ask Gemini for a new title and statement for problems Codex flagged. The
 * tests and reference solutions are fixed inputs: the rewrite must describe
 * exactly the behaviour they already encode, in different words and a
 * different scenario.
 */
function rewriteStatements(
  drafts: Draft[],
  notes: Map<string, string>,
): Array<{ slug: string; title: string; promptMarkdown: string }> {
  if (drafts.length === 0) return [];
  const dir = mkdtempSync(join(tmpdir(), 'codelock-rewrite-'));
  const schemaPath = join(dir, 'schema.json');
  const briefPath = join(dir, 'brief.md');
  writeFileSync(
    schemaPath,
    JSON.stringify({
      type: 'object',
      properties: {
        problems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slug: { type: 'string' },
              title: { type: 'string' },
              promptMarkdown: { type: 'string' },
            },
            required: ['slug', 'title', 'promptMarkdown'],
          },
        },
      },
      required: ['problems'],
    }),
  );
  const brief = `A reviewer flagged the statements below. Rewrite ONLY the title and promptMarkdown of each, keeping the slug. The tests and reference solutions are fixed and must not change, so the new statement must specify exactly the same behaviour: same inputs, same outputs, same edge cases, same ordering rules. Use a genuinely different scenario and different sentences; do not paraphrase the flagged wording. Keep the format: statement, **Constraints**, three **Example** blocks whose inputs and outputs match the sample tests exactly, **Follow-up**. Never mention any problem site.

${drafts
  .map(
    (d) => `## ${d.slug}
Reviewer note: ${notes.get(d.slug)}
Current title: ${d.title}
Sample tests (must be the three examples):
${d.tests
  .filter((t) => t.isSample)
  .map((t) => `stdin: ${JSON.stringify(t.stdin)} -> ${JSON.stringify(t.expectedStdout)}`)
  .join('\n')}
Reference (Python) — the behaviour to describe:
${d.referenceSolution.PYTHON}

Current statement:
${d.promptMarkdown}`,
  )
  .join('\n\n')}

Return JSON matching the schema.`;
  writeFileSync(briefPath, brief);
  console.log(`  asking ${model} to rewrite ${drafts.length} flagged statement(s) ...`);
  try {
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
      structured_output?: { problems?: Array<{ slug: string; title: string; promptMarkdown: string }> };
    };
    return parsed.structured_output?.problems ?? [];
  } catch (err) {
    console.log(`  rewrite skipped: ${(err as Error).message.split('\n')[0]}`);
    return [];
  }
}

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
  const ask = `Read-only review. For each problem statement below, say whether it is unambiguous enough that a careful reader would produce exactly the sample outputs, and flag any statement that reads like a known LeetCode problem's wording. Output exactly one line per slug and nothing else: "<slug>: OK" when the statement is unambiguous and its wording is its own, otherwise "<slug>: <issue>" where the issue starts with the word "ambiguous" or "closely follows" as appropriate. No edits.\n\n${text}`;
  try {
    // The ask is far past the argv limit, so it goes through a file too.
    const dir = mkdtempSync(join(tmpdir(), 'codelock-codex-'));
    const askPath = join(dir, 'ask.md');
    writeFileSync(askPath, ask);
    // Node refuses to spawn a .cmd shim without a shell; the arguments are
    // fixed strings and a temp path, so a shell is safe here.
    // With a shell the arguments are concatenated, not escaped, so the one
    // argument with spaces is quoted by hand. The path is a temp dir we made.
    const win = process.platform === 'win32';
    const instruction = `Read ${askPath} and do exactly what it says.`;
    return execFileSync(
      'codex',
      ['exec', '--sandbox', 'read-only', '--skip-git-repo-check', win ? `"${instruction}"` : instruction],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, windowsHide: true, timeout: 10 * 60_000, shell: win },
    );
  } catch (err) {
    return `SKIPPED: codex unavailable (${(err as Error).message.split('\n')[0]})`;
  }
}

/**
 * The same review, by a fresh Gemini session, when Codex is rate-limited.
 * A separate call rather than the drafting session, so it is not grading
 * its own work from inside the same context. The output format is the one
 * `main` parses, so its notes drive rewrites exactly as Codex's do.
 */
function geminiReview(accepted: Draft[]): string {
  const text = accepted
    .map(
      (d) =>
        `### ${d.slug}\n${d.promptMarkdown}\n\nSample tests:\n${d.tests
          .filter((t) => t.isSample)
          .map((t) => `stdin: ${JSON.stringify(t.stdin)} -> ${JSON.stringify(t.expectedStdout)}`)
          .join('\n')}`,
    )
    .join('\n\n');
  const dir = mkdtempSync(join(tmpdir(), 'codelock-review-'));
  const askPath = join(dir, 'ask.md');
  writeFileSync(
    askPath,
    `You are an adversarial reviewer of programming problem statements. For each problem below, say whether it is unambiguous enough that a careful reader would produce exactly the sample outputs, and flag any statement whose SENTENCES OR PHRASING closely follow a well-known interview problem (LeetCode, HackerRank, Codeforces). Sharing the same underlying technique or task shape with a known problem is expected and is NOT a reason to flag; flag only when the wording itself reads as a paraphrase of the known statement. Output exactly one line per slug and nothing else: "<slug>: OK" when the statement is unambiguous and its wording is its own, otherwise "<slug>: <issue>" where the issue starts with the word "ambiguous" or "closely follows" as appropriate.\n\n${text}`,
  );
  try {
    const raw = execFileSync(
      'agy',
      [
        `--print=Read ${askPath} and do exactly what it says. Output only the slug lines.`,
        '--mode', 'plan', '--dangerously-skip-permissions', '--add-dir', dir,
        '--model', reviewModel, '--output-format', 'json', '--print-timeout', '10m', '--disable-slash-commands',
      ],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, windowsHide: true },
    );
    const parsed = JSON.parse(raw) as { status?: string; response?: string };
    return parsed.status === 'SUCCESS' && parsed.response ? parsed.response : 'SKIPPED: gemini review returned nothing';
  } catch (err) {
    return `SKIPPED: gemini review unavailable (${(err as Error).message.split('\n')[0]})`;
  }
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

/**
 * A batch never overwrites an earlier batch's file. Two runs can share a
 * number (a restarted worker, two fleets), and the second would silently
 * erase the first's problems while the ledger still pointed at them. It
 * happened once; now the second takes a suffixed name.
 */
const outName = (() => {
  let name = out;
  for (const suffix of ['', '-b', '-c', '-d', '-e', '-f']) {
    name = `${out}${suffix}`;
    if (!existsSync(join('src', 'corpus', 'problems', `${name}.ts`))) return name;
  }
  throw new Error(`too many batches named ${out}`);
})();
const constName = `${outName.replace(/^gen-/, 'gen_').replace(/-/g, '_').toUpperCase()}_PROBLEMS`;

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
  const path = join('src', 'corpus', 'problems', `${outName}.ts`);
  writeFileSync(path, file);

  const indexPath = join('src', 'corpus', 'problems', 'index.ts');
  let index = readFileSync(indexPath, 'utf8');
  if (!index.includes(constName)) {
    index = index.replace(
      "import type { ProblemDefinition } from '../problem.js';\n",
      `import type { ProblemDefinition } from '../problem.js';\nimport { ${constName} } from './${outName}.js';\n`,
    );
    index = index.replace(
      'export const ALL_PROBLEMS: ProblemDefinition[] = [\n',
      `export const ALL_PROBLEMS: ProblemDefinition[] = [\n  ...${constName},\n`,
    );
    writeFileSync(indexPath, index);
  }
  console.log(`  wrote ${path} and registered ${constName} in index.ts`);
}

/**
 * Record every anchor this batch drew: admitted ones by slug, the rest set
 * aside. Runs even when nothing was admitted, otherwise a zero-yield batch
 * would leave its anchors uncovered and the next batch would draw the same
 * ones again, forever.
 */
function recordCoverage(accepted: Draft[]): void {
  if (!anchorsPath) return;
  const coverage = readCoverage();
  const date = new Date().toISOString().slice(0, 10);
  for (const d of accepted) if (d.anchor) coverage[d.anchor] = { ours: d.slug, batch: out, date };
  for (const a of anchors) {
    if (!coverage[a.slug]) coverage[a.slug] = { ours: null, batch: out, date, reason: 'rejected' };
  }
  writeFileSync(coveragePath, JSON.stringify(coverage, null, 2) + '\n');
  const covered = Object.values(coverage).filter((c) => c.ours !== null).length;
  console.log(`  coverage: ${covered} anchors covered, ${Object.keys(coverage).length - covered} set aside`);
}

// ---------------------------------------------------------------------------

async function main() {
  if (!(await isJudgeUp())) throw new Error('judge is not reachable; set JUDGE0_URL to a host-published judge');
  if (anchorsPath && anchors.length === 0) {
    console.log('  every anchor in the index is covered; nothing to do');
    return;
  }

  const drafts = draftWithGemini();
  // Belt and braces: if the model still returned one draft per anchor in
  // order but left the field out, the order is the mapping.
  if (anchorsPath && drafts.length === anchors.length && drafts.every((d) => !d.anchor)) {
    drafts.forEach((d, i) => (d.anchor = anchors[i]!.slug));
    console.log('  anchors missing from drafts; assigned by position');
  }
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
  console.log(`  passed the judge: ${accepted.length}/${local.length}`);

  // One repair round for everything the judge rejected (local rejects are
  // not repaired: an unknown signature or a renamed anchor is a new draft,
  // not a fix). Repairs must pass the same local checks and the same judge.
  const toRepair = local.filter((d) => failures.has(d.slug)).map((d) => ({ draft: d, why: failures.get(d.slug)! }));
  for (const r of toRepair) console.log(`    ~ ${r.draft.slug} failed first pass: ${r.why.join(' | ')}`);
  const repaired = repairWithGemini(toRepair);
  const repairable: Draft[] = [];
  for (const d of repaired) {
    // The model tends to drop the bookkeeping fields it did not write; the
    // repair is the same problem, so its anchor is the original's.
    const original = toRepair.find((r) => r.draft.slug === d.slug)!.draft;
    d.anchor ??= original.anchor;
    d.patternFamily ??= original.patternFamily;
    d.tier ??= original.tier;
    d.difficulty ??= original.difficulty;
    seen.delete(d.slug);
    const why = localReject(d, seen);
    if (why) rejected.push({ slug: d.slug, why: [`repair: ${why}`] });
    else {
      seen.add(d.slug);
      repairable.push(d);
    }
  }
  if (repairable.length > 0) {
    const again = await judgeReject(repairable);
    for (const d of repairable) {
      if (again.has(d.slug)) rejected.push({ slug: d.slug, why: again.get(d.slug)!.map((w) => `repair: ${w}`) });
      else {
        accepted.push(d);
        console.log(`  repaired: ${d.slug}`);
      }
    }
  }
  for (const [slug, why] of failures) {
    if (!accepted.some((d) => d.slug === slug) && !rejected.some((r) => r.slug === slug)) rejected.push({ slug, why });
  }

  for (const d of accepted) {
    const skills = skillsRequiredBy(d);
    const from = d.anchor ? `  <- ${d.anchor}` : '';
    console.log(`    + ${d.slug}  ${d.patternFamily}/${d.tier}/${d.difficulty}${from}  [${skills.join(', ')}]`);
  }
  for (const r of rejected) console.log(`    - ${r.slug}: ${r.why.join(' | ')}`);

  let codex = 'not requested';
  if (useCodex && accepted.length > 0) {
    console.log('  asking Codex to read the statements ...');
    // Two readers side by side: Codex and a model from the other pool than
    // the drafter. Either one flagging a statement is enough to send it for
    // a rewrite; a Codex quota miss is recorded, and the second reader's
    // verdict still stands on its own.
    codex = codexReview(accepted);
    if (codex.startsWith('SKIPPED')) console.log(`    ${codex}`);
    console.log(`  asking ${reviewModel} to review alongside Codex ...`);
    const second = geminiReview(accepted);
    const both = [codex.startsWith('SKIPPED') ? '' : codex, second.startsWith('SKIPPED') ? '' : `(${reviewModel} reviewer)\n${second}`]
      .filter(Boolean)
      .join('\n');
    codex = both || `SKIPPED: no reviewer available (${codex.split('\n')[0]}; ${second.split('\n')[0]})`;
    // The judge proved the solutions; only a reader can catch ambiguity or
    // borrowed wording. With no reader at all, nothing is written and the
    // anchors stay uncovered for a later batch.
    if (!both) {
      console.log('  no reviewer available (Codex capped and the model reviewer unavailable); nothing written');
      console.log(JSON.stringify({ mode: anchorsPath ? 'anchored' : 'family', anchors: anchors.map((a) => a.slug), drafted: drafts.length, accepted: 0, rejected: rejected.length, unreviewed: accepted.length, codex }));
      process.exit(3);
    }
    console.log(codex.split('\n').map((l) => '    ' + l).join('\n'));

    // Codex's notes are acted on, not just logged. A statement it calls
    // ambiguous, or too close to a known problem's wording, goes back to
    // Gemini for a rewrite of the statement only — tests and solutions stay,
    // so the judge's verdict stands — and the rewrite is re-checked locally.
    // A statement that fails the rewrite is dropped rather than shipped.
    const flagged = new Map<string, string>();
    for (const line of codex.split('\n')) {
      const m = /^\s*([a-z0-9-]+):\s*(.+)$/.exec(line);
      if (!m) continue;
      const [, slug, note] = m;
      if (!accepted.some((d) => d.slug === slug)) continue;
      if (/^ok\b/i.test(note!)) continue;
      if (/\b(ambiguous|unclear|closely follows|reads like|same wording|mirrors|identical)\b/i.test(note!)) {
        flagged.set(slug!, note!);
      }
    }
    if (flagged.size > 0) {
      const rewritten = rewriteStatements(accepted.filter((d) => flagged.has(d.slug)), flagged);
      for (const r of rewritten) {
        const i = accepted.findIndex((d) => d.slug === r.slug);
        if (i === -1) continue;
        const candidate: Draft = { ...accepted[i]!, title: r.title, promptMarkdown: r.promptMarkdown };
        seen.delete(candidate.slug);
        const why = localReject(candidate, seen);
        seen.add(candidate.slug);
        if (why) {
          console.log(`    ! ${r.slug}: rewrite rejected (${why}); dropping the problem`);
          rejected.push({ slug: r.slug, why: [`codex: ${flagged.get(r.slug)}`, `rewrite: ${why}`] });
          accepted.splice(i, 1);
        } else {
          accepted[i] = candidate;
          console.log(`    ~ ${r.slug}: statement rewritten after Codex note`);
        }
      }
      for (const slug of flagged.keys()) {
        if (!rewritten.some((r) => r.slug === slug) && accepted.some((d) => d.slug === slug)) {
          console.log(`    ! ${slug}: no rewrite returned; dropping the problem`);
          rejected.push({ slug, why: [`codex: ${flagged.get(slug)}`, 'no rewrite'] });
          accepted.splice(accepted.findIndex((d) => d.slug === slug), 1);
        }
      }
    }
  }

  if (dryRun) {
    console.log('  dry run: nothing written');
  } else {
    withLock(() => {
      if (accepted.length > 0) emit(accepted);
      recordCoverage(accepted);
    });
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
