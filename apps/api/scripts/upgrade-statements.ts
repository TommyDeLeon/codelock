/**
 * Rewrite hand-authored problem statements into interview format.
 *
 * The generated problems (`gen-*.ts`) carry constraints, three worked
 * examples, a follow-up and an editorial that names the pattern and the
 * trap. The 695 hand-authored problems predate that. This script brings
 * them to the same shape without touching anything the judge verified:
 * tests, reference solutions, tags and signatures are read-only here.
 *
 * ## The gate
 *
 * 1. A model drafts a new title-preserving statement and editorial for N
 *    problems from their current text, sample tests and reference solution.
 * 2. Every `**Example**` block must reproduce one of the problem's own
 *    tests exactly (input and output). Nothing invented; nothing that
 *    would need the judge. A non-sample test an example draws on is
 *    promoted to a sample so it is visible where the example says it is.
 * 3. The reviewer (Codex, else Claude via `agy`) reads the statements for
 *    ambiguity and borrowed wording; flagged ones are dropped from this
 *    batch and come round again later.
 * 4. Survivors are recorded in `src/corpus/upgrades.ts`, keyed by slug,
 *    and laid over the originals at load time by `src/corpus/upgrade.ts`.
 *
 *   npm run upgrade:batch -- --count 8 [--model gemini-3.1-pro-low] [--dry-run]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ALL_PROBLEMS } from '../src/corpus/problems/index.js';
import type { ProblemDefinition } from '../src/corpus/problem.js';
import { UPGRADES, type StatementUpgrade } from '../src/corpus/upgrades.js';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 || !process.argv[i + 1] ? fallback : process.argv[i + 1]!;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const count = Number(arg('count', '8'));
const model = arg('model', 'gemini-3.1-pro-low');
const fallbackModel = arg('fallback-model', 'claude-sonnet-4-6');
const reviewModel = arg('review-model', model.startsWith('gemini') ? 'claude-sonnet-4-6' : 'gemini-3.1-pro-low');
const dryRun = flag('dry-run');
const upgradesPath = join('src', 'corpus', 'upgrades.ts');

// ---------------------------------------------------------------------------
// Which problems
// ---------------------------------------------------------------------------

/** Hand-authored, not yet rewritten, easiest tier first so the ramp improves first. */
const TIER_ORDER = ['TIER_0', 'TIER_0_5', 'TIER_1', 'TIER_2', 'TIER_3'];
/** `--shard k/N`: parallel upgrade workers take disjoint slices by a stable hash of the slug. */
const shard = (() => {
  const m = /^(\d+)\/(\d+)$/.exec(arg('shard', '0/1'));
  if (!m) throw new Error('--shard must look like k/N');
  return { k: Number(m[1]), n: Number(m[2]) };
})();
function shardOf(slug: string): number {
  let h = 2166136261;
  for (const ch of slug) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h % shard.n;
}

const pending = ALL_PROBLEMS.filter(
  (p) => {
    if (p.provenance.source === 'codelock-generated' || shardOf(p.slug) !== shard.k) return false;
    const up = UPGRADES[p.slug];
    // Not yet rewritten, or refreshed with new tests but still carrying the
    // original statement (refresh clears `skipped` and keeps the old words).
    return !up || (!!up.tests && !up.skipped && up.promptMarkdown === p.promptMarkdown);
  },
).sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) || a.slug.localeCompare(b.slug));
const batch = pending.slice(0, count);

// ---------------------------------------------------------------------------
// The brief
// ---------------------------------------------------------------------------

const WIRE_FORMAT = `
Wire format used in every example block (the input lines are the function's parameters, one per line; the output is the return value):
- int: decimal · double: 6 decimals · bool: "true"/"false" · string: raw line
- int[]: space-separated on one line (empty list = empty line) · string[]: whitespace-separated tokens
- int[][]: rows separated by ";" · tree: level order with "null" · linked list: space-separated values
`;

