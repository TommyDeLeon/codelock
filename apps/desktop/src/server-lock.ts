/**
 * Tell the server the lock has fired, before the screen is taken.
 *
 * The shell used to engage locally and leave the API to find out from whichever
 * page happened to load. It did not find out: the session stayed ARMED, and a
 * submission against an ARMED session is refused with "Session is not locked".
 *
 * Which means: screen covered, and no unlock token obtainable. The only way out
 * was the ten-second kill switch, which records a failure against a user who
 * did nothing wrong. So every path that takes the screen confirms the server is
 * LOCKED first, and this process is the right one to ask — it is the thing
 * deciding to take the screen.
 *
 * Server-side `engageLock` is idempotent for an already-LOCKED session, so
 * calling this more than once for one session is safe.
 *
 * There are no credentials here any more. The API serves a single local learner
 * and does not authenticate. That removal is also what broke this function
 * once: it still demanded a stored session, found none, and returned
 * 'no-session' — which the caller treats as settled and does not retry. The
 * timer fired, the server was never told, and the screen never went down.
 */

export type EngageFailure =
  /** The server refused the transition — paused, cancelled, or not yet due. */
  | 'refused'
  /** The API could not be reached, or answered with a server error. */
  | 'unreachable';

export type EngageResult = { ok: true } | { ok: false; reason: EngageFailure; detail?: string };

export interface EngageDeps {
  apiUrl: string;
  /** Injectable so this is testable without a running API. */
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 8_000;

async function postJson(
  fetchFn: typeof fetch,
  url: string,
  body: unknown,
  timeoutMs: number,
): Promise<{ status: number; body: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return { status: res.status, body: await res.text().catch(() => '') };
  } finally {
    clearTimeout(timer);
  }
}

export async function engageOnServer(sessionId: string, deps: EngageDeps): Promise<EngageResult> {
  const fetchFn = deps.fetchFn ?? fetch;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = `${deps.apiUrl}/v1/lock/${sessionId}/engage`;

  try {
    const res = await postJson(fetchFn, url, {}, timeoutMs);

    if (res.status >= 200 && res.status < 300) return { ok: true };
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
