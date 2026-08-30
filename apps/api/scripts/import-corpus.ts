/**
 * Import the authored corpus.
 *
 *   npm run import:corpus -w @codelock/api              # import, no measurement
 *   npm run import:corpus -w @codelock/api -- --measure # run the judge first
 *   npm run import:corpus -w @codelock/api -- --dry-run
 *
 * `--measure` does double duty, and that is the point. It runs every reference
 * solution against every test case in the real sandbox, which:
 *
 *   - proves each active problem passes the judge against its own solution, and
 *   - produces the per-language `referenceRuntimeMs` the speed gate needs.
 *
 * A problem that fails its own reference solution is never activated. That is
 * the check that stops the corpus shipping a lock nobody can open — not
 * hypothetical: the speed gate was already a coin flip once, because the seeded
 * runtimes came from faster hardware than the judge.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/lib/prisma.js';
import { generateNotice, importProblems } from '../src/corpus/importer.js';
import { driversFor } from '../src/corpus/signatures.js';
import { ALL_PROBLEMS } from '../src/corpus/problems/index.js';
import type { ProblemDefinition } from '../src/corpus/problem.js';
import type { Lang } from '../src/corpus/types.js';
import { failureDetail, isJudgeUp, normalise, runBatch, unb64, type Run } from './judge-client.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const DEFINITIONS: ProblemDefinition[] = [...ALL_PROBLEMS];

interface Measured {
  runtimesBySlug: Record<string, Partial<Record<Lang, number>>>;
  failures: string[];
}

/**
 * Run every reference solution against every test case.
 *
 * The runtime recorded per language is the **slowest** test case, not the mean.
 * The gate has to be beatable on the worst input, and averaging would set a
 * target the reference itself misses on its own hardest case.
 */
async function measure(definitions: ProblemDefinition[]): Promise<Measured> {
  const runs: Run[] = [];
  const index: Array<{ slug: string; language: Lang; expected: string; caseIndex: number }> = [];

  for (const def of definitions) {
    const drivers = driversFor(def.signatureId);
    for (const [language, solution] of Object.entries(def.referenceSolution) as Array<
      [Lang, string]
    >) {
      const source = drivers[language].replace('{{SOLUTION}}', solution);
      def.tests.forEach((test, caseIndex) => {
        runs.push({ language, source, stdin: test.stdin });
        index.push({ slug: def.slug, language, expected: test.expectedStdout, caseIndex });
      });
    }
  }

  console.log(`Running ${runs.length} reference solutions against the judge\n`);
  const results = await runBatch(runs);

  const runtimesBySlug: Record<string, Partial<Record<Lang, number>>> = {};
  const failedSlugs = new Set<string>();
  const failures: string[] = [];

  results.forEach((result, i) => {
    const { slug, language, expected, caseIndex } = index[i]!;
    const actual = normalise(unb64(result.stdout));

    if (actual !== normalise(expected)) {
      failedSlugs.add(slug);
      failures.push(
        `${slug} [${language}] case ${caseIndex}: ${failureDetail(result, expected, actual)}`,
      );
      return;
    }

    const ms = Math.round(Number(result.time ?? 0) * 1000);
    const bySlug = (runtimesBySlug[slug] ??= {});
    bySlug[language] = Math.max(bySlug[language] ?? 0, ms);
  });

  // A problem that failed anywhere gets no runtimes at all, so the importer's
  // own gap check marks it INACTIVE. Partial calibration would be worse than
  // none: it would look measured.
  for (const slug of failedSlugs) delete runtimesBySlug[slug];

  return { runtimesBySlug, failures };
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const shouldMeasure = args.has('--measure');
  const dryRun = args.has('--dry-run');

  let runtimesBySlug: Record<string, Partial<Record<Lang, number>>> = {};

  if (shouldMeasure) {
    if (!(await isJudgeUp())) {
      throw new Error('judge is not answering. Start it with: npm run dev:judge');
    }
    const measured = await measure(DEFINITIONS);
    runtimesBySlug = measured.runtimesBySlug;

    if (measured.failures.length > 0) {
      console.error(`\n${measured.failures.length} reference solution failures:\n`);
      for (const f of measured.failures) console.error(`  ${f}`);
      console.error('\nThose problems will import as INACTIVE.\n');
    } else {
      console.log('All reference solutions passed their own test cases.\n');
    }
  } else {
    // Existing measurements are preserved by the importer, so this is a safe
    // default — but a first import without it activates nothing.
    console.log('No --measure: reference runtimes come from existing rows, if any.\n');
  }

  const results = await importProblems(DEFINITIONS, { runtimesBySlug, dryRun });

  const active = results.filter((r) => r.isActive);
  console.log(`${dryRun ? '[dry run] ' : ''}${results.length} problems, ${active.length} active\n`);

  for (const r of results) {
    const mark = r.isActive ? 'ACTIVE  ' : 'INACTIVE';
    console.log(`  ${mark} ${r.rank}  ${r.valueScore.toFixed(2)}  ${r.slug} (${r.action})`);
    for (const gap of r.blockedBy) console.log(`             - ${gap}`);
  }

  if (dryRun) return;

  // NOTICE is generated from what is actually in the database, not from the
  // definitions — so it describes what shipped, not what was intended.
  const rows = await prisma.problem.findMany({
    select: { source: true, sourceUrl: true, sourceLicense: true, attributionText: true },
  });
  const noticePath = join(REPO_ROOT, 'data', 'NOTICE');
  mkdirSync(dirname(noticePath), { recursive: true });
  writeFileSync(noticePath, generateNotice(rows), 'utf8');
  console.log(
    `\nWrote ${noticePath} (${rows.length} rows, ${new Set(rows.map((r) => r.source)).size} sources)`,
  );
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
