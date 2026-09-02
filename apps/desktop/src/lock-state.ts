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
 * Does an unlock token's session match the lock actually being held?
 *
 * A valid signature only proves the API issued the token; it says nothing about
 * *which* lock it was earned for. Without this comparison every unlock token is
 * a master key for its five-minute lifetime: solve one problem, keep the token,
 * and replay it against the next lock, which then costs nothing to open. That
 * is the whole commitment device gone, and it fails silently — the replayed
 * unlock looks exactly like an earned one.
 *
 * Pure, so the rule can be tested without Electron or a signing key.
 */
export function unlockTokenOpensLock(
  claimSessionId: string | undefined,
  lockedSessionId: string | null,
): boolean {
  // No held session means this process never engaged a lock; nothing to open.
  if (!lockedSessionId) return false;
  if (!claimSessionId) return false;
  return claimSessionId === lockedSessionId;
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

    /**
     * Persist the lock, atomically where the filesystem allows it.
     *
     * The rename is the crash-safe path, but it is not guaranteed. On Windows
     * it fails with EXDEV when AppData is redirected across volumes (roaming
     * profiles, folder redirection) and with EPERM when a sync client or
     * antivirus holds the target open. This runs from a timer inside
     * engageLock, so an uncaught throw takes down the whole shell — a far worse
     * outcome than a non-atomic write, and it was crashing the app at the exact
     * moment the timer fired.
     *
     * So: try atomic, fall back to writing in place, and never throw. A torn
     * file reads back as "no lock", which the renderer corrects against the
     * server on its next poll.
     */
    write(lock: PersistedLock): void {
      const contents = `${JSON.stringify(lock, null, 2)}\n`;
      const tmp = `${filePath}.tmp`;

      try {
        mkdirSync(path.dirname(filePath), { recursive: true });
      } catch {
        // Already present, or unwritable — the writes below surface the real
        // problem either way.
      }

      try {
        writeFileSync(tmp, contents, 'utf8');
        renameSync(tmp, filePath);
        return;
      } catch {
        try {
          unlinkSync(tmp);
        } catch {
          // Nothing left to clean up.
        }
      }

      try {
        writeFileSync(filePath, contents, 'utf8');
      } catch (err) {
        // The lock still holds in memory; only crash recovery is lost, and
        // saying so beats dying silently.
        console.error('CodeLock: could not persist lock state to disk.', err);
      }
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
