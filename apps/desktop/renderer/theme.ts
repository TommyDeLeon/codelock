/**
 * Choosing a palette, and remembering the choice.
 *
 * The stylesheet used to select light or dark purely through
 * `@media (prefers-color-scheme: dark)`, so the app followed the operating
 * system and offered no way to disagree with it. The web app has had a
 * three-state control the whole time; this is the same idea for the shell.
 *
 * `system` is a real option rather than the absence of one: it means "keep
 * following the OS", which differs from having picked whatever the OS happens
 * to be right now, because the OS can change later — Windows switches theme on
 * a schedule — and a stored `system` follows it while a stored `dark` does not.
 *
 * ## Where the choice actually lives
 *
 * On the profile, served by /v1/settings/timer. The dashboard and the lock
 * screen are different origins with different local storage, so a choice made
 * in one used to be invisible to the other: the shell could be light while the
 * screen it opened was dark.
 *
 * localStorage is kept, demoted to a cache. It is read before paint so the
 * window does not flash the wrong palette while the request is in flight, and
 * it is what the app falls back to when the API cannot be reached — a theme is
 * not worth failing a launch over.
 */
export type ThemePreference = 'light' | 'dark' | 'system';

const KEY = 'codelock.theme';

export const THEME_ORDER: ThemePreference[] = ['light', 'dark', 'system'];

/**
 * The `data-theme` value for a preference.
 *
 * Pure, so the mapping can be tested without a DOM. All three preferences are
 * written to the attribute, 'system' included: the stylesheet keys its
 * prefers-color-scheme block on `data-theme='system'`, so following the OS is
 * a state the reader opts into. An absent attribute means light, the default a
 * fresh install lands on.
 */
export function themeAttribute(preference: ThemePreference): ThemePreference {
  return preference;
}

/** Anything unrecognised means "no choice recorded", which is Light. */
export function parsePreference(raw: string | null): ThemePreference {
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'light';
}

/**
 * Storage that is allowed to not exist.
 *
 * The same guard the web client needed: a blocked or unavailable localStorage
 * throws on access rather than returning null, and losing a theme preference
 * must never be able to take the window down with it.
 */
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readPreference(): ThemePreference {
  try {
    return parsePreference(storage()?.getItem(KEY) ?? null);
  } catch {
    return 'light';
  }
}

export function writePreference(preference: ThemePreference): void {
  try {
    storage()?.setItem(KEY, preference);
  } catch {
    /* The choice applies to this window either way; it just will not persist. */
  }
}

/** Put the choice on the document root, where the stylesheet can see it. */
export function applyTheme(preference: ThemePreference): void {
  document.documentElement.setAttribute('data-theme', themeAttribute(preference));
}

/**
 * The profile's stored value, and this module's names for it.
 *
 * The server speaks the Prisma enum (LIGHT/DARK/SYSTEM); the stylesheet and
 * the attribute here are lowercase. Converting in one place keeps the mapping
 * from being reinvented at each call site.
 */
export function fromStored(value: string | null | undefined): ThemePreference {
  return value === 'DARK' ? 'dark' : value === 'SYSTEM' ? 'system' : 'light';
}

export function toStored(preference: ThemePreference): 'LIGHT' | 'DARK' | 'SYSTEM' {
  return preference === 'dark' ? 'DARK' : preference === 'system' ? 'SYSTEM' : 'LIGHT';
}
