import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w4-055` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W4_055_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "identify-power-surges",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Identify Power Surges",
    patternTags: ["array","linear-scan","indexing"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 300,
    promptMarkdown: "You are monitoring a station's power grid. You are given a 0-indexed integer array `powerLevels` representing sequential power readings over time.\n\nA \"power surge\" occurs at an index `i` if `powerLevels[i]` is strictly greater than both its immediate neighbors, `powerLevels[i-1]` and `powerLevels[i+1]`.\n\nReturn an array of all indices where a power surge occurs, in strictly increasing order.\n\n**Constraints**\n- `1 <= powerLevels.length <= 100`\n- `-1000 <= powerLevels[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 3 2 4 1\noutput: 1 3\n```\n*Explanation: Indices 1 (value 3) and 3 (value 4) are strictly greater than their neighbors.*\n\n**Example 2**\n```\ninput:\n1 2 3 4 5\noutput: \n```\n*Explanation: There are no power surges since the sequence is strictly increasing.*\n\n**Example 3**\n```\ninput:\n10 5 10 5\noutput: 2\n```\n*Explanation: Index 2 (value 10) is strictly greater than both neighbors (values 5).*\n\n**Follow-up**\nCan you find the surges using a single pass?",
    editorialMarkdown: "## Identify Power Surges\nTo find the surges, iterate through the sequence starting from the second reading and ending at the second-to-last reading. For each reading, check if it is strictly greater than both its predecessor and its successor. If it is, append its index to the result.\n\n**Trap**: Trying to check indices 0 or N-1 can lead to out-of-bounds errors, since a surge requires both a previous and a next reading.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N), where N is the number of power readings, since we scan the array once.\n- **Space Complexity:** mathcal{O}(1) (excluding the space needed to store the output).",
    referenceSolution: {
      JAVASCRIPT: "function solve(powerLevels) {\n    let res = [];\n    for (let i = 1; i < powerLevels.length - 1; i++) {\n        if (powerLevels[i] > powerLevels[i-1] && powerLevels[i] > powerLevels[i+1]) {\n            res.push(i);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(powerLevels: number[]): number[] {\n    let res: number[] = [];\n    for (let i = 1; i < powerLevels.length - 1; i++) {\n        if (powerLevels[i] > powerLevels[i-1] && powerLevels[i] > powerLevels[i+1]) {\n            res.push(i);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(powerLevels):\n    res = []\n    for i in range(1, len(powerLevels) - 1):\n        if powerLevels[i] > powerLevels[i-1] and powerLevels[i] > powerLevels[i+1]:\n            res.append(i)\n    return res",
      JAVA: "    static int[] solve(int[] powerLevels) {\n        java.util.List<Integer> list = new java.util.ArrayList<>();\n        for (int i = 1; i < powerLevels.length - 1; i++) {\n            if (powerLevels[i] > powerLevels[i-1] && powerLevels[i] > powerLevels[i+1]) {\n                list.add(i);\n            }\n        }\n        int[] res = new int[list.size()];\n        for (int i = 0; i < list.size(); i++) res[i] = list.get(i);\n        return res;\n    }",
      CPP: "vector<int> solve(vector<int> powerLevels) {\n    vector<int> res;\n    if (powerLevels.size() < 3) return res;\n    for (int i = 1; i < (int)powerLevels.size() - 1; i++) {\n        if (powerLevels[i] > powerLevels[i-1] && powerLevels[i] > powerLevels[i+1]) {\n            res.push_back(i);\n        }\n    }\n    return res;\n}",
      GO: "func solve(powerLevels []int) []int {\n    res := []int{}\n    n := len(powerLevels)\n    if n < 3 { return res }\n    for i := 1; i < n - 1; i++ {\n        if powerLevels[i] > powerLevels[i-1] && powerLevels[i] > powerLevels[i+1] {\n            res = append(res, i)\n        }\n    }\n    return res;\n}",
    },
    tests: [
      { stdin: "1 3 2 4 1", expectedStdout: "1 3", isSample: true },
      { stdin: "1 2 3 4 5", expectedStdout: "", isSample: true },
      { stdin: "10 5 10 5", expectedStdout: "2" },
      { stdin: "", expectedStdout: "" },
      { stdin: "5", expectedStdout: "" },
      { stdin: "5 5 5 5", expectedStdout: "" },
      { stdin: "-1 -3 -2 -5 -4", expectedStdout: "2" },
      { stdin: "10 20 30 20 10", expectedStdout: "2" },
    ],
  }),

  p({
    ...base,
    slug: "squad-member-counts",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Squad Member Counts",
    patternTags: ["array","hash-map","counting"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 300,
    promptMarkdown: "You are managing a specialized military operation. You are given a 0-indexed integer array `squadIds` of length `n`, where `squadIds[i]` represents the ID of the squad that the `i`-th soldier belongs to.\n\nReturn an integer array `counts` of length `n`, where `counts[i]` is the total number of soldiers that belong to the same squad as the `i`-th soldier.\n\n**Constraints**\n- `n == squadIds.length`\n- `0 <= n <= 100`\n- `-1000 <= squadIds[i] <= 1000`\n\n**Example 1**\n```\ninput:\n2 3 2 4 2\noutput: 3 1 3 1 3\n```\n*Explanation: Three soldiers belong to squad 2. One belongs to squad 3, and one belongs to squad 4.*\n\n**Example 2**\n```\ninput:\n1 1 1 1\noutput: 4 4 4 4\n```\n*Explanation: All four soldiers are in squad 1.*\n\n**Example 3**\n```\ninput:\n\noutput: \n```\n*Explanation: An empty sequence yields an empty result.*\n\n**Follow-up**\nCan you solve this with exactly two passes over the array in mathcal{O}(N) time?",
    editorialMarkdown: "## Squad Member Counts\nWe need to find out how many people belong to each squad, and then assign that count back to each soldier based on their squad ID. A hash map is the perfect structure here. First, iterate through the squad IDs and count the frequencies. Then, do a second pass through the array to populate the result array with the pre-calculated counts.\n\n**Trap**: Using a nested loop to repeatedly count members for each soldier leads to mathcal{O}(N^2) time, which can be easily avoided with a single hash map.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the number of soldiers, as we perform two linear passes.\n- **Space Complexity:** mathcal{O}(N) to store the frequencies in the hash map and the output array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(squadIds) {\n    let counts = {};\n    for (let id of squadIds) {\n        counts[id] = (counts[id] || 0) + 1;\n    }\n    let res = [];\n    for (let i = 0; i < squadIds.length; i++) {\n        res.push(counts[squadIds[i]]);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(squadIds: number[]): number[] {\n    let counts: {[key: number]: number} = {};\n    for (let id of squadIds) {\n        counts[id] = (counts[id] || 0) + 1;\n    }\n    let res: number[] = [];\n    for (let i = 0; i < squadIds.length; i++) {\n        res.push(counts[squadIds[i]]);\n    }\n    return res;\n}",
      PYTHON: "def solve(squadIds):\n    counts = {}\n    for sid in squadIds:\n        counts[sid] = counts.get(sid, 0) + 1\n    return [counts[sid] for sid in squadIds]",
      JAVA: "    static int[] solve(int[] squadIds) {\n        java.util.Map<Integer, Integer> counts = new java.util.HashMap<>();\n        for (int id : squadIds) {\n            counts.put(id, counts.getOrDefault(id, 0) + 1);\n        }\n        int[] res = new int[squadIds.length];\n        for (int i = 0; i < squadIds.length; i++) {\n            res[i] = counts.get(squadIds[i]);\n        }\n        return res;\n    }",
      CPP: "vector<int> solve(vector<int> squadIds) {\n    unordered_map<int, int> counts;\n    for (int id : squadIds) {\n        counts[id]++;\n    }\n    vector<int> res(squadIds.size());\n    for (int i = 0; i < squadIds.size(); i++) {\n        res[i] = counts[squadIds[i]];\n    }\n    return res;\n}",
      GO: "func solve(squadIds []int) []int {\n    counts := make(map[int]int)\n    for _, id := range squadIds {\n        counts[id]++\n    }\n    res := make([]int, len(squadIds))\n    for i, id := range squadIds {\n        res[i] = counts[id]\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "2 3 2 4 2", expectedStdout: "3 1 3 1 3", isSample: true },
      { stdin: "1 1 1 1", expectedStdout: "4 4 4 4", isSample: true },
      { stdin: "", expectedStdout: "" },
      { stdin: "5", expectedStdout: "1" },
      { stdin: "10 20 30", expectedStdout: "1 1 1" },
      { stdin: "0 0", expectedStdout: "2 2" },
      { stdin: "-1 -1 1 1", expectedStdout: "2 2 2 2" },
      { stdin: "100 200 100 200 100", expectedStdout: "3 2 3 2 3" },
    ],
  }),

  p({
    ...base,
    slug: "first-isolated-frequency",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "First Unique Packet",
    patternTags: ["hash-map","string","counting"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 300,
    promptMarkdown: "You are tasked with debugging a network message, given as a string `transmission`. Each lowercase letter represents a specific packet type.\n\nReturn the index (0-indexed) of the first packet type that is completely unique in the sequence. If no such packet exists, or if the string is empty, return `-1`.\n\n**Constraints**\n- `0 <= transmission.length <= 1000`\n- `transmission` consists of only lowercase English letters.\n\n**Example 1**\n```\ninput:\nabracadabra\noutput: 4\n```\n*Explanation: The packet types are 'a' (5 times), 'b' (2 times), 'r' (2 times), 'c' (1 time), 'd' (1 time). The first packet type to appear uniquely is 'c' at index 4.*\n\n**Example 2**\n```\ninput:\nxxyyzz\noutput: -1\n```\n*Explanation: All packet types appear at least twice.*\n\n**Example 3**\n```\ninput:\n\noutput: -1\n```\n*Explanation: The message is empty, so there are no unique packets.*\n\n**Follow-up**\nIs it possible to track the packet occurrences using a fixed-size integer array instead of a dynamic hash map?",
    editorialMarkdown: "## First Isolated Frequency\nTo find the first character that only appears once, we need to know the total occurrences of every character in the string. This implies a two-pass approach. In the first pass, we can use a hash map (or fixed-size array since characters are limited) to tally the frequencies. In the second pass, we check characters in their original order from left to right; the first one to have a count of 1 is the answer.\n\n**Trap**: Trying to solve this problem with only a single pass will not work reliably, because you cannot guarantee a character won't appear again later in the sequence.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N), where N is the length of the string, as we make two linear passes over it.\n- **Space Complexity:** mathcal{O}(1) or mathcal{O}(A), where A ≤ 26 is the number of lowercase English letters. The auxiliary array is bounded by 26.",
    referenceSolution: {
      JAVASCRIPT: "function solve(transmission) {\n    let counts = {};\n    for (let c of transmission) {\n        counts[c] = (counts[c] || 0) + 1;\n    }\n    for (let i = 0; i < transmission.length; i++) {\n        if (counts[transmission[i]] === 1) return i;\n    }\n    return -1;\n}",
      TYPESCRIPT: "function solve(transmission: string): number {\n    let counts: {[key: string]: number} = {};\n    for (let c of transmission) {\n        counts[c] = (counts[c] || 0) + 1;\n    }\n    for (let i = 0; i < transmission.length; i++) {\n        if (counts[transmission[i]] === 1) return i;\n    }\n    return -1;\n}",
      PYTHON: "def solve(transmission):\n    counts = {}\n    for c in transmission:\n        counts[c] = counts.get(c, 0) + 1\n    for i in range(len(transmission)):\n        if counts[transmission[i]] == 1:\n            return i\n    return -1",
      JAVA: "    static int solve(String transmission) {\n        java.util.Map<Character, Integer> counts = new java.util.HashMap<>();\n        for (char c : transmission.toCharArray()) {\n            counts.put(c, counts.getOrDefault(c, 0) + 1);\n        }\n        for (int i = 0; i < transmission.length(); i++) {\n            if (counts.get(transmission.charAt(i)) == 1) return i;\n        }\n        return -1;\n    }",
      CPP: "int solve(string transmission) {\n    unordered_map<char, int> counts;\n    for (char c : transmission) counts[c]++;\n    for (int i = 0; i < transmission.size(); i++) {\n        if (counts[transmission[i]] == 1) return i;\n    }\n    return -1;\n}",
      GO: "func solve(transmission string) int {\n    counts := make(map[rune]int)\n    for _, c := range transmission {\n        counts[c]++\n    }\n    for i, c := range transmission {\n        if counts[c] == 1 {\n            return i\n        }\n    }\n    return -1\n}",
    },
    tests: [
      { stdin: "abracadabra", expectedStdout: "4", isSample: true },
      { stdin: "xxyyzz", expectedStdout: "-1", isSample: true },
      { stdin: "", expectedStdout: "-1" },
      { stdin: "a", expectedStdout: "0" },
      { stdin: "zzyxx", expectedStdout: "2" },
      { stdin: "aabbcd", expectedStdout: "4" },
      { stdin: "abcdef", expectedStdout: "0" },
      { stdin: "xxyyzzz", expectedStdout: "-1" },
    ],
  }),

  p({
    ...base,
    slug: "first-duplicate-signal",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "First Returning Customer",
    patternTags: ["hash-set","string","counting"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 300,
    promptMarkdown: "You are monitoring a checkout line at a store. The sequence of customers is recorded as a string `stream`, where each lowercase English letter represents a distinct customer ID.\n\nFind and return the first customer ID that visits the checkout line for a second time. You can assume that at least one customer will appear more than once in the sequence.\n\n**Constraints**\n- `2 <= stream.length <= 100`\n- `stream` consists of lowercase English letters.\n- `stream` contains at least one character that appears twice.\n\n**Example 1**\n```\ninput:\nabcdba\noutput: b\n```\n*Explanation: Reading the sequence from left to right, 'a' appears at indices 0 and 5, while 'b' appears at indices 1 and 4. The customer 'b' returns before 'a' returns, making 'b' the first returning customer.*\n\n**Example 2**\n```\ninput:\nxxyy\noutput: x\n```\n*Explanation: Customer 'x' is recorded at index 0 and returns at index 1, making them the first to return.*\n\n**Example 3**\n```\ninput:\naa\noutput: a\n```\n*Explanation: The second visit of 'a' happens immediately after the first.*\n\n**Follow-up**\nCan you optimize the space complexity by using a single integer bitmask to keep track of the visited customers?",
    editorialMarkdown: "## First Duplicate Signal\nThe most efficient way to find the first duplicated character is to use a hash set to keep track of characters we have already seen. As we scan the string from left to right, we check if the current character is already in the set. The first character that satisfies this condition is our answer.\n\n**Trap**: Trying to find the first duplicate by scanning from left to right and looking ahead to the rest of the string runs in mathcal{O}(N^2) time and might find the wrong duplicate (you must find the first character *whose second appearance* happens earliest, not necessarily the character that appears earliest overall).\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N), where N is the length of the string. We iterate through the string at most once.\n- **Space Complexity:** mathcal{O}(1) or mathcal{O}(A), where A ≤ 26 is the number of lowercase English letters. The hash set holds at most 26 elements.",
    referenceSolution: {
      JAVASCRIPT: "function solve(stream) {\n    let seen = new Set();\n    for (let c of stream) {\n        if (seen.has(c)) return c;\n        seen.add(c);\n    }\n    return \"\";\n}",
      TYPESCRIPT: "function solve(stream: string): string {\n    let seen = new Set<string>();\n    for (let c of stream) {\n        if (seen.has(c)) return c;\n        seen.add(c);\n    }\n    return \"\";\n}",
      PYTHON: "def solve(stream):\n    seen = set()\n    for c in stream:\n        if c in seen:\n            return c\n        seen.add(c)\n    return \"\"",
      JAVA: "    static String solve(String stream) {\n        java.util.Set<Character> seen = new java.util.HashSet<>();\n        for (char c : stream.toCharArray()) {\n            if (seen.contains(c)) return String.valueOf(c);\n            seen.add(c);\n        }\n        return \"\";\n    }",
      CPP: "string solve(string stream) {\n    unordered_set<char> seen;\n    for (char c : stream) {\n        if (seen.count(c)) {\n            return string(1, c);\n        }\n        seen.insert(c);\n    }\n    return \"\";\n}",
      GO: "func solve(stream string) string {\n    seen := make([]bool, 256)\n    for i := 0; i < len(stream); i++ {\n        if seen[stream[i]] {\n            return string(stream[i])\n        }\n        seen[stream[i]] = true\n    }\n    return \"\"\n}",
    },
    tests: [
      { stdin: "abcdba", expectedStdout: "b", isSample: true },
      { stdin: "xxyy", expectedStdout: "x", isSample: true },
      { stdin: "aa", expectedStdout: "a" },
      { stdin: "abcdefgghij", expectedStdout: "g" },
      { stdin: "abab", expectedStdout: "a" },
      { stdin: "abcdd", expectedStdout: "d" },
      { stdin: "zzzz", expectedStdout: "z" },
      { stdin: "qwertyuiopq", expectedStdout: "q" },
    ],
  }),
];
