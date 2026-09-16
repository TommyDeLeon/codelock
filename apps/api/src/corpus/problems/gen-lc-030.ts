import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-030` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_030_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "count-balanced-instruction-sequences",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Count Balanced Instruction Sequences",
    patternTags: ["strings","counting","two-pointers"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are analyzing a robot's log of sequential movements, represented by a string `instructions` containing the characters `'L'` (left) and `'R'` (right). A movement sequence is considered a \"balanced instruction sequence\" if it consists of an equal number of consecutive `'L'`s followed by the same number of `'R'`s, or vice versa (e.g., `'LLRR'` or `'RL'`).\n\nGiven the string `instructions`, calculate the total number of balanced instruction sequences that occur as contiguous substrings.\n\n**Constraints**\n- `1 <= instructions.length <= 10^4`\n- `instructions` consists only of characters `'L'` and `'R'`.\n\n**Example 1**\n```\ninput:\nLLRR\noutput: 2\n```\nExplanation: The balanced substrings are \"LR\" and \"LLRR\".\n\n**Example 2**\n```\ninput:\nRL\noutput: 1\n```\nExplanation: The only balanced substring is \"RL\".\n\n**Example 3**\n```\ninput:\nLRLR\noutput: 3\n```\nExplanation: The balanced substrings are \"LR\", \"RL\", and \"LR\".\n\n**Follow-up:** Can you solve this in \\(\\mathcal{O}(N)\\) time and \\(\\mathcal{O}(1)\\) space?",
    editorialMarkdown: "## Count Balanced Instruction Sequences\n\nWe can solve this efficiently by counting the lengths of contiguous groups of identical characters. For example, the string `\"LLLRR\"` has groups of lengths `[3, 2]`. Between any two adjacent groups, the number of valid balanced substrings we can form is simply the minimum of their two lengths (in this case, `min(3, 2) = 2`, which corresponds to `\"LLRR\"` and `\"LR\"`).\n\nWe can perform a linear scan, keeping track of the length of the previous group and the current group. Whenever we transition to a new character, we add `min(prev_length, curr_length)` to our total.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N)\\) where \\(N\\) is the length of the string, as we only need a single pass.\n- **Space Complexity:** \\(\\mathcal{O}(1)\\) since we only need to store a few variables (or \\(\\mathcal{O}(N)\\) if an array is explicitly used to store group lengths).\n\n**Common Trap:**\nA common mistake is missing the final addition to the total count after the loop finishes, since the last group of characters doesn't trigger a \"transition\".",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    if (!s) return 0;\n    let groups = [];\n    let count = 1;\n    for (let i = 1; i < s.length; i++) {\n        if (s[i] === s[i-1]) count++;\n        else { groups.push(count); count = 1; }\n    }\n    groups.push(count);\n    let ans = 0;\n    for (let i = 1; i < groups.length; i++) {\n        ans += Math.min(groups[i-1], groups[i]);\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(s: string): number {\n    if (!s) return 0;\n    let groups: number[] = [];\n    let count = 1;\n    for (let i = 1; i < s.length; i++) {\n        if (s[i] === s[i-1]) count++;\n        else { groups.push(count); count = 1; }\n    }\n    groups.push(count);\n    let ans = 0;\n    for (let i = 1; i < groups.length; i++) {\n        ans += Math.min(groups[i-1], groups[i]);\n    }\n    return ans;\n}",
      PYTHON: "def solve(s):\n    if not s: return 0\n    groups = []\n    count = 1\n    for i in range(1, len(s)):\n        if s[i] == s[i-1]:\n            count += 1\n        else:\n            groups.append(count)\n            count = 1\n    groups.append(count)\n    return sum(min(groups[i-1], groups[i]) for i in range(1, len(groups)))",
      JAVA: "    static int solve(String s) {\n        if (s == null || s.isEmpty()) return 0;\n        java.util.List<Integer> groups = new java.util.ArrayList<>();\n        int count = 1;\n        for (int i = 1; i < s.length(); i++) {\n            if (s.charAt(i) == s.charAt(i-1)) count++;\n            else { groups.add(count); count = 1; }\n        }\n        groups.add(count);\n        int ans = 0;\n        for (int i = 1; i < groups.size(); i++) {\n            ans += Math.min(groups.get(i-1), groups.get(i));\n        }\n        return ans;\n    }",
      CPP: "int solve(string s) {\n    if (s.empty()) return 0;\n    vector<int> groups;\n    int count = 1;\n    for (int i = 1; i < s.length(); i++) {\n        if (s[i] == s[i-1]) count++;\n        else { groups.push_back(count); count = 1; }\n    }\n    groups.push_back(count);\n    int ans = 0;\n    for (int i = 1; i < groups.size(); i++) {\n        ans += min(groups[i-1], groups[i]);\n    }\n    return ans;\n}",
      GO: "func solve(s string) int {\n    if len(s) == 0 { return 0 }\n    groups := []int{}\n    count := 1\n    for i := 1; i < len(s); i++ {\n        if s[i] == s[i-1] {\n            count++\n        } else {\n            groups = append(groups, count)\n            count = 1\n        }\n    }\n    groups = append(groups, count)\n    ans := 0\n    for i := 1; i < len(groups); i++ {\n        m := groups[i-1]\n        if groups[i] < m {\n            m = groups[i]\n        }\n        ans += m\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "LLRR", expectedStdout: "2", isSample: true },
      { stdin: "RL", expectedStdout: "1", isSample: true },
      { stdin: "LRLR", expectedStdout: "3", isSample: true },
      { stdin: "L", expectedStdout: "0" },
      { stdin: "LLLL", expectedStdout: "0" },
      { stdin: "LLLRRR", expectedStdout: "3" },
      { stdin: "R", expectedStdout: "0" },
      { stdin: "LRLRLRLR", expectedStdout: "7" },
    ],
  }),

  p({
    ...base,
    slug: "count-data-separators",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Count Data Separators",
    patternTags: ["math","counting","intervals"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 420,
    promptMarkdown: "In a legacy logging system, data entries are assigned a numeric ID starting from `1` up to `N`. To make these IDs more readable when printed, a dash separator is inserted for every 3 digits from the right (e.g., `1000` is printed as `1-000`, and `1000000` is printed as `1-000-000`). \n\nGiven an integer `N`, determine the total number of dash separators used when printing all IDs from `1` to `N` inclusive.\n\n**Constraints**\n- `1 <= N <= 10^8`\n\n**Example 1**\n```\ninput:\n999\noutput: 0\n```\nExplanation: No separators are needed for numbers up to 3 digits long.\n\n**Example 2**\n```\ninput:\n1000\noutput: 1\n```\nExplanation: IDs 1 through 999 have 0 separators. The ID 1-000 has 1 separator. Total is 1.\n\n**Example 3**\n```\ninput:\n1001\noutput: 2\n```\nExplanation: Both 1-000 and 1-001 use 1 separator. Total is 2.\n\n**Follow-up:** Can you calculate the result mathematically in \\(\\mathcal{O}(1)\\) time instead of iterating through all numbers?",
    editorialMarkdown: "## Count Data Separators\n\nInstead of converting every number to a string and counting the separators (which would result in a Time Limit Exceeded error for large values of \\(N\\)), we can rely on a simple mathematical pattern.\n\nEvery number greater than or equal to `1000` requires at least one separator. Therefore, there are exactly `N - 999` numbers that contribute one separator. Similarly, every number greater than or equal to `1000000` contributes a second separator, adding `N - 999999` to the total count. This logic extends to billions as well. We can just sum these contributions.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(1)\\), because it only requires a few constant arithmetic checks.\n- **Space Complexity:** \\(\\mathcal{O}(1)\\), as we only track the running total.\n\n**Common Trap:**\nA common mistake is iterating from `1` to `N` with a loop, which is too slow for the upper constraint limit.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n) {\n    let ans = 0;\n    if (n >= 1000) ans += n - 999;\n    if (n >= 1000000) ans += n - 999999;\n    if (n >= 1000000000) ans += n - 999999999;\n    return ans;\n}",
      TYPESCRIPT: "function solve(n: number): number {\n    let ans = 0;\n    if (n >= 1000) ans += n - 999;\n    if (n >= 1000000) ans += n - 999999;\n    if (n >= 1000000000) ans += n - 999999999;\n    return ans;\n}",
      PYTHON: "def solve(n):\n    ans = 0\n    if n >= 1000: ans += n - 999\n    if n >= 1000000: ans += n - 999999\n    if n >= 1000000000: ans += n - 999999999\n    return ans",
      JAVA: "    static int solve(int n) {\n        int ans = 0;\n        if (n >= 1000) ans += n - 999;\n        if (n >= 1000000) ans += n - 999999;\n        if (n >= 1000000000) ans += n - 999999999;\n        return ans;\n    }",
      CPP: "int solve(int n) {\n    int ans = 0;\n    if (n >= 1000) ans += n - 999;\n    if (n >= 1000000) ans += n - 999999;\n    if (n >= 1000000000) ans += n - 999999999;\n    return ans;\n}",
      GO: "func solve(n int) int {\n    ans := 0\n    if n >= 1000 { ans += n - 999 }\n    if n >= 1000000 { ans += n - 999999 }\n    if n >= 1000000000 { ans += n - 999999999 }\n    return ans\n}",
    },
    tests: [
      { stdin: "999", expectedStdout: "0", isSample: true },
      { stdin: "1000", expectedStdout: "1", isSample: true },
      { stdin: "1001", expectedStdout: "2", isSample: true },
      { stdin: "1", expectedStdout: "0" },
      { stdin: "1234", expectedStdout: "235" },
      { stdin: "1000000", expectedStdout: "999002" },
      { stdin: "999999", expectedStdout: "999000" },
      { stdin: "10000000", expectedStdout: "18999002" },
    ],
  }),

  p({
    ...base,
    slug: "unique-shared-alien-species",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Unique Shared Alien Species",
    patternTags: ["strings","hash-map","counting"],
    signatureId: "fn:string,string->int",
    avgSolveSeconds: 600,
    promptMarkdown: "Two planetary observation stations have logged the species they've encountered. You are given two strings, `stationA` and `stationB`, where each string contains space-separated species names. \n\nReturn the number of species that were logged exactly once in `stationA` AND exactly once in `stationB`.\n\n**Constraints**\n- `0 <= stationA.length, stationB.length <= 10^4`\n- Words are separated by exactly one space, and there are no leading or trailing spaces.\n- Species names consist of lowercase English letters.\n\n**Example 1**\n```\ninput:\nzorg blat blat\nzorg blat\noutput: 1\n```\nExplanation: \"zorg\" appears exactly once in both logs. \"blat\" appears twice in stationA, so it is ignored.\n\n**Example 2**\n```\ninput:\na b c\nc d e\noutput: 1\n```\nExplanation: \"c\" is the only species that appears exactly once in both lists.\n\n**Example 3**\n```\ninput:\na a b\nb b\noutput: 0\n```\nExplanation: \"a\" appears twice in stationA, and \"b\" appears twice in stationB. There are no unique shared species.\n\n**Follow-up:** Can you solve this efficiently using hash maps?",
    editorialMarkdown: "## Unique Shared Alien Species\n\nWe can use hash maps to store the frequency of each species encountered by `stationA` and `stationB`. \n\nAfter populating both frequency maps, we can iterate through the keys of the first map. If a species has a count of exactly `1` in the first map, we check if it also has a count of exactly `1` in the second map. If so, we increment our answer.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N + M)\\) where \\(N\\) and \\(M\\) are the string lengths, to split the strings and build the hash maps.\n- **Space Complexity:** \\(\\mathcal{O}(N + M)\\) to store the species counts in memory.\n\n**Common Trap:**\nA common mistake is forgetting to check for empty strings, which could result in incorrectly counting an empty string `\"\"` as a valid species depending on the language's string-splitting behavior.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a, b) {\n    let ma = {}, mb = {};\n    if (a) a.split(' ').forEach(w => ma[w] = (ma[w] || 0) + 1);\n    if (b) b.split(' ').forEach(w => mb[w] = (mb[w] || 0) + 1);\n    let ans = 0;\n    for (let w in ma) {\n        if (ma[w] === 1 && mb[w] === 1) ans++;\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(a: string, b: string): number {\n    let ma: Record<string, number> = {}, mb: Record<string, number> = {};\n    if (a) a.split(' ').forEach(w => ma[w] = (ma[w] || 0) + 1);\n    if (b) b.split(' ').forEach(w => mb[w] = (mb[w] || 0) + 1);\n    let ans = 0;\n    for (let w in ma) {\n        if (ma[w] === 1 && mb[w] === 1) ans++;\n    }\n    return ans;\n}",
      PYTHON: "def solve(a, b):\n    from collections import Counter\n    count_a = Counter(a.split()) if a else {}\n    count_b = Counter(b.split()) if b else {}\n    res = 0\n    for word, count in count_a.items():\n        if count == 1 and count_b.get(word) == 1:\n            res += 1\n    return res",
      JAVA: "    static int solve(String a, String b) {\n        java.util.Map<String, Integer> ma = new java.util.HashMap<>();\n        java.util.Map<String, Integer> mb = new java.util.HashMap<>();\n        if (!a.isEmpty()) {\n            for (String w : a.split(\" \")) ma.put(w, ma.getOrDefault(w, 0) + 1);\n        }\n        if (!b.isEmpty()) {\n            for (String w : b.split(\" \")) mb.put(w, mb.getOrDefault(w, 0) + 1);\n        }\n        int ans = 0;\n        for (String w : ma.keySet()) {\n            if (ma.get(w) == 1 && mb.getOrDefault(w, 0) == 1) ans++;\n        }\n        return ans;\n    }",
      CPP: "int solve(string a, string b) {\n    auto countWords = [](string s) {\n        unordered_map<string, int> m;\n        string w = \"\";\n        for (char c : s) {\n            if (c == ' ') { if (w != \"\") m[w]++; w = \"\"; }\n            else w += c;\n        }\n        if (w != \"\") m[w]++;\n        return m;\n    };\n    auto ma = countWords(a);\n    auto mb = countWords(b);\n    int ans = 0;\n    for (auto p : ma) {\n        if (p.second == 1 && mb[p.first] == 1) ans++;\n    }\n    return ans;\n}",
      GO: "func solve(a string, b string) int {\n    ma := make(map[string]int)\n    mb := make(map[string]int)\n    if a != \"\" {\n        for _, w := range strings.Split(a, \" \") {\n            ma[w]++\n        }\n    }\n    if b != \"\" {\n        for _, w := range strings.Split(b, \" \") {\n            mb[w]++\n        }\n    }\n    ans := 0\n    for w, c := range ma {\n        if c == 1 && mb[w] == 1 {\n            ans++\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "zorg blat blat\nzorg blat", expectedStdout: "1", isSample: true },
      { stdin: "a b c\nc d e", expectedStdout: "1", isSample: true },
      { stdin: "a a b\nb b", expectedStdout: "0", isSample: true },
      { stdin: "\n", expectedStdout: "0" },
      { stdin: "x\nx", expectedStdout: "1" },
      { stdin: "x y z\na b c", expectedStdout: "0" },
      { stdin: "a b c d\nd c b a", expectedStdout: "4" },
      { stdin: "hello world\nworld hello hello", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "count-overlapping-work-days",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "INTERVALS",
    title: "Count Overlapping Work Days",
    patternTags: ["math","intervals","overlap"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 480,
    promptMarkdown: "Two contractors are hired for a project over a standard year. You are given an array of four integers, `[startA, endA, startB, endB]`, representing the start and end days (inclusive) for both Contractor A and Contractor B.\n\nCalculate the total number of days where both contractors are simultaneously working on the project.\n\n**Constraints**\n- The input array always contains exactly 4 integers.\n- `1 <= startA <= endA <= 365`\n- `1 <= startB <= endB <= 365`\n\n**Example 1**\n```\ninput:\n1 10 5 15\noutput: 6\n```\nExplanation: Both contractors are working from day 5 to day 10, which is exactly 6 days.\n\n**Example 2**\n```\ninput:\n1 5 6 10\noutput: 0\n```\nExplanation: The first contractor finishes on day 5, and the second starts on day 6. There is no overlap.\n\n**Example 3**\n```\ninput:\n5 5 5 5\noutput: 1\n```\nExplanation: Both contractors work only on day 5. The overlap is 1 day.\n\n**Follow-up:** Can you compute the intersection without using any loops or arrays?",
    editorialMarkdown: "## Count Overlapping Work Days\n\nWhen finding the overlap of two intervals `[start1, end1]` and `[start2, end2]`, the intersection is defined by the maximum of the start times and the minimum of the end times.\n\nSpecifically, `overlap_start = max(start1, start2)` and `overlap_end = min(end1, end2)`. The duration of the overlap is simply `overlap_end - overlap_start + 1`. If this difference is negative, it means the intervals do not overlap at all, so we can clamp the minimum result to `0`.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(1)\\), as the math requires only a few constant operations.\n- **Space Complexity:** \\(\\mathcal{O}(1)\\), as no extra memory is needed.\n\n**Common Trap:**\nA common mistake is using a loop and a boolean array of size 365 to simulate the days. While this works given the small constraints, it's unnecessary and misses the elegant \\(\\mathcal{O}(1)\\) interval logic.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    if (!a || a.length !== 4) return 0;\n    let overlap_start = Math.max(a[0], a[2]);\n    let overlap_end = Math.min(a[1], a[3]);\n    return Math.max(0, overlap_end - overlap_start + 1);\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    if (!a || a.length !== 4) return 0;\n    let overlap_start = Math.max(a[0], a[2]);\n    let overlap_end = Math.min(a[1], a[3]);\n    return Math.max(0, overlap_end - overlap_start + 1);\n}",
      PYTHON: "def solve(a):\n    if not a or len(a) != 4: return 0\n    overlap_start = max(a[0], a[2])\n    overlap_end = min(a[1], a[3])\n    return max(0, overlap_end - overlap_start + 1)",
      JAVA: "    static int solve(int[] a) {\n        if (a == null || a.length != 4) return 0;\n        int overlap_start = Math.max(a[0], a[2]);\n        int overlap_end = Math.min(a[1], a[3]);\n        return Math.max(0, overlap_end - overlap_start + 1);\n    }",
      CPP: "int solve(vector<int> a) {\n    if (a.size() != 4) return 0;\n    int overlap_start = max(a[0], a[2]);\n    int overlap_end = min(a[1], a[3]);\n    return max(0, overlap_end - overlap_start + 1);\n}",
      GO: "func solve(a []int) int {\n    if len(a) != 4 { return 0 }\n    s := a[0]\n    if a[2] > s { s = a[2] }\n    e := a[1]\n    if a[3] < e { e = a[3] }\n    ans := e - s + 1\n    if ans < 0 { ans = 0 }\n    return ans\n}",
    },
    tests: [
      { stdin: "1 10 5 15", expectedStdout: "6", isSample: true },
      { stdin: "1 5 6 10", expectedStdout: "0", isSample: true },
      { stdin: "5 5 5 5", expectedStdout: "1", isSample: true },
      { stdin: "10 20 5 15", expectedStdout: "6" },
      { stdin: "1 365 1 365", expectedStdout: "365" },
      { stdin: "100 200 150 160", expectedStdout: "11" },
      { stdin: "100 200 201 300", expectedStdout: "0" },
      { stdin: "50 60 40 50", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "detect-primary-signal",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Absolute Victory",
    patternTags: ["array","maximum","linear-scan"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 480,
    promptMarkdown: "You are given an array of integers `scores` representing the final scores of players in an arcade tournament. A player achieves an \"absolute victory\" if their score is at least twice as large as the score of every other player.\n\nIf a player achieves an absolute victory, return their 0-based index. Otherwise, return `-1`.\n\n**Constraints**\n- `1 <= scores.length <= 1000`\n- `0 <= scores[i] <= 10000`\n\n**Example 1**\n```\ninput:\n3 6 1 0\noutput: 1\n```\nExplanation: The maximum score is `6`, which is at least twice the second-highest score of `3`. The player with score `6` is at index `1`.\n\n**Example 2**\n```\ninput:\n1 2 3 4\noutput: -1\n```\nExplanation: The maximum score is `4`. Since `4` is less than twice the second-highest score of `3`, no absolute victory is achieved.\n\n**Example 3**\n```\ninput:\n1\noutput: 0\n```\nExplanation: There is only one player, so they achieve an absolute victory by default since there are no other scores to compare against.\n\n**Follow-up:** Can you find the index of the absolute victor with exactly one pass through the `scores` array?",
    editorialMarkdown: "## Detect Primary Signal\n\nTo determine if the largest element is at least twice as large as the rest, we only need to compare it against the *second largest* element. If the maximum is at least double the second maximum, it is inherently at least double all the smaller elements as well.\n\nWe can achieve this in a single pass by maintaining two variables: `max1` for the largest value seen so far (along with its index), and `max2` for the second largest value.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N)\\) to scan the array once.\n- **Space Complexity:** \\(\\mathcal{O}(1)\\), as we only need a few variables.\n\n**Common Trap:**\nA common mistake is initializing the maximum values to `0` and improperly updating them when duplicate maximum values exist (e.g., `[5, 5]`), leading to incorrect conclusions about the second maximum.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    if (!a || a.length === 0) return -1;\n    if (a.length === 1) return 0;\n    let mx1 = -1, mx2 = -1, idx = -1;\n    for (let i = 0; i < a.length; i++) {\n        if (a[i] > mx1) {\n            mx2 = mx1;\n            mx1 = a[i];\n            idx = i;\n        } else if (a[i] > mx2) {\n            mx2 = a[i];\n        }\n    }\n    if (mx1 >= 2 * mx2) return idx;\n    return -1;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    if (!a || a.length === 0) return -1;\n    if (a.length === 1) return 0;\n    let mx1 = -1, mx2 = -1, idx = -1;\n    for (let i = 0; i < a.length; i++) {\n        if (a[i] > mx1) {\n            mx2 = mx1;\n            mx1 = a[i];\n            idx = i;\n        } else if (a[i] > mx2) {\n            mx2 = a[i];\n        }\n    }\n    if (mx1 >= 2 * mx2) return idx;\n    return -1;\n}",
      PYTHON: "def solve(a):\n    if not a: return -1\n    if len(a) == 1: return 0\n    mx1, mx2, idx = -1, -1, -1\n    for i, val in enumerate(a):\n        if val > mx1:\n            mx2 = mx1\n            mx1 = val\n            idx = i\n        elif val > mx2:\n            mx2 = val\n    if mx1 >= 2 * mx2:\n        return idx\n    return -1",
      JAVA: "    static int solve(int[] a) {\n        if (a == null || a.length == 0) return -1;\n        if (a.length == 1) return 0;\n        int mx1 = -1, mx2 = -1, idx = -1;\n        for (int i = 0; i < a.length; i++) {\n            if (a[i] > mx1) {\n                mx2 = mx1;\n                mx1 = a[i];\n                idx = i;\n            } else if (a[i] > mx2) {\n                mx2 = a[i];\n            }\n        }\n        if (mx1 >= 2 * mx2) return idx;\n        return -1;\n    }",
      CPP: "int solve(vector<int> a) {\n    if (a.empty()) return -1;\n    if (a.size() == 1) return 0;\n    int mx1 = -1, mx2 = -1, idx = -1;\n    for (int i = 0; i < a.size(); i++) {\n        if (a[i] > mx1) {\n            mx2 = mx1;\n            mx1 = a[i];\n            idx = i;\n        } else if (a[i] > mx2) {\n            mx2 = a[i];\n        }\n    }\n    if (mx1 >= 2 * mx2) return idx;\n    return -1;\n}",
      GO: "func solve(a []int) int {\n    if len(a) == 0 { return -1 }\n    if len(a) == 1 { return 0 }\n    mx1, mx2, idx := -1, -1, -1\n    for i, val := range a {\n        if val > mx1 {\n            mx2 = mx1\n            mx1 = val\n            idx = i\n        } else if val > mx2 {\n            mx2 = val\n        }\n    }\n    if mx1 >= 2 * mx2 {\n        return idx\n    }\n    return -1\n}",
    },
    tests: [
      { stdin: "3 6 1 0", expectedStdout: "1", isSample: true },
      { stdin: "1 2 3 4", expectedStdout: "-1", isSample: true },
      { stdin: "1", expectedStdout: "0", isSample: true },
      { stdin: "5 10 5", expectedStdout: "1" },
      { stdin: "10 20 30 60", expectedStdout: "3" },
      { stdin: "100 50 25 12", expectedStdout: "0" },
      { stdin: "2 2", expectedStdout: "-1" },
      { stdin: "10 10 10", expectedStdout: "-1" },
    ],
  }),
];
