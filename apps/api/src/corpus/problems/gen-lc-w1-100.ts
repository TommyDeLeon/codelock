import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w1-100` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W1_100_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "find-the-balance-station",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Fair Coin Distribution",
    patternTags: ["math","prefix-sum"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 300,
    promptMarkdown: "You are exploring an ancient temple that features a grand staircase with `n` steps, numbered consecutively from `1` to `n`. Each step holds a number of gold coins exactly equal to its step number (i.e., step 1 has 1 coin, step 2 has 2 coins, and so on).\n\nYou want to find a magical step `x` that splits the treasure fairly. Specifically, the total number of gold coins from step `1` up to step `x` (inclusive) must equal the total number of gold coins from step `x` up to the top step `n` (inclusive).\n\nGiven the integer `n`, return the step number `x`. If no such magical step exists, return `-1`.\n\n**Constraints**\n- `1 <= n <= 1000`\n\n**Example 1**\n```\ninput:\n8\noutput:\n6\n```\n*Explanation: The sum of coins from step 1 to 6 is 21. The sum of coins from step 6 to 8 is 6 + 7 + 8 = 21. They are identical, so 6 is the magical step.*\n\n**Example 2**\n```\ninput:\n1\noutput:\n1\n```\n*Explanation: The sum of coins on step 1 is 1. The sum of coins from step 1 to the top is also 1.*\n\n**Example 3**\n```\ninput:\n4\noutput:\n-1\n```\n*Explanation: There is no step between 1 and 4 where the sum of coins on both sides are equal.*\n\n**Follow-up**\nCan you determine the magical step using only O(1) mathematical operations, without utilizing any loops?",
    editorialMarkdown: "## Find the Balance Station\n\nWe need to find an integer `x` between `1` and `n` such that the sum of integers from `1` to `x` is equal to the sum of integers from `x` to `n`.\n\nThe sum of the first `x` integers is `x * (x + 1) / 2`.\nThe sum of integers from `x` to `n` is the sum of the first `n` integers minus the sum of the first `x - 1` integers. Thus, `n * (n + 1) / 2 - (x - 1) * x / 2`.\n\nSetting these two equal to each other gives:\n`x * (x + 1) / 2 = n * (n + 1) / 2 - (x - 1) * x / 2`\n`x * (x + 1) / 2 + x * (x - 1) / 2 = n * (n + 1) / 2`\n`x^2 = n * (n + 1) / 2`\n\nThis means `x` must be the exact square root of `n * (n + 1) / 2`. We can simply compute the sum of the first `n` integers, and check if it is a perfect square. If it is, the square root is our balance station. If not, no such station exists.\n\n**Trap**: A common pitfall is using a slow O(N) loop to compute sums for every possible `x`, which is inefficient although it may pass for small `n`. Another trap is floating point inaccuracy when checking for perfect squares; it's safer to square the integer root and compare.\n\n**Complexity:**\n- **Time:** O(1) mathematical computation, or O(sqrt(N)) if iterating to find the integer root.\n- **Space:** O(1).",
    referenceSolution: {
      JAVASCRIPT: "function solve(n) {\n    const sum = (n * (n + 1)) / 2;\n    for (let x = 1; x <= n; x++) {\n        if (x * x === sum) return x;\n        if (x * x > sum) break;\n    }\n    return -1;\n}",
      TYPESCRIPT: "function solve(n: number): number {\n    const sum = (n * (n + 1)) / 2;\n    for (let x = 1; x <= n; x++) {\n        if (x * x === sum) return x;\n        if (x * x > sum) break;\n    }\n    return -1;\n}",
      PYTHON: "def solve(n):\n    total_sum = n * (n + 1) // 2\n    for x in range(1, n + 1):\n        if x * x == total_sum:\n            return x\n        if x * x > total_sum:\n            break\n    return -1",
      JAVA: "    static int solve(int n) {\n        int sum = n * (n + 1) / 2;\n        for (int x = 1; x <= n; x++) {\n            if (x * x == sum) return x;\n            if (x * x > sum) break;\n        }\n        return -1;\n    }",
      CPP: "#include <cmath>\nusing namespace std;\nint solve(int n) {\n    int sum = n * (n + 1) / 2;\n    int root = round(sqrt(sum));\n    if (root * root == sum) return root;\n    return -1;\n}",
      GO: "func solve(n int) int {\n    sum := n * (n + 1) / 2\n    for x := 1; x <= n; x++ {\n        if x*x == sum {\n            return x\n        }\n        if x*x > sum {\n            break\n        }\n    }\n    return -1\n}",
    },
    tests: [
      { stdin: "8", expectedStdout: "6", isSample: true },
      { stdin: "1", expectedStdout: "1", isSample: true },
      { stdin: "4", expectedStdout: "-1" },
      { stdin: "49", expectedStdout: "35" },
      { stdin: "10", expectedStdout: "-1" },
      { stdin: "999", expectedStdout: "-1" },
      { stdin: "2", expectedStdout: "-1" },
      { stdin: "3", expectedStdout: "-1" },
    ],
  }),

  p({
    ...base,
    slug: "find-the-defective-component",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BINARY_SEARCH",
    title: "First Infected Component",
    patternTags: ["binary-search","array"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 420,
    promptMarkdown: "A software system initializes a sequence of `components` during startup. Unfortunately, a virus has infiltrated the system. Once a component becomes infected, it causes all subsequent components in the initialization sequence to also become infected.\n\nYou are provided with an array `components` consisting of `0`s (indicating a safe component) and `1`s (indicating an infected component). Because of the nature of the virus, all `0`s will strictly appear before any `1`s.\n\nReturn the 0-based index of the **first** infected component in the array. If no component is infected, return `-1`.\n\n**Constraints**\n- `0 <= components.length <= 40`\n- `components[i]` is either `0` or `1`.\n- The array is sorted in non-decreasing order.\n\n**Example 1**\n```\ninput:\n0 0 1 1 1\noutput:\n2\n```\n*Explanation: The first infected component (1) is located at index 2.*\n\n**Example 2**\n```\ninput:\n0 0 0\noutput:\n-1\n```\n*Explanation: There are no infected components in the array.*\n\n**Example 3**\n```\ninput:\n1 1\noutput:\n0\n```\n*Explanation: The very first component is infected.*\n\n**Follow-up**\nCan you find the infected component in O(log n) time?",
    editorialMarkdown: "## Find the Defective Component\n\nThe array represents a sequence of components where all healthy components (`0`) strictly precede any defective components (`1`). Because of this sorted monotonic property, we can find the transition point from `0` to `1` using binary search instead of checking every single element sequentially.\n\nWe set up a search range `[low, high]` initialized to `[0, n - 1]`. While `low <= high`, we inspect the middle element. If it's `1`, it could be the first defective component, so we record its index and narrow our search to the left half (`high = mid - 1`) to see if an earlier one exists. If it's `0`, the first defective component must be further to the right, so we search the right half (`low = mid + 1`).\n\n**Trap**: Returning `-1` prematurely or missing the transition if the array only has `0`s or only has `1`s. Be sure to check edge cases appropriately, and update the result variable carefully during the binary search.\n\n**Complexity:**\n- **Time:** O(log N), where N is the number of components, due to binary search.\n- **Space:** O(1) auxiliary space.",
    referenceSolution: {
      JAVASCRIPT: "function solve(components) {\n    let low = 0;\n    let high = components.length - 1;\n    let res = -1;\n    while (low <= high) {\n        const mid = Math.floor((low + high) / 2);\n        if (components[mid] === 1) {\n            res = mid;\n            high = mid - 1;\n        } else {\n            low = mid + 1;\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(components: number[]): number {\n    let low = 0;\n    let high = components.length - 1;\n    let res = -1;\n    while (low <= high) {\n        const mid = Math.floor((low + high) / 2);\n        if (components[mid] === 1) {\n            res = mid;\n            high = mid - 1;\n        } else {\n            low = mid + 1;\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(components):\n    low = 0\n    high = len(components) - 1\n    res = -1\n    while low <= high:\n        mid = (low + high) // 2\n        if components[mid] == 1:\n            res = mid\n            high = mid - 1\n        else:\n            low = mid + 1\n    return res",
      JAVA: "    static int solve(int[] components) {\n        int low = 0;\n        int high = components.length - 1;\n        int res = -1;\n        while (low <= high) {\n            int mid = low + (high - low) / 2;\n            if (components[mid] == 1) {\n                res = mid;\n                high = mid - 1;\n            } else {\n                low = mid + 1;\n            }\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nint solve(vector<int> components) {\n    int low = 0;\n    int high = components.size() - 1;\n    int res = -1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (components[mid] == 1) {\n            res = mid;\n            high = mid - 1;\n        } else {\n            low = mid + 1;\n        }\n    }\n    return res;\n}",
      GO: "func solve(components []int) int {\n    low := 0\n    high := len(components) - 1\n    res := -1\n    for low <= high {\n        mid := low + (high - low) / 2\n        if components[mid] == 1 {\n            res = mid\n            high = mid - 1\n        } else {\n            low = mid + 1\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "0 0 1 1 1", expectedStdout: "2", isSample: true },
      { stdin: "0 0 0", expectedStdout: "-1", isSample: true },
      { stdin: "1 1", expectedStdout: "0" },
      { stdin: "", expectedStdout: "-1" },
      { stdin: "0 0 0 0 0 0 0 0 0 1 1 1 1 1 1", expectedStdout: "9" },
      { stdin: "1 1 1 1 1 1 1 1 1 1", expectedStdout: "0" },
      { stdin: "0 0 0 0 0 0 0 0 0 0", expectedStdout: "-1" },
      { stdin: "1", expectedStdout: "0" },
    ],
  }),

  p({
    ...base,
    slug: "calculate-altered-planetary-masses",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Calculate Altered Planetary Masses",
    patternTags: ["math","array"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 360,
    promptMarkdown: "A spacecraft is scanning the masses of several nearby planetary bodies. The sensor array is slightly defective. When it scans a mass, it alters the reading by finding the **largest digit** in the mass's value, and replacing every digit of that mass with this maximum digit.\n\nFor example, if a planet's actual mass is `281`, the maximum digit is `8`. The sensor will record the altered mass as `888`.\n\nYou are given an integer array `masses` representing the actual masses of the planets. Return the sum of all the **altered** planetary masses recorded by the sensor.\n\n**Constraints**\n- `1 <= masses.length <= 40`\n- `1 <= masses[i] <= 10000`\n\n**Example 1**\n```\ninput:\n10 21 31\noutput:\n66\n```\n*Explanation: \n- `10` is altered to `11`.\n- `21` is altered to `22`.\n- `31` is altered to `33`.\nThe sum is 11 + 22 + 33 = 66.*\n\n**Example 2**\n```\ninput:\n281\noutput:\n888\n```\n*Explanation: The max digit in `281` is 8. The altered mass is 888. Sum is 888.*\n\n**Example 3**\n```\ninput:\n7 77\noutput:\n84\n```\n*Explanation: `7` becomes `7`. `77` becomes `77`. The sum is 84.*\n\n**Follow-up**\nCan you implement the digit extraction and alteration entirely using integer arithmetic without converting the numbers to strings?",
    editorialMarkdown: "## Calculate Altered Planetary Masses\n\nThe task requires us to alter a set of positive integers based on a specific rule and sum the results. For each integer, we find its largest digit and then construct a new integer of the same length, composed entirely of that largest digit.\n\nWe can solve this directly using integer manipulation or string conversion. For each number, we can repeatedly take modulo 10 to inspect each digit and find the maximum. We also count the number of digits. Finally, we rebuild the number by multiplying the maximum digit by `11...1` (of the appropriate length).\n\n**Trap**: Be careful with edge cases such as `0`, though the constraints typically bound the inputs above 0. If strings are used, ensure that the newly formed string of maximum digits is properly converted back to a numeric type before summing, to avoid string concatenation.\n\n**Complexity:**\n- **Time:** O(N * D) where N is the number of integers and D is the maximum number of digits in an integer (which is bounded, so it's effectively O(N)).\n- **Space:** O(1) auxiliary space if using integer math, or O(D) if converting to strings.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    if (Array.isArray(a)) a = a.map(Number);\n    let totalSum = 0;\n    for (let m of a) {\n        let temp = m;\n        let maxD = 0;\n        let length = 0;\n        while (temp > 0) {\n            const d = temp % 10;\n            if (d > maxD) maxD = d;\n            temp = Math.floor(temp / 10);\n            length++;\n        }\n        let replaced = 0;\n        for (let i = 0; i < length; i++) {\n            replaced = replaced * 10 + maxD;\n        }\n        totalSum += replaced;\n    }\n    return totalSum;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    let totalSum = 0;\n    for (let m of a) {\n        let temp = m;\n        let maxD = 0;\n        let length = 0;\n        while (temp > 0) {\n            const d = temp % 10;\n            if (d > maxD) maxD = d;\n            temp = Math.floor(temp / 10);\n            length++;\n        }\n        let replaced = 0;\n        for (let i = 0; i < length; i++) {\n            replaced = replaced * 10 + maxD;\n        }\n        totalSum += replaced;\n    }\n    return totalSum;\n}",
      PYTHON: "def solve(a):\n    total_sum = 0\n    for m in a:\n        temp = m\n        max_d = 0\n        length = 0\n        while temp > 0:\n            d = temp % 10\n            if d > max_d:\n                max_d = d\n            temp //= 10\n            length += 1\n        replaced = 0\n        for _ in range(length):\n            replaced = replaced * 10 + max_d\n        total_sum += replaced\n    return total_sum",
      JAVA: "    static int solve(int[] a) {\n        int totalSum = 0;\n        for (int m : a) {\n            int temp = m;\n            int maxD = 0;\n            int length = 0;\n            while (temp > 0) {\n                int d = temp % 10;\n                if (d > maxD) maxD = d;\n                temp /= 10;\n                length++;\n            }\n            int replaced = 0;\n            for (int i = 0; i < length; i++) {\n                replaced = replaced * 10 + maxD;\n            }\n            totalSum += replaced;\n        }\n        return totalSum;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nint solve(vector<int> a) {\n    int totalSum = 0;\n    for (int m : a) {\n        int temp = m;\n        int maxD = 0;\n        int length = 0;\n        while (temp > 0) {\n            int d = temp % 10;\n            if (d > maxD) maxD = d;\n            temp /= 10;\n            length++;\n        }\n        int replaced = 0;\n        for (int i = 0; i < length; i++) {\n            replaced = replaced * 10 + maxD;\n        }\n        totalSum += replaced;\n    }\n    return totalSum;\n}",
      GO: "func solve(a []int) int {\n    totalSum := 0\n    for _, m := range a {\n        temp := m\n        maxD := 0\n        length := 0\n        for temp > 0 {\n            d := temp % 10\n            if d > maxD {\n                maxD = d\n            }\n            temp /= 10\n            length++\n        }\n        replaced := 0\n        for i := 0; i < length; i++ {\n            replaced = replaced*10 + maxD\n        }\n        totalSum += replaced\n    }\n    return totalSum\n}",
    },
    tests: [
      { stdin: "10 21 31", expectedStdout: "66", isSample: true },
      { stdin: "281", expectedStdout: "888", isSample: true },
      { stdin: "7 77", expectedStdout: "84" },
      { stdin: "9876", expectedStdout: "9999" },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "1 2 3 4 5 5", expectedStdout: "20" },
      { stdin: "10 20 30 10 20 30", expectedStdout: "132" },
      { stdin: "", expectedStdout: "0" },
    ],
  }),

  p({
    ...base,
    slug: "xor-of-paired-coordinates",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BIT_MANIPULATION",
    title: "XOR of Paired Coordinates",
    patternTags: ["bit-manipulation","hash-map","array"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 300,
    promptMarkdown: "You are processing a transmission of navigation coordinates. Some coordinate values are received exactly once, while some repeated signals cause certain coordinate values to be received exactly twice.\n\nYou are given an array `coords` containing these integer coordinates. You need to identify all the coordinates that appear **exactly twice** in the transmission, and return the bitwise XOR sum of all such coordinates.\n\nIf no coordinate appears exactly twice, return `0`.\n\n**Constraints**\n- `1 <= coords.length <= 40`\n- `1 <= coords[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 1 3\noutput:\n1\n```\n*Explanation: The only coordinate that appears exactly twice is 1. The XOR sum is 1.*\n\n**Example 2**\n```\ninput:\n1 2 3\noutput:\n0\n```\n*Explanation: No coordinate appears exactly twice, so we return 0.*\n\n**Example 3**\n```\ninput:\n1 2 2 1\noutput:\n3\n```\n*Explanation: 1 and 2 both appear exactly twice. 1 XOR 2 = 3.*\n\n**Follow-up**\nCan you compute the answer in O(n) time and O(n) auxiliary space?",
    editorialMarkdown: "## XOR of Paired Coordinates\n\nThe problem requires us to find all elements in an array that appear exactly twice and compute their bitwise XOR sum.\n\nWe can use a hash map or frequency array to count the occurrences of each element in the array. In a second pass over the hash map's entries, we XOR all the numbers that have a frequency of exactly 2. \n\n**Trap**: A common mistake is to XOR numbers with a frequency greater than 2, or to XOR the frequency count instead of the actual number. Pay close attention to exactly matching the condition \\\"appears exactly twice\\\".\n\n**Complexity:**\n- **Time:** O(N) to populate the frequency map and iterate over it.\n- **Space:** O(N) to store the unique coordinates and their counts in a hash map.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    if (Array.isArray(a)) a = a.map(Number);\n    const counts = new Map();\n    for (const c of a) {\n        counts.set(c, (counts.get(c) || 0) + 1);\n    }\n    let res = 0;\n    for (const [c, count] of counts.entries()) {\n        if (count === 2) {\n            res ^= c;\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    const counts = new Map<number, number>();\n    for (const c of a) {\n        counts.set(c, (counts.get(c) || 0) + 1);\n    }\n    let res = 0;\n    for (const [c, count] of counts.entries()) {\n        if (count === 2) {\n            res ^= c;\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(a):\n    counts = {}\n    for c in a:\n        counts[c] = counts.get(c, 0) + 1\n    res = 0\n    for c, count in counts.items():\n        if count == 2:\n            res ^= c\n    return res",
      JAVA: "    static int solve(int[] a) {\n        java.util.Map<Integer, Integer> counts = new java.util.HashMap<>();\n        for (int c : a) {\n            counts.put(c, counts.getOrDefault(c, 0) + 1);\n        }\n        int res = 0;\n        for (java.util.Map.Entry<Integer, Integer> entry : counts.entrySet()) {\n            if (entry.getValue() == 2) {\n                res ^= entry.getKey();\n            }\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n#include <unordered_map>\nusing namespace std;\nint solve(vector<int> a) {\n    unordered_map<int, int> counts;\n    for (int c : a) {\n        counts[c]++;\n    }\n    int res = 0;\n    for (auto const& [c, count] : counts) {\n        if (count == 2) {\n            res ^= c;\n        }\n    }\n    return res;\n}",
      GO: "func solve(a []int) int {\n    counts := make(map[int]int)\n    for _, c := range a {\n        counts[c]++\n    }\n    res := 0\n    for c, count := range counts {\n        if count == 2 {\n            res ^= c\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 1 3", expectedStdout: "1", isSample: true },
      { stdin: "1 2 3", expectedStdout: "0", isSample: true },
      { stdin: "1 2 2 1", expectedStdout: "3" },
      { stdin: "", expectedStdout: "0" },
      { stdin: "10", expectedStdout: "0" },
      { stdin: "1 2 3 4 5 1 2 4 5", expectedStdout: "2" },
      { stdin: "5 5 5 5 5", expectedStdout: "0" },
      { stdin: "10 20 30 10 20 30", expectedStdout: "0" },
    ],
  }),
];
