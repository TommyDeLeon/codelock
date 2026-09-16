import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-033` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_033_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "defective-batches-count",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BINARY_SEARCH",
    title: "Subzero Terrain Mapping",
    patternTags: ["matrix","counting","pointers"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 400,
    promptMarkdown: "An autonomous drone has mapped a grid of terrain elevations. The mapping is represented as a 2D matrix of integers, where rows are separated by semicolons. Due to a uniform slope in the landscape, the elevation values are non-increasing both row-wise and column-wise.\n\nDetermine the total number of terrain sectors that lie strictly below sea level (i.e., have negative elevation values).\n\n**Constraints**\n- The matrix dimensions `m` (rows) and `n` (columns) satisfy `1 <= m, n <= 100`\n- Each elevation value `v` satisfies `-1000 <= v <= 1000`\n\n**Example 1**\n```\ninput:\n4 3 2 -1; 3 2 1 -1; 1 1 -1 -2; -1 -1 -2 -3\noutput: 8\n```\n\n**Example 2**\n```\ninput:\n3 2; 1 0\noutput: 0\n```\n\n**Example 3**\n```\ninput:\n-1 -2; -2 -3\noutput: 4\n```\n\n**Follow-up:** Can you design an algorithm that determines the answer in \\(\\mathcal{O}(m + n)\\) time?",
    editorialMarkdown: "## Defective Batches Count\nWe can start at the top-right corner of the matrix. If the current element is negative, it means all elements below it in the same column are also negative (since columns are sorted in non-increasing order). We add `m - r` to the count and move left. If the element is non-negative, we move down.\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(m + n)\\) where \\(m\\) is the number of rows and \\(n\\) is the number of columns.\n- **Space Complexity:** \\(\\mathcal{O}(1)\\) as we only use a few variables.\n**Common Trap:**\nA common mistake is using a nested loop for \\(\\mathcal{O}(m \\times n)\\) time, which might be too slow for larger constraints, or messing up the matrix boundaries during the linear traversal.",
    referenceSolution: {
      JAVASCRIPT: "function solve(results) {\n    if (results.length === 0) return 0;\n    let m = results.length, n = results[0].length;\n    let r = 0, c = n - 1;\n    let count = 0;\n    while (r < m && c >= 0) {\n        if (results[r][c] < 0) {\n            count += (m - r);\n            c--;\n        } else {\n            r++;\n        }\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(results: number[][]): number {\n    if (results.length === 0) return 0;\n    let m = results.length, n = results[0].length;\n    let r = 0, c = n - 1;\n    let count = 0;\n    while (r < m && c >= 0) {\n        if (results[r][c] < 0) {\n            count += (m - r);\n            c--;\n        } else {\n            r++;\n        }\n    }\n    return count;\n}",
      PYTHON: "def solve(results):\n    if not results: return 0\n    m, n = len(results), len(results[0])\n    r, c = 0, n - 1\n    count = 0\n    while r < m and c >= 0:\n        if results[r][c] < 0:\n            count += (m - r)\n            c -= 1\n        else:\n            r += 1\n    return count",
      JAVA: "    static int solve(int[][] results) {\n        if (results == null || results.length == 0) return 0;\n        int m = results.length, n = results[0].length;\n        int r = 0, c = n - 1;\n        int count = 0;\n        while (r < m && c >= 0) {\n            if (results[r][c] < 0) {\n                count += (m - r);\n                c--;\n            } else {\n                r++;\n            }\n        }\n        return count;\n    }",
      CPP: "int solve(vector<vector<int>> results) {\n    if (results.empty()) return 0;\n    int m = results.size(), n = results[0].size();\n    int r = 0, c = n - 1;\n    int count = 0;\n    while (r < m && c >= 0) {\n        if (results[r][c] < 0) {\n            count += (m - r);\n            c--;\n        } else {\n            r++;\n        }\n    }\n    return count;\n}",
      GO: "func solve(results [][]int) int {\n    if len(results) == 0 {\n        return 0\n    }\n    m, n := len(results), len(results[0])\n    r, c := 0, n-1\n    count := 0\n    for r < m && c >= 0 {\n        if results[r][c] < 0 {\n            count += (m - r)\n            c--\n        } else {\n            r++\n        }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "4 3 2 -1; 3 2 1 -1; 1 1 -1 -2; -1 -1 -2 -3", expectedStdout: "8", isSample: true },
      { stdin: "3 2; 1 0", expectedStdout: "0", isSample: true },
      { stdin: "-1 -2; -2 -3", expectedStdout: "4" },
      { stdin: "5", expectedStdout: "0" },
      { stdin: "-5", expectedStdout: "1" },
      { stdin: "0 0 0; 0 0 0", expectedStdout: "0" },
      { stdin: "-1 -1 -1; -1 -1 -1", expectedStdout: "6" },
      { stdin: "100 50 10; 10 5 -5; 5 -10 -20; -10 -20 -30", expectedStdout: "6" },
    ],
  }),

  p({
    ...base,
    slug: "compatible-astronaut-pairs",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Signal Frequency Matches",
    patternTags: ["array","counting","hash-map"],
    signatureId: "fn:ints,int->int",
    avgSolveSeconds: 300,
    promptMarkdown: "A radio telescope receives a sequence of signal frequencies from deep space, represented by an array of integers. A researcher is looking for specific interference patterns that occur between any two signals recorded at different times. An interference pattern is considered significant if the absolute difference between the two frequencies is exactly `target_diff`.\n\nGiven the sequence of frequencies and the value `target_diff`, compute the total number of pairs of signals (where the first signal was received before the second) that form a significant interference pattern.\n\n**Constraints**\n- `1 <= frequencies.length <= 200`\n- `1 <= frequencies[i] <= 100`\n- `1 <= target_diff <= 99`\n\n**Example 1**\n```\ninput:\n1 2 2 1\n1\noutput: 4\n```\n\n**Example 2**\n```\ninput:\n1 3\n3\noutput: 0\n```\n\n**Example 3**\n```\ninput:\n3 2 1 5 4\n2\noutput: 3\n```",
    editorialMarkdown: "## Compatible Astronaut Pairs\nWe can count the frequencies of each skill level using a hash map or an array (since the skill levels are small). For each unique skill level `x`, the number of compatible pairs formed with `x + k` is simply `frequency[x] * frequency[x + k]`.\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N)\\) where \\(N\\) is the length of `skills`, as we make one pass to count frequencies and another bounded pass over the unique values. (An \\(\\mathcal{O}(N^2)\\) nested loop is also acceptable given the small constraints).\n- **Space Complexity:** \\(\\mathcal{O}(1)\\) since the maximum skill level is 100, requiring a fixed-size array or small hash map.\n**Common Trap:**\nA common mistake is using an \\(\\mathcal{O}(N^2)\\) nested loop, which passes here but wouldn't scale to larger inputs, or double-counting pairs if iterating over the original array instead of unique values.",
    referenceSolution: {
      JAVASCRIPT: "function solve(skills, k) {\n    let count = 0;\n    for (let i = 0; i < skills.length; i++) {\n        for (let j = i + 1; j < skills.length; j++) {\n            if (Math.abs(skills[i] - skills[j]) === k) {\n                count++;\n            }\n        }\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(skills: number[], k: number): number {\n    let count = 0;\n    for (let i = 0; i < skills.length; i++) {\n        for (let j = i + 1; j < skills.length; j++) {\n            if (Math.abs(skills[i] - skills[j]) === k) {\n                count++;\n            }\n        }\n    }\n    return count;\n}",
      PYTHON: "def solve(skills, k):\n    count = 0\n    for i in range(len(skills)):\n        for j in range(i + 1, len(skills)):\n            if abs(skills[i] - skills[j]) == k:\n                count += 1\n    return count",
      JAVA: "    static int solve(int[] skills, int k) {\n        int count = 0;\n        for (int i = 0; i < skills.length; i++) {\n            for (int j = i + 1; j < skills.length; j++) {\n                if (Math.abs(skills[i] - skills[j]) == k) {\n                    count++;\n                }\n            }\n        }\n        return count;\n    }",
      CPP: "int solve(vector<int> skills, int k) {\n    int count = 0;\n    for (int i = 0; i < skills.size(); i++) {\n        for (int j = i + 1; j < skills.size(); j++) {\n            if (abs(skills[i] - skills[j]) == k) {\n                count++;\n            }\n        }\n    }\n    return count;\n}",
      GO: "func solve(skills []int, k int) int {\n    count := 0\n    for i := 0; i < len(skills); i++ {\n        for j := i + 1; j < len(skills); j++ {\n            diff := skills[i] - skills[j]\n            if diff < 0 {\n                diff = -diff\n            }\n            if diff == k {\n                count++\n            }\n        }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "1 2 2 1\n1", expectedStdout: "4", isSample: true },
      { stdin: "1 3\n3", expectedStdout: "0", isSample: true },
      { stdin: "3 2 1 5 4\n2", expectedStdout: "3" },
      { stdin: "100\n10", expectedStdout: "0" },
      { stdin: "1 1 1 1\n1", expectedStdout: "0" },
      { stdin: "1 2 3 4 5 6 7 8 9 10\n1", expectedStdout: "9" },
      { stdin: "10 20 30 40 50\n10", expectedStdout: "4" },
      { stdin: "7 7 8 8 9 9\n1", expectedStdout: "8" },
    ],
  }),

  p({
    ...base,
    slug: "valid-serial-codes",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Valid Serial Codes",
    patternTags: ["counting","digits","math"],
    signatureId: "fn:int,int->int",
    avgSolveSeconds: 350,
    promptMarkdown: "You are auditing a range of serial codes. A serial code is considered valid if all of its digits are unique. \n\nGiven two integers `start` and `end`, representing the inclusive range of serial codes, return the number of valid serial codes in the range `[start, end]`.\n\n**Constraints**\n- `0 <= start <= end <= 1000`\n\n**Example 1**\n```\ninput:\n1\n20\noutput: 19\n```\nExplanation: All numbers between 1 and 20 have unique digits except 11.\n\n**Example 2**\n```\ninput:\n11\n11\noutput: 0\n```\nExplanation: 11 has repeating digits (1).\n\n**Example 3**\n```\ninput:\n0\n9\noutput: 10\n```\nExplanation: All 1-digit numbers have unique digits.",
    editorialMarkdown: "## Valid Serial Codes\nSince the maximum bound is small (1000), we can iterate through each number in the range `[start, end]` and check if its digits are unique. To check a number, we can extract its digits by taking modulo 10 and dividing by 10, keeping a boolean array or bitmask of seen digits.\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N \\times D)\\) where \\(N\\) is the number of integers in the range and \\(D\\) is the maximum number of digits (at most 4). This simplifies to \\(\\mathcal{O}(N)\\).\n- **Space Complexity:** \\(\\mathcal{O}(1)\\) as we only need a bitmask or a small array of size 10 to track seen digits.\n**Common Trap:**\nA common mistake is failing to handle the number `0` correctly, or allocating a new string/hash set for every single number which can be slightly inefficient, though acceptable for these constraints.",
    referenceSolution: {
      JAVASCRIPT: "function solve(start, end) {\n    let validCount = 0;\n    for (let i = start; i <= end; i++) {\n        let num = i;\n        let seen = 0;\n        let isUnique = true;\n        if (num === 0) {\n            validCount++;\n            continue;\n        }\n        while (num > 0) {\n            let digit = num % 10;\n            if ((seen & (1 << digit)) !== 0) {\n                isUnique = false;\n                break;\n            }\n            seen |= (1 << digit);\n            num = Math.floor(num / 10);\n        }\n        if (isUnique) validCount++;\n    }\n    return validCount;\n}",
      TYPESCRIPT: "function solve(start: number, end: number): number {\n    let validCount = 0;\n    for (let i = start; i <= end; i++) {\n        let num = i;\n        let seen = 0;\n        let isUnique = true;\n        if (num === 0) {\n            validCount++;\n            continue;\n        }\n        while (num > 0) {\n            let digit = num % 10;\n            if ((seen & (1 << digit)) !== 0) {\n                isUnique = false;\n                break;\n            }\n            seen |= (1 << digit);\n            num = Math.floor(num / 10);\n        }\n        if (isUnique) validCount++;\n    }\n    return validCount;\n}",
      PYTHON: "def solve(start, end):\n    validCount = 0\n    for i in range(start, end + 1):\n        num = i\n        seen = 0\n        isUnique = True\n        if num == 0:\n            validCount += 1\n            continue\n        while num > 0:\n            digit = num % 10\n            if (seen & (1 << digit)) != 0:\n                isUnique = False\n                break\n            seen |= (1 << digit)\n            num //= 10\n        if isUnique:\n            validCount += 1\n    return validCount",
      JAVA: "    static int solve(int start, int end) {\n        int validCount = 0;\n        for (int i = start; i <= end; i++) {\n            int num = i;\n            int seen = 0;\n            boolean isUnique = true;\n            if (num == 0) {\n                validCount++;\n                continue;\n            }\n            while (num > 0) {\n                int digit = num % 10;\n                if ((seen & (1 << digit)) != 0) {\n                    isUnique = false;\n                    break;\n                }\n                seen |= (1 << digit);\n                num /= 10;\n            }\n            if (isUnique) validCount++;\n        }\n        return validCount;\n    }",
      CPP: "int solve(int start, int end) {\n    int validCount = 0;\n    for (int i = start; i <= end; i++) {\n        int num = i;\n        int seen = 0;\n        bool isUnique = true;\n        if (num == 0) {\n            validCount++;\n            continue;\n        }\n        while (num > 0) {\n            int digit = num % 10;\n            if ((seen & (1 << digit)) != 0) {\n                isUnique = false;\n                break;\n            }\n            seen |= (1 << digit);\n            num /= 10;\n        }\n        if (isUnique) validCount++;\n    }\n    return validCount;\n}",
      GO: "func solve(start int, end int) int {\n    validCount := 0\n    for i := start; i <= end; i++ {\n        num := i\n        seen := 0\n        isUnique := true\n        if num == 0 {\n            validCount++\n            continue\n        }\n        for num > 0 {\n            digit := num % 10\n            if (seen & (1 << digit)) != 0 {\n                isUnique = false\n                break\n            }\n            seen |= (1 << digit)\n            num /= 10\n        }\n        if isUnique {\n            validCount++\n        }\n    }\n    return validCount\n}",
    },
    tests: [
      { stdin: "1\n20", expectedStdout: "19", isSample: true },
      { stdin: "11\n11", expectedStdout: "0", isSample: true },
      { stdin: "0\n0", expectedStdout: "1" },
      { stdin: "100\n1000", expectedStdout: "648" },
      { stdin: "0\n9", expectedStdout: "10" },
      { stdin: "10\n10", expectedStdout: "1" },
      { stdin: "998\n1000", expectedStdout: "0" },
      { stdin: "1000\n1000", expectedStdout: "0" },
    ],
  }),

  p({
    ...base,
    slug: "odd-households-survey",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Active Sensor Calibration",
    patternTags: ["math","parity","range"],
    signatureId: "fn:int,int->int",
    avgSolveSeconds: 300,
    promptMarkdown: "An industrial monitoring system uses a series of sensors, each identified by a sequential integer serial number. The maintenance protocol requires calibrating only the sensors that have an odd serial number.\n\nGiven the starting serial number and the ending serial number (both inclusive) as two separate lines of input, compute the total number of sensors that will undergo calibration.\n\n**Constraints**\n- `0 <= start_serial <= end_serial <= 10^9`\n\n**Example 1**\n```\ninput:\n3\n7\noutput: 3\n```\n\n**Example 2**\n```\ninput:\n8\n10\noutput: 1\n```\n\n**Example 3**\n```\ninput:\n0\n0\noutput: 0\n```",
    editorialMarkdown: "## Odd Households Survey\nThe number of odd integers between 1 and `N` is `(N + 1) / 2`. To find the number of odd integers in the range `[low, high]`, we can calculate the count up to `high` and subtract the count up to `low - 1`.\nAlternatively, if `low` is even, we can just increment it by 1, and similarly decrement `high` if it's even. Then the count is `(high - low) / 2 + 1`.\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(1)\\) as it only requires basic arithmetic operations.\n- **Space Complexity:** \\(\\mathcal{O}(1)\\) since we only store a few variables.\n**Common Trap:**\nA common mistake is using a `for` loop to iterate from `low` to `high` and counting the odd numbers one by one. This results in an \\(\\mathcal{O}(N)\\) time complexity and will time out (or exceed limits) for very large ranges up to \\(10^9\\).",
    referenceSolution: {
      JAVASCRIPT: "function solve(low, high) {\n    let countHigh = Math.floor((high + 1) / 2);\n    let countLow = Math.floor(low / 2);\n    return countHigh - countLow;\n}",
      TYPESCRIPT: "function solve(low: number, high: number): number {\n    let countHigh = Math.floor((high + 1) / 2);\n    let countLow = Math.floor(low / 2);\n    return countHigh - countLow;\n}",
      PYTHON: "def solve(low, high):\n    countHigh = (high + 1) // 2\n    countLow = low // 2\n    return countHigh - countLow",
      JAVA: "    static int solve(int low, int high) {\n        int countHigh = (high + 1) / 2;\n        int countLow = low / 2;\n        return countHigh - countLow;\n    }",
      CPP: "int solve(int low, int high) {\n    int countHigh = (high + 1) / 2;\n    int countLow = low / 2;\n    return countHigh - countLow;\n}",
      GO: "func solve(low int, high int) int {\n    countHigh := (high + 1) / 2\n    countLow := low / 2\n    return countHigh - countLow\n}",
    },
    tests: [
      { stdin: "3\n7", expectedStdout: "3", isSample: true },
      { stdin: "8\n10", expectedStdout: "1", isSample: true },
      { stdin: "0\n0", expectedStdout: "0" },
      { stdin: "1\n1", expectedStdout: "1" },
      { stdin: "2\n2", expectedStdout: "0" },
      { stdin: "0\n100", expectedStdout: "50" },
      { stdin: "1\n1000000000", expectedStdout: "500000000" },
      { stdin: "999999999\n1000000000", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "anomalous-signal-frequencies",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Anomalous Signal Frequencies",
    patternTags: ["hash-map","counting","string"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 300,
    promptMarkdown: "You are analyzing a sequence of intercepted signals represented by a string `signal`. Each character in the string represents a specific signal frequency. A frequency is considered anomalous if it appears an odd number of times in the entire sequence.\n\nDetermine the total number of distinct anomalous frequencies in the `signal`.\n\n**Constraints**\n- `1 <= signal.length <= 1000`\n- `signal` consists of lowercase and uppercase English letters, and digits.\n\n**Example 1**\n```\ninput:\naabbc\noutput: 1\n```\nExplanation: Only 'c' appears an odd number of times (1).\n\n**Example 2**\n```\ninput:\nabc\noutput: 3\n```\nExplanation: All three characters appear exactly once.\n\n**Example 3**\n```\ninput:\naabbcc\noutput: 0\n```\nExplanation: Every character appears an even number of times.",
    editorialMarkdown: "## Anomalous Signal Frequencies\nTo solve this, we count the occurrences of each character in the string. We can use a hash map or an array of size 256 (for ASCII characters) to store the frequencies. Finally, we iterate through the frequency counts and tally how many are odd.\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N)\\) where \\(N\\) is the length of the string, since we need to process each character once.\n- **Space Complexity:** \\(\\mathcal{O}(1)\\) since the number of possible characters is bounded by the size of the character set (e.g., 62 for alphanumeric characters).\n**Common Trap:**\nA common mistake is returning the total number of odd occurrences across all characters, instead of the number of *distinct* characters that have an odd frequency.",
    referenceSolution: {
      JAVASCRIPT: "function solve(signal) {\n    let counts = new Map();\n    for (let char of signal) {\n        counts.set(char, (counts.get(char) || 0) + 1);\n    }\n    let anomalousCount = 0;\n    for (let count of counts.values()) {\n        if (count % 2 !== 0) anomalousCount++;\n    }\n    return anomalousCount;\n}",
      TYPESCRIPT: "function solve(signal: string): number {\n    let counts = new Map<string, number>();\n    for (let char of signal) {\n        counts.set(char, (counts.get(char) || 0) + 1);\n    }\n    let anomalousCount = 0;\n    for (let count of counts.values()) {\n        if (count % 2 !== 0) anomalousCount++;\n    }\n    return anomalousCount;\n}",
      PYTHON: "def solve(signal):\n    counts = {}\n    for char in signal:\n        counts[char] = counts.get(char, 0) + 1\n    anomalousCount = 0\n    for count in counts.values():\n        if count % 2 != 0:\n            anomalousCount += 1\n    return anomalousCount",
      JAVA: "    static int solve(String signal) {\n        int[] counts = new int[256];\n        for (int i = 0; i < signal.length(); i++) {\n            counts[signal.charAt(i)]++;\n        }\n        int anomalousCount = 0;\n        for (int count : counts) {\n            if (count % 2 != 0) anomalousCount++;\n        }\n        return anomalousCount;\n    }",
      CPP: "int solve(string signal) {\n    int counts[256] = {0};\n    for (char c : signal) {\n        counts[(unsigned char)c]++;\n    }\n    int anomalousCount = 0;\n    for (int count : counts) {\n        if (count % 2 != 0) anomalousCount++;\n    }\n    return anomalousCount;\n}",
      GO: "func solve(signal string) int {\n    counts := make(map[rune]int)\n    for _, char := range signal {\n        counts[char]++\n    }\n    anomalousCount := 0\n    for _, count := range counts {\n        if count % 2 != 0 {\n            anomalousCount++\n        }\n    }\n    return anomalousCount\n}",
    },
    tests: [
      { stdin: "aabbc", expectedStdout: "1", isSample: true },
      { stdin: "abc", expectedStdout: "3", isSample: true },
      { stdin: "aabbcc", expectedStdout: "0" },
      { stdin: "a", expectedStdout: "1" },
      { stdin: "AaAaBb", expectedStdout: "2" },
      { stdin: "zZzZz", expectedStdout: "1" },
      { stdin: "1231234", expectedStdout: "1" },
      { stdin: "abAB12", expectedStdout: "6" },
    ],
  }),
];
