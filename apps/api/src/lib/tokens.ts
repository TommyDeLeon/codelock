import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';

export interface UnlockClaims {
  sub: string;
  sid: string;
  typ: 'unlock';
}

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
    algorithms: ['HS256'],
    issuer: 'codelock',
    audience: 'codelock-lockscreen',
  }) as UnlockClaims;
  if (claims.typ !== 'unlock') throw new Error('wrong token type');
  return claims;
}

/** Refresh tokens are opaque random strings; only their hash reaches the DB. */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
