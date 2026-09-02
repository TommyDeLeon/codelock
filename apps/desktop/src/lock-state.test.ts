import { describe, expect, it, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';

/**
 * Injected filesystem failures, for the write-path tests at the bottom.
 *
 * A module mock rather than vi.spyOn: lock-state.ts imports renameSync and
 * writeFileSync as named bindings, which ESM resolves once at load, so
 * patching the namespace object afterwards has no effect on them.
 */
const failures = vi.hoisted(() => ({ rename: null as Error | null, write: null as Error | null }));

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    renameSync: (...args: Parameters<typeof actual.renameSync>) => {
      if (failures.rename) throw failures.rename;
      return actual.renameSync(...args);
    },
    writeFileSync: (...args: Parameters<typeof actual.writeFileSync>) => {
      if (failures.write) throw failures.write;
      return actual.writeFileSync(...args);
    },
  };
});
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  classifyStartup,
  fileLockStore,
  isLive,
  newLock,
  recordInterruption,
  unlockTokenOpensLock,
  MAX_LOCK_LIFETIME_MS,
} from './lock-state.js';

const dirs: string[] = [];
function scratchFile(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'codelock-lock-'));
  dirs.push(dir);
  return path.join(dir, 'nested', 'lock-state.json');
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe('isLive', () => {
  const now = 1_700_000_000_000;

  it('honours a lock inside its lifetime', () => {
    expect(isLive(newLock('sess-1', now), now + 60_000)).toBe(true);
  });

  it('ignores a lock past its expiry', () => {
    const lock = newLock('sess-1', now);
    expect(isLive(lock, now + MAX_LOCK_LIFETIME_MS + 1)).toBe(false);
  });

  it('ignores nothing at all', () => {
    expect(isLive(null, now)).toBe(false);
  });

  it('ignores a lock with no session', () => {
    expect(isLive({ sessionId: '', engagedAt: now, expiresAt: now + 1000 }, now)).toBe(false);
  });

  it('ignores a lock engaged implausibly far in the future', () => {
    // A rolled-back system clock must not manufacture a lock that outlives the
    // maximum lifetime.
    const lock = {
      sessionId: 'sess-1',
      engagedAt: now + MAX_LOCK_LIFETIME_MS * 2,
      expiresAt: now + MAX_LOCK_LIFETIME_MS * 3,
    };
    expect(isLive(lock, now)).toBe(false);
  });
});

describe('fileLockStore', () => {
  it('round-trips a lock through the filesystem', () => {
    const store = fileLockStore(scratchFile());
    const lock = newLock('sess-42');
    store.write(lock);
    expect(store.read()).toEqual(lock);
  });

  it('reads as absent before anything is written', () => {
    expect(fileLockStore(scratchFile()).read()).toBeNull();
  });

  it('survives a clear', () => {
    const file = scratchFile();
    const store = fileLockStore(file);
    store.write(newLock('sess-42'));
    store.clear();
    expect(store.read()).toBeNull();
    // Clearing twice is what happens when unlock and kill switch race.
    expect(() => store.clear()).not.toThrow();
  });

  it('treats a truncated file as absent rather than crashing on boot', () => {
    const file = scratchFile();
    const store = fileLockStore(file);
    store.write(newLock('sess-42'));
    writeFileSync(file, '{"sessionId": "sess-4', 'utf8');
    expect(store.read()).toBeNull();
  });

  it('rejects a file missing required fields', () => {
    const file = scratchFile();
    const store = fileLockStore(file);
    store.write(newLock('sess-42'));
    writeFileSync(file, JSON.stringify({ sessionId: 'sess-42' }), 'utf8');
    expect(store.read()).toBeNull();
  });
});

describe('fileLockStore.write when the filesystem will not cooperate', () => {
  afterEach(() => {
    failures.rename = null;
    failures.write = null;
    vi.restoreAllMocks();
  });

  /**
   * The crash this guards against.
   *
   * On Windows a rename inside a redirected AppData can fail with EXDEV, and a
   * sync client holding the target open produces EPERM. write() runs from a
   * timer inside engageLock, so throwing there killed the entire main process
   * at the exact moment the lock was supposed to engage.
   */
  it('falls back to a direct write when rename fails, and still persists', () => {
    const store = fileLockStore(scratchFile());
    failures.rename = Object.assign(new Error('EXDEV: cross-device link not permitted'), {
      code: 'EXDEV',
    });

    expect(() => store.write(newLock('sess-42'))).not.toThrow();
    expect(store.read()?.sessionId).toBe('sess-42');
  });

  it('does not throw when the file cannot be written at all', () => {
    const store = fileLockStore(scratchFile());
    failures.rename = new Error('EPERM');
    failures.write = new Error('EACCES');
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Crash recovery is lost, but the shell stays alive and the lock still
    // holds in memory. Dying here would hand the machine back.
    expect(() => store.write(newLock('sess-42'))).not.toThrow();
  });
});

