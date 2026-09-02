#!/usr/bin/env node
/**
 * Corpus-wide semantic check, run after check-batch.mjs.
 *
 * check-batch.mjs reads one file and asks whether it is shaped correctly. It
 * passed 123 generated placeholder problems once, because a generator produces
 * perfect shape. Every check here compares *content* — across the whole corpus,
 * not one file — and each one is aimed at that failure:
 *
 *   - two problems whose solutions are the same program are one problem,
 *   - two problems whose statements are the same prose are one problem,
 *   - a problem whose tests all share one input is barely judged,
 *   - a slug that collides is a silent overwrite at import.
 *
 * Usage: node scripts/check-semantics.mjs [file ...]   (default: whole corpus)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'apps/api/src/corpus/problems';
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(DIR).filter((f) => f.startsWith('tier') && f.endsWith('.ts')).map((f) => join(DIR, f));

let bad = 0;
const fail = (m) => { console.log(`FAIL ${m}`); bad++; };

/** Whitespace and identifier names differ between two copies of one program; logic does not. */
const normalise = (s) => s.replace(/\s+/g, '').replace(/['"`]/g, '').toLowerCase();

const bySlug = new Map();

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  // Split on the problem constructor so each chunk is one problem's text.
  const chunks = src.split(/\bp\(\{/).slice(1);
  for (const chunk of chunks) {
    const slug = chunk.match(/slug: *'([a-z0-9-]+)'/)?.[1];
    if (!slug) continue;
    const prompt = chunk.match(/promptMarkdown: *\[([\s\S]*?)\]\.join/)?.[1] ?? '';
    // Two shapes reach here. An inline object names the language
    // (`PYTHON: '...'`); a six-argument passthrough factory
    // (`six(js, ts, py, java, cpp, go)`) does not, so the Python solution is
    // just the argument that happens to be Python. Matching `def solve` finds
    // it either way — and missing it silently would make every check below
    // vacuous, which is exactly how a batch of clones once passed.
    const python =
      chunk.match(/PYTHON: *'((?:[^'\\]|\\.)*)'/)?.[1] ??
      chunk.match(/'(def solve(?:[^'\\]|\\.)*)'/)?.[1] ??
      '';
    const stdins = [...chunk.matchAll(/stdin: *'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]);
    const prev = bySlug.get(slug);
    if (prev) fail(`slug '${slug}' defined in both ${prev.file} and ${file}`);
    bySlug.set(slug, { file, slug, prompt, python, stdins });
  }
}

console.log(`${bySlug.size} problems across ${files.length} file(s)\n`);

// A problem whose test inputs are all the same input has one test, not four.
for (const { slug, stdins, file } of bySlug.values()) {
  if (stdins.length >= 2 && new Set(stdins).size === 1) {
    fail(`${slug} (${file}): all ${stdins.length} tests use the same stdin`);
  }
}

// Two problems sharing one program are one problem under two names. This is the
// defect that shipped 123 rows, and it is invisible to a per-file check when the
// duplicates are spread across batches.
const seen = new Map();
for (const e of bySlug.values()) {
  if (e.python.length < 20) continue;
  const key = normalise(e.python);
  const prev = seen.get(key);
  if (prev) fail(`${e.slug} (${e.file}) has the same Python solution as ${prev.slug} (${prev.file})`);
  else seen.set(key, e);
}

// Same for the statement: identical prose means the same task was asked twice.
const seenPrompt = new Map();
for (const e of bySlug.values()) {
  if (e.prompt.length < 40) continue;
  const key = normalise(e.prompt);
  const prev = seenPrompt.get(key);
  if (prev) fail(`${e.slug} (${e.file}) has the same statement as ${prev.slug} (${prev.file})`);
  else seenPrompt.set(key, e);
}

// Placeholder titles and index-suffixed slugs are the generator's fingerprint.
for (const { slug, file } of bySlug.values()) {
  if (/-\d+$/.test(slug) && !/^[a-z]+-\d+$/.test(slug)) {
    fail(`${slug} (${file}): slug ends in an index, which is how generated batches name themselves`);
  }
}

console.log(bad === 0 ? '\nOK' : `\n${bad} problem(s)`);
process.exit(bad === 0 ? 0 : 1);
