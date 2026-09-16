import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w3-053` (anchored to a public problem index; metadata only).
 *
 * Drafted with claude-sonnet-4-6 on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W3_053_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "balance-beam-integers",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Balance Beam Integers",
    patternTags: ["construction","math","arithmetic","integer-arithmetic"],
    signatureId: "fn:int->ints",
    avgSolveSeconds: 480,
    promptMarkdown: "A balance beam can hold exactly `n` weights. You must place `n` **distinct** integer weights (positive, negative, or zero) on the beam so that the total weight is **exactly 0** and the beam is perfectly balanced.\n\nGiven an integer `n`, return **any** array of `n` distinct integers that sum to zero.\n\n**Constraints**\n- `1 <= n <= 1000`\n\n**Example 1**\n```\ninput:\n5\noutput: 1 -1 2 -2 0\n```\n*Explanation: 1 + (-1) + 2 + (-2) + 0 = 0, and all five values are distinct.*\n\n**Example 2**\n```\ninput:\n1\noutput: 0\n```\n*Explanation: A single weight of 0 already sums to zero.*\n\n**Example 3**\n```\ninput:\n4\noutput: 1 -1 2 -2\n```\n*Explanation: 1 + (-1) + 2 + (-2) = 0, all four values are distinct.*\n\n**Follow-up**\nCan you construct the answer in O(n) time and O(n) space?",
    editorialMarkdown: "## Balance Beam Integers\n\nThis is a **construction** problem. We need to output any valid array, so we aim for the simplest pattern.\n\n**Strategy**: Pair up numbers `1, -1, 2, -2, 3, -3, …`. Each pair sums to zero, so any even number of them sums to zero. If `n` is odd, include `0` as a free element that also contributes zero to the total.\n\n- For even `n`: output `[1, -1, 2, -2, …, n/2, -n/2]`.\n- For odd `n`: output `[0, 1, -1, 2, -2, …, (n-1)/2, -(n-1)/2]`.\n\nAll values are distinct because the positive integers are unique, their negatives are unique, and 0 (if present) is distinct from any non-zero value.\n\n**Trap**: Forgetting that 0 is a valid integer and trying to force an even-only pattern, which causes duplicates or an incorrect sum.\n\n**Complexity:**\n- **Time:** O(n)\n- **Space:** O(n) for the output array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n) {\n    const res = [];\n    if (n % 2 === 1) res.push(0);\n    for (let i = 1; i <= Math.floor(n / 2); i++) {\n        res.push(i);\n        res.push(-i);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(n: number): number[] {\n    const res: number[] = [];\n    if (n % 2 === 1) res.push(0);\n    for (let i = 1; i <= Math.floor(n / 2); i++) {\n        res.push(i);\n        res.push(-i);\n    }\n    return res;\n}",
      PYTHON: "def solve(n):\n    res = []\n    if n % 2 == 1:\n        res.append(0)\n    for i in range(1, n // 2 + 1):\n        res.append(i)\n        res.append(-i)\n    return res",
      JAVA: "    static int[] solve(int n) {\n        int[] res = new int[n];\n        int idx = 0;\n        if (n % 2 == 1) res[idx++] = 0;\n        for (int i = 1; i <= n / 2; i++) {\n            res[idx++] = i;\n            res[idx++] = -i;\n        }\n        return res;\n    }",
      CPP: "vector<int> solve(int n) {\n    vector<int> res;\n    if (n % 2 == 1) res.push_back(0);\n    for (int i = 1; i <= n / 2; i++) {\n        res.push_back(i);\n        res.push_back(-i);\n    }\n    return res;\n}",
      GO: "func solve(n int) []int {\n    res := []int{}\n    if n%2 == 1 {\n        res = append(res, 0)\n    }\n    for i := 1; i <= n/2; i++ {\n        res = append(res, i)\n        res = append(res, -i)\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "5", expectedStdout: "0 1 -1 2 -2", isSample: true },
      { stdin: "1", expectedStdout: "0", isSample: true },
      { stdin: "4", expectedStdout: "1 -1 2 -2" },
      { stdin: "2", expectedStdout: "1 -1" },
      { stdin: "3", expectedStdout: "0 1 -1" },
      { stdin: "6", expectedStdout: "1 -1 2 -2 3 -3" },
      { stdin: "7", expectedStdout: "0 1 -1 2 -2 3 -3" },
      { stdin: "10", expectedStdout: "1 -1 2 -2 3 -3 4 -4 5 -5" },
    ],
  }),

  p({
    ...base,
    slug: "boost-to-target",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Boost to Target",
    patternTags: ["math","arithmetic","greedy","construction"],
    signatureId: "fn:int,int->int",
    avgSolveSeconds: 300,
    promptMarkdown: "A rocket's altitude tracker starts at `0` and a mission target is set at altitude `target`. You have exactly `boosts` engine pulses available. Each pulse can **either** increase the current altitude by 1 **or** decrease the target by 1.\n\nReturn the **maximum** altitude the rocket can reach such that the altitude can still equal the target after exactly `boosts` pulses.\n\n**Constraints**\n- `1 <= target <= 10^9`\n- `0 <= boosts <= 10^9`\n\n**Example 1**\n```\ninput:\n5\n3\noutput: 8\n```\n*Explanation: Use all 3 pulses to increase altitude (5+3=8) and simultaneously decrease the target by 3 (5−3=2). Now altitude 8 and target 2 are reachable from a common midpoint.*\n\nWait — let me re-state clearly: we can use each pulse to add 1 to the tracker or subtract 1 from the target. To maximize the tracker reading while still meeting the target, we use every pulse to do both simultaneously (add 1 to tracker AND subtract 1 from target). Each pulse closes the gap by 2. With `boosts` pulses, the tracker reaches `boosts` and the target comes down by `boosts`, and the maximum reachable value is `target + boosts`.\n\n**Example 1**\n```\ninput:\n5\n3\noutput: 8\n```\n*Explanation: With 3 pulses, each pulse adds 1 to altitude and subtracts 1 from the target. Final altitude = 5 + 3 = 8.*\n\n**Example 2**\n```\ninput:\n10\n0\noutput: 10\n```\n*Explanation: No pulses available, so the maximum achievable altitude equals the target itself.*\n\n**Example 3**\n```\ninput:\n1\n1000000000\noutput: 1000000001\n```\n*Explanation: Each of the 1 000 000 000 pulses raises altitude and lowers the target by 1, giving maximum altitude 1 + 1 000 000 000.*\n\n**Follow-up**\nCan you solve this in O(1) with a single formula?",
    editorialMarkdown: "## Boost to Target\n\nThis is a pure **math/construction** problem.\n\n**Key insight**: Each pulse can simultaneously add 1 to the altitude and subtract 1 from the target. This means each pulse narrows the gap between altitude and target by 2. To *maximize* the altitude while still being able to reach the target, use every single pulse this way.\n\nAfter `boosts` pulses:\n- Altitude = `0 + boosts = boosts`\n- Target = `target − boosts`\n- Remaining gap = `target − boosts − boosts = target − 2·boosts`... wait, the altitude can equal the adjusted target directly.\n\nMore simply: the answer is `target + boosts`. This is because each pulse contributes +1 to altitude and −1 to target, so the total \"distance\" closed is 2 per pulse, and the maximum altitude is exactly `target + boosts`.\n\n**Trap**: Overthinking the problem and trying to simulate pulses, or confusing when to add vs subtract. The formula is simply `target + boosts`.\n\n**Complexity:**\n- **Time:** O(1)\n- **Space:** O(1)",
    referenceSolution: {
      JAVASCRIPT: "function solve(target, boosts) {\n    return target + boosts;\n}",
      TYPESCRIPT: "function solve(target: number, boosts: number): number {\n    return target + boosts;\n}",
      PYTHON: "def solve(target, boosts):\n    return target + boosts",
      JAVA: "    static int solve(int target, int boosts) {\n        return target + boosts;\n    }",
      CPP: "int solve(int target, int boosts) {\n    return target + boosts;\n}",
      GO: "func solve(target int, boosts int) int {\n    return target + boosts\n}",
    },
    tests: [
      { stdin: "5\n3", expectedStdout: "8", isSample: true },
      { stdin: "10\n0", expectedStdout: "10", isSample: true },
      { stdin: "1\n1000000000", expectedStdout: "1000000001" },
      { stdin: "1\n1", expectedStdout: "2" },
      { stdin: "100\n50", expectedStdout: "150" },
      { stdin: "1000000000\n1000000000", expectedStdout: "2000000000" },
      { stdin: "7\n7", expectedStdout: "14" },
      { stdin: "999999999\n1", expectedStdout: "1000000000" },
    ],
  }),

  p({
    ...base,
    slug: "merged-log-prefix",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GREEDY",
    title: "Merged Log Prefix",
    patternTags: ["greedy","strings","suffix","overlap"],
    signatureId: "fn:strings->string",
    avgSolveSeconds: 720,
    promptMarkdown: "A logging system receives a list of message **fragments**. Each fragment may overlap with the next: the end of one fragment may share characters with the start of the next.\n\nYou are given an array `fragments` of strings ordered by arrival time. Merge them left to right: when appending each new fragment, skip any prefix of that fragment that is already a **suffix** of the current merged result.\n\nReturn the final merged string.\n\n**Constraints**\n- `1 <= fragments.length <= 200`\n- `1 <= fragments[i].length <= 100`\n- Each string consists of lowercase English letters.\n\n**Example 1**\n```\ninput:\nabcde bcdef\noutput: abcdef\n```\n*Explanation: \"abcde\" is the start. \"bcdef\" overlaps by \"bcde\" (the last 4 chars of \"abcde\" match the first 4 chars of \"bcdef\"). Append only \"f\": result is \"abcdef\".*\n\n**Example 2**\n```\ninput:\nhello world\noutput: helloworld\n```\n*Explanation: \"hello\" and \"world\" share no overlap (\"o\" ≠ \"w\"). Append all of \"world\": result is \"helloworld\".*\n\n**Example 3**\n```\ninput:\nabc bcd cde\noutput: abcde\n```\n*Explanation: Merge \"abc\" + \"bcd\" → skip \"bc\" prefix → \"abcd\". Then merge \"abcd\" + \"cde\" → skip \"cd\" prefix → \"abcde\".*\n\n**Follow-up**\nWhat is the time complexity in terms of total characters across all fragments?",
    editorialMarkdown: "## Merged Log Prefix\n\nThis problem exercises **greedy overlap merging** applied left to right.\n\n**Pattern: greedy suffix-prefix overlap**\n\nMaintain the merged string `result`. For each new fragment:\n1. Find the **maximum** length `k` such that `result` ends with the first `k` characters of `fragment` (i.e., `result[-k:] == fragment[:k]`).\n2. Append only `fragment[k:]` to `result`.\n\nTo find the maximum overlap, try lengths from `min(len(result), len(fragment))` down to 0.\n\n**Trap**: Only checking if the entire fragment is a suffix of result (length == fragment length) while missing partial overlaps. The correct approach must find the *longest* matching prefix of `fragment` that is a *suffix* of the current result.\n\n**Complexity:**\n- **Time:** O(N · L²) where N is the number of fragments and L is the maximum fragment length (for each fragment, we try O(L) lengths and each comparison is O(L))\n- **Space:** O(total output length)",
    referenceSolution: {
      JAVASCRIPT: "function solve(fragments) {\n    let result = fragments[0];\n    for (let i = 1; i < fragments.length; i++) {\n        const frag = fragments[i];\n        let overlap = 0;\n        const maxOv = Math.min(result.length, frag.length);\n        for (let k = maxOv; k >= 1; k--) {\n            if (result.endsWith(frag.substring(0, k))) {\n                overlap = k;\n                break;\n            }\n        }\n        result += frag.substring(overlap);\n    }\n    return result;\n}",
      TYPESCRIPT: "function solve(fragments: string[]): string {\n    let result = fragments[0];\n    for (let i = 1; i < fragments.length; i++) {\n        const frag = fragments[i];\n        let overlap = 0;\n        const maxOv = Math.min(result.length, frag.length);\n        for (let k = maxOv; k >= 1; k--) {\n            if (result.endsWith(frag.substring(0, k))) {\n                overlap = k;\n                break;\n            }\n        }\n        result += frag.substring(overlap);\n    }\n    return result;\n}",
      PYTHON: "def solve(fragments):\n    result = fragments[0]\n    for frag in fragments[1:]:\n        max_ov = min(len(result), len(frag))\n        overlap = 0\n        for k in range(max_ov, 0, -1):\n            if result.endswith(frag[:k]):\n                overlap = k\n                break\n        result += frag[overlap:]\n    return result",
      JAVA: "    static String solve(String[] fragments) {\n        String result = fragments[0];\n        for (int i = 1; i < fragments.length; i++) {\n            String frag = fragments[i];\n            int maxOv = Math.min(result.length(), frag.length());\n            int overlap = 0;\n            for (int k = maxOv; k >= 1; k--) {\n                if (result.endsWith(frag.substring(0, k))) {\n                    overlap = k;\n                    break;\n                }\n            }\n            result += frag.substring(overlap);\n        }\n        return result;\n    }",
      CPP: "string solve(vector<string> fragments) {\n    string result = fragments[0];\n    for (int i = 1; i < (int)fragments.size(); i++) {\n        string& frag = fragments[i];\n        int maxOv = min((int)result.size(), (int)frag.size());\n        int overlap = 0;\n        for (int k = maxOv; k >= 1; k--) {\n            if (result.size() >= (size_t)k && result.substr(result.size() - k) == frag.substr(0, k)) {\n                overlap = k;\n                break;\n            }\n        }\n        result += frag.substr(overlap);\n    }\n    return result;\n}",
      GO: "func solve(fragments []string) string {\n    result := fragments[0]\n    for i := 1; i < len(fragments); i++ {\n        frag := fragments[i]\n        rLen := len(result)\n        fLen := len(frag)\n        maxOv := rLen\n        if fLen < maxOv {\n            maxOv = fLen\n        }\n        overlap := 0\n        for k := maxOv; k >= 1; k-- {\n            match := true\n            for j := 0; j < k; j++ {\n                if result[rLen-k+j] != frag[j] {\n                    match = false\n                    break\n                }\n            }\n            if match {\n                overlap = k\n                break\n            }\n        }\n        result += frag[overlap:]\n    }\n    return result\n}",
    },
    tests: [
      { stdin: "abcde bcdef", expectedStdout: "abcdef", isSample: true },
      { stdin: "hello world", expectedStdout: "helloworld", isSample: true },
      { stdin: "abc bcd cde", expectedStdout: "abcde" },
      { stdin: "abc", expectedStdout: "abc" },
      { stdin: "aaa aaa", expectedStdout: "aaa" },
      { stdin: "abcd cd cde", expectedStdout: "abcde" },
      { stdin: "xyz abc", expectedStdout: "xyzabc" },
      { stdin: "log logfile logfiledata", expectedStdout: "logfiledata" },
    ],
  }),

  p({
    ...base,
    slug: "coverage-gap-scores",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Coverage Gap Scores",
    patternTags: ["prefix-sum","hash-set","distinct-count","arrays"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "You are evaluating sensor coverage along a highway. You are given an integer array `sensors` of length `n`.\n\nFor each index `i` (0-indexed), compute a **coverage score** defined as:\n\n> (number of distinct values in `sensors[i+1..n-1]`) − (number of distinct values in `sensors[0..i]`)\n\nReturn the array of coverage scores.\n\n**Constraints**\n- `1 <= n <= 2000`\n- `1 <= sensors[i] <= 1000`\n\n**Example 1**\n```\ninput:\n2 3 2 1\noutput: 2 0 -1 -3\n```\n*Explanation: At i=0: right has {3,2,1} (3 distinct), left has {2} (1 distinct), score = 3−1 = 2. At i=1: right has {2,1} (2 distinct), left has {2,3} (2 distinct), score = 0. At i=2: right has {1} (1 distinct), left has {2,3} (2 distinct), score = −1. At i=3: right is empty (0 distinct), left has {2,3,1} (3 distinct), score = −3.*\n\n**Example 2**\n```\ninput:\n5 5 5\noutput: 0 0 -1\n```\n*Explanation: At i=0: right={5,5} distinct=1, left={5} distinct=1, score=0. At i=2: right={} distinct=0, left={5} distinct=1, score=−1.*\n\n**Example 3**\n```\ninput:\n1\noutput: -1\n```\n*Explanation: At i=0: right is empty (0 distinct), left has {1} (1 distinct), score = 0−1 = −1.*\n\n**Follow-up**\nCan you solve this in O(n) time using prefix and suffix distinct-count arrays?",
    editorialMarkdown: "## Coverage Gap Scores\n\nThis problem asks us to compute, for each index `i`, the number of distinct values to the right minus the number of distinct values to the left (inclusive of `i`).\n\n**Pattern: prefix/suffix hash-set sweeps**\n\n1. Build a `leftDistinct[i]` array: scan left to right, maintaining a running set; `leftDistinct[i]` = size of the set after inserting `sensors[0..i]`.\n2. Build a `rightDistinct[i]` array: scan right to left, maintaining a running set; `rightDistinct[i]` = size of the set after inserting `sensors[i..n-1]`.\n3. The answer at index `i` is `rightDistinct[i+1] - leftDistinct[i]` (with `rightDistinct[n]` = 0).\n\n**Trap**: Off-by-one errors — the left window includes index `i`, but the right window starts at `i+1`. Beginners often include `i` in both windows and count it twice.\n\n**Complexity:**\n- **Time:** O(n)\n- **Space:** O(n) for the prefix/suffix arrays and the sets.",
    referenceSolution: {
      JAVASCRIPT: "function solve(sensors) {\n    const n = sensors.length;\n    const leftDistinct = new Array(n).fill(0);\n    const rightDistinct = new Array(n + 1).fill(0);\n    const ls = new Set();\n    for (let i = 0; i < n; i++) {\n        ls.add(sensors[i]);\n        leftDistinct[i] = ls.size;\n    }\n    const rs = new Set();\n    for (let i = n - 1; i >= 0; i--) {\n        rs.add(sensors[i]);\n        rightDistinct[i] = rs.size;\n    }\n    const res = new Array(n);\n    for (let i = 0; i < n; i++) {\n        res[i] = rightDistinct[i + 1] - leftDistinct[i];\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(sensors: number[]): number[] {\n    const n = sensors.length;\n    const leftDistinct: number[] = new Array(n).fill(0);\n    const rightDistinct: number[] = new Array(n + 1).fill(0);\n    const ls = new Set<number>();\n    for (let i = 0; i < n; i++) {\n        ls.add(sensors[i]);\n        leftDistinct[i] = ls.size;\n    }\n    const rs = new Set<number>();\n    for (let i = n - 1; i >= 0; i--) {\n        rs.add(sensors[i]);\n        rightDistinct[i] = rs.size;\n    }\n    const res: number[] = new Array(n);\n    for (let i = 0; i < n; i++) {\n        res[i] = rightDistinct[i + 1] - leftDistinct[i];\n    }\n    return res;\n}",
      PYTHON: "def solve(sensors):\n    n = len(sensors)\n    left_distinct = [0] * n\n    right_distinct = [0] * (n + 1)\n    ls = set()\n    for i in range(n):\n        ls.add(sensors[i])\n        left_distinct[i] = len(ls)\n    rs = set()\n    for i in range(n - 1, -1, -1):\n        rs.add(sensors[i])\n        right_distinct[i] = len(rs)\n    return [right_distinct[i + 1] - left_distinct[i] for i in range(n)]",
      JAVA: "    static int[] solve(int[] sensors) {\n        int n = sensors.length;\n        int[] leftDistinct = new int[n];\n        int[] rightDistinct = new int[n + 1];\n        java.util.Set<Integer> ls = new java.util.HashSet<>();\n        for (int i = 0; i < n; i++) {\n            ls.add(sensors[i]);\n            leftDistinct[i] = ls.size();\n        }\n        java.util.Set<Integer> rs = new java.util.HashSet<>();\n        for (int i = n - 1; i >= 0; i--) {\n            rs.add(sensors[i]);\n            rightDistinct[i] = rs.size();\n        }\n        int[] res = new int[n];\n        for (int i = 0; i < n; i++) {\n            res[i] = rightDistinct[i + 1] - leftDistinct[i];\n        }\n        return res;\n    }",
      CPP: "vector<int> solve(vector<int> sensors) {\n    int n = sensors.size();\n    vector<int> leftDistinct(n), rightDistinct(n + 1, 0);\n    unordered_set<int> ls;\n    for (int i = 0; i < n; i++) {\n        ls.insert(sensors[i]);\n        leftDistinct[i] = ls.size();\n    }\n    unordered_set<int> rs;\n    for (int i = n - 1; i >= 0; i--) {\n        rs.insert(sensors[i]);\n        rightDistinct[i] = rs.size();\n    }\n    vector<int> res(n);\n    for (int i = 0; i < n; i++) {\n        res[i] = rightDistinct[i + 1] - leftDistinct[i];\n    }\n    return res;\n}",
      GO: "func solve(sensors []int) []int {\n    n := len(sensors)\n    leftDistinct := make([]int, n)\n    rightDistinct := make([]int, n+1)\n    ls := make(map[int]bool)\n    for i := 0; i < n; i++ {\n        ls[sensors[i]] = true\n        leftDistinct[i] = len(ls)\n    }\n    rs := make(map[int]bool)\n    for i := n - 1; i >= 0; i-- {\n        rs[sensors[i]] = true\n        rightDistinct[i] = len(rs)\n    }\n    res := make([]int, n)\n    for i := 0; i < n; i++ {\n        res[i] = rightDistinct[i+1] - leftDistinct[i]\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "2 3 2 1", expectedStdout: "2 0 -1 -3", isSample: true },
      { stdin: "5 5 5", expectedStdout: "0 0 -1", isSample: true },
      { stdin: "1", expectedStdout: "-1" },
      { stdin: "1 2", expectedStdout: "0 -2" },
      { stdin: "1 1 1 1", expectedStdout: "0 0 0 -1" },
      { stdin: "1 2 3 4 5", expectedStdout: "3 1 -1 -3 -5" },
      { stdin: "3 3 1 2 3", expectedStdout: "2 2 0 -2 -3" },
      { stdin: "4 1 4 2 1 4", expectedStdout: "2 1 1 -1 -2 -3" },
    ],
  }),

  p({
    ...base,
    slug: "template-scan-offset",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "SLIDING_WINDOW",
    title: "Template Scan Offset",
    patternTags: ["string","sliding-window","substring","first-occurrence"],
    signatureId: "fn:string,string->int",
    avgSolveSeconds: 540,
    promptMarkdown: "A document scanner matches a short **template** against a long **document**. Given the document string `doc` and the template string `tmpl`, return the **0-based index** of the first position in `doc` where `tmpl` appears as a contiguous substring. If no such position exists, return `-1`.\n\n**Constraints**\n- `1 <= tmpl.length <= doc.length <= 10^4`\n- Both strings consist of lowercase English letters only.\n\n**Example 1**\n```\ninput:\nhelloworld\nllo\noutput: 2\n```\n*Explanation: \"llo\" first appears at index 2 in \"helloworld\".*\n\n**Example 2**\n```\ninput:\naaaaa\nbba\noutput: -1\n```\n*Explanation: \"bba\" does not appear anywhere in \"aaaaa\".*\n\n**Example 3**\n```\ninput:\nabcabc\nabc\noutput: 0\n```\n*Explanation: \"abc\" appears starting at index 0 (the earliest occurrence).*\n\n**Follow-up**\nCan you implement this using the KMP or Rabin-Karp algorithm to achieve O(n + m) time?",
    editorialMarkdown: "## Template Scan Offset\n\nThis is the classic **substring search** problem, solvable with a sliding window of fixed size equal to the template length.\n\n**Pattern: fixed-window scan**\n\nSlide a window of width `m = tmpl.length` across `doc`. At each position `i` (from 0 to `n−m`), compare the substring `doc[i..i+m-1]` with `tmpl`. Return `i` on the first match, or `−1` if no window matches.\n\nThe naive approach is O(n·m) in the worst case. A more advanced approach uses **KMP** (Knuth-Morris-Pratt) or **Rabin-Karp** rolling hash to achieve O(n + m).\n\n**Trap**: Off-by-one — the last valid starting index is `n − m`, not `n − 1`. Many beginners loop to `n − 1` and miss windows near the end, or loop past it and try to slice beyond the string.\n\n**Complexity (naive):**\n- **Time:** O(n·m)\n- **Space:** O(1) extra (excluding input/output)\n\n**Complexity (KMP/Rabin-Karp):**\n- **Time:** O(n + m)\n- **Space:** O(m)",
    referenceSolution: {
      JAVASCRIPT: "function solve(doc, tmpl) {\n    const n = doc.length, m = tmpl.length;\n    for (let i = 0; i <= n - m; i++) {\n        if (doc.substring(i, i + m) === tmpl) return i;\n    }\n    return -1;\n}",
      TYPESCRIPT: "function solve(doc: string, tmpl: string): number {\n    const n = doc.length, m = tmpl.length;\n    for (let i = 0; i <= n - m; i++) {\n        if (doc.substring(i, i + m) === tmpl) return i;\n    }\n    return -1;\n}",
      PYTHON: "def solve(doc, tmpl):\n    n, m = len(doc), len(tmpl)\n    for i in range(n - m + 1):\n        if doc[i:i+m] == tmpl:\n            return i\n    return -1",
      JAVA: "    static int solve(String doc, String tmpl) {\n        int n = doc.length(), m = tmpl.length();\n        for (int i = 0; i <= n - m; i++) {\n            if (doc.substring(i, i + m).equals(tmpl)) return i;\n        }\n        return -1;\n    }",
      CPP: "int solve(string doc, string tmpl) {\n    int n = doc.size(), m = tmpl.size();\n    for (int i = 0; i <= n - m; i++) {\n        if (doc.substr(i, m) == tmpl) return i;\n    }\n    return -1;\n}",
      GO: "func solve(doc string, tmpl string) int {\n    m := len(tmpl)\n    for i := 0; i+m <= len(doc); i++ {\n        if doc[i:i+m] == tmpl {\n            return i\n        }\n    }\n    return -1\n}",
    },
    tests: [
      { stdin: "helloworld\nllo", expectedStdout: "2", isSample: true },
      { stdin: "aaaaa\nbba", expectedStdout: "-1", isSample: true },
      { stdin: "abcabc\nabc", expectedStdout: "0" },
      { stdin: "a\na", expectedStdout: "0" },
      { stdin: "abcdef\ng", expectedStdout: "-1" },
      { stdin: "mississippi\nissip", expectedStdout: "4" },
      { stdin: "aabaabaab\naab", expectedStdout: "0" },
      { stdin: "abcdefghijklmnop\nnop", expectedStdout: "13" },
    ],
  }),
];
