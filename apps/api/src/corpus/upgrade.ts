import type { ProblemDefinition } from './problem.js';
import { UPGRADES } from './upgrades.js';

/**
 * Rewritten statements for hand-authored problems, applied on top of the
 * originals.
 *
 * The generated problems arrive in interview format — constraints, three
 * worked examples, a follow-up, an editorial that names the pattern and the
 * trap. The 695 hand-authored problems predate that format. Rather than
 * editing hundreds of source files by hand, `scripts/upgrade-statements.ts`
 * drafts a new statement and editorial per problem, checks that every
 * example matches one of the problem's own tests, has it reviewed, and
 * records it in `upgrades.ts`. This function lays those over the originals.
 *
 * Only `promptMarkdown` and `editorialMarkdown` change. Tests, solutions,
 * tags and signatures are exactly what the judge already verified. A test
 * that a new example draws on becomes a sample, so it is visible where the
 * example says it is. Delete a slug from `upgrades.ts` to fall back to the
 * original wording.
 */
export function applyUpgrades(problems: ProblemDefinition[]): ProblemDefinition[] {
  for (const problem of problems) {
    const up = UPGRADES[problem.slug];
    if (!up) continue;
    problem.promptMarkdown = up.promptMarkdown;
    problem.editorialMarkdown = up.editorialMarkdown;
    if (up.promoteSamples.length > 0) {
      const promote = new Set(up.promoteSamples);
      for (const test of problem.tests) if (promote.has(test.stdin)) test.isSample = true;
    }
  }
  return problems;
}
