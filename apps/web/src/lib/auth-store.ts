'use client';

import { create } from 'zustand';
import type { AuthUser } from '@codelock/shared';
import { api, tokenStore } from './api';

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
      set({ status: 'anonymous', user: null });
      return;
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
    } catch {
      tokenStore.clear();
      set({ status: 'anonymous', user: null });
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
