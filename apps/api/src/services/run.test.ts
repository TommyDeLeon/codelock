import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * Running code must stay cheap.
 *
 * The whole point of this service is what it does *not* do: no submission row,
 * no attempt against the session, no ladder movement, no unlock. Those are
 * asserted here against the real calls, because "it does not write" is exactly
 * the kind of property a later refactor breaks silently — grading and running
 * share a judge, and it is tempting to share more.
 *
 * The other property is privacy: a run reports stdout verbatim, so it must
 * never touch a hidden case. Verbatim output for a hidden input is that case's
 * answer, one run at a time.
 */

const { runBatch, findUnique, requireOwnedSession, prismaMock } = vi.hoisted(() => {
  const findUnique = vi.fn();
  return {
    runBatch: vi.fn(),
    findUnique,
    requireOwnedSession: vi.fn(),
    prismaMock: {
      problem: { findUnique },
      // Present but never expected to be called. A run that reaches either of
      // these has stopped being free, and the assertions below say so.
      submission: { create: vi.fn(), update: vi.fn() },
      lockSession: { update: vi.fn() },
    },
  };
});

vi.mock('./judge0.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./judge0.js')>();
  return { ...actual, runBatch: (...args: unknown[]) => runBatch(...args) };
});

vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }));

vi.mock('./lockSessions.js', () => ({
  requireOwnedSession: (...args: unknown[]) => requireOwnedSession(...args),
}));

vi.mock('../lib/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { runCode } from './run.js';

/** A problem with samples only. Hidden cases are never selected for. */
function problemReturns(
  samples: Array<{ ordinal: number; stdin: string; expectedStdout: string }>,
) {
  findUnique.mockResolvedValue({
    id: 'problem-1',
    isActive: true,
    driverCode: { PYTHON: '{{SOLUTION}}' },
    cpuTimeLimit: 2,
    memoryLimitKb: 128_000,
    testCases: samples.map((s) => ({ ...s, isSample: true })),
  });
}

interface FakeResult {
  passed?: boolean;
  stdout?: string | null;
  stderr?: string | null;
  statusId?: number;
  statusDescription?: string;
  compileOutput?: string | null;
}

function judgeReturns(results: FakeResult[]) {
  runBatch.mockResolvedValue({
    token: results.map((_, i) => `tok-${i}`),
    results: results.map((r) => ({
      passed: r.passed ?? true,
      statusId: r.statusId ?? 3,
      statusDescription: r.statusDescription ?? 'Accepted',
      stdout: r.stdout ?? null,
      stderr: r.stderr ?? null,
      compileOutput: r.compileOutput ?? null,
      timeMs: 4,
      memoryKb: 12_000,
    })),
  });
}

const BASE = {
  userId: 'user-1',
  problemId: 'problem-1',
  language: 'PYTHON' as const,
  sourceCode: 'print(9)',
};

beforeEach(() => {
  vi.clearAllMocks();
  requireOwnedSession.mockResolvedValue({
    id: 'session-1',
    state: 'LOCKED',
    problemId: 'problem-1',
  });
});

describe('running does not cost an attempt', () => {
  it('writes no submission and does not touch the session counter', async () => {
    problemReturns([{ ordinal: 0, stdin: '3\n', expectedStdout: '9\n' }]);
    judgeReturns([{ stdout: '9\n' }]);

    await runCode({ ...BASE, lockSessionId: 'session-1' });

    expect(prismaMock.submission.create).not.toHaveBeenCalled();
    expect(prismaMock.submission.update).not.toHaveBeenCalled();
    // The one that matters most: `attempts: { increment: 1 }` lives on this
    // call in grading, and its absence here is the feature.
    expect(prismaMock.lockSession.update).not.toHaveBeenCalled();
  });

  it('cannot return an unlock token, because the shape has no room for one', async () => {
    problemReturns([{ ordinal: 0, stdin: '3\n', expectedStdout: '9\n' }]);
    judgeReturns([{ stdout: '9\n', passed: true }]);

    const result = await runCode({ ...BASE, lockSessionId: 'session-1' });

    // Not `toBeUndefined`: the key must not exist, because JSON.stringify
    // would ship `"unlockToken": null` and that is still a claim about what
    // this endpoint can do.
    expect(Object.keys(result)).not.toContain('unlockToken');
    expect(Object.keys(result)).not.toContain('accepted');
    expect(JSON.stringify(result)).not.toContain('unlockToken');
  });
});

describe('what a run is allowed to see', () => {
  it('runs the samples and shows both sides', async () => {
    problemReturns([
      { ordinal: 0, stdin: '3\n', expectedStdout: '9\n' },
      { ordinal: 1, stdin: '4\n', expectedStdout: '16\n' },
    ]);
    judgeReturns([{ stdout: '9\n' }, { stdout: '15\n', passed: false }]);

    const result = await runCode(BASE);

    expect(result.cases).toHaveLength(2);
    expect(result.cases[0]).toMatchObject({
      ordinal: 0,
      stdout: '9\n',
      expectedStdout: '9\n',
      matched: true,
    });
    expect(result.cases[1]).toMatchObject({ ordinal: 1, stdout: '15\n', matched: false });
  });

  /**
   * The privacy rule, enforced at the query rather than in the response: the
   * hidden cases are never loaded, so there is nothing to leak by accident
   * later. Filtering after the fact would put them in memory next to a
   * serialiser.
   */
  it('never asks the database for hidden cases', async () => {
    problemReturns([{ ordinal: 0, stdin: '3\n', expectedStdout: '9\n' }]);
    judgeReturns([{ stdout: '9\n' }]);

    await runCode(BASE);

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { testCases: expect.objectContaining({ where: { isSample: true } }) },
      }),
    );
  });

  it('runs typed input once, and offers no verdict on it', async () => {
    problemReturns([{ ordinal: 0, stdin: '3\n', expectedStdout: '9\n' }]);
    judgeReturns([{ stdout: '49\n' }]);

    const result = await runCode({ ...BASE, stdin: '7\n' });

    expect(runBatch).toHaveBeenCalledWith(
      expect.objectContaining({ cases: [{ stdin: '7\n', expectedOutput: '' }] }),
    );
    expect(result.cases).toHaveLength(1);
    // Nothing to be right about, so the panel is told to stay quiet rather
    // than invent a pass or a fail.
    expect(result.cases[0]).toMatchObject({ ordinal: null, expectedStdout: null, matched: null });
  });

  /** Empty input is a question, not a missing field. */
  it('treats empty typed input as input, not as "use the samples"', async () => {
    problemReturns([{ ordinal: 0, stdin: '3\n', expectedStdout: '9\n' }]);
    judgeReturns([{ stdout: '' }]);

    await runCode({ ...BASE, stdin: '' });

    expect(runBatch).toHaveBeenCalledWith(
      expect.objectContaining({ cases: [{ stdin: '', expectedOutput: '' }] }),
    );
  });
});

