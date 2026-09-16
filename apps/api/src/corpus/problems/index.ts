import type { ProblemDefinition } from '../problem.js';
import { GEN_LC_W1_053_PROBLEMS } from './gen-lc-w1-053.js';
import { GEN_LC_W2_052_PROBLEMS } from './gen-lc-w2-052.js';
import { GEN_LC_W0_051_PROBLEMS } from './gen-lc-w0-051.js';
import { GEN_LC_W1_052_PROBLEMS } from './gen-lc-w1-052.js';
import { GEN_LC_W1_051_PROBLEMS } from './gen-lc-w1-051.js';
import { GEN_LC_W2_051_PROBLEMS } from './gen-lc-w2-051.js';
import { GEN_LC_W2_050_PROBLEMS } from './gen-lc-w2-050.js';
import { GEN_LC_W0_050_PROBLEMS } from './gen-lc-w0-050.js';
import { GEN_LC_W1_050_PROBLEMS } from './gen-lc-w1-050.js';
import { GEN_LC_W0_049_PROBLEMS } from './gen-lc-w0-049.js';
import { GEN_LC_W2_049_PROBLEMS } from './gen-lc-w2-049.js';
import { GEN_LC_W1_049_PROBLEMS } from './gen-lc-w1-049.js';
import { applyUpgrades } from '../upgrade.js';
import { GEN_LC_048_PROBLEMS } from './gen-lc-048.js';
import { GEN_LC_047_PROBLEMS } from './gen-lc-047.js';
import { GEN_LC_046_PROBLEMS } from './gen-lc-046.js';
import { GEN_LC_045_PROBLEMS } from './gen-lc-045.js';
import { GEN_LC_044_PROBLEMS } from './gen-lc-044.js';
import { GEN_LC_043_PROBLEMS } from './gen-lc-043.js';
import { GEN_LC_042_PROBLEMS } from './gen-lc-042.js';
import { GEN_LC_041_PROBLEMS } from './gen-lc-041.js';
import { GEN_LC_040_PROBLEMS } from './gen-lc-040.js';
import { GEN_LC_039_PROBLEMS } from './gen-lc-039.js';
import { GEN_LC_038_PROBLEMS } from './gen-lc-038.js';
import { GEN_LC_036_PROBLEMS } from './gen-lc-036.js';
import { GEN_LC_035_PROBLEMS } from './gen-lc-035.js';
import { GEN_LC_034_PROBLEMS } from './gen-lc-034.js';
import { GEN_LC_033_PROBLEMS } from './gen-lc-033.js';
import { GEN_LC_032_PROBLEMS } from './gen-lc-032.js';
import { GEN_LC_031_PROBLEMS } from './gen-lc-031.js';
import { GEN_LC_030_PROBLEMS } from './gen-lc-030.js';
import { GEN_LC_029_PROBLEMS } from './gen-lc-029.js';
import { GEN_LC_028_PROBLEMS } from './gen-lc-028.js';
import { GEN_LC_027_PROBLEMS } from './gen-lc-027.js';
import { GEN_LC_026_PROBLEMS } from './gen-lc-026.js';
import { GEN_LC_025_PROBLEMS } from './gen-lc-025.js';
import { GEN_LC_024_PROBLEMS } from './gen-lc-024.js';
import { GEN_LC_023_PROBLEMS } from './gen-lc-023.js';
import { GEN_LC_022_PROBLEMS } from './gen-lc-022.js';
import { GEN_LC_021_PROBLEMS } from './gen-lc-021.js';
import { GEN_LC_020_PROBLEMS } from './gen-lc-020.js';
import { GEN_LC_019_PROBLEMS } from './gen-lc-019.js';
import { GEN_LC_018_PROBLEMS } from './gen-lc-018.js';
import { GEN_LC_017_PROBLEMS } from './gen-lc-017.js';
import { GEN_LC_016_PROBLEMS } from './gen-lc-016.js';
import { GEN_LC_015_PROBLEMS } from './gen-lc-015.js';
import { GEN_LC_014_PROBLEMS } from './gen-lc-014.js';
import { GEN_LC_012_PROBLEMS } from './gen-lc-012.js';
import { GEN_LC_011_PROBLEMS } from './gen-lc-011.js';
import { GEN_LC_010_PROBLEMS } from './gen-lc-010.js';
import { GEN_LC_009_PROBLEMS } from './gen-lc-009.js';
import { GEN_LC_007_PROBLEMS } from './gen-lc-007.js';
import { GEN_LC_006_PROBLEMS } from './gen-lc-006.js';
import { GEN_LC_005_PROBLEMS } from './gen-lc-005.js';
import { GEN_LC_003_PROBLEMS } from './gen-lc-003.js';
import { GEN_LC_002_PROBLEMS } from './gen-lc-002.js';
import { GEN_LC_001_PROBLEMS } from './gen-lc-001.js';
import { GEN_T1_ARRAYS_HASHING_A_PROBLEMS } from './gen-t1-arrays-hashing-a.js';
import { TIER_0_PROBLEMS } from './tier0.js';
import { TIER_0B_PROBLEMS } from './tier0b.js';
import { TIER_0C_PROBLEMS } from './tier0c.js';
import { TIER_0D_PROBLEMS } from './tier0d.js';
import { TIER_05_EXTRA_PROBLEMS } from './tier05-extra.js';
import { TIER_05_HASHING_PROBLEMS } from './tier05-hashing.js';
import { TIER_05_HEAPS_GRAPHS_PROBLEMS } from './tier05-heaps-graphs.js';
import { TIER_05_LINEAR_PROBLEMS } from './tier05-linear.js';
import { TIER_05_TREES_PROBLEMS } from './tier05-trees.js';
import { TIER_1_ADVANCED_GRAPHS_PROBLEMS } from './tier1-advanced-graphs.js';
import { TIER_1_ARRAYS_HASHING_PROBLEMS } from './tier1-arrays-hashing.js';
import { TIER_1_BACKTRACKING_PROBLEMS } from './tier1-backtracking.js';
import { TIER_1_BINARY_SEARCH_PROBLEMS } from './tier1-binary-search.js';
import { TIER_1_BIT_MANIPULATION_PROBLEMS } from './tier1-bit-manipulation.js';
import { TIER_1_DP_1D_PROBLEMS } from './tier1-dp1d.js';
import { TIER_1_DP_2D_PROBLEMS } from './tier1-dp2d.js';
import { TIER_1_GRAPHS_PROBLEMS } from './tier1-graphs.js';
import { TIER_1_GREEDY_PROBLEMS } from './tier1-greedy.js';
import { TIER_1_HEAP_PROBLEMS } from './tier1-heap.js';
import { TIER_1_INTERVALS_PROBLEMS } from './tier1-intervals.js';
import { TIER_1_LINKED_LIST_PROBLEMS } from './tier1-linked-list.js';
import { TIER_1_MATH_GEOMETRY_PROBLEMS } from './tier1-math-geometry.js';
import { TIER_1_SLIDING_WINDOW_B_PROBLEMS } from './tier1-sliding-window-b.js';
import { TIER_1_SLIDING_WINDOW_PROBLEMS } from './tier1-sliding-window.js';
import { TIER_1_STACK_B_PROBLEMS } from './tier1-stack-b.js';
import { TIER_1_STACK_PROBLEMS } from './tier1-stack.js';
import { TIER_1_TREES_PROBLEMS } from './tier1-trees.js';
import { TIER_1_TRIES_PROBLEMS } from './tier1-tries.js';
import { TIER_1_TWO_POINTERS_PROBLEMS } from './tier1-two-pointers.js';
import { TIER_2_ARRAYS_HASHING_B_PROBLEMS } from './tier2-arrays-hashing-b.js';
import { TIER_2_ARRAYS_HASHING_C_PROBLEMS } from './tier2-arrays-hashing-c.js';
import { TIER_2_ARRAYS_HASHING_PROBLEMS } from './tier2-arrays-hashing.js';
import { TIER_2_BACKTRACKING_B_PROBLEMS } from './tier2-backtracking-b.js';
import { TIER_2_BACKTRACKING_PROBLEMS } from './tier2-backtracking.js';
import { TIER_2_BINARY_SEARCH_B_PROBLEMS } from './tier2-binary-search-b.js';
import { TIER_2_BINARY_SEARCH_PROBLEMS } from './tier2-binary-search.js';
import { TIER_2_BIT_MANIPULATION_B_PROBLEMS } from './tier2-bit-manipulation-b.js';
import { TIER_2_BIT_MANIPULATION_PROBLEMS } from './tier2-bit-manipulation.js';
import { TIER_2_DP_1D_B_PROBLEMS } from './tier2-dp1d-b.js';
import { TIER_2_DP_1D_PROBLEMS } from './tier2-dp1d.js';
import { TIER_2_DP_2D_PROBLEMS } from './tier2-dp2d.js';
import { TIER_2_GRAPHS_B_PROBLEMS } from './tier2-graphs-b.js';
import { TIER_2_GRAPHS_PROBLEMS } from './tier2-graphs.js';
import { TIER_2_GREEDY_B_PROBLEMS } from './tier2-greedy-b.js';
import { TIER_2_GREEDY_PROBLEMS } from './tier2-greedy.js';
import { TIER_2_HEAP_B_PROBLEMS } from './tier2-heap-b.js';
import { TIER_2_HEAP_PROBLEMS } from './tier2-heap.js';
import { TIER_2_INTERVALS_B_PROBLEMS } from './tier2-intervals-b.js';
import { TIER_2_INTERVALS_PROBLEMS } from './tier2-intervals.js';
import { TIER_2_LINKED_LIST_B_PROBLEMS } from './tier2-linked-list-b.js';
import { TIER_2_LINKED_LIST_PROBLEMS } from './tier2-linked-list.js';
import { TIER_2_MATH_GEOMETRY_B_PROBLEMS } from './tier2-math-geometry-b.js';
import { TIER_2_SLIDING_WINDOW_B2_PROBLEMS } from './tier2-sliding-window-b2.js';
import { TIER_2_SLIDING_WINDOW_PROBLEMS } from './tier2-sliding-window.js';
import { TIER_2_STACK_B2_PROBLEMS } from './tier2-stack-b2.js';
import { TIER_2_STACK_C_PROBLEMS } from './tier2-stack-c.js';
import { TIER_2_STACK_PROBLEMS } from './tier2-stack.js';
import { TIER_2_STRINGS_PROBLEMS } from './tier2-strings.js';
import { TIER_2_TREES_B_PROBLEMS } from './tier2-trees-b.js';
import { TIER_2_TREES_PROBLEMS } from './tier2-trees.js';
import { TIER_2_TWO_POINTERS_B_PROBLEMS } from './tier2-two-pointers-b.js';
import { TIER_2_TWO_POINTERS_C_PROBLEMS } from './tier2-two-pointers-c.js';
import { TIER_2_TWO_POINTERS_PROBLEMS } from './tier2-two-pointers.js';
import { TIER_3_GRIDS_PATHS_PROBLEMS } from './tier3-grids-paths.js';
import { TIER_3_HASHING_BREADTH_PROBLEMS } from './tier3-hashing-breadth.js';
import { TIER_3_MATRIX_COUNTING_PROBLEMS } from './tier3-matrix-counting.js';
import { TIER_3_NUMBER_THEORY_B_PROBLEMS } from './tier3-number-theory-b.js';
import { TIER_3_PREFIX_SUMS_PROBLEMS } from './tier3-prefix-sums.js';
import { TIER_3_SELECTION_B_PROBLEMS } from './tier3-selection-b.js';
import { TIER_3_SORTING_SELECTION_PROBLEMS } from './tier3-sorting-selection.js';
import { TIER_3_STRINGS_BREADTH_PROBLEMS } from './tier3-strings-breadth.js';
import { TIER_3_STRINGS_SIMULATION_PROBLEMS } from './tier3-strings-simulation.js';

