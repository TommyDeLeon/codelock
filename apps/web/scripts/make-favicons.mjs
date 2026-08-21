/**
 * Generate the favicon set.
 *
 * The manifest referenced /icons/icon-192.png and friends, none of which
 * existed — so every install attempt 404'd and there was no favicon at all.
 * This draws the same green padlock as the desktop app from the same tokens,
 * then box-downsamples to each required size.
 *
 *   node scripts/make-favicons.mjs
 *
 * Outputs:
 *   src/app/icon.png          picked up automatically by Next as the favicon
 *   src/app/apple-icon.png    apple-touch-icon
 *   public/favicon.ico        for browsers and crawlers that still ask for it
 *   public/icons/*.png        referenced by manifest.webmanifest
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MASTER = 512;

const BG = [23, 23, 22];
const ACCENT = [86, 178, 131];
const EDGE = [43, 43, 40];

/** Draw the mark at MASTER resolution; every export is a downsample of this. */
function drawMaster() {
  const S = MASTER;
  const px = Buffer.alloc(S * S * 4);
  const k = S / 256; // the geometry below was designed on a 256 grid

  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= S || y >= S) return;
    const i = (y * S + x) * 4;
    const sa = a / 255;
    px[i] = Math.round(r * sa + px[i] * (1 - sa));
    px[i + 1] = Math.round(g * sa + px[i + 1] * (1 - sa));
    px[i + 2] = Math.round(b * sa + px[i + 2] * (1 - sa));
    px[i + 3] = Math.max(px[i + 3], Math.round(255 * sa));
  };

  const inRoundRect = (x, y, l, t, r, b, rad) => {
    if (x < l || x > r || y < t || y > b) return false;
    const cx = x < l + rad ? l + rad : x > r - rad ? r - rad : x;
    const cy = y < t + rad ? t + rad : y > b - rad ? b - rad : y;
    return (x - cx) ** 2 + (y - cy) ** 2 <= rad ** 2;
  };

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (inRoundRect(x, y, 8 * k, 8 * k, S - 9 * k, S - 9 * k, 52 * k)) set(x, y, BG);
    }
  }
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const outer = inRoundRect(x, y, 8 * k, 8 * k, S - 9 * k, S - 9 * k, 52 * k);
      const inner = inRoundRect(x, y, 10 * k, 10 * k, S - 11 * k, S - 11 * k, 50 * k);
      if (outer && !inner) set(x, y, EDGE);
    }
  }

  const cx = S / 2;
  const cy = 108 * k;
  const rad = 38 * k;
  const w = 17 * k;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dy = y - cy;
      if (dy > 0) continue;
      const band = Math.abs(Math.hypot(x - cx, dy) - rad);
      if (band <= w / 2) set(x, y, ACCENT, band > w / 2 - 1 ? 255 * (w / 2 - band) : 255);
    }
  }
  for (let y = cy; y < 140 * k; y++) {
    for (const legX of [cx - rad, cx + rad]) {
      for (let o = -w / 2; o <= w / 2; o += 0.5) set(Math.round(legX + o), Math.round(y), ACCENT);
    }
  }
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (inRoundRect(x, y, 58 * k, 132 * k, S - 59 * k, 212 * k, 18 * k)) set(x, y, ACCENT);
    }
  }
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = x - S / 2;
      const dy = y - 163 * k;
      if (dx * dx + dy * dy <= (13 * k) ** 2) set(x, y, BG);
      if (Math.abs(dx) <= 6 * k && y >= 163 * k && y <= 190 * k) set(x, y, BG);
    }
  }
  return px;
}

/** Box filter: averaging the source block avoids the aliasing nearest gives. */
function downsample(src, from, to) {
  const out = Buffer.alloc(to * to * 4);
  const ratio = from / to;
  for (let y = 0; y < to; y++) {
    for (let x = 0; x < to; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;
      for (let sy = Math.floor(y * ratio); sy < Math.floor((y + 1) * ratio); sy++) {
        for (let sx = Math.floor(x * ratio); sx < Math.floor((x + 1) * ratio); sx++) {
          const i = (sy * from + sx) * 4;
          r += src[i];
          g += src[i + 1];
          b += src[i + 2];
          a += src[i + 3];
          n++;
        }
      }
      const o = (y * to + x) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

function encodePng(rgba, size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
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
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** ICO holding 48/32/16 PNGs, which is what Windows and browsers expect. */
function buildIco(master, sizes) {
  const images = sizes.map((s) => ({ size: s, png: encodePng(downsample(master, MASTER, s), s) }));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + 16 * images.length;
  const entries = images.map((img) => {
    const e = Buffer.alloc(16);
    e[0] = img.size >= 256 ? 0 : img.size;
    e[1] = img.size >= 256 ? 0 : img.size;
    e[4] = 1;
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(img.png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += img.png.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c;
}

const master = drawMaster();
mkdirSync(path.join(ROOT, 'public', 'icons'), { recursive: true });

const outputs = [
  ['src/app/icon.png', 256],
  ['src/app/apple-icon.png', 180],
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['public/icons/icon-maskable-512.png', 512],
  ['public/og.png', 512],
];

for (const [rel, size] of outputs) {
  const data = size === MASTER ? master : downsample(master, MASTER, size);
  writeFileSync(path.join(ROOT, rel), encodePng(data, size));
  console.log(`${rel} (${size}x${size})`);
}

writeFileSync(path.join(ROOT, 'public/favicon.ico'), buildIco(master, [48, 32, 16]));
console.log('public/favicon.ico (48, 32, 16)');
