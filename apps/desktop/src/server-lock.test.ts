import { describe, expect, it, vi } from 'vitest';
import { engageOnServer } from './server-lock.js';

/**
 * Regression guard for the lockout.
 *
 * The shell used to cover the screen and only then leave it to a page on
 * another origin to tell the server the timer had fired. That page had no
 * credentials yet, so the server session stayed ARMED, every submission was
 * refused with "Session is not locked", and no unlock token could be minted.
 * The screen was covered and unopenable except by the kill switch.
 *
 * So the contract here is narrow and absolute: the shell learns whether the
 * server is locked BEFORE it takes the screen, and never mistakes a failure
 * for a yes.
 */

const session = { accessToken: 'access-1', refreshToken: 'refresh-1' };

function deps(fetchFn: typeof fetch, overrides: Partial<Parameters<typeof engageOnServer>[1]> = {}) {
  return {
    apiUrl: 'http://api.test',
    readSession: () => session,
    writeSession: vi.fn(),
    fetchFn,
    ...overrides,
  };
}

const reply = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('engageOnServer', () => {
  it('reports success and calls the engage endpoint with the access token', async () => {
    const fetchFn = vi.fn(async () => reply(200, { state: 'LOCKED' })) as unknown as typeof fetch;
    const result = await engageOnServer('sess-1', deps(fetchFn));

    expect(result).toEqual({ ok: true });
    const [url, init] = (fetchFn as unknown as { mock: { calls: [string, RequestInit][] } }).mock
      .calls[0]!;
    expect(url).toBe('http://api.test/v1/lock/sess-1/engage');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer access-1');
  });

  /**
   * The one moment this call matters is also the moment the token is most
   * likely stale: a timer armed for an hour outlives a fifteen-minute access
   * token. Without a working refresh, every long timer would fail to lock.
   */
  it('refreshes an expired access token and retries once', async () => {
    const calls: string[] = [];
    const fetchFn = vi.fn(async (url: string) => {
      calls.push(url);
      if (url.endsWith('/v1/auth/refresh')) {
        return reply(200, { accessToken: 'access-2', refreshToken: 'refresh-2' });
      }
      return calls.filter((c) => c.endsWith('/engage')).length === 1
        ? reply(401, { error: 'expired' })
        : reply(200, { state: 'LOCKED' });
    }) as unknown as typeof fetch;

    const writeSession = vi.fn();
    const result = await engageOnServer('sess-1', deps(fetchFn, { writeSession }));

    expect(result).toEqual({ ok: true });
    expect(writeSession).toHaveBeenCalledWith({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    });
    expect(calls.filter((c) => c.endsWith('/engage'))).toHaveLength(2);
  });

  it('fails when the refresh token is dead too, rather than reporting success', async () => {
    const fetchFn = vi.fn(async () => reply(401, {})) as unknown as typeof fetch;

    expect(await engageOnServer('sess-1', deps(fetchFn))).toEqual({
      ok: false,
      reason: 'unauthorized',
    });
  });

  // 409 is the server deliberately declining — paused, cancelled, or not due.
  // Reporting that as success would put the overlay up over a lock the server
  // does not believe in, which is the original bug wearing a different hat.
  it('treats a 409 as a refusal, never as a lock', async () => {
    const fetchFn = vi.fn(async () =>
      reply(409, { error: { message: 'Timer is paused' } }),
    ) as unknown as typeof fetch;

    const result = await engageOnServer('sess-1', deps(fetchFn));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('refused');
  });

  it('reports an unreachable API rather than assuming the lock engaged', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;

    const result = await engageOnServer('sess-1', deps(fetchFn));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('unreachable');
      expect(result.detail).toContain('ECONNREFUSED');
    }
  });

  it('does not call the API at all when nobody is signed in', async () => {
    const fetchFn = vi.fn() as unknown as typeof fetch;
    const result = await engageOnServer('sess-1', deps(fetchFn, { readSession: () => null }));

    expect(result).toEqual({ ok: false, reason: 'no-session' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  // Server-side engageLock returns the session view for an already-LOCKED
  // session instead of erroring, which is what makes the retry above safe.
  it('is safe to call twice for one session', async () => {
    const fetchFn = vi.fn(async () => reply(200, { state: 'LOCKED' })) as unknown as typeof fetch;
    expect(await engageOnServer('sess-1', deps(fetchFn))).toEqual({ ok: true });
    expect(await engageOnServer('sess-1', deps(fetchFn))).toEqual({ ok: true });
  });
});
