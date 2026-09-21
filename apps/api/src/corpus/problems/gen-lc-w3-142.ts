import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w3-142` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W3_142_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "solar-panel-repair",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Solar Panel Repair",
    patternTags: ["matrix","grid","brute-force"],
    signatureId: "fn:matrix->bool",
    avgSolveSeconds: 600,
    promptMarkdown: "You are inspecting a small 3x3 array of solar panels on a satellite. A panel can be outputting power (`1`) or offline (`0`). \n\nTo activate the high-capacity charging mode, there must be at least one 2x2 subgrid of panels that are all in the *same state* (all `1`s or all `0`s).\n\nYou can remotely reset **at most one** panel, flipping its state from `0` to `1` or `1` to `0`. \n\nGiven the `matrix` representing the 3x3 array, return `true` if it is possible to achieve the high-capacity charging mode, and `false` otherwise.\n\n**Constraints**\n- `matrix.length == 3`\n- `matrix[i].length == 3`\n- `matrix[i][j]` is either `0` or `1`.\n\n**Example 1**\n```\ninput:\n1 1 0;1 0 1;0 1 1\noutput:\ntrue\n```\n*Explanation: In the top-left 2x2 subgrid, there are three 1s and one 0. By flipping the 0 at (1, 1) to a 1, we get a 2x2 square of all 1s.*\n\n**Example 2**\n```\ninput:\n1 0 1;0 1 0;1 0 1\noutput:\nfalse\n```\n*Explanation: Every 2x2 subgrid contains exactly two 0s and two 1s. Changing one panel is not enough to make any 2x2 square uniform.*\n\n**Example 3**\n```\ninput:\n0 0 0;0 0 0;0 0 0\noutput:\ntrue\n```\n*Explanation: The panels already form a 2x2 square of the same state, so 0 flips are needed.*\n\n**Follow-up**\nCan you determine this efficiently without explicitly simulating the flip of every panel?",
    editorialMarkdown: "## Solar Panel Repair\n\nWe are given a 3x3 grid and want to know if we can make a 2x2 square all identical by flipping at most 1 panel.\n\nAny 2x2 square contains 4 panels. If a 2x2 square already has 3 or 4 identical panels, we can achieve our goal by flipping at most 1 panel (0 if it has 4 identical, 1 if it has 3). The only case where we *cannot* fix a 2x2 square with 1 flip is when it contains exactly two 0s and two 1s. \n\nSo, we simply iterate through all four possible 2x2 squares in the 3x3 grid. For each, we sum its elements. If the sum is NOT 2, then we have 0, 1, 3, or 4 ones, meaning we can fix it. If we find at least one such 2x2 square, we return `true`. If all four 2x2 squares have a sum of exactly 2, we return `false`.\n\n**Trap**: A common trap is writing an overly complex DFS or backtracking algorithm to test all possible single flips, which is overkill for a tiny fixed-size grid.\n\n**Complexity:**\n- **Time:** O(1), since the grid size is fixed at 3x3, it takes a constant number of operations.\n- **Space:** O(1), no extra space is needed.",
    referenceSolution: {
      JAVASCRIPT: "function solve(matrix) {\n    for (let r = 0; r < 2; r++) {\n        for (let c = 0; c < 2; c++) {\n            let sum = matrix[r][c] + matrix[r+1][c] + matrix[r][c+1] + matrix[r+1][c+1];\n            if (sum !== 2) return true;\n        }\n    }\n    return false;\n}",
      TYPESCRIPT: "function solve(matrix: number[][]): boolean {\n    for (let r = 0; r < 2; r++) {\n        for (let c = 0; c < 2; c++) {\n            let sum = matrix[r][c] + matrix[r+1][c] + matrix[r][c+1] + matrix[r+1][c+1];\n            if (sum !== 2) return true;\n        }\n    }\n    return false;\n}",
      PYTHON: "def solve(matrix):\n    for r in range(2):\n        for c in range(2):\n            total = matrix[r][c] + matrix[r+1][c] + matrix[r][c+1] + matrix[r+1][c+1]\n            if total != 2:\n                return True\n    return False",
      JAVA: "    static boolean solve(int[][] matrix) {\n        for (int r = 0; r < 2; r++) {\n            for (int c = 0; c < 2; c++) {\n                int sum = matrix[r][c] + matrix[r+1][c] + matrix[r][c+1] + matrix[r+1][c+1];\n                if (sum != 2) return true;\n            }\n        }\n        return false;\n    }",
      CPP: "#include <vector>\n\nusing namespace std;\n\nbool solve(vector<vector<int>> matrix) {\n    for (int r = 0; r < 2; r++) {\n        for (int c = 0; c < 2; c++) {\n            int sum = matrix[r][c] + matrix[r+1][c] + matrix[r][c+1] + matrix[r+1][c+1];\n            if (sum != 2) return true;\n        }\n    }\n    return false;\n}",
      GO: "func solve(matrix [][]int) bool {\n    for r := 0; r < 2; r++ {\n        for c := 0; c < 2; c++ {\n            sum := matrix[r][c] + matrix[r+1][c] + matrix[r][c+1] + matrix[r+1][c+1]\n            if sum != 2 {\n                return true\n            }\n        }\n    }\n    return false\n}",
    },
    tests: [
      { stdin: "1 1 0;1 0 1;0 1 1", expectedStdout: "true", isSample: true },
      { stdin: "1 0 1;0 1 0;1 0 1", expectedStdout: "false", isSample: true },
      { stdin: "0 0 0;0 0 0;0 0 0", expectedStdout: "true" },
      { stdin: "1 1 1;1 1 1;1 1 1", expectedStdout: "true" },
      { stdin: "0 1 0;1 0 1;0 1 0", expectedStdout: "false" },
      { stdin: "0 0 1;1 1 0;1 0 0", expectedStdout: "true" },
      { stdin: "1 0 0;0 1 0;0 0 1", expectedStdout: "true" },
      { stdin: "0 1 1;0 1 1;0 1 1", expectedStdout: "true" },
    ],
  }),
];
