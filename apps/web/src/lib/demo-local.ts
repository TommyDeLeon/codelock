import type { DemoGradeResult, PublicProblem } from '@codelock/shared';

/**
 * The public demo, run entirely in the visitor's browser.
 *
 * WHY THIS EXISTS. The demo used to call the CodeLock API for both its problem
 * and its grading, which meant it only worked while a Postgres instance, the
 * API and a Judge0 container were all running somewhere reachable. In practice
 * that made the one page whose whole job is "try it without installing
 * anything" the page most likely to be broken: it failed when the stack was
 * down, and it failed on a CORS mismatch when the stack was up but the site was
 * served from an origin the API's allowlist did not name. A marketing demo
 * cannot depend on infrastructure the reader has no idea exists.
 *
 * So this removes the dependency rather than hardening it. No network call, no
 * server, no container — nothing to keep running and nothing to pay for, which
 * also keeps the site's "no metered application APIs" claim true of the demo as
 * well as of the product.
 *
 * WHAT IS HONESTLY DIFFERENT FROM THE REAL JUDGE, and why the page says so:
 *
 *   1. **The sandbox.** The real judge starts a throwaway container per
 *      submission with no network, dropped capabilities and a read-only
 *      filesystem. This runs in a Web Worker, isolated from the page's DOM but
 *      not a container. It is the visitor's own code in the visitor's own
 *      browser, so the risk is to nobody else — but it is not the same thing
 *      and must not be described as if it were.
 *   2. **The language.** JavaScript only. Python in the browser would mean
 *      shipping a WebAssembly runtime measured in megabytes to a marketing
 *      page, which is a worse trade than being clear about the limit.
 *   3. **The clock.** The real gate compares against a reference time
 *      calibrated on the judge's own hardware. A browser cannot know that
 *      number, and absolute milliseconds vary enormously between a laptop and a
 *      phone — so the reference solution is run HERE, in the same worker,
 *      moments before the submission, and the budget is derived from that with
 *      the product's real arithmetic. The absolute numbers belong to the
 *      visitor's machine; the ratio is meaningful anywhere, and the ratio is
 *      what the demo is arguing about.
 *   4. **The hidden case.** The real one lives on the server. This one is
 *      generated here, deterministically, which necessarily means it ships in
 *      the page. Acceptable for a demo meant to be beaten once; precisely why
 *      the real product does not do it.
 */

/* ── The problem ────────────────────────────────────────────────────────
 *
 * Copied verbatim from what GET /v1/demo/problem returns, so the offline demo
 * poses the identical problem with the identical starter code rather than a
 * paraphrase of it.
 */

const PROMPT = `Given \`n\` integers and a target, decide whether **any two distinct
elements sum to the target**.

Input arrives on standard input:

\`\`\`
n target
a1 a2 ... an
\`\`\`

Print \`YES\` if such a pair exists, otherwise \`NO\`.

The hidden case has \`n = 30000\`. A nested loop over every pair will produce the
right answer and still miss the speed budget — which is the point of the gate.`;

const STARTER_JS = `const data = require('fs').readFileSync(0, 'utf8').split(/\\s+/);
const n = Number(data[0]);
const target = Number(data[1]);
const values = data.slice(2, 2 + n).map(Number);

// Correct, and far too slow for the hidden case. Try again.
let found = false;
for (let i = 0; i < n && !found; i++) {
  for (let j = i + 1; j < n; j++) {
    if (values[i] + values[j] === target) { found = true; break; }
  }
}

console.log(found ? 'YES' : 'NO');
`;

export const DEMO_PROBLEM = {
  id: 'demo-pair-sum',
  slug: 'pair-sum',
  title: 'Pair Sum',
  difficulty: 'EASY',
  promptMarkdown: PROMPT,
  starterCode: { JAVASCRIPT: STARTER_JS },
  sampleCases: [
    {
      ordinal: 0,
      stdin: '8 1161125\n112940 213924 88878 266316 525562 780772 478710 682415\n',
      expectedStdout: 'YES',
    },
    {
      ordinal: 1,
      stdin: '8 1\n224848 766932 678496 228120 724592 689838 39892 562484\n',
      expectedStdout: 'NO',
    },
  ],
  avgSolveSeconds: 300,
} as unknown as PublicProblem;

/* ── The hidden case ────────────────────────────────────────────────────── */

/**
 * Builds the stress case, deterministically.
 *
 * Thirty thousand values from a fixed seed, and a target chosen so the answer
 * is NO. That is deliberate rather than incidental: a nested loop that finds a
 * pair can stop early, so a YES case lets a quadratic solution get lucky and
 * finish fast. Forcing NO makes it examine every pair, which is the only way
 * the demo reliably demonstrates the thing it claims to demonstrate.
 *
 * Every value is even and the target is odd, so no pair can sum to it — correct
 * by construction rather than by hoping the seed cooperates.
 */
