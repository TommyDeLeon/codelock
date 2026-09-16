import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w4-053` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W4_053_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "adjusted-test-scores",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Adjusted Test Scores",
    patternTags: ["array","math","matrix"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing the performance of a manufacturing machine. You are given a 2D integer array `readings` of size `2 x n`.\n\nThe first row `readings[0]` contains the baseline sensor readings for `n` components.\nThe second row `readings[1]` contains the recalibrated readings for the same `n` components, but in a completely random order.\n\nThe recalibration process added a constant integer `C` to every baseline reading. Return the value of `C` (which can be negative).\n\n**Constraints**\n- `readings.length == 2`\n- `1 <= readings[0].length == readings[1].length <= 100`\n- `0 <= readings[0][i], readings[1][i] <= 1000`\n\n**Example 1**\n```\ninput:\n10 20 30;35 25 15\noutput: 5\n```\n*Explanation: The baseline is [10, 20, 30]. The recalibrated is [35, 25, 15]. The constant added is 5, since min(recalibrated) 15 - min(baseline) 10 = 5.*\n\n**Example 2**\n```\ninput:\n50 50;40 40\noutput: -10\n```\n*Explanation: Every reading decreased by 10.*\n\n**Example 3**\n```\ninput:\n100;100\noutput: 0\n```\n*Explanation: The constant added is 0.*\n\n**Follow-up**\nCan you find the constant in mathcal{O}(N) time without sorting?",
    editorialMarkdown: "## Adjusted Test Scores\nBecause the exact same constant `C` was added to every baseline reading to form the recalibrated readings, the minimum value in the baseline array must correspond to the minimum value in the recalibrated array. We can simply find the minimum of the first row, the minimum of the second row, and return their difference.\n\n**Trap**: Trying to sort the arrays or match elements one-by-one is unnecessary and less efficient than just finding the minimums.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the number of elements in a row, as we only need to scan each row once to find its minimum.\n- **Space Complexity:** mathcal{O}(1) as we only use a few variables.",
    referenceSolution: {
      JAVASCRIPT: "function solve(readings) {\n    let min1 = Math.min(...readings[0]);\n    let min2 = Math.min(...readings[1]);\n    return min2 - min1;\n}",
      TYPESCRIPT: "function solve(readings: number[][]): number {\n    let min1 = Math.min(...readings[0]);\n    let min2 = Math.min(...readings[1]);\n    return min2 - min1;\n}",
      PYTHON: "def solve(readings):\n    return min(readings[1]) - min(readings[0])",
      JAVA: "    static int solve(int[][] readings) {\n        int min1 = readings[0][0];\n        int min2 = readings[1][0];\n        for (int i = 1; i < readings[0].length; i++) {\n            if (readings[0][i] < min1) min1 = readings[0][i];\n            if (readings[1][i] < min2) min2 = readings[1][i];\n        }\n        return min2 - min1;\n    }",
      CPP: "int solve(vector<vector<int>> readings) {\n    int min1 = readings[0][0];\n    int min2 = readings[1][0];\n    for (int i = 1; i < readings[0].size(); i++) {\n        if (readings[0][i] < min1) min1 = readings[0][i];\n        if (readings[1][i] < min2) min2 = readings[1][i];\n    }\n    return min2 - min1;\n}",
      GO: "func solve(readings [][]int) int {\n    min1 := readings[0][0]\n    min2 := readings[1][0]\n    for i := 1; i < len(readings[0]); i++ {\n        if readings[0][i] < min1 {\n            min1 = readings[0][i]\n        }\n        if readings[1][i] < min2 {\n            min2 = readings[1][i]\n        }\n    }\n    return min2 - min1\n}",
    },
    tests: [
      { stdin: "10 20 30;35 25 15", expectedStdout: "5", isSample: true },
      { stdin: "50 50;40 40", expectedStdout: "-10", isSample: true },
      { stdin: "100;100", expectedStdout: "0" },
      { stdin: "0 0 0;5 5 5", expectedStdout: "5" },
      { stdin: "1000 500 0;0 500 1000", expectedStdout: "0" },
      { stdin: "1;1000", expectedStdout: "999" },
      { stdin: "1000;1", expectedStdout: "-999" },
      { stdin: "4 3 2 1;7 8 9 10", expectedStdout: "6" },
    ],
  }),

  p({
    ...base,
    slug: "balanced-shift-schedule",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Balanced Shift Schedule",
    patternTags: ["string","scanning","two-pointers"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 500,
    promptMarkdown: "You are analyzing a work schedule formatted as a string `schedule` containing only the characters `'D'` (Day shift) and `'N'` (Night shift). \n\nA period of time is considered a \"balanced shift block\" if it consists of some number of consecutive `'D'`s followed immediately by an **equal** number of consecutive `'N'`s. \n\nReturn the length of the longest balanced shift block in the given schedule. If no such block exists, return `0`.\n\n**Constraints**\n- `1 <= schedule.length <= 50`\n- `schedule` consists only of `'D'` and `'N'`.\n\n**Example 1**\n```\ninput:\nNDDDNNNNDN\noutput: 6\n```\n*Explanation: The longest balanced block is \"DDDNNN\", which has three 'D's followed by three 'N's. Its length is 6.*\n\n**Example 2**\n```\ninput:\nDDDNN\noutput: 4\n```\n*Explanation: The longest balanced block is \"DDNN\", with length 4. (The first 'D' is extra).*\n\n**Example 3**\n```\ninput:\nNNNDDD\noutput: 0\n```\n*Explanation: There is no block where 'D's come before 'N's.*\n\n**Follow-up**\nCan you find the longest block in a single pass with constant space?",
    editorialMarkdown: "## Balanced Shift Schedule\nWe can iterate through the string and count consecutive 'D's and consecutive 'N's. When we encounter 'D's, if we previously had 'N's, we reset our 'D' count because a new block is starting. When we see 'N's, we match them with the available 'D's. The length of a valid balanced block at any point is `2 * min(countD, countN)`. We keep track of the maximum length found.\n\n**Trap**: Resetting the counts at the wrong time (e.g., forgetting to reset the 'D' count when transitioning from 'N' back to 'D').\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the schedule string. We make a single pass through the string.\n- **Space Complexity:** mathcal{O}(1) as we only use a few variables to maintain counts.",
    referenceSolution: {
      JAVASCRIPT: "function solve(schedule) {\n    let maxLen = 0;\n    let d = 0, n = 0;\n    for (let i = 0; i < schedule.length; i++) {\n        if (schedule[i] === 'D') {\n            if (n > 0) {\n                d = 0;\n                n = 0;\n            }\n            d++;\n        } else if (schedule[i] === 'N') {\n            n++;\n            let currentLen = 2 * Math.min(d, n);\n            if (currentLen > maxLen) {\n                maxLen = currentLen;\n            }\n        }\n    }\n    return maxLen;\n}",
      TYPESCRIPT: "function solve(schedule: string): number {\n    let maxLen = 0;\n    let d = 0, n = 0;\n    for (let i = 0; i < schedule.length; i++) {\n        if (schedule[i] === 'D') {\n            if (n > 0) {\n                d = 0;\n                n = 0;\n            }\n            d++;\n        } else if (schedule[i] === 'N') {\n            n++;\n            let currentLen = 2 * Math.min(d, n);\n            if (currentLen > maxLen) {\n                maxLen = currentLen;\n            }\n        }\n    }\n    return maxLen;\n}",
      PYTHON: "def solve(schedule):\n    max_len = 0\n    d = 0\n    n = 0\n    for char in schedule:\n        if char == 'D':\n            if n > 0:\n                d = 0\n                n = 0\n            d += 1\n        elif char == 'N':\n            n += 1\n            max_len = max(max_len, 2 * min(d, n))\n    return max_len",
      JAVA: "    static int solve(String schedule) {\n        int maxLen = 0;\n        int d = 0, n = 0;\n        for (int i = 0; i < schedule.length(); i++) {\n            if (schedule.charAt(i) == 'D') {\n                if (n > 0) {\n                    d = 0;\n                    n = 0;\n                }\n                d++;\n            } else if (schedule.charAt(i) == 'N') {\n                n++;\n                int currentLen = 2 * Math.min(d, n);\n                if (currentLen > maxLen) {\n                    maxLen = currentLen;\n                }\n            }\n        }\n        return maxLen;\n    }",
      CPP: "int solve(string schedule) {\n    int maxLen = 0;\n    int d = 0, n = 0;\n    for (int i = 0; i < schedule.length(); i++) {\n        if (schedule[i] == 'D') {\n            if (n > 0) {\n                d = 0;\n                n = 0;\n            }\n            d++;\n        } else if (schedule[i] == 'N') {\n            n++;\n            int currentLen = 2 * min(d, n);\n            if (currentLen > maxLen) {\n                maxLen = currentLen;\n            }\n        }\n    }\n    return maxLen;\n}",
      GO: "func solve(schedule string) int {\n    maxLen := 0\n    d := 0\n    n := 0\n    for i := 0; i < len(schedule); i++ {\n        if schedule[i] == 'D' {\n            if n > 0 {\n                d = 0\n                n = 0\n            }\n            d++\n        } else if schedule[i] == 'N' {\n            n++\n            currentLen := 2 * d\n            if n < d {\n                currentLen = 2 * n\n            }\n            if currentLen > maxLen {\n                maxLen = currentLen\n            }\n        }\n    }\n    return maxLen\n}",
    },
    tests: [
      { stdin: "NDDDNNNNDN", expectedStdout: "6", isSample: true },
      { stdin: "DDDNN", expectedStdout: "4", isSample: true },
      { stdin: "NNNDDD", expectedStdout: "0" },
      { stdin: "DN", expectedStdout: "2" },
      { stdin: "D", expectedStdout: "0" },
      { stdin: "N", expectedStdout: "0" },
      { stdin: "DDDDNNNNDDDD", expectedStdout: "8" },
      { stdin: "DDNDNNDDNN", expectedStdout: "4" },
    ],
  }),
];
