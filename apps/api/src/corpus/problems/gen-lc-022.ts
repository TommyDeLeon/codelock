import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-022` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_022_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "verify-cross-star-system",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Verify Cross Star System",
    patternTags: ["array","matrix","diagonal"],
    signatureId: "fn:matrix->bool",
    avgSolveSeconds: 400,
    promptMarkdown: "You are given a square `matrix` representing a star system grid. A star system is considered a \\\"Cross System\\\" if both of the following are true:\n\n1. All the elements on both the main diagonal and the anti-diagonal are non-zero (representing stars).\n2. All other elements are zero (representing empty space).\n\nReturn `true` if the given matrix is a Cross System, and `false` otherwise.\n\n**Constraints**\n- `n == matrix.length == matrix[i].length`\n- `3 <= n <= 15`\n- `0 <= matrix[i][j] <= 100`\n\n**Example 1**\n```\ninput:\n2 0 0 1;0 3 1 0;0 5 2 0;4 0 0 2\noutput: true\n```\nExplanation: The main diagonal and anti-diagonal only contain non-zero elements. All other elements are zero.\n\n**Example 2**\n```\ninput:\n5 0 0;0 0 0;0 0 2\noutput: false\n```\nExplanation: The center element (which is on both diagonals) is zero, so it is not a Cross System.\n\n**Example 3**\n```\ninput:\n1 1 1;1 1 1;1 1 1\noutput: false\n```\nExplanation: There are non-zero elements outside of the diagonals.\n\n**Follow-up:** Can you solve it without any extra space?",
    editorialMarkdown: "## Diagonals Check\n\nThe problem requires checking two conditions for every cell in an n \times n grid: if a cell is on either the main or anti-diagonal, it must be non-zero; otherwise, it must be zero. We can do this in a single pass by iterating through all rows and columns.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(n^2) where n is the number of rows (and columns).\n- **Space Complexity:** mathcal{O}(1).\n\n**Common Trap:**\nFailing to correctly identify the anti-diagonal. The condition for the main diagonal is `i == j` and for the anti-diagonal is `i == n - 1 - j`.",
    referenceSolution: {
      JAVASCRIPT: "function solve(matrix) {\n    let n = matrix.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = 0; j < n; j++) {\n            if (i === j || i === n - 1 - j) {\n                if (matrix[i][j] === 0) return false;\n            } else {\n                if (matrix[i][j] !== 0) return false;\n            }\n        }\n    }\n    return true;\n}",
      TYPESCRIPT: "function solve(matrix: number[][]): boolean {\n    let n = matrix.length;\n    for (let i = 0; i < n; i++) {\n        for (let j = 0; j < n; j++) {\n            if (i === j || i === n - 1 - j) {\n                if (matrix[i][j] === 0) return false;\n            } else {\n                if (matrix[i][j] !== 0) return false;\n            }\n        }\n    }\n    return true;\n}",
      PYTHON: "def solve(matrix):\n    n = len(matrix)\n    for i in range(n):\n        for j in range(n):\n            if i == j or i == n - 1 - j:\n                if matrix[i][j] == 0:\n                    return False\n            else:\n                if matrix[i][j] != 0:\n                    return False\n    return True",
      JAVA: "    static boolean solve(int[][] matrix) {\n        int n = matrix.length;\n        for (int i = 0; i < n; i++) {\n            for (int j = 0; j < n; j++) {\n                if (i == j || i == n - 1 - j) {\n                    if (matrix[i][j] == 0) return false;\n                } else {\n                    if (matrix[i][j] != 0) return false;\n                }\n            }\n        }\n        return true;\n    }",
      CPP: "#include <vector>\n\nbool solve(std::vector<std::vector<int>> matrix) {\n    int n = matrix.size();\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < n; j++) {\n            if (i == j || i == n - 1 - j) {\n                if (matrix[i][j] == 0) return false;\n            } else {\n                if (matrix[i][j] != 0) return false;\n            }\n        }\n    }\n    return true;\n}",
      GO: "func solve(matrix [][]int) bool {\n    n := len(matrix)\n    for i := 0; i < n; i++ {\n        for j := 0; j < n; j++ {\n            if i == j || i == n - 1 - j {\n                if matrix[i][j] == 0 {\n                    return false\n                }\n            } else {\n                if matrix[i][j] != 0 {\n                    return false\n                }\n            }\n        }\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "2 0 0 1;0 3 1 0;0 5 2 0;4 0 0 2", expectedStdout: "true", isSample: true },
      { stdin: "5 0 0;0 0 0;0 0 2", expectedStdout: "false", isSample: true },
      { stdin: "1 1 1;1 1 1;1 1 1", expectedStdout: "false", isSample: true },
      { stdin: "1 0 1;0 1 0;1 0 1", expectedStdout: "true" },
      { stdin: "0 0 0;0 0 0;0 0 0", expectedStdout: "false" },
      { stdin: "1 0 0 1;0 0 0 0;0 0 0 0;1 0 0 1", expectedStdout: "false" },
      { stdin: "9 0 0 0 9;0 9 0 9 0;0 0 9 0 0;0 9 0 9 0;9 0 0 0 9", expectedStdout: "true" },
      { stdin: "9 0 0 0 9;0 9 0 9 0;0 1 9 0 0;0 9 0 9 0;9 0 0 0 9", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "fleet-double-speed",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Fleet Double Speed",
    patternTags: ["array","hash-set"],
    signatureId: "fn:ints->bool",
    avgSolveSeconds: 350,
    promptMarkdown: "You are given an integer array `speeds` representing the speeds of various spaceships in a fleet.\n\nCheck if there exist two distinct spaceships where one is traveling exactly twice as fast as the other. More formally, return `true` if there exists two indices `i` and `j` such that `i != j` and `speeds[i] == 2 * speeds[j]`, and `false` otherwise.\n\n**Constraints**\n- `2 <= speeds.length <= 500`\n- `-1000 <= speeds[i] <= 1000`\n\n**Example 1**\n```\ninput:\n10 2 5 3\noutput: true\n```\nExplanation: 10 is twice as fast as 5.\n\n**Example 2**\n```\ninput:\n7 1 14 11\noutput: true\n```\nExplanation: 14 is twice as fast as 7.\n\n**Example 3**\n```\ninput:\n3 1 7 11\noutput: false\n```\nExplanation: No speed is exactly twice another.\n\n**Follow-up:** Can you solve it with a single pass through the array?",
    editorialMarkdown: "## Hash Set Tracking\n\nWe need to find if there are two distinct indices `i` and `j` such that `arr[i] == 2 * arr[j]`. By iterating through the array while maintaining a hash set of previously seen values, we can check for each element `x` whether `2 * x` or `x / 2` (if `x` is even) is already in the set.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the number of elements.\n- **Space Complexity:** mathcal{O}(N) to store the seen values.\n\n**Common Trap:**\nFailing to handle zeros correctly. If the array has only one zero, `2 * 0 == 0`, but we need two *distinct* indices. Processing elements sequentially and checking the set *before* adding the current element handles this naturally.",
    referenceSolution: {
      JAVASCRIPT: "function solve(speeds) {\n    let seen = new Set();\n    for (let speed of speeds) {\n        if (seen.has(speed * 2) || (speed % 2 === 0 && seen.has(speed / 2))) {\n            return true;\n        }\n        seen.add(speed);\n    }\n    return false;\n}",
      TYPESCRIPT: "function solve(speeds: number[]): boolean {\n    let seen = new Set<number>();\n    for (let speed of speeds) {\n        if (seen.has(speed * 2) || (speed % 2 === 0 && seen.has(speed / 2))) {\n            return true;\n        }\n        seen.add(speed);\n    }\n    return false;\n}",
      PYTHON: "def solve(speeds):\n    seen = set()\n    for speed in speeds:\n        if speed * 2 in seen or (speed % 2 == 0 and speed // 2 in seen):\n            return True\n        seen.add(speed)\n    return False",
      JAVA: "    static boolean solve(int[] speeds) {\n        java.util.HashSet<Integer> seen = new java.util.HashSet<>();\n        for (int speed : speeds) {\n            if (seen.contains(speed * 2) || (speed % 2 == 0 && seen.contains(speed / 2))) {\n                return true;\n            }\n            seen.add(speed);\n        }\n        return false;\n    }",
      CPP: "#include <vector>\n#include <unordered_set>\n\nbool solve(std::vector<int> speeds) {\n    std::unordered_set<int> seen;\n    for (int speed : speeds) {\n        if (seen.count(speed * 2) > 0 || (speed % 2 == 0 && seen.count(speed / 2) > 0)) {\n            return true;\n        }\n        seen.insert(speed);\n    }\n    return false;\n}",
      GO: "func solve(speeds []int) bool {\n    seen := make(map[int]bool)\n    for _, speed := range speeds {\n        if seen[speed*2] || (speed%2 == 0 && seen[speed/2]) {\n            return true\n        }\n        seen[speed] = true\n    }\n    return false\n}",
    },
    tests: [
      { stdin: "10 2 5 3", expectedStdout: "true", isSample: true },
      { stdin: "7 1 14 11", expectedStdout: "true", isSample: true },
      { stdin: "3 1 7 11", expectedStdout: "false", isSample: true },
      { stdin: "0 0", expectedStdout: "true" },
      { stdin: "0 1", expectedStdout: "false" },
      { stdin: "-10 -5", expectedStdout: "true" },
      { stdin: "1000 333", expectedStdout: "false" },
      { stdin: "1 2 3 4 5 6 7 8", expectedStdout: "true" },
    ],
  }),

  p({
    ...base,
    slug: "valid-robotic-inventory",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Valid Robotic Inventory",
    patternTags: ["string","frequency-count"],
    signatureId: "fn:string->bool",
    avgSolveSeconds: 400,
    promptMarkdown: "You are given a digital string `report` of length `n`, representing a self-describing robotic inventory.\n\nThe inventory report is considered valid if for every index `i` in the range `0 <= i < n`, the digit `i` occurs exactly `report[i]` times in the string.\n\nReturn `true` if the inventory report is valid, and `false` otherwise.\n\n**Constraints**\n- `1 <= report.length <= 10`\n- `report` consists only of digits.\n\n**Example 1**\n```\ninput:\n1210\noutput: true\n```\nExplanation: \n- report[0] = '1': digit '0' occurs 1 time.\n- report[1] = '2': digit '1' occurs 2 times.\n- report[2] = '1': digit '2' occurs 1 time.\n- report[3] = '0': digit '3' occurs 0 times.\nAll conditions are met.\n\n**Example 2**\n```\ninput:\n030\noutput: false\n```\nExplanation: \n- report[0] = '0': digit '0' occurs 2 times in the string, not 0.\nCondition fails.\n\n**Example 3**\n```\ninput:\n2020\noutput: true\n```\nExplanation: '0' occurs 2 times, '1' occurs 0 times, '2' occurs 2 times, '3' occurs 0 times.\n\n**Follow-up:** Can you solve it using an array to store frequencies?",
    editorialMarkdown: "## Frequency Counting\n\nThe problem asks us to verify if a given string acts as a self-describing frequency map. We can compute the frequency of every digit in the string. Then we iterate over each position `i` and check if the counted frequency of the digit `i` matches the integer value of the character at `report[i]`.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the string.\n- **Space Complexity:** mathcal{O}(1) since the number of digits is always 10.\n\n**Common Trap:**\nIndexing errors between the digit character `'i'` and its numerical value `i`. You must ensure you are counting occurrences of the *character* representation of `i` and comparing it against the integer parsed from `report[i]`.",
    referenceSolution: {
      JAVASCRIPT: "function solve(report) {\n    let counts = new Array(10).fill(0);\n    for (let i = 0; i < report.length; i++) {\n        counts[parseInt(report[i])]++;\n    }\n    for (let i = 0; i < report.length; i++) {\n        if (counts[i] !== parseInt(report[i])) {\n            return false;\n        }\n    }\n    return true;\n}",
      TYPESCRIPT: "function solve(report: string): boolean {\n    let counts = new Array(10).fill(0);\n    for (let i = 0; i < report.length; i++) {\n        counts[parseInt(report[i])]++;\n    }\n    for (let i = 0; i < report.length; i++) {\n        if (counts[i] !== parseInt(report[i])) {\n            return false;\n        }\n    }\n    return true;\n}",
      PYTHON: "def solve(report):\n    counts = [0] * 10\n    for char in report:\n        counts[int(char)] += 1\n    for i in range(len(report)):\n        if counts[i] != int(report[i]):\n            return False\n    return True",
      JAVA: "    static boolean solve(String report) {\n        int[] counts = new int[10];\n        for (int i = 0; i < report.length(); i++) {\n            counts[report.charAt(i) - '0']++;\n        }\n        for (int i = 0; i < report.length(); i++) {\n            if (counts[i] != (report.charAt(i) - '0')) {\n                return false;\n            }\n        }\n        return true;\n    }",
      CPP: "#include <string>\n#include <vector>\n\nbool solve(std::string report) {\n    std::vector<int> counts(10, 0);\n    for (char c : report) {\n        counts[c - '0']++;\n    }\n    for (int i = 0; i < report.length(); i++) {\n        if (counts[i] != (report[i] - '0')) {\n            return false;\n        }\n    }\n    return true;\n}",
      GO: "func solve(report string) bool {\n    counts := make([]int, 10)\n    for i := 0; i < len(report); i++ {\n        counts[report[i]-'0']++\n    }\n    for i := 0; i < len(report); i++ {\n        if counts[i] != int(report[i]-'0') {\n            return false\n        }\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "1210", expectedStdout: "true", isSample: true },
      { stdin: "030", expectedStdout: "false", isSample: true },
      { stdin: "2020", expectedStdout: "true", isSample: true },
      { stdin: "1000", expectedStdout: "false" },
      { stdin: "21200", expectedStdout: "true" },
      { stdin: "1", expectedStdout: "false" },
      { stdin: "0000000000", expectedStdout: "false" },
      { stdin: "6210001000", expectedStdout: "true" },
    ],
  }),

  p({
    ...base,
    slug: "ascending-temperature-log",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Ascending Temperature Log",
    patternTags: ["string","parsing","linear-scan"],
    signatureId: "fn:string->bool",
    avgSolveSeconds: 350,
    promptMarkdown: "You are provided a log `message` containing alphabetic words and numeric temperature readings, separated by single spaces.\n\nReturn `true` if all the numbers in the log message appear in strictly increasing order, and `false` otherwise.\n\n**Constraints**\n- `3 <= message.length <= 200`\n- `message` consists of lowercase English letters, spaces, and digits.\n- There is at least one number in `message`.\n- No number contains leading zeroes.\n\n**Example 1**\n```\ninput:\nengine temp is 50 then 65 and finally 100\noutput: true\n```\nExplanation: The numbers are 50, 65, and 100, which are strictly increasing.\n\n**Example 2**\n```\ninput:\nsensor read 10 then 10 again\noutput: false\n```\nExplanation: The numbers are 10 and 10. They are not strictly increasing.\n\n**Example 3**\n```\ninput:\nreading 20 dropped to 5\noutput: false\n```\nExplanation: The sequence is 20, 5, which decreases.\n\n**Follow-up:** Can you solve it in a single pass without extra memory for string splitting?",
    editorialMarkdown: "## Tokenizing and Parsing\n\nThe problem requires extracting numbers from a mixed string of text and numbers, and verifying if they form a strictly increasing sequence. We can tokenize the string by space and attempt to parse each token. If a token is a number, we check if it is strictly greater than the previous number seen.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the string.\n- **Space Complexity:** mathcal{O}(N) to store tokens (can be mathcal{O}(1) with inline parsing).\n\n**Common Trap:**\nNot handling numbers that are more than one digit long or failing to enforce *strictly* ascending. 5, 5 is not strictly ascending.",
    referenceSolution: {
      JAVASCRIPT: "function solve(message) {\n    let prev = -1;\n    for (let token of message.split(\" \")) {\n        if (/^[0-9]+$/.test(token)) {\n            let num = parseInt(token);\n            if (num <= prev) return false;\n            prev = num;\n        }\n    }\n    return true;\n}",
      TYPESCRIPT: "function solve(message: string): boolean {\n    let prev = -1;\n    for (let token of message.split(\" \")) {\n        if (/^[0-9]+$/.test(token)) {\n            let num = parseInt(token);\n            if (num <= prev) return false;\n            prev = num;\n        }\n    }\n    return true;\n}",
      PYTHON: "def solve(message):\n    prev = -1\n    for token in message.split():\n        if token.isdigit():\n            num = int(token)\n            if num <= prev:\n                return False\n            prev = num\n    return True",
      JAVA: "    static boolean solve(String message) {\n        int prev = -1;\n        String[] tokens = message.split(\" \");\n        for (String token : tokens) {\n            if (Character.isDigit(token.charAt(0))) {\n                int num = Integer.parseInt(token);\n                if (num <= prev) return false;\n                prev = num;\n            }\n        }\n        return true;\n    }",
      CPP: "#include <string>\n#include <sstream>\n\nbool solve(std::string message) {\n    std::stringstream ss(message);\n    std::string token;\n    int prev = -1;\n    while (ss >> token) {\n        if (isdigit(token[0])) {\n            int num = std::stoi(token);\n            if (num <= prev) return false;\n            prev = num;\n        }\n    }\n    return true;\n}",
      GO: "func solve(message string) bool {\n    prev := -1\n    for _, token := range strings.Split(message, \" \") {\n        if len(token) > 0 && token[0] >= '0' && token[0] <= '9' {\n            num, _ := strconv.Atoi(token)\n            if num <= prev {\n                return false\n            }\n            prev = num\n        }\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "engine temp is 50 then 65 and finally 100", expectedStdout: "true", isSample: true },
      { stdin: "sensor read 10 then 10 again", expectedStdout: "false", isSample: true },
      { stdin: "reading 20 dropped to 5", expectedStdout: "false", isSample: true },
      { stdin: "1 2 3 4 5", expectedStdout: "true" },
      { stdin: "5 4 3 2 1", expectedStdout: "false" },
      { stdin: "only one number 42 here", expectedStdout: "true" },
      { stdin: "a 1 b 2 c 2", expectedStdout: "false" },
      { stdin: "starts with 0 is fake but 1 works", expectedStdout: "true" },
    ],
  }),
];
