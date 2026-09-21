import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w2-062` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W2_062_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "max-packet-nesting",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "STACK",
    title: "Deepest Container",
    patternTags: ["strings","counting","stack"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are inspecting a sequence of shipments where items are placed inside nested containers. The start of a container is denoted by an open bracket `'['` and the end by a closed bracket `']'`. Any other characters represent the items themselves.\n\nGiven a string `s` that logs the container structure, find the maximum number of containers nested within each other. The log will always have properly matched and ordered brackets.\n\n**Constraints**\n- `0 <= s.length <= 100`\n- `s` consists of lowercase English letters, numbers, spaces, and the characters `'['` and `']'`.\n- It is guaranteed that the brackets in `s` are properly balanced.\n\n**Example 1**\n```\ninput:\n[data[inner]]\noutput:\n2\n```\n*Explanation: The deepest item is nested inside two containers.*\n\n**Example 2**\n```\ninput:\n[a] [b]\noutput:\n1\n```\n*Explanation: There are two containers, but neither is placed inside the other, so the maximum nesting level is 1.*\n\n**Example 3**\n```\ninput:\nrawdata\noutput:\n0\n```\n*Explanation: There are no containers present, meaning the depth is 0.*\n\n**Follow-up**\nCan you calculate this in one pass with O(1) memory?",
    editorialMarkdown: "## Max Packet Nesting\n\nThis problem asks us to find the maximum depth of nested square brackets in a string. The string is guaranteed to have valid, properly closed brackets.\n\nWe can iterate through the string character by character while maintaining a `current_depth` counter. Whenever we encounter an opening bracket `[`, we increment the `current_depth` counter and update our `max_depth` answer if the new depth is greater. When we see a closing bracket `]`, we decrement the `current_depth` counter. Other characters are ignored.\n\n**Trap**: Make sure you only increment or decrement for the target brackets `[` and `]`, ignoring everything else, and remember to check for the maximum immediately after incrementing, not after decrementing.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string, as we do a single pass over the string.\n- **Space:** O(1) since we only use two integers to track state.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    let maxDepth = 0;\n    let curr = 0;\n    for (let c of s) {\n        if (c === '[') {\n            curr++;\n            maxDepth = Math.max(maxDepth, curr);\n        } else if (c === ']') {\n            curr--;\n        }\n    }\n    return maxDepth;\n}",
      TYPESCRIPT: "function solve(s: string): number {\n    let maxDepth = 0;\n    let curr = 0;\n    for (let c of s) {\n        if (c === '[') {\n            curr++;\n            maxDepth = Math.max(maxDepth, curr);\n        } else if (c === ']') {\n            curr--;\n        }\n    }\n    return maxDepth;\n}",
      PYTHON: "def solve(s):\n    max_depth = 0\n    curr = 0\n    for c in s:\n        if c == '[':\n            curr += 1\n            if curr > max_depth:\n                max_depth = curr\n        elif c == ']':\n            curr -= 1\n    return max_depth",
      JAVA: "    static int solve(String s) {\n        int maxDepth = 0;\n        int curr = 0;\n        for (char c : s.toCharArray()) {\n            if (c == '[') {\n                curr++;\n                maxDepth = Math.max(maxDepth, curr);\n            } else if (c == ']') {\n                curr--;\n            }\n        }\n        return maxDepth;\n    }",
      CPP: "#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(string s) {\n    int max_depth = 0;\n    int curr = 0;\n    for (char c : s) {\n        if (c == '[') {\n            curr++;\n            max_depth = max(max_depth, curr);\n        } else if (c == ']') {\n            curr--;\n        }\n    }\n    return max_depth;\n}",
      GO: "func solve(s string) int {\n    max_depth := 0\n    curr := 0\n    for i := 0; i < len(s); i++ {\n        if s[i] == '[' {\n            curr++\n            if curr > max_depth {\n                max_depth = curr\n            }\n        } else if s[i] == ']' {\n            curr--\n        }\n    }\n    return max_depth\n}",
    },
    tests: [
      { stdin: "[data[inner]]", expectedStdout: "2", isSample: true },
      { stdin: "[a] [b]", expectedStdout: "1", isSample: true },
      { stdin: "rawdata", expectedStdout: "0", isSample: true },
      { stdin: "[[[]]]", expectedStdout: "3" },
      { stdin: "[]", expectedStdout: "1" },
      { stdin: "", expectedStdout: "0" },
      { stdin: "a[b[c[d[e]f]g]h]i", expectedStdout: "4" },
      { stdin: "[12] [3[45]6]", expectedStdout: "2" },
    ],
  }),

  p({
    ...base,
    slug: "satellite-signal-difference",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Satellite Signal Difference",
    patternTags: ["hash-map","counting","strings"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 700,
    promptMarkdown: "You are analyzing a sequence of intercepted satellite signals, represented as a string `s` of lowercase English letters.\n\nYour objective is to find the maximum possible difference between the frequency of a character that appears an **odd** number of times and the frequency of a character that appears an **even** number of times (greater than zero) in the string.\n\nSpecifically, if `max_odd` is the maximum frequency among all characters appearing an odd number of times, and `min_even` is the minimum frequency among all characters appearing an even number of times, you must return `max_odd - min_even`.\n\n**Constraints**\n- `1 <= s.length <= 1000`\n- `s` consists only of lowercase English letters.\n- The string `s` will always contain at least one character with an odd frequency and at least one character with an even frequency.\n\n**Example 1**\n```\ninput:\naaabbcc\noutput:\n1\n```\n*Explanation: 'a' appears 3 times (odd). 'b' appears 2 times (even) and 'c' appears 2 times (even). The difference is 3 - 2 = 1.*\n\n**Example 2**\n```\ninput:\nxyyzzzz\noutput:\n-1\n```\n*Explanation: 'x' appears 1 time (odd). 'y' appears 2 times (even) and 'z' appears 4 times (even). The min even frequency is 2. The difference is 1 - 2 = -1.*\n\n**Example 3**\n```\ninput:\nabb\noutput:\n-1\n```\n*Explanation: 'a' appears 1 time, 'b' appears 2 times. 1 - 2 = -1.*\n\n**Follow-up**\nCan you implement this using a single frequency array of size 26 rather than a generic hash map?",
    editorialMarkdown: "## Satellite Signal Difference\n\nTo solve this, we must determine the difference between the maximum frequency of any character that appears an odd number of times, and the minimum frequency of any character that appears an even number of times.\n\nFirst, we count the frequency of each character in the string using a hash map or a frequency array. Next, we iterate through the frequencies. If a frequency is odd, we update our maximum odd frequency. If a frequency is even, we update our minimum even frequency. Finally, we return the difference between the two.\n\n**Trap**: Make sure you only consider even frequencies that are strictly greater than 0. Characters that do not appear in the string have a frequency of 0, which is technically even, but they are not present in the string and should not be considered for the minimum even frequency.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string, since we make a single pass to count characters and another pass over the fixed alphabet (or hash map).\n- **Space:** O(1) assuming the character set is bounded (e.g., lowercase English letters), as the frequency map will have at most 26 entries.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    const counts = {};\n    for (let c of s) {\n        counts[c] = (counts[c] || 0) + 1;\n    }\n    let maxOdd = -Infinity;\n    let minEven = Infinity;\n    for (let count of Object.values(counts)) {\n        if (count % 2 === 1) {\n            maxOdd = Math.max(maxOdd, count);\n        } else {\n            minEven = Math.min(minEven, count);\n        }\n    }\n    return maxOdd - minEven;\n}",
      TYPESCRIPT: "function solve(s: string): number {\n    const counts: Record<string, number> = {};\n    for (const c of s) {\n        counts[c] = (counts[c] || 0) + 1;\n    }\n    let maxOdd = -Infinity;\n    let minEven = Infinity;\n    for (const count of Object.values(counts)) {\n        if (count % 2 === 1) {\n            maxOdd = Math.max(maxOdd, count);\n        } else {\n            minEven = Math.min(minEven, count);\n        }\n    }\n    return maxOdd - minEven;\n}",
      PYTHON: "def solve(s):\n    counts = {}\n    for c in s:\n        counts[c] = counts.get(c, 0) + 1\n    max_odd = -float('inf')\n    min_even = float('inf')\n    for count in counts.values():\n        if count % 2 == 1:\n            max_odd = max(max_odd, count)\n        else:\n            min_even = min(min_even, count)\n    return max_odd - min_even",
      JAVA: "    static int solve(String s) {\n        int[] counts = new int[26];\n        for (char c : s.toCharArray()) {\n            counts[c - 'a']++;\n        }\n        int maxOdd = -100000;\n        int minEven = 100000;\n        for (int count : counts) {\n            if (count > 0) {\n                if (count % 2 == 1) {\n                    maxOdd = Math.max(maxOdd, count);\n                } else {\n                    minEven = Math.min(minEven, count);\n                }\n            }\n        }\n        return maxOdd - minEven;\n    }",
      CPP: "#include <string>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(string s) {\n    vector<int> counts(26, 0);\n    for (char c : s) {\n        counts[c - 'a']++;\n    }\n    int max_odd = -100000;\n    int min_even = 100000;\n    for (int count : counts) {\n        if (count > 0) {\n            if (count % 2 == 1) {\n                max_odd = max(max_odd, count);\n            } else {\n                min_even = min(min_even, count);\n            }\n        }\n    }\n    return max_odd - min_even;\n}",
      GO: "func solve(s string) int {\n    counts := make([]int, 26)\n    for i := 0; i < len(s); i++ {\n        counts[s[i] - 'a']++\n    }\n    max_odd := -100000\n    min_even := 100000\n    for _, count := range counts {\n        if count > 0 {\n            if count % 2 == 1 {\n                if count > max_odd {\n                    max_odd = count\n                }\n            } else {\n                if count < min_even {\n                    min_even = count\n                }\n            }\n        }\n    }\n    return max_odd - min_even\n}",
    },
    tests: [
      { stdin: "aaabbcc", expectedStdout: "1", isSample: true },
      { stdin: "xyyzzzz", expectedStdout: "-1", isSample: true },
      { stdin: "abb", expectedStdout: "-1" },
      { stdin: "aaaaaaabbbbbbcc", expectedStdout: "5" },
      { stdin: "abcdddd", expectedStdout: "-3" },
      { stdin: "azzzz", expectedStdout: "-3" },
      { stdin: "aabbc", expectedStdout: "-1" },
      { stdin: "abababa", expectedStdout: "-1" },
    ],
  }),

  p({
    ...base,
    slug: "maximum-potions-brewed",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Spelling POTION",
    patternTags: ["hash-map","counting","strings"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 700,
    promptMarkdown: "You are organizing a puzzle event where participants need to form the word `\"POTION\"` using letter tiles. You are given a string `s` containing a random assortment of uppercase letter tiles.\n\nYour goal is to determine the maximum number of times you can spell the word `\"POTION\"`. Each full spelling requires one `'P'`, two `'O'`s, one `'T'`, one `'I'`, and one `'N'`. Each tile from the string `s` can only be used once.\n\nReturn the maximum number of complete `\"POTION\"` words you can assemble.\n\n**Constraints**\n- `1 <= s.length <= 10^4`\n- `s` consists of uppercase English letters only.\n\n**Example 1**\n```\ninput:\nPOTION\noutput:\n1\n```\n*Explanation: You have exactly the right tiles to form the word once.*\n\n**Example 2**\n```\ninput:\nNOOTIPPIOTNO\noutput:\n2\n```\n*Explanation: You can spell the word twice. Note that 4 'O' tiles are required in total.*\n\n**Example 3**\n```\ninput:\nPOTIN\noutput:\n0\n```\n*Explanation: You lack a second 'O' tile, making it impossible to complete even one word.*\n\n**Follow-up**\nCan you scale this logic dynamically if the target word changes to something else, without hardcoding character counts?",
    editorialMarkdown: "## Maximum Potions Brewed\n\nTo find how many times we can form the word \\\"POTION\\\", we need to count the frequency of each available ingredient character in the input string.\n\nThe target word \\\"POTION\\\" is made up of the characters: 'P' (1), 'O' (2), 'T' (1), 'I' (1), and 'N' (1). Since 'O' appears twice in the target word, we must divide the available 'O' count by 2.\n\nThe maximum number of complete words we can form is simply the minimum count among the required characters: `min(count(P), count(O)/2, count(T), count(I), count(N))`.\n\n**Trap**: The most common mistake is forgetting to integer-divide the 'O' count by 2, as it takes two 'O's to make one potion.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string, since we make a single pass to count characters.\n- **Space:** O(1) because we only keep track of the frequencies of the 26 lowercase English letters (or just 5 specific letters).",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    const counts = {};\n    for (let c of s) {\n        counts[c] = (counts[c] || 0) + 1;\n    }\n    return Math.min(\n        counts['P'] || 0,\n        Math.floor((counts['O'] || 0) / 2),\n        counts['T'] || 0,\n        counts['I'] || 0,\n        counts['N'] || 0\n    );\n}",
      TYPESCRIPT: "function solve(s: string): number {\n    const counts: Record<string, number> = {};\n    for (const c of s) {\n        counts[c] = (counts[c] || 0) + 1;\n    }\n    return Math.min(\n        counts['P'] || 0,\n        Math.floor((counts['O'] || 0) / 2),\n        counts['T'] || 0,\n        counts['I'] || 0,\n        counts['N'] || 0\n    );\n}",
      PYTHON: "def solve(s):\n    counts = {}\n    for c in s:\n        counts[c] = counts.get(c, 0) + 1\n    return min(\n        counts.get('P', 0),\n        counts.get('O', 0) // 2,\n        counts.get('T', 0),\n        counts.get('I', 0),\n        counts.get('N', 0)\n    )",
      JAVA: "    static int solve(String s) {\n        int[] counts = new int[26];\n        for (char c : s.toCharArray()) {\n            counts[c - 'A']++;\n        }\n        int minPotions = counts['P' - 'A'];\n        minPotions = Math.min(minPotions, counts['O' - 'A'] / 2);\n        minPotions = Math.min(minPotions, counts['T' - 'A']);\n        minPotions = Math.min(minPotions, counts['I' - 'A']);\n        minPotions = Math.min(minPotions, counts['N' - 'A']);\n        return minPotions;\n    }",
      CPP: "#include <string>\n#include <unordered_map>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(string s) {\n    unordered_map<char, int> counts;\n    for (char c : s) {\n        counts[c]++;\n    }\n    int min_potions = counts['P'];\n    min_potions = min(min_potions, counts['O'] / 2);\n    min_potions = min(min_potions, counts['T']);\n    min_potions = min(min_potions, counts['I']);\n    min_potions = min(min_potions, counts['N']);\n    return min_potions;\n}",
      GO: "func solve(s string) int {\n    counts := make(map[byte]int)\n    for i := 0; i < len(s); i++ {\n        counts[s[i]]++\n    }\n    min_potions := counts['P']\n    if counts['O'] / 2 < min_potions { min_potions = counts['O'] / 2 }\n    if counts['T'] < min_potions { min_potions = counts['T'] }\n    if counts['I'] < min_potions { min_potions = counts['I'] }\n    if counts['N'] < min_potions { min_potions = counts['N'] }\n    return min_potions\n}",
    },
    tests: [
      { stdin: "POTION", expectedStdout: "1", isSample: true },
      { stdin: "NOOTIPPIOTNO", expectedStdout: "2", isSample: true },
      { stdin: "POTIN", expectedStdout: "0", isSample: true },
      { stdin: "ABC", expectedStdout: "0" },
      { stdin: "PPOOTTIIOONN", expectedStdout: "2" },
      { stdin: "PPPPPPOOOOOTTTTTIIIIINNNNN", expectedStdout: "2" },
      { stdin: "POOOOTIIN", expectedStdout: "1" },
      { stdin: "PPOOTTIIOON", expectedStdout: "1" },
    ],
  }),
];
