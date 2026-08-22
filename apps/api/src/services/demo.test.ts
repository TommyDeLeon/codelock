import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * The demo's one non-negotiable property: **it can never unlock anything.**
 *
 * The type system already refuses to carry a token, but a type is erased at
 * runtime and this endpoint is public, so the guarantee is asserted against the
 * actual object that would be serialised to a stranger's browser.
 *
 * The rest of the file checks that the demo is still a fair test — that the
 * hidden case is genuinely hidden, and that a correct-but-slow answer is
 * rejected rather than waved through.
 */

const { runBatch } = vi.hoisted(() => ({ runBatch: vi.fn() }));

vi.mock('./judge0.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge0.js')>();
  return { ...actual, runBatch: (...args: unknown[]) => runBatch(...args) };
});

vi.mock('../lib/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { DEMO_CASES, demoPublicView, gradeDemo } from './demo.js';

/** A judge result for every case, at a chosen per-case runtime. */
function judgeReturns(opts: { passed: boolean[]; timeMs: number[]; statusId?: number }) {
  runBatch.mockResolvedValue({
    token: opts.passed.map((_, i) => `tok-${i}`),
    results: opts.passed.map((passed, i) => ({
      passed,
      statusId: passed ? 3 : (opts.statusId ?? 4),
      statusDescription: passed ? 'Accepted' : 'Wrong Answer',
      timeMs: opts.timeMs[i] ?? 0,
      memoryKb: 12_000,
      stderr: null,
      compileOutput: null,
    })),
  });
}

beforeEach(() => runBatch.mockReset());

describe('the demo cannot unlock anything', () => {
  it('returns no token field, even on a perfect submission', async () => {
    judgeReturns({ passed: [true, true, true], timeMs: [2, 2, 60] });

    const result = await gradeDemo({ language: 'JAVASCRIPT', sourceCode: 'x' });

    expect(result.accepted).toBe(true);
    // Not `toBeUndefined` — the key must not exist at all, because
    // JSON.stringify would happily ship `"unlockToken": null`, and that is
    // still a lie about what this endpoint does.
    expect(Object.keys(result)).not.toContain('unlockToken');
    expect(Object.keys(result)).not.toContain('progress');
    expect(Object.keys(result)).not.toContain('sessionId');

    // The serialised body is what actually reaches a browser.
    const wire = JSON.stringify(result);
    expect(wire).not.toMatch(/token/i);
    expect(wire).not.toMatch(/unlock/i);
  });

  it('is marked as a demo so a client can never mistake it for a real verdict', async () => {
    judgeReturns({ passed: [true, true, true], timeMs: [2, 2, 60] });
    const result = await gradeDemo({ language: 'JAVASCRIPT', sourceCode: 'x' });
    expect(result.demo).toBe(true);
  });
});

describe('the speed gate still applies', () => {
  it('rejects a correct answer that misses the budget', async () => {
    // Every case passes, but the hidden one takes a second — the exact shape of
    // a nested-loop solution, and the entire point of the demo.
    judgeReturns({ passed: [true, true, true], timeMs: [2, 2, 1000] });

    const result = await gradeDemo({ language: 'JAVASCRIPT', sourceCode: 'x' });

    expect(result.passedCount).toBe(3);
    expect(result.status).toBe('ACCEPTED_TOO_SLOW');
    expect(result.accepted).toBe(false);
    expect(result.performance?.passed).toBe(false);
    expect(result.performance?.reason).toMatch(/slower than the best known solution/);
  });

  it('accepts a correct answer inside the budget', async () => {
    judgeReturns({ passed: [true, true, true], timeMs: [2, 2, 70] });

    const result = await gradeDemo({ language: 'JAVASCRIPT', sourceCode: 'x' });

    expect(result.status).toBe('ACCEPTED');
    expect(result.accepted).toBe(true);
    expect(result.performance?.passed).toBe(true);
  });

  it('times against the worst case, not the average', async () => {
    // A solution is only as fast as its slowest input. Averaging would let a
    // quadratic answer hide behind two trivial samples.
    judgeReturns({ passed: [true, true, true], timeMs: [1, 1, 900] });
    const result = await gradeDemo({ language: 'JAVASCRIPT', sourceCode: 'x' });
    expect(result.runtimeMs).toBe(900);
  });

  it('reports no performance verdict when the answer is wrong', async () => {
    judgeReturns({ passed: [true, false, false], timeMs: [2, 2, 5] });

    const result = await gradeDemo({ language: 'JAVASCRIPT', sourceCode: 'x' });

    expect(result.accepted).toBe(false);
    expect(result.performance).toBeNull();
    // Timing a wrong answer would invite gaming the gate with a fast stub.
    expect(result.runtimeMs).toBeNull();
  });
});

describe('the hidden case stays hidden', () => {
  it('numbers cases from zero, as the seeded problems do', () => {
    // The UI renders `ordinal + 1`; 1-based ordinals here would label the
    // first case 'Case 2'.
    expect(DEMO_CASES.map((c) => c.ordinal)).toEqual([0, 1, 2]);
  });

  it('exposes only the sample cases to the browser', () => {
    const view = demoPublicView();
    expect(view.sampleCases).toHaveLength(2);
    expect(view.sampleCases.every((c) => c.ordinal <= 1)).toBe(true);
  });

  it('never ships the large case in the public view', () => {
    const hidden = DEMO_CASES.find((c) => !c.isSample)!;
    const serialised = JSON.stringify(demoPublicView());
    expect(serialised).not.toContain(hidden.stdin.slice(0, 80));
  });

  it('grades against more cases than it reveals', () => {
    expect(DEMO_CASES.length).toBeGreaterThan(demoPublicView().sampleCases.length);
  });
});

describe('the test data is deterministic', () => {
  it('plants the pair at the end so a naive scan cannot exit early', () => {
    const hidden = DEMO_CASES.find((c) => !c.isSample)!;
    const [header, body] = hidden.stdin.trim().split('\n');
    const [n, target] = header!.split(' ').map(Number);
    const values = body!.split(' ').map(Number);

    expect(values).toHaveLength(n!);
    expect(hidden.expectedStdout).toBe('YES');
    // The answer is the final pair, so the O(n²) scan runs to completion.
    expect(values[n! - 2]! + values[n! - 1]!).toBe(target);
  });

  it('makes the negative sample genuinely unsolvable', () => {
    const negative = DEMO_CASES.find((c) => c.expectedStdout === 'NO')!;
    const [header, body] = negative.stdin.trim().split('\n');
    const target = Number(header!.split(' ')[1]);
    const values = body!.split(' ').map(Number);

    const pairs = values.flatMap((a, i) => values.slice(i + 1).map((b) => a + b));
    expect(pairs).not.toContain(target);
  });
});
