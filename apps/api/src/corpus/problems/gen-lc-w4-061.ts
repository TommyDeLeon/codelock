import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w4-061` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W4_061_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "trimmed-sensor-average",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Fair Baking Evaluation",
    patternTags: ["math","sorting","arrays"],
    signatureId: "fn:ints->double",
    avgSolveSeconds: 500,
    promptMarkdown: "You are a judge in a prestigious baking competition where you are given an array of integer `scores` representing the points awarded to a contestant by various critics. To ensure fairness and eliminate extreme bias, the lowest 5% and highest 5% of the scores are discarded.\n\nGiven an array of integers `scores` whose length is a multiple of 20, return the mean (average) of the remaining scores after dropping the smallest 5% and largest 5% of the values.\n\nAnswers within 10^-5 of the actual value will be considered correct.\n\n**Constraints**\n- `20 <= scores.length <= 1000`\n- `scores.length` is a multiple of 20\n- `-10000 <= scores[i] <= 10000`\n\n**Example 1**\n```\ninput:\n1 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 3\noutput:\n2.000000\n```\n*Explanation: The length is 20. 5% of 20 is 1. We discard the lowest score (1) and the highest score (3). The remaining 18 scores are all 2, so the mean is 2.0.*\n\n**Example 2**\n```\ninput:\n6 2 7 5 1 2 0 3 10 2 5 0 5 5 0 8 7 6 8 0\noutput:\n4.000000\n```\n*Explanation: The length is 20, so we discard the lowest 1 and highest 1 scores. After sorting: 0, 0, 0, 0, 1, 2, 2, 2, 3, 5, 5, 5, 5, 6, 6, 7, 7, 8, 8, 10. Removing one 0 and one 10 gives sum = 72. 72 / 18 = 4.0.*\n\n**Example 3**\n```\ninput:\n5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5\noutput:\n5.000000\n```\n*Explanation: Removing one 5 from each end leaves eighteen 5s, averaging 5.0.*\n\n**Follow-up**\nCan you think of a way to do this in O(N) time without fully sorting the array using a selection algorithm?",
    editorialMarkdown: "## Trimmed Sensor Average\n\nWe need to calculate the average of an array of sensor readings, but we must first discard the highest 5% and the lowest 5% to remove potential outliers.\n\nThe simplest approach is to sort the array first. Once sorted, the lowest values are at the beginning and the highest values are at the end. We can calculate `remove_count` as `5%` of the total length, which is `length / 20`. We then iterate over the array from index `remove_count` to `length - remove_count - 1`, sum these middle values, and divide by the number of remaining elements to get the average.\n\n**Trap**: Be careful with floating-point math depending on the language. A common mistake is integer division when calculating the final mean, resulting in truncation of the decimal part.\n\n**Complexity:**\n- **Time:** O(N log N) where N is the length of the array, due to sorting.\n- **Space:** O(1) or O(N) depending on the language's sorting algorithm.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    a.sort((x, y) => x - y);\n    let n = a.length;\n    let removeCount = Math.floor(n / 20);\n    let sum = 0;\n    for (let i = removeCount; i < n - removeCount; i++) {\n        sum += a[i];\n    }\n    return sum / (n - 2 * removeCount);\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    a.sort((x, y) => x - y);\n    let n = a.length;\n    let removeCount = Math.floor(n / 20);\n    let sum = 0;\n    for (let i = removeCount; i < n - removeCount; i++) {\n        sum += a[i];\n    }\n    return sum / (n - 2 * removeCount);\n}",
      PYTHON: "def solve(a):\n    a.sort()\n    n = len(a)\n    remove_count = n // 20\n    \n    total = sum(a[remove_count:n-remove_count])\n    return total / (n - 2 * remove_count)",
      JAVA: "    static double solve(int[] a) {\n        java.util.Arrays.sort(a);\n        int n = a.length;\n        int removeCount = n / 20;\n        double sum = 0;\n        for (int i = removeCount; i < n - removeCount; i++) {\n            sum += a[i];\n        }\n        return sum / (n - 2 * removeCount);\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n#include <numeric>\n\nusing namespace std;\n\ndouble solve(vector<int> a) {\n    sort(a.begin(), a.end());\n    int n = a.size();\n    int remove_count = n / 20;\n    \n    double sum = 0;\n    for (int i = remove_count; i < n - remove_count; i++) {\n        sum += a[i];\n    }\n    return sum / (n - 2 * remove_count);\n}",
      GO: "func solve(a []int) float64 {\n    for i := 1; i < len(a); i++ {\n        for j := i; j > 0 && a[j-1] > a[j]; j-- {\n            a[j], a[j-1] = a[j-1], a[j]\n        }\n    }\n    \n    n := len(a)\n    removeCount := n / 20\n    sum := 0.0\n    \n    for i := removeCount; i < n - removeCount; i++ {\n        sum += float64(a[i])\n    }\n    return sum / float64(n - 2 * removeCount)\n}",
    },
    tests: [
      { stdin: "1 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 3", expectedStdout: "2.000000", isSample: true },
      { stdin: "6 2 7 5 1 2 0 3 10 2 5 0 5 5 0 8 7 6 8 0", expectedStdout: "4.000000", isSample: true },
      { stdin: "5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5 5", expectedStdout: "5.000000" },
      { stdin: "-6 -2 -7 -5 -1 -2 0 -3 -10 -2 -5 0 -5 -5 0 -8 -7 -6 -8 0", expectedStdout: "-4.000000" },
      { stdin: "-10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 100", expectedStdout: "10.000000" },
      { stdin: "1 2 3 4 5 6 7 8 9 10 1 2 3 4 5 6 7 8 9 10 1 2 3 4 5 6 7 8 9 10 1 2 3 4 5 6 7 8 9 10", expectedStdout: "5.500000" },
      { stdin: "1 2 3 4 5 6 7 8 9 10 1 2 3 4 5 6 7 8 9 10", expectedStdout: "5.500000" },
      { stdin: "0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 2", expectedStdout: "1.000000" },
    ],
  }),

  p({
    ...base,
    slug: "telescope-observation-conflicts",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "INTERVALS",
    title: "Single-Track Bridge Management",
    patternTags: ["intervals","sorting","arrays","matrix"],
    signatureId: "fn:matrix->bool",
    avgSolveSeconds: 450,
    promptMarkdown: "You are a railway dispatcher managing a critical single-track bridge. You are given a list of scheduled `transits`, where each transit is an array `[entry, exit]` representing the exact entry and exit times of a train crossing the bridge.\n\nThe bridge can only support one train at a time. Return `true` if it is possible to accommodate all scheduled transits without any trains being on the bridge at the same time, and `false` otherwise.\n\nNote that one train exiting the bridge at the exact same moment another train enters is considered safe and does not cause a collision.\n\n**Constraints**\n- `0 <= transits.length <= 100`\n- `transits[i].length == 2`\n- `0 <= entry < exit <= 10^6`\n\n**Example 1**\n```\ninput:\n0 30; 5 10; 15 20\noutput:\nfalse\n```\n*Explanation: The train crossing from time 5 to 10 is on the bridge at the same time as the train crossing from 0 to 30.*\n\n**Example 2**\n```\ninput:\n7 10; 2 4\noutput:\ntrue\n```\n*Explanation: The transits [2, 4] and [7, 10] do not happen at the same time.*\n\n**Example 3**\n```\ninput:\n1 5; 5 10\noutput:\ntrue\n```\n*Explanation: The transits share a boundary at time 5, which is permitted as they do not strictly overlap.*\n\n**Follow-up**\nWhat is the time complexity of your approach? Could you achieve a faster time complexity if the times were bounded to a small range (e.g., 0 to 1000)?",
    editorialMarkdown: "## Telescope Observation Conflicts\n\nThis problem requires us to determine if any given intervals in an array overlap.\n\nThe optimal approach is to first sort the intervals based on their start times. Once sorted, we only need to compare each interval with the one immediately following it. If the end time of the current observation is strictly greater than the start time of the next observation, it means they overlap, causing a conflict, so we return false. If we check all adjacent pairs and find no overlaps, we return true.\n\n**Trap**: A common pitfall is to forget to sort the array first, leading to an O(N^2) comparison of every pair. Sorting brings the time complexity down to O(N log N) and allows for a simple linear scan.\n\n**Complexity:**\n- **Time:** O(N log N) where N is the number of intervals, due to sorting. The linear scan takes O(N) time.\n- **Space:** O(1) or O(N) depending on the sorting algorithm implementation of the language.",
    referenceSolution: {
      JAVASCRIPT: "function solve(matrix) {\n    if (matrix.length === 0) return true;\n    matrix.sort((a, b) => a[0] - b[0]);\n    for (let i = 1; i < matrix.length; i++) {\n        if (matrix[i][0] < matrix[i-1][1]) {\n            return false;\n        }\n    }\n    return true;\n}",
      TYPESCRIPT: "function solve(matrix: number[][]): boolean {\n    if (matrix.length === 0) return true;\n    matrix.sort((a, b) => a[0] - b[0]);\n    for (let i = 1; i < matrix.length; i++) {\n        if (matrix[i][0] < matrix[i-1][1]) {\n            return false;\n        }\n    }\n    return true;\n}",
      PYTHON: "def solve(matrix):\n    if not matrix:\n        return True\n    matrix.sort(key=lambda x: x[0])\n    for i in range(1, len(matrix)):\n        if matrix[i][0] < matrix[i-1][1]:\n            return False\n    return True",
      JAVA: "    static boolean solve(int[][] matrix) {\n        if (matrix == null || matrix.length == 0) return true;\n        java.util.Arrays.sort(matrix, (a, b) -> Integer.compare(a[0], b[0]));\n        for (int i = 1; i < matrix.length; i++) {\n            if (matrix[i][0] < matrix[i-1][1]) {\n                return false;\n            }\n        }\n        return true;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nbool solve(vector<vector<int>> matrix) {\n    if (matrix.empty()) return true;\n    sort(matrix.begin(), matrix.end(), [](const vector<int>& a, const vector<int>& b) {\n        return a[0] < b[0];\n    });\n    \n    for (int i = 1; i < matrix.size(); i++) {\n        if (matrix[i][0] < matrix[i-1][1]) {\n            return false;\n        }\n    }\n    return true;\n}",
      GO: "func solve(matrix [][]int) bool {\n    if len(matrix) == 0 {\n        return true\n    }\n    for i := 1; i < len(matrix); i++ {\n        for j := i; j > 0 && matrix[j-1][0] > matrix[j][0]; j-- {\n            matrix[j], matrix[j-1] = matrix[j-1], matrix[j]\n        }\n    }\n    \n    for i := 1; i < len(matrix); i++ {\n        if matrix[i][0] < matrix[i-1][1] {\n            return false\n        }\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "0 30; 5 10; 15 20", expectedStdout: "false", isSample: true },
      { stdin: "7 10; 2 4", expectedStdout: "true", isSample: true },
      { stdin: "1 5; 5 10", expectedStdout: "true" },
      { stdin: "", expectedStdout: "true" },
      { stdin: "1 1000", expectedStdout: "true" },
      { stdin: "1 5; 4 10", expectedStdout: "false" },
      { stdin: "10 20; 5 15", expectedStdout: "false" },
      { stdin: "1 2; 3 4; 5 6; 7 8; 9 10", expectedStdout: "true" },
    ],
  }),

  p({
    ...base,
    slug: "maximum-signal-resonance",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BIT_MANIPULATION",
    title: "Gemstone Fusion",
    patternTags: ["arrays","brute-force","bit-manipulation","xor"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are an alchemist experimenting with a collection of rare gemstones. The magical potencies of these gemstones are provided as an array of positive integers `potencies`. \n\nTwo gemstones can be successfully fused if their potencies `x` and `y` are sufficiently balanced. Specifically, a fusion is stable if the absolute difference between their potencies is at most the smaller of the two potencies, i.e., `|x - y| <= min(x, y)`. \n\nWhen two gemstones are fused, the resulting magical yield is calculated as the bitwise XOR of their potencies (`x ^ y`).\n\nGiven the array `potencies`, return the maximum possible magical yield that can be achieved by fusing two stable gemstones. Note that you have an unlimited supply of each gemstone, so a gemstone can be fused with another gemstone of the exact same potency.\n\n**Constraints**\n- `1 <= potencies.length <= 100`\n- `1 <= potencies[i] <= 100`\n\n**Example 1**\n```\ninput:\n1 2 3 4 5\noutput:\n7\n```\n*Explanation: The pair (3, 4) satisfies |3 - 4| <= min(3, 4) -> 1 <= 3. Their magical yield is 3 ^ 4 = 7.*\n\n**Example 2**\n```\ninput:\n10 100\noutput:\n0\n```\n*Explanation: No two different gemstones can be fused, as |10 - 100| = 90, which is not <= 10. The only valid fusions involve a gemstone with a copy of itself, giving 10 ^ 10 = 0.*\n\n**Example 3**\n```\ninput:\n5 6 25 30\noutput:\n7\n```\n*Explanation: The pair (25, 30) yields 25 ^ 30 = 7.*\n\n**Follow-up**\nCan you solve this using a Trie to achieve better than O(N^2) time complexity?",
    editorialMarkdown: "## Maximum Signal Resonance\n\nThis problem requires finding the maximum XOR of any valid pair in the array, where a valid pair satisfies the condition `|x - y| <= min(x, y)`.\n\nBecause the array is small, we can simply use a brute-force approach. We check every possible pair of elements `(x, y)` from the array. For each pair, we verify if the absolute difference is less than or equal to the minimum of the two elements. If it is, we calculate their bitwise XOR and update our maximum observed value.\n\n**Trap**: A common mistake is to forget that a number can be paired with itself. While `x ^ x` is always `0`, it is a valid pair and should be considered, especially if the array has only one element (though max XOR would be 0).\n\n**Complexity:**\n- **Time:** O(N^2), where N is the length of the list, since we check all pairs.\n- **Space:** O(1), as we only need a few variables to store the maximum XOR value.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let maxVal = 0;\n    for (let i = 0; i < a.length; i++) {\n        for (let j = i; j < a.length; j++) {\n            let x = a[i], y = a[j];\n            if (Math.abs(x - y) <= Math.min(x, y)) {\n                maxVal = Math.max(maxVal, x ^ y);\n            }\n        }\n    }\n    return maxVal;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    let maxVal: number = 0;\n    for (let i = 0; i < a.length; i++) {\n        for (let j = i; j < a.length; j++) {\n            let x = a[i], y = a[j];\n            if (Math.abs(x - y) <= Math.min(x, y)) {\n                maxVal = Math.max(maxVal, x ^ y);\n            }\n        }\n    }\n    return maxVal;\n}",
      PYTHON: "def solve(a):\n    max_val = 0\n    for i in range(len(a)):\n        for j in range(i, len(a)):\n            x, y = a[i], a[j]\n            if abs(x - y) <= min(x, y):\n                max_val = max(max_val, x ^ y)\n    return max_val",
      JAVA: "    static int solve(int[] a) {\n        int maxVal = 0;\n        for (int i = 0; i < a.length; i++) {\n            for (int j = i; j < a.length; j++) {\n                int x = a[i], y = a[j];\n                if (Math.abs(x - y) <= Math.min(x, y)) {\n                    maxVal = Math.max(maxVal, x ^ y);\n                }\n            }\n        }\n        return maxVal;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n#include <cmath>\n\nusing namespace std;\n\nint solve(vector<int> a) {\n    int max_val = 0;\n    for (int i = 0; i < a.size(); ++i) {\n        for (int j = i; j < a.size(); ++j) {\n            int x = a[i], y = a[j];\n            if (abs(x - y) <= min(x, y)) {\n                max_val = max(max_val, x ^ y);\n            }\n        }\n    }\n    return max_val;\n}",
      GO: "func solve(a []int) int {\n    maxVal := 0\n    for i := 0; i < len(a); i++ {\n        for j := i; j < len(a); j++ {\n            x, y := a[i], a[j]\n            absDiff := x - y\n            if absDiff < 0 {\n                absDiff = -absDiff\n            }\n            minVal := x\n            if y < x {\n                minVal = y\n            }\n            if absDiff <= minVal {\n                xor := x ^ y\n                if xor > maxVal {\n                    maxVal = xor\n                }\n            }\n        }\n    }\n    return maxVal\n}",
    },
    tests: [
      { stdin: "1 2 3 4 5", expectedStdout: "7", isSample: true },
      { stdin: "10 100", expectedStdout: "0", isSample: true },
      { stdin: "5 6 25 30", expectedStdout: "7" },
      { stdin: "5", expectedStdout: "0" },
      { stdin: "1 1 1", expectedStdout: "0" },
      { stdin: "1 2 3 4 5 6 7 8 9 10", expectedStdout: "15" },
      { stdin: "10 10 11 15 5 5 5 100 100 80", expectedStdout: "52" },
      { stdin: "2 1 2 1", expectedStdout: "3" },
    ],
  }),

  p({
    ...base,
    slug: "longest-harmonious-sequence",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Synchronized Transmission Codes",
    patternTags: ["arrays","math","subarray","gcd"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 900,
    promptMarkdown: "You are a cryptographer analyzing an intercepted sequence of transmission codes represented as positive integers. A contiguous block of codes is considered **synchronized** if the product of all the codes in the block is exactly equal to their Greatest Common Divisor (GCD) multiplied by their Least Common Multiple (LCM).\n\nGiven an array of integers `codes`, return the length of the longest contiguous synchronized subarray.\n\n**Constraints**\n- `1 <= codes.length <= 50`\n- `1 <= codes[i] <= 10`\n\n**Example 1**\n```\ninput:\n1 2 3\noutput:\n3\n```\n*Explanation: The subarray [1, 2, 3] has product = 6, GCD = 1, LCM = 6. 6 == 1 * 6. The longest synchronized subarray length is 3.*\n\n**Example 2**\n```\ninput:\n2 4 8\noutput:\n2\n```\n*Explanation: The subarray [2, 4] is synchronized (product 8, GCD 2, LCM 4). The subarray [2, 4, 8] has product 64, GCD 2, LCM 8, which gives 64 != 16, so it's not synchronized.*\n\n**Example 3**\n```\ninput:\n5\noutput:\n0\n```\n*Explanation: For the subarray [5], product is 5, GCD is 5, LCM is 5. Since 5 != 25, it is not synchronized. There are no synchronized subarrays.*\n\n**Follow-up**\nGiven that the product of the array elements can grow exceptionally large, how can you efficiently verify the synchronized condition without computing the full product in languages with bounded integer types?",
    editorialMarkdown: "## Longest Harmonious Sequence\n\nWe need to find the length of the longest contiguous subarray where the product of all elements equals the product of their Greatest Common Divisor (GCD) and Least Common Multiple (LCM).\n\nGiven the small constraints, we can use a brute-force approach. We iterate over all possible subarrays, keeping a running product, a running GCD, and a running LCM. If at any point the running product equals the running GCD multiplied by the running LCM, we update our maximum length.\n\n**Trap**: Calculating LCM can cause integer overflow if not careful. By doing `(a / gcd(a, b)) * b`, we minimize the intermediate values. Also, for more than two elements, `product == gcd * lcm` is only true for specific patterns, so we must calculate all three iteratively.\n\n**Complexity:**\n- **Time:** O(N^2 * log(MAX)), where N is the length of the array, and log(MAX) is the time to compute the GCD.\n- **Space:** O(1), as we only use a few variables for tracking state.",
    referenceSolution: {
      JAVASCRIPT: "function gcd(a, b) {\n    while (b) {\n        let temp = b;\n        b = a % b;\n        a = temp;\n    }\n    return a;\n}\n\nfunction lcm(a, b) {\n    return Math.floor(a / gcd(a, b)) * b;\n}\n\nfunction solve(a) {\n    let maxLen = 0;\n    let n = a.length;\n    for (let i = 0; i < n; i++) {\n        let p = 1, g = a[i], l = a[i];\n        for (let j = i; j < n; j++) {\n            p *= a[j];\n            if (p > 1000000000000000) break;\n            g = gcd(g, a[j]);\n            l = lcm(l, a[j]);\n            if (p === g * l) {\n                maxLen = Math.max(maxLen, j - i + 1);\n            }\n        }\n    }\n    return maxLen;\n}",
      TYPESCRIPT: "function gcd(a: number, b: number): number {\n    while (b) {\n        let temp = b;\n        b = a % b;\n        a = temp;\n    }\n    return a;\n}\n\nfunction lcm(a: number, b: number): number {\n    return Math.floor(a / gcd(a, b)) * b;\n}\n\nfunction solve(a: number[]): number {\n    let maxLen = 0;\n    let n = a.length;\n    for (let i = 0; i < n; i++) {\n        let p = 1, g = a[i], l = a[i];\n        for (let j = i; j < n; j++) {\n            p *= a[j];\n            if (p > 1000000000000000) break;\n            g = gcd(g, a[j]);\n            l = lcm(l, a[j]);\n            if (p === g * l) {\n                maxLen = Math.max(maxLen, j - i + 1);\n            }\n        }\n    }\n    return maxLen;\n}",
      PYTHON: "def gcd(a, b):\n    while b:\n        a, b = b, a % b\n    return a\n\ndef lcm(a, b):\n    return (a // gcd(a, b)) * b\n\ndef solve(a):\n    max_len = 0\n    n = len(a)\n    for i in range(n):\n        p = 1\n        g = a[i]\n        l = a[i]\n        for j in range(i, n):\n            p *= a[j]\n            if p > 10**15: break\n            g = gcd(g, a[j])\n            l = lcm(l, a[j])\n            if p == g * l:\n                max_len = max(max_len, j - i + 1)\n    return max_len",
      JAVA: "    static long gcd(long a, long b) {\n        while (b != 0) {\n            long temp = b;\n            b = a % b;\n            a = temp;\n        }\n        return a;\n    }\n    static long lcm(long a, long b) {\n        return (a / gcd(a, b)) * b;\n    }\n    static int solve(int[] a) {\n        int maxLen = 0;\n        int n = a.length;\n        for (int i = 0; i < n; i++) {\n            long p = 1, g = a[i], l = a[i];\n            for (int j = i; j < n; j++) {\n                p *= a[j];\n                if (p > 1000000000000000L) break;\n                g = gcd(g, a[j]);\n                l = lcm(l, a[j]);\n                if (p == g * l) {\n                    maxLen = Math.max(maxLen, j - i + 1);\n                }\n            }\n        }\n        return maxLen;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nlong long get_gcd(long long a, long long b) {\n    while (b) {\n        a %= b;\n        swap(a, b);\n    }\n    return a;\n}\n\nlong long get_lcm(long long a, long long b) {\n    return (a / get_gcd(a, b)) * b;\n}\n\nint solve(vector<int> a) {\n    int max_len = 0;\n    int n = a.size();\n    for (int i = 0; i < n; i++) {\n        long long p = 1, g = a[i], l = a[i];\n        for (int j = i; j < n; j++) {\n            p *= a[j];\n            if (p > 1000000000000000LL) break;\n            g = get_gcd(g, (long long)a[j]);\n            l = get_lcm(l, (long long)a[j]);\n            if (p == g * l) {\n                max_len = max(max_len, j - i + 1);\n            }\n        }\n    }\n    return max_len;\n}",
      GO: "func solve(a []int) int {\n    maxLen := 0\n    n := len(a)\n    for i := 0; i < n; i++ {\n        p := int64(1)\n        g := int64(a[i])\n        l := int64(a[i])\n        for j := i; j < n; j++ {\n            p *= int64(a[j])\n            if p > 1000000000000000 {\n                break\n            }\n            g = gcd(g, int64(a[j]))\n            l = (l / gcd(l, int64(a[j]))) * int64(a[j])\n            if p == g*l {\n                if j-i+1 > maxLen {\n                    maxLen = j - i + 1\n                }\n            }\n        }\n    }\n    return maxLen\n}\n\nfunc gcd(a, b int64) int64 {\n    for b != 0 {\n        a, b = b, a%b\n    }\n    return a\n}",
    },
    tests: [
      { stdin: "1 2 3", expectedStdout: "3", isSample: true },
      { stdin: "2 4 8", expectedStdout: "2", isSample: true },
      { stdin: "5", expectedStdout: "0" },
      { stdin: "1 1 1", expectedStdout: "3" },
      { stdin: "7 3 2 5", expectedStdout: "4" },
      { stdin: "3 1 5 7 2", expectedStdout: "5" },
      { stdin: "10", expectedStdout: "0" },
      { stdin: "1 10 2", expectedStdout: "2" },
    ],
  }),

  p({
    ...base,
    slug: "maximum-uncontaminated-sample",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "SLIDING_WINDOW",
    title: "Most Valuable Diverse Collection",
    patternTags: ["arrays","sliding-window","hash-set","subarray"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 750,
    promptMarkdown: "You are an art collector visiting a sequence of galleries, where each gallery offers a single painting. The paintings are represented by an array of integers `values`, where each integer denotes the aesthetic worth of the painting.\n\nA **diverse collection** is formed by purchasing paintings from a contiguous sequence of galleries such that no two paintings share the same aesthetic worth. Your goal is to acquire the most valuable collection possible. The total value of a collection is simply the sum of the aesthetic worth of its paintings.\n\nReturn the maximum total value of any diverse collection you can acquire.\n\n**Constraints**\n- `1 <= values.length <= 1000`\n- `1 <= values[i] <= 1000`\n\n**Example 1**\n```\ninput:\n4 2 4 5 6\noutput:\n17\n```\n*Explanation: The diverse collections include [4, 2], [2, 4, 5, 6], and others. The collection [2, 4, 5, 6] has the maximum sum of 17.*\n\n**Example 2**\n```\ninput:\n1 2 3 1 2 3\noutput:\n6\n```\n*Explanation: The diverse collections with the maximum sum are [1, 2, 3] and [2, 3, 1] and [3, 1, 2]. They all sum to 6.*\n\n**Example 3**\n```\ninput:\n10 10 10\noutput:\n10\n```\n*Explanation: The only diverse collections are single elements [10], so the maximum sum is 10.*\n\n**Follow-up**\nCan you optimize this to run in O(N) time using a sliding window?",
    editorialMarkdown: "## Maximum Uncontaminated Sample Sum\n\nWe want to find a contiguous block (subarray) of sensor readings that are entirely distinct from one another, such that the sum of these readings is as large as possible.\n\nThis implies using a sliding window technique. We maintain a window `[left, right]` and a hash set of the numbers currently inside the window. As we expand the window by moving `right`, if we encounter a duplicate reading, we continuously remove elements from the `left` until the duplicate is eliminated. We keep a running sum of the window and track the maximum sum observed.\n\n**Trap**: A common inefficiency is recalculating the sum of the window from scratch or scanning for duplicates linearly. Maintaining a running sum and a hash set guarantees O(N) execution.\n\n**Complexity:**\n- **Time:** O(N), as each element is added and removed from the set at most once.\n- **Space:** O(N), for the hash set storing elements in the window.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let maxSum = 0, currentSum = 0;\n    let left = 0;\n    let window = new Set();\n\n    for (let right = 0; right < a.length; right++) {\n        while (window.has(a[right])) {\n            window.delete(a[left]);\n            currentSum -= a[left];\n            left++;\n        }\n        window.add(a[right]);\n        currentSum += a[right];\n        maxSum = Math.max(maxSum, currentSum);\n    }\n    return maxSum;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    let maxSum = 0, currentSum = 0;\n    let left = 0;\n    let window = new Set<number>();\n\n    for (let right = 0; right < a.length; right++) {\n        while (window.has(a[right])) {\n            window.delete(a[left]);\n            currentSum -= a[left];\n            left++;\n        }\n        window.add(a[right]);\n        currentSum += a[right];\n        maxSum = Math.max(maxSum, currentSum);\n    }\n    return maxSum;\n}",
      PYTHON: "def solve(a):\n    max_sum = 0\n    current_sum = 0\n    left = 0\n    window = set()\n\n    for right in range(len(a)):\n        while a[right] in window:\n            window.remove(a[left])\n            current_sum -= a[left]\n            left += 1\n        window.add(a[right])\n        current_sum += a[right]\n        max_sum = max(max_sum, current_sum)\n    return max_sum",
      JAVA: "    static int solve(int[] a) {\n        int maxSum = 0;\n        int currentSum = 0;\n        int left = 0;\n        java.util.HashSet<Integer> window = new java.util.HashSet<>();\n\n        for (int right = 0; right < a.length; right++) {\n            while (window.contains(a[right])) {\n                window.remove(a[left]);\n                currentSum -= a[left];\n                left++;\n            }\n            window.add(a[right]);\n            currentSum += a[right];\n            maxSum = Math.max(maxSum, currentSum);\n        }\n        return maxSum;\n    }",
      CPP: "#include <vector>\n#include <unordered_set>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(vector<int> a) {\n    int max_sum = 0, current_sum = 0;\n    int left = 0;\n    unordered_set<int> window;\n\n    for (int right = 0; right < a.size(); right++) {\n        while (window.count(a[right])) {\n            window.erase(a[left]);\n            current_sum -= a[left];\n            left++;\n        }\n        window.insert(a[right]);\n        current_sum += a[right];\n        max_sum = max(max_sum, current_sum);\n    }\n    return max_sum;\n}",
      GO: "func solve(a []int) int {\n    maxSum := 0\n    currentSum := 0\n    left := 0\n    window := make(map[int]bool)\n\n    for right := 0; right < len(a); right++ {\n        for window[a[right]] {\n            delete(window, a[left])\n            currentSum -= a[left]\n            left++\n        }\n        window[a[right]] = true\n        currentSum += a[right]\n        if currentSum > maxSum {\n            maxSum = currentSum\n        }\n    }\n    return maxSum\n}",
    },
    tests: [
      { stdin: "4 2 4 5 6", expectedStdout: "17", isSample: true },
      { stdin: "1 2 3 1 2 3", expectedStdout: "6", isSample: true },
      { stdin: "10 10 10", expectedStdout: "10" },
      { stdin: "1 2 3 4 5 6", expectedStdout: "21" },
      { stdin: "8", expectedStdout: "8" },
      { stdin: "", expectedStdout: "0" },
      { stdin: "10 5 5 10 10 20", expectedStdout: "30" },
      { stdin: "2 3 4 5 1 2 3 4 5", expectedStdout: "15" },
    ],
  }),
];
