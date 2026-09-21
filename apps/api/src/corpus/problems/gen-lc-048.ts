import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-048` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_048_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "most-frequent-signal-digit",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Most Frequent Signal Digit",
    patternTags: ["strings","counting","frequency"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 600,
    promptMarkdown: "An astronaut scans a transmission `signal` consisting purely of numeric digits. They need to find the most frequent digit to calibrate their receiver.\n\nGiven a string `signal`, return the most frequent digit (as an integer). If there is a tie between multiple digits, return the largest one.\n\n**Constraints**\n- `1 <= signal.length <= 100`\n- `signal` contains only digits from `'0'` to `'9'`.\n\n**Example 1**\n```\ninput:\n31233\noutput: 3\n```\n*Explanation: The digit 3 appears three times, which is more frequent than 1 and 2.*\n\n**Example 2**\n```\ninput:\n5577\noutput: 7\n```\n*Explanation: Both 5 and 7 appear twice. 7 is the larger digit.*\n\n**Example 3**\n```\ninput:\n9\noutput: 9\n```\n*Explanation: The only digit is 9.*\n\n**Follow-up**\nCan you do this using an array of size 10 instead of a hash map?",
    editorialMarkdown: "## Most Frequent Signal Digit\nTo find the most frequent digit in the transmission string, we can use a hash map or a frequency array to count the occurrences of each character. After counting, we iterate over the unique digits to find the one with the maximum count. If there's a tie in the frequency count, we keep track of the maximum digit value.\n\n**Trap**: Make sure to parse the character back into an integer when comparing for the tie-break, so that you correctly find the largest digit numerically (or correctly use ASCII values).\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the string, since we make a single pass to count and a fixed number of comparisons (at most 10) to find the maximum.\n- **Space Complexity:** mathcal{O}(1) because there are at most 10 unique digits, meaning the frequency map size is bounded by a constant.",
    referenceSolution: {
      JAVASCRIPT: "function solve(signal) {\n    const counts = Array(10).fill(0);\n    for (let i = 0; i < signal.length; i++) {\n        counts[signal.charCodeAt(i) - 48]++;\n    }\n    let maxCount = -1;\n    let maxDigit = -1;\n    for (let i = 0; i < 10; i++) {\n        if (counts[i] >= maxCount) {\n            if (counts[i] > maxCount) {\n                maxCount = counts[i];\n                maxDigit = i;\n            } else if (counts[i] == maxCount && i > maxDigit) {\n                maxDigit = i;\n            }\n        }\n    }\n    return maxDigit;\n}",
      TYPESCRIPT: "function solve(signal: string): number {\n    const counts = Array(10).fill(0);\n    for (let i = 0; i < signal.length; i++) {\n        counts[signal.charCodeAt(i) - 48]++;\n    }\n    let maxCount = -1;\n    let maxDigit = -1;\n    for (let i = 0; i < 10; i++) {\n        if (counts[i] >= maxCount) {\n            if (counts[i] > maxCount) {\n                maxCount = counts[i];\n                maxDigit = i;\n            } else if (counts[i] == maxCount && i > maxDigit) {\n                maxDigit = i;\n            }\n        }\n    }\n    return maxDigit;\n}",
      PYTHON: "def solve(signal):\n    counts = [0] * 10\n    for c in signal:\n        counts[int(c)] += 1\n    max_count = -1\n    max_digit = -1\n    for i in range(10):\n        if counts[i] >= max_count:\n            if counts[i] > max_count:\n                max_count = counts[i]\n                max_digit = i\n            elif counts[i] == max_count and i > max_digit:\n                max_digit = i\n    return max_digit",
      JAVA: "    static int solve(String signal) {\n        int[] counts = new int[10];\n        for (int i = 0; i < signal.length(); i++) {\n            counts[signal.charAt(i) - '0']++;\n        }\n        int maxCount = -1;\n        int maxDigit = -1;\n        for (int i = 0; i < 10; i++) {\n            if (counts[i] >= maxCount) {\n                if (counts[i] > maxCount) {\n                    maxCount = counts[i];\n                    maxDigit = i;\n                } else if (counts[i] == maxCount && i > maxDigit) {\n                    maxDigit = i;\n                }\n            }\n        }\n        return maxDigit;\n    }",
      CPP: "#include <string>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(string signal) {\n    vector<int> counts(10, 0);\n    for (char c : signal) {\n        counts[c - '0']++;\n    }\n    int maxCount = -1;\n    int maxDigit = -1;\n    for (int i = 0; i < 10; i++) {\n        if (counts[i] >= maxCount) {\n            if (counts[i] > maxCount) {\n                maxCount = counts[i];\n                maxDigit = i;\n            } else if (counts[i] == maxCount && i > maxDigit) {\n                maxDigit = i;\n            }\n        }\n    }\n    return maxDigit;\n}",
      GO: "func solve(signal string) int {\n    counts := make([]int, 10)\n    for i := 0; i < len(signal); i++ {\n        counts[signal[i]-'0']++\n    }\n    maxCount := -1\n    maxDigit := -1\n    for i := 0; i < 10; i++ {\n        if counts[i] >= maxCount {\n            if counts[i] > maxCount {\n                maxCount = counts[i]\n                maxDigit = i\n            } else if counts[i] == maxCount && i > maxDigit {\n                maxDigit = i\n            }\n        }\n    }\n    return maxDigit\n}",
    },
    tests: [
      { stdin: "31233", expectedStdout: "3", isSample: true },
      { stdin: "5577", expectedStdout: "7", isSample: true },
      { stdin: "9", expectedStdout: "9" },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "123456788", expectedStdout: "8" },
      { stdin: "2222222222222222222222222222222222222222", expectedStdout: "2" },
      { stdin: "0123456789", expectedStdout: "9" },
      { stdin: "505050505050", expectedStdout: "5" },
    ],
  }),

  p({
    ...base,
    slug: "top-three-data-logs",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Top Three Data Logs",
    patternTags: ["matrix","array"],
    signatureId: "fn:matrix->matrix",
    avgSolveSeconds: 300,
    promptMarkdown: "You are analyzing a data log from a spaceship. The log is represented as a 2D matrix of integers, where each row represents an event.\n\nTo quickly assess the system, you only need to look at the first 3 events.\n\nGiven a 2D array `log_data`, return a new 2D array containing only the first 3 rows. If the input matrix contains fewer than 3 rows, return all of the available rows.\n\n**Constraints**\n- `0 <= log_data.length <= 100`\n- `0 <= log_data[i].length <= 50`\n- `-1000 <= log_data[i][j] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 3;4 5 6;7 8 9;10 11 12\noutput: 1 2 3;4 5 6;7 8 9\n```\n*Explanation: We extract the first 3 events from the log.*\n\n**Example 2**\n```\ninput:\n99;88\noutput: 99;88\n```\n*Explanation: The log only contains 2 events, so we return all of them.*\n\n**Example 3**\n```\ninput:\n\noutput: \n```\n*Explanation: The log is empty, so we return an empty log.*\n\n**Follow-up**\nCan you write it using your language's built-in slice or subarray method?",
    editorialMarkdown: "## Top Three Data Logs\nThe problem simply asks us to return the first up to 3 rows of the provided 2D array. In most languages, this can be done using a slice operation or a simple loop that appends rows to a new list until 3 rows are collected or the original list is exhausted.\n\n**Trap**: Make sure to handle the case where the input matrix has fewer than 3 rows. Trying to access row index 2 unconditionally might throw an out-of-bounds error.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the number of elements in the first 3 rows, since we might need to copy them.\n- **Space Complexity:** mathcal{O}(N) where N is the size of the returned matrix.",
    referenceSolution: {
      JAVASCRIPT: "function solve(log_data) {\n    return log_data.slice(0, 3);\n}",
      TYPESCRIPT: "function solve(log_data: number[][]): number[][] {\n    return log_data.slice(0, 3);\n}",
      PYTHON: "def solve(log_data):\n    return log_data[:3]",
      JAVA: "    static int[][] solve(int[][] log_data) {\n        int rows = Math.min(log_data.length, 3);\n        int[][] res = new int[rows][];\n        for (int i = 0; i < rows; i++) {\n            res[i] = log_data[i];\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nvector<vector<int>> solve(vector<vector<int>> log_data) {\n    int rows = min((int)log_data.size(), 3);\n    vector<vector<int>> res;\n    for (int i = 0; i < rows; i++) {\n        res.push_back(log_data[i]);\n    }\n    return res;\n}",
      GO: "func solve(log_data [][]int) [][]int {\n    rows := len(log_data)\n    if rows > 3 {\n        rows = 3\n    }\n    res := make([][]int, rows)\n    for i := 0; i < rows; i++ {\n        res[i] = log_data[i]\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 3;4 5 6;7 8 9;10 11 12", expectedStdout: "1 2 3;4 5 6;7 8 9", isSample: true },
      { stdin: "99;88", expectedStdout: "99;88", isSample: true },
      { stdin: "", expectedStdout: "", isSample: true },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "1;2;3;4;5;6;7;8;9;10", expectedStdout: "1;2;3" },
      { stdin: "-1 -2;-3 -4;-5 -6;-7 -8", expectedStdout: "-1 -2;-3 -4;-5 -6" },
      { stdin: "10 20 30", expectedStdout: "10 20 30" },
      { stdin: "0 0;0 0;0 0", expectedStdout: "0 0;0 0;0 0" },
    ],
  }),

  p({
    ...base,
    slug: "shortest-delivery-route",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Minimum Ring Latency",
    patternTags: ["array","circular","prefix-sum"],
    signatureId: "fn:ints,int->int",
    avgSolveSeconds: 600,
    promptMarkdown: "A fiber-optic network is laid out in a ring topology connecting a series of data centers. You are given an integer array `distances` where `distances[i]` represents the latency (in milliseconds) of the link between data center `i` and data center `(i + 1) % n`.\n\nA signal originates at data center `0` and must be transmitted to a `target` data center. The signal can travel in either direction around the ring.\n\nReturn the minimum latency required to transmit the signal from data center `0` to the `target` data center.\n\n**Constraints**\n- `1 <= distances.length <= 10^4`\n- `0 <= distances[i] <= 10^4`\n- `0 <= target < distances.length`\n\n**Example 1**\n```\ninput:\n1 2 3 4\n1\noutput: 1\n```\n*Explanation: Routing the signal forward to data center 1 takes 1 ms latency. Routing it backward takes 4 + 3 + 2 = 9 ms latency. The minimum is 1.*\n\n**Example 2**\n```\ninput:\n1 2 3 4\n3\noutput: 4\n```\n*Explanation: Routing the signal forward to data center 3 takes 1 + 2 + 3 = 6 ms latency. Routing it backward (from 0 to 3 directly) takes 4 ms. The minimum is 4.*\n\n**Example 3**\n```\ninput:\n7 10 1 12 11 14 5 0\n7\noutput: 0\n```\n*Explanation: Routing the signal backward from 0 to 7 takes 0 ms latency. The minimum is 0.*\n\n**Follow-up**\nCan you accomplish this with a single pass over the array?",
    editorialMarkdown: "## Shortest Delivery Route\nThe problem asks us to find the shortest distance from sector 0 to a target sector on a circular path. We can travel either clockwise or counter-clockwise.\n\nThe distance travelling clockwise is simply the sum of distances from sector 0 to `target - 1`.\nThe distance travelling counter-clockwise is the total sum of all distances minus the clockwise distance.\nWe then return the minimum of these two values.\n\n**Trap**: A common pitfall is to forget that you can also travel backwards.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) to sum up the array elements.\n- **Space Complexity:** mathcal{O}(1) as we only need to keep track of running totals.",
    referenceSolution: {
      JAVASCRIPT: "function solve(distances, target) {\n    let total = 0;\n    let clockwise = 0;\n    for (let i = 0; i < distances.length; i++) {\n        total += distances[i];\n        if (i < target) {\n            clockwise += distances[i];\n        }\n    }\n    let counter_clockwise = total - clockwise;\n    return Math.min(clockwise, counter_clockwise);\n}",
      TYPESCRIPT: "function solve(distances: number[], target: number): number {\n    let total = 0;\n    let clockwise = 0;\n    for (let i = 0; i < distances.length; i++) {\n        total += distances[i];\n        if (i < target) {\n            clockwise += distances[i];\n        }\n    }\n    let counter_clockwise = total - clockwise;\n    return Math.min(clockwise, counter_clockwise);\n}",
      PYTHON: "def solve(distances, target):\n    clockwise = sum(distances[:target])\n    total = sum(distances)\n    counter_clockwise = total - clockwise\n    return min(clockwise, counter_clockwise)",
      JAVA: "    static int solve(int[] distances, int target) {\n        int total = 0;\n        int clockwise = 0;\n        for (int i = 0; i < distances.length; i++) {\n            total += distances[i];\n            if (i < target) {\n                clockwise += distances[i];\n            }\n        }\n        int counter_clockwise = total - clockwise;\n        return Math.min(clockwise, counter_clockwise);\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n#include <numeric>\n\nusing namespace std;\n\nint solve(vector<int> distances, int target) {\n    int total = 0;\n    int clockwise = 0;\n    for (int i = 0; i < distances.size(); i++) {\n        total += distances[i];\n        if (i < target) {\n            clockwise += distances[i];\n        }\n    }\n    int counter_clockwise = total - clockwise;\n    return min(clockwise, counter_clockwise);\n}",
      GO: "func solve(distances []int, target int) int {\n    total := 0\n    clockwise := 0\n    for i := 0; i < len(distances); i++ {\n        total += distances[i]\n        if i < target {\n            clockwise += distances[i]\n        }\n    }\n    counter_clockwise := total - clockwise\n    if clockwise < counter_clockwise {\n        return clockwise\n    }\n    return counter_clockwise\n}",
    },
    tests: [
      { stdin: "1 2 3 4\n1", expectedStdout: "1", isSample: true },
      { stdin: "1 2 3 4\n3", expectedStdout: "4", isSample: true },
      { stdin: "7 10 1 12 11 14 5 0\n7", expectedStdout: "0", isSample: true },
      { stdin: "1 2 3 4\n0", expectedStdout: "0" },
      { stdin: "5\n0", expectedStdout: "0" },
      { stdin: "2 2 2 2 2\n2", expectedStdout: "4" },
      { stdin: "0 0 0 0\n2", expectedStdout: "0" },
      { stdin: "6 6\n1", expectedStdout: "6" },
    ],
  }),

  p({
    ...base,
    slug: "shield-energy-distribution",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Rare Fertilizer Distribution",
    patternTags: ["math","combinatorics","counting"],
    signatureId: "fn:int,int->int",
    avgSolveSeconds: 900,
    promptMarkdown: "You have `n` units of a rare fertilizer that you want to divide among 3 experimental botanical gardens. However, to prevent soil toxicity, no single garden can receive more than `limit` units of fertilizer.\n\nReturn the total number of valid ways you can distribute the fertilizer among the 3 botanical gardens.\n\n**Constraints**\n- `1 <= n <= 50`\n- `1 <= limit <= 50`\n\n**Example 1**\n```\ninput:\n5\n2\noutput: 3\n```\n*Explanation: The valid distributions among the 3 gardens are: (1, 2, 2), (2, 1, 2), (2, 2, 1).*\n\n**Example 2**\n```\ninput:\n3\n3\noutput: 10\n```\n*Explanation: You can distribute the 3 units in 10 different ways: (0,0,3), (0,1,2), (0,2,1), (0,3,0), (1,0,2), (1,1,1), (1,2,0), (2,0,1), (2,1,0), (3,0,0).*\n\n**Example 3**\n```\ninput:\n10\n2\noutput: 0\n```\n*Explanation: Even if all 3 gardens receive the max limit of 2, the total is only 6. There is no way to distribute 10 units.*\n\n**Follow-up**\nCan you do this in mathcal{O}(1) time using combinatorics?",
    editorialMarkdown: "## Shield Energy Distribution\nWe are tasked with finding the number of ways to distribute N units of energy across 3 generators, with no single generator receiving more than limit units.\nGiven the constraints are small, we can simply iterate over the amount of energy assigned to the first two generators.\nLet i be the energy to generator 1 and j be the energy to generator 2. The energy to generator 3 must be k = n - i - j.\nWe just check if 0 ≤ i ≤ limit, 0 ≤ j ≤ limit, and 0 ≤ k ≤ limit. If they all satisfy this, we increment our count.\n\n**Trap**: Make sure to check that the remainder k doesn't drop below 0. \n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(limit^2) to check all pairs of (i, j).\n- **Space Complexity:** mathcal{O}(1) since we only use a counter.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n, limit) {\n    let ans = 0;\n    for (let i = 0; i <= limit; i++) {\n        for (let j = 0; j <= limit; j++) {\n            let k = n - i - j;\n            if (k >= 0 && k <= limit) {\n                ans++;\n            }\n        }\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(n: number, limit: number): number {\n    let ans = 0;\n    for (let i = 0; i <= limit; i++) {\n        for (let j = 0; j <= limit; j++) {\n            let k = n - i - j;\n            if (k >= 0 && k <= limit) {\n                ans++;\n            }\n        }\n    }\n    return ans;\n}",
      PYTHON: "def solve(n, limit):\n    ans = 0\n    for i in range(limit + 1):\n        for j in range(limit + 1):\n            k = n - i - j\n            if 0 <= k <= limit:\n                ans += 1\n    return ans",
      JAVA: "    static int solve(int n, int limit) {\n        int ans = 0;\n        for (int i = 0; i <= limit; i++) {\n            for (int j = 0; j <= limit; j++) {\n                int k = n - i - j;\n                if (k >= 0 && k <= limit) {\n                    ans++;\n                }\n            }\n        }\n        return ans;\n    }",
      CPP: "int solve(int n, int limit) {\n    int ans = 0;\n    for (int i = 0; i <= limit; i++) {\n        for (int j = 0; j <= limit; j++) {\n            int k = n - i - j;\n            if (k >= 0 && k <= limit) {\n                ans++;\n            }\n        }\n    }\n    return ans;\n}",
      GO: "func solve(n int, limit int) int {\n    ans := 0\n    for i := 0; i <= limit; i++ {\n        for j := 0; j <= limit; j++ {\n            k := n - i - j\n            if k >= 0 && k <= limit {\n                ans++\n            }\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "5\n2", expectedStdout: "3", isSample: true },
      { stdin: "3\n3", expectedStdout: "10", isSample: true },
      { stdin: "10\n2", expectedStdout: "0", isSample: true },
      { stdin: "2\n2", expectedStdout: "6" },
      { stdin: "15\n5", expectedStdout: "1" },
      { stdin: "50\n10", expectedStdout: "0" },
      { stdin: "2\n50", expectedStdout: "6" },
      { stdin: "6\n10", expectedStdout: "28" },
    ],
  }),

  p({
    ...base,
    slug: "maximize-nutrient-variety",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Maximum Genre Display",
    patternTags: ["hash-set","counting","greedy"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 600,
    promptMarkdown: "A rare book collector receives a shipment of newly acquired books, represented by an integer array `books` where `books[i]` indicates the genre ID of the `i`-th book.\n\nThe collector's display case only has space for exactly half of the total books received (the total number of books is guaranteed to be even). The collector wants to display as many unique genres as possible.\n\nReturn the maximum number of distinct book genres they can place in the display case.\n\n**Constraints**\n- `2 <= books.length <= 10^4`\n- `books.length` is even.\n- `-10^5 <= books[i] <= 10^5`\n\n**Example 1**\n```\ninput:\n1 1 2 2 3 3\noutput: 3\n```\n*Explanation: The collector can display 3 books. By choosing one of genre 1, one of genre 2, and one of genre 3, they achieve 3 distinct genres.*\n\n**Example 2**\n```\ninput:\n1 1 2 3\noutput: 2\n```\n*Explanation: The collector can display 2 books. Although there are 3 distinct genres available, they only have space for 2 books, resulting in a maximum variety of 2.*\n\n**Example 3**\n```\ninput:\n5 5 5 5\noutput: 1\n```\n*Explanation: The collector can display 2 books. Since all books belong to genre 5, they can only display 1 distinct genre.*\n\n**Follow-up**\nCan you do this using a hash set?",
    editorialMarkdown: "## Maximize Nutrient Variety\nThe problem requires us to find the maximum number of distinct nutrient pack types the crew can keep, given that they can only keep half of the total packs.\n\nTo maximize variety, the crew should always pick unique types first. Thus, the maximum variety they can achieve is bounded by two factors:\n1. The number of unique pack types available.\n2. The total amount of packs they are allowed to take (which is N / 2).\n\nTaking the minimum of these two values gives the correct answer. We can find the number of unique types by inserting all elements into a Hash Set.\n\n**Trap**: Do not manually count frequencies or simulate the picking process, as this might be slow and complex. A simple set size gives you everything you need.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) to traverse the array and build the Hash Set.\n- **Space Complexity:** mathcal{O}(N) to store the unique types in the Hash Set.",
    referenceSolution: {
      JAVASCRIPT: "function solve(packs) {\n    const unique = new Set(packs);\n    const allowed = Math.floor(packs.length / 2);\n    return Math.min(unique.size, allowed);\n}",
      TYPESCRIPT: "function solve(packs: number[]): number {\n    const unique = new Set(packs);\n    const allowed = Math.floor(packs.length / 2);\n    return Math.min(unique.size, allowed);\n}",
      PYTHON: "def solve(packs):\n    unique = len(set(packs))\n    allowed = len(packs) // 2\n    return min(unique, allowed)",
      JAVA: "    static int solve(int[] packs) {\n        java.util.HashSet<Integer> unique = new java.util.HashSet<>();\n        for (int p : packs) {\n            unique.add(p);\n        }\n        int allowed = packs.length / 2;\n        return Math.min(unique.size(), allowed);\n    }",
      CPP: "#include <vector>\n#include <unordered_set>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(vector<int> packs) {\n    unordered_set<int> unique_packs(packs.begin(), packs.end());\n    int max_allowed = packs.size() / 2;\n    return min((int)unique_packs.size(), max_allowed);\n}",
      GO: "func solve(packs []int) int {\n    unique := make(map[int]bool)\n    for _, p := range packs {\n        unique[p] = true\n    }\n    allowed := len(packs) / 2\n    unique_count := len(unique)\n    if unique_count < allowed {\n        return unique_count\n    }\n    return allowed\n}",
    },
    tests: [
      { stdin: "1 1 2 2 3 3", expectedStdout: "3", isSample: true },
      { stdin: "1 1 2 3", expectedStdout: "2", isSample: true },
      { stdin: "5 5 5 5", expectedStdout: "1", isSample: true },
      { stdin: "1 2", expectedStdout: "1" },
      { stdin: "1 2 3 4 5 6 7 8 9 10", expectedStdout: "5" },
      { stdin: "-1 -1 -1 -1 0 0 0 0 1 1 1 1", expectedStdout: "3" },
      { stdin: "0 0", expectedStdout: "1" },
      { stdin: "1 2 3 1 2 3", expectedStdout: "3" },
    ],
  }),
];
