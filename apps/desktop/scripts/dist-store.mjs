/**
 * Build the Microsoft Store package.
 *
 * The three identity values come from Partner Center (app > Product management
 * > Product identity) and from nowhere else. They are not in electron-builder.yml
 * because they belong to one developer account, and a placeholder would build
 * a package the Store rejects on upload with a message far less useful than
 * this one. Missing any of them is a named release blocker, so the build stops
 * here, before electron-builder starts, and says which.
 *
 *   CODELOCK_STORE_IDENTITY_NAME=<Package/Identity/Name>
 *   CODELOCK_STORE_PUBLISHER=<Package/Identity/Publisher, CN=...>
 *   CODELOCK_STORE_PUBLISHER_DISPLAY_NAME=<Package/Properties/PublisherDisplayName>
 *
 * Expects `npm run build` to have run with CODELOCK_BUILD_TARGET=store, which
 * is what refuses to bake the HS256 secret into a distributed package; the
 * `dist:store` script in package.json does both in order. Output lands in
 * release/ next to the NSIS installers, unsigned: the Store signs it.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { prepareStoreToolchain } from './store-toolchain.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..');
const require = createRequire(import.meta.url);

const REQUIRED = {
  CODELOCK_STORE_IDENTITY_NAME: 'Package/Identity/Name',
  CODELOCK_STORE_PUBLISHER: 'Package/Identity/Publisher',
  CODELOCK_STORE_PUBLISHER_DISPLAY_NAME: 'Package/Properties/PublisherDisplayName',
};

const missing = Object.keys(REQUIRED).filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(
    'Store build blocked: Partner Center identity is not set.\n' +
      missing.map((name) => `  ${name}  (${REQUIRED[name]})`).join('\n') +
      '\n\nThese are issued when the app name is reserved in Partner Center' +
      ' (Product management > Product identity). See docs/store/RELEASE-GUIDE.md.',
  );
  process.exit(1);
}

const identityName = process.env.CODELOCK_STORE_IDENTITY_NAME.trim();
const publisher = process.env.CODELOCK_STORE_PUBLISHER.trim();
const publisherDisplayName = process.env.CODELOCK_STORE_PUBLISHER_DISPLAY_NAME.trim();

// Package/Identity/Name: 3-50 characters of [A-Za-z0-9.-] (the Store's own
// rule, also enforced by electron-builder). Checked here so the failure names
// the variable rather than a manifest line.
if (!/^[A-Za-z0-9.-]{3,50}$/.test(identityName)) {
  console.error(
    `Store build blocked: CODELOCK_STORE_IDENTITY_NAME must be 3-50 characters of letters, digits, . or -, got "${identityName}".`,
  );
  process.exit(1);
}

// The Store's Publisher is a CN=<GUID> the account was issued; anything else
// is a typo that would only surface as an upload rejection.
if (!/^CN=[0-9A-Fa-f-]{36}$/.test(publisher)) {
  console.error(
    `Store build blocked: CODELOCK_STORE_PUBLISHER must look like CN=<GUID>, got "${publisher}".`,
  );
  process.exit(1);
}

// The Store version is Major.Minor.Patch.0 and Major must not be 0. Catching it
// here beats discovering it in Partner Center after a multi-minute build.
const { version } = JSON.parse(readFileSync(path.join(appDir, 'package.json'), 'utf8'));
const major = Number.parseInt(String(version).split('.')[0], 10);
if (!(major >= 1)) {
  console.error(
    `Store build blocked: version ${version} maps to ${version}.0 and the Store rejects` +
      ' a first component of 0. Bump apps/desktop/package.json to 1.0.0 or higher.',
  );
  process.exit(1);
}

const args = [
  '--win',
  'appx',
  '--x64',
  '--arm64',
  '--publish',
  'never',
  `-c.appx.identityName=${identityName}`,
  `-c.appx.publisher=${publisher}`,
  `-c.appx.publisherDisplayName=${publisherDisplayName}`,
];

// What actually ships is dist/build-defaults.json, written by write-defaults.mjs
// under CODELOCK_BUILD_TARGET=store. Re-read it rather than trust that the
// right predecessor ran: someone invoking this script by hand after a plain
// `npm run build` must not get a package with the HS256 secret inside.
let baked;
try {
  baked = JSON.parse(readFileSync(path.join(appDir, 'dist', 'build-defaults.json'), 'utf8'));
} catch {
  console.error('Store build blocked: dist/build-defaults.json is missing. Run `npm run dist:store`, not this script alone.');
  process.exit(1);
}
if (baked.unlockSecret || !baked.unlockPublicKey || baked.backendCommand) {
  console.error(
    'Store build blocked: dist/build-defaults.json was not written for a Store build' +
      ' (secret present, public key missing, or backend command set). Run `npm run dist:store`.',
  );
  process.exit(1);
}

// electron-builder's own makeappx cannot run on current Windows; see
// store-toolchain.mjs. The prepared cache lives under release/ so a clean
// checkout has nothing to reset.
let toolchain;
try {
  toolchain = prepareStoreToolchain(path.join(appDir, 'release'));
} catch (err) {
  console.error(`Store build blocked: ${err.message}`);
  process.exit(1);
}

console.log(`Store package: ${identityName} ${version}.0 by ${publisherDisplayName}`);
console.log(`AppX tools: ${toolchain.sdkTools} via ${toolchain.cacheDir}`);

// electron-builder's CLI is run directly under this node, not through npx and
// a shell: the identity values are user-supplied strings, and a shell would
// interpret any metacharacter in them.
const cli = require.resolve('electron-builder/cli.js');
const result = spawnSync(process.execPath, [cli, ...args], {
  cwd: appDir,
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_BUILDER_CACHE: toolchain.cacheDir },
});
process.exit(result.status ?? 1);
