import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w2-051` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W2_051_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "colony-population-growth",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "DP_1D",
    title: "Colony Population Growth",
    patternTags: ["dynamic-programming","math","fibonacci"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 300,
    promptMarkdown: "You are monitoring the population growth of a newly discovered bacterial colony.\nThe colony's population on day N is exactly the sum of its population on the previous two days (day N-1 and day N-2).\n\nYou know that:\n- On day 0, the population is 0.\n- On day 1, the population is 1.\n\nGiven an integer `n` representing the day, return the population of the colony on day `n`.\n\n**Constraints**\n- `0 <= n <= 30`\n\n**Example 1**\n```\ninput:\n2\noutput: 1\n```\n*Explanation: Day 2 = Day 1 (1) + Day 0 (0) = 1.*\n\n**Example 2**\n```\ninput:\n3\noutput: 2\n```\n*Explanation: Day 3 = Day 2 (1) + Day 1 (1) = 2.*\n\n**Example 3**\n```\ninput:\n4\noutput: 3\n```\n*Explanation: Day 4 = Day 3 (2) + Day 2 (1) = 3.*\n\n**Follow-up**\nCan you compute this with mathcal{O}(1) space complexity?",
    editorialMarkdown: "## Colony Population Growth\nThis problem requires calculating the N-th term of a sequence where each term is the sum of the two preceding ones.\nWe can solve this iteratively by maintaining just the last two values in the sequence as we build up to N, which avoids storing all intermediate steps and keeps our space complexity minimal.\n\n**Trap**: Using a naive recursive approach without memoization leads to exponential time complexity, which could cause a time limit exceeded error even for small constraints.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) to calculate the N-th day.\n- **Space Complexity:** mathcal{O}(1) since we only need to track the two most recent values.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n) {\n    if (n === 0) return 0;\n    let a = 0, b = 1;\n    for (let i = 2; i <= n; i++) {\n        let temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}",
      TYPESCRIPT: "function solve(n: number): number {\n    if (n === 0) return 0;\n    let a = 0, b = 1;\n    for (let i = 2; i <= n; i++) {\n        let temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}",
      PYTHON: "def solve(n):\n    if n == 0:\n        return 0\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b",
      JAVA: "    static int solve(int n) {\n        if (n == 0) return 0;\n        int a = 0, b = 1;\n        for (int i = 2; i <= n; i++) {\n            int temp = a + b;\n            a = b;\n            b = temp;\n        }\n        return b;\n    }",
      CPP: "int solve(int n) {\n    if (n == 0) return 0;\n    int a = 0, b = 1;\n    for (int i = 2; i <= n; i++) {\n        int temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}",
      GO: "func solve(n int) int {\n    if n == 0 {\n        return 0\n    }\n    a, b := 0, 1\n    for i := 2; i <= n; i++ {\n        a, b = b, a+b\n    }\n    return b\n}",
    },
    tests: [
      { stdin: "2", expectedStdout: "1", isSample: true },
      { stdin: "3", expectedStdout: "2", isSample: true },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "4", expectedStdout: "3" },
      { stdin: "5", expectedStdout: "5" },
      { stdin: "10", expectedStdout: "55" },
      { stdin: "30", expectedStdout: "832040" },
    ],
  }),

  p({
    ...base,
    slug: "enhance-weakest-energy-shields",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "HEAP_PRIORITY_QUEUE",
    title: "Fertilize Lowest Yielding Crops",
    patternTags: ["arrays","simulation","minimum-spanning-tree"],
    signatureId: "fn:ints,int->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "You are a farmer looking to maximize the output of your fields. You have a row of crops, and each crop has a current yield.\nYou have `k` bags of special fertilizer. Each bag doubles the yield of the crop it is applied to.\n\nTo ensure no crop is left too far behind, you apply the fertilizer one bag at a time, always choosing the crop that currently has the **lowest** yield. If there is a tie between multiple crops for the lowest yield, you always choose the one closest to the start of the row (the smallest index).\n\nGiven an array `yields` representing the starting yields of the crops and an integer `k` representing the number of bags of fertilizer, return the array of yields after all `k` bags have been applied.\n\n**Constraints**\n- `1 <= yields.length <= 100`\n- `1 <= yields[i] <= 100`\n- `0 <= k <= 100`\n\n**Example 1**\n```\ninput:\n2 1 3\n1\noutput: 2 2 3\n```\n*Explanation: The lowest yield is 1 at index 1. It receives a bag of fertilizer and its yield doubles to 2.*\n\n**Example 2**\n```\ninput:\n1 1 1\n2\noutput: 2 2 1\n```\n*Explanation: The first bag is applied to the crop at index 0 (as it's the first one with the lowest yield of 1), doubling it to 2. The yields are now [2, 1, 1]. The second bag is applied to the crop at index 1, doubling it to 2. The final yields are [2, 2, 1].*\n\n**Example 3**\n```\ninput:\n5\n3\noutput: 40\n```\n*Explanation: The single crop receives fertilizer three times: 5 -> 10 -> 20 -> 40.*\n\n**Follow-up**\nHow would you approach this problem if `k` and `yields.length` were up to 10^5?",
    editorialMarkdown: "## Enhance Weakest Energy Shields\nFor a relatively small number of operations `k` and small array size, we can simply simulate the process. \nIn each operation, we find the minimum element in the array. If there is a tie, a linear scan from left to right naturally selects the one with the smallest index. We then multiply this element by 2 and repeat for k operations.\n\n**Trap**: While a priority queue (min-heap) is the optimal data structure here, the constraints of an EASY problem often permit mathcal{O}(N × K) simulation. Over-engineering a heap for small inputs can introduce unnecessary bugs.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(K × N) where K is the number of operations and N is the number of shields.\n- **Space Complexity:** mathcal{O}(N) to store the array state.",
    referenceSolution: {
      JAVASCRIPT: "function solve(shields, k) {\n    let res = [...shields];\n    for (let i = 0; i < k; i++) {\n        if (res.length === 0) break;\n        let minIdx = 0;\n        for (let j = 1; j < res.length; j++) {\n            if (res[j] < res[minIdx]) {\n                minIdx = j;\n            }\n        }\n        res[minIdx] *= 2;\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(shields: number[], k: number): number[] {\n    let res = [...shields];\n    for (let i = 0; i < k; i++) {\n        if (res.length === 0) break;\n        let minIdx = 0;\n        for (let j = 1; j < res.length; j++) {\n            if (res[j] < res[minIdx]) {\n                minIdx = j;\n            }\n        }\n        res[minIdx] *= 2;\n    }\n    return res;\n}",
      PYTHON: "def solve(shields, k):\n    res = list(shields)\n    for _ in range(k):\n        if not res:\n            break\n        min_idx = 0\n        for j in range(1, len(res)):\n            if res[j] < res[min_idx]:\n                min_idx = j\n        res[min_idx] *= 2\n    return res",
      JAVA: "    static int[] solve(int[] shields, int k) {\n        int[] res = shields.clone();\n        for (int i = 0; i < k; i++) {\n            if (res.length == 0) break;\n            int minIdx = 0;\n            for (int j = 1; j < res.length; j++) {\n                if (res[j] < res[minIdx]) {\n                    minIdx = j;\n                }\n            }\n            res[minIdx] *= 2;\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\n\nvector<int> solve(vector<int> shields, int k) {\n    vector<int> res = shields;\n    for (int i = 0; i < k; i++) {\n        if (res.empty()) break;\n        int minIdx = 0;\n        for (int j = 1; j < res.size(); j++) {\n            if (res[j] < res[minIdx]) {\n                minIdx = j;\n            }\n        }\n        res[minIdx] *= 2;\n    }\n    return res;\n}",
      GO: "func solve(shields []int, k int) []int {\n    res := make([]int, len(shields))\n    copy(res, shields)\n    for i := 0; i < k; i++ {\n        if len(res) == 0 {\n            break\n        }\n        minIdx := 0\n        for j := 1; j < len(res); j++ {\n            if res[j] < res[minIdx] {\n                minIdx = j\n            }\n        }\n        res[minIdx] *= 2\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "2 1 3\n1", expectedStdout: "2 2 3", isSample: true },
      { stdin: "1 1 1\n2", expectedStdout: "2 2 1", isSample: true },
      { stdin: "5\n3", expectedStdout: "40" },
      { stdin: "5\n0", expectedStdout: "5" },
      { stdin: "2 1\n0", expectedStdout: "2 1" },
      { stdin: "10 20 30\n1", expectedStdout: "20 20 30" },
      { stdin: "3 3 3\n3", expectedStdout: "6 6 6" },
      { stdin: "10 5 2\n4", expectedStdout: "10 10 16" },
    ],
  }),

  p({
    ...base,
    slug: "locate-the-infected-sector",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Locate the Infected Sector",
    patternTags: ["matrix","search","traversal"],
    signatureId: "fn:matrix,int->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "You are a cyber-security analyst investigating a breach. You have a 2D grid representing the network map of your organization's servers, where each server has a unique integer identifier.\n\nAn intrusion detection system has flagged a server as infected, providing its unique identifier `target`. You need to find the exact coordinates of this infected server on the network map.\n\nGiven the 2D array `grid` and the integer `target`, return an array of two integers `[row, column]` representing the 0-indexed position of the infected server.\n\n**Constraints**\n- `1 <= grid.length, grid[i].length <= 50`\n- All values in `grid` are distinct.\n- `target` is guaranteed to exist in `grid`.\n\n**Example 1**\n```\ninput:\n1 2;3 4\n3\noutput: 1 0\n```\n*Explanation: The server with ID 3 is located in row 1, column 0.*\n\n**Example 2**\n```\ninput:\n10\n10\noutput: 0 0\n```\n*Explanation: The server with ID 10 is at the very first position.*\n\n**Example 3**\n```\ninput:\n5 10 15;20 25 30\n25\noutput: 1 1\n```\n*Explanation: The server with ID 25 is in row 1, column 1.*\n\n**Follow-up**\nIf the rows and columns were sorted, could you find the target faster?",
    editorialMarkdown: "## Locate the Infected Sector\nWe need to find the location of a specific target value within a 2D matrix. This is structurally equivalent to searching for a node within a tree.\nWe can perform a standard 2D traversal (using nested loops) to check every cell in the grid. When we find the cell whose value matches `target`, we immediately return its row and column indices.\n\n**Trap**: Ensure you return the row and column in the correct order as specified by the problem.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(M × N) where M is the number of rows and N is the number of columns.\n- **Space Complexity:** mathcal{O}(1) beyond the required output, since we only store loop variables.",
    referenceSolution: {
      JAVASCRIPT: "function solve(grid, target) {\n    for (let r = 0; r < grid.length; r++) {\n        for (let c = 0; c < grid[r].length; c++) {\n            if (grid[r][c] === target) {\n                return [r, c];\n            }\n        }\n    }\n    return [];\n}",
      TYPESCRIPT: "function solve(grid: number[][], target: number): number[] {\n    for (let r = 0; r < grid.length; r++) {\n        for (let c = 0; c < grid[r].length; c++) {\n            if (grid[r][c] === target) {\n                return [r, c];\n            }\n        }\n    }\n    return [];\n}",
      PYTHON: "def solve(grid, target):\n    for r in range(len(grid)):\n        for c in range(len(grid[r])):\n            if grid[r][c] == target:\n                return [r, c]\n    return []",
      JAVA: "    static int[] solve(int[][] grid, int target) {\n        for (int r = 0; r < grid.length; r++) {\n            for (int c = 0; c < grid[r].length; c++) {\n                if (grid[r][c] == target) {\n                    return new int[]{r, c};\n                }\n            }\n        }\n        return new int[]{};\n    }",
      CPP: "#include <vector>\nusing namespace std;\n\nvector<int> solve(vector<vector<int>> grid, int target) {\n    for (int r = 0; r < grid.size(); r++) {\n        for (int c = 0; c < grid[r].size(); c++) {\n            if (grid[r][c] == target) {\n                return {r, c};\n            }\n        }\n    }\n    return {};\n}",
      GO: "func solve(grid [][]int, target int) []int {\n    for r := 0; r < len(grid); r++ {\n        for c := 0; c < len(grid[r]); c++ {\n            if grid[r][c] == target {\n                return []int{r, c}\n            }\n        }\n    }\n    return []int{}\n}",
    },
    tests: [
      { stdin: "1 2;3 4\n3", expectedStdout: "1 0", isSample: true },
      { stdin: "10\n10", expectedStdout: "0 0", isSample: true },
      { stdin: "5 10 15;20 25 30\n25", expectedStdout: "1 1" },
      { stdin: "1 2 3;4 5 6;7 8 9\n9", expectedStdout: "2 2" },
      { stdin: "1 2 3\n2", expectedStdout: "0 1" },
      { stdin: "-1 -2;-3 -4\n-3", expectedStdout: "1 0" },
      { stdin: "100 200\n100", expectedStdout: "0 0" },
      { stdin: "1;2;3\n2", expectedStdout: "1 0" },
    ],
  }),

  p({
    ...base,
    slug: "identify-missing-supplies",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Identify Missing Supplies",
    patternTags: ["hash-set","arrays","set-difference"],
    signatureId: "fn:ints,ints->ints",
    avgSolveSeconds: 350,
    promptMarkdown: "You manage logistics for an automated warehouse. You are given an array `expected` containing all the supply crate IDs that were supposed to be delivered today, and another array `actual` containing the crate IDs that were successfully scanned into the inventory.\n\nSome crates may have been lost in transit. Return an array of the crate IDs from the `expected` list that are missing from the `actual` list. The output should preserve the order in which the missing crates appeared in `expected`.\n\n**Constraints**\n- `0 <= expected.length, actual.length <= 10^4`\n- All IDs in `expected` are unique.\n- All IDs in `actual` are unique.\n\n**Example 1**\n```\ninput:\n1 2 3\n1 3\noutput: 2\n```\n*Explanation: Crate 2 was expected but not scanned.*\n\n**Example 2**\n```\ninput:\n10 20 30\n10 20 30\noutput: \n```\n*Explanation: All expected crates were scanned.*\n\n**Example 3**\n```\ninput:\n1 2\n2\noutput: 1\n```\n*Explanation: Crate 1 is missing.*\n\n**Follow-up**\nCan you identify the missing supplies in optimal time using extra space?",
    editorialMarkdown: "## Identify Missing Supplies\nThis problem tasks us with finding all items from an `expected` list that do not appear in an `actual` list.\nThe most efficient approach is to convert the `actual` array into a Hash Set. This allows us to check if an item exists in the `actual` list in mathcal{O}(1) time. We then iterate over the `expected` array, keeping only those items that are absent from the set.\n\n**Trap**: Checking for presence using a list/array lookup takes mathcal{O}(M) time per element, leading to an overall mathcal{O}(N × M) approach. A Hash Set reduces this to linear time.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N + M) where N is the length of `expected` and M is the length of `actual`.\n- **Space Complexity:** mathcal{O}(M) to store the Hash Set of the actual items.",
    referenceSolution: {
      JAVASCRIPT: "function solve(expected, actual) {\n    let actualSet = new Set(actual);\n    return expected.filter(x => !actualSet.has(x));\n}",
      TYPESCRIPT: "function solve(expected: number[], actual: number[]): number[] {\n    let actualSet = new Set<number>(actual);\n    return expected.filter(x => !actualSet.has(x));\n}",
      PYTHON: "def solve(expected, actual):\n    actual_set = set(actual)\n    return [x for x in expected if x not in actual_set]",
      JAVA: "    static int[] solve(int[] expected, int[] actual) {\n        java.util.HashSet<Integer> actualSet = new java.util.HashSet<>();\n        for (int x : actual) {\n            actualSet.add(x);\n        }\n        int[] temp = new int[expected.length];\n        int count = 0;\n        for (int x : expected) {\n            if (!actualSet.contains(x)) {\n                temp[count++] = x;\n            }\n        }\n        int[] res = new int[count];\n        System.arraycopy(temp, 0, res, 0, count);\n        return res;\n    }",
      CPP: "#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nvector<int> solve(vector<int> expected, vector<int> actual) {\n    unordered_set<int> actualSet(actual.begin(), actual.end());\n    vector<int> res;\n    for (int x : expected) {\n        if (actualSet.find(x) == actualSet.end()) {\n            res.push_back(x);\n        }\n    }\n    return res;\n}",
      GO: "func solve(expected []int, actual []int) []int {\n    actualSet := make(map[int]bool)\n    for _, x := range actual {\n        actualSet[x] = true\n    }\n    res := []int{}\n    for _, x := range expected {\n        if !actualSet[x] {\n            res = append(res, x)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 3\n1 3", expectedStdout: "2", isSample: true },
      { stdin: "10 20 30\n10 20 30", expectedStdout: "", isSample: true },
      { stdin: "5 6 7\n", expectedStdout: "5 6 7" },
      { stdin: "1\n", expectedStdout: "1" },
      { stdin: "1 2\n2", expectedStdout: "1" },
      { stdin: "1 1 2 3\n1", expectedStdout: "2 3" },
      { stdin: "-1 0 1\n0", expectedStdout: "-1 1" },
      { stdin: "\n", expectedStdout: "" },
    ],
  }),

  p({
    ...base,
    slug: "magic-wand-spelling",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Reversing Assembly Line",
    patternTags: ["strings","simulation","reversal"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 450,
    promptMarkdown: "You are monitoring an assembly line that prints letters onto a moving display. Normally, the machine prints each letter one by one at the end of the current display.\nHowever, there is a malfunction in the control system. Whenever the machine encounters the `'!'` command in its instruction sequence, instead of printing it, the machine flips the entire display around, reversing everything that has been printed so far.\n\nGiven a string `instructions` representing the sequence of letters and `'!'` flip commands, determine what the display will show after all instructions are processed.\n\n**Constraints**\n- `0 <= instructions.length <= 100`\n- `instructions` consists of lowercase English letters and `'!'`.\n\n**Example 1**\n```\ninput:\nab!c\noutput: bac\n```\n*Explanation: 'a' and 'b' are printed. The '!' command flips \"ab\" into \"ba\". Finally, 'c' is printed at the end, resulting in \"bac\".*\n\n**Example 2**\n```\ninput:\na!b!c\noutput: bac\n```\n*Explanation: 'a' is printed. The first '!' flips it (still 'a'). 'b' is printed to make \"ab\". The second '!' flips it to \"ba\". 'c' is added, resulting in \"bac\".*\n\n**Example 3**\n```\ninput:\nhello!\noutput: olleh\n```\n*Explanation: \"hello\" is printed normally, and then the '!' at the end flips the entire string to \"olleh\".*\n\n**Follow-up**\nCan you do this in mathcal{O}(N) time?",
    editorialMarkdown: "## Magic Wand Spelling\nWe can simulate the typing process by maintaining a string (or a string builder/array of characters) that represents the word typed so far. As we iterate through each character of the input string, if we encounter a '!', we reverse the characters we've collected. Otherwise, we append the character to the end.\n\n**Trap**: Repeatedly reversing strings in some languages can take quadratic time. While acceptable for short inputs, for larger ones, optimizing the reversals (e.g. by using a doubly linked list or a deque, or counting '!'s to determine direction) would be necessary. For these constraints, simple simulation is fine.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N^2) in the worst case (where we reverse frequently) and N is the length of the string, or mathcal{O}(N) if optimized with a deque.\n- **Space Complexity:** mathcal{O}(N) to store the resulting string.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    let res = \"\";\n    for (let c of s) {\n        if (c === '!') {\n            res = res.split(\"\").reverse().join(\"\");\n        } else {\n            res += c;\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(s: string): string {\n    let res = \"\";\n    for (let c of s) {\n        if (c === '!') {\n            res = res.split(\"\").reverse().join(\"\");\n        } else {\n            res += c;\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(s):\n    res = \"\"\n    for c in s:\n        if c == '!':\n            res = res[::-1]\n        else:\n            res += c\n    return res",
      JAVA: "    static String solve(String s) {\n        StringBuilder sb = new StringBuilder();\n        for (char c : s.toCharArray()) {\n            if (c == '!') {\n                sb.reverse();\n            } else {\n                sb.append(c);\n            }\n        }\n        return sb.toString();\n    }",
      CPP: "#include <string>\n#include <algorithm>\nusing namespace std;\nstring solve(string s) {\n    string res = \"\";\n    for (char c : s) {\n        if (c == '!') {\n            reverse(res.begin(), res.end());\n        } else {\n            res += c;\n        }\n    }\n    return res;\n}",
      GO: "func solve(s string) string {\n    res := \"\"\n    for _, c := range s {\n        if c == '!' {\n            runes := []rune(res)\n            for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {\n                runes[i], runes[j] = runes[j], runes[i]\n            }\n            res = string(runes)\n        } else {\n            res += string(c)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "ab!c", expectedStdout: "bac", isSample: true },
      { stdin: "a!b!c", expectedStdout: "bac", isSample: true },
      { stdin: "!", expectedStdout: "" },
      { stdin: "", expectedStdout: "" },
      { stdin: "hello", expectedStdout: "hello" },
      { stdin: "hello!", expectedStdout: "olleh" },
      { stdin: "a!!b", expectedStdout: "ab" },
      { stdin: "a!b!c!d", expectedStdout: "cabd" },
    ],
  }),
];
