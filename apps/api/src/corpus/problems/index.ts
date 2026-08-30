import type { ProblemDefinition } from '../problem.js';
import { TIER_0_PROBLEMS } from './tier0.js';
import { TIER_0B_PROBLEMS } from './tier0b.js';
import { TIER_05_LINEAR_PROBLEMS } from './tier05-linear.js';
import { TIER_05_HASHING_PROBLEMS } from './tier05-hashing.js';

/**
 * Every authored problem, in tier order.
 *
 * One file per batch rather than one enormous file: batches are authored in
 * parallel, and a single array would be a permanent merge conflict. The
 * importer takes this aggregate, so adding a batch is one import and one line.
 *
 * Slug uniqueness across batches is enforced by a test, not by convention —
 * two authors independently reaching for `reverse-a-string` is the obvious
 * failure mode, and the database's unique constraint would otherwise catch it
 * only at import time, halfway through a run.
 */
export const ALL_PROBLEMS: ProblemDefinition[] = [
  ...TIER_0_PROBLEMS,
  ...TIER_0B_PROBLEMS, ...TIER_05_LINEAR_PROBLEMS, ...TIER_05_HASHING_PROBLEMS];

export { TIER_0_PROBLEMS, TIER_0B_PROBLEMS, TIER_05_LINEAR_PROBLEMS, TIER_05_HASHING_PROBLEMS };
