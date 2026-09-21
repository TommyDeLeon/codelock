import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-047` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_047_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "stellar-grid-symmetry",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Stellar Grid Symmetry",
    patternTags: ["matrix","simulation"],
    signatureId: "fn:matrix->bool",
    avgSolveSeconds: 500,
    promptMarkdown: "A star chart is represented by an N \times N 2D matrix `chart` containing integer values (each representing a star's brightness).\n\nYour task is to determine if the star chart is perfectly symmetrical under a 90-degree clockwise rotation. In other words, return `true` if rotating the matrix 90 degrees clockwise results in the exact same matrix, and `false` otherwise.\n\n**Constraints**\n- `n == chart.length == chart[i].length`\n- `1 <= n <= 50`\n- `0 <= chart[i][j] <= 100`\n\n**Example 1**\n```\ninput:\n1 1;1 1\noutput: true\n```\n*Explanation: Rotating a 2x2 matrix of all 1s by 90 degrees leaves it unchanged.*\n\n**Example 2**\n```\ninput:\n1 2;3 4\noutput: false\n```\n*Explanation: Rotating the matrix gives [3, 1] for the first row, which doesn't match [1, 2].*\n\n**Example 3**\n```\ninput:\n0 1 0;1 8 1;0 1 0\noutput: true\n```\n*Explanation: The cross shape remains exactly the same after a 90-degree clockwise rotation.*\n\n**Follow-up**\nCan you solve this without allocating a new matrix?",
    editorialMarkdown: "## Stellar Grid Symmetry\nThe problem asks us to determine if an N \times N grid remains identical when rotated 90 degrees clockwise. We can check this by comparing each element at `(i, j)` to its corresponding rotated position `(j, N - 1 - i)` or by mapping it backwards: `(i, j)` comes from `(N - 1 - j, i)`.\n\n**Trap**: Make sure to check all elements correctly. A common mistake is writing the index transformation incorrectly, such as swapping `i` and `j` without the `N - 1` adjustment.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N^2) to traverse the grid elements.\n- **Space Complexity:** mathcal{O}(1) since we only use a few variables for iteration.",
    referenceSolution: {
      JAVASCRIPT: "function solve(chart) {\n    let n = chart.length;\n    if (n === 0) return true;\n    for (let i = 0; i < n; i++) {\n        for (let j = 0; j < n; j++) {\n            if (chart[i][j] !== chart[n - 1 - j][i]) return false;\n        }\n    }\n    return true;\n}",
      TYPESCRIPT: "function solve(chart: number[][]): boolean {\n    let n = chart.length;\n    if (n === 0) return true;\n    for (let i = 0; i < n; i++) {\n        for (let j = 0; j < n; j++) {\n            if (chart[i][j] !== chart[n - 1 - j][i]) return false;\n        }\n    }\n    return true;\n}",
      PYTHON: "def solve(chart):\n    n = len(chart)\n    if n == 0:\n        return True\n    for i in range(n):\n        for j in range(n):\n            if chart[i][j] != chart[n - 1 - j][i]:\n                return False\n    return True",
      JAVA: "    static boolean solve(int[][] chart) {\n        int n = chart.length;\n        if (n == 0) return true;\n        for (int i = 0; i < n; i++) {\n            for (int j = 0; j < n; j++) {\n                if (chart[i][j] != chart[n - 1 - j][i]) return false;\n            }\n        }\n        return true;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nbool solve(vector<vector<int>> chart) {\n    int n = chart.size();\n    if (n == 0) return true;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (chart[i][j] != chart[n - 1 - j][i]) {\n                return false;\n            }\n        }\n    }\n    return true;\n}",
      GO: "func solve(chart [][]int) bool {\n    n := len(chart)\n    if n == 0 {\n        return true\n    }\n    for i := 0; i < n; i++ {\n        for j := 0; j < n; j++ {\n            if chart[i][j] != chart[n-1-j][i] {\n                return false\n            }\n        }\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "1 1;1 1", expectedStdout: "true", isSample: true },
      { stdin: "1 2;3 4", expectedStdout: "false", isSample: true },
      { stdin: "0 1 0;1 8 1;0 1 0", expectedStdout: "true" },
      { stdin: "5", expectedStdout: "true" },
      { stdin: "0 1 0;1 8 2;0 1 0", expectedStdout: "false" },
      { stdin: "2 1 2;1 9 1;2 1 2", expectedStdout: "true" },
      { stdin: "1 2 3;4 5 6;7 8 9", expectedStdout: "false" },
      { stdin: "1 2 1;2 3 2;1 2 1", expectedStdout: "true" },
      { stdin: "1 2 1;2 3 2;1 2 2", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "drone-flight-levels",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Drone Flight Levels",
    patternTags: ["array","two-pointers","greedy"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "A delivery drone is navigating through the city. Its flight path is given as an array of integers `dirs` of length N, where `dirs[i] = 1` means the drone must move to a higher altitude for the next segment, and `dirs[i] = -1` means it must move to a lower altitude.\n\nYou must reconstruct the drone's altitude levels. The drone visits exactly N + 1 levels, and each level from `0` to `N` must be visited exactly once.\n\nTo ensure a unique and predictable flight log, follow this greedy rule: \n- When the direction is `1` (Up), pick the **smallest** altitude still available.\n- When the direction is `-1` (Down), pick the **largest** altitude still available.\n\nReturn the reconstructed array of N + 1 altitudes.\n\n**Constraints**\n- `1 <= dirs.length <= 10^5`\n- `dirs[i]` is either `1` or `-1`.\n\n**Example 1**\n```\ninput:\n1 -1 1\noutput: 0 3 1 2\n```\n*Explanation: N = 3. Available: {0, 1, 2, 3}.\ndirs[0] = 1 (Up) -> pick smallest: 0.\ndirs[1] = -1 (Down) -> pick largest: 3.\ndirs[2] = 1 (Up) -> pick smallest: 1.\nFinally, only 2 is left. Result: [0, 3, 1, 2].*\n\n**Example 2**\n```\ninput:\n-1 -1 -1\noutput: 3 2 1 0\n```\n*Explanation: The drone constantly goes down, so we pick the highest available each time.*\n\n**Example 3**\n```\ninput:\n1 1\noutput: 0 1 2\n```\n*Explanation: The drone constantly goes up, so we pick the lowest available each time.*\n\n**Follow-up**\nCan you implement this using exactly mathcal{O}(N) time complexity and no extra space other than the result array?",
    editorialMarkdown: "## Drone Flight Levels\nThis problem asks us to construct a sequence of levels from `0` to `N` based on an array of `N` directions (1 for up, -1 for down). We can use a two-pointer or greedy approach. We maintain the lowest available level `low = 0` and the highest available level `high = N`.\n\nWhenever the drone needs to go up (`1`), we assign the current `low` value and increment `low`. This ensures the next value will definitely be higher. Whenever it needs to go down (`-1`), we assign the current `high` value and decrement `high`.\n\n**Trap**: Don't forget to add the final remaining level (where `low == high`) at the very end of the sequence.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) to iterate over the directions once.\n- **Space Complexity:** mathcal{O}(N) to store the result array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(dirs) {\n    let n = dirs.length;\n    let low = 0, high = n;\n    let res = [];\n    for (let d of dirs) {\n        if (d === 1) res.push(low++);\n        else res.push(high--);\n    }\n    res.push(low);\n    return res;\n}",
      TYPESCRIPT: "function solve(dirs: number[]): number[] {\n    let n = dirs.length;\n    let low = 0, high = n;\n    let res: number[] = [];\n    for (let d of dirs) {\n        if (d === 1) res.push(low++);\n        else res.push(high--);\n    }\n    res.push(low);\n    return res;\n}",
      PYTHON: "def solve(dirs):\n    n = len(dirs)\n    low, high = 0, n\n    res = []\n    for d in dirs:\n        if d == 1:\n            res.append(low)\n            low += 1\n        else:\n            res.append(high)\n            high -= 1\n    res.append(low)\n    return res",
      JAVA: "    static int[] solve(int[] dirs) {\n        int n = dirs.length;\n        int low = 0, high = n;\n        int[] res = new int[n + 1];\n        for (int i = 0; i < n; i++) {\n            if (dirs[i] == 1) res[i] = low++;\n            else res[i] = high--;\n        }\n        res[n] = low;\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<int> dirs) {\n    int n = dirs.size();\n    int low = 0, high = n;\n    vector<int> res;\n    for (int d : dirs) {\n        if (d == 1) res.push_back(low++);\n        else res.push_back(high--);\n    }\n    res.push_back(low);\n    return res;\n}",
      GO: "func solve(dirs []int) []int {\n    n := len(dirs)\n    low, high := 0, n\n    res := make([]int, 0, n+1)\n    for _, d := range dirs {\n        if d == 1 {\n            res = append(res, low)\n            low++\n        } else {\n            res = append(res, high)\n            high--\n        }\n    }\n    res = append(res, low)\n    return res\n}",
    },
    tests: [
      { stdin: "1 -1 1", expectedStdout: "0 3 1 2", isSample: true },
      { stdin: "-1 -1 -1", expectedStdout: "3 2 1 0", isSample: true },
      { stdin: "1 1", expectedStdout: "0 1 2" },
      { stdin: "1", expectedStdout: "0 1" },
      { stdin: "-1", expectedStdout: "1 0" },
      { stdin: "-1 1 -1 1 -1", expectedStdout: "5 0 4 1 3 2" },
      { stdin: "1 -1 1 -1 1", expectedStdout: "0 5 1 4 2 3" },
      { stdin: "1 1 -1 1 -1 1 -1", expectedStdout: "0 1 7 2 6 3 5 4" },
    ],
  }),

  p({
    ...base,
    slug: "crystal-energy-mining",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Crystal Energy Mining",
    patternTags: ["array","simulation","math"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "A space miner collects crystals of different energy levels represented by an integer array `crystals`. \n\nThe base value of each crystal is given by its integer value (from 0 to 10). However, if the miner finds a rare crystal (energy level 10), their mining equipment gets an energy boost, which doubles the energy value of the next two crystals collected. \n\nNote that the multiplier does not stack beyond doubling (the energy is at most doubled, even if multiple 10s were found recently).\n\nReturn the total energy of all crystals collected.\n\n**Constraints**\n- `1 <= crystals.length <= 1000`\n- `0 <= crystals[i] <= 10`\n\n**Example 1**\n```\ninput:\n4 10 3 2\noutput: 24\n```\n*Explanation: The first two crystals are worth 4 and 10. The next two are doubled: 3*2 = 6, 2*2 = 4. Total = 4 + 10 + 6 + 4 = 24.*\n\n**Example 2**\n```\ninput:\n10 10 1 1\noutput: 34\n```\n*Explanation: The first is 10. The second is doubled (20) because of the first. The third and fourth are doubled (2 and 2) because of the preceding 10s. Total = 34.*\n\n**Example 3**\n```\ninput:\n5 5 5\noutput: 15\n```\n*Explanation: No rare crystals were found, so the total is 5 + 5 + 5 = 15.*\n\n**Follow-up**\nCan you solve this in one pass with mathcal{O}(1) extra space?",
    editorialMarkdown: "## Crystal Energy Mining\nWe iterate through the array and accumulate the energy. For each crystal, we check the previous two crystals. If either of them was a 10 (a rare crystal), we double the current crystal's energy before adding it to the total.\n\n**Trap**: Make sure to check bounds properly so you don't index out of bounds when looking at the previous two elements.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the number of crystals.\n- **Space Complexity:** mathcal{O}(1) as we only keep a running sum.",
    referenceSolution: {
      JAVASCRIPT: "function solve(crystals) {\n    let total = 0;\n    for (let i = 0; i < crystals.length; i++) {\n        let mult = 1;\n        if (i >= 1 && crystals[i-1] === 10) {\n            mult = 2;\n        } else if (i >= 2 && crystals[i-2] === 10) {\n            mult = 2;\n        }\n        total += crystals[i] * mult;\n    }\n    return total;\n}",
      TYPESCRIPT: "function solve(crystals: number[]): number {\n    let total = 0;\n    for (let i = 0; i < crystals.length; i++) {\n        let mult = 1;\n        if (i >= 1 && crystals[i-1] === 10) {\n            mult = 2;\n        } else if (i >= 2 && crystals[i-2] === 10) {\n            mult = 2;\n        }\n        total += crystals[i] * mult;\n    }\n    return total;\n}",
      PYTHON: "def solve(crystals):\n    total = 0\n    for i in range(len(crystals)):\n        mult = 1\n        if i >= 1 and crystals[i-1] == 10:\n            mult = 2\n        elif i >= 2 and crystals[i-2] == 10:\n            mult = 2\n        total += crystals[i] * mult\n    return total",
      JAVA: "    static int solve(int[] crystals) {\n        int total = 0;\n        for (int i = 0; i < crystals.length; i++) {\n            int mult = 1;\n            if (i >= 1 && crystals[i-1] == 10) {\n                mult = 2;\n            } else if (i >= 2 && crystals[i-2] == 10) {\n                mult = 2;\n            }\n            total += crystals[i] * mult;\n        }\n        return total;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nint solve(vector<int> crystals) {\n    int total = 0;\n    for (int i = 0; i < crystals.size(); i++) {\n        int mult = 1;\n        if (i >= 1 && crystals[i-1] == 10) {\n            mult = 2;\n        } else if (i >= 2 && crystals[i-2] == 10) {\n            mult = 2;\n        }\n        total += crystals[i] * mult;\n    }\n    return total;\n}",
      GO: "func solve(crystals []int) int {\n    total := 0\n    for i := 0; i < len(crystals); i++ {\n        mult := 1\n        if i >= 1 && crystals[i-1] == 10 {\n            mult = 2\n        } else if i >= 2 && crystals[i-2] == 10 {\n            mult = 2\n        }\n        total += crystals[i] * mult\n    }\n    return total\n}",
    },
    tests: [
      { stdin: "4 10 3 2", expectedStdout: "24", isSample: true },
      { stdin: "10 10 1 1", expectedStdout: "34", isSample: true },
      { stdin: "5 5 5", expectedStdout: "15" },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "10", expectedStdout: "10" },
      { stdin: "10 10 10 10", expectedStdout: "70" },
      { stdin: "10 0 0", expectedStdout: "10" },
      { stdin: "10 0 0 10", expectedStdout: "20" },
      { stdin: "1 2 3 10 4 10 5 5 10 0 1 2", expectedStdout: "78" },
    ],
  }),

  p({
    ...base,
    slug: "data-compression-checksum",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Mineral Richness Score",
    patternTags: ["array","math"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 300,
    promptMarkdown: "A space exploration mission is analyzing soil samples. Each sample contains a mix of minerals represented by an array of integers `data`.\n\nTo assess the mineral richness, the analysis system calculates two metrics:\n1. The **Total Yield**: the sum of all integer values in the array.\n2. The **Granular Yield**: the sum of the individual digits of all integer values in the array.\n\nThe system determines the richness score by taking the absolute difference between the Total Yield and the Granular Yield.\n\nReturn this richness score.\n\n**Constraints**\n- `1 <= data.length <= 2000`\n- `0 <= data[i] <= 2000`\n\n**Example 1**\n```\ninput:\n115 14 9\noutput: 117\n```\n*Explanation:\nTotal Yield = 115 + 14 + 9 = 138.\nGranular Yield = (1 + 1 + 5) + (1 + 4) + 9 = 7 + 5 + 9 = 21.\nAbsolute difference = |138 - 21| = 117.*\n\n**Example 2**\n```\ninput:\n1 2 3\noutput: 0\n```\n*Explanation:\nTotal Yield = 1 + 2 + 3 = 6.\nGranular Yield = 1 + 2 + 3 = 6.\nAbsolute difference = |6 - 6| = 0.*\n\n**Example 3**\n```\ninput:\n25 0\noutput: 18\n```\n*Explanation:\nTotal Yield = 25.\nGranular Yield = 2 + 5 = 7.\nAbsolute difference = |25 - 7| = 18.*\n\n**Follow-up**\nCan you determine the Granular Yield without converting the integers to strings?",
    editorialMarkdown: "## Data Compression Checksum\nThe problem requires computing two sums and taking their absolute difference. The block sum is straightforward: a sum of the array elements. The byte sum requires iterating through each number, breaking it down into its individual digits, and summing them up.\n\n**Trap**: Do not convert the numbers to strings to extract digits, as this incurs an unnecessary performance and memory penalty. Instead, use modulo (`% 10`) and integer division (`/ 10`) loops.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N \\\\times D) where N is the number of elements and D is the maximum number of digits in an element (constant if numbers are bounded).\n- **Space Complexity:** mathcal{O}(1) as we just use integer counters.",
    referenceSolution: {
      JAVASCRIPT: "function solve(data) {\n    let blockSum = 0;\n    let byteSum = 0;\n    for (let num of data) {\n        blockSum += num;\n        let temp = Math.abs(num);\n        while (temp > 0) {\n            byteSum += temp % 10;\n            temp = Math.floor(temp / 10);\n        }\n    }\n    return Math.abs(blockSum - byteSum);\n}",
      TYPESCRIPT: "function solve(data: number[]): number {\n    let blockSum = 0;\n    let byteSum = 0;\n    for (let num of data) {\n        blockSum += num;\n        let temp = Math.abs(num);\n        while (temp > 0) {\n            byteSum += temp % 10;\n            temp = Math.floor(temp / 10);\n        }\n    }\n    return Math.abs(blockSum - byteSum);\n}",
      PYTHON: "def solve(data):\n    block_sum = sum(data)\n    byte_sum = 0\n    for num in data:\n        temp = abs(num)\n        while temp > 0:\n            byte_sum += temp % 10\n            temp //= 10\n    return abs(block_sum - byte_sum)",
      JAVA: "    static int solve(int[] data) {\n        int blockSum = 0;\n        int byteSum = 0;\n        for (int num : data) {\n            blockSum += num;\n            int temp = Math.abs(num);\n            while (temp > 0) {\n                byteSum += temp % 10;\n                temp /= 10;\n            }\n        }\n        return Math.abs(blockSum - byteSum);\n    }",
      CPP: "#include <vector>\n#include <cmath>\nusing namespace std;\nint solve(vector<int> data) {\n    long long block_sum = 0;\n    long long byte_sum = 0;\n    for (int num : data) {\n        block_sum += num;\n        int temp = num;\n        if (temp < 0) temp = -temp;\n        while (temp > 0) {\n            byte_sum += temp % 10;\n            temp /= 10;\n        }\n    }\n    long long diff = block_sum - byte_sum;\n    return diff < 0 ? -diff : diff;\n}",
      GO: "func solve(data []int) int {\n    block_sum := 0\n    byte_sum := 0\n    for _, num := range data {\n        block_sum += num\n        temp := num\n        if temp < 0 {\n            temp = -temp\n        }\n        for temp > 0 {\n            byte_sum += temp % 10\n            temp /= 10\n        }\n    }\n    diff := block_sum - byte_sum\n    if diff < 0 {\n        return -diff\n    }\n    return diff\n}",
    },
    tests: [
      { stdin: "115 14 9", expectedStdout: "117", isSample: true },
      { stdin: "1 2 3", expectedStdout: "0", isSample: true },
      { stdin: "25 0", expectedStdout: "18" },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "9", expectedStdout: "0" },
      { stdin: "10 10", expectedStdout: "18" },
      { stdin: "100 0", expectedStdout: "99" },
      { stdin: "153 234 500", expectedStdout: "864" },
    ],
  }),
];