function briefFor(problems: ProblemDefinition[]): string {
  return `You are rewriting problem statements for CodeLock, an open-source (CC0) learning app, into serious interview format. For each problem below, write a NEW promptMarkdown and editorialMarkdown. Keep the slug. Keep the problem's meaning EXACTLY: same inputs, same outputs, same edge-case behaviour, same ordering rules — the tests and reference solutions are fixed and will not change. If the current statement is vague about an edge case, resolve it the way the reference solution does.

promptMarkdown format (Markdown, no HTML, no LaTeX):
- A clear statement with a concrete scenario. Original wording; never mention LeetCode, HackerRank, Codeforces or any problem site.
- A "**Constraints**" section with explicit bounds consistent with the tests and the reference solution.
- Two or three "**Example N**" blocks. Each MUST be one of the tests listed for that problem, reproduced exactly in this shape:
  \`\`\`
  input:
  <stdin lines exactly as given>
  output: <expected stdout exactly as given>
  \`\`\`
  followed by a one-line explanation. When the expected output has several lines (operation-log problems), write "output:" on its own line and then the output lines exactly as given. Use the two sample tests as Examples 1 and 2; you may use the third listed test as Example 3.
- A "**Follow-up:**" line about time or space complexity where meaningful.

editorialMarkdown: the intended approach, the pattern's name, time and space complexity written in plain text like O(n log n) (no $ signs), and the one trap most solvers hit. Real paragraphs, not one line.
${WIRE_FORMAT}
${problems
  .map(
    (p) => `## ${p.slug}
title: ${p.title} · tier: ${p.tier} · difficulty: ${p.difficulty} · family: ${p.patternFamily} · tags: ${p.patternTags.join(', ')} · signature: ${p.signatureId}
Tests available for examples (use these exactly):
${p.tests
  .slice(0, 3)
  .map((t, i) => `[${i + 1}${t.isSample ? ', sample' : ''}] stdin: ${JSON.stringify(t.stdin)} -> ${JSON.stringify(t.expectedStdout)}`)
  .join('\n')}
Reference solution (Python):
${p.referenceSolution.PYTHON ?? '(none)'}
Current statement:
${p.promptMarkdown}
Current editorial:
${p.editorialMarkdown}`,
  )
  .join('\n\n')}

Return JSON matching the schema, one entry per slug.`;
}

const schema = {
  type: 'object',
  properties: {
    problems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          promptMarkdown: { type: 'string' },
          editorialMarkdown: { type: 'string' },
        },
        required: ['slug', 'promptMarkdown', 'editorialMarkdown'],
      },
    },
  },
  required: ['problems'],
};

interface Rewrite {
  slug: string;
  promptMarkdown: string;
  editorialMarkdown: string;
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

function askJson(which: string, brief: string, timeout: string): Rewrite[] {
  const dir = mkdtempSync(join(tmpdir(), 'codelock-upgrade-'));
  const schemaPath = join(dir, 'schema.json');
  const briefPath = join(dir, 'brief.md');
  writeFileSync(schemaPath, JSON.stringify(schema));
  writeFileSync(briefPath, brief);
  const raw = execFileSync(
    'agy',
    [
      `--print=Read the brief at ${briefPath} and do exactly what it says. Return JSON matching the schema.`,
      '--mode', 'plan', '--dangerously-skip-permissions', '--add-dir', dir,
      '--model', which, '--output-format', 'json', '--json-schema', schemaPath,
      '--print-timeout', timeout, '--disable-slash-commands',
    ],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true },
  );
  const parsed = JSON.parse(raw) as { status?: string; structured_output?: { problems?: Rewrite[] } };
  if (parsed.status !== 'SUCCESS' || !parsed.structured_output?.problems) {
    const err = new Error(`${which} returned nothing usable: ${raw.slice(0, 300)}`);
    (err as Error & { quota?: boolean }).quota = /quota|usage limit|rate limit/i.test(raw);
    throw err;
  }
  return parsed.structured_output.problems;
}

