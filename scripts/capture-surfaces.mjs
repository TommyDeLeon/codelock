/**
 * Photograph the product for the marketing site.
 *
 *   npx electron scripts/capture-surfaces.mjs [--only demo,limits]
 *
 * The figures on the landing page are captures of real screens, and the
 * captions say so. That is a promise worth keeping automatically: hand-taken
 * screenshots go stale the moment a colour moves, and this repository has just
 * spent a long session discovering how far four surfaces can drift when nothing
 * checks them.
 *
 * ## Why Electron rather than Playwright
 *
 * Electron is already a dependency, and it *is* the browser the product ships
 * in — a capture taken here uses the same Chromium the desktop shell renders
 * with, at the same version. Adding Playwright would mean downloading a second
 * browser in order to photograph the one already installed.
 *
 * `sharp` arrives with Next.js and does the encoding, so the three sources the
 * page asks for (avif, webp, jpg) all come from a single capture.
 *
 * ## What it deliberately will not do
 *
 * The lock surface only exists while a session is LOCKED, and engaging one
 * takes the screen of whoever is at the machine. This script never arms
 * anything: it photographs what is in front of it, and the caller is
 * responsible for putting a lock there and for releasing it afterwards. A
 * script that could seize your screen as a side effect of rebuilding the
 * website is not one anybody should run twice.
 */

import { app, BrowserWindow } from 'electron';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'codelock-marketing', 'public', 'images');
const API = process.env.CAPTURE_API_URL ?? 'http://localhost:4000';

/** Wide enough that nothing collapses to its phone layout, in a 16:10 frame. */
const VIEWPORT = { width: 1600, height: 1000 };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The surfaces the marketing site asks for, by the names it asks for them by.
 *
 * `themeVia` matters more than it looks. The product surfaces read their
 * palette from the profile, so the API decides them. The marketing pages use
 * next-themes, which reads localStorage — setting the profile does nothing to
 * them, and the first run of this script produced a "light" and a "dark"
 * capture of the limits page that were byte-for-byte the same brightness.
 * Exactly the failure these captures exist to end.
 */
const SURFACES = [
  {
    name: 'codelock-app-lock',
    url: 'http://localhost:3000/lock',
    needsLock: true,
    themeVia: 'profile',
    settle: 2500,
  },
  {
    name: 'codelock-demo',
    url: 'http://localhost:3100/demo',
    themeVia: 'storage',
    settle: 1500,
    /** The demo only shows the workspace once its countdown has fired. */
    arm: async (win) => {
      await win.webContents.executeJavaScript(`
        (() => {
          const button = [...document.querySelectorAll('button')]
            .find((b) => /arm the timer/i.test(b.textContent ?? ''));
          if (button) button.click();
          return Boolean(button);
        })()
      `);
      await wait(11_000);
    },
  },
  { name: 'codelock-limits', url: 'http://localhost:3100/limits', themeVia: 'storage', settle: 1200 },
];

const THEMES = [
  { theme: 'LIGHT', suffix: '-light' },
  { theme: 'DARK', suffix: '' },
];

/**
 * Put the profile on a theme.
 *
 * The lock screen reads its palette from the profile rather than from local
 * storage, which is what makes a themed capture of it possible at all.
 */
async function setTheme(theme) {
  const res = await fetch(`${API}/v1/settings/timer`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme }),
  });
  if (!res.ok) throw new Error(`Could not set theme ${theme}: ${res.status}`);
}

/** Is a lock actually up? Photographing an empty lock screen is worse than failing. */
async function lockIsUp() {
  try {
    const res = await fetch(`${API}/v1/lock/active`);
    const body = await res.json();
    return body?.session?.state === 'LOCKED';
  } catch {
    return false;
  }
}

async function encode(png, base) {
  const image = sharp(png);
  // All three are written because the page's image-set() asks for all three,
  // and a missing source is a broken figure rather than a slower one.
  await Promise.all([
    image.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(`${base}.jpg`),
    image.clone().webp({ quality: 80 }).toFile(`${base}.webp`),
    image.clone().avif({ quality: 58 }).toFile(`${base}.avif`),
  ]);
}

async function main() {
  const only = process.argv.includes('--only')
    ? process.argv[process.argv.indexOf('--only') + 1].split(',')
    : null;

  mkdirSync(OUT, { recursive: true });

  const win = new BrowserWindow({
    show: false,
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    useContentSize: true,
  });

  const wanted = SURFACES.filter((s) => !only || only.includes(s.name));
  const skipped = [];

  for (const { theme, suffix } of THEMES) {
    await setTheme(theme);

    // A cold cache per pass. The first run of this produced a "light" and a
    // "dark" capture of the lock screen with identical brightness, because the
    // window had the previous /settings/timer response in cache and the lock
    // surface therefore read the previous theme.
    await win.webContents.session.clearCache();

    for (const surface of wanted) {
      // Set CAPTURE_ALLOW_UNLOCKED=1 to photograph the lock route with no
      // session. The result is not a usable figure — it says "nothing is
      // locked" — but it is themed, so it is enough to prove the theming works
      // without taking anybody's screen to find out.
      const allowUnlocked = process.env.CAPTURE_ALLOW_UNLOCKED === '1';
      if (surface.needsLock && !allowUnlocked && !(await lockIsUp())) {
        skipped.push(`${surface.name}${suffix} — no LOCKED session`);
        continue;
      }

      await win.loadURL(surface.url);

      // next-themes stores the choice under `theme` and applies it on mount,
      // so it has to be written and the page reloaded rather than set after
      // the fact — a class toggled from outside React is overwritten on the
      // next render.
      if (surface.themeVia === 'storage') {
        await win.webContents.executeJavaScript(
          `try { localStorage.setItem('theme', '${theme.toLowerCase()}'); } catch {}`,
        );
        await win.webContents.reload();
        await wait(600);
      }

      await wait(surface.settle ?? 1200);
      if (surface.arm) await surface.arm(win);

      const image = await win.capturePage();
      const base = join(OUT, `${surface.name}${suffix}`);
      await encode(image.toPNG(), base);
      console.log(`captured ${surface.name}${suffix}`);
    }
  }

  if (skipped.length > 0) {
    console.log('\nSkipped:');
    for (const line of skipped) console.log(`  ${line}`);
  }

  win.destroy();
  app.quit();
}

app.whenReady().then(() =>
  main().catch((err) => {
    console.error(err);
    app.exit(1);
  }),
);
