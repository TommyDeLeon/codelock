import type { ProblemDefinition } from '../problem.js';
import { TIER_0_PROBLEMS } from './tier0.js';
import { TIER_0B_PROBLEMS } from './tier0b.js';
import { TIER_0C_PROBLEMS } from './tier0c.js';
import { TIER_0D_PROBLEMS } from './tier0d.js';
import { TIER_05_LINEAR_PROBLEMS } from './tier05-linear.js';
import { TIER_05_HASHING_PROBLEMS } from './tier05-hashing.js';
import { TIER_05_TREES_PROBLEMS } from './tier05-trees.js';
import { TIER_05_HEAPS_GRAPHS_PROBLEMS } from './tier05-heaps-graphs.js';
import { TIER_05_EXTRA_PROBLEMS } from './tier05-extra.js';
import { TIER_1_ARRAYS_HASHING_PROBLEMS } from './tier1-arrays-hashing.js';
import { TIER_1_TWO_POINTERS_PROBLEMS } from './tier1-two-pointers.js';
import { TIER_1_STACK_PROBLEMS } from './tier1-stack.js';
import { TIER_1_SLIDING_WINDOW_PROBLEMS } from './tier1-sliding-window.js';
import { TIER_1_BINARY_SEARCH_PROBLEMS } from './tier1-binary-search.js';
import { TIER_1_LINKED_LIST_PROBLEMS } from './tier1-linked-list.js';
import { TIER_1_STACK_B_PROBLEMS } from './tier1-stack-b.js';
import { TIER_1_SLIDING_WINDOW_B_PROBLEMS } from './tier1-sliding-window-b.js';
import { TIER_1_TREES_PROBLEMS } from './tier1-trees.js';

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
  ...TIER_0B_PROBLEMS,
  ...TIER_0C_PROBLEMS,
  ...TIER_0D_PROBLEMS,
  ...TIER_05_LINEAR_PROBLEMS,
  ...TIER_05_HASHING_PROBLEMS,
  ...TIER_05_TREES_PROBLEMS,
  ...TIER_05_HEAPS_GRAPHS_PROBLEMS,
  ...TIER_05_EXTRA_PROBLEMS,
  ...TIER_1_ARRAYS_HASHING_PROBLEMS,
  ...TIER_1_TWO_POINTERS_PROBLEMS,
  ...TIER_1_STACK_PROBLEMS,
  ...TIER_1_SLIDING_WINDOW_PROBLEMS,
  ...TIER_1_BINARY_SEARCH_PROBLEMS,
  ...TIER_1_LINKED_LIST_PROBLEMS,
  ...TIER_1_STACK_B_PROBLEMS,
  ...TIER_1_SLIDING_WINDOW_B_PROBLEMS,
  ...TIER_1_TREES_PROBLEMS,
];

export {
  TIER_0_PROBLEMS,
  TIER_0B_PROBLEMS,
  TIER_0C_PROBLEMS,
  TIER_0D_PROBLEMS,
  TIER_05_LINEAR_PROBLEMS,
  TIER_05_HASHING_PROBLEMS,
  TIER_05_TREES_PROBLEMS,
  TIER_05_HEAPS_GRAPHS_PROBLEMS,
  TIER_05_EXTRA_PROBLEMS,
  TIER_1_ARRAYS_HASHING_PROBLEMS,
  TIER_1_TWO_POINTERS_PROBLEMS,
  TIER_1_STACK_PROBLEMS,
  TIER_1_SLIDING_WINDOW_PROBLEMS,
  TIER_1_BINARY_SEARCH_PROBLEMS,
  TIER_1_LINKED_LIST_PROBLEMS,
  TIER_1_STACK_B_PROBLEMS,
  TIER_1_SLIDING_WINDOW_B_PROBLEMS,
  TIER_1_TREES_PROBLEMS,
};