describe('errors reach the reader', () => {
  it('reports a traceback on the case that produced it', async () => {
    problemReturns([{ ordinal: 0, stdin: '3\n', expectedStdout: '9\n' }]);
    judgeReturns([
      {
        passed: false,
        stdout: null,
        stderr: 'Traceback (most recent call last):\nNameError: name "x" is not defined',
        statusId: 11,
        statusDescription: 'Runtime Error (NZEC)',
      },
    ]);

    const result = await runCode(BASE);

    expect(result.cases[0]?.stderr).toContain('NameError');
    expect(result.cases[0]?.status).toBe('Runtime Error (NZEC)');
  });

  it('lifts a compile error out of the cases, where it is said once', async () => {
    problemReturns([
      { ordinal: 0, stdin: '3\n', expectedStdout: '9\n' },
      { ordinal: 1, stdin: '4\n', expectedStdout: '16\n' },
    ]);
    judgeReturns([
      {
        passed: false,
        statusId: 6,
        statusDescription: 'Compilation Error',
        compileOutput: 'line 1: syntax error',
      },
      {
        passed: false,
        statusId: 6,
        statusDescription: 'Compilation Error',
        compileOutput: 'line 1: syntax error',
      },
    ]);

    const result = await runCode(BASE);

    expect(result.compileError).toBe('line 1: syntax error');
  });
});

describe('a run is still bound to its session', () => {
  it('refuses a problem the lock did not assign', async () => {
    problemReturns([{ ordinal: 0, stdin: '3\n', expectedStdout: '9\n' }]);
    requireOwnedSession.mockResolvedValue({
      id: 'session-1',
      state: 'LOCKED',
      problemId: 'a-different-problem',
    });

    await expect(runCode({ ...BASE, lockSessionId: 'session-1' })).rejects.toThrow(
      /not the problem assigned/i,
    );
    expect(runBatch).not.toHaveBeenCalled();
  });

  it('refuses a session that is not locked', async () => {
    problemReturns([{ ordinal: 0, stdin: '3\n', expectedStdout: '9\n' }]);
    requireOwnedSession.mockResolvedValue({
      id: 'session-1',
      state: 'ARMED',
      problemId: 'problem-1',
    });

    await expect(runCode({ ...BASE, lockSessionId: 'session-1' })).rejects.toThrow(/not locked/i);
    expect(runBatch).not.toHaveBeenCalled();
  });

  it('runs happily with no session at all, for practice outside a lock', async () => {
    problemReturns([{ ordinal: 0, stdin: '3\n', expectedStdout: '9\n' }]);
    judgeReturns([{ stdout: '9\n' }]);

    await expect(runCode(BASE)).resolves.toMatchObject({ ran: true });
    expect(requireOwnedSession).not.toHaveBeenCalled();
  });
});