describe('unlockTokenOpensLock', () => {
  it('opens the lock the token was earned for', () => {
    expect(unlockTokenOpensLock('sess-1', 'sess-1')).toBe(true);
  });

  /**
   * The bypass this rule exists for.
   *
   * Signature verification passes for *any* token the API issued, so before
   * this check a token earned for one lock released a different one. Solve one
   * problem, keep the token, replay it at the next lock — which then costs
   * nothing to open, and looks like a normal unlock while doing it.
   */
  it('refuses a token earned for a different session', () => {
    expect(unlockTokenOpensLock('sess-1', 'sess-2')).toBe(false);
  });

  it('refuses when no lock is held', () => {
    expect(unlockTokenOpensLock('sess-1', null)).toBe(false);
  });

  it('refuses a token carrying no session at all', () => {
    expect(unlockTokenOpensLock(undefined, 'sess-1')).toBe(false);
  });

  // Two absent values are not a match, however tempting `a === b` looks.
  it('refuses when both sides are missing', () => {
    expect(unlockTokenOpensLock(undefined, null)).toBe(false);
  });
});

/**
 * Rebooting while locked frees the machine, and the lock file cannot know that.
 *
 * The OS tears the process down and the desktop comes back unlocked; nothing
 * gets a chance to record anything. All the next launch can observe is that a
 * lock file is still sitting there, which means the previous process died
 * holding it. That is the signal, and it is the only one available.
 */
describe('classifyStartup', () => {
  const now = 1_700_000_000_000;
  const held = { sessionId: 'sess-1', engagedAt: now - 60_000, expiresAt: now + 60_000 };

  it('reports a clean start when no lock was left behind', () => {
    expect(classifyStartup(null, now)).toEqual({ kind: 'clean' });
  });

  it('reports an interruption when a live lock outlived its process', () => {
    expect(classifyStartup(held, now)).toEqual({ kind: 'interrupted', lock: held, interruptions: 1 });
  });

  it('counts repeated interruptions across restarts', () => {
    const twice = { ...held, interruptions: 2 };
    const state = classifyStartup(twice, now);
    expect(state.kind === 'interrupted' && state.interruptions).toBe(3);
  });

  /**
   * Debris, not an interruption.
   *
   * Past the lifetime the server can no longer be asked whether the session is
   * over, so honouring the file would rebuild an overlay with no way out. It is
   * discarded rather than counted, because counting it would tell the user they
   * abandoned a session that had already ended on its own.
   */
  it('treats a lock past its lifetime as debris', () => {
    const stale = { sessionId: 'sess-1', engagedAt: now - 2 * MAX_LOCK_LIFETIME_MS, expiresAt: now - 1 };
    expect(classifyStartup(stale, now)).toEqual({ kind: 'expired', lock: stale });
  });
});

describe('recordInterruption', () => {
  const now = 1_700_000_000_000;
  const lock = { sessionId: 'sess-1', engagedAt: now - 60_000, expiresAt: now + 60_000 };

  it('stamps the first interruption', () => {
    expect(recordInterruption(lock, now)).toEqual({ ...lock, interruptedAt: now, interruptions: 1 });
  });

  it('accumulates rather than overwriting', () => {
    const once = recordInterruption(lock, now);
    const twice = recordInterruption(once, now + 1000);
    expect(twice.interruptions).toBe(2);
    expect(twice.interruptedAt).toBe(now + 1000);
  });

  // The caller writes the result to disk, and that write can fail. Mutating in
  // place would leave the in-memory lock claiming an interruption that was
  // never recorded, so the next launch would count it twice.
  it('leaves the original untouched', () => {
    recordInterruption(lock, now);
    expect(lock).not.toHaveProperty('interruptedAt');
    expect(lock).not.toHaveProperty('interruptions');
  });
});
