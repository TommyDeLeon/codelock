import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w4-140` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W4_140_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "closest-origin-beacon",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Closest Origin Beacon",
    patternTags: ["arrays","manhattan-distance","minimum-spanning-tree"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 600,
    promptMarkdown: "As a rescue coordinator on a distant planet, you are provided with a 2D array `beacons` where each element is `[x, y]` representing the coordinates of a distress beacon on a flat grid. The main station is located at `[0, 0]`.\n\nFind the index (0-indexed) of the beacon that is closest to the main station using the Manhattan distance. The Manhattan distance between `[x1, y1]` and `[x2, y2]` is `|x1 - x2| + |y1 - y2|`. If there are multiple beacons with the same minimum distance, return the one with the smallest index.\n\n**Constraints**\n- `1 <= beacons.length <= 40`\n- `beacons[i].length == 2`\n- `-10^4 <= x, y <= 10^4`\n\n**Example 1**\n```\ninput:\n1 2;-2 2;0 1\noutput:\n2\n```\n*Explanation: The distances are 3, 4, and 1. The closest is at index 2.*\n\n**Example 2**\n```\ninput:\n2 2;1 3;-2 -2\noutput:\n0\n```\n*Explanation: All three beacons have a distance of 4. We return the smallest index, which is 0.*\n\n**Example 3**\n```\ninput:\n0 0;1 1\noutput:\n0\n```\n*Explanation: The beacon at index 0 has a distance of 0, which is the absolute minimum.*\n\n**Follow-up**\nCan you solve this in a single pass of the array?",
    editorialMarkdown: "## Closest Origin Beacon\n\nThe problem requires us to find the beacon with the minimum Manhattan distance to the origin point `[0, 0]`. The Manhattan distance for any coordinate `[x, y]` to `[0, 0]` is given by `|x| + |y|`.\n\nWe can iterate over each beacon in the input list, compute this distance, and keep track of the minimum distance observed so far, along with its index. If we find a strictly smaller distance, we update our minimum distance and index. By using a strictly smaller condition (`<`), we naturally break ties by keeping the smallest index, because we don't update the answer for equal distances.\n\n**Trap**: A common pitfall is to forget to take the absolute values of the coordinates, which leads to incorrect distance calculations for negative coordinates.\n\n**Complexity:**\n- **Time:** O(N), where N is the number of beacons. We inspect each beacon exactly once.\n- **Space:** O(1), as we only need to store a few variables for the minimum distance and the corresponding index.",
    referenceSolution: {
      JAVASCRIPT: "function solve(beacons) {\n    let min_dist = Infinity;\n    let ans = -1;\n    for (let i = 0; i < beacons.length; i++) {\n        let dist = Math.abs(beacons[i][0]) + Math.abs(beacons[i][1]);\n        if (dist < min_dist) {\n            min_dist = dist;\n            ans = i;\n        }\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(beacons: number[][]): number {\n    let min_dist = Infinity;\n    let ans = -1;\n    for (let i = 0; i < beacons.length; i++) {\n        let dist = Math.abs(beacons[i][0]) + Math.abs(beacons[i][1]);\n        if (dist < min_dist) {\n            min_dist = dist;\n            ans = i;\n        }\n    }\n    return ans;\n}",
      PYTHON: "def solve(beacons):\n    min_dist = float('inf')\n    ans = -1\n    for i, (x, y) in enumerate(beacons):\n        dist = abs(x) + abs(y)\n        if dist < min_dist:\n            min_dist = dist\n            ans = i\n    return ans",
      JAVA: "    static int solve(int[][] beacons) {\n        int min_dist = Integer.MAX_VALUE;\n        int ans = -1;\n        for (int i = 0; i < beacons.length; i++) {\n            int dist = Math.abs(beacons[i][0]) + Math.abs(beacons[i][1]);\n            if (dist < min_dist) {\n                min_dist = dist;\n                ans = i;\n            }\n        }\n        return ans;\n    }",
      CPP: "#include <vector>\n#include <cmath>\nusing namespace std;\nint solve(vector<vector<int>> beacons) {\n    int min_dist = 2000000;\n    int ans = -1;\n    for (int i = 0; i < beacons.size(); i++) {\n        int dist = abs(beacons[i][0]) + abs(beacons[i][1]);\n        if (dist < min_dist) {\n            min_dist = dist;\n            ans = i;\n        }\n    }\n    return ans;\n}",
      GO: "func solve(beacons [][]int) int {\n    minDist := 2000000\n    ans := -1\n    for i, b := range beacons {\n        dist := b[0]\n        if dist < 0 { dist = -dist }\n        dy := b[1]\n        if dy < 0 { dy = -dy }\n        dist += dy\n        if dist < minDist {\n            minDist = dist\n            ans = i\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "1 2;-2 2;0 1", expectedStdout: "2", isSample: true },
      { stdin: "2 2;1 3;-2 -2", expectedStdout: "0", isSample: true },
      { stdin: "0 0;1 1", expectedStdout: "0" },
      { stdin: "0 0;0 0;0 0", expectedStdout: "0" },
      { stdin: "3 3;-3 3;3 -3;-3 -3", expectedStdout: "0" },
      { stdin: "1000 1000", expectedStdout: "0" },
      { stdin: "1 0;0 1", expectedStdout: "0" },
      { stdin: "2 0;0 2;1 1", expectedStdout: "0" },
    ],
  }),

  p({
    ...base,
    slug: "retrieve-important-transmissions",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "High Potency Elixirs",
    patternTags: ["arrays","sorting","filtering"],
    signatureId: "fn:matrix->ints",
    avgSolveSeconds: 800,
    promptMarkdown: "You are managing an inventory of magical elixirs. The inventory is given as a 2D array `elixirs`, where each entry is `[potionId, quality, potency]`.\n\nYou need to discard any elixirs that are spoiled (where `quality` is 0). Furthermore, the current moon phase requires you to only use elixirs that have an odd `potionId`.\n\nReturn an array containing the `potionId`s of the valid elixirs, ordered by their `potency` from highest to lowest. If multiple elixirs share the same `potency`, order them by their `potionId` from highest to lowest.\n\n**Constraints**\n- `1 <= elixirs.length <= 40`\n- `elixirs[i].length == 3`\n- `1 <= potionId, quality, potency <= 100`\n- All `potionId`s are unique.\n\n**Example 1**\n```\ninput:\n1 1 5;2 1 10;3 0 8;5 1 9\noutput:\n5 1\n```\n*Explanation: Potion 2 has an even ID, so it is discarded. Potion 3 has a quality of 0, so it is discarded. We are left with potions 1 and 5. Potion 5 has a potency of 9, and potion 1 has a potency of 5, so potion 5 is listed first.*\n\n**Example 2**\n```\ninput:\n1 1 10;3 2 10;5 1 1\noutput:\n3 1 5\n```\n*Explanation: All elixirs have odd IDs and non-zero quality. Potions 1 and 3 share the highest potency of 10. Since 3 > 1, potion 3 is listed before potion 1. Potion 5 has a potency of 1 and is listed last.*\n\n**Example 3**\n```\ninput:\n7 2 5;9 3 5;11 4 5\noutput:\n11 9 7\n```\n*Explanation: All elixirs share the same potency, so they are ordered strictly by their potion IDs in descending order.*\n\n**Follow-up**\nIs your sort algorithm stable by default, and does it matter for this problem given the explicit tie-breaker?",
    editorialMarkdown: "## Retrieve Important Transmissions\n\nWe need to filter and sort an array of log records based on specific criteria. First, we identify all valid records by keeping those where the `id` is an odd number and the `type` is not 0 (which denotes routine). \n\nOnce we have our filtered set of records, we need to sort them. The primary sorting key is the `priority` (descending). The secondary sorting key, applied only if the priorities are equal, is the `id` (descending). Most languages offer a built-in sort function that can be customized with a lambda or comparator. Alternatively, you can write a simple nested loop sort (like bubble sort) because the number of elements is extremely small (`N <= 40`).\n\n**Trap**: Make sure to check the exact sorting order requested (both priority and ID need to be sorted descending). \n\n**Complexity:**\n- **Time:** O(N log N) using standard sorting, or O(N^2) using bubble sort, where N is the number of transmissions.\n- **Space:** O(N) to store the filtered valid records and the resulting IDs.",
    referenceSolution: {
      JAVASCRIPT: "function solve(transmissions) {\n    let valid = transmissions.filter(t => t[0] % 2 !== 0 && t[1] !== 0);\n    valid.sort((a, b) => {\n        if (a[2] !== b[2]) return b[2] - a[2];\n        return b[0] - a[0];\n    });\n    return valid.map(t => t[0]);\n}",
      TYPESCRIPT: "function solve(transmissions: number[][]): number[] {\n    let valid = transmissions.filter(t => t[0] % 2 !== 0 && t[1] !== 0);\n    valid.sort((a, b) => {\n        if (a[2] !== b[2]) return b[2] - a[2];\n        return b[0] - a[0];\n    });\n    return valid.map(t => t[0]);\n}",
      PYTHON: "def solve(transmissions):\n    valid = [t for t in transmissions if t[0] % 2 != 0 and t[1] != 0]\n    valid.sort(key=lambda x: (x[2], x[0]), reverse=True)\n    return [t[0] for t in valid]",
      JAVA: "    static int[] solve(int[][] transmissions) {\n        java.util.List<int[]> valid = new java.util.ArrayList<>();\n        for (int[] t : transmissions) {\n            if (t[0] % 2 != 0 && t[1] != 0) valid.add(t);\n        }\n        valid.sort((a, b) -> {\n            if (a[2] != b[2]) return Integer.compare(b[2], a[2]);\n            return Integer.compare(b[0], a[0]);\n        });\n        int[] res = new int[valid.size()];\n        for (int i = 0; i < valid.size(); i++) res[i] = valid.get(i)[0];\n        return res;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\nusing namespace std;\nvector<int> solve(vector<vector<int>> transmissions) {\n    vector<vector<int>> valid;\n    for (auto& t : transmissions) {\n        if (t[0] % 2 != 0 && t[1] != 0) valid.push_back(t);\n    }\n    sort(valid.begin(), valid.end(), [](const vector<int>& a, const vector<int>& b) {\n        if (a[2] != b[2]) return a[2] > b[2];\n        return a[0] > b[0];\n    });\n    vector<int> res;\n    for (auto& t : valid) res.push_back(t[0]);\n    return res;\n}",
      GO: "func solve(transmissions [][]int) []int {\n    var valid [][]int\n    for _, t := range transmissions {\n        if t[0] % 2 != 0 && t[1] != 0 {\n            valid = append(valid, t)\n        }\n    }\n    for i := 0; i < len(valid); i++ {\n        for j := i + 1; j < len(valid); j++ {\n            if valid[j][2] > valid[i][2] || (valid[j][2] == valid[i][2] && valid[j][0] > valid[i][0]) {\n                valid[i], valid[j] = valid[j], valid[i]\n            }\n        }\n    }\n    var res []int\n    for _, t := range valid {\n        res = append(res, t[0])\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 1 5;2 1 10;3 0 8;5 1 9", expectedStdout: "5 1", isSample: true },
      { stdin: "1 1 10;3 2 10;5 1 1", expectedStdout: "3 1 5", isSample: true },
      { stdin: "7 2 5;9 3 5;11 4 5", expectedStdout: "11 9 7" },
      { stdin: "2 1 10;4 1 5;6 1 3", expectedStdout: "" },
      { stdin: "1 0 10;3 0 5;5 0 3", expectedStdout: "" },
      { stdin: "1 1 5", expectedStdout: "1" },
      { stdin: "1 1 5;3 1 5", expectedStdout: "3 1" },
      { stdin: "1 1 10;2 2 10;3 3 10;4 4 10;5 5 10;6 6 10;7 7 10;8 8 10", expectedStdout: "7 5 3 1" },
    ],
  }),

  p({
    ...base,
    slug: "active-robot-subsystems",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BIT_MANIPULATION",
    title: "Active Robot Subsystems",
    patternTags: ["bit-manipulation","counting","binary"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 400,
    promptMarkdown: "A diagnostic system reports a robot's hardware status as a single integer. The binary representation of this integer indicates which subsystems are active, with each `1` bit representing an active subsystem and each `0` bit representing an inactive one.\n\nGiven an integer `status`, return the total number of active subsystems.\n\n**Constraints**\n- `0 <= status <= 10^9`\n\n**Example 1**\n```\ninput:\n11\noutput:\n3\n```\n*Explanation: The binary representation of 11 is 1011, which has 3 active subsystems.*\n\n**Example 2**\n```\ninput:\n0\noutput:\n0\n```\n*Explanation: The binary representation is just 0, so no subsystems are active.*\n\n**Example 3**\n```\ninput:\n15\noutput:\n4\n```\n*Explanation: The binary representation of 15 is 1111, meaning all 4 tracked subsystems are active.*\n\n**Follow-up**\nCan you do this using an optimization that drops the lowest set bit in exactly one operation per active subsystem?",
    editorialMarkdown: "## Active Robot Subsystems\n\nThis problem essentially requires computing the Hamming weight (the number of `1` bits) of a given integer `status`. \n\nWe can count the bits iteratively by checking the least significant bit (`status & 1`), incrementing our count if it is `1`, and then right-shifting the number (`status >> 1` or `status >>> 1`) until it becomes 0. Some languages offer an integrated bit-counting utility that does this more efficiently.\n\n**Trap**: If constraints were to allow negative numbers, you would need to be mindful of arithmetic vs logical right shifts in typed languages, as an arithmetic shift could cause an infinite loop by pulling down a sign bit.\n\n**Complexity:**\n- **Time:** O(1), or O(K) where K is the number of bits in the integer type. In this problem, it is at most 30 bits for 10^9.\n- **Space:** O(1) auxiliary space used.",
    referenceSolution: {
      JAVASCRIPT: "function solve(status) {\n    let count = 0;\n    while (status > 0) {\n        if (status & 1) count++;\n        status >>>= 1;\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(status: number): number {\n    let count = 0;\n    while (status > 0) {\n        if (status & 1) count++;\n        status >>>= 1;\n    }\n    return count;\n}",
      PYTHON: "def solve(status):\n    return bin(status).count('1')",
      JAVA: "    static int solve(int status) {\n        int count = 0;\n        while (status > 0) {\n            if ((status & 1) == 1) count++;\n            status >>= 1;\n        }\n        return count;\n    }",
      CPP: "int solve(int status) {\n    int count = 0;\n    while (status > 0) {\n        count += (status & 1);\n        status >>= 1;\n    }\n    return count;\n}",
      GO: "func solve(status int) int {\n    count := 0\n    for status > 0 {\n        if status & 1 == 1 {\n            count++\n        }\n        status >>= 1\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "11", expectedStdout: "3", isSample: true },
      { stdin: "0", expectedStdout: "0", isSample: true },
      { stdin: "15", expectedStdout: "4" },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "2", expectedStdout: "1" },
      { stdin: "3", expectedStdout: "2" },
      { stdin: "255", expectedStdout: "8" },
      { stdin: "1048575", expectedStdout: "20" },
      { stdin: "1073741823", expectedStdout: "30" },
    ],
  }),

  p({
    ...base,
    slug: "security-key-changes",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Color Palette Shifts",
    patternTags: ["strings","case-folding","counting"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 400,
    promptMarkdown: "An artist is painting a continuous stroke using a sequence of color shades represented by a string `s`. The artist is considered to have \"shifted hues\" if they switch to a character that is a different letter from the previous one, disregarding uppercase and lowercase distinctions (for instance, switching from 'a' to 'A' is NOT considered a hue shift).\n\nReturn the total number of times the artist shifted hues.\n\n**Constraints**\n- `1 <= s.length <= 100`\n- `s` consists of English letters.\n\n**Example 1**\n```\ninput:\naAbBcC\noutput:\n2\n```\n*Explanation: From 'a' to 'A' is 0 shifts. From 'A' to 'b' is 1 shift. From 'b' to 'B' is 0 shifts. From 'B' to 'c' is 1 shift. Total shifts: 2.*\n\n**Example 2**\n```\ninput:\naA\noutput:\n0\n```\n*Explanation: Both characters represent the same hue ('a' and 'A').*\n\n**Example 3**\n```\ninput:\nabc\noutput:\n2\n```\n*Explanation: Shifting from 'a' to 'b' (1 shift) and from 'b' to 'c' (1 shift).*\n\n**Follow-up**\nCould you implement this character comparison entirely using integer bitwise operations on their ASCII values?",
    editorialMarkdown: "## Security Key Changes\n\nThe task requires iterating through a string to determine how many times adjacent characters differ in their lowercase (or uppercase) forms. We can track the previous character, transform both the previous and current characters to a consistent case (e.g. using `toLowerCase()`), and compare them.\n\nEvery time they are not equal, we increment our counter. \n\n**Trap**: A common minor bug is accessing out-of-bounds indices by forgetting that comparing a character with its previous neighbor requires starting the loop at index 1 instead of index 0.\n\n**Complexity:**\n- **Time:** O(N), where N is the length of the string.\n- **Space:** O(1), assuming we compare characters in-place without generating fully lowercased copies of the string (though O(N) if generating copies in languages where strings are immutable).",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    let ans = 0;\n    for (let i = 1; i < s.length; i++) {\n        if (s[i].toLowerCase() !== s[i-1].toLowerCase()) ans++;\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(s: string): number {\n    let ans = 0;\n    for (let i = 1; i < s.length; i++) {\n        if (s[i].toLowerCase() !== s[i-1].toLowerCase()) ans++;\n    }\n    return ans;\n}",
      PYTHON: "def solve(s):\n    ans = 0\n    for i in range(1, len(s)):\n        if s[i].lower() != s[i-1].lower():\n            ans += 1\n    return ans",
      JAVA: "    static int solve(String s) {\n        int ans = 0;\n        for (int i = 1; i < s.length(); i++) {\n            char c1 = Character.toLowerCase(s.charAt(i));\n            char c2 = Character.toLowerCase(s.charAt(i-1));\n            if (c1 != c2) ans++;\n        }\n        return ans;\n    }",
      CPP: "#include <string>\nusing namespace std;\nint solve(string s) {\n    int ans = 0;\n    for (int i = 1; i < s.size(); i++) {\n        char c1 = s[i], c2 = s[i-1];\n        if (c1 >= 'A' && c1 <= 'Z') c1 += 32;\n        if (c2 >= 'A' && c2 <= 'Z') c2 += 32;\n        if (c1 != c2) ans++;\n    }\n    return ans;\n}",
      GO: "func solve(s string) int {\n    ans := 0\n    for i := 1; i < len(s); i++ {\n        c1 := s[i]\n        c2 := s[i-1]\n        if c1 >= 'A' && c1 <= 'Z' { c1 += 32 }\n        if c2 >= 'A' && c2 <= 'Z' { c2 += 32 }\n        if c1 != c2 { ans++ }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "aAbBcC", expectedStdout: "2", isSample: true },
      { stdin: "aA", expectedStdout: "0", isSample: true },
      { stdin: "abc", expectedStdout: "2" },
      { stdin: "ab", expectedStdout: "1" },
      { stdin: "a", expectedStdout: "0" },
      { stdin: "AaAaA", expectedStdout: "0" },
      { stdin: "aB", expectedStdout: "1" },
      { stdin: "AbCd", expectedStdout: "3" },
    ],
  }),

  p({
    ...base,
    slug: "unique-energy-signatures",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Identifying Distinct Artifacts",
    patternTags: ["strings","hash-set","parsing"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 700,
    promptMarkdown: "You are given a raw archaeological log `stream` containing a mix of lowercase letters and digits. The continuous sequences of digits represent the identifiers of discovered artifacts, which are separated by one or more letters. You must extract all artifact identifiers and determine the total number of distinct identifiers found.\n\nArtifact identifiers that differ only by leading zeros are treated as identical (for example, \"01\" and \"1\" refer to the same artifact). Note that an identifier of \"00\" is evaluated simply as \"0\".\n\n**Constraints**\n- `1 <= stream.length <= 100`\n- `stream` consists of lowercase English letters and digits.\n\n**Example 1**\n```\ninput:\na123bc34d8ef34\noutput:\n3\n```\n*Explanation: The extracted identifiers are \"123\", \"34\", \"8\", and \"34\". The distinct ones are \"123\", \"34\", and \"8\".*\n\n**Example 2**\n```\ninput:\na1b01c001\noutput:\n1\n```\n*Explanation: After removing leading zeros, all three sequences evaluate to the same identifier \"1\".*\n\n**Example 3**\n```\ninput:\nabc\noutput:\n0\n```\n*Explanation: There are no digits in the log, so the count of distinct identifiers is 0.*\n\n**Follow-up**\nCan you optimize your solution to use very little extra memory (e.g., no string building copies until placing them in the set)?",
    editorialMarkdown: "## Unique Energy Signatures\n\nThis task asks us to extract contiguous blocks of digits separated by letters, normalize these numbers by stripping leading zeros (to treat \"001\" and \"1\" the same), and then count how many distinct normalized signatures remain.\n\nThe easiest approach is to iterate through the string, building up a substring of digits whenever we encounter them. When we hit a letter or the end of the string, we process the accumulated digit string if it isn't empty. We remove all leading zeros, being careful to leave exactly one '0' if the block consisted entirely of zeros. These cleaned strings are placed in a HashSet to automatically deduplicate them. At the end, the number of items in the set is our answer.\n\n**Trap**: Converting digit strings to integers might be tempting, but in languages like C++, Java, or Go, doing so could cause an overflow if a block contains a massive sequence of digits (e.g. 50 zeros followed by a 1). Parsing strings directly and storing them as strings avoids this.\n\n**Complexity:**\n- **Time:** O(N), where N is the length of the data stream. We traverse the stream and do string manipulations linearly.\n- **Space:** O(N), in the worst case, to store the unique energy strings inside the set.",
    referenceSolution: {
      JAVASCRIPT: "function solve(stream) {\n    let s = new Set();\n    let parts = stream.split(/[a-z]+/);\n    for (let p of parts) {\n        if (p.length > 0) {\n            let j = 0;\n            while (j < p.length - 1 && p[j] === '0') j++;\n            s.add(p.substring(j));\n        }\n    }\n    return s.size;\n}",
      TYPESCRIPT: "function solve(stream: string): number {\n    let s = new Set<string>();\n    let parts = stream.split(/[a-z]+/);\n    for (let p of parts) {\n        if (p.length > 0) {\n            let j = 0;\n            while (j < p.length - 1 && p[j] === '0') j++;\n            s.add(p.substring(j));\n        }\n    }\n    return s.size;\n}",
      PYTHON: "def solve(stream):\n    import re\n    parts = re.split(r'[a-z]+', stream)\n    s = set()\n    for p in parts:\n        if p:\n            s.add(str(int(p)))\n    return len(s)",
      JAVA: "    static int solve(String stream) {\n        java.util.HashSet<String> set = new java.util.HashSet<>();\n        StringBuilder cur = new StringBuilder();\n        for (int i = 0; i <= stream.length(); i++) {\n            if (i < stream.length() && Character.isDigit(stream.charAt(i))) {\n                cur.append(stream.charAt(i));\n            } else {\n                if (cur.length() > 0) {\n                    int j = 0;\n                    while (j < cur.length() - 1 && cur.charAt(j) == '0') j++;\n                    set.add(cur.substring(j));\n                    cur.setLength(0);\n                }\n            }\n        }\n        return set.size();\n    }",
      CPP: "#include <string>\n#include <unordered_set>\nusing namespace std;\nint solve(string stream) {\n    unordered_set<string> s;\n    string cur = \"\";\n    for (int i = 0; i <= stream.size(); i++) {\n        if (i < stream.size() && stream[i] >= '0' && stream[i] <= '9') {\n            cur += stream[i];\n        } else {\n            if (cur != \"\") {\n                int j = 0;\n                while (j < cur.size() - 1 && cur[j] == '0') j++;\n                s.insert(cur.substr(j));\n                cur = \"\";\n            }\n        }\n    }\n    return s.size();\n}",
      GO: "func solve(stream string) int {\n    set := make(map[string]bool)\n    cur := \"\"\n    for i := 0; i <= len(stream); i++ {\n        if i < len(stream) && stream[i] >= '0' && stream[i] <= '9' {\n            cur += string(stream[i])\n        } else {\n            if cur != \"\" {\n                j := 0\n                for j < len(cur)-1 && cur[j] == '0' {\n                    j++\n                }\n                set[cur[j:]] = true\n                cur = \"\"\n            }\n        }\n    }\n    return len(set)\n}",
    },
    tests: [
      { stdin: "a123bc34d8ef34", expectedStdout: "3", isSample: true },
      { stdin: "a1b01c001", expectedStdout: "1", isSample: true },
      { stdin: "abc", expectedStdout: "0" },
      { stdin: "leet1234code234", expectedStdout: "2" },
      { stdin: "0", expectedStdout: "1" },
      { stdin: "000", expectedStdout: "1" },
      { stdin: "1a1b1c", expectedStdout: "1" },
      { stdin: "000a000b000", expectedStdout: "1" },
    ],
  }),
];
