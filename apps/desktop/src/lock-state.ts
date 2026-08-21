import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The lock, written to disk.
 *
 * Without this, killing the process is the easiest bypass in the product:
 * Task Manager → End Task → relaunch → unlocked. Holding the lock only in a
 * module-level `let` means a crash, an OOM kill, or a power cut all read as
 * "unlocked" on the next start, which is exactly backwards. A lock that
 * forgets itself is not a lock.
 *
 * So: every transition is persisted before it takes effect in the UI, and the
 * app re-engages on boot from whatever is on disk.
 *
 * The obvious objection is that a user who can kill the process can also
 * delete this file. True, and it is documented as such in
 * docs/ESCAPE-MATRIX.md — deleting a file in AppData is a deliberate,
 * conscious act, which is the bar a commitment device is trying to raise the
 * escape to. It is not trying to beat an adversary with admin rights.
 */
export interface PersistedLock {
  /** The API session this lock belongs to. Used to re-check with the server. */
  sessionId: string;
  /** Epoch ms. Also the tie-breaker if two writes race. */
  engagedAt: number;
  /**
   * Epoch ms after which a stale lock file is ignored on boot.
   *
   * Backstop against the worst failure mode: the app crashes mid-lock, the
   * server is unreachable so it cannot confirm the session is over, and the
   * user is left staring at an overlay with no way out. A lock that outlives
   * this window without server confirmation is treated as debris.
   */
  expiresAt: number;
}

/** Twelve hours. Longer than any legitimate session, short enough to save you. */
export const MAX_LOCK_LIFETIME_MS = 12 * 60 * 60 * 1000;

export interface LockStateStore {
  read(): PersistedLock | null;
  write(lock: PersistedLock): void;
  clear(): void;
}

/**
 * Is a lock read from disk still worth honouring?
 *
 * Pure so it can be tested without a filesystem or an Electron app object.
 */
export function isLive(lock: PersistedLock | null, now = Date.now()): boolean {
  if (!lock) return false;
  if (!lock.sessionId) return false;
  if (typeof lock.expiresAt !== 'number' || lock.expiresAt <= now) return false;
  // A file dated in the future means the system clock moved, not that the lock
  // is more valid. Honour it, but never beyond the maximum lifetime.
  if (lock.engagedAt > now + MAX_LOCK_LIFETIME_MS) return false;
  return true;
}

export function newLock(sessionId: string, now = Date.now()): PersistedLock {
  return { sessionId, engagedAt: now, expiresAt: now + MAX_LOCK_LIFETIME_MS };
}

/**
 * File-backed store with atomic writes.
 *
 * Write-then-rename, because a half-written JSON file read on the next boot
 * parses as "no lock" — which would silently unlock the machine on a power cut
 * during exactly the moment we were trying to record the lock.
 */
export function fileLockStore(filePath: string): LockStateStore {
  return {
    read(): PersistedLock | null {
      if (!existsSync(filePath)) return null;
      try {
        const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<PersistedLock>;
        if (typeof parsed.sessionId !== 'string') return null;
        if (typeof parsed.engagedAt !== 'number') return null;
        if (typeof parsed.expiresAt !== 'number') return null;
        return parsed as PersistedLock;
      } catch {
        // Corrupt file. Deliberately NOT treated as "unlocked": returning null
        // here is the fail-open we are trying to avoid, but there is nothing
        // trustworthy to honour either. The caller re-checks with the server.
        return null;
      }
    },

    write(lock: PersistedLock): void {
      mkdirSync(path.dirname(filePath), { recursive: true });
      const tmp = `${filePath}.tmp`;
      writeFileSync(tmp, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
      renameSync(tmp, filePath);
    },

    clear(): void {
      try {
        if (existsSync(filePath)) unlinkSync(filePath);
      } catch {
        // Best effort. A lock file we failed to delete re-engages on the next
        // boot and is then cleared by the server check — annoying, not unsafe.
      }
    },
  };
}
