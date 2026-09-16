import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w1-052` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W1_052_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "count-incoming-space-ships",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GRAPHS",
    title: "Count Incoming Space Ships",
    patternTags: ["graph","counting","adjacency-list","array"],
    signatureId: "fn:matrix,int->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "A network of `n` space stations is numbered `0` to `n - 1`. You are given an array of flight paths `flights`, where each `flights[i] = [u, v]` represents a single spaceship flight from station `u` to station `v`.\n\nWrite a function that returns an array of length `n`, where the `i`-th element is the total number of incoming flights to station `i`.\n\n**Constraints**\n- `1 <= n <= 100`\n- `0 <= flights.length <= 500`\n- `flights[i].length == 2`\n- `0 <= flights[i][0], flights[i][1] < n`\n\n**Example 1**\n```\ninput:\n0 1;0 2;1 2\n3\noutput: 0 1 2\n```\n*Explanation: Station 0 has 0 incoming flights. Station 1 has 1 (from 0). Station 2 has 2 (from 0 and 1).*\n\n**Example 2**\n```\ninput:\n1 0;2 0;3 0\n4\noutput: 3 0 0 0\n```\n*Explanation: Station 0 receives flights from 1, 2, and 3.*\n\n**Example 3**\n```\ninput:\n\n2\noutput: 0 0\n```\n*Explanation: No flights recorded.*\n\n**Follow-up**\nCan you solve this in mathcal{O}(N + F) time where F is the number of flights?",
    editorialMarkdown: "## Count Incoming Space Ships\nThis problem requires counting the in-degree of each node in a directed graph. We can use an array `res` of size `n`, initially filled with zeros. We iterate through the given `flights` matrix, and for each flight `[u, v]`, we increment the counter at index `v` (i.e., `res[v]++`). \n\n**Trap**: Make sure to check the size of each edge to avoid out-of-bounds errors if empty edges are passed, and remember that we only care about the destination `v`, not the source `u`.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N + F), where N is the number of stations and F is the number of flights. We initialize an array of size N and iterate through all F flights.\n- **Space Complexity:** mathcal{O}(N) to store the result array. auxiliary space is mathcal{O}(1).",
    referenceSolution: {
      JAVASCRIPT: "function solve(flights, n) {\n    let res = new Array(n).fill(0);\n    for (let f of flights) {\n        if (f.length === 2) {\n            res[f[1]]++;\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(flights: number[][], n: number): number[] {\n    let res = new Array(n).fill(0);\n    for (let f of flights) {\n        if (f.length === 2) {\n            res[f[1]]++;\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(flights, n):\n    res = [0] * n\n    for f in flights:\n        if len(f) == 2:\n            res[f[1]] += 1\n    return res",
      JAVA: "    static int[] solve(int[][] flights, int n) {\n        int[] res = new int[n];\n        for (int[] f : flights) {\n            if (f.length == 2) {\n                res[f[1]]++;\n            }\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<vector<int>> flights, int n) {\n    vector<int> res(n, 0);\n    for (auto f : flights) {\n        if (f.size() == 2) {\n            res[f[1]]++;\n        }\n    }\n    return res;\n}",
      GO: "func solve(flights [][]int, n int) []int {\n    res := make([]int, n)\n    for _, f := range flights {\n        if len(f) == 2 {\n            res[f[1]]++\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "0 1;0 2;1 2\n3", expectedStdout: "0 1 2", isSample: true },
      { stdin: "1 0;2 0;3 0\n4", expectedStdout: "3 0 0 0", isSample: true },
      { stdin: "\n2", expectedStdout: "0 0" },
      { stdin: "0 1;2 3\n5", expectedStdout: "0 1 0 1 0" },
      { stdin: "1 0;1 0\n2", expectedStdout: "2 0" },
      { stdin: "0 1;2 1;0 3\n6", expectedStdout: "0 2 0 1 0 0" },
      { stdin: "\n1", expectedStdout: "0" },
      { stdin: "0 1;1 2;2 0\n3", expectedStdout: "1 1 1" },
    ],
  }),

  p({
    ...base,
    slug: "identify-protected-habitats",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Detect High-Latency Connections",
    patternTags: ["array","linear-scan","filtering"],
    signatureId: "fn:ints,int->ints",
    avgSolveSeconds: 300,
    promptMarkdown: "You are analyzing a sequence of ping response times from a series of network nodes. You are given an integer array `ping_times` and an integer `limit`.\n\nA node at index `i` (where `i > 0`) is considered **flagged** if the ping time of the node immediately before it (at index `i - 1`) is strictly greater than `limit`.\n\nReturn an array of the indices of all flagged nodes in ascending order.\n\n**Constraints**\n- `2 <= ping_times.length <= 100`\n- `1 <= ping_times[i] <= 100`\n- `1 <= limit <= 100`\n\n**Example 1**\n```\ninput:\n10 20 30 40 50\n25\noutput: 3 4\n```\n*Explanation: The limit is 25. The ping time at index 2 is 30, so index 3 is flagged. The ping time at index 3 is 40, so index 4 is flagged.*\n\n**Example 2**\n```\ninput:\n5 5 5 5\n10\noutput: \n```\n*Explanation: No ping time exceeds the limit of 10, so no nodes are flagged.*\n\n**Example 3**\n```\ninput:\n15 10 20 5\n10\noutput: 1 3\n```\n*Explanation: ping_times[0] (15) > 10, flagging index 1. ping_times[2] (20) > 10, flagging index 3.*\n\n**Follow-up**\nCan you solve this with a single pass through the array?",
    editorialMarkdown: "## Identify Protected Habitats\nWe iterate through the array starting from index 1. For each index `i`, we examine the altitude at the previous index `i - 1`. If `altitudes[i - 1]` is strictly greater than `threshold`, we append `i` to our result array. \n\n**Trap**: Make sure to check the element at `i - 1` against the threshold, not the current element `i`. Also, the condition is strictly greater (`>`), not greater than or equal to (`>=`).\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N), where N is the number of habitats, because we traverse the list exactly once.\n- **Space Complexity:** mathcal{O}(1) auxiliary space, since we only use memory to build the answer array itself.",
    referenceSolution: {
      JAVASCRIPT: "function solve(altitudes, threshold) {\n    let res = [];\n    for (let i = 1; i < altitudes.length; i++) {\n        if (altitudes[i - 1] > threshold) {\n            res.push(i);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(altitudes: number[], threshold: number): number[] {\n    let res: number[] = [];\n    for (let i = 1; i < altitudes.length; i++) {\n        if (altitudes[i - 1] > threshold) {\n            res.push(i);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(altitudes, threshold):\n    res = []\n    for i in range(1, len(altitudes)):\n        if altitudes[i - 1] > threshold:\n            res.append(i)\n    return res",
      JAVA: "    static int[] solve(int[] altitudes, int threshold) {\n        int count = 0;\n        for (int i = 1; i < altitudes.length; i++) {\n            if (altitudes[i - 1] > threshold) {\n                count++;\n            }\n        }\n        int[] res = new int[count];\n        int idx = 0;\n        for (int i = 1; i < altitudes.length; i++) {\n            if (altitudes[i - 1] > threshold) {\n                res[idx++] = i;\n            }\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<int> altitudes, int threshold) {\n    vector<int> res;\n    for (int i = 1; i < altitudes.size(); i++) {\n        if (altitudes[i - 1] > threshold) {\n            res.push_back(i);\n        }\n    }\n    return res;\n}",
      GO: "func solve(altitudes []int, threshold int) []int {\n    var res []int\n    for i := 1; i < len(altitudes); i++ {\n        if altitudes[i-1] > threshold {\n            res = append(res, i)\n        }\n    }\n    if res == nil {\n        return []int{}\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "10 20 30 40 50\n25", expectedStdout: "3 4", isSample: true },
      { stdin: "5 5 5 5\n10", expectedStdout: "", isSample: true },
      { stdin: "15 10 20 5\n10", expectedStdout: "1 3", isSample: true },
      { stdin: "100 100 100 100\n99", expectedStdout: "1 2 3" },
      { stdin: "100 100\n100", expectedStdout: "" },
      { stdin: "5 1\n4", expectedStdout: "1" },
      { stdin: "50 50 50 50 50 50\n10", expectedStdout: "1 2 3 4 5" },
      { stdin: "1 50 1 50 1\n10", expectedStdout: "2 4" },
    ],
  }),

  p({
    ...base,
    slug: "pairing-mirror-runes",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Match Reversible Security Tags",
    patternTags: ["array","strings","hash-set","counting"],
    signatureId: "fn:strings->int",
    avgSolveSeconds: 350,
    promptMarkdown: "A security system logs a sequence of two-character `tags`. Some tags are exact reverses of each other (for example, \"xy\" and \"yx\").\n\nYou must determine the maximum number of pairs of tags you can form such that the two tags in each pair are exact reverses of each other. Each tag from the given list can be used in at most one pair.\n\n**Constraints**\n- `1 <= tags.length <= 50`\n- `tags[i].length == 2`\n- `tags` contains only lowercase English letters.\n- All strings in `tags` are unique.\n\n**Example 1**\n```\ninput:\nab cd ba dc ef\noutput: 2\n```\n*Explanation: \"ab\" can be paired with \"ba\", and \"cd\" can be paired with \"dc\".*\n\n**Example 2**\n```\ninput:\nxy zz yx\noutput: 1\n```\n*Explanation: \"xy\" pairs with \"yx\". There is only one \"zz\", so it cannot form a pair.*\n\n**Example 3**\n```\ninput:\naa bb cc\noutput: 0\n```\n*Explanation: There are no two distinct strings that are reverses of each other.*\n\n**Follow-up**\nCan you solve this using a hash set for mathcal{O}(N) time complexity?",
    editorialMarkdown: "## Pairing Mirror Runes\nBecause all strings in `runes` are unique and exactly 2 characters long, we are just looking for pairs of strings `(runes[i], runes[j])` such that `runes[i] == reverse(runes[j])`. Since each string is unique, any string can pair with exactly one other string (its reverse). Thus, we can safely just count how many times we find a mirrored pair using nested loops checking `i < j`.\n\n**Trap**: Make sure to test `i < j` to avoid counting pairs twice or pairing a string with itself, although the uniqueness constraint prevents \"aa\" pairing with itself from being an issue (because there is no other \"aa\" to pair with, and we need two distinct indices).\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N^2) using brute force. Given N ≤ 50, this requires at most 1250 comparisons, which easily passes. It could be optimized to mathcal{O}(N) with a hash set.\n- **Space Complexity:** mathcal{O}(1) as no extra space is needed beyond a counter.",
    referenceSolution: {
      JAVASCRIPT: "function solve(runes) {\n    let ans = 0;\n    for (let i = 0; i < runes.length; i++) {\n        for (let j = i + 1; j < runes.length; j++) {\n            if (runes[i][0] === runes[j][1] && runes[i][1] === runes[j][0]) {\n                ans++;\n            }\n        }\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(runes: string[]): number {\n    let ans = 0;\n    for (let i = 0; i < runes.length; i++) {\n        for (let j = i + 1; j < runes.length; j++) {\n            if (runes[i][0] === runes[j][1] && runes[i][1] === runes[j][0]) {\n                ans++;\n            }\n        }\n    }\n    return ans;\n}",
      PYTHON: "def solve(runes):\n    ans = 0\n    for i in range(len(runes)):\n        for j in range(i + 1, len(runes)):\n            if runes[i][0] == runes[j][1] and runes[i][1] == runes[j][0]:\n                ans += 1\n    return ans",
      JAVA: "    static int solve(String[] runes) {\n        int ans = 0;\n        for (int i = 0; i < runes.length; i++) {\n            for (int j = i + 1; j < runes.length; j++) {\n                if (runes[i].charAt(0) == runes[j].charAt(1) && runes[i].charAt(1) == runes[j].charAt(0)) {\n                    ans++;\n                }\n            }\n        }\n        return ans;\n    }",
      CPP: "#include <vector>\n#include <string>\nusing namespace std;\nint solve(vector<string> runes) {\n    int ans = 0;\n    for (int i = 0; i < runes.size(); i++) {\n        for (int j = i + 1; j < runes.size(); j++) {\n            if (runes[i][0] == runes[j][1] && runes[i][1] == runes[j][0]) {\n                ans++;\n            }\n        }\n    }\n    return ans;\n}",
      GO: "func solve(runes []string) int {\n    ans := 0\n    for i := 0; i < len(runes); i++ {\n        for j := i + 1; j < len(runes); j++ {\n            if runes[i][0] == runes[j][1] && runes[i][1] == runes[j][0] {\n                ans++\n            }\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "ab cd ba dc ef", expectedStdout: "2", isSample: true },
      { stdin: "xy zz yx", expectedStdout: "1", isSample: true },
      { stdin: "aa bb cc", expectedStdout: "0", isSample: true },
      { stdin: "ab ac ad ae", expectedStdout: "0" },
      { stdin: "ab ba cd dc ef fe", expectedStdout: "3" },
      { stdin: "xx", expectedStdout: "0" },
      { stdin: "za az zb bz zc", expectedStdout: "2" },
      { stdin: "ab cd ef gh hg fe dc ba", expectedStdout: "4" },
    ],
  }),

  p({
    ...base,
    slug: "minimum-fuel-to-gather-drones",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Aligning Robotic Arms",
    patternTags: ["math","array","counting","greedy"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are calibrating a series of robotic arms on a straight track. You are provided with an integer array `locations`, where `locations[i]` represents the coordinate of the `i`-th robotic arm.\n\nTo optimize power, sliding an arm by `2` units in either direction consumes `0` energy. Sliding an arm by `1` unit in either direction consumes `1` unit of energy.\n\nDetermine the minimum total energy required to align all robotic arms at the exact same coordinate.\n\n**Constraints**\n- `1 <= locations.length <= 100`\n- `1 <= locations[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 3\noutput: 1\n```\n*Explanation: Slide the arm at coordinate 1 to 3 (energy 0). The arms are now at 3, 2, 3. Slide the arm at 2 to 3 (energy 1). Total energy is 1.*\n\n**Example 2**\n```\ninput:\n2 2 2 3 3\noutput: 2\n```\n*Explanation: Slide both arms at coordinate 3 to coordinate 2 (energy 1 each). Total energy is 2.*\n\n**Example 3**\n```\ninput:\n1 100\noutput: 1\n```\n*Explanation: One arm is at an odd coordinate, the other at an even coordinate. One must slide by 1 unit to match the parity of the other. Energy is 1.*\n\n**Follow-up**\nWhat is the relationship between the energy consumption and the parity (odd/even) of the arm coordinates?",
    editorialMarkdown: "## Minimum Fuel to Gather Drones\nMoving a drone by 2 units costs 0 fuel. This means that a drone can move freely to any coordinate with the same parity (odd/even) as its current position. A drone only requires 1 fuel when it must change its parity by moving exactly 1 unit. Therefore, our goal is simply to make all drones have the same parity. \n\nTo minimize fuel cost, we count the number of drones at even positions and the number of drones at odd positions, and we return the minimum of these two counts.\n\n**Trap**: Make sure to recognize that we are not finding an optimal meeting coordinate mathematically, but instead just picking the parity (odd or even) that the majority of drones already share.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N), where N is the length of `positions`, as we examine each drone exactly once.\n- **Space Complexity:** mathcal{O}(1), as we only use two counters.",
    referenceSolution: {
      JAVASCRIPT: "function solve(positions) {\n    let evens = 0, odds = 0;\n    for (let p of positions) {\n        if (p % 2 === 0) evens++;\n        else odds++;\n    }\n    return Math.min(evens, odds);\n}",
      TYPESCRIPT: "function solve(positions: number[]): number {\n    let evens = 0, odds = 0;\n    for (let p of positions) {\n        if (p % 2 === 0) evens++;\n        else odds++;\n    }\n    return Math.min(evens, odds);\n}",
      PYTHON: "def solve(positions):\n    evens = sum(1 for p in positions if p % 2 == 0)\n    odds = len(positions) - evens\n    return min(evens, odds)",
      JAVA: "    static int solve(int[] positions) {\n        int evens = 0, odds = 0;\n        for (int p : positions) {\n            if (p % 2 == 0) evens++;\n            else odds++;\n        }\n        return Math.min(evens, odds);\n    }",
      CPP: "#include <vector>\nusing namespace std;\nint solve(vector<int> positions) {\n    int evens = 0, odds = 0;\n    for (int p : positions) {\n        if (p % 2 == 0) evens++;\n        else odds++;\n    }\n    return min(evens, odds);\n}",
      GO: "func solve(positions []int) int {\n    evens, odds := 0, 0\n    for _, p := range positions {\n        if p%2 == 0 {\n            evens++\n        } else {\n            odds++\n        }\n    }\n    if evens < odds {\n        return evens\n    }\n    return odds\n}",
    },
    tests: [
      { stdin: "1 2 3", expectedStdout: "1", isSample: true },
      { stdin: "2 2 2 3 3", expectedStdout: "2", isSample: true },
      { stdin: "1 100", expectedStdout: "1", isSample: true },
      { stdin: "2 4 6 8 10", expectedStdout: "0" },
      { stdin: "1 3 5 7 9", expectedStdout: "0" },
      { stdin: "1 2 3 4 5 6", expectedStdout: "3" },
      { stdin: "5", expectedStdout: "0" },
      { stdin: "1 1 1 2 1 1", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "find-distant-twin-stars",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Find Distant Twin Stars",
    patternTags: ["array","brute-force","hash-map"],
    signatureId: "fn:ints,int->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "Astronomers have recorded the brightness of a series of stars in an array `luminosities`. They are looking for a pair of twin stars (stars with the exact same luminosity) that are separated by at least `minDistance` positions in the array.\n\nFind the first index `i` and an index `j` such that:\n1. `0 <= i < j < luminosities.length`\n2. `j - i >= minDistance`\n3. `luminosities[i] == luminosities[j]`\n\nIf there are multiple such pairs, return the one with the smallest `i`. If there are still ties, return the one with the smallest `j`. Return the result as an array `[i, j]`. If no such pair exists, return `[-1, -1]`.\n\n**Constraints**\n- `1 <= luminosities.length <= 100`\n- `1 <= luminosities[k] <= 100`\n- `1 <= minDistance <= 100`\n\n**Example 1**\n```\ninput:\n4 1 2 3 1 4\n3\noutput: 0 5\n```\n*Explanation: luminosities[0] == luminosities[5] == 4, and 5 - 0 >= 3. luminosities[1] == luminosities[4] == 1, and 4 - 1 >= 3. The pair with the smallest i is [0, 5].*\n\n**Example 2**\n```\ninput:\n5 5 5\n2\noutput: 0 2\n```\n*Explanation: luminosities[0] == luminosities[2] == 5, and 2 - 0 = 2 >= 2.*\n\n**Example 3**\n```\ninput:\n1 2 3 4\n1\noutput: -1 -1\n```\n*Explanation: All luminosities are unique, so no twin stars exist.*\n\n**Follow-up**\nCan you optimize this to run in mathcal{O}(N) time?",
    editorialMarkdown: "## Find Distant Twin Stars\nWe are asked to find the first pair of indices `(i, j)` where `j - i >= minDistance` and `luminosities[i] == luminosities[j]`. Because we want the pair with the smallest `i`, and then the smallest `j`, we can simply use two nested loops. The outer loop will iterate through `i` from `0` to `n - 1`, and the inner loop will iterate through `j` from `i + minDistance` to `n - 1`. \n\n**Trap**: Make sure the inner loop starts at exactly `i + minDistance` and bounds check against the end of the array.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N^2) in the worst case, as we use two nested loops over an array of size N ≤ 100. This is perfectly fine given the constraints.\n- **Space Complexity:** mathcal{O}(1), since we do not store any extra arrays or hash maps.",
    referenceSolution: {
      JAVASCRIPT: "function solve(luminosities, minDistance) {\n    for (let i = 0; i < luminosities.length; i++) {\n        for (let j = i + minDistance; j < luminosities.length; j++) {\n            if (luminosities[i] === luminosities[j]) {\n                return [i, j];\n            }\n        }\n    }\n    return [-1, -1];\n}",
      TYPESCRIPT: "function solve(luminosities: number[], minDistance: number): number[] {\n    for (let i = 0; i < luminosities.length; i++) {\n        for (let j = i + minDistance; j < luminosities.length; j++) {\n            if (luminosities[i] === luminosities[j]) {\n                return [i, j];\n            }\n        }\n    }\n    return [-1, -1];\n}",
      PYTHON: "def solve(luminosities, minDistance):\n    for i in range(len(luminosities)):\n        for j in range(i + minDistance, len(luminosities)):\n            if luminosities[i] == luminosities[j]:\n                return [i, j]\n    return [-1, -1]",
      JAVA: "    static int[] solve(int[] luminosities, int minDistance) {\n        for (int i = 0; i < luminosities.length; i++) {\n            for (int j = i + minDistance; j < luminosities.length; j++) {\n                if (luminosities[i] == luminosities[j]) {\n                    return new int[]{i, j};\n                }\n            }\n        }\n        return new int[]{-1, -1};\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<int> luminosities, int minDistance) {\n    for (int i = 0; i < luminosities.size(); i++) {\n        for (int j = i + minDistance; j < luminosities.size(); j++) {\n            if (luminosities[i] == luminosities[j]) {\n                return {i, j};\n            }\n        }\n    }\n    return {-1, -1};\n}",
      GO: "func solve(luminosities []int, minDistance int) []int {\n    for i := 0; i < len(luminosities); i++ {\n        for j := i + minDistance; j < len(luminosities); j++ {\n            if luminosities[i] == luminosities[j] {\n                return []int{i, j}\n            }\n        }\n    }\n    return []int{-1, -1}\n}",
    },
    tests: [
      { stdin: "4 1 2 3 1 4\n3", expectedStdout: "0 5", isSample: true },
      { stdin: "5 5 5\n2", expectedStdout: "0 2", isSample: true },
      { stdin: "1 2 3 4\n1", expectedStdout: "-1 -1", isSample: true },
      { stdin: "1 1\n2", expectedStdout: "-1 -1" },
      { stdin: "1 1\n1", expectedStdout: "0 1" },
      { stdin: "2 3 4 5 3 2\n3", expectedStdout: "0 5" },
      { stdin: "10 20 30 40 50\n5", expectedStdout: "-1 -1" },
      { stdin: "100 2 3 100 4 100\n3", expectedStdout: "0 3" },
    ],
  }),
];
