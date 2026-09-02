import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  net,
  powerMonitor,
  protocol,
  shell,
  screen,
} from 'electron';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { verifyUnlockToken } from './unlock-verifier.js';
import { canVerifyUnlocks, configPath, loadConfig } from './config.js';
import {
  classifyStartup,
  fileLockStore,
  isLive,
  newLock,
  recordInterruption,
  unlockTokenOpensLock,
  type LockStateStore,
} from './lock-state.js';
import { needsCoverReassert, shouldInterceptWhileLocked } from './lock-guards.js';
import { HoldToRelease, HOLD_TO_RELEASE_MS } from './kill-switch.js';
import { reassertCovers, removeCovers, syncCovers } from './display-cover.js';
import { initUpdater, installIfIdle } from './updater.js';
import { engageOnServer } from './server-lock.js';
import { diagnose, ensureBackend, isBackendUp, readBackendStatus } from './backend.js';
import {
  clearSession as clearStoredSession,
  readSession,
  writeSession,
  type StoredSession,
} from './session-store.js';
import {
  createTray,
  destroyTray,
  refreshTray,
  setAutoStart,
  startedInBackground,
  type TrayActions,
} from './background.js';

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


/**
 * Where the bundled renderer lives.
 *
 * A custom standard scheme rather than file://, for two reasons: file:// pages
 * have an opaque origin, so localStorage and a CORS-able fetch to the API both
 * break; and a real origin lets the navigation guard below name exactly the two
 * places this window is ever allowed to be.
 */
const APP_SCHEME = 'app';
const APP_ORIGIN = `${APP_SCHEME}://codelock`;
const APP_ENTRY = `${APP_ORIGIN}/index.html`;

/** Vite's dev server, used in place of the bundle when running `npm run dev`. */
const DEV_RENDERER = process.env.CODELOCK_RENDERER_URL ?? null;

// Must run before 'ready'. Without `standard` the scheme gets an opaque origin
// and the renderer loses both localStorage and a usable Origin header.
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);


// Resolved after app.whenReady(): userData is not available before that.
let WEB_URL = 'http://localhost:3000';
let API_URL = 'http://localhost:4000';

let mainWindow: BrowserWindow | null = null;
/** Single source of truth for "is the machine currently locked" in memory. */
let locked = false;
/** The same fact on disk, so it survives a crash. */
let lockStore: LockStateStore | null = null;
let lockedSessionId: string | null = null;
/** Set only by a verified unlock or the kill switch; gates the relaunch-on-quit. */
let releasedIntentionally = false;
/**
 * The app now outlives its window, so "no windows left" no longer means "quit".
 * Only an explicit Quit from the tray sets this.
 */
let quitting = false;

const holdToRelease = new HoldToRelease();

/**
 * The armed deadline, held in the main process.
 *
 * The renderer cannot own this. The user closes the window, and a lock that
 * only fires while a page is open is not a lock — it is a reminder that any
 * unmotivated person can silence by pressing the X. The renderer reports the
 * deadline it learned from the server; this process is what actually waits.
 */
let fireTimer: NodeJS.Timeout | null = null;

/**
 * Can this install actually release a lock?
 *
 * False when config.json carries neither unlockSecret nor unlockPublicKey,
 * which is what a build made with no key baked in produces. Until it is true,
 * this process refuses to START a lock — see refuseToLock below.
 */
let canUnlock = false;

/**
 * Refuse to begin a lock this install could never end.
 *
 * Without a verification key the timer still fires and the overlay still
 * appears, and then a correct, fast solution cannot open the machine: the
 * unlock token verifies against nothing. The only way out is the kill switch,
 * which costs the user a recorded failure for a fault that was never theirs.
 * Locking someone out with no way back is worse than not locking at all.
 *
 * This deliberately guards only the paths that START a lock. A lock already
 * persisted from an earlier run is still restored, because doing otherwise
 * would turn "delete a line from config.json and restart" into the simplest
 * bypass in the product. The kill switch remains the exit for that case, as it
 * always was.
 */
function refuseToLock(): boolean {
  if (canUnlock) return false;
  console.error('CodeLock refused to lock: no unlock key configured. See', configPath());
  showWindow();
  void dialog.showMessageBox({
    type: 'error',
    title: 'CodeLock cannot unlock',
    message: 'CodeLock did not lock, because it could not have unlocked.',
    detail:
      'This build has no unlock key, so a correct solution could not release the ' +
      'screen and you would be stuck behind it.\n\n' +
      `Edit ${configPath()} and set unlockSecret to the same value as the ` +
      "server's JWT_UNLOCK_SECRET, then restart CodeLock.",
    buttons: ['OK'],
  });
  return true;
}

