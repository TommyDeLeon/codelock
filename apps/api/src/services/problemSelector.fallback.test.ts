import { describe, expect, it, beforeEach, vi } from 'vitest';

/**
 * A user must never be unable to unlock.
 *
 * Every fallback in `pickProblem` exists for that one sentence. These tests
 * cover the order they fire in, because each was added after a way of failing
 * was found — and the last one was found by asking whether the problems were
 * actually reachable in the app, which they were not.
 */

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    submission: { findMany: vi.fn().mockResolvedValue([]) },
    problem: { findMany: (...a: unknown[]) => findMany(...a) },
  },
}));

vi.mock('../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../env.js', () => ({ env: { DIFFICULTY_MODE: 'rules', OPENAI_API_KEY: '' } }));

import { pickProblem } from './problemSelector.js';

const problem = (slug: string, difficulty: string, tier: string) => ({
  id: slug,
  slug,
  difficulty,
  tier,
  isActive: true,
  valueScore: 0.6,
  popularity: 0,
});

/**
 * Answer each successive fallback rung with the next scripted result.
 *
 * Each rung costs two queries, not one: `sampleCandidates` selects ids first,
 * then fetches only the sampled rows. Scripting those as two separate results
 * would make every test encode that implementation detail, so this models a
 * *rung* instead — the id query reports what the rung holds, and the row query
 * consumes it.
 *
 * A rung holding nothing is consumed at the id query, because
 * `sampleCandidates` short-circuits and never issues the second one.
 */
function scriptQueries(...results: unknown[][]): void {
  findMany.mockReset();
  const queue = results.map((r) => [...r]);

  findMany.mockImplementation((args: { select?: { id?: boolean } } = {}) => {
    const head = queue[0] ?? [];

    if (args?.select?.id) {
      if (head.length === 0) queue.shift();
      return Promise.resolve((head as Array<{ id: string }>).map((row) => ({ id: row.id })));
    }

    queue.shift();
    return Promise.resolve(head);
  });
}

beforeEach(() => vi.clearAllMocks());

describe('pickProblem fallbacks', () => {
  it('serves a matching problem when one exists', async () => {
    scriptQueries([problem('sum-of-array', 'EASY', 'TIER_0')]);
    const chosen = await pickProblem('user-1', 'EASY', ['TIER_0']);
    expect(chosen.slug).toBe('sum-of-array');
  });

  it('repeats a problem on cooldown rather than failing', async () => {
    // Everything at this tier has been seen recently. Repeating is the lesser
    // wrong; failing leaves the device unlockable.
    scriptQueries([], [problem('seen-recently', 'EASY', 'TIER_0')]);
    const chosen = await pickProblem('user-1', 'EASY', ['TIER_0']);
    expect(chosen.slug).toBe('seen-recently');
  });

  it('drops the tier gate before it drops the lock', async () => {
    // The curriculum and this difficulty do not intersect yet. Serving
    // something off-curriculum beats serving nothing.
    scriptQueries([], [], [problem('off-curriculum', 'EASY', 'TIER_1')]);
    const chosen = await pickProblem('user-1', 'EASY', ['TIER_0']);
    expect(chosen.slug).toBe('off-curriculum');
  });

  it('relaxes difficulty when the corpus has none at that level', async () => {
    // The real one. The ladder promotes to HARD after three fast solves, and
    // the corpus currently has no HARD problems at all — so without this the
    // product breaks precisely for the users who got good at it.
    scriptQueries([], [], [], [problem('an-easy-one', 'EASY', 'TIER_0')]);
    const chosen = await pickProblem('user-1', 'HARD', ['TIER_1']);
    expect(chosen.slug).toBe('an-easy-one');
  });

  it('only gives up when the whole corpus is empty', async () => {
    scriptQueries([], [], [], []);
    await expect(pickProblem('user-1', 'HARD', ['TIER_1'])).rejects.toThrowError(
      /No active problems at any difficulty/,
    );
  });

  it('never asks for an inactive problem, at any fallback level', async () => {
    // An INACTIVE row is one with no driver, no tests or no measured runtime.
    // Serving one is the lockout the isActive flag exists to prevent, so no
    // fallback may relax it.
    scriptQueries([], [], [], [problem('an-easy-one', 'EASY', 'TIER_0')]);
    await pickProblem('user-1', 'HARD', ['TIER_1']);

    for (const call of findMany.mock.calls) {
      expect((call[0] as { where: { isActive: boolean } }).where.isActive).toBe(true);
    }
  });
});
