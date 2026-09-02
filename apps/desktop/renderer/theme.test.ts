import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  applyTheme,
  parsePreference,
  readPreference,
  themeAttribute,
  writePreference,
} from './theme';

describe('themeAttribute', () => {
  it('names the palette for an explicit choice', () => {
    expect(themeAttribute('light')).toBe('light');
    expect(themeAttribute('dark')).toBe('dark');
  });

  /**
   * The distinction the whole control rests on.
   *
   * Writing data-theme="system" would match neither override block, so the app
   * would fall through to the :root defaults and sit in light on a dark-mode
   * machine. Following the OS means having no attribute at all.
   */
  it('returns null for system so the media query takes over', () => {
    expect(themeAttribute('system')).toBeNull();
  });
});

describe('parsePreference', () => {
  it('accepts the three real values', () => {
    expect(parsePreference('light')).toBe('light');
    expect(parsePreference('dark')).toBe('dark');
    expect(parsePreference('system')).toBe('system');
  });

  // A value from an older build, a half-written entry, or nothing at all: none
  // of them should be a broken window, and all of them mean "no choice yet".
  it.each([null, '', 'Dark', 'auto', '{}'])('treats %o as no choice', (raw) => {
    expect(parsePreference(raw)).toBe('system');
  });
});

describe('applyTheme', () => {
  beforeEach(() => document.documentElement.removeAttribute('data-theme'));

  it('marks the document with an explicit choice', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('removes the attribute again when handing back to the OS', () => {
    applyTheme('dark');
    applyTheme('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});

describe('remembering the choice', () => {
  /**
   * A stub rather than jsdom's own storage.
   *
   * This workspace runs renderer specs through environmentMatchGlobs, and that
   * path ignores both environmentOptions and the per-file options docblock, so
   * jsdom stays on its opaque origin where localStorage does not exist. Rather
   * than let the environment decide whether these tests run, supply the two
   * methods the module actually uses.
   */
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    });
  });

  it('round-trips a preference', () => {
    writePreference('light');
    expect(readPreference()).toBe('light');
  });

  it('defaults to following the system before anything is chosen', () => {
    expect(readPreference()).toBe('system');
  });

  // The guard that matters in a real browser: storage blocked entirely, which
  // throws on access. Losing the preference is fine; taking the window down
  // with it is not.
  it('falls back to system when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('SecurityError');
      },
      setItem() {
        throw new Error('SecurityError');
      },
    });
    expect(() => writePreference('dark')).not.toThrow();
    expect(readPreference()).toBe('system');
  });
});
