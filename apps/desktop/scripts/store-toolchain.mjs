/**
 * Assemble the toolchain electron-builder needs to produce an AppX, on a
 * machine where its own bundled copy cannot run.
 *
 * electron-builder 25 downloads a `winCodeSign` bundle whose makeappx.exe and
 * makepri.exe date from 2019 and declare private side-by-side assemblies. On
 * current Windows 11 builds activation of those assemblies fails ("Dependent
 * Assembly Microsoft.Windows.Build.Appx.AppxPackaging.dll could not be
 * found", event log SideBySide) and electron-builder reports it as
 * `spawn UNKNOWN`. The same tools from an installed Windows 10/11 SDK are
 * Microsoft-signed, self-contained and run fine. Verified 2026-09-18 on
 * Windows 11 10.0.26200 with SDK 10.0.26100.
 *
 * So: copy the bundle, overlay the SDK's makeappx/makepri, and point
 * ELECTRON_BUILDER_CACHE at the copy. The bundle also ships no arm64 tool
 * directory at all, which electron-builder nevertheless looks for when
 * building an arm64 package; makeappx is architecture-agnostic about what it
 * packs, so the x64 tools serve that directory too.
 *
 * The real cache is never modified. The SDK is free and already on GitHub's
 * windows-latest runners; without it this exits 1 naming the requirement.
 */
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, statSync, symlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

const SDK_BIN = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin';
const TOOLS = ['makeappx.exe', 'makepri.exe'];

/** Newest installed SDK directory that has both tools for x64. */
export function findSdkTools() {
  if (!existsSync(SDK_BIN)) return null;
  const versions = readdirSync(SDK_BIN)
    .filter((name) => /^10\.0\.\d+\.\d+$/.test(name))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  for (const version of versions) {
    const dir = path.join(SDK_BIN, version, 'x64');
    if (TOOLS.every((tool) => existsSync(path.join(dir, tool)))) return dir;
  }
  return null;
}

/** Where electron-builder keeps (or will download) its winCodeSign bundle. */
function bundlePath() {
  const { appBuilderPath } = require('app-builder-bin');
  return execFileSync(appBuilderPath, ['download-artifact', '--name', 'winCodeSign'], {
    encoding: 'utf8',
  }).trim();
}

/**
 * Returns the cache directory to pass as ELECTRON_BUILDER_CACHE, or throws
 * with a message naming what is missing.
 */
export function prepareStoreToolchain(outDir) {
  const sdkTools = findSdkTools();
  if (!sdkTools) {
    throw new Error(
      'Windows 10/11 SDK not found (no makeappx.exe under ' +
        `${SDK_BIN}\\10.0.*\\x64). It is free: install "Windows SDK" from ` +
        'https://developer.microsoft.com/windows/downloads/windows-sdk/ or via ' +
        'Visual Studio Installer, then rerun.',
    );
  }

  const source = bundlePath();
  const bundleName = path.basename(source);
  const realCache = path.dirname(path.dirname(source));
  const cacheDir = path.join(outDir, 'electron-builder-cache');
  const target = path.join(cacheDir, 'winCodeSign', bundleName);

  // ELECTRON_BUILDER_CACHE moves the whole cache, not one bundle, and the
  // Electron zip alone is ~100 MB. Junction every other entry back to the
  // real cache so only winCodeSign differs; junctions need no privileges.
  mkdirSync(cacheDir, { recursive: true });
  for (const entry of readdirSync(realCache)) {
    if (entry === 'winCodeSign') continue;
    // Entries come from a directory listing, so this cannot trigger today;
    // it is here so a poisoned cache on a shared runner cannot aim a junction
    // outside cacheDir.
    if (entry.includes('..') || path.isAbsolute(entry) || /[\\/]/.test(entry)) continue;
    const source = path.join(realCache, entry);
    const link = path.join(cacheDir, entry);
    // existsSync follows the junction, so a link whose target was cleaned up
    // reads as absent and symlinkSync would then throw EEXIST. lstat sees the
    // entry itself; a stale one is removed and remade.
    if (lstatSync(link, { throwIfNoEntry: false })) {
      if (existsSync(link)) continue;
      rmSync(link, { recursive: true, force: true });
    }
    if (statSync(source).isDirectory()) {
      symlinkSync(source, link, 'junction');
    } else {
      cpSync(source, link);
    }
  }

  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
    // Everything Windows needs, including rcedit-*.exe at the bundle root.
    // The darwin/linux trees are skipped: they contain symlinks that a plain
    // copy on Windows cannot recreate, and nothing here runs them.
    for (const entry of readdirSync(source)) {
      if (entry === 'darwin' || entry === 'linux') continue;
      cpSync(path.join(source, entry), path.join(target, entry), { recursive: true });
    }
  }

  for (const arch of ['x64', 'arm64']) {
    const dir = path.join(target, 'windows-10', arch);
    mkdirSync(dir, { recursive: true });
    if (arch === 'arm64') {
      // See the header: no arm64 tools ship in the bundle. The x64 signtool
      // is copied as well because electron-builder signs from the same dir.
      // force: true so a half-finished earlier run cannot leave stale files.
      cpSync(path.join(target, 'windows-10', 'x64'), dir, { recursive: true, force: true });
    }
    for (const tool of TOOLS) {
      cpSync(path.join(sdkTools, tool), path.join(dir, tool), { force: true });
    }
  }

  return { cacheDir, sdkTools, bundleName };
}
