'use client';

/**
 * Bridge to the Electron shell, when there is one.
 *
 * The same web app runs in three places: a plain browser, the desktop shell,
 * and a mobile WebView. Everything here degrades to a no-op in the browser, so
 * no component needs to branch on the platform.
 *
 * Note what `unlock()` does NOT do: it does not decide anything. It hands the
 * server-signed token to the main process, which verifies the signature against
 * a key this code cannot read. A tampered renderer calling unlock('') stays
 * locked.
 */

export interface CodeLockBridge {
  isDesktop: true;
  lock(): Promise<{ locked: boolean }>;
  unlock(unlockToken: string): Promise<{ ok: boolean; reason?: string }>;
  state(): Promise<{ locked: boolean; platform: string }>;
  openExternal(url: string): Promise<boolean>;
}

declare global {
  interface Window {
    codelock?: CodeLockBridge;
  }
}

export function getBridge(): CodeLockBridge | null {
  if (typeof window === 'undefined') return null;
  return window.codelock ?? null;
}

export const isDesktop = (): boolean => getBridge() !== null;

/** Take over the screen. No-op in a browser, where the route is the lock. */
export async function engageDesktopLock(): Promise<void> {
  await getBridge()?.lock();
}

/**
 * Release the shell. Returns false when there is no shell (browser) or the
 * token failed verification — callers must not treat that as success.
 */
export async function releaseDesktopLock(unlockToken: string): Promise<boolean> {
  const bridge = getBridge();
  if (!bridge) return false;
  const result = await bridge.unlock(unlockToken);
  return result.ok;
}

/**
 * Tell a hosting React Native WebView that the lock was released.
 *
 * The mobile shell keeps its own barriers up (back button swallowed, screen
 * held awake) until it sees this. Safe to call anywhere: outside a WebView the
 * global simply does not exist.
 */
export function notifyNativeUnlocked(): void {
  const rn = (window as unknown as { ReactNativeWebView?: { postMessage(data: string): void } })
    .ReactNativeWebView;
  rn?.postMessage(JSON.stringify({ type: 'codelock:unlocked' }));
}

/** Open OAuth and other outbound links in the real browser. */
export function openExternal(url: string): void {
  const bridge = getBridge();
  if (bridge) void bridge.openExternal(url);
  else window.location.href = url;
}
