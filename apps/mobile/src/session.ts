import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import type { LockSessionView } from '@codelock/shared';

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

  activeLock: () => authed<{ session: LockSessionView | null }>('/v1/lock/active'),

  arm: (durationMinutes: number) =>
    authed<LockSessionView>('/v1/lock/arm', {
      method: 'POST',
      body: JSON.stringify({ durationMinutes }),
    }),
};
