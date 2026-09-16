import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-017` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_017_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "balanced-cargo-weights",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Probe Data Integrity",
    patternTags: ["string","math","parity"],
    signatureId: "fn:string->bool",
    avgSolveSeconds: 300,
    promptMarkdown: "You are analyzing transmission logs from a deep-space probe. Each transmission is represented by a string of digits `s`. To verify data integrity, the probe's protocol requires that the sum of the digits received at even positions (0-indexed) must exactly match the sum of the digits received at odd positions.\n\nGiven the string `s`, return `true` if the transmission passes this integrity check, and `false` otherwise.\n\n**Constraints**\n- `2 <= s.length <= 100`\n- `s` consists only of digits from '0' to '9'.\n\n**Example 1**\n```\ninput:\n1232\noutput: true\n```\nExplanation: The digits at even indices are 1 and 3, which sum to 4. The digits at odd indices are 2 and 2, summing to 4. The integrity check passes.\n\n**Example 2**\n```\ninput:\n24123\noutput: true\n```\nExplanation: The even indices have 2, 1, and 3, summing to 6. The odd indices have 4 and 2, summing to 6. The integrity check passes.\n\n**Example 3**\n```\ninput:\n1234\noutput: false\n```\nExplanation: The even index digits sum to 1 + 3 = 4. The odd index digits sum to 2 + 4 = 6. The sums differ, so the integrity check fails.\n\n**Follow-up:** Can you solve this in one pass without extra space?",
    editorialMarkdown: "## Parity Accumulator\n\nTo check if the weights are balanced, we need to compare the sum of the digits at the even indices with the sum of the digits at the odd indices.\n\nWe can iterate through the string characters, convert each character to its integer value, and add it to either an `even_sum` or `odd_sum` accumulator based on whether the current index modulo 2 is 0 or 1.\n\nAfter iterating through the entire string, we return true if the two sums are equal, and false otherwise. The time complexity is O(N) where N is the length of the string, and the space complexity is O(1).\n\nThe main trap solvers hit is converting the character's ASCII value rather than its actual integer digit value (e.g., subtracting '0' in C++).",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    let even_sum = 0;\n    let odd_sum = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (i % 2 === 0) {\n            even_sum += parseInt(s[i]);\n        } else {\n            odd_sum += parseInt(s[i]);\n        }\n    }\n    return even_sum === odd_sum;\n}",
      TYPESCRIPT: "function solve(s: string): boolean {\n    let even_sum = 0;\n    let odd_sum = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (i % 2 === 0) {\n            even_sum += parseInt(s[i], 10);\n        } else {\n            odd_sum += parseInt(s[i], 10);\n        }\n    }\n    return even_sum === odd_sum;\n}",
      PYTHON: "def solve(s):\n    even_sum = 0\n    odd_sum = 0\n    for i, c in enumerate(s):\n        if i % 2 == 0:\n            even_sum += int(c)\n        else:\n            odd_sum += int(c)\n    return even_sum == odd_sum",
      JAVA: "    static boolean solve(String s) {\n        int even_sum = 0;\n        int odd_sum = 0;\n        for (int i = 0; i < s.length(); i++) {\n            if (i % 2 == 0) {\n                even_sum += s.charAt(i) - '0';\n            } else {\n                odd_sum += s.charAt(i) - '0';\n            }\n        }\n        return even_sum == odd_sum;\n    }",
      CPP: "#include <string>\n\nbool solve(string s) {\n    int even_sum = 0;\n    int odd_sum = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (i % 2 == 0) {\n            even_sum += s[i] - '0';\n        } else {\n            odd_sum += s[i] - '0';\n        }\n    }\n    return even_sum == odd_sum;\n}",
      GO: "func solve(s string) bool {\n    even_sum := 0\n    odd_sum := 0\n    for i := 0; i < len(s); i++ {\n        if i % 2 == 0 {\n            even_sum += int(s[i] - '0')\n        } else {\n            odd_sum += int(s[i] - '0')\n        }\n    }\n    return even_sum == odd_sum\n}",
    },
    tests: [
      { stdin: "1232", expectedStdout: "true", isSample: true },
      { stdin: "24123", expectedStdout: "true", isSample: true },
      { stdin: "1234", expectedStdout: "false" },
      { stdin: "00", expectedStdout: "true" },
      { stdin: "10", expectedStdout: "false" },
      { stdin: "9999", expectedStdout: "true" },
      { stdin: "1234567890", expectedStdout: "false" },
      { stdin: "0000000000", expectedStdout: "true" },
    ],
  }),

  p({
    ...base,
    slug: "flagged-serial-numbers",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "SLIDING_WINDOW",
    title: "Flagged Serial Numbers",
    patternTags: ["string","sliding-window","scanning"],
    signatureId: "fn:string->bool",
    avgSolveSeconds: 300,
    promptMarkdown: "You are auditing a list of serial numbers generated by a factory machine. \n\nA serial number `s` is considered \"flagged\" for inspection if it contains at least one sequence of **three or more consecutive identical digits** anywhere in the string.\n\nGiven the serial number `s` as a string, return `true` if it is flagged, and `false` otherwise.\n\n**Constraints**\n- `1 <= s.length <= 1000`\n- `s` consists only of digits from '0' to '9'.\n\n**Example 1**\n```\ninput:\n44498\noutput: true\n```\nExplanation: The first three digits are identical ('444'), so it is flagged.\n\n**Example 2**\n```\ninput:\n123456\noutput: false\n```\nExplanation: There are no three consecutive identical digits, so it is not flagged.\n\n**Example 3**\n```\ninput:\n987776\noutput: true\n```\nExplanation: It contains '777', so it is flagged.\n\n**Follow-up:** Can you write a solution that cleanly breaks out early once a match is found?",
    editorialMarkdown: "## Sliding Window of Size 3\n\nWe need to find if there is any sequence of at least three consecutive identical characters in the string. \n\nWe can iterate through the string with a sliding window of size 3. At each index `i` from 0 up to `length - 3`, we check if `s[i] == s[i+1]` and `s[i+1] == s[i+2]`. If we find such a sequence, we immediately return true.\n\nIf we finish checking all possible windows without finding any matches, we return false. The time complexity is O(N) where N is the length of the string, and space complexity is O(1).\n\nA common trap is over-complicating the search by counting streaks of all lengths instead of just peeking at the next two characters.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    if (s.length < 3) return false;\n    for (let i = 0; i < s.length - 2; i++) {\n        if (s[i] === s[i+1] && s[i+1] === s[i+2]) return true;\n    }\n    return false;\n}",
      TYPESCRIPT: "function solve(s: string): boolean {\n    if (s.length < 3) return false;\n    for (let i = 0; i < s.length - 2; i++) {\n        if (s[i] === s[i+1] && s[i+1] === s[i+2]) return true;\n    }\n    return false;\n}",
      PYTHON: "def solve(s):\n    if len(s) < 3:\n        return False\n    for i in range(len(s) - 2):\n        if s[i] == s[i+1] == s[i+2]:\n            return True\n    return False",
      JAVA: "    static boolean solve(String s) {\n        if (s.length() < 3) return false;\n        for (int i = 0; i < s.length() - 2; i++) {\n            if (s.charAt(i) == s.charAt(i+1) && s.charAt(i+1) == s.charAt(i+2)) return true;\n        }\n        return false;\n    }",
      CPP: "#include <string>\n\nbool solve(string s) {\n    if (s.length() < 3) return false;\n    for (int i = 0; i < s.length() - 2; i++) {\n        if (s[i] == s[i+1] && s[i+1] == s[i+2]) return true;\n    }\n    return false;\n}",
      GO: "func solve(s string) bool {\n    if len(s) < 3 {\n        return false\n    }\n    for i := 0; i < len(s)-2; i++ {\n        if s[i] == s[i+1] && s[i+1] == s[i+2] {\n            return true\n        }\n    }\n    return false\n}",
    },
    tests: [
      { stdin: "44498", expectedStdout: "true", isSample: true },
      { stdin: "123456", expectedStdout: "false", isSample: true },
      { stdin: "987776", expectedStdout: "true" },
      { stdin: "11", expectedStdout: "false" },
      { stdin: "112233", expectedStdout: "false" },
      { stdin: "000", expectedStdout: "true" },
      { stdin: "11111", expectedStdout: "true" },
      { stdin: "87654333", expectedStdout: "true" },
    ],
  }),
];
