import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w2-060` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W2_060_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "distinct-device-models",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Distinct Device Models",
    patternTags: ["arrays","hash-set","counting"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing network logs for a smart home system. Every time a device connects to the network, its integer device model ID is recorded in an array.\n\nGiven an array of integers `log`, return the number of **distinct** device model IDs that connected to the network.\n\n**Constraints**\n- `0 <= log.length <= 100`\n- `1 <= log[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 2 1 3\noutput:\n3\n```\n*Explanation: The distinct device model IDs are 1, 2, and 3.*\n\n**Example 2**\n```\ninput:\n5 5 5 5\noutput:\n1\n```\n*Explanation: There is only one distinct device model ID, which is 5.*\n\n**Example 3**\n```\ninput:\n\noutput:\n0\n```\n*Explanation: The log is empty, so there are 0 distinct device models.*\n\n**Follow-up**\nCan you achieve this in O(N) time complexity?",
    editorialMarkdown: "## Distinct Device Models\n\nThis problem simply asks us to count the number of unique integer values in a given list.\n\nA straightforward approach is to insert all elements of the input array into a hash set. A hash set inherently filters out duplicates, so its final size corresponds to the number of distinct device models in the log.\n\n**Trap**: Iterating through the array and using a linear search (e.g., checking if an element is already in a new list) takes O(N^2) time. Using a hash set brings this down to O(N).\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the list, since inserting into a hash set is O(1) on average.\n- **Space:** O(N) to store the distinct elements in the hash set.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    return new Set(a).size;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    return new Set(a).size;\n}",
      PYTHON: "def solve(a):\n    return len(set(a))",
      JAVA: "    static int solve(int[] a) {\n        java.util.HashSet<Integer> set = new java.util.HashSet<>();\n        for (int x : a) set.add(x);\n        return set.size();\n    }",
      CPP: "#include <vector>\n#include <unordered_set>\n\nusing namespace std;\n\nint solve(vector<int> a) {\n    unordered_set<int> s(a.begin(), a.end());\n    return s.size();\n}",
      GO: "func solve(a []int) int {\n    m := make(map[int]bool)\n    for _, x := range a {\n        m[x] = true\n    }\n    return len(m)\n}",
    },
    tests: [
      { stdin: "1 2 2 1 3", expectedStdout: "3", isSample: true },
      { stdin: "5 5 5 5", expectedStdout: "1", isSample: true },
      { stdin: "", expectedStdout: "0" },
      { stdin: "42", expectedStdout: "1" },
      { stdin: "10 20 30 40 50", expectedStdout: "5" },
      { stdin: "100 100 200 100 200", expectedStdout: "2" },
      { stdin: "1 2 3 4 1 2 3 4", expectedStdout: "4" },
      { stdin: "1 2 3 4 5 6 7 8 9 10 10 9 8 7 6 5 4 3 2 1", expectedStdout: "10" },
    ],
  }),

  p({
    ...base,
    slug: "maximize-loaded-crates",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GREEDY",
    title: "Maximize Loaded Crates",
    patternTags: ["greedy","sorting","arrays"],
    signatureId: "fn:ints,int->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are tasked with loading a cargo transport ship. You are given an array of integers `weights`, where `weights[i]` represents the weight of the `i`-th crate, and an integer `capacity` representing the maximum total weight the ship can carry.\n\nYour goal is to load as many crates as possible onto the ship. You can choose any combination of crates, as long as their combined weight does not exceed `capacity`.\n\nReturn the maximum number of crates you can load.\n\n**Constraints**\n- `1 <= weights.length <= 1000`\n- `1 <= weights[i] <= 1000`\n- `1 <= capacity <= 100000`\n\n**Example 1**\n```\ninput:\n4 2 1 3\n6\noutput:\n3\n```\n*Explanation: We can pick the crates with weights 1, 2, and 3. Their total weight is 6, which exactly matches the capacity. We picked 3 crates.*\n\n**Example 2**\n```\ninput:\n5 10 15\n4\noutput:\n0\n```\n*Explanation: The lightest crate weighs 5, which is heavier than our capacity of 4. We cannot load any crates.*\n\n**Example 3**\n```\ninput:\n1 1 1 1 1\n10\noutput:\n5\n```\n*Explanation: We can comfortably load all 5 crates.*\n\n**Follow-up**\nWhat is the time complexity of your sorting algorithm?",
    editorialMarkdown: "## Maximize Loaded Crates\n\nThis problem asks for the maximum number of items from a list we can pick such that their sum does not exceed a given capacity. Note that we are looking for a subsequence, which means we can pick elements from anywhere in the array.\n\nA greedy approach is optimal here. To maximize the *count* of crates, we should always pick the lightest crates first. We can achieve this by sorting the array of weights in ascending order. Then, we iterate through the sorted weights, adding them to our total weight one by one until the capacity is reached.\n\n**Trap**: Trying to find all subsets or using complex dynamic programming (like the Knapsack problem) is overkill and will likely TLE. This is much simpler because we only care about the *number* of items, not their distinct values.\n\n**Complexity:**\n- **Time:** O(N log N) or O(N^2) for sorting the array, plus O(N) to sum them up. Given N <= 1000, any sort works.\n- **Space:** O(1) auxiliary space beyond the sorted array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a, b) {\n    for (let i = 0; i < a.length; i++) {\n        for (let j = i + 1; j < a.length; j++) {\n            if (a[i] > a[j]) {\n                let temp = a[i];\n                a[i] = a[j];\n                a[j] = temp;\n            }\n        }\n    }\n    let count = 0, sum = 0;\n    for (let x of a) {\n        if (sum + x <= b) {\n            sum += x;\n            count++;\n        } else {\n            break;\n        }\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(a: number[], b: number): number {\n    for (let i = 0; i < a.length; i++) {\n        for (let j = i + 1; j < a.length; j++) {\n            if (a[i] > a[j]) {\n                let temp = a[i];\n                a[i] = a[j];\n                a[j] = temp;\n            }\n        }\n    }\n    let count = 0, sum = 0;\n    for (let x of a) {\n        if (sum + x <= b) {\n            sum += x;\n            count++;\n        } else {\n            break;\n        }\n    }\n    return count;\n}",
      PYTHON: "def solve(a, b):\n    a = sorted(a)\n    count = 0\n    s = 0\n    for x in a:\n        if s + x <= b:\n            s += x\n            count += 1\n        else:\n            break\n    return count",
      JAVA: "    static int solve(int[] a, int b) {\n        for (int i = 0; i < a.length; i++) {\n            for (int j = i + 1; j < a.length; j++) {\n                if (a[i] > a[j]) {\n                    int temp = a[i];\n                    a[i] = a[j];\n                    a[j] = temp;\n                }\n            }\n        }\n        int count = 0, sum = 0;\n        for (int x : a) {\n            if (sum + x <= b) {\n                sum += x;\n                count++;\n            } else {\n                break;\n            }\n        }\n        return count;\n    }",
      CPP: "#include <vector>\n\nusing namespace std;\n\nint solve(vector<int> a, int b) {\n    for (int i = 0; i < a.size(); i++) {\n        for (int j = i + 1; j < a.size(); j++) {\n            if (a[i] > a[j]) {\n                int temp = a[i];\n                a[i] = a[j];\n                a[j] = temp;\n            }\n        }\n    }\n    int count = 0, sum = 0;\n    for (int x : a) {\n        if (sum + x <= b) {\n            sum += x;\n            count++;\n        } else {\n            break;\n        }\n    }\n    return count;\n}",
      GO: "func solve(a []int, b int) int {\n    n := len(a)\n    for i := 0; i < n; i++ {\n        for j := i + 1; j < n; j++ {\n            if a[i] > a[j] {\n                a[i], a[j] = a[j], a[i]\n            }\n        }\n    }\n    count := 0\n    sum := 0\n    for _, x := range a {\n        if sum + x <= b {\n            sum += x\n            count++\n        } else {\n            break\n        }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "4 2 1 3\n6", expectedStdout: "3", isSample: true },
      { stdin: "5 10 15\n4", expectedStdout: "0", isSample: true },
      { stdin: "1 1 1 1 1\n10", expectedStdout: "5" },
      { stdin: "100\n100", expectedStdout: "1" },
      { stdin: "1 2 3 4 5 6\n10", expectedStdout: "4" },
      { stdin: "20 30 40\n10", expectedStdout: "0" },
      { stdin: "10 10 10\n30", expectedStdout: "3" },
      { stdin: "1 2 3 4 5 6 7 8\n100", expectedStdout: "8" },
    ],
  }),

  p({
    ...base,
    slug: "altitude-trend-analysis",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Altitude Trend Analysis",
    patternTags: ["arrays","simulation","brute-force"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are monitoring the altitude of a research balloon. You receive an array of integer readings, `altitudes`.\n\nYou want to find the longest period during which the balloon was consistently moving in one direction—either **strictly climbing** (each reading is strictly greater than the last) or **strictly diving** (each reading is strictly less than the last).\n\nReturn the maximum length of a strictly climbing or strictly diving contiguous subsegment of `altitudes`.\n\n**Constraints**\n- `1 <= altitudes.length <= 100`\n- `1 <= altitudes[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 4 3 3 2\noutput:\n2\n```\n*Explanation: The longest strictly climbing subsegment is [1, 4] with length 2. The longest strictly diving subsegments are [4, 3] and [3, 2], both with length 2.*\n\n**Example 2**\n```\ninput:\n3 3 3\noutput:\n1\n```\n*Explanation: There is no strictly climbing or diving sequence of length greater than 1.*\n\n**Example 3**\n```\ninput:\n5 6 7 8 9\noutput:\n5\n```\n*Explanation: The entire sequence is strictly climbing, so the length is 5.*\n\n**Follow-up**\nCan you compute this in a single pass over the array?",
    editorialMarkdown: "## Altitude Trend Analysis\n\nThis problem asks us to find the length of the longest subarray that is either strictly climbing (every element is greater than the previous) or strictly diving (every element is less than the previous).\n\nSince the length of the array is small, a simple O(N^2) or O(N^3) brute-force approach is perfectly acceptable. We iterate over all possible subarrays, and for each one, we check if it is purely increasing or purely decreasing. If it is, we compare its length to our maximum found so far. Note that a single element is technically both increasing and decreasing and has a length of 1.\n\n**Trap**: Forgetting that an array with entirely identical elements (like `[3, 3, 3]`) has a longest strictly increasing/decreasing subarray length of 1, not 3.\n\n**Complexity:**\n- **Time:** O(N^3) for the naive check of all subarrays, but easily reducible to O(N).\n- **Space:** O(1) auxiliary space.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    if (a.length === 0) return 0;\n    let ans = 1;\n    for (let i = 0; i < a.length; i++) {\n        for (let j = i + 1; j < a.length; j++) {\n            let inc = true, dec = true;\n            for (let k = i; k < j; k++) {\n                if (a[k+1] <= a[k]) inc = false;\n                if (a[k+1] >= a[k]) dec = false;\n            }\n            if (inc || dec) {\n                ans = Math.max(ans, j - i + 1);\n            }\n        }\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    if (a.length === 0) return 0;\n    let ans = 1;\n    for (let i = 0; i < a.length; i++) {\n        for (let j = i + 1; j < a.length; j++) {\n            let inc = true, dec = true;\n            for (let k = i; k < j; k++) {\n                if (a[k+1] <= a[k]) inc = false;\n                if (a[k+1] >= a[k]) dec = false;\n            }\n            if (inc || dec) {\n                ans = Math.max(ans, j - i + 1);\n            }\n        }\n    }\n    return ans;\n}",
      PYTHON: "def solve(a):\n    if not a: return 0\n    ans = 1\n    for i in range(len(a)):\n        for j in range(i + 1, len(a)):\n            inc = True\n            dec = True\n            for k in range(i, j):\n                if a[k+1] <= a[k]: inc = False\n                if a[k+1] >= a[k]: dec = False\n            if inc or dec:\n                ans = max(ans, j - i + 1)\n    return ans",
      JAVA: "    static int solve(int[] a) {\n        if (a.length == 0) return 0;\n        int ans = 1;\n        for (int i = 0; i < a.length; i++) {\n            for (int j = i + 1; j < a.length; j++) {\n                boolean inc = true, dec = true;\n                for (int k = i; k < j; k++) {\n                    if (a[k+1] <= a[k]) inc = false;\n                    if (a[k+1] >= a[k]) dec = false;\n                }\n                if (inc || dec) {\n                    ans = Math.max(ans, j - i + 1);\n                }\n            }\n        }\n        return ans;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(vector<int> a) {\n    if (a.empty()) return 0;\n    int ans = 1;\n    for (int i = 0; i < a.size(); i++) {\n        for (int j = i + 1; j < a.size(); j++) {\n            bool inc = true, dec = true;\n            for (int k = i; k < j; k++) {\n                if (a[k+1] <= a[k]) inc = false;\n                if (a[k+1] >= a[k]) dec = false;\n            }\n            if (inc || dec) {\n                ans = max(ans, j - i + 1);\n            }\n        }\n    }\n    return ans;\n}",
      GO: "func solve(a []int) int {\n    if len(a) == 0 { return 0 }\n    ans := 1\n    for i := 0; i < len(a); i++ {\n        for j := i + 1; j < len(a); j++ {\n            inc, dec := true, true\n            for k := i; k < j; k++ {\n                if a[k+1] <= a[k] { inc = false }\n                if a[k+1] >= a[k] { dec = false }\n            }\n            if inc || dec {\n                if j - i + 1 > ans { ans = j - i + 1 }\n            }\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "1 4 3 3 2", expectedStdout: "2", isSample: true },
      { stdin: "3 3 3", expectedStdout: "1", isSample: true },
      { stdin: "5 6 7 8 9", expectedStdout: "5" },
      { stdin: "10", expectedStdout: "1" },
      { stdin: "10 9 8 7 6 5", expectedStdout: "6" },
      { stdin: "1 2 3 4 3 2 1", expectedStdout: "4" },
      { stdin: "5 4 3 2 3 4 5 6", expectedStdout: "5" },
      { stdin: "5 5 6 6 7 7 8 8", expectedStdout: "2" },
    ],
  }),
];
