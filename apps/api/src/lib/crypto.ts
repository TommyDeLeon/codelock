import crypto from 'node:crypto';
import { env } from '../env.js';

/**
 * Envelope encryption for third-party OAuth tokens at rest.
 *
 * A GitHub token with `repo` scope can rewrite a user's repositories, so a
 * database dump must not be enough to use one. AES-256-GCM gives us
 * authenticated encryption: tampering with the ciphertext fails to decrypt
 * rather than silently yielding garbage.
 */

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12; // 96-bit nonce, the GCM standard
const KEY = crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest();

/** Returns "iv.ciphertext.tag", all base64url. */
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, encrypted, tag].map((b) => b.toString('base64url')).join('.');
}

export function decryptSecret(payload: string): string {
  const parts = payload.split('.');
  // Count the parts rather than testing them for truthiness: an empty
  // plaintext produces an empty middle part, and `!dataPart` rejected it as
  // malformed — a value this function had just produced itself. The result
  // would have been an integration row that could never be decrypted and was
  // indistinguishable from a tampered one.
  const [ivPart, dataPart, tagPart] = parts;
  if (parts.length !== 3 || !ivPart || !tagPart || dataPart === undefined) {
    throw new Error('Malformed ciphertext');
  }

  const decipher = crypto.createDecipheriv(
    ALGO,
    KEY,
    Buffer.from(ivPart, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

/** Constant-time compare for OAuth state and webhook signatures. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}
