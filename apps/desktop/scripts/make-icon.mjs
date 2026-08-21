/**
 * Generate the app icon.
 *
 * A padlock in the project's green on the dark surface, drawn from the
 * same tokens the web app uses so the installer, the taskbar, and the UI agree.
 * Written by hand with zlib rather than pulling in an image library for one
 * 256x256 square.
 *
 *   node scripts/make-icon.mjs
 *
 * Produces build/icon.png (used by Linux and as the macOS source) and
 * build/icon.ico (Windows). The .ico wraps the PNG directly, which every
 * Windows version since Vista accepts.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SIZE = 256;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'build');

const BG = [23, 23, 22]; // --color-surface, dark
const ACCENT = [86, 178, 131]; // --color-success, dark
const EDGE = [43, 43, 40]; // --color-border, dark

const px = Buffer.alloc(SIZE * SIZE * 4);

const set = (x, y, [r, g, b], a = 255) => {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  // Source-over against whatever is already there, so anti-aliased edges blend.
  const sa = a / 255;
  px[i] = Math.round(r * sa + px[i] * (1 - sa));
  px[i + 1] = Math.round(g * sa + px[i + 1] * (1 - sa));
  px[i + 2] = Math.round(b * sa + px[i + 2] * (1 - sa));
  px[i + 3] = Math.max(px[i + 3], Math.round(255 * sa));
};

/** Squared distance helper for round-rect corners. */
const inRoundRect = (x, y, left, top, right, bottom, radius) => {
  if (x < left || x > right || y < top || y > bottom) return false;
  const cx = x < left + radius ? left + radius : x > right - radius ? right - radius : x;
  const cy = y < top + radius ? top + radius : y > bottom - radius ? bottom - radius : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
};

// Background plate, rounded like an app tile.
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    if (inRoundRect(x, y, 8, 8, SIZE - 9, SIZE - 9, 52)) set(x, y, BG);
  }
}
// Hairline edge so the tile reads on a dark desktop.
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const inner = inRoundRect(x, y, 10, 10, SIZE - 11, SIZE - 11, 50);
    if (inRoundRect(x, y, 8, 8, SIZE - 9, SIZE - 9, 52) && !inner) set(x, y, EDGE);
  }
}

// Shackle: an open ring, drawn as a thick arc from 180deg to 360deg.
const shackleCx = SIZE / 2;
const shackleCy = 108;
const shackleR = 38;
const shackleW = 17;
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = x - shackleCx;
    const dy = y - shackleCy;
    const d = Math.hypot(dx, dy);
    const band = Math.abs(d - shackleR);
    if (dy <= 0 && band <= shackleW / 2) {
      // Feather the last pixel of the band for a smooth edge.
      const a = band > shackleW / 2 - 1 ? 255 * (shackleW / 2 - band) : 255;
      set(x, y, ACCENT, a);
    }
  }
}
// Straight legs joining the arc to the body.
for (let y = shackleCy; y < 140; y++) {
  for (const cx of [shackleCx - shackleR, shackleCx + shackleR]) {
    for (let o = -shackleW / 2; o <= shackleW / 2; o += 0.5) {
      set(Math.round(cx + o), y, ACCENT);
    }
  }
}

// Body.
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    if (inRoundRect(x, y, 58, 132, SIZE - 59, 212, 18)) set(x, y, ACCENT);
  }
}
// Keyhole, punched back to the plate colour.
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = x - SIZE / 2;
    const dy = y - 163;
    if (dx * dx + dy * dy <= 13 * 13) set(x, y, BG);
    if (Math.abs(dx) <= 6 && y >= 163 && y <= 190) set(x, y, BG);
  }
}

writeFileSync(path.join(OUT, 'icon.png'), encodePng(px));
writeFileSync(path.join(OUT, 'icon.ico'), wrapIco(encodePng(px)));
console.log(`wrote ${path.join(OUT, 'icon.png')} and icon.ico (${SIZE}x${SIZE})`);

/** Minimal RGBA PNG encoder. */
function encodePng(rgba) {
  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
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
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** ICO container holding a single PNG image. */
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
