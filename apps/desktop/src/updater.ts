import electronUpdater from 'electron-updater';
import { app } from 'electron';

/**
 * Keep installed copies current, without ever interrupting a lock.
 *
 * Two rules, both of which exist because this app can take over the screen:
 *
 * 1. **Never restart while locked.** electron-updater's default behaviour on
 *    `update-downloaded` is to install on quit, and `autoInstallOnAppQuit` is
 *    on by default — combined with the relaunch-on-quit in main.ts, an update
 *    arriving mid-session could restart the app underneath a live lock. The
 *    install is deferred until the lock is released.
 * 2. **A failed update is not an event.** An unreachable release feed, a
 *    rate-limited GitHub, an unsigned artifact — none of these are the user's
 *    problem and none of them should produce a dialog on a machine that is
 *    currently locked. They are logged and dropped.
 *
 * Windows note: electron-updater verifies the *publisher name* on the signed
 * installer against `publisherName` in the builder config. If they disagree,
 * every update fails silently — no error, no dialog, no update, forever. It
 * must be exactly the CN of the signing certificate. See docs/TRUSTED-INSTALL.md.
 */

// electron-updater ships CommonJS; the named export is not reachable from ESM.
const { autoUpdater } = electronUpdater;

type IsLocked = () => boolean;

let pendingInstall = false;

export function initUpdater(isLocked: IsLocked): void {
  // Nothing to update in development, and pointing a dev build at the release
  // feed would try to "upgrade" it to the last published version.
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  // We decide when to restart, not the library.
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.logger = null;

  autoUpdater.on('update-downloaded', () => {
    pendingInstall = true;
    installIfIdle(isLocked);
  });

  autoUpdater.on('error', (err) => {
    // Deliberately quiet. See rule 2 above.
    console.warn('CodeLock: update check failed:', err?.message ?? err);
  });

  void autoUpdater.checkForUpdates().catch(() => undefined);

  // Six hours. Often enough that a machine left running stays current, rare
  // enough that it is not a background poll anyone notices.
  setInterval(() => {
    void autoUpdater.checkForUpdates().catch(() => undefined);
  }, 6 * 60 * 60 * 1000);
}

/**
 * Install a downloaded update if — and only if — nothing is locked right now.
 *
 * Called again from the unlock path, so an update that arrived mid-session
 * lands the moment the session ends rather than waiting for the next check.
 */
export function installIfIdle(isLocked: IsLocked): void {
  if (!pendingInstall || isLocked()) return;
  pendingInstall = false;
  // isSilent: false so the user sees the installer; isForceRunAfter: true so
  // they get the app back rather than a closed window.
  autoUpdater.quitAndInstall(false, true);
}
