import { app, BrowserWindow, globalShortcut, ipcMain, powerMonitor, shell, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyUnlockToken } from './unlock-verifier.js';
import { canVerifyUnlocks, configPath, loadConfig } from './config.js';
import { fileLockStore, isLive, newLock, type LockStateStore } from './lock-state.js';
import { HoldToRelease, HOLD_TO_RELEASE_MS } from './kill-switch.js';
import { reassertCovers, removeCovers, syncCovers } from './display-cover.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * CodeLock desktop shell.
 *
 * The web app is the whole UI; this process exists for the one thing a browser
 * cannot do — make the lock screen genuinely hard to dismiss. It owns:
 *
 *   - a kiosk, always-on-top, all-workspaces window
 *   - an opaque cover on every other display, kept in sync with hotplug
 *   - suppression of the usual escapes (Alt+F4, Ctrl+W, F11, DevTools)
 *   - refusal to close or minimise while locked, and relaunch if killed
 *   - lock state persisted to disk, so a crash or a kill does not unlock
 *   - server-verified unlock: the renderer cannot simply assert it is done
 *   - one documented way out: hold Escape for ten seconds
 *
 * What it deliberately does NOT claim: this is not unbypassable. Ctrl+Alt+Del
 * on Windows, a forced power-off, booting to another OS, or deleting the state
 * file from AppData all defeat it, and no userland application can prevent
 * that. It is a strong commitment device, not a kernel-level parental control.
 * See docs/ESCAPE-MATRIX.md for what was tried and what worked.
 */

// Electron derives userData from the package name, which in this workspace is
// '@codelock/desktop' — that would put settings in AppData/Roaming/@codelock/
// desktop. Set it before anything reads a path.
app.setName('CodeLock');

const isDev = !app.isPackaged;

// Resolved after app.whenReady(): userData is not available before that.
let WEB_URL = 'http://localhost:3000';

let mainWindow: BrowserWindow | null = null;
/** Single source of truth for "is the machine currently locked" in memory. */
let locked = false;
/** The same fact on disk, so it survives a crash. */
let lockStore: LockStateStore | null = null;
let lockedSessionId: string | null = null;
/** Set only by a verified unlock or the kill switch; gates the relaunch-on-quit. */
let releasedIntentionally = false;

const holdToRelease = new HoldToRelease();

// Windows and Linux: a second launch focuses the existing window instead of
// starting a rival instance that would not know about the lock.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow(): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const window = new BrowserWindow({
    width: Math.min(1440, width),
    height: Math.min(900, height),
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#0e0e0d',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      // Non-negotiable: the renderer loads remote content, so it gets no Node.
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      // In a packaged build there is no legitimate reason to open DevTools, and
      // an open console next to an unlock IPC channel is an invitation.
      devTools: isDev,
    },
  });

  window.once('ready-to-show', () => window.show());

  // Refuse to close while locked. Quitting is otherwise the simplest bypass.
  window.on('close', (event) => {
    if (locked) {
      event.preventDefault();
      window.focus();
    }
  });
  // 'minimize' is not cancellable, so undo it rather than prevent it. In
  // practice setMinimizable(false) means this rarely fires while locked.
  window.on('minimize', () => {
    if (locked) {
      window.restore();
      window.focus();
    }
  });
  // Losing focus while locked pulls the window straight back, and shoves the
  // covers up with it — whatever stole focus may have stolen z-order too.
  window.on('blur', () => {
    if (locked) {
      window.focus();
      reassertCovers();
    }
  });

  // External links open in the real browser, never inside the shell — the
  // GitHub OAuth flow depends on the user seeing the actual address bar.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  // Navigation away from our origin is how a compromised page would escape.
  window.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== new URL(WEB_URL).origin) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  // The kill switch lives here rather than on a global shortcut: a global
  // Escape hook would swallow Escape system-wide, and we only want it while
  // the lock screen has the keyboard.
  window.webContents.on('before-input-event', (_event, input) => {
    if (!locked) return;
    const now = Date.now();

    if (input.type === 'keyUp') {
      holdToRelease.keyUp(input.key);
      sendHoldProgress(now);
      return;
    }
    if (input.type !== 'keyDown') return;

    if (holdToRelease.keyDown(input.key, now)) {
      void killSwitchRelease();
      return;
    }
    sendHoldProgress(now);
  });

  void window.loadURL(WEB_URL);
  return window;
}

