/**
 * Record what every evaluation case really does on the judge.
 *
 * The hint evaluation must not grade hints against execution results someone
 * typed in. This runs each case in `src/services/tutor/evalset.ts` through the
 * running API's `/v1/run` — sample cases only, exactly what a hint request
 * runs — and saves the responses beside the evaluation test.
 *
 *   npm run record:hint-fixtures -w @codelock/api
 *
 * Needs the API and judge up (docker compose up) and the corpus seeded.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/lib/prisma.js';
import { EVAL_CASES } from '../src/services/tutor/evalset.js';

const API = process.env.CODELOCK_API_URL ?? 'http://127.0.0.1:4000';
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'src', 'services', 'tutor', 'fixtures', 'eval-runs.json');

async function main(): Promise<void> {
  const slugs = [...new Set(EVAL_CASES.map((c) => c.slug))];
  const problems = await prisma.problem.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  const idBySlug = new Map(problems.map((p) => [p.slug, p.id]));

  const runs: Record<string, unknown> = {};
  for (const kase of EVAL_CASES) {
    const problemId = idBySlug.get(kase.slug);
    if (!problemId) throw new Error(`problem ${kase.slug} is not seeded`);
    const response = await fetch(`${API}/v1/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId, language: kase.language, sourceCode: kase.code }),
    });
    const body = (await response.json()) as { cases?: Array<{ matched: boolean | null }> };
    if (!response.ok) throw new Error(`${kase.id}: HTTP ${response.status} ${JSON.stringify(body)}`);
    runs[kase.id] = body;
    const cases = body.cases ?? [];
    console.log(`${kase.id.padEnd(28)} ${cases.filter((c) => c.matched).length}/${cases.length} samples matched`);
  }

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    JSON.stringify({ recordedAt: new Date().toISOString(), source: `${API}/v1/run`, runs }, null, 2) + '\n',
  );
  console.log(`\nWrote ${Object.keys(runs).length} runs to ${out}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
