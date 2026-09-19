import type {
  Accomplishment,
  GradeResult,
  HintView,
  Language,
  LearnView,
  LessonCheckResultView,
  LessonPracticeView,
  LessonSessionView,
  LessonView,
  ProgressView,
  LockSessionView,
  SessionReviewView,
  StatsSummary,
  TimerConfig,
  DifficultyFocusInput,
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
    return;
  }
  // No bridge means the renderer is open in a plain browser from `vite`,
  // which only happens while developing. `?api=http://127.0.0.1:4001` points
  // it at a dev API on another port; only a loopback origin is accepted.
  const override = new URLSearchParams(window.location.search).get('api');
  if (override && /^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/.test(override)) apiUrl = override;
}

export const webAppUrl = (): string => webUrl;

/**
 * A failed request. `status` is 0 when the server could not be reached at
 * all, so a screen can tell "CodeLock is down" from "the judge is down" (502)
 * from "this lesson moved on" (409) without parsing the message.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number = 0,
    readonly code: string = 'UNREACHABLE',
    readonly body: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiUrl}${path}`, {
      ...init,
      // A server that accepts the connection and never answers must not leave
      // a screen on "Loading…" forever; this turns it into a retryable error.
      signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
  } catch {
    // Distinct from any server-side failure: we know nothing about the user's
    // state, so callers must not render this as "you have no sessions".
    throw new ApiError('Cannot reach CodeLock. Check that the server is running.');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null;
    throw new ApiError(body?.error?.message ?? `Request failed with ${res.status}`, res.status, body?.error?.code ?? 'HTTP_ERROR', body);
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

  /**
   * Automatic (default) or a manual focus on one band. Server-validated and
   * applied from the next armed session; a live session keeps its level.
   */
  saveDifficultyFocus: (focus: DifficultyFocusInput) =>
    request<{ timerConfig: TimerConfig }>('/v1/settings/difficulty', {
      method: 'PUT',
      body: JSON.stringify(focus),
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

  /** Skills and recent solves, with help and independent work kept apart. */
  progress: () => request<ProgressView>('/v1/progress'),

  /** The newest solve's success moment, so the dashboard can show it once. */
  latestAccomplishment: () =>
    request<{
      submissionId: string | null;
      sessionId: string | null;
      /** When the solve happened. */
      at: string | null;
      accomplishment: Accomplishment | null;
    }>(
      '/v1/progress/latest-accomplishment',
    ),

  logSummary: (sinceDays?: number) =>
    request<{ sinceDays: number | null; summary: LogSummary }>(
      `/v1/log/summary${sinceDays ? `?sinceDays=${sinceDays}` : ''}`,
    ),

  /** The success moment for one solve, lock or practice. `pending` while it is being written. */
  accomplishment: (submissionId: string) =>
    request<{ accomplishment: Accomplishment | null; pending: boolean }>(
      `/v1/progress/accomplishment/${submissionId}`,
    ),

  profile: () => request<{ profile: { preferredLanguage: Language } }>('/v1/settings/profile'),

  /**
   * Learn. Reads change nothing on the server; every write below is an
   * explicit step, and each write carries the session `version` it was
   * built against so a stale one is refused rather than honoured.
   */
  learn: {
    view: (language: Language) => request<LearnView>(`/v1/learn?language=${language}`),
    lesson: (id: string, language: Language) =>
      request<{ lesson: LessonView; session: LessonSessionView | null }>(`/v1/learn/lessons/${id}?language=${language}`),
    start: (id: string, language: Language) =>
      request<{ session: LessonSessionView }>(`/v1/learn/lessons/${id}/start`, {
        method: 'POST',
        body: JSON.stringify({ language }),
      }),
    draft: (id: string, body: { version: number; step?: number; draft?: Record<string, string> }) =>
      request<{ session: LessonSessionView }>(`/v1/learn/lessons/${id}/draft`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    check: (
      id: string,
      body: {
        attemptId: string;
        version: number;
        kind: 'prediction' | 'task';
        checkId: string;
        answer?: number;
        sourceCode?: string;
      },
    ) =>
      request<{ result: LessonCheckResultView; duplicate: boolean; session: LessonSessionView }>(
        `/v1/learn/lessons/${id}/checks`,
        { method: 'POST', body: JSON.stringify(body), signal: AbortSignal.timeout(70_000) },
      ),
    practice: (id: string, language: Language) =>
      request<LessonPracticeView>(`/v1/learn/lessons/${id}/practice`, {
        method: 'POST',
        body: JSON.stringify({ language }),
      }),
    finish: (id: string, version: number) =>
      request<{ session: LessonSessionView }>(`/v1/learn/lessons/${id}/finish`, {
        method: 'POST',
        body: JSON.stringify({ version }),
      }),
    placement: () =>
      request<{ ok: true; marked: number }>('/v1/learn/placement', {
        method: 'POST',
        body: JSON.stringify({ foundations: 'known' }),
      }),
    correction: (lessonId: string, correction: 'known' | 'too_hard') =>
      request<{ ok: true }>('/v1/learn/correction', {
        method: 'POST',
        body: JSON.stringify({ lessonId, correction }),
      }),
    /** Practice grading and hints with no lock session, by construction. */
    submit: (body: { problemId: string; language: Language; sourceCode: string }) =>
      request<GradeResult>('/v1/learn/practice/submit', {
        method: 'POST',
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(70_000),
      }),
    hint: (body: { problemId: string; language: Language; sourceCode: string; request: 'next' | 'level'; level?: number }) =>
      request<HintView>('/v1/learn/practice/hint', {
        method: 'POST',
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      }),
  },
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
