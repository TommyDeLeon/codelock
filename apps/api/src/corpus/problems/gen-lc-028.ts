import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-028` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_028_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "generate-hex-identifier",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Format Sector ID",
    patternTags: ["math","string","base-conversion"],
    signatureId: "fn:int->string",
    avgSolveSeconds: 600,
    promptMarkdown: "You are developing a debugging interface for a custom microchip. The internal diagnostics tool identifies memory regions using a base-10 integer called `sectorId`. However, the debugging console needs to display this ID as a hexadecimal string.\n\nGiven a non-negative integer `sectorId`, return its hexadecimal string representation. The hexadecimal letters must be lowercase (`a-f`). You must implement the conversion logic manually and may not use any built-in language functions that automatically convert integers to base-16 strings.\n\n**Constraints**\n- `0 <= sectorId <= 2 * 10^9`\n\n**Example 1**\n```\ninput:\n26\noutput: 1a\n```\nExplanation: 26 in base-10 is 16 + 10. Since 10 corresponds to 'a' in hexadecimal, the result is \"1a\".\n\n**Example 2**\n```\ninput:\n0\noutput: 0\n```\nExplanation: 0 in base-10 is simply \"0\" in hexadecimal.\n\n**Example 3**\n```\ninput:\n255\noutput: ff\n```\nExplanation: 255 is (15 * 16) + 15, which maps to 'f' and 'f'.\n\n**Follow-up:** Can you optimize the string concatenation for very large numbers?",
    editorialMarkdown: "## Generate Hex Identifier\n\nTo convert a base-10 number to a hexadecimal string, we can repeatedly divide the number by 16. At each step, the remainder gives the current hexadecimal digit (from least significant to most significant), and the quotient becomes the new number for the next iteration.\n\nWe can maintain a mapping of remainders (0-15) to their corresponding hexadecimal characters ('0'-'9', 'a'-'f'). By prepending each mapped character to our result string, we build the final hexadecimal representation. A special case is needed for `0`, which should simply return `\"0\"`.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(\\log_{16} N)\\) where \\(N\\) is the given number, as the number of digits in the output is proportional to the logarithm of the number.\n- **Space Complexity:** \\(\\mathcal{O}(\\log_{16} N)\\) to store the resulting string.\n\n**Common Trap:**\nA common mistake is not handling the `0` edge case explicitly, resulting in an empty string being returned instead of `\"0\"`.",
    referenceSolution: {
      JAVASCRIPT: "function solve(sectorId) {\n    if (sectorId === 0) return \"0\";\n    let chars = \"0123456789abcdef\";\n    let res = \"\";\n    while (sectorId > 0) {\n        res = chars[sectorId % 16] + res;\n        sectorId = Math.floor(sectorId / 16);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(sectorId: number): string {\n    if (sectorId === 0) return \"0\";\n    let chars = \"0123456789abcdef\";\n    let res = \"\";\n    while (sectorId > 0) {\n        res = chars[sectorId % 16] + res;\n        sectorId = Math.floor(sectorId / 16);\n    }\n    return res;\n}",
      PYTHON: "def solve(sectorId):\n    if sectorId == 0:\n        return \"0\"\n    chars = \"0123456789abcdef\"\n    res = \"\"\n    while sectorId > 0:\n        res = chars[sectorId % 16] + res\n        sectorId //= 16\n    return res",
      JAVA: "    static String solve(int sectorId) {\n        if (sectorId == 0) return \"0\";\n        String chars = \"0123456789abcdef\";\n        StringBuilder res = new StringBuilder();\n        while (sectorId > 0) {\n            res.append(chars.charAt(sectorId % 16));\n            sectorId /= 16;\n        }\n        return res.reverse().toString();\n    }",
      CPP: "string solve(int sectorId) {\n    if (sectorId == 0) return \"0\";\n    string chars = \"0123456789abcdef\";\n    string res = \"\";\n    while (sectorId > 0) {\n        res = chars[sectorId % 16] + res;\n        sectorId /= 16;\n    }\n    return res;\n}",
      GO: "func solve(sectorId int) string {\n    if sectorId == 0 {\n        return \"0\"\n    }\n    chars := \"0123456789abcdef\"\n    res := \"\"\n    for sectorId > 0 {\n        res = string(chars[sectorId%16]) + res\n        sectorId /= 16\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "26", expectedStdout: "1a", isSample: true },
      { stdin: "0", expectedStdout: "0", isSample: true },
      { stdin: "255", expectedStdout: "ff" },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "16", expectedStdout: "10" },
      { stdin: "2147483647", expectedStdout: "7fffffff" },
      { stdin: "1000", expectedStdout: "3e8" },
      { stdin: "2748", expectedStdout: "abc" },
    ],
  }),

  p({
    ...base,
    slug: "decode-linked-binary-sequence",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "LINKED_LIST",
    title: "Evaluate Optical Punch Tape",
    patternTags: ["linked-list","math","bit-manipulation"],
    signatureId: "fn:list->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are building an interpreter for a vintage optical punch tape reader. As the tape passes through the scanner, it reads a sequence of bits and stores them as a singly linked list, where each node contains either a `0` or a `1`.\n\nGiven the `head` of this linked list, compute and return the equivalent decimal integer value of the continuous binary sequence it represents. The most significant bit is located at the head of the list.\n\n**Constraints**\n- The linked list is not empty and has at most 30 nodes.\n- Each node's value is either `0` or `1`.\n\n**Example 1**\n```\ninput:\n1 0 1\noutput: 5\n```\nExplanation: The binary sequence is (101), which evaluates to 1 * 2^2 + 0 * 2^1 + 1 * 2^0 = 5.\n\n**Example 2**\n```\ninput:\n0\noutput: 0\n```\nExplanation: The binary sequence is (0), which is 0 in decimal.\n\n**Example 3**\n```\ninput:\n1 1 0 0 1\noutput: 25\n```\nExplanation: The binary sequence is (11001), which equals 25 in decimal.\n\n**Follow-up:** Can you solve this in \\(\\mathcal{O}(N)\\) time and \\(\\mathcal{O}(1)\\) extra space?",
    editorialMarkdown: "## Decode Linked Binary Sequence\n\nTo convert the binary sequence represented by a linked list into a decimal integer, we can process the list from head to tail. As we visit each node, we accumulate the result. Since reading a new digit shifts all previously read digits one position to the left (in base 2), we multiply our accumulated result by 2 and then add the current node's value.\n\nWe initialize `res = 0` and traverse the list. At each step: `res = res * 2 + node.val`. When the list traversal is complete, `res` contains the decimal equivalent of the binary sequence.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N)\\) where \\(N\\) is the number of nodes in the linked list, as we process each node exactly once.\n- **Space Complexity:** \\(\\mathcal{O}(1)\\) because we only use a constant amount of extra space for the accumulator variable.\n\n**Common Trap:**\nA common trap is attempting to convert the linked list to a string first and then parsing the string, or storing the values in an array and reversing it. While these approaches work, they take \\(\\mathcal{O}(N)\\) extra space. Multiplying the running total by 2 avoids extra allocations.",
    referenceSolution: {
      JAVASCRIPT: "function solve(head) {\n    let res = 0;\n    while (head !== null) {\n        res = (res * 2) + head.val;\n        head = head.next;\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(head: ListNode | null): number {\n    let res = 0;\n    while (head !== null) {\n        res = (res * 2) + head.val;\n        head = head.next;\n    }\n    return res;\n}",
      PYTHON: "def solve(head):\n    res = 0\n    while head is not None:\n        res = (res * 2) + head.val\n        head = head.next\n    return res",
      JAVA: "    static int solve(ListNode head) {\n        int res = 0;\n        while (head != null) {\n            res = (res * 2) + head.val;\n            head = head.next;\n        }\n        return res;\n    }",
      CPP: "int solve(ListNode* head) {\n    int res = 0;\n    while (head != nullptr) {\n        res = (res * 2) + head->val;\n        head = head->next;\n    }\n    return res;\n}",
      GO: "func solve(head *ListNode) int {\n    res := 0\n    for head != nil {\n        res = (res * 2) + head.Val\n        head = head.Next\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 0 1", expectedStdout: "5", isSample: true },
      { stdin: "0", expectedStdout: "0", isSample: true },
      { stdin: "1 1 0 0 1", expectedStdout: "25" },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "1 0", expectedStdout: "2" },
      { stdin: "1 0 0 0", expectedStdout: "8" },
      { stdin: "1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1", expectedStdout: "1073741823" },
      { stdin: "1 0 1 0 1 0", expectedStdout: "42" },
    ],
  }),

  p({
    ...base,
    slug: "nearby-identical-transmissions",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Detect Repeated Pings",
    patternTags: ["array","hash-map","sliding-window"],
    signatureId: "fn:ints,int->bool",
    avgSolveSeconds: 600,
    promptMarkdown: "You are a wildlife researcher tracking acoustic pings from tagged marine animals. Each recorded ping is assigned an integer ID and logged sequentially. You need to determine if any specific animal stays in the same area by checking for repeated pings that occur closely together in the sequence.\n\nGiven an array of integers `signals` representing the logged ping IDs and an integer `limit`, return `true` if there are two distinct indices `i` and `j` in the array such that `signals[i] == signals[j]` and the absolute difference between `i` and `j` is at most `limit`. Otherwise, return `false`.\n\n**Constraints**\n- `1 <= signals.length <= 10^5`\n- `-10^9 <= signals[i] <= 10^9`\n- `0 <= limit <= 10^5`\n\n**Example 1**\n```\ninput:\n1 2 3 1\n3\noutput: true\n```\nExplanation: The ping ID `1` appears at indices 0 and 3. The absolute difference is 3, which is at most `limit` (3).\n\n**Example 2**\n```\ninput:\n1 0 1 1\n1\noutput: true\n```\nExplanation: The ping ID `1` appears at indices 2 and 3. The absolute difference is 1, which is at most `limit` (1).\n\n**Example 3**\n```\ninput:\n1 2 3 1 2 3\n2\noutput: false\n```\nExplanation: There are matching pings, but the closest pair has an absolute difference of 3, which is strictly greater than `limit` (2).\n\n**Follow-up:** Can you solve this in \\(\\mathcal{O}(N)\\) time and \\(\\mathcal{O}(N)\\) space?",
    editorialMarkdown: "## Nearby Identical Transmissions\n\nTo solve this, we can maintain a hash map that maps each signal ID to the last index at which it was seen. We iterate through the array of signals, and for each signal, we check if it already exists in the hash map. If it does, we calculate the difference between the current index and the index stored in the hash map. If this difference is less than or equal to the allowed threshold limit, we have found a valid pair and return `true`. Otherwise, we update the hash map with the current index of the signal. If the loop completes without finding any such pair, we return `false`.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N)\\) where \\(N\\) is the number of signals, as we only iterate through the array once and hash map operations take \\(\\mathcal{O}(1)\\) time on average.\n- **Space Complexity:** \\(\\mathcal{O}(min(N, M))\\) where \\(N\\) is the number of signals and \\(M\\) is the number of distinct signal IDs, since we store each distinct signal ID in the hash map.\n\n**Common Trap:**\nA common pitfall is to use a nested loop to check all pairs of signals, which would lead to an \\(\\mathcal{O}(N^2)\\) time complexity and likely result in a Time Limit Exceeded error for large inputs.",
    referenceSolution: {
      JAVASCRIPT: "function solve(signals, limit) {\n    let seen = new Map();\n    for (let i = 0; i < signals.length; i++) {\n        if (seen.has(signals[i]) && i - seen.get(signals[i]) <= limit) {\n            return true;\n        }\n        seen.set(signals[i], i);\n    }\n    return false;\n}",
      TYPESCRIPT: "function solve(signals: number[], limit: number): boolean {\n    let seen = new Map<number, number>();\n    for (let i = 0; i < signals.length; i++) {\n        if (seen.has(signals[i]) && i - seen.get(signals[i])! <= limit) {\n            return true;\n        }\n        seen.set(signals[i], i);\n    }\n    return false;\n}",
      PYTHON: "def solve(signals, limit):\n    seen = {}\n    for i in range(len(signals)):\n        if signals[i] in seen and i - seen[signals[i]] <= limit:\n            return True\n        seen[signals[i]] = i\n    return False",
      JAVA: "    static boolean solve(int[] signals, int limit) {\n        java.util.Map<Integer, Integer> seen = new java.util.HashMap<>();\n        for (int i = 0; i < signals.length; i++) {\n            if (seen.containsKey(signals[i]) && i - seen.get(signals[i]) <= limit) {\n                return true;\n            }\n            seen.put(signals[i], i);\n        }\n        return false;\n    }",
      CPP: "bool solve(vector<int> signals, int limit) {\n    unordered_map<int, int> seen;\n    for (int i = 0; i < signals.size(); i++) {\n        if (seen.find(signals[i]) != seen.end() && i - seen[signals[i]] <= limit) {\n            return true;\n        }\n        seen[signals[i]] = i;\n    }\n    return false;\n}",
      GO: "func solve(signals []int, limit int) bool {\n    seen := make(map[int]int)\n    for i := 0; i < len(signals); i++ {\n        if val, ok := seen[signals[i]]; ok && i - val <= limit {\n            return true\n        }\n        seen[signals[i]] = i\n    }\n    return false\n}",
    },
    tests: [
      { stdin: "1 2 3 1\n3", expectedStdout: "true", isSample: true },
      { stdin: "1 0 1 1\n1", expectedStdout: "true", isSample: true },
      { stdin: "1 2 3 1 2 3\n2", expectedStdout: "false" },
      { stdin: "1\n1", expectedStdout: "false" },
      { stdin: "\n1", expectedStdout: "false" },
      { stdin: "-5 10 -5\n2", expectedStdout: "true" },
      { stdin: "-5 10 -5\n1", expectedStdout: "false" },
      { stdin: "99 99 99\n0", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "organize-cargo-into-square",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Organize Cargo Into Square",
    patternTags: ["array","matrix","math"],
    signatureId: "fn:ints->matrix",
    avgSolveSeconds: 600,
    promptMarkdown: "You are tasked with organizing a sequence of incoming cargo containers into a square storage grid. The cargo is presented as a 1D array of integers, where each integer represents a cargo container ID.\n\nYour goal is to arrange these containers into a 2D square matrix, filling it row by row from left to right. However, the storage grid must be perfectly square. If the total number of containers is not a perfect square (i.e., it cannot form an `n x n` grid where `n` is an integer), you must reject the sequence and return an empty matrix.\n\nGiven a 1D integer array `cargo`, return the constructed 2D square matrix, or an empty matrix if it's impossible.\n\n**Constraints**\n- `0 <= cargo.length <= 10^4`\n- `1 <= cargo[i] <= 10^5`\n\n**Example 1**\n```\ninput:\n1 2 3 4\noutput: 1 2;3 4\n```\nExplanation: The length of the array is 4, which is a perfect square (2x2). The first 2 elements form the first row, and the next 2 form the second row.\n\n**Example 2**\n```\ninput:\n1 2 3\noutput: \n```\nExplanation: The length of the array is 3, which is not a perfect square. Thus, an empty matrix is returned.\n\n**Example 3**\n```\ninput:\n5\noutput: 5\n```\nExplanation: The length is 1, a perfect square (1x1). The matrix has 1 row and 1 column.\n\n**Follow-up:** Can you solve this without allocating an intermediate array before adding to the matrix in languages that allow it?",
    editorialMarkdown: "## Organize Cargo Into Square\n\nTo solve this problem, we first determine if the number of elements in the array is a perfect square. We can find the square root of the array's length and check if it's an integer. If it isn't, we return an empty matrix.\n\nIf it is a perfect square, let the square root be `n`. We iterate `n` times to create `n` rows. For each row `i` (from `0` to `n-1`), we extract a subarray of length `n` starting from index `i * n` in the original array and add it to our resulting matrix. Finally, we return the constructed matrix.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(L)\\) where \\(L\\) is the length of the array, because we iterate over the elements once to form the 2D array.\n- **Space Complexity:** \\(\\mathcal{O}(1)\\) excluding the space required for the output matrix.\n\n**Common Trap:**\nFailing to correctly verify if the array length is a perfect square, or incorrectly slicing the array (such as overlapping elements) are common traps. Ensure precise indexing for `i * n` to `(i + 1) * n`.",
    referenceSolution: {
      JAVASCRIPT: "function solve(cargo) {\n    if (cargo.length === 0) return [];\n    let n = Math.sqrt(cargo.length);\n    if (!Number.isInteger(n)) return [];\n    let res = [];\n    for (let i = 0; i < n; i++) {\n        res.push(cargo.slice(i * n, (i + 1) * n));\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(cargo: number[]): number[][] {\n    if (cargo.length === 0) return [];\n    let n = Math.sqrt(cargo.length);\n    if (!Number.isInteger(n)) return [];\n    let res: number[][] = [];\n    for (let i = 0; i < n; i++) {\n        res.push(cargo.slice(i * n, (i + 1) * n));\n    }\n    return res;\n}",
      PYTHON: "def solve(cargo):\n    length = len(cargo)\n    if length == 0:\n        return []\n    n = int(length ** 0.5)\n    if n * n != length:\n        return []\n    \n    res = []\n    for i in range(n):\n        res.append(cargo[i * n : (i + 1) * n])\n    return res",
      JAVA: "    static int[][] solve(int[] cargo) {\n        int len = cargo.length;\n        if (len == 0) return new int[0][0];\n        int n = (int) Math.round(Math.sqrt(len));\n        if (n * n != len) return new int[0][0];\n        \n        int[][] res = new int[n][n];\n        for (int i = 0; i < n; i++) {\n            for (int j = 0; j < n; j++) {\n                res[i][j] = cargo[i * n + j];\n            }\n        }\n        return res;\n    }",
      CPP: "vector<vector<int>> solve(vector<int> cargo) {\n    int len = cargo.size();\n    if (len == 0) return {};\n    int n = round(sqrt(len));\n    if (n * n != len) return {};\n    \n    vector<vector<int>> res;\n    for (int i = 0; i < n; i++) {\n        vector<int> row;\n        for (int j = 0; j < n; j++) {\n            row.push_back(cargo[i * n + j]);\n        }\n        res.push_back(row);\n    }\n    return res;\n}",
      GO: "func solve(cargo []int) [][]int {\n    length := len(cargo)\n    if length == 0 {\n        return [][]int{}\n    }\n    n := 0\n    for n*n < length {\n        n++\n    }\n    if n*n != length {\n        return [][]int{}\n    }\n    \n    res := make([][]int, n)\n    for i := 0; i < n; i++ {\n        res[i] = make([]int, n)\n        for j := 0; j < n; j++ {\n            res[i][j] = cargo[i*n+j]\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 3 4", expectedStdout: "1 2;3 4", isSample: true },
      { stdin: "1 2 3", expectedStdout: "", isSample: true },
      { stdin: "5", expectedStdout: "5", isSample: true },
      { stdin: "", expectedStdout: "" },
      { stdin: "1 2 3 4 5 6 7 8 9", expectedStdout: "1 2 3;4 5 6;7 8 9" },
      { stdin: "1 2 3 4 5 6 7 8", expectedStdout: "" },
      { stdin: "-1 -2 -3 -4", expectedStdout: "-1 -2;-3 -4" },
      { stdin: "10 10 10 10", expectedStdout: "10 10;10 10" },
    ],
  }),

  p({
    ...base,
    slug: "reformat-log-timestamp",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Reformat Log Timestamp",
    patternTags: ["string","parsing","hash-map"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 600,
    promptMarkdown: "You are building a parser to ingest system log timestamps from an older server framework. The legacy system outputs dates in the format `\"D-Mon-YYYY\"` or `\"DD-Mon-YYYY\"`. For example, `\"4-Apr-2023\"` or `\"15-Oct-2015\"`.\n\nYou need to convert this legacy date string into the ISO-like format `\"YYYY-MM-DD\"`.\n\nThe month abbreviation `Mon` is guaranteed to be one of the following: `\"Jan\", \"Feb\", \"Mar\", \"Apr\", \"May\", \"Jun\", \"Jul\", \"Aug\", \"Sep\", \"Oct\", \"Nov\", \"Dec\"`.\n\nGiven a `date` string in the legacy format, return the reformatted string.\n\n**Constraints**\n- The input string `date` is always well-formed.\n- The day is between 1 and 31.\n- The year is between 1900 and 2100.\n\n**Example 1**\nLegacy Format | Result\n--- | ---\n`\"15-Apr-2023\"` | `\"2023-04-15\"`\n\n**Example 2**\nLegacy Format | Result\n--- | ---\n`\"4-Nov-2019\"` | `\"2019-11-04\"`\n*Note that the single-digit day `4` was padded with a `0` to become `04`.*\n\n**Example 3**\nLegacy Format | Result\n--- | ---\n`\"31-Dec-1999\"` | `\"1999-12-31\"`\n\n**Follow-up:** Are you able to do this using simple string splitting operations?",
    editorialMarkdown: "## Reformat Log Timestamp\n\nTo solve this problem, we need to parse the input string and rearrange its components into the target format (`YYYY-MM-DD`). \n\nWe can split the input string by the delimiter `\"-\"`, which will give us an array containing the day, month abbreviation, and year. We can map the month abbreviation to its corresponding two-digit string using a hash map or dictionary. Next, we ensure the day string is two digits long by padding it with a leading zero if its length is 1. Finally, we concatenate the components in the correct order with dashes.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(1)\\) since the input strings have a fixed bounded length, and all string operations run in constant time.\n- **Space Complexity:** \\(\\mathcal{O}(1)\\) for storing the month dictionary and the resulting string.\n\n**Common Trap:**\nForgetting to pad a single-digit day with a leading zero is the most common error. The output must strictly follow the two-digit format for days.",
    referenceSolution: {
      JAVASCRIPT: "function solve(date) {\n    const months = {\"Jan\": \"01\", \"Feb\": \"02\", \"Mar\": \"03\", \"Apr\": \"04\", \"May\": \"05\", \"Jun\": \"06\", \"Jul\": \"07\", \"Aug\": \"08\", \"Sep\": \"09\", \"Oct\": \"10\", \"Nov\": \"11\", \"Dec\": \"12\"};\n    let parts = date.split(\"-\");\n    let day = parts[0];\n    if (day.length === 1) day = \"0\" + day;\n    return parts[2] + \"-\" + months[parts[1]] + \"-\" + day;\n}",
      TYPESCRIPT: "function solve(date: string): string {\n    const months: {[key: string]: string} = {\"Jan\": \"01\", \"Feb\": \"02\", \"Mar\": \"03\", \"Apr\": \"04\", \"May\": \"05\", \"Jun\": \"06\", \"Jul\": \"07\", \"Aug\": \"08\", \"Sep\": \"09\", \"Oct\": \"10\", \"Nov\": \"11\", \"Dec\": \"12\"};\n    let parts = date.split(\"-\");\n    let day = parts[0];\n    if (day.length === 1) day = \"0\" + day;\n    return parts[2] + \"-\" + months[parts[1]] + \"-\" + day;\n}",
      PYTHON: "def solve(date):\n    months = {\"Jan\": \"01\", \"Feb\": \"02\", \"Mar\": \"03\", \"Apr\": \"04\", \"May\": \"05\", \"Jun\": \"06\", \"Jul\": \"07\", \"Aug\": \"08\", \"Sep\": \"09\", \"Oct\": \"10\", \"Nov\": \"11\", \"Dec\": \"12\"}\n    parts = date.split(\"-\")\n    day = parts[0]\n    if len(day) == 1:\n        day = \"0\" + day\n    return f\"{parts[2]}-{months[parts[1]]}-{day}\"",
      JAVA: "    static String solve(String date) {\n        java.util.Map<String, String> months = new java.util.HashMap<>();\n        months.put(\"Jan\", \"01\"); months.put(\"Feb\", \"02\"); months.put(\"Mar\", \"03\"); months.put(\"Apr\", \"04\");\n        months.put(\"May\", \"05\"); months.put(\"Jun\", \"06\"); months.put(\"Jul\", \"07\"); months.put(\"Aug\", \"08\");\n        months.put(\"Sep\", \"09\"); months.put(\"Oct\", \"10\"); months.put(\"Nov\", \"11\"); months.put(\"Dec\", \"12\");\n        \n        String[] parts = date.split(\"-\");\n        String day = parts[0];\n        if (day.length() == 1) {\n            day = \"0\" + day;\n        }\n        return parts[2] + \"-\" + months.get(parts[1]) + \"-\" + day;\n    }",
      CPP: "string solve(string date) {\n    unordered_map<string, string> months = {\n        {\"Jan\", \"01\"}, {\"Feb\", \"02\"}, {\"Mar\", \"03\"}, {\"Apr\", \"04\"}, \n        {\"May\", \"05\"}, {\"Jun\", \"06\"}, {\"Jul\", \"07\"}, {\"Aug\", \"08\"}, \n        {\"Sep\", \"09\"}, {\"Oct\", \"10\"}, {\"Nov\", \"11\"}, {\"Dec\", \"12\"}\n    };\n    int firstDash = date.find('-');\n    int secondDash = date.find('-', firstDash + 1);\n    string day = date.substr(0, firstDash);\n    string month = date.substr(firstDash + 1, secondDash - firstDash - 1);\n    string year = date.substr(secondDash + 1);\n    \n    if (day.length() == 1) {\n        day = \"0\" + day;\n    }\n    return year + \"-\" + months[month] + \"-\" + day;\n}",
      GO: "func solve(date string) string {\n    months := map[string]string{\n        \"Jan\": \"01\", \"Feb\": \"02\", \"Mar\": \"03\", \"Apr\": \"04\",\n        \"May\": \"05\", \"Jun\": \"06\", \"Jul\": \"07\", \"Aug\": \"08\",\n        \"Sep\": \"09\", \"Oct\": \"10\", \"Nov\": \"11\", \"Dec\": \"12\",\n    }\n    parts := strings.Split(date, \"-\")\n    day := parts[0]\n    if len(day) == 1 {\n        day = \"0\" + day\n    }\n    return parts[2] + \"-\" + months[parts[1]] + \"-\" + day\n}",
    },
    tests: [
      { stdin: "15-Apr-2023", expectedStdout: "2023-04-15", isSample: true },
      { stdin: "4-Nov-2019", expectedStdout: "2019-11-04", isSample: true },
      { stdin: "31-Dec-1999", expectedStdout: "1999-12-31" },
      { stdin: "1-Jan-2100", expectedStdout: "2100-01-01" },
      { stdin: "29-Feb-2000", expectedStdout: "2000-02-29" },
      { stdin: "8-Aug-1900", expectedStdout: "1900-08-08" },
      { stdin: "13-Jul-1970", expectedStdout: "1970-07-13" },
      { stdin: "9-Jun-2050", expectedStdout: "2050-06-09" },
    ],
  }),
];
