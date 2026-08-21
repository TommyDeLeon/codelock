/**
 * Calibrate the performance gate.
 *
 * The reference runtimes in the seed decide whether a correct solution unlocks
 * the device, so they must reflect *your* Judge0 instance. Numbers measured on
 * a beefy self-hosted box will make the gate unreachable on a shared RapidAPI
 * tier, and vice versa. Re-run this after changing judge hardware, judge
 * version, or language versions.
 *
 *   npx tsx scripts/calibrate.ts               # every active problem
 *   npx tsx scripts/calibrate.ts two-sum       # one problem
 *   npx tsx scripts/calibrate.ts --write       # persist instead of printing
 *
 * Reference solutions live in scripts/reference-solutions/<slug>.<lang>.txt.
 * A problem with no reference solution for a language is reported and skipped
 * rather than guessed at — an uncalibrated gate is worse than no gate.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { Language, PrismaClient } from '@prisma/client';
import { runBatch } from '../src/services/judge0.js';
import { assembleSource } from '../src/services/grading.js';
import { worstCaseRuntime } from '../src/services/performance.js';

const prisma = new PrismaClient();
// __dirname, not import.meta: the API compiles to CommonJS (no "type":"module"
// in package.json), where import.meta is a syntax error.
const SOLUTIONS_DIR = path.join(__dirname, 'reference-solutions');

/** Runs per language. The fastest is kept, matching how submissions are timed. */
const SAMPLES = 3;

const EXTENSIONS: Record<string, Language> = {
  js: Language.JAVASCRIPT,
  ts: Language.TYPESCRIPT,
  py: Language.PYTHON,
  java: Language.JAVA,
  cpp: Language.CPP,
  go: Language.GO,
};

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const slugs = args.filter((a) => !a.startsWith('--'));

  const problems = await prisma.problem.findMany({
    where: { isActive: true, ...(slugs.length > 0 ? { slug: { in: slugs } } : {}) },
    include: { testCases: { orderBy: { ordinal: 'asc' } } },
  });

  if (problems.length === 0) {
    console.error('No matching problems. Did you run the seed?');
    process.exit(1);
  }

  const available = await listSolutions();

  for (const problem of problems) {
    const solutions = available.get(problem.slug);
    if (!solutions) {
      console.warn(`skip ${problem.slug}: no reference solutions on disk`);
      continue;
    }

    const measured: Partial<Record<Language, number>> = {};

    for (const [language, source] of solutions) {
      const driver = (problem.driverCode as Record<string, string>)[language];
      if (!driver) {
        console.warn(`  ${problem.slug}/${language}: no driver, skipping`);
        continue;
      }

      const runs: number[] = [];
      for (let i = 0; i < SAMPLES; i++) {
        const batch = await runBatch({
          language,
          sourceCode: assembleSource(driver, source),
          cases: problem.testCases.map((c) => ({
            stdin: c.stdin,
            expectedOutput: c.expectedStdout,
          })),
          cpuTimeLimit: problem.cpuTimeLimit,
          memoryLimitKb: problem.memoryLimitKb,
        });

        // A reference solution that fails its own tests means the harness or
        // the solution is wrong. Never calibrate against that.
        if (!batch.results.every((r) => r.passed)) {
          console.error(
            `  ${problem.slug}/${language}: reference solution FAILED its own tests — fix it before calibrating`,
          );
          runs.length = 0;
          break;
        }
        runs.push(worstCaseRuntime(batch.results.map((r) => r.timeMs)));
      }

      if (runs.length === 0) continue;
      // Median, not minimum. Grading takes the *fastest* of N runs, so if the
      // reference were also a minimum it would be the luckiest sample ever
      // recorded on this hardware — and a correct optimal solution would be
      // rejected whenever its own run was merely average. Median reference vs
      // min measurement biases the comparison in the user's favour, which is
      // the right direction for something that locks their device.
      measured[language] = median(runs);
      console.log(
        `  ${problem.slug}/${language}: ${measured[language]} ms ` +
          `(median of ${runs.length}; samples: ${runs.join(", ")})`,
      );
    }

    if (Object.keys(measured).length === 0) continue;

    if (write) {
      await prisma.problem.update({
        where: { id: problem.id },
        // Clear observed bests too: they were set against the old baseline and
        // would keep an obsolete, possibly unreachable gate in place.
        data: { referenceRuntimeMs: measured as object, bestRuntimeMs: {} },
      });
      console.log(`  wrote ${problem.slug}`);
    } else {
      console.log(`  referenceRuntimeMs: ${JSON.stringify(measured)}`);
    }
  }

  if (!write) console.log('\nDry run. Pass --write to persist these values.');
}

/** Middle value; for an even count, the lower of the two middles. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)]!;
}

/** slug -> [[language, source], ...] */
async function listSolutions(): Promise<Map<string, Array<[Language, string]>>> {
  const out = new Map<string, Array<[Language, string]>>();

  let files: string[];
  try {
    files = await readdir(SOLUTIONS_DIR);
  } catch {
    console.error(`No reference solutions directory at ${SOLUTIONS_DIR}`);
    return out;
  }

  for (const file of files) {
    // "<slug>.<ext>.txt" — .txt keeps linters and compilers out of them.
    const match = /^(.+)\.([a-z+]+)\.txt$/.exec(file);
    if (!match) continue;

    const [, slug, ext] = match as unknown as [string, string, string];
    const language = EXTENSIONS[ext];
    if (!language) continue;

    const source = await readFile(path.join(SOLUTIONS_DIR, file), 'utf8');
    const list = out.get(slug) ?? [];
    list.push([language, source]);
    out.set(slug, list);
  }
  return out;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
