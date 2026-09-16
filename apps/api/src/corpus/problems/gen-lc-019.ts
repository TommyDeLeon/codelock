import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-019` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_019_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "verify-symmetric-waveform",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Verify Symmetric Waveform",
    patternTags: ["array","two-pointers"],
    signatureId: "fn:ints->bool",
    avgSolveSeconds: 300,
    promptMarkdown: "A sensor logs an array of integer readings. A waveform is considered symmetric if the sequence of readings reads exactly the same forwards and backwards.\n\nGiven an array of integers `signal`, return `true` if it is a symmetric waveform, and `false` otherwise.\n\n**Constraints**\n- `1 <= signal.length <= 1000`\n- `-10^6 <= signal[i] <= 10^6`\n\n**Example 1**\n```\ninput:\n1 2 3 2 1\noutput: true\n```\nExplanation: The sequence reads 1, 2, 3, 2, 1 forwards and backwards.\n\n**Example 2**\n```\ninput:\n1 2 2 1\noutput: true\n```\nExplanation: The sequence is a palindrome of even length.\n\n**Example 3**\n```\ninput:\n1 2 3\noutput: false\n```\nExplanation: The sequence backwards is 3, 2, 1, which does not match.\n\n**Follow-up:** Can you determine if the waveform is symmetric in O(N) time and O(1) extra space?",
    editorialMarkdown: "## Two Pointers Comparison\n\nWe can determine if the array is symmetric by using two pointers, one starting at the beginning of the array and the other at the end. We move them towards the center, comparing the elements at each step. If we find a mismatch, the waveform is not symmetric. If the pointers meet or cross without any mismatches, it is symmetric.\n\nThe time complexity is O(N) since we check each element at most once. The space complexity is O(1) because we only use two pointers.\n\nThe main trap solvers hit is needlessly creating a reversed copy of the array instead of doing an in-place comparison, which wastes memory and reduces efficiency.",
    referenceSolution: {
      JAVASCRIPT: "function solve(signal) {\n    let left = 0, right = signal.length - 1;\n    while (left < right) {\n        if (signal[left] !== signal[right]) return false;\n        left++;\n        right--;\n    }\n    return true;\n}",
      TYPESCRIPT: "function solve(signal: number[]): boolean {\n    let left = 0, right = signal.length - 1;\n    while (left < right) {\n        if (signal[left] !== signal[right]) return false;\n        left++;\n        right--;\n    }\n    return true;\n}",
      PYTHON: "def solve(signal):\n    left, right = 0, len(signal) - 1\n    while left < right:\n        if signal[left] != signal[right]:\n            return False\n        left += 1\n        right -= 1\n    return True",
      JAVA: "    static boolean solve(int[] signal) {\n        int left = 0, right = signal.length - 1;\n        while (left < right) {\n            if (signal[left] != signal[right]) return false;\n            left++;\n            right--;\n        }\n        return true;\n    }",
      CPP: "#include <vector>\n\nbool solve(std::vector<int> signal) {\n    int left = 0, right = signal.size() - 1;\n    while (left < right) {\n        if (signal[left] != signal[right]) return false;\n        left++;\n        right--;\n    }\n    return true;\n}",
      GO: "func solve(signal []int) bool {\n    left, right := 0, len(signal)-1\n    for left < right {\n        if signal[left] != signal[right] {\n            return false\n        }\n        left++\n        right--\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "1 2 3 2 1", expectedStdout: "true", isSample: true },
      { stdin: "1 2 2 1", expectedStdout: "true", isSample: true },
      { stdin: "1 2 3", expectedStdout: "false" },
      { stdin: "42", expectedStdout: "true" },
      { stdin: "-1 0 -1", expectedStdout: "true" },
      { stdin: "1 2 3 4 5 4 3 2 2", expectedStdout: "false" },
      { stdin: "10 10", expectedStdout: "true" },
      { stdin: "-5 -5 -1", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "verify-core-frequency",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Verify Core Frequency",
    patternTags: ["math","digits"],
    signatureId: "fn:int->bool",
    avgSolveSeconds: 300,
    promptMarkdown: "A power core generates a frequency represented by a positive integer `freq`. The frequency is considered stable if it is perfectly divisible by both the sum of its digits and the product of its digits. \n\nIf the product of its digits is `0`, the frequency is immediately considered unstable.\n\nGiven an integer `freq`, return `true` if it is stable, and `false` otherwise.\n\n**Constraints**\n- `1 <= freq <= 10^9`\n\n**Example 1**\n```\ninput:\n12\noutput: true\n```\nExplanation: \n- Sum of digits: 1 + 2 = 3. 12 is divisible by 3.\n- Product of digits: 1 * 2 = 2. 12 is divisible by 2.\nSince both are true, it returns `true`.\n\n**Example 2**\n```\ninput:\n15\noutput: false\n```\nExplanation:\n- Sum of digits: 1 + 5 = 6. 15 is not divisible by 6.\nIt returns `false`.\n\n**Example 3**\n```\ninput:\n102\noutput: false\n```\nExplanation: The product of its digits is 0, so it is unstable.\n\n**Follow-up:** Can you solve this efficiently without converting the integer to a string?",
    editorialMarkdown: "## Digit Extraction Math\n\nTo determine if the frequency is stable, we need to extract its digits to compute both their sum and product. We can do this efficiently using the modulo `10` operation to get the last digit, and integer division by `10` to remove the last digit, repeating until the number is `0`.\n\nOnce we have the sum and product of the digits, we first check if the product is `0` (which happens if any digit is `0`). If so, we immediately return `false` to avoid a division by zero error. Otherwise, we check if `freq` is divisible by both the sum and the product.\n\nThe time complexity is O(log_{10} N), which corresponds to the number of digits in `freq`. The space complexity is O(1).\n\nThe main trap solvers hit is forgetting to check if the digit product is zero before attempting to use it as a divisor, which crashes the program.",
    referenceSolution: {
      JAVASCRIPT: "function solve(freq) {\n    let sum = 0;\n    let prod = 1;\n    let temp = freq;\n    while (temp > 0) {\n        let digit = temp % 10;\n        sum += digit;\n        prod *= digit;\n        temp = Math.floor(temp / 10);\n    }\n    if (prod === 0) return false;\n    return freq % sum === 0 && freq % prod === 0;\n}",
      TYPESCRIPT: "function solve(freq: number): boolean {\n    let sum = 0;\n    let prod = 1;\n    let temp = freq;\n    while (temp > 0) {\n        let digit = temp % 10;\n        sum += digit;\n        prod *= digit;\n        temp = Math.floor(temp / 10);\n    }\n    if (prod === 0) return false;\n    return freq % sum === 0 && freq % prod === 0;\n}",
      PYTHON: "def solve(freq):\n    s = 0\n    p = 1\n    temp = freq\n    while temp > 0:\n        digit = temp % 10\n        s += digit\n        p *= digit\n        temp //= 10\n    if p == 0:\n        return False\n    return freq % s == 0 and freq % p == 0",
      JAVA: "    static boolean solve(int freq) {\n        int sum = 0;\n        int prod = 1;\n        int temp = freq;\n        while (temp > 0) {\n            int digit = temp % 10;\n            sum += digit;\n            prod *= digit;\n            temp /= 10;\n        }\n        if (prod == 0) return false;\n        return freq % sum == 0 && freq % prod == 0;\n    }",
      CPP: "bool solve(int freq) {\n    int sum = 0;\n    long long prod = 1;\n    int temp = freq;\n    while (temp > 0) {\n        int digit = temp % 10;\n        sum += digit;\n        prod *= digit;\n        temp /= 10;\n    }\n    if (prod == 0) return false;\n    return freq % sum == 0 && freq % prod == 0;\n}",
      GO: "func solve(freq int) bool {\n    sum := 0\n    prod := 1\n    temp := freq\n    for temp > 0 {\n        digit := temp % 10\n        sum += digit\n        prod *= digit\n        temp /= 10\n    }\n    if prod == 0 {\n        return false\n    }\n    return freq % sum == 0 && freq % prod == 0\n}",
    },
    tests: [
      { stdin: "12", expectedStdout: "true", isSample: true },
      { stdin: "15", expectedStdout: "false", isSample: true },
      { stdin: "102", expectedStdout: "false" },
      { stdin: "24", expectedStdout: "true" },
      { stdin: "36", expectedStdout: "true" },
      { stdin: "135", expectedStdout: "true" },
      { stdin: "312", expectedStdout: "true" },
      { stdin: "10", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "planetary-shield-coverage",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "INTERVALS",
    title: "Sensor Coverage Verification",
    patternTags: ["array","intervals","hash-set"],
    signatureId: "fn:matrix->bool",
    avgSolveSeconds: 500,
    promptMarkdown: "An industrial facility relies on data `generators` to monitor equipment temperatures. You are provided with a 2D integer array `generators`.\n\nThe first element in `generators` specifies the critical time block `[start, end]` that must be completely logged. Each subsequent element represents the active recording period `[a, b]` of a specific sensor.\n\nReturn `true` if every minute in the inclusive block `[start, end]` was successfully recorded by at least one sensor, and `false` if any minute is missing data.\n\n**Constraints**\n- `2 <= generators.length <= 50`\n- `generators[i].length == 2`\n- `1 <= start <= end <= 50`\n- `1 <= a <= b <= 50`\n\n**Example 1**\n```\ninput:\n1 5;1 2;3 5\noutput: true\n```\nExplanation:\n- The required time block is [1, 5].\n- The first sensor recorded [1, 2].\n- The second sensor recorded [3, 5].\nAll minutes 1, 2, 3, 4, and 5 are fully logged.\n\n**Example 2**\n```\ninput:\n1 5;1 2;4 5\noutput: false\n```\nExplanation: Minute 3 lacks any sensor data.\n\n**Example 3**\n```\ninput:\n10 20;5 15;14 25\noutput: true\n```\nExplanation: The first sensor logged [5, 15] and the second logged [14, 25]. The entire required block [10, 20] is completely verified.\n\n**Follow-up:** Could you solve this efficiently without iterating over every single minute if the time ranges were as large as 10^9?",
    editorialMarkdown: "## Tracking Covered Points\n\nGiven the small constraints on the coordinate ranges (up to 50), the most straightforward way to solve this is to keep track of every individual coordinate that falls under a generator's range.\n\nWe can initialize a boolean array or a hash set to mark covered coordinates. We skip the first row (the target zone), and for each subsequent row `[a, b]`, we mark all coordinates from `a` to `b` as true. Finally, we iterate from `start` to `end` of the target zone and check if every coordinate was marked. If any is unmapped, we return `false`.\n\nThe time complexity is O(G × R), where G is the number of generators and R is the maximum range size. The space complexity is O(R) for tracking the points.\n\nThe main trap solvers hit is trying to sort and merge the intervals perfectly, which works and is optimal for large constraints, but for these small boundaries it introduces unnecessary complexity and edge-case errors. A simple array mapping guarantees correct coverage accounting.",
    referenceSolution: {
      JAVASCRIPT: "function solve(generators) {\n    if (generators.length < 1) return false;\n    const targetStart = generators[0][0];\n    const targetEnd = generators[0][1];\n    const covered = new Set();\n    \n    for (let i = 1; i < generators.length; i++) {\n        const a = generators[i][0];\n        const b = generators[i][1];\n        for (let j = a; j <= b; j++) {\n            covered.add(j);\n        }\n    }\n    \n    for (let j = targetStart; j <= targetEnd; j++) {\n        if (!covered.has(j)) return false;\n    }\n    return true;\n}",
      TYPESCRIPT: "function solve(generators: number[][]): boolean {\n    const targetStart = generators[0][0];\n    const targetEnd = generators[0][1];\n    const covered = new Set<number>();\n    \n    for (let i = 1; i < generators.length; i++) {\n        const a = generators[i][0];\n        const b = generators[i][1];\n        for (let j = a; j <= b; j++) {\n            covered.add(j);\n        }\n    }\n    \n    for (let j = targetStart; j <= targetEnd; j++) {\n        if (!covered.has(j)) return false;\n    }\n    return true;\n}",
      PYTHON: "def solve(generators):\n    target_start, target_end = generators[0][0], generators[0][1]\n    covered = set()\n    for i in range(1, len(generators)):\n        a, b = generators[i][0], generators[i][1]\n        for j in range(a, b + 1):\n            covered.add(j)\n            \n    for j in range(target_start, target_end + 1):\n        if j not in covered:\n            return False\n    return True",
      JAVA: "    static boolean solve(int[][] generators) {\n        int targetStart = generators[0][0];\n        int targetEnd = generators[0][1];\n        java.util.Set<Integer> covered = new java.util.HashSet<>();\n        \n        for (int i = 1; i < generators.length; i++) {\n            int a = generators[i][0];\n            int b = generators[i][1];\n            for (int j = a; j <= b; j++) {\n                covered.add(j);\n            }\n        }\n        \n        for (int j = targetStart; j <= targetEnd; j++) {\n            if (!covered.contains(j)) return false;\n        }\n        return true;\n    }",
      CPP: "#include <vector>\n#include <unordered_set>\n\nbool solve(std::vector<std::vector<int>> generators) {\n    int targetStart = generators[0][0];\n    int targetEnd = generators[0][1];\n    std::unordered_set<int> covered;\n    \n    for (int i = 1; i < generators.size(); i++) {\n        int a = generators[i][0];\n        int b = generators[i][1];\n        for (int j = a; j <= b; j++) {\n            covered.insert(j);\n        }\n    }\n    \n    for (int j = targetStart; j <= targetEnd; j++) {\n        if (covered.find(j) == covered.end()) return false;\n    }\n    return true;\n}",
      GO: "func solve(generators [][]int) bool {\n    targetStart := generators[0][0]\n    targetEnd := generators[0][1]\n    covered := make(map[int]bool)\n    \n    for i := 1; i < len(generators); i++ {\n        a := generators[i][0]\n        b := generators[i][1]\n        for j := a; j <= b; j++ {\n            covered[j] = true\n        }\n    }\n    \n    for j := targetStart; j <= targetEnd; j++ {\n        if !covered[j] {\n            return false\n        }\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "1 5;1 2;3 5", expectedStdout: "true", isSample: true },
      { stdin: "1 5;1 2;4 5", expectedStdout: "false", isSample: true },
      { stdin: "10 20;5 15;14 25", expectedStdout: "true" },
      { stdin: "5 5;4 6", expectedStdout: "true" },
      { stdin: "5 5;1 4", expectedStdout: "false" },
      { stdin: "2 3;2 2;3 3", expectedStdout: "true" },
      { stdin: "1 10;2 9;1 10", expectedStdout: "true" },
      { stdin: "1 10;1 9;2 10", expectedStdout: "true" },
    ],
  }),

  p({
    ...base,
    slug: "verify-assembly-sequence",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Verify Assembly Sequence",
    patternTags: ["array","hash-set"],
    signatureId: "fn:ints->bool",
    avgSolveSeconds: 300,
    promptMarkdown: "You receive a list of serial numbers `nums` for components in an assembly line. To form a valid batch, the serial numbers must form a contiguous sequence of integers with no duplicates, although they may arrive in any order.\n\nGiven an array of integers `nums`, return `true` if they form a valid consecutive sequence when sorted, and `false` otherwise.\n\n**Constraints**\n- `1 <= nums.length <= 10^4`\n- `-10^6 <= nums[i] <= 10^6`\n\n**Example 1**\n```\ninput:\n3 1 2 4 5\noutput: true\n```\nExplanation: When sorted, the array is [1, 2, 3, 4, 5], which is a contiguous sequence.\n\n**Example 2**\n```\ninput:\n1 2 4 5\noutput: false\n```\nExplanation: The number 3 is missing, so it is not a contiguous sequence.\n\n**Example 3**\n```\ninput:\n1 1 2 3\noutput: false\n```\nExplanation: The serial number 1 is duplicated, so it is invalid.\n\n**Follow-up:** Can you solve this in O(N) time complexity without sorting the array?",
    editorialMarkdown: "## Min/Max and Duplicates\n\nA sequence is consecutive if and only if two conditions are met:\n1. It contains no duplicate numbers.\n2. The difference between the maximum element and the minimum element is exactly equal to the length of the array minus one.\n\nWe can achieve an O(N) solution by scanning the array to find its minimum and maximum values, and simultaneously adding elements to a hash set to detect duplicates. If the hash set size is smaller than the array length, there's a duplicate. Otherwise, we check if `max - min == length - 1`.\n\nThe time complexity is O(N), and the space complexity is O(N) due to the hash set. \n\nThe main trap solvers hit is forgetting that arrays with duplicates might have the correct `max - min` span (e.g., `[1, 3, 3]`), so verifying uniqueness is crucial.",
    referenceSolution: {
      JAVASCRIPT: "function solve(nums) {\n    if (nums.length === 0) return true;\n    let min = nums[0];\n    let max = nums[0];\n    const seen = new Set();\n    for (let i = 0; i < nums.length; i++) {\n        if (seen.has(nums[i])) return false;\n        seen.add(nums[i]);\n        if (nums[i] < min) min = nums[i];\n        if (nums[i] > max) max = nums[i];\n    }\n    return max - min === nums.length - 1;\n}",
      TYPESCRIPT: "function solve(nums: number[]): boolean {\n    if (nums.length === 0) return true;\n    let min = nums[0];\n    let max = nums[0];\n    const seen = new Set<number>();\n    for (let i = 0; i < nums.length; i++) {\n        if (seen.has(nums[i])) return false;\n        seen.add(nums[i]);\n        if (nums[i] < min) min = nums[i];\n        if (nums[i] > max) max = nums[i];\n    }\n    return max - min === nums.length - 1;\n}",
      PYTHON: "def solve(nums):\n    if not nums:\n        return True\n    return len(set(nums)) == len(nums) and max(nums) - min(nums) == len(nums) - 1",
      JAVA: "    static boolean solve(int[] nums) {\n        if (nums.length == 0) return true;\n        int min = nums[0];\n        int max = nums[0];\n        java.util.Set<Integer> seen = new java.util.HashSet<>();\n        for (int i = 0; i < nums.length; i++) {\n            if (!seen.add(nums[i])) return false;\n            if (nums[i] < min) min = nums[i];\n            if (nums[i] > max) max = nums[i];\n        }\n        return max - min == nums.length - 1;\n    }",
      CPP: "#include <vector>\n#include <unordered_set>\n#include <algorithm>\n\nbool solve(std::vector<int> nums) {\n    if (nums.empty()) return true;\n    int min_val = nums[0];\n    int max_val = nums[0];\n    std::unordered_set<int> seen;\n    for (int i = 0; i < nums.size(); i++) {\n        if (seen.find(nums[i]) != seen.end()) return false;\n        seen.insert(nums[i]);\n        if (nums[i] < min_val) min_val = nums[i];\n        if (nums[i] > max_val) max_val = nums[i];\n    }\n    return max_val - min_val == nums.size() - 1;\n}",
      GO: "func solve(nums []int) bool {\n    if len(nums) == 0 {\n        return true\n    }\n    minVal := nums[0]\n    maxVal := nums[0]\n    seen := make(map[int]bool)\n    for _, num := range nums {\n        if seen[num] {\n            return false\n        }\n        seen[num] = true\n        if num < minVal {\n            minVal = num\n        }\n        if num > maxVal {\n            maxVal = num\n        }\n    }\n    return maxVal - minVal == len(nums) - 1\n}",
    },
    tests: [
      { stdin: "3 1 2 4 5", expectedStdout: "true", isSample: true },
      { stdin: "1 2 4 5", expectedStdout: "false", isSample: true },
      { stdin: "1 1 2 3", expectedStdout: "false" },
      { stdin: "10", expectedStdout: "true" },
      { stdin: "10 12", expectedStdout: "false" },
      { stdin: "-2 -1 -3 0", expectedStdout: "true" },
      { stdin: "4 5 6 7 9", expectedStdout: "false" },
      { stdin: "0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20", expectedStdout: "true" },
    ],
  }),

  p({
    ...base,
    slug: "validate-sensor-intervals",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Validate Sensor Intervals",
    patternTags: ["array","hash-map"],
    signatureId: "fn:ints->bool",
    avgSolveSeconds: 450,
    promptMarkdown: "You are analyzing logs from a set of dual-node sensors. The array `logs` contains positive integers where each integer represents a sensor ID. Every sensor ID in the log appears **exactly twice**.\n\nA log is considered valid if, for every sensor ID `x`, the number of elements between its two occurrences in the `logs` array is exactly equal to `x`.\n\nGiven an array of integers `logs`, return `true` if it is valid, and `false` otherwise.\n\n**Constraints**\n- `2 <= logs.length <= 100`\n- `logs.length` is an even number.\n- `1 <= logs[i] <= 100`\n- Every integer present in `logs` appears exactly twice.\n\n**Example 1**\n```\ninput:\n2 3 1 2 1 3\noutput: true\n```\nExplanation: \n- 1 has exactly 1 element between its occurrences (the second '2').\n- 2 has exactly 2 elements between its occurrences ('3' and '1').\n- 3 has exactly 3 elements between its occurrences ('1', '2', and '1').\n\n**Example 2**\n```\ninput:\n1 2 1 2\noutput: false\n```\nExplanation: The sensor ID 2 has 1 element between its occurrences (the second '1'), but it requires exactly 2 elements.\n\n**Example 3**\n```\ninput:\n4 1 3 1 2 4 3 2\noutput: true\n```\nExplanation: Every sensor ID `x` has exactly `x` elements separating its two occurrences.\n\n**Follow-up:** Can you validate the log in a single pass using a hash map or an array of fixed size?",
    editorialMarkdown: "## First Occurrence Tracking\n\nSince every number appears exactly twice, we only need to track the index of the first occurrence of each number. As we iterate through the array, if we encounter a number for the first time, we store its index in a hash map (or a directly addressed array since the IDs are small). \n\nWhen we encounter the number for the second time at index `i`, we retrieve its first occurrence index `prev`. The number of elements between the two occurrences is `i - prev - 1`. We check if this difference equals the number itself. If any number violates this rule, we return `false`.\n\nThe time complexity is O(N), where N is the length of `logs`. The space complexity is O(N) to store the first occurrences in a hash map.\n\nThe one trap most solvers hit is calculating the distance as `i - prev` instead of `i - prev - 1`, which counts the number of steps rather than the strictly intermediate elements.",
    referenceSolution: {
      JAVASCRIPT: "function solve(logs) {\n    const firstPos = new Map();\n    for (let i = 0; i < logs.length; i++) {\n        const x = logs[i];\n        if (firstPos.has(x)) {\n            if (i - firstPos.get(x) - 1 !== x) {\n                return false;\n            }\n        } else {\n            firstPos.set(x, i);\n        }\n    }\n    return true;\n}",
      TYPESCRIPT: "function solve(logs: number[]): boolean {\n    const firstPos = new Map<number, number>();\n    for (let i = 0; i < logs.length; i++) {\n        const x = logs[i];\n        if (firstPos.has(x)) {\n            if (i - firstPos.get(x)! - 1 !== x) {\n                return false;\n            }\n        } else {\n            firstPos.set(x, i);\n        }\n    }\n    return true;\n}",
      PYTHON: "def solve(logs):\n    first_pos = {}\n    for i, x in enumerate(logs):\n        if x in first_pos:\n            if i - first_pos[x] - 1 != x:\n                return False\n        else:\n            first_pos[x] = i\n    return True",
      JAVA: "    static boolean solve(int[] logs) {\n        java.util.Map<Integer, Integer> firstPos = new java.util.HashMap<>();\n        for (int i = 0; i < logs.length; i++) {\n            int x = logs[i];\n            if (firstPos.containsKey(x)) {\n                if (i - firstPos.get(x) - 1 != x) {\n                    return false;\n                }\n            } else {\n                firstPos.put(x, i);\n            }\n        }\n        return true;\n    }",
      CPP: "#include <vector>\n#include <unordered_map>\n\nbool solve(std::vector<int> logs) {\n    std::unordered_map<int, int> firstPos;\n    for (int i = 0; i < logs.size(); i++) {\n        int x = logs[i];\n        if (firstPos.find(x) != firstPos.end()) {\n            if (i - firstPos[x] - 1 != x) {\n                return false;\n            }\n        } else {\n            firstPos[x] = i;\n        }\n    }\n    return true;\n}",
      GO: "func solve(logs []int) bool {\n    firstPos := make(map[int]int)\n    for i, x := range logs {\n        if prev, ok := firstPos[x]; ok {\n            if i - prev - 1 != x {\n                return false\n            }\n        } else {\n            firstPos[x] = i\n        }\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "2 3 1 2 1 3", expectedStdout: "true", isSample: true },
      { stdin: "1 2 1 2", expectedStdout: "false", isSample: true },
      { stdin: "4 1 3 1 2 4 3 2", expectedStdout: "true" },
      { stdin: "2 2", expectedStdout: "false" },
      { stdin: "1 3 1 2 3 2", expectedStdout: "false" },
      { stdin: "4 1 3 1 2 4 3 5 2 5", expectedStdout: "false" },
      { stdin: "3 1 2 1 3 2", expectedStdout: "true" },
      { stdin: "5 4 1 3 1 2 5 4 3 2", expectedStdout: "false" },
    ],
  }),
];
