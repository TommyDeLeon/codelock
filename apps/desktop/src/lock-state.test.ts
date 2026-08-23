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
import { fileLockStore, isLive, newLock, MAX_LOCK_LIFETIME_MS } from './lock-state.js';

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
