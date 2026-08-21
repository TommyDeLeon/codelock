import { BrowserWindow, screen, type Display } from 'electron';

/**
 * Blank out every display the lock screen is not on.
 *
 * A single kiosk window covers one monitor. On a two-monitor desk the other
 * screen keeps showing the browser, the chat window, and everything else the
 * lock was supposed to interrupt — which makes the whole thing decorative.
 *
 * These covers are deliberately dumb: no preload, no remote content, no IPC.
 * They render a data: URL and exist only to be opaque and on top. Anything
 * more would be a second attack surface for no gain.
 */

const COVER_HTML = `data:text/html;charset=utf-8,${encodeURIComponent(`
<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;height:100%;background:#0e0e0d;color:#8b8a86;
    font:500 14px/1.5 ui-sans-serif,system-ui,sans-serif;
    display:flex;align-items:center;justify-content:center;
    -webkit-user-select:none;user-select:none;cursor:none}
</style>
<p>CodeLock &mdash; solve the problem on your main display to unlock.</p>
`)}`;

const covers = new Map<number, BrowserWindow>();

/** The display the lock screen itself lives on; it never gets a cover. */
function primaryFor(mainWindow: BrowserWindow | null): number | null {
  if (!mainWindow || mainWindow.isDestroyed()) return null;
  return screen.getDisplayMatching(mainWindow.getBounds()).id;
}

function createCover(display: Display): BrowserWindow {
  const cover = new BrowserWindow({
    ...display.bounds,
    frame: false,
    show: false,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    closable: false,
    fullscreenable: true,
    backgroundColor: '#0e0e0d',
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
  });

  cover.setAlwaysOnTop(true, 'screen-saver');
  cover.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // Clicks land on an opaque window that does nothing, rather than falling
  // through to whatever is underneath.
  cover.setIgnoreMouseEvents(false);
  void cover.loadURL(COVER_HTML);
  cover.once('ready-to-show', () => {
    cover.showInactive();
    cover.setAlwaysOnTop(true, 'screen-saver');
  });

  return cover;
}

/**
 * Bring the covers in line with the displays that exist right now.
 *
 * Called on engage and again on every display change, because plugging in a
 * monitor mid-lock is the most obvious escape once the covers exist at all.
 */
export function syncCovers(mainWindow: BrowserWindow | null): void {
  const mainDisplayId = primaryFor(mainWindow);
  const present = new Set<number>();

  for (const display of screen.getAllDisplays()) {
    if (display.id === mainDisplayId) continue;
    present.add(display.id);

    const existing = covers.get(display.id);
    if (existing && !existing.isDestroyed()) {
      // Resolution or arrangement may have changed under us.
      existing.setBounds(display.bounds);
      existing.setAlwaysOnTop(true, 'screen-saver');
      continue;
    }
    covers.set(display.id, createCover(display));
  }

  // Displays that went away, and the one the lock screen moved onto.
  for (const [id, cover] of covers) {
    if (present.has(id)) continue;
    covers.delete(id);
    if (!cover.isDestroyed()) {
      cover.setClosable(true);
      cover.destroy();
    }
  }
}

export function removeCovers(): void {
  for (const [, cover] of covers) {
    if (!cover.isDestroyed()) {
      cover.setClosable(true);
      cover.destroy();
    }
  }
  covers.clear();
}

/** Push the covers back to the top after something else claimed it. */
export function reassertCovers(): void {
  for (const [, cover] of covers) {
    if (cover.isDestroyed()) continue;
    cover.setAlwaysOnTop(true, 'screen-saver');
    cover.showInactive();
  }
}

export function coverCount(): number {
  return covers.size;
}
