import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w0-059` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W0_059_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "spaceship-thruster-tests",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Robot Battery Quality Control",
    patternTags: ["arrays","hash-map","sorting"],
    signatureId: "fn:matrix->matrix",
    avgSolveSeconds: 600,
    promptMarkdown: "You are analyzing the quality of batteries produced for various robot models. Each record contains the robot's integer ID and the battery capacity measured during testing.\n\nGiven a 2D integer array `logs` where `logs[i] = [id, capacity]`, return a 2D array of the robots and their **average capacity from their top 3 tests**, sorted in increasing order of their ID. The average should be computed using integer division (rounded down).\n\n**Constraints**\n- `3 <= logs.length <= 1000`\n- `1 <= id <= 100`\n- `0 <= capacity <= 1000`\n- It is guaranteed that each robot ID in the logs has at least 3 test results.\n\n**Example 1**\n```\ninput:\n1 90;1 100;1 80;2 70;2 80;2 90\noutput:\n1 90;2 80\n```\n*Explanation: Robot 1 has top 3 capacities of 100, 90, 80 (avg 90). Robot 2 has top 3 capacities of 90, 80, 70 (avg 80).*\n\n**Example 2**\n```\ninput:\n10 10;10 10;10 10;10 10\noutput:\n10 10\n```\n*Explanation: Robot 10 has capacities 10, 10, 10, 10. The top 3 are all 10, giving an average of 10.*\n\n**Example 3**\n```\ninput:\n1 50;1 60;1 70;1 80;1 90\noutput:\n1 80\n```\n*Explanation: Robot 1's top 3 capacities are 90, 80, and 70. Their sum is 240, yielding an average of 80.*\n\n**Follow-up**\nCan you compute the top 3 tests for each robot without sorting all of its tests?",
    editorialMarkdown: "## Spaceship Thruster Tests\n\nThis problem requires us to group the test results by spaceship ID and then compute the average of the top 3 thrust tests for each spaceship.\n\nA straightforward approach is to iterate over the test logs, accumulating the scores for each ID in a hash map (or array, since IDs are small). After gathering all the scores, we sort the lists of scores in descending order to easily pick the top 3 scores. We then compute the average and sort the final result by the spaceship ID.\n\n**Trap**: A common pitfall is forgetting to sort the scores before selecting the top 3, or improperly handling the sorting of the result matrix by ID (which is trivial if we iterate from 1 to 100).\n\n**Complexity:**\n- **Time:** O(N + M log M) where N is the number of logs and M is the maximum number of tests for a single spaceship.\n- **Space:** O(N) to store the scores for each spaceship.",
    referenceSolution: {
      JAVASCRIPT: "function solve(logs) {\n    let map = new Map();\n    for (let log of logs) {\n        let id = log[0];\n        let thrust = log[1];\n        if (!map.has(id)) map.set(id, []);\n        map.get(id).push(thrust);\n    }\n    let res = [];\n    for (let id = 1; id <= 100; id++) {\n        if (map.has(id)) {\n            let tests = map.get(id);\n            tests.sort((a, b) => b - a);\n            let avg = Math.floor((tests[0] + tests[1] + tests[2]) / 3);\n            res.push([id, avg]);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(logs: number[][]): number[][] {\n    let map = new Map<number, number[]>();\n    for (let log of logs) {\n        let id = log[0];\n        let thrust = log[1];\n        if (!map.has(id)) map.set(id, []);\n        map.get(id)!.push(thrust);\n    }\n    let res: number[][] = [];\n    for (let id = 1; id <= 100; id++) {\n        if (map.has(id)) {\n            let tests = map.get(id)!;\n            tests.sort((a, b) => b - a);\n            let avg = Math.floor((tests[0] + tests[1] + tests[2]) / 3);\n            res.push([id, avg]);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(logs):\n    scores = {}\n    for log in logs:\n        uid, thrust = log[0], log[1]\n        if uid not in scores:\n            scores[uid] = []\n        scores[uid].append(thrust)\n    res = []\n    for uid in range(1, 101):\n        if uid in scores:\n            tests = sorted(scores[uid], reverse=True)\n            res.append([uid, (tests[0] + tests[1] + tests[2]) // 3])\n    return res",
      JAVA: "    static int[][] solve(int[][] logs) {\n        java.util.Map<Integer, java.util.List<Integer>> map = new java.util.HashMap<>();\n        for (int[] log : logs) {\n            map.putIfAbsent(log[0], new java.util.ArrayList<>());\n            map.get(log[0]).add(log[1]);\n        }\n        java.util.List<int[]> resList = new java.util.ArrayList<>();\n        for (int i = 1; i <= 100; i++) {\n            if (map.containsKey(i)) {\n                java.util.List<Integer> tests = map.get(i);\n                java.util.Collections.sort(tests, java.util.Collections.reverseOrder());\n                int avg = (tests.get(0) + tests.get(1) + tests.get(2)) / 3;\n                resList.add(new int[]{i, avg});\n            }\n        }\n        int[][] res = new int[resList.size()][2];\n        for (int i = 0; i < resList.size(); i++) {\n            res[i] = resList.get(i);\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n#include <map>\n#include <algorithm>\n\nusing namespace std;\n\nvector<vector<int>> solve(vector<vector<int>> logs) {\n    map<int, vector<int>> scores;\n    for (auto& log : logs) {\n        scores[log[0]].push_back(log[1]);\n    }\n    vector<vector<int>> res;\n    for (auto& pair : scores) {\n        vector<int>& tests = pair.second;\n        sort(tests.rbegin(), tests.rend());\n        int avg = (tests[0] + tests[1] + tests[2]) / 3;\n        res.push_back({pair.first, avg});\n    }\n    return res;\n}",
      GO: "func solve(logs [][]int) [][]int {\n    scores := make([][]int, 101)\n    for _, log := range logs {\n        uid := log[0]\n        thrust := log[1]\n        scores[uid] = append(scores[uid], thrust)\n    }\n    var res [][]int\n    for i := 1; i <= 100; i++ {\n        if len(scores[i]) > 0 {\n            for j := 0; j < len(scores[i]); j++ {\n                for k := j + 1; k < len(scores[i]); k++ {\n                    if scores[i][k] > scores[i][j] {\n                        scores[i][j], scores[i][k] = scores[i][k], scores[i][j]\n                    }\n                }\n            }\n            avg := (scores[i][0] + scores[i][1] + scores[i][2]) / 3\n            res = append(res, []int{i, avg})\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 90;1 100;1 80;2 70;2 80;2 90", expectedStdout: "1 90;2 80", isSample: true },
      { stdin: "10 10;10 10;10 10;10 10", expectedStdout: "10 10", isSample: true },
      { stdin: "1 50;1 60;1 70;1 80;1 90", expectedStdout: "1 80" },
      { stdin: "5 100;5 100;5 100", expectedStdout: "5 100" },
      { stdin: "1 0;1 0;1 0", expectedStdout: "1 0" },
      { stdin: "2 30;2 33;2 34;2 35", expectedStdout: "2 34" },
      { stdin: "1 10;1 20;1 30;2 10;2 20;2 30", expectedStdout: "1 20;2 20" },
      { stdin: "99 1000;99 1000;99 1000;100 1000;100 1000;100 1000;1 1000;1 1000;1 1000", expectedStdout: "1 1000;99 1000;100 1000" },
    ],
  }),

  p({
    ...base,
    slug: "alien-language-cipher",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Hostname Migration Mapping",
    patternTags: ["hash-map","string","counting"],
    signatureId: "fn:string,string->bool",
    avgSolveSeconds: 450,
    promptMarkdown: "You are migrating settings between two legacy systems. You need to verify if the old server's identifier can be consistently translated into the new server's identifier.\n\nGiven two strings `oldId` and `newId`, determine if they follow a strict character substitution mapping. Two identifiers share a mapping if the characters in `oldId` can be replaced to yield `newId`.\n\nEvery occurrence of a specific character must be replaced with the same alternative character, while keeping the original sequence intact. Multiple distinct characters cannot be mapped to the identical character, though a character may map to itself.\n\n**Constraints**\n- `1 <= oldId.length, newId.length <= 1000`\n- Both strings consist of lowercase English letters.\n\n**Example 1**\n```\ninput:\negg\nadd\noutput:\ntrue\n```\n*Explanation: 'e' maps to 'a' and 'g' maps to 'd'.*\n\n**Example 2**\n```\ninput:\nfoo\nbar\noutput:\nfalse\n```\n*Explanation: 'o' would need to map to both 'a' and 'r', which is not allowed.*\n\n**Example 3**\n```\ninput:\npaper\ntitle\noutput:\ntrue\n```\n*Explanation: 'p' maps to 't', 'a' to 'i', 'e' to 'l', and 'r' to 'e'.*\n\n**Follow-up**\nCan you optimize the memory usage by utilizing fixed-size arrays instead of complex dictionary structures?",
    editorialMarkdown: "## Alien Language Cipher\n\nThis problem asks us to determine if two strings exhibit a 1-to-1 character substitution mapping. This means each character from the first string is consistently substituted with exactly one unique character in the second string, and vice versa.\n\nThe optimal approach is to maintain two dictionaries or arrays to track the mapping from characters in `s` to characters in `t`, and from `t` to `s`. As you iterate through the strings, you verify if the current character in `s` maps consistently to the current character in `t`.\n\n**Trap**: A common pitfall is to only track the mapping from `s` to `t`. Without the reverse mapping, distinct characters in `s` might wrongly map to the same character in `t` (e.g., \"ab\" mapping to \"aa\").\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string, as we do a single pass over the characters.\n- **Space:** O(1) space overall, since the character set (e.g., ASCII) is a fixed constant size, bounded at 256.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s, t) {\n    if (s.length !== t.length) return false;\n    let m1 = new Map();\n    let m2 = new Map();\n    for (let i = 0; i < s.length; i++) {\n        let c1 = s[i], c2 = t[i];\n        if (m1.has(c1) && m1.get(c1) !== c2) return false;\n        if (m2.has(c2) && m2.get(c2) !== c1) return false;\n        m1.set(c1, c2);\n        m2.set(c2, c1);\n    }\n    return true;\n}",
      TYPESCRIPT: "function solve(s: string, t: string): boolean {\n    if (s.length !== t.length) return false;\n    let m1 = new Map<string, string>();\n    let m2 = new Map<string, string>();\n    for (let i = 0; i < s.length; i++) {\n        let c1 = s[i], c2 = t[i];\n        if (m1.has(c1) && m1.get(c1) !== c2) return false;\n        if (m2.has(c2) && m2.get(c2) !== c1) return false;\n        m1.set(c1, c2);\n        m2.set(c2, c1);\n    }\n    return true;\n}",
      PYTHON: "def solve(s, t):\n    if len(s) != len(t):\n        return False\n    return len(set(s)) == len(set(t)) == len(set(zip(s, t)))",
      JAVA: "    static boolean solve(String s, String t) {\n        if (s.length() != t.length()) return false;\n        int[] m1 = new int[256];\n        int[] m2 = new int[256];\n        for (int i = 0; i < s.length(); i++) {\n            char c1 = s.charAt(i);\n            char c2 = t.charAt(i);\n            if (m1[c1] != 0 && m1[c1] != c2) return false;\n            if (m2[c2] != 0 && m2[c2] != c1) return false;\n            m1[c1] = c2;\n            m2[c2] = c1;\n        }\n        return true;\n    }",
      CPP: "#include <string>\n#include <vector>\n\nusing namespace std;\n\nbool solve(string s, string t) {\n    if (s.length() != t.length()) return false;\n    vector<int> m1(256, 0), m2(256, 0);\n    for (int i = 0; i < s.length(); i++) {\n        if (m1[s[i]] != 0 && m1[s[i]] != t[i]) return false;\n        if (m2[t[i]] != 0 && m2[t[i]] != s[i]) return false;\n        m1[s[i]] = t[i];\n        m2[t[i]] = s[i];\n    }\n    return true;\n}",
      GO: "func solve(s string, t string) bool {\n    if len(s) != len(t) {\n        return false\n    }\n    m1 := make(map[byte]byte)\n    m2 := make(map[byte]byte)\n    for i := 0; i < len(s); i++ {\n        c1, c2 := s[i], t[i]\n        if val, ok := m1[c1]; ok && val != c2 {\n            return false\n        }\n        if val, ok := m2[c2]; ok && val != c1 {\n            return false\n        }\n        m1[c1] = c2\n        m2[c2] = c1\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "egg\nadd", expectedStdout: "true", isSample: true },
      { stdin: "foo\nbar", expectedStdout: "false", isSample: true },
      { stdin: "paper\ntitle", expectedStdout: "true" },
      { stdin: "a\na", expectedStdout: "true" },
      { stdin: "ab\naa", expectedStdout: "false" },
      { stdin: "aa\nab", expectedStdout: "false" },
      { stdin: "abcdef\nuvwxyz", expectedStdout: "true" },
      { stdin: "a\nb", expectedStdout: "true" },
    ],
  }),

  p({
    ...base,
    slug: "rare-minerals-extracted",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Bird Species Tracking",
    patternTags: ["string","hash-set","counting"],
    signatureId: "fn:string,string->int",
    avgSolveSeconds: 300,
    promptMarkdown: "You are an ornithologist analyzing photos taken during an expedition. You have a string `targetSpecies` representing the specific types of birds you are studying, and a string `photographedBirds` representing all the birds you managed to capture on camera.\n\nGiven the two strings, return the total count of birds in `photographedBirds` that belong to the `targetSpecies`.\n\nLetters are case-sensitive, so `\"a\"` is considered a different species from `\"A\"`. All characters in `targetSpecies` are guaranteed to be unique.\n\n**Constraints**\n- `1 <= targetSpecies.length, photographedBirds.length <= 1000`\n- Both strings consist of uppercase and lowercase English letters.\n\n**Example 1**\n```\ninput:\naA\naAAbbbb\noutput:\n3\n```\n*Explanation: The birds 'a', 'A', and 'A' are in the target list.*\n\n**Example 2**\n```\ninput:\nz\nZZ\noutput:\n0\n```\n*Explanation: 'Z' is not the same as 'z', so none are found.*\n\n**Example 3**\n```\ninput:\nxyz\nxyzzxy\noutput:\n6\n```\n*Explanation: All 6 photographed birds are target species.*\n\n**Follow-up**\nCan you perform this counting check in O(N + M) time complexity utilizing O(1) space for fixed alphabets?",
    editorialMarkdown: "## Rare Minerals Extracted\n\nThis problem challenges us to count how many characters from one string exist within a specific target set of characters.\n\nThe naive approach is to use a nested loop, checking every extracted ore against every target mineral, which yields O(N * M) time complexity. The optimal strategy utilizes a Hash Set. By loading all unique `targetMinerals` characters into a set, we can achieve constant time O(1) lookups. We then iterate over the `extractedOres` and increment our count whenever a character is found in the Hash Set.\n\n**Trap**: Avoiding the nested loop is critical for optimal performance. While a linear scan of a short string might pass tests, using a Hash Set or boolean array (for fixed alphabets) ensures it efficiently scales for longer input sizes.\n\n**Complexity:**\n- **Time:** O(N + M) where N and M are the lengths of the two strings, since inserting into and querying a hash set operates in O(1) time.\n- **Space:** O(N) auxiliary space to store the set of target minerals.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s1, s2) {\n    let set = new Set(s1);\n    let count = 0;\n    for (let c of s2) {\n        if (set.has(c)) count++;\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(s1: string, s2: string): number {\n    let set = new Set(s1);\n    let count = 0;\n    for (let c of s2) {\n        if (set.has(c)) count++;\n    }\n    return count;\n}",
      PYTHON: "def solve(s1, s2):\n    return sum(1 for c in s2 if c in set(s1))",
      JAVA: "    static int solve(String s1, String s2) {\n        boolean[] set = new boolean[256];\n        for (char c : s1.toCharArray()) set[c] = true;\n        int count = 0;\n        for (char c : s2.toCharArray()) {\n            if (set[c]) count++;\n        }\n        return count;\n    }",
      CPP: "#include <string>\n#include <vector>\n\nusing namespace std;\n\nint solve(string s1, string s2) {\n    vector<bool> set(256, false);\n    for (char c : s1) set[c] = true;\n    int count = 0;\n    for (char c : s2) {\n        if (set[c]) count++;\n    }\n    return count;\n}",
      GO: "func solve(s1 string, s2 string) int {\n    set := make(map[rune]bool)\n    for _, c := range s1 {\n        set[c] = true\n    }\n    count := 0\n    for _, c := range s2 {\n        if set[c] {\n            count++\n        }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "aA\naAAbbbb", expectedStdout: "3", isSample: true },
      { stdin: "z\nZZ", expectedStdout: "0", isSample: true },
      { stdin: "xyz\nxyzzxy", expectedStdout: "6" },
      { stdin: "a\na", expectedStdout: "1" },
      { stdin: "abc\ndef", expectedStdout: "0" },
      { stdin: "A\nA", expectedStdout: "1" },
      { stdin: "ab\naabb", expectedStdout: "4" },
      { stdin: "abc\nxyz", expectedStdout: "0" },
    ],
  }),

  p({
    ...base,
    slug: "token-selection-strategy",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GREEDY",
    title: "Feedback Sampling",
    patternTags: ["greedy","math","arrays"],
    signatureId: "fn:ints,int->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are a product manager selecting customer feedback for a presentation. The available feedback submissions are grouped into three categories, provided as an array of three integers `counts = [positive, neutral, negative]`.\n\n- Each positive feedback adds `1` to your presentation score.\n- Each neutral feedback adds `0` to your presentation score.\n- Each negative feedback subtracts `1` from your presentation score (adds `-1`).\n\nGiven the integer array `counts` and an integer `k`, return the maximum possible score if you must choose exactly `k` feedback submissions in total.\n\n**Constraints**\n- `counts.length == 3`\n- `0 <= counts[i] <= 10^9`\n- `0 <= k <= positive + neutral + negative`\n\n**Example 1**\n```\ninput:\n3 2 0\n2\noutput:\n2\n```\n*Explanation: You have 3 positive, 2 neutral, 0 negative. You choose 2 positive submissions for a max score of 2.*\n\n**Example 2**\n```\ninput:\n3 2 0\n4\noutput:\n3\n```\n*Explanation: You must choose 4 submissions. You choose 3 positive and 1 neutral, yielding a score of 3 + 0 = 3.*\n\n**Example 3**\n```\ninput:\n0 0 5\n5\noutput:\n-5\n```\n*Explanation: You are forced to pick 5 negative submissions, dropping your score to -5.*\n\n**Follow-up**\nCan you compute the maximum sum in O(1) time without looping over the items?",
    editorialMarkdown: "## Token Selection Strategy\n\nThis problem tests greedy decision-making. You want to maximize your score by picking tokens that offer the highest value first.\n\nThe optimal strategy relies on a simple greedy approach:\n1. Always prioritize Gold tokens (+1) first, taking up to `k` or the total number of Gold tokens available.\n2. If `k` is larger than the number of Gold tokens, use the remaining choices on Silver tokens (0), as they don't impact the score negatively.\n3. If `k` is larger than the combined total of Gold and Silver tokens, the remainder must be filled with Bronze tokens (-1).\n\n**Trap**: Iteratively simulating the picking process one token at a time can be too slow for extremely large counts. Direct mathematical derivation (subtraction) is optimal.\n\n**Complexity:**\n- **Time:** O(1) mathematically calculating the final score without loops.\n- **Space:** O(1) since we only use a few distinct variables for the computations.",
    referenceSolution: {
      JAVASCRIPT: "function solve(counts, k) {\n    let gold = counts[0], silver = counts[1], bronze = counts[2];\n    if (k <= gold) return k;\n    if (k <= gold + silver) return gold;\n    return gold - (k - gold - silver);\n}",
      TYPESCRIPT: "function solve(counts: number[], k: number): number {\n    let gold = counts[0], silver = counts[1];\n    if (k <= gold) return k;\n    if (k <= gold + silver) return gold;\n    return gold - (k - gold - silver);\n}",
      PYTHON: "def solve(counts, k):\n    gold, silver, bronze = counts\n    if k <= gold: return k\n    if k <= gold + silver: return gold\n    return gold - (k - gold - silver)",
      JAVA: "    static int solve(int[] counts, int k) {\n        int gold = counts[0];\n        int silver = counts[1];\n        if (k <= gold) return k;\n        if (k <= gold + silver) return gold;\n        return gold - (k - gold - silver);\n    }",
      CPP: "#include <vector>\n\nusing namespace std;\n\nint solve(vector<int> counts, int k) {\n    int gold = counts[0];\n    int silver = counts[1];\n    if (k <= gold) return k;\n    if (k <= gold + silver) return gold;\n    return gold - (k - gold - silver);\n}",
      GO: "func solve(counts []int, k int) int {\n    gold, silver := counts[0], counts[1]\n    if k <= gold {\n        return k\n    }\n    if k <= gold + silver {\n        return gold\n    }\n    return gold - (k - gold - silver)\n}",
    },
    tests: [
      { stdin: "3 2 0\n2", expectedStdout: "2", isSample: true },
      { stdin: "3 2 0\n4", expectedStdout: "3", isSample: true },
      { stdin: "3 2 4\n9", expectedStdout: "-1" },
      { stdin: "0 0 5\n5", expectedStdout: "-5" },
      { stdin: "10 10 10\n5", expectedStdout: "5" },
      { stdin: "1 1 1\n3", expectedStdout: "0" },
      { stdin: "0 5 0\n3", expectedStdout: "0" },
      { stdin: "2 0 2\n3", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "kth-unique-artifact-id",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Kth Isolated Network Request",
    patternTags: ["arrays","hash-map","counting"],
    signatureId: "fn:ints,int->int",
    avgSolveSeconds: 500,
    promptMarkdown: "You are a security analyst reviewing a sequence of incoming connection requests. Some of the connection IDs are repeated, representing normal traffic, while IDs that appear exactly once are isolated requests that require further inspection.\n\nGiven an integer array `ids` and an integer `k`, return the `k`-th isolated request ID present in the array. An isolated request ID is one that appears exactly once.\n\nThe `k`-th isolated request is based on the original order they appear in the array. If there are fewer than `k` isolated requests, return `-1`.\n\n**Constraints**\n- `1 <= ids.length <= 1000`\n- `1 <= ids[i] <= 10^5`\n- `1 <= k <= 1000`\n\n**Example 1**\n```\ninput:\n2 1 2 4 5\n2\noutput:\n4\n```\n*Explanation: The isolated request IDs are 1, 4, and 5 in order. The 2nd isolated ID is 4.*\n\n**Example 2**\n```\ninput:\n1 2 3\n3\noutput:\n3\n```\n*Explanation: All IDs are isolated. The 3rd isolated ID is 3.*\n\n**Example 3**\n```\ninput:\n1 1 1\n1\noutput:\n-1\n```\n*Explanation: There are no isolated requests. Return -1.*\n\n**Follow-up**\nCan you find the k-th isolated request utilizing O(N) time complexity and O(N) auxiliary space?",
    editorialMarkdown: "## Kth Unique Artifact ID\n\nThe problem requires finding the k-th element in the sequence that appears exactly once.\n\nTo solve this efficiently, we can use a hash map to keep a frequency count of each ID during a first pass through the array. On a second pass through the array, we check each ID against the frequency map. We maintain a counter for unique IDs (elements with a frequency of exactly 1). When this counter hits `k`, we return the current ID. If we finish the array and the counter is less than `k`, we return -1.\n\n**Trap**: A common mistake is sorting the list or using a hash map to maintain order. Hash maps generally do not preserve insertion order (depending on the language), so we must iterate over the original array during the second pass to guarantee finding the k-th unique element in the original sequence order.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the array, for the two passes over the elements.\n- **Space:** O(N) space to store the frequency map.",
    referenceSolution: {
      JAVASCRIPT: "function solve(ids, k) {\n    let map = new Map();\n    for (let id of ids) {\n        map.set(id, (map.get(id) || 0) + 1);\n    }\n    let uniqueCount = 0;\n    for (let id of ids) {\n        if (map.get(id) === 1) {\n            uniqueCount++;\n            if (uniqueCount === k) return id;\n        }\n    }\n    return -1;\n}",
      TYPESCRIPT: "function solve(ids: number[], k: number): number {\n    let map = new Map<number, number>();\n    for (let id of ids) {\n        map.set(id, (map.get(id) || 0) + 1);\n    }\n    let uniqueCount = 0;\n    for (let id of ids) {\n        if (map.get(id) === 1) {\n            uniqueCount++;\n            if (uniqueCount === k) return id;\n        }\n    }\n    return -1;\n}",
      PYTHON: "def solve(ids, k):\n    counts = {}\n    for x in ids:\n        counts[x] = counts.get(x, 0) + 1\n    unique = 0\n    for x in ids:\n        if counts[x] == 1:\n            unique += 1\n            if unique == k:\n                return x\n    return -1",
      JAVA: "    static int solve(int[] ids, int k) {\n        java.util.Map<Integer, Integer> counts = new java.util.HashMap<>();\n        for (int x : ids) {\n            counts.put(x, counts.getOrDefault(x, 0) + 1);\n        }\n        int unique = 0;\n        for (int x : ids) {\n            if (counts.get(x) == 1) {\n                unique++;\n                if (unique == k) return x;\n            }\n        }\n        return -1;\n    }",
      CPP: "#include <vector>\n#include <unordered_map>\n\nusing namespace std;\n\nint solve(vector<int> ids, int k) {\n    unordered_map<int, int> counts;\n    for (int x : ids) {\n        counts[x]++;\n    }\n    int unique = 0;\n    for (int x : ids) {\n        if (counts[x] == 1) {\n            unique++;\n            if (unique == k) return x;\n        }\n    }\n    return -1;\n}",
      GO: "func solve(ids []int, k int) int {\n    counts := make(map[int]int)\n    for _, x := range ids {\n        counts[x]++\n    }\n    unique := 0\n    for _, x := range ids {\n        if counts[x] == 1 {\n            unique++\n            if unique == k {\n                return x\n            }\n        }\n    }\n    return -1\n}",
    },
    tests: [
      { stdin: "2 1 2 4 5\n2", expectedStdout: "4", isSample: true },
      { stdin: "1 2 3\n3", expectedStdout: "3", isSample: true },
      { stdin: "1 1 1\n1", expectedStdout: "-1" },
      { stdin: "5\n1", expectedStdout: "5" },
      { stdin: "2 2 3 4 5 5\n1", expectedStdout: "3" },
      { stdin: "2 2 3 4 5 5\n2", expectedStdout: "4" },
      { stdin: "2 2 3 4 5 5\n3", expectedStdout: "-1" },
      { stdin: "10 20 10\n1", expectedStdout: "20" },
    ],
  }),
];