function buildHiddenCase(): { stdin: string; expectedStdout: string } {
  const n = 30000;
  let seed = 20260908;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const values: number[] = [];
  for (let i = 0; i < n; i += 1) {
    values.push(Math.floor(next() * 500000) * 2);
  }

  return {
    stdin: `${n} 1000001\n${values.join(' ')}\n`,
    expectedStdout: 'NO',
  };
}

/**
 * The reference solution, as source rather than as a function.
 *
 * Run through the very same worker and harness as the submission, because a
 * budget derived from a differently-measured baseline would be comparing two
 * unlike things. Linear: one pass, and a set of what has been seen.
 */
const REFERENCE_JS = `const data = require('fs').readFileSync(0, 'utf8').split(/\\s+/);
const n = Number(data[0]);
const target = Number(data[1]);
const seen = new Set();
let found = false;
for (let i = 0; i < n; i++) {
  const v = Number(data[2 + i]);
  if (seen.has(target - v)) { found = true; break; }
  seen.add(v);
}
console.log(found ? 'YES' : 'NO');
`;

/* ── The worker ─────────────────────────────────────────────────────────── */

/**
 * The harness, as a string, compiled into a Blob URL at call time.
 *
 * Inline rather than a file in public/ so it cannot fall out of sync with this
 * module or 404 behind a stale cache, and so the whole demo stays one import.
 *
 * It emulates just enough of Node for the starter code to be the real starter
 * code: `require('fs').readFileSync(0, ...)` returns the case's stdin, and
 * `console.log` collects stdout. Anything else the submission reaches for is
 * absent, which surfaces as a runtime error on that case rather than as a
 * silent wrong answer.
 */
const WORKER_SOURCE = `
self.onmessage = (event) => {
  const { source, stdin } = event.data;
  const out = [];

  const fakeRequire = (name) => {
    if (name === 'fs' || name === 'node:fs') {
      return {
        readFileSync: () => stdin,
        readFile: (_p, _o, cb) => cb(null, stdin),
      };
    }
    throw new Error("Cannot find module '" + name + "'");
  };

  const console_ = {
    log: (...args) => out.push(args.join(' ')),
    error: (...args) => out.push(args.join(' ')),
    warn: () => {},
    info: (...args) => out.push(args.join(' ')),
  };

  let started = 0;
  try {
    // Compiled once, outside the timed region, so the measurement is the
    // algorithm rather than the parser.
    const run = new Function('require', 'console', 'process', source);
    const proc = {
      stdout: { write: (s) => out.push(String(s).replace(/\\n$/, '')) },
      argv: [],
      env: {},
    };
    started = performance.now();
    run(fakeRequire, console_, proc);
    const elapsed = performance.now() - started;
    self.postMessage({ ok: true, stdout: out.join('\\n'), timeMs: elapsed });
  } catch (error) {
    const elapsed = started ? performance.now() - started : 0;
    self.postMessage({
      ok: false,
      stdout: out.join('\\n'),
      timeMs: elapsed,
      stderr: (error && error.stack) || String(error),
    });
  }
};
`;

/** How long any single case may run before its worker is killed. */
const CASE_TIMEOUT_MS = 6000;

type RunOutcome = {
  ok: boolean;
  stdout: string;
  timeMs: number;
  stderr?: string;
  timedOut?: boolean;
};

/**
 * Runs one case in a throwaway worker.
 *
 * A fresh worker per case — slower than reusing one, and the right trade twice
 * over: state cannot leak from one case into the next, and an infinite loop can
 * be dealt with by terminating the worker, which is the only way to stop
 * runaway JavaScript. A busy loop never yields to be asked politely.
 */
function runCase(source: string, stdin: string): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(
      new Blob([WORKER_SOURCE], { type: 'application/javascript' }),
    );
    const worker = new Worker(url);

    let settled = false;
    const finish = (outcome: RunOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(outcome);
    };

    const timer = setTimeout(() => {
      finish({
        ok: false,
        stdout: '',
        timeMs: CASE_TIMEOUT_MS,
        timedOut: true,
        stderr: `Killed after ${CASE_TIMEOUT_MS}ms.`,
      });
    }, CASE_TIMEOUT_MS);

    worker.onmessage = (event) => finish(event.data as RunOutcome);
    worker.onerror = (event) =>
      finish({
        ok: false,
        stdout: '',
        timeMs: 0,
        stderr: event.message || 'The worker failed to start.',
      });

    worker.postMessage({ source, stdin });
  });
}

/** Trailing whitespace is not a wrong answer. */
function normalise(value: string): string {
  return value.replace(/\r/g, '').trimEnd();
}

/* ── Grading ────────────────────────────────────────────────────────────── */

