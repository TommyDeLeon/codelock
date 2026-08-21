import { describe, expect, it, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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