function sendHoldProgress(now: number): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('codelock:hold-progress', holdToRelease.progress(now));
}

/**
 * Enter lock mode.
 *
 * Kiosk mode is what prevents Alt+Tab and the taskbar on Windows;
 * `screen-saver` level puts the window above the macOS Dock and menu bar;
 * `setVisibleOnAllWorkspaces` stops "just switch desktops" from working.
 *
 * The disk write happens first. If the process dies between the write and the
 * window changes, the next boot re-engages — the opposite ordering would lose
 * the lock in exactly that window.
 */
function engageLock(sessionId: string | null): void {
  if (!mainWindow) return;

  if (sessionId) {
    lockedSessionId = sessionId;
    lockStore?.write(newLock(sessionId));
  }

  if (locked) {
    // Already locked: re-assert rather than return, since this is also the
    // path taken on resume and on display changes.
    reassertLock();
    return;
  }

  locked = true;
  releasedIntentionally = false;
  holdToRelease.reset();

  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setClosable(false);
  mainWindow.setMinimizable(false);
  mainWindow.setFullScreenable(true);
  mainWindow.focus();

  syncCovers(mainWindow);
  registerEscapeSuppression();
}

/** Put every barrier back up. Cheap, idempotent, and safe to call often. */
function reassertLock(): void {
  if (!locked || !mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.focus();
  syncCovers(mainWindow);
}

function releaseLock(): void {
  locked = false;
  lockedSessionId = null;
  releasedIntentionally = true;
  holdToRelease.reset();
  lockStore?.clear();
  removeCovers();

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setVisibleOnAllWorkspaces(false);
    mainWindow.setClosable(true);
    mainWindow.setMinimizable(true);
  }

  globalShortcut.unregisterAll();
}

/**
 * The escape hatch fired.
 *
 * The overlay comes down locally, and the renderer is told so it can resolve
 * the session as abandoned on the server. It is not silent: an abandoned
 * session counts as a failure for adaptive difficulty, which is what keeps
 * this from becoming the default way to dismiss the lock.
 */
async function killSwitchRelease(): Promise<void> {
  const sessionId = lockedSessionId;
  releaseLock();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('codelock:kill-switch', { sessionId });
  }
  console.warn(`CodeLock: kill switch used${sessionId ? ` for session ${sessionId}` : ''}.`);
}

/**
 * Swallow the shortcuts that would otherwise dismiss the window.
 *
 * Registered only while locked: holding these globally would hijack the user's
 * machine during normal use, which would be hostile and is not the deal.
 */
function registerEscapeSuppression(): void {
  const swallow = [
    'Alt+F4',
    'CommandOrControl+W',
    'CommandOrControl+Q',
    'CommandOrControl+M',
    'CommandOrControl+R',
    'CommandOrControl+Shift+R',
    'F11',
    'CommandOrControl+Shift+I',
    'CommandOrControl+Alt+I',
    'F12',
  ];
  for (const accelerator of swallow) {
    // Registering with a no-op handler consumes the key without acting on it.
    globalShortcut.register(accelerator, () => mainWindow?.focus());
  }

  // Alt+Tab and the Windows key cannot be intercepted from userland; kiosk mode
  // is what actually keeps the window in front when they are pressed.
}

// --- IPC ------------------------------------------------------------------

/**
 * The renderer asks to lock. It is trusted for this direction only: locking
 * more than intended is annoying, never a security hole.
 */
ipcMain.handle('codelock:lock', (_event, sessionId: unknown) => {
  engageLock(typeof sessionId === 'string' ? sessionId : null);
  return { locked };
});

