import { apiFailure, type ApiFailure } from '@codelock/shared';
import type {
  ApiErrorBody,
  DemoGradeResult,
  Integration,
  IntegrationProvider,
  LeetCodeStats,
  SyncRecord,
  AuthUser,
  GradeResult,
  Language,
  LockSessionView,
  OAuthProviderName,
  PublicProblem,
  StatsSummary,
  TimerConfig,
} from '@codelock/shared';

/**
 * Where the API lives.
 *
 * The runtime value wins. `/runtime-config.js` is a blocking script in the
 * document head that sets this global from the server's environment, so a
 * prebuilt image can be pointed at any deployment without rebuilding — CI
 * cannot know your domain, and a bundle built without one silently falls back
 * to localhost and calls the visitor's own machine.
 *
 * The build-time constant stays as the fallback so `npm run dev` and locally
 * built images keep working unchanged.
 *
 * `||` not `??`: an unset Docker build arg arrives as the empty string, which
 * would make every request resolve against the page's own origin.
 */
declare global {
  interface Window {
    __CODELOCK__?: { apiUrl?: string };
  }
}

const BASE =
  (typeof window !== 'undefined' ? window.__CODELOCK__?.apiUrl : undefined) ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

/**
 * Token storage.
 *
 * localStorage is the pragmatic choice here: the desktop and mobile shells load
 * this same app from a non-browser origin where cookies are awkward, and the
 * API is a separate origin. The tradeoff is XSS exposure, which is mitigated by
 * a strict CSP and by the fact that a stolen access token still cannot unlock a
 * session — unlocking requires a server-signed unlock token bound to that
 * session, issued only after Judge0 reports a pass.
 */
const ACCESS_KEY = 'codelock.access';
const REFRESH_KEY = 'codelock.refresh';

