import type {
  AuthUser,
  OAuthProviderName,
  Integration,
  LeetCodeStats,
  LockSessionView,
  StatsSummary,
  TimerConfig,
} from '@codelock/shared';

/**
 * The renderer's API client.
 *
 * Deliberately not shared with the web app's client: that one is written for
 * Next.js and a cookie-bearing same-origin browser, while this runs on an
 * app:// origin and holds its tokens itself. The surface it needs is small
 * enough that a second thin client is cheaper than an abstraction over both.
 *
 * The access token lives in localStorage of the app:// origin, which nothing
 * outside this bundle can reach — there is no remote page in this window
 * except the lock screen, and that is served from a different origin.
 */

const ACCESS_KEY = 'codelock.access';
const REFRESH_KEY = 'codelock.refresh';

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

export const isSignedIn = (): boolean => localStorage.getItem(ACCESS_KEY) !== null;

export function signOut(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function store(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export class ApiError extends Error {}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    // Distinct from any server-side failure: we know nothing about the user's
    // state, so callers must not render this as "you have no sessions".
    throw new ApiError('Cannot reach CodeLock. Check that the server is running.');
  }

  if (res.status === 401 && retry && (await refreshTokens())) {
    return request<T>(path, init, false);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new ApiError(body?.error?.message ?? `Request failed with ${res.status}`);
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem(ACCESS_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;

  const res = await fetch(`${apiUrl}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => null);

  if (!res?.ok) {
    signOut();
    return false;
  }
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  store(data.accessToken, data.refreshToken);
  return true;
}

export const api = {
  login: async (email: string, password: string): Promise<AuthUser> => {
    const data = await request<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/v1/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      false,
    );
    store(data.accessToken, data.refreshToken);
    return data.user;
  },

  register: async (input: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<AuthUser> => {
    const data = await request<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/v1/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          // The shell knows the machine's zone; asking the user for it would be
          // a form field that answers itself.
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      },
      false,
    );
    store(data.accessToken, data.refreshToken);
    return data.user;
  },

  /** Which provider buttons this deployment can actually complete. */
  oauthProviders: () =>
    request<{ providers: OAuthProviderName[] }>('/v1/auth/oauth/providers', {}, false),

  oauthStart: (provider: OAuthProviderName) =>
    request<{ url: string; handoff: string }>(
      `/v1/auth/oauth/${provider.toLowerCase()}/start`,
      { method: 'POST' },
      false,
    ),

  /**
   * Claim the finished session.
   *
   * Separate from the other calls because a 401 here is expected — it simply
   * means the browser has not finished yet — so it must not trigger the token
   * refresh path, and the caller polls it rather than treating it as an error.
   */
  oauthClaim: async (
    handoff: string,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string } | null> => {
    const res = await fetch(`${apiUrl}/v1/auth/oauth/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handoff }),
    }).catch(() => null);

    if (!res || !res.ok) return null;
    const data = (await res.json()) as {
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    };
    store(data.accessToken, data.refreshToken);
    return data;
  },

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

  integrations: () =>
    request<{ integrations: Integration[]; available: { github: boolean; leetcode: boolean } }>(
      '/v1/integrations',
    ),

  githubAuthorizeUrl: () => request<{ url: string }>('/v1/integrations/github/authorize'),

  linkLeetCode: (username: string) =>
    request<{ stats: LeetCodeStats }>('/v1/integrations/leetcode', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  leetcodeStats: (refresh = false) =>
    request<{ stats: LeetCodeStats; stale: boolean }>(
      `/v1/integrations/leetcode/stats${refresh ? '?refresh=true' : ''}`,
    ),

  disconnect: (provider: 'GITHUB' | 'LEETCODE') =>
    request<void>(`/v1/integrations/${provider.toLowerCase()}`, { method: 'DELETE' }),
};
