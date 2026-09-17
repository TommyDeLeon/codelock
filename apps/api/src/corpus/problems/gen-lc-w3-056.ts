import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w3-056` (anchored to a public problem index; metadata only).
 *
 * Drafted with claude-sonnet-4-6 on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W3_056_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "first-shared-symbol-two-ends",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Earliest Collision in a Dual-Messenger Relay",
    patternTags: ["two-pointers","hash-set","strings","early-exit"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 360,
    promptMarkdown: "Two couriers set off from opposite ends of a coded message, each carrying a growing logbook of the letters they have seen. The left courier starts at index `0` and moves right; the right courier starts at index `len(s) - 1` and moves left. They advance in lockstep.\n\nAt every step, the left courier first checks their own letter against the **right courier's logbook**: if it already appears there, that letter is immediately reported as the collision. Otherwise the left courier records the letter in their own logbook. Then the right courier checks their letter against the **left courier's updated logbook**: if it already appears there, that letter is immediately reported. Otherwise the right courier records it.\n\nReturn the collision letter as a single-character string, or `\"\"` if the couriers exhaust the string without a collision.\n\n**Constraints**\n- `1 <= s.length <= 1000`\n- `s` consists of lowercase English letters only.\n\n**Example 1**\n```\ninput:\nabcbda\noutput:\na\n```\n*Explanation: On the very first step the left courier holds `'a'` and checks it against the right courier's logbook (empty) — no match, so `'a'` is added to the left logbook. The right courier holds `'a'` and checks it against the left logbook — `'a'` is already there, so `'a'` is returned immediately.*\n\n**Example 2**\n```\ninput:\nxyzwvu\noutput:\n\n```\n*Explanation: Every character is distinct and no letter ever appears in both couriers' logbooks, so the relay ends with no collision.*\n\n**Example 3**\n```\ninput:\naabbcc\noutput:\nb\n```\n*Explanation: After two steps the left logbook is `{a}` and the right logbook is `{c}`. On step 3 the left courier picks up `'b'` (not in the right logbook, so it is added to the left logbook making it `{a,b}`). The right courier picks up `'b'`, which is now in the left logbook, so `'b'` is returned.*\n\n**Follow-up**\nCan you solve this in O(n) time and O(1) space using a 26-bit integer as a bitmask instead of two sets?",
    editorialMarkdown: "## First Shared Symbol From Both Ends\n\nUse **two pointers** starting at `left=0` and `right=len(s)-1`, moving inward. Maintain two sets. At each step, first check if `s[left]` is in the right set (or `s[right]` is in the left set) before inserting. Insert both, advance, and repeat.\n\nProcess both characters at the same step: add `s[left]` to the left set and check if it's in the right set; add `s[right]` to the right set and check if it's in the left set. Return the first match found.\n\n**Pattern**: Two Pointers — converging scan with auxiliary sets.\n\n**Trap**: Processing left and right in sequence within the same step matters. If you check left first, then when left and right land on the same character in the same step, the left character is added first and the right character then matches it — that's valid.\n\n**Complexity**\n- **Time**: O(n)\n- **Space**: O(1) — at most 26 distinct characters",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    const left = new Set(), right = new Set();\n    let i = 0, j = s.length - 1;\n    while (i <= j) {\n        const lc = s[i], rc = s[j];\n        if (right.has(lc)) return lc;\n        left.add(lc);\n        if (left.has(rc)) return rc;\n        right.add(rc);\n        i++; j--;\n    }\n    return '';\n}",
      TYPESCRIPT: "function solve(s: string): string {\n    const left = new Set<string>(), right = new Set<string>();\n    let i = 0, j = s.length - 1;\n    while (i <= j) {\n        const lc = s[i], rc = s[j];\n        if (right.has(lc)) return lc;\n        left.add(lc);\n        if (left.has(rc)) return rc;\n        right.add(rc);\n        i++; j--;\n    }\n    return '';\n}",
      PYTHON: "def solve(s):\n    left, right = set(), set()\n    i, j = 0, len(s) - 1\n    while i <= j:\n        lc, rc = s[i], s[j]\n        if lc in right:\n            return lc\n        left.add(lc)\n        if rc in left:\n            return rc\n        right.add(rc)\n        i += 1\n        j -= 1\n    return ''",
      JAVA: "    static String solve(String s) {\n        java.util.Set<Character> left = new java.util.HashSet<>();\n        java.util.Set<Character> right = new java.util.HashSet<>();\n        int i = 0, j = s.length() - 1;\n        while (i <= j) {\n            char lc = s.charAt(i), rc = s.charAt(j);\n            if (right.contains(lc)) return String.valueOf(lc);\n            left.add(lc);\n            if (left.contains(rc)) return String.valueOf(rc);\n            right.add(rc);\n            i++; j--;\n        }\n        return \"\";\n    }",
      CPP: "string solve(string s) {\n    bool left[26] = {}, right[26] = {};\n    int i = 0, j = (int)s.size() - 1;\n    while (i <= j) {\n        int lc = s[i] - 'a', rc = s[j] - 'a';\n        if (right[lc]) return string(1, s[i]);\n        left[lc] = true;\n        if (left[rc]) return string(1, s[j]);\n        right[rc] = true;\n        i++; j--;\n    }\n    return \"\";\n}",
      GO: "func solve(s string) string {\n    var left, right [26]bool\n    i, j := 0, len(s)-1\n    for i <= j {\n        lc := s[i] - 'a'\n        rc := s[j] - 'a'\n        if right[lc] {\n            return string(s[i])\n        }\n        left[lc] = true\n        if left[rc] {\n            return string(s[j])\n        }\n        right[rc] = true\n        i++\n        j--\n    }\n    return \"\"\n}",
    },
    tests: [
      { stdin: "abcbda", expectedStdout: "a", isSample: true },
      { stdin: "xyzwvu", expectedStdout: "", isSample: true },
      { stdin: "aabbcc", expectedStdout: "b" },
      { stdin: "a", expectedStdout: "a" },
      { stdin: "ab", expectedStdout: "" },
      { stdin: "aa", expectedStdout: "a" },
      { stdin: "abcdef", expectedStdout: "" },
      { stdin: "abcfedcba", expectedStdout: "a" },
    ],
  }),

  p({
    ...base,
    slug: "trending-topic-hashtag",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Trending Topic Hashtag",
    patternTags: ["strings","case-conversion","concatenation","parsing"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 360,
    promptMarkdown: "A social media platform auto-generates a hashtag from a post's title to help users discover trending content.\n\nGiven a string `title` (a sequence of words separated by single spaces), generate the hashtag by:\n1. Prepending `'#'`.\n2. Capitalizing the first letter of each word.\n3. Removing all spaces.\n\nIf the resulting hashtag (excluding the `'#'`) would be empty, return `\"Invalid\"`.\n\n**Constraints**\n- `0 <= title.length <= 500`\n- `title` contains only lowercase English letters and spaces.\n- Words are separated by single spaces; `title` may be empty or consist of spaces only.\n\n**Example 1**\n```\ninput:\nbreaking news today\noutput:\n#BreakingNewsToday\n```\n*Explanation: Each word is capitalized and concatenated after '#'.*\n\n**Example 2**\n```\ninput:\nlearn to code\noutput:\n#LearnToCode\n```\n*Explanation: Three words, each capitalized.*\n\n**Example 3**\n```\ninput:\n\noutput:\nInvalid\n```\n*Explanation: Empty title produces no words, so the result is \"Invalid\".*\n\n**Follow-up**\nCan you handle this in a single pass over the characters in O(n) time without splitting into an array?",
    editorialMarkdown: "## Trending Topic Hashtag\n\nSplit the title on spaces, filter out empty tokens (in case of leading/trailing spaces), capitalize each word's first character, concatenate them, and prepend `'#'`. If the word list is empty after filtering, return `\"Invalid\"`.\n\n**Pattern**: String manipulation — tokenization, case conversion, and concatenation.\n\n**Trap**: Failing to handle the empty or all-spaces input (return `\"Invalid\"`). Also forgetting that `title` is guaranteed to have only lowercase letters, so only the first character of each word needs uppercasing.\n\n**Complexity**\n- **Time**: O(n) where n is the length of the title\n- **Space**: O(n) for the output string",
    referenceSolution: {
      JAVASCRIPT: "function solve(title) {\n    const words = title.split(' ').filter(w => w.length > 0);\n    if (words.length === 0) return 'Invalid';\n    return '#' + words.map(w => w[0].toUpperCase() + w.slice(1)).join('');\n}",
      TYPESCRIPT: "function solve(title: string): string {\n    const words = title.split(' ').filter(w => w.length > 0);\n    if (words.length === 0) return 'Invalid';\n    return '#' + words.map(w => w[0].toUpperCase() + w.slice(1)).join('');\n}",
      PYTHON: "def solve(title):\n    words = [w for w in title.split(' ') if w]\n    if not words:\n        return 'Invalid'\n    return '#' + ''.join(w[0].upper() + w[1:] for w in words)",
      JAVA: "    static String solve(String title) {\n        String[] parts = title.split(\" \");\n        StringBuilder sb = new StringBuilder(\"#\");\n        for (String w : parts) {\n            if (!w.isEmpty()) {\n                sb.append(Character.toUpperCase(w.charAt(0)));\n                sb.append(w.substring(1));\n            }\n        }\n        if (sb.length() == 1) return \"Invalid\";\n        return sb.toString();\n    }",
      CPP: "string solve(string title) {\n    string res = \"#\";\n    bool newWord = true;\n    for (char c : title) {\n        if (c == ' ') { newWord = true; continue; }\n        if (newWord) { res += (char)toupper(c); newWord = false; }\n        else res += c;\n    }\n    if (res == \"#\") return \"Invalid\";\n    return res;\n}",
      GO: "func solve(title string) string {\n    res := \"#\"\n    newWord := true\n    for i := 0; i < len(title); i++ {\n        c := title[i]\n        if c == ' ' {\n            newWord = true\n            continue\n        }\n        if newWord {\n            if c >= 'a' && c <= 'z' {\n                c = c - 'a' + 'A'\n            }\n            newWord = false\n        }\n        res += string(c)\n    }\n    if res == \"#\" {\n        return \"Invalid\"\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "breaking news today", expectedStdout: "#BreakingNewsToday", isSample: true },
      { stdin: "learn to code", expectedStdout: "#LearnToCode", isSample: true },
      { stdin: "", expectedStdout: "Invalid" },
      { stdin: "hello", expectedStdout: "#Hello" },
      { stdin: "a b c", expectedStdout: "#ABC" },
      { stdin: "one two three four five", expectedStdout: "#OneTwoThreeFourFive" },
      { stdin: "go lang is great", expectedStdout: "#GoLangIsGreat" },
      { stdin: "x", expectedStdout: "#X" },
    ],
  }),

  p({
    ...base,
    slug: "three-digit-product-codes",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Three-Digit Product Codes",
    patternTags: ["enumeration","digits","counting","hash-set"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 500,
    promptMarkdown: "A factory assigns **product codes** that are exactly 3-digit integers (from 100 to 999 inclusive) divisible by 7. A product code is considered **formable** if each of its digits can be found among the digits of a given supply list (with repetition allowed only as many times as the digit appears in the supply list).\n\nGiven an integer array `supply` of single-digit values (0–9), return a **sorted** list of all distinct formable 3-digit product codes.\n\n**Constraints**\n- `3 <= supply.length <= 200`\n- `0 <= supply[i] <= 9`\n\n**Example 1**\n```\ninput:\n1 0 7 7\noutput:\n707 770\n```\n*Explanation: Supply digit counts: 0→1, 1→1, 7→2. 707 needs 7×2, 0×1 — fits. 770 needs 7×2, 0×1 — fits. 700 needs 7×1, 0×2 — only one 0 available, not formable.*\n\n**Example 2**\n```\ninput:\n1 2 3\noutput:\n231\n```\n*Explanation: Only 231 among all digit-permutations of {1,2,3} is divisible by 7.*\n\n**Example 3**\n```\ninput:\n0 0 0\noutput:\n\n```\n*Explanation: All formable numbers would start with 0 (not a valid 3-digit number) or be 000, which is not in [100,999]. No valid codes.*\n\n**Follow-up**\nCan you enumerate only the candidates divisible by 7 in [100,999] and check each in O(1) using digit frequency counts?",
    editorialMarkdown: "## Three-Digit Product Codes\n\nThe key insight is that there are only 128 multiples of 7 in [100, 999]. Instead of generating all permutations, iterate over candidates `c` from 105 to 999 step 7, decompose each into its three digits, count how many of each digit the candidate needs, and check if the supply array has enough of each.\n\n**Pattern**: Enumeration + frequency counting (Arrays & Hashing).\n\n**Trap**: Trying to generate all permutations of supply digits and filtering — that blows up when supply is large. The smarter direction is to enumerate the (small) candidate set and check against supply.\n\n**Complexity**\n- **Time**: O(|supply| + 128 × 10) = O(|supply|)\n- **Space**: O(10) = O(1) beyond input",
    referenceSolution: {
      JAVASCRIPT: "function solve(supply) {\n    const freq = new Array(10).fill(0);\n    for (const d of supply) freq[d]++;\n    const res = [];\n    for (let c = 105; c <= 999; c += 7) {\n        const d = [Math.floor(c / 100), Math.floor(c / 10) % 10, c % 10];\n        const need = new Array(10).fill(0);\n        for (const x of d) need[x]++;\n        let ok = true;\n        for (let i = 0; i < 10; i++) if (need[i] > freq[i]) { ok = false; break; }\n        if (ok) res.push(c);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(supply: number[]): number[] {\n    const freq = new Array(10).fill(0);\n    for (const d of supply) freq[d]++;\n    const res: number[] = [];\n    for (let c = 105; c <= 999; c += 7) {\n        const d = [Math.floor(c / 100), Math.floor(c / 10) % 10, c % 10];\n        const need = new Array(10).fill(0);\n        for (const x of d) need[x]++;\n        let ok = true;\n        for (let i = 0; i < 10; i++) if (need[i] > freq[i]) { ok = false; break; }\n        if (ok) res.push(c);\n    }\n    return res;\n}",
      PYTHON: "def solve(supply):\n    from collections import Counter\n    freq = Counter(supply)\n    res = []\n    for c in range(105, 1000, 7):\n        need = Counter([c // 100, (c // 10) % 10, c % 10])\n        if all(need[d] <= freq[d] for d in need):\n            res.append(c)\n    return res",
      JAVA: "    static int[] solve(int[] supply) {\n        int[] freq = new int[10];\n        for (int d : supply) freq[d]++;\n        java.util.List<Integer> res = new java.util.ArrayList<>();\n        for (int c = 105; c <= 999; c += 7) {\n            int[] need = new int[10];\n            need[c / 100]++;\n            need[(c / 10) % 10]++;\n            need[c % 10]++;\n            boolean ok = true;\n            for (int i = 0; i < 10; i++) if (need[i] > freq[i]) { ok = false; break; }\n            if (ok) res.add(c);\n        }\n        return res.stream().mapToInt(Integer::intValue).toArray();\n    }",
      CPP: "vector<int> solve(vector<int> supply) {\n    int freq[10] = {};\n    for (int d : supply) freq[d]++;\n    vector<int> res;\n    for (int c = 105; c <= 999; c += 7) {\n        int need[10] = {};\n        need[c / 100]++;\n        need[(c / 10) % 10]++;\n        need[c % 10]++;\n        bool ok = true;\n        for (int i = 0; i < 10; i++) if (need[i] > freq[i]) { ok = false; break; }\n        if (ok) res.push_back(c);\n    }\n    return res;\n}",
      GO: "func solve(supply []int) []int {\n    var freq [10]int\n    for _, d := range supply {\n        freq[d]++\n    }\n    var res []int\n    for c := 105; c <= 999; c += 7 {\n        var need [10]int\n        need[c/100]++\n        need[(c/10)%10]++\n        need[c%10]++\n        ok := true\n        for i := 0; i < 10; i++ {\n            if need[i] > freq[i] {\n                ok = false\n                break\n            }\n        }\n        if ok {\n            res = append(res, c)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 0 7 7", expectedStdout: "707 770", isSample: true },
      { stdin: "1 2 3", expectedStdout: "231", isSample: true },
      { stdin: "0 0 0", expectedStdout: "" },
      { stdin: "7 7 7", expectedStdout: "777" },
      { stdin: "1 1 1", expectedStdout: "" },
      { stdin: "0 1 2 3 4 5 6 7 8 9", expectedStdout: "105 126 140 147 154 168 175 182 189 196 203 210 217 231 238 245 259 273 280 287 294 301 308 315 329 350 357 364 371 378 385 392 406 413 420 427 462 469 476 483 490 497 504 518 532 539 546 560 567 574 581 602 609 623 630 637 651 658 672 679 693 714 721 728 735 742 749 756 763 784 791 798 805 812 819 826 840 847 854 861 875 896 903 910 917 924 931 938 945 952 973 980 987" },
      { stdin: "5 5 5", expectedStdout: "" },
      { stdin: "2 2 4 4", expectedStdout: "224" },
    ],
  }),

  p({
    ...base,
    slug: "light-switch-toggles",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Domino Pair Deactivations",
    patternTags: ["strings","enumeration","simulation","adjacent-pairs"],
    signatureId: "fn:string->strings",
    avgSolveSeconds: 360,
    promptMarkdown: "A row of dominoes is standing upright or lying flat, represented by a binary string `row` where `'1'` means upright and `'0'` means flat.\n\nIn one action you may choose any two **adjacent** dominoes that are both upright (`'1'`) and tip them both so they lie flat (`'0'`). Every such action produces a new row configuration.\n\nReturn a list of all **distinct** row configurations reachable by performing exactly **one** such action. If no adjacent upright pair exists, return an empty list. The configurations may appear in any order.\n\n**Constraints**\n- `1 <= row.length <= 60`\n- `row[i]` is `'0'` or `'1'`.\n\n**Example 1**\n```\ninput:\n01100\noutput:\n00000\n```\n*Explanation: Only positions (1, 2) form an adjacent upright pair. Tipping them both flat gives `\"00000\"`.*\n\n**Example 2**\n```\ninput:\n1111\noutput:\n0011 1001 1100\n```\n*Explanation: Adjacent upright pairs exist at (0,1), (1,2), and (2,3). Tipping each pair independently yields three distinct configurations: `\"0011\"`, `\"1001\"`, and `\"1100\"`.*\n\n**Example 3**\n```\ninput:\n0000\noutput:\n\n```\n*Explanation: No two adjacent dominoes are upright, so no action is possible and the result is empty.*\n\n**Follow-up**\nCan you do this in O(n²) worst case and O(n) per move by building each candidate with a single string mutation?",
    editorialMarkdown: "## Light Switch Toggles\n\nScan the string for every adjacent pair where `panel[i] == '1'` and `panel[i+1] == '1'`. For each such pair, construct the resulting state by flipping those two positions to `'0'`. Collect results in a set to avoid duplicates (though with distinct character changes the results are usually distinct already).\n\n**Pattern**: Enumeration of adjacent pairs — the same technique as the Flip Game problem.\n\n**Trap**: Forgetting to use a set/dedup step. If the same result can be produced by two different moves (e.g., a string of four 1s), the output should only include it once. Also make sure to handle the case where no valid pair exists and return an empty list.\n\n**Complexity**\n- **Time**: O(n²) — at most O(n) moves each generating an O(n) string\n- **Space**: O(n²) for storing results",
    referenceSolution: {
      JAVASCRIPT: "function solve(panel) {\n    const seen = new Set();\n    const res = [];\n    for (let i = 0; i + 1 < panel.length; i++) {\n        if (panel[i] === '1' && panel[i + 1] === '1') {\n            const s = panel.slice(0, i) + '00' + panel.slice(i + 2);\n            if (!seen.has(s)) { seen.add(s); res.push(s); }\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(panel: string): string[] {\n    const seen = new Set<string>();\n    const res: string[] = [];\n    for (let i = 0; i + 1 < panel.length; i++) {\n        if (panel[i] === '1' && panel[i + 1] === '1') {\n            const s = panel.slice(0, i) + '00' + panel.slice(i + 2);\n            if (!seen.has(s)) { seen.add(s); res.push(s); }\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(panel):\n    seen = set()\n    res = []\n    for i in range(len(panel) - 1):\n        if panel[i] == '1' and panel[i+1] == '1':\n            s = panel[:i] + '00' + panel[i+2:]\n            if s not in seen:\n                seen.add(s)\n                res.append(s)\n    return res",
      JAVA: "    static String[] solve(String panel) {\n        java.util.LinkedHashSet<String> seen = new java.util.LinkedHashSet<>();\n        for (int i = 0; i + 1 < panel.length(); i++) {\n            if (panel.charAt(i) == '1' && panel.charAt(i + 1) == '1') {\n                String s = panel.substring(0, i) + \"00\" + panel.substring(i + 2);\n                seen.add(s);\n            }\n        }\n        return seen.toArray(new String[0]);\n    }",
      CPP: "vector<string> solve(string panel) {\n    vector<string> res;\n    unordered_set<string> seen;\n    for (int i = 0; i + 1 < (int)panel.size(); i++) {\n        if (panel[i] == '1' && panel[i+1] == '1') {\n            string s = panel;\n            s[i] = s[i+1] = '0';\n            if (!seen.count(s)) { seen.insert(s); res.push_back(s); }\n        }\n    }\n    return res;\n}",
      GO: "func solve(panel string) []string {\n    seen := make(map[string]bool)\n    var res []string\n    bs := []byte(panel)\n    for i := 0; i+1 < len(bs); i++ {\n        if bs[i] == '1' && bs[i+1] == '1' {\n            bs[i] = '0'\n            bs[i+1] = '0'\n            s := string(bs)\n            if !seen[s] {\n                seen[s] = true\n                res = append(res, s)\n            }\n            bs[i] = '1'\n            bs[i+1] = '1'\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "01100", expectedStdout: "00000", isSample: true },
      { stdin: "1111", expectedStdout: "0011 1001 1100", isSample: true },
      { stdin: "0000", expectedStdout: "" },
      { stdin: "1", expectedStdout: "" },
      { stdin: "11", expectedStdout: "00" },
      { stdin: "10", expectedStdout: "" },
      { stdin: "110110", expectedStdout: "000110 110000" },
      { stdin: "111", expectedStdout: "001 100" },
    ],
  }),
];
