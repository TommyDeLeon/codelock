#!/usr/bin/env node
/**
 * Rebuild problems/index.ts from the files on disk.
 *
 * Wiring used to be a hand edit, and a hand edit that misses is silent: an
 * unused import type-checks fine, so six families once sat imported but never
 * spread into ALL_PROBLEMS. Nothing caught it — the batch checker only reads
 * files, and the test suite only sees what ALL_PROBLEMS contains — until an
 * importer run rejected 46 slugs as unknown.
 *
 * So this derives the array from the directory rather than patching text, and
 * asserts every discovered export reaches ALL_PROBLEMS before writing.
 *
 * Usage: node scripts/wire-corpus.mjs [--check]
 *   --check exits non-zero if index.ts is out of date, for CI.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const dir = 'apps/api/src/corpus/problems';
const indexPath = path.join(dir, 'index.ts');

// Tier order, then filename — the array is read by humans looking for a batch.
const rank = (f) =>
  f.startsWith('tier0.') ? 0 : f.startsWith('tier0') && !f.startsWith('tier05') ? 1
  : f.startsWith('tier05') ? 2 : f.startsWith('tier1-') ? 3
  : f.startsWith('tier2-') ? 4 : f.startsWith('tier3-') ? 5 : 6;

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.test.ts'))
  .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

const entries = [];
for (const file of files) {
  const src = readFileSync(path.join(dir, file), 'utf8');
  const m = src.match(/^export const (TIER_[A-Z0-9_]+):\s*ProblemDefinition\[\]/m);
  if (!m) { console.error(`  no ProblemDefinition export found in ${file}`); process.exit(1); }
  const count = (src.match(/slug: *'/g) || []).length;
  entries.push({ name: m[1], module: file.replace(/\.ts$/, '.js'), count });
}

const header = readFileSync(indexPath, 'utf8').match(/\/\*\*[\s\S]*?\*\/\n(?=export const ALL_PROBLEMS)/);
const doc = header ? header[0] : '';

const out =
  `import type { ProblemDefinition } from '../problem.js';\n` +
  entries.map((e) => `import { ${e.name} } from './${e.module}';`).join('\n') +
  `\n\n${doc}export const ALL_PROBLEMS: ProblemDefinition[] = [\n` +
  entries.map((e) => `  ...${e.name},`).join('\n') +
  `\n];\n\nexport {\n` +
  entries.map((e) => `  ${e.name},`).join('\n') +
  `\n};\n`;

for (const e of entries) {
  if (!out.includes(`  ...${e.name},`)) {
    console.error(`  ${e.name} never reached ALL_PROBLEMS`); process.exit(1);
  }
}

const current = readFileSync(indexPath, 'utf8');
const total = entries.reduce((n, e) => n + e.count, 0);

if (process.argv.includes('--check')) {
  if (current !== out) { console.error('index.ts is out of date — run node scripts/wire-corpus.mjs'); process.exit(1); }
  console.log(`index.ts up to date: ${entries.length} batches, ${total} problems`);
} else {
  writeFileSync(indexPath, out);
  console.log(`wired ${entries.length} batches, ${total} problems`);
  for (const e of entries) console.log(`  ${String(e.count).padStart(3)}  ${e.name}`);
}
