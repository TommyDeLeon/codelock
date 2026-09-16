import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-045` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_045_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "continuous-data-stream-length",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Continuous Data Stream",
    patternTags: ["array","simulation"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "A network receives packets numbered from `1` to `N`. Due to network latency, the packets arrive out of order. The array `a` contains a permutation of the integers from `1` to `N`, representing the order in which the packets arrive.\n\nAt each step, a new packet arrives. We want to process all available consecutive packets starting from packet `1`. Return an array of the same size, where each element is the number of packets processed at that step.\n\n**Constraints**\n- `1 <= a.length <= 100`\n- `a` is a permutation of the integers from `1` to `a.length`.\n\n**Example 1**\n```\ninput:\n3 1 2 4\noutput: 0 1 2 1\n```\n*Explanation: When 3 arrives, we can't process it. When 1 arrives, we process 1. When 2 arrives, we can now process 2 and 3. Finally, when 4 arrives, we process 4.*\n\n**Example 2**\n```\ninput:\n1 2 3\noutput: 1 1 1\n```\n*Explanation: Each packet arrives in perfect order, so we process one at each step.*\n\n**Example 3**\n```\ninput:\n2 1\noutput: 0 2\n```\n*Explanation: When 2 arrives, nothing happens. When 1 arrives, we process both 1 and 2.*\n\n**Follow-up**\nCan you process the stream with mathcal{O}(N) total time complexity?",
    editorialMarkdown: "## Continuous Data Stream\nWe can track the arrival of packets using a boolean array. We also maintain a pointer that represents the next packet we need in order to form a continuous sequence starting from `1`.\n\n**Trap**: Make sure to check the array bounds before accessing `seen[nxt]` to avoid out-of-bounds errors.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) amortized. Even though there is a nested loop, the `nxt` pointer only moves forward N times total.\n- **Space Complexity:** mathcal{O}(N) to store the `seen` array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let n = a.length;\n    let seen = new Array(n + 2).fill(false);\n    let nxt = 1;\n    let res = [];\n    for (let i = 0; i < n; i++) {\n        seen[a[i]] = true;\n        let count = 0;\n        while (nxt <= n && seen[nxt]) {\n            count++;\n            nxt++;\n        }\n        res.push(count);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(a: number[]): number[] {\n    let n = a.length;\n    let seen = new Array(n + 2).fill(false);\n    let nxt = 1;\n    let res: number[] = [];\n    for (let i = 0; i < n; i++) {\n        seen[a[i]] = true;\n        let count = 0;\n        while (nxt <= n && seen[nxt]) {\n            count++;\n            nxt++;\n        }\n        res.push(count);\n    }\n    return res;\n}",
      PYTHON: "def solve(a):\n    n = len(a)\n    seen = [False] * (n + 2)\n    nxt = 1\n    res = []\n    for x in a:\n        seen[x] = True\n        count = 0\n        while nxt <= n and seen[nxt]:\n            count += 1\n            nxt += 1\n        res.append(count)\n    return res",
      JAVA: "    static int[] solve(int[] a) {\n        int n = a.length;\n        boolean[] seen = new boolean[n + 2];\n        int nxt = 1;\n        int[] res = new int[n];\n        for (int i = 0; i < n; i++) {\n            seen[a[i]] = true;\n            int count = 0;\n            while (nxt <= n && seen[nxt]) {\n                count++;\n                nxt++;\n            }\n            res[i] = count;\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<int> a) {\n    int n = a.size();\n    vector<bool> seen(n + 2, false);\n    int nxt = 1;\n    vector<int> res;\n    for (int i = 0; i < n; i++) {\n        seen[a[i]] = true;\n        int count = 0;\n        while (nxt <= n && seen[nxt]) {\n            count++;\n            nxt++;\n        }\n        res.push_back(count);\n    }\n    return res;\n}",
      GO: "func solve(a []int) []int {\n    n := len(a)\n    seen := make([]bool, n+2)\n    nxt := 1\n    res := make([]int, n)\n    for i, x := range a {\n        seen[x] = true\n        count := 0\n        for nxt <= n && seen[nxt] {\n            count++\n            nxt++\n        }\n        res[i] = count\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "3 1 2 4", expectedStdout: "0 1 2 1", isSample: true },
      { stdin: "1 2 3", expectedStdout: "1 1 1", isSample: true },
      { stdin: "2 1", expectedStdout: "0 2" },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "4 3 2 1", expectedStdout: "0 0 0 4" },
      { stdin: "2 3 4 1", expectedStdout: "0 0 0 4" },
      { stdin: "5 1 2 3 4", expectedStdout: "0 1 1 1 2" },
      { stdin: "1 3 2", expectedStdout: "1 0 2" },
    ],
  }),

  p({
    ...base,
    slug: "decompress-alien-message",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Decompress Alien Message",
    patternTags: ["string","simulation"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 400,
    promptMarkdown: "You have intercepted a compressed transmission from an alien spacecraft. The string is encoded such that every letter is immediately followed by a single digit (1-9) indicating how many times that letter should be repeated in the decompressed message.\n\nGiven the compressed string, return the fully decompressed message.\n\n**Constraints**\n- `2 <= s.length <= 100`\n- `s.length` is even.\n- The characters at even indices are lowercase English letters.\n- The characters at odd indices are digits between `'1'` and `'9'`.\n\n**Example 1**\n```\ninput:\na3b2\noutput: aaabb\n```\n*Explanation: 'a' is repeated 3 times, 'b' is repeated 2 times.*\n\n**Example 2**\n```\ninput:\nx1y1z1\noutput: xyz\n```\n*Explanation: Each letter appears exactly once.*\n\n**Example 3**\n```\ninput:\na1\noutput: a\n```\n*Explanation: A single letter with count 1 decompresses to itself.*\n\n**Follow-up**\nWhat is the maximum length of the output string given the constraints?",
    editorialMarkdown: "## Decompress Alien Message\nThe task requires parsing a run-length encoded string. We iterate through the string in steps of 2, taking the character and its frequency, and appending it to our result string.\n\n**Trap**: Forgetting to convert the count character from a string format into a numeric integer before looping.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(L) where L is the length of the decompressed string.\n- **Space Complexity:** mathcal{O}(L) to store the result.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let res = \"\";\n    for (let i = 0; i < a.length; i += 2) {\n        let c = a[i];\n        let count = parseInt(a[i + 1]);\n        for (let j = 0; j < count; j++) {\n            res += c;\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(a: string): string {\n    let res = \"\";\n    for (let i = 0; i < a.length; i += 2) {\n        let c = a[i];\n        let count = parseInt(a[i + 1]);\n        for (let j = 0; j < count; j++) {\n            res += c;\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(a):\n    res = []\n    for i in range(0, len(a), 2):\n        c = a[i]\n        count = int(a[i+1])\n        res.append(c * count)\n    return \"\".join(res)",
      JAVA: "    static String solve(String a) {\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < a.length(); i += 2) {\n            char c = a.charAt(i);\n            int count = a.charAt(i + 1) - '0';\n            for (int j = 0; j < count; j++) {\n                sb.append(c);\n            }\n        }\n        return sb.toString();\n    }",
      CPP: "#include <string>\nusing namespace std;\nstring solve(string a) {\n    string res = \"\";\n    for (int i = 0; i < a.length(); i += 2) {\n        char c = a[i];\n        int count = a[i + 1] - '0';\n        for (int j = 0; j < count; j++) {\n            res += c;\n        }\n    }\n    return res;\n}",
      GO: "func solve(a string) string {\n    var res []byte\n    for i := 0; i < len(a); i += 2 {\n        c := a[i]\n        count := int(a[i+1] - '0')\n        for j := 0; j < count; j++ {\n            res = append(res, c)\n        }\n    }\n    return string(res)\n}",
    },
    tests: [
      { stdin: "a3b2", expectedStdout: "aaabb", isSample: true },
      { stdin: "x1y1z1", expectedStdout: "xyz", isSample: true },
      { stdin: "a1", expectedStdout: "a" },
      { stdin: "a9", expectedStdout: "aaaaaaaaa" },
      { stdin: "c3d3", expectedStdout: "cccddd" },
      { stdin: "a2b2c2", expectedStdout: "aabbcc" },
      { stdin: "z5", expectedStdout: "zzzzz" },
      { stdin: "a1b9", expectedStdout: "abbbbbbbbb" },
    ],
  }),

  p({
    ...base,
    slug: "first-repeated-scout-id",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "First Repeated Scout ID",
    patternTags: ["array","hash-map"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "During an expedition, scouts check in at a base station by scanning their ID badges. You are given an array of integers representing the scout IDs in the order they checked in.\n\nFind the very first scout ID that checks in for a *second* time. If no scout checks in more than once, return `-1`.\n\n**Constraints**\n- `1 <= a.length <= 100`\n- `1 <= a[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 3 2 1\noutput: 2\n```\n*Explanation: Scout 2 is the first to scan their badge for a second time.*\n\n**Example 2**\n```\ninput:\n1 2 3 4\noutput: -1\n```\n*Explanation: All scouts check in exactly once, so return -1.*\n\n**Example 3**\n```\ninput:\n5 5\noutput: 5\n```\n*Explanation: Scout 5 checks in twice immediately.*\n\n**Follow-up**\nCan you do this with a single pass over the array?",
    editorialMarkdown: "## First Repeated Scout ID\nWe can use a Hash Set to track the scout IDs we have seen so far. As we iterate through the array, if we encounter an ID that is already in the set, we immediately return it.\n\n**Trap**: Returning the most frequent ID instead of the *first* one that repeats in order of appearance.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) to traverse the array.\n- **Space Complexity:** mathcal{O}(N) to store elements in the Hash Set.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let seen = new Set();\n    for (let i = 0; i < a.length; i++) {\n        if (seen.has(a[i])) return a[i];\n        seen.add(a[i]);\n    }\n    return -1;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    let seen = new Set<number>();\n    for (let i = 0; i < a.length; i++) {\n        if (seen.has(a[i])) return a[i];\n        seen.add(a[i]);\n    }\n    return -1;\n}",
      PYTHON: "def solve(a):\n    seen = set()\n    for x in a:\n        if x in seen:\n            return x\n        seen.add(x)\n    return -1",
      JAVA: "    static int solve(int[] a) {\n        java.util.HashSet<Integer> seen = new java.util.HashSet<>();\n        for (int x : a) {\n            if (seen.contains(x)) return x;\n            seen.add(x);\n        }\n        return -1;\n    }",
      CPP: "#include <vector>\n#include <unordered_set>\nusing namespace std;\nint solve(vector<int> a) {\n    unordered_set<int> seen;\n    for (int x : a) {\n        if (seen.find(x) != seen.end()) return x;\n        seen.insert(x);\n    }\n    return -1;\n}",
      GO: "func solve(a []int) int {\n    seen := make(map[int]bool)\n    for _, x := range a {\n        if seen[x] {\n            return x\n        }\n        seen[x] = true\n    }\n    return -1\n}",
    },
    tests: [
      { stdin: "1 2 3 2 1", expectedStdout: "2", isSample: true },
      { stdin: "1 2 3 4", expectedStdout: "-1", isSample: true },
      { stdin: "5 5", expectedStdout: "5" },
      { stdin: "10 20 30 10 20", expectedStdout: "10" },
      { stdin: "1", expectedStdout: "-1" },
      { stdin: "7 8 9 7", expectedStdout: "7" },
      { stdin: "4 5 6 6 5 4", expectedStdout: "6" },
      { stdin: "2 2 2", expectedStdout: "2" },
    ],
  }),

  p({
    ...base,
    slug: "distinct-alien-species-count",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Distinct Alien Species Count",
    patternTags: ["array","hash-set"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "A biologist on a newly discovered planet has recorded sightings of various alien species, where each species is represented by an integer ID. \n\nGiven an array of integer IDs representing the sequence of sightings, calculate the total number of *distinct* species that were observed.\n\n**Constraints**\n- `1 <= a.length <= 100`\n- `-1000 <= a[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 2 3\noutput: 3\n```\n*Explanation: The observed species IDs are 1, 2, and 3. There are 3 distinct species.*\n\n**Example 2**\n```\ninput:\n1 1 1\noutput: 1\n```\n*Explanation: Only species 1 was observed repeatedly.*\n\n**Example 3**\n```\ninput:\n1 2 3 4 5\noutput: 5\n```\n*Explanation: Every sighting was of a different species.*\n\n**Follow-up**\nCan you do this in mathcal{O}(N) time?",
    editorialMarkdown: "## Distinct Alien Species Count\nA Hash Set naturally removes duplicates and tracks unique elements. We can add all elements to a set and return its size.\n\n**Trap**: Modifying the original array in place using nested loops could result in an mathcal{O}(N^2) time complexity, causing potential timeouts for larger arrays.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N)\n- **Space Complexity:** mathcal{O}(N) to store unique species in the set.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let s = new Set();\n    for (let i = 0; i < a.length; i++) s.add(a[i]);\n    return s.size;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    let s = new Set<number>();\n    for (let i = 0; i < a.length; i++) s.add(a[i]);\n    return s.size;\n}",
      PYTHON: "def solve(a):\n    return len(set(a))",
      JAVA: "    static int solve(int[] a) {\n        java.util.HashSet<Integer> s = new java.util.HashSet<>();\n        for (int x : a) s.add(x);\n        return s.size();\n    }",
      CPP: "#include <vector>\n#include <unordered_set>\nusing namespace std;\nint solve(vector<int> a) {\n    unordered_set<int> s;\n    for (int x : a) s.insert(x);\n    return s.size();\n}",
      GO: "func solve(a []int) int {\n    s := make(map[int]bool)\n    for _, x := range a {\n        s[x] = true\n    }\n    return len(s)\n}",
    },
    tests: [
      { stdin: "1 2 2 3", expectedStdout: "3", isSample: true },
      { stdin: "1 1 1", expectedStdout: "1", isSample: true },
      { stdin: "1 2 3 4 5", expectedStdout: "5" },
      { stdin: "5", expectedStdout: "1" },
      { stdin: "-1 0 1 -1", expectedStdout: "3" },
      { stdin: "10 10 20 20", expectedStdout: "2" },
      { stdin: "7 8 9 7 8 9", expectedStdout: "3" },
      { stdin: "0", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "terrain-energy-neighbor-sum",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Terrain Energy Neighbor Sum",
    patternTags: ["matrix","simulation"],
    signatureId: "fn:matrix->matrix",
    avgSolveSeconds: 600,
    promptMarkdown: "A planetary scan has returned an `M x N` grid of energy levels representing the terrain. The scientists want to analyze the localized energy by computing the sum of the adjacent energy levels around every tile.\n\nGiven the grid, return a new grid of the same dimensions where each cell contains the sum of its existing top, bottom, left, and right neighbors. Neighbors that fall outside the grid bounds contribute `0`.\n\n**Constraints**\n- `1 <= M, N <= 20`\n- `0 <= mat[i][j] <= 100`\n\n**Example 1**\n```\ninput:\n1 2;3 4\noutput: 5 5;5 5\n```\n*Explanation: For the top-left cell (1), its neighbors are 2 (right) and 3 (bottom). 2 + 3 = 5.*\n\n**Example 2**\n```\ninput:\n10\noutput: 0\n```\n*Explanation: A single cell has no neighbors, so the sum is 0.*\n\n**Example 3**\n```\ninput:\n1 1 1;1 1 1;1 1 1\noutput: 2 3 2;3 4 3;2 3 2\n```\n*Explanation: Corners have 2 neighbors, edge cells have 3, and the center cell has 4.*\n\n**Follow-up**\nCan you ensure that you don't overwrite values that are still needed for subsequent calculations?",
    editorialMarkdown: "## Terrain Energy Neighbor Sum\nTo calculate the new grid, we iterate through each cell, check its four adjacent directions (top, bottom, left, right), and sum up the energy values if they fall within the matrix boundaries.\n\n**Trap**: Modifying the array in-place while iterating! This will cause subsequent neighbor calculations to use the newly computed values instead of the original values.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(R \times C) where R and C are the dimensions of the grid.\n- **Space Complexity:** mathcal{O}(R \times C) to allocate the result matrix.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    if (!a || a.length === 0) return [];\n    let r = a.length, c = a[0].length;\n    let res = [];\n    for (let i = 0; i < r; i++) {\n        let row = [];\n        for (let j = 0; j < c; j++) {\n            let sum = 0;\n            if (i > 0) sum += a[i-1][j];\n            if (i < r - 1) sum += a[i+1][j];\n            if (j > 0) sum += a[i][j-1];\n            if (j < c - 1) sum += a[i][j+1];\n            row.push(sum);\n        }\n        res.push(row);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(a: number[][]): number[][] {\n    if (!a || a.length === 0) return [];\n    let r = a.length, c = a[0].length;\n    let res: number[][] = [];\n    for (let i = 0; i < r; i++) {\n        let row: number[] = [];\n        for (let j = 0; j < c; j++) {\n            let sum = 0;\n            if (i > 0) sum += a[i-1][j];\n            if (i < r - 1) sum += a[i+1][j];\n            if (j > 0) sum += a[i][j-1];\n            if (j < c - 1) sum += a[i][j+1];\n            row.push(sum);\n        }\n        res.push(row);\n    }\n    return res;\n}",
      PYTHON: "def solve(a):\n    if not a or not a[0]: return []\n    R, C = len(a), len(a[0])\n    res = [[0]*C for _ in range(R)]\n    for r in range(R):\n        for c in range(C):\n            s = 0\n            if r > 0: s += a[r-1][c]\n            if r < R - 1: s += a[r+1][c]\n            if c > 0: s += a[r][c-1]\n            if c < C - 1: s += a[r][c+1]\n            res[r][c] = s\n    return res",
      JAVA: "    static int[][] solve(int[][] a) {\n        if (a == null || a.length == 0) return new int[0][0];\n        int R = a.length, C = a[0].length;\n        int[][] res = new int[R][C];\n        for (int r = 0; r < R; r++) {\n            for (int c = 0; c < C; c++) {\n                int sum = 0;\n                if (r > 0) sum += a[r-1][c];\n                if (r < R - 1) sum += a[r+1][c];\n                if (c > 0) sum += a[r][c-1];\n                if (c < C - 1) sum += a[r][c+1];\n                res[r][c] = sum;\n            }\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<vector<int>> solve(vector<vector<int>> a) {\n    if (a.empty() || a[0].empty()) return {};\n    int R = a.size(), C = a[0].size();\n    vector<vector<int>> res(R, vector<int>(C, 0));\n    for (int r = 0; r < R; r++) {\n        for (int c = 0; c < C; c++) {\n            int sum = 0;\n            if (r > 0) sum += a[r-1][c];\n            if (r < R - 1) sum += a[r+1][c];\n            if (c > 0) sum += a[r][c-1];\n            if (c < C - 1) sum += a[r][c+1];\n            res[r][c] = sum;\n        }\n    }\n    return res;\n}",
      GO: "func solve(a [][]int) [][]int {\n    if len(a) == 0 || len(a[0]) == 0 {\n        return [][]int{}\n    }\n    R, C := len(a), len(a[0])\n    res := make([][]int, R)\n    for r := 0; r < R; r++ {\n        res[r] = make([]int, C)\n        for c := 0; c < C; c++ {\n            sum := 0\n            if r > 0 { sum += a[r-1][c] }\n            if r < R - 1 { sum += a[r+1][c] }\n            if c > 0 { sum += a[r][c-1] }\n            if c < C - 1 { sum += a[r][c+1] }\n            res[r][c] = sum\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2;3 4", expectedStdout: "5 5;5 5", isSample: true },
      { stdin: "10", expectedStdout: "0", isSample: true },
      { stdin: "1 1 1;1 1 1;1 1 1", expectedStdout: "2 3 2;3 4 3;2 3 2" },
      { stdin: "0 5;5 0", expectedStdout: "10 0;0 10" },
      { stdin: "2 2;2 2", expectedStdout: "4 4;4 4" },
      { stdin: "1 2 3", expectedStdout: "2 4 2" },
      { stdin: "1;2;3", expectedStdout: "2;4;2" },
      { stdin: "10 20 30;40 50 60", expectedStdout: "60 90 80;60 120 80" },
    ],
  }),
];
