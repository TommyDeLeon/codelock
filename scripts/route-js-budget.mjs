/**
 * Measures gzipped client JS per route.
 *
 * Next 16 + Turbopack no longer prints the "First Load JS" column, so the
 * 150 KB budget in docs/DESIGN.md §4a has nothing to be checked against.
 * This reads each prerendered route's HTML, collects every /_next/static
 * script it references, and gzips those files off disk.
 *
 * Unique per route, so a chunk shared between routes is counted once within a
 * route and the (site) TOTAL is the union across the marketing routes — which
 * is what the budget is written against.
 *
 *   node scripts/route-js-budget.mjs [--json] [--baseline path]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';

const WEB = resolve(process.cwd(), 'apps/web');
const APP = join(WEB, '.next/server/app');

// The marketing surfaces the budget applies to. /login is included because its
// backdrop is in scope; /lock is listed to prove motion never reaches it.
const ROUTES = {
  '/': 'index.html',
  '/how-it-works': 'how-it-works.html',
  '/limits': 'limits.html',
  '/install': 'install.html',
  '/demo': 'demo.html',
  '/support': 'support.html',
  '/login': 'login.html',
  '/lock': 'lock.html',
};

const SITE = ['/', '/how-it-works', '/limits', '/install', '/demo', '/support'];

function scriptsFor(html) {
  const out = new Set();
  const re = new RegExp(String.raw`/_next/static/chunks/[A-Za-z0-9_.-]+.js`, 'g');
  for (const m of html.matchAll(re)) out.add(m[0]);
  return out;
}

function gzipBytes(rel) {
  const p = join(WEB, '.next', rel.replace('/_next/', ''));
  if (!existsSync(p)) return 0;
  return gzipSync(readFileSync(p), { level: 9 }).length;
}

const perRoute = {};
const siteUnion = new Set();

for (const [route, file] of Object.entries(ROUTES)) {
  const p = join(APP, file);
  if (!existsSync(p)) { perRoute[route] = null; continue; }
  const scripts = scriptsFor(readFileSync(p, 'utf8'));
  let total = 0;
  for (const s of scripts) total += gzipBytes(s);
  perRoute[route] = { bytes: total, chunks: scripts.size };
  if (SITE.includes(route)) for (const s of scripts) siteUnion.add(s);
}

let unionBytes = 0;
for (const s of siteUnion) unionBytes += gzipBytes(s);

const kb = (b) => (b / 1024).toFixed(1).padStart(7) + ' KB';
const report = { perRoute, siteUnion: { bytes: unionBytes, chunks: siteUnion.size } };

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Route JS, gzipped (level 9)\n');
  for (const [route, v] of Object.entries(perRoute)) {
    if (!v) { console.log(`  ${route.padEnd(16)}  (not prerendered)`); continue; }
    console.log(`  ${route.padEnd(16)} ${kb(v.bytes)}   ${String(v.chunks).padStart(3)} chunks`);
  }
  console.log(`\n  ${'(site) UNION'.padEnd(16)} ${kb(unionBytes)}   ${siteUnion.size} chunks`);
}

const bi = process.argv.indexOf('--baseline');
if (bi > -1 && process.argv[bi + 1]) {
  const base = JSON.parse(readFileSync(process.argv[bi + 1], 'utf8'));
  const d = unionBytes - base.siteUnion.bytes;
  console.log(
    `\n  vs baseline: ${(base.siteUnion.bytes / 1024).toFixed(1)} KB -> ` +
    `${(unionBytes / 1024).toFixed(1)} KB  (${d >= 0 ? '+' : ''}${(d / 1024).toFixed(1)} KB)` +
    `\n  budget: 150.0 KB  ${d <= 150 * 1024 ? 'PASS' : 'FAIL'}`,
  );
}
