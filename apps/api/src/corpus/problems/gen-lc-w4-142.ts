import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w4-142` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W4_142_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "calculate-team-experience-average",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Average Team Experience",
    patternTags: ["array","math"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are managing a software team and want to find out the average years of experience of your developers. You are given an integer array `experience` representing the years of experience of each developer.\n\nCalculate the average years of experience of the team, rounded down to the nearest integer.\n\n**Constraints**\n- `1 <= experience.length <= 1000`\n- `0 <= experience[i] <= 50`\n\n**Example 1**\n```\ninput:\n1 2 3\noutput:\n2\n```\n*Explanation: The sum is 6. 6 / 3 = 2.*\n\n**Example 2**\n```\ninput:\n1 1 1\noutput:\n1\n```\n*Explanation: The sum is 3. 3 / 3 = 1.*\n\n**Example 3**\n```\ninput:\n5\noutput:\n5\n```\n*Explanation: Only one developer with 5 years.*\n\n**Follow-up**\nCan you do this using only O(1) extra space?",
    editorialMarkdown: "## Average Team Experience\nWe need to calculate the average of an array of integers.\nWe iterate through the `experience` array, keeping a running `sum` of all elements. Finally, we divide the sum by the length of the array to get the average. Since we are dealing with integer arithmetic in most languages, dividing the sum by the count automatically drops the decimal part, achieving the \"rounded down\" requirement for positive numbers.\n\n**Trap**: Using floating-point division and forgetting to round down, which could result in a type mismatch or incorrect value.\n\n**Complexity:**\n- **Time:** O(N) where N is the number of developers, as we iterate through the array once.\n- **Space:** O(1) since we only use a single variable for the sum.",
    referenceSolution: {
      JAVASCRIPT: "function solve(experience) {\n    let sum = 0;\n    for (let i = 0; i < experience.length; i++) {\n        sum += experience[i];\n    }\n    return Math.floor(sum / experience.length);\n}",
      TYPESCRIPT: "function solve(experience: number[]): number {\n    let sum = 0;\n    for (let i = 0; i < experience.length; i++) {\n        sum += experience[i];\n    }\n    return Math.floor(sum / experience.length);\n}",
      PYTHON: "def solve(experience):\n    return sum(experience) // len(experience)",
      JAVA: "    static int solve(int[] experience) {\n        int sum = 0;\n        for (int i = 0; i < experience.length; i++) {\n            sum += experience[i];\n        }\n        return sum / experience.length;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nint solve(vector<int> experience) {\n    int sum = 0;\n    for (int i = 0; i < experience.size(); i++) {\n        sum += experience[i];\n    }\n    return sum / experience.size();\n}",
      GO: "func solve(experience []int) int {\n    sum := 0\n    for i := 0; i < len(experience); i++ {\n        sum += experience[i]\n    }\n    return sum / len(experience)\n}",
    },
    tests: [
      { stdin: "1 2 3", expectedStdout: "2", isSample: true },
      { stdin: "1 1 1", expectedStdout: "1", isSample: true },
      { stdin: "5", expectedStdout: "5" },
      { stdin: "2 3", expectedStdout: "2" },
      { stdin: "0 0 0", expectedStdout: "0" },
      { stdin: "10 20 30 40", expectedStdout: "25" },
      { stdin: "7 7 8 8", expectedStdout: "7" },
      { stdin: "50 50 49", expectedStdout: "49" },
    ],
  }),

  p({
    ...base,
    slug: "aggregate-server-metrics",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Aggregate Server Metrics",
    patternTags: ["arrays","hash-map","counting"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 500,
    promptMarkdown: "You receive a stream of metrics from different servers. The data is given as a single integer array `metrics` of even length. Every pair of adjacent elements `(metrics[2*i], metrics[2*i+1])` represents a `serverId` and a `load` value, respectively.\n\nThe `serverId` is guaranteed to be between `0` and `9` inclusive.\nReturn an array of exactly 10 integers, where the `j`-th integer represents the total load accumulated for server `j`.\n\n**Constraints**\n- `0 <= metrics.length <= 200`\n- `metrics.length` is even.\n- `0 <= metrics[2*i] <= 9`\n- `0 <= metrics[2*i+1] <= 100`\n\n**Example 1**\n```\ninput:\n0 10 1 20 0 5\noutput:\n15 20 0 0 0 0 0 0 0 0\n```\n*Explanation: Server 0 has loads 10 and 5, totaling 15. Server 1 has load 20. Other servers have 0.*\n\n**Example 2**\n```\ninput:\n9 100\noutput:\n0 0 0 0 0 0 0 0 0 100\n```\n*Explanation: Only server 9 has a load of 100.*\n\n**Example 3**\n```\ninput:\n\noutput:\n0 0 0 0 0 0 0 0 0 0\n```\n*Explanation: No data is present, so all servers have a load of 0.*\n\n**Follow-up**\nCan you solve this with exactly one loop over the elements?",
    editorialMarkdown: "## Aggregate Server Metrics\nThis problem asks us to transform a flat list of key-value pairs into an aggregated array. We initialize an array of size 10 with zeros. Then, we iterate through the `metrics` array in steps of 2, reading `metrics[i]` as the server ID and `metrics[i+1]` as the load. We simply add the load to our result array at the index corresponding to the server ID.\n\n**Trap**: Forgetting to increment the loop index by 2, which would misinterpret load values as server IDs and lead to an index-out-of-bounds error.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the array, as we iterate through all elements.\n- **Space:** O(1) since the result array size is strictly fixed at 10.",
    referenceSolution: {
      JAVASCRIPT: "function solve(metrics) {\n    let res = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];\n    for (let i = 0; i < metrics.length; i += 2) {\n        res[metrics[i]] += metrics[i + 1];\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(metrics: number[]): number[] {\n    let res = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];\n    for (let i = 0; i < metrics.length; i += 2) {\n        res[metrics[i]] += metrics[i + 1];\n    }\n    return res;\n}",
      PYTHON: "def solve(metrics):\n    res = [0] * 10\n    for i in range(0, len(metrics), 2):\n        res[metrics[i]] += metrics[i + 1]\n    return res",
      JAVA: "    static int[] solve(int[] metrics) {\n        int[] res = new int[10];\n        for (int i = 0; i < metrics.length; i += 2) {\n            res[metrics[i]] += metrics[i + 1];\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<int> metrics) {\n    vector<int> res(10, 0);\n    for (int i = 0; i < metrics.size(); i += 2) {\n        res[metrics[i]] += metrics[i + 1];\n    }\n    return res;\n}",
      GO: "func solve(metrics []int) []int {\n    res := make([]int, 10)\n    for i := 0; i < len(metrics); i += 2 {\n        res[metrics[i]] += metrics[i + 1]\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "0 10 1 20 0 5", expectedStdout: "15 20 0 0 0 0 0 0 0 0", isSample: true },
      { stdin: "9 100", expectedStdout: "0 0 0 0 0 0 0 0 0 100", isSample: true },
      { stdin: "", expectedStdout: "0 0 0 0 0 0 0 0 0 0" },
      { stdin: "2 10 2 20 2 30", expectedStdout: "0 0 60 0 0 0 0 0 0 0" },
      { stdin: "0 0 1 0 2 0", expectedStdout: "0 0 0 0 0 0 0 0 0 0" },
      { stdin: "8 5 8 5 9 10 9 10", expectedStdout: "0 0 0 0 0 0 0 0 10 20" },
      { stdin: "3 33", expectedStdout: "0 0 0 33 0 0 0 0 0 0" },
      { stdin: "0 1 1 1 2 1 3 1 4 1 5 1 6 1 7 1 8 1 9 1", expectedStdout: "1 1 1 1 1 1 1 1 1 1" },
    ],
  }),
];
