import { describe, expect, it } from 'vitest';
import { canVerifyUnlocks, type DesktopConfig } from './config.js';

/**
 * The predicate that decides whether this install is allowed to lock at all.
 *
 * A build made with no key baked in produces a config with both fields empty.
 * The main process refuses to START a lock in that state, because the timer
 * would still fire, the overlay would still appear, and a correct, fast
 * solution could not release it — the unlock token would verify against
 * nothing. The only way out would be the kill switch, which costs the user a
 * recorded failure for a fault that was never theirs.
 *
 * So this returning the wrong answer has two failure modes and both are bad:
 * false when a key exists disables the product, and true when none exists
 * locks people out of their machines. It is four lines of code and it is worth
 * pinning exactly.
 */
function config(overrides: Partial<DesktopConfig> = {}): DesktopConfig {
  return {
    webUrl: 'https://app.example.test',
    apiUrl: 'https://api.example.test',
    unlockPublicKey: '',
    unlockSecret: '',
    ...overrides,
  };
}

describe('canVerifyUnlocks', () => {
  it('is false when neither key is present', () => {
    // The shape `npm run dist` produces with no CODELOCK_BUILD_UNLOCK_SECRET —
    // the build prints "unlockKey=MISSING" and this is the resulting config.
    expect(canVerifyUnlocks(config())).toBe(false);
  });

  it('is true with the shared secret alone', () => {
    expect(canVerifyUnlocks(config({ unlockSecret: 'a-shared-hs256-secret' }))).toBe(true);
  });

  it('is true with the public key alone', () => {
    expect(
      canVerifyUnlocks(config({ unlockPublicKey: '-----BEGIN PUBLIC KEY-----\nAAA\n' })),
    ).toBe(true);
  });

  it('is true with both', () => {
    expect(
      canVerifyUnlocks(config({ unlockSecret: 's', unlockPublicKey: '-----BEGIN PUBLIC KEY-----' })),
    ).toBe(true);
  });

  it('treats an empty string as absent, not as a key', () => {
    // The distinction that matters: an unset build arg arrives as '', not as
    // undefined, so a truthiness check is the whole guard.
    expect(canVerifyUnlocks(config({ unlockSecret: '', unlockPublicKey: '' }))).toBe(false);
  });
});
