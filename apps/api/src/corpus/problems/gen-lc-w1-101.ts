import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w1-101` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W1_101_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "clean-spaceship-registry",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Clean Spaceship Registry",
    patternTags: ["strings","whitespace","case-conversion"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 600,
    promptMarkdown: "As the dock master of a busy spaceport, you receive a single string `name` representing a spaceship registry name. However, the input systems are old and often add extra spaces or mix uppercase and lowercase letters.\n\nYou need to standardize this name. Remove all leading and trailing whitespace, and convert all characters to lowercase.\n\nGiven a string `name`, return the standardized string.\n\n**Constraints**\n- `1 <= name.length <= 100`\n- `name` consists of English letters and spaces.\n\n**Example 1**\n```\ninput:\n  SpACe ShiP  \noutput:\nspace ship\n```\n*Explanation: Spaces at the ends are trimmed and all characters are converted to lowercase.*\n\n**Example 2**\n```\ninput:\nVoyaGER\noutput:\nvoyager\n```\n*Explanation: No leading/trailing spaces, only case conversion is applied.*\n\n**Example 3**\n```\ninput:\n   A   \noutput:\na\n```\n*Explanation: Single letters are properly formatted.*\n\n**Follow-up**\nCan you implement the trimming logic manually without using built-in string functions?",
    editorialMarkdown: "## Clean Spaceship Registry\n\nThe problem requires us to apply two transformations to a string: trimming leading and trailing whitespace, and converting all uppercase letters to lowercase.\n\nMost modern programming languages provide built-in string manipulation functions such as `trim()` and `toLowerCase()` (or their equivalents). By applying these functions, we can generate the desired output.\n\n**Trap**: A common mistake is to forget that strings in many languages (like Java, Python, JavaScript) are immutable. You must assign the result of the `trim` and `lowercase` operations to a new string or return it directly, rather than expecting the original string to change.\n\n**Complexity:**\n- **Time:** O(N), where N is the length of the string. We must inspect every character.\n- **Space:** O(N) to store the result string.",
    referenceSolution: {
      JAVASCRIPT: "function solve(name) {\n    return name.trim().toLowerCase();\n}",
      TYPESCRIPT: "function solve(name: string): string {\n    return name.trim().toLowerCase();\n}",
      PYTHON: "def solve(name):\n    return name.strip().lower()",
      JAVA: "    static String solve(String name) {\n        return name.trim().toLowerCase();\n    }",
      CPP: "#include <string>\nusing namespace std;\nstring solve(string name) {\n    int start = 0, end = name.size() - 1;\n    while (start <= end && name[start] == ' ') start++;\n    while (end >= start && name[end] == ' ') end--;\n    if (start > end) return \"\";\n    string t = name.substr(start, end - start + 1);\n    for (char &c : t) {\n        if (c >= 'A' && c <= 'Z') c += 32;\n    }\n    return t;\n}",
      GO: "func solve(name string) string {\n    return strings.ToLower(strings.TrimSpace(name))\n}",
    },
    tests: [
      { stdin: "  SpACe ShiP  ", expectedStdout: "space ship", isSample: true },
      { stdin: "VoyaGER", expectedStdout: "voyager", isSample: true },
      { stdin: "   A   ", expectedStdout: "a" },
      { stdin: "     ", expectedStdout: "" },
      { stdin: "HELLO wOrLD", expectedStdout: "hello world" },
      { stdin: "   X Y z   ", expectedStdout: "x y z" },
      { stdin: " A B C D E ", expectedStdout: "a b c d e" },
      { stdin: "TEST", expectedStdout: "test" },
    ],
  }),

  p({
    ...base,
    slug: "invert-holographic-projection",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Invert Holographic Projection",
    patternTags: ["matrix","grid","reversal","array"],
    signatureId: "fn:matrix->matrix",
    avgSolveSeconds: 600,
    promptMarkdown: "A holographic projector displays a grid of pixels represented by a matrix of integers. Due to a hardware glitch, the image is upside down! You need to flip the entire projection vertically to restore the correct image.\n\nFlipping a matrix vertically means reversing the order of the rows. The first row becomes the last row, the second row becomes the second-to-last row, and so on.\n\nGiven an `m x n` integer matrix `grid`, return the vertically flipped matrix.\n\n**Constraints**\n- `1 <= m, n <= 40`\n- `-1000 <= grid[i][j] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2;\n3 4\noutput:\n3 4;1 2\n```\n*Explanation: The two rows are swapped.*\n\n**Example 2**\n```\ninput:\n1 2 3;\n4 5 6;\n7 8 9\noutput:\n7 8 9;4 5 6;1 2 3\n```\n*Explanation: The first and third rows are swapped, while the middle row stays in place.*\n\n**Example 3**\n```\ninput:\n5\noutput:\n5\n```\n*Explanation: A 1x1 matrix remains unchanged.*\n\n**Follow-up**\nCan you flip the matrix in-place with O(1) auxiliary space?",
    editorialMarkdown: "## Invert Holographic Projection\n\nTo flip a matrix vertically, we simply need to reverse the order of its rows.\n\nWe can achieve this by iterating through the first half of the rows (from index `0` to `m / 2 - 1`) and swapping row `i` with row `m - 1 - i`.\n\n**Trap**: A common mistake is to iterate over all rows instead of just the first half. If you iterate over all rows, you will swap the rows and then swap them back, resulting in the original matrix!\n\n**Complexity:**\n- **Time:** O(m * n), since we must touch every element in the matrix to perform the swaps.\n- **Space:** O(1) if we modify the matrix in-place, or O(m * n) if we construct and return a new matrix.",
    referenceSolution: {
      JAVASCRIPT: "function solve(grid) {\n    let m = grid.length;\n    let res = [];\n    for (let i = m - 1; i >= 0; i--) {\n        res.push(grid[i]);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(grid: number[][]): number[][] {\n    let m = grid.length;\n    let res: number[][] = [];\n    for (let i = m - 1; i >= 0; i--) {\n        res.push(grid[i]);\n    }\n    return res;\n}",
      PYTHON: "def solve(grid):\n    return grid[::-1]",
      JAVA: "    static int[][] solve(int[][] grid) {\n        int m = grid.length;\n        int n = grid[0].length;\n        int[][] res = new int[m][n];\n        for (int i = 0; i < m; i++) {\n            res[i] = grid[m - 1 - i].clone();\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<vector<int>> solve(vector<vector<int>> grid) {\n    int m = grid.size();\n    for (int i = 0; i < m / 2; i++) {\n        swap(grid[i], grid[m - 1 - i]);\n    }\n    return grid;\n}",
      GO: "func solve(grid [][]int) [][]int {\n    m := len(grid)\n    res := make([][]int, m)\n    for i := 0; i < m; i++ {\n        res[i] = grid[m - 1 - i]\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2;3 4", expectedStdout: "3 4;1 2", isSample: true },
      { stdin: "1 2 3;4 5 6;7 8 9", expectedStdout: "7 8 9;4 5 6;1 2 3", isSample: true },
      { stdin: "5", expectedStdout: "5" },
      { stdin: "1 2 3 4;5 6 7 8", expectedStdout: "5 6 7 8;1 2 3 4" },
      { stdin: "1;2;3;4", expectedStdout: "4;3;2;1" },
      { stdin: "0 0;0 0", expectedStdout: "0 0;0 0" },
      { stdin: "-1 -2;-3 -4;-5 -6", expectedStdout: "-5 -6;-3 -4;-1 -2" },
      { stdin: "10", expectedStdout: "10" },
    ],
  }),

  p({
    ...base,
    slug: "first-deployment-sector",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "First Deployment Sector",
    patternTags: ["hash-map","arrays","first-occurrence"],
    signatureId: "fn:ints,ints->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "The Galactic Federation keeps a chronological log of all spacefleet deployments. The log consists of two parallel arrays of the same length: `fleetIds` (the ID of the fleet deployed) and `sectorIds` (the sector it was deployed to).\n\nThe records are ordered chronologically. You want to analyze where each fleet was deployed on its *very first* mission.\n\nGiven the arrays `fleetIds` and `sectorIds`, return an array of `sectorIds` corresponding to the first deployment of each unique fleet. The result should be ordered by the first appearance of each fleet in the log.\n\n**Constraints**\n- `1 <= fleetIds.length == sectorIds.length <= 1000`\n- `1 <= fleetIds[i], sectorIds[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 1 3\n10 20 30 40\noutput:\n10 20 40\n```\n*Explanation: Fleet 1 first went to sector 10. Fleet 2 first went to sector 20. Fleet 3 first went to sector 40.*\n\n**Example 2**\n```\ninput:\n5 5 5\n100 200 300\noutput:\n100\n```\n*Explanation: Fleet 5's first deployment was to sector 100.*\n\n**Example 3**\n```\ninput:\n7 8 9\n11 22 33\noutput:\n11 22 33\n```\n*Explanation: Each fleet is deployed exactly once.*\n\n**Follow-up**\nCan you solve this with exactly one pass through the arrays?",
    editorialMarkdown: "## First Deployment Sector\n\nWe need to find the first sector each fleet was deployed to. Since the logs are strictly chronological, the first time we see a fleet ID in the array, the corresponding sector ID is its first deployment.\n\nWe can use a hash set (or a boolean array) to keep track of the fleets we have already seen as we iterate through the arrays from start to finish. If we encounter a `fleetId` that is not in our set, we add it to the set and append the corresponding `sectorId` to our result array.\n\n**Trap**: Don't use a hash map to map `fleetId` to `sectorId` and then iterate over the map's keys. Hash maps do not always preserve insertion order (depending on the language), and the problem requires the result to match the order of first appearances.\n\n**Complexity:**\n- **Time:** O(N), where N is the length of the log arrays.\n- **Space:** O(U), where U is the number of unique fleets, to store the set of seen fleets.",
    referenceSolution: {
      JAVASCRIPT: "function solve(fleetIds, sectorIds) {\n    let seen = new Set();\n    let res = [];\n    for (let i = 0; i < fleetIds.length; i++) {\n        if (!seen.has(fleetIds[i])) {\n            seen.add(fleetIds[i]);\n            res.push(sectorIds[i]);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(fleetIds: number[], sectorIds: number[]): number[] {\n    let seen = new Set<number>();\n    let res: number[] = [];\n    for (let i = 0; i < fleetIds.length; i++) {\n        if (!seen.has(fleetIds[i])) {\n            seen.add(fleetIds[i]);\n            res.push(sectorIds[i]);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(fleetIds, sectorIds):\n    seen = set()\n    res = []\n    for f, s in zip(fleetIds, sectorIds):\n        if f not in seen:\n            seen.add(f)\n            res.append(s)\n    return res",
      JAVA: "    static int[] solve(int[] fleetIds, int[] sectorIds) {\n        boolean[] seen = new boolean[1001];\n        int count = 0;\n        for (int f : fleetIds) {\n            if (!seen[f]) {\n                seen[f] = true;\n                count++;\n            }\n        }\n        int[] res = new int[count];\n        seen = new boolean[1001];\n        int idx = 0;\n        for (int i = 0; i < fleetIds.length; i++) {\n            if (!seen[fleetIds[i]]) {\n                seen[fleetIds[i]] = true;\n                res[idx++] = sectorIds[i];\n            }\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<int> fleetIds, vector<int> sectorIds) {\n    vector<bool> seen(1001, false);\n    vector<int> res;\n    for (int i = 0; i < fleetIds.size(); i++) {\n        if (!seen[fleetIds[i]]) {\n            seen[fleetIds[i]] = true;\n            res.push_back(sectorIds[i]);\n        }\n    }\n    return res;\n}",
      GO: "func solve(fleetIds []int, sectorIds []int) []int {\n    seen := make([]bool, 1001)\n    res := []int{}\n    for i := 0; i < len(fleetIds); i++ {\n        if !seen[fleetIds[i]] {\n            seen[fleetIds[i]] = true\n            res = append(res, sectorIds[i])\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 1 3\n10 20 30 40", expectedStdout: "10 20 40", isSample: true },
      { stdin: "5 5 5\n100 200 300", expectedStdout: "100", isSample: true },
      { stdin: "7 8 9\n11 22 33", expectedStdout: "11 22 33" },
      { stdin: "1\n10", expectedStdout: "10" },
      { stdin: "2 1 2 1 2 1\n5 6 7 8 9 10", expectedStdout: "5 6" },
      { stdin: "10 9 8 7 6 5\n1 2 3 4 5 6", expectedStdout: "1 2 3 4 5 6" },
      { stdin: "1 1 2 3 3\n10 20 30 40 50", expectedStdout: "10 30 40" },
      { stdin: "100 100\n100 200", expectedStdout: "100" },
    ],
  }),

  p({
    ...base,
    slug: "daily-cargo-manifest",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Daily Cargo Manifest",
    patternTags: ["hash-map","sorting","strings","grouping"],
    signatureId: "fn:strings->strings",
    avgSolveSeconds: 600,
    promptMarkdown: "An interstellar trading outpost receives numerous cargo shipments every day. Each log entry is a string formatted as `\"YYYY-MM-DD_CargoName\"`. \n\nYou need to generate a summary report of how many unique types of cargo arrived on each date.\n\nGiven an array of strings `logs`, return an array of strings formatted as `\"YYYY-MM-DD:count\"`, where `count` is the number of distinct `CargoName`s that arrived on that date. The returned array must be sorted in ascending order by date.\n\n**Constraints**\n- `1 <= logs.length <= 100`\n- `logs[i]` consists of exactly 10 characters for the date, an underscore `_`, and a non-empty string for the cargo name without any spaces.\n- The date format is strictly `YYYY-MM-DD`.\n\n**Example 1**\n```\ninput:\n2050-01-01_Titanium 2050-01-01_Titanium 2050-01-02_Plasma 2050-01-01_Uranium\noutput:\n2050-01-01:2 2050-01-02:1\n```\n*Explanation: On 2050-01-01, Titanium and Uranium arrived (2 unique types). On 2050-01-02, only Plasma arrived.*\n\n**Example 2**\n```\ninput:\n2023-10-15_Water\noutput:\n2023-10-15:1\n```\n*Explanation: A single arrival of Water on 2023-10-15.*\n\n**Example 3**\n```\ninput:\n2100-12-31_A 2100-12-30_B 2100-12-31_C 2100-12-30_B\noutput:\n2100-12-30:1 2100-12-31:2\n```\n*Explanation: Ordered by date. 12-30 had B. 12-31 had A and C.*\n\n**Follow-up**\nCan you ensure the summary generation is optimized even if the same cargo type arrives millions of times on the same day?",
    editorialMarkdown: "## Daily Cargo Manifest\n\nWe need to group the cargo entries by date and count the number of *distinct* cargo names for each date. \n\nWe can use a hash map where the keys are the dates and the values are hash sets. As we iterate through the `logs`, we extract the date (the first 10 characters) and the cargo name (the rest of the string). We then add the cargo name to the hash set associated with that date. The size of the hash set gives us the number of distinct cargo types.\n\nFinally, we extract all dates from the map, sort them in ascending order, and construct the result strings.\n\n**Trap**: The output must only count *distinct* cargo names per day. A simple counter for each day will overestimate the count if the same cargo type arrives multiple times. Furthermore, the result must be sorted by date.\n\n**Complexity:**\n- **Time:** O(N log N) to sort the dates, where N is the number of logs. Inserting into sets takes O(1) expected time per log.\n- **Space:** O(N) to store the hash map and sets.",
    referenceSolution: {
      JAVASCRIPT: "function solve(logs) {\n    let map = new Map();\n    for (let log of logs) {\n        let date = log.substring(0, 10);\n        let cargo = log.substring(11);\n        if (!map.has(date)) map.set(date, new Set());\n        map.get(date).add(cargo);\n    }\n    let dates = Array.from(map.keys()).sort();\n    let res = [];\n    for (let date of dates) {\n        res.push(`${date}:${map.get(date).size}`);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(logs: string[]): string[] {\n    let map = new Map<string, Set<string>>();\n    for (let log of logs) {\n        let date = log.substring(0, 10);\n        let cargo = log.substring(11);\n        if (!map.has(date)) map.set(date, new Set<string>());\n        map.get(date)!.add(cargo);\n    }\n    let dates = Array.from(map.keys()).sort();\n    let res: string[] = [];\n    for (let date of dates) {\n        res.push(`${date}:${map.get(date)!.size}`);\n    }\n    return res;\n}",
      PYTHON: "def solve(logs):\n    from collections import defaultdict\n    data = defaultdict(set)\n    for log in logs:\n        date, cargo = log[:10], log[11:]\n        data[date].add(cargo)\n    return [f\"{date}:{len(data[date])}\" for date in sorted(data.keys())]",
      JAVA: "    static String[] solve(String[] logs) {\n        java.util.TreeMap<String, java.util.HashSet<String>> map = new java.util.TreeMap<>();\n        for (String log : logs) {\n            String date = log.substring(0, 10);\n            String cargo = log.substring(11);\n            map.putIfAbsent(date, new java.util.HashSet<>());\n            map.get(date).add(cargo);\n        }\n        String[] res = new String[map.size()];\n        int i = 0;\n        for (String date : map.keySet()) {\n            res[i++] = date + \":\" + map.get(date).size();\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n#include <string>\n#include <map>\n#include <set>\nusing namespace std;\nvector<string> solve(vector<string> logs) {\n    map<string, set<string>> data;\n    for (string log : logs) {\n        string date = log.substr(0, 10);\n        string cargo = log.substr(11);\n        data[date].insert(cargo);\n    }\n    vector<string> res;\n    for (auto it = data.begin(); it != data.end(); it++) {\n        res.push_back(it->first + \":\" + to_string(it->second.size()));\n    }\n    return res;\n}",
      GO: "func solve(logs []string) []string {\n    data := make(map[string]map[string]bool)\n    for _, log := range logs {\n        date := log[:10]\n        cargo := log[11:]\n        if data[date] == nil {\n            data[date] = make(map[string]bool)\n        }\n        data[date][cargo] = true\n    }\n    dates := []string{}\n    for date := range data {\n        dates = append(dates, date)\n    }\n    for i := 0; i < len(dates); i++ {\n        for j := i + 1; j < len(dates); j++ {\n            if dates[i] > dates[j] {\n                dates[i], dates[j] = dates[j], dates[i]\n            }\n        }\n    }\n    res := []string{}\n    for _, date := range dates {\n        res = append(res, date + \":\" + strconv.Itoa(len(data[date])))\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "2050-01-01_Titanium 2050-01-01_Titanium 2050-01-02_Plasma 2050-01-01_Uranium", expectedStdout: "2050-01-01:2 2050-01-02:1", isSample: true },
      { stdin: "2023-10-15_Water", expectedStdout: "2023-10-15:1", isSample: true },
      { stdin: "2100-12-31_A 2100-12-30_B 2100-12-31_C 2100-12-30_B", expectedStdout: "2100-12-30:1 2100-12-31:2" },
      { stdin: "1999-01-01_OldTech", expectedStdout: "1999-01-01:1" },
      { stdin: "2022-02-02_X 2022-02-02_Y 2022-02-02_Z", expectedStdout: "2022-02-02:3" },
      { stdin: "2000-01-02_A 2000-01-01_A", expectedStdout: "2000-01-01:1 2000-01-02:1" },
      { stdin: "2020-10-10_Same 2020-10-10_Same 2020-10-10_Same", expectedStdout: "2020-10-10:1" },
      { stdin: "2020-01-01_A 2020-01-01_B 2020-02-01_C 2020-02-01_C", expectedStdout: "2020-01-01:2 2020-02-01:1" },
    ],
  }),
];
