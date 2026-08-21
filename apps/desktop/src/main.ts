import { app, BrowserWindow, globalShortcut, ipcMain, powerMonitor, shell, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyUnlockToken } from './unlock-verifier.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * CodeLock desktop shell.
 *
 * The web app is the whole UI; this process exists for the one thing a browser
 * cannot do — make the lock screen genuinely hard to dismiss. It owns:
 *
 *   - a kiosk, always-on-top, all-workspaces window
 *   - suppression of the usual escapes (Alt+F4, Ctrl+W, F11, DevTools)
 *   - refusal to close or minimise while locked
 *   - server-verified unlock: the renderer cannot simply assert it is done
 *
 * What it deliberately does NOT claim: this is not unbypassable. Ctrl+Alt+Del
 * on Windows, a forced power-off, or booting to another OS all defeat it, and
 * no userland application can prevent that. It is a strong commitment device,
 * not a kernel-level parental control.
 */

const WEB_URL = process.env.CODELOCK_WEB_URL ?? 'https://app.codelock.dev';
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
/** Single source of truth for "is the machine currently locked". */
let locked = false;

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
  // Losing focus while locked pulls the window straight back.
  window.on('blur', () => {
    if (locked) window.focus();
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

  void window.loadURL(WEB_URL);
  return window;
}

/**
 * Enter lock mode.
 *
 * Kiosk mode is what prevents Alt+Tab and the taskbar on Windows;
 * `screen-saver` level puts the window above the macOS Dock and menu bar;
 * `setVisibleOnAllWorkspaces` stops "just switch desktops" from working.
 */
function engageLock(): void {
  if (!mainWindow || locked) return;
  locked = true;

  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setClosable(false);
  mainWindow.setMinimizable(false);
  mainWindow.setFullScreenable(true);
  mainWindow.focus();

  registerEscapeSuppression();
}

function releaseLock(): void {
  if (!mainWindow) return;
  locked = false;

  mainWindow.setKiosk(false);
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setVisibleOnAllWorkspaces(false);
  mainWindow.setClosable(true);
  mainWindow.setMinimizable(true);

  globalShortcut.unregisterAll();
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
ipcMain.handle('codelock:lock', () => {
  engageLock();
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

ipcMain.handle('codelock:state', () => ({ locked, platform: process.platform }));

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
  mainWindow = createWindow();

  // Locking the OS session and coming back must not lose the lock overlay.
  powerMonitor.on('unlock-screen', () => {
    if (locked) mainWindow?.focus();
  });
  powerMonitor.on('resume', () => {
    if (locked) mainWindow?.focus();
  });

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

app.on('will-quit', () => globalShortcut.unregisterAll());

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