export const ALL_PROBLEMS: ProblemDefinition[] = [
  ...GEN_LC_W1_053_PROBLEMS,
  ...GEN_LC_W2_052_PROBLEMS,
  ...GEN_LC_W0_051_PROBLEMS,
  ...GEN_LC_W1_052_PROBLEMS,
  ...GEN_LC_W1_051_PROBLEMS,
  ...GEN_LC_W2_051_PROBLEMS,
  ...GEN_LC_W2_050_PROBLEMS,
  ...GEN_LC_W0_050_PROBLEMS,
  ...GEN_LC_W1_050_PROBLEMS,
  ...GEN_LC_W0_049_PROBLEMS,
  ...GEN_LC_W2_049_PROBLEMS,
  ...GEN_LC_W1_049_PROBLEMS,
  ...GEN_LC_048_PROBLEMS,
  ...GEN_LC_047_PROBLEMS,
  ...GEN_LC_046_PROBLEMS,
  ...GEN_LC_045_PROBLEMS,
  ...GEN_LC_044_PROBLEMS,
  ...GEN_LC_043_PROBLEMS,
  ...GEN_LC_042_PROBLEMS,
  ...GEN_LC_041_PROBLEMS,
  ...GEN_LC_040_PROBLEMS,
  ...GEN_LC_039_PROBLEMS,
  ...GEN_LC_038_PROBLEMS,
  ...GEN_LC_036_PROBLEMS,
  ...GEN_LC_035_PROBLEMS,
  ...GEN_LC_034_PROBLEMS,
  ...GEN_LC_033_PROBLEMS,
  ...GEN_LC_032_PROBLEMS,
  ...GEN_LC_031_PROBLEMS,
  ...GEN_LC_030_PROBLEMS,
  ...GEN_LC_029_PROBLEMS,
  ...GEN_LC_028_PROBLEMS,
  ...GEN_LC_027_PROBLEMS,
  ...GEN_LC_026_PROBLEMS,
  ...GEN_LC_025_PROBLEMS,
  ...GEN_LC_024_PROBLEMS,
  ...GEN_LC_023_PROBLEMS,
  ...GEN_LC_022_PROBLEMS,
  ...GEN_LC_021_PROBLEMS,
  ...GEN_LC_020_PROBLEMS,
  ...GEN_LC_019_PROBLEMS,
  ...GEN_LC_018_PROBLEMS,
  ...GEN_LC_017_PROBLEMS,
  ...GEN_LC_016_PROBLEMS,
  ...GEN_LC_015_PROBLEMS,
  ...GEN_LC_014_PROBLEMS,
  ...GEN_LC_012_PROBLEMS,
  ...GEN_LC_011_PROBLEMS,
  ...GEN_LC_010_PROBLEMS,
  ...GEN_LC_009_PROBLEMS,
  ...GEN_LC_007_PROBLEMS,
  ...GEN_LC_006_PROBLEMS,
  ...GEN_LC_005_PROBLEMS,
  ...GEN_LC_003_PROBLEMS,
  ...GEN_LC_002_PROBLEMS,
  ...GEN_LC_001_PROBLEMS,
  ...GEN_T1_ARRAYS_HASHING_A_PROBLEMS,
  ...TIER_0_PROBLEMS,
  ...TIER_0B_PROBLEMS,
  ...TIER_0C_PROBLEMS,
  ...TIER_0D_PROBLEMS,
  ...TIER_05_EXTRA_PROBLEMS,
  ...TIER_05_HASHING_PROBLEMS,
  ...TIER_05_HEAPS_GRAPHS_PROBLEMS,
  ...TIER_05_LINEAR_PROBLEMS,
  ...TIER_05_TREES_PROBLEMS,
  ...TIER_1_ADVANCED_GRAPHS_PROBLEMS,
  ...TIER_1_ARRAYS_HASHING_PROBLEMS,
  ...TIER_1_BACKTRACKING_PROBLEMS,
  ...TIER_1_BINARY_SEARCH_PROBLEMS,
  ...TIER_1_BIT_MANIPULATION_PROBLEMS,
  ...TIER_1_DP_1D_PROBLEMS,
  ...TIER_1_DP_2D_PROBLEMS,
  ...TIER_1_GRAPHS_PROBLEMS,
  ...TIER_1_GREEDY_PROBLEMS,
  ...TIER_1_HEAP_PROBLEMS,
  ...TIER_1_INTERVALS_PROBLEMS,
  ...TIER_1_LINKED_LIST_PROBLEMS,
  ...TIER_1_MATH_GEOMETRY_PROBLEMS,
  ...TIER_1_SLIDING_WINDOW_B_PROBLEMS,
  ...TIER_1_SLIDING_WINDOW_PROBLEMS,
  ...TIER_1_STACK_B_PROBLEMS,
  ...TIER_1_STACK_PROBLEMS,
  ...TIER_1_TREES_PROBLEMS,
  ...TIER_1_TRIES_PROBLEMS,
  ...TIER_1_TWO_POINTERS_PROBLEMS,
  ...TIER_2_ARRAYS_HASHING_B_PROBLEMS,
  ...TIER_2_ARRAYS_HASHING_C_PROBLEMS,
  ...TIER_2_ARRAYS_HASHING_PROBLEMS,
  ...TIER_2_BACKTRACKING_B_PROBLEMS,
  ...TIER_2_BACKTRACKING_PROBLEMS,
  ...TIER_2_BINARY_SEARCH_B_PROBLEMS,
  ...TIER_2_BINARY_SEARCH_PROBLEMS,
  ...TIER_2_BIT_MANIPULATION_B_PROBLEMS,
  ...TIER_2_BIT_MANIPULATION_PROBLEMS,
  ...TIER_2_DP_1D_B_PROBLEMS,
  ...TIER_2_DP_1D_PROBLEMS,
  ...TIER_2_DP_2D_PROBLEMS,
  ...TIER_2_GRAPHS_B_PROBLEMS,
  ...TIER_2_GRAPHS_PROBLEMS,
  ...TIER_2_GREEDY_B_PROBLEMS,
  ...TIER_2_GREEDY_PROBLEMS,
  ...TIER_2_HEAP_B_PROBLEMS,
  ...TIER_2_HEAP_PROBLEMS,
  ...TIER_2_INTERVALS_B_PROBLEMS,
  ...TIER_2_INTERVALS_PROBLEMS,
  ...TIER_2_LINKED_LIST_B_PROBLEMS,
  ...TIER_2_LINKED_LIST_PROBLEMS,
  ...TIER_2_MATH_GEOMETRY_B_PROBLEMS,
  ...TIER_2_SLIDING_WINDOW_B2_PROBLEMS,
  ...TIER_2_SLIDING_WINDOW_PROBLEMS,
  ...TIER_2_STACK_B2_PROBLEMS,
  ...TIER_2_STACK_C_PROBLEMS,
  ...TIER_2_STACK_PROBLEMS,
  ...TIER_2_STRINGS_PROBLEMS,
  ...TIER_2_TREES_B_PROBLEMS,
  ...TIER_2_TREES_PROBLEMS,
  ...TIER_2_TWO_POINTERS_B_PROBLEMS,
  ...TIER_2_TWO_POINTERS_C_PROBLEMS,
  ...TIER_2_TWO_POINTERS_PROBLEMS,
  ...TIER_3_GRIDS_PATHS_PROBLEMS,
  ...TIER_3_HASHING_BREADTH_PROBLEMS,
  ...TIER_3_MATRIX_COUNTING_PROBLEMS,
  ...TIER_3_NUMBER_THEORY_B_PROBLEMS,
  ...TIER_3_PREFIX_SUMS_PROBLEMS,
  ...TIER_3_SELECTION_B_PROBLEMS,
  ...TIER_3_SORTING_SELECTION_PROBLEMS,
  ...TIER_3_STRINGS_BREADTH_PROBLEMS,
  ...TIER_3_STRINGS_SIMULATION_PROBLEMS,
];

