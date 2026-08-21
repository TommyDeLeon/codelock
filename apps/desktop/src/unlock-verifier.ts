import { createPublicKey, createVerify, timingSafeEqual, createHmac } from 'node:crypto';

/**
 * Unlock proof verification, in the main process.
 *
 * This is the security boundary of the desktop app. The renderer displays a
 * remote web app; anything it claims is untrusted. The only thing that releases
 * the lock is a token signed by the API, verified here with a key the renderer
 * has no access to.
 *
 * Two verification modes, chosen by what the deployment provides:
 *
 *   RS256 (recommended for distribution): the app ships the API's *public*
 *   key. Nothing secret lives on the user's disk, so decompiling the app
 *   yields no ability to forge tokens.
 *
 *   HS256 (fine for a self-hosted single user): the shared secret is in the
 *   app's environment. Simpler, but anyone who reads the binary's config can
 *   mint their own unlock token — acceptable when the only user is the person
 *   who installed it, and the lock is a commitment device rather than a
 *   defence against a motivated attacker who owns the machine.
 */

export interface Verdict {
  ok: boolean;
  reason?: 'malformed' | 'bad-signature' | 'expired' | 'wrong-audience' | 'no-key';
  userId?: string;
  sessionId?: string;
}

const PUBLIC_KEY_PEM = process.env.CODELOCK_UNLOCK_PUBLIC_KEY?.replace(/\\n/g, '\n');
const SHARED_SECRET = process.env.CODELOCK_UNLOCK_SECRET;

interface UnlockClaims {
  sub: string;
  sid: string;
  typ: string;
  aud: string;
  iss: string;
  exp: number;
}

export async function verifyUnlockToken(token: string): Promise<Verdict> {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };

  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

  let header: { alg?: string };
  let claims: UnlockClaims;
  try {
    header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    claims = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = Buffer.from(signatureB64, 'base64url');

  // The algorithm is chosen by what we hold, never by the token's own header.
  // Trusting header.alg is the classic JWT confusion attack: a forged token
  // claiming alg:none or flipping RS256 to HS256 would otherwise verify.
  let signatureValid: boolean;
  if (PUBLIC_KEY_PEM) {
    if (header.alg !== 'RS256') return { ok: false, reason: 'bad-signature' };
    signatureValid = createVerify('RSA-SHA256')
      .update(signingInput)
      .verify(createPublicKey(PUBLIC_KEY_PEM), signature);
  } else if (SHARED_SECRET) {
    if (header.alg !== 'HS256') return { ok: false, reason: 'bad-signature' };
    const expected = createHmac('sha256', SHARED_SECRET).update(signingInput).digest();
    signatureValid =
      expected.length === signature.length && timingSafeEqual(expected, signature);
  } else {
    // Fail closed. Without a key we cannot distinguish a real token from a
    // forged one, and guessing would make the lock meaningless.
    return { ok: false, reason: 'no-key' };
  }

  if (!signatureValid) return { ok: false, reason: 'bad-signature' };

  if (claims.typ !== 'unlock' || claims.aud !== 'codelock-lockscreen') {
    return { ok: false, reason: 'wrong-audience' };
  }
  if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, userId: claims.sub, sessionId: claims.sid };
}
