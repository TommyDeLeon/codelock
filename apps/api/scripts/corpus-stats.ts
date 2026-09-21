/**
 * Count the corpus for the marketing site.
 *
 *   npm run corpus:stats -w @codelock/api            # rewrite the file
 *   npm run corpus:stats -w @codelock/api -- --check # fail if it is stale
 *
 * The landing page's curriculum map states how many problems each pattern
 * family holds. Those numbers are claims about the product, so they are counted
 * from `ALL_PROBLEMS` rather than typed, and CI runs `--check` so that authoring
 * a batch without re-running this fails the build instead of leaving the site
 * quietly understating (or overstating) the corpus.
 *
 * The output is a committed JSON file rather than a build-time import because
 * the marketing site deploys on its own and cannot compile the API's corpus.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_PROBLEMS } from '../src/corpus/problems/index.js';
import { PATTERN_FAMILIES, FAMILY_LABELS } from '@codelock/shared';

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..', '..', '..', 'codelock-marketing', 'src', 'data', 'corpus-stats.json',
);

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

const families = PATTERN_FAMILIES.map((family) => {
  const inFamily = ALL_PROBLEMS.filter((p) => p.patternFamily === family);
  const byDifficulty = Object.fromEntries(
    DIFFICULTIES.map((d) => [d, inFamily.filter((p) => p.difficulty === d).length]),
  ) as Record<(typeof DIFFICULTIES)[number], number>;
  return { family, label: FAMILY_LABELS[family], total: inFamily.length, byDifficulty };
});

// No date field: a timestamp would make every run a diff and `--check` useless.
const stats = { total: ALL_PROBLEMS.length, families };
const json = `${JSON.stringify(stats, null, 2)}\n`;

if (process.argv.includes('--check')) {
  let current = '';
  try { current = readFileSync(OUT, 'utf8'); } catch { /* missing counts as stale */ }
  // Git on Windows may check the file out with CRLF; line endings are not staleness.
  if (current.replace(/\r\n/g, '\n') !== json) {
    console.error('corpus-stats.json is stale. Run: npm run corpus:stats -w @codelock/api');
    process.exit(1);
  }
  console.log(`Corpus stats current: ${stats.total} problems.`);
} else {
  writeFileSync(OUT, json);
  console.log(`Wrote ${stats.total} problems across ${families.length} families.`);
}
