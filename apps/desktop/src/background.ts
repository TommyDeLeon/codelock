import { app, Menu, Tray, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Running all the time, which is the only way a focus timer can work.
 *
 * A timer that fires only while its window happens to be open is not a timer,
 * it is a reminder you have to babysit. Three things make it continuous:
 *
 *   1. **Launch at login**, registered with the OS, with `--background` so the
 *      window does not fly up in the user's face at every boot.
 *   2. **Closing the window does not quit.** The process keeps running behind a
 *      tray icon, so the deadline is still being watched.
 *   3. **A tray icon**, because a background process with no visible handle is
 *      indistinguishable from malware and impossible to quit on purpose.
 *
 * What this deliberately does not do is make the app unquittable while idle.
 * Quit is blocked during a lock and nowhere else — a commitment device you
 * cannot uninstall is a different and worse category of software.
 */

export interface TrayActions {
  isLocked: () => boolean;
  onOpen: () => void;
  onQuit: () => void;
}

/** True when the OS started us at login rather than the user opening the app. */
export function startedInBackground(): boolean {
  return (
    process.argv.includes('--background') || app.getLoginItemSettings().wasOpenedAtLogin === true
  );
}

export function isAutoStartEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}

/**
 * Register or clear the login item.
 *
 * A no-op in development: registering a dev build would point the OS at an
 * Electron binary inside node_modules that will not survive an npm install.
 */
export function setAutoStart(enabled: boolean): void {
  if (!app.isPackaged) return;
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: enabled,
    args: enabled ? ['--background'] : [],
  });
}

let tray: Tray | null = null;

export function createTray(actions: TrayActions): Tray {
  const source = nativeImage.createFromPath(path.join(__dirname, '..', 'build', 'icon.png'));
  const icon = source.isEmpty()
    ? nativeImage.createEmpty()
    : source.resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.on('click', actions.onOpen);
  refreshTray(actions);
  return tray;
}

/**
 * Rebuild the menu for the current lock state.
 *
 * Called on every transition, because "Quit CodeLock" has to be genuinely
 * unavailable during a lock — leaving it enabled would make the tray the
 * easiest bypass in the whole product.
 */
export function refreshTray(actions: TrayActions): void {
  if (!tray || tray.isDestroyed()) return;
  const locked = actions.isLocked();

  tray.setToolTip(locked ? 'CodeLock — locked' : 'CodeLock — watching the clock');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: locked ? 'Go to the lock screen' : 'Open CodeLock',
        click: actions.onOpen,
      },
      { type: 'separator' },
      {
        label: locked ? 'Quit CodeLock (not while locked)' : 'Quit CodeLock',
        enabled: !locked,
        click: actions.onQuit,
      },
    ]),
  );
}

export function destroyTray(): void {
  if (tray && !tray.isDestroyed()) tray.destroy();
  tray = null;
}
