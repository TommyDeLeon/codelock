import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * One invariant: **a GitHub failure can never keep anyone locked.**
 *
 * The mirror runs after the unlock token has already been issued, and it is
 * deliberately not awaited. That is easy to write and just as easy to undo —
 * a stray `await`, or a `.catch` removed during a refactor, turns a GitHub
 * outage into a user who solved the problem and is still staring at an
 * overlay. This test is here so that change fails loudly.
 */

// Hoisted so the vi.mock factories below — which run before the imports — can
// close over it without hitting the temporal dead zone.
const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    integration: { findUnique: (...a: unknown[]) => findUnique(...a) },
    submission: { findUnique: vi.fn() },
    syncRecord: { upsert: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { mirrorSubmission } from './integrations.js';
import { logger } from '../lib/logger.js';

beforeEach(() => {
  findUnique.mockReset();
  vi.mocked(logger.warn).mockClear();
});

describe('mirrorSubmission', () => {
  it('returns synchronously — the caller never waits on GitHub', async () => {
    // A hanging GitHub, modelled as a deferred rather than a promise that
    // never settles: an unsettled promise keeps the runner alive and turns
    // this assertion into a test-suite timeout.
    let releaseGithub: () => void = () => {};
    const hanging = new Promise((resolve) => {
      releaseGithub = () => resolve(null);
    });
    findUnique.mockReturnValue(hanging);

    const started = Date.now();
    const returned = mirrorSubmission('u1', 'sub1');

    // void, not a promise. If this ever becomes awaitable, an `await` at the
    // call site becomes possible and the invariant is one keystroke from gone.
    expect(returned).toBeUndefined();
    expect(Date.now() - started).toBeLessThan(50);

    releaseGithub();
    await new Promise((r) => setTimeout(r, 10));
  });

  it('swallows a failure instead of letting it escape', async () => {
    // `mockRejectedValue` builds its rejected promise eagerly, which counts as
    // unhandled before the mock is ever called. Throw at call time instead, so
    // the only thing that can catch it is the code under test.
    findUnique.mockImplementation(async () => {
      throw new Error('github is down');
    });

    expect(() => mirrorSubmission('u1', 'sub1')).not.toThrow();
    await new Promise((r) => setTimeout(r, 50));

    // Swallowed and logged, not propagated. The API installs a process-level
    // unhandledRejection handler; the mirror must never be what trips it,
    // because by this point the user has already been told they are unlocked.
    expect(logger.warn).toHaveBeenCalled();
  });

  it('does nothing when the user has no GitHub connected', async () => {
    findUnique.mockResolvedValue(null);
    expect(() => mirrorSubmission('u1', 'sub1')).not.toThrow();
    await new Promise((r) => setTimeout(r, 20));
  });
});
