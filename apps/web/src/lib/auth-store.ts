'use client';

import { create } from 'zustand';
import type { AuthUser } from '@codelock/shared';
import { ApiClientError, api, tokenStore } from './api';
import { borrowDesktopSession } from './desktop-bridge';

interface AuthState {
  user: AuthUser | null;
  /** null = not yet checked. Distinguishes "loading" from "logged out". */
  status: 'unknown' | 'authenticated' | 'anonymous';
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'unknown',

  async hydrate() {
    if (!tokenStore.access && !tokenStore.refresh) {
      // Inside the desktop shell the session lives on the shell's own origin.
      // The lock screen is served from here and has empty storage of its own,
      // so borrow rather than presenting a sign-in form the user cannot
      // navigate away from.
      const borrowed = await borrowDesktopSession();
      if (!borrowed) {
        set({ status: 'anonymous', user: null });
        return;
      }
      tokenStore.set(borrowed.accessToken, borrowed.refreshToken);
    }
    try {
      const me = await api.auth.me();
      set({
        user: {
          id: me.id,
          email: me.email,
          displayName: me.displayName,
          preferredLanguage: me.preferredLanguage,
        },
        status: 'authenticated',
      });
    } catch (err) {
      // Only a rejected credential should end the session. Clearing tokens on
      // *any* failure meant a brief API outage, a dropped connection, or being
      // offline for a moment logged the user out for good — the refresh token
      // was discarded, so there was nothing left to recover with.
      const rejected = err instanceof ApiClientError && (err.status === 401 || err.status === 403);
      if (rejected) {
        tokenStore.clear();
        set({ status: 'anonymous', user: null });
        return;
      }

      // Keep the session and let the page's own queries report the outage.
      // `user` stays null so nothing renders stale identity.
      set({ status: 'authenticated', user: null });
    }
  },

  async login(email, password) {
    const user = await api.auth.login({ email, password });
    set({ user, status: 'authenticated' });
  },

  async register(input) {
    const user = await api.auth.register({
      ...input,
      // Sent so the API can evaluate the timer's active-hours window against
      // the user's local day, not UTC.
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    });
    set({ user, status: 'authenticated' });
  },

  async logout() {
    await api.auth.logout();
    set({ user: null, status: 'anonymous' });
  },
}));