export {
  TIER_0_PROBLEMS,
  TIER_0B_PROBLEMS,
  TIER_0C_PROBLEMS,
  TIER_0D_PROBLEMS,
  TIER_05_EXTRA_PROBLEMS,
  TIER_05_HASHING_PROBLEMS,
  TIER_05_HEAPS_GRAPHS_PROBLEMS,
  TIER_05_LINEAR_PROBLEMS,
  TIER_05_TREES_PROBLEMS,
  TIER_1_ADVANCED_GRAPHS_PROBLEMS,
  TIER_1_ARRAYS_HASHING_PROBLEMS,
  TIER_1_BACKTRACKING_PROBLEMS,
  TIER_1_BINARY_SEARCH_PROBLEMS,
  TIER_1_BIT_MANIPULATION_PROBLEMS,
  TIER_1_DP_1D_PROBLEMS,
  TIER_1_DP_2D_PROBLEMS,
  TIER_1_GRAPHS_PROBLEMS,
  TIER_1_GREEDY_PROBLEMS,
  TIER_1_HEAP_PROBLEMS,
  TIER_1_INTERVALS_PROBLEMS,
  TIER_1_LINKED_LIST_PROBLEMS,
  TIER_1_MATH_GEOMETRY_PROBLEMS,
  TIER_1_SLIDING_WINDOW_B_PROBLEMS,
  TIER_1_SLIDING_WINDOW_PROBLEMS,
  TIER_1_STACK_B_PROBLEMS,
  TIER_1_STACK_PROBLEMS,
  TIER_1_TREES_PROBLEMS,
  TIER_1_TRIES_PROBLEMS,
  TIER_1_TWO_POINTERS_PROBLEMS,
  TIER_2_ARRAYS_HASHING_B_PROBLEMS,
  TIER_2_ARRAYS_HASHING_C_PROBLEMS,
  TIER_2_ARRAYS_HASHING_PROBLEMS,
  TIER_2_BACKTRACKING_B_PROBLEMS,
  TIER_2_BACKTRACKING_PROBLEMS,
  TIER_2_BINARY_SEARCH_B_PROBLEMS,
  TIER_2_BINARY_SEARCH_PROBLEMS,
  TIER_2_BIT_MANIPULATION_B_PROBLEMS,
  TIER_2_BIT_MANIPULATION_PROBLEMS,
  TIER_2_DP_1D_B_PROBLEMS,
  TIER_2_DP_1D_PROBLEMS,
  TIER_2_DP_2D_PROBLEMS,
  TIER_2_GRAPHS_B_PROBLEMS,
  TIER_2_GRAPHS_PROBLEMS,
  TIER_2_GREEDY_B_PROBLEMS,
  TIER_2_GREEDY_PROBLEMS,
  TIER_2_HEAP_B_PROBLEMS,
  TIER_2_HEAP_PROBLEMS,
  TIER_2_INTERVALS_B_PROBLEMS,
  TIER_2_INTERVALS_PROBLEMS,
  TIER_2_LINKED_LIST_B_PROBLEMS,
  TIER_2_LINKED_LIST_PROBLEMS,
  TIER_2_MATH_GEOMETRY_B_PROBLEMS,
  TIER_2_SLIDING_WINDOW_B2_PROBLEMS,
  TIER_2_SLIDING_WINDOW_PROBLEMS,
  TIER_2_STACK_B2_PROBLEMS,
  TIER_2_STACK_C_PROBLEMS,
  TIER_2_STACK_PROBLEMS,
  TIER_2_STRINGS_PROBLEMS,
  TIER_2_TREES_B_PROBLEMS,
  TIER_2_TREES_PROBLEMS,
  TIER_2_TWO_POINTERS_B_PROBLEMS,
  TIER_2_TWO_POINTERS_C_PROBLEMS,
  TIER_2_TWO_POINTERS_PROBLEMS,
  TIER_3_GRIDS_PATHS_PROBLEMS,
  TIER_3_HASHING_BREADTH_PROBLEMS,
  TIER_3_MATRIX_COUNTING_PROBLEMS,
  TIER_3_NUMBER_THEORY_B_PROBLEMS,
  TIER_3_PREFIX_SUMS_PROBLEMS,
  TIER_3_SELECTION_B_PROBLEMS,
  TIER_3_SORTING_SELECTION_PROBLEMS,
  TIER_3_STRINGS_BREADTH_PROBLEMS,
  TIER_3_STRINGS_SIMULATION_PROBLEMS,
};

// Rewritten statements for hand-authored problems are laid over the
// originals here; see `../upgrade.ts`. Mutates in place, once, at load.
applyUpgrades(ALL_PROBLEMS);
