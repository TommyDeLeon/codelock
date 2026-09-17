import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w4-058` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W4_058_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "count-lower-power-generators",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Count Outscored Players",
    patternTags: ["array","counting","brute-force"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "You are analyzing the results of a recent gaming tournament.\n\nYou are given an integer array `scores`, where `scores[i]` represents the points earned by the `i`-th player.\n\nReturn an array of the same length, where the `i`-th element is the number of players who scored strictly fewer points than `scores[i]`.\n\n**Constraints**\n- `0 <= scores.length <= 100`\n- `0 <= scores[i] <= 100`\n\n**Example 1**\n```\ninput:\n8 1 2 2 3\noutput:\n4 0 1 1 3\n```\n*Explanation: The player with 8 points outscored four players (with 1, 2, 2, 3 points). The player with 1 point outscored 0 players. The player with 2 points outscored one player (with 1 point).*\n\n**Example 2**\n```\ninput:\n6 5 4 8\noutput:\n2 1 0 3\n```\n*Explanation: The player with 6 points outscored the ones with 5 and 4. The player with 5 points outscored the one with 4. The player with 4 points outscored no one. The player with 8 points outscored everyone else.*\n\n**Example 3**\n```\ninput:\n7 7 7 7\noutput:\n0 0 0 0\n```\n*Explanation: Since all players achieved identical scores, no single player outscored any other.*\n\n**Follow-up**\nCan you optimize this process to run faster than O(N^2)?",
    editorialMarkdown: "## Count Lower Power Generators\n\nThe problem asks us to count how many items in an array are strictly less than each specific item. This is a classic counting problem often related to the **Prefix Sum** or **Sorting** patterns, but given the constraints, a direct **Brute Force** or **Counting** approach works perfectly.\n\nWe can iterate through the array and for each element, iterate through the array again to count how many elements are strictly smaller. Since the maximum length of the array is 100, an O(N^2) solution is perfectly acceptable.\n\n**Trap**: Failing to count correctly when there are duplicate values in the array. Ensure the check is strictly `<` rather than `<=`.\n\n**Complexity:**\n- **Time:** O(N^2) — For each of the N elements, we scan all N elements.\n- **Space:** O(N) — We store the counts in a new array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(powerLevels) {\n    let res = [];\n    for (let i = 0; i < powerLevels.length; i++) {\n        let count = 0;\n        for (let j = 0; j < powerLevels.length; j++) {\n            if (powerLevels[j] < powerLevels[i]) count++;\n        }\n        res.push(count);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(powerLevels: number[]): number[] {\n    let res: number[] = [];\n    for (let i = 0; i < powerLevels.length; i++) {\n        let count = 0;\n        for (let j = 0; j < powerLevels.length; j++) {\n            if (powerLevels[j] < powerLevels[i]) count++;\n        }\n        res.push(count);\n    }\n    return res;\n}",
      PYTHON: "def solve(powerLevels):\n    return [sum(1 for x in powerLevels if x < p) for p in powerLevels]",
      JAVA: "    static int[] solve(int[] powerLevels) {\n        int[] res = new int[powerLevels.length];\n        for (int i = 0; i < powerLevels.length; i++) {\n            int count = 0;\n            for (int j = 0; j < powerLevels.length; j++) {\n                if (powerLevels[j] < powerLevels[i]) count++;\n            }\n            res[i] = count;\n        }\n        return res;\n    }",
      CPP: "vector<int> solve(vector<int> powerLevels) {\n    vector<int> res(powerLevels.size());\n    for (int i = 0; i < powerLevels.size(); i++) {\n        int count = 0;\n        for (int j = 0; j < powerLevels.size(); j++) {\n            if (powerLevels[j] < powerLevels[i]) count++;\n        }\n        res[i] = count;\n    }\n    return res;\n}",
      GO: "func solve(powerLevels []int) []int {\n    res := make([]int, len(powerLevels))\n    for i := 0; i < len(powerLevels); i++ {\n        count := 0\n        for j := 0; j < len(powerLevels); j++ {\n            if powerLevels[j] < powerLevels[i] {\n                count++\n            }\n        }\n        res[i] = count\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "8 1 2 2 3", expectedStdout: "4 0 1 1 3", isSample: true },
      { stdin: "6 5 4 8", expectedStdout: "2 1 0 3", isSample: true },
      { stdin: "7 7 7 7", expectedStdout: "0 0 0 0" },
      { stdin: "", expectedStdout: "" },
      { stdin: "42", expectedStdout: "0" },
      { stdin: "10 20", expectedStdout: "0 1" },
      { stdin: "20 10", expectedStdout: "1 0" },
      { stdin: "100 0 50 25 75", expectedStdout: "4 0 2 1 3" },
    ],
  }),

  p({
    ...base,
    slug: "smooth-terrain-altitude",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Image Pixel Blur",
    patternTags: ["matrix","array","simulation"],
    signatureId: "fn:matrix->matrix",
    avgSolveSeconds: 800,
    promptMarkdown: "You are processing a grayscale digital photograph. The image data is represented as a 2D integer array `pixels`, where `pixels[i][j]` is the brightness level of a specific pixel.\n\nTo reduce visual noise, you must apply a blurring filter. The blurred brightness of a pixel is calculated as the floor of the average brightness of all valid surrounding pixels and the pixel itself. A pixel can have up to 8 surrounding pixels (adjacent vertically, horizontally, and diagonally).\n\nReturn the new, blurred 2D image array.\n\n**Constraints**\n- `1 <= pixels.length <= 20`\n- `1 <= pixels[0].length <= 20`\n- `0 <= pixels[i][j] <= 255`\n\n**Example 1**\n```\ninput:\n1 1 1;1 0 1;1 1 1\noutput:\n0 0 0;0 0 0;0 0 0\n```\n*Explanation: The center pixel at (1, 1) has a neighborhood sum of 8 across 9 pixels. The average is 8 / 9, which floors to 0. The edge and corner pixels also evaluate to a floored average of 0.*\n\n**Example 2**\n```\ninput:\n100 200 100;200 50 200;100 200 100\noutput:\n137 141 137;141 138 141;137 141 137\n```\n*Explanation: For the central pixel at (1, 1), the total brightness of its 9-pixel block is 1250. The floor of 1250 / 9 yields 138.*\n\n**Example 3**\n```\ninput:\n10 10 10\noutput:\n10 10 10\n```\n*Explanation: The image consists of a single row. Although the neighborhoods have fewer than 9 pixels, the averages all compute to exactly 10.*\n\n**Follow-up**\nIs it possible to perform this blur operation with O(1) extra space?",
    editorialMarkdown: "## Smooth Terrain Altitude\n\nThe problem requires applying a smoothing function to each cell in a 2D grid. This falls under the **Matrix** traversal pattern. For each element in the grid, we want to look at its surrounding neighbors (up to 8, plus itself) and calculate the average, rounding down.\n\nWe iterate over each row and column index `(i, j)`. For each cell, we iterate from `max(0, i - 1)` to `min(rows - 1, i + 1)` and similarly for the columns to safely sum all valid neighbor values without going out of bounds. The new values should be stored in a completely new grid to prevent our modifications from impacting the calculations of subsequent cells.\n\n**Trap**: Updating the grid in-place instead of creating a new output grid. If you update the grid as you iterate, later cells will use the *smoothed* values of earlier cells instead of their original values.\n\n**Complexity:**\n- **Time:** O(N * M) — We visit each of the N * M cells in the grid, and for each cell, we look at up to 9 cells (constant time).\n- **Space:** O(N * M) — We store the smoothed values in a new grid of the same dimensions.",
    referenceSolution: {
      JAVASCRIPT: "function solve(grid) {\n    if (!grid || grid.length === 0) return [];\n    let m = grid.length, n = grid[0].length;\n    let res = [];\n    for (let i = 0; i < m; i++) {\n        let row = [];\n        for (let j = 0; j < n; j++) {\n            let sum = 0, count = 0;\n            for (let r = Math.max(0, i - 1); r <= Math.min(m - 1, i + 1); r++) {\n                for (let c = Math.max(0, j - 1); c <= Math.min(n - 1, j + 1); c++) {\n                    sum += grid[r][c];\n                    count++;\n                }\n            }\n            row.push(Math.floor(sum / count));\n        }\n        res.push(row);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(grid: number[][]): number[][] {\n    if (!grid || grid.length === 0) return [];\n    let m = grid.length, n = grid[0].length;\n    let res: number[][] = [];\n    for (let i = 0; i < m; i++) {\n        let row: number[] = [];\n        for (let j = 0; j < n; j++) {\n            let sum = 0, count = 0;\n            for (let r = Math.max(0, i - 1); r <= Math.min(m - 1, i + 1); r++) {\n                for (let c = Math.max(0, j - 1); c <= Math.min(n - 1, j + 1); c++) {\n                    sum += grid[r][c];\n                    count++;\n                }\n            }\n            row.push(Math.floor(sum / count));\n        }\n        res.push(row);\n    }\n    return res;\n}",
      PYTHON: "def solve(grid):\n    if not grid: return []\n    m, n = len(grid), len(grid[0])\n    res = [[0]*n for _ in range(m)]\n    for i in range(m):\n        for j in range(n):\n            s = 0\n            c = 0\n            for r in range(max(0, i-1), min(m, i+2)):\n                for col in range(max(0, j-1), min(n, j+2)):\n                    s += grid[r][col]\n                    c += 1\n            res[i][j] = s // c\n    return res",
      JAVA: "    static int[][] solve(int[][] grid) {\n        if (grid == null || grid.length == 0) return new int[0][0];\n        int m = grid.length, n = grid[0].length;\n        int[][] res = new int[m][n];\n        for (int i = 0; i < m; i++) {\n            for (int j = 0; j < n; j++) {\n                int sum = 0, count = 0;\n                for (int r = Math.max(0, i - 1); r <= Math.min(m - 1, i + 1); r++) {\n                    for (int c = Math.max(0, j - 1); c <= Math.min(n - 1, j + 1); c++) {\n                        sum += grid[r][c];\n                        count++;\n                    }\n                }\n                res[i][j] = sum / count;\n            }\n        }\n        return res;\n    }",
      CPP: "vector<vector<int>> solve(vector<vector<int>> grid) {\n    if (grid.empty()) return {};\n    int m = grid.size(), n = grid[0].size();\n    vector<vector<int>> res(m, vector<int>(n));\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            int sum = 0, count = 0;\n            for (int r = max(0, i - 1); r <= min(m - 1, i + 1); r++) {\n                for (int c = max(0, j - 1); c <= min(n - 1, j + 1); c++) {\n                    sum += grid[r][c];\n                    count++;\n                }\n            }\n            res[i][j] = sum / count;\n        }\n    }\n    return res;\n}",
      GO: "func solve(grid [][]int) [][]int {\n    if len(grid) == 0 {\n        return [][]int{}\n    }\n    m, n := len(grid), len(grid[0])\n    res := make([][]int, m)\n    for i := 0; i < m; i++ {\n        res[i] = make([]int, n)\n        for j := 0; j < n; j++ {\n            sum, count := 0, 0\n            \n            rmin, rmax := i-1, i+1\n            if rmin < 0 { rmin = 0 }\n            if rmax > m-1 { rmax = m-1 }\n            \n            cmin, cmax := j-1, j+1\n            if cmin < 0 { cmin = 0 }\n            if cmax > n-1 { cmax = n-1 }\n            \n            for r := rmin; r <= rmax; r++ {\n                for c := cmin; c <= cmax; c++ {\n                    sum += grid[r][c]\n                    count++\n                }\n            }\n            res[i][j] = sum / count\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 1 1;1 0 1;1 1 1", expectedStdout: "0 0 0;0 0 0;0 0 0", isSample: true },
      { stdin: "100 200 100;200 50 200;100 200 100", expectedStdout: "137 141 137;141 138 141;137 141 137", isSample: true },
      { stdin: "10 10 10", expectedStdout: "10 10 10", isSample: true },
      { stdin: "0;10;0", expectedStdout: "5;3;5" },
      { stdin: "5", expectedStdout: "5" },
      { stdin: "10 20;30 40", expectedStdout: "25 25;25 25" },
      { stdin: "0 0;0 0", expectedStdout: "0 0;0 0" },
      { stdin: "255 255;255 255", expectedStdout: "255 255;255 255" },
    ],
  }),

  p({
    ...base,
    slug: "common-security-clearances",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Universal Ingredients",
    patternTags: ["array","hash-map","frequency-count"],
    signatureId: "fn:matrix->ints",
    avgSolveSeconds: 700,
    promptMarkdown: "You are analyzing recipes in a culinary database. You have an array `recipes`, which contains up to 3 lists. Each list is a strictly increasing sequence of ingredient IDs required to prepare a specific dish.\n\nYour goal is to identify the ingredient IDs that are required by *every* recipe in the input. Return a new array of these universal ingredient IDs in strictly increasing order. If there are no common ingredients, or if no recipes are provided, return an empty array.\n\n**Constraints**\n- `0 <= recipes.length <= 3`\n- `0 <= recipes[i].length <= 20`\n- Ingredient IDs are non-negative integers.\n- Each array `recipes[i]` is strictly increasing.\n\n**Example 1**\n```\ninput:\n1 2 3;2 3 4;3 4 5\noutput:\n3\n```\n*Explanation: The only ingredient ID required by all three recipes is 3.*\n\n**Example 2**\n```\ninput:\n1 2;3 4;5 6\noutput:\n\n```\n*Explanation: There are no ingredient IDs shared across all the recipes, resulting in an empty array.*\n\n**Example 3**\n```\ninput:\n1 10 20;10 20 30;20 30 40\noutput:\n20\n```\n*Explanation: The only common ingredient ID is 20.*\n\n**Follow-up**\nCan you solve it in O(1) extra space using pointers?",
    editorialMarkdown: "## Common Security Clearances\n\nThe problem asks us to find items that appear in every one of the given sorted arrays (in this case, 3 arrays). This is a great use case for **Frequency Counting** or the **Two Pointers** pattern expanded to multiple arrays.\n\nSince we are guaranteed that each array is strictly increasing, there are no duplicates within any single array. This simplifies things immensely: an element appears in all arrays if and only if its total frequency across all arrays is exactly equal to the number of arrays.\n\nWe can iterate through all arrays and keep a frequency count using a hash map. Then we iterate over the first array and collect elements whose frequency is equal to `lists.length`. We return these elements as our output.\n\n**Trap**: If you do not use the first array to filter your answer, iterating through the hash map keys directly might result in the output list being unsorted. Utilizing the first array inherently maintains the ascending order.\n\n**Complexity:**\n- **Time:** O(N) — Where N is the total number of elements across all lists.\n- **Space:** O(N) — We store up to N items in the frequency map.",
    referenceSolution: {
      JAVASCRIPT: "function solve(lists) {\n    if (!lists || lists.length === 0) return [];\n    let freq = new Map();\n    for (let list of lists) {\n        for (let x of list) {\n            freq.set(x, (freq.get(x) || 0) + 1);\n        }\n    }\n    let res = [];\n    for (let x of lists[0]) {\n        if (freq.get(x) === lists.length) res.push(x);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(lists: number[][]): number[] {\n    if (!lists || lists.length === 0) return [];\n    let freq = new Map<number, number>();\n    for (let list of lists) {\n        for (let x of list) {\n            freq.set(x, (freq.get(x) || 0) + 1);\n        }\n    }\n    let res: number[] = [];\n    for (let x of lists[0]) {\n        if (freq.get(x) === lists.length) res.push(x);\n    }\n    return res;\n}",
      PYTHON: "def solve(lists):\n    if not lists: return []\n    res = []\n    if len(lists) == 0: return res\n    freq = {}\n    for l in lists:\n        for x in l:\n            freq[x] = freq.get(x, 0) + 1\n    for x in lists[0]:\n        if freq[x] == len(lists):\n            res.append(x)\n    return res",
      JAVA: "    static int[] solve(int[][] lists) {\n        if (lists == null || lists.length == 0) return new int[0];\n        java.util.Map<Integer, Integer> freq = new java.util.HashMap<>();\n        for (int[] list : lists) {\n            for (int x : list) {\n                freq.put(x, freq.getOrDefault(x, 0) + 1);\n            }\n        }\n        java.util.List<Integer> resList = new java.util.ArrayList<>();\n        for (int x : lists[0]) {\n            if (freq.get(x) == lists.length) {\n                resList.add(x);\n            }\n        }\n        int[] res = new int[resList.size()];\n        for (int i = 0; i < resList.size(); i++) {\n            res[i] = resList.get(i);\n        }\n        return res;\n    }",
      CPP: "vector<int> solve(vector<vector<int>> lists) {\n    if (lists.empty()) return {};\n    unordered_map<int, int> freq;\n    for (auto& list : lists) {\n        for (int x : list) {\n            freq[x]++;\n        }\n    }\n    vector<int> res;\n    for (int x : lists[0]) {\n        if (freq[x] == lists.size()) res.push_back(x);\n    }\n    return res;\n}",
      GO: "func solve(lists [][]int) []int {\n    if len(lists) == 0 {\n        return []int{}\n    }\n    freq := make(map[int]int)\n    for _, list := range lists {\n        for _, x := range list {\n            freq[x]++\n        }\n    }\n    res := []int{}\n    for _, x := range lists[0] {\n        if freq[x] == len(lists) {\n            res = append(res, x)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 3;2 3 4;3 4 5", expectedStdout: "3", isSample: true },
      { stdin: "1 2;3 4;5 6", expectedStdout: "", isSample: true },
      { stdin: "1 10 20;10 20 30;20 30 40", expectedStdout: "20", isSample: true },
      { stdin: "", expectedStdout: "" },
      { stdin: ";;", expectedStdout: "" },
      { stdin: "5;5;5", expectedStdout: "5" },
      { stdin: "1 2 3;1 2 3;1 2 3", expectedStdout: "1 2 3" },
      { stdin: "0;0;0", expectedStdout: "0" },
    ],
  }),

  p({
    ...base,
    slug: "highest-security-triplet",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "SLIDING_WINDOW",
    title: "Premium Serial Number",
    patternTags: ["string","substring","maximum"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 400,
    promptMarkdown: "You are inspecting the serial numbers of luxury watches to identify premium models.\n\nGiven a string `serial` made up entirely of digits, you must locate the maximum 3-digit substring that is formed by the exact same repeating digit. Return this 3-digit substring.\n\nIf the `serial` does not contain any such sequence of three identical digits, return an empty string.\n\n**Constraints**\n- `0 <= serial.length <= 1000`\n- `serial` consists only of digits from `'0'` to `'9'`.\n\n**Example 1**\n```\ninput:\n6777133339\noutput:\n777\n```\n*Explanation: The repeating triplets present are \"777\" and \"333\" (twice). The largest value among them is \"777\".*\n\n**Example 2**\n```\ninput:\n2300019\noutput:\n000\n```\n*Explanation: The only sequence of three identical digits is \"000\".*\n\n**Example 3**\n```\ninput:\n423569\noutput:\n\n```\n*Explanation: There are no three identical consecutive digits in this serial number.*\n\n**Follow-up**\nCould you optimize this loop to jump indices if a character doesn't match the preceding one?",
    editorialMarkdown: "## Highest Security Triplet\n\nThis problem asks for the largest 3-digit string composed of identical characters, applying a very narrow **Sliding Window** or linear scan approach on a string.\n\nWe iterate through the input string, examining each character and the next two. If all three characters are identical, we have found a valid triplet. Because we need the largest numeric value and strings containing numerical characters compare correctly alphabetically, we can simply store the maximum string found so far.\n\n**Trap**: Returning a smaller triplet if a larger one is found earlier in the string but the smaller one appears later. We must store the running maximum and strictly enforce comparisons, e.g. `'999' > '000'`.\n\n**Complexity:**\n- **Time:** O(N) — We scan the string once from left to right.\n- **Space:** O(1) — Storing the maximum triplet string requires negligible memory.",
    referenceSolution: {
      JAVASCRIPT: "function solve(code) {\n    let best = \"\";\n    for (let i = 0; i < code.length - 2; i++) {\n        if (code[i] === code[i+1] && code[i] === code[i+2]) {\n            let sub = code.substring(i, i+3);\n            if (best === \"\" || sub > best) {\n                best = sub;\n            }\n        }\n    }\n    return best;\n}",
      TYPESCRIPT: "function solve(code: string): string {\n    let best = \"\";\n    for (let i = 0; i < code.length - 2; i++) {\n        if (code[i] === code[i+1] && code[i] === code[i+2]) {\n            let sub = code.substring(i, i+3);\n            if (best === \"\" || sub > best) {\n                best = sub;\n            }\n        }\n    }\n    return best;\n}",
      PYTHON: "def solve(code):\n    best = \"\"\n    for i in range(len(code) - 2):\n        if code[i] == code[i+1] == code[i+2]:\n            sub = code[i:i+3]\n            if not best or sub > best:\n                best = sub\n    return best",
      JAVA: "    static String solve(String code) {\n        String best = \"\";\n        for (int i = 0; i < code.length() - 2; i++) {\n            if (code.charAt(i) == code.charAt(i+1) && code.charAt(i) == code.charAt(i+2)) {\n                String sub = code.substring(i, i+3);\n                if (best.isEmpty() || sub.compareTo(best) > 0) {\n                    best = sub;\n                }\n            }\n        }\n        return best;\n    }",
      CPP: "string solve(string code) {\n    string best = \"\";\n    for (int i = 0; i < (int)code.length() - 2; i++) {\n        if (code[i] == code[i+1] && code[i] == code[i+2]) {\n            string sub = code.substr(i, 3);\n            if (best == \"\" || sub > best) {\n                best = sub;\n            }\n        }\n    }\n    return best;\n}",
      GO: "func solve(code string) string {\n    best := \"\"\n    for i := 0; i < len(code)-2; i++ {\n        if code[i] == code[i+1] && code[i] == code[i+2] {\n            sub := code[i : i+3]\n            if best == \"\" || sub > best {\n                best = sub\n            }\n        }\n    }\n    return best\n}",
    },
    tests: [
      { stdin: "6777133339", expectedStdout: "777", isSample: true },
      { stdin: "2300019", expectedStdout: "000", isSample: true },
      { stdin: "423569", expectedStdout: "", isSample: true },
      { stdin: "", expectedStdout: "" },
      { stdin: "111", expectedStdout: "111" },
      { stdin: "9999", expectedStdout: "999" },
      { stdin: "111222", expectedStdout: "222" },
      { stdin: "888777999", expectedStdout: "999" },
    ],
  }),

  p({
    ...base,
    slug: "maximize-sensor-reading",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "HEAP_PRIORITY_QUEUE",
    title: "Optimal Train Configuration",
    patternTags: ["sorting","digits","greedy"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 800,
    promptMarkdown: "You are a dispatcher tasked with organizing train carriages. Each carriage has a single-digit identifier painted on it, and the entire train represents a large number. You have a switching yard that allows you to swap the positions of any two carriages, but with a strict limitation: carriages with odd identifiers can only be swapped with other odd carriages, and even identifiers can only be swapped with even carriages.\n\nGiven a positive integer `train`, determine the maximum possible numerical value the train could represent after performing any number of valid carriage swaps.\n\n**Constraints**\n- `1 <= train <= 10^9`\n\n**Example 1**\n```\ninput:\n1234\noutput:\n3412\n```\n*Explanation: The odd carriages are 1 and 3, which can be reordered to 3 and 1. The even carriages are 2 and 4, which can be reordered to 4 and 2. Maintaining the original parity positions, the maximum value is 3412.*\n\n**Example 2**\n```\ninput:\n65875\noutput:\n87655\n```\n*Explanation: The even carriages are 6 and 8, which can be sorted to 8, then 6. The odd carriages are 5, 7, and 5, which can be sorted to 7, 5, 5. The original parity sequence is Even-Odd-Even-Odd-Odd, which results in 87655.*\n\n**Example 3**\n```\ninput:\n10\noutput:\n10\n```\n*Explanation: No valid swaps can be made because there is exactly one odd carriage and one even carriage.*\n\n**Follow-up**\nCould you solve this using a frequency count instead of explicitly sorting arrays of digits?",
    editorialMarkdown: "## Maximize Sensor Reading\n\nThe problem asks us to rearrange the digits of a number to form the maximum possible value, but we can only swap digits if they have the same parity (both odd or both even). This means the parity of the digit at any index in the string will remain the same as the original number, but the actual digits will be sorted in descending order within those parity slots. This relates to **Sorting** or **Heap / Priority Queue**.\n\nA highly efficient and simple method is to use a frequency array for the digits `0-9`. We count the occurrences of all digits in the string. Then, we iterate over the original string's characters. We check the parity of the current character. We then find the largest available digit in our frequency array that matches this parity, append it to our result, and decrement its count.\n\n**Trap**: Trying to manually implement a bubble sort or actual array swaps. Simply picking the largest available digit for the current slot parity is drastically simpler.\n\n**Complexity:**\n- **Time:** O(N) — Where N is the number of digits in `reading`. We do a constant amount of work checking digit counts for each slot.\n- **Space:** O(N) — We store string representations of the number.",
    referenceSolution: {
      JAVASCRIPT: "function solve(reading) {\n    let s = reading.toString();\n    let counts = new Array(10).fill(0);\n    for (let i = 0; i < s.length; i++) {\n        counts[parseInt(s[i])]++;\n    }\n    let res = \"\";\n    for (let i = 0; i < s.length; i++) {\n        let parity = parseInt(s[i]) % 2;\n        for (let d = 9; d >= 0; d--) {\n            if (counts[d] > 0 && d % 2 === parity) {\n                res += d.toString();\n                counts[d]--;\n                break;\n            }\n        }\n    }\n    return parseInt(res);\n}",
      TYPESCRIPT: "function solve(reading: number): number {\n    let s = reading.toString();\n    let counts = new Array(10).fill(0);\n    for (let i = 0; i < s.length; i++) {\n        counts[parseInt(s[i])]++;\n    }\n    let res = \"\";\n    for (let i = 0; i < s.length; i++) {\n        let parity = parseInt(s[i]) % 2;\n        for (let d = 9; d >= 0; d--) {\n            if (counts[d] > 0 && d % 2 === parity) {\n                res += d.toString();\n                counts[d]--;\n                break;\n            }\n        }\n    }\n    return parseInt(res);\n}",
      PYTHON: "def solve(reading):\n    s = str(reading)\n    counts = [0] * 10\n    for ch in s:\n        counts[int(ch)] += 1\n    res = []\n    for ch in s:\n        parity = int(ch) % 2\n        for d in range(9, -1, -1):\n            if counts[d] > 0 and d % 2 == parity:\n                res.append(str(d))\n                counts[d] -= 1\n                break\n    return int(\"\".join(res))",
      JAVA: "    static int solve(int reading) {\n        String s = String.valueOf(reading);\n        int[] counts = new int[10];\n        for (int i = 0; i < s.length(); i++) {\n            counts[s.charAt(i) - '0']++;\n        }\n        StringBuilder res = new StringBuilder();\n        for (int i = 0; i < s.length(); i++) {\n            int parity = (s.charAt(i) - '0') % 2;\n            for (int d = 9; d >= 0; d--) {\n                if (counts[d] > 0 && d % 2 == parity) {\n                    res.append(d);\n                    counts[d]--;\n                    break;\n                }\n            }\n        }\n        return Integer.parseInt(res.toString());\n    }",
      CPP: "int solve(int reading) {\n    string s = to_string(reading);\n    vector<int> counts(10, 0);\n    for (char c : s) {\n        counts[c - '0']++;\n    }\n    string res = \"\";\n    for (char c : s) {\n        int parity = (c - '0') % 2;\n        for (int d = 9; d >= 0; d--) {\n            if (counts[d] > 0 && d % 2 == parity) {\n                res += to_string(d);\n                counts[d]--;\n                break;\n            }\n        }\n    }\n    return stoi(res);\n}",
      GO: "func solve(reading int) int {\n    s := strconv.Itoa(reading)\n    counts := make([]int, 10)\n    for i := 0; i < len(s); i++ {\n        counts[s[i]-'0']++\n    }\n    res := \"\"\n    for i := 0; i < len(s); i++ {\n        parity := (s[i] - '0') % 2\n        for d := 9; d >= 0; d-- {\n            if counts[d] > 0 && d%2 == int(parity) {\n                res += strconv.Itoa(d)\n                counts[d]--\n                break\n            }\n        }\n    }\n    val, _ := strconv.Atoi(res)\n    return val\n}",
    },
    tests: [
      { stdin: "1234", expectedStdout: "3412", isSample: true },
      { stdin: "65875", expectedStdout: "87655", isSample: true },
      { stdin: "10", expectedStdout: "10", isSample: true },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "2468", expectedStdout: "8642" },
      { stdin: "1357", expectedStdout: "7531" },
      { stdin: "2143", expectedStdout: "4321" },
      { stdin: "1111", expectedStdout: "1111" },
    ],
  }),
];
