import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * Reading a session back.
 *
 * Two things are being tested, and only one of them is the feature. The other
 * is the rule that makes the feature safe to have: a review is readable from
 * outside the lock screen, so a review of a session that is *still running*
 * must not carry anything that helps end it. The editorial names the pattern,
 * and each hint is a third of the answer.
 *
 * The detail allowlist gets its own tests because it is the part that rots
 * quietly: `detail` is untyped JSON written from several places, and the
 * failure mode is a future field publishing itself the moment someone records
 * it.
 */

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    lockSession: { findUnique: vi.fn(), findMany: vi.fn() },
    learningEvent: { findMany: vi.fn() },
    problem: { findUnique: vi.fn() },
  },
}));

vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../lib/logger.js', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { renderSessionReview, sessionReview, sessionsIndex } from './learningLog.js';

const ARMED_AT = new Date('2026-09-08T20:00:00Z');
const LOCKED_AT = new Date('2026-09-08T20:30:00Z');
const RESOLVED_AT = new Date('2026-09-08T20:52:00Z');

/** The editorial is the thing a live session must never hand over. */
const EDITORIAL = 'Use a sliding window and keep the last index of each character.';

function sessionIs(state: string, overrides: Record<string, unknown> = {}) {
  prismaMock.lockSession.findUnique.mockResolvedValue({
    id: 'session-1',
    userId: 'user-1',
    state,
    difficulty: 'EASY',
    armedAt: ARMED_AT,
    lockedAt: LOCKED_AT,
    resolvedAt: state === 'LOCKED' || state === 'ARMED' ? null : RESOLVED_AT,
    attempts: 2,
    escapeReason: null,
    problemId: 'problem-1',
    ...overrides,
  });
  prismaMock.problem.findUnique.mockResolvedValue({
    slug: 'longest-unique-substring',
    title: 'Longest Unique Substring',
    difficulty: 'EASY',
    tier: 'TIER_1',
    patternFamily: 'SLIDING_WINDOW',
    patternTags: ['sliding-window'],
    editorialMarkdown: EDITORIAL,
  });
}

function eventsAre(events: Array<Record<string, unknown>>) {
  prismaMock.learningEvent.findMany.mockResolvedValue(
    events.map((e) => ({
      at: ARMED_AT,
      kind: 'ATTEMPT_FAILED',
      attempt: 1,
      language: 'PYTHON',
      elapsedSeconds: 90,
      sourceCode: null,
      detail: null,
      ...e,
    })),
  );
}

beforeEach(() => vi.clearAllMocks());

describe('a session that is still running gives nothing away', () => {
  it('withholds the editorial while the lock is up', async () => {
    sessionIs('LOCKED');
    eventsAre([]);

    const review = await sessionReview('user-1', 'session-1');

    expect(review?.resolved).toBe(false);
    expect(review?.editorial).toBeNull();
    // The serialised body is what actually reaches the client, so assert on
    // that rather than on the field alone.
    expect(JSON.stringify(review)).not.toContain('sliding window');
    expect(review?.withheld.join(' ')).toMatch(/editorial is hidden/i);
  });

  it('withholds it while the timer is merely armed, too', async () => {
    sessionIs('ARMED', { lockedAt: null });
    eventsAre([]);

    const review = await sessionReview('user-1', 'session-1');

    expect(review?.editorial).toBeNull();
  });

  it('releases the editorial once the session has ended', async () => {
    sessionIs('UNLOCKED');
    eventsAre([]);

    const review = await sessionReview('user-1', 'session-1');

    expect(review?.resolved).toBe(true);
    expect(review?.editorial).toBe(EDITORIAL);
    // Nothing is being withheld any more, so nothing is claimed to be.
    expect(review?.withheld).toEqual([]);
  });

  it('says nothing at all about a session that is not yours', async () => {
    sessionIs('UNLOCKED', { userId: 'someone-else' });

    expect(await sessionReview('user-1', 'session-1')).toBeNull();
    // Same answer as a session that does not exist: a different one would be an
    // existence oracle.
    prismaMock.lockSession.findUnique.mockResolvedValue(null);
    expect(await sessionReview('user-1', 'session-1')).toBeNull();
  });
});