export const tokenStore = {
  get access(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string): void {
    window.localStorage.setItem(ACCESS_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear(): void {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiClientError extends Error {
  /**
   * The same failure expressed as the shared contract. Every client hook reads
   * this rather than sniffing `status` or `code` itself, so "the server said
   * no" and "we never reached the server" can never be confused for each other
   * — or for "loaded fine, nothing to show".
   */
  readonly failure: ApiFailure;

  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.failure = apiFailure(status, message, code, details);
  }
}

/**
 * Single-flight refresh: if three queries 401 at once we must not burn three
 * refresh tokens, because the API rotates and revokes on every use — the second
 * and third would fail and log the user out mid-lock.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;

  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${BASE}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) {
        tokenStore.clear();
        return false;
      }
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      tokenStore.set(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      // Cleared on the microtask after all awaiters resolve.
      queueMicrotask(() => {
        refreshInFlight = null;
      });
    }
  })();

  return refreshInFlight;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retryOn401 = true,
): Promise<T> {
  const access = tokenStore.access;

  // Grading is synchronous and can legitimately take ~30s; everything else
  // should fail fast. Without a timeout, an unreachable API leaves the UI on
  // skeletons indefinitely, which reads as "still loading" rather than "broken".
  // The demo runs the same sandbox containers, so it needs the same patience —
  // and that includes /v1/demo/problem, not only /v1/demo/grade. It is the
  // FIRST request the demo page makes, so on a cold instance (a free-tier host
  // asleep after inactivity can take up to a minute to wake — see
  // docs/FREE-HOSTING.md) it is the one most likely to be racing a wake-up, and
  // it used to carry the 15s "fail fast" budget meant for an already-warm app.
  // Two 15s attempts (retry: 1) settling into an error while the instance is
  // still waking up is what read as the demo being "stuck" rather than slow.
  const grading =
    path.startsWith('/v1/submissions') ||
    path === '/v1/demo/grade' ||
    path === '/v1/demo/problem';
  const timeoutMs = grading ? 120_000 : 15_000;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'Content-Type': 'application/json',
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    // fetch rejects for network failure and abort alike; neither carries a
    // status code, so give them one the UI can actually render.
    const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
    throw new ApiClientError(
      0,
      timedOut ? 'TIMEOUT' : 'NETWORK',
      timedOut
        ? 'The server took too long to respond. Try again in a moment.'
        : 'Could not reach CodeLock. Check your connection and try again.',
    );
  }

  if (res.status === 401 && retryOn401 && (await refreshTokens())) {
    return request<T>(path, init, false);
  }

  if (res.status === 204) return undefined as T;

  const body = (await res.json().catch(() => null)) as ApiErrorBody | T | null;

  if (!res.ok) {
    const err = (body as ApiErrorBody | null)?.error;
    throw new ApiClientError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? `Request failed with ${res.status}`,
      err?.details,
    );
  }

  return body as T;
}

const post = <T>(path: string, payload?: unknown): Promise<T> =>
  request<T>(path, { method: 'POST', body: payload ? JSON.stringify(payload) : undefined });

// --- endpoints -------------------------------------------------------------

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export const api = {
  /**
   * Unauthenticated dependency check. Used by the connection banner to tell
   * 'the API is down' apart from 'you have no data'.
   */
  health: () =>
    request<{ ok: boolean; database: 'up' | 'down'; latencyMs?: number }>('/v1/health'),

  auth: {
    async register(input: {
      email: string;
      password: string;
      displayName: string;
      timezone: string;
    }): Promise<AuthUser> {
      const data = await post<AuthResponse>('/v1/auth/register', input);
      tokenStore.set(data.accessToken, data.refreshToken);
      return data.user;
    },

    async login(input: { email: string; password: string }): Promise<AuthUser> {
      const data = await post<AuthResponse>('/v1/auth/login', input);
      tokenStore.set(data.accessToken, data.refreshToken);
      return data.user;
    },

    async logout(): Promise<void> {
      await post<void>('/v1/auth/logout').catch(() => undefined);
      tokenStore.clear();
    },

    me: () =>
      request<AuthUser & { preferredLanguage: Language; progress: unknown; timerConfig: TimerConfig }>(
        '/v1/auth/me',
      ),
  },

  lock: {
    active: () => request<{ session: LockSessionView | null }>('/v1/lock/active'),
    arm: (input?: { deviceId?: string; durationMinutes?: number }) =>
      post<LockSessionView>('/v1/lock/arm', input ?? {}),
    engage: (id: string) => post<LockSessionView>(`/v1/lock/${id}/engage`),
    /** Hold the countdown where it is. Refused once the lock is live. */
    pause: (id: string) => post<{ session: LockSessionView | null }>(`/v1/lock/${id}/pause`),
    /** Start it again, giving back exactly the interval that was left. */
    resume: (id: string) => post<{ session: LockSessionView | null }>(`/v1/lock/${id}/resume`),
    /** Throw the session away entirely. Refused once the lock is live. */
    cancel: (id: string) =>
      post<{ session: { id: string; state: string } }>(`/v1/lock/${id}/cancel`),
    skip: (id: string) => post<{ skipsRemaining: number }>(`/v1/lock/${id}/skip`),
    abandon: (id: string, reason?: 'user_gave_up' | 'kill_switch') =>
      post<{ progress: unknown }>(`/v1/lock/${id}/abandon`, reason ? { reason } : undefined),
  },

  /**
   * The public demo. No auth, and structurally unable to unlock anything —
   * DemoGradeResult has no token field, so this path cannot be confused with
   * the real submission flow even by mistake.
   */
  demo: {
    problem: () => request<{ problem: PublicProblem }>('/v1/demo/problem'),
    grade: (input: { language: Language; sourceCode: string }) =>
      post<DemoGradeResult>('/v1/demo/grade', input),
  },

  problems: {
    next: () => request<{ problem: PublicProblem; difficulty: string }>('/v1/problems/next'),
    byId: (id: string) => request<{ problem: PublicProblem }>(`/v1/problems/${id}`),
  },

  submissions: {
    create: (input: {
      problemId: string;
      lockSessionId?: string;
      language: Language;
      sourceCode: string;
    }) => post<GradeResult>('/v1/submissions', input),
  },

  settings: {
    profile: () =>
      request<{ profile: { displayName: string; preferredLanguage: Language; timezone: string } }>(
        '/v1/settings/profile',
      ),
    timer: () => request<{ timerConfig: TimerConfig }>('/v1/settings/timer'),
    updateTimer: (patch: Partial<TimerConfig>) =>
      request<{ timerConfig: TimerConfig }>('/v1/settings/timer', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
  },

  oauth: {
    /** Which providers this deployment can actually complete. */
    providers: () => request<{ providers: OAuthProviderName[] }>('/v1/auth/oauth/providers'),
    /** Begin. Returns the provider URL to send the browser to. */
    start: (provider: OAuthProviderName) =>
      post<{ url: string; handoff: string }>(`/v1/auth/oauth/${provider.toLowerCase()}/start`),
    /** Exchange the one-time handoff for a session. */
    claim: (handoff: string) =>
      post<{ user: AuthUser; accessToken: string; refreshToken: string }>(
        '/v1/auth/oauth/claim',
        { handoff },
      ),
  },

  integrations: {
    list: () =>
      request<{ integrations: Integration[]; available: { github: boolean; leetcode: boolean } }>(
        '/v1/integrations',
      ),
    disconnect: (provider: IntegrationProvider) =>
      request<void>(`/v1/integrations/${provider.toLowerCase()}`, { method: 'DELETE' }),

    githubAuthorizeUrl: () =>
      request<{ url: string; scopes: string[] }>('/v1/integrations/github/authorize'),
    githubRepos: () =>
      request<{ repos: Array<{ fullName: string; private: boolean; defaultBranch: string }> }>(
        '/v1/integrations/github/repos',
      ),
    updateGithub: (input: { repoFullName?: string; branch?: string; createRepoNamed?: string }) =>
      request<{ integration: Integration }>('/v1/integrations/github', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),

    linkLeetcode: (username: string) =>
      post<{ stats: LeetCodeStats }>('/v1/integrations/leetcode', { username }),
    leetcodeStats: (refresh = false) =>
      request<{ stats: LeetCodeStats; stale: boolean }>(
        `/v1/integrations/leetcode/stats${refresh ? '?refresh=true' : ''}`,
      ),

    syncs: () => request<{ syncs: SyncRecord[] }>('/v1/integrations/syncs'),
  },

  stats: {
    summary: () => request<StatsSummary>('/v1/stats/summary'),
    activity: () =>
      request<{ days: Array<{ date: string; solved: number; attempted: number }> }>(
        '/v1/stats/activity',
      ),
  },
};
