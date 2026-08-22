import type { DemoGradeResult, Language, PublicProblem } from '@codelock/shared';
import { runBatch, JUDGE0_STATUS } from './judge0.js';
import { evaluatePerformance, worstCaseRuntime, type RuntimeMap } from './performance.js';
import { logger } from '../lib/logger.js';

/**
 * The public demo: the real judge, the real speed gate, and no lock.
 *
 * Three deliberate constraints shape this file.
 *
 * **It never touches the database.** The problem, its test cases and its
 * reference runtimes all live here. That keeps the real problem pool private,
 * lets the demo work during a database outage, and means an unauthenticated
 * endpoint cannot be used to probe our data.
 *
 * **It cannot unlock anything.** There is no session, no token, and the return
 * type has no field one could be put in. Adding it would mean changing the
 * shared contract first, which is exactly the friction wanted here.
 *
 * **It is sized so the lesson lands.** The hidden case is large enough that a
 * nested-loop answer finishes — passing every test — and still misses the speed
 * budget by an order of magnitude. A problem where the naive answer merely
 * timed out would teach the wrong thing: "too slow to finish" is a different
 * lesson from "correct, but too slow".
 */

/**
 * A tiny deterministic PRNG (mulberry32).
 *
 * The test data has to be identical on every boot of every instance, or two API
 * replicas would grade the same submission against different inputs.
 * Math.random cannot promise that; a seeded generator can, and it keeps a 200KB
 * fixture out of the repository.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build one case: n values, and a target that is present or absent as asked.
 *
 * The planted pair sits at the very end so a naive scan cannot get lucky and
 * exit early — otherwise the O(n²) answer would sometimes look fast and the
 * demo would teach the wrong thing.
 */
function makeCase(n: number, seed: number, hasPair: boolean) {
  const rand = mulberry32(seed);
  // Even values only, so no accidental pair can sum to an odd target.
  const values = Array.from({ length: n }, () => 2 * (1 + Math.floor(rand() * 400_000)));

  let target: number;
  if (hasPair) {
    const i = n - 2;
    const j = n - 1;
    values[j] = values[j]! + 1; // make exactly one value odd
    target = values[i]! + values[j]!; // odd, so only this pair can reach it
  } else {
    target = 1; // odd and far below any possible sum
  }

  return {
    stdin: `${n} ${target}\n${values.join(' ')}\n`,
    expectedStdout: hasPair ? 'YES' : 'NO',
  };
}

interface DemoCase {
  ordinal: number;
  isSample: boolean;
  stdin: string;
  expectedStdout: string;
}

/**
 * Two visible cases and one large hidden one.
 *
 * n = 30000 is chosen so the naive answer takes roughly a second in JavaScript
 * while the hash-set answer stays in the tens of milliseconds — a gap wide
 * enough to be unmistakable, and small enough that the naive answer still
 * finishes inside the CPU limit.
 */
// Ordinals are 0-based, matching the seeded problems: the results panel renders
// `ordinal + 1`, so 1-based ordinals here would label the first case "Case 2".
export const DEMO_CASES: DemoCase[] = [
  { ordinal: 0, isSample: true, ...makeCase(8, 1001, true) },
  { ordinal: 1, isSample: true, ...makeCase(8, 2002, false) },
  { ordinal: 2, isSample: false, ...makeCase(30_000, 3003, true) },
];

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

const STARTER: Partial<Record<Language, string>> = {
  JAVASCRIPT: `const data = require('fs').readFileSync(0, 'utf8').split(/\\s+/);
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
`,
  PYTHON: `import sys

data = sys.stdin.read().split()
n = int(data[0])
target = int(data[1])
values = list(map(int, data[2:2 + n]))

# Correct, and far too slow for the hidden case. Try again.
found = False
for i in range(n):
    for j in range(i + 1, n):
        if values[i] + values[j] == target:
            found = True
            break
    if found:
        break

print("YES" if found else "NO")
`,
};

/**
 * Best known runtimes, in milliseconds, per language.
 *
 * JavaScript is measured, not guessed: the hash-set solution runs this problem
 * in 110-120 ms through this project's own judge (three runs, Docker 29.7.2),
 * so 110 is the reference and the gate lands at 189 ms. The quadratic answer
 * comes in around 540 ms and is refused, which is the whole point.
 *
 * The rest are estimates scaled from that measurement and have NOT been run.
 * A materially different judge host wants all of them re-measured: an
 * over-generous reference makes the demo trivially passable, a mean one makes
 * it unwinnable.
 */
const DEMO_REFERENCE: RuntimeMap = {
  JAVASCRIPT: 110,
  TYPESCRIPT: 110,
  PYTHON: 130,
  JAVA: 260,
  CPP: 40,
  GO: 60,
};

