import type { LockSessionView, StatsSummary, TimerConfig } from '@codelock/shared';

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
