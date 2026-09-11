/**
 * Verify the three-layer hint fix empirically: are hints actually varied now?
 *
 * `hintsFor` used to draw all three hints from `BY_FAMILY` alone, so every
 * problem in a pattern family showed identical text — a real user complaint.
 * The rewrite adds two more layers: the problem's most specific `patternTags`
 * entry / its `signatureId` (via `BY_SIGNATURE`), and a boundary read from the
 * problem's own test cases (via `boundaryHint`). This script does not trust
 * that description — it runs `hintsFor` over the entire corpus and counts how
 * distinct the output actually is.
 *
 * Deliberately does not touch Postgres or Docker: the problem definitions are
 * loaded straight from the TypeScript corpus, so this runs on a laptop with
 * nothing else started.
 *
 *   npx tsx scripts/verify-hints.ts
 *   npm run verify:hints -w @codelock/api
 */
import type { PatternFamily } from '@prisma/client';
import { ALL_PROBLEMS } from '../src/corpus/problems/index.js';
import { BY_FAMILY, hintsFor, type HintCase } from '../src/services/hints.js';

interface Row {
  slug: string;
  title: string;
  family: PatternFamily;
  hints: [string, string, string];
  ownBoundary: boolean;
}

function trioKey(hints: readonly [string, string, string]): string {
  return hints.join('');
}

async function main(): Promise<void> {
  const rows: Row[] = ALL_PROBLEMS.map((def) => {
    const source = {
      title: def.title,
      patternFamily: def.patternFamily,
      patternTags: def.patternTags,
      signatureId: def.signatureId,
      hints: (def as unknown as { hints?: string[] }).hints ?? [],
    };
    const cases: HintCase[] = def.tests.map((t) => ({
      stdin: t.stdin,
      expectedStdout: t.expectedStdout,
    }));
    const hints = hintsFor(source, cases) as [string, string, string];
    const familyBoundary = BY_FAMILY[def.patternFamily][2];
    return {
      slug: def.slug,
      title: def.title,
      family: def.patternFamily,
      hints,
      ownBoundary: hints[2] !== familyBoundary,
    };
  });

  const total = rows.length;
  console.log(`Hint variety over ${total} corpus problems.\n`);

  // ---- 1. total -------------------------------------------------------------
  console.log(`1. Total problems checked: ${total}`);

  // ---- 2. distinct trios ------------------------------------------------------
  const byTrio = new Map<string, Row[]>();
  for (const row of rows) {
    const key = trioKey(row.hints);
    const bucket = byTrio.get(key);
    if (bucket) bucket.push(row);
    else byTrio.set(key, [row]);
  }
  const distinctTrios = byTrio.size;
  const pct = ((distinctTrios / total) * 100).toFixed(1);
  console.log(`2. Distinct hint-trios: ${distinctTrios} (${pct}% of ${total})`);

  // ---- 3. top 10 most-repeated trios -------------------------------------------
  const sortedTrios = [...byTrio.values()].sort((a, b) => b.length - a.length);
  console.log(`\n3. Top 10 most-repeated hint-trios:`);
  sortedTrios.slice(0, 10).forEach((group, i) => {
    const first = group[0]!;
    const examples = group.slice(0, 4).map((r) => r.slug);
    const more = group.length > examples.length ? ', and more' : '';
    console.log(`   ${i + 1}. x${group.length}  family=${first.family}`);
    console.log(`        hint 1: "${first.hints[0]}"`);
    console.log(`        hint 2: "${first.hints[1]}"`);
    console.log(`        hint 3: "${first.hints[2]}"`);
    console.log(`        examples: ${examples.join(', ')}${more}`);
  });

  // ---- 4. problems sharing their trio -------------------------------------------
  const shared = rows.filter((r) => byTrio.get(trioKey(r.hints))!.length > 1).length;
  console.log(
    `\n4. Problems sharing their entire trio with at least one other problem: ${shared} (${((shared / total) * 100).toFixed(1)}%)`,
  );

  // ---- 5. per-pattern-family breakdown -------------------------------------------
  console.log(`\n5. Per-pattern-family breakdown:`);
  const byFamily = new Map<PatternFamily, Row[]>();
  for (const row of rows) {
    const bucket = byFamily.get(row.family);
    if (bucket) bucket.push(row);
    else byFamily.set(row.family, [row]);
  }
  const familyRows = [...byFamily.entries()]
    .map(([family, group]) => {
      const distinctInFamily = new Set(group.map((r) => trioKey(r.hints))).size;
      return { family, count: group.length, distinct: distinctInFamily };
    })
    .sort((a, b) => b.count - a.count);
  for (const { family, count, distinct } of familyRows) {
    const famPct = ((distinct / count) * 100).toFixed(0);
    console.log(
      `   ${family.padEnd(20)} ${String(count).padStart(4)} problems, ${String(distinct).padStart(4)} distinct trios (${famPct}%)`,
    );
  }

  // ---- 6. boundary hint: own test data vs family fallback -------------------------
  const ownBoundaryCount = rows.filter((r) => r.ownBoundary).length;
  const fallbackCount = total - ownBoundaryCount;
  console.log(
    `\n6. Boundary hint (hint 3) derived from the problem's own tests: ${ownBoundaryCount} (${((ownBoundaryCount / total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `   Fell back to the family default: ${fallbackCount} (${((fallbackCount / total) * 100).toFixed(1)}%)`,
  );

  // This is a report, not a gate — always succeed.
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
