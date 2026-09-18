import assert from 'node:assert/strict';
import { createPublicKey, createVerify, generateKeyPairSync } from 'node:crypto';
import { describe, it } from 'node:test';

import * as tokens from './unlockSigner.js';

// unlockSigner.ts is the env-free core; tokens.ts only binds it to env.ts,
// which would exit the process here for want of a DATABASE_URL.

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const secret = 'another-secret-that-is-at-least-thirty-two-chars';

const headerOf = (token: string) =>
  JSON.parse(Buffer.from(token.split('.')[0]!, 'base64url').toString()) as { alg: string };

describe('unlock token signing', () => {
  it('signs HS256 with the shared secret when no private key is set', () => {
    const signer = tokens.unlockSigner({ secret });
    const token = tokens.signUnlockTokenWith(signer, 'u1', 's1');
    assert.equal(headerOf(token).alg, 'HS256');
    const claims = tokens.verifyUnlockTokenWith(signer, token);
    assert.equal(claims.sub, 'u1');
    assert.equal(claims.sid, 's1');
    assert.equal(claims.typ, 'unlock');
  });

  it('signs RS256 when a private key is set, verifiable with only the public key', () => {
    const signer = tokens.unlockSigner({ secret, privateKeyPem: privatePem });
    assert.equal(signer.alg, 'RS256');
    const token = tokens.signUnlockTokenWith(signer, 'u1', 's1');
    assert.equal(headerOf(token).alg, 'RS256');

    // What the desktop shell does (apps/desktop/src/unlock-verifier.ts, which
    // has no test runner): verify the signature with the public key alone,
    // then check the claims it gates on. Kept in step with that file by hand.
    const publicPem = tokens.unlockPublicKeyPem(privatePem);
    const [h, p, s] = token.split('.') as [string, string, string];
    const ok = createVerify('RSA-SHA256')
      .update(`${h}.${p}`)
      .verify(createPublicKey(publicPem), Buffer.from(s, 'base64url'));
    assert.equal(ok, true);
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString()) as Record<string, unknown>;
    assert.equal(claims.typ, 'unlock');
    assert.equal(claims.aud, 'codelock-lockscreen');
    assert.equal(claims.iss, 'codelock');
    assert.equal(claims.sub, 'u1');
    assert.equal(claims.sid, 's1');
    assert.equal(typeof claims.exp, 'number');
    assert.ok((claims.exp as number) * 1000 > Date.now());
  });

  it('rejects an RSA key shorter than 2048 bits', () => {
    const { privateKey: weak } = generateKeyPairSync('rsa', { modulusLength: 1024 });
    const weakPem = weak.export({ type: 'pkcs8', format: 'pem' }).toString();
    assert.throws(() => tokens.unlockSigner({ secret, privateKeyPem: weakPem }), /2048/);
  });

  it('accepts a PEM whose newlines arrived as the two characters \\n', () => {
    const escaped = privatePem.split('\n').join('\\n');
    const signer = tokens.unlockSigner({ secret, privateKeyPem: escaped });
    const token = tokens.signUnlockTokenWith(signer, 'u1', 's1');
    assert.equal(tokens.verifyUnlockTokenWith(signer, token).sid, 's1');
  });

  it('rejects an HS256 token when the signer is RS256 (no algorithm confusion)', () => {
    const hs = tokens.unlockSigner({ secret });
    const rs = tokens.unlockSigner({ secret, privateKeyPem: privatePem });
    const forged = tokens.signUnlockTokenWith(hs, 'u1', 's1');
    assert.throws(() => tokens.verifyUnlockTokenWith(rs, forged));
  });

  it('rejects a non-RSA private key', () => {
    const { privateKey: ec } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const ecPem = ec.export({ type: 'pkcs8', format: 'pem' }).toString();
    assert.throws(() => tokens.unlockSigner({ secret, privateKeyPem: ecPem }), /RSA/);
  });
});
