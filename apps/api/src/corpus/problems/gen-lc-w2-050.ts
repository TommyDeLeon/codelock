import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w2-050` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W2_050_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "unique-alien-artifacts",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Unique Alien Artifacts",
    patternTags: ["arrays","hash-set","deduplication"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "You are an interstellar archeologist cataloging a sequence of discovered alien artifact IDs.\nThe scanning equipment sometimes logs the same artifact multiple times. You need to clean the data by keeping only the first occurrence of each artifact ID, maintaining their original discovery order.\n\nReturn the sequence of artifact IDs with all duplicates removed.\n\n**Constraints**\n- `0 <= ids.length <= 10^5`\n- `-10^9 <= ids[i] <= 10^9`\n\n**Example 1**\n```\ninput:\n1 2 2 3\noutput: 1 2 3\n```\n*Explanation: The second '2' is a duplicate and is removed.*\n\n**Example 2**\n```\ninput:\n5 4 5 2 4\noutput: 5 4 2\n```\n*Explanation: The second '5' and second '4' are removed, preserving the initial order.*\n\n**Example 3**\n```\ninput:\n1 1 1\noutput: 1\n```\n*Explanation: All duplicates of '1' are removed.*\n\n**Follow-up**\nCan you do this with a single pass through the array?",
    editorialMarkdown: "## Unique Alien Artifacts\nWe want to remove duplicates from an array while preserving the original order of the first occurrences.\nThe easiest way is to use a Hash Set to keep track of the elements we have already seen. As we iterate through the input array, we check if the current element is in the set. If it is not, we add it to the set and to our result array.\n\n**Trap**: Do not sort the array, as that would ruin the requirement to keep the first occurrences in their original order.\n\n**Complexity:**\n- **Time Complexity:** \\mathcal{O}(N) where N is the length of the array.\n- **Space Complexity:** \\mathcal{O}(N) to store the elements in the set and result array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(ids) {\n    const seen = new Set();\n    const res = [];\n    for (const x of ids) {\n        if (!seen.has(x)) {\n            seen.add(x);\n            res.push(x);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(ids: number[]): number[] {\n    const seen = new Set<number>();\n    const res: number[] = [];\n    for (const x of ids) {\n        if (!seen.has(x)) {\n            seen.add(x);\n            res.push(x);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(ids):\n    seen = set()\n    res = []\n    for x in ids:\n        if x not in seen:\n            seen.add(x)\n            res.append(x)\n    return res",
      JAVA: "    static int[] solve(int[] ids) {\n        java.util.HashSet<Integer> seen = new java.util.HashSet<>();\n        int[] temp = new int[ids.length];\n        int count = 0;\n        for (int x : ids) {\n            if (seen.add(x)) {\n                temp[count++] = x;\n            }\n        }\n        int[] res = new int[count];\n        System.arraycopy(temp, 0, res, 0, count);\n        return res;\n    }",
      CPP: "#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nvector<int> solve(vector<int> ids) {\n    unordered_set<int> seen;\n    vector<int> res;\n    for (int x : ids) {\n        if (seen.find(x) == seen.end()) {\n            seen.insert(x);\n            res.push_back(x);\n        }\n    }\n    return res;\n}",
      GO: "func solve(ids []int) []int {\n    seen := make(map[int]bool)\n    res := []int{}\n    for _, x := range ids {\n        if !seen[x] {\n            seen[x] = true\n            res = append(res, x)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 2 3", expectedStdout: "1 2 3", isSample: true },
      { stdin: "5 4 5 2 4", expectedStdout: "5 4 2", isSample: true },
      { stdin: "1 1 1", expectedStdout: "1" },
      { stdin: "", expectedStdout: "" },
      { stdin: "-5 -2 0 -2 10 0", expectedStdout: "-5 -2 0 10" },
      { stdin: "10 20 30 40 10 20 30 40", expectedStdout: "10 20 30 40" },
      { stdin: "7", expectedStdout: "7" },
      { stdin: "1 2 3 4 5 6 7 8 9 10", expectedStdout: "1 2 3 4 5 6 7 8 9 10" },
    ],
  }),

  p({
    ...base,
    slug: "quarterly-sales-leader",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Majority Batch Code",
    patternTags: ["arrays","sorted-input","counting"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are inspecting batches of manufactured goods. The integer array `sales` contains the batch codes of items processed in a day, and it is provided in a **sorted** order.\nA batch code is deemed a \"majority batch\" if it represents strictly more than 25% of the day's processed items.\n\nGiven the sorted array `sales`, return the integer value of the majority batch code. It is guaranteed that exactly one such majority batch exists in the array.\n\n**Constraints**\n- `1 <= sales.length <= 10^4`\n- `0 <= sales[i] <= 10^5`\n- The array is sorted in non-decreasing order.\n\n**Example 1**\n```\ninput:\n1 2 2 2 3\noutput: 2\n```\n*Explanation: Out of 5 items, 25% is 1.25. The batch code 2 appears 3 times, which is more than 1.25.*\n\n**Example 2**\n```\ninput:\n1 1\noutput: 1\n```\n*Explanation: Out of 2 items, 25% is 0.5. The batch code 1 appears 2 times, which is more than 0.5.*\n\n**Example 3**\n```\ninput:\n10 10 20 30\noutput: 10\n```\n*Explanation: Out of 4 items, 25% is 1. The batch code 10 appears 2 times, which is more than 1.*\n\n**Follow-up**\nCan you solve it in \\mathcal{O}(1) space complexity?",
    editorialMarkdown: "## Quarterly Sales Leader\nBecause the array is sorted, any element that appears more than 25% of the time must occupy elements at distance `n/4` from each other. \nSpecifically, if we check an element at index `i`, and the element at index `i + floor(n/4)` is identical, then this element occurs more than `n/4` times.\n\n**Trap**: Checking a full frequency count takes \\\\mathcal{O}(N) time and \\\\mathcal{O}(N) space, but utilizing the sorted nature of the array allows an \\\\mathcal{O}(N) time and \\\\mathcal{O}(1) space solution.\n\n**Complexity:**\n- **Time Complexity:** \\\\mathcal{O}(N) to scan through the array elements.\n- **Space Complexity:** \\\\mathcal{O}(1) auxiliary space since we only store a few variables.",
    referenceSolution: {
      JAVASCRIPT: "function solve(sales) {\n    const n = sales.length;\n    const gap = Math.floor(n / 4);\n    for (let i = 0; i < n - gap; i++) {\n        if (sales[i] === sales[i + gap]) {\n            return sales[i];\n        }\n    }\n    return sales[0];\n}",
      TYPESCRIPT: "function solve(sales: number[]): number {\n    const n = sales.length;\n    const gap = Math.floor(n / 4);\n    for (let i = 0; i < n - gap; i++) {\n        if (sales[i] === sales[i + gap]) {\n            return sales[i];\n        }\n    }\n    return sales[0];\n}",
      PYTHON: "def solve(sales):\n    n = len(sales)\n    gap = n // 4\n    for i in range(n - gap):\n        if sales[i] == sales[i + gap]:\n            return sales[i]\n    return sales[0]",
      JAVA: "    static int solve(int[] sales) {\n        int n = sales.length;\n        int gap = n / 4;\n        for (int i = 0; i < n - gap; i++) {\n            if (sales[i] == sales[i + gap]) {\n                return sales[i];\n            }\n        }\n        return sales[0];\n    }",
      CPP: "#include <vector>\nusing namespace std;\n\nint solve(vector<int> sales) {\n    int n = sales.size();\n    int gap = n / 4;\n    for (int i = 0; i < n - gap; i++) {\n        if (sales[i] == sales[i + gap]) {\n            return sales[i];\n        }\n    }\n    return sales[0];\n}",
      GO: "func solve(sales []int) int {\n    n := len(sales)\n    gap := n / 4\n    for i := 0; i < n - gap; i++ {\n        if sales[i] == sales[i + gap] {\n            return sales[i]\n        }\n    }\n    return sales[0]\n}",
    },
    tests: [
      { stdin: "1 2 2 2 3", expectedStdout: "2", isSample: true },
      { stdin: "1 1", expectedStdout: "1", isSample: true },
      { stdin: "10 10 20 30", expectedStdout: "10" },
      { stdin: "5 5 5 5 5", expectedStdout: "5" },
      { stdin: "1 2 3 4 4 4 5 6 7", expectedStdout: "4" },
      { stdin: "9", expectedStdout: "9" },
      { stdin: "1 2 2 3", expectedStdout: "2" },
      { stdin: "1 2 8 8 8 9", expectedStdout: "8" },
    ],
  }),

  p({
    ...base,
    slug: "high-earning-subordinates",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Wealthy Vassals",
    patternTags: ["arrays","hash-map"],
    signatureId: "fn:matrix->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "You are examining the wealth distribution of a medieval kingdom. You are given a matrix `records` where each row represents a noble and is formatted as `[noble_id, gold, lord_id]`.\nIf a noble answers to no one, their `lord_id` is given as `-1`.\n\nReturn an array containing the `noble_id` of all nobles who possess strictly more gold than their direct lord. The output array can be in any order.\n\n**Constraints**\n- `1 <= records.length <= 10^4`\n- `records[i].length == 3`\n- `1 <= noble_id <= 10^5`\n- `1 <= gold <= 10^6`\n- `lord_id` is either `-1` or a valid `noble_id` in the records.\n\n**Example 1**\n```\ninput:\n1 100 2;2 50 -1\noutput: 1\n```\n*Explanation: Noble 1 has 100 gold, while their lord (Noble 2) has 50 gold. Noble 1 is wealthier.*\n\n**Example 2**\n```\ninput:\n1 10 -1\noutput: \n```\n*Explanation: Noble 1 has no lord, so they cannot possess more gold than their lord.*\n\n**Example 3**\n```\ninput:\n1 50 2;2 100 3;3 200 -1\noutput: \n```\n*Explanation: No noble possesses more gold than their direct lord.*\n\n**Follow-up**\nCan you accomplish this with an \\mathcal{O}(N) time complexity?",
    editorialMarkdown: "## High Earning Subordinates\nWe need to find employees who earn more than their direct managers.\nA straightforward approach is to first build a hash map that maps each `employee_id` to their `salary`.\nOnce the map is populated, we iterate through all employees again. For each employee, if their `manager_id` exists in the map and the employee's `salary` is strictly greater than their manager's `salary`, we include their `employee_id` in our answer.\n\n**Trap**: Make sure to check that the `manager_id` is actually present or valid before doing a comparison, to avoid null pointer exceptions or missing keys.\n\n**Complexity:**\n- **Time Complexity:** \\\\mathcal{O}(N) to insert into the hash map and another \\\\mathcal{O}(N) to iterate and check, where N is the number of employees.\n- **Space Complexity:** \\\\mathcal{O}(N) for the hash map to store the salaries.",
    referenceSolution: {
      JAVASCRIPT: "function solve(records) {\n    const salaries = new Map();\n    for (const r of records) {\n        salaries.set(r[0], r[1]);\n    }\n    const res = [];\n    for (const r of records) {\n        if (r[2] !== -1 && salaries.has(r[2]) && r[1] > salaries.get(r[2])) {\n            res.push(r[0]);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(records: number[][]): number[] {\n    const salaries = new Map<number, number>();\n    for (const r of records) {\n        salaries.set(r[0], r[1]);\n    }\n    const res: number[] = [];\n    for (const r of records) {\n        if (r[2] !== -1 && salaries.has(r[2]) && r[1] > salaries.get(r[2])) {\n            res.push(r[0]);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(records):\n    salaries = {r[0]: r[1] for r in records}\n    res = []\n    for r in records:\n        if r[2] != -1 and r[2] in salaries and r[1] > salaries[r[2]]:\n            res.append(r[0])\n    return res",
      JAVA: "    static int[] solve(int[][] records) {\n        java.util.Map<Integer, Integer> salaries = new java.util.HashMap<>();\n        for (int[] r : records) {\n            salaries.put(r[0], r[1]);\n        }\n        java.util.List<Integer> resList = new java.util.ArrayList<>();\n        for (int[] r : records) {\n            if (r[2] != -1 && salaries.containsKey(r[2]) && r[1] > salaries.get(r[2])) {\n                resList.add(r[0]);\n            }\n        }\n        int[] res = new int[resList.size()];\n        for (int i = 0; i < res.length; i++) {\n            res[i] = resList.get(i);\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nvector<int> solve(vector<vector<int>> records) {\n    unordered_map<int, int> salaries;\n    for (const auto& r : records) {\n        salaries[r[0]] = r[1];\n    }\n    vector<int> res;\n    for (const auto& r : records) {\n        int empId = r[0];\n        int salary = r[1];\n        int mgrId = r[2];\n        if (mgrId != -1 && salaries.count(mgrId) && salary > salaries[mgrId]) {\n            res.push_back(empId);\n        }\n    }\n    return res;\n}",
      GO: "func solve(records [][]int) []int {\n    salaries := make(map[int]int)\n    for _, r := range records {\n        salaries[r[0]] = r[1]\n    }\n    res := []int{}\n    for _, r := range records {\n        empId, salary, mgrId := r[0], r[1], r[2]\n        if mgrId != -1 {\n            if mgrSal, exists := salaries[mgrId]; exists && salary > mgrSal {\n                res = append(res, empId)\n            }\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 100 2;2 50 -1", expectedStdout: "1", isSample: true },
      { stdin: "1 10 -1", expectedStdout: "", isSample: true },
      { stdin: "1 50 2;2 100 3;3 200 -1", expectedStdout: "" },
      { stdin: "1 100 -1;2 100 1;3 100 1;4 120 1;5 150 2", expectedStdout: "4 5" },
      { stdin: "1 20 -1", expectedStdout: "" },
      { stdin: "3 50 -1;1 100 3;2 200 3", expectedStdout: "1 2" },
      { stdin: "1 200 2;2 100 3;3 300 -1", expectedStdout: "1" },
      { stdin: "1 100 -1;2 50 1;3 70 2", expectedStdout: "3" },
    ],
  }),

  p({
    ...base,
    slug: "star-system-identifier",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Blueprint Column Decoder",
    patternTags: ["math","base-conversion","strings"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are decoding an ancient civilization's base-26 numbering system, which uses uppercase English letters to represent column positions in their architectural blueprints.\nThe system starts with `A` as the 1st column, `B` as the 2nd, up through `Z` as the 26th. After `Z`, they use two letters, starting with `AA` for the 27th column, `AB` for the 28th, and so on.\n\nGiven a string `identifier` representing the column sequence, return its numerical position.\n\n**Constraints**\n- `1 <= identifier.length <= 7`\n- `identifier` consists only of uppercase English letters.\n- The corresponding index will fit in a 32-bit signed integer.\n\n**Example 1**\n```\ninput:\nA\noutput: 1\n```\n*Explanation: 'A' maps directly to the first column position.*\n\n**Example 2**\n```\ninput:\nAB\noutput: 28\n```\n*Explanation: 'AB' maps to 26 * 1 + 2 = 28.*\n\n**Example 3**\n```\ninput:\nZY\noutput: 701\n```\n*Explanation: 'ZY' maps to 26 * 26 + 25 = 701.*\n\n**Follow-up**\nCan you perform the conversion in a single forward pass without using the `Math.pow` function?",
    editorialMarkdown: "## Star System Identifier\nThe problem asks us to convert a string formatted as a base-26 integer (with letters `A` to `Z` mapping to 1 to 26 respectively) into its corresponding decimal value.\nWe iterate over the string from left to right. For each character, we compute its numerical value (`charCode - 64` for uppercase letters). We accumulate the final answer by multiplying the current total by 26 and adding the new character's value.\n\n**Trap**: The base-26 system here does not use `0`. Instead, `A` represents 1. Ensure you correctly multiply the running sum by 26 and add the 1-indexed value.\n\n**Complexity:**\n- **Time Complexity:** \\\\mathcal{O}(N) where N is the length of the string.\n- **Space Complexity:** \\\\mathcal{O}(1) as we only use an integer variable.",
    referenceSolution: {
      JAVASCRIPT: "function solve(identifier) {\n    let res = 0;\n    for (let i = 0; i < identifier.length; i++) {\n        res = res * 26 + (identifier.charCodeAt(i) - 64);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(identifier: string): number {\n    let res = 0;\n    for (let i = 0; i < identifier.length; i++) {\n        res = res * 26 + (identifier.charCodeAt(i) - 64);\n    }\n    return res;\n}",
      PYTHON: "def solve(identifier):\n    res = 0\n    for char in identifier:\n        res = res * 26 + (ord(char) - 64)\n    return res",
      JAVA: "    static int solve(String identifier) {\n        int res = 0;\n        for (int i = 0; i < identifier.length(); i++) {\n            res = res * 26 + (identifier.charAt(i) - 'A' + 1);\n        }\n        return res;\n    }",
      CPP: "#include <string>\nusing namespace std;\n\nint solve(string identifier) {\n    int res = 0;\n    for (char c : identifier) {\n        res = res * 26 + (c - 'A' + 1);\n    }\n    return res;\n}",
      GO: "func solve(identifier string) int {\n    res := 0\n    for i := 0; i < len(identifier); i++ {\n        res = res * 26 + int(identifier[i] - 'A' + 1)\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "A", expectedStdout: "1", isSample: true },
      { stdin: "AB", expectedStdout: "28", isSample: true },
      { stdin: "ZY", expectedStdout: "701", isSample: true },
      { stdin: "Z", expectedStdout: "26" },
      { stdin: "AZ", expectedStdout: "52" },
      { stdin: "ZZ", expectedStdout: "702" },
      { stdin: "ZZZ", expectedStdout: "18278" },
      { stdin: "AA", expectedStdout: "27" },
    ],
  }),

  p({
    ...base,
    slug: "single-pair-of-active-relays",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BIT_MANIPULATION",
    title: "Single Pair of Active Relays",
    patternTags: ["bit-manipulation","binary","counting"],
    signatureId: "fn:int->bool",
    avgSolveSeconds: 400,
    promptMarkdown: "In an industrial relay network, the state of the relays is represented as a non-negative integer. Each bit in the binary representation of the integer corresponds to a relay, where `1` means active and `0` means inactive.\nA \"pair of adjacent active relays\" is formed when two adjacent bits are both `1`. For example, the binary string `111` contains exactly TWO pairs of adjacent active relays.\n\nGiven the integer `state`, return `true` if there is exactly **one** pair of adjacent active relays in its binary representation, otherwise return `false`.\n\n**Constraints**\n- `0 <= state <= 10^9`\n\n**Example 1**\n```\ninput:\n6\noutput: true\n```\n*Explanation: 6 in binary is '110', which contains exactly one pair of adjacent 1s.*\n\n**Example 2**\n```\ninput:\n7\noutput: false\n```\n*Explanation: 7 in binary is '111', which contains two pairs of adjacent 1s.*\n\n**Example 3**\n```\ninput:\n5\noutput: false\n```\n*Explanation: 5 in binary is '101', which has zero pairs of adjacent 1s.*\n\n**Follow-up**\nCan you solve this without converting the number to a string, using only bitwise operations?",
    editorialMarkdown: "## Single Pair of Active Relays\nWe need to determine if the binary representation of an integer contains exactly one pair of adjacent `1`s.\nA clean way to solve this is to count how many times a set bit is followed immediately by another set bit. We can do this by converting the number to a binary string and counting occurrences of the substring `\"11\"`. Wait, the substring `\"111\"` contains TWO pairs of consecutive ones. So we just need to iterate through the binary string (or use bitwise operations) and count how many times `bit[i] == 1` and `bit[i+1] == 1`. If this total count is exactly 1, we return `true`, else `false`.\n\n**Trap**: A sequence of three `1`s like `111` forms two pairs of adjacent ones. We must just count overlapping pairs. Using string `.includes(\"11\")` might fail if there's `\"111\"`, so scanning bits is safer.\n\n**Complexity:**\n- **Time Complexity:** \\\\mathcal{O}(\\\\log N) to check the bits of the integer.\n- **Space Complexity:** \\\\mathcal{O}(1) if using bitwise operations, or \\\\mathcal{O}(\\\\log N) if converted to a binary string.",
    referenceSolution: {
      JAVASCRIPT: "function solve(state) {\n    let count = 0;\n    while (state > 0) {\n        if ((state & 3) === 3) {\n            count++;\n        }\n        state >>= 1;\n    }\n    return count === 1;\n}",
      TYPESCRIPT: "function solve(state: number): boolean {\n    let count = 0;\n    while (state > 0) {\n        if ((state & 3) === 3) {\n            count++;\n        }\n        state >>= 1;\n    }\n    return count === 1;\n}",
      PYTHON: "def solve(state):\n    count = 0\n    while state > 0:\n        if (state & 3) == 3:\n            count += 1\n        state >>= 1\n    return count == 1",
      JAVA: "    static boolean solve(int state) {\n        int count = 0;\n        while (state > 0) {\n            if ((state & 3) == 3) {\n                count++;\n            }\n            state >>= 1;\n        }\n        return count == 1;\n    }",
      CPP: "bool solve(int state) {\n    int count = 0;\n    while (state > 0) {\n        if ((state & 3) == 3) {\n            count++;\n        }\n        state >>= 1;\n    }\n    return count == 1;\n}",
      GO: "func solve(state int) bool {\n    count := 0\n    for state > 0 {\n        if (state & 3) == 3 {\n            count++\n        }\n        state >>= 1\n    }\n    return count == 1\n}",
    },
    tests: [
      { stdin: "6", expectedStdout: "true", isSample: true },
      { stdin: "7", expectedStdout: "false", isSample: true },
      { stdin: "5", expectedStdout: "false", isSample: true },
      { stdin: "0", expectedStdout: "false" },
      { stdin: "1", expectedStdout: "false" },
      { stdin: "3", expectedStdout: "true" },
      { stdin: "15", expectedStdout: "false" },
      { stdin: "96", expectedStdout: "true" },
      { stdin: "27", expectedStdout: "false" },
    ],
  }),
];
