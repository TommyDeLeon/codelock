import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-005` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_005_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "oscillating-power-levels",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Oscillating Power Levels",
    patternTags: ["math","string","digits"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 400,
    promptMarkdown: "Given a positive integer `n`, compute the sum of its digits with alternating signs.\\n\\nThe most significant digit (leftmost) is added, the next digit is subtracted, the third is added, and so on.\\n\\n**Constraints**\\n- `1 <= n <= 10^9`\\n\\n**Example 1**\\n```\\ninput:\\n521\\noutput: 4\\n```\\nThe digits are processed as 5 - 2 + 1 = 4.\\n\\n**Example 2**\\n```\\ninput:\\n111\\noutput: 1\\n```\\nThe digits are processed as 1 - 1 + 1 = 1.\\n\\n**Example 3**\\n```\\ninput:\\n886996\\noutput: 0\\n```\\nThe digits are processed as 8 - 8 + 6 - 9 + 9 - 6 = 0.\\n\\n**Follow-up:** Can you solve this in O(1) space without string conversion?",
    editorialMarkdown: "## Alternating Additions\\n\\nTo compute the alternating digit sum, we can convert the integer to a string, then iterate through each character. For characters at even indices (0, 2, 4...), we add the digit to our total sum. For characters at odd indices, we subtract the digit from the sum.\\n\\nTime complexity is O(D) where D is the number of digits, and space complexity is O(D) to store the string representation.\\n\\nThe one trap most solvers hit is forgetting to parse the character correctly into an integer before adding or subtracting, resulting in weird string concatenation behaviors in loosely-typed languages.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n) {\n    let s = n.toString();\n    let sum = 0;\n    for (let i = 0; i < s.length; i++) {\n        let d = parseInt(s[i]);\n        if (i % 2 === 0) sum += d;\n        else sum -= d;\n    }\n    return sum;\n}",
      TYPESCRIPT: "function solve(n: number): number {\n    let s = n.toString();\n    let sum = 0;\n    for (let i = 0; i < s.length; i++) {\n        let d = parseInt(s[i]);\n        if (i % 2 === 0) sum += d;\n        else sum -= d;\n    }\n    return sum;\n}",
      PYTHON: "def solve(n):\n    s = str(n)\n    ans = 0\n    for i, ch in enumerate(s):\n        d = int(ch)\n        if i % 2 == 0: ans += d\n        else: ans -= d\n    return ans",
      JAVA: "    static int solve(int n) {\n        String s = Integer.toString(n);\n        int sum = 0;\n        for (int i = 0; i < s.length(); i++) {\n            int d = s.charAt(i) - '0';\n            if (i % 2 == 0) sum += d;\n            else sum -= d;\n        }\n        return sum;\n    }",
      CPP: "int solve(int n) {\n    string s = to_string(n);\n    int sum = 0;\n    for (int i = 0; i < s.length(); i++) {\n        int d = s[i] - '0';\n        if (i % 2 == 0) sum += d;\n        else sum -= d;\n    }\n    return sum;\n}",
      GO: "func solve(n int) int {\n    s := strconv.Itoa(n)\n    sum := 0\n    for i := 0; i < len(s); i++ {\n        d := int(s[i] - '0')\n        if i % 2 == 0 {\n            sum += d\n        } else {\n            sum -= d\n        }\n    }\n    return sum\n}",
    },
    tests: [
      { stdin: "521", expectedStdout: "4", isSample: true },
      { stdin: "111", expectedStdout: "1", isSample: true },
      { stdin: "886996", expectedStdout: "0" },
      { stdin: "9", expectedStdout: "9" },
      { stdin: "10", expectedStdout: "1" },
      { stdin: "9999", expectedStdout: "0" },
      { stdin: "123456", expectedStdout: "-3" },
      { stdin: "2024", expectedStdout: "0" },
    ],
  }),

  p({
    ...base,
    slug: "drone-base-returns",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Drone Base Returns",
    patternTags: ["array","prefix-sum","simulation"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 300,
    promptMarkdown: "A drone starts at its base (position 0) and makes a sequence of movements along a straight line.\\nYou are given an array of non-zero integers `moves`, where a positive value means moving right, and a negative value means moving left.\\n\\nReturn the total number of times the drone returns exactly to its base (position 0) after making a move.\\n\\n**Constraints**\\n- `1 <= moves.length <= 100`\\n- `-10 <= moves[i] <= 10`\\n- `moves[i] != 0`\\n\\n**Example 1**\\n```\\ninput:\\n2 -2 1 -1\\noutput: 2\\n```\\nThe drone moves to 2, then back to 0 (first return). It moves to 1, then back to 0 (second return).\\n\\n**Example 2**\\n```\\ninput:\\n1 1 1 1\\noutput: 0\\n```\\nThe drone just moves away and never returns to 0.\\n\\n**Example 3**\\n```\\ninput:\\n-1 1 -1 1\\noutput: 2\\n```\\nIt visits position -1, then 0, then -1, then 0.\\n\\n**Follow-up:** Can you solve this with O(1) auxiliary space?",
    editorialMarkdown: "## Prefix Sum Tracking\\n\\nWe need to track the position of the drone as it processes each movement. We can initialize a position variable to 0. For each movement in the array, we add it to the position. If the updated position is exactly 0, we increment our counter.\\n\\nTime complexity is O(N) where N is the length of the moves array, and space complexity is O(1).\\n\\nThe one trap most solvers hit is accidentally counting the initial position (at the start) before any moves are made.",
    referenceSolution: {
      JAVASCRIPT: "function solve(moves) {\n    let pos = 0;\n    let count = 0;\n    for (let m of moves) {\n        pos += m;\n        if (pos === 0) count++;\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(moves: number[]): number {\n    let pos = 0;\n    let count = 0;\n    for (let m of moves) {\n        pos += m;\n        if (pos === 0) count++;\n    }\n    return count;\n}",
      PYTHON: "def solve(moves):\n    pos = 0\n    count = 0\n    for m in moves:\n        pos += m\n        if pos == 0:\n            count += 1\n    return count",
      JAVA: "    static int solve(int[] moves) {\n        int pos = 0;\n        int count = 0;\n        for (int m : moves) {\n            pos += m;\n            if (pos == 0) count++;\n        }\n        return count;\n    }",
      CPP: "int solve(vector<int> moves) {\n    int pos = 0;\n    int count = 0;\n    for (int m : moves) {\n        pos += m;\n        if (pos == 0) count++;\n    }\n    return count;\n}",
      GO: "func solve(moves []int) int {\n    pos := 0\n    count := 0\n    for _, m := range moves {\n        pos += m\n        if pos == 0 {\n            count++\n        }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "2 -2 1 -1", expectedStdout: "2", isSample: true },
      { stdin: "1 1 1 1", expectedStdout: "0", isSample: true },
      { stdin: "-1 1 -1 1", expectedStdout: "2" },
      { stdin: "5 -5 5 -5", expectedStdout: "2" },
      { stdin: "10 -10", expectedStdout: "1" },
      { stdin: "1 2 -3", expectedStdout: "1" },
      { stdin: "-2 2 -2 2", expectedStdout: "2" },
      { stdin: "3 3 -6 1 -1", expectedStdout: "2" },
    ],
  }),

  p({
    ...base,
    slug: "combine-slimes",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Combine Slimes",
    patternTags: ["array","simulation","two-pointers"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "You have a row of slimes represented by an array of integers `slimes`.\\n\\nYou must process the array from left to right. If `slimes[i] == slimes[i+1]` and both are non-zero, they combine into the left slime: `slimes[i]` is doubled, and `slimes[i+1]` becomes 0.\\nAfter performing this operation for all valid adjacent pairs (from `i = 0` to `n - 2`), shift all the `0`s to the end of the array, maintaining the relative order of the non-zero slimes.\\n\\n**Constraints**\\n- `2 <= slimes.length <= 100`\\n- `0 <= slimes[i] <= 1000`\\n\\n**Example 1**\\n```\\ninput:\\n2 2 0 4 4\\noutput: 4 8 0 0 0\\n```\\nThe first two 2s combine into 4 (and 0). The 4s combine into 8 (and 0). The non-zero elements `4` and `8` are shifted to the front.\\n\\n**Example 2**\\n```\\ninput:\\n1 2 3\\noutput: 1 2 3\\n```\\nNone of the slimes combine, and there are no 0s to move.\\n\\n**Example 3**\\n```\\ninput:\\n4 4 4 4 4\\noutput: 8 8 4 0 0\\n```\\nAt i=0, slimes become 8, 0. At i=2, they become 8, 0. The elements 8, 0, 8, 0, 4 are then collected and zeroes moved to the end.\\n\\n**Follow-up:** Can you solve this in O(N) time and O(N) space?",
    editorialMarkdown: "## Simulation and Shifting Elements\\n\\nThe problem can be solved with simulation and array manipulation. We first pass over the array from left to right. If two adjacent non-zero slimes have identical values, we double the left one and set the right one to 0.\\n\\nAfter all combinations are performed, we can simply iterate through the array and append all non-zero elements to a new result array. Finally, we append enough zeroes to the end of the result to match the original array's length.\\n\\nTime complexity is O(N) where N is the length of the array, and space complexity is O(N) to hold the output array.\\n\\nThe one trap most solvers hit is accidentally processing a newly formed zero again, or ignoring zeroes in between two identical sizes, but the problem explicitly states we only check strictly adjacent elements.",
    referenceSolution: {
      JAVASCRIPT: "function solve(slimes) {\n    let n = slimes.length;\n    for (let i = 0; i < n - 1; i++) {\n        if (slimes[i] !== 0 && slimes[i] === slimes[i + 1]) {\n            slimes[i] *= 2;\n            slimes[i + 1] = 0;\n        }\n    }\n    let res = [];\n    for (let s of slimes) {\n        if (s !== 0) res.push(s);\n    }\n    while (res.length < n) res.push(0);\n    return res;\n}",
      TYPESCRIPT: "function solve(slimes: number[]): number[] {\n    let n = slimes.length;\n    for (let i = 0; i < n - 1; i++) {\n        if (slimes[i] !== 0 && slimes[i] === slimes[i + 1]) {\n            slimes[i] *= 2;\n            slimes[i + 1] = 0;\n        }\n    }\n    let res: number[] = [];\n    for (let s of slimes) {\n        if (s !== 0) res.push(s);\n    }\n    while (res.length < n) res.push(0);\n    return res;\n}",
      PYTHON: "def solve(slimes):\n    n = len(slimes)\n    for i in range(n - 1):\n        if slimes[i] != 0 and slimes[i] == slimes[i + 1]:\n            slimes[i] *= 2\n            slimes[i + 1] = 0\n    res = [s for s in slimes if s != 0]\n    while len(res) < n:\n        res.append(0)\n    return res",
      JAVA: "    static int[] solve(int[] slimes) {\n        int n = slimes.length;\n        for (int i = 0; i < n - 1; i++) {\n            if (slimes[i] != 0 && slimes[i] == slimes[i + 1]) {\n                slimes[i] *= 2;\n                slimes[i + 1] = 0;\n            }\n        }\n        int[] res = new int[n];\n        int idx = 0;\n        for (int s : slimes) {\n            if (s != 0) res[idx++] = s;\n        }\n        return res;\n    }",
      CPP: "vector<int> solve(vector<int> slimes) {\n    int n = slimes.size();\n    for (int i = 0; i < n - 1; i++) {\n        if (slimes[i] != 0 && slimes[i] == slimes[i + 1]) {\n            slimes[i] *= 2;\n            slimes[i + 1] = 0;\n        }\n    }\n    vector<int> res;\n    for (int s : slimes) {\n        if (s != 0) res.push_back(s);\n    }\n    while (res.size() < n) res.push_back(0);\n    return res;\n}",
      GO: "func solve(slimes []int) []int {\n    n := len(slimes)\n    for i := 0; i < n - 1; i++ {\n        if slimes[i] != 0 && slimes[i] == slimes[i + 1] {\n            slimes[i] *= 2\n            slimes[i + 1] = 0\n        }\n    }\n    res := make([]int, 0, n)\n    for _, s := range slimes {\n        if s != 0 {\n            res = append(res, s)\n        }\n    }\n    for len(res) < n {\n        res = append(res, 0)\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "2 2 0 4 4", expectedStdout: "4 8 0 0 0", isSample: true },
      { stdin: "1 2 3", expectedStdout: "1 2 3", isSample: true },
      { stdin: "2 2 2 2", expectedStdout: "4 4 0 0" },
      { stdin: "0 0 0", expectedStdout: "0 0 0" },
      { stdin: "4 4 4 4 4", expectedStdout: "8 8 4 0 0" },
      { stdin: "5 5", expectedStdout: "10 0" },
      { stdin: "1 1 0 1 1", expectedStdout: "2 2 0 0 0" },
      { stdin: "2 0 2 0", expectedStdout: "2 2 0 0" },
    ],
  }),

  p({
    ...base,
    slug: "alternating-work-shifts",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Alternating Work Shifts",
    patternTags: ["array","circular-array","sliding-window"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing a repeating schedule represented by a circular array `shifts` containing `0`s (day shift) and `1`s (night shift).\\n\\nReturn the number of contiguous groups of three shifts where the types strictly alternate. Because the array is circular, the last shift is considered adjacent to the first shift.\\n\\n**Constraints**\\n- `3 <= shifts.length <= 100`\\n- `shifts[i]` is either `0` or `1`.\\n\\n**Example 1**\\n```\\ninput:\\n0 1 0\\noutput: 1\\n```\\nThe group starting at index 0 is `0, 1, 0`, which alternates.\\n\\n**Example 2**\\n```\\ninput:\\n0 1 0 1\\noutput: 4\\n```\\nEvery sequence of 3 shifts alternates: `[0,1,0]`, `[1,0,1]`, `[0,1,0]` (wrapping), `[1,0,1]` (wrapping).\\n\\n**Example 3**\\n```\\ninput:\\n1 1 1\\noutput: 0\\n```\\nNo sequences of 3 alternate.\\n\\n**Follow-up:** Can you solve this in O(1) space?",
    editorialMarkdown: "## Circular Alternating Sequences\\n\\nTo find sequences of three consecutive alternating shifts, we can loop through the array and use modulo arithmetic to wrap around the boundaries safely. For any starting index `i`, the three elements are `shifts[i]`, `shifts[(i+1)%N]`, and `shifts[(i+2)%N]`.\\n\\nWe increment our counter if the first element is different from the second, and the second is different from the third.\\n\\nTime complexity is O(N) where N is the length of the array, because we do a single scan. Space complexity is O(1).\\n\\nThe one trap most solvers hit is failing to wrap correctly for the last two elements of the array by not using the modulo operator.",
    referenceSolution: {
      JAVASCRIPT: "function solve(shifts) {\n    let n = shifts.length;\n    let count = 0;\n    for (let i = 0; i < n; i++) {\n        let a = shifts[i];\n        let b = shifts[(i + 1) % n];\n        let c = shifts[(i + 2) % n];\n        if (a !== b && b !== c) count++;\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(shifts: number[]): number {\n    let n = shifts.length;\n    let count = 0;\n    for (let i = 0; i < n; i++) {\n        let a = shifts[i];\n        let b = shifts[(i + 1) % n];\n        let c = shifts[(i + 2) % n];\n        if (a !== b && b !== c) count++;\n    }\n    return count;\n}",
      PYTHON: "def solve(shifts):\n    n = len(shifts)\n    count = 0\n    for i in range(n):\n        a = shifts[i]\n        b = shifts[(i + 1) % n]\n        c = shifts[(i + 2) % n]\n        if a != b and b != c:\n            count += 1\n    return count",
      JAVA: "    static int solve(int[] shifts) {\n        int n = shifts.length;\n        int count = 0;\n        for (int i = 0; i < n; i++) {\n            int a = shifts[i];\n            int b = shifts[(i + 1) % n];\n            int c = shifts[(i + 2) % n];\n            if (a != b && b != c) count++;\n        }\n        return count;\n    }",
      CPP: "int solve(vector<int> shifts) {\n    int n = shifts.size();\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        int a = shifts[i];\n        int b = shifts[(i + 1) % n];\n        int c = shifts[(i + 2) % n];\n        if (a != b && b != c) count++;\n    }\n    return count;\n}",
      GO: "func solve(shifts []int) int {\n    n := len(shifts)\n    count := 0\n    for i := 0; i < n; i++ {\n        a := shifts[i]\n        b := shifts[(i + 1) % n]\n        c := shifts[(i + 2) % n]\n        if a != b && b != c {\n            count++\n        }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "0 1 0", expectedStdout: "1", isSample: true },
      { stdin: "0 1 0 1", expectedStdout: "4", isSample: true },
      { stdin: "1 1 1", expectedStdout: "0" },
      { stdin: "0 0 0", expectedStdout: "0" },
      { stdin: "1 0 1 0 1 0", expectedStdout: "6" },
      { stdin: "0 1 1 0 1", expectedStdout: "3" },
      { stdin: "1 0 0 1 0", expectedStdout: "3" },
      { stdin: "0 1 0 0 1", expectedStdout: "3" },
    ],
  }),
];
