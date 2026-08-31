import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_PROBLEMS } from './problems/index.js';

/**
 * Every authored batch actually reaches ALL_PROBLEMS.
 *
 * Wiring a batch is one import and one spread, and missing the spread is
 * silent: an unused import type-checks, the batch checker only reads files,
 * and the rest of the suite only ever sees what ALL_PROBLEMS contains. Six
 * families once sat on disk, fully authored and completely invisible, until an
 * importer run rejected 46 slugs as unknown problems.
 *
 * This closes that gap the only way that works — by comparing the directory
 * against the aggregate rather than trusting either one.
 */
const DIR = path.join(__dirname, 'problems');

describe('corpus wiring', () => {
  const batchFiles = readdirSync(DIR).filter(
    (f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.test.ts'),
  );

  it('finds at least one batch file', () => {
    expect(batchFiles.length).toBeGreaterThan(0);
  });

  it('includes every slug on disk', () => {
    const onDisk = new Set<string>();
    for (const file of batchFiles) {
      const src = readFileSync(path.join(DIR, file), 'utf8');
      for (const m of src.matchAll(/slug: *'([a-z0-9-]+)'/g)) onDisk.add(m[1]!);
    }
    const wired = new Set(ALL_PROBLEMS.map((p) => p.slug));
    const missing = [...onDisk].filter((s) => !wired.has(s));

    expect(missing, `authored but not in ALL_PROBLEMS: ${missing.join(', ')}`).toEqual([]);
    expect(wired.size).toBe(onDisk.size);
  });

  it('exports each batch exactly once', () => {
    const index = readFileSync(path.join(DIR, 'index.ts'), 'utf8');
    for (const file of batchFiles) {
      const src = readFileSync(path.join(DIR, file), 'utf8');
      const name = src.match(/^export const (TIER_[A-Z0-9_]+):/m)?.[1];
      expect(name, `${file} exports no TIER_* array`).toBeTruthy();
      const spreads = index.split(`  ...${name},`).length - 1;
      expect(spreads, `${name} spread ${spreads} times in ALL_PROBLEMS`).toBe(1);
    }
  });
});
