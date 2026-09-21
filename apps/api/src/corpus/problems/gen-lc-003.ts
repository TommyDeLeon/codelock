import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-003` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_003_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "tournament-matchups",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Tournament Matchups",
    patternTags: ["array","string","combinatorics"],
    signatureId: "fn:strings->strings",
    avgSolveSeconds: 400,
    promptMarkdown: "You are organizing an esports tournament where every team must play against every other team exactly once as the home team and exactly once as the away team.\n\nGiven an array of distinct strings `teams` representing the team names, return an array of all matches in the format `\\\"HomeTeam-AwayTeam\\\"`.\n\nThe matches should be ordered by the home team's index in the original array, and then by the away team's index in the original array.\n\n**Constraints**\n- `2 <= teams.length <= 20`\n- `1 <= teams[i].length <= 10`\n- Team names are distinct strings containing only lowercase English letters, without spaces.\n\n**Example 1**\n```\ninput:\na b\noutput: a-b b-a\n```\nTeam `a` plays at home against `b`, and team `b` plays at home against `a`.\n\n**Example 2**\n```\ninput:\na b c\noutput: a-b a-c b-a b-c c-a c-b\n```\nEvery pair of distinct teams is listed in the required order.\n\n**Example 3**\n```\ninput:\nteam x\noutput: team-x x-team\n```\nMatches between `team` and `x`.\n\n**Follow-up:** Can you solve this in O(N^2) time where N is the number of teams?",
    editorialMarkdown: "## Combinations with Nested Loops\n\nTo generate all matchups where every team plays every other team once at home and once away, we can iterate through the array of teams twice using two nested loops. The outer loop selects the `HomeTeam` and the inner loop selects the `AwayTeam`.\n\nWhenever the indices differ (i.e., `i != j`), we format the string `teams[i] + \\\"-\\\" + teams[j]` and append it to our result array.\n\nTime complexity is O(N^2), where N is the number of teams. Space complexity is O(N^2) to hold the output array.\n\nThe one trap most solvers hit is accidentally including matches where a team plays against itself, or incorrectly parsing string structures.",
    referenceSolution: {
      JAVASCRIPT: "function solve(teams) {\n    const res = [];\n    for (let i = 0; i < teams.length; i++) {\n        for (let j = 0; j < teams.length; j++) {\n            if (i !== j) {\n                res.push(teams[i] + '-' + teams[j]);\n            }\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(teams: string[]): string[] {\n    const res: string[] = [];\n    for (let i = 0; i < teams.length; i++) {\n        for (let j = 0; j < teams.length; j++) {\n            if (i !== j) {\n                res.push(teams[i] + '-' + teams[j]);\n            }\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(teams):\n    res = []\n    for i in range(len(teams)):\n        for j in range(len(teams)):\n            if i != j:\n                res.append(teams[i] + '-' + teams[j])\n    return res",
      JAVA: "    static String[] solve(String[] teams) {\n        java.util.List<String> res = new java.util.ArrayList<>();\n        for (int i = 0; i < teams.length; i++) {\n            for (int j = 0; j < teams.length; j++) {\n                if (i != j) {\n                    res.add(teams[i] + \"-\" + teams[j]);\n                }\n            }\n        }\n        return res.toArray(new String[0]);\n    }",
      CPP: "vector<string> solve(vector<string> teams) {\n    vector<string> res;\n    for (size_t i = 0; i < teams.size(); i++) {\n        for (size_t j = 0; j < teams.size(); j++) {\n            if (i != j) {\n                res.push_back(teams[i] + \"-\" + teams[j]);\n            }\n        }\n    }\n    return res;\n}",
      GO: "func solve(teams []string) []string {\n    res := []string{}\n    for i := 0; i < len(teams); i++ {\n        for j := 0; j < len(teams); j++ {\n            if i != j {\n                res = append(res, teams[i] + \"-\" + teams[j])\n            }\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "a b", expectedStdout: "a-b b-a", isSample: true },
      { stdin: "a b c", expectedStdout: "a-b a-c b-a b-c c-a c-b", isSample: true },
      { stdin: "team x", expectedStdout: "team-x x-team", isSample: true },
      { stdin: "x y z w", expectedStdout: "x-y x-z x-w y-x y-z y-w z-x z-y z-w w-x w-y w-z" },
      { stdin: "a b c d e", expectedStdout: "a-b a-c a-d a-e b-a b-c b-d b-e c-a c-b c-d c-e d-a d-b d-c d-e e-a e-b e-c e-d" },
      { stdin: "home away", expectedStdout: "home-away away-home" },
      { stdin: "one two three", expectedStdout: "one-two one-three two-one two-three three-one three-two" },
      { stdin: "alpha beta gamma", expectedStdout: "alpha-beta alpha-gamma beta-alpha beta-gamma gamma-alpha gamma-beta" },
    ],
  }),

  p({
    ...base,
    slug: "count-ascending-trios",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Count Ascending Trios",
    patternTags: ["array","counting","brute-force"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 450,
    promptMarkdown: "You are analyzing a sequence of stock prices given in an array `prices`. You want to find patterns of sustained growth, specifically three distinct days where the price strictly increased each time.\n\nCount the number of triplets of indices `(i, j, k)` such that `0 <= i < j < k < prices.length` and `prices[i] < prices[j] < prices[k]`.\n\n**Constraints**\n- `3 <= prices.length <= 50`\n- `0 <= prices[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 3\noutput: 1\n```\nThe only valid triplet is indices (0, 1, 2) where prices are 1 < 2 < 3.\n\n**Example 2**\n```\ninput:\n3 2 1\noutput: 0\n```\nThere are no increasing triplets.\n\n**Example 3**\n```\ninput:\n1 2 3 4\noutput: 4\n```\nThe triplets are (0,1,2), (0,1,3), (0,2,3), and (1,2,3).\n\n**Follow-up:** Can you solve this with O(1) extra space?",
    editorialMarkdown: "## Brute-Force Counting\n\nThe problem requires us to find the number of triplets `(i, j, k)` such that `i < j < k` and `prices[i] < prices[j] < prices[k]`.\n\nSince the array length is very small (at most 50), we can just use three nested loops. The outer loop runs `i` from `0` to `n-3`, the middle loop runs `j` from `i+1` to `n-2`, and the inner loop runs `k` from `j+1` to `n-1`. Inside the innermost loop, we check if `prices[i] < prices[j] < prices[k]`. If it evaluates to true, we increment our counter.\n\nTime complexity is O(N^3), which easily passes for N <= 50. Space complexity is O(1).\n\nThe one trap most solvers hit is overcomplicating the solution with dynamic programming or binary indexed trees, when simple nested loops are more than sufficient and much less error-prone given the small input size.",
    referenceSolution: {
      JAVASCRIPT: "function solve(prices) {\n    let count = 0;\n    const n = prices.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            for (let k = j + 1; k < n; k++) {\n                if (prices[i] < prices[j] && prices[j] < prices[k]) {\n                    count++;\n                }\n            }\n        }\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(prices: number[]): number {\n    let count = 0;\n    const n = prices.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            for (let k = j + 1; k < n; k++) {\n                if (prices[i] < prices[j] && prices[j] < prices[k]) {\n                    count++;\n                }\n            }\n        }\n    }\n    return count;\n}",
      PYTHON: "def solve(prices):\n    count = 0\n    n = len(prices)\n    for i in range(n):\n        for j in range(i + 1, n):\n            for k in range(j + 1, n):\n                if prices[i] < prices[j] < prices[k]:\n                    count += 1\n    return count",
      JAVA: "    static int solve(int[] prices) {\n        int count = 0;\n        int n = prices.length;\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                for (int k = j + 1; k < n; k++) {\n                    if (prices[i] < prices[j] && prices[j] < prices[k]) {\n                        count++;\n                    }\n                }\n            }\n        }\n        return count;\n    }",
      CPP: "int solve(vector<int> prices) {\n    int count = 0;\n    int n = prices.size();\n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            for (int k = j + 1; k < n; k++) {\n                if (prices[i] < prices[j] && prices[j] < prices[k]) {\n                    count++;\n                }\n            }\n        }\n    }\n    return count;\n}",
      GO: "func solve(prices []int) int {\n    count := 0\n    n := len(prices)\n    for i := 0; i < n; i++ {\n        for j := i + 1; j < n; j++ {\n            for k := j + 1; k < n; k++ {\n                if prices[i] < prices[j] && prices[j] < prices[k] {\n                    count++\n                }\n            }\n        }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "1 2 3", expectedStdout: "1", isSample: true },
      { stdin: "3 2 1", expectedStdout: "0", isSample: true },
      { stdin: "1 2 3 4", expectedStdout: "4", isSample: true },
      { stdin: "1 2 3 4 5", expectedStdout: "10" },
      { stdin: "5 4 3 2 1", expectedStdout: "0" },
      { stdin: "1 1 1", expectedStdout: "0" },
      { stdin: "10 20 30", expectedStdout: "1" },
      { stdin: "1 3 2 4", expectedStdout: "2" },
    ],
  }),

  p({
    ...base,
    slug: "single-execution-policy",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Single Execution Policy",
    patternTags: ["array","simulation"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 300,
    promptMarkdown: "You are building a system that processes a batch of transaction amounts. Due to a new single-execution policy, only the very first transaction in the batch should be processed, and all subsequent transactions must be replaced with `0`.\n\nGiven an array of integers `transactions`, return a new array where the first element remains unchanged, and all other elements are set to `0`. If the input array is empty, return an empty array.\n\n**Constraints**\n- `0 <= transactions.length <= 100`\n- `-1000 <= transactions[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 3\noutput: 1 0 0\n```\nOnly the first transaction (1) is kept, the rest become 0.\n\n**Example 2**\n```\ninput:\n\noutput: \n```\nAn empty input results in an empty output.\n\n**Example 3**\n```\ninput:\n42\noutput: 42\n```\nA single transaction is unchanged.\n\n**Follow-up:** Can you solve this efficiently without modifying the original input array?",
    editorialMarkdown: "## Simple Array Modification\n\nThe problem requires simulating a single-execution policy on an array of transactions, meaning only the first transaction is kept intact and the rest are overwritten with `0`.\n\nWe can solve this by creating a new array of the same length as the input. If the input is not empty, we simply assign the first element from the input to the new array at index 0. All other elements in the new array naturally default to `0` (or we can explicitly set them to `0` in our loop if necessary).\n\nTime complexity is O(N) where N is the length of the array, which is required to build the new output array. Space complexity is O(N).\n\nThe one trap most solvers hit is forgetting to handle the edge case where the input array is completely empty.",
    referenceSolution: {
      JAVASCRIPT: "function solve(transactions) {\n    if (transactions.length === 0) return [];\n    const res = new Array(transactions.length).fill(0);\n    res[0] = transactions[0];\n    return res;\n}",
      TYPESCRIPT: "function solve(transactions: number[]) {\n    if (transactions.length === 0) return [];\n    const res = new Array(transactions.length).fill(0);\n    res[0] = transactions[0];\n    return res;\n}",
      PYTHON: "def solve(transactions):\n    if not transactions:\n        return []\n    res = [0] * len(transactions)\n    res[0] = transactions[0]\n    return res",
      JAVA: "    static int[] solve(int[] transactions) {\n        if (transactions.length == 0) return new int[0];\n        int[] res = new int[transactions.length];\n        res[0] = transactions[0];\n        return res;\n    }",
      CPP: "vector<int> solve(vector<int> transactions) {\n    if (transactions.empty()) return {};\n    vector<int> res(transactions.size(), 0);\n    res[0] = transactions[0];\n    return res;\n}",
      GO: "func solve(transactions []int) []int {\n    if len(transactions) == 0 {\n        return []int{}\n    }\n    res := make([]int, len(transactions))\n    res[0] = transactions[0]\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 3", expectedStdout: "1 0 0", isSample: true },
      { stdin: "", expectedStdout: "", isSample: true },
      { stdin: "42", expectedStdout: "42", isSample: true },
      { stdin: "0 0 0", expectedStdout: "0 0 0" },
      { stdin: "5 -1 3", expectedStdout: "5 0 0" },
      { stdin: "-10 20", expectedStdout: "-10 0" },
      { stdin: "1 1 1 1", expectedStdout: "1 0 0 0" },
      { stdin: "9 8 7 6 5", expectedStdout: "9 0 0 0 0" },
    ],
  }),
];
