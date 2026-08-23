/**
 * Generate every app icon from one source of truth.
 *
 * The geometry below is the padlock in apps/web/src/components/ui/lock-mark.tsx,
 * transcribed into its 20x20 viewBox coordinates. That component is the mark;
 * anything drawn differently here is a second mark, which is the thing the
 * rebrand existed to stop. The previous generator drew a *filled* padlock with a
 * punched keyhole slot — the pre-rebrand artwork the tray, the favicon and the
 * installer were still showing.
 *
 *   node scripts/make-icons.mjs
 *
 * Writes:
 *   apps/web/src/app/icon.png          favicon
 *   apps/web/src/app/apple-icon.png    home-screen tile (square: iOS masks it)
 *   apps/desktop/build/icon.png        Linux, and the macOS source
 *   apps/desktop/build/icon.ico        Windows taskbar and installer
 *
 * Hand-rolled zlib rather than an image dependency, matching what this repo
 * already did for the desktop icon — one 256px square does not justify a native
 * module in the install graph.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Dark palette, on purpose.
 *
 * An icon sits on a desktop or a browser tab whose theme we do not control, so
 * it cannot follow the one the page is in. The dark plate is the choice that
 * reads on both: light-on-dark keeps contrast against a pale tab strip, where a
 * light plate would dissolve into it.
 */
const SURFACE = [0x17, 0x17, 0x16]; // --color-surface, dark
const ACCENT = [0x4e, 0xd1, 0x8f]; // --color-accent, dark
const EDGE = [0x2b, 0x2b, 0x28]; // --color-border, dark

// --- the mark, in lock-mark.tsx's own 20x20 coordinates ---------------------

const VIEWBOX = 20;
const STROKE = 1.6; // strokeWidth on both the shackle and the body
const HALF = STROKE / 2;

const SHACKLE = { cx: 10, cy: 6, r: 3.5, footY: 8.5 };
const BODY = { x: 3.5, y: 8.5, w: 13, h: 8.5, rx: 2 };
const KEYHOLE = { cx: 10, cy: 12.75, r: 1.15 };

/** Distance from a point to a line segment. */
function distanceToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

/**
 * Distance to the shackle's centreline: the upper half of a circle, plus the
 * two straight legs dropping to the body. Round caps come free — distance to a
 * segment already rounds at its ends, which is what strokeLinecap="round" is.
 */
function distanceToShackle(x, y) {
  const { cx, cy, r, footY } = SHACKLE;
  let best = Infinity;

  // The arc, but only its top half: below the centre the legs take over.
  if (y <= cy) best = Math.abs(Math.hypot(x - cx, y - cy) - r);

  best = Math.min(best, distanceToSegment(x, y, cx - r, cy, cx - r, footY));
  best = Math.min(best, distanceToSegment(x, y, cx + r, cy, cx + r, footY));
  return best;
}

/** Signed distance to the body's rounded rectangle. Negative inside. */
function signedDistanceToBody(x, y) {
  const { x: bx, y: by, w, h, rx } = BODY;
  const cx = bx + w / 2;
  const cy = by + h / 2;
  const qx = Math.abs(x - cx) - (w / 2 - rx);
  const qy = Math.abs(y - cy) - (h / 2 - rx);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rx;
}

/**
 * Is the mark inked at this point?
 *
 * Both strokes are outlines, so a point is inked when it lies within half a
 * stroke of a centreline — not when it is inside the shape. The keyhole is the
 * one filled element, exactly as in the component.
 */
function markCovers(x, y) {
  const strokes = Math.min(distanceToShackle(x, y), Math.abs(signedDistanceToBody(x, y)));
  const keyhole = Math.hypot(x - KEYHOLE.cx, y - KEYHOLE.cy) - KEYHOLE.r;
  return Math.min(strokes - HALF, keyhole) <= 0;
}

// --- rasteriser -------------------------------------------------------------

/** Sub-pixel samples per axis. 4x4 is enough to hide the stair-stepping. */
const SAMPLES = 4;

/**
 * @param size output edge length in pixels
 * @param plateRadius corner radius of the background plate, in pixels. Zero
 *   means a full-bleed square, which is what iOS wants: it applies its own mask
 *   and a pre-rounded tile shows a dark halo inside it.
 * @param inset how much of the square the mark leaves as breathing room
 */
function renderIcon(size, { plateRadius, inset = 0.19 }) {
  const px = Buffer.alloc(size * size * 4);

  const paint = (i, [r, g, b], a) => {
    px[i] = Math.round(r * a + px[i] * (1 - a));
    px[i + 1] = Math.round(g * a + px[i + 1] * (1 - a));
    px[i + 2] = Math.round(b * a + px[i + 2] * (1 - a));
    px[i + 3] = Math.round(255 * a + px[i + 3] * (1 - a));
  };

  // Maps a pixel coordinate into the mark's 20x20 space.
  const markSize = size * (1 - inset * 2);
  const toMark = (v) => ((v - size * inset) / markSize) * VIEWBOX;

  const plateSdf = (x, y) => {
    const half = size / 2;
    const qx = Math.abs(x - half) - (half - plateRadius);
    const qy = Math.abs(y - half) - (half - plateRadius);
    return (
      Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - plateRadius
    );
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let plate = 0;
      let edge = 0;
      let mark = 0;

      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const sampleX = x + (sx + 0.5) / SAMPLES;
          const sampleY = y + (sy + 0.5) / SAMPLES;
          const d = plateSdf(sampleX, sampleY);
          if (d > 0) continue;
          plate++;
          // A hairline rim so the tile has an edge on a dark desktop.
          if (d > -1.5 && plateRadius > 0) edge++;
          if (markCovers(toMark(sampleX), toMark(sampleY))) mark++;
        }
      }

      if (plate === 0) continue;
      const total = SAMPLES * SAMPLES;
      const i = (y * size + x) * 4;
      paint(i, SURFACE, plate / total);
      if (edge > 0) paint(i, EDGE, edge / total);
      if (mark > 0) paint(i, ACCENT, mark / total);
    }
  }

  return px;
}

// --- PNG / ICO encoding -----------------------------------------------------

function encodePng(rgba, size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** ICO container holding a single PNG. Accepted by every Windows since Vista. */
function wrapIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image

  const entry = Buffer.alloc(16);
  entry[0] = 0; // 0 means 256
  entry[1] = 0;
  entry[2] = 0; // palette
  entry[4] = 1; // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(6 + 16, 12); // offset
  return Buffer.concat([header, entry, png]);
}

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c;
}

// --- outputs ----------------------------------------------------------------

const APP = 256;
const appPng = encodePng(renderIcon(APP, { plateRadius: APP * 0.2 }), APP);

const targets = [
  ['apps/web/src/app/icon.png', appPng],
  // Square, not rounded: iOS masks the tile itself.
  ['apps/web/src/app/apple-icon.png', encodePng(renderIcon(180, { plateRadius: 0 }), 180)],
  ['apps/desktop/build/icon.png', appPng],
  ['apps/desktop/build/icon.ico', wrapIco(appPng)],
];

for (const [relative, bytes] of targets) {
  const out = path.join(ROOT, relative);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, bytes);
  console.log(`wrote ${relative} (${bytes.length} bytes)`);
}
