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

  /** Ask the shell to take over the screen. */
  lock: (): Promise<{ locked: boolean }> => ipcRenderer.invoke('codelock:lock'),

  /**
   * Ask the shell to release. The token is verified against the API's key in
   * the main process — passing a made-up string here does nothing.
   */
  unlock: (unlockToken: string): Promise<{ ok: boolean; reason?: string }> =>
    ipcRenderer.invoke('codelock:unlock', unlockToken),

  state: (): Promise<{ locked: boolean; platform: string }> =>
    ipcRenderer.invoke('codelock:state'),

  /** Open a URL in the user's real browser (needed for the OAuth flow). */
  openExternal: (url: string): Promise<boolean> =>
    ipcRenderer.invoke('codelock:open-external', url),
};

contextBridge.exposeInMainWorld('codelock', codelock);

export type CodeLockBridge = typeof codelock;
