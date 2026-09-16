import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-046` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_046_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "terminal-facility",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Final Checkpoint",
    patternTags: ["array","hash-set","graphs"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing the flow of a delivery network represented by a 2D array `routes`, where `routes[i] = [start, end]` denotes a direct path from the `start` checkpoint to the `end` checkpoint. Each checkpoint is identified by a unique integer.\n\nThe network is configured so that there is exactly one \"final checkpoint\" from which no further paths originate. All other checkpoints have at least one departing path. Your task is to identify and return the integer ID of this final checkpoint.\n\n**Constraints**\n- `1 <= routes.length <= 100`\n- `routes[i].length == 2`\n- `1 <= routes[i][0], routes[i][1] <= 1000`\n- The paths form a valid network with exactly one final checkpoint.\n- No checkpoint has a path to itself.\n\n**Example 1**\n```\ninput:\n1 2;2 3\noutput: 3\n```\n*Explanation: The path goes from 1 to 2, and then 2 to 3. Checkpoint 3 has no departing paths.*\n\n**Example 2**\n```\ninput:\n5 1;3 5;4 3\noutput: 1\n```\n*Explanation: The flow is 4 -> 3 -> 5 -> 1. Checkpoint 1 is the final checkpoint.*\n\n**Example 3**\n```\ninput:\n10 20\noutput: 20\n```\n*Explanation: There is only one path, ending at checkpoint 20.*\n\n**Follow-up**\nCan you solve this with mathcal{O}(N) time complexity and mathcal{O}(N) space complexity?",
    editorialMarkdown: "## Terminal Facility\nWe can use a hash set to collect all facilities that are a source of at least one route. Once we have the set of all source facilities, we check each destination in the routes to find the one that does not exist in our source set.\n\n**Trap**: Make sure to only return the destination that has no outgoing route, rather than any destination that just doesn't appear as a source for the first few routes. Using a set makes this O(1) per check.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the number of routes. We iterate over the routes twice.\n- **Space Complexity:** mathcal{O}(N) to store the set of source facilities.",
    referenceSolution: {
      JAVASCRIPT: "function solve(routes) {\n    let sources = new Set();\n    for (let r of routes) {\n        sources.add(r[0]);\n    }\n    for (let r of routes) {\n        if (!sources.has(r[1])) {\n            return r[1];\n        }\n    }\n    return -1;\n}",
      TYPESCRIPT: "function solve(routes: number[][]): number {\n    let sources = new Set<number>();\n    for (let r of routes) {\n        sources.add(r[0]);\n    }\n    for (let r of routes) {\n        if (!sources.has(r[1])) {\n            return r[1];\n        }\n    }\n    return -1;\n}",
      PYTHON: "def solve(routes):\n    sources = set(r[0] for r in routes)\n    for r in routes:\n        if r[1] not in sources:\n            return r[1]\n    return -1",
      JAVA: "    static int solve(int[][] routes) {\n        java.util.HashSet<Integer> sources = new java.util.HashSet<>();\n        for (int[] r : routes) {\n            sources.add(r[0]);\n        }\n        for (int[] r : routes) {\n            if (!sources.contains(r[1])) {\n                return r[1];\n            }\n        }\n        return -1;\n    }",
      CPP: "#include <vector>\n#include <unordered_set>\nusing namespace std;\nint solve(vector<vector<int>> routes) {\n    unordered_set<int> sources;\n    for (const auto& r : routes) {\n        sources.insert(r[0]);\n    }\n    for (const auto& r : routes) {\n        if (sources.find(r[1]) == sources.end()) {\n            return r[1];\n        }\n    }\n    return -1;\n}",
      GO: "func solve(routes [][]int) int {\n    sources := make(map[int]bool)\n    for _, r := range routes {\n        sources[r[0]] = true\n    }\n    for _, r := range routes {\n        if !sources[r[1]] {\n            return r[1]\n        }\n    }\n    return -1\n}",
    },
    tests: [
      { stdin: "1 2;2 3", expectedStdout: "3", isSample: true },
      { stdin: "5 1;3 5;4 3", expectedStdout: "1", isSample: true },
      { stdin: "10 20", expectedStdout: "20" },
      { stdin: "2 3;3 4;4 5;5 6;1 2", expectedStdout: "6" },
      { stdin: "100 200;200 300;300 400;400 500", expectedStdout: "500" },
      { stdin: "1 5;2 5;3 5", expectedStdout: "5" },
      { stdin: "5 3;3 1;1 4;4 2", expectedStdout: "2" },
      { stdin: "10 15;15 20;20 25;25 30;30 35", expectedStdout: "35" },
    ],
  }),

  p({
    ...base,
    slug: "standardized-device-name",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Proper Naming Convention",
    patternTags: ["string","counting"],
    signatureId: "fn:string->bool",
    avgSolveSeconds: 300,
    promptMarkdown: "A software system requires product codes to adhere to a strict capitalization protocol to be considered valid. A product code string `name` is deemed valid if it meets any one of the following criteria:\n1. Every letter in the code is uppercase (e.g., \"SERVER\").\n2. Every letter in the code is lowercase (e.g., \"router\").\n3. Only the initial letter is uppercase, while all subsequent letters are lowercase (e.g., \"Gateway\").\n\nGiven a string `name` comprised exclusively of alphabetical characters, return `true` if it complies with the capitalization protocol, and `false` otherwise.\n\n**Constraints**\n- `1 <= name.length <= 100`\n- `name` consists only of uppercase and lowercase English letters.\n\n**Example 1**\n```\ninput:\nSERVER\noutput: true\n```\n*Explanation: Every letter is uppercase, fulfilling the first criterion.*\n\n**Example 2**\n```\ninput:\nGateway\noutput: true\n```\n*Explanation: The first letter is uppercase and the rest are lowercase, fulfilling the third criterion.*\n\n**Example 3**\n```\ninput:\nlApToP\noutput: false\n```\n*Explanation: The capitalization is inconsistent and does not fulfill any of the criteria.*\n\n**Follow-up**\nCan you do this in a single pass over the string?",
    editorialMarkdown: "## Standardized Device Name\nWe can verify the conditions by checking if the entire string is uppercase, if the entire string is lowercase, or if only the first character is uppercase and the rest is lowercase.\n\n**Trap**: Make sure to check bounds or edge cases if the string has only one character, as it will always be valid regardless of casing.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the string.\n- **Space Complexity:** mathcal{O}(1) for most languages (or mathcal{O}(N) if slices are created).",
    referenceSolution: {
      JAVASCRIPT: "function solve(name) {\n    if (name.length <= 1) return true;\n    if (name === name.toUpperCase()) return true;\n    if (name === name.toLowerCase()) return true;\n    let first = name.charAt(0);\n    let rest = name.slice(1);\n    if (first === first.toUpperCase() && rest === rest.toLowerCase()) return true;\n    return false;\n}",
      TYPESCRIPT: "function solve(name: string): boolean {\n    if (name.length <= 1) return true;\n    if (name === name.toUpperCase()) return true;\n    if (name === name.toLowerCase()) return true;\n    let first = name.charAt(0);\n    let rest = name.slice(1);\n    if (first === first.toUpperCase() && rest === rest.toLowerCase()) return true;\n    return false;\n}",
      PYTHON: "def solve(name):\n    if len(name) <= 1: return True\n    if name.isupper(): return True\n    if name.islower(): return True\n    return name[0].isupper() and name[1:].islower()",
      JAVA: "    static boolean solve(String name) {\n        if (name.length() <= 1) return true;\n        boolean allUpper = true;\n        boolean allLower = true;\n        boolean firstUpperRestLower = Character.isUpperCase(name.charAt(0));\n        for (int i = 0; i < name.length(); i++) {\n            char c = name.charAt(i);\n            if (!Character.isUpperCase(c)) allUpper = false;\n            if (!Character.isLowerCase(c)) allLower = false;\n            if (i > 0 && !Character.isLowerCase(c)) firstUpperRestLower = false;\n        }\n        return allUpper || allLower || firstUpperRestLower;\n    }",
      CPP: "#include <string>\n#include <cctype>\nusing namespace std;\nbool solve(string name) {\n    if (name.length() <= 1) return true;\n    bool allUpper = true;\n    bool allLower = true;\n    bool firstUpperRestLower = isupper(name[0]);\n    for (int i = 0; i < name.length(); i++) {\n        if (!isupper(name[i])) allUpper = false;\n        if (!islower(name[i])) allLower = false;\n        if (i > 0 && !islower(name[i])) firstUpperRestLower = false;\n    }\n    return allUpper || allLower || firstUpperRestLower;\n}",
      GO: "func solve(name string) bool {\n    if len(name) <= 1 {\n        return true\n    }\n    allUpper := true\n    allLower := true\n    firstUpperRestLower := name[0] >= 'A' && name[0] <= 'Z'\n    for i := 0; i < len(name); i++ {\n        c := name[i]\n        isUpper := c >= 'A' && c <= 'Z'\n        isLower := c >= 'a' && c <= 'z'\n        if !isUpper {\n            allUpper = false\n        }\n        if !isLower {\n            allLower = false\n        }\n        if i > 0 && !isLower {\n            firstUpperRestLower = false\n        }\n    }\n    return allUpper || allLower || firstUpperRestLower\n}",
    },
    tests: [
      { stdin: "SERVER", expectedStdout: "true", isSample: true },
      { stdin: "Gateway", expectedStdout: "true", isSample: true },
      { stdin: "lApToP", expectedStdout: "false" },
      { stdin: "router", expectedStdout: "true" },
      { stdin: "A", expectedStdout: "true" },
      { stdin: "a", expectedStdout: "true" },
      { stdin: "Switch", expectedStdout: "true" },
      { stdin: "mODEM", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "tripled-data-sequence",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "SLIDING_WINDOW",
    title: "Consecutive Data Chunks",
    patternTags: ["array","sliding-window"],
    signatureId: "fn:ints,int->bool",
    avgSolveSeconds: 400,
    promptMarkdown: "During a geological survey, sensors record an array of integer values called `data`. Researchers want to identify whether a specific sequence of readings of length `m` occurs repeatedly in a consecutive sequence at least 3 times.\n\nGiven the array of integers `data` and the integer `m`, return `true` if there is a contiguous subarray of length `m` that repeats at least 3 times in a row. If no such repeating sequence exists, return `false`.\n\n**Constraints**\n- `1 <= data.length <= 100`\n- `1 <= data[i] <= 100`\n- `1 <= m <= 100`\n\n**Example 1**\n```\ninput:\n1 2 1 2 1 2 3\n2\noutput: true\n```\n*Explanation: A sequence of `[1, 2]` with a length of 2 appears 3 times in a row at the start of the recordings.*\n\n**Example 2**\n```\ninput:\n1 2 3 1 2 3 1 2 3\n3\noutput: true\n```\n*Explanation: The contiguous sequence `[1, 2, 3]` repeats 3 times back-to-back.*\n\n**Example 3**\n```\ninput:\n1 2 1 2 1 3\n2\noutput: false\n```\n*Explanation: The sequence `[1, 2]` only repeats twice consecutively before the sequence is broken by `1, 3`.*\n\n**Follow-up**\nCan you do this in mathcal{O}(N) time and mathcal{O}(1) space?",
    editorialMarkdown: "## Tripled Data Sequence\nWe can check if a pattern repeats by seeing if an element at index `i` is identical to the element at `i + m`. If we can find `2 * m` consecutive successful matches of this condition, it implies the sequence repeats exactly three times in total.\n\n**Trap**: Make sure to reset the contiguous counter to zero as soon as `data[i] != data[i + m]`.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) since we scan the array once.\n- **Space Complexity:** mathcal{O}(1) as we only maintain a counter variable.",
    referenceSolution: {
      JAVASCRIPT: "function solve(data, m) {\n    let count = 0;\n    for (let i = 0; i < data.length - m; i++) {\n        if (data[i] === data[i + m]) {\n            count++;\n            if (count === 2 * m) return true;\n        } else {\n            count = 0;\n        }\n    }\n    return false;\n}",
      TYPESCRIPT: "function solve(data: number[], m: number): boolean {\n    let count = 0;\n    for (let i = 0; i < data.length - m; i++) {\n        if (data[i] === data[i + m]) {\n            count++;\n            if (count === 2 * m) return true;\n        } else {\n            count = 0;\n        }\n    }\n    return false;\n}",
      PYTHON: "def solve(data, m):\n    count = 0\n    for i in range(len(data) - m):\n        if data[i] == data[i + m]:\n            count += 1\n            if count == 2 * m:\n                return True\n        else:\n            count = 0\n    return False",
      JAVA: "    static boolean solve(int[] data, int m) {\n        int count = 0;\n        for (int i = 0; i < data.length - m; i++) {\n            if (data[i] == data[i + m]) {\n                count++;\n                if (count == 2 * m) return true;\n            } else {\n                count = 0;\n            }\n        }\n        return false;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nbool solve(vector<int> data, int m) {\n    int count = 0;\n    for (int i = 0; i < (int)data.size() - m; i++) {\n        if (data[i] == data[i + m]) {\n            count++;\n            if (count == 2 * m) return true;\n        } else {\n            count = 0;\n        }\n    }\n    return false;\n}",
      GO: "func solve(data []int, m int) bool {\n    count := 0\n    for i := 0; i < len(data) - m; i++ {\n        if data[i] == data[i + m] {\n            count++\n            if count == 2 * m {\n                return true\n            }\n        } else {\n            count = 0\n        }\n    }\n    return false\n}",
    },
    tests: [
      { stdin: "1 2 1 2 1 2 3\n2", expectedStdout: "true", isSample: true },
      { stdin: "1 2 3 1 2 3 1 2 3\n3", expectedStdout: "true", isSample: true },
      { stdin: "1 2 1 2 1 3\n2", expectedStdout: "false" },
      { stdin: "5 5 5\n1", expectedStdout: "true" },
      { stdin: "5 5\n1", expectedStdout: "false" },
      { stdin: "4 4 4 4\n1", expectedStdout: "true" },
      { stdin: "1 2 3 4\n2", expectedStdout: "false" },
      { stdin: "9 8 9 8 9 8 9 8\n2", expectedStdout: "true" },
    ],
  }),

  p({
    ...base,
    slug: "grid-sector-type",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Grid Sector Type",
    patternTags: ["math","string"],
    signatureId: "fn:string->bool",
    avgSolveSeconds: 300,
    promptMarkdown: "You are navigating a robotic drone on an 8x8 grid. The columns are labeled from `'a'` to `'h'` and the rows are labeled from `'1'` to `'8'`. The grid sectors are classified into two types: \"safe\" and \"hazardous\", in a strictly alternating checkerboard pattern.\n\nSector `\"a1\"` is a hazardous sector (returns `false`). Adjacent sectors (sharing an edge) always have different types.\n\nGiven a string `sector` representing the coordinates (e.g., `\"c4\"`), return `true` if the sector is safe, or `false` if it is hazardous.\n\n**Constraints**\n- `sector.length == 2`\n- `sector[0]` is a lowercase English letter from `'a'` to `'h'`.\n- `sector[1]` is a digit from `'1'` to `'8'`.\n\n**Example 1**\n```\ninput:\na1\noutput: false\n```\n*Explanation: The sector \"a1\" is hazardous.*\n\n**Example 2**\n```\ninput:\nb1\noutput: true\n```\n*Explanation: The sector \"b1\" is adjacent to \"a1\", so its type alternates and is safe.*\n\n**Example 3**\n```\ninput:\nc3\noutput: false\n```\n*Explanation: By continuing the alternating pattern, \"c3\" is hazardous.*\n\n**Follow-up**\nCan you do this using a single line of mathematical operations?",
    editorialMarkdown: "## Grid Sector Type\nBy converting the column letter (e.g. `'a'` to `0`) and row number (e.g. `'1'` to `0`) to 0-indexed integers, you can sum them together. The sector type strictly alternates based on parity.\n\n**Trap**: Be careful with 1-based indexing for rows. `'1'` subtract `'1'` yields `0`.\n \n**Complexity:**\n- **Time Complexity:** mathcal{O}(1) as the coordinate lengths are constant.\n- **Space Complexity:** mathcal{O}(1).",
    referenceSolution: {
      JAVASCRIPT: "function solve(sector) {\n    let c = sector.charCodeAt(0) - 97; // 'a'\n    let r = sector.charCodeAt(1) - 49; // '1'\n    return (c + r) % 2 !== 0;\n}",
      TYPESCRIPT: "function solve(sector: string): boolean {\n    let c = sector.charCodeAt(0) - 97;\n    let r = sector.charCodeAt(1) - 49;\n    return (c + r) % 2 !== 0;\n}",
      PYTHON: "def solve(sector):\n    c = ord(sector[0]) - ord('a')\n    r = int(sector[1]) - 1\n    return (c + r) % 2 != 0",
      JAVA: "    static boolean solve(String sector) {\n        int c = sector.charAt(0) - 'a';\n        int r = sector.charAt(1) - '1';\n        return (c + r) % 2 != 0;\n    }",
      CPP: "#include <string>\nusing namespace std;\nbool solve(string sector) {\n    int c = sector[0] - 'a';\n    int r = sector[1] - '1';\n    return (c + r) % 2 != 0;\n}",
      GO: "func solve(sector string) bool {\n    c := int(sector[0] - 'a')\n    r := int(sector[1] - '1')\n    return (c + r) % 2 != 0\n}",
    },
    tests: [
      { stdin: "a1", expectedStdout: "false", isSample: true },
      { stdin: "b1", expectedStdout: "true", isSample: true },
      { stdin: "c3", expectedStdout: "false", isSample: true },
      { stdin: "h8", expectedStdout: "false" },
      { stdin: "a2", expectedStdout: "true" },
      { stdin: "h7", expectedStdout: "true" },
      { stdin: "d4", expectedStdout: "false" },
      { stdin: "e5", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "balanced-power-symbols",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Symmetrical Word Values",
    patternTags: ["string","counting"],
    signatureId: "fn:string->bool",
    avgSolveSeconds: 300,
    promptMarkdown: "In a linguistic puzzle game, players are given a string `s` of even length. A string is considered a \"balanced word\" if its first half and second half contain an identical count of vowel characters.\n\nFor this game, vowels are defined strictly as `'a'`, `'e'`, `'i'`, `'o'`, and `'u'`, including both their uppercase and lowercase variants. All other alphabetical characters are treated as consonants.\n\nGiven an even-length string `s`, determine if it is a balanced word. Return `true` if the vowel counts match between the two halves, and `false` otherwise.\n\n**Constraints**\n- `2 <= s.length <= 100`\n- `s.length` is even.\n- `s` consists of uppercase and lowercase English letters.\n\n**Example 1**\n```\ninput:\nboOk\noutput: true\n```\n*Explanation: The first half \"bo\" contains 1 vowel, and the second half \"Ok\" contains 1 vowel. The counts are identical.*\n\n**Example 2**\n```\ninput:\nTextbook\noutput: false\n```\n*Explanation: The first half \"Text\" contains 1 vowel, while the second half \"book\" contains 2 vowels. They do not match.*\n\n**Example 3**\n```\ninput:\nAbCdEfGh\noutput: true\n```\n*Explanation: The first half \"AbCd\" contains 1 vowel ('A'), and the second half \"EfGh\" contains 1 vowel ('E').*\n\n**Follow-up**\nCan you do this in mathcal{O}(N) time?",
    editorialMarkdown: "## Balanced Power Symbols\nSplit the string conceptually in half and iterate through both substrings simultaneously or sequentially. For each character, check if it's a vowel (case insensitive). Maintain two counters and check equality at the end.\n\n**Trap**: Make sure to check for both upper and lowercase vowels!\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) since we iterate through the entire string once.\n- **Space Complexity:** mathcal{O}(1) space if we don't slice out copies of the string.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U']);\n    let n = s.length;\n    let leftCount = 0;\n    let rightCount = 0;\n    for (let i = 0; i < n / 2; i++) {\n        if (vowels.has(s[i])) leftCount++;\n        if (vowels.has(s[i + n / 2])) rightCount++;\n    }\n    return leftCount === rightCount;\n}",
      TYPESCRIPT: "function solve(s: string): boolean {\n    const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U']);\n    let n = s.length;\n    let leftCount = 0;\n    let rightCount = 0;\n    for (let i = 0; i < n / 2; i++) {\n        if (vowels.has(s[i])) leftCount++;\n        if (vowels.has(s[i + n / 2])) rightCount++;\n    }\n    return leftCount === rightCount;\n}",
      PYTHON: "def solve(s):\n    vowels = set('aeiouAEIOU')\n    n = len(s)\n    left_count = sum(1 for c in s[:n//2] if c in vowels)\n    right_count = sum(1 for c in s[n//2:] if c in vowels)\n    return left_count == right_count",
      JAVA: "    static boolean solve(String s) {\n        String vowels = \"aeiouAEIOU\";\n        int n = s.length();\n        int leftCount = 0;\n        int rightCount = 0;\n        for (int i = 0; i < n / 2; i++) {\n            if (vowels.indexOf(s.charAt(i)) != -1) leftCount++;\n            if (vowels.indexOf(s.charAt(i + n / 2)) != -1) rightCount++;\n        }\n        return leftCount == rightCount;\n    }",
      CPP: "#include <string>\nusing namespace std;\nbool solve(string s) {\n    string vowels = \"aeiouAEIOU\";\n    int n = s.length();\n    int leftCount = 0;\n    int rightCount = 0;\n    for (int i = 0; i < n / 2; i++) {\n        if (vowels.find(s[i]) != string::npos) leftCount++;\n        if (vowels.find(s[i + n / 2]) != string::npos) rightCount++;\n    }\n    return leftCount == rightCount;\n}",
      GO: "func solve(s string) bool {\n    vowels := \"aeiouAEIOU\"\n    n := len(s)\n    leftCount := 0\n    rightCount := 0\n    for i := 0; i < n / 2; i++ {\n        if strings.ContainsRune(vowels, rune(s[i])) {\n            leftCount++\n        }\n        if strings.ContainsRune(vowels, rune(s[i + n / 2])) {\n            rightCount++\n        }\n    }\n    return leftCount == rightCount\n}",
    },
    tests: [
      { stdin: "boOk", expectedStdout: "true", isSample: true },
      { stdin: "Textbook", expectedStdout: "false", isSample: true },
      { stdin: "AbCdEfGh", expectedStdout: "true", isSample: true },
      { stdin: "aA", expectedStdout: "true" },
      { stdin: "xyzABC", expectedStdout: "false" },
      { stdin: "aeiouAEIOU", expectedStdout: "true" },
      { stdin: "UoIeAaEiOu", expectedStdout: "true" },
      { stdin: "bcdfghjklm", expectedStdout: "true" },
    ],
  }),
];
