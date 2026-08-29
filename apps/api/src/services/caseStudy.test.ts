import { describe, expect, it } from 'vitest';
import { Language } from '@prisma/client';
import { renderCaseStudy, type CaseStudyInput } from './caseStudy.js';

/**
 * This file is published to the user's own public repository, so the standard
 * is higher than "renders". It must never overstate a result, never invent a
 * figure it was not given, and never reproduce a problem statement that is not
 * ours to copy.
 */

const base: CaseStudyInput = {
  problemTitle: 'Two Sum',
  problemSlug: 'two-sum',
  difficulty: 'EASY',
  patternTags: ['array', 'hash-map'],
  language: Language.JAVASCRIPT,
  sourceCode: 'function solve(nums, target) {\n  return [];\n}\n',
  runtimeMs: 109,
  gateMs: 243,
  bestKnownMs: 100,
  attempts: 1,
  secondsLocked: 754,
  avgSolveSeconds: 420,
  solvedAt: new Date('2026-08-30T03:20:00.000Z'),
  leetcodeSlug: 'two-sum',
};

describe('renderCaseStudy', () => {
  it('carries all three sections of the framework, in order', () => {
    const md = renderCaseStudy(base);
    expect(md).toContain('# Two Sum');
    expect(md.indexOf('## Problem')).toBeLessThan(md.indexOf('## Solution'));
    expect(md.indexOf('## Solution')).toBeLessThan(md.indexOf('## Results'));
  });

  it('states the runtime against its budget and the margin', () => {
    const md = renderCaseStudy(base);
    expect(md).toContain('**109 ms**');
    expect(md).toContain('**243 ms**');
    expect(md).toContain('134 ms inside it');
  });

  it('reports the ratio to the best known solution rather than a bare number', () => {
    expect(renderCaseStudy(base)).toContain('1.09x the best known solution');
  });

  it('claims a record only when the run actually is one', () => {
    expect(renderCaseStudy({ ...base, runtimeMs: 90, bestKnownMs: 100 })).toContain(
      'fastest run on record',
    );
    expect(renderCaseStudy(base)).not.toContain('fastest run on record');
  });

  // A repo that only ever says "first try" is a repo nobody believes.
  it('does not hide a solve that took several attempts', () => {
    expect(renderCaseStudy({ ...base, attempts: 4 })).toContain('submission **4**');
    expect(renderCaseStudy(base)).toContain('first submission');
  });

  /**
   * The statement belongs to whoever wrote it. A link stays correct when the
   * original is edited, and copying would be a licensing problem in a public
   * repository — the exact trap the corpus work has to avoid.
   */
  it('links to the original problem instead of reproducing its text', () => {
    const md = renderCaseStudy(base);
    expect(md).toContain('https://leetcode.com/problems/two-sum/');
    expect(md).toContain('lock screen');
  });

  it('degrades to a plain title when there is no upstream problem', () => {
    const md = renderCaseStudy({ ...base, leetcodeSlug: null });
    expect(md).not.toContain('leetcode.com');
    expect(md).toContain('Two Sum');
  });

  // Omission is honest; a plausible-looking zero is not.
  it('omits figures it was not given rather than inventing them', () => {
    const md = renderCaseStudy({
      ...base,
      runtimeMs: null,
      gateMs: null,
      bestKnownMs: null,
      secondsLocked: null,
      avgSolveSeconds: null,
    });
    expect(md).not.toMatch(/\bnull\b|\bNaN\b|\bundefined\b/);
    // The Problem section always explains that a budget exists; what must not
    // appear is a *figure* for one that was never measured.
    expect(md).not.toMatch(/\*\*\d+ ms\*\*/);
    expect(md).not.toContain('best known');
    expect(md).not.toContain('locked out');
    // The attempt count is always known, so it still appears.
    expect(md).toContain('first submission');
  });

  it('fences the code with the right language', () => {
    expect(renderCaseStudy(base)).toContain('```javascript');
    expect(renderCaseStudy({ ...base, language: Language.CPP })).toContain('```cpp');
  });

  it('formats long lockouts readably', () => {
    expect(renderCaseStudy({ ...base, secondsLocked: 45 })).toContain('**45s**');
    expect(renderCaseStudy({ ...base, secondsLocked: 754 })).toContain('**12m 34s**');
    expect(renderCaseStudy({ ...base, secondsLocked: 7_200 })).toContain('**2h 00m**');
  });

  it('handles a run that missed its budget without claiming a margin', () => {
    const md = renderCaseStudy({ ...base, runtimeMs: 300, gateMs: 243 });
    expect(md).toContain('**300 ms**');
    expect(md).not.toContain('inside it');
  });
});