/** A second attempt for flagged problems, with the reviewer's note attached to each. */
function draftWithNotes(problems: ProblemDefinition[], notes: Map<string, string>): Rewrite[] {
  const brief =
    briefFor(problems) +
    `\n\nA reviewer flagged the previous attempt at each of these. Address the note directly; if it says the wording follows a known problem, change the scenario and the sentences, not just words. If it names an ambiguity, resolve it explicitly in the statement and constraints (in the way the reference solution behaves). If it says an example explanation is wrong, correct the explanation to match the actual output.\n\n` +
    problems.map((p) => `- ${p.slug}: ${notes.get(p.slug)}`).join('\n');
  try {
    return askJson(model, brief, '15m');
  } catch (err) {
    if (!(err as { quota?: boolean }).quota) return [];
    try {
      return askJson(fallbackModel, brief, '15m');
    } catch {
      return [];
    }
  }
}

/** Drafting stays with Gemini; a quota error is surfaced so the loop can wait for the reset. `--draft-fallback` opts into the second pool instead. */
const draftFallback = flag('draft-fallback');

function draft(problems: ProblemDefinition[]): { rewrites: Rewrite[]; by: string } {
  const brief = briefFor(problems);
  console.log(`  asking ${model} to rewrite ${problems.length} statements ...`);
  try {
    return { rewrites: askJson(model, brief, '15m'), by: model };
  } catch (err) {
    if (!draftFallback || !(err as { quota?: boolean }).quota) throw err;
    console.log(`  ${model} is out of quota; using ${fallbackModel}`);
    return { rewrites: askJson(fallbackModel, brief, '15m'), by: fallbackModel };
  }
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

const FORBIDDEN = /leetcode|hackerrank|codeforces|neetcode/i;

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

const norm = (s: string) => s.replace(/\r/g, '').trimEnd();

/**
 * Every example block must be one of the problem's tests, exactly. Returns
 * the stdins of matched tests (to promote to samples) or a rejection.
 */
function checkExamples(
  p: ProblemDefinition,
  prompt: string,
): { ok: true; used: string[] } | { ok: false; why: string } {
  // `output:` may carry one value on the same line or several lines below it
  // (operation-log problems print one line per operation).
  const blocks = [...prompt.matchAll(/```\s*\ninput:\n?([\s\S]*?)\noutput:[ \t]*([\s\S]*?)\n?```/g)];
  if (blocks.length < 2) {
    // Show what came back, so a format the parser does not know is visible
    // in the batch log instead of a bare count.
    const first = prompt.indexOf('**Example');
    const snippet = first === -1 ? prompt.slice(0, 240) : prompt.slice(first, first + 320);
    return { ok: false, why: `only ${blocks.length} parsable example blocks; got: ${JSON.stringify(snippet)}` };
  }
  const used: string[] = [];
  for (const [, stdinRaw, outRaw] of blocks) {
    const stdin = norm(stdinRaw ?? '');
    const out = norm((outRaw ?? '').replace(/^\n/, ''));
    const hit = p.tests.find((t) => norm(t.stdin) === stdin && norm(t.expectedStdout) === out);
    if (!hit) {
      return {
        ok: false,
        why: `example ${JSON.stringify(stdin.slice(0, 40))} -> ${JSON.stringify(out.slice(0, 20))} matches no test`,
      };
    }
    used.push(hit.stdin);
  }
  return { ok: true, used };
}

function reject(p: ProblemDefinition, r: Rewrite): string | null {
  r.promptMarkdown = cleanMarkdown(r.promptMarkdown);
  r.editorialMarkdown = cleanMarkdown(r.editorialMarkdown);
  if (FORBIDDEN.test(r.promptMarkdown) || FORBIDDEN.test(r.editorialMarkdown)) return 'mentions a problem site';
  // Any heading style counts; what matters is that the bounds are stated.
  if (!/(\*\*Constraints\*\*|^#+\s*Constraints|\bConstraints:)/im.test(r.promptMarkdown)) {
    return `no Constraints section; got: ${JSON.stringify(r.promptMarkdown.slice(0, 200))}`;
  }
  if ((r.promptMarkdown.match(/\*\*Example/g) ?? []).length < 2) return 'fewer than two examples';
  if (r.editorialMarkdown.length < 200) return 'editorial too short';
  const ex = checkExamples(p, r.promptMarkdown);
  if (!ex.ok) return ex.why;
  return null;
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

function reviewText(items: Array<{ p: ProblemDefinition; r: Rewrite }>): string {
  return items
    .map(
      ({ p, r }) =>
        `### ${p.slug}\n${r.promptMarkdown}\n\nSample tests:\n${p.tests
          .filter((t) => t.isSample)
          .map((t) => `stdin: ${JSON.stringify(t.stdin)} -> ${JSON.stringify(t.expectedStdout)}`)
          .join('\n')}`,
    )
    .join('\n\n');
}

const REVIEW_ASK =
  'You are an adversarial reviewer of programming problem statements. For each problem below, say whether it is unambiguous enough that a careful reader would produce exactly the sample outputs, and flag any statement whose SENTENCES OR PHRASING closely follow a well-known interview problem (LeetCode, HackerRank, Codeforces). Sharing a technique or task shape with a known problem is expected and is NOT a reason to flag; flag only wording that reads as a paraphrase of the known statement. Output exactly one line per slug and nothing else: "<slug>: OK", or "<slug>: <issue>" where the issue starts with "ambiguous" or "closely follows".';

function codexReview(text: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'codelock-codex-'));
  const askPath = join(dir, 'ask.md');
  writeFileSync(askPath, `${REVIEW_ASK}\n\n${text}`);
  const win = process.platform === 'win32';
  const instruction = `Read ${askPath} and do exactly what it says.`;
  try {
    return execFileSync(
      'codex',
      ['exec', '--sandbox', 'read-only', '--skip-git-repo-check', win ? `"${instruction}"` : instruction],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, windowsHide: true, timeout: 10 * 60_000, shell: win },
    );
  } catch (err) {
    return `SKIPPED: codex unavailable (${(err as Error).message.split('\n')[0]})`;
  }
}

