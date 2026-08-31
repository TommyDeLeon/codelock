import { describe, expect, it, vi } from 'vitest';
import { toPublicProblem } from './lockSessions.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: { testCase: { findMany: async () => [] } },
}));

/**
 * What the locked user is allowed to see.
 *
 * The debrief exists because the pattern is the lesson, and the lesson is only
 * worth anything if the user reached for it themselves. Serving the taxonomy
 * with the problem hands them the answer to the only question that matters:
 * a panel reading "two-pointers" turns recognition into reading.
 *
 * This is a real regression, not a hypothetical. `importer.ts` sets
 * `tags: def.patternTags`, and `toPublicProblem` used to forward `tags`
 * straight to the client, which rendered them as chips above the statement.
 * The field is still on the row for internal selection; it must not leave here.
 */
describe('toPublicProblem', () => {
  const row = {
    id: 'p1',
    slug: 'pair-with-target-sum',
    title: 'Pair With a Target Sum',
    difficulty: 'EASY',
    promptMarkdown: 'Find two numbers that add up to a target.',
    editorialMarkdown: '## Hash map\n\nStore each complement as you go.',
    referenceSolution: { PYTHON: 'def solve(a, t): ...' },
    tier: 'TIER_1',
    patternFamily: 'ARRAYS_HASHING',
    patternTags: ['hash-map', 'complement', 'one-pass'],
    tags: ['hash-map', 'complement', 'one-pass'],
    starterCode: { PYTHON: 'def solve(a, t):' },
    avgSolveSeconds: 480,
  } as never;

  it('carries no editorial, reference solution, or pattern name', async () => {
    const publicProblem = await toPublicProblem(row);
    const serialised = JSON.stringify(publicProblem);

    for (const leak of ['editorial', 'referenceSolution', 'patternFamily', 'patternTags', 'tags']) {
      expect(publicProblem).not.toHaveProperty(leak);
    }
    // Belt and braces: the values must not survive under a renamed key either.
    expect(serialised).not.toContain('Hash map');
    expect(serialised).not.toContain('def solve(a, t): ...');
    expect(serialised).not.toContain('ARRAYS_HASHING');
    expect(serialised).not.toContain('hash-map');
    expect(serialised).not.toContain('TIER_1');
  });

  it('still carries what the user needs to solve it', async () => {
    const publicProblem = await toPublicProblem(row);
    expect(publicProblem.slug).toBe('pair-with-target-sum');
    expect(publicProblem.promptMarkdown).toContain('add up to a target');
    expect(publicProblem.starterCode).toEqual({ PYTHON: 'def solve(a, t):' });
    expect(publicProblem.avgSolveSeconds).toBe(480);
  });
});
