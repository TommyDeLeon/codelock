import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w0-058` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W0_058_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "filter-lengthy-transmissions",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Filter Lengthy Transmissions",
    patternTags: ["array","string","filtering"],
    signatureId: "fn:strings->strings",
    avgSolveSeconds: 300,
    promptMarkdown: "You are managing communications for a deep space exploration team. Bandwidth is limited, so any transmission that is too long needs to be flagged for manual review.\n\nA transmission is considered **invalid** if its length is strictly greater than `10` characters. \n\nGiven an array of strings `messages` (where each string is a single word), return an array containing only the **invalid** transmissions, in the same order they appeared in the input.\n\n**Constraints**\n- `1 <= messages.length <= 100`\n- `1 <= messages[i].length <= 25`\n- `messages[i]` consists of only lowercase English letters.\n\n**Example 1**\n```\ninput:\nhello galaxy exploration team\noutput: exploration\n```\n*Explanation: \"exploration\" has 11 characters, which is > 10. The others are valid.*\n\n**Example 2**\n```\ninput:\nsupernova blackhole star planet\noutput:\n```\n*Explanation: \"supernova\" is 9, \"blackhole\" is 9, \"star\" is 4, \"planet\" is 6. None are > 10.*\n\n**Example 3**\n```\ninput:\nextraterrestrial lifeform discovered\noutput: extraterrestrial\n```\n*Explanation: \"extraterrestrial\" is 16 characters long. \"lifeform\" is 8, \"discovered\" is 10 (not strictly greater than 10).*\n\n**Follow-up**\nCan you do this using built-in array filtering functions in your language of choice?",
    editorialMarkdown: "## Filter Lengthy Transmissions\n\nWe need to filter out messages that are considered too long. The problem states that a message is strictly invalid if its length is greater than 10. We must return all such invalid messages.\n\nThis is a straight-forward linear scan problem. We iterate through the list of messages, checking the length of each string. If the string's length is strictly greater than 10, we add it to our output array.\n\n**Trap**: The condition is *strictly greater* than 10. Strings of length exactly 10 are valid and should not be returned.\n\n**Complexity:**\n- **Time:** O(N * L) where N is the number of strings and L is the maximum length of a string, since we need to check the length and potentially copy the string.\n- **Space:** O(1) extra space beyond the output array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(messages) {\n    return messages.filter(m => m.length > 10);\n}",
      TYPESCRIPT: "function solve(messages: string[]): string[] {\n    return messages.filter(m => m.length > 10);\n}",
      PYTHON: "def solve(messages):\n    return [m for m in messages if len(m) > 10]",
      JAVA: "    static String[] solve(String[] messages) {\n        java.util.List<String> res = new java.util.ArrayList<>();\n        for (String m : messages) {\n            if (m.length() > 10) {\n                res.add(m);\n            }\n        }\n        return res.toArray(new String[0]);\n    }",
      CPP: "#include <vector>\n#include <string>\n\nusing namespace std;\n\nvector<string> solve(vector<string> messages) {\n    vector<string> res;\n    for (const string& m : messages) {\n        if (m.length() > 10) {\n            res.push_back(m);\n        }\n    }\n    return res;\n}",
      GO: "func solve(messages []string) []string {\n    var res []string\n    for _, m := range messages {\n        if len(m) > 10 {\n            res = append(res, m)\n        }\n    }\n    if res == nil {\n        return []string{}\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "hello galaxy exploration team", expectedStdout: "exploration", isSample: true },
      { stdin: "supernova blackhole star planet", expectedStdout: "", isSample: true },
      { stdin: "extraterrestrial lifeform discovered", expectedStdout: "extraterrestrial" },
      { stdin: "tenletters", expectedStdout: "" },
      { stdin: "elevenchars", expectedStdout: "elevenchars" },
      { stdin: "a abcdefghijklmnop b", expectedStdout: "abcdefghijklmnop" },
      { stdin: "interstellar ship intergalactic", expectedStdout: "interstellar intergalactic" },
      { stdin: "a b c d e", expectedStdout: "" },
    ],
  }),

  p({
    ...base,
    slug: "invert-encryption-permutation",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Invert Encryption Permutation",
    patternTags: ["array","hash-map"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 300,
    promptMarkdown: "You are working on a decryption module for an ancient alien artifact. The artifact encrypts data using a permutation array.\n\nYou are given a 0-indexed integer array `p` of length `n`, which is a permutation of the numbers in the range `[0, n - 1]`.\n\nTo decrypt the data, you need to find the **inverse permutation**. The inverse permutation `inv` is defined such that `inv[p[i]] = i` for all `0 <= i < n`.\n\nReturn the inverse permutation array.\n\n**Constraints**\n- `1 <= p.length <= 10^4`\n- `0 <= p[i] < p.length`\n- All values in `p` are unique (it is a valid permutation).\n\n**Example 1**\n```\ninput:\n2 0 1\noutput: 1 2 0\n```\n*Explanation: `p[0] = 2`, so `inv[2] = 0`. `p[1] = 0`, so `inv[0] = 1`. `p[2] = 1`, so `inv[1] = 2`.*\n\n**Example 2**\n```\ninput:\n0 1 2 3\noutput: 0 1 2 3\n```\n*Explanation: The permutation is its own inverse.*\n\n**Example 3**\n```\ninput:\n4 3 2 1 0\noutput: 4 3 2 1 0\n```\n*Explanation: `p[0] = 4`, so `inv[4] = 0`, and so on.*\n\n**Follow-up**\nCan you think of a way to do this in-place if modifying the input array is allowed and `n` is small?",
    editorialMarkdown: "## Invert Encryption Permutation\n\nWe are given a 0-indexed integer array `p` which is a permutation of the numbers from `0` to `n-1`. Our task is to return the inverse of this permutation.\n\nAn inverse permutation `inv` satisfies the property `inv[p[i]] = i`. We can construct the inverse permutation by allocating a new array `inv` of the same size as `p`. Then, we iterate through `p` with the index `i` and value `x = p[i]`, and assign `inv[x] = i`.\n\n**Trap**: Make sure to allocate the result array with the correct size before iterating, otherwise you might go out of bounds.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the array, as we do a single pass over the input.\n- **Space:** O(1) auxiliary space (excluding the output array).",
    referenceSolution: {
      JAVASCRIPT: "function solve(p) {\n    let inv = new Array(p.length);\n    for (let i = 0; i < p.length; i++) {\n        inv[p[i]] = i;\n    }\n    return inv;\n}",
      TYPESCRIPT: "function solve(p: number[]): number[] {\n    let inv: number[] = new Array(p.length);\n    for (let i = 0; i < p.length; i++) {\n        inv[p[i]] = i;\n    }\n    return inv;\n}",
      PYTHON: "def solve(p):\n    inv = [0] * len(p)\n    for i, x in enumerate(p):\n        inv[x] = i\n    return inv",
      JAVA: "    static int[] solve(int[] p) {\n        int[] inv = new int[p.length];\n        for (int i = 0; i < p.length; i++) {\n            inv[p[i]] = i;\n        }\n        return inv;\n    }",
      CPP: "#include <vector>\n\nusing namespace std;\n\nvector<int> solve(vector<int> p) {\n    vector<int> inv(p.size());\n    for (int i = 0; i < p.size(); i++) {\n        inv[p[i]] = i;\n    }\n    return inv;\n}",
      GO: "func solve(p []int) []int {\n    inv := make([]int, len(p))\n    for i, x := range p {\n        inv[x] = i\n    }\n    return inv\n}",
    },
    tests: [
      { stdin: "2 0 1", expectedStdout: "1 2 0", isSample: true },
      { stdin: "0 1 2 3", expectedStdout: "0 1 2 3", isSample: true },
      { stdin: "4 3 2 1 0", expectedStdout: "4 3 2 1 0" },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "2 3 4 0 1", expectedStdout: "3 4 0 1 2" },
      { stdin: "5 4 3 2 1 0", expectedStdout: "5 4 3 2 1 0" },
      { stdin: "1 0 3 2", expectedStdout: "1 0 3 2" },
      { stdin: "6 5 4 3 2 1 0", expectedStdout: "6 5 4 3 2 1 0" },
    ],
  }),
];
