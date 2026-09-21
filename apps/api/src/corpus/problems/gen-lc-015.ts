import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-015` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_015_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "longest-diagnostic-phase",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Longest Diagnostic Phase",
    patternTags: ["array","matrix","maximum","scanning"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 600,
    promptMarkdown: "A factory machine undergoes a sequence of diagnostic tests. You are given a 2D integer array `tests` where each element is `[test_id, completion_time]`.\n\nThe tests are run sequentially. The time taken to run a test is the difference between its `completion_time` and the `completion_time` of the test immediately preceding it. For the very first test, its duration is simply its `completion_time`.\n\nReturn the `test_id` of the test that took the longest time to complete. If there is a tie for the longest duration, return the smallest `test_id` among them.\n\n**Constraints**\n- `1 <= tests.length <= 40`\n- `0 <= test_id <= 100`\n- `1 <= completion_time <= 1000`\n- The `completion_time` values are strictly increasing.\n\n**Example 1**\n```\ninput:\n1 10; 2 25; 3 30\noutput: 2\n```\nExplanation: Test 1 takes 10. Test 2 takes 25 - 10 = 15. Test 3 takes 30 - 25 = 5. Test 2 took the longest.\n\n**Example 2**\n```\ninput:\n5 5; 10 10; 1 15\noutput: 1\n```\nExplanation: Test 5 takes 5. Test 10 takes 5. Test 1 takes 5. All take the same time, but test 1 has the smallest ID.\n\n**Example 3**\n```\ninput:\n2 10\noutput: 2\n```\nExplanation: There is only one test, which takes 10 units of time.\n\n**Follow-up:** Can you find the longest phase in a single pass with O(1) extra space?",
    editorialMarkdown: "## Track Maximum Difference\n\nTo solve this, we can iterate through the array and calculate the duration of each test. We must keep track of the maximum duration seen so far, and the `test_id` associated with it.\n\nFor the first test at index 0, the duration is simply `tests[0][1]`, and we initialize our maximum duration and best ID with this test. For each subsequent test at index `i`, its duration is `tests[i][1] - tests[i-1][1]`. If this duration is strictly greater than the maximum seen so far, we update our maximum duration and best ID. If it is exactly equal, we only update the best ID if the current test's ID is smaller than the best ID recorded.\n\nThe time complexity is O(N) where N is the number of tests, since we do a single pass over the array. Space complexity is O(1).\n\nThe one trap most solvers hit is mishandling the base case for the first test (index 0), either skipping it entirely or attempting to subtract an out-of-bounds previous time.",
    referenceSolution: {
      JAVASCRIPT: "function solve(tests) {\n    let maxTime = tests[0][1];\n    let bestId = tests[0][0];\n    for (let i = 1; i < tests.length; i++) {\n        let t = tests[i][1] - tests[i-1][1];\n        if (t > maxTime || (t === maxTime && tests[i][0] < bestId)) {\n            maxTime = t;\n            bestId = tests[i][0];\n        }\n    }\n    return bestId;\n}",
      TYPESCRIPT: "function solve(tests: number[][]): number {\n    let maxTime = tests[0][1];\n    let bestId = tests[0][0];\n    for (let i = 1; i < tests.length; i++) {\n        let t = tests[i][1] - tests[i-1][1];\n        if (t > maxTime || (t === maxTime && tests[i][0] < bestId)) {\n            maxTime = t;\n            bestId = tests[i][0];\n        }\n    }\n    return bestId;\n}",
      PYTHON: "def solve(tests):\n    max_time = tests[0][1]\n    best_id = tests[0][0]\n    for i in range(1, len(tests)):\n        t = tests[i][1] - tests[i-1][1]\n        if t > max_time or (t == max_time and tests[i][0] < best_id):\n            max_time = t\n            best_id = tests[i][0]\n    return best_id",
      JAVA: "    static int solve(int[][] tests) {\n        int maxTime = tests[0][1];\n        int bestId = tests[0][0];\n        for (int i = 1; i < tests.length; i++) {\n            int t = tests[i][1] - tests[i-1][1];\n            if (t > maxTime || (t == maxTime && tests[i][0] < bestId)) {\n                maxTime = t;\n                bestId = tests[i][0];\n            }\n        }\n        return bestId;\n    }",
      CPP: "int solve(vector<vector<int>> tests) {\n    int max_time = tests[0][1];\n    int best_id = tests[0][0];\n    for (int i = 1; i < tests.size(); i++) {\n        int t = tests[i][1] - tests[i-1][1];\n        if (t > max_time || (t == max_time && tests[i][0] < best_id)) {\n            max_time = t;\n            best_id = tests[i][0];\n        }\n    }\n    return best_id;\n}",
      GO: "func solve(tests [][]int) int {\n    maxTime := tests[0][1]\n    bestId := tests[0][0]\n    for i := 1; i < len(tests); i++ {\n        t := tests[i][1] - tests[i-1][1]\n        if t > maxTime || (t == maxTime && tests[i][0] < bestId) {\n            maxTime = t\n            bestId = tests[i][0]\n        }\n    }\n    return bestId\n}",
    },
    tests: [
      { stdin: "1 10; 2 25; 3 30", expectedStdout: "2", isSample: true },
      { stdin: "5 5; 10 10; 1 15", expectedStdout: "1", isSample: true },
      { stdin: "2 10", expectedStdout: "2", isSample: true },
      { stdin: "4 20; 3 40; 2 60", expectedStdout: "2" },
      { stdin: "1 10; 2 15; 3 30; 4 45", expectedStdout: "3" },
      { stdin: "100 1000", expectedStdout: "100" },
      { stdin: "5 10; 6 11; 7 12", expectedStdout: "5" },
      { stdin: "1 1; 2 2; 3 3; 4 4; 5 5; 6 10", expectedStdout: "6" },
    ],
  }),

  p({
    ...base,
    slug: "compute-bandwidth-cost",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Compute Bandwidth Cost",
    patternTags: ["array","matrix","math","simulation"],
    signatureId: "fn:matrix,int->int",
    avgSolveSeconds: 700,
    promptMarkdown: "A cloud hosting provider charges for server bandwidth using a tiered pricing model. You are given a 2D integer array `tiers` where each element is `[upper_limit, cost_per_gb]`, indicating that bandwidth up to `upper_limit` is charged at `cost_per_gb` per gigabyte. \n\nYou are also given an integer `usage` representing the total gigabytes of bandwidth consumed. The limits in `tiers` are cumulative and strictly increasing, and `usage` will not exceed the final upper limit.\n\nCalculate and return the total cost of the bandwidth used.\n\n**Constraints**\n- `1 <= tiers.length <= 40`\n- `1 <= upper_limit <= 1000`\n- `0 <= cost_per_gb <= 100`\n- `0 <= usage <= tiers[tiers.length - 1][0]`\n- `upper_limit` values are strictly increasing.\n\n**Example 1**\n```\ninput:\n10 5; 20 10\n15\noutput: 100\n```\nExplanation: The first 10 GB cost 5 each (50). The remaining 5 GB fall into the second tier and cost 10 each (50). Total = 50 + 50 = 100.\n\n**Example 2**\n```\ninput:\n5 10; 10 20; 15 30\n3\noutput: 30\n```\nExplanation: All 3 GB fall into the first tier and cost 10 each. Total = 30.\n\n**Example 3**\n```\ninput:\n5 10\n0\noutput: 0\n```\nExplanation: 0 GB used results in 0 cost.\n\n**Follow-up:** Can you implement this in a single loop evaluating exactly how much bandwidth belongs to each tier?",
    editorialMarkdown: "## Processing Cumulative Limits\n\nTo calculate the cost, we must process the bandwidth tier by tier, determining how many gigabytes of our total `usage` fall into the current tier's bracket.\n\nWe keep track of a `prev` variable (initially 0) which represents the boundary of the previous tier. For each tier, the maximum amount of bandwidth that can be charged at its rate is `upper_limit - prev`. However, we only have `usage - prev` gigabytes remaining to be billed. Therefore, the actual amount of bandwidth billed at this tier is `min(usage, upper_limit) - prev`. If this amount is greater than zero, we multiply it by the tier's `cost_per_gb` and add it to our total cost. Then we update `prev` to `upper_limit` and proceed to the next tier.\n\nThe time complexity is O(N) where N is the number of tiers, as we process each tier exactly once. Space complexity is O(1).\n\nThe one trap most solvers hit is misinterpreting `upper_limit` as the capacity of the tier itself rather than a cumulative threshold, or failing to bound the billed amount when `usage` runs out in the middle of a tier.",
    referenceSolution: {
      JAVASCRIPT: "function solve(tiers, usage) {\n    let total = 0, prev = 0;\n    for (let t of tiers) {\n        let limit = t[0], cost = t[1];\n        if (usage > prev) {\n            let amount = Math.min(usage, limit) - prev;\n            if (amount > 0) {\n                total += amount * cost;\n            }\n        }\n        prev = limit;\n    }\n    return total;\n}",
      TYPESCRIPT: "function solve(tiers: number[][], usage: number): number {\n    let total = 0, prev = 0;\n    for (let t of tiers) {\n        let limit = t[0], cost = t[1];\n        if (usage > prev) {\n            let amount = Math.min(usage, limit) - prev;\n            if (amount > 0) {\n                total += amount * cost;\n            }\n        }\n        prev = limit;\n    }\n    return total;\n}",
      PYTHON: "def solve(tiers, usage):\n    total, prev = 0, 0\n    for limit, cost in tiers:\n        if usage > prev:\n            amount = min(usage, limit) - prev\n            if amount > 0:\n                total += amount * cost\n        prev = limit\n    return total",
      JAVA: "    static int solve(int[][] tiers, int usage) {\n        int total = 0, prev = 0;\n        for (int[] t : tiers) {\n            int limit = t[0], cost = t[1];\n            if (usage > prev) {\n                int amount = Math.min(usage, limit) - prev;\n                if (amount > 0) {\n                    total += amount * cost;\n                }\n            }\n            prev = limit;\n        }\n        return total;\n    }",
      CPP: "int solve(vector<vector<int>> tiers, int usage) {\n    int total = 0, prev = 0;\n    for (auto& t : tiers) {\n        int limit = t[0], cost = t[1];\n        if (usage > prev) {\n            int amount = min(usage, limit) - prev;\n            if (amount > 0) {\n                total += amount * cost;\n            }\n        }\n        prev = limit;\n    }\n    return total;\n}",
      GO: "func solve(tiers [][]int, usage int) int {\n    total, prev := 0, 0\n    for _, t := range tiers {\n        limit, cost := t[0], t[1]\n        if usage > prev {\n            amount := usage - prev\n            if limit < usage {\n                amount = limit - prev\n            }\n            if amount > 0 {\n                total += amount * cost\n            }\n        }\n        prev = limit\n    }\n    return total\n}",
    },
    tests: [
      { stdin: "10 5; 20 10\n15", expectedStdout: "100", isSample: true },
      { stdin: "5 10; 10 20; 15 30\n3", expectedStdout: "30", isSample: true },
      { stdin: "5 10\n0", expectedStdout: "0", isSample: true },
      { stdin: "100 1; 200 2; 300 3\n300", expectedStdout: "600" },
      { stdin: "100 1; 200 2; 300 3\n250", expectedStdout: "450" },
      { stdin: "50 50; 100 100\n50", expectedStdout: "2500" },
      { stdin: "10 0; 20 5\n15", expectedStdout: "25" },
      { stdin: "100 100; 200 100; 300 100\n300", expectedStdout: "30000" },
    ],
  }),

  p({
    ...base,
    slug: "determine-average-signal-strength",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Determine Average Signal Strength",
    patternTags: ["array","math","simulation"],
    signatureId: "fn:ints->double",
    avgSolveSeconds: 600,
    promptMarkdown: "A sensor records signal strength over time. Instead of storing every single reading, the device compresses the data by storing consecutive identical readings as a pair. \n\nYou are given an integer array `data` of even length. Every adjacent pair of integers `(data[2*i], data[2*i + 1])` represents a recorded signal `value` and the `frequency` (how many consecutive times it was recorded).\n\nCalculate the overall average signal strength (the arithmetic mean of all decompressed readings). Return the exact mean as a double.\n\n**Constraints**\n- `2 <= data.length <= 40`\n- `data.length` is even.\n- `0 <= value <= 1000`\n- `1 <= frequency <= 100`\n\n**Example 1**\n```\ninput:\n10 2 20 3\noutput: 16.000000\n```\nExplanation: The decompressed readings are [10, 10, 20, 20, 20]. The sum is 80 and total frequency is 5. Average = 16.0.\n\n**Example 2**\n```\ninput:\n5 1\noutput: 5.000000\n```\nExplanation: A single reading of 5. Average is 5.0.\n\n**Example 3**\n```\ninput:\n0 10 10 10\noutput: 5.000000\n```\nExplanation: 10 readings of 0, and 10 readings of 10. The sum is 100 and total frequency is 20. Average = 5.0.\n\n**Follow-up:** Can you compute the average without actually decompressing the array into a larger memory structure?",
    editorialMarkdown: "## Calculating Compressed Aggregates\n\nThe problem requires finding the mean of a dataset given in a compressed run-length encoded format. The mean is simply the sum of all values divided by the total number of values.\n\nSince the data is compressed, we can calculate the total sum and total count without decompressing it. For each pair `(value, frequency)`, the contribution to the total sum is `value * frequency`, and the contribution to the total count is `frequency`. We iterate through the array in steps of 2, maintaining a running `total_sum` and `total_count`. Finally, we return the float division of `total_sum` by `total_count`.\n\nThe time complexity is O(N) where N is the number of elements in the `data` array, since we process each pair in constant time. Space complexity is O(1).\n\nThe one trap most solvers hit is forgetting to cast the sums to floating-point types before division in strongly typed languages like Java or C++, resulting in unwanted integer truncation.",
    referenceSolution: {
      JAVASCRIPT: "function solve(data) {\n    let sum = 0;\n    let count = 0;\n    for (let i = 0; i < data.length; i += 2) {\n        sum += data[i] * data[i+1];\n        count += data[i+1];\n    }\n    return sum / count;\n}",
      TYPESCRIPT: "function solve(data: number[]): number {\n    let sum = 0;\n    let count = 0;\n    for (let i = 0; i < data.length; i += 2) {\n        sum += data[i] * data[i+1];\n        count += data[i+1];\n    }\n    return sum / count;\n}",
      PYTHON: "def solve(data):\n    total_sum = 0\n    total_count = 0\n    for i in range(0, len(data), 2):\n        total_sum += data[i] * data[i+1]\n        total_count += data[i+1]\n    return float(total_sum) / total_count",
      JAVA: "    static double solve(int[] data) {\n        long sum = 0;\n        long count = 0;\n        for (int i = 0; i < data.length; i += 2) {\n            sum += (long)data[i] * data[i+1];\n            count += data[i+1];\n        }\n        return (double)sum / count;\n    }",
      CPP: "double solve(vector<int> data) {\n    long long sum = 0;\n    long long count = 0;\n    for (int i = 0; i < data.size(); i += 2) {\n        sum += (long long)data[i] * data[i+1];\n        count += data[i+1];\n    }\n    return (double)sum / count;\n}",
      GO: "func solve(data []int) float64 {\n    var sum int64 = 0\n    var count int64 = 0\n    for i := 0; i < len(data); i += 2 {\n        sum += int64(data[i]) * int64(data[i+1])\n        count += int64(data[i+1])\n    }\n    return float64(sum) / float64(count)\n}",
    },
    tests: [
      { stdin: "10 2 20 3", expectedStdout: "16.000000", isSample: true },
      { stdin: "5 1", expectedStdout: "5.000000", isSample: true },
      { stdin: "0 10 10 10", expectedStdout: "5.000000", isSample: true },
      { stdin: "100 1 200 1 300 1", expectedStdout: "200.000000" },
      { stdin: "7 3", expectedStdout: "7.000000" },
      { stdin: "1 100 2 100", expectedStdout: "1.500000" },
      { stdin: "50 20", expectedStdout: "50.000000" },
      { stdin: "3 3 5 5 7 2", expectedStdout: "4.800000" },
    ],
  }),

  p({
    ...base,
    slug: "dial-lock-final-position",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Dial Lock Final Position",
    patternTags: ["math","modulo","simulation"],
    signatureId: "fn:int,int->int",
    avgSolveSeconds: 400,
    promptMarkdown: "A combination lock features a circular dial with 100 positions numbered from `0` to `99`. \n\nYou are given an integer `current_position` representing the current number the dial is pointing to, and an integer `turns` representing how many positions you rotate the dial clockwise. \n\nReturn the final position of the dial after all the turns are completed.\n\n**Constraints**\n- `0 <= current_position <= 99`\n- `0 <= turns <= 1000`\n\n**Example 1**\n```\ninput:\n10\n15\noutput: 25\n```\nExplanation: Starting at 10 and moving 15 positions clockwise lands on 25.\n\n**Example 2**\n```\ninput:\n95\n10\noutput: 5\n```\nExplanation: Starting at 95 and moving 10 positions clockwise wraps around past 99 and lands on 5.\n\n**Example 3**\n```\ninput:\n0\n0\noutput: 0\n```\nExplanation: No turns are made, so the dial remains at 0.\n\n**Follow-up:** What if `turns` could be a massive number, up to 10^9? Can you solve it in O(1) time?",
    editorialMarkdown: "## Circular Geometry and Modulo\n\nThis is a classic circular array problem. Because the dial is circular with exactly 100 positions, moving past 99 wraps around back to 0.\n\nWe can mathematically determine the final position by simulating the total movement and then taking the remainder when divided by the dial's size (100). The formula `(current_position + turns) % 100` computes the exact final position instantly, handling any wrap-around cleanly.\n\nThe time complexity is O(1) as the calculation is a single arithmetic operation. The space complexity is O(1).\n\nThe one trap most solvers hit is writing loops to step one position at a time or subtracting 100 only once, failing when the number of turns involves multiple full rotations around the dial.",
    referenceSolution: {
      JAVASCRIPT: "function solve(current, turns) {\n    return (current + turns) % 100;\n}",
      TYPESCRIPT: "function solve(current: number, turns: number): number {\n    return (current + turns) % 100;\n}",
      PYTHON: "def solve(current, turns):\n    return (current + turns) % 100",
      JAVA: "    static int solve(int current, int turns) {\n        return (current + turns) % 100;\n    }",
      CPP: "int solve(int current, int turns) {\n    return (current + turns) % 100;\n}",
      GO: "func solve(current int, turns int) int {\n    return (current + turns) % 100\n}",
    },
    tests: [
      { stdin: "10\n15", expectedStdout: "25", isSample: true },
      { stdin: "95\n10", expectedStdout: "5", isSample: true },
      { stdin: "0\n0", expectedStdout: "0", isSample: true },
      { stdin: "50\n100", expectedStdout: "50" },
      { stdin: "99\n1", expectedStdout: "0" },
      { stdin: "1\n99", expectedStdout: "0" },
      { stdin: "0\n50", expectedStdout: "50" },
      { stdin: "25\n225", expectedStdout: "50" },
    ],
  }),

  p({
    ...base,
    slug: "find-grand-mentors",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Find Grand Mentors",
    patternTags: ["array","simulation","indexing"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "In a corporate mentorship program, there are `n` employees numbered from `0` to `n - 1`. Each employee is assigned exactly one direct mentor, and this mapping forms a complete permutation (meaning every employee is also a direct mentor to exactly one employee).\n\nYou are given an integer array `mentors` of length `n`, where `mentors[i]` represents the direct mentor of employee `i`.\n\nYour task is to determine the \"grand mentor\" for each employee. An employee's grand mentor is the mentor of their direct mentor. Return an array where the `i`-th element is the grand mentor of employee `i`.\n\n**Constraints**\n- `1 <= mentors.length <= 40`\n- `0 <= mentors[i] < mentors.length`\n- All elements in `mentors` are unique.\n\n**Example 1**\n```\ninput:\n2 0 1\noutput: 1 2 0\n```\nExplanation: Employee 0's mentor is 2, whose mentor is 1. Employee 1's mentor is 0, whose mentor is 2. Employee 2's mentor is 1, whose mentor is 0.\n\n**Example 2**\n```\ninput:\n0 1 2\noutput: 0 1 2\n```\nExplanation: Each employee is their own mentor, so their grand mentor is also themselves.\n\n**Example 3**\n```\ninput:\n3 1 2 0\noutput: 0 1 2 3\n```\nExplanation: Employee 0's mentor is 3, whose mentor is 0. Employee 1 and 2 mentor themselves. Employee 3's mentor is 0, whose mentor is 3.\n\n**Follow-up:** Can you solve this in O(1) auxiliary space (modifying the input array in place)?",
    editorialMarkdown: "## Array Indexing\n\nThis problem asks us to perform a two-step lookup for each index. Since the array itself maps an employee to their mentor, we can find the grand mentor for employee `i` by looking up the mentor of `mentors[i]`. In code, this translates directly to accessing `mentors[mentors[i]]`.\n\nWe can simply iterate through the array from `0` to `n-1`, compute `mentors[mentors[i]]`, and place it in a new result array at index `i`. \n\nThe time complexity is O(N) because we visit each element exactly once. The space complexity is O(N) to hold the resulting array.\n\nThe one trap most solvers hit is modifying the `mentors` array in place during a simple forward loop without preserving the original values, causing subsequent lookups to use the new grand mentors instead of the original direct mentors.",
    referenceSolution: {
      JAVASCRIPT: "function solve(mentors) {\n    return mentors.map(m => mentors[m]);\n}",
      TYPESCRIPT: "function solve(mentors: number[]): number[] {\n    return mentors.map(m => mentors[m]);\n}",
      PYTHON: "def solve(mentors):\n    return [mentors[m] for m in mentors]",
      JAVA: "    static int[] solve(int[] mentors) {\n        int[] ans = new int[mentors.length];\n        for (int i = 0; i < mentors.length; i++) {\n            ans[i] = mentors[mentors[i]];\n        }\n        return ans;\n    }",
      CPP: "vector<int> solve(vector<int> mentors) {\n    vector<int> ans(mentors.size());\n    for(int i = 0; i < mentors.size(); i++) {\n        ans[i] = mentors[mentors[i]];\n    }\n    return ans;\n}",
      GO: "func solve(mentors []int) []int {\n    ans := make([]int, len(mentors))\n    for i, m := range mentors {\n        ans[i] = mentors[m]\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "2 0 1", expectedStdout: "1 2 0", isSample: true },
      { stdin: "0 1 2", expectedStdout: "0 1 2", isSample: true },
      { stdin: "3 1 2 0", expectedStdout: "0 1 2 3", isSample: true },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "3 2 0 1", expectedStdout: "1 0 3 2" },
      { stdin: "1 2 3 4 5 0", expectedStdout: "2 3 4 5 0 1" },
      { stdin: "4 0 1 2 3", expectedStdout: "3 4 0 1 2" },
      { stdin: "1 0", expectedStdout: "0 1" },
      { stdin: "0 1 2 3 4 5 6 7 8 9", expectedStdout: "0 1 2 3 4 5 6 7 8 9" },
    ],
  }),
];
