import { app, safeStorage } from 'electron';
import { existsSync, chmodSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The signed-in session, owned by the main process.
 *
 * The shell renders two origins in one window: the bundled dashboard at
 * app://codelock, and the lock screen served from the web app. Browser storage
 * is per-origin, so a session established in the dashboard is invisible to the
 * lock screen — which would mean being asked to sign in *inside* a lock screen
 * you cannot navigate away from. Precisely the wrong moment.
 *
 * So the main process holds the tokens and hands them to whichever of its own
 * pages asks. It also has to survive a restart: a lock that was live when the
 * process died comes straight back up, and it comes back to the lock screen,
 * which needs a session before the dashboard has ever loaded.
 *
 * Encrypted with Electron's safeStorage — DPAPI on Windows, Keychain on macOS,
 * libsecret on Linux — so the file is not a plaintext bearer token sitting in
 * AppData. Where the OS offers no backend, nothing is written at all rather
 * than something written in the clear.
 */

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
}

export function sessionPath(): string {
  return path.join(app.getPath('userData'), 'session.enc');
}

export function readSession(): StoredSession | null {
  const file = sessionPath();
  if (!existsSync(file)) return null;

  try {
    if (!safeStorage.isEncryptionAvailable()) return null;
    const decrypted = safeStorage.decryptString(readFileSync(file));
    const parsed = JSON.parse(decrypted) as Partial<StoredSession>;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
  } catch (err) {
    // A session we cannot read is a session that does not exist. Signing in
    // again is a minor annoyance; refusing to start is not.
    console.warn('CodeLock: could not read the stored session; treating as signed out.', err);
    return null;
  }
}

export function writeSession(session: StoredSession): void {
  if (!safeStorage.isEncryptionAvailable()) {
    // Refuse rather than downgrade. This token releases a device lock, and a
    // plaintext copy on disk is a worse trade than signing in again.
    console.warn('CodeLock: no OS encryption backend; the session will not be persisted.');
    return;
  }

  const file = sessionPath();
  writeFileSync(file, safeStorage.encryptString(JSON.stringify(session)));
  try {
    chmodSync(file, 0o600);
  } catch {
    // Windows ignores POSIX modes; there the per-user ACL inherited from
    // userData is what protects it.
  }
}

export function clearSession(): void {
  const file = sessionPath();
  if (existsSync(file)) unlinkSync(file);
}
