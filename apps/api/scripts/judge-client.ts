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

/**
 * 500 MB — the same figure as the `Problem.memoryLimitKb` default.
 *
 * Two reasons it is not simply the maximum. It is what a real submission gets,
 * so measuring at anything else would calibrate the speed gate against
 * conditions users never see. And the judge runs several containers at once:
 * at 1 GB each, concurrent Go and C++ *compiles* were killed by host memory
 * pressure, which looks exactly like a broken reference solution in the report
 * and is not one. 500 MB is measured-sufficient for both toolchains.
 */
export const MEMORY_LIMIT_KB = 512_000;

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
      // Corpus measurement always yields to a person waiting on a submission.
      // A measure run enqueues thousands of jobs at once; behind them, a real
      // submission passed its 60s timeout and came back ungraded while its
      // author sat locked out of their own machine.
      priority: 'bulk',
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

  return retryTransient(runs, out, timeoutMs);
}

/**
 * Did this run fail because of the machine rather than the code?
 *
 * The Go and C++ toolchains are memory-hungry to *compile*, and several
 * containers build at once. Under host pressure the kernel kills the compiler
 * and the run comes back with `signal: killed` and no output — which is
 * indistinguishable, in the report, from a reference solution that is simply
 * wrong.
 *
 * That distinction matters more at scale than it looks. The corpus is tens of
 * thousands of runs; a transient failure rate of even one percent would
 * randomly deactivate good problems on every import, and the corpus would
 * appear to flicker.
 *
 * A genuine wrong answer is deterministic and will fail the retry too, so
 * retrying costs nothing but time. The tell for a real content bug is the
 * opposite: *every* language agreeing on an answer the test did not expect.
 */
function isTransientFailure(s: Submission): boolean {
  const id = statusId(s);
  // Internal error, or killed mid-compile with nothing to show for it.
  if (id === 13) return true;
  const stderr = unb64(s.stderr);
  return /killed/i.test(stderr);
}

/**
 * Re-run the machine-shaped failures, sequentially.
 *
 * Small chunks on purpose: the failure was contention, so retrying at the same
 * width would reproduce it. Results are patched back into their original
 * positions, because callers index this array by position to recover which
 * problem and language each result belongs to.
 */
async function retryTransient(
  runs: Run[],
  results: Submission[],
  timeoutMs: number,
  attempts = 2,
): Promise<Submission[]> {
  const patched = [...results];

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const failed = patched
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => isTransientFailure(s));
    if (failed.length === 0) break;

    console.log(`\n  retrying ${failed.length} run(s) killed by host pressure (attempt ${attempt})`);
    for (const { i } of failed) {
      const [retried] = await collect(await submit([runs[i]!]), timeoutMs);
      if (retried) patched[i] = retried;
    }
  }

  return patched;
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