/**
 * Say something useful if the backend never arrives.
 *
 * Docker takes its time, and a dialog that fires the instant a port is closed
 * would accuse it of being broken while it is merely starting. So this waits,
 * polling, and only speaks if the wait was in vain — and then it says which of
 * the several possible causes it actually is, using the note the launcher
 * leaves behind. "Install Docker Desktop" and "wait, it is starting" are not
 * things the user should have to tell apart themselves.
 */
async function reportBackendIfStillDown(): Promise<void> {
  const deadline = Date.now() + 3 * 60_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    if (await isBackendUp(API_URL)) return;
  }

  // Not userData: that is Roaming, and the launcher writes its logs to Local
  // alongside the service output. Reading the wrong one produced a null status
  // and therefore the generic message, which is exactly the failure this
  // function exists to avoid.
  const logsDir = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, 'CodeLock', 'logs')
    : path.join(app.getPath('userData'), 'logs');

  const status = readBackendStatus(path.join(logsDir, 'backend-status.json'), (p) =>
    readFileSync(p, 'utf8'),
  );
  const { title, detail, installDocker } = diagnose(status);

  showWindow();
  const { response } = await dialog.showMessageBox({
    type: installDocker ? 'warning' : 'info',
    title,
    message: title,
    detail,
    buttons: installDocker ? ['Get Docker Desktop', 'Not now'] : ['OK'],
    defaultId: 0,
    cancelId: installDocker ? 1 : 0,
  });

  if (installDocker && response === 0) {
    void shell.openExternal('https://www.docker.com/products/docker-desktop/');
  }
}

/**
 * Take the screen, but only once the server agrees the lock is on.
 *
 * The ordering here is the whole point. Engaging locally first produced a
 * covered screen with the session still ARMED on the server, and a submission
 * against an ARMED session is refused — so the lock could not be solved out of
 * at all. Asking first means that by the time the overlay appears, a correct
 * answer can always mint an unlock token.
 *
 * On failure the screen is NOT taken. A lock nobody can open is worse than a
 * lock that did not fire: the timer stays armed and this is tried again.
 */
async function takeScreenFor(sessionId: string): Promise<void> {
  if (locked) return;
  if (refuseToLock()) return;

  const engaged = await engageOnServer(sessionId, { apiUrl: API_URL });

  if (!engaged.ok) {
    console.error(
      `CodeLock: not taking the screen — the server did not confirm the lock (${engaged.reason}).`,
      engaged.detail ?? '',
    );
    // 'refused' means the server deliberately said no: cancelled, paused, or
    // not actually due. Retrying that would spin against a settled answer.
    // Anything else is transient, so keep trying rather than silently dropping
    // a lock the user asked for.
    if (engaged.reason !== 'refused') {
      setTimeout(() => void takeScreenFor(sessionId), 15_000);
    }
    return;
  }

  showWindow();
  engageLock(sessionId);
}

function scheduleLock(sessionId: string, fireAt: number): void {
  clearScheduledLock();
  // Already past: fire on the next tick rather than never.
  const delay = Math.max(0, fireAt - Date.now());
  fireTimer = setTimeout(() => {
    fireTimer = null;
    void takeScreenFor(sessionId);
  }, delay);
}

function clearScheduledLock(): void {
  if (fireTimer) clearTimeout(fireTimer);
  fireTimer = null;
}

// Windows and Linux: a second launch focuses the existing window instead of
// starting a rival instance that would not know about the lock.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // Closing the window does not quit — the process lives on behind the tray,
  // and `mainWindow` still points at a *destroyed* BrowserWindow. Touching
  // that reference throws "Object has been destroyed" and takes the whole main
  // process down, so the second launch goes through showWindow(), which
  // recreates the window when there is nothing left to focus.
  app.on('second-instance', () => {
    showWindow();
  });
}

/**
 * The only two places this window may navigate: the bundled renderer, and the
 * web app that serves the lock screen. A dev build also trusts the Vite server
 * it was told to load.
 */
function isOwnOrigin(url: string): boolean {
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return false;
  }
  if (origin === APP_ORIGIN) return true;
  if (origin === new URL(WEB_URL).origin) return true;
  return DEV_RENDERER !== null && origin === new URL(DEV_RENDERER).origin;
}

