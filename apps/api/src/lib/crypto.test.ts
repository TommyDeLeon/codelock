import { describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import { decryptSecret, encryptSecret, safeEqual, randomToken } from './crypto.js';

/**
 * A GitHub token with `repo` scope can rewrite everything the user owns. The
 * claim on the privacy page is that a database dump is not enough to use one,
 * so these tests exist to keep that claim true rather than aspirational.
 */
describe('token encryption at rest', () => {
  const token = 'ghp_0123456789abcdefghijklmnopqrstuvwxyzAB';

  it('round-trips', () => {
    expect(decryptSecret(encryptSecret(token))).toBe(token);
  });

  it('never stores the plaintext', () => {
    const cipher = encryptSecret(token);
    expect(cipher).not.toContain(token);
    // Not merely absent as a substring — no meaningful run of it survives.
    expect(cipher).not.toContain('ghp_');
    expect(cipher.toLowerCase()).not.toContain(token.slice(4, 20).toLowerCase());
  });

  it('uses a fresh nonce every time, so equal tokens differ on disk', () => {
    const a = encryptSecret(token);
    const b = encryptSecret(token);
    expect(a).not.toBe(b);
    // Two users connecting the same account must not produce identical rows —
    // that alone would leak that they share a token.
    expect(a.split('.')[0]).not.toBe(b.split('.')[0]);
  });

  it('is AES-256-GCM shaped: 96-bit iv, 128-bit tag', () => {
    const [iv, data, tag] = encryptSecret(token).split('.');
    expect(Buffer.from(iv!, 'base64url')).toHaveLength(12);
    expect(Buffer.from(tag!, 'base64url')).toHaveLength(16);
    expect(Buffer.from(data!, 'base64url').length).toBeGreaterThan(0);
  });

  it('refuses tampered ciphertext rather than returning garbage', () => {
    const [iv, data, tag] = encryptSecret(token).split('.');
    const bytes = Buffer.from(data!, 'base64url');
    bytes[0] = bytes[0]! ^ 0xff;
    const tampered = [iv, bytes.toString('base64url'), tag].join('.');
    // This is the whole point of GCM over CBC: authenticated, so a modified
    // row fails loudly instead of decrypting to something plausible.
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it('refuses a tampered auth tag', () => {
    const [iv, data, tag] = encryptSecret(token).split('.');
    const tagBytes = Buffer.from(tag!, 'base64url');
    tagBytes[0] = tagBytes[0]! ^ 0xff;
    expect(() => decryptSecret([iv, data, tagBytes.toString('base64url')].join('.'))).toThrow();
  });

  it('refuses a swapped nonce', () => {
    const [, data, tag] = encryptSecret(token).split('.');
    const otherIv = crypto.randomBytes(12).toString('base64url');
    expect(() => decryptSecret([otherIv, data, tag].join('.'))).toThrow();
  });

  it('refuses a malformed payload instead of throwing something unreadable', () => {
    expect(() => decryptSecret('not-a-ciphertext')).toThrow(/Malformed/);
    expect(() => decryptSecret('')).toThrow(/Malformed/);
  });

  it('cannot be decrypted with a different key', () => {
    // Proves the key is what protects the data, not obscurity of the format.
    // ENCRYPTION_KEY lives in the environment, never in the database beside the
    // ciphertext — so a dump on its own yields nothing.
    const cipher = encryptSecret(token);
    const [iv, data, tag] = cipher.split('.');
    const wrongKey = crypto.createHash('sha256').update('a-different-key-entirely').digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', wrongKey, Buffer.from(iv!, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag!, 'base64url'));
    expect(() => {
      decipher.update(Buffer.from(data!, 'base64url'));
      decipher.final();
    }).toThrow();
  });

  it('handles empty and unicode payloads', () => {
    expect(decryptSecret(encryptSecret(''))).toBe('');
    const unicode = 'ключ-🔐-令牌';
    expect(decryptSecret(encryptSecret(unicode))).toBe(unicode);
  });
});

describe('safeEqual', () => {
  it('matches identical strings', () => {
    expect(safeEqual('abc123', 'abc123')).toBe(true);
  });

  it('rejects different strings of equal length', () => {
    expect(safeEqual('abc123', 'abc124')).toBe(false);
  });

  it('rejects different lengths without throwing', () => {
    // timingSafeEqual throws on a length mismatch; the length check in front of
    // it is what stops an OAuth callback from 500ing on a truncated state.
    expect(safeEqual('short', 'muchlongervalue')).toBe(false);
  });
});

describe('randomToken', () => {
  it('is unpredictable and URL-safe', () => {
    const seen = new Set(Array.from({ length: 200 }, () => randomToken()));
    expect(seen.size).toBe(200);
    for (const token of seen) expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
