import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w2-143` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W2_143_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "active-satellites-count",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Active Satellites Count",
    patternTags: ["array","matrix","linear-scan"],
    signatureId: "fn:matrix,int->int",
    avgSolveSeconds: 300,
    promptMarkdown: "You are monitoring a network of communication satellites. You have a log of their transmission windows, represented as a matrix `intervals` where each row `[start, end]` indicates that a satellite began transmitting at time `start` and finished at time `end` (inclusive). You also have a specific `target` time.\n\nFind and return the number of satellites that were actively transmitting at the `target` time.\n\n**Constraints**\n- `1 <= intervals.length <= 100`\n- `intervals[i].length == 2`\n- `1 <= intervals[i][0] <= intervals[i][1] <= 1000`\n- `1 <= target <= 1000`\n\n**Example 1**\n```\ninput:\n1 3;2 5;4 6\n3\noutput:\n2\n```\n*Explanation: At time 3, the first satellite (1 to 3) and second satellite (2 to 5) are active. The third satellite starts at 4.*\n\n**Example 2**\n```\ninput:\n1 10\n5\noutput:\n1\n```\n*Explanation: There is only one satellite, and it is active at time 5.*\n\n**Example 3**\n```\ninput:\n1 2;3 4\n5\noutput:\n0\n```\n*Explanation: Neither satellite is active at time 5.*\n\n**Follow-up**\nCan you perform this check in O(N) time with O(1) auxiliary space?",
    editorialMarkdown: "## Active Satellites Count\n\nWe need to count how many satellites were actively transmitting at a specific `target` time. We are given a 2D array `intervals`, where each interval `[start, end]` represents the time a satellite was active.\n\nWe simply iterate through each interval in the array. For each interval, we check if the `target` time falls inclusively between its `start` and `end` times (`start <= target && target <= end`). We maintain a counter for all such intervals and return it at the end.\n\n**Trap**: Checking only equality with `start` or `end`, or misinterpreting the inclusiveness of the bounds. The target must be checked as `start <= target <= end`.\n\n**Complexity:**\n- **Time:** O(N), where N is the number of intervals, since we must check every interval once.\n- **Space:** O(1), as we only need a single counter variable.",
    referenceSolution: {
      JAVASCRIPT: "function solve(intervals, target) {\n    let count = 0;\n    for (let i = 0; i < intervals.length; i++) {\n        if (intervals[i][0] <= target && target <= intervals[i][1]) {\n            count++;\n        }\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(intervals: number[][], target: number): number {\n    let count = 0;\n    for (let i = 0; i < intervals.length; i++) {\n        if (intervals[i][0] <= target && target <= intervals[i][1]) {\n            count++;\n        }\n    }\n    return count;\n}",
      PYTHON: "def solve(intervals, target):\n    count = 0\n    for inv in intervals:\n        if inv[0] <= target <= inv[1]:\n            count += 1\n    return count",
      JAVA: "    static int solve(int[][] intervals, int target) {\n        int count = 0;\n        for (int i = 0; i < intervals.length; i++) {\n            if (intervals[i][0] <= target && target <= intervals[i][1]) {\n                count++;\n            }\n        }\n        return count;\n    }",
      CPP: "int solve(vector<vector<int>> intervals, int target) {\n    int count = 0;\n    for (auto& inv : intervals) {\n        if (inv[0] <= target && target <= inv[1]) {\n            count++;\n        }\n    }\n    return count;\n}",
      GO: "func solve(intervals [][]int, target int) int {\n    count := 0\n    for _, inv := range intervals {\n        if inv[0] <= target && target <= inv[1] {\n            count++\n        }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "1 3;2 5;4 6\n3", expectedStdout: "2", isSample: true },
      { stdin: "1 10\n5", expectedStdout: "1", isSample: true },
      { stdin: "1 2;3 4\n5", expectedStdout: "0" },
      { stdin: "1 5;5 10\n5", expectedStdout: "2" },
      { stdin: "1 2;2 3;3 4\n5", expectedStdout: "0" },
      { stdin: "1 5;1 5;1 5\n3", expectedStdout: "3" },
      { stdin: "10 10\n10", expectedStdout: "1" },
      { stdin: "5 10;15 20\n12", expectedStdout: "0" },
    ],
  }),
];
