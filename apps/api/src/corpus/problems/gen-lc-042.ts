import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-042` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_042_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "inactive-logged-in-users",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Inactive Logged-in Users",
    patternTags: ["array","hash-set","set-difference","hashing"],
    signatureId: "fn:matrix->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "You are analyzing server logs to identify users who logged into the system but never started a game session. \n\nYou are given a matrix `logs` where each row represents an event and contains two integers: `[user_id, action_type]`. \n- An `action_type` of `0` means the user logged in.\n- An `action_type` of `1` means the user played a game.\n\nReturn a sorted list of `user_id`s for all users who logged in at least once but never played a game (in ascending order).\n\n**Constraints**\n- `1 <= logs.length <= 40`\n- `logs[i].length == 2`\n- `1 <= user_id <= 1000`\n- `action_type` is either `0` or `1`.\n\n**Example 1**\n```\ninput:\n10 0;10 1;20 0\noutput: 20\n```\n*Explanation: User 10 logged in and played. User 20 logged in but did not play.*\n\n**Example 2**\n```\ninput:\n15 0;15 0;10 1;10 0\noutput: 15\n```\n*Explanation: User 15 logged in twice and never played. User 10 played, so they are excluded.*\n\n**Example 3**\n```\ninput:\n5 1;6 1\noutput: \n```\n*Explanation: Neither user has a login event without a play event. (In fact, they only have play events).*\n\n**Follow-up**\nCan you process the records and accumulate the inactive users in a single pass before sorting?",
    editorialMarkdown: "## Inactive Logged-in Users\nWe can iterate through the logs and construct two sets: one for users who logged in, and one for users who played. Finally, we can take the difference of these sets to find users who logged in but never played, and sort the result.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N log N) due to sorting, where N is the number of users.\n- **Space Complexity:** mathcal{O}(N) to store the sets.\n\n**Common Trap:**\nFailing to deduplicate the user IDs before sorting.",
    referenceSolution: {
      JAVASCRIPT: "function solve(logs) {\n    let logins = new Set();\n    let played = new Set();\n    for (let r of logs) {\n        if (r[1] === 0) logins.add(r[0]);\n        else if (r[1] === 1) played.add(r[0]);\n    }\n    let res = [];\n    for (let u of logins) {\n        if (!played.has(u)) res.push(u);\n    }\n    res.sort((a, b) => a - b);\n    return res;\n}",
      TYPESCRIPT: "function solve(logs: number[][]): number[] {\n    let logins = new Set<number>();\n    let played = new Set<number>();\n    for (let r of logs) {\n        if (r[1] === 0) logins.add(r[0]);\n        else if (r[1] === 1) played.add(r[0]);\n    }\n    let res: number[] = [];\n    for (let u of logins) {\n        if (!played.has(u)) res.push(u);\n    }\n    res.sort((a, b) => a - b);\n    return res;\n}",
      PYTHON: "def solve(logs):\n    logins = set(r[0] for r in logs if r[1] == 0)\n    played = set(r[0] for r in logs if r[1] == 1)\n    return sorted(list(logins - played))",
      JAVA: "    static int[] solve(int[][] logs) {\n        java.util.Set<Integer> logins = new java.util.HashSet<>();\n        java.util.Set<Integer> played = new java.util.HashSet<>();\n        for (int[] r : logs) {\n            if (r[1] == 0) logins.add(r[0]);\n            else if (r[1] == 1) played.add(r[0]);\n        }\n        java.util.List<Integer> list = new java.util.ArrayList<>();\n        for (int u : logins) {\n            if (!played.contains(u)) list.add(u);\n        }\n        java.util.Collections.sort(list);\n        int[] res = new int[list.size()];\n        for (int i=0; i<list.size(); i++) res[i] = list.get(i);\n        return res;\n    }",
      CPP: "vector<int> solve(vector<vector<int>> logs) {\n    std::unordered_set<int> logins;\n    std::unordered_set<int> played;\n    for (auto& r : logs) {\n        if (r[1] == 0) logins.insert(r[0]);\n        else if (r[1] == 1) played.insert(r[0]);\n    }\n    vector<int> res;\n    for (int u : logins) {\n        if (played.find(u) == played.end()) {\n            res.push_back(u);\n        }\n    }\n    std::sort(res.begin(), res.end());\n    return res;\n}",
      GO: "func solve(logs [][]int) []int {\n    logins := make(map[int]bool)\n    played := make(map[int]bool)\n    for _, r := range logs {\n        if r[1] == 0 {\n            logins[r[0]] = true\n        } else if r[1] == 1 {\n            played[r[0]] = true\n        }\n    }\n    res := []int{}\n    for u := range logins {\n        if !played[u] {\n            res = append(res, u)\n        }\n    }\n    for i := 0; i < len(res); i++ {\n        for j := i+1; j < len(res); j++ {\n            if res[i] > res[j] {\n                res[i], res[j] = res[j], res[i]\n            }\n        }\n    }\n    return res;\n}",
    },
    tests: [
      { stdin: "10 0;10 1;20 0", expectedStdout: "20", isSample: true },
      { stdin: "15 0;15 0;10 1;10 0", expectedStdout: "15", isSample: true },
      { stdin: "5 1;6 1", expectedStdout: "" },
      { stdin: "1 0", expectedStdout: "1" },
      { stdin: "1 1", expectedStdout: "" },
      { stdin: "1 0;2 0;3 0", expectedStdout: "1 2 3" },
      { stdin: "1 0;1 0;1 0", expectedStdout: "1" },
      { stdin: "1 0;1 1;2 0;2 1", expectedStdout: "" },
    ],
  }),

  p({
    ...base,
    slug: "rotate-conveyor-belts",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Rotate Conveyor Belts",
    patternTags: ["array","matrix","simulation","shifts"],
    signatureId: "fn:matrix->matrix",
    avgSolveSeconds: 700,
    promptMarkdown: "You are operating a grid of conveyor belts represented by an m \times n matrix `grid`. Each row is a separate conveyor belt.\n\nYou want to apply one cycle of rotation to the grid:\n- For every **even-indexed** row (0, 2, 4, dots), cyclically shift the elements **right** by 1 position. (The last element wraps around to become the first).\n- For every **odd-indexed** row (1, 3, 5, dots), cyclically shift the elements **left** by 1 position. (The first element wraps around to become the last).\n\nReturn the resulting matrix after these operations.\n\n**Constraints**\n- `1 <= grid.length <= 40`\n- `1 <= grid[i].length <= 40`\n- `1 <= grid[i][j] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 3;4 5 6;7 8 9\noutput: 3 1 2;5 6 4;9 7 8\n```\n*Explanation: Row 0 shifts right. Row 1 shifts left. Row 2 shifts right.*\n\n**Example 2**\n```\ninput:\n10 20;30 40\noutput: 20 10;40 30\n```\n*Explanation: Row 0 shifts right to become 20 10. Row 1 shifts left to become 40 30.*\n\n**Example 3**\n```\ninput:\n5\noutput: 5\n```\n*Explanation: A single element shifted left or right remains the same.*\n\n**Follow-up**\nWhat is the most efficient way to achieve this using slice operations in your language?",
    editorialMarkdown: "## Rotate Conveyor Belts\nWe can iterate through each row of the matrix and construct a new row based on the cyclic shift rules. If the row index is even, we shift elements right (the last element moves to the front). If the row index is odd, we shift elements left (the first element moves to the back). We append each newly constructed row to a result matrix.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(R \times C) where R is the number of rows and C is the number of columns, as we inspect each element once.\n- **Space Complexity:** mathcal{O}(R \times C) to construct the new matrix.\n\n**Common Trap:**\nForgetting to handle edge cases where a row might have only a single element (which means a shift results in the identical row), or mistakenly mutating the original matrix in-place while reading from it.",
    referenceSolution: {
      JAVASCRIPT: "function solve(grid) {\n    if (!grid.length) return grid;\n    let res = [];\n    for (let i = 0; i < grid.length; i++) {\n        let row = grid[i];\n        if (row.length <= 1) {\n            res.push([...row]);\n            continue;\n        }\n        if (i % 2 === 0) {\n            res.push([row[row.length - 1], ...row.slice(0, -1)]);\n        } else {\n            res.push([...row.slice(1), row[0]]);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(grid: number[][]): number[][] {\n    if (!grid.length) return grid;\n    let res: number[][] = [];\n    for (let i = 0; i < grid.length; i++) {\n        let row = grid[i];\n        if (row.length <= 1) {\n            res.push([...row]);\n            continue;\n        }\n        if (i % 2 === 0) {\n            res.push([row[row.length - 1], ...row.slice(0, -1)]);\n        } else {\n            res.push([...row.slice(1), row[0]]);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(grid):\n    if not grid: return grid\n    res = []\n    for i in range(len(grid)):\n        row = grid[i]\n        if len(row) <= 1:\n            res.append(list(row))\n            continue\n        if i % 2 == 0:\n            res.append([row[-1]] + row[:-1])\n        else:\n            res.append(row[1:] + [row[0]])\n    return res",
      JAVA: "    static int[][] solve(int[][] grid) {\n        if (grid.length == 0) return grid;\n        int[][] res = new int[grid.length][grid[0].length];\n        for (int i = 0; i < grid.length; i++) {\n            int len = grid[i].length;\n            if (len <= 1) {\n                res[i] = grid[i];\n                continue;\n            }\n            if (i % 2 == 0) {\n                res[i][0] = grid[i][len-1];\n                for (int j=1; j<len; j++) res[i][j] = grid[i][j-1];\n            } else {\n                res[i][len-1] = grid[i][0];\n                for (int j=0; j<len-1; j++) res[i][j] = grid[i][j+1];\n            }\n        }\n        return res;\n    }",
      CPP: "vector<vector<int>> solve(vector<vector<int>> grid) {\n    vector<vector<int>> res;\n    if (grid.empty()) return res;\n    for (size_t i = 0; i < grid.size(); ++i) {\n        vector<int> row = grid[i];\n        if (row.size() <= 1) {\n            res.push_back(row);\n            continue;\n        }\n        if (i % 2 == 0) {\n            int last = row.back();\n            row.pop_back();\n            row.insert(row.begin(), last);\n        } else {\n            int first = row.front();\n            row.erase(row.begin());\n            row.push_back(first);\n        }\n        res.push_back(row);\n    }\n    return res;\n}",
      GO: "func solve(grid [][]int) [][]int {\n    res := [][]int{}\n    if len(grid) == 0 { return res }\n    for i, r := range grid {\n        row := make([]int, len(r))\n        copy(row, r)\n        if len(row) <= 1 {\n            res = append(res, row)\n            continue\n        }\n        if i % 2 == 0 {\n            last := row[len(row)-1]\n            newRow := []int{last}\n            newRow = append(newRow, row[:len(row)-1]...)\n            res = append(res, newRow)\n        } else {\n            first := row[0]\n            newRow := append(row[1:], first)\n            res = append(res, newRow)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 2 3;4 5 6;7 8 9", expectedStdout: "3 1 2;5 6 4;9 7 8", isSample: true },
      { stdin: "10 20;30 40", expectedStdout: "20 10;40 30", isSample: true },
      { stdin: "5", expectedStdout: "5", isSample: true },
      { stdin: "1;2;3", expectedStdout: "1;2;3" },
      { stdin: "1 2 2 3;1 2 3 3;1 2 2 3", expectedStdout: "3 1 2 2;2 3 3 1;3 1 2 2" },
      { stdin: "1 1 1;1 1 1", expectedStdout: "1 1 1;1 1 1" },
      { stdin: "1 1 1 1 1;2 2 2 2 2", expectedStdout: "1 1 1 1 1;2 2 2 2 2" },
      { stdin: "1 2;3 4;5 6", expectedStdout: "2 1;4 3;6 5" },
    ],
  }),

  p({
    ...base,
    slug: "max-unique-guests-per-day",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Maximum Unique Guests per Day",
    patternTags: ["array","hash-map","hash-set","hashing","aggregation"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 500,
    promptMarkdown: "You are managing a park where visitors scan their tickets at the entrance. The logs are provided as a matrix `logs` where each row is a record `[day, guest_id]`.\n\nYou want to find out the maximum number of unique guests that visited on any single day.\n\nReturn an integer representing the highest count of unique guests on a single day.\n\n**Constraints**\n- `1 <= logs.length <= 40`\n- `logs[i].length == 2`\n- `1 <= day <= 365`\n- `1 <= guest_id <= 1000`\n\n**Example 1**\n```\ninput:\n1 10;1 10;1 20;2 10\noutput: 2\n```\n*Explanation: On Day 1, guests 10 and 20 visited (2 unique guests). On Day 2, guest 10 visited (1 unique guest). The maximum is 2.*\n\n**Example 2**\n```\ninput:\n5 50;5 50;5 50\noutput: 1\n```\n*Explanation: On Day 5, only guest 50 visited, multiple times. The maximum is 1.*\n\n**Example 3**\n```\ninput:\n1 1;2 2;3 3\noutput: 1\n```\n*Explanation: Each day has exactly 1 unique guest. The maximum is 1.*\n\n**Follow-up**\nCan you do this in one pass over the array while updating the maximum count simultaneously?",
    editorialMarkdown: "## Maximum Unique Guests per Day\nWe can use a hash map where the keys are the `day` integers, and the values are Hash Sets. As we iterate through the logs, we insert each `guest_id` into the corresponding set for that `day`. Finally, we can iterate through the values of the hash map and return the maximum size among all sets.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(N) where N is the length of the logs, as each insertion and lookup in the hash map and set takes constant time.\n- **Space Complexity:** mathcal{O}(N) to store the sets in the worst-case scenario where every log entry represents a unique guest.\n\n**Common Trap:**\nFailing to deduplicate guests per day, or mistakenly counting total logs instead of distinct `guest_id`s.",
    referenceSolution: {
      JAVASCRIPT: "function solve(logs) {\n    let counts = new Map();\n    let maxGuests = 0;\n    for (let r of logs) {\n        if (!counts.has(r[0])) {\n            counts.set(r[0], new Set());\n        }\n        counts.get(r[0]).add(r[1]);\n        maxGuests = Math.max(maxGuests, counts.get(r[0]).size);\n    }\n    return maxGuests;\n}",
      TYPESCRIPT: "function solve(logs: number[][]): number {\n    let counts = new Map<number, Set<number>>();\n    let maxGuests = 0;\n    for (let r of logs) {\n        if (!counts.has(r[0])) {\n            counts.set(r[0], new Set());\n        }\n        counts.get(r[0])!.add(r[1]);\n        maxGuests = Math.max(maxGuests, counts.get(r[0])!.size);\n    }\n    return maxGuests;\n}",
      PYTHON: "def solve(logs):\n    counts = {}\n    max_guests = 0\n    for r in logs:\n        if r[0] not in counts:\n            counts[r[0]] = set()\n        counts[r[0]].add(r[1])\n        max_guests = max(max_guests, len(counts[r[0]]))\n    return max_guests",
      JAVA: "    static int solve(int[][] logs) {\n        java.util.Map<Integer, java.util.Set<Integer>> counts = new java.util.HashMap<>();\n        int maxGuests = 0;\n        for (int[] r : logs) {\n            counts.putIfAbsent(r[0], new java.util.HashSet<>());\n            counts.get(r[0]).add(r[1]);\n            maxGuests = Math.max(maxGuests, counts.get(r[0]).size());\n        }\n        return maxGuests;\n    }",
      CPP: "int solve(vector<vector<int>> logs) {\n    std::unordered_map<int, std::unordered_set<int>> counts;\n    int max_guests = 0;\n    for (auto& r : logs) {\n        counts[r[0]].insert(r[1]);\n        max_guests = std::max(max_guests, (int)counts[r[0]].size());\n    }\n    return max_guests;\n}",
      GO: "func solve(logs [][]int) int {\n    counts := make(map[int]map[int]bool)\n    maxGuests := 0\n    for _, r := range logs {\n        if counts[r[0]] == nil {\n            counts[r[0]] = make(map[int]bool)\n        }\n        counts[r[0]][r[1]] = true\n        if len(counts[r[0]]) > maxGuests {\n            maxGuests = len(counts[r[0]])\n        }\n    }\n    return maxGuests\n}",
    },
    tests: [
      { stdin: "1 10;1 10;1 20;2 10", expectedStdout: "2", isSample: true },
      { stdin: "5 50;5 50;5 50", expectedStdout: "1", isSample: true },
      { stdin: "1 1;2 2;3 3", expectedStdout: "1", isSample: true },
      { stdin: "1 1;1 2;1 3;2 1;2 2", expectedStdout: "3" },
      { stdin: "10 100", expectedStdout: "1" },
      { stdin: "1 1;1 2;1 3;1 4", expectedStdout: "4" },
      { stdin: "365 1;365 2;364 1", expectedStdout: "2" },
      { stdin: "100 1;100 2;200 1;200 2", expectedStdout: "2" },
    ],
  }),

  p({
    ...base,
    slug: "day-of-the-cycle",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Day of the Cycle",
    patternTags: ["math","modulo","simulation","array"],
    signatureId: "fn:int->string",
    avgSolveSeconds: 300,
    promptMarkdown: "You are working on a shift scheduling system that uses a continuous 7-day cycle. The days are named: `\\\"Monday\\\"`, `\\\"Tuesday\\\"`, `\\\"Wednesday\\\"`, `\\\"Thursday\\\"`, `\\\"Friday\\\"`, `\\\"Saturday\\\"`, `\\\"Sunday\\\"`.\n\nDay `1` is `\\\"Monday\\\"`. Given an integer `day` representing the number of days since the start of the schedule, return the name of the day as a string.\n\n**Constraints**\n- `1 <= day <= 1000`\n\n**Example 1**\n```\ninput:\n1\noutput: Monday\n```\n*Explanation: Day 1 is the first day of the cycle, which is Monday.*\n\n**Example 2**\n```\ninput:\n8\noutput: Monday\n```\n*Explanation: The cycle repeats every 7 days. Day 8 is the start of the second cycle.*\n\n**Example 3**\n```\ninput:\n7\noutput: Sunday\n```\n*Explanation: Day 7 is the last day of the cycle.*\n\n**Follow-up**\nCan you solve this in mathcal{O}(1) time using modulo arithmetic?",
    editorialMarkdown: "## Day of the Cycle\nWe can determine the day of the 7-day cycle using simple modulo arithmetic. Since the days are 1-indexed, we can subtract 1 from the input day, calculate `(day - 1) % 7`, and use the result as an index into an array of day names.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(1) as we only perform a few arithmetic operations and an array lookup.\n- **Space Complexity:** mathcal{O}(1) as the array of strings has a constant size of 7.\n\n**Common Trap:**\nForgetting that the input day is 1-indexed (e.g., day 1 is Monday), causing the modulo result to be offset by 1 if not handled correctly.",
    referenceSolution: {
      JAVASCRIPT: "function solve(day) {\n    const days = [\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\", \"Saturday\", \"Sunday\"];\n    return days[(day - 1) % 7];\n}",
      TYPESCRIPT: "function solve(day: number): string {\n    const days = [\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\", \"Saturday\", \"Sunday\"];\n    return days[(day - 1) % 7];\n}",
      PYTHON: "def solve(day):\n    days = [\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\", \"Saturday\", \"Sunday\"]\n    return days[(day - 1) % 7]",
      JAVA: "    static String solve(int day) {\n        String[] days = {\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\", \"Saturday\", \"Sunday\"};\n        return days[(day - 1) % 7];\n    }",
      CPP: "string solve(int day) {\n    vector<string> days = {\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\", \"Saturday\", \"Sunday\"};\n    return days[(day - 1) % 7];\n}",
      GO: "func solve(day int) string {\n    days := []string{\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\", \"Saturday\", \"Sunday\"}\n    return days[(day - 1) % 7]\n}",
    },
    tests: [
      { stdin: "1", expectedStdout: "Monday", isSample: true },
      { stdin: "8", expectedStdout: "Monday", isSample: true },
      { stdin: "7", expectedStdout: "Sunday", isSample: true },
      { stdin: "2", expectedStdout: "Tuesday" },
      { stdin: "10", expectedStdout: "Wednesday" },
      { stdin: "13", expectedStdout: "Saturday" },
      { stdin: "1001", expectedStdout: "Sunday" },
      { stdin: "4", expectedStdout: "Thursday" },
    ],
  }),

  p({
    ...base,
    slug: "calendar-day-counter",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Calendar Day Counter",
    patternTags: ["math","array","simulation","conditionals"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are building a timekeeping application. Given an array `date` containing three integers: `[year, month, day]`, return the day of the year.\n\nThe day of the year is the integer between 1 and 366 representing the total days elapsed since the start of the year, including the current day.\n\nRemember the rules for leap years in the Gregorian calendar:\n- A year is a leap year if it is divisible by `4`.\n- However, if the year is divisible by `100`, it is **not** a leap year, unless it is also divisible by `400`.\n- In a leap year, February has 29 days instead of 28.\n\n**Constraints**\n- `date.length == 3`\n- `1900 <= year <= 2100`\n- `1 <= month <= 12`\n- `1 <= day <= 31` (The date will always be valid)\n\n**Example 1**\n```\ninput:\n2024 1 1\noutput: 1\n```\n*Explanation: January 1st is the 1st day of the year.*\n\n**Example 2**\n```\ninput:\n2024 3 1\noutput: 61\n```\n*Explanation: 2024 is a leap year (divisible by 4). January has 31 days, February has 29, so March 1st is the 61st day.*\n\n**Example 3**\n```\ninput:\n1900 3 1\noutput: 60\n```\n*Explanation: 1900 is divisible by 100 but not 400, so it is not a leap year. February has 28 days.*\n\n**Follow-up**\nCan you implement the calendar calculation manually without using built-in datetime libraries?",
    editorialMarkdown: "## Calendar Day Counter\nWe can calculate the day of the year by summing the number of days in all the full months that have passed, and then adding the days of the current month. We also need to implement logic to detect a leap year (divisible by 4, but not 100 unless also divisible by 400), which dictates whether February has 28 or 29 days.\n\n**Complexity:**\n- **Time Complexity:** mathcal{O}(M) where M is the month (at most 12), as we loop over the months up to the current one.\n- **Space Complexity:** mathcal{O}(1) to store the array of month lengths.\n\n**Common Trap:**\nFailing to correctly implement the leap year rule (especially the century rule: divisible by 100 but not 400 is *not* a leap year).",
    referenceSolution: {
      JAVASCRIPT: "function solve(date) {\n    let [y, m, d] = date;\n    let daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];\n    if (y % 400 === 0 || (y % 4 === 0 && y % 100 !== 0)) {\n        daysInMonth[2] = 29;\n    }\n    let res = d;\n    for (let i = 1; i < m; i++) {\n        res += daysInMonth[i];\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(date: number[]): number {\n    let y = date[0], m = date[1], d = date[2];\n    let daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];\n    if (y % 400 === 0 || (y % 4 === 0 && y % 100 !== 0)) {\n        daysInMonth[2] = 29;\n    }\n    let res = d;\n    for (let i = 1; i < m; i++) {\n        res += daysInMonth[i];\n    }\n    return res;\n}",
      PYTHON: "def solve(date):\n    y, m, d = date\n    days_in_month = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]\n    if y % 400 == 0 or (y % 4 == 0 and y % 100 != 0):\n        days_in_month[2] = 29\n    res = d\n    for i in range(1, m):\n        res += days_in_month[i]\n    return res",
      JAVA: "    static int solve(int[] date) {\n        int y = date[0], m = date[1], d = date[2];\n        int[] daysInMonth = {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};\n        if (y % 400 == 0 || (y % 4 == 0 && y % 100 != 0)) {\n            daysInMonth[2] = 29;\n        }\n        int res = d;\n        for (int i = 1; i < m; i++) {\n            res += daysInMonth[i];\n        }\n        return res;\n    }",
      CPP: "int solve(vector<int> date) {\n    int y = date[0], m = date[1], d = date[2];\n    vector<int> days_in_month = {0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};\n    if (y % 400 == 0 || (y % 4 == 0 && y % 100 != 0)) {\n        days_in_month[2] = 29;\n    }\n    int res = d;\n    for (int i = 1; i < m; ++i) {\n        res += days_in_month[i];\n    }\n    return res;\n}",
      GO: "func solve(date []int) int {\n    y, m, d := date[0], date[1], date[2]\n    daysInMonth := []int{0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31}\n    if y % 400 == 0 || (y % 4 == 0 && y % 100 != 0) {\n        daysInMonth[2] = 29\n    }\n    res := d\n    for i := 1; i < m; i++ {\n        res += daysInMonth[i]\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "2024 1 1", expectedStdout: "1", isSample: true },
      { stdin: "2024 3 1", expectedStdout: "61", isSample: true },
      { stdin: "1900 3 1", expectedStdout: "60", isSample: true },
      { stdin: "2023 12 31", expectedStdout: "365" },
      { stdin: "2000 12 31", expectedStdout: "366" },
      { stdin: "2024 2 28", expectedStdout: "59" },
      { stdin: "2024 2 29", expectedStdout: "60" },
      { stdin: "2023 7 1", expectedStdout: "182" },
    ],
  }),
];
