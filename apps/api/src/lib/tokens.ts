import crypto from 'node:crypto';
import { env } from '../env.js';
import {
  signUnlockTokenWith,
  unlockSigner,
  verifyUnlockTokenWith,
  type UnlockClaims,
} from './unlockSigner.js';

export type { UnlockClaims };

// Built once: parsing a PEM per unlock would be wasteful, and a bad key should
// fail at boot (env.ts already checks it) rather than at the first unlock.
// HS256 with the shared secret unless JWT_UNLOCK_PRIVATE_KEY is set; see
// unlockSigner.ts for why distributed builds need the RS256 path.
const signer = unlockSigner({
  secret: env.JWT_UNLOCK_SECRET,
  privateKeyPem: env.JWT_UNLOCK_PRIVATE_KEY,
});

export function signUnlockToken(userId: string, sessionId: string): string {
  return signUnlockTokenWith(signer, userId, sessionId);
}

export function verifyUnlockToken(token: string): UnlockClaims {
  return verifyUnlockTokenWith(signer, token);
}

/** Refresh tokens are opaque random strings; only their hash reaches the DB. */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
