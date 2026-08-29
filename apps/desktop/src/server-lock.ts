import type { StoredSession } from './session-store.js';

/**
 * Tell the server the lock has fired, before the screen is taken.
 *
 * The shell used to engage locally and leave the API to find out from whichever
 * page happened to load. It did not find out. The lock screen is served from
 * the web origin, whose storage is empty, so it borrows the session from this
 * process through a bridge — and that borrow completes *after* the page has
 * already fired its first request. The request 401s, the session stays ARMED,
 * and a submission against it is refused with "Session is not locked".
 *
 * Which means: screen covered, and no unlock token obtainable. The only way out
 * is the ten-second kill switch, which records a failure against a user who did
 * nothing wrong. So every path that takes the screen confirms the server is
 * LOCKED first, and this process is the right one to ask — it owns the tokens,
 * and it is the thing deciding to take the screen.
 *
 * Server-side `engageLock` is idempotent for an already-LOCKED session, so
 * calling this more than once for one session is safe.
 */

export type EngageFailure =
  /** Nobody is signed in on this install; there is no lock to engage. */
  | 'no-session'
  /** Both the access token and the refresh token were rejected. */
  | 'unauthorized'
  /** The server refused the transition — paused, cancelled, or not yet due. */
  | 'refused'
  /** The API could not be reached, or answered with a server error. */
  | 'unreachable';

export type EngageResult = { ok: true } | { ok: false; reason: EngageFailure; detail?: string };

export interface EngageDeps {
  apiUrl: string;
  readSession: () => StoredSession | null;
  writeSession: (session: StoredSession) => void;
  /** Injectable so this is testable without a running API. */
  fetchFn?: typeof fetch;
  /** Bounded so a dead network cannot hold the deadline open indefinitely. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

async function postJson(
  fetchFn: typeof fetch,
  url: string,
  body: unknown,
  accessToken: string | null,
  timeoutMs: number,
): Promise<{ status: number; body: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A timer armed for an hour outlives its fifteen-minute access token, so the
 * one moment this call matters is also the moment the token is most likely to
 * be stale. Refreshing on 401 is the normal path here, not an edge case.
 */
async function refresh(deps: EngageDeps, session: StoredSession): Promise<StoredSession | null> {
  const fetchFn = deps.fetchFn ?? fetch;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const res = await postJson(
    fetchFn,
    `${deps.apiUrl}/v1/auth/refresh`,
    { refreshToken: session.refreshToken },
    null,
    timeoutMs,
  );
  if (res.status < 200 || res.status >= 300) return null;

  try {
    const parsed = JSON.parse(res.body) as Partial<StoredSession>;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    const next = { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
    deps.writeSession(next);
    return next;
  } catch {
    return null;
  }
}

export async function engageOnServer(sessionId: string, deps: EngageDeps): Promise<EngageResult> {
  const fetchFn = deps.fetchFn ?? fetch;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = `${deps.apiUrl}/v1/lock/${sessionId}/engage`;

  let session = deps.readSession();
  if (!session) return { ok: false, reason: 'no-session' };

  try {
    let res = await postJson(fetchFn, url, {}, session.accessToken, timeoutMs);

    if (res.status === 401) {
      const refreshed = await refresh(deps, session);
      if (!refreshed) return { ok: false, reason: 'unauthorized' };
      session = refreshed;
      res = await postJson(fetchFn, url, {}, session.accessToken, timeoutMs);
    }

    if (res.status >= 200 && res.status < 300) return { ok: true };
    if (res.status === 401) return { ok: false, reason: 'unauthorized' };
    // 409 is the server declining to lock — paused, cancelled, or not yet due.
    // Taking the screen anyway would be the shell overruling the authority it
    // just asked, which is the whole bug this function exists to prevent.
    if (res.status >= 400 && res.status < 500) {
      return { ok: false, reason: 'refused', detail: res.body.slice(0, 200) };
    }
    return { ok: false, reason: 'unreachable', detail: `HTTP ${res.status}` };
  } catch (err) {
    return {
      ok: false,
      reason: 'unreachable',
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
