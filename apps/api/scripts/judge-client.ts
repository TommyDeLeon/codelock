import type { Lang } from '../src/corpus/types.js';

/**
 * Minimal client for the judge's batch API.
 *
 * Shared by `verify-drivers.ts` and `import-corpus.ts`. Both need to run
 * generated source against real test data, and two copies of the polling loop
 * would eventually disagree about what "finished" means — precisely the bug
 * that made the first driver run report 0/18 passing when nothing was wrong
 * with the drivers at all.
 */

export const JUDGE_URL = process.env.JUDGE0_URL ?? 'http://localhost:2358';

/** Matches Judge0 1.13.1, which is what `apps/judge` speaks. */
export const LANGUAGE_IDS: Record<Lang, number> = {
  JAVASCRIPT: 63,
  TYPESCRIPT: 74,
  PYTHON: 71,
  JAVA: 62,
  CPP: 54,
  GO: 60,
};

/**
 * Compile-sized limits.
 *
 * The compiler runs *inside* the sandbox's `--memory` bound. At the 256 MB
 * default, `g++ -O2` on <bits/stdc++.h> and `go run` are both killed outright,
 * which reads as a broken driver when nothing is broken but the budget.
 */
export const CPU_TIME_LIMIT = 20;
export const MEMORY_LIMIT_KB = 1_048_576;

export const b64 = (s: string): string => Buffer.from(s, 'utf8').toString('base64');
export const unb64 = (s: string | null | undefined): string =>
  s ? Buffer.from(s, 'base64').toString('utf8') : '';

export interface Submission {
  token: string;
  /** Judge0 reports `{ id, description }`, not a bare number. */
  status?: { id: number; description?: string } | number;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | null;
}

export const statusId = (s: Submission): number =>
  typeof s.status === 'number' ? s.status : (s.status?.id ?? 0);

export const statusName = (s: Submission): string =>
  typeof s.status === 'number' ? String(s.status) : (s.status?.description ?? 'unknown');

export interface Run {
  language: Lang;
  source: string;
  stdin: string;
}

export async function isJudgeUp(): Promise<boolean> {
  const res = await fetch(`${JUDGE_URL}/healthz`).catch(() => null);
  return Boolean(res?.ok);
}

async function submit(runs: Run[]): Promise<string[]> {
  const res = await fetch(`${JUDGE_URL}/submissions/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      submissions: runs.map((r) => ({
        language_id: LANGUAGE_IDS[r.language],
        source_code: b64(r.source),
        stdin: b64(r.stdin),
        cpu_time_limit: CPU_TIME_LIMIT,
        memory_limit: MEMORY_LIMIT_KB,
      })),
    }),
  });
  if (!res.ok) throw new Error(`judge rejected the batch: ${res.status} ${await res.text()}`);
  return ((await res.json()) as Array<{ token: string }>).map((s) => s.token);
}

/** Poll until every token is out of the queue. Compiled languages are slow. */
async function collect(tokens: string[], timeoutMs: number): Promise<Submission[]> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await fetch(`${JUDGE_URL}/submissions/batch?tokens=${tokens.join(',')}`);
    const { submissions } = (await res.json()) as { submissions: Submission[] };
    const pending = submissions.filter((s) => statusId(s) === 1 || statusId(s) === 2).length;
    if (pending === 0) return submissions;
    if (Date.now() > deadline) {
      throw new Error(`timed out with ${pending} submissions still running`);
    }
    process.stdout.write(`\r  waiting on ${pending}/${tokens.length} ...    `);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

/**
 * Submissions per POST.
 *
 * The judge caps a request body at 2 MB, and a submission is a whole generated
 * program in base64 — roughly 6-10 KB each. Past a few hundred the body exceeds
 * the cap and the POST fails as a bare `fetch failed`, with nothing in the
 * judge log to explain it. The full corpus is tens of thousands of runs, so
 * chunking is not a safeguard here, it is the normal path.
 *
 * It also stops the queue being handed the whole corpus at once, which makes
 * progress observable instead of a single silent hour.
 */
const CHUNK_SIZE = 80;

/**
 * Submit and wait for every run, in chunks.
 *
 * Results come back in the caller's original order: callers index into this by
 * position to recover which problem and language each result belongs to, so
 * reordering would silently attribute failures to the wrong problem.
 */
export async function runBatch(runs: Run[], timeoutMs = 30 * 60_000): Promise<Submission[]> {
  if (runs.length === 0) return [];

  const out: Submission[] = [];
  for (let i = 0; i < runs.length; i += CHUNK_SIZE) {
    const chunk = runs.slice(i, i + CHUNK_SIZE);
    const done = Math.min(i + CHUNK_SIZE, runs.length);
    process.stdout.write(`\r  judged ${i}/${runs.length} ...    `);
    out.push(...(await collect(await submit(chunk), timeoutMs)));
    process.stdout.write(`\r  judged ${done}/${runs.length} ...    `);
  }
  process.stdout.write('\r');
  return out;
}

/** Human-readable reason a run did not produce the expected output. */
export function failureDetail(result: Submission, expected: string, actual: string): string {
  const compile = unb64(result.compile_output).trim();
  if (compile) return `compile error: ${compile.split('\n').slice(0, 3).join(' | ')}`;
  const stderr = unb64(result.stderr).trim();
  if (stderr) return `runtime error: ${stderr.split('\n').slice(0, 3).join(' | ')}`;
  return `[${statusName(result)}] expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`;
}

/** stdout as the grader compares it: CR stripped, trailing blank lines removed. */
export const normalise = (s: string): string => s.replace(/\r/g, '').trimEnd();