export const DEMO_PROBLEM = {
  id: 'demo-pair-sum',
  slug: 'pair-sum',
  title: 'Pair Sum',
  difficulty: 'EASY' as const,
  promptMarkdown: PROMPT,
  tags: ['array', 'hash-map'],
  starterCode: STARTER,
  avgSolveSeconds: 300,
  cpuTimeLimit: 6,
  memoryLimitKb: 256_000,
};

/** What the browser is allowed to see: samples only, never the hidden case. */
export function demoPublicView(): PublicProblem {
  return {
    id: DEMO_PROBLEM.id,
    slug: DEMO_PROBLEM.slug,
    title: DEMO_PROBLEM.title,
    difficulty: DEMO_PROBLEM.difficulty,
    promptMarkdown: DEMO_PROBLEM.promptMarkdown,
    tags: DEMO_PROBLEM.tags,
    starterCode: DEMO_PROBLEM.starterCode,
    sampleCases: DEMO_CASES.filter((c) => c.isSample).map((c) => ({
      ordinal: c.ordinal,
      stdin: c.stdin,
      expectedStdout: c.expectedStdout,
    })),
    avgSolveSeconds: DEMO_PROBLEM.avgSolveSeconds,
  };
}

/**
 * Run a demo submission.
 *
 * Mirrors the real grading pipeline closely enough that the verdict means
 * something — same sandbox, same timing method, same gate arithmetic — while
 * omitting everything that touches a user: no submission row, no progress, no
 * session, no token.
 */
export async function gradeDemo(params: {
  language: Language;
  sourceCode: string;
}): Promise<DemoGradeResult> {
  const { language, sourceCode } = params;

  const batch = await runBatch({
    language,
    sourceCode,
    cases: DEMO_CASES.map((c) => ({ stdin: c.stdin, expectedOutput: c.expectedStdout })),
    cpuTimeLimit: DEMO_PROBLEM.cpuTimeLimit,
    memoryLimitKb: DEMO_PROBLEM.memoryLimitKb,
  });

  const cases = batch.results.map((result, index) => ({
    ordinal: DEMO_CASES[index]!.ordinal,
    isSample: DEMO_CASES[index]!.isSample,
    passed: result.passed,
    status: result.statusDescription,
    timeMs: result.timeMs,
  }));

  const passedCount = cases.filter((c) => c.passed).length;
  const allPassed = passedCount === cases.length;

  // Only a compile error or stderr from a failing case is reported. Echoing the
  // hidden case's stdout would hand over the answer.
  const firstFailure = batch.results.find((r) => !r.passed);
  const message = firstFailure?.compileOutput?.trim() || firstFailure?.stderr?.trim() || null;

  if (!allPassed) {
    return {
      demo: true,
      status: firstFailure ? statusFor(firstFailure.statusId) : 'WRONG_ANSWER',
      passedCount,
      totalCount: cases.length,
      runtimeMs: null,
      message,
      cases,
      correct: false,
      performance: null,
      accepted: false,
    };
  }

  // Worst case across the suite, exactly as the real gate does it: a solution is
  // only as fast as its slowest input.
  const runtimeMs = worstCaseRuntime(batch.results.map((r) => r.timeMs));
  const performance = evaluatePerformance({
    runtimeMs,
    reference: DEMO_REFERENCE,
    // No accumulated record for the demo: the reference is the whole budget.
    best: {},
    language,
  });

  logger.debug({ language, runtimeMs, passed: performance.passed }, 'demo graded');

  return {
    demo: true,
    status: performance.passed ? 'ACCEPTED' : 'ACCEPTED_TOO_SLOW',
    passedCount,
    totalCount: cases.length,
    runtimeMs,
    message: null,
    cases,
    correct: true,
    performance,
    accepted: performance.passed,
  };
}

function statusFor(statusId: number): DemoGradeResult['status'] {
  switch (statusId) {
    case JUDGE0_STATUS.TIME_LIMIT_EXCEEDED:
      return 'TIME_LIMIT_EXCEEDED';
    case JUDGE0_STATUS.COMPILATION_ERROR:
      return 'COMPILE_ERROR';
    case JUDGE0_STATUS.WRONG_ANSWER:
      return 'WRONG_ANSWER';
    default:
      // Judge0 numbers every runtime error (SIGSEGV, SIGABRT, NZEC and the
      // rest) above the compilation error, so anything past it is a crash
      // rather than a wrong answer.
      return statusId > JUDGE0_STATUS.COMPILATION_ERROR ? 'RUNTIME_ERROR' : 'WRONG_ANSWER';
  }
}
