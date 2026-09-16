import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-044` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_044_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "most-frequent-shipment",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Animal Sightings Window",
    patternTags: ["array","hash-map"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 600,
    promptMarkdown: "A wildlife biologist has recorded a sequence of animal sightings, where each animal species is represented by an integer ID. A \"dominant species\" is defined as a species that is sighted the highest number of times in the entire log. \n\nThe biologist wishes to focus on the shortest continuous observation window (a contiguous subsegment of the sequence) that contains all occurrences of at least one dominant species. In other words, you need to find the length of the shortest contiguous subsegment of the array that contains the same maximum frequency of any element as the original array.\n\n**Constraints**\n- `1 <= a.length <= 1000`\n- `0 <= a[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 2 3 1\noutput: 2\n```\n*Explanation: The species IDs 1 and 2 both appear most frequently (twice). The shortest subsegment containing all 1s is [1, 2, 2, 3, 1] (length 5). The shortest subsegment containing all 2s is [2, 2] (length 2). The minimum length is 2.*\n\n**Example 2**\n```\ninput:\n1 2 2 3 1 4 2\noutput: 6\n```\n*Explanation: The species ID 2 is the most frequent (three times). The shortest continuous window that captures all three 2s is [2, 2, 3, 1, 4, 2], which has a length of 6.*\n\n**Example 3**\n```\ninput:\n1\noutput: 1\n```\n*Explanation: The most frequent ID appears once, and the shortest window is the single element itself, length 1.*",
    editorialMarkdown: "## Most Frequent Shipment\nTrack the first and last occurrence of each element, along with its frequency. Find the maximum frequency, then find the minimum length among all elements with that frequency.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N)\n- **Space Complexity:** mathcal{O}(N)",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let count = {}, first = {}, last = {};\n    let maxCount = 0;\n    for (let i = 0; i < a.length; i++) {\n        let x = a[i];\n        if (first[x] === undefined) first[x] = i;\n        last[x] = i;\n        count[x] = (count[x] || 0) + 1;\n        if (count[x] > maxCount) maxCount = count[x];\n    }\n    let minLen = a.length;\n    for (let x in count) {\n        if (count[x] === maxCount) {\n            let len = last[x] - first[x] + 1;\n            if (len < minLen) minLen = len;\n        }\n    }\n    return minLen;\n}",
      TYPESCRIPT: "function solve(a: number[]): number {\n    let count: {[key: number]: number} = {}, first: {[key: number]: number} = {}, last: {[key: number]: number} = {};\n    let maxCount = 0;\n    for (let i = 0; i < a.length; i++) {\n        let x = a[i];\n        if (first[x] === undefined) first[x] = i;\n        last[x] = i;\n        count[x] = (count[x] || 0) + 1;\n        if (count[x] > maxCount) maxCount = count[x];\n    }\n    let minLen = a.length;\n    for (let x in count) {\n        if (count[x] === maxCount) {\n            let len = last[x] - first[x] + 1;\n            if (len < minLen) minLen = len;\n        }\n    }\n    return minLen;\n}",
      PYTHON: "def solve(a):\n    count = {}\n    first = {}\n    last = {}\n    max_count = 0\n    for i, x in enumerate(a):\n        if x not in first:\n            first[x] = i\n        last[x] = i\n        count[x] = count.get(x, 0) + 1\n        if count[x] > max_count:\n            max_count = count[x]\n    min_len = len(a)\n    for x in count:\n        if count[x] == max_count:\n            min_len = min(min_len, last[x] - first[x] + 1)\n    return min_len",
      JAVA: "    static int solve(int[] a) {\n        java.util.Map<Integer, Integer> count = new java.util.HashMap<>();\n        java.util.Map<Integer, Integer> first = new java.util.HashMap<>();\n        java.util.Map<Integer, Integer> last = new java.util.HashMap<>();\n        int maxCount = 0;\n        for (int i = 0; i < a.length; i++) {\n            int x = a[i];\n            if (!first.containsKey(x)) first.put(x, i);\n            last.put(x, i);\n            count.put(x, count.getOrDefault(x, 0) + 1);\n            if (count.get(x) > maxCount) maxCount = count.get(x);\n        }\n        int minLen = a.length;\n        for (int x : count.keySet()) {\n            if (count.get(x) == maxCount) {\n                int len = last.get(x) - first.get(x) + 1;\n                if (len < minLen) minLen = len;\n            }\n        }\n        return minLen;\n    }",
      CPP: "#include <vector>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\nint solve(vector<int> a) {\n    unordered_map<int, int> count, first, last;\n    int maxCount = 0;\n    for (int i = 0; i < a.size(); i++) {\n        if (first.find(a[i]) == first.end()) first[a[i]] = i;\n        last[a[i]] = i;\n        count[a[i]]++;\n        if (count[a[i]] > maxCount) maxCount = count[a[i]];\n    }\n    int minLen = a.size();\n    for (auto const& [x, c] : count) {\n        if (c == maxCount) {\n            minLen = min(minLen, last[x] - first[x] + 1);\n        }\n    }\n    return minLen;\n}",
      GO: "func solve(a []int) int {\n    count := make(map[int]int)\n    first := make(map[int]int)\n    last := make(map[int]int)\n    maxCount := 0\n    for i, x := range a {\n        if _, ok := first[x]; !ok {\n            first[x] = i\n        }\n        last[x] = i\n        count[x]++\n        if count[x] > maxCount {\n            maxCount = count[x]\n        }\n    }\n    minLen := len(a)\n    for x, c := range count {\n        if c == maxCount {\n            l := last[x] - first[x] + 1\n            if l < minLen {\n                minLen = l\n            }\n        }\n    }\n    return minLen\n}",
    },
    tests: [
      { stdin: "1 2 2 3 1", expectedStdout: "2", isSample: true },
      { stdin: "1 2 2 3 1 4 2", expectedStdout: "6", isSample: true },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "5 5 5", expectedStdout: "3" },
      { stdin: "1 2 3 4", expectedStdout: "1" },
      { stdin: "1 1 2 2", expectedStdout: "2" },
      { stdin: "2 1 1 2", expectedStdout: "2" },
      { stdin: "10 10 10 10 10", expectedStdout: "5" },
    ],
  }),

  p({
    ...base,
    slug: "remove-duplicate-logs",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Remove Duplicate Logs",
    patternTags: ["array","hash-map"],
    signatureId: "fn:strings->strings",
    avgSolveSeconds: 300,
    promptMarkdown: "Given a list of log IDs, remove any duplicates. Keep only the first occurrence of each log ID, preserving their original order.\n\n**Constraints**\n- `0 <= a.length <= 1000`\n- `a[i]` consists of lowercase letters and numbers.\n\n**Example 1**\n```\ninput:\nlog1 log2 log1\noutput: log1 log2\n```\n*Explanation: The second log1 is removed.*\n\n**Example 2**\n```\ninput:\na a a\noutput: a\n```\n*Explanation: Only the first a is kept.*\n\n**Example 3**\n```\ninput:\na b c\noutput: a b c\n```\n*Explanation: No duplicates exist.*",
    editorialMarkdown: "## Remove Duplicate Logs\nUse a hash set to keep track of seen elements. Append to the result only if the element is not in the set.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N)\n- **Space Complexity:** mathcal{O}(N)",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let seen = new Set();\n    let res = [];\n    for (let x of a) {\n        if (!seen.has(x)) {\n            seen.add(x);\n            res.push(x);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(a: string[]): string[] {\n    let seen = new Set<string>();\n    let res: string[] = [];\n    for (let x of a) {\n        if (!seen.has(x)) {\n            seen.add(x);\n            res.push(x);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(a):\n    seen = set()\n    res = []\n    for x in a:\n        if x not in seen:\n            seen.add(x)\n            res.append(x)\n    return res",
      JAVA: "    static String[] solve(String[] a) {\n        java.util.Set<String> seen = new java.util.HashSet<>();\n        java.util.List<String> res = new java.util.ArrayList<>();\n        for (String x : a) {\n            if (!seen.contains(x)) {\n                seen.add(x);\n                res.add(x);\n            }\n        }\n        return res.toArray(new String[0]);\n    }",
      CPP: "#include <vector>\n#include <string>\n#include <unordered_set>\nusing namespace std;\nvector<string> solve(vector<string> a) {\n    unordered_set<string> seen;\n    vector<string> res;\n    for (string x : a) {\n        if (seen.find(x) == seen.end()) {\n            seen.insert(x);\n            res.push_back(x);\n        }\n    }\n    return res;\n}",
      GO: "func solve(a []string) []string {\n    seen := make(map[string]bool)\n    var res []string\n    for _, x := range a {\n        if !seen[x] {\n            seen[x] = true\n            res = append(res, x)\n        }\n    }\n    if res == nil {\n        return []string{}\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "log1 log2 log1", expectedStdout: "log1 log2", isSample: true },
      { stdin: "a a a", expectedStdout: "a", isSample: true },
      { stdin: "a b c", expectedStdout: "a b c" },
      { stdin: "a", expectedStdout: "a" },
      { stdin: "", expectedStdout: "" },
      { stdin: "a b a b", expectedStdout: "a b" },
      { stdin: "b a", expectedStdout: "b a" },
      { stdin: "x y z x y", expectedStdout: "x y z" },
    ],
  }),

  p({
    ...base,
    slug: "unsorted-sensor-columns",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Flawed Poetry Columns",
    patternTags: ["array","string"],
    signatureId: "fn:strings->int",
    avgSolveSeconds: 450,
    promptMarkdown: "A publisher has arranged a block of text into an array of strings of identical length, where each string represents a row of characters. To evaluate the visual flow of the text, they examine the characters column by column.\n\nA column is considered \"flawed\" if the characters, read from the top row to the bottom row, are not in alphabetical order (i.e., a character in a row is strictly less than the character in the same column of the preceding row). Given the text block as a list of strings, calculate the total number of flawed columns.\n\n**Constraints**\n- `1 <= a.length <= 100`\n- `1 <= a[i].length <= 100`\n- All strings in `a` have the same length.\n\n**Example 1**\n```\ninput:\ncba daf ghi\noutput: 1\n```\n*Explanation: \nThe first column reads 'c', 'd', 'g' (sorted).\nThe second column reads 'b', 'a', 'h' (not sorted, 'a' comes before 'b').\nThe third column reads 'a', 'f', 'i' (sorted).\nThere is 1 flawed column.*\n\n**Example 2**\n```\ninput:\na b\noutput: 0\n```\n*Explanation: \nThe strings are \"a\" and \"b\", each of length 1. \nThe single column reads 'a' then 'b', which is in alphabetical order. \nThere are 0 flawed columns.*\n\n**Example 3**\n```\ninput:\nzyx wvu tsr\noutput: 3\n```\n*Explanation: \nAll three columns read from top to bottom are not in alphabetical order, so there are 3 flawed columns.*",
    editorialMarkdown: "## Unsorted Sensor Columns\nCheck each column index across all rows. If any row has a character smaller than the character in the previous row for that column, the column is unsorted.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(R × C)\n- **Space Complexity:** mathcal{O}(1)",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    if (a.length === 0) return 0;\n    let count = 0;\n    for (let c = 0; c < a[0].length; c++) {\n        for (let r = 1; r < a.length; r++) {\n            if (a[r][c] < a[r-1][c]) {\n                count++;\n                break;\n            }\n        }\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(a: string[]): number {\n    if (a.length === 0) return 0;\n    let count = 0;\n    for (let c = 0; c < a[0].length; c++) {\n        for (let r = 1; r < a.length; r++) {\n            if (a[r][c] < a[r-1][c]) {\n                count++;\n                break;\n            }\n        }\n    }\n    return count;\n}",
      PYTHON: "def solve(a):\n    if not a:\n        return 0\n    count = 0\n    for c in range(len(a[0])):\n        for r in range(1, len(a)):\n            if a[r][c] < a[r-1][c]:\n                count += 1\n                break\n    return count",
      JAVA: "    static int solve(String[] a) {\n        if (a.length == 0) return 0;\n        int count = 0;\n        for (int c = 0; c < a[0].length(); c++) {\n            for (int r = 1; r < a.length; r++) {\n                if (a[r].charAt(c) < a[r-1].charAt(c)) {\n                    count++;\n                    break;\n                }\n            }\n        }\n        return count;\n    }",
      CPP: "#include <vector>\n#include <string>\nusing namespace std;\nint solve(vector<string> a) {\n    if (a.empty()) return 0;\n    int count = 0;\n    for (int c = 0; c < a[0].length(); c++) {\n        for (int r = 1; r < a.size(); r++) {\n            if (a[r][c] < a[r-1][c]) {\n                count++;\n                break;\n            }\n        }\n    }\n    return count;\n}",
      GO: "func solve(a []string) int {\n    if len(a) == 0 { return 0 }\n    count := 0\n    for c := 0; c < len(a[0]); c++ {\n        for r := 1; r < len(a); r++ {\n            if a[r][c] < a[r-1][c] {\n                count++\n                break\n            }\n        }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "cba daf ghi", expectedStdout: "1", isSample: true },
      { stdin: "a b", expectedStdout: "0", isSample: true },
      { stdin: "zyx wvu tsr", expectedStdout: "3" },
      { stdin: "a", expectedStdout: "0" },
      { stdin: "a a", expectedStdout: "0" },
      { stdin: "a b c", expectedStdout: "0" },
      { stdin: "c b a", expectedStdout: "1" },
      { stdin: "abc def ghi", expectedStdout: "0" },
    ],
  }),

  p({
    ...base,
    slug: "process-highest-priority-tasks",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Gemstone Appraisal Rounds",
    patternTags: ["array","sorting"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 450,
    promptMarkdown: "A jeweler is evaluating multiple trays of gemstones. The trays are represented as a matrix of integers, where each row corresponds to a tray, and each integer represents the quality rating of a gem. \n\nThe evaluation process happens in rounds. In a single round, the jeweler takes the gem with the highest quality rating remaining from every tray. The score awarded for that round is the maximum rating among the gems just taken from the trays. This score is added to a cumulative total. The jeweler repeats these rounds until there are no gems left in any tray. Return the final cumulative total score.\n\n**Constraints**\n- `1 <= a.length <= 50`\n- `1 <= a[i].length <= 50`\n- `1 <= a[i][j] <= 100`\n\n**Example 1**\n```\ninput:\n1 2 4;3 3 1\noutput: 8\n```\n*Explanation: \nRound 1: Take 4 from the first tray and 3 from the second tray. The score is max(4, 3) = 4. Trays now have [1, 2] and [3, 1].\nRound 2: Take 2 from the first tray and 3 from the second tray. The score is max(2, 3) = 3. Trays now have [1] and [1].\nRound 3: Take 1 from the first tray and 1 from the second tray. The score is max(1, 1) = 1.\nTotal score = 4 + 3 + 1 = 8.*\n\n**Example 2**\n```\ninput:\n10\noutput: 10\n```\n*Explanation: There is only one tray with one gem. The jeweler takes it, scoring 10. Total score is 10.*\n\n**Example 3**\n```\ninput:\n1 1;1 1\noutput: 2\n```\n*Explanation: \nRound 1 score is 1.\nRound 2 score is 1.\nTotal score is 2.*",
    editorialMarkdown: "## Process Highest Priority Tasks\nSort each row. Then, for each column, find the maximum value in that column across all rows, and add it to the total.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(R × C log C)\n- **Space Complexity:** mathcal{O}(1) or mathcal{O}(C) depending on sorting implementation.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n    let total = 0;\n    for (let i = 0; i < a.length; i++) {\n        a[i].sort((x, y) => x - y);\n    }\n    for (let c = 0; c < a[0].length; c++) {\n        let m = 0;\n        for (let r = 0; r < a.length; r++) {\n            if (a[r][c] > m) m = a[r][c];\n        }\n        total += m;\n    }\n    return total;\n}",
      TYPESCRIPT: "function solve(a: number[][]): number {\n    let total = 0;\n    for (let i = 0; i < a.length; i++) {\n        a[i].sort((x, y) => x - y);\n    }\n    for (let c = 0; c < a[0].length; c++) {\n        let m = 0;\n        for (let r = 0; r < a.length; r++) {\n            if (a[r][c] > m) m = a[r][c];\n        }\n        total += m;\n    }\n    return total;\n}",
      PYTHON: "def solve(a):\n    for row in a:\n        row.sort()\n    total = 0\n    for c in range(len(a[0])):\n        m = 0\n        for r in range(len(a)):\n            m = max(m, a[r][c])\n        total += m\n    return total",
      JAVA: "    static int solve(int[][] a) {\n        int total = 0;\n        for (int i = 0; i < a.length; i++) {\n            java.util.Arrays.sort(a[i]);\n        }\n        for (int c = 0; c < a[0].length; c++) {\n            int m = 0;\n            for (int r = 0; r < a.length; r++) {\n                if (a[r][c] > m) m = a[r][c];\n            }\n            total += m;\n        }\n        return total;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\nusing namespace std;\nint solve(vector<vector<int>> a) {\n    int total = 0;\n    for (int i = 0; i < a.size(); i++) {\n        sort(a[i].begin(), a[i].end());\n    }\n    for (int c = 0; c < a[0].size(); c++) {\n        int m = 0;\n        for (int r = 0; r < a.size(); r++) {\n            if (a[r][c] > m) m = a[r][c];\n        }\n        total += m;\n    }\n    return total;\n}",
      GO: "func solve(a [][]int) int {\n    for r := 0; r < len(a); r++ {\n        for i := 0; i < len(a[r]); i++ {\n            for j := i + 1; j < len(a[r]); j++ {\n                if a[r][i] > a[r][j] {\n                    a[r][i], a[r][j] = a[r][j], a[r][i]\n                }\n            }\n        }\n    }\n    total := 0\n    for c := 0; c < len(a[0]); c++ {\n        m := 0\n        for r := 0; r < len(a); r++ {\n            if a[r][c] > m {\n                m = a[r][c]\n            }\n        }\n        total += m\n    }\n    return total\n}",
    },
    tests: [
      { stdin: "1 2 4;3 3 1", expectedStdout: "8", isSample: true },
      { stdin: "10", expectedStdout: "10", isSample: true },
      { stdin: "1 1;1 1", expectedStdout: "2" },
      { stdin: "5 5 5", expectedStdout: "15" },
      { stdin: "1 2 3;4 5 6;7 8 9", expectedStdout: "24" },
      { stdin: "9 8 7;6 5 4;3 2 1", expectedStdout: "24" },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "1 2;3 4;5 6;7 8", expectedStdout: "15" },
    ],
  }),

  p({
    ...base,
    slug: "keep-one-skip-k",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "LINKED_LIST",
    title: "Keep One Skip K",
    patternTags: ["linked-list"],
    signatureId: "fn:list,int->list",
    avgSolveSeconds: 400,
    promptMarkdown: "Given a linked list of values and an integer `k`, keep the first node, then skip (delete) the next `k` nodes, keep the next one, skip `k`, and so on until the end of the list.\n\n**Constraints**\n- The list has between `1` and `1000` nodes.\n- `0 <= k <= 1000`\n- Node values are integers between `-100` and `100`.\n\n**Example 1**\n```\ninput:\n1 2 3 4 5 6\n2\noutput: 1 4\n```\n*Explanation: Keep 1, skip 2 and 3, keep 4, skip 5 and 6.*\n\n**Example 2**\n```\ninput:\n1 2 3 4\n0\noutput: 1 2 3 4\n```\n*Explanation: Skip 0 nodes, so keep everything.*\n\n**Example 3**\n```\ninput:\n1 2 3\n5\noutput: 1\n```\n*Explanation: Keep 1, skip up to 5 nodes. Only 2 and 3 are present, they are skipped.*",
    editorialMarkdown: "## Keep One Skip K\nTraverse the list. For each node you keep, you skip up to `k` following nodes by moving a pointer forward `k` times (or until the end of the list), then link the current node to the node after the skips.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the list.\n- **Space Complexity:** mathcal{O}(1)",
    referenceSolution: {
      JAVASCRIPT: "function solve(head, k) {\n    let curr = head;\n    while (curr !== null) {\n        let temp = curr.next;\n        for (let i = 0; i < k && temp !== null; i++) {\n            temp = temp.next;\n        }\n        curr.next = temp;\n        curr = temp;\n    }\n    return head;\n}",
      TYPESCRIPT: "function solve(head: any, k: number): any {\n    let curr = head;\n    while (curr !== null) {\n        let temp = curr.next;\n        for (let i = 0; i < k && temp !== null; i++) {\n            temp = temp.next;\n        }\n        curr.next = temp;\n        curr = temp;\n    }\n    return head;\n}",
      PYTHON: "def solve(head, k):\n    curr = head\n    while curr:\n        temp = curr.next\n        for _ in range(k):\n            if temp is not None:\n                temp = temp.next\n        curr.next = temp\n        curr = temp\n    return head",
      JAVA: "    static ListNode solve(ListNode head, int k) {\n        ListNode curr = head;\n        while (curr != null) {\n            ListNode temp = curr.next;\n            for (int i = 0; i < k && temp != null; i++) {\n                temp = temp.next;\n            }\n            curr.next = temp;\n            curr = temp;\n        }\n        return head;\n    }",
      CPP: "ListNode* solve(ListNode* head, int k) {\n    ListNode* curr = head;\n    while (curr != nullptr) {\n        ListNode* temp = curr->next;\n        for (int i = 0; i < k && temp != nullptr; i++) {\n            temp = temp->next;\n        }\n        curr->next = temp;\n        curr = temp;\n    }\n    return head;\n}",
      GO: "func solve(head *ListNode, k int) *ListNode {\n    curr := head\n    for curr != nil {\n        temp := curr.Next\n        for i := 0; i < k && temp != nil; i++ {\n            temp = temp.Next\n        }\n        curr.Next = temp\n        curr = temp\n    }\n    return head\n}",
    },
    tests: [
      { stdin: "1 2 3 4 5 6\n2", expectedStdout: "1 4", isSample: true },
      { stdin: "1 2 3 4\n0", expectedStdout: "1 2 3 4", isSample: true },
      { stdin: "1 2 3\n5", expectedStdout: "1" },
      { stdin: "1\n10", expectedStdout: "1" },
      { stdin: "1 2\n1", expectedStdout: "1" },
      { stdin: "1 2 3 4 5\n1", expectedStdout: "1 3 5" },
      { stdin: "10 20 30 40 50\n2", expectedStdout: "10 40" },
      { stdin: "10 20 30 40 50 60 70\n3", expectedStdout: "10 50" },
    ],
  }),
];
