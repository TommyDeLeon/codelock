/**
 * Generate the RSA key pair that separates "can unlock" from "can be unlocked".
 *
 * The private half goes into the API's environment as JWT_UNLOCK_PRIVATE_KEY.
 * The public half is baked into distributed desktop builds as
 * CODELOCK_BUILD_UNLOCK_PUBLIC_KEY. Anyone who unpacks the installed app gets
 * the public key and nothing else, which is the whole reason a Store build is
 * allowed to exist: the HS256 secret must never ship (see
 * apps/desktop/scripts/write-defaults.mjs).
 *
 * Output is `.env`-ready: newlines are written as the two characters `\n`,
 * which both the API (lib/unlockSigner.ts) and the desktop
 * (src/unlock-verifier.ts) undo before parsing. Nothing is written to disk;
 * paste the lines where they belong.
 *
 *   node scripts/gen-unlock-keys.mjs
 */
import { generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

const escape = (pem) => pem.trim().split('\n').join('\\n');

const priv = escape(privateKey.export({ type: 'pkcs8', format: 'pem' }).toString());
const pub = escape(publicKey.export({ type: 'spki', format: 'pem' }).toString());

process.stdout.write(
  [
    '# API (apps/api/.env or deploy/.env). Secret: keep it there and nowhere else.',
    `JWT_UNLOCK_PRIVATE_KEY=${priv}`,
    '',
    '# Desktop build environment. Public: safe to commit to CI variables.',
    `CODELOCK_BUILD_UNLOCK_PUBLIC_KEY=${pub}`,
    '',
  ].join('\n'),
);
