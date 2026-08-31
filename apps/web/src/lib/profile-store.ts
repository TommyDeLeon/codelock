'use client';

import { create } from 'zustand';
import type { Language } from '@codelock/shared';
import { api } from './api';

/**
 * The local learner's preferences.
 *
 * This replaces the auth store. There are no accounts: the API serves one
 * learner on this machine and does not authenticate, so there is no identity to
 * establish and nothing to sign in to. What survived that removal is the part
 * the editor actually needs — which language to open in.
 *
 * `status` still distinguishes "not asked yet" from "asked and got nothing",
 * because the lock screen must not render a language picker default over a
 * preference it simply has not fetched.
 */

export interface Profile {
  displayName: string;
  preferredLanguage: Language;
  timezone: string;
}

interface ProfileState {
  profile: Profile | null;
  status: 'unknown' | 'loaded' | 'unavailable';
  hydrate: () => Promise<void>;
}

export const useProfile = create<ProfileState>((set) => ({
  profile: null,
  status: 'unknown',

  async hydrate() {
    try {
      const { profile } = await api.settings.profile();
      set({ profile, status: 'loaded' });
    } catch {
      // The API being unreachable is not the same as having no preference, but
      // there is nothing better to show than the editor's own default, and the
      // lock screen must render either way — a timer has already fired.
      set({ profile: null, status: 'unavailable' });
    }
  },
}));
