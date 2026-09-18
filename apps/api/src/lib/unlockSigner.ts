import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

export interface UnlockClaims {
  sub: string;
  sid: string;
  typ: 'unlock';
}

/**
 * Which key signs unlock tokens.
 *
 * HS256 with the shared secret is the self-hosted default: the desktop shell on
 * the same machine holds the same secret. It is the wrong shape for anything
 * distributed — a Store or GitHub build carrying the secret lets anyone who
 * unpacks it mint unlock tokens, and the desktop's build script refuses to
 * ship it. So when `JWT_UNLOCK_PRIVATE_KEY` is set the API signs RS256 with it
 * instead, and only the public half travels inside the installed app. The
 * desktop verifier already accepts either; it picks the algorithm from the key
 * it holds, never from the token header.
 *
 * Kept free of `env.ts` so it can be tested without a database URL.
 */
export interface UnlockSigningKeys {
  secret: string;
  privateKeyPem?: string;
}

export interface UnlockSigner {
  alg: 'HS256' | 'RS256';
  signKey: string | crypto.KeyObject;
  verifyKey: string | crypto.KeyObject;
}

/**
 * PEM newlines survive `.env` files and Compose interpolation as the two
 * characters `\n`; undo that before crypto tries to parse the key.
 */
export function normalisePem(pem: string): string {
  return pem.split('\\n').join('\n').trim();
}

/** The public key to bake into distributed builds, derived from the private one. */
export function unlockPublicKeyPem(privateKeyPem: string): string {
  const privateKey = crypto.createPrivateKey(normalisePem(privateKeyPem));
  return crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'pem' }).toString();
}

/** Minimum RSA modulus. 2048 is what gen-unlock-keys.mjs produces. */
export const MIN_RSA_BITS = 2048;

/**
 * Parse and vet the private key, or throw with a message naming the problem.
 * Used at boot (env.ts) and when the signer is built, so both agree.
 */
export function assertUnlockPrivateKey(pem: string): crypto.KeyObject {
  const privateKey = crypto.createPrivateKey(normalisePem(pem));
  if (privateKey.asymmetricKeyType !== 'rsa') {
    throw new Error('JWT_UNLOCK_PRIVATE_KEY must be an RSA private key (RS256)');
  }
  const bits = privateKey.asymmetricKeyDetails?.modulusLength ?? 0;
  if (bits < MIN_RSA_BITS) {
    throw new Error(`JWT_UNLOCK_PRIVATE_KEY is ${bits}-bit RSA; at least ${MIN_RSA_BITS} bits required`);
  }
  return privateKey;
}

export function unlockSigner(keys: UnlockSigningKeys): UnlockSigner {
  if (keys.privateKeyPem) {
    const privateKey = assertUnlockPrivateKey(keys.privateKeyPem);
    return { alg: 'RS256', signKey: privateKey, verifyKey: crypto.createPublicKey(privateKey) };
  }
  return { alg: 'HS256', signKey: keys.secret, verifyKey: keys.secret };
}

export function signUnlockTokenWith(
  signer: UnlockSigner,
  userId: string,
  sessionId: string,
): string {
  const payload: UnlockClaims = { sub: userId, sid: sessionId, typ: 'unlock' };
  return jwt.sign(payload, signer.signKey, {
    algorithm: signer.alg,
    expiresIn: '5m',
    issuer: 'codelock',
    audience: 'codelock-lockscreen',
  });
}

export function verifyUnlockTokenWith(signer: UnlockSigner, token: string): UnlockClaims {
  const claims = jwt.verify(token, signer.verifyKey, {
    algorithms: [signer.alg],
    issuer: 'codelock',
    audience: 'codelock-lockscreen',
  }) as UnlockClaims;
  if (claims.typ !== 'unlock') throw new Error('wrong token type');
  return claims;
}
