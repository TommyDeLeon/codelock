/**
 * Re-judge existing corpus problems: every reference solution against every
 * test, through the grader's drivers. Used after a hand edit to a statement's
 * examples or tests.
 *
 *   npx tsx --env-file-if-exists=.env scripts/judge-slugs.ts <slug> [...]
 */
import { ALL_PROBLEMS } from '../src/corpus/problems/index.js';
import { applyUpgrades } from '../src/corpus/upgrade.js';
import { driversFor } from '../src/corpus/signatures.js';
import { LANGUAGES } from '../src/corpus/types.js';
import { failureDetail, normalise, runBatch, unb64, type Run } from './judge-client.js';

const slugs = process.argv.slice(2);
const problems = applyUpgrades(ALL_PROBLEMS).filter((p) => slugs.includes(p.slug));
for (const s of slugs) if (!problems.some((p) => p.slug === s)) console.log(`${s}: not found`);

const runs: Run[] = [];
const keys: Array<{ slug: string; label: string; expected: string }> = [];
for (const p of problems) {
  const drivers = driversFor(p.signatureId!);
  for (const lang of LANGUAGES) {
    const src = p.referenceSolution?.[lang];
    if (!src) continue;
    const source = drivers[lang].replace('{{SOLUTION}}', src);
    p.tests.forEach((t, i) => {
      runs.push({ language: lang, source, stdin: t.stdin });
      keys.push({ slug: p.slug, label: `${lang} test ${i}`, expected: t.expectedStdout });
    });
  }
}
async function main() {
const results = await runBatch(runs);
const bad = new Map<string, string[]>();
results.forEach((r, i) => {
  const k = keys[i]!;
  const actual = normalise(unb64(r.stdout));
  if (actual !== normalise(k.expected)) {
    const list = bad.get(k.slug) ?? [];
    if (list.length < 4) list.push(`${k.label}: ${failureDetail(r, k.expected, actual)}`);
    bad.set(k.slug, list);
  }
});
for (const p of problems) console.log(`${p.slug}: ${bad.has(p.slug) ? 'FAIL ' + bad.get(p.slug)!.join(' | ') : 'PASS'}`);
process.exit(bad.size ? 1 : 0);
}
void main();
