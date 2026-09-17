import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w2-063` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W2_063_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "maximum-power-activation-signal",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GREEDY",
    title: "Maximum Power Activation Signal",
    patternTags: ["strings","greedy","counting"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 600,
    promptMarkdown: "You are repairing a space station's communication relay. It requires a specific activation signal consisting only of `'0'`s and `'1'`s. To be accepted by the system, the signal must end with exactly one `'1'`. To maximize the transmission power, all the remaining `'1'`s must be shifted as far left as possible.\n\nGiven a binary string `s` that contains at least one `'1'`, rearrange the characters so that the signal is valid and its transmission power is maximized.\n\n**Constraints**\n- `1 <= s.length <= 100`\n- `s` consists only of `'0'` and `'1'`.\n- `s` contains at least one `'1'`.\n\n**Example 1**\n```\ninput:\n010\noutput:\n001\n```\n*Explanation: There is only one '1', so it must be placed at the very end to be a valid signal.*\n\n**Example 2**\n```\ninput:\n1100\noutput:\n1001\n```\n*Explanation: One '1' goes to the end. The remaining '1' is placed at the front to maximize power.*\n\n**Example 3**\n```\ninput:\n10101\noutput:\n11001\n```\n*Explanation: We need one '1' at the end. The other two '1's are shifted to the leftmost positions.*\n\n**Follow-up**\nCan you solve this in O(N) time with a single pass and constant extra space if you modify the string in place?",
    editorialMarkdown: "## Maximum Power Activation Signal\n\nThis problem requires us to rearrange the characters of a binary string to maximize its \"value\", subject to the constraint that the last character must be `'1'`.\n\nThe greedy strategy is to place one `'1'` at the very end of the string, and then place all remaining `'1'`s at the very beginning of the string. The remaining characters in the middle will all be `'0'`s. We can achieve this by simply counting the number of `'1'`s in the string. If there are `c` ones, we place `c - 1` ones at the start, followed by `n - c` zeros, and finally one `'1'` at the end.\n\n**Trap**: Don't forget that the last character must always be `'1'`, so you only have `c - 1` ones available to place at the front!\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string, as we only need to count the ones and then construct the answer.\n- **Space:** O(N) or O(1) depending on whether strings are mutable in the chosen language.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    let ones = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] === '1') ones++;\n    }\n    let res = \"\";\n    for (let i = 0; i < ones - 1; i++) res += \"1\";\n    for (let i = 0; i < s.length - ones; i++) res += \"0\";\n    res += \"1\";\n    return res;\n}",
      TYPESCRIPT: "function solve(s: string): string {\n    let ones = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] === '1') ones++;\n    }\n    let res = \"\";\n    for (let i = 0; i < ones - 1; i++) res += \"1\";\n    for (let i = 0; i < s.length - ones; i++) res += \"0\";\n    res += \"1\";\n    return res;\n}",
      PYTHON: "def solve(s):\n    ones = s.count('1')\n    return '1' * (ones - 1) + '0' * (len(s) - ones) + '1'",
      JAVA: "    static String solve(String s) {\n        int ones = 0;\n        for (char c : s.toCharArray()) {\n            if (c == '1') ones++;\n        }\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < ones - 1; i++) sb.append('1');\n        for (int i = 0; i < s.length() - ones; i++) sb.append('0');\n        sb.append('1');\n        return sb.toString();\n    }",
      CPP: "#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nstring solve(string s) {\n    int ones = count(s.begin(), s.end(), '1');\n    string res = \"\";\n    for (int i = 0; i < ones - 1; i++) res += '1';\n    for (int i = 0; i < s.length() - ones; i++) res += '0';\n    res += '1';\n    return res;\n}",
      GO: "func solve(s string) string {\n    ones := 0\n    for i := 0; i < len(s); i++ {\n        if s[i] == '1' {\n            ones++\n        }\n    }\n    res := \"\"\n    for i := 0; i < ones-1; i++ {\n        res += \"1\"\n    }\n    for i := 0; i < len(s)-ones; i++ {\n        res += \"0\"\n    }\n    res += \"1\"\n    return res\n}",
    },
    tests: [
      { stdin: "010", expectedStdout: "001", isSample: true },
      { stdin: "1100", expectedStdout: "1001", isSample: true },
      { stdin: "10101", expectedStdout: "11001", isSample: true },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "111", expectedStdout: "111" },
      { stdin: "00100", expectedStdout: "00001" },
      { stdin: "01", expectedStdout: "01" },
      { stdin: "10", expectedStdout: "01" },
    ],
  }),

  p({
    ...base,
    slug: "highest-yield-reactor-pairs",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Highest Yield Reactor Pairs",
    patternTags: ["arrays","math","greedy"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are evaluating the energy outputs of several newly constructed plasma reactors. Their individual outputs are given in an integer array `outputs`. \n\nTo stabilize the grid, you must pair exactly two distinct reactors together. Due to synchronization overhead, the combined energy yield of any two reactors is calculated as the product of each reactor's output minus one. That is, if you choose reactors at indices `i` and `j` (where `i != j`), their combined yield is `(outputs[i] - 1) * (outputs[j] - 1)`.\n\nDetermine the maximum possible combined energy yield you can achieve by pairing two reactors.\n\n**Constraints**\n- `2 <= outputs.length <= 100`\n- `1 <= outputs[i] <= 1000`\n\n**Example 1**\n```\ninput:\n3 4 5 2\noutput:\n12\n```\n*Explanation: If you pair the reactors with outputs 4 and 5, the combined yield is (4 - 1) * (5 - 1) = 3 * 4 = 12.*\n\n**Example 2**\n```\ninput:\n1 5 4 5\noutput:\n16\n```\n*Explanation: You can pair the two reactors with output 5 to get (5 - 1) * (5 - 1) = 16.*\n\n**Example 3**\n```\ninput:\n3 7\noutput:\n12\n```\n*Explanation: There are only two reactors, so you must pair them: (3 - 1) * (7 - 1) = 12.*\n\n**Follow-up**\nCan you find the maximum yield in a single pass through the array?",
    editorialMarkdown: "## Highest Yield Reactor Pairs\n\nTo maximize the product `(outputs[i] - 1) * (outputs[j] - 1)` with all numbers strictly positive, we simply need to find the two largest elements in the array. Let's call them `max1` and `max2`. \n\nInstead of checking all pairs using a nested loop in O(N²) time, or sorting the array in O(N log N) time, we can keep track of the largest and second largest values in a single pass. We initialize `max1` and `max2` to 0. As we iterate through the array, if we find a number larger than `max1`, we demote `max1` to `max2` and update `max1`. If the number is not larger than `max1` but is larger than `max2`, we only update `max2`.\n\n**Trap**: Make sure to update `max2` when you update `max1`, otherwise you might lose the second largest element! Also, be mindful that the two largest elements might be identical in value.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the array, by doing a single pass.\n- **Space:** O(1) since we only need two variables.",
    referenceSolution: {
      JAVASCRIPT: "function solve(outputs) {\n    let max1 = 0, max2 = 0;\n    for (let num of outputs) {\n        if (num > max1) {\n            max2 = max1;\n            max1 = num;\n        } else if (num > max2) {\n            max2 = num;\n        }\n    }\n    return (max1 - 1) * (max2 - 1);\n}",
      TYPESCRIPT: "function solve(outputs: number[]): number {\n    let max1 = 0, max2 = 0;\n    for (let num of outputs) {\n        if (num > max1) {\n            max2 = max1;\n            max1 = num;\n        } else if (num > max2) {\n            max2 = num;\n        }\n    }\n    return (max1 - 1) * (max2 - 1);\n}",
      PYTHON: "def solve(outputs):\n    max1, max2 = 0, 0\n    for num in outputs:\n        if num > max1:\n            max2 = max1\n            max1 = num\n        elif num > max2:\n            max2 = num\n    return (max1 - 1) * (max2 - 1)",
      JAVA: "    static int solve(int[] outputs) {\n        int max1 = 0;\n        int max2 = 0;\n        for (int num : outputs) {\n            if (num > max1) {\n                max2 = max1;\n                max1 = num;\n            } else if (num > max2) {\n                max2 = num;\n            }\n        }\n        return (max1 - 1) * (max2 - 1);\n    }",
      CPP: "#include <vector>\n\nusing namespace std;\n\nint solve(vector<int> outputs) {\n    int max1 = 0, max2 = 0;\n    for (int num : outputs) {\n        if (num > max1) {\n            max2 = max1;\n            max1 = num;\n        } else if (num > max2) {\n            max2 = num;\n        }\n    }\n    return (max1 - 1) * (max2 - 1);\n}",
      GO: "func solve(outputs []int) int {\n    max1, max2 := 0, 0\n    for _, num := range outputs {\n        if num > max1 {\n            max2 = max1\n            max1 = num\n        } else if num > max2 {\n            max2 = num\n        }\n    }\n    return (max1 - 1) * (max2 - 1)\n}",
    },
    tests: [
      { stdin: "3 4 5 2", expectedStdout: "12", isSample: true },
      { stdin: "1 5 4 5", expectedStdout: "16", isSample: true },
      { stdin: "3 7", expectedStdout: "12", isSample: true },
      { stdin: "10 10 10", expectedStdout: "81" },
      { stdin: "1 1 1 1", expectedStdout: "0" },
      { stdin: "1000 1000", expectedStdout: "998001" },
      { stdin: "5 2 9 8 3", expectedStdout: "56" },
      { stdin: "20 10 30 5", expectedStdout: "551" },
    ],
  }),

  p({
    ...base,
    slug: "optimize-shield-zones",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Bakery Oven Partition",
    patternTags: ["strings","counting","prefix-sum"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 600,
    promptMarkdown: "A bakery has a row of ovens, represented by a binary string `s`. A `'0'` means the oven is idle, while a `'1'` means it is actively baking.\n\nYou must place a partition to divide the row of ovens into two non-empty sections: a left section and a right section. The efficiency score of this partition is calculated as the number of idle ovens (`'0'`) in the left section plus the number of actively baking ovens (`'1'`) in the right section.\n\nFind the maximum possible efficiency score after splitting the ovens into two non-empty sections.\n\n**Constraints**\n- `2 <= s.length <= 500`\n- `s` consists of characters `'0'` and `'1'`.\n\n**Example 1**\n```\ninput:\n011101\noutput:\n5\n```\n*Explanation: We place the partition after the first oven: the left section is \"0\" and the right section is \"11101\". The left section has one '0', and the right section has four '1's. Score = 1 + 4 = 5.*\n\n**Example 2**\n```\ninput:\n00111\noutput:\n5\n```\n*Explanation: Placing the partition after the second oven gives a left section of \"00\" (score 2) and a right section of \"111\" (score 3). Total = 5.*\n\n**Example 3**\n```\ninput:\n1111\noutput:\n3\n```\n*Explanation: Both sections must be non-empty. Placing the partition after the first oven gives a left section of \"1\" (score 0) and a right section of \"111\" (score 3). Total = 3.*\n\n**Follow-up**\nCan you find the optimal partition using a single pass with two counters, or in two passes with O(1) space?",
    editorialMarkdown: "## Optimize Shield Zones\n\nWe want to find the maximum score for splitting a string `s` into a non-empty left part and a non-empty right part. The score is the number of `'0'`s in the left part plus the number of `'1'`s in the right part.\n\nA straightforward O(N) approach is to first count the total number of `'1'`s in the string. This total represents the score of the right part if the left part was empty. We can then iterate through the string up to the second-to-last character (since the right part must be non-empty). As we process each character `s[i]`, we are extending the left part by one character. If `s[i]` is `'0'`, the left score increases. If `s[i]` is `'1'`, the right score decreases. At each step, we record the sum of the left and right scores, and return the maximum observed.\n\n**Trap**: Make sure you do not include the last character in the split index, as both the left and right substrings must be non-empty.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of `s`, since we traverse the string twice.\n- **Space:** O(1) because we only maintain a few integer counters.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    let rightOnes = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] === '1') rightOnes++;\n    }\n    let leftZeros = 0;\n    let maxScore = 0;\n    for (let i = 0; i < s.length - 1; i++) {\n        if (s[i] === '0') {\n            leftZeros++;\n        } else {\n            rightOnes--;\n        }\n        let score = leftZeros + rightOnes;\n        if (score > maxScore) {\n            maxScore = score;\n        }\n    }\n    return maxScore;\n}",
      TYPESCRIPT: "function solve(s: string): number {\n    let rightOnes = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] === '1') rightOnes++;\n    }\n    let leftZeros = 0;\n    let maxScore = 0;\n    for (let i = 0; i < s.length - 1; i++) {\n        if (s[i] === '0') {\n            leftZeros++;\n        } else {\n            rightOnes--;\n        }\n        let score = leftZeros + rightOnes;\n        if (score > maxScore) {\n            maxScore = score;\n        }\n    }\n    return maxScore;\n}",
      PYTHON: "def solve(s):\n    right_ones = s.count('1')\n    left_zeros = 0\n    max_score = 0\n    for i in range(len(s) - 1):\n        if s[i] == '0':\n            left_zeros += 1\n        else:\n            right_ones -= 1\n        score = left_zeros + right_ones\n        if score > max_score:\n            max_score = score\n    return max_score",
      JAVA: "    static int solve(String s) {\n        int rightOnes = 0;\n        for (char c : s.toCharArray()) {\n            if (c == '1') rightOnes++;\n        }\n        int leftZeros = 0;\n        int maxScore = 0;\n        for (int i = 0; i < s.length() - 1; i++) {\n            if (s.charAt(i) == '0') {\n                leftZeros++;\n            } else {\n                rightOnes--;\n            }\n            int score = leftZeros + rightOnes;\n            if (score > maxScore) {\n                maxScore = score;\n            }\n        }\n        return maxScore;\n    }",
      CPP: "#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(string s) {\n    int rightOnes = count(s.begin(), s.end(), '1');\n    int leftZeros = 0;\n    int maxScore = 0;\n    for (int i = 0; i < s.length() - 1; i++) {\n        if (s[i] == '0') {\n            leftZeros++;\n        } else {\n            rightOnes--;\n        }\n        int score = leftZeros + rightOnes;\n        if (score > maxScore) {\n            maxScore = score;\n        }\n    }\n    return maxScore;\n}",
      GO: "func solve(s string) int {\n    rightOnes := 0\n    for i := 0; i < len(s); i++ {\n        if s[i] == '1' {\n            rightOnes++\n        }\n    }\n    leftZeros := 0\n    maxScore := 0\n    for i := 0; i < len(s)-1; i++ {\n        if s[i] == '0' {\n            leftZeros++\n        } else {\n            rightOnes--\n        }\n        score := leftZeros + rightOnes\n        if score > maxScore {\n            maxScore = score\n        }\n    }\n    return maxScore\n}",
    },
    tests: [
      { stdin: "011101", expectedStdout: "5", isSample: true },
      { stdin: "00111", expectedStdout: "5", isSample: true },
      { stdin: "1111", expectedStdout: "3", isSample: true },
      { stdin: "00", expectedStdout: "1" },
      { stdin: "10", expectedStdout: "0" },
      { stdin: "01001", expectedStdout: "4" },
      { stdin: "011001", expectedStdout: "4" },
      { stdin: "00000", expectedStdout: "4" },
    ],
  }),

  p({
    ...base,
    slug: "maximum-crystal-mining-yield",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GREEDY",
    title: "Maximum Crystal Mining Yield",
    patternTags: ["greedy","math","arrays"],
    signatureId: "fn:ints,int->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You discovered an array of crystal veins on a foreign planet, where `veins[i]` represents the base energy yield of the `i`-th vein. You have enough equipment to mine exactly `k` times. \n\nEach time you mine a vein, you extract energy equal to its current yield. Due to the stimulating effect of the mining equipment, the yield of that specific vein immediately increases by 1 for any future extractions.\n\nReturn the maximum total energy yield you can extract after exactly `k` mining operations.\n\n**Constraints**\n- `1 <= veins.length <= 100`\n- `1 <= veins[i] <= 100`\n- `1 <= k <= 100`\n\n**Example 1**\n```\ninput:\n1 2 3 4 5\n3\noutput:\n18\n```\n*Explanation: You can mine the last vein 3 times. The yields will be 5, 6, and 7. The total is 5 + 6 + 7 = 18.*\n\n**Example 2**\n```\ninput:\n5 5 5\n2\noutput:\n11\n```\n*Explanation: All veins have 5. You can mine the first vein twice to get 5 + 6 = 11.*\n\n**Example 3**\n```\ninput:\n10\n5\noutput:\n60\n```\n*Explanation: There is only one vein. You extract 10, 11, 12, 13, and 14. Sum = 60.*\n\n**Follow-up**\nCan you compute the answer mathematically in O(1) time after finding the maximum yield vein?",
    editorialMarkdown: "## Maximum Crystal Mining Yield\n\nWe need to maximize our total extracted energy from `k` operations. Since the yield of a mined vein increases by 1, the optimal strategy is simply to identify the vein with the highest initial yield and mine it `k` times consecutively.\n\nIf the maximum initial yield is `M`, then mining it `k` times will yield exactly `M + (M + 1) + (M + 2) + ... + (M + k - 1)`. We can either compute this sum iteratively using a loop, or using the arithmetic progression sum formula. The max value can be found in a single pass O(N).\n\n**Trap**: Do not simulate selecting the maximum for every single step by re-scanning the array, as the same vein remains the best choice once it is picked initially.\n\n**Complexity:**\n- **Time:** O(N) where N is the number of veins, to find the maximum element. The subsequent math takes O(1).\n- **Space:** O(1) as we only keep track of a few integers.",
    referenceSolution: {
      JAVASCRIPT: "function solve(veins, k) {\n    let maxVein = 0;\n    for (let v of veins) {\n        if (v > maxVein) {\n            maxVein = v;\n        }\n    }\n    let total = 0;\n    for (let i = 0; i < k; i++) {\n        total += maxVein + i;\n    }\n    return total;\n}",
      TYPESCRIPT: "function solve(veins: number[], k: number): number {\n    let maxVein = 0;\n    for (let v of veins) {\n        if (v > maxVein) {\n            maxVein = v;\n        }\n    }\n    let total = 0;\n    for (let i = 0; i < k; i++) {\n        total += maxVein + i;\n    }\n    return total;\n}",
      PYTHON: "def solve(veins, k):\n    max_vein = max(veins)\n    total = 0\n    for i in range(k):\n        total += max_vein + i\n    return total",
      JAVA: "    static int solve(int[] veins, int k) {\n        int maxVein = 0;\n        for (int v : veins) {\n            if (v > maxVein) {\n                maxVein = v;\n            }\n        }\n        int total = 0;\n        for (int i = 0; i < k; i++) {\n            total += maxVein + i;\n        }\n        return total;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(vector<int> veins, int k) {\n    int maxVein = 0;\n    for (int v : veins) {\n        if (v > maxVein) {\n            maxVein = v;\n        }\n    }\n    int total = 0;\n    for (int i = 0; i < k; i++) {\n        total += maxVein + i;\n    }\n    return total;\n}",
      GO: "func solve(veins []int, k int) int {\n    maxVein := 0\n    for _, v := range veins {\n        if v > maxVein {\n            maxVein = v\n        }\n    }\n    total := 0\n    for i := 0; i < k; i++ {\n        total += maxVein + i\n    }\n    return total\n}",
    },
    tests: [
      { stdin: "1 2 3 4 5\n3", expectedStdout: "18", isSample: true },
      { stdin: "5 5 5\n2", expectedStdout: "11", isSample: true },
      { stdin: "10\n5", expectedStdout: "60", isSample: true },
      { stdin: "1 2\n1", expectedStdout: "2" },
      { stdin: "8 3 1\n4", expectedStdout: "38" },
      { stdin: "2 1 4 3\n3", expectedStdout: "15" },
      { stdin: "100 200 50\n5", expectedStdout: "1010" },
      { stdin: "1 1 1 1 1\n10", expectedStdout: "55" },
    ],
  }),

  p({
    ...base,
    slug: "consecutive-marker-blocks",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Consecutive Marker Blocks",
    patternTags: ["strings","counting","substring"],
    signatureId: "fn:string,string->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are analyzing an intercepted alien transmission (a string `s`). You are searching for repeating occurrences of a specific data marker (a string `marker`).\n\nFind the maximum `k` such that `marker` repeated `k` times consecutively forms a substring of `s`.\n\n**Constraints**\n- `1 <= s.length <= 100`\n- `1 <= marker.length <= 100`\n- `s` and `marker` consist of lowercase English letters.\n\n**Example 1**\n```\ninput:\nababc\nab\noutput:\n2\n```\n*Explanation: The marker \"ab\" is repeated 2 times sequentially as \"abab\", which is a substring of \"ababc\".*\n\n**Example 2**\n```\ninput:\nababc\nba\noutput:\n1\n```\n*Explanation: \"ba\" appears once, but \"baba\" does not appear as a substring.*\n\n**Example 3**\n```\ninput:\nababc\nc\noutput:\n1\n```\n*Explanation: \"c\" appears once as a substring.*\n\n**Follow-up**\nCan you do this efficiently without generating many large strings?",
    editorialMarkdown: "## Consecutive Marker Blocks\n\nWe need to find the largest `k` such that the string formed by repeating `marker` `k` times is a substring of `s`.\n\nSince the length of `s` is small (up to 100), we can iteratively construct repeated versions of `marker` (e.g., `marker`, `marker + marker`, `marker + marker + marker`, etc.) and check if each constructed string is a substring of `s`. The largest `k` for which this check passes is our answer. The maximum possible `k` is bounded by `s.length / marker.length`.\n\n**Trap**: Make sure to test `k=0` if the marker does not appear in the string at all. Also, don't forget that `indexOf` or equivalent string-matching functions are sufficient given the small constraints!\n\n**Complexity:**\n- **Time:** O(N^2) where N is the length of `s`, due to string repetition and matching. Given N <= 100, this easily runs within limits.\n- **Space:** O(N) to store the repeated string.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s, marker) {\n    let k = 0;\n    let current = marker;\n    while (s.indexOf(current) !== -1) {\n        k++;\n        current += marker;\n    }\n    return k;\n}",
      TYPESCRIPT: "function solve(s: string, marker: string): number {\n    let k = 0;\n    let current = marker;\n    while (s.indexOf(current) !== -1) {\n        k++;\n        current += marker;\n    }\n    return k;\n}",
      PYTHON: "def solve(s, marker):\n    k = 0\n    current = marker\n    while current in s:\n        k += 1\n        current += marker\n    return k",
      JAVA: "    static int solve(String s, String marker) {\n        int k = 0;\n        String current = marker;\n        while (s.contains(current)) {\n            k++;\n            current += marker;\n        }\n        return k;\n    }",
      CPP: "int solve(string s, string marker) {\n    int k = 0;\n    string current = marker;\n    while (s.find(current) != string::npos) {\n        k++;\n        current += marker;\n    }\n    return k;\n}",
      GO: "func solve(s string, marker string) int {\n    k := 0\n    current := marker\n    for strings.Contains(s, current) {\n        k++\n        current += marker\n    }\n    return k\n}",
    },
    tests: [
      { stdin: "ababc\nab", expectedStdout: "2", isSample: true },
      { stdin: "ababc\nba", expectedStdout: "1", isSample: true },
      { stdin: "ababc\nc", expectedStdout: "1", isSample: true },
      { stdin: "a\na", expectedStdout: "1" },
      { stdin: "abc\ndef", expectedStdout: "0" },
      { stdin: "aaaaa\naa", expectedStdout: "2" },
      { stdin: "xxyxyxyxx\nxy", expectedStdout: "3" },
      { stdin: "abcabcabc\nabc", expectedStdout: "3" },
    ],
  }),
];
