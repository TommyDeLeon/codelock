import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w1-053` (anchored to a public problem index; metadata only).
 *
 * Drafted with claude-sonnet-4-6 on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W1_053_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "exclusive-catalog-entries",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Exclusive Catalog Entries",
    patternTags: ["hash-set","set-difference","arrays","distinct-values"],
    signatureId: "fn:ints,ints->ints",
    avgSolveSeconds: 420,
    promptMarkdown: "Two bookstores each have a catalog of book IDs. Given `catalog1` and `catalog2`, return a list of two space-separated groups:\n- Group 1: distinct IDs in `catalog1` that are **not** in `catalog2`, sorted ascending.\n- Group 2: distinct IDs in `catalog2` that are **not** in `catalog1`, sorted ascending.\n\nOutput both groups on one line: first all IDs exclusive to catalog1 (ascending), followed by all IDs exclusive to catalog2 (ascending). If a group is empty, it contributes nothing to the output.\n\n**Constraints**\n- `1 <= catalog1.length, catalog2.length <= 1000`\n- `1 <= catalog1[i], catalog2[i] <= 10^6`\n- Elements within each catalog may repeat.\n\n**Example 1**\n```\ninput:\n1 2 3 4\n3 4 5 6\noutput: 1 2 5 6\n```\n*Explanation: 1 and 2 are only in catalog1; 5 and 6 are only in catalog2.*\n\n**Example 2**\n```\ninput:\n7 8\n7 8 9\noutput: 9\n```\n*Explanation: catalog1 has no exclusive IDs; catalog2 exclusively has 9.*\n\n**Example 3**\n```\ninput:\n10 20 30\n40 50\noutput: 10 20 30 40 50\n```\n*Explanation: No IDs are shared, so all appear in the output.*\n\n**Follow-up**\nCan you compute both exclusive sets in a single pass over each catalog?",
    editorialMarkdown: "## Exclusive Catalog Entries\n\nBuild a hash set from each catalog, then compute the set difference in both directions. Sort each resulting set and concatenate.\n\n1. `set1 = set(catalog1)`, `set2 = set(catalog2)`\n2. `only1 = sorted(set1 - set2)`, `only2 = sorted(set2 - set1)`\n3. Return `only1 + only2`.\n\n**Pattern:** Arrays / Hashing — set difference via hash sets.\n\n**Trap:** Forgetting to deduplicate within each catalog before computing the difference. If catalog1 = [1, 1, 2] and catalog2 = [2], the exclusive IDs for catalog1 are just [1], not [1, 1]. Always convert to sets first.\n\n**Complexity:**\n- **Time:** O(n log n + m log m) due to sorting the output (where n, m are catalog sizes).\n- **Space:** O(n + m) for the hash sets.",
    referenceSolution: {
      JAVASCRIPT: "function solve(catalog1, catalog2) {\n    const s1 = new Set(catalog1);\n    const s2 = new Set(catalog2);\n    const only1 = [...s1].filter(x => !s2.has(x)).sort((a, b) => a - b);\n    const only2 = [...s2].filter(x => !s1.has(x)).sort((a, b) => a - b);\n    return [...only1, ...only2];\n}",
      TYPESCRIPT: "function solve(catalog1: number[], catalog2: number[]): number[] {\n    const s1 = new Set<number>(catalog1);\n    const s2 = new Set<number>(catalog2);\n    const only1 = [...s1].filter(x => !s2.has(x)).sort((a, b) => a - b);\n    const only2 = [...s2].filter(x => !s1.has(x)).sort((a, b) => a - b);\n    return [...only1, ...only2];\n}",
      PYTHON: "def solve(catalog1, catalog2):\n    s1, s2 = set(catalog1), set(catalog2)\n    only1 = sorted(s1 - s2)\n    only2 = sorted(s2 - s1)\n    return only1 + only2",
      JAVA: "    static int[] solve(int[] catalog1, int[] catalog2) {\n        java.util.Set<Integer> s1 = new java.util.HashSet<>();\n        java.util.Set<Integer> s2 = new java.util.HashSet<>();\n        for (int x : catalog1) s1.add(x);\n        for (int x : catalog2) s2.add(x);\n        java.util.List<Integer> only1 = new java.util.ArrayList<>();\n        java.util.List<Integer> only2 = new java.util.ArrayList<>();\n        for (int x : s1) if (!s2.contains(x)) only1.add(x);\n        for (int x : s2) if (!s1.contains(x)) only2.add(x);\n        java.util.Collections.sort(only1);\n        java.util.Collections.sort(only2);\n        java.util.List<Integer> res = new java.util.ArrayList<>();\n        res.addAll(only1);\n        res.addAll(only2);\n        return res.stream().mapToInt(Integer::intValue).toArray();\n    }",
      CPP: "vector<int> solve(vector<int> catalog1, vector<int> catalog2) {\n    set<int> s1(catalog1.begin(), catalog1.end());\n    set<int> s2(catalog2.begin(), catalog2.end());\n    vector<int> res;\n    for (int x : s1) if (!s2.count(x)) res.push_back(x);\n    vector<int> part2;\n    for (int x : s2) if (!s1.count(x)) part2.push_back(x);\n    sort(res.begin(), res.end());\n    sort(part2.begin(), part2.end());\n    res.insert(res.end(), part2.begin(), part2.end());\n    return res;\n}",
      GO: "func solve(catalog1 []int, catalog2 []int) []int {\n    s1 := make(map[int]bool)\n    s2 := make(map[int]bool)\n    for _, v := range catalog1 { s1[v] = true }\n    for _, v := range catalog2 { s2[v] = true }\n    var only1, only2 []int\n    for k := range s1 {\n        if !s2[k] { only1 = append(only1, k) }\n    }\n    for k := range s2 {\n        if !s1[k] { only2 = append(only2, k) }\n    }\n    // insertion sort only1\n    for i := 1; i < len(only1); i++ {\n        key := only1[i]\n        j := i - 1\n        for j >= 0 && only1[j] > key {\n            only1[j+1] = only1[j]\n            j--\n        }\n        only1[j+1] = key\n    }\n    // insertion sort only2\n    for i := 1; i < len(only2); i++ {\n        key := only2[i]\n        j := i - 1\n        for j >= 0 && only2[j] > key {\n            only2[j+1] = only2[j]\n            j--\n        }\n        only2[j+1] = key\n    }\n    return append(only1, only2...)\n}",
    },
    tests: [
      { stdin: "1 2 3 4\n3 4 5 6", expectedStdout: "1 2 5 6", isSample: true },
      { stdin: "7 8\n7 8 9", expectedStdout: "9", isSample: true },
      { stdin: "10 20 30\n40 50", expectedStdout: "10 20 30 40 50" },
      { stdin: "5\n5", expectedStdout: "" },
      { stdin: "1 1 2 2\n2 3", expectedStdout: "1 3" },
      { stdin: "100 200 300\n100 200 300", expectedStdout: "" },
      { stdin: "1 3 5 7 9\n2 4 6 8 10", expectedStdout: "1 3 5 7 9 2 4 6 8 10" },
      { stdin: "1000000\n999999", expectedStdout: "1000000 999999" },
    ],
  }),

  p({
    ...base,
    slug: "compatible-locker-pairs",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Compatible Locker Pairs",
    patternTags: ["frequency-count","hash-map","pairs","counting"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 420,
    promptMarkdown: "A gym assigns locker codes to members. Two members have **compatible** lockers if they share the same locker code. Given an array `codes` of locker codes, return the number of compatible pairs `(i, j)` where `i < j` and `codes[i] == codes[j]`.\n\n**Constraints**\n- `1 <= codes.length <= 10^4`\n- `1 <= codes[i] <= 10^9`\n\n**Example 1**\n```\ninput:\n1 2 3 1 1 3\noutput: 4\n```\n*Explanation: Compatible pairs are (0,3), (0,4), (3,4) for code 1, and (2,5) for code 3. Total = 4.*\n\n**Example 2**\n```\ninput:\n7 7 7\noutput: 3\n```\n*Explanation: All three share code 7. Pairs: (0,1), (0,2), (1,2). Total = 3.*\n\n**Example 3**\n```\ninput:\n5\noutput: 0\n```\n*Explanation: Only one member; no pairs possible.*\n\n**Follow-up**\nCan you compute the answer in O(n) time without nested loops?",
    editorialMarkdown: "## Compatible Locker Pairs\n\nCount the frequency of each code using a hash map. For each code with frequency `f`, the number of pairs is `f * (f - 1) / 2` (combinatorics: choose 2 from f). Sum across all codes.\n\n**Pattern:** Arrays / Hashing — frequency count then combinatorial counting.\n\n**Trap:** Using a brute-force O(n²) nested loop is the naive approach. The key insight is that once you know the frequency of a value, you can compute all its pairs in O(1) with the combination formula. A secondary trap: using integer overflow if frequencies are large (for very large inputs in Java/C++).\n\n**Complexity:**\n- **Time:** O(n)\n- **Space:** O(n) for the frequency map.",
    referenceSolution: {
      JAVASCRIPT: "function solve(codes) {\n    const freq = new Map();\n    for (const c of codes) freq.set(c, (freq.get(c) || 0) + 1);\n    let count = 0;\n    for (const f of freq.values()) count += f * (f - 1) / 2;\n    return count;\n}",
      TYPESCRIPT: "function solve(codes: number[]): number {\n    const freq = new Map<number, number>();\n    for (const c of codes) freq.set(c, (freq.get(c) ?? 0) + 1);\n    let count = 0;\n    for (const f of freq.values()) count += f * (f - 1) / 2;\n    return count;\n}",
      PYTHON: "def solve(codes):\n    from collections import Counter\n    freq = Counter(codes)\n    return sum(f * (f - 1) // 2 for f in freq.values())",
      JAVA: "    static int solve(int[] codes) {\n        java.util.Map<Integer, Integer> freq = new java.util.HashMap<>();\n        for (int c : codes) freq.merge(c, 1, Integer::sum);\n        int count = 0;\n        for (int f : freq.values()) count += f * (f - 1) / 2;\n        return count;\n    }",
      CPP: "int solve(vector<int> codes) {\n    unordered_map<int, int> freq;\n    for (int c : codes) freq[c]++;\n    int count = 0;\n    for (auto& p : freq) count += p.second * (p.second - 1) / 2;\n    return count;\n}",
      GO: "func solve(codes []int) int {\n    freq := make(map[int]int)\n    for i := 0; i < len(codes); i++ {\n        freq[codes[i]]++\n    }\n    count := 0\n    for k := range freq {\n        f := freq[k]\n        count += f * (f - 1) / 2\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "1 2 3 1 1 3", expectedStdout: "4", isSample: true },
      { stdin: "7 7 7", expectedStdout: "3", isSample: true },
      { stdin: "5", expectedStdout: "0" },
      { stdin: "1 2 3 4 5", expectedStdout: "0" },
      { stdin: "9 9 9 9", expectedStdout: "6" },
      { stdin: "1 1 2 2 3 3", expectedStdout: "3" },
      { stdin: "5 5 5 5 5", expectedStdout: "10" },
      { stdin: "100 200 100 300 200 100", expectedStdout: "4" },
    ],
  }),
];
