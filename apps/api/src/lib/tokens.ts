import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';

export interface AccessClaims {
  sub: string;
  email: string;
  typ: 'access';
}

/**
 * Proof that the server graded a passing submission for a specific lock
 * session. Clients MUST verify this before tearing down the overlay — that is
 * what stops a patched client from unlocking itself.
 */
export interface UnlockClaims {
  sub: string;
  sid: string;
  typ: 'unlock';
}

export function signAccessToken(userId: string, email: string): string {
  const payload: AccessClaims = { sub: userId, email, typ: 'access' };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    // ACCESS_TOKEN_TTL is validated as a string at boot; @types/jsonwebtoken
    // wants its narrower `StringValue` template type here.
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
    issuer: 'codelock',
    audience: 'codelock-client',
  });
}

export function verifyAccessToken(token: string): AccessClaims {
  const claims = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'codelock',
    audience: 'codelock-client',
  }) as AccessClaims;
  if (claims.typ !== 'access') throw new Error('wrong token type');
  return claims;
}

/** Valid for five minutes: long enough to dismiss an overlay, too short to hoard. */
export function signUnlockToken(userId: string, sessionId: string): string {
  const payload: UnlockClaims = { sub: userId, sid: sessionId, typ: 'unlock' };
  return jwt.sign(payload, env.JWT_UNLOCK_SECRET, {
    expiresIn: '5m',
    issuer: 'codelock',
    audience: 'codelock-lockscreen',
  });
}

export function verifyUnlockToken(token: string): UnlockClaims {
  const claims = jwt.verify(token, env.JWT_UNLOCK_SECRET, {
    issuer: 'codelock',
    audience: 'codelock-lockscreen',
  }) as UnlockClaims;
  if (claims.typ !== 'unlock') throw new Error('wrong token type');
  return claims;
}

/** Refresh tokens are opaque random strings; only their hash reaches the DB. */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(48).toString('base64url');
  return { token, hash: sha256(token) };
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
