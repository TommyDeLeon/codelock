#!/usr/bin/env node
/**
 * One palette, enforced.
 *
 *   node scripts/check-palette.mjs
 *
 * Why this exists
 * ---------------
 * This repository had four palettes. `packages/ui/src/tokens.css` argued at
 * length for a pine-green brand; the marketing site and the desktop dashboard
 * had both moved to brick red without telling it, and the dark lock screen
 * used a peach nothing else in the product used. On the marketing site
 * `--color-danger` and `--color-accent` were set to the *same hex*, so a
 * destructive state and a primary button were indistinguishable.
 *
 * None of that was carelessness. The reasoning was written down carefully, in
 * comments, in the file that lost the argument — and a comment cannot stop a
 * second file being written. `apps/desktop/renderer/theme.css` even opened
 * with "Palette values mirrored from site.css — change the values in BOTH
 * places", an instruction nobody followed and nothing checked.
 *
 * So this is the same move the ten-second escape got: a promise becomes an
 * invariant. Colour is declared in ONE file. Everywhere else refers to it.
 *
 * What counts as a violation
 * --------------------------
 * A hex literal, or an `rgb()`/`hsl()` colour, in any stylesheet other than
 * the palette itself. Referring to a palette variable is always fine, and so
 * is a plain `var(--cl-…)` alias, which is how the Electron renderer maps the
 * shared names onto the ones its controls were written against.
 *
 * Shadows and glows are colour too, but rgba black at low alpha is a depth
 * cue rather than a brand decision, so `rgb(0 0 0 / …)` and its variants are
 * allowed through. Everything else has to come from the palette.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** The one file allowed to say what a colour is. */
const PALETTE = join('packages', 'ui', 'src', 'palette.css');

/** Directories that are not ours to police. */
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'dist-renderer', 'release', 'build', 'out', '.tmp']);

/**
 * A hex colour, or a functional colour notation.
 *
 * Deliberately not matching `var(...)`: the whole point is that referring to
 * the palette is the correct thing to do and must never be flagged.
 */
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const FUNCTIONAL = /\b(?:rgba?|hsla?|oklch|lab|color)\(/g;

/**
 * Black and white at an alpha, which is depth rather than brand.
 *
 * A shadow is the one place a raw colour is honest: it is not a decision about
 * what the product looks like, it is a decision about how far off the page
 * something sits.
 */
const NEUTRAL_ALPHA = /\b(?:rgba?|hsla?)\(\s*(?:0\s*[, ]\s*0\s*[, ]\s*0|255\s*[, ]\s*255\s*[, ]\s*255)\b[^)]*\)/g;

/**
 * Pure black or white, which inside a mask means "opaque" rather than a colour.
 *
 * Only stripped on lines that are actually masking. Anywhere else a bare
 * `#000` is a real colour choice and stays a violation: the point is to allow
 * the idiom, not to open a hole shaped like it.
 */
const MASK_LINE = /mask-image|--cf-fade|-webkit-mask/;
const PURE_NEUTRAL = /#(?:000|fff|000000|ffffff)/gi;

function cssFiles(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) cssFiles(full, found);
    else if (entry.endsWith('.css')) found.push(full);
  }
  return found;
}

const violations = [];

for (const file of cssFiles(ROOT)) {
  const rel = relative(ROOT, file);
  if (rel.split(sep).join('/') === PALETTE.split(sep).join('/')) continue;

  const source = readFileSync(file, 'utf8');

  /*
    Block comments are blanked across the whole file before anything is read
    line by line, with their newlines kept so reported line numbers stay true.

    Doing this per line does not work, and failed twice in a row here: the
    middle of a multi-line comment carries no `/*` of its own, so a sentence
    *explaining* a colour was flagged as declaring one. Comments are where the
    history lives — this very file quotes the hexes that caused the drift — and
    a check that cannot read one without tripping over it would push people
    into deleting the explanations to make it pass.
  */
  const blanked = source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const lines = source.split('\n');

  blanked.split('\n').forEach((codeLine, i) => {
    const line = lines[i] ?? '';
    const code = codeLine.split('//')[0] ?? '';

    // A mask reads only the alpha channel of whatever colour it is given, so
    // the colour itself carries no meaning: `#000` there is the conventional
    // spelling of "fully opaque". Skipped outright rather than filtered,
    // because there is nothing on such a line worth checking.
    if (MASK_LINE.test(code)) return;

    const stripped = code.replace(NEUTRAL_ALPHA, '');

    const hits = [...(stripped.match(HEX) ?? []), ...(stripped.match(FUNCTIONAL) ?? [])];
    if (hits.length > 0) {
      violations.push({ file: rel, line: i + 1, text: line.trim(), hits: [...new Set(hits)] });
    }
  });
}

if (violations.length === 0) {
  console.log('Palette check: one source of colour, as intended.');
  process.exit(0);
}

console.error(`Palette check failed: ${violations.length} colour declaration(s) outside ${PALETTE}.\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  ${v.hits.join(', ')}`);
  console.error(`    ${v.text}`);
}
console.error(`
Colour belongs in ${PALETTE} and nowhere else. Refer to it instead:

    --accent: var(--cl-accent);        /* an alias for a differently-named system */
    color: var(--color-accent);        /* the Tailwind token, which maps to the same value */

This is not style policing. Four palettes is what this repository actually had,
and the file arguing hardest for one of them was the file nobody else read.
`);
process.exit(1);
