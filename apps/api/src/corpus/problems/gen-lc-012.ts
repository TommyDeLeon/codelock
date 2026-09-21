import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-012` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_012_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "assembled-robot-diagnostics",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BIT_MANIPULATION",
    title: "Assembled Robot Diagnostics",
    patternTags: ["array","arrays","bit-manipulation"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 300,
    promptMarkdown: "A factory tests a line of robots on an assembly belt. The robots are represented by an array of integers `ids`. \n\nOnly the robots with an even ID number are considered fully assembled. To pass the final batch diagnostic, the factory computes a combined signature, which is the bitwise OR of all fully assembled robot IDs on the belt.\n\nReturn the combined diagnostic signature. If there are no fully assembled robots, return 0.\n\n**Constraints**\n- `1 <= ids.length <= 40`\n- `0 <= ids[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 3 4\noutput: 6\n```\nExplanation: The fully assembled robots have IDs 2 and 4. 2 | 4 = 6.\n\n**Example 2**\n```\ninput:\n1 3 5\noutput: 0\n```\nExplanation: There are no even IDs, so the combined signature is 0.\n\n**Example 3**\n```\ninput:\n8 12 10\noutput: 14\n```\nExplanation: All IDs are even. 8 | 12 = 12. 12 | 10 = 14.\n\n**Follow-up:** Is the order of the robots on the belt relevant to the final diagnostic signature?",
    editorialMarkdown: "## Bitwise OR with a Condition\n\nThe task asks us to compute the bitwise OR of a specific subset of numbers in the array—those that are even. \n\nWe can initialize a running total (`res`) to 0, since 0 is the identity element for the bitwise OR operation (i.e., `x | 0 = x`). Then, we iterate through each element in the `ids` array. If an element is even (which can be checked via `x % 2 == 0` or `(x & 1) == 0`), we update our running total using the bitwise OR operator (`res |= x`). If no even numbers are found, the initial value of 0 is naturally returned.\n\nTime complexity is O(N) where N is the length of the array, as we must inspect each element exactly once. Space complexity is O(1) as we only need a single integer to keep the accumulated result.\n\nThe one trap most solvers hit is forgetting to initialize the accumulator to 0, or trying to use the first element of the array as the initial value without verifying if it's even, which leads to incorrect bitwise OR results.",
    referenceSolution: {
      JAVASCRIPT: "function solve(ids) {\n    let res = 0;\n    for (let i = 0; i < ids.length; i++) {\n        if (ids[i] % 2 === 0) {\n            res |= ids[i];\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(ids: number[]): number {\n    let res = 0;\n    for (let i = 0; i < ids.length; i++) {\n        if (ids[i] % 2 === 0) {\n            res |= ids[i];\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(ids):\n    res = 0\n    for x in ids:\n        if x % 2 == 0:\n            res |= x\n    return res",
      JAVA: "    static int solve(int[] ids) {\n        int res = 0;\n        for (int x : ids) {\n            if (x % 2 == 0) {\n                res |= x;\n            }\n        }\n        return res;\n    }",
      CPP: "int solve(vector<int> ids) {\n    int res = 0;\n    for (int x : ids) {\n        if (x % 2 == 0) res |= x;\n    }\n    return res;\n}",
      GO: "func solve(ids []int) int {\n    res := 0\n    for _, x := range ids {\n        if x % 2 == 0 {\n            res |= x\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 3 4", expectedStdout: "6", isSample: true },
      { stdin: "1 3 5", expectedStdout: "0", isSample: true },
      { stdin: "8 12 10", expectedStdout: "14" },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "1000 999 1000", expectedStdout: "1000" },
      { stdin: "2 4 6 8 10 12 14 16", expectedStdout: "30" },
      { stdin: "7", expectedStdout: "0" },
      { stdin: "1 3 5 42 7 9", expectedStdout: "42" },
    ],
  }),

  p({
    ...base,
    slug: "missing-weather-readings",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Missing Weather Readings",
    patternTags: ["array","linear-scan","arrays"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 300,
    promptMarkdown: "A remote weather station records temperatures every hour and stores them in an array `temperatures`. \n\nOccasionally, a sensor malfunctions and fails to record a temperature. When this happens, the station logs the value `-100` to indicate a missing reading (since the actual temperature never drops that low in this region).\n\nReturn an array of the 0-indexed hours (positions in the array) where the reading is missing, in ascending order.\n\n**Constraints**\n- `1 <= temperatures.length <= 40`\n- `-50 <= temperatures[i] <= 50`, or `temperatures[i] == -100`\n\n**Example 1**\n```\ninput:\n25 -100 22 -100 20\noutput: 1 3\n```\nExplanation: The missing readings (`-100`) occur at indices 1 and 3.\n\n**Example 2**\n```\ninput:\n10 15 20\noutput: \n```\nExplanation: There are no missing readings, so we return an empty array.\n\n**Example 3**\n```\ninput:\n-100 -100 -100\noutput: 0 1 2\n```\nExplanation: All readings are missing.\n\n**Follow-up:** Could you use functional programming concepts like `filter` or `map` to write this more concisely?",
    editorialMarkdown: "## Linear Scan and Filtering\n\nThe problem asks us to find the positions of all missing temperature readings, which are indicated by the value `-100`.\n\nWe can iterate through the array from the first index (0) to the last. At each position, we check if the temperature is `-100`. If it is, we append the current index to our result list. Since we are scanning from left to right, the indices added to the list will naturally be in ascending order.\n\nTime complexity is O(N) where N is the number of temperature readings, as we examine each reading exactly once. Space complexity is O(1) auxiliary space, though O(N) space is required to store and return the resulting indices.\n\nThe one trap most solvers hit is returning the missing values themselves (a list of `-100`s) instead of their indices, or using 1-based indexing instead of the standard 0-based indexing requested by the problem.",
    referenceSolution: {
      JAVASCRIPT: "function solve(temperatures) {\n    let res = [];\n    for (let i = 0; i < temperatures.length; i++) {\n        if (temperatures[i] === -100) {\n            res.push(i);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(temperatures: number[]): number[] {\n    let res: number[] = [];\n    for (let i = 0; i < temperatures.length; i++) {\n        if (temperatures[i] === -100) {\n            res.push(i);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(temperatures):\n    return [i for i, t in enumerate(temperatures) if t == -100]",
      JAVA: "    static int[] solve(int[] temperatures) {\n        List<Integer> res = new ArrayList<>();\n        for (int i = 0; i < temperatures.length; i++) {\n            if (temperatures[i] == -100) {\n                res.add(i);\n            }\n        }\n        int[] out = new int[res.size()];\n        for(int i = 0; i < res.size(); i++) out[i] = res.get(i);\n        return out;\n    }",
      CPP: "vector<int> solve(vector<int> temperatures) {\n    vector<int> res;\n    for (size_t i = 0; i < temperatures.size(); ++i) {\n        if (temperatures[i] == -100) {\n            res.push_back(i);\n        }\n    }\n    return res;\n}",
      GO: "func solve(temperatures []int) []int {\n    res := make([]int, 0)\n    for i, t := range temperatures {\n        if t == -100 {\n            res = append(res, i)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "25 -100 22 -100 20", expectedStdout: "1 3", isSample: true },
      { stdin: "10 15 20", expectedStdout: "", isSample: true },
      { stdin: "-100 -100 -100", expectedStdout: "0 1 2" },
      { stdin: "-100", expectedStdout: "0" },
      { stdin: "0", expectedStdout: "" },
      { stdin: "-50 50 0 10 -10 -100 25", expectedStdout: "5" },
      { stdin: "-100 1 2 3 4 5 6 -100", expectedStdout: "0 7" },
      { stdin: "0 0 -100 -100 -100 0 0", expectedStdout: "2 3 4" },
    ],
  }),

  p({
    ...base,
    slug: "ancient-scroll-swap",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Ancient Scroll Swap",
    patternTags: ["string","strings","hash-map"],
    signatureId: "fn:string,string->bool",
    avgSolveSeconds: 900,
    promptMarkdown: "Two ancient scrolls contain enchanted words, `word1` and `word2`. You have a magic wand that allows you to swap exactly two letters in `word1`.\n\nDetermine if it is possible to make `word1` equal to `word2` by performing exactly one swap of two letters in `word1`.\n\n**Constraints**\n- `1 <= word1.length, word2.length <= 40`\n- `word1` and `word2` consist of lowercase English letters.\n\n**Example 1**\n```\ninput:\nab\nba\noutput: true\n```\nExplanation: You can swap 'a' and 'b' in `word1` to get \"ba\", which matches `word2`.\n\n**Example 2**\n```\ninput:\nab\nab\noutput: false\n```\nExplanation: The only possible swap in `word1` is 'a' and 'b', which gives \"ba\". This does not match `word2`.\n\n**Example 3**\n```\ninput:\naa\naa\noutput: true\n```\nExplanation: You can swap the first 'a' and the second 'a' in `word1` to get \"aa\", which matches `word2`.\n\n**Follow-up:** Can you solve this in O(1) auxiliary space (aside from small variables for tracking differences)?",
    editorialMarkdown: "## Case Analysis and Character Counting\n\nTo determine if `word1` can be made equal to `word2` with exactly one character swap, we first handle two distinct cases:\n1. **The words are identical**: If `word1 == word2`, we can only perform a swap and keep the words identical if there is at least one duplicate character in `word1` (e.g., swapping the two 'a's in \"aab\"). We can check this by counting characters; if any character appears more than once, it's possible.\n2. **The words are different**: If `word1 != word2`, they must differ in exactly two positions for a single swap to fix them. We find all indices where `word1[i] != word2[i]`. If there are not exactly two such indices, return false. If there are exactly two indices (say `i` and `j`), we check if a swap fixes the difference. This happens only if `word1[i] == word2[j]` and `word1[j] == word2[i]`.\n\nAlso, if the strings are not of equal length, it is impossible, so we should quickly return false.\n\nTime complexity is O(N) where N is the length of the string, as we only need to scan the strings a constant number of times. Space complexity is O(min(N, C)) where C is the size of the alphabet, to count character frequencies.\n\nThe one trap most solvers hit is forgetting the case where `word1 == word2` and returning false by default, overlooking that swapping two identical characters is a valid and required move.",
    referenceSolution: {
      JAVASCRIPT: "function solve(word1, word2) {\n    if (word1.length !== word2.length) return false;\n    \n    if (word1 === word2) {\n        let set = new Set();\n        for (let c of word1) {\n            if (set.has(c)) return true;\n            set.add(c);\n        }\n        return false;\n    }\n    \n    let diff = [];\n    for (let i = 0; i < word1.length; i++) {\n        if (word1[i] !== word2[i]) {\n            diff.push(i);\n        }\n    }\n    \n    return diff.length === 2 && \n           word1[diff[0]] === word2[diff[1]] && \n           word1[diff[1]] === word2[diff[0]];\n}",
      TYPESCRIPT: "function solve(word1: string, word2: string): boolean {\n    if (word1.length !== word2.length) return false;\n    \n    if (word1 === word2) {\n        let set = new Set<string>();\n        for (let c of word1) {\n            if (set.has(c)) return true;\n            set.add(c);\n        }\n        return false;\n    }\n    \n    let diff: number[] = [];\n    for (let i = 0; i < word1.length; i++) {\n        if (word1[i] !== word2[i]) {\n            diff.push(i);\n        }\n    }\n    \n    return diff.length === 2 && \n           word1[diff[0]] === word2[diff[1]] && \n           word1[diff[1]] === word2[diff[0]];\n}",
      PYTHON: "def solve(word1, word2):\n    if len(word1) != len(word2):\n        return False\n    \n    if word1 == word2:\n        return len(set(word1)) < len(word1)\n        \n    diff = [(a, b) for a, b in zip(word1, word2) if a != b]\n    return len(diff) == 2 and diff[0][0] == diff[1][1] and diff[0][1] == diff[1][0]",
      JAVA: "    static boolean solve(String word1, String word2) {\n        if (word1.length() != word2.length()) return false;\n        \n        if (word1.equals(word2)) {\n            int[] count = new int[26];\n            for (char c : word1.toCharArray()) {\n                count[c - 'a']++;\n                if (count[c - 'a'] > 1) return true;\n            }\n            return false;\n        }\n        \n        List<Integer> diff = new ArrayList<>();\n        for (int i = 0; i < word1.length(); i++) {\n            if (word1.charAt(i) != word2.charAt(i)) {\n                diff.add(i);\n            }\n        }\n        \n        if (diff.size() != 2) return false;\n        \n        int i = diff.get(0);\n        int j = diff.get(1);\n        \n        return word1.charAt(i) == word2.charAt(j) && word1.charAt(j) == word2.charAt(i);\n    }",
      CPP: "bool solve(string word1, string word2) {\n    if (word1.length() != word2.length()) return false;\n    \n    if (word1 == word2) {\n        vector<int> count(26, 0);\n        for (char c : word1) {\n            count[c - 'a']++;\n            if (count[c - 'a'] > 1) return true;\n        }\n        return false;\n    }\n    \n    vector<int> diff;\n    for (size_t i = 0; i < word1.length(); i++) {\n        if (word1[i] != word2[i]) {\n            diff.push_back(i);\n        }\n    }\n    \n    return diff.size() == 2 && \n           word1[diff[0]] == word2[diff[1]] && \n           word1[diff[1]] == word2[diff[0]];\n}",
      GO: "func solve(word1 string, word2 string) bool {\n    if len(word1) != len(word2) {\n        return false\n    }\n    \n    if word1 == word2 {\n        counts := make(map[byte]int)\n        for i := 0; i < len(word1); i++ {\n            counts[word1[i]]++\n            if counts[word1[i]] > 1 {\n                return true\n            }\n        }\n        return false\n    }\n    \n    diff1 := []byte{}\n    diff2 := []byte{}\n    for i := 0; i < len(word1); i++ {\n        if word1[i] != word2[i] {\n            diff1 = append(diff1, word1[i])\n            diff2 = append(diff2, word2[i])\n        }\n    }\n    \n    if len(diff1) != 2 {\n        return false\n    }\n    \n    return diff1[0] == diff2[1] && diff1[1] == diff2[0]\n}",
    },
    tests: [
      { stdin: "ab\nba", expectedStdout: "true", isSample: true },
      { stdin: "ab\nab", expectedStdout: "false", isSample: true },
      { stdin: "aa\naa", expectedStdout: "true" },
      { stdin: "abc\nbca", expectedStdout: "false" },
      { stdin: "a\na", expectedStdout: "false" },
      { stdin: "abcd\nabcde", expectedStdout: "false" },
      { stdin: "abcdef\nabcfed", expectedStdout: "true" },
      { stdin: "abcdef\nabcefd", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "reactor-status-display",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BACKTRACKING",
    title: "Reactor Status Display",
    patternTags: ["backtracking","bit-manipulation","enumeration","math"],
    signatureId: "fn:int->strings",
    avgSolveSeconds: 900,
    promptMarkdown: "A futuristic fusion reactor uses a minimalist LED panel to display its status. The panel has 4 LEDs for the core temperature level (0 to 11) and 6 LEDs for the plasma pressure level (0 to 59).\n\nEach LED represents a bit in binary (e.g., the temperature LEDs represent 8, 4, 2, 1). \nGiven an integer `n` representing the total number of LEDs currently lit on the panel, return a list of all possible valid status readings in the format \"Temperature:Pressure\".\n\nThe pressure must be zero-padded to two digits (e.g., \"5:09\", not \"5:9\"). The order of the output strings does not matter (the test suite will handle sorting if necessary, but you can output them in any order).\n\n**Constraints**\n- `0 <= n <= 10`\n\n**Example 1**\n```\ninput:\n0\noutput: 0:00\n```\nExplanation: Zero LEDs lit means the temperature is 0 and pressure is 0.\n\n**Example 2**\n```\ninput:\n1\noutput: 0:01 0:02 0:04 0:08 0:16 0:32 1:00 2:00 4:00 8:00\n```\nExplanation: Exactly one bit is set across the 10 LEDs.\n\n**Example 3**\n```\ninput:\n8\noutput: 7:59 11:31 11:47 11:55 11:59\n```\nExplanation: There are only 5 valid configurations with 8 LEDs lit. (e.g., 11 is 1011 in binary [3 bits] and 59 is 111011 in binary [5 bits], totaling 8 bits).\n\n**Follow-up:** Can you optimize this to avoid checking combinations that are impossible based on the requested number of bits?",
    editorialMarkdown: "## Bit Manipulation and Enumeration\n\nSince the total number of possible combinations is very small (12 possible temperature values and 60 possible pressure values, making 720 combinations in total), we can simply iterate through all valid configurations.\n\nFor each temperature `t` and pressure `p`, we count the number of set bits (1s) in their binary representations. If the sum of the set bits equals `n`, we format the combination as a string and add it to our result list.\n\nTime complexity is O(1) because the number of iterations is fixed at 720, regardless of the input. Space complexity is O(1) for the same reason (excluding the space required to hold the output).\n\nThe one trap most solvers hit is trying to use backtracking to place the set bits directly on the 10 available LED positions. While possible, it's significantly more complex and error-prone compared to simply generating all 720 valid states and filtering them.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n) {\n    let res = [];\n    const countBits = (num) => {\n        let count = 0;\n        while (num > 0) {\n            count += num & 1;\n            num >>= 1;\n        }\n        return count;\n    };\n    for (let t = 0; t < 12; t++) {\n        for (let p = 0; p < 60; p++) {\n            if (countBits(t) + countBits(p) === n) {\n                let pStr = p < 10 ? '0' + p : '' + p;\n                res.push(t + ':' + pStr);\n            }\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(n: number): string[] {\n    let res: string[] = [];\n    const countBits = (num: number): number => {\n        let count = 0;\n        while (num > 0) {\n            count += num & 1;\n            num >>= 1;\n        }\n        return count;\n    };\n    for (let t = 0; t < 12; t++) {\n        for (let p = 0; p < 60; p++) {\n            if (countBits(t) + countBits(p) === n) {\n                let pStr = p < 10 ? '0' + p : '' + p;\n                res.push(t + ':' + pStr);\n            }\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(n):\n    res = []\n    for t in range(12):\n        for p in range(60):\n            if t.bit_count() + p.bit_count() == n:\n                res.append(f\"{t}:{p:02d}\")\n    return res",
      JAVA: "    static String[] solve(int n) {\n        List<String> res = new ArrayList<>();\n        for (int t = 0; t < 12; t++) {\n            for (int p = 0; p < 60; p++) {\n                if (Integer.bitCount(t) + Integer.bitCount(p) == n) {\n                    res.add(t + \":\" + (p < 10 ? \"0\" + p : p));\n                }\n            }\n        }\n        return res.toArray(new String[0]);\n    }",
      CPP: "vector<string> solve(int n) {\n    vector<string> res;\n    for (int t = 0; t < 12; ++t) {\n        for (int p = 0; p < 60; ++p) {\n            if (__builtin_popcount(t) + __builtin_popcount(p) == n) {\n                string p_str = to_string(p);\n                if (p_str.length() == 1) p_str = \"0\" + p_str;\n                res.push_back(to_string(t) + \":\" + p_str);\n            }\n        }\n    }\n    return res;\n}",
      GO: "func solve(n int) []string {\n    res := make([]string, 0)\n    for t := 0; t < 12; t++ {\n        for p := 0; p < 60; p++ {\n            tBits := 0\n            for temp := t; temp > 0; temp >>= 1 {\n                tBits += temp & 1\n            }\n            pBits := 0\n            for temp := p; temp > 0; temp >>= 1 {\n                pBits += temp & 1\n            }\n            if tBits + pBits == n {\n                res = append(res, fmt.Sprintf(\"%d:%02d\", t, p))\n            }\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "0", expectedStdout: "0:00", isSample: true },
      { stdin: "1", expectedStdout: "0:01 0:02 0:04 0:08 0:16 0:32 1:00 2:00 4:00 8:00", isSample: true },
      { stdin: "8", expectedStdout: "7:31 7:47 7:55 7:59 11:31 11:47 11:55 11:59" },
      { stdin: "9", expectedStdout: "" },
      { stdin: "10", expectedStdout: "" },
      { stdin: "2", expectedStdout: "0:03 0:05 0:06 0:09 0:10 0:12 0:17 0:18 0:20 0:24 0:33 0:34 0:36 0:40 0:48 1:01 1:02 1:04 1:08 1:16 1:32 2:01 2:02 2:04 2:08 2:16 2:32 3:00 4:01 4:02 4:04 4:08 4:16 4:32 5:00 6:00 8:01 8:02 8:04 8:08 8:16 8:32 9:00 10:00" },
      { stdin: "7", expectedStdout: "3:31 3:47 3:55 3:59 5:31 5:47 5:55 5:59 6:31 6:47 6:55 6:59 7:15 7:23 7:27 7:29 7:30 7:39 7:43 7:45 7:46 7:51 7:53 7:54 7:57 7:58 9:31 9:47 9:55 9:59 10:31 10:47 10:55 10:59 11:15 11:23 11:27 11:29 11:30 11:39 11:43 11:45 11:46 11:51 11:53 11:54 11:57 11:58" },
      { stdin: "6", expectedStdout: "1:31 1:47 1:55 1:59 2:31 2:47 2:55 2:59 3:15 3:23 3:27 3:29 3:30 3:39 3:43 3:45 3:46 3:51 3:53 3:54 3:57 3:58 4:31 4:47 4:55 4:59 5:15 5:23 5:27 5:29 5:30 5:39 5:43 5:45 5:46 5:51 5:53 5:54 5:57 5:58 6:15 6:23 6:27 6:29 6:30 6:39 6:43 6:45 6:46 6:51 6:53 6:54 6:57 6:58 7:07 7:11 7:13 7:14 7:19 7:21 7:22 7:25 7:26 7:28 7:35 7:37 7:38 7:41 7:42 7:44 7:49 7:50 7:52 7:56 8:31 8:47 8:55 8:59 9:15 9:23 9:27 9:29 9:30 9:39 9:43 9:45 9:46 9:51 9:53 9:54 9:57 9:58 10:15 10:23 10:27 10:29 10:30 10:39 10:43 10:45 10:46 10:51 10:53 10:54 10:57 10:58 11:07 11:11 11:13 11:14 11:19 11:21 11:22 11:25 11:26 11:28 11:35 11:37 11:38 11:41 11:42 11:44 11:49 11:50 11:52 11:56" },
    ],
  }),

  p({
    ...base,
    slug: "combined-security-codes",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BIT_MANIPULATION",
    title: "Combined Security Codes",
    patternTags: ["array","arrays","bit-manipulation"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "You are upgrading the security protocol for a series of connected laser fences. Each fence has an integer security code given in the array `codes`.\n\nTo strengthen the perimeter, the system generates a combined security level for every pair of adjacent fences. The combined security level of two adjacent fences is the bitwise OR of their individual codes.\n\nReturn a new array containing the combined security levels of all adjacent pairs, in the same order.\n\n**Constraints**\n- `2 <= codes.length <= 40`\n- `0 <= codes[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 3\noutput: 3 3\n```\nExplanation: \n- 1 | 2 = 3\n- 2 | 3 = 3\n\n**Example 2**\n```\ninput:\n5 0 9\noutput: 5 9\n```\nExplanation: \n- 5 | 0 = 5\n- 0 | 9 = 9\n\n**Example 3**\n```\ninput:\n8 4 2 1\noutput: 12 6 3\n```\nExplanation: \n- 8 | 4 = 12\n- 4 | 2 = 6\n- 2 | 1 = 3\n\n**Follow-up:** Could you perform this operation in-place if you were allowed to modify the input array and truncate its length?",
    editorialMarkdown: "## Linear Scan with Bitwise OR\n\nThe task requires creating a new array where each element is the result of a bitwise OR operation between two adjacent elements from the original array. \n\nSince each element in the result corresponds to `codes[i] | codes[i+1]`, we can simply iterate through the array from the first element up to the second-to-last element, apply the OR operation, and store the result.\n\nTime complexity is O(N) where N is the length of the input array, as we process each pair of adjacent elements exactly once. Space complexity is O(1) (excluding the space required to return the output array), as we do not use any auxiliary data structures proportional to the input size.\n\nThe one trap most solvers hit is accidentally looping out of bounds by trying to access `codes[i+1]` when `i` is the last index of the array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(codes) {\n    let res = [];\n    for (let i = 0; i < codes.length - 1; i++) {\n        res.push(codes[i] | codes[i+1]);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(codes: number[]): number[] {\n    let res: number[] = [];\n    for (let i = 0; i < codes.length - 1; i++) {\n        res.push(codes[i] | codes[i+1]);\n    }\n    return res;\n}",
      PYTHON: "def solve(codes):\n    return [codes[i] | codes[i+1] for i in range(len(codes) - 1)]",
      JAVA: "    static int[] solve(int[] codes) {\n        int[] res = new int[codes.length - 1];\n        for (int i = 0; i < codes.length - 1; i++) {\n            res[i] = codes[i] | codes[i+1];\n        }\n        return res;\n    }",
      CPP: "vector<int> solve(vector<int> codes) {\n    vector<int> res;\n    for (size_t i = 0; i < codes.size() - 1; ++i) {\n        res.push_back(codes[i] | codes[i+1]);\n    }\n    return res;\n}",
      GO: "func solve(codes []int) []int {\n    res := make([]int, len(codes)-1)\n    for i := 0; i < len(codes)-1; i++ {\n        res[i] = codes[i] | codes[i+1]\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 3", expectedStdout: "3 3", isSample: true },
      { stdin: "5 0 9", expectedStdout: "5 9", isSample: true },
      { stdin: "8 4 2 1", expectedStdout: "12 6 3" },
      { stdin: "0 0", expectedStdout: "0" },
      { stdin: "10 5", expectedStdout: "15" },
      { stdin: "16 8 4 2 1 31", expectedStdout: "24 12 6 3 31" },
      { stdin: "1000 0 1000 0", expectedStdout: "1000 1000 1000" },
      { stdin: "8 4 12 2 15 0", expectedStdout: "12 12 14 15 15" },
    ],
  }),
];
