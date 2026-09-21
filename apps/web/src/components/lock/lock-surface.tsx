'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Whether this lock surface resolved to dark.
 *
 * Monaco paints its own surface rather than inheriting the page's, so it has
 * to be *told*. It used to be told `alwaysDark`, on the reasoning that the
 * lock screen was dark whatever the theme said — true until the screen started
 * following the profile, and wrong from that moment on: a light lock screen
 * with a dark editor dropped into the middle of it.
 */
const LockThemeContext = createContext(true);

export function useLockIsDark(): boolean {
  return useContext(LockThemeContext);
}

/**
 * The lock screen's palette, taken from the profile rather than decided here.
 *
 * This page used to be hard-coded dark, with a good argument behind it: it is
 * the one screen the user did not choose to open, it arrives full screen and
 * often at night, and in light mode that is a white rectangle taking over the
 * display. A takeover should not also be a flashbang.
 *
 * It is now the owner's choice, made knowingly. The dashboard and this page are
 * different origins with different local storage, so the only way they can
 * agree is a value on the profile — and agreeing is the entire point of the
 * setting. If `system` resolves to light on a bright machine then this screen
 * is light, because a theme control that quietly refuses on one surface is
 * worse than a bright screen: it makes the setting untrustworthy everywhere.
 *
 * ## Why it starts dark
 *
 * Until the profile answers there is nothing to go on, and the two ways of
 * being wrong are not equal. Guessing dark and correcting to light is a screen
 * getting brighter a moment after it appears. Guessing light and correcting to
 * dark is the flashbang, delivered to someone who explicitly asked not to have
 * one. So the guess is the safe one, and it is only a guess for as long as a
 * single request takes.
 */
export function LockSurface({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resolve = (preference: string | undefined): boolean => {
      if (preference === 'LIGHT') return false;
      if (preference === 'DARK') return true;
      if (preference === 'SYSTEM') {
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
      }
      // An older server sends nothing. It also never had a light lock screen,
      // so dark is what such an install has always shown.
      return true;
    };

    void api.settings
      .timer()
      .then(({ timerConfig }) => {
        if (!cancelled) setDark(resolve(timerConfig.theme));
      })
      // An unreachable API leaves the safe guess in place. A lock screen is not
      // the place to surface a settings request that failed.
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  /*
    `dark` is a class variant (`@custom-variant dark (&:where(.dark, .dark *))`),
    so scoping it to this wrapper flips both the shared palette tokens and every
    `dark:` utility inside, without touching any stored preference. The explicit
    background and height matter: the tokens only apply inside this subtree, so
    the page background would otherwise show through around it.

    One viewport-high column, so that when the outage banner appears it takes
    its height from the page below rather than pushing the escape hint off
    screen.
  */
  return (
    <LockThemeContext.Provider value={dark}>
      <div className={`lock-surface flex h-dvh flex-col bg-bg text-fg${dark ? ' dark' : ''}`}>
        {children}
      </div>
    </LockThemeContext.Provider>
  );
}
