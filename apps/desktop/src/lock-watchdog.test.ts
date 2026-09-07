import { describe, expect, it, vi } from 'vitest';
import { checkLockStillHeld, verdictFor } from './lock-watchdog.js';

/**
 * Regression guard for the lockout with no way out.
 *
 * The bug: a skip spent from the daily allowance resolved the session on the
 * server as BYPASSED, and the shell never heard about it. The screen stayed
 * covered over a session that no longer existed, so no submission could be
 * graded and no unlock token could be minted — the only exit left was the
 * ten-second kill switch, which records a failure the user did not earn.
 *
 * The contract is deliberately asymmetric: a definite "that session is over"
 * releases the screen, and absolutely nothing else does. An outage must never
 * read as an unlock, or pulling the network cable becomes the bypass.
 */
describe('verdictFor', () => {
  it('holds the screen while the server still calls the session LOCKED', () => {
    expect(verdictFor({ session: { id: 's1', state: 'LOCKED' } }, 's1')).toEqual({
      release: false,
      reason: 'still-locked',
    });
  });

  it('releases when the session was skipped out from under the lock', () => {
    // A spent skip resolves the session, so it drops out of /lock/active.
    expect(verdictFor({ session: null }, 's1')).toEqual({ release: true, reason: 'resolved' });
  });

  it('releases when the active session is a different one', () => {
    // What an auto re-arm looks like: the old lock is resolved and the next
    // countdown is already armed by the time this poll lands.
    expect(verdictFor({ session: { id: 's2', state: 'ARMED' } }, 's1')).toEqual({
      release: true,
      reason: 'resolved',
    });
  });

  it('releases when our session came back as merely ARMED', () => {
    expect(verdictFor({ session: { id: 's1', state: 'ARMED' } }, 's1')).toEqual({
      release: true,
      reason: 'resolved',
    });
  });

  it('fails closed when the server cannot be reached', () => {
    // The one that must never regress: no answer is not an answer.
    expect(verdictFor(null, 's1')).toEqual({ release: false, reason: 'unreachable' });
  });

  it('holds a lock that names no session, having nothing to ask about', () => {
    // A lock restored from disk with no session id, or the manual path.
    expect(verdictFor({ session: null }, null)).toEqual({
      release: false,
      reason: 'still-locked',
    });
  });
});

describe('checkLockStillHeld', () => {
  const deps = (fetchFn: typeof fetch) => ({ apiUrl: 'http://api.test', fetchFn });

  it('asks the active-session endpoint and acts on the answer', async () => {
    const fetchFn = vi.fn(
      async () => new Response(JSON.stringify({ session: null }), { status: 200 }),
    ) as unknown as typeof fetch;

    expect(await checkLockStillHeld('s1', deps(fetchFn))).toEqual({
      release: true,
      reason: 'resolved',
    });
    const [url] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toBe('http://api.test/v1/lock/active');
  });

  it('treats a thrown request as an outage rather than an unlock', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;

    expect(await checkLockStillHeld('s1', deps(fetchFn))).toEqual({
      release: false,
      reason: 'unreachable',
    });
  });

  it('treats a 500 as an outage rather than an unlock', async () => {
    const fetchFn = vi.fn(async () => new Response('', { status: 500 })) as unknown as typeof fetch;

    expect(await checkLockStillHeld('s1', deps(fetchFn))).toEqual({
      release: false,
      reason: 'unreachable',
    });
  });
});
