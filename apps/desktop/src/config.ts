import { app } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * Where the installed app gets its settings.
 *
 * A packaged Electron app has no shell environment, so reading `process.env`
 * alone leaves an installed build pointing at a placeholder domain with no
 * unlock key — it would never open. Resolution order:
 *
 *   1. Environment variables. Development only, and how `npm run dev` works.
 *   2. `config.json` in the user data directory. This is the one an installed
 *      app actually uses, and the user can edit it to point at their own
 *      server without rebuilding.
 *   3. Values baked in at build time (see scripts/write-defaults).
 *
 * The file is created on first run so there is always something concrete to
 * edit, rather than a silent failure the user has to guess at.
 */

export interface DesktopConfig {
  /** URL of the deployed CodeLock web app. */
  webUrl: string;
  /**
   * Verifies unlock tokens. Either the API's RSA public key (preferred for
   * distributed builds — nothing secret ships) or the shared HS256 secret,
   * matching the API's JWT_UNLOCK_SECRET (fine for a self-hosted single user).
   */
  unlockPublicKey: string;
  unlockSecret: string;
}

/**
 * Written next to the compiled output by scripts/write-defaults.mjs. Reading
 * process.env here instead would be useless: a packaged app has no shell
 * environment, so the values must travel inside the bundle.
 */
function readBuildDefaults(): DesktopConfig {
  const fallback: DesktopConfig = { webUrl: 'http://localhost:3000', unlockPublicKey: '', unlockSecret: '' };
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const raw = readFileSync(path.join(here, 'build-defaults.json'), 'utf8');
    return { ...fallback, ...(JSON.parse(raw) as Partial<DesktopConfig>) };
  } catch {
    return fallback;
  }
}

const BUILD_DEFAULTS: DesktopConfig = readBuildDefaults();

let cached: DesktopConfig | null = null;

export function configPath(): string {
  return path.join(app.getPath('userData'), 'config.json');
}

export function loadConfig(): DesktopConfig {
  if (cached) return cached;

  const file = configPath();
  let fromFile: Partial<DesktopConfig> = {};

  if (existsSync(file)) {
    try {
      fromFile = JSON.parse(readFileSync(file, 'utf8')) as Partial<DesktopConfig>;
    } catch {
      // A corrupt config must not prevent the app from starting; fall through
      // to defaults and let the user see the rewritten file.
      fromFile = {};
    }
  }

  cached = {
    webUrl: process.env.CODELOCK_WEB_URL || fromFile.webUrl || BUILD_DEFAULTS.webUrl,
    unlockPublicKey:
      process.env.CODELOCK_UNLOCK_PUBLIC_KEY ||
      fromFile.unlockPublicKey ||
      BUILD_DEFAULTS.unlockPublicKey,
    unlockSecret:
      process.env.CODELOCK_UNLOCK_SECRET || fromFile.unlockSecret || BUILD_DEFAULTS.unlockSecret,
  };

  if (!existsSync(file)) writeConfig(cached);
  return cached;
}

export function writeConfig(config: DesktopConfig): void {
  const file = configPath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  cached = config;
}

/** True when the app can actually verify an unlock. */
export function canVerifyUnlocks(config: DesktopConfig): boolean {
  return Boolean(config.unlockPublicKey || config.unlockSecret);
}
