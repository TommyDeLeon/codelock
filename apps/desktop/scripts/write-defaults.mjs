/**
 * Bake build-time configuration into the bundle.
 *
 * A packaged Electron app has no shell environment, so reading process.env at
 * runtime yields nothing — the defaults have to be written to a file that ships
 * inside the asar. This runs after tsc and before electron-builder.
 *
 *   CODELOCK_BUILD_WEB_URL=https://app.example.com \
 *   CODELOCK_BUILD_UNLOCK_SECRET=... \
 *   npm run dist
 *
 * Values are only defaults: config.json in the user data directory still wins,
 * so an installed app can be repointed without rebuilding.
 *
 * Note that CODELOCK_BUILD_UNLOCK_SECRET ends up readable inside the installed
 * app. That is the documented trade for a self-hosted single user; ship
 * CODELOCK_BUILD_UNLOCK_PUBLIC_KEY instead for anything distributed.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const defaults = {
  webUrl: process.env.CODELOCK_BUILD_WEB_URL || 'http://localhost:3000',
  apiUrl: process.env.CODELOCK_BUILD_API_URL || 'http://localhost:4000',
  unlockPublicKey: process.env.CODELOCK_BUILD_UNLOCK_PUBLIC_KEY || '',
  unlockSecret: process.env.CODELOCK_BUILD_UNLOCK_SECRET || '',
  // Without this the auto-start feature in src/backend.ts is unreachable from a
  // build: config.ts falls back to '' and reports 'not-configured', so the app
  // opens against a backend nobody started. config.json still overrides it.
  backendCommand: process.env.CODELOCK_BUILD_BACKEND_COMMAND || '',
};

// A distributed package is one anybody can unpack. The HS256 secret inside it
// would let anybody mint unlock tokens, so a Store build refuses to carry it
// and insists on the public key. This is the build's job, not the release
// checklist's: a checklist can be skipped, an exit code cannot.
const distributed = process.env.CODELOCK_BUILD_TARGET === 'store';
if (distributed) {
  const problems = [];
  if (defaults.unlockSecret) {
    problems.push('CODELOCK_BUILD_UNLOCK_SECRET is set. A distributed build must not carry the HS256 secret.');
  }
  if (!defaults.unlockPublicKey) {
    problems.push('CODELOCK_BUILD_UNLOCK_PUBLIC_KEY is empty. Generate a pair: node scripts/gen-unlock-keys.mjs');
  }
  if (defaults.backendCommand) {
    problems.push('CODELOCK_BUILD_BACKEND_COMMAND is set. A Store package must not run a command from its build.');
  }
  if (problems.length > 0) {
    console.error(`Refusing to write build defaults for a Store build:\n  - ${problems.join('\n  - ')}`);
    process.exit(1);
  }
}

mkdirSync(dist, { recursive: true });
writeFileSync(path.join(dist, 'build-defaults.json'), `${JSON.stringify(defaults, null, 2)}\n`);

const verifiable = Boolean(defaults.unlockPublicKey || defaults.unlockSecret);
console.log(
  `build defaults: webUrl=${defaults.webUrl} unlockKey=${verifiable ? 'set' : 'MISSING'} ` +
    `backendCommand=${defaults.backendCommand ? 'set' : 'none'}`,
);
if (!verifiable) {
  console.warn(
    'No unlock key baked in. The installed app will not be able to release a\n' +
      'lock until config.json is filled in on the target machine.',
  );
}
