import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w0-057` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W0_057_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "calibrated-sensor-alignment",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BINARY_SEARCH",
    title: "Library Shelf Alignment",
    patternTags: ["binary-search","array"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 450,
    promptMarkdown: "You are auditing a library's catalog system where each book is assigned a unique `registration_id`. The list of IDs is provided as an array of integers sorted in strictly increasing order.\n\nA book is considered \"properly shelved\" if its `registration_id` exactly matches its index position on the shelf (0-indexed).\n\nReturn the smallest index `i` such that the book at that index is properly shelved (`registration_id[i] == i`). If there is no such book, return `-1`.\n\n**Constraints**\n- `1 <= registration_id.length <= 10^4`\n- `-10^4 <= registration_id[i] <= 10^4`\n- `registration_id` is sorted in strictly increasing order.\n\n**Example 1**\n```\ninput:\n-5 -2 0 3 8\noutput: 3\n```\n*Explanation: The book at index 3 has an ID of 3, which matches its index. 3 is the smallest index.*\n\n**Example 2**\n```\ninput:\n0 1 2 3\noutput: 0\n```\n*Explanation: Several books match, but `registration_id[0] == 0` is the smallest index.*\n\n**Example 3**\n```\ninput:\n-10 -5 3 4 7 9\noutput: -1\n```\n*Explanation: No book matches its index, so we return -1.*\n\n**Follow-up**\nCan you find the properly shelved book in O(log N) time complexity?",
    editorialMarkdown: "## Calibrated Sensor Alignment\n\nThe problem asks for the smallest index `i` such that `readings[i] == i`.\nSince the array is sorted in strictly increasing order, we can use Binary Search.\nIf `readings[i] < i`, since the array is strictly increasing, all elements before `i` will also be less than their indices. Thus, we should search to the right.\nIf `readings[i] >= i`, the condition might be met at `i` or before `i`, so we record the answer if it matches, and search to the left to find the strictly smallest index.\n\n**Trap**: You must find the *smallest* index. If you stop at the first match, you might miss an earlier match in the array.\n\n**Complexity:**\n- **Time:** O(log N), where N is the length of the array, thanks to binary search.\n- **Space:** O(1), as we only use a few pointers.",
    referenceSolution: {
      JAVASCRIPT: "function solve(readings) {\n    let left = 0, right = readings.length - 1;\n    let ans = -1;\n    while (left <= right) {\n        let mid = Math.floor((left + right) / 2);\n        if (readings[mid] === mid) {\n            ans = mid;\n            right = mid - 1;\n        } else if (readings[mid] > mid) {\n            right = mid - 1;\n        } else {\n            left = mid + 1;\n        }\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(readings: number[]): number {\n    let left = 0, right = readings.length - 1;\n    let ans = -1;\n    while (left <= right) {\n        let mid = Math.floor((left + right) / 2);\n        if (readings[mid] === mid) {\n            ans = mid;\n            right = mid - 1;\n        } else if (readings[mid] > mid) {\n            right = mid - 1;\n        } else {\n            left = mid + 1;\n        }\n    }\n    return ans;\n}",
      PYTHON: "def solve(readings):\n    left, right = 0, len(readings) - 1\n    ans = -1\n    while left <= right:\n        mid = (left + right) // 2\n        if readings[mid] == mid:\n            ans = mid\n            right = mid - 1\n        elif readings[mid] > mid:\n            right = mid - 1\n        else:\n            left = mid + 1\n    return ans",
      JAVA: "    static int solve(int[] readings) {\n        int left = 0, right = readings.length - 1;\n        int ans = -1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (readings[mid] == mid) {\n                ans = mid;\n                right = mid - 1;\n            } else if (readings[mid] > mid) {\n                right = mid - 1;\n            } else {\n                left = mid + 1;\n            }\n        }\n        return ans;\n    }",
      CPP: "int solve(vector<int> readings) {\n    int left = 0, right = readings.size() - 1;\n    int ans = -1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (readings[mid] == mid) {\n            ans = mid;\n            right = mid - 1;\n        } else if (readings[mid] > mid) {\n            right = mid - 1;\n        } else {\n            left = mid + 1;\n        }\n    }\n    return ans;\n}",
      GO: "func solve(readings []int) int {\n    left, right := 0, len(readings)-1\n    ans := -1\n    for left <= right {\n        mid := left + (right-left)/2\n        if readings[mid] == mid {\n            ans = mid\n            right = mid - 1\n        } else if readings[mid] > mid {\n            right = mid - 1\n        } else {\n            left = mid + 1\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "-5 -2 0 3 8", expectedStdout: "3", isSample: true },
      { stdin: "0 1 2 3", expectedStdout: "0", isSample: true },
      { stdin: "-10 -5 3 4 7 9", expectedStdout: "-1" },
      { stdin: "1 2 3 4 5", expectedStdout: "-1" },
      { stdin: "-10 -5 -2 1 4", expectedStdout: "4" },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "-1", expectedStdout: "-1" },
      { stdin: "-10 -1 2 5 7 10 12", expectedStdout: "2" },
    ],
  }),

  p({
    ...base,
    slug: "crystal-growth-layers",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Crystal Growth Layers",
    patternTags: ["math","sequence","fibonacci"],
    signatureId: "fn:int->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "An alien crystal grows its layers in a predictable geometric pattern. \nThe mass of the first layer is 0, and the mass of the second layer is 1. Every subsequent layer has a mass equal to the sum of the masses of the two preceding layers.\n\nGiven an integer `n`, return an array representing the mass of the first `n` layers of the crystal.\n\n**Constraints**\n- `0 <= n <= 40`\n\n**Example 1**\n```\ninput:\n5\noutput: 0 1 1 2 3\n```\n*Explanation: The first 5 layers follow the sequence: 0, 1, 0+1=1, 1+1=2, 1+2=3.*\n\n**Example 2**\n```\ninput:\n1\noutput: 0\n```\n*Explanation: Only the first layer is generated, which is 0.*\n\n**Example 3**\n```\ninput:\n0\noutput: \n```\n*Explanation: 0 layers generated, returning an empty array.*\n\n**Follow-up**\nCan you generate the layers iteratively in O(N) time without using recursion?",
    editorialMarkdown: "## Crystal Growth Layers\n\nThis is a direct application of the Fibonacci sequence, where the base cases are 0 and 1, and each subsequent layer is the sum of the previous two layers.\nWe just need to build an array, initialize the first two elements appropriately, and loop until we've generated `n` elements.\n\n**Trap**: Edge cases where `n` is very small. You must properly handle `n = 0` (empty array) and `n = 1` (array with just `[0]`) to avoid out-of-bounds errors when initializing `res[1] = 1`.\n\n**Complexity:**\n- **Time:** O(N), where N is the number of layers to generate. We perform a simple addition for each element.\n- **Space:** O(N), to store the sequence to be returned.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n) {\n    if (n === 0) return [];\n    if (n === 1) return [0];\n    let res = new Array(n);\n    res[0] = 0;\n    res[1] = 1;\n    for (let i = 2; i < n; i++) {\n        res[i] = res[i-1] + res[i-2];\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(n: number): number[] {\n    if (n === 0) return [];\n    if (n === 1) return [0];\n    let res: number[] = new Array(n);\n    res[0] = 0;\n    res[1] = 1;\n    for (let i = 2; i < n; i++) {\n        res[i] = res[i-1] + res[i-2];\n    }\n    return res;\n}",
      PYTHON: "def solve(n):\n    if n == 0: return []\n    if n == 1: return [0]\n    res = [0, 1]\n    for i in range(2, n):\n        res.append(res[-1] + res[-2])\n    return res",
      JAVA: "    static int[] solve(int n) {\n        if (n == 0) return new int[]{};\n        if (n == 1) return new int[]{0};\n        int[] res = new int[n];\n        res[0] = 0;\n        res[1] = 1;\n        for (int i = 2; i < n; i++) {\n            res[i] = res[i-1] + res[i-2];\n        }\n        return res;\n    }",
      CPP: "vector<int> solve(int n) {\n    if (n == 0) return {};\n    if (n == 1) return {0};\n    vector<int> res(n);\n    res[0] = 0;\n    res[1] = 1;\n    for (int i = 2; i < n; i++) {\n        res[i] = res[i-1] + res[i-2];\n    }\n    return res;\n}",
      GO: "func solve(n int) []int {\n    if n == 0 { return []int{} }\n    if n == 1 { return []int{0} }\n    res := make([]int, n)\n    res[0] = 0\n    res[1] = 1\n    for i := 2; i < n; i++ {\n        res[i] = res[i-1] + res[i-2]\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "5", expectedStdout: "0 1 1 2 3", isSample: true },
      { stdin: "1", expectedStdout: "0", isSample: true },
      { stdin: "0", expectedStdout: "" },
      { stdin: "2", expectedStdout: "0 1" },
      { stdin: "10", expectedStdout: "0 1 1 2 3 5 8 13 21 34" },
      { stdin: "3", expectedStdout: "0 1 1" },
      { stdin: "40", expectedStdout: "0 1 1 2 3 5 8 13 21 34 55 89 144 233 377 610 987 1597 2584 4181 6765 10946 17711 28657 46368 75025 121393 196418 317811 514229 832040 1346269 2178309 3524578 5702887 9227465 14930352 24157817 39088169 63245986" },
      { stdin: "6", expectedStdout: "0 1 1 2 3 5" },
    ],
  }),

  p({
    ...base,
    slug: "stable-energy-core",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Magic Spell Potency",
    patternTags: ["math","hash-set","simulation"],
    signatureId: "fn:int->bool",
    avgSolveSeconds: 400,
    promptMarkdown: "A magic spell is classified as \"potent\" if its power level eventually stabilizes to exactly 1 without getting trapped in an endless arcane cycle.\n\nTo simulate a phase of the spell's manifestation, its current power level is replaced by the sum of the squares of its individual digits.\n\nThis phase is repeated indefinitely. If the power level eventually reaches 1, the spell is potent. If the sequence loops endlessly without ever hitting 1, it is considered unstable.\n\nGiven an integer `n` representing the initial power level of a spell, return `true` if it is potent, and `false` otherwise.\n\n**Constraints**\n- `1 <= n <= 2^31 - 1`\n\n**Example 1**\n```\ninput:\n19\noutput: true\n```\n*Explanation:\n1² + 9² = 82\n8² + 2² = 68\n6² + 8² = 100\n1² + 0² + 0² = 1. The spell is potent.*\n\n**Example 2**\n```\ninput:\n2\noutput: false\n```\n*Explanation:\nThe steps are 4, 16, 37, 58, 89, 145, 42, 20, 4... it repeats and never reaches 1.*\n\n**Example 3**\n```\ninput:\n1\noutput: true\n```\n*Explanation: The spell is already at exactly 1.*\n\n**Follow-up**\nCan you track the cycle without using a hash set, utilizing O(1) extra space?",
    editorialMarkdown: "## Stable Energy Core\n\nThe problem requires simulating a process where a number is repeatedly replaced by the sum of the squares of its digits. The core is stable if it eventually reaches 1, and unstable if it loops indefinitely.\nTo detect an infinite loop, we can use a hash set to store each intermediate energy value. If we encounter a value that is already in the set, a cycle has formed, and the core will never reach 1.\n\n**Trap**: Make sure to isolate each digit correctly by using modulo 10 and integer division by 10. Also, ensure you do not add the initial state to the `seen` set in a way that immediately falsely detects a cycle if it hasn't looped.\n\n**Complexity:**\n- **Time:** O(log N), because the sum of squares of digits shrinks the number logarithmically, and any cycle length is capped at a small constant (the maximum value after the first step for a 32-bit int is small).\n- **Space:** O(1) or O(log N), for the hash set to keep track of the values seen.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n) {\n    const getNext = (x) => {\n        let sum = 0;\n        while (x > 0) {\n            let d = x % 10;\n            sum += d * d;\n            x = Math.floor(x / 10);\n        }\n        return sum;\n    };\n    let slow = n, fast = getNext(n);\n    while (fast !== 1 && slow !== fast) {\n        slow = getNext(slow);\n        fast = getNext(getNext(fast));\n    }\n    return fast === 1;\n}",
      TYPESCRIPT: "function solve(n: number): boolean {\n    const getNext = (x: number): number => {\n        let sum = 0;\n        while (x > 0) {\n            let d = x % 10;\n            sum += d * d;\n            x = Math.floor(x / 10);\n        }\n        return sum;\n    };\n    let slow = n, fast = getNext(n);\n    while (fast !== 1 && slow !== fast) {\n        slow = getNext(slow);\n        fast = getNext(getNext(fast));\n    }\n    return fast === 1;\n}",
      PYTHON: "def solve(n):\n    def get_next(x):\n        s = 0\n        while x > 0:\n            s += (x % 10) ** 2\n            x //= 10\n        return s\n    \n    slow = n\n    fast = get_next(n)\n    while fast != 1 and slow != fast:\n        slow = get_next(slow)\n        fast = get_next(get_next(fast))\n    return fast == 1",
      JAVA: "    static boolean solve(int n) {\n        int slow = n;\n        int fast = getNext(n);\n        while (fast != 1 && slow != fast) {\n            slow = getNext(slow);\n            fast = getNext(getNext(fast));\n        }\n        return fast == 1;\n    }\n    \n    static int getNext(int x) {\n        int sum = 0;\n        while (x > 0) {\n            int d = x % 10;\n            sum += d * d;\n            x /= 10;\n        }\n        return sum;\n    }",
      CPP: "bool solve(int n) {\n    auto get_next = [](int n) {\n        int sum = 0;\n        while (n > 0) {\n            int d = n % 10;\n            sum += d * d;\n            n /= 10;\n        }\n        return sum;\n    };\n    int slow = n, fast = get_next(n);\n    while (fast != 1 && slow != fast) {\n        slow = get_next(slow);\n        fast = get_next(get_next(fast));\n    }\n    return fast == 1;\n}",
      GO: "func solve(n int) bool {\n    getNext := func(x int) int {\n        sum := 0\n        for x > 0 {\n            d := x % 10\n            sum += d * d\n            x /= 10\n        }\n        return sum\n    }\n    slow := n\n    fast := getNext(n)\n    for fast != 1 && slow != fast {\n        slow = getNext(slow)\n        fast = getNext(getNext(fast))\n    }\n    return fast == 1\n}",
    },
    tests: [
      { stdin: "19", expectedStdout: "true", isSample: true },
      { stdin: "2", expectedStdout: "false", isSample: true },
      { stdin: "1", expectedStdout: "true" },
      { stdin: "7", expectedStdout: "true" },
      { stdin: "4", expectedStdout: "false" },
      { stdin: "2147483646", expectedStdout: "false" },
      { stdin: "100", expectedStdout: "true" },
      { stdin: "15", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "control-node-capture",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Control Node Capture",
    patternTags: ["array","simulation","matrix"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 600,
    promptMarkdown: "Two competing factions are fighting for control over a 3x3 planetary grid. The grid cells are numbered 0 to 8, starting from the top-left to the bottom-right.\nThe two factions, Faction 1 and Faction 2, take turns claiming a cell. Faction 1 always goes first.\nGiven an array of integers `moves`, where `moves[i]` is the cell index claimed on the i-th turn, determine the current state of the conflict.\n\nThe conflict ends when a faction claims three cells in a straight line (horizontal, vertical, or diagonal), making them the winner.\nIf all 9 cells are claimed and no faction has three in a line, the conflict is a draw.\nIf the conflict hasn't reached a win or a draw, it is still pending.\n\nReturn:\n- `1` if Faction 1 wins\n- `2` if Faction 2 wins\n- `0` if the conflict is a draw\n- `-1` if the conflict is pending\n\n**Constraints**\n- `1 <= moves.length <= 9`\n- `0 <= moves[i] <= 8`\n- All elements in `moves` are unique.\n- The input sequence of moves is valid and follows the rules of the game.\n\n**Example 1**\n```\ninput:\n0 3 1 4 2\noutput: 1\n```\n*Explanation: Faction 1 claims 0, 1, 2 (top row). Faction 1 wins.*\n\n**Example 2**\n```\ninput:\n0 4 1 2 8 6\noutput: 2\n```\n*Explanation: Faction 2 claims 4, 2, 6 (diagonal). Faction 2 wins.*\n\n**Example 3**\n```\ninput:\n0 1 2 4 3 5 7 6 8\noutput: 0\n```\n*Explanation: All cells are claimed and neither faction forms a line of three. It's a draw.*\n\n**Follow-up**\nCan you optimize the state tracking without using a 2D array?",
    editorialMarkdown: "## Control Node Capture\n\nWe need to check the state of a 3x3 grid after a sequence of moves to determine if a faction has won.\nSince the grid is small (9 cells), we can track the moves and then check all 8 possible winning lines (3 rows, 3 columns, 2 diagonals) for each player.\nIf any winning line is completely claimed by one player, they win.\nIf no one has won and 9 moves have been made, it's a draw. Otherwise, it's pending.\n\n**Trap**: Make sure to check for a winner correctly before deciding it is a draw, as the last move could be the winning move.\n\n**Complexity:**\n- **Time:** O(1), since the grid is always 3x3 and maximum 9 moves.\n- **Space:** O(1), fixed size array for the grid state.",
    referenceSolution: {
      JAVASCRIPT: "function solve(moves) {\n    let grid = new Array(9).fill(-1);\n    for (let i = 0; i < moves.length; i++) {\n        grid[moves[i]] = i % 2;\n    }\n    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];\n    for (let p = 0; p < 2; p++) {\n        for (let w of wins) {\n            if (grid[w[0]] === p && grid[w[1]] === p && grid[w[2]] === p) {\n                return p + 1;\n            }\n        }\n    }\n    return moves.length === 9 ? 0 : -1;\n}",
      TYPESCRIPT: "function solve(moves: number[]): number {\n    let grid: number[] = new Array(9).fill(-1);\n    for (let i = 0; i < moves.length; i++) {\n        grid[moves[i]] = i % 2;\n    }\n    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];\n    for (let p = 0; p < 2; p++) {\n        for (let w of wins) {\n            if (grid[w[0]] === p && grid[w[1]] === p && grid[w[2]] === p) {\n                return p + 1;\n            }\n        }\n    }\n    return moves.length === 9 ? 0 : -1;\n}",
      PYTHON: "def solve(moves):\n    grid = [-1] * 9\n    for i, m in enumerate(moves):\n        grid[m] = i % 2\n    wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]\n    for p in (0, 1):\n        for w in wins:\n            if grid[w[0]] == p and grid[w[1]] == p and grid[w[2]] == p:\n                return p + 1\n    return 0 if len(moves) == 9 else -1",
      JAVA: "    static int solve(int[] moves) {\n        int[] grid = new int[9];\n        for (int i = 0; i < 9; i++) grid[i] = -1;\n        for (int i = 0; i < moves.length; i++) {\n            grid[moves[i]] = i % 2;\n        }\n        int[][] wins = {{0,1,2},{3,4,5},{6,7,8},{0,3,6},{1,4,7},{2,5,8},{0,4,8},{2,4,6}};\n        for (int p = 0; p < 2; p++) {\n            for (int[] w : wins) {\n                if (grid[w[0]] == p && grid[w[1]] == p && grid[w[2]] == p) {\n                    return p + 1;\n                }\n            }\n        }\n        return moves.length == 9 ? 0 : -1;\n    }",
      CPP: "int solve(vector<int> moves) {\n    vector<int> grid(9, -1);\n    for (int i = 0; i < moves.size(); i++) {\n        grid[moves[i]] = i % 2;\n    }\n    int wins[8][3] = {{0,1,2},{3,4,5},{6,7,8},{0,3,6},{1,4,7},{2,5,8},{0,4,8},{2,4,6}};\n    for (int p = 0; p < 2; p++) {\n        for (int i = 0; i < 8; i++) {\n            if (grid[wins[i][0]] == p && grid[wins[i][1]] == p && grid[wins[i][2]] == p) {\n                return p + 1;\n            }\n        }\n    }\n    return moves.size() == 9 ? 0 : -1;\n}",
      GO: "func solve(moves []int) int {\n    grid := make([]int, 9)\n    for i := range grid { grid[i] = -1 }\n    for i, m := range moves {\n        grid[m] = i % 2\n    }\n    wins := [][]int{{0,1,2},{3,4,5},{6,7,8},{0,3,6},{1,4,7},{2,5,8},{0,4,8},{2,4,6}}\n    for p := 0; p < 2; p++ {\n        for _, w := range wins {\n            if grid[w[0]] == p && grid[w[1]] == p && grid[w[2]] == p {\n                return p + 1\n            }\n        }\n    }\n    if len(moves) == 9 {\n        return 0\n    }\n    return -1\n}",
    },
    tests: [
      { stdin: "0 3 1 4 2", expectedStdout: "1", isSample: true },
      { stdin: "0 4 1 2 8 6", expectedStdout: "2", isSample: true },
      { stdin: "0 1 2 4 3 5 7 6 8", expectedStdout: "0" },
      { stdin: "0 1 2", expectedStdout: "-1" },
      { stdin: "4 0 1 3 2", expectedStdout: "-1" },
      { stdin: "0 1 3 4 6", expectedStdout: "1" },
      { stdin: "8 0 7 1 5 2", expectedStdout: "2" },
      { stdin: "4", expectedStdout: "-1" },
    ],
  }),

  p({
    ...base,
    slug: "telemetry-format-upgrade",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Archival Data Conversion",
    patternTags: ["math","base-conversion","string"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 400,
    promptMarkdown: "Your database administration team is migrating archival records from a legacy system to a newer, more compact format.\n\nThe legacy records are provided as a string `hexStr` representing an unsigned integer in hexadecimal format (base 16). The new system requires these records to be encoded in hexatrigesimal format (base 36).\n\nWrite a function that converts the legacy hexadecimal string into its base 36 representation. The resulting string must use uppercase letters `A-Z` for values `10` through `35`.\n\n**Constraints**\n- `1 <= hexStr.length <= 15`\n- `hexStr` consists only of digits `0-9` and uppercase letters `A-F`.\n- The integer value fits within a standard 64-bit unsigned integer limit.\n\n**Example 1**\n```\ninput:\n1F\noutput: V\n```\n*Explanation: `1F` in base 16 equals 31 in base 10. In base 36, 31 is represented as `V`.*\n\n**Example 2**\n```\ninput:\n100\noutput: 74\n```\n*Explanation: `100` in base 16 equals 256 in base 10. `256 = 7 * 36 + 4`, so the output is `74`.*\n\n**Example 3**\n```\ninput:\n0\noutput: 0\n```\n*Explanation: `0` remains `0` in any base.*\n\n**Follow-up**\nCan you perform the conversion without converting the string directly into a built-in arbitrary-precision integer?",
    editorialMarkdown: "## Telemetry Format Upgrade\n\nThe task is to convert a number represented as a hexadecimal string (base 16) into a hexatrigesimal string (base 36) using uppercase letters.\nWe can solve this in two steps:\n1. Parse the hexadecimal string into an integer.\n2. Continually take the modulo of the integer with 36 to determine the last digit, map it to the corresponding character `0-9` or `A-Z`, and integer divide the integer by 36.\n3. Once the integer is 0, reverse the gathered characters to form the final result.\n\n**Trap**: Make sure you handle the case where the input string represents `0` correctly. Most loops for base conversion will not run if `value == 0`.\n\n**Complexity:**\n- **Time:** O(N), where N is the length of the string, proportional to the digits. Conversion operations scale based on string size.\n- **Space:** O(N), to store the final converted string characters.",
    referenceSolution: {
      JAVASCRIPT: "function solve(hexStr) {\n    if (hexStr === \"0\" || !hexStr) return \"0\";\n    let val = BigInt(\"0x\" + hexStr);\n    if (val === 0n) return \"0\";\n    const chars = \"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ\";\n    let res = \"\";\n    while (val > 0n) {\n        res = chars[Number(val % 36n)] + res;\n        val /= 36n;\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(hexStr: string): string {\n    if (hexStr === \"0\" || !hexStr) return \"0\";\n    let val = BigInt(\"0x\" + hexStr);\n    if (val === 0n) return \"0\";\n    const chars = \"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ\";\n    let res = \"\";\n    while (val > 0n) {\n        res = chars[Number(val % 36n)] + res;\n        val /= 36n;\n    }\n    return res;\n}",
      PYTHON: "def solve(hexStr):\n    if not hexStr or hexStr == \"0\":\n        return \"0\"\n    val = int(hexStr, 16)\n    if val == 0:\n        return \"0\"\n    chars = \"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ\"\n    res = []\n    while val > 0:\n        res.append(chars[val % 36])\n        val //= 36\n    return \"\".join(res[::-1])",
      JAVA: "    static String solve(String hexStr) {\n        if (hexStr == null || hexStr.isEmpty() || hexStr.equals(\"0\")) return \"0\";\n        long val = 0;\n        for (int i = 0; i < hexStr.length(); i++) {\n            char c = hexStr.charAt(i);\n            if (c >= '0' && c <= '9') val = val * 16 + (c - '0');\n            else val = val * 16 + (c - 'A' + 10);\n        }\n        if (val == 0) return \"0\";\n        String chars = \"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ\";\n        StringBuilder res = new StringBuilder();\n        while (val > 0) {\n            res.append(chars.charAt((int)(val % 36)));\n            val /= 36;\n        }\n        return res.reverse().toString();\n    }",
      CPP: "string solve(string hexStr) {\n    if (hexStr == \"0\" || hexStr == \"\") return \"0\";\n    unsigned long long val = 0;\n    for (char c : hexStr) {\n        if (c >= '0' && c <= '9') val = val * 16 + (c - '0');\n        else val = val * 16 + (c - 'A' + 10);\n    }\n    if (val == 0) return \"0\";\n    string chars = \"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ\";\n    string res = \"\";\n    while (val > 0) {\n        res += chars[val % 36];\n        val /= 36;\n    }\n    string reversed = \"\";\n    for (int i = res.length() - 1; i >= 0; i--) reversed += res[i];\n    return reversed;\n}",
      GO: "func solve(hexStr string) string {\n    if hexStr == \"0\" || hexStr == \"\" {\n        return \"0\"\n    }\n    var val uint64 = 0\n    for i := 0; i < len(hexStr); i++ {\n        c := hexStr[i]\n        if c >= '0' && c <= '9' {\n            val = val*16 + uint64(c-'0')\n        } else {\n            val = val*16 + uint64(c-'A'+10)\n        }\n    }\n    if val == 0 {\n        return \"0\"\n    }\n    chars := \"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ\"\n    res := \"\"\n    for val > 0 {\n        res = string(chars[val%36]) + res\n        val /= 36\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1F", expectedStdout: "V", isSample: true },
      { stdin: "100", expectedStdout: "74", isSample: true },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "24", expectedStdout: "10" },
      { stdin: "F423F", expectedStdout: "LFLR" },
      { stdin: "19A0FF", expectedStdout: "ZZZZ" },
      { stdin: "AA", expectedStdout: "4Q" },
      { stdin: "A", expectedStdout: "A" },
    ],
  }),
];
