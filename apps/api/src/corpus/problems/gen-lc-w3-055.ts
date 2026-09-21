import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w3-055` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W3_055_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "ballot-score-windows",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Ballot Score Windows",
    patternTags: ["hash-map","counting","frequency-count","sliding-window"],
    signatureId: "fn:string,int->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are tallying votes. Each character in a ballot string represents a candidate (`'A'`–`'Z'`). The **score** of a substring is the number of distinct candidates that appear an **odd** number of times in that substring.\n\nGiven a string `ballots` and an integer `k`, return the number of **non-empty substrings** of `ballots` whose score is **at most** `k`.\n\n**Constraints**\n- `1 <= ballots.length <= 1000`\n- `ballots` consists of uppercase English letters only.\n- `0 <= k <= 26`\n\n**Example 1**\n```\ninput:\nabc\n2\noutput: 5\n```\n*Explanation: Substrings with score ≤ 2: \\\"a\\\"(1), \\\"b\\\"(1), \\\"c\\\"(1), \\\"ab\\\"(2), \\\"bc\\\"(2). \\\"abc\\\" has score 3. Total = 5.*\n\n**Example 2**\n```\ninput:\naab\n1\noutput: 5\n```\n*Explanation: Substrings with score ≤ 1: \\\"a\\\"(1) at position 0, \\\"a\\\"(1) at position 1, \\\"b\\\"(1), \\\"aa\\\"(0), \\\"aab\\\"(1). Substring \\\"ab\\\" has score 2. Total = 5.*\n\n**Example 3**\n```\ninput:\nz\n0\noutput: 0\n```\n*Explanation: The only substring \\\"z\\\" has score 1, which exceeds k = 0.*\n\n**Follow-up**\nCan you solve this in O(N²) time and O(1) extra space using a bitmask?",
    editorialMarkdown: "## Ballot Score Windows\n\nThe key insight is that each character's **parity of count** within a substring toggles as we extend or shrink the window. We can represent the set of candidates appearing an odd number of times as a **bitmask** (bit `i` = 1 if the `i`-th letter appears an odd number of times).\n\nFor every starting index `i`, maintain a running bitmask as you extend `j` from `i` to `n-1`. XOR the bit of `ballots[j]` into the mask at each step. Count the number of set bits (popcount) — if it is `≤ k`, increment the answer.\n\n**Trap**: Sorting or using a frequency map and recomputing from scratch for every pair (i, j) works but is unnecessary; the bitmask lets you do O(1) per extension.\n\n**Complexity:**\n- **Time:** O(N²) — two nested loops, O(1) work per pair.\n- **Space:** O(1) — only the bitmask variable.",
    referenceSolution: {
      JAVASCRIPT: "function solve(ballots, k) {\n    let n = ballots.length, ans = 0;\n    for (let i = 0; i < n; i++) {\n        let mask = 0;\n        for (let j = i; j < n; j++) {\n            mask ^= (1 << (ballots.charCodeAt(j) - 65));\n            let bits = 0, m = mask;\n            while (m) { bits += m & 1; m >>= 1; }\n            if (bits <= k) ans++;\n        }\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(ballots: string, k: number): number {\n    let n = ballots.length, ans = 0;\n    for (let i = 0; i < n; i++) {\n        let mask = 0;\n        for (let j = i; j < n; j++) {\n            mask ^= (1 << (ballots.charCodeAt(j) - 65));\n            let bits = 0, m = mask;\n            while (m) { bits += m & 1; m >>= 1; }\n            if (bits <= k) ans++;\n        }\n    }\n    return ans;\n}",
      PYTHON: "def solve(ballots, k):\n    n = len(ballots)\n    ans = 0\n    for i in range(n):\n        mask = 0\n        for j in range(i, n):\n            mask ^= 1 << (ord(ballots[j]) - ord('A'))\n            if bin(mask).count('1') <= k:\n                ans += 1\n    return ans",
      JAVA: "    static int solve(String ballots, int k) {\n        int n = ballots.length(), ans = 0;\n        for (int i = 0; i < n; i++) {\n            int mask = 0;\n            for (int j = i; j < n; j++) {\n                mask ^= (1 << (ballots.charAt(j) - 'A'));\n                if (Integer.bitCount(mask) <= k) ans++;\n            }\n        }\n        return ans;\n    }",
      CPP: "int solve(string ballots, int k) {\n    int n = ballots.size(), ans = 0;\n    for (int i = 0; i < n; i++) {\n        int mask = 0;\n        for (int j = i; j < n; j++) {\n            mask ^= (1 << (ballots[j] - 'A'));\n            if (__builtin_popcount(mask) <= k) ans++;\n        }\n    }\n    return ans;\n}",
      GO: "func solve(ballots string, k int) int {\n    n := len(ballots)\n    ans := 0\n    for i := 0; i < n; i++ {\n        mask := 0\n        for j := i; j < n; j++ {\n            mask ^= 1 << int(ballots[j]-'A')\n            bits := 0\n            m := mask\n            for m > 0 {\n                bits += m & 1\n                m >>= 1\n            }\n            if bits <= k {\n                ans++\n            }\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "abc\n2", expectedStdout: "5", isSample: true },
      { stdin: "aab\n1", expectedStdout: "5", isSample: true },
      { stdin: "z\n0", expectedStdout: "0" },
      { stdin: "a\n1", expectedStdout: "1" },
      { stdin: "aa\n0", expectedStdout: "1" },
      { stdin: "abba\n0", expectedStdout: "2" },
      { stdin: "abcde\n26", expectedStdout: "15" },
      { stdin: "aabbcc\n2", expectedStdout: "21" },
    ],
  }),
];
