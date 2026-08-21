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

export interface HoldProgress {
  holding: boolean;
  fraction: number;
  msRemaining: number;
}

export interface CodeLockBridge {
  isDesktop: true;
  lock(sessionId?: string): Promise<{ locked: boolean }>;
  unlock(unlockToken: string): Promise<{ ok: boolean; reason?: string }>;
  state(): Promise<{
    locked: boolean;
    sessionId: string | null;
    platform: string;
    holdToReleaseMs: number;
  }>;
  openExternal(url: string): Promise<boolean>;
  onHoldProgress(handler: (progress: HoldProgress) => void): () => void;
  onKillSwitch(handler: (info: { sessionId: string | null }) => void): () => void;
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

/**
 * Take over the screen. No-op in a browser, where the route is the lock.
 *
 * The session id travels with it so the shell can write the lock to disk: a
 * crash or a kill then re-engages the same lock on the next start instead of
 * handing the machine back.
 */
export async function engageDesktopLock(sessionId?: string): Promise<void> {
  await getBridge()?.lock(sessionId);
}

/**
 * Subscribe to the hold-Escape kill switch firing in the shell.
 *
 * Returns an unsubscribe function, or a no-op outside the desktop app.
 */
export function onKillSwitch(handler: (info: { sessionId: string | null }) => void): () => void {
  return getBridge()?.onKillSwitch(handler) ?? (() => {});
}

/** Progress of the hold-Escape countdown, for rendering it on screen. */
export function onHoldProgress(handler: (progress: HoldProgress) => void): () => void {
  return getBridge()?.onHoldProgress(handler) ?? (() => {});
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
