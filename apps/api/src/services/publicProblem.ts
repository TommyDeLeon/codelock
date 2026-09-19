import type { Problem } from '@prisma/client';
import type { PublicProblem } from '@codelock/shared';
import { prisma } from '../lib/prisma.js';

/**
 * A problem as a client may see it: statement, starters and the sample cases,
 * never the hidden tests or the reference solution.
 *
 * Its own module so the Learn routes can project a practice problem without
 * importing `lockSessions.ts`; the lock module re-exports it, so its callers
 * are unchanged.
 */
export async function toPublicProblem(problem: Problem): Promise<PublicProblem> {
  const samples = await prisma.testCase.findMany({
    where: { problemId: problem.id, isSample: true },
    orderBy: { ordinal: 'asc' },
    select: { ordinal: true, stdin: true, expectedStdout: true },
  });
  return {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    promptMarkdown: problem.promptMarkdown,
    starterCode: problem.starterCode as PublicProblem['starterCode'],
    sampleCases: samples,
    avgSolveSeconds: problem.avgSolveSeconds,
  };
}
