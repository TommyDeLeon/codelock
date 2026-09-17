import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w0-141` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W0_141_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "absent-student-photo-day",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Missing Encyclopedia Volume",
    patternTags: ["array","math","bit-manipulation","hash-set"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 300,
    promptMarkdown: "A library has a complete collection of reference books that are supposed to be numbered sequentially from `0` to `n`. However, a librarian noticed that one book has been misplaced, leaving exactly `n` books on the shelf.\n\nYou are provided with an array `ids` of size `n` which lists the numbers of the books that are currently present. Your objective is to determine and return the number of the misplaced book.\n\n**Constraints**\n- `n == ids.length`\n- `1 ≤ n ≤ 10^4`\n- `0 ≤ ids[i] ≤ n`\n- All numbers in `ids` are unique.\n\n**Example 1**\n```\ninput:\n3 0 1\noutput:\n2\n```\n*Explanation: There are 3 books on the shelf, so the full set should be numbered from 0 to 3. The book numbered 2 is missing.*\n\n**Example 2**\n```\ninput:\n0 1\noutput:\n2\n```\n*Explanation: There are 2 books present, meaning the numbers should go from 0 to 2. The number 2 is missing.*\n\n**Example 3**\n```\ninput:\n9 6 4 2 3 5 7 0 1\noutput:\n8\n```\n*Explanation: With 9 books on the shelf, the numbers range from 0 to 9. The missing book number is 8.*\n\n**Follow-up**\nCan you find the missing book in O(N) time and O(1) extra space complexity?",
    editorialMarkdown: "## Absent Student Photo Day\n\nThe problem requires us to find the missing ID from an array of student IDs. The IDs are guaranteed to be distinct and fall in the range `[0, n]`, where `n` is the length of the array. Since the array length is `n`, exactly one ID from the range `[0, n]` is missing.\n\nA highly efficient mathematical approach involves calculating the expected sum of all numbers from `0` to `n` using the arithmetic progression formula: `expected_sum = n * (n + 1) / 2`. Then, we can calculate the actual sum of all numbers present in the array. The difference between the expected sum and the actual sum will be exactly the missing ID.\n\nAlternatively, the bitwise XOR operation can be used since `x ^ x = 0`. By XORing all indices `[0, n]` and all array elements together, the matching pairs will cancel out, leaving only the missing number.\n\n**Trap**: Avoid sorting the array to find the missing element, as sorting takes O(N log N) time which is suboptimal.\n\n**Complexity:**\n- **Time:** O(N), where N is the length of the array. We only iterate through the array once to calculate its sum (or XOR).\n- **Space:** O(1), as we only use a few extra variables for computation.",
    referenceSolution: {
      JAVASCRIPT: "function solve(ids) {\n    let n = ids.length;\n    let expectedSum = (n * (n + 1)) / 2;\n    let actualSum = ids.reduce((a, b) => a + b, 0);\n    return expectedSum - actualSum;\n}",
      TYPESCRIPT: "function solve(ids: number[]): number {\n    let n = ids.length;\n    let expectedSum = (n * (n + 1)) / 2;\n    let actualSum = ids.reduce((a, b) => a + b, 0);\n    return expectedSum - actualSum;\n}",
      PYTHON: "def solve(ids):\n    n = len(ids)\n    return (n * (n + 1)) // 2 - sum(ids)",
      JAVA: "    static int solve(int[] ids) {\n        int n = ids.length;\n        int expected_sum = n * (n + 1) / 2;\n        int actual_sum = 0;\n        for (int id : ids) {\n            actual_sum += id;\n        }\n        return expected_sum - actual_sum;\n    }",
      CPP: "int solve(std::vector<int> ids) {\n    int n = ids.size();\n    int expected_sum = n * (n + 1) / 2;\n    int actual_sum = 0;\n    for (int id : ids) {\n        actual_sum += id;\n    }\n    return expected_sum - actual_sum;\n}",
      GO: "func solve(ids []int) int {\n    n := len(ids)\n    expectedSum := n * (n + 1) / 2\n    actualSum := 0\n    for _, id := range ids {\n        actualSum += id\n    }\n    return expectedSum - actualSum\n}",
    },
    tests: [
      { stdin: "3 0 1", expectedStdout: "2", isSample: true },
      { stdin: "0 1", expectedStdout: "2", isSample: true },
      { stdin: "9 6 4 2 3 5 7 0 1", expectedStdout: "8" },
      { stdin: "0", expectedStdout: "1" },
      { stdin: "1", expectedStdout: "0" },
      { stdin: "0 1 2 4 5 6", expectedStdout: "3" },
      { stdin: "0 1 2 3 4 5 6 7 8 9 11 12 13 14 15", expectedStdout: "10" },
      { stdin: "0 1 2 3 4 5 6 8 9 10 11 12 13 14 15 16 17 18 19 20", expectedStdout: "7" },
    ],
  }),

  p({
    ...base,
    slug: "inflation-merchant-price-markup",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Inflation Merchant Price Markup",
    patternTags: ["matrix","array","math"],
    signatureId: "fn:matrix->matrix",
    avgSolveSeconds: 300,
    promptMarkdown: "A merchant database stores items as a 2D array `matrix`, where each row contains exactly two integers: `[item_id, price]`. \n\nDue to a sudden spike in inflation, the merchant has decided to apply a 100% markup to all items in their inventory. This means every price must be exactly doubled.\n\nReturn the updated matrix where the price of every item has been multiplied by 2. The `item_id` must remain unchanged.\n\n**Constraints**\n- `1 \\u2264 matrix.length \\u2264 100`\n- `matrix[i].length == 2`\n- `1 \\u2264 matrix[i][0], matrix[i][1] \\u2264 10^5`\n\n**Example 1**\n```\ninput:\n1 100;2 200\noutput:\n1 200;2 400\n```\n*Explanation: Item 1's price goes from 100 to 200. Item 2's price goes from 200 to 400.*\n\n**Example 2**\n```\ninput:\n5 50\noutput:\n5 100\n```\n*Explanation: Item 5's price is doubled to 100.*\n\n**Example 3**\n```\ninput:\n10 15;11 30;12 45\noutput:\n10 30;11 60;12 90\n```\n*Explanation: All three items have their prices doubled.*\n\n**Follow-up**\nCan you modify the original matrix in-place without allocating extra space for a new matrix?",
    editorialMarkdown: "## Inflation Merchant Price Markup\n\nThis problem simulates modifying a specific column in a tabular dataset, a common task in data manipulation. We are given a matrix representing items where each row is `[item_id, price]`. We need to double the price.\n\nWe can achieve this by iterating over each row in the matrix, keeping the first element (the ID) unchanged, and multiplying the second element (the price) by 2. The result should be returned as a new modified matrix, or modified in place depending on the approach.\n\n**Trap**: Ensure that you are modifying exactly the column at index 1 and that the return type matches the expected 2D array structure.\n\n**Complexity:**\n- **Time:** O(N), where N is the number of rows in the matrix. We process each row exactly once in constant time.\n- **Space:** O(1) auxilliary space if modified in-place, or O(N) if we create a new matrix to return.",
    referenceSolution: {
      JAVASCRIPT: "function solve(matrix) {\n    for (let i = 0; i < matrix.length; i++) {\n        matrix[i][1] *= 2;\n    }\n    return matrix;\n}",
      TYPESCRIPT: "function solve(matrix: number[][]): number[][] {\n    for (let i = 0; i < matrix.length; i++) {\n        matrix[i][1] *= 2;\n    }\n    return matrix;\n}",
      PYTHON: "def solve(matrix):\n    return [[row[0], row[1] * 2] for row in matrix]",
      JAVA: "    static int[][] solve(int[][] matrix) {\n        for (int i = 0; i < matrix.length; i++) {\n            matrix[i][1] *= 2;\n        }\n        return matrix;\n    }",
      CPP: "std::vector<std::vector<int>> solve(std::vector<std::vector<int>> matrix) {\n    for (int i = 0; i < matrix.size(); ++i) {\n        matrix[i][1] *= 2;\n    }\n    return matrix;\n}",
      GO: "func solve(matrix [][]int) [][]int {\n    for i := 0; i < len(matrix); i++ {\n        matrix[i][1] *= 2\n    }\n    return matrix\n}",
    },
    tests: [
      { stdin: "1 100;2 200", expectedStdout: "1 200;2 400", isSample: true },
      { stdin: "5 50", expectedStdout: "5 100", isSample: true },
      { stdin: "10 15;11 30;12 45", expectedStdout: "10 30;11 60;12 90" },
      { stdin: "99 99", expectedStdout: "99 198" },
      { stdin: "1 1;2 2;3 3;4 4", expectedStdout: "1 2;2 4;3 6;4 8" },
      { stdin: "100 10000", expectedStdout: "100 20000" },
      { stdin: "5 10;1 20;2 30", expectedStdout: "5 20;1 40;2 60" },
      { stdin: "4 200;3 150;2 100;1 50", expectedStdout: "4 400;3 300;2 200;1 100" },
    ],
  }),

  p({
    ...base,
    slug: "invert-bitwise-signal-id",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BIT_MANIPULATION",
    title: "Faulty Digital Display",
    patternTags: ["bit-manipulation","math","binary"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 300,
    promptMarkdown: "You are analyzing a faulty digital display that shows the exact opposite of what it should in terms of binary digits. The display is given a positive integer `num`. \n\nTo process the display's output, `num` is converted to binary (with no leading zeros). Then, every bit is toggled: each `1` is replaced by a `0`, and each `0` is replaced by a `1`. The modified binary string is then converted back into an integer.\n\nGiven the initial integer `num`, return the integer that results from this toggling process.\n\n**Constraints**\n- `1 ≤ num < 2^31`\n\n**Example 1**\n```\ninput:\n5\noutput:\n2\n```\n*Explanation: The binary form of 5 is 101. Toggling the bits gives 010. The decimal value of 010 is 2.*\n\n**Example 2**\n```\ninput:\n1\noutput:\n0\n```\n*Explanation: The binary form of 1 is 1. Toggling the bit gives 0. The decimal value of 0 is 0.*\n\n**Example 3**\n```\ninput:\n10\noutput:\n5\n```\n*Explanation: The binary form of 10 is 1010. Toggling the bits gives 0101. The decimal value of 0101 is 5.*\n\n**Follow-up**\nCan you solve this using a bitmask and the XOR (`^`) operator?",
    editorialMarkdown: "## Invert Bitwise Signal ID\n\nThis problem tasks us with finding the bitwise complement of an integer's binary representation, ignoring any leading zeros.\n\nSince we are ignoring leading zeros, we only care about the bits up to the most significant `1`. To achieve this, we can construct a bitmask of the same length as the given number, but consisting entirely of `1`s. For example, if the number is `5` (binary `101`), we want a mask of `7` (binary `111`). Once we have this mask, we can simply XOR it with the original number. XORing any bit with `1` perfectly flips it (`0` becomes `1`, and `1` becomes `0`).\n\n**Trap**: Take care not to shift a 32-bit integer out of bounds when constructing the mask. The mask can be built dynamically by left-shifting `1` and keeping track of the bits.\n\n**Complexity:**\n- **Time:** O(1), since an integer has a fixed maximum number of bits (e.g., 32).\n- **Space:** O(1), as we only need an integer mask.",
    referenceSolution: {
      JAVASCRIPT: "function solve(num) {\n    let mask = 1;\n    while (mask <= num) {\n        mask *= 2;\n    }\n    return (mask - 1) ^ num;\n}",
      TYPESCRIPT: "function solve(num: number): number {\n    let mask = 1;\n    while (mask <= num) {\n        mask *= 2;\n    }\n    return (mask - 1) ^ num;\n}",
      PYTHON: "def solve(num):\n    mask = 1\n    while mask <= num:\n        mask <<= 1\n    return (mask - 1) ^ num",
      JAVA: "    static int solve(int num) {\n        long mask = 1;\n        while (mask <= num) {\n            mask <<= 1;\n        }\n        return (int) ((mask - 1) ^ num);\n    }",
      CPP: "int solve(int num) {\n    long long mask = 1;\n    while (mask <= num) {\n        mask <<= 1;\n    }\n    return (mask - 1) ^ num;\n}",
      GO: "func solve(num int) int {\n    mask := 1\n    for mask <= num {\n        mask <<= 1\n    }\n    return (mask - 1) ^ num\n}",
    },
    tests: [
      { stdin: "5", expectedStdout: "2", isSample: true },
      { stdin: "1", expectedStdout: "0", isSample: true },
      { stdin: "10", expectedStdout: "5" },
      { stdin: "7", expectedStdout: "0" },
      { stdin: "8", expectedStdout: "7" },
      { stdin: "2", expectedStdout: "1" },
      { stdin: "4", expectedStdout: "3" },
      { stdin: "85", expectedStdout: "42" },
    ],
  }),

  p({
    ...base,
    slug: "minimal-transport-fuel-cost",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GREEDY",
    title: "Balanced Necklace Design",
    patternTags: ["greedy","sorting","math","digits"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 400,
    promptMarkdown: "A jewelry maker is designing two custom necklaces using a total of four specific beads. The beads are represented by a single 4-digit integer `code`, where each digit corresponds to one bead. \n\nThe artisan needs to split the four digits to form exactly two numbers. These two numbers can be of any length (including having leading zeros) as long as all four digits are used exactly once. To keep the final pieces balanced, the artisan wants to ensure that the sum of the two formed numbers is as small as possible.\n\nGiven the 4-digit integer `code`, return the minimum possible sum of the two formed numbers.\n\n**Constraints**\n- `1000 ≤ code ≤ 9999`\n\n**Example 1**\n```\ninput:\n2932\noutput:\n52\n```\n*Explanation: The digits available are 2, 9, 3, and 2. The smallest sum is achieved by forming 29 and 23, which add up to 52.*\n\n**Example 2**\n```\ninput:\n4009\noutput:\n13\n```\n*Explanation: The digits are 4, 0, 0, and 9. The smallest sum is achieved by forming 04 and 09, adding up to 13.*\n\n**Example 3**\n```\ninput:\n1000\noutput:\n1\n```\n*Explanation: The digits are 1, 0, 0, and 0. The minimum sum is achieved by forming 00 and 01, which add up to 1.*\n\n**Follow-up**\nCould you solve this by mathematically extracting digits instead of converting the number to a string?",
    editorialMarkdown: "## Minimal Transport Cost\n\nThe problem asks us to divide the four digits of a given number into two numbers such that their sum is minimized.\n\nTo minimize the sum, the two most significant digits (the tens digits) of our newly formed numbers should be as small as possible. Therefore, we should sort the digits of the original number. The two smallest digits will form the tens places, and the two largest digits will form the ones places. \n\n**Trap**: A common pitfall is trying to keep the original relative order of the digits or forming one 3-digit number and one 1-digit number. The optimal strategy always balances the lengths (two 2-digit numbers) and places the smallest digits in the most significant positions.\n\n**Complexity:**\n- **Time:** O(1) or O(D log D) where D is the number of digits (which is always 4).\n- **Space:** O(1), as we only need to store an array of 4 digits.",
    referenceSolution: {
      JAVASCRIPT: "function solve(code) {\n    let digits = String(code).split('').map(Number).sort((a, b) => a - b);\n    return parseInt(digits[0] + \"\" + digits[2]) + parseInt(digits[1] + \"\" + digits[3]);\n}",
      TYPESCRIPT: "function solve(code: number): number {\n    let digits = String(code).split('').map(Number).sort((a, b) => a - b);\n    return parseInt(digits[0] + \"\" + digits[2]) + parseInt(digits[1] + \"\" + digits[3]);\n}",
      PYTHON: "def solve(code):\n    digits = sorted(list(str(code)))\n    return int(digits[0] + digits[2]) + int(digits[1] + digits[3])",
      JAVA: "    static int solve(int code) {\n        int[] digits = new int[4];\n        for (int i = 0; i < 4; i++) {\n            digits[i] = code % 10;\n            code /= 10;\n        }\n        java.util.Arrays.sort(digits);\n        return (digits[0] * 10 + digits[2]) + (digits[1] * 10 + digits[3]);\n    }",
      CPP: "int solve(int code) {\n    std::vector<int> digits;\n    while (code > 0) {\n        digits.push_back(code % 10);\n        code /= 10;\n    }\n    while (digits.size() < 4) digits.push_back(0);\n    std::sort(digits.begin(), digits.end());\n    return (digits[0] * 10 + digits[2]) + (digits[1] * 10 + digits[3]);\n}",
      GO: "func solve(code int) int {\n    digits := make([]int, 0, 4)\n    for code > 0 {\n        digits = append(digits, code % 10)\n        code /= 10\n    }\n    for len(digits) < 4 {\n        digits = append(digits, 0)\n    }\n    for i := 0; i < 4; i++ {\n        for j := i + 1; j < 4; j++ {\n            if digits[i] > digits[j] {\n                digits[i], digits[j] = digits[j], digits[i]\n            }\n        }\n    }\n    return (digits[0] * 10 + digits[2]) + (digits[1] * 10 + digits[3])\n}",
    },
    tests: [
      { stdin: "2932", expectedStdout: "52", isSample: true },
      { stdin: "4009", expectedStdout: "13", isSample: true },
      { stdin: "1000", expectedStdout: "1" },
      { stdin: "9999", expectedStdout: "198" },
      { stdin: "3124", expectedStdout: "37" },
      { stdin: "5350", expectedStdout: "40" },
      { stdin: "7823", expectedStdout: "65" },
      { stdin: "2042", expectedStdout: "26" },
    ],
  }),

  p({
    ...base,
    slug: "most-frequent-signal-code-log",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Most Frequent Signal Code",
    patternTags: ["hash-map","counting","string","strings"],
    signatureId: "fn:strings->string",
    avgSolveSeconds: 350,
    promptMarkdown: "An intergalactic space station maintains a communications log that records incoming signal codes as an array of strings called `codes`.\n\nTo identify the primary faction trying to establish contact, you need to find the signal code that appears most frequently in the log. It is guaranteed that there is exactly one unique most frequent signal code.\n\nGiven the array of strings `codes`, return the most frequent signal code.\n\n**Constraints**\n- `1 \\u2264 codes.length \\u2264 1000`\n- `1 \\u2264 codes[i].length \\u2264 20`\n- `codes[i]` consists of lowercase English letters.\n- The most frequent string is unique.\n\n**Example 1**\n```\ninput:\nalpha beta alpha\noutput:\nalpha\n```\n*Explanation: \"alpha\" occurs 2 times, while \"beta\" occurs 1 time.*\n\n**Example 2**\n```\ninput:\ndelta\noutput:\ndelta\n```\n*Explanation: \"delta\" is the only code, so it is the most frequent.*\n\n**Example 3**\n```\ninput:\ngamma gamma zeta zeta gamma\noutput:\ngamma\n```\n*Explanation: \"gamma\" occurs 3 times, making it the most frequent.*\n\n**Follow-up**\nCan you solve this with exactly one pass through the `codes` array, keeping track of the maximum frequency as you go?",
    editorialMarkdown: "## Most Frequent Signal Code\n\nThis problem requires finding the most frequently occurring string in an array. We can accomplish this by using a hash map (or dictionary) to keep track of the frequency of each signal code we encounter.\n\nWe iterate through the array of codes. For each code, we either add it to our hash map with a count of 1, or increment its existing count. Then, we can iterate through the key-value pairs in our hash map to find the key with the largest count.\n\n**Trap**: Make sure to properly handle edge cases where the input list only contains a single element.\n\n**Complexity:**\n- **Time:** O(N * L), where N is the number of words and L is the maximum length of a word. We process each character to hash and store the strings.\n- **Space:** O(U * L), where U is the number of unique words, representing the space needed for the hash map.",
    referenceSolution: {
      JAVASCRIPT: "function solve(codes) {\n    let counts = {};\n    let mostFrequent = \"\";\n    let maxCount = 0;\n    for (let code of codes) {\n        counts[code] = (counts[code] || 0) + 1;\n        if (counts[code] > maxCount) {\n            maxCount = counts[code];\n            mostFrequent = code;\n        }\n    }\n    return mostFrequent;\n}",
      TYPESCRIPT: "function solve(codes: string[]): string {\n    let counts: Record<string, number> = {};\n    let mostFrequent = \"\";\n    let maxCount = 0;\n    for (let code of codes) {\n        counts[code] = (counts[code] || 0) + 1;\n        if (counts[code] > maxCount) {\n            maxCount = counts[code];\n            mostFrequent = code;\n        }\n    }\n    return mostFrequent;\n}",
      PYTHON: "def solve(codes):\n    counts = {}\n    most_frequent = \"\"\n    max_count = 0\n    for code in codes:\n        counts[code] = counts.get(code, 0) + 1\n        if counts[code] > max_count:\n            max_count = counts[code]\n            most_frequent = code\n    return most_frequent",
      JAVA: "    static String solve(String[] codes) {\n        java.util.Map<String, Integer> counts = new java.util.HashMap<>();\n        String most_frequent = \"\";\n        int max_count = 0;\n        for (String code : codes) {\n            counts.put(code, counts.getOrDefault(code, 0) + 1);\n            if (counts.get(code) > max_count) {\n                max_count = counts.get(code);\n                most_frequent = code;\n            }\n        }\n        return most_frequent;\n    }",
      CPP: "#include <string>\n#include <vector>\n#include <unordered_map>\n\nstd::string solve(std::vector<std::string> codes) {\n    std::unordered_map<std::string, int> counts;\n    std::string most_frequent = \"\";\n    int max_count = 0;\n    for (const std::string& code : codes) {\n        counts[code]++;\n        if (counts[code] > max_count) {\n            max_count = counts[code];\n            most_frequent = code;\n        }\n    }\n    return most_frequent;\n}",
      GO: "func solve(codes []string) string {\n    counts := make(map[string]int)\n    mostFrequent := \"\"\n    maxCount := 0\n    for _, code := range codes {\n        counts[code]++\n        if counts[code] > maxCount {\n            maxCount = counts[code]\n            mostFrequent = code\n        }\n    }\n    return mostFrequent\n}",
    },
    tests: [
      { stdin: "alpha beta alpha", expectedStdout: "alpha", isSample: true },
      { stdin: "delta", expectedStdout: "delta", isSample: true },
      { stdin: "gamma gamma zeta zeta gamma", expectedStdout: "gamma" },
      { stdin: "y x x y x z z z x", expectedStdout: "x" },
      { stdin: "beep boop boop beep beep", expectedStdout: "beep" },
      { stdin: "a b c d e f g h a", expectedStdout: "a" },
      { stdin: "longcode longcode short", expectedStdout: "longcode" },
      { stdin: "hello world hello universe hello", expectedStdout: "hello" },
    ],
  }),
];
