import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-041` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_041_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "identify-active-trading-partners",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Identify Active Trading Partners",
    patternTags: ["array","arrays","sorting","filtering"],
    signatureId: "fn:matrix->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing trading logs to find the most active commercial partners. You are given a matrix `records` where each row represents a partner and contains exactly three integers: `[partner_id, q1_volume, q2_volume]`. \n\nA partner is considered \\\"active\\\" if their trading volume is at least `1000` in *both* Q1 and Q2. Return a sorted list of `partner_id`s for all active partners (in ascending order).\n\n**Constraints**\n- `1 <= records.length <= 40`\n- `records[i].length == 3`\n- `1 <= partner_id <= 1000`\n- `0 <= q1_volume, q2_volume <= 10000`\n\n**Example 1**\n```\ninput:\n10 1000 1000;20 500 1200\noutput: 10\n```\n*Explanation: Partner 10 has 1000 in both quarters. Partner 20 has only 500 in Q1 and is excluded.*\n\n**Example 2**\n```\ninput:\n15 1500 1500;10 2000 2000\noutput: 10 15\n```\n*Explanation: Both are active. They are returned in sorted order (10 before 15).*\n\n**Example 3**\n```\ninput:\n5 999 1000;6 1000 999\noutput: \n```\n*Explanation: Neither partner reached 1000 in both quarters.*\n\n**Follow-up**\nCan you process the records and accumulate the active IDs in a single pass before sorting?",
    editorialMarkdown: "## Identify Active Trading Partners\nFor each partner record (a row in the matrix), we need to extract their ID and confirm their trading volume in both Q1 and Q2. A linear scan checking both elements allows us to collect the `partner_id`s that meet the threshold. Afterwards, we sort the collected list of IDs to satisfy the requirement.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N log N) due to the sorting step, where N is the total number of records that matched.\n- **Space Complexity:** mathcal{O}(N) to store the filtered `partner_id`s before returning them.\n\n**Common Trap:**\nSorting by the volume amounts instead of the IDs, or forgetting to verify the condition strictly via logical AND (`&&`) for both quarters.",
    referenceSolution: {
      JAVASCRIPT: "function solve(records) {\n    let active = [];\n    for (let row of records) {\n        if (row[1] >= 1000 && row[2] >= 1000) {\n            active.push(row[0]);\n        }\n    }\n    active.sort((a, b) => a - b);\n    return active;\n}",
      TYPESCRIPT: "function solve(records: number[][]): number[] {\n    let active: number[] = [];\n    for (let row of records) {\n        if (row[1] >= 1000 && row[2] >= 1000) {\n            active.push(row[0]);\n        }\n    }\n    active.sort((a, b) => a - b);\n    return active;\n}",
      PYTHON: "def solve(records):\n    active = [row[0] for row in records if row[1] >= 1000 and row[2] >= 1000]\n    return sorted(active)",
      JAVA: "    static int[] solve(int[][] records) {\n        java.util.List<Integer> list = new java.util.ArrayList<>();\n        for (int[] r : records) {\n            if (r[1] >= 1000 && r[2] >= 1000) list.add(r[0]);\n        }\n        java.util.Collections.sort(list);\n        int[] res = new int[list.size()];\n        for (int i=0; i<list.size(); i++) res[i] = list.get(i);\n        return res;\n    }",
      CPP: "vector<int> solve(vector<vector<int>> records) {\n    vector<int> res;\n    for (auto& r : records) {\n        if (r[1] >= 1000 && r[2] >= 1000) res.push_back(r[0]);\n    }\n    std::sort(res.begin(), res.end());\n    return res;\n}",
      GO: "func solve(records [][]int) []int {\n    res := []int{}\n    for _, r := range records {\n        if r[1] >= 1000 && r[2] >= 1000 {\n            res = append(res, r[0])\n        }\n    }\n    for i := 0; i < len(res); i++ {\n        for j := i+1; j < len(res); j++ {\n            if res[i] > res[j] {\n                res[i], res[j] = res[j], res[i]\n            }\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "10 1000 1000;20 500 1200", expectedStdout: "10", isSample: true },
      { stdin: "15 1500 1500;10 2000 2000", expectedStdout: "10 15", isSample: true },
      { stdin: "5 999 1000;6 1000 999", expectedStdout: "" },
      { stdin: "1 1000 1000", expectedStdout: "1" },
      { stdin: "1 0 0", expectedStdout: "" },
      { stdin: "3 5000 5000;1 5000 5000;2 5000 5000", expectedStdout: "1 2 3" },
      { stdin: "99 1000 1001;100 1001 1000", expectedStdout: "99 100" },
      { stdin: "4 1000 2000;5 2000 1000;6 500 500", expectedStdout: "4 5" },
    ],
  }),

  p({
    ...base,
    slug: "most-frequent-supply-request",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Most Frequent Supply Request",
    patternTags: ["hash-map","frequency-count","counting","array"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are monitoring supply requests from various outposts. You are given an array `requests` where each integer represents the `item_id` of a requested supply. Determine which `item_id` has been requested the most times.\n\nYou may assume there is exactly one item that strictly has the highest frequency of requests.\n\n**Constraints**\n- `1 <= requests.length <= 40`\n- `1 <= requests[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 2 3\noutput: 2\n```\n*Explanation: Item 2 is requested twice, which is more than any other item.*\n\n**Example 2**\n```\ninput:\n5 5 5 1\noutput: 5\n```\n*Explanation: Item 5 dominates the requests.*\n\n**Example 3**\n```\ninput:\n10\noutput: 10\n```\n*Explanation: There is only one request, so item 10 is the most frequent.*\n\n**Follow-up**\nCan you find the most frequent request while performing only one pass over the array?",
    editorialMarkdown: "## Most Frequent Supply Request\nThis is a classic frequency counting problem. By iterating through the requested items and maintaining a hash map of item ID to its tally, we can systematically discover the most frequently requested item. Simultaneously keeping track of the `maxCount` and corresponding `maxItem` inside the loop allows us to return the answer as soon as the counting is done.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the number of supply requests, since checking or updating a hash map is mathcal{O}(1) on average.\n- **Space Complexity:** mathcal{O}(U) where U is the number of unique items, which bounds the size of our frequency map.\n\n**Common Trap:**\nAccidentally returning the maximum *count* of requests instead of returning the `item_id` itself.",
    referenceSolution: {
      JAVASCRIPT: "function solve(requests) {\n    let counts = {};\n    let maxCount = 0;\n    let maxItem = -1;\n    for (let req of requests) {\n        counts[req] = (counts[req] || 0) + 1;\n        if (counts[req] > maxCount) {\n            maxCount = counts[req];\n            maxItem = req;\n        }\n    }\n    return maxItem;\n}",
      TYPESCRIPT: "function solve(requests: number[]): number {\n    let counts: Record<number, number> = {};\n    let maxCount = 0;\n    let maxItem = -1;\n    for (let req of requests) {\n        counts[req] = (counts[req] || 0) + 1;\n        if (counts[req] > maxCount) {\n            maxCount = counts[req];\n            maxItem = req;\n        }\n    }\n    return maxItem;\n}",
      PYTHON: "def solve(requests):\n    counts = {}\n    for r in requests:\n        counts[r] = counts.get(r, 0) + 1\n    return max(counts, key=counts.get)",
      JAVA: "    static int solve(int[] requests) {\n        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();\n        int maxCount = 0, maxItem = -1;\n        for (int r : requests) {\n            int count = map.getOrDefault(r, 0) + 1;\n            map.put(r, count);\n            if (count > maxCount) {\n                maxCount = count;\n                maxItem = r;\n            }\n        }\n        return maxItem;\n    }",
      CPP: "int solve(vector<int> requests) {\n    std::unordered_map<int, int> counts;\n    int maxCount = 0, maxItem = -1;\n    for (int r : requests) {\n        counts[r]++;\n        if (counts[r] > maxCount) {\n            maxCount = counts[r];\n            maxItem = r;\n        }\n    }\n    return maxItem;\n}",
      GO: "func solve(requests []int) int {\n    counts := make(map[int]int)\n    maxCount, maxItem := 0, -1\n    for _, r := range requests {\n        counts[r]++\n        if counts[r] > maxCount {\n            maxCount = counts[r]\n            maxItem = r\n        }\n    }\n    return maxItem\n}",
    },
    tests: [
      { stdin: "1 2 2 3", expectedStdout: "2", isSample: true },
      { stdin: "5 5 5 1", expectedStdout: "5", isSample: true },
      { stdin: "10", expectedStdout: "10" },
      { stdin: "1 2 3 4 4", expectedStdout: "4" },
      { stdin: "99 99 88 88 88", expectedStdout: "88" },
      { stdin: "1 1 2 3 3 3 1 1", expectedStdout: "1" },
      { stdin: "7 8 7 8 7", expectedStdout: "7" },
      { stdin: "100 200 300 200 400", expectedStdout: "200" },
    ],
  }),
];