function modelReview(text: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'codelock-review-'));
  const askPath = join(dir, 'ask.md');
  writeFileSync(askPath, `${REVIEW_ASK}\n\n${text}`);
  // A chain: one model can hang past its timeout on a batch, so the next is
  // tried. The first usable verdict wins.
  const chain = [reviewModel, 'gpt-oss-120b-medium', reviewModel.startsWith('gemini') ? 'claude-sonnet-4-6' : 'gemini-3.8-flash-medium'];
  const failures: string[] = [];
  for (const which of [...new Set(chain)]) {
    try {
      const raw = execFileSync(
        'agy',
        [
          `--print=Read ${askPath} and do exactly what it says. Output only the slug lines.`,
          '--mode', 'plan', '--dangerously-skip-permissions', '--add-dir', dir,
          '--model', which, '--output-format', 'json', '--print-timeout', '8m', '--disable-slash-commands',
        ],
        { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, windowsHide: true },
      );
      const parsed = JSON.parse(raw) as { status?: string; response?: string };
      if (parsed.status === 'SUCCESS' && parsed.response && /^\s*[a-z0-9-]+:\s/m.test(parsed.response)) {
        return parsed.response;
      }
      failures.push(`${which}: ${(parsed.response ?? raw).slice(0, 80).replace(/\n/g, ' ')}`);
    } catch (err) {
      failures.push(`${which}: ${(err as Error).message.split('\n')[0].slice(0, 80)}`);
    }
  }
  return `SKIPPED: review unavailable (${failures.join('; ')})`;
}

