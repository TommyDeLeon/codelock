import { describe, expect, it, beforeEach, vi } from 'vitest';

/**
 * The editorial must be unreachable until the lock is over, and reachable the
 * moment it is — however it ended.
 *
 * Both halves matter. The first is the obvious one: handing over a worked
 * solution while the user is still locked would make the judge decorative. The
 * second is the one this product exists for. A user who failed and leaves with
 * nothing has spent an evening being told they are not good enough, which for
 * someone learning to code is the outcome that makes them stop.
 */

const { findSession, findProblem, findSamples } = vi.hoisted(() => ({
  findSession: vi.fn(),
  findProblem: vi.fn(),
  findSamples: vi.fn(),
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    lockSession: { findUnique: (...a: unknown[]) => findSession(...a) },
    problem: { findUnique: (...a: unknown[]) => findProblem(...a) },
    testCase: { findMany: (...a: unknown[]) => findSamples(...a) },
  },
}));

vi.mock('../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getDebrief, toPublicProblem } from './lockSessions.js';

const USER = '11111111-1111-1111-1111-111111111111';
const SESSION = '22222222-2222-2222-2222-222222222222';
const PROBLEM = '33333333-3333-3333-3333-333333333333';

const EDITORIAL = 'Use a hash map to remember what you have already seen.';
const SOLUTION = { JAVASCRIPT: 'function solve(a) { return a.length; }' };

const problemRow = () => ({
  id: PROBLEM,
  slug: 'two-sum',
  title: 'Two Sum',
  difficulty: 'EASY',
  promptMarkdown: 'Find two numbers that add to the target.',
  tags: ['array'],
  starterCode: { JAVASCRIPT: 'function solve(a, b) {}' },
  avgSolveSeconds: 600,
  patternFamily: 'ARRAYS_HASHING',
  patternTags: ['hash-map'],
  editorialMarkdown: EDITORIAL,
  editorialUrl: 'https://example.invalid/editorial',
  referenceSolution: SOLUTION,
});

const sessionRow = (state: string) => ({
  id: SESSION,
  userId: USER,
  state,
  problemId: PROBLEM,
});

beforeEach(() => {
  vi.clearAllMocks();
  findProblem.mockResolvedValue(problemRow());
  findSamples.mockResolvedValue([]);
});

describe('before the lock resolves', () => {
  it.each(['ARMED', 'LOCKED'])('refuses the debrief while %s', async (state) => {
    findSession.mockResolvedValue(sessionRow(state));
    await expect(getDebrief(USER, SESSION)).rejects.toThrowError(/once the lock is resolved/);
  });

  it('never reads the problem row at all while the session is live', async () => {
    // The check happens before the load, so there is no window in which the
    // editorial sits in memory next to a response being built.
    findSession.mockResolvedValue(sessionRow('LOCKED'));
    await expect(getDebrief(USER, SESSION)).rejects.toThrow();
    expect(findProblem).not.toHaveBeenCalled();
  });
});

describe('the problem as the client sees it during a lock', () => {
  it('carries no editorial, no reference solution, and no pattern name', async () => {
    // The structural half of the guarantee: `toPublicProblem` is what every
    // pre-resolution route returns, and it cannot leak what it never copies.
    // `getDebrief` is the only other path to these fields.
    const publicProblem = (await toPublicProblem(problemRow() as never)) as unknown as Record<
      string,
      unknown
    >;

    expect(publicProblem).not.toHaveProperty('editorialMarkdown');
    expect(publicProblem).not.toHaveProperty('editorialUrl');
    expect(publicProblem).not.toHaveProperty('referenceSolution');
    expect(publicProblem).not.toHaveProperty('patternFamily');

    // And nothing smuggled it through under another name.
    expect(JSON.stringify(publicProblem)).not.toContain(EDITORIAL);
    expect(JSON.stringify(publicProblem)).not.toContain(SOLUTION.JAVASCRIPT);
  });

  it('still carries what the user needs to actually solve it', async () => {
    const publicProblem = await toPublicProblem(problemRow() as never);
    expect(publicProblem.promptMarkdown).toBeTruthy();
    expect(publicProblem.starterCode).toBeTruthy();
  });
});

describe('after the lock resolves', () => {
  it.each(['UNLOCKED', 'BYPASSED', 'ABANDONED'])(
    'gives a %s user the pattern, the editorial and a solution',
    async (state) => {
      findSession.mockResolvedValue(sessionRow(state));
      const debrief = await getDebrief(USER, SESSION);

      expect(debrief.patternFamily).toBe('ARRAYS_HASHING');
      expect(debrief.patternTags).toEqual(['hash-map']);
      expect(debrief.editorialMarkdown).toBe(EDITORIAL);
      expect(debrief.referenceSolution).toEqual(SOLUTION);
      expect(debrief.outcome).toBe(state);
    },
  );

  it('does not reward only the users who succeeded', async () => {
    // Easy to get wrong, and expensive: someone who gave up needs the
    // explanation more than someone who did not.
    findSession.mockResolvedValue(sessionRow('BYPASSED'));
    const bypassed = await getDebrief(USER, SESSION);

    findSession.mockResolvedValue(sessionRow('UNLOCKED'));
    const solved = await getDebrief(USER, SESSION);

    expect(bypassed.editorialMarkdown).toBe(solved.editorialMarkdown);
    expect(bypassed.referenceSolution).toEqual(solved.referenceSolution);
  });
});

describe('ownership', () => {
  it('will not hand over a debrief belonging to someone else', async () => {
    findSession.mockResolvedValue({ ...sessionRow('UNLOCKED'), userId: 'someone-else' });
    await expect(getDebrief(USER, SESSION)).rejects.toThrowError(/not found/i);
  });

  it('reports a missing session and a stranger session identically', async () => {
    // So ids cannot be probed. Matches requireOwnedSession's existing contract.
    findSession.mockResolvedValue(null);
    const missing = await getDebrief(USER, SESSION).catch((e: Error) => e.message);

    findSession.mockResolvedValue({ ...sessionRow('UNLOCKED'), userId: 'someone-else' });
    const stranger = await getDebrief(USER, SESSION).catch((e: Error) => e.message);

    expect(missing).toBe(stranger);
  });
});
