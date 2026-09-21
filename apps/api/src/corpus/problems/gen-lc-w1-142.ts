import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w1-142` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W1_142_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "maximum-matching-security-code",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Maximum Matching Security Code",
    patternTags: ["math","array","digits"],
    signatureId: "fn:ints,int->int",
    avgSolveSeconds: 350,
    promptMarkdown: "You are given an array of integers `codes` and a target integer `targetSum`. Return the maximum integer in `codes` whose digits sum to exactly `targetSum`.\n\nIf there is no such integer in the array, return `-1`.\n\nNote: The digit sum is calculated using the absolute value of the integer (e.g., the digit sum of `-12` is `1 + 2 = 3`).\n\n**Constraints**\n- `0 <= codes.length <= 1000`\n- `-1000000 <= codes[i] <= 1000000`\n- `1 <= targetSum <= 100`\n\n**Example 1**\n```\ninput:\n  123 24 60 51\n  6\noutput:\n  123\n```\n*Explanation: The digit sums are 6 (for 123), 6 (for 24), 6 (for 60), and 6 (for 51). Since all of them equal the target sum, we return the largest integer, which is 123.*\n\n**Example 2**\n```\ninput:\n  10 20 30\n  5\noutput:\n  -1\n```\n*Explanation: None of the integers have a digit sum of 5, so we return -1.*\n\n**Example 3**\n```\ninput:\n  9 18 27 36\n  9\noutput:\n  36\n```\n*Explanation: All of the numbers have a digit sum of 9. The largest integer among them is 36.*\n\n**Follow-up**\nCan you solve this with O(1) auxiliary space?",
    editorialMarkdown: "## Maximum Matching Security Code\n\nThe problem requires us to find the maximum integer in an array whose digits sum to a specific target value.\n\nWe can iterate through each number in the array. For each number, we compute the sum of its digits (ignoring the negative sign if any, though constraints may limit this to non-negatives). If the digit sum matches the `targetSum` and the current number is strictly greater than our running maximum answer, we update our maximum. We initialize the maximum answer to -1 to satisfy the requirement if no such number exists.\n\n**Trap**: Make sure you compute the digit sum of the *absolute value* of the number if negative numbers are present. Also, do not modify the original number in a way that prevents you from later comparing it to the running maximum.\n\n**Complexity:**\n- **Time:** O(N * D), where N is the number of elements in `codes` and D is the maximum number of digits in an element. Since integers are capped at 1,000,000, D is at most 7. Thus, the time complexity is practically O(N).\n- **Space:** O(1), as we only need a few variables to maintain the running maximum and process the current digit sum.",
    referenceSolution: {
      JAVASCRIPT: "function solve(codes, targetSum) {\n    let ans = -1;\n    let found = false;\n    for (let num of codes) {\n        let temp = Math.abs(num);\n        let s = 0;\n        while (temp > 0) {\n            s += temp % 10;\n            temp = Math.floor(temp / 10);\n        }\n        if (s === targetSum) {\n            if (!found || num > ans) {\n                ans = num;\n                found = true;\n            }\n        }\n    }\n    return found ? ans : -1;\n}",
      TYPESCRIPT: "function solve(codes: number[], targetSum: number): number {\n    let ans = -1;\n    let found = false;\n    for (let num of codes) {\n        let temp = Math.abs(num);\n        let s = 0;\n        while (temp > 0) {\n            s += temp % 10;\n            temp = Math.floor(temp / 10);\n        }\n        if (s === targetSum) {\n            if (!found || num > ans) {\n                ans = num;\n                found = true;\n            }\n        }\n    }\n    return found ? ans : -1;\n}",
      PYTHON: "def solve(codes, targetSum):\n    ans = -1\n    found = False\n    for num in codes:\n        temp = abs(num)\n        s = 0\n        while temp > 0:\n            s += temp % 10\n            temp //= 10\n        if s == targetSum:\n            if not found or num > ans:\n                ans = num\n                found = True\n    return ans if found else -1",
      JAVA: "    static int solve(int[] codes, int targetSum) {\n        int ans = -1;\n        boolean found = false;\n        for (int num : codes) {\n            int temp = Math.abs(num);\n            int s = 0;\n            while (temp > 0) {\n                s += temp % 10;\n                temp /= 10;\n            }\n            if (s == targetSum) {\n                if (!found || num > ans) {\n                    ans = num;\n                    found = true;\n                }\n            }\n        }\n        return ans;\n    }",
      CPP: "#include <vector>\n#include <cmath>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(vector<int> codes, int targetSum) {\n    int ans = -1;\n    bool found = false;\n    for (int num : codes) {\n        int temp = abs(num);\n        int s = 0;\n        while (temp > 0) {\n            s += temp % 10;\n            temp /= 10;\n        }\n        if (s == targetSum) {\n            if (!found || num > ans) {\n                ans = num;\n                found = true;\n            }\n        }\n    }\n    return ans;\n}",
      GO: "func solve(codes []int, targetSum int) int {\n    ans := -1\n    found := false\n    for _, num := range codes {\n        temp := num\n        if temp < 0 {\n            temp = -temp\n        }\n        s := 0\n        for temp > 0 {\n            s += temp % 10\n            temp /= 10\n        }\n        if s == targetSum {\n            if !found || num > ans {\n                ans = num\n                found = true\n            }\n        }\n    }\n    if !found {\n        return -1\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "123 24 60 51\n6", expectedStdout: "123", isSample: true },
      { stdin: "10 20 30\n5", expectedStdout: "-1", isSample: true },
      { stdin: "9 18 27 36\n9", expectedStdout: "36" },
      { stdin: "\n1", expectedStdout: "-1" },
      { stdin: "5\n5", expectedStdout: "5" },
      { stdin: "-12 -21 30\n3", expectedStdout: "30" },
      { stdin: "-12 -21\n3", expectedStdout: "-12" },
      { stdin: "55 55\n10", expectedStdout: "55" },
    ],
  }),
];
