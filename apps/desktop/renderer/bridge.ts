/**
 * The preload surface, as the renderer sees it.
 *
 * Mirrors src/preload.cts by hand. The preload is compiled as CommonJS for the
 * sandbox and this bundle is ESM, so they cannot share a module — but they can
 * share a shape, and a mismatch shows up as a type error here rather than as
 * `undefined is not a function` at runtime.
 */
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
  schedule(session: { sessionId: string; fireAt: string } | null): Promise<{ scheduled: boolean }>;
  config(): Promise<{ apiUrl: string; webUrl: string }>;
  openExternal(url: string): Promise<boolean>;
  onHoldProgress(
    handler: (progress: { holding: boolean; fraction: number; msRemaining: number }) => void,
  ): () => void;
  onKillSwitch(handler: (info: { sessionId: string | null }) => void): () => void;
}

declare global {
  interface Window {
    codelock?: CodeLockBridge;
  }
}

export const bridge = (): CodeLockBridge | null => window.codelock ?? null;

/** OAuth must happen in the real browser, where the user can see the address bar. */
export function openExternal(url: string): void {
  void bridge()?.openExternal(url);
}
