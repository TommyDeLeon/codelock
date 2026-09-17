import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w2-057` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W2_057_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "form-adventuring-parties",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Form Adventuring Parties",
    patternTags: ["matrix","arrays","brute-force","combinations"],
    signatureId: "fn:matrix->matrix",
    avgSolveSeconds: 700,
    promptMarkdown: "A local adventuring guild needs to form teams. You are given a matrix `players` where each row is `[player_id, role]`. \n- `role = 0` means the player is a Warrior.\n- `role = 1` means the player is a Mage.\n\nYou need to form every possible valid team consisting of exactly one Warrior and exactly one Mage. \n\nReturn a matrix of pairs `[warrior_id, mage_id]`. The pairs must be sorted by `warrior_id` in ascending order, and then by `mage_id` in ascending order. If no teams can be formed, return an empty matrix.\n\n**Constraints**\n- `1 <= players.length <= 40`\n- `players[i].length == 2`\n- `players[i][0]` is a unique positive integer <= 100.\n- `players[i][1]` is either `0` or `1`.\n\n**Example 1**\n```\ninput:\n1 0;2 1;3 0;4 1\noutput:\n1 2;1 4;3 2;3 4\n```\n*Explanation: Warriors are 1 and 3. Mages are 2 and 4. All combinations are formed and sorted.*\n\n**Example 2**\n```\ninput:\n10 1;20 0\noutput:\n20 10\n```\n*Explanation: Warrior 20 pairs with Mage 10.*\n\n**Example 3**\n```\ninput:\n5 0;6 0;7 1\noutput:\n5 7;6 7\n```\n*Explanation: Warriors 5 and 6 both pair with the only Mage, 7.*\n\n**Follow-up**\nCan you write this using a clean nested iteration without redundant sorting inside the loops?",
    editorialMarkdown: "## Form Adventuring Parties\n\nThis problem requires us to pair every available Warrior with every available Mage. This is formally known as a Cartesian Product or cross product of two sets. \n\nThe approach is simple: first, partition the players into a list of Warriors and a list of Mages. Then, sort both lists so we can guarantee the correct output order. Finally, use a nested loop to create every combination and append it to our results.\n\n**Trap**: A common pitfall is forgetting to sort the individual lists before combining them, resulting in pairs that are out of the specified order, especially when the initial input is unsorted.\n\n**Complexity:**\n- **Time:** O(N * M + W log W + K log K) where N is total players, W is Warriors, K is Mages, and M is the product (W * K). Sorting takes time, and the nested loop generates all combinations.\n- **Space:** O(W + K) for the separated arrays before producing the final combination matrix.",
    referenceSolution: {
      JAVASCRIPT: "function solve(players) {\n    let warriors = [];\n    let mages = [];\n    for (let p of players) {\n        if (p[1] === 0) warriors.push(p[0]);\n        else if (p[1] === 1) mages.push(p[0]);\n    }\n    warriors.sort((a, b) => a - b);\n    mages.sort((a, b) => a - b);\n    let ans = [];\n    for (let w of warriors) {\n        for (let m of mages) {\n            ans.push([w, m]);\n        }\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(players: number[][]): number[][] {\n    let warriors: number[] = [];\n    let mages: number[] = [];\n    for (let p of players) {\n        if (p[1] === 0) warriors.push(p[0]);\n        else if (p[1] === 1) mages.push(p[0]);\n    }\n    warriors.sort((a, b) => a - b);\n    mages.sort((a, b) => a - b);\n    let ans: number[][] = [];\n    for (let w of warriors) {\n        for (let m of mages) {\n            ans.push([w, m]);\n        }\n    }\n    return ans;\n}",
      PYTHON: "def solve(players):\n    warriors = sorted([p[0] for p in players if p[1] == 0])\n    mages = sorted([p[0] for p in players if p[1] == 1])\n    return [[w, m] for w in warriors for m in mages]",
      JAVA: "    static int[][] solve(int[][] players) {\n        java.util.List<Integer> warriors = new java.util.ArrayList<>();\n        java.util.List<Integer> mages = new java.util.ArrayList<>();\n        for (int[] p : players) {\n            if (p[1] == 0) warriors.add(p[0]);\n            else if (p[1] == 1) mages.add(p[0]);\n        }\n        java.util.Collections.sort(warriors);\n        java.util.Collections.sort(mages);\n        int[][] ans = new int[warriors.size() * mages.size()][2];\n        int idx = 0;\n        for (int w : warriors) {\n            for (int m : mages) {\n                ans[idx][0] = w;\n                ans[idx][1] = m;\n                idx++;\n            }\n        }\n        return ans;\n    }",
      CPP: "vector<vector<int>> solve(vector<vector<int>> players) {\n    vector<int> warriors, mages;\n    for (auto p : players) {\n        if (p[1] == 0) warriors.push_back(p[0]);\n        else if (p[1] == 1) mages.push_back(p[0]);\n    }\n    sort(warriors.begin(), warriors.end());\n    sort(mages.begin(), mages.end());\n    vector<vector<int>> ans;\n    for (int w : warriors) {\n        for (int m : mages) {\n            ans.push_back({w, m});\n        }\n    }\n    return ans;\n}",
      GO: "func solve(players [][]int) [][]int {\n    warriors := []int{}\n    mages := []int{}\n    for _, p := range players {\n        if p[1] == 0 {\n            warriors = append(warriors, p[0])\n        } else if p[1] == 1 {\n            mages = append(mages, p[0])\n        }\n    }\n    for i := 0; i < len(warriors); i++ {\n        for j := i + 1; j < len(warriors); j++ {\n            if warriors[i] > warriors[j] {\n                warriors[i], warriors[j] = warriors[j], warriors[i]\n            }\n        }\n    }\n    for i := 0; i < len(mages); i++ {\n        for j := i + 1; j < len(mages); j++ {\n            if mages[i] > mages[j] {\n                mages[i], mages[j] = mages[j], mages[i]\n            }\n        }\n    }\n    ans := [][]int{}\n    for _, w := range warriors {\n        for _, m := range mages {\n            ans = append(ans, []int{w, m})\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "1 0;2 1;3 0;4 1", expectedStdout: "1 2;1 4;3 2;3 4", isSample: true },
      { stdin: "10 1;20 0", expectedStdout: "20 10", isSample: true },
      { stdin: "5 0;6 0;7 1", expectedStdout: "5 7;6 7" },
      { stdin: "100 1;99 1;1 0", expectedStdout: "1 99;1 100" },
      { stdin: "1 0;2 1;3 1;4 1;5 1", expectedStdout: "1 2;1 3;1 4;1 5" },
      { stdin: "2 0;4 0;6 0;8 1", expectedStdout: "2 8;4 8;6 8" },
      { stdin: "10 0;20 1;30 0", expectedStdout: "10 20;30 20" },
      { stdin: "1 0;3 0;5 0;7 1;9 1;11 1", expectedStdout: "1 7;1 9;1 11;3 7;3 9;3 11;5 7;5 9;5 11" },
    ],
  }),

  p({
    ...base,
    slug: "guild-join-rate",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Guild Join Rate",
    patternTags: ["matrix","hash-set","counting","math"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 800,
    promptMarkdown: "A log of guild interactions is given as a matrix `logs` where each row is `[user_id, guild_id, action]`. \n- `action = 0` means the user applied to the guild.\n- `action = 1` means the user successfully joined the guild.\n\nDue to a bug in the client, a user might apply to the same guild multiple times or even trigger the join action multiple times.\n\nCalculate the overall join rate, which is the total number of **unique** `(user_id, guild_id)` successful joins divided by the total number of **unique** `(user_id, guild_id)` applications, multiplied by 100.\n\nReturn the overall join rate as an integer percentage, **rounded down** to the nearest whole number. If there are no applications in the logs, return `0`.\n\n**Constraints**\n- `1 <= logs.length <= 100`\n- `logs[i].length == 3`\n- `action` is either `0` or `1`.\n\n**Example 1**\n```\ninput:\n1 10 0;1 10 0;1 10 1;2 20 0;3 30 1\noutput:\n100\n```\n*Explanation: There are 2 unique applications: (1, 10) and (2, 20). There are 2 unique joins: (1, 10) and (3, 30). The rate is (2 / 2) * 100 = 100.*\n\n**Example 2**\n```\ninput:\n1 10 0;2 10 0\noutput:\n0\n```\n*Explanation: There are 2 applications and 0 joins. Rate is 0.*\n\n**Example 3**\n```\ninput:\n1 5 0;1 5 1;2 5 0;2 5 1\noutput:\n100\n```\n*Explanation: There are 2 applications and 2 joins. Rate is 100.*\n\n**Follow-up**\nCan you compute this rate in O(N) time with only a single pass through the logs?",
    editorialMarkdown: "## Guild Join Rate\n\nThis problem simulates an aggregation typically performed using an SQL `COUNT(DISTINCT ...)`. The objective is to identify unique occurrences of an action among multiple duplicate logs.\n\nTo do this efficiently, we can use two Hash Sets. One set will hold unique pairs of `(user_id, guild_id)` for applications, and the other for joins. After iterating through all the logs and inserting them into the respective sets based on the action type, we can use the sizes of the sets to perform our calculation.\n\n**Trap**: Duplicates are the trap here. A user might click \\\"Apply\\\" 10 times and \\\"Join\\\" 3 times due to network glitches. If you sum all actions without deduplicating using a set (or a unique key), your rate calculation will be entirely wrong.\n\n**Complexity:**\n- **Time:** O(N) where N is the number of logs. We iterate through the matrix once, and Hash Set operations take O(1) on average.\n- **Space:** O(U) where U is the number of unique user-guild pairs stored in our Hash Sets.",
    referenceSolution: {
      JAVASCRIPT: "function solve(logs) {\n    let apps = new Set();\n    let joins = new Set();\n    for (let row of logs) {\n        let key = row[0] + \",\" + row[1];\n        if (row[2] === 0) apps.add(key);\n        else if (row[2] === 1) joins.add(key);\n    }\n    if (apps.size === 0) return 0;\n    return Math.floor((joins.size * 100) / apps.size);\n}",
      TYPESCRIPT: "function solve(logs: number[][]): number {\n    let apps = new Set<string>();\n    let joins = new Set<string>();\n    for (let row of logs) {\n        let key = row[0] + \",\" + row[1];\n        if (row[2] === 0) apps.add(key);\n        else if (row[2] === 1) joins.add(key);\n    }\n    if (apps.size === 0) return 0;\n    return Math.floor((joins.size * 100) / apps.size);\n}",
      PYTHON: "def solve(logs):\n    apps = set()\n    joins = set()\n    for row in logs:\n        if row[2] == 0:\n            apps.add((row[0], row[1]))\n        elif row[2] == 1:\n            joins.add((row[0], row[1]))\n    if len(apps) == 0:\n        return 0\n    return (len(joins) * 100) // len(apps)",
      JAVA: "    static int solve(int[][] logs) {\n        java.util.HashSet<String> apps = new java.util.HashSet<>();\n        java.util.HashSet<String> joins = new java.util.HashSet<>();\n        for (int[] row : logs) {\n            String key = row[0] + \",\" + row[1];\n            if (row[2] == 0) apps.add(key);\n            else if (row[2] == 1) joins.add(key);\n        }\n        if (apps.size() == 0) return 0;\n        return (joins.size() * 100) / apps.size();\n    }",
      CPP: "int solve(vector<vector<int>> logs) {\n    set<pair<int, int>> apps;\n    set<pair<int, int>> joins;\n    for (auto row : logs) {\n        if (row[2] == 0) apps.insert({row[0], row[1]});\n        else if (row[2] == 1) joins.insert({row[0], row[1]});\n    }\n    if (apps.empty()) return 0;\n    return (joins.size() * 100) / apps.size();\n}",
      GO: "func solve(logs [][]int) int {\n    type pair struct { u, g int }\n    apps := make(map[pair]bool)\n    joins := make(map[pair]bool)\n    for _, row := range logs {\n        p := pair{row[0], row[1]}\n        if row[2] == 0 {\n            apps[p] = true\n        } else if row[2] == 1 {\n            joins[p] = true\n        }\n    }\n    if len(apps) == 0 {\n        return 0\n    }\n    return (len(joins) * 100) / len(apps)\n}",
    },
    tests: [
      { stdin: "1 10 0;1 10 0;1 10 1;2 20 0;3 30 1", expectedStdout: "100", isSample: true },
      { stdin: "1 10 0;2 10 0", expectedStdout: "0", isSample: true },
      { stdin: "1 5 0;1 5 1;2 5 0;2 5 1", expectedStdout: "100" },
      { stdin: "1 1 0;2 2 0;3 3 0;1 1 1", expectedStdout: "33" },
      { stdin: "1 1 1;2 2 1", expectedStdout: "0" },
      { stdin: "1 2 0;1 2 0;1 2 0;1 2 1;1 2 1", expectedStdout: "100" },
      { stdin: "1 1 0;2 2 0;3 3 0;4 4 0;1 1 1;2 2 1;3 3 1;4 4 1", expectedStdout: "100" },
      { stdin: "10 10 0;20 20 0;30 30 0;40 40 0;10 10 1", expectedStdout: "25" },
    ],
  }),

  p({
    ...base,
    slug: "critical-servers-in-window",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Critical Servers in Window",
    patternTags: ["matrix","hash-set","filtering","array"],
    signatureId: "fn:matrix->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "A matrix `logs` records server events across a datacenter. Each row is structured as `[server_id, event_type, timestamp]`. \n\nAn `event_type` of `1` indicates a critical error, while an `event_type` of `0` indicates normal operation.\n\nReturn an array containing all **unique** `server_id`s that experienced at least one critical error during the time window between timestamp `100` and `200` (inclusive). The returned array should be sorted in ascending order.\n\n**Constraints**\n- `1 <= logs.length <= 100`\n- `logs[i].length == 3`\n- `event_type` is either `0` or `1`.\n- `0 <= timestamp <= 1000`\n\n**Example 1**\n```\ninput:\n1 1 150;2 0 150;1 1 180;3 1 99;4 1 200\noutput:\n1 4\n```\n*Explanation: Server 1 has critical errors at 150 and 180 (both in window). Server 2 has no critical errors. Server 3 has one at 99 (outside window). Server 4 has one at 200 (in window). Unique servers in window with errors: [1, 4].*\n\n**Example 2**\n```\ninput:\n1 1 100;2 1 201;3 1 150\noutput:\n1 3\n```\n*Explanation: Server 1 is exactly at the start of the window (100). Server 2 is outside. Server 3 is inside.*\n\n**Example 3**\n```\ninput:\n10 0 150;20 0 150\noutput:\n\n```\n*Explanation: No critical errors occurred, so the returned array is empty.*\n\n**Follow-up**\nWhat is the space complexity of your solution if there are millions of events but only a few dozen unique servers?",
    editorialMarkdown: "## Critical Servers in Window\n\nThe goal of this problem is to filter a list of events down to a unique subset of servers that meet a set of specific criteria, similar to writing a standard database query with a `WHERE` clause and a `DISTINCT` keyword.\n\nWe can iterate through the logs and check if each event matches our target type (critical error, `1`) and falls within the time bounds (`100 <= timestamp <= 200`). If it does, we record the server ID in a Hash Set to guarantee uniqueness. Finally, we convert the set back to a list and sort it.\n\n**Trap**: Always remember that a server might emit multiple critical errors within the window. Returning a raw list without passing it through a Set (or deduplicating it during sorting) will yield duplicate IDs and fail the test case.\n\n**Complexity:**\n- **Time:** O(N + M log M) where N is the number of logs to process, and M is the number of unique critical servers to sort.\n- **Space:** O(M) for the set and output array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(logs) {\n    let res = new Set();\n    for (let row of logs) {\n        if (row[1] === 1 && row[2] >= 100 && row[2] <= 200) {\n            res.add(row[0]);\n        }\n    }\n    let arr = Array.from(res);\n    arr.sort((a, b) => a - b);\n    return arr;\n}",
      TYPESCRIPT: "function solve(logs: number[][]): number[] {\n    let res = new Set<number>();\n    for (let row of logs) {\n        if (row[1] === 1 && row[2] >= 100 && row[2] <= 200) {\n            res.add(row[0]);\n        }\n    }\n    let arr = Array.from(res);\n    arr.sort((a, b) => a - b);\n    return arr;\n}",
      PYTHON: "def solve(logs):\n    res = set()\n    for row in logs:\n        if row[1] == 1 and 100 <= row[2] <= 200:\n            res.add(row[0])\n    return sorted(list(res))",
      JAVA: "    static int[] solve(int[][] logs) {\n        java.util.HashSet<Integer> set = new java.util.HashSet<>();\n        for (int[] row : logs) {\n            if (row[1] == 1 && row[2] >= 100 && row[2] <= 200) {\n                set.add(row[0]);\n            }\n        }\n        int[] arr = new int[set.size()];\n        int idx = 0;\n        for (int val : set) arr[idx++] = val;\n        java.util.Arrays.sort(arr);\n        return arr;\n    }",
      CPP: "vector<int> solve(vector<vector<int>> logs) {\n    set<int> res;\n    for (auto row : logs) {\n        if (row[1] == 1 && row[2] >= 100 && row[2] <= 200) {\n            res.insert(row[0]);\n        }\n    }\n    vector<int> arr(res.begin(), res.end());\n    return arr;\n}",
      GO: "func solve(logs [][]int) []int {\n    m := make(map[int]bool)\n    for _, row := range logs {\n        if row[1] == 1 && row[2] >= 100 && row[2] <= 200 {\n            m[row[0]] = true\n        }\n    }\n    arr := []int{}\n    for k := range m {\n        arr = append(arr, k)\n    }\n    for i := 0; i < len(arr); i++ {\n        for j := i + 1; j < len(arr); j++ {\n            if arr[i] > arr[j] {\n                arr[i], arr[j] = arr[j], arr[i]\n            }\n        }\n    }\n    return arr\n}",
    },
    tests: [
      { stdin: "1 1 150;2 0 150;1 1 180;3 1 99;4 1 200", expectedStdout: "1 4", isSample: true },
      { stdin: "1 1 100;2 1 201;3 1 150", expectedStdout: "1 3", isSample: true },
      { stdin: "10 0 150;20 0 150", expectedStdout: "" },
      { stdin: "5 1 50;6 1 250", expectedStdout: "" },
      { stdin: "1 1 100;1 1 200;1 1 150", expectedStdout: "1" },
      { stdin: "9 1 100;8 1 101;7 1 199;6 1 200", expectedStdout: "6 7 8 9" },
      { stdin: "10 1 150;10 1 150", expectedStdout: "10" },
      { stdin: "1 1 100;2 1 100;3 1 100;4 1 100", expectedStdout: "1 2 3 4" },
    ],
  }),

  p({
    ...base,
    slug: "scout-robot-max-distance",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GREEDY",
    title: "Drone Max Range",
    patternTags: ["string","counting","math","greedy"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 600,
    promptMarkdown: "A remote-controlled drone operates on a straight, one-dimensional flight path, beginning its journey at coordinate 0. A sequence of commands, `moves`, is transmitted to the drone, and it processes them sequentially:\n- `'L'`: The drone flies 1 unit to the left.\n- `'R'`: The drone flies 1 unit to the right.\n- `'?'`: A corrupted signal is received. The drone might fly *either* 1 unit to the left *or* 1 unit to the right.\n\nDetermine the maximum possible absolute distance from the starting coordinate 0 the drone could be after processing every command in the sequence.\n\n**Constraints**\n- `1 <= moves.length <= 100`\n- `moves` consists only of characters `'L'`, `'R'`, and `'?'`.\n\n**Example 1**\n```\ninput:\nL?R??\noutput:\n3\n```\n*Explanation: The sequence contains 1 'L', 1 'R', and 3 '?'. The 'L' and 'R' commands balance each other out (net distance 0). The 3 '?' commands could all be interpreted as 'L' (resulting in coordinate -3) or all as 'R' (resulting in coordinate 3). The maximum absolute distance achievable is 3.*\n\n**Example 2**\n```\ninput:\nLLLLL\noutput:\n5\n```\n*Explanation: The drone processes only left commands, finishing at coordinate -5, yielding an absolute distance of 5 from the start.*\n\n**Example 3**\n```\ninput:\nLR\noutput:\n0\n```\n*Explanation: The drone flies left, then immediately right, concluding its path exactly at the starting coordinate.*\n\n**Follow-up**\nCan you determine the maximum distance using a single pass through the string with an O(N) time complexity?",
    editorialMarkdown: "## Scout Robot Max Distance\n\nThe robot takes steps exclusively to the left or right, cancelling its net displacement when it moves in opposing directions. The static interference markers (`?`) act as wildcards that can be converted to either `L` or `R`.\n\nTo maximize the final distance from the origin, we want all the wildcards to point in the direction that we've already drifted toward the most. So, we count the number of predetermined `L` moves, predetermined `R` moves, and the wildcards. The distance covered by predetermined moves alone is the absolute difference between the `L` and `R` counts. Then, we simply add the wildcard count to this absolute difference, effectively turning every wildcard into a step further away in that dominant direction.\n\n**Trap**: Trying to manually assign the `?` tokens step-by-step or using recursion to find the longest path will lead to overly complicated, inefficient code. Pure mathematical aggregation is the key.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string, since we need to count character frequencies.\n- **Space:** O(1) as we only maintain three integer variables regardless of the string's length.",
    referenceSolution: {
      JAVASCRIPT: "function solve(moves) {\n    let l = 0, r = 0, q = 0;\n    for (let i = 0; i < moves.length; i++) {\n        if (moves[i] === 'L') l++;\n        else if (moves[i] === 'R') r++;\n        else if (moves[i] === '?') q++;\n    }\n    return Math.abs(l - r) + q;\n}",
      TYPESCRIPT: "function solve(moves: string): number {\n    let l = 0, r = 0, q = 0;\n    for (let i = 0; i < moves.length; i++) {\n        if (moves[i] === 'L') l++;\n        else if (moves[i] === 'R') r++;\n        else if (moves[i] === '?') q++;\n    }\n    return Math.abs(l - r) + q;\n}",
      PYTHON: "def solve(moves):\n    l = moves.count('L')\n    r = moves.count('R')\n    q = moves.count('?')\n    return abs(l - r) + q",
      JAVA: "    static int solve(String moves) {\n        int l = 0, r = 0, q = 0;\n        for (int i = 0; i < moves.length(); i++) {\n            if (moves.charAt(i) == 'L') l++;\n            else if (moves.charAt(i) == 'R') r++;\n            else if (moves.charAt(i) == '?') q++;\n        }\n        return Math.abs(l - r) + q;\n    }",
      CPP: "int solve(string moves) {\n    int l = 0, r = 0, q = 0;\n    for (char c : moves) {\n        if (c == 'L') l++;\n        else if (c == 'R') r++;\n        else if (c == '?') q++;\n    }\n    return abs(l - r) + q;\n}",
      GO: "func solve(moves string) int {\n    l, r, q := 0, 0, 0\n    for i := 0; i < len(moves); i++ {\n        if moves[i] == 'L' {\n            l++\n        } else if moves[i] == 'R' {\n            r++\n        } else if moves[i] == '?' {\n            q++\n        }\n    }\n    diff := l - r\n    if diff < 0 {\n        diff = -diff\n    }\n    return diff + q\n}",
    },
    tests: [
      { stdin: "L?R??", expectedStdout: "3", isSample: true },
      { stdin: "LLLLL", expectedStdout: "5", isSample: true },
      { stdin: "RRRRR", expectedStdout: "5" },
      { stdin: "?????", expectedStdout: "5" },
      { stdin: "LR", expectedStdout: "0" },
      { stdin: "L", expectedStdout: "1" },
      { stdin: "?", expectedStdout: "1" },
      { stdin: "LLR?R?L", expectedStdout: "3" },
    ],
  }),
];
