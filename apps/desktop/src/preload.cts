import { contextBridge, ipcRenderer } from 'electron';

/**
 * The entire surface the web app can reach.
 *
 * Deliberately tiny and explicitly enumerated: no `ipcRenderer.invoke`
 * passthrough, no `require`, no channel the renderer can name freely. If the
 * remote page is ever compromised, this is the whole blast radius.
 *
 * CommonJS (.cts) because Electron loads sandboxed preload scripts as CJS.
 */
const codelock = {
  /** True when running inside the desktop shell rather than a plain browser. */
  isDesktop: true,

  /**
   * Ask the shell to take over the screen. The session id is recorded to disk
   * so a crash or a kill re-engages the same lock on the next start.
   */
  lock: (sessionId?: string): Promise<{ locked: boolean }> =>
    ipcRenderer.invoke('codelock:lock', sessionId),

  /**
   * Ask the shell to release. The token is verified against the API's key in
   * the main process — passing a made-up string here does nothing.
   */
  unlock: (unlockToken: string): Promise<{ ok: boolean; reason?: string }> =>
    ipcRenderer.invoke('codelock:unlock', unlockToken),

  state: (): Promise<{
    locked: boolean;
    sessionId: string | null;
    platform: string;
    holdToReleaseMs: number;
  }> => ipcRenderer.invoke('codelock:state'),

  /**
   * The signed-in session, held by the main process so that the bundled
   * dashboard and the lock screen — two different origins in one window —
   * share it. Only the bundled renderer may write; both may read.
   */
  setSession: (session: { accessToken: string; refreshToken: string } | null): Promise<{ stored: boolean }> =>
    ipcRenderer.invoke('codelock:set-session', session),

  session: (): Promise<{ accessToken: string; refreshToken: string } | null> =>
    ipcRenderer.invoke('codelock:session'),

  clearSession: (): Promise<{ cleared: boolean }> => ipcRenderer.invoke('codelock:clear-session'),

  /**
   * Hand the armed deadline to the main process, so the lock still fires with
   * the window closed. Pass null to cancel a schedule that no longer exists.
   */
  schedule: (session: { sessionId: string; fireAt: string } | null): Promise<{ scheduled: boolean }> =>
    ipcRenderer.invoke('codelock:schedule', session),

  /**
   * Where the bundled renderer should send its requests. The main process owns
   * this, so a repointed config.json takes effect without rebuilding the
   * renderer bundle.
   */
  config: (): Promise<{ apiUrl: string; webUrl: string }> =>
    ipcRenderer.invoke('codelock:config'),

  /** Open a URL in the user's real browser (needed for the OAuth flow). */
  openExternal: (url: string): Promise<boolean> =>
    ipcRenderer.invoke('codelock:open-external', url),

  /**
   * Progress of the hold-Escape kill switch, so the lock screen can count it
   * down on screen. Discoverability is the point: an escape hatch nobody can
   * find is the same as no escape hatch.
   */
  onHoldProgress: (
    handler: (progress: { holding: boolean; fraction: number; msRemaining: number }) => void,
  ): (() => void) => {
    const listener = (_e: unknown, progress: Parameters<typeof handler>[0]) => handler(progress);
    ipcRenderer.on('codelock:hold-progress', listener);
    return () => ipcRenderer.removeListener('codelock:hold-progress', listener);
  },

  /**
   * The kill switch fired locally. The renderer's job is to tell the server,
   * so the session is resolved as abandoned rather than left dangling.
   */
  onKillSwitch: (handler: (info: { sessionId: string | null }) => void): (() => void) => {
    const listener = (_e: unknown, info: { sessionId: string | null }) => handler(info);
    ipcRenderer.on('codelock:kill-switch', listener);
    return () => ipcRenderer.removeListener('codelock:kill-switch', listener);
  },
};

contextBridge.exposeInMainWorld('codelock', codelock);

export type CodeLockBridge = typeof codelock;