describe('the detail allowlist', () => {
  it('never reprints the text of a hint, only which one was spent', async () => {
    sessionIs('LOCKED');
    eventsAre([
      {
        kind: 'HINT_REVEALED',
        // A caller that records the text anyway must not cause it to be shown.
        detail: { index: 1, text: 'Track the window start', attempts: 2 },
      },
    ]);

    const review = await sessionReview('user-1', 'session-1');

    expect(review?.steps[0]).toMatchObject({ hintIndex: 1 });
    expect(JSON.stringify(review)).not.toContain('Track the window start');
  });

  it('drops any field it was not told to publish', async () => {
    sessionIs('UNLOCKED');
    eventsAre([
      {
        kind: 'ATTEMPT_FAILED',
        detail: {
          status: 'WRONG_ANSWER',
          passedCount: 3,
          totalCount: 5,
          hiddenFailures: 2,
          // Exactly the shape of a future addition nobody reviewed.
          hiddenExpectedOutputs: ['aabbc', 'xyz'],
        },
      },
    ]);

    const review = await sessionReview('user-1', 'session-1');

    expect(review?.steps[0]).toMatchObject({ verdict: 'WRONG_ANSWER', hiddenFailures: 2 });
    expect(JSON.stringify(review)).not.toContain('hiddenExpectedOutputs');
    expect(JSON.stringify(review)).not.toContain('aabbc');
  });

  /**
   * Sample cases are the exception, and deliberately so: their expected output
   * is printed in the problem statement, so withholding it here would protect
   * nothing and remove the only part of a failure worth reading.
   */
  it('keeps failed sample cases, which were already public', async () => {
    sessionIs('LOCKED');
    eventsAre([
      {
        kind: 'ATTEMPT_FAILED',
        detail: {
          status: 'WRONG_ANSWER',
          failedSamples: [{ ordinal: 0, stdin: 'abcabc', expected: '3', actual: '6' }],
        },
      },
    ]);

    const review = await sessionReview('user-1', 'session-1');

    expect(review?.steps[0]).toMatchObject({
      failedSamples: [{ ordinal: 0, stdin: 'abcabc', expected: '3', actual: '6' }],
    });
  });

  it('always returns the learner their own code, lock up or not', async () => {
    sessionIs('LOCKED');
    eventsAre([{ kind: 'ATTEMPT_FAILED', sourceCode: 'def solve(s): return len(s)' }]);

    const review = await sessionReview('user-1', 'session-1');

    expect(review?.steps[0]?.sourceCode).toBe('def solve(s): return len(s)');
  });
});

describe('sessions with nothing recorded', () => {
  it('marks a session that predates the session id as partial', async () => {
    sessionIs('ABANDONED');
    eventsAre([]);

    const review = await sessionReview('user-1', 'session-1');

    expect(review?.partial).toBe(true);
    expect(review?.session.attempts).toBe(2);
  });

  it('says so in the prose rather than rendering a blank evening', async () => {
    sessionIs('ABANDONED');
    eventsAre([]);

    const text = renderSessionReview((await sessionReview('user-1', 'session-1'))!);

    expect(text).toMatch(/No step-by-step record/i);
    expect(text).toContain('ABANDONED');
  });
});

describe('the prose rendering', () => {
  it('reports the outcome, the problem and how long the lock held', async () => {
    sessionIs('UNLOCKED');
    eventsAre([
      { kind: 'ATTEMPT_PASSED', detail: { runtimeMs: 40, gateMs: 90 }, sourceCode: 'print(1)' },
    ]);

    const text = renderSessionReview((await sessionReview('user-1', 'session-1'))!);

    expect(text).toContain('Longest Unique Substring');
    expect(text).toContain('Locked for: 22 min');
    expect(text).toContain('print(1)');
    expect(text).toContain(EDITORIAL);
  });

  it('prints the withholding note instead of the editorial while locked', async () => {
    sessionIs('LOCKED');
    eventsAre([{ kind: 'ATTEMPT_FAILED' }]);

    const text = renderSessionReview((await sessionReview('user-1', 'session-1'))!);

    expect(text).not.toContain(EDITORIAL);
    expect(text).toMatch(/editorial is hidden/i);
  });
});

describe('the list of sessions', () => {
  it('carries the problem title but never its statement or editorial', async () => {
    prismaMock.lockSession.findMany.mockResolvedValue([
      {
        id: 'session-1',
        state: 'LOCKED',
        difficulty: 'EASY',
        armedAt: ARMED_AT,
        lockedAt: LOCKED_AT,
        resolvedAt: null,
        attempts: 1,
        escapeReason: null,
        problem: { slug: 'longest-unique-substring', title: 'Longest Unique Substring' },
      },
    ]);

    const sessions = await sessionsIndex('user-1');

    expect(sessions[0]).toMatchObject({ problemTitle: 'Longest Unique Substring', attempts: 1 });
    // The select is the guard: nothing solution-bearing is even loaded.
    expect(prismaMock.lockSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          problem: { select: { slug: true, title: true } },
        }),
      }),
    );
  });
});