/** True for the web app's origin, whatever path is attached. */
function isWebOrigin(url: string): boolean {
  try {
    return new URL(url).origin === new URL(WEB_URL).origin;
  } catch {
    return false;
  }
}

/** Put the window back on the bundled renderer after a lock resolves. */
function showRenderer(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  void mainWindow.loadURL(DEV_RENDERER ?? APP_ENTRY);
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
    // Set explicitly rather than relying on the icon electron-builder stamps
    // into the executable: `rcedit` does that, and a build made with
    // signAndEditExecutable disabled skips it, leaving Electron's own icon in
    // the title bar and taskbar. This makes the window right either way.
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
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
    if (shouldInterceptWhileLocked('close', locked)) {
      event.preventDefault();
      window.focus();
    }
  });
  // 'minimize' is not cancellable, so undo it rather than prevent it. In
  // practice setMinimizable(false) means this rarely fires while locked.
  window.on('minimize', () => {
    if (shouldInterceptWhileLocked('minimize', locked)) {
      window.restore();
      window.focus();
    }
  });
  // Losing focus while locked pulls the window straight back, and shoves the
  // covers up with it — whatever stole focus may have stolen z-order too.
  window.on('blur', () => {
    if (shouldInterceptWhileLocked('blur', locked)) {
      window.focus();
      if (needsCoverReassert('blur')) reassertCovers();
    }
  });

  // External links open in the real browser, never inside the shell — the
  // GitHub OAuth flow depends on the user seeing the actual address bar.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  // Navigation away from our origins is how a compromised page would escape.
  // Exactly two are allowed: the bundled renderer, and the web app that serves
  // the lock screen. Anything else is handed to the real browser.
  window.webContents.on('will-navigate', (event, url) => {
    if (!isOwnOrigin(url)) {
      event.preventDefault();
      void shell.openExternal(url);
      return;
    }

    // The web origin serves exactly one page this window may show: /lock, which
    // is the editor. Everything else there is the marketing site, and a
    // storefront has no business inside an installed application — the visitor
    // has already installed the thing.
    //
    // The lock page navigates itself to '/' in three places: the kill switch,
    // "Back to CodeLock", and the no-session branch. Each one used to land the
    // window on the landing page, complete with a Download button. Rather than
    // fix three call sites and hope a fourth is never added, the rule is
    // enforced here, where the window actually changes.
    if (isWebOrigin(url) && new URL(url).pathname !== '/lock') {
      event.preventDefault();
      showRenderer();
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

  // The bundled renderer owns everything except the lock screen, which is
  // loaded from the web app only while a lock is live (see engageLock).
  void window.loadURL(DEV_RENDERER ?? APP_ENTRY);
  return window;
}

const trayActions: TrayActions = {
  isLocked: () => locked,
  onOpen: () => showWindow(),
  onQuit: () => {
    // Blocked during a lock by before-quit as well; this is the visible half.
    if (locked) return;
    quitting = true;
    app.quit();
  },
};

/** Bring the window back from the tray, creating it if it was closed. */
function showWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
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
  // Null and destroyed are different failures and both happen here: the window
  // is gone after a close, and the reference outlives it. Every other function
  // that touches mainWindow checks both.
  if (!mainWindow || mainWindow.isDestroyed()) return;

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
  clearScheduledLock();
  holdToRelease.reset();

  // The lock screen is a code editor and stays on the web app; only this
  // moment is allowed to put the window there.
  void mainWindow.loadURL(new URL('/lock', WEB_URL).toString());

  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setClosable(false);
  mainWindow.setMinimizable(false);
  mainWindow.setFullScreenable(true);
  mainWindow.focus();

  syncCovers(mainWindow);
  registerEscapeSuppression();
  refreshTray(trayActions);
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
  clearScheduledLock();
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
  showRenderer();
  refreshTray(trayActions);

  // An update that arrived mid-session lands now rather than waiting for the
  // next six-hourly check. Never during a lock: restarting the shell under a
  // live overlay is the one thing the updater must not do.
  installIfIdle(() => locked);
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
ipcMain.handle('codelock:lock', async (_event, sessionId: unknown) => {
  const id = typeof sessionId === 'string' ? sessionId : null;

  // Re-asserting an existing lock is always allowed; only a new one is refused.
  if (locked) {
    engageLock(id);
    return { locked, canUnlock };
  }

  // This is the path the dashboard takes when its countdown reaches zero, and
  // it used to engage locally without telling the server — which is how the
  // screen ended up covered over a session the API still called ARMED, with no
  // unlock token obtainable. It goes through the same confirmation as the
  // main-process deadline now.
  if (id) {
    await takeScreenFor(id);
    return { locked, canUnlock };
  }

  if (refuseToLock()) return { locked: false, canUnlock: false };
  engageLock(null);
  return { locked, canUnlock };
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

  // A valid signature only proves the API issued this token. It does not prove
  // the token was issued for *this* lock. Without this check the tokens are
  // interchangeable: solve one problem, keep the token, and replay it against a
  // later lock inside its five-minute lifetime — which defeats the whole
  // commitment device, because the second lock then costs nothing to open.
  //
  // The token names the session it was earned for, so require that to match the
  // session currently held. A lock with no session id was never engaged by this
  // process, and nothing should release it.
  if (!unlockTokenOpensLock(verdict.sessionId, lockedSessionId)) {
    return { ok: false, reason: 'wrong-session' };
  }

  releaseLock();
  return { ok: true };
});

/**
 * The renderer hands over the deadline it read from the server.
 *
 * Trusted in this direction only, exactly like 'codelock:lock': the worst a
 * lying renderer can do here is lock the machine sooner than it should, which
 * is annoying rather than a bypass. Unlocking still requires a signed token.
 */
ipcMain.handle('codelock:schedule', (_event, payload: unknown) => {
  const { sessionId, fireAt } =
    (payload as { sessionId?: unknown; fireAt?: unknown } | null) ?? {};

  if (typeof sessionId !== 'string' || typeof fireAt !== 'string') {
    clearScheduledLock();
    return { scheduled: false };
  }

  const at = Date.parse(fireAt);
  if (Number.isNaN(at)) return { scheduled: false };

  scheduleLock(sessionId, at);
  return { scheduled: true };
});

/**
 * The session, shared between the bundled dashboard and the lock screen.
 *
 * Writing is restricted to the bundled renderer. The lock screen is remote
 * content, and a compromised page there being able to *overwrite* the stored
 * session would let it swap in an attacker's account — or, worse, hand its own
 * token to the next thing that asked. Reading is allowed from both, because
 * both are pages this shell put on screen itself.
 */
function isBundledRenderer(event: Electron.IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url ?? '';
  if (DEV_RENDERER && url.startsWith(DEV_RENDERER)) return true;
  return url.startsWith(APP_ORIGIN);
}

ipcMain.handle('codelock:set-session', (event, payload: unknown) => {
  if (!isBundledRenderer(event)) return { stored: false };

  const { accessToken, refreshToken } =
    (payload as Partial<StoredSession> | null) ?? {};
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    clearStoredSession();
    return { stored: false };
  }

  writeSession({ accessToken, refreshToken });
  return { stored: true };
});

ipcMain.handle('codelock:session', (event) => {
  // Only ever handed to our own two origins; will-navigate guarantees the
  // window cannot be anywhere else.
  if (!isBundledRenderer(event) && new URL(event.senderFrame?.url ?? 'about:blank').origin !== new URL(WEB_URL).origin) {
    return null;
  }
  return readSession();
});

ipcMain.handle('codelock:clear-session', (event) => {
  if (!isBundledRenderer(event)) return { cleared: false };
  clearStoredSession();
  return { cleared: true };
});

ipcMain.handle('codelock:state', () => ({
  locked,
  canUnlock,
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
  API_URL = config.apiUrl;
  serveRenderer();

  // Start the backend if the user configured one and it is not already up.
  // Deliberately not awaited: the services take seconds to bind, and holding
  // the window closed behind them would make every launch feel broken. The
  // renderer already polls and shows an outage banner until they answer.
  void ensureBackend({ apiUrl: API_URL, command: config.backendCommand })
    .then(async (outcome) => {
      if (outcome === 'already-running' || outcome === 'not-configured') return;
      if (outcome === 'failed') {
        console.error('CodeLock: backendCommand could not be launched. See', configPath());
      } else {
        console.log('CodeLock: starting the backend.');
      }
      await reportBackendIfStillDown();
    })
    .catch((err) => console.error('CodeLock: backend startup failed.', err));
  lockStore = fileLockStore(path.join(app.getPath('userData'), 'lock-state.json'));

  // A build with no key can never release the lock, which would trap the user
  // behind an overlay they cannot dismiss. Refuse to arm rather than discover
  // that at unlock time.
  canUnlock = canVerifyUnlocks(config);
  if (!canUnlock) {
    logStartupProblem(config.webUrl);
    // console.error goes nowhere a user launching from the Start menu or the
    // Dock will ever look, and this is the one problem they must not discover
    // by being locked out. Say it in a window.
    void dialog.showMessageBox({
      type: 'warning',
      title: 'CodeLock is not configured',
      message: 'CodeLock cannot unlock yet, so it will not lock.',
      detail:
        'No unlock key is configured, so this install could not release the screen ' +
        'after a correct solution. Timers will refuse to start until it is set.\n\n' +
        `Edit ${configPath()} and set unlockSecret to the same value as the ` +
        "server's JWT_UNLOCK_SECRET, then restart CodeLock.",
      buttons: ['OK'],
    });
  }

  // Continuous by default. The timer is worthless if it only runs while the
  // user happens to have the window open, and worse than worthless if it
  // silently stops at every reboot.
  // Electron installs a default File/Edit/View/Window/Help menu, which is
  // Chromium's developer furniture rather than this product's: every entry is
  // either irrelevant (Reload, Toggle DevTools) or actively hostile to a lock
  // screen. The window has no menu of its own to offer, so it gets none.
  // Clipboard and text-editing shortcuts keep working — Chromium handles those
  // natively, not through the menu's accelerators.
  Menu.setApplicationMenu(null);

  setAutoStart(true);
  createTray(trayActions);

  mainWindow = createWindow();

  // Started by the OS at login: keep the window down and just watch the clock.
  // The tray icon is the handle, and a firing lock raises the window anyway.
  if (startedInBackground()) {
    mainWindow.once('ready-to-show', () => mainWindow?.hide());
  }

  // Packaged builds only; a dev build pointed at the release feed would try to
  // "upgrade" itself to the last published version.
  initUpdater(() => locked);

  // A lock that was live when the process died comes straight back up. The
  // renderer re-checks with the server once it loads, and either confirms it
  // or unlocks properly through the normal verified path.
  const startup = classifyStartup(lockStore.read());
  if (startup.kind === 'interrupted') {
    // Rebooting while locked frees the machine: the OS tears the process down
    // and the desktop comes back unlocked, with nothing given a chance to
    // record it. All this launch can observe is that the lock file outlived
    // its process, so stamp the interruption before re-engaging. Without it an
    // interrupted session is indistinguishable from one that ran to
    // completion, and the count is the only evidence the machine was free.
    lockStore.write(recordInterruption(startup.lock));
  }

  const persisted = lockStore.read();
  if (isLive(persisted)) {
    // Through takeScreenFor, not engageLock: a restored lock is the case where
    // no client has *ever* told the server the timer fired, so restoring the
    // overlay without confirming would rebuild exactly the state nobody can
    // solve their way out of.
    mainWindow.once('ready-to-show', () => void takeScreenFor(persisted!.sessionId));
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

/**
 * Closing the window does NOT quit.
 *
 * This is the difference between a focus timer and a reminder: the process has
 * to be alive at the moment the deadline passes, and the user will close this
 * window. The tray icon is what keeps that from being a hidden process.
 */
app.on('window-all-closed', () => {
  if (quitting) app.quit();
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
  destroyTray();
  if (locked && !releasedIntentionally) {
    app.relaunch();
  }
});

/**
 * Serve the bundled renderer over the app:// scheme.
 *
 * Paths are resolved inside the bundle directory and then checked to still be
 * inside it, so a crafted `app://codelock/../../` cannot read the user's disk.
 * Unknown paths fall back to index.html, which is what a single-page app needs.
 */
function serveRenderer(): void {
  const root = path.join(__dirname, '..', 'dist-renderer');

  protocol.handle(APP_SCHEME, (request) => {
    const requested = decodeURIComponent(new URL(request.url).pathname);
    const resolved = path.normalize(path.join(root, requested));
    const inside = resolved === root || resolved.startsWith(root + path.sep);
    const file = inside && path.extname(resolved) ? resolved : path.join(root, 'index.html');
    return net.fetch(pathToFileURL(file).toString());
  });
}

/** The API the bundled renderer talks to, and where the lock screen lives. */
ipcMain.handle('codelock:config', () => ({ apiUrl: API_URL, webUrl: WEB_URL }));

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