/** Slugs the reviewer flagged, with its note. Codex on a rate-limit error is recorded as SKIPPED and Claude reviews instead. */
function review(items: Array<{ p: ProblemDefinition; r: Rewrite }>): { flagged: Map<string, string>; by: string } {
  const text = reviewText(items);
  // Codex and a second model read side by side; a flag from either counts.
  const first = codexReview(text);
  const second = modelReview(text);
  const usable = (s: string) => !s.startsWith('SKIPPED') && !/usage limit|quota/i.test(s);
  const out = [usable(first) ? first : '', usable(second) ? second : ''].filter(Boolean).join('\n');
  const by = [usable(first) ? 'codex' : '', usable(second) ? reviewModel : ''].filter(Boolean).join('+') || 'none';
  if (!usable(first)) console.log(`  codex: ${first.split('\n')[0].slice(0, 120)}`);
  const flagged = new Map<string, string>();
  for (const line of out.split('\n')) {
    const m = /^\s*([a-z0-9-]+):\s*(.+)$/.exec(line);
    if (!m || /^ok\b/i.test(m[2]!)) continue;
    if (items.some((it) => it.p.slug === m[1])) flagged.set(m[1]!, m[2]!);
  }
  return { flagged, by };
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

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
 * slug. Generated and extended by \`scripts/upgrade-statements.ts\`; applied
 * by \`upgrade.ts\`. Do not edit by hand — rerun the script.
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

// ---------------------------------------------------------------------------

function main() {
  if (batch.length === 0) {
    console.log('  every hand-authored problem is upgraded; nothing to do');
    console.log(JSON.stringify({ mode: 'upgrade', pending: 0, accepted: 0, rejected: 0 }));
    return;
  }
  console.log(`  ${pending.length} pending; taking ${batch.length}`);
  const { rewrites, by } = draft(batch);

  const accepted: Array<{ p: ProblemDefinition; r: Rewrite; used: string[] }> = [];
  const rejected: Array<{ slug: string; why: string }> = [];
  for (const p of batch) {
    const r = rewrites.find((x) => x.slug === p.slug);
    if (!r) {
      rejected.push({ slug: p.slug, why: 'no rewrite returned' });
      continue;
    }
    const why = reject(p, r);
    if (why) rejected.push({ slug: p.slug, why });
    else accepted.push({ p, r, used: (checkExamples(p, r.promptMarkdown) as { used: string[] }).used });
  }
  console.log(`  passed checks: ${accepted.length}/${batch.length}`);

  let reviewer = 'none';
  // Slugs the reviewer would not pass even after one rewrite with its note.
  // Recorded as skipped so they keep their original statement and are not
  // drawn again next batch; a Fizz Buzz will always read like Fizz Buzz.
  const skipped = new Map<string, string>();
  if (accepted.length > 0) {
    const { flagged, by: who } = review(accepted);
    reviewer = who;
    // A problem whose test data was already replaced (`refresh-tests.ts`)
    // is the canonical exercise for its technique, and will always share
    // the technique, framing and follow-up with the famous problem. For
    // those, a "closely follows" note counts only when it points at the
    // words or the example values themselves; ambiguity notes always count.
    for (const [slug, note] of [...flagged]) {
      const refreshed = !!UPGRADES[slug]?.tests;
      const wording = /verbatim|word[- ]for[- ]word|identical|same (example|values|numbers|sentences?)|copied/i.test(note);
      if (refreshed && /closely follows/i.test(note) && !/ambiguous/i.test(note) && !wording) {
        console.log(`    = ${slug}: technique-similarity flag on a refreshed problem; accepted (${note.slice(0, 90)})`);
        flagged.delete(slug);
      }
    }
    if (flagged.size > 0) {
      const again = accepted.filter((a) => flagged.has(a.p.slug));
      console.log(`  ${flagged.size} flagged; asking for one rewrite with the reviewer's notes ...`);
      const second = draftWithNotes(again.map((a) => a.p), flagged);
      const recheck: Array<{ p: ProblemDefinition; r: Rewrite }> = [];
      for (const a of again) {
        const r = second.find((x) => x.slug === a.p.slug);
        const why = r ? reject(a.p, r) : 'no rewrite returned';
        if (!r || why) {
          skipped.set(a.p.slug, `review: ${flagged.get(a.p.slug)!.slice(0, 160)}`);
          continue;
        }
        recheck.push({ p: a.p, r });
      }
      const verdict = recheck.length > 0 ? review(recheck).flagged : new Map<string, string>();
      for (const a of again) {
        const i = accepted.findIndex((x) => x.p.slug === a.p.slug);
        const fixed = recheck.find((x) => x.p.slug === a.p.slug);
        if (fixed && !verdict.has(a.p.slug)) {
          accepted[i] = { p: a.p, r: fixed.r, used: (checkExamples(a.p, fixed.r.promptMarkdown) as { used: string[] }).used };
          console.log(`    ~ ${a.p.slug}: rewritten after review note`);
        } else {
          if (fixed) skipped.set(a.p.slug, `review: ${(verdict.get(a.p.slug) ?? '').slice(0, 160)}`);
          if (i !== -1) accepted.splice(i, 1);
          console.log(`    ! ${a.p.slug}: ${skipped.get(a.p.slug)} — skipped, original statement kept`);
          rejected.push({ slug: a.p.slug, why: skipped.get(a.p.slug)! });
        }
      }
    }
  }

  // A rewrite nobody read is not admitted. Local checks prove the examples
  // are real tests; only a reader can catch ambiguity or borrowed wording.
  if (accepted.length > 0 && reviewer === 'none') {
    console.log('  no reviewer available (Codex capped and the model reviewer unavailable); nothing written');
    console.log(JSON.stringify({ mode: 'upgrade', pending: pending.length, accepted: 0, rejected: rejected.length, draftedBy: by, reviewer, unreviewed: accepted.length }));
    process.exit(3);
  }
  for (const a of accepted) console.log(`    + ${a.p.slug}`);
  for (const r of rejected) console.log(`    - ${r.slug}: ${r.why}`);

  if (!dryRun && (accepted.length > 0 || skipped.size > 0)) {
    const date = new Date().toISOString().slice(0, 10);
    withLock(() => {
      const all: Record<string, StatementUpgrade> = { ...UPGRADES };
      for (const [slug, why] of skipped) {
        const p = batch.find((x) => x.slug === slug)!;
        const prevTests = all[slug]?.tests;
        all[slug] = {
          promptMarkdown: p.promptMarkdown,
          editorialMarkdown: p.editorialMarkdown,
          promoteSamples: [],
          model: by,
          date,
          skipped: why,
          // Refreshed test data survives a skip; losing it would send the
          // problem round the refresh loop again.
          ...(prevTests ? { tests: prevTests } : {}),
        };
      }
      for (const a of accepted) {
        const prevTests = all[a.p.slug]?.tests;
        all[a.p.slug] = {
          promptMarkdown: a.r.promptMarkdown,
          editorialMarkdown: a.r.editorialMarkdown,
          promoteSamples: a.used.filter((stdin) => !a.p.tests.find((t) => t.stdin === stdin)?.isSample),
          model: by,
          date,
          ...(prevTests ? { tests: prevTests } : {}),
        };
      }
      emit(all);
      console.log(`  wrote ${upgradesPath}: ${Object.keys(all).length} upgraded`);
    });
  }

  console.log(
    JSON.stringify({
      mode: 'upgrade',
      pending: pending.length - accepted.length,
      accepted: accepted.length,
      rejected: rejected.length,
      draftedBy: by,
      reviewer,
    }),
  );
}

main();
