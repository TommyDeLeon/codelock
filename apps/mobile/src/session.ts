import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import type {
  AuthUser,
  Integration,
  OAuthProviderName,
  LeetCodeStats,
  LockSessionView,
  StatsSummary,
  TimerConfig,
} from '@codelock/shared';

/**
 * Native-side session storage.
 *
 * Tokens live in the Keychain (iOS) / EncryptedSharedPreferences (Android)
 * rather than AsyncStorage, because a rooted-device backup of AsyncStorage is
 * plain text. The WebView receives the access token by injection at load; it is
 * never persisted inside the WebView's own storage where a compromised page
 * could read it back later.
 */

const ACCESS_KEY = 'codelock.access';
const REFRESH_KEY = 'codelock.refresh';

/** Cached in memory so the WebView injection string can be built synchronously. */
let cachedAccess: string | null = null;

export const apiUrl = (): string =>
  (Constants.expoConfig?.extra?.apiUrl as string) ?? 'http://localhost:4000';

export function getAccessToken(): string | null {
  return cachedAccess;
}

export async function loadSession(): Promise<boolean> {
  cachedAccess = await SecureStore.getItemAsync(ACCESS_KEY);
  return cachedAccess !== null;
}

export async function saveSession(access: string, refresh: string): Promise<void> {
  cachedAccess = access;
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearSession(): Promise<void> {
  cachedAccess = null;
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

async function authed<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(cachedAccess ? { Authorization: `Bearer ${cachedAccess}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401) {
    const refreshed = await refresh();
    if (refreshed) return authed<T>(path, init);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Request failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

async function refresh(): Promise<boolean> {
  const token = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!token) return false;

  const res = await fetch(`${apiUrl()}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token }),
  });
  if (!res.ok) {
    await clearSession();
    return false;
  }
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  await saveSession(data.accessToken, data.refreshToken);
  return true;
}

export const mobileApi = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${apiUrl()}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Invalid email or password');
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
      user: { displayName: string };
    };
    await saveSession(data.accessToken, data.refreshToken);
    return data.user;
  },

  register: async (input: { email: string; password: string; displayName: string }) => {
    const res = await fetch(`${apiUrl()}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        // The device knows its own zone; asking for it would be a form field
        // that answers itself.
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      throw new Error(body?.error?.message ?? 'Could not create that account');
    }
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    };
    await saveSession(data.accessToken, data.refreshToken);
    return data.user;
  },

  /** Which provider buttons this deployment can actually complete. */
  oauthProviders: async (): Promise<OAuthProviderName[]> => {
    const res = await fetch(`${apiUrl()}/v1/auth/oauth/providers`).catch(() => null);
    if (!res?.ok) return [];
    const data = (await res.json()) as { providers: OAuthProviderName[] };
    return data.providers;
  },

  oauthStart: async (provider: OAuthProviderName) => {
    const res = await fetch(`${apiUrl()}/v1/auth/oauth/${provider.toLowerCase()}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Could not start that sign-in');
    return (await res.json()) as { url: string; handoff: string };
  },

  /**
   * Claim the finished session.
   *
   * Returns null rather than throwing while the browser half is still running:
   * a 401 here means "not yet", and the caller polls it.
   */
  oauthClaim: async (handoff: string): Promise<AuthUser | null> => {
    const res = await fetch(`${apiUrl()}/v1/auth/oauth/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handoff }),
    }).catch(() => null);

    if (!res?.ok) return null;
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    };
    await saveSession(data.accessToken, data.refreshToken);
    return data.user;
  },

  activeLock: () => authed<{ session: LockSessionView | null }>('/v1/lock/active'),

  arm: (durationMinutes: number) =>
    authed<LockSessionView>('/v1/lock/arm', {
      method: 'POST',
      body: JSON.stringify({ durationMinutes }),
    }),

  stats: () => authed<StatsSummary>('/v1/stats/summary'),

  timer: () => authed<{ timerConfig: TimerConfig }>('/v1/settings/timer'),

  saveTimer: (patch: Partial<TimerConfig>) =>
    authed<{ timerConfig: TimerConfig }>('/v1/settings/timer', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  integrations: () =>
    authed<{ integrations: Integration[]; available: { github: boolean; leetcode: boolean } }>(
      '/v1/integrations',
    ),

  linkLeetCode: (username: string) =>
    authed<{ stats: LeetCodeStats }>('/v1/integrations/leetcode', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),

  leetcodeStats: (refresh = false) =>
    authed<{ stats: LeetCodeStats; stale: boolean }>(
      `/v1/integrations/leetcode/stats${refresh ? '?refresh=true' : ''}`,
    ),

  disconnect: (provider: 'GITHUB' | 'LEETCODE') =>
    authed<void>(`/v1/integrations/${provider.toLowerCase()}`, { method: 'DELETE' }),
};
