import { ALL_PROBLEMS } from '../src/corpus/problems/index.js';
import { applyUpgrades } from '../src/corpus/upgrade.js';

const want = new Set(process.argv.slice(2));
for (const p of applyUpgrades(ALL_PROBLEMS)) {
  if (!want.has(p.slug)) continue;
  console.log('=== ' + p.slug + '  sig=' + p.signature);
  console.log(JSON.stringify((p.tests ?? []).slice(0, 4)));
  for (const [lang, src] of Object.entries(p.referenceSolution ?? {})) {
    console.log('--- ' + lang);
    console.log(src);
  }
}
