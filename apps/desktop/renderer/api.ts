import type {
  LockSessionView,
  SessionReviewView,
  StatsSummary,
  TimerConfig,
} from '@codelock/shared';

/**
 * The renderer's API client.
 *
 * Deliberately not shared with the web app's client: that one is written for
 * Next.js and a same-origin browser, while this runs on an app:// origin. The
 * surface it needs is small enough that a second thin client is cheaper than an
 * abstraction over both.
 *
 * There are no credentials here. The API serves a single local learner and does
 * not authenticate, so there is no token to store, refresh, or fail to send —
 * which is what used to strand the lock screen on "Missing bearer token" while
 * a timer was running.
 */

let apiUrl = 'http://localhost:4000';
let webUrl = 'http://localhost:3000';

/** Resolved once at startup from the main process, which owns config.json. */
export async function loadConfig(): Promise<void> {
  const config = await window.codelock?.config();
  if (config) {
    apiUrl = config.apiUrl;
    webUrl = config.webUrl;
  }
}

export const webAppUrl = (): string => webUrl;

export class ApiError extends Error {}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
  } catch {
    // Distinct from any server-side failure: we know nothing about the user's
    // state, so callers must not render this as "you have no sessions".
    throw new ApiError('Cannot reach CodeLock. Check that the server is running.');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new ApiError(body?.error?.message ?? `Request failed with ${res.status}`);
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const api = {
  stats: () => request<StatsSummary>('/v1/stats/summary'),

  activeLock: () => request<{ session: LockSessionView | null }>('/v1/lock/active'),

  arm: (durationMinutes: number) =>
    request<LockSessionView>('/v1/lock/arm', {
      method: 'POST',
      body: JSON.stringify({ durationMinutes }),
    }),

  /**
   * Hold the countdown, and give the time back on resume.
   *
   * All three are ARMED-only on the server, and that is the point rather than a
   * limitation: pausing a lock that has already landed would be an unlock with
   * extra steps. The shell does not re-check that rule — the API owns it, and a
   * second copy here would be one more thing to forget.
   */
  pause: (id: string) =>
    request<{ session: LockSessionView | null }>(`/v1/lock/${id}/pause`, { method: 'POST' }),

  resume: (id: string) =>
    request<{ session: LockSessionView | null }>(`/v1/lock/${id}/resume`, { method: 'POST' }),

  /**
   * Take minutes off a running countdown.
   *
   * Reduce-only by construction — there is no `lengthen`, and the server has no
   * schema that would accept one. Overshooting is fine and means "lock me now":
   * the deadline clamps to the present rather than erroring.
   */
  shorten: (id: string, minutes: number) =>
    request<{ session: LockSessionView | null }>(`/v1/lock/${id}/shorten`, {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    }),

  /** Stop the timer outright. Records no failure: no problem was ever assigned. */
  cancel: (id: string) =>
    request<{ session: { id: string; state: string } }>(`/v1/lock/${id}/cancel`, {
      method: 'POST',
    }),

  timer: () => request<{ timerConfig: TimerConfig }>('/v1/settings/timer'),

  saveTimer: (patch: Partial<TimerConfig>) =>
    request<{ timerConfig: TimerConfig }>('/v1/settings/timer', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  /** The learning log: what you met, what you tried, and how it went. */
  log: (params: { limit?: number; kind?: string[] } = {}) => {
    const q = new URLSearchParams();
    if (params.limit) q.set('limit', String(params.limit));
    for (const k of params.kind ?? []) q.append('kind', k);
    const qs = q.toString();
    return request<{ events: LearningEventView[] }>(`/v1/log${qs ? `?${qs}` : ''}`);
  },

  /**
   * One session, read back. The server decides what a live session may show —
   * the shell does not re-derive that rule, it renders whatever came back and
   * prints `withheld` where something is missing.
   */
  sessionReview: (id: string) =>
    request<{ review: SessionReviewView }>(`/v1/log/session/${id}`),

  logSummary: (sinceDays?: number) =>
    request<{ sinceDays: number | null; summary: LogSummary }>(
      `/v1/log/summary${sinceDays ? `?sinceDays=${sinceDays}` : ''}`,
    ),
};

export interface LearningEventView {
  id: string;
  kind: string;
  at: string;
  problemSlug: string | null;
  problemTitle: string | null;
  difficulty: string | null;
  tier: string | null;
  patternFamily: string | null;
  language: string | null;
  attempt: number | null;
  elapsedSeconds: number | null;
  detail: unknown;
}

export interface LogSummary {
  locksEngaged: number;
  problemsServed: number;
  solved: number;
  bypassed: number;
  failedAttempts: number;
  attemptsPerSolve: number | null;
  solvedByFamily: Array<{ patternFamily: string; solved: number }>;
}
