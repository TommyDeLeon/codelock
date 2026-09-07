/**
 * Ask the server whether the lock it confirmed is still on.
 *
 * The shell only ever *started* a lock from the server's word and then stopped
 * listening. Every way a session can end without a signed unlock token — a
 * spent skip, a give-up from another device, an admin cancelling it, the
 * twelve-hour reaper — left the API saying "resolved" and this process still
 * holding the screen, kiosk on, close disabled. That is the failure this file
 * exists to end: a machine locked over a session that is already over, with
 * nothing left that can open it but the ten-second kill switch, which then
 * records a failure against a user who did nothing wrong.
 *
 * It is a safety net, not the primary path. A solve still releases through the
 * signed token; this only catches the endings that have no token to give.
 */

/** The shape of GET /v1/lock/active that this decision actually depends on. */
export interface ActiveSessionReply {
  session?: { id?: unknown; state?: unknown } | null;
}

export type WatchdogVerdict =
  /** The server agrees this session is still LOCKED. Keep the screen. */
  | { release: false; reason: 'still-locked' }
  /** Could not ask, or the answer was unreadable. Keep the screen. */
  | { release: false; reason: 'unreachable' }
  /** The server no longer holds this lock. Give the screen back. */
  | { release: true; reason: 'resolved' };

/**
 * Fail closed, always.
 *
 * An unreachable server is not evidence that nothing is locked. If it were,
 * unplugging the network would be the easiest bypass in the product — quieter
 * than Task Manager and available to anyone. So only a definite answer that
 * this session is no longer LOCKED releases anything; everything else holds.
 */
export function verdictFor(
  reply: ActiveSessionReply | null,
  lockedSessionId: string | null,
): WatchdogVerdict {
  if (reply === null) return { release: false, reason: 'unreachable' };
  // A lock with no session id was never engaged from a server session — a
  // restored lock file, or the manual path. There is nothing to ask about, so
  // there is nothing this can conclude.
  if (!lockedSessionId) return { release: false, reason: 'still-locked' };

  const session = reply.session ?? null;
  if (session && session.id === lockedSessionId && session.state === 'LOCKED') {
    return { release: false, reason: 'still-locked' };
  }
  // Either there is no active session at all, or the active one is a different
  // session — which is exactly what an auto re-arm looks like the instant after
  // a skip. Both mean the lock this process is holding has ended.
  return { release: true, reason: 'resolved' };
}

export interface WatchdogDeps {
  apiUrl: string;
  /** Injectable so this is testable without a running API. */
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 8_000;

/** Null on any failure, so the caller cannot mistake an outage for an answer. */
export async function fetchActiveSession(
  deps: WatchdogDeps,
): Promise<ActiveSessionReply | null> {
  const fetchFn = deps.fetchFn ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetchFn(`${deps.apiUrl}/v1/lock/active`, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as ActiveSessionReply;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** One poll: ask, then decide. Kept separate so the loop stays trivial. */
export async function checkLockStillHeld(
  lockedSessionId: string | null,
  deps: WatchdogDeps,
): Promise<WatchdogVerdict> {
  return verdictFor(await fetchActiveSession(deps), lockedSessionId);
}
