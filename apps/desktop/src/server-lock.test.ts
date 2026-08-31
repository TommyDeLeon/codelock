import { describe, expect, it, vi } from 'vitest';
import { engageOnServer } from './server-lock.js';

/**
 * Regression guard for the lockout, and for its mirror image.
 *
 * The original bug: the shell covered the screen and left it to a page on
 * another origin to tell the server the timer had fired. That page had no
 * credentials yet, so the server session stayed ARMED, every submission was
 * refused with "Session is not locked", and no unlock token could be minted.
 * The screen was covered and unopenable except by the kill switch.
 *
 * The mirror image, introduced when accounts were removed: this function still
 * demanded a stored session, found none, and returned a failure the caller
 * treated as settled. The timer fired and the screen never went down at all.
 *
 * So the contract is narrow in both directions: the shell learns whether the
 * server is locked BEFORE taking the screen, never mistakes a failure for a
 * yes — and never refuses to ask merely because nobody is signed in, because
 * nobody ever is.
 */

function deps(fetchFn: typeof fetch, overrides: Partial<Parameters<typeof engageOnServer>[1]> = {}) {
  return { apiUrl: 'http://api.test', fetchFn, ...overrides };
}

const reply = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('engageOnServer', () => {
  it('engages with no stored credentials at all', async () => {
    // The bug this file exists to prevent a second time: an account-free
    // install has no session, and that must not stop the lock from engaging.
    const fetchFn = vi.fn(async () => reply(200)) as unknown as typeof fetch;

    const result = await engageOnServer('session-1', deps(fetchFn));

    expect(result).toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toBe('http://api.test/v1/lock/session-1/engage');
    expect((init as RequestInit).method).toBe('POST');
    // No Authorization header: there is nothing to authorise against.
    expect((init as RequestInit).headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('treats a 409 as a refusal, never as a lock', async () => {
    const fetchFn = vi.fn(async () =>
      reply(409, { error: { message: 'Timer is paused' } }),
    ) as unknown as typeof fetch;

    const result = await engageOnServer('session-1', deps(fetchFn));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('refused');
  });

  it('reports an unreachable API rather than assuming the lock engaged', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;

    const result = await engageOnServer('session-1', deps(fetchFn));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unreachable');
  });

  it('treats a 500 as unreachable, so the caller retries', async () => {
    // Distinct from 'refused': a server error is transient, and giving up on it
    // strands a user whose timer has already fired.
    const fetchFn = vi.fn(async () => reply(500)) as unknown as typeof fetch;

    const result = await engageOnServer('session-1', deps(fetchFn));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unreachable');
  });

  it('is safe to call twice for one session', async () => {
    const fetchFn = vi.fn(async () => reply(200)) as unknown as typeof fetch;

    expect(await engageOnServer('session-1', deps(fetchFn))).toEqual({ ok: true });
    expect(await engageOnServer('session-1', deps(fetchFn))).toEqual({ ok: true });
  });
});