/**
 * The gate, with the product's real arithmetic.
 *
 * `best × 1.35 + 40ms`, rounded up to a whole millisecond, exactly as the
 * repository README documents — the 40ms floor being what stops a problem whose
 * best solution runs in two milliseconds from failing everyone on scheduling
 * noise alone.
 */
function gateFor(bestMs: number): number {
  return Math.ceil(bestMs * 1.35 + 40);
}

export async function gradeLocally(source: string): Promise<DemoGradeResult> {
  const hidden = buildHiddenCase();
  const cases: DemoGradeResult['cases'] = [];

  let passedCount = 0;
  let worstMs = 0;
  let firstFailure: RunOutcome | null = null;

  // Samples first, in the order the problem shows them, so a failure lands on
  // a case the reader can actually see and reason about.
  for (const sample of DEMO_PROBLEM.sampleCases) {
    const outcome = await runCase(source, sample.stdin);
    const passed =
      outcome.ok &&
      normalise(outcome.stdout) === normalise(sample.expectedStdout);
    if (passed) passedCount += 1;
    else if (!firstFailure) firstFailure = outcome;
    worstMs = Math.max(worstMs, outcome.timeMs);

    cases.push({
      ordinal: sample.ordinal,
      isSample: true,
      passed,
      status: outcome.timedOut
        ? 'TIME_LIMIT_EXCEEDED'
        : outcome.ok
          ? passed
            ? 'ACCEPTED'
            : 'WRONG_ANSWER'
          : 'RUNTIME_ERROR',
      timeMs: Math.round(outcome.timeMs),
      stdin: sample.stdin,
      expectedStdout: sample.expectedStdout,
      actualStdout: outcome.stdout || null,
      stderr: outcome.stderr ?? null,
    });
  }

  const hiddenOutcome = await runCase(source, hidden.stdin);
  const hiddenPassed =
    hiddenOutcome.ok &&
    normalise(hiddenOutcome.stdout) === normalise(hidden.expectedStdout);
  if (hiddenPassed) passedCount += 1;
  else if (!firstFailure) firstFailure = hiddenOutcome;
  worstMs = Math.max(worstMs, hiddenOutcome.timeMs);

  cases.push({
    ordinal: 2,
    isSample: false,
    passed: hiddenPassed,
    status: hiddenOutcome.timedOut
      ? 'TIME_LIMIT_EXCEEDED'
      : hiddenOutcome.ok
        ? hiddenPassed
          ? 'ACCEPTED'
          : 'WRONG_ANSWER'
        : 'RUNTIME_ERROR',
    timeMs: Math.round(hiddenOutcome.timeMs),
    // Deliberately no stdin or expectedStdout: a hidden case's expected output
    // is the answer, and the real judge withholds it for that reason. The demo
    // keeps the same manners even though the data is in the bundle.
  });

  const totalCount = cases.length;
  const correct = passedCount === totalCount;

  if (!correct) {
    const failing = cases.find((entry) => !entry.passed);
    return {
      demo: true,
      status:
        failing?.status === 'RUNTIME_ERROR'
          ? 'RUNTIME_ERROR'
          : failing?.status === 'TIME_LIMIT_EXCEEDED'
            ? 'TIME_LIMIT_EXCEEDED'
            : 'WRONG_ANSWER',
      passedCount,
      totalCount,
      runtimeMs: Math.round(worstMs),
      message:
        firstFailure?.stderr?.split('\n')[0] ??
        'Some cases did not produce the expected output.',
      cases,
      correct: false,
      performance: null,
      accepted: false,
    };
  }

  /*
    Only once the answer is correct is it worth timing the reference.

    Running it earlier would spend a second of the visitor's machine building a
    baseline for a submission that was never going to be measured — and the
    demo's whole argument is that correctness is evaluated first and is not
    sufficient on its own.
  */
  const reference = await runCase(REFERENCE_JS, hidden.stdin);
  const bestMs = Math.max(reference.timeMs, 1);
  const gateMs = gateFor(bestMs);
  const runtimeMs = Math.round(worstMs);
  const withinGate = runtimeMs <= gateMs;
  const ratio = runtimeMs / bestMs;

  return {
    demo: true,
    status: withinGate ? 'ACCEPTED' : 'ACCEPTED_TOO_SLOW',
    passedCount,
    totalCount,
    runtimeMs,
    message: withinGate
      ? null
      : `${runtimeMs}ms against a ${gateMs}ms budget. Correct, but roughly ${ratio.toFixed(1)}x slower than the reference solution. Look for a better algorithm.`,
    cases,
    correct: true,
    performance: {
      runtimeMs,
      targetMs: Math.round(bestMs),
      gateMs,
      passed: withinGate,
      ratio,
      reason: withinGate
        ? 'Inside the budget.'
        : `Roughly ${ratio.toFixed(1)}x the reference solution, measured on this machine.`,
    },
    accepted: withinGate,
  };
}