/**
 * The renderer asks to unlock, and must prove it earned the right.
 *
 * The token is a JWT signed by the API with a key the renderer never sees, and
 * it is verified here in the main process. A patched renderer, an injected
 * script, or DevTools calling this by hand all fail signature verification — so
 * a fake "I solved it" cannot open the machine.
 */
ipcMain.handle('codelock:unlock', async (_event, unlockToken: unknown) => {
  if (typeof unlockToken !== 'string') return { ok: false, reason: 'malformed' };

  const verdict = await verifyUnlockToken(unlockToken);
  if (!verdict.ok) return { ok: false, reason: verdict.reason };

  releaseLock();
  return { ok: true };
});

ipcMain.handle('codelock:state', () => ({
  locked,
  sessionId: lockedSessionId,
  platform: process.platform,
  holdToReleaseMs: HOLD_TO_RELEASE_MS,
}));

ipcMain.handle('codelock:open-external', (_event, url: unknown) => {
  if (typeof url !== 'string') return false;
  const parsed = new URL(url);
  // Only ever hand http(s) to the OS; a file:// or custom scheme here would be
  // an arbitrary-execution hole.
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
  void shell.openExternal(url);
  return true;
});

// --- lifecycle ------------------------------------------------------------

void app.whenReady().then(() => {
  const config = loadConfig();
  WEB_URL = config.webUrl;
  lockStore = fileLockStore(path.join(app.getPath('userData'), 'lock-state.json'));

  // A build with no key can never release the lock, which would trap the user
  // behind an overlay they cannot dismiss. Refuse to arm rather than discover
  // that at unlock time.
  if (!canVerifyUnlocks(config)) {
    logStartupProblem(config.webUrl);
  }

  mainWindow = createWindow();

  // A lock that was live when the process died comes straight back up. The
  // renderer re-checks with the server once it loads, and either confirms it
  // or unlocks properly through the normal verified path.
  const persisted = lockStore.read();
  if (isLive(persisted)) {
    mainWindow.once('ready-to-show', () => engageLock(persisted!.sessionId));
  } else if (persisted) {
    // Stale debris from a much older run. Do not honour it, do not keep it.
    lockStore.clear();
  }

  // Plugging in a monitor mid-lock must not open a window onto the desktop.
  screen.on('display-added', () => reassertLock());
  screen.on('display-removed', () => reassertLock());
  screen.on('display-metrics-changed', () => reassertLock());

  // Locking the OS session, sleeping, or switching users and coming back must
  // not lose the overlay. Re-assert rather than just focus: kiosk state and
  // always-on-top level do not reliably survive a display sleep on Windows.
  powerMonitor.on('unlock-screen', () => reassertLock());
  powerMonitor.on('resume', () => reassertLock());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', (event) => {
  if (locked) event.preventDefault();
});

/**
 * Killed while locked? Come back.
 *
 * `before-quit` stops a polite quit, but nothing stops SIGKILL or Task
 * Manager's End Task. `will-quit` still runs for most forced paths, and
 * relaunching from it turns "kill the process" from a one-click bypass into a
 * loop the user has to fight. It is not unbeatable — nothing in userland is —
 * but it is no longer the easy answer.
 */
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (locked && !releasedIntentionally) {
    app.relaunch();
  }
});

/**
 * Tell the user where to fix it, in the one place they will look.
 *
 * Silently starting an app that cannot unlock is the worst outcome here: the
 * timer still fires and the overlay still appears.
 */
function logStartupProblem(webUrl: string): void {
  console.error(
    [
      'CodeLock is not configured to verify unlocks.',
      `Edit ${configPath()}`,
      "and set unlockSecret (matching the API's JWT_UNLOCK_SECRET) or",
      'unlockPublicKey, then restart.',
      `Current webUrl: ${webUrl}`,
    ].join('\n'),
  );
}

// Dev convenience only: never ship a build that trusts a local web server.
if (isDev) {
  app.on('web-contents-created', (_e, contents) => {
    contents.on('before-input-event', (event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === 'i' && !locked) {
        contents.openDevTools({ mode: 'detach' });
        event.preventDefault();
      }
    });
  });
}
