import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-014` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_014_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "collect-rare-gems",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Collect Rare Gems",
    patternTags: ["math","simulation","loops"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 600,
    promptMarkdown: "An adventurer is exploring a cave to collect rare gems over `n` consecutive days. The cave reveals gems following a strict daily pattern.\n\nOn day 1, they find exactly 1 gem. Every subsequent day in the same week (up to day 7), they find 1 more gem than the previous day. On the start of a new week (days 8, 15, 22, etc.), they find 1 more gem than they found on the first day of the previous week.\n\nCalculate and return the total number of gems collected after `n` days.\n\n**Constraints**\n- `0 <= n <= 40`\n\n**Example 1**\n```\ninput:\n4\noutput: 10\n```\nExplanation: The adventurer collects 1, 2, 3, and 4 gems on the first four days. Total = 1 + 2 + 3 + 4 = 10.\n\n**Example 2**\n```\ninput:\n10\noutput: 37\n```\nExplanation: Week 1 yields 1+2+3+4+5+6+7 = 28 gems. Week 2 yields 2+3+4 = 9 gems. Total = 37.\n\n**Example 3**\n```\ninput:\n0\noutput: 0\n```\nExplanation: Zero days spent exploring means zero gems collected.\n\n**Follow-up:** Can you compute the total in O(1) time without using a loop?",
    editorialMarkdown: "## Simulating Daily Patterns\n\nThe most straightforward way to solve this is to simulate the process day by day. We can use a loop from `0` to `n - 1` to represent each day.\n\nFor a given day index `i`, the number of complete weeks that have passed is `i / 7` (integer division). The current day within the week is `i % 7`. Since the first day of week 0 yields 1 gem, the base amount for the start of any week is `(i / 7) + 1`. The additional gems for the current day of the week is just `i % 7`. We simply add `(i / 7) + (i % 7) + 1` to our running total for each day.\n\nTime complexity is O(N) where N is the number of days, since we do constant work per day. Space complexity is O(1) as we only use a few integer variables.\n\nThe one trap most solvers hit is miscalculating the start value of a new week by accidentally multiplying instead of adding, or fumbling the 0-based index offset when translating day numbers to gem counts.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n) {\n    let total = 0;\n    for (let i = 0; i < n; i++) {\n        let week = Math.floor(i / 7);\n        let day = i % 7;\n        total += week + day + 1;\n    }\n    return total;\n}",
      TYPESCRIPT: "function solve(n: number): number {\n    let total = 0;\n    for (let i = 0; i < n; i++) {\n        let week = Math.floor(i / 7);\n        let day = i % 7;\n        total += week + day + 1;\n    }\n    return total;\n}",
      PYTHON: "def solve(n):\n    total = 0\n    for i in range(n):\n        week = i // 7\n        day = i % 7\n        total += week + day + 1\n    return total",
      JAVA: "    static int solve(int n) {\n        int total = 0;\n        for (int i = 0; i < n; i++) {\n            int week = i / 7;\n            int day = i % 7;\n            total += week + day + 1;\n        }\n        return total;\n    }",
      CPP: "int solve(int n) {\n    int total = 0;\n    for (int i = 0; i < n; i++) {\n        int week = i / 7;\n        int day = i % 7;\n        total += week + day + 1;\n    }\n    return total;\n}",
      GO: "func solve(n int) int {\n    total := 0\n    for i := 0; i < n; i++ {\n        week := i / 7\n        day := i % 7\n        total += week + day + 1\n    }\n    return total\n}",
    },
    tests: [
      { stdin: "4", expectedStdout: "10", isSample: true },
      { stdin: "10", expectedStdout: "37", isSample: true },
      { stdin: "0", expectedStdout: "0", isSample: true },
      { stdin: "20", expectedStdout: "96" },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "7", expectedStdout: "28" },
      { stdin: "8", expectedStdout: "30" },
      { stdin: "14", expectedStdout: "63" },
    ],
  }),

  p({
    ...base,
    slug: "drone-flight-adjustments",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Drone Flight Adjustments",
    patternTags: ["array","arrays","simulation","parsing"],
    signatureId: "fn:strings->int",
    avgSolveSeconds: 700,
    promptMarkdown: "You are testing a delivery drone's flight control software. You are provided with a sequence of operations `ops` represented as an array of strings. \n\nThe first element in the array is a string representing the initial altitude of the drone as an integer. The rest of the array consists of pairs of strings representing commands and their integer values. The commands can be:\n- `\"up\"`: increase the altitude by the value.\n- `\"down\"`: decrease the altitude by the value.\n- `\"factor\"`: multiply the altitude by the value.\n\nCalculate and return the final altitude of the drone after processing all operations in order. Assume the input is always well-formed.\n\n**Constraints**\n- `1 <= ops.length <= 39`\n- `ops.length` is always odd.\n- All numerical values fit within standard 32-bit signed integers during all stages of calculation.\n\n**Example 1**\n```\ninput:\n10 up 5 factor 2 down 3\noutput: 27\n```\nExplanation: Start at 10. Up 5 -> 15. Factor 2 -> 30. Down 3 -> 27.\n\n**Example 2**\n```\ninput:\n0 up 10 down 5\noutput: 5\n```\nExplanation: Start at 0. Up 10 -> 10. Down 5 -> 5.\n\n**Example 3**\n```\ninput:\n5\noutput: 5\n```\nExplanation: The initial altitude is 5, and there are no further adjustments.\n\n**Follow-up:** How would you modify your solution to support an \"undo\" command that reverts the last operation?",
    editorialMarkdown: "## Sequential Command Processing\n\nThe core of the problem involves maintaining a running state (the altitude) and applying a series of operations sequentially. We parse the first element as the initial state.\n\nWe then iterate through the remaining elements of the array in steps of 2. For each step, `ops[i]` is the operation name and `ops[i+1]` is the string representation of the numeric value. By using simple conditional statements (`if/else if`), we can apply the corresponding arithmetic operation to the running altitude. Once the loop finishes, we return the accumulated result.\n\nTime complexity is O(N) where N is the length of the operations array, as we process each element exactly once. Space complexity is O(1) since we only use a single variable to track the altitude.\n\nThe one trap most solvers hit is accidentally iterating by 1 instead of 2, reading values as commands and crashing the program, or forgetting to parse the string values into integers before performing arithmetic.",
    referenceSolution: {
      JAVASCRIPT: "function solve(ops) {\n    if (ops.length === 0) return 0;\n    let alt = parseInt(ops[0]);\n    for (let i = 1; i < ops.length; i += 2) {\n        let op = ops[i];\n        let val = parseInt(ops[i+1]);\n        if (op === \"up\") alt += val;\n        else if (op === \"down\") alt -= val;\n        else if (op === \"factor\") alt *= val;\n    }\n    return alt;\n}",
      TYPESCRIPT: "function solve(ops: string[]): number {\n    if (ops.length === 0) return 0;\n    let alt = parseInt(ops[0]);\n    for (let i = 1; i < ops.length; i += 2) {\n        let op = ops[i];\n        let val = parseInt(ops[i+1]);\n        if (op === \"up\") alt += val;\n        else if (op === \"down\") alt -= val;\n        else if (op === \"factor\") alt *= val;\n    }\n    return alt;\n}",
      PYTHON: "def solve(ops):\n    if not ops: return 0\n    alt = int(ops[0])\n    for i in range(1, len(ops), 2):\n        op = ops[i]\n        val = int(ops[i+1])\n        if op == \"up\": alt += val\n        elif op == \"down\": alt -= val\n        elif op == \"factor\": alt *= val\n    return alt",
      JAVA: "    static int solve(String[] ops) {\n        if (ops.length == 0) return 0;\n        int alt = Integer.parseInt(ops[0]);\n        for (int i = 1; i < ops.length; i += 2) {\n            String op = ops[i];\n            int val = Integer.parseInt(ops[i+1]);\n            if (op.equals(\"up\")) alt += val;\n            else if (op.equals(\"down\")) alt -= val;\n            else if (op.equals(\"factor\")) alt *= val;\n        }\n        return alt;\n    }",
      CPP: "int solve(vector<string> ops) {\n    if (ops.empty()) return 0;\n    int alt = stoi(ops[0]);\n    for (int i = 1; i < ops.size(); i += 2) {\n        string op = ops[i];\n        int val = stoi(ops[i+1]);\n        if (op == \"up\") alt += val;\n        else if (op == \"down\") alt -= val;\n        else if (op == \"factor\") alt *= val;\n    }\n    return alt;\n}",
      GO: "func solve(ops []string) int {\n    if len(ops) == 0 {\n        return 0\n    }\n    alt, _ := strconv.Atoi(ops[0])\n    for i := 1; i < len(ops); i += 2 {\n        op := ops[i]\n        val, _ := strconv.Atoi(ops[i+1])\n        if op == \"up\" {\n            alt += val\n        } else if op == \"down\" {\n            alt -= val\n        } else if op == \"factor\" {\n            alt *= val\n        }\n    }\n    return alt\n}",
    },
    tests: [
      { stdin: "10 up 5 factor 2 down 3", expectedStdout: "27", isSample: true },
      { stdin: "0 up 10 down 5", expectedStdout: "5", isSample: true },
      { stdin: "5", expectedStdout: "5", isSample: true },
      { stdin: "10 factor 0 up 5", expectedStdout: "5" },
      { stdin: "-5 down 10 factor 2", expectedStdout: "-30" },
      { stdin: "2 up 2 factor 3 down 10", expectedStdout: "2" },
      { stdin: "100 down 50 down 50", expectedStdout: "0" },
      { stdin: "1 factor 10 factor 10", expectedStdout: "100" },
    ],
  }),

  p({
    ...base,
    slug: "verify-staircase-arrangement",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Verify Staircase Arrangement",
    patternTags: ["array","arrays","sorting","math"],
    signatureId: "fn:ints->bool",
    avgSolveSeconds: 600,
    promptMarkdown: "A carpenter is building a staircase and has cut a number of wooden blocks of varying heights, given as an array of integers `steps`.\n\nThe carpenter wants to know if these blocks can be arranged in some order such that the height difference between any two consecutive blocks is exactly the same, forming a perfectly even staircase.\n\nReturn `true` if such an arrangement is possible, and `false` otherwise.\n\n**Constraints**\n- `1 <= steps.length <= 40`\n- `-1000 <= steps[i] <= 1000`\n\n**Example 1**\n```\ninput:\n5 1 9\noutput: true\n```\nExplanation: The blocks can be arranged as 1, 5, 9. The difference between consecutive blocks is consistently 4.\n\n**Example 2**\n```\ninput:\n1 2 4\noutput: false\n```\nExplanation: No matter the arrangement, the differences will not be consistent.\n\n**Example 3**\n```\ninput:\n10 10 10\noutput: true\n```\nExplanation: The blocks are already identical, creating a flat surface with a consistent difference of 0.\n\n**Follow-up:** Can you determine if an arrangement is possible in O(N) time without fully sorting the array?",
    editorialMarkdown: "## Sorting to Find Progressions\n\nTo determine if an array can form a sequence with a constant difference, the most reliable approach is to sort the elements first. If a valid arithmetic progression exists, it must appear when the elements are in sorted order.\n\nAfter sorting the array, we can compute the expected difference by subtracting the first element from the second. Then, we iterate through the rest of the array, comparing the difference of every adjacent pair to the expected difference. If any pair's difference does not match, we return `false`. If we make it through the entire array, we return `true`. Note that arrays of length 1 trivially return `true`.\n\nTime complexity is O(N log N) dominated by the sorting step, where N is the number of blocks. Space complexity is O(1) or O(N) depending on the sorting algorithm used in the language.\n\nThe one trap most solvers hit is assuming the input is already sorted, or failing to handle arrays with duplicate values which legitimately form a progression with a difference of zero.",
    referenceSolution: {
      JAVASCRIPT: "function solve(steps) {\n    if (steps.length < 2) return true;\n    for (let i = 0; i < steps.length; i++) {\n        for (let j = 0; j < steps.length - i - 1; j++) {\n            if (steps[j] > steps[j+1]) {\n                let temp = steps[j];\n                steps[j] = steps[j+1];\n                steps[j+1] = temp;\n            }\n        }\n    }\n    let diff = steps[1] - steps[0];\n    for (let i = 2; i < steps.length; i++) {\n        if (steps[i] - steps[i-1] !== diff) return false;\n    }\n    return true;\n}",
      TYPESCRIPT: "function solve(steps: number[]): boolean {\n    if (steps.length < 2) return true;\n    for (let i = 0; i < steps.length; i++) {\n        for (let j = 0; j < steps.length - i - 1; j++) {\n            if (steps[j] > steps[j+1]) {\n                let temp = steps[j];\n                steps[j] = steps[j+1];\n                steps[j+1] = temp;\n            }\n        }\n    }\n    let diff = steps[1] - steps[0];\n    for (let i = 2; i < steps.length; i++) {\n        if (steps[i] - steps[i-1] !== diff) return false;\n    }\n    return true;\n}",
      PYTHON: "def solve(steps):\n    if len(steps) < 2: return True\n    for i in range(len(steps)):\n        for j in range(len(steps) - i - 1):\n            if steps[j] > steps[j+1]:\n                steps[j], steps[j+1] = steps[j+1], steps[j]\n    diff = steps[1] - steps[0]\n    for i in range(2, len(steps)):\n        if steps[i] - steps[i-1] != diff: return False\n    return True",
      JAVA: "    static boolean solve(int[] steps) {\n        if (steps.length < 2) return true;\n        for (int i = 0; i < steps.length; i++) {\n            for (int j = 0; j < steps.length - i - 1; j++) {\n                if (steps[j] > steps[j+1]) {\n                    int temp = steps[j];\n                    steps[j] = steps[j+1];\n                    steps[j+1] = temp;\n                }\n            }\n        }\n        int diff = steps[1] - steps[0];\n        for (int i = 2; i < steps.length; i++) {\n            if (steps[i] - steps[i-1] != diff) return false;\n        }\n        return true;\n    }",
      CPP: "bool solve(vector<int> steps) {\n    if (steps.size() < 2) return true;\n    for (int i = 0; i < steps.size(); i++) {\n        for (int j = 0; j < (int)steps.size() - i - 1; j++) {\n            if (steps[j] > steps[j+1]) {\n                swap(steps[j], steps[j+1]);\n            }\n        }\n    }\n    int diff = steps[1] - steps[0];\n    for (int i = 2; i < steps.size(); i++) {\n        if (steps[i] - steps[i-1] != diff) return false;\n    }\n    return true;\n}",
      GO: "func solve(steps []int) bool {\n    if len(steps) < 2 {\n        return true\n    }\n    for i := 0; i < len(steps); i++ {\n        for j := 0; j < len(steps) - i - 1; j++ {\n            if steps[j] > steps[j+1] {\n                steps[j], steps[j+1] = steps[j+1], steps[j]\n            }\n        }\n    }\n    diff := steps[1] - steps[0]\n    for i := 2; i < len(steps); i++ {\n        if steps[i] - steps[i-1] != diff {\n            return false\n        }\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "5 1 9", expectedStdout: "true", isSample: true },
      { stdin: "1 2 4", expectedStdout: "false", isSample: true },
      { stdin: "10 10 10", expectedStdout: "true", isSample: true },
      { stdin: "1 2", expectedStdout: "true" },
      { stdin: "0", expectedStdout: "true" },
      { stdin: "-5 5 0", expectedStdout: "true" },
      { stdin: "7 3 5 1", expectedStdout: "true" },
      { stdin: "1 5 8 12", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "can-place-cooling-servers",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GREEDY",
    title: "Can Place Cooling Servers",
    patternTags: ["array","arrays","greedy","simulation"],
    signatureId: "fn:ints,int->bool",
    avgSolveSeconds: 800,
    promptMarkdown: "A data center is upgrading its infrastructure. You are given an integer array `rack` representing server slots, where `1` indicates an occupied slot and `0` indicates an empty slot. You are also given an integer `k` representing the number of new servers to install.\n\nTo prevent overheating, servers cannot be placed in adjacent slots. Determine if all `k` new servers can be safely installed in the rack without violating the cooling rule.\n\nReturn `true` if they can be placed, and `false` otherwise.\n\n**Constraints**\n- `1 <= rack.length <= 40`\n- `rack[i]` is either `0` or `1`.\n- `0 <= k <= 40`\n- The initial configuration is guaranteed to have no adjacent servers.\n\n**Example 1**\n```\ninput:\n1 0 0 0 1\n1\noutput: true\n```\nExplanation: We can place a new server at index 2, resulting in [1, 0, 1, 0, 1].\n\n**Example 2**\n```\ninput:\n1 0 0 0 1\n2\noutput: false\n```\nExplanation: Placing one server takes up the only valid space. We cannot place a second server without placing it adjacent to another.\n\n**Example 3**\n```\ninput:\n0 0 1 0 0\n2\noutput: true\n```\nExplanation: We can place the new servers at index 0 and index 4.\n\n**Follow-up:** Can you optimize your loop to exit early once `k` servers have been placed?",
    editorialMarkdown: "## Greedy Placement\n\nThe problem can be solved greedily. Scanning from left to right, whenever we find an empty slot that is safely isolated from neighboring servers, we should immediately place a server there. There is no strategic advantage to skipping a valid slot.\n\nWe iterate through the array. For each slot, we check if it is `0`. If it is, we then verify that its left neighbor is either non-existent (out of bounds) or also `0`, and similarly for its right neighbor. If both conditions hold, we change the current slot to `1` (simulating placement) and increment our counter of placed servers. Finally, we check if the total placed is at least `k`.\n\nTime complexity is O(N) where N is the length of the rack, as we scan the array once. Space complexity is O(1) or O(N) depending on whether the language permits modifying the input array in place.\n\nThe one trap most solvers hit is checking indices `i-1` and `i+1` without safeguarding against out-of-bounds errors at the very start or end of the array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(rack, k) {\n    let count = 0;\n    for (let i = 0; i < rack.length; i++) {\n        if (rack[i] === 0) {\n            let leftEmpty = (i === 0 || rack[i-1] === 0);\n            let rightEmpty = (i === rack.length - 1 || rack[i+1] === 0);\n            if (leftEmpty && rightEmpty) {\n                rack[i] = 1;\n                count++;\n            }\n        }\n    }\n    return count >= k;\n}",
      TYPESCRIPT: "function solve(rack: number[], k: number): boolean {\n    let count = 0;\n    for (let i = 0; i < rack.length; i++) {\n        if (rack[i] === 0) {\n            let leftEmpty = (i === 0 || rack[i-1] === 0);\n            let rightEmpty = (i === rack.length - 1 || rack[i+1] === 0);\n            if (leftEmpty && rightEmpty) {\n                rack[i] = 1;\n                count++;\n            }\n        }\n    }\n    return count >= k;\n}",
      PYTHON: "def solve(rack, k):\n    count = 0\n    for i in range(len(rack)):\n        if rack[i] == 0:\n            leftEmpty = (i == 0 or rack[i-1] == 0)\n            rightEmpty = (i == len(rack) - 1 or rack[i+1] == 0)\n            if leftEmpty and rightEmpty:\n                rack[i] = 1\n                count += 1\n    return count >= k",
      JAVA: "    static boolean solve(int[] rack, int k) {\n        int count = 0;\n        for (int i = 0; i < rack.length; i++) {\n            if (rack[i] == 0) {\n                boolean leftEmpty = (i == 0 || rack[i-1] == 0);\n                boolean rightEmpty = (i == rack.length - 1 || rack[i+1] == 0);\n                if (leftEmpty && rightEmpty) {\n                    rack[i] = 1;\n                    count++;\n                }\n            }\n        }\n        return count >= k;\n    }",
      CPP: "bool solve(vector<int> rack, int k) {\n    int count = 0;\n    for (int i = 0; i < rack.size(); i++) {\n        if (rack[i] == 0) {\n            bool leftEmpty = (i == 0 || rack[i-1] == 0);\n            bool rightEmpty = (i == rack.size() - 1 || rack[i+1] == 0);\n            if (leftEmpty && rightEmpty) {\n                rack[i] = 1;\n                count++;\n            }\n        }\n    }\n    return count >= k;\n}",
      GO: "func solve(rack []int, k int) bool {\n    count := 0\n    for i := 0; i < len(rack); i++ {\n        if rack[i] == 0 {\n            leftEmpty := (i == 0 || rack[i-1] == 0)\n            rightEmpty := (i == len(rack) - 1 || rack[i+1] == 0)\n            if leftEmpty && rightEmpty {\n                rack[i] = 1\n                count++\n            }\n        }\n    }\n    return count >= k\n}",
    },
    tests: [
      { stdin: "1 0 0 0 1\n1", expectedStdout: "true", isSample: true },
      { stdin: "1 0 0 0 1\n2", expectedStdout: "false", isSample: true },
      { stdin: "0 0 1 0 0\n2", expectedStdout: "true", isSample: true },
      { stdin: "0 0 0 0 0\n3", expectedStdout: "true" },
      { stdin: "0 0 0 0 0\n4", expectedStdout: "false" },
      { stdin: "1\n1", expectedStdout: "false" },
      { stdin: "0\n1", expectedStdout: "true" },
      { stdin: "1 0 1 0 1\n0", expectedStdout: "true" },
    ],
  }),

  p({
    ...base,
    slug: "compress-serial-number",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Compress Serial Number",
    patternTags: ["string","strings","simulation","math"],
    signatureId: "fn:string,int->string",
    avgSolveSeconds: 900,
    promptMarkdown: "You are given a `serial` number as a string of digits, and an integer `k`. You must compress the serial number through a series of transformations.\n\nIn each step, if the length of the `serial` is strictly greater than `k`, you divide it into consecutive blocks of length `k` (the last block may be shorter). For each block, calculate the sum of its digits and replace the block with that sum as a string. Repeat this process until the length of the `serial` is less than or equal to `k`.\n\nReturn the fully compressed serial number.\n\n**Constraints**\n- `1 <= serial.length <= 40`\n- `2 <= k <= 40`\n- `serial` consists of digits from '0' to '9'.\n\n**Example 1**\n```\ninput:\n11111222223\n3\noutput: 135\n```\nExplanation: First round: 111 (3), 112 (4), 222 (6), 23 (5) -> \"3465\". Second round: 346 (13), 5 (5) -> \"135\". The length is now 3, which is <= k, so we stop.\n\n**Example 2**\n```\ninput:\n1234\n2\noutput: 37\n```\nExplanation: The first block 12 sums to 3, the second block 34 sums to 7, resulting in \"37\". The length is now 2, which is <= k, so we stop.\n\n**Example 3**\n```\ninput:\n9\n2\noutput: 9\n```\nExplanation: The length is already <= 2, so no changes are made.\n\n**Follow-up:** What is the maximum number of transformation steps required for any input within the given constraints?",
    editorialMarkdown: "## String Transformation and Simulation\n\nThe problem asks us to repeatedly group digits of a string and sum them until the string is short enough. We can simulate the process directly.\n\nUsing a `while` loop that checks if the string length is greater than `k`, we can build the next iteration of the string by stepping through the current string in chunks of size `k`. For each chunk, we loop through its characters, parse them into integers, and add them up. We then convert the sum back into a string and append it to our new string.\n\nTime complexity is O(N) where N is the original length of the string, since each round significantly shrinks the string, leading to a geometric progression of work. Space complexity is O(N) to store the intermediate strings.\n\nThe one trap most solvers hit is incorrectly handling the last block, which might be shorter than `k` characters. Using `min(i + k, length)` ensures you don't read out of bounds.",
    referenceSolution: {
      JAVASCRIPT: "function solve(serial, k) {\n    while (serial.length > k) {\n        let nextSerial = \"\";\n        for (let i = 0; i < serial.length; i += k) {\n            let sum = 0;\n            for (let j = i; j < Math.min(i + k, serial.length); j++) {\n                sum += parseInt(serial[j]);\n            }\n            nextSerial += sum.toString();\n        }\n        serial = nextSerial;\n    }\n    return serial;\n}",
      TYPESCRIPT: "function solve(serial: string, k: number): string {\n    while (serial.length > k) {\n        let nextSerial = \"\";\n        for (let i = 0; i < serial.length; i += k) {\n            let sum = 0;\n            for (let j = i; j < Math.min(i + k, serial.length); j++) {\n                sum += parseInt(serial[j]);\n            }\n            nextSerial += sum.toString();\n        }\n        serial = nextSerial;\n    }\n    return serial;\n}",
      PYTHON: "def solve(serial, k):\n    while len(serial) > k:\n        next_s = \"\"\n        for i in range(0, len(serial), k):\n            sm = 0\n            for j in range(i, min(i+k, len(serial))):\n                sm += int(serial[j])\n            next_s += str(sm)\n        serial = next_s\n    return serial",
      JAVA: "    static String solve(String serial, int k) {\n        while (serial.length() > k) {\n            StringBuilder nextSerial = new StringBuilder();\n            for (int i = 0; i < serial.length(); i += k) {\n                int sum = 0;\n                for (int j = i; j < Math.min(i + k, serial.length()); j++) {\n                    sum += serial.charAt(j) - '0';\n                }\n                nextSerial.append(sum);\n            }\n            serial = nextSerial.toString();\n        }\n        return serial;\n    }",
      CPP: "string solve(string serial, int k) {\n    while (serial.length() > k) {\n        string nextSerial = \"\";\n        for (int i = 0; i < serial.length(); i += k) {\n            int sum = 0;\n            for (int j = i; j < min(i + k, (int)serial.length()); j++) {\n                sum += serial[j] - '0';\n            }\n            nextSerial += to_string(sum);\n        }\n        serial = nextSerial;\n    }\n    return serial;\n}",
      GO: "func solve(serial string, k int) string {\n    for len(serial) > k {\n        nextSerial := \"\"\n        for i := 0; i < len(serial); i += k {\n            sum := 0\n            end := i + k\n            if end > len(serial) {\n                end = len(serial)\n            }\n            for j := i; j < end; j++ {\n                sum += int(serial[j] - '0')\n            }\n            nextSerial += strconv.Itoa(sum)\n        }\n        serial = nextSerial\n    }\n    return serial\n}",
    },
    tests: [
      { stdin: "11111222223\n3", expectedStdout: "135", isSample: true },
      { stdin: "1234\n2", expectedStdout: "37", isSample: true },
      { stdin: "9\n2", expectedStdout: "9", isSample: true },
      { stdin: "00000000\n3", expectedStdout: "000" },
      { stdin: "999\n2", expectedStdout: "99" },
      { stdin: "55555\n3", expectedStdout: "70" },
      { stdin: "12345\n2", expectedStdout: "15" },
      { stdin: "123\n3", expectedStdout: "123" },
    ],
  }),
];
