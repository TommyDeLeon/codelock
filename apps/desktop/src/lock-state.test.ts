import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  MAX_LOCK_LIFETIME_MS,
  classifyStartup,
  fileLockStore,
  isLive,
  newLock,
  recordInterruption,
  unlockTokenOpensLock,
} from './lock-state.js';

/**
 * The lock file, and the rule that stops an unlock token being a master key.
 *
 * Two failure modes are covered here and they point in opposite directions,
 * which is the whole difficulty of this file. Honour a stale lock and someone
 * boots into an overlay they cannot solve their way out of. Drop a live one
 * and the commitment device is defeated by the power button.
 *
 * `unlockTokenOpensLock` is the other half: a valid signature proves the API
 * issued a token, never which lock it was earned for. Without the session
 * comparison, one solve buys a key that opens every lock for its lifetime —
 * and a replayed unlock looks exactly like an earned one.
 */

const SESSION = 'a0000000-0000-4000-8000-000000000001';

describe('is a lock read from disk still worth honouring', () => {
  test('a fresh lock is live', () => {
    const now = 1_000_000;
    assert.equal(isLive(newLock(SESSION, now), now), true);
  });

  test('no lock is not live', () => {
    assert.equal(isLive(null, 1_000_000), false);
  });

  test('a lock past its expiry is debris', () => {
    const now = 1_000_000;
    const lock = newLock(SESSION, now);
    // One millisecond past the twelve-hour backstop. Honouring this is the
    // failure the backstop exists to prevent: an overlay rebuilt over a
    // session the server finished hours ago.
    assert.equal(isLive(lock, now + MAX_LOCK_LIFETIME_MS + 1), false);
  });

  test('a lock exactly at its expiry is debris', () => {
    const now = 1_000_000;
    const lock = newLock(SESSION, now);
    assert.equal(isLive(lock, lock.expiresAt), false, 'expiry is exclusive');
  });

  test('a lock with no session id is not live', () => {
    // Nothing to re-check with the server means nothing that can ever be
    // resolved — an overlay with no route out.
    const lock = { ...newLock(SESSION, 1_000), sessionId: '' };
    assert.equal(isLive(lock, 1_000), false);
  });

  test('a lock engaged implausibly far in the future is not live', () => {
    // The system clock moved, or the file was written by a machine whose clock
    // had. Either way it must not grant a lock a longer life than the backstop.
    const now = 1_000_000;
    const lock = { ...newLock(SESSION, now), engagedAt: now + MAX_LOCK_LIFETIME_MS + 1 };
    assert.equal(isLive(lock, now), false);
  });

  test('twelve hours is the backstop', () => {
    assert.equal(MAX_LOCK_LIFETIME_MS, 12 * 60 * 60 * 1000);
  });
});

describe('what a lock file at startup means', () => {
  test('no file is a clean start', () => {
    assert.deepEqual(classifyStartup(null, 1_000), { kind: 'clean' });
  });

  test('a live lock is an interruption, and counts itself', () => {
    const now = 1_000_000;
    const state = classifyStartup(newLock(SESSION, now), now + 60_000);
    assert.equal(state.kind, 'interrupted');
    assert.equal(state.kind === 'interrupted' && state.interruptions, 1);
  });

  test('interruptions accumulate across restarts', () => {
    // Killing the process is a documented way out, and a temporary one on a
    // machine with the login item registered. The count is what lets the app
    // notice a user doing it repeatedly rather than once.
    const now = 1_000_000;
    let lock = newLock(SESSION, now);
    lock = recordInterruption(lock, now + 1_000);
    lock = recordInterruption(lock, now + 2_000);
    const state = classifyStartup(lock, now + 3_000);
    assert.equal(state.kind === 'interrupted' && state.interruptions, 3);
  });

  test('an expired lock is reported as expired, not honoured', () => {
    const now = 1_000_000;
    const state = classifyStartup(newLock(SESSION, now), now + MAX_LOCK_LIFETIME_MS + 1);
    assert.equal(state.kind, 'expired');
  });

  test('recording an interruption does not mutate the lock it was given', () => {
    // The caller writes the returned object. A failed write must not leave an
    // in-memory lock claiming an interruption that never reached the disk.
    const lock = newLock(SESSION, 1_000);
    const stamped = recordInterruption(lock, 2_000);
    assert.equal(lock.interruptions, undefined);
    assert.equal(stamped.interruptions, 1);
    assert.equal(stamped.interruptedAt, 2_000);
  });
});

describe('an unlock token only opens the lock it was earned for', () => {
  test('matching session ids open the lock', () => {
    assert.equal(unlockTokenOpensLock(SESSION, SESSION), true);
  });

  test('a token from another session does not open this lock', () => {
    // The replay this rule exists to stop: solve once, keep the token, present
    // it against the next lock. It would look exactly like an earned unlock.
    const other = 'b0000000-0000-4000-8000-000000000002';
    assert.equal(unlockTokenOpensLock(other, SESSION), false);
  });

  test('a token with no session claim opens nothing', () => {
    assert.equal(unlockTokenOpensLock(undefined, SESSION), false);
    assert.equal(unlockTokenOpensLock('', SESSION), false);
  });

  test('no held session means there is nothing to open', () => {
    assert.equal(unlockTokenOpensLock(SESSION, null), false);
  });

  test('two absent ids do not count as a match', () => {
    // The dangerous shape: `undefined === undefined` is true, so a comparison
    // written without these guards would open a lock nothing ever earned.
    assert.equal(unlockTokenOpensLock(undefined, null), false);
    assert.equal(unlockTokenOpensLock('', null), false);
  });
});

describe('the lock file on disk', () => {
  /** A scratch directory per test; nothing here touches real app data. */
  function store() {
    const dir = mkdtempSync(join(tmpdir(), 'codelock-lock-'));
    const file = join(dir, 'lock-state.json');
    return {
      file,
      store: fileLockStore(file),
      cleanup: () => rmSync(dir, { recursive: true, force: true }),
    };
  }

  test('a written lock reads back', () => {
    const s = store();
    try {
      const lock = newLock(SESSION, 1_000);
      s.store.write(lock);
      assert.deepEqual(s.store.read(), lock);
    } finally {
      s.cleanup();
    }
  });

  test('no file reads as no lock', () => {
    const s = store();
    try {
      assert.equal(s.store.read(), null);
    } finally {
      s.cleanup();
    }
  });

  test('clearing removes the lock', () => {
    const s = store();
    try {
      s.store.write(newLock(SESSION, 1_000));
      s.store.clear();
      assert.equal(s.store.read(), null);
      assert.equal(existsSync(s.file), false);
    } finally {
      s.cleanup();
    }
  });

  test('clearing a lock that is not there is not an error', () => {
    // This runs on the path that releases a lock. Throwing here would leave a
    // released session with its overlay still up.
    const s = store();
    try {
      assert.doesNotThrow(() => s.store.clear());
    } finally {
      s.cleanup();
    }
  });

  test('a corrupt lock file reads as no lock rather than throwing', () => {
    // A half-written file is what a power cut during the write leaves behind.
    // It must not crash the shell on the next boot.
    const s = store();
    try {
      writeFileSync(s.file, '{"sessionId": "a', 'utf8');
      assert.equal(s.store.read(), null);
    } finally {
      s.cleanup();
    }
  });
});
