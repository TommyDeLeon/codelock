import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w2-061` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W2_061_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "longest-continuous-working-shift",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Windy vs Rainy Streaks",
    patternTags: ["strings","counting","loops","simulation"],
    signatureId: "fn:string->bool",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing a local weather log over a period of time. The log is represented by a string `log` consisting entirely of the characters `'W'` (indicating a Windy day) and `'R'` (indicating a Rainy day).\n\nDetermine if the longest uninterrupted sequence of windy days is strictly greater in length than the longest uninterrupted sequence of rainy days. If it is, return `true`; otherwise, return `false`.\n\n**Constraints**\n- `1 <= log.length <= 100`\n- `log[i]` is either `'W'` or `'R'`.\n\n**Example 1**\n```\ninput:\nWWWRRW\noutput:\ntrue\n```\n*Explanation: The longest unbroken streak of 'W's spans 3 days, whereas the longest unbroken streak of 'R's spans 2 days. Because 3 > 2, the result is true.*\n\n**Example 2**\n```\ninput:\nWWRRRW\noutput:\nfalse\n```\n*Explanation: The longest consecutive sequence of 'W's has length 2, and the longest sequence of 'R's has length 3. Since 2 is not strictly greater than 3, the result is false.*\n\n**Example 3**\n```\ninput:\nWR\noutput:\nfalse\n```\n*Explanation: Both types of weather have a maximum streak of 1 day. Because 1 is not strictly greater than 1, the result is false.*\n\n**Follow-up**\nCan you figure out a way to evaluate this in a single pass with O(1) auxiliary space?",
    editorialMarkdown: "## Longest Continuous Working Shift\n\nThis problem requires us to compare the longest consecutive sequence of 'W' (working) characters with the longest consecutive sequence of 'R' (resting) characters in a given string.\n\nWe can solve this by iterating through the string and maintaining two sets of variables: the current sequence length of 'W's and 'R's, and the maximum sequence length seen so far for each. When we encounter a 'W', we increment the current 'W' count and reset the current 'R' count to 0, updating the maximum 'W' count if necessary. We do the inverse when we encounter an 'R'. Finally, we simply return whether the maximum 'W' count is strictly greater than the maximum 'R' count.\n\n**Trap**: A common mistake is to forget to reset the counter for the *other* character when a run ends, or to compare the total counts instead of the longest contiguous segment.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string, since we only need one pass through the string.\n- **Space:** O(1) as we only use a few integer variables to keep track of counts.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let maxW = 0, maxR = 0;\n    let currW = 0, currR = 0;\n    for (let c of a) {\n        if (c === 'W') {\n            currW++;\n            currR = 0;\n            maxW = Math.max(maxW, currW);\n        } else if (c === 'R') {\n            currR++;\n            currW = 0;\n            maxR = Math.max(maxR, currR);\n        }\n    }\n    return maxW > maxR;\n}",
      TYPESCRIPT: "function solve(a: string): boolean {\n    let maxW = 0, maxR = 0;\n    let currW = 0, currR = 0;\n    for (let c of a) {\n        if (c === 'W') {\n            currW++;\n            currR = 0;\n            maxW = Math.max(maxW, currW);\n        } else if (c === 'R') {\n            currR++;\n            currW = 0;\n            maxR = Math.max(maxR, currR);\n        }\n    }\n    return maxW > maxR;\n}",
      PYTHON: "def solve(a):\n    max_w = max_r = 0\n    curr_w = curr_r = 0\n    for c in a:\n        if c == 'W':\n            curr_w += 1\n            curr_r = 0\n            max_w = max(max_w, curr_w)\n        elif c == 'R':\n            curr_r += 1\n            curr_w = 0\n            max_r = max(max_r, curr_r)\n    return max_w > max_r",
      JAVA: "    static boolean solve(String a) {\n        int maxW = 0, maxR = 0;\n        int currW = 0, currR = 0;\n        for (char c : a.toCharArray()) {\n            if (c == 'W') {\n                currW++;\n                currR = 0;\n                maxW = Math.max(maxW, currW);\n            } else if (c == 'R') {\n                currR++;\n                currW = 0;\n                maxR = Math.max(maxR, currR);\n            }\n        }\n        return maxW > maxR;\n    }",
      CPP: "#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nbool solve(string a) {\n    int maxW = 0, maxR = 0;\n    int currW = 0, currR = 0;\n    for (char c : a) {\n        if (c == 'W') {\n            currW++;\n            currR = 0;\n            maxW = max(maxW, currW);\n        } else if (c == 'R') {\n            currR++;\n            currW = 0;\n            maxR = max(maxR, currR);\n        }\n    }\n    return maxW > maxR;\n}",
      GO: "func solve(a string) bool {\n    maxW, maxR := 0, 0\n    currW, currR := 0, 0\n    for i := 0; i < len(a); i++ {\n        if a[i] == 'W' {\n            currW++\n            currR = 0\n            if currW > maxW { maxW = currW }\n        } else if a[i] == 'R' {\n            currR++\n            currW = 0\n            if currR > maxR { maxR = currR }\n        }\n    }\n    return maxW > maxR\n}",
    },
    tests: [
      { stdin: "WWWRRW", expectedStdout: "true", isSample: true },
      { stdin: "WWRRRW", expectedStdout: "false", isSample: true },
      { stdin: "WR", expectedStdout: "false" },
      { stdin: "R", expectedStdout: "false" },
      { stdin: "W", expectedStdout: "true" },
      { stdin: "WWWRRWRRR", expectedStdout: "false" },
      { stdin: "WWWWWW", expectedStdout: "true" },
      { stdin: "RRRRRR", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "longest-oscillating-temperature-sequence",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Zig-Zag Stock Fluctuations",
    patternTags: ["arrays","subarray","counting","simulation"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are studying the historical trading data of a particular stock. You are given an array of integers `prices` representing the stock's closing price on consecutive days.\n\nYour goal is to determine the length of the longest contiguous subarray of `prices` that forms a *zig-zag pattern*. \nA zig-zag pattern is defined as a subarray of at least 2 days where the differences between consecutive days strictly alternate between `1` and `-1`, beginning with a difference of `1`.\n\nIn other words, a subarray `prices[i], prices[i+1], ..., prices[i+k]` qualifies if:\n- `prices[i+1] - prices[i] == 1`\n- `prices[i+2] - prices[i+1] == -1`\n- `prices[i+3] - prices[i+2] == 1`\n- and this alternating pattern continues.\n\nReturn the maximum length of such a pattern. If no such pattern can be found, return `-1`.\n\n**Constraints**\n- `2 <= prices.length <= 100`\n- `-100 <= prices[i] <= 100`\n\n**Example 1**\n```\ninput:\n2 3 4 3 4\noutput:\n4\n```\n*Explanation: The subarray [3, 4, 3, 4] follows the zig-zag rules with differences (4-3)=1, (3-4)=-1, (4-3)=1. The length is 4.*\n\n**Example 2**\n```\ninput:\n4 5 6\noutput:\n2\n```\n*Explanation: A valid zig-zag pattern could be [4, 5] (or [5, 6]), which only requires a single step difference of 1. The maximum length here is 2.*\n\n**Example 3**\n```\ninput:\n10 9 8\noutput:\n-1\n```\n*Explanation: No two adjacent prices have a positive difference of 1, hence no zig-zag pattern exists.*\n\n**Follow-up**\nCan you find a solution that operates in O(N) time complexity?",
    editorialMarkdown: "## Longest Oscillating Temperature Sequence\n\nThis problem asks us to find the length of the longest contiguous subarray where the differences between adjacent elements strictly alternate between `1` and `-1`, and the first difference must be `1`.\n\nWe can iterate through the array and use a pointer or a loop to explore all possible valid alternating sequences starting at each index. Since any valid sequence of length L implies we can just scan greedily, if a sequence breaks, we can potentially start a new sequence from the element where it broke. A nested loop checking all possible starting positions is straightforward and runs in O(N^2) time. Alternatively, you can maintain the expected next difference (+1 or -1) and track the current length in O(N) time.\n\n**Trap**: A common mistake is not strictly enforcing that the sequence must *start* with a difference of `1`, or failing to consider subarrays that start midway through the array. Also, if no such subarray of length >= 2 exists, we must remember to return `-1`.\n\n**Complexity:**\n- **Time:** O(N) or O(N^2), where N is the length of the array, both of which easily pass within the constraints.\n- **Space:** O(1), since we only track the maximum length and current indices.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let maxLen = -1;\n    for (let i = 0; i < a.length; i++) {\n        let expectedDiff = 1;\n        let currentLen = 1;\n        for (let j = i + 1; j < a.length; j++) {\n            if (a[j] - a[j - 1] === expectedDiff) {\n                currentLen++;\n                expectedDiff *= -1;\n            } else {\n                break;\n            }\n        }\n        if (currentLen > 1) {\n            maxLen = Math.max(maxLen, currentLen);\n        }\n    }\n    return maxLen;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    let maxLen = -1;\n    for (let i = 0; i < a.length; i++) {\n        let expectedDiff = 1;\n        let currentLen = 1;\n        for (let j = i + 1; j < a.length; j++) {\n            if (a[j] - a[j - 1] === expectedDiff) {\n                currentLen++;\n                expectedDiff *= -1;\n            } else {\n                break;\n            }\n        }\n        if (currentLen > 1) {\n            maxLen = Math.max(maxLen, currentLen);\n        }\n    }\n    return maxLen;\n}",
      PYTHON: "def solve(a):\n    max_len = -1\n    for i in range(len(a)):\n        expected_diff = 1\n        curr_len = 1\n        for j in range(i + 1, len(a)):\n            if a[j] - a[j - 1] == expected_diff:\n                curr_len += 1\n                expected_diff *= -1\n            else:\n                break\n        if curr_len > 1:\n            max_len = max(max_len, curr_len)\n    return max_len",
      JAVA: "    static int solve(int[] a) {\n        int maxLen = -1;\n        for (int i = 0; i < a.length; i++) {\n            int expectedDiff = 1;\n            int currentLen = 1;\n            for (int j = i + 1; j < a.length; j++) {\n                if (a[j] - a[j - 1] == expectedDiff) {\n                    currentLen++;\n                    expectedDiff *= -1;\n                } else {\n                    break;\n                }\n            }\n            if (currentLen > 1) {\n                maxLen = Math.max(maxLen, currentLen);\n            }\n        }\n        return maxLen;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(vector<int> a) {\n    int maxLen = -1;\n    for (int i = 0; i < a.size(); ++i) {\n        int expectedDiff = 1;\n        int currentLen = 1;\n        for (int j = i + 1; j < a.size(); ++j) {\n            if (a[j] - a[j - 1] == expectedDiff) {\n                currentLen++;\n                expectedDiff *= -1;\n            } else {\n                break;\n            }\n        }\n        if (currentLen > 1) {\n            maxLen = max(maxLen, currentLen);\n        }\n    }\n    return maxLen;\n}",
      GO: "func solve(a []int) int {\n    maxLen := -1\n    for i := 0; i < len(a); i++ {\n        expectedDiff := 1\n        currentLen := 1\n        for j := i + 1; j < len(a); j++ {\n            if a[j] - a[j-1] == expectedDiff {\n                currentLen++\n                expectedDiff *= -1\n            } else {\n                break\n            }\n        }\n        if currentLen > 1 && currentLen > maxLen {\n            maxLen = currentLen\n        }\n    }\n    return maxLen\n}",
    },
    tests: [
      { stdin: "2 3 4 3 4", expectedStdout: "4", isSample: true },
      { stdin: "4 5 6", expectedStdout: "2", isSample: true },
      { stdin: "10 9 8", expectedStdout: "-1" },
      { stdin: "1 2", expectedStdout: "2" },
      { stdin: "1 2 1 2 1 2", expectedStdout: "6" },
      { stdin: "5 6 5 6 5 4", expectedStdout: "5" },
      { stdin: "-5 -4 -5 -4", expectedStdout: "4" },
      { stdin: "1 1 1 1", expectedStdout: "-1" },
    ],
  }),

  p({
    ...base,
    slug: "drone-watering-sequence",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Helicopter Search Operations",
    patternTags: ["matrix","sorting","manhattan-distance","arrays"],
    signatureId: "fn:ints->matrix",
    avgSolveSeconds: 800,
    promptMarkdown: "A rescue helicopter needs to search a grid of terrain sectors for a missing hiker. The search initiates from a specific sector and expands outward, prioritizing sectors based on their Manhattan distance from the starting location in ascending order.\n\nYou receive an array of 4 integers `gridInfo` structured as `[rows, cols, startRow, startCol]`:\n- `rows` and `cols` dictate the overall dimensions of the search grid.\n- `startRow` and `startCol` denote the 0-indexed coordinates of the helicopter's starting sector.\n\nReturn a 2D array of coordinate pairs `[r, c]` that indicates the exact order in which sectors are searched. \nIf two or more sectors share the same Manhattan distance from the starting point, resolve ties by choosing the sector with the smaller row index first. If the row indices are also identical, choose the smaller column index.\n\n*Note: The Manhattan distance between sector `(r1, c1)` and sector `(r2, c2)` is calculated as `|r1 - r2| + |c1 - c2|`.*\n\n**Constraints**\n- `gridInfo.length == 4`\n- `1 <= rows, cols <= 20`\n- `0 <= startRow < rows`\n- `0 <= startCol < cols`\n\n**Example 1**\n```\ninput:\n1 2 0 0\noutput:\n0 0;0 1\n```\n*Explanation: The starting sector (0,0) is at distance 0. Sector (0,1) is at distance 1.*\n\n**Example 2**\n```\ninput:\n2 2 0 1\noutput:\n0 1;0 0;1 1;1 0\n```\n*Explanation: Sector (0,1) is at distance 0. Sectors (0,0) and (1,1) are both at distance 1. Between them, (0,0) is ordered first because its row index is smaller. Sector (1,0) is furthest at distance 2.*\n\n**Example 3**\n```\ninput:\n2 3 1 2\noutput:\n1 2;0 2;1 1;0 1;1 0;0 0\n```\n*Explanation: Starting at sector (1,2), all other sectors are ordered strictly by their Manhattan distance, followed by row index, then column index.*\n\n**Follow-up**\nCan you implement a method to generate these coordinates in O(R * C) time using a Breadth-First Search instead of a full sort?",
    editorialMarkdown: "## Drone Watering Sequence\n\nThe goal is to sort all cells of an `R x C` grid based on their Manhattan distance from a starting cell `(r0, c0)`. When two cells share the same distance, we resolve the tie by their row index (ascending), and then by their column index (ascending).\n\nA straightforward approach is to simply generate all possible `(r, c)` coordinates in the grid, add them to a list, and then sort that list using a custom comparator. The Manhattan distance is calculated as `abs(r - r0) + abs(c - c0)`. \n\n**Trap**: Many solvers easily implement the distance sorting but forget or mess up the tie-breaking condition. Without strictly ordering by row and then column on a tie, the output might be considered incorrect.\n\n**Complexity:**\n- **Time:** O(N * log(N)), where N = R * C is the total number of cells in the grid, due to the sorting step. \n- **Space:** O(N) to store the result array of all coordinates.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let R = a[0], C = a[1], r0 = a[2], c0 = a[3];\n    let res = [];\n    for (let r = 0; r < R; r++) {\n        for (let c = 0; c < C; c++) {\n            res.push([r, c]);\n        }\n    }\n    res.sort((p1, p2) => {\n        let d1 = Math.abs(p1[0] - r0) + Math.abs(p1[1] - c0);\n        let d2 = Math.abs(p2[0] - r0) + Math.abs(p2[1] - c0);\n        if (d1 !== d2) return d1 - d2;\n        if (p1[0] !== p2[0]) return p1[0] - p2[0];\n        return p1[1] - p2[1];\n    });\n    return res;\n}",
      TYPESCRIPT: "function solve(a: number[]): number[][] {\n    let R = a[0], C = a[1], r0 = a[2], c0 = a[3];\n    let res: number[][] = [];\n    for (let r = 0; r < R; r++) {\n        for (let c = 0; c < C; c++) {\n            res.push([r, c]);\n        }\n    }\n    res.sort((p1, p2) => {\n        let d1 = Math.abs(p1[0] - r0) + Math.abs(p1[1] - c0);\n        let d2 = Math.abs(p2[0] - r0) + Math.abs(p2[1] - c0);\n        if (d1 !== d2) return d1 - d2;\n        if (p1[0] !== p2[0]) return p1[0] - p2[0];\n        return p1[1] - p2[1];\n    });\n    return res;\n}",
      PYTHON: "def solve(a):\n    R, C, r0, c0 = a\n    res = []\n    for r in range(R):\n        for c in range(C):\n            res.append([r, c])\n    res.sort(key=lambda p: (abs(p[0] - r0) + abs(p[1] - c0), p[0], p[1]))\n    return res",
      JAVA: "    static int[][] solve(int[] a) {\n        int R = a[0], C = a[1], r0 = a[2], c0 = a[3];\n        int[][] res = new int[R * C][2];\n        int idx = 0;\n        for (int r = 0; r < R; r++) {\n            for (int c = 0; c < C; c++) {\n                res[idx++] = new int[]{r, c};\n            }\n        }\n        java.util.Arrays.sort(res, (p1, p2) -> {\n            int d1 = Math.abs(p1[0] - r0) + Math.abs(p1[1] - c0);\n            int d2 = Math.abs(p2[0] - r0) + Math.abs(p2[1] - c0);\n            if (d1 != d2) return Integer.compare(d1, d2);\n            if (p1[0] != p2[0]) return Integer.compare(p1[0], p2[0]);\n            return Integer.compare(p1[1], p2[1]);\n        });\n        return res;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n#include <cmath>\n\nusing namespace std;\n\nvector<vector<int>> solve(vector<int> a) {\n    int R = a[0], C = a[1], r0 = a[2], c0 = a[3];\n    vector<vector<int>> res;\n    for (int r = 0; r < R; ++r) {\n        for (int c = 0; c < C; ++c) {\n            res.push_back({r, c});\n        }\n    }\n    sort(res.begin(), res.end(), [&](const vector<int>& p1, const vector<int>& p2) {\n        int d1 = abs(p1[0] - r0) + abs(p1[1] - c0);\n        int d2 = abs(p2[0] - r0) + abs(p2[1] - c0);\n        if (d1 != d2) return d1 < d2;\n        if (p1[0] != p2[0]) return p1[0] < p2[0];\n        return p1[1] < p2[1];\n    });\n    return res;\n}",
      GO: "func solve(a []int) [][]int {\n    R, C, r0, c0 := a[0], a[1], a[2], a[3]\n    var res [][]int\n    for r := 0; r < R; r++ {\n        for c := 0; c < C; c++ {\n            res = append(res, []int{r, c})\n        }\n    }\n    abs := func(x int) int {\n        if x < 0 { return -x }\n        return x\n    }\n    dist := func(p []int) int {\n        return abs(p[0]-r0) + abs(p[1]-c0)\n    }\n    n := len(res)\n    for i := 0; i < n; i++ {\n        for j := 0; j < n-i-1; j++ {\n            d1 := dist(res[j])\n            d2 := dist(res[j+1])\n            swap := false\n            if d1 > d2 {\n                swap = true\n            } else if d1 == d2 {\n                if res[j][0] > res[j+1][0] {\n                    swap = true\n                } else if res[j][0] == res[j+1][0] && res[j][1] > res[j+1][1] {\n                    swap = true\n                }\n            }\n            if swap {\n                res[j], res[j+1] = res[j+1], res[j]\n            }\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 0 0", expectedStdout: "0 0;0 1", isSample: true },
      { stdin: "2 2 0 1", expectedStdout: "0 1;0 0;1 1;1 0", isSample: true },
      { stdin: "2 3 1 2", expectedStdout: "1 2;0 2;1 1;0 1;1 0;0 0" },
      { stdin: "1 1 0 0", expectedStdout: "0 0" },
      { stdin: "3 3 1 1", expectedStdout: "1 1;0 1;1 0;1 2;2 1;0 0;0 2;2 0;2 2" },
      { stdin: "3 2 1 0", expectedStdout: "1 0;0 0;1 1;2 0;0 1;2 1" },
      { stdin: "1 3 0 0", expectedStdout: "0 0;0 1;0 2" },
      { stdin: "1 4 0 1", expectedStdout: "0 1;0 0;0 2;0 3" },
    ],
  }),

  p({
    ...base,
    slug: "maximize-accounting-profits",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GREEDY",
    title: "Optimal Spell Casting",
    patternTags: ["greedy","sorting","arrays","math"],
    signatureId: "fn:ints,int->int",
    avgSolveSeconds: 700,
    promptMarkdown: "You are playing a role-playing game where you encounter a lineup of enemies, each with a specific power level represented by an integer array `powers`. You possess a wand that must cast a polarity-reversing spell exactly `k` times on the enemies. Each time a spell is cast, the target enemy's power level is multiplied by `-1`.\n\nYou are allowed to target the same enemy multiple times with the spell.\n\nYour objective is to maximize the sum of all enemy power levels after casting exactly `k` spells. Return this maximum possible sum.\n\n**Constraints**\n- `1 <= powers.length <= 100`\n- `-100 <= powers[i] <= 100`\n- `1 <= k <= 1000`\n\n**Example 1**\n```\ninput:\n4 2 3\n1\noutput:\n5\n```\n*Explanation: The initial array is [4, 2, 3]. We are required to cast 1 spell. Targeting the 2 turns it into -2, resulting in [4, -2, 3]. The total sum is 5.*\n\n**Example 2**\n```\ninput:\n3 -1 0 2\n3\noutput:\n6\n```\n*Explanation: We first cast a spell on -1 to make it 1 (2 spells remaining). We then cast the remaining 2 spells on the 0, leaving it unchanged. The final array is [3, 1, 0, 2], which sums to 6.*\n\n**Example 3**\n```\ninput:\n2 -3 -1 5 -4\n2\noutput:\n13\n```\n*Explanation: We cast one spell on -4 (making it 4) and one on -3 (making it 3). The array shifts to [2, 3, -1, 5, 4], totaling a sum of 13.*\n\n**Follow-up**\nCan you determine the optimal sum without a full array sort by using a priority queue or maintaining a frequency map?",
    editorialMarkdown: "## Maximize Accounting Profits\n\nThis is a classic greedy problem. To maximize the final sum, we should always try to turn the most negative numbers into positive numbers. \n\nA standard approach is to sort the array in ascending order. Then, iterate through the array and flip negative numbers to positive as long as we still have flips left (`k > 0`). If we exhaust all negative numbers and still have flips remaining, we need to handle them carefully. Since we can flip the same number multiple times, flipping a number twice has no net effect. Therefore, if the remaining `k` is even, we do nothing. If `k` is odd, we must flip one number once, which will decrease our total sum. To minimize this decrease, we should flip the element that currently has the smallest absolute value.\n\n**Trap**: If all negative numbers are flipped and `k` is odd, the smallest absolute value might be a number that was originally negative and just got flipped to positive. Re-sorting the array or keeping track of the minimum absolute value seen so far is critical to avoid mistakenly flipping a larger number.\n\n**Complexity:**\n- **Time:** O(N * log(N)) where N is the length of the array, bounded by the sorting step.\n- **Space:** O(1) or O(N) depending on the sorting algorithm used by the language.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a, k) {\n    a.sort((x, y) => x - y);\n    for (let i = 0; i < a.length && k > 0 && a[i] < 0; i++) {\n        a[i] = -a[i];\n        k--;\n    }\n    a.sort((x, y) => x - y);\n    if (k % 2 === 1) {\n        a[0] = -a[0];\n    }\n    return a.reduce((sum, val) => sum + val, 0);\n}",
      TYPESCRIPT: "function solve(a: number[], k: number): number {\n    a.sort((x, y) => x - y);\n    for (let i = 0; i < a.length && k > 0 && a[i] < 0; i++) {\n        a[i] = -a[i];\n        k--;\n    }\n    a.sort((x, y) => x - y);\n    if (k % 2 === 1) {\n        a[0] = -a[0];\n    }\n    return a.reduce((sum, val) => sum + val, 0);\n}",
      PYTHON: "def solve(a, k):\n    a.sort()\n    for i in range(len(a)):\n        if k > 0 and a[i] < 0:\n            a[i] = -a[i]\n            k -= 1\n    a.sort()\n    if k % 2 == 1:\n        a[0] = -a[0]\n    return sum(a)",
      JAVA: "    static int solve(int[] a, int k) {\n        java.util.Arrays.sort(a);\n        for (int i = 0; i < a.length && k > 0 && a[i] < 0; i++) {\n            a[i] = -a[i];\n            k--;\n        }\n        java.util.Arrays.sort(a);\n        if (k % 2 == 1) {\n            a[0] = -a[0];\n        }\n        int sum = 0;\n        for (int x : a) {\n            sum += x;\n        }\n        return sum;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n#include <cmath>\n\nusing namespace std;\n\nint solve(vector<int> a, int k) {\n    sort(a.begin(), a.end());\n    for (int i = 0; i < a.size() && k > 0 && a[i] < 0; ++i) {\n        a[i] = -a[i];\n        k--;\n    }\n    sort(a.begin(), a.end());\n    if (k % 2 == 1) {\n        a[0] = -a[0];\n    }\n    int sum = 0;\n    for (int x : a) {\n        sum += x;\n    }\n    return sum;\n}",
      GO: "func solve(a []int, k int) int {\n    n := len(a)\n    for i := 0; i < n; i++ {\n        for j := 0; j < n-i-1; j++ {\n            if a[j] > a[j+1] {\n                a[j], a[j+1] = a[j+1], a[j]\n            }\n        }\n    }\n    for i := 0; i < n && k > 0 && a[i] < 0; i++ {\n        a[i] = -a[i]\n        k--\n    }\n    for i := 0; i < n; i++ {\n        for j := 0; j < n-i-1; j++ {\n            if a[j] > a[j+1] {\n                a[j], a[j+1] = a[j+1], a[j]\n            }\n        }\n    }\n    if k%2 == 1 {\n        a[0] = -a[0]\n    }\n    sum := 0\n    for _, x := range a {\n        sum += x\n    }\n    return sum\n}",
    },
    tests: [
      { stdin: "4 2 3\n1", expectedStdout: "5", isSample: true },
      { stdin: "3 -1 0 2\n3", expectedStdout: "6", isSample: true },
      { stdin: "2 -3 -1 5 -4\n2", expectedStdout: "13" },
      { stdin: "10\n2", expectedStdout: "10" },
      { stdin: "10\n1", expectedStdout: "-10" },
      { stdin: "-8 3 -5 -9\n3", expectedStdout: "25" },
      { stdin: "-8 3 -5 -9\n4", expectedStdout: "19" },
      { stdin: "0\n5", expectedStdout: "0" },
    ],
  }),

  p({
    ...base,
    slug: "maximum-directory-depth",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TREES",
    title: "Longest Chain of Command",
    patternTags: ["trees","dfs","recursion","depth"],
    signatureId: "fn:tree->int",
    avgSolveSeconds: 400,
    promptMarkdown: "A corporation's hierarchy is mapped out as a binary tree, where each node stands for an employee. You are provided with the `root` node of this organizational structure.\n\nCalculate the maximum depth of the hierarchy. This depth corresponds to the number of individuals along the longest path from the top executive (the root) down to the lowest-level employee (a leaf node).\n\n**Constraints**\n- The number of nodes in the tree is in the range `[1, 1000]`.\n- `-100 <= Node.val <= 100`\n\n**Example 1**\n```\ninput:\n1 2 3 null null 4 5\noutput:\n3\n```\n*Explanation: The longest reporting chain is 1 -> 3 -> 4 (or alternatively 1 -> 3 -> 5), consisting of 3 individuals.*\n\n**Example 2**\n```\ninput:\n1\noutput:\n1\n```\n*Explanation: The structure contains only a single executive, so the depth is 1.*\n\n**Example 3**\n```\ninput:\n3 9 20 null null 15 7\noutput:\n3\n```\n*Explanation: The longest chain of command is 3 -> 20 -> 15 (or 3 -> 20 -> 7), which includes 3 people.*\n\n**Follow-up**\nCan you provide both a recursive Depth-First Search and an iterative Breadth-First Search implementation for this task?",
    editorialMarkdown: "## Maximum Directory Depth\n\nFinding the maximum depth of a binary tree is a classic recursion problem. The depth of any node in a tree is simply 1 plus the maximum depth of its left subtree and its right subtree.\n\nBy defining a simple recursive function that returns 0 if the tree is null, and `1 + max(depth(left), depth(right))` otherwise, we can elegantly traverse the entire tree to find the maximum depth. A Breadth-First Search (BFS) layer-by-layer traversal is also highly viable and would not encounter recursion depth limits on severely unbalanced trees.\n\n**Trap**: An empty tree must gracefully return a depth of 0 without throwing null reference exceptions.\n\n**Complexity:**\n- **Time:** O(N) where N is the number of nodes in the directory tree, because we must visit every node exactly once to determine the depth.\n- **Space:** O(H) where H is the height of the tree, representing the recursion stack overhead. In the worst case (a perfectly skewed tree), this is O(N).",
    referenceSolution: {
      JAVASCRIPT: "function solve(root) {\n    if (!root) return 0;\n    return 1 + Math.max(solve(root.left), solve(root.right));\n}",
      TYPESCRIPT: "function solve(root: TreeNode | null): number {\n    if (!root) return 0;\n    return 1 + Math.max(solve(root.left), solve(root.right));\n}",
      PYTHON: "def solve(root):\n    if not root:\n        return 0\n    return 1 + max(solve(root.left), solve(root.right))",
      JAVA: "    static int solve(TreeNode root) {\n        if (root == null) return 0;\n        return 1 + Math.max(solve(root.left), solve(root.right));\n    }",
      CPP: "#include <algorithm>\n\nusing namespace std;\n\n// struct TreeNode {\n//     int val;\n//     TreeNode *left;\n//     TreeNode *right;\n//     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n// };\n\nint solve(TreeNode* root) {\n    if (!root) return 0;\n    return 1 + max(solve(root->left), solve(root->right));\n}",
      GO: "// type TreeNode struct {\n//     Val int\n//     Left *TreeNode\n//     Right *TreeNode\n// }\n\nfunc solve(root *TreeNode) int {\n    if root == nil {\n        return 0\n    }\n    left := solve(root.Left)\n    right := solve(root.Right)\n    if left > right {\n        return 1 + left\n    }\n    return 1 + right\n}",
    },
    tests: [
      { stdin: "1 2 3 null null 4 5", expectedStdout: "3", isSample: true },
      { stdin: "1", expectedStdout: "1", isSample: true },
      { stdin: "3 9 20 null null 15 7", expectedStdout: "3", isSample: true },
      { stdin: "1 2", expectedStdout: "2" },
      { stdin: "1 2 null 3 null 4 null", expectedStdout: "4" },
      { stdin: "1 null 2 null 3 null 4", expectedStdout: "4" },
      { stdin: "1 2 3 4 5 6 7", expectedStdout: "3" },
      { stdin: "1 2 3", expectedStdout: "2" },
    ],
  }),
];
