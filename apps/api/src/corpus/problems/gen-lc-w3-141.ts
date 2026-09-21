import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w3-141` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W3_141_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "heavy-duty-storage-parts",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Heavy Duty Storage Parts",
    patternTags: ["hash-map","aggregation","filtering"],
    signatureId: "fn:matrix->ints",
    avgSolveSeconds: 450,
    promptMarkdown: "You are auditing the inventory usage of a shipyard repairing spacecraft. Some parts are heavily utilized, and you need to identify which components are in high demand to prioritize restocking.\n\nYou are given a 2D integer array `orders` where each element is `[partId, quantity]`. This represents a request for a specific amount of a part.\n\nCalculate the total quantity requested for each `partId` across all orders. Return an array of `partId`s that have a total requested quantity of **100 or more**. \n\nThe returned array should be sorted in ascending order.\n\n**Constraints**\n- `0 <= orders.length <= 100`\n- `orders[i].length == 2`\n- `1 <= orders[i][0] <= 1000` (the part ID)\n- `1 <= orders[i][1] <= 100` (the quantity)\n\n**Example 1**\n```\ninput:\n1 50;2 100;1 50;3 20\noutput:\n1 2\n```\n*Explanation: Part 1 has a total of 50 + 50 = 100. Part 2 has 100. Part 3 has 20. Only parts 1 and 2 meet the threshold.*\n\n**Example 2**\n```\ninput:\n5 99;5 1\noutput:\n5\n```\n*Explanation: Part 5 is ordered twice with a total of 100, so it meets the threshold.*\n\n**Example 3**\n```\ninput:\n10 50;20 40\noutput:\n\n```\n*Explanation: No parts reached a total quantity of 100.*\n\n**Follow-up**\nCan you optimize the solution to ensure it efficiently processes up to 10^5 orders using a hash map?",
    editorialMarkdown: "## Heavy Duty Storage Parts\n\nThe problem asks us to calculate the total requested quantities of various spacecraft parts and return the IDs of the parts that have a total quantity of at least 100, in ascending order.\n\nThis is a classic aggregation problem that can be efficiently solved using a hash map. We iterate over the logs, keeping track of the running sum of quantities for each part ID. After processing all logs, we extract the IDs that meet the threshold and sort them.\n\n**Trap**: A common mistake is to try and sort the list before aggregation, or to use an inefficient O(N^2) search over the list to count occurrences. Using a hash map achieves optimal time complexity.\n\n**Complexity:**\n- **Time:** O(N + K log K) where N is the number of order records and K is the number of unique part IDs, due to the final sorting step.\n- **Space:** O(K) to store the accumulated totals in the hash map.",
    referenceSolution: {
      JAVASCRIPT: "function solve(orders) {\n    // Total the quantity ordered per part.\n    let counts = {};\n    for (let order of orders) {\n        if (order.length === 2) {\n            counts[order[0]] = (counts[order[0]] || 0) + order[1];\n        }\n    }\n    let res = [];\n    for (let key in counts) {\n        if (counts[key] >= 100) {\n            res.push(parseInt(key));\n        }\n    }\n    // Insertion sort, ascending.\n    for (let i = 1; i < res.length; i++) {\n        let value = res[i];\n        let j = i - 1;\n        while (j >= 0 && res[j] > value) {\n            res[j + 1] = res[j];\n            j--;\n        }\n        res[j + 1] = value;\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(orders: number[][]): number[] {\n    // Total the quantity ordered per part.\n    let counts: { [key: number]: number } = {};\n    for (let order of orders) {\n        if (order.length === 2) {\n            counts[order[0]!] = (counts[order[0]!] || 0) + order[1]!;\n        }\n    }\n    let res: number[] = [];\n    for (let key in counts) {\n        if (counts[key]! >= 100) {\n            res.push(parseInt(key));\n        }\n    }\n    // Insertion sort, ascending.\n    for (let i = 1; i < res.length; i++) {\n        const value = res[i]!;\n        let j = i - 1;\n        while (j >= 0 && res[j]! > value) {\n            res[j + 1] = res[j]!;\n            j--;\n        }\n        res[j + 1] = value;\n    }\n    return res;\n}",
      PYTHON: "def solve(orders):\n    # Total the quantity ordered per part.\n    counts = {}\n    for order in orders:\n        if len(order) == 2:\n            counts[order[0]] = counts.get(order[0], 0) + order[1]\n    res = [k for k, v in counts.items() if v >= 100]\n    # Insertion sort, ascending.\n    for i in range(1, len(res)):\n        value = res[i]\n        j = i - 1\n        while j >= 0 and res[j] > value:\n            res[j + 1] = res[j]\n            j -= 1\n        res[j + 1] = value\n    return res",
      JAVA: "    static int[] solve(int[][] orders) {\n        java.util.Map<Integer, Integer> counts = new java.util.HashMap<>();\n        for (int[] order : orders) {\n            if (order.length == 2) {\n                counts.put(order[0], counts.getOrDefault(order[0], 0) + order[1]);\n            }\n        }\n        java.util.List<Integer> res = new java.util.ArrayList<>();\n        for (java.util.Map.Entry<Integer, Integer> entry : counts.entrySet()) {\n            if (entry.getValue() >= 100) res.add(entry.getKey());\n        }\n        int[] out = new int[res.size()];\n        for (int i = 0; i < res.size(); i++) out[i] = res.get(i);\n        // Insertion sort, ascending.\n        for (int i = 1; i < out.length; i++) {\n            int value = out[i];\n            int j = i - 1;\n            while (j >= 0 && out[j] > value) {\n                out[j + 1] = out[j];\n                j--;\n            }\n            out[j + 1] = value;\n        }\n        return out;\n    }",
      CPP: "#include <vector>\n#include <map>\n\nusing namespace std;\n\nvector<int> solve(vector<vector<int>> orders) {\n    // Total the quantity ordered per part.\n    map<int, int> counts;\n    for (auto& order : orders) {\n        if (order.size() == 2) {\n            counts[order[0]] += order[1];\n        }\n    }\n    vector<int> res;\n    for (auto const& entry : counts) {\n        if (entry.second >= 100) {\n            res.push_back(entry.first);\n        }\n    }\n    // Insertion sort, ascending.\n    for (size_t i = 1; i < res.size(); i++) {\n        int value = res[i];\n        int j = (int)i - 1;\n        while (j >= 0 && res[j] > value) {\n            res[j + 1] = res[j];\n            j--;\n        }\n        res[j + 1] = value;\n    }\n    return res;\n}",
      GO: "func solve(orders [][]int) []int {\n    counts := make(map[int]int)\n    for _, order := range orders {\n        if len(order) == 2 {\n            counts[order[0]] += order[1]\n        }\n    }\n    var res []int\n    for k, v := range counts {\n        if v >= 100 {\n            res = append(res, k)\n        }\n    }\n    for i := 0; i < len(res); i++ {\n        for j := i + 1; j < len(res); j++ {\n            if res[i] > res[j] {\n                res[i], res[j] = res[j], res[i]\n            }\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 50;2 100;1 50;3 20", expectedStdout: "1 2", isSample: true },
      { stdin: "5 99;5 1", expectedStdout: "5", isSample: true },
      { stdin: "10 50;20 40", expectedStdout: "" },
      { stdin: "", expectedStdout: "" },
      { stdin: "1 100", expectedStdout: "1" },
      { stdin: "1 100;2 100;3 100", expectedStdout: "1 2 3" },
      { stdin: "10 5;10 5;10 90", expectedStdout: "10" },
      { stdin: "1 10;2 20;3 100;1 89", expectedStdout: "3" },
    ],
  }),

  p({
    ...base,
    slug: "transmission-relay-filter",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Magic Spell Cooldowns",
    patternTags: ["hash-map","filtering","state"],
    signatureId: "fn:matrix->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "You are implementing a spellcasting system for a role-playing game. Players can trigger various magical abilities over time. To prevent spamming, every unique magical ability has a strict cooldown: once a specific ability is cast, it cannot be cast again for **at least 10 seconds**.\n\nYou receive a 2D array `logs` representing attempted casts, where each element is `[timestamp, abilityId]`. The timestamps are provided in non-decreasing order, meaning multiple attempts can occur at the exact same time.\n\nFor each attempt, determine whether the ability was successfully cast. Return an integer array of the same length, where the i-th element is `1` if the cast was successful, and `0` if it failed due to the cooldown.\n\n**Constraints**\n- `0 <= logs.length <= 100`\n- `logs[i].length == 2`\n- `0 <= logs[i][0] <= 1000` (timestamp)\n- `1 <= logs[i][1] <= 1000` (ability ID)\n- The timestamps in `logs` are guaranteed to be sorted in non-decreasing order.\n\n**Example 1**\n```\ninput:\n1 100;2 200;11 100;11 200;12 200\noutput:\n1 1 1 0 1\n```\n*Explanation: \n- `[1, 100]` is successful (first time).\n- `[2, 200]` is successful (first time).\n- `[11, 100]` is successful (11 - 1 = 10, which is >= 10).\n- `[11, 200]` is blocked (11 - 2 = 9, which is < 10).\n- `[12, 200]` is successful (12 - 2 = 10, which is >= 10).*\n\n**Example 2**\n```\ninput:\n1 10;1 20;1 30\noutput:\n1 1 1\n```\n*Explanation: Three different abilities are attempted at the exact same timestamp. Since their IDs differ, all are successful.*\n\n**Example 3**\n```\ninput:\n10 9;20 9;30 9\noutput:\n1 1 1\n```\n*Explanation: Ability 9 is cast every 10 seconds, perfectly matching the required cooldown duration.*\n\n**Follow-up**\nHow would you manage old records if this system needed to run indefinitely without running out of memory?",
    editorialMarkdown: "## Transmission Relay Filter\n\nThe goal is to filter a stream of incoming messages so that we do not spam the network with duplicate transmissions. A message is allowed only if it is the first time we see it, or if it has been 10 or more time units since the last time this exact message was allowed.\n\nWe can solve this by keeping a hash map that maps each message ID to the timestamp when it was last printed. For each message, we check if it is in the hash map. If it's not, or if the current timestamp is at least 10 units greater than the saved timestamp, we allow it (output `1`), and update the hash map with the current timestamp. If not, we drop it (output `0`) and we do NOT update the hash map.\n\n**Trap**: A common trap is to update the last printed timestamp even when the message is dropped. The rule strictly states that the delay must be measured from the *last successfully printed* message. \n\n**Complexity:**\n- **Time:** O(N) where N is the number of transmission events. We process each event in constant time.\n- **Space:** O(U) where U is the number of unique message IDs stored in our hash map.",
    referenceSolution: {
      JAVASCRIPT: "function solve(logs) {\n    let lastPrinted = {};\n    let res = [];\n    for (let log of logs) {\n        if (log.length === 2) {\n            let ts = log[0];\n            let msg = log[1];\n            if (lastPrinted[msg] === undefined || ts - lastPrinted[msg] >= 10) {\n                res.push(1);\n                lastPrinted[msg] = ts;\n            } else {\n                res.push(0);\n            }\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(logs: number[][]): number[] {\n    let lastPrinted: { [key: number]: number } = {};\n    let res: number[] = [];\n    for (let log of logs) {\n        if (log.length === 2) {\n            let ts = log[0];\n            let msg = log[1];\n            if (lastPrinted[msg] === undefined || ts - lastPrinted[msg] >= 10) {\n                res.push(1);\n                lastPrinted[msg] = ts;\n            } else {\n                res.push(0);\n            }\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(logs):\n    last_printed = {}\n    res = []\n    for log in logs:\n        if len(log) == 2:\n            ts, msg = log[0], log[1]\n            if msg not in last_printed or ts - last_printed[msg] >= 10:\n                res.append(1)\n                last_printed[msg] = ts\n            else:\n                res.append(0)\n    return res",
      JAVA: "    static int[] solve(int[][] logs) {\n        java.util.Map<Integer, Integer> lastPrinted = new java.util.HashMap<>();\n        int[] res = new int[logs.length];\n        for (int i = 0; i < logs.length; i++) {\n            if (logs[i].length == 2) {\n                int ts = logs[i][0];\n                int msg = logs[i][1];\n                if (!lastPrinted.containsKey(msg) || ts - lastPrinted.get(msg) >= 10) {\n                    res[i] = 1;\n                    lastPrinted.put(msg, ts);\n                } else {\n                    res[i] = 0;\n                }\n            }\n        }\n        return res;\n    }",
      CPP: "#include <vector>\n#include <unordered_map>\n\nusing namespace std;\n\nvector<int> solve(vector<vector<int>> logs) {\n    unordered_map<int, int> lastPrinted;\n    vector<int> res;\n    for (auto& log : logs) {\n        if (log.size() == 2) {\n            int ts = log[0];\n            int msg = log[1];\n            if (lastPrinted.find(msg) == lastPrinted.end() || ts - lastPrinted[msg] >= 10) {\n                res.push_back(1);\n                lastPrinted[msg] = ts;\n            } else {\n                res.push_back(0);\n            }\n        }\n    }\n    return res;\n}",
      GO: "func solve(logs [][]int) []int {\n    lastPrinted := make(map[int]int)\n    var res []int\n    for _, log := range logs {\n        if len(log) == 2 {\n            ts := log[0]\n            msg := log[1]\n            if val, ok := lastPrinted[msg]; !ok || ts-val >= 10 {\n                res = append(res, 1)\n                lastPrinted[msg] = ts\n            } else {\n                res = append(res, 0)\n            }\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 100;2 200;11 100;11 200;12 200", expectedStdout: "1 1 1 0 1", isSample: true },
      { stdin: "1 10;1 20;1 30", expectedStdout: "1 1 1", isSample: true },
      { stdin: "", expectedStdout: "" },
      { stdin: "1 100", expectedStdout: "1" },
      { stdin: "1 100;2 100;10 100;11 100", expectedStdout: "1 0 0 1" },
      { stdin: "5 50;10 50;15 50", expectedStdout: "1 0 1" },
      { stdin: "1 1;5 1;11 1;15 1", expectedStdout: "1 0 1 0" },
      { stdin: "10 9;20 9;30 9", expectedStdout: "1 1 1" },
    ],
  }),

  p({
    ...base,
    slug: "stuttering-alien-signal",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Stuttering Alien Signal",
    patternTags: ["two-pointers","strings","simulation"],
    signatureId: "fn:string,string->bool",
    avgSolveSeconds: 600,
    promptMarkdown: "You are monitoring deep space communications. An allied ship is trying to send a critical `original` passcode string. However, due to atmospheric interference, some characters in the signal may get \"stuck\" and repeat themselves consecutively, resulting in the `received` string.\n\nFor example, if the original signal was `\"alpha\"`, it might be received as `\"aallpphhaa\"` because each letter got stuck. However, it will never re-order the characters.\n\nGiven the `original` signal and the `received` string, return `true` if it's possible that `received` is the valid stuttering transmission of `original`, and `false` otherwise.\n\n**Constraints**\n- `1 <= original.length <= 100`\n- `1 <= received.length <= 100`\n- Both strings consist of lowercase English letters.\n\n**Example 1**\n```\ninput:\nalpha\naallpphhaa\noutput:\ntrue\n```\n*Explanation: Every letter in the original signal got repeated due to interference.*\n\n**Example 2**\n```\ninput:\nbeta\nbeetaa\noutput:\ntrue\n```\n*Explanation: 'e' and 'a' got stuck and repeated.*\n\n**Example 3**\n```\ninput:\ngamma\ngamm\noutput:\nfalse\n```\n*Explanation: The 'a' at the end of the original signal is completely missing, so it cannot be a valid transmission.*\n\n**Follow-up**\nCan you solve this efficiently in O(N) time with O(1) space using two pointers?",
    editorialMarkdown: "## Stuttering Alien Signal\n\nThe problem requires validating if a received transmission matches an original signal, accounting for possible character repetition caused by atmospheric interference.\n\nThis can be elegantly solved using two pointers. One pointer iterates through the original string, and the other iterates through the received string. We compare the characters at both pointers:\n1. If they match, we advance both pointers.\n2. If they don't match, we check if the character in the received string is a stuttering duplicate of the previous character. If it is, we only advance the pointer in the received string.\n3. If neither condition is met, the transmission is invalid.\n\n**Trap**: A common pitfall is forgetting to check if the first pointer has successfully reached the end of the original string by the time we finish processing the received string. If it hasn't, the received string missed some necessary characters from the original.\n\n**Complexity:**\n- **Time:** O(M + N) where M and N are the lengths of the two strings, as each pointer moves forward at most the length of its respective string.\n- **Space:** O(1) since we only use two integer pointers.",
    referenceSolution: {
      JAVASCRIPT: "function solve(original, received) {\n    let i = 0;\n    let j = 0;\n    while (j < received.length) {\n        if (i < original.length && original[i] === received[j]) {\n            i++;\n            j++;\n        } else if (j > 0 && received[j] === received[j - 1]) {\n            j++;\n        } else {\n            return false;\n        }\n    }\n    return i === original.length;\n}",
      TYPESCRIPT: "function solve(original: string, received: string): boolean {\n    let i = 0;\n    let j = 0;\n    while (j < received.length) {\n        if (i < original.length && original[i] === received[j]) {\n            i++;\n            j++;\n        } else if (j > 0 && received[j] === received[j - 1]) {\n            j++;\n        } else {\n            return false;\n        }\n    }\n    return i === original.length;\n}",
      PYTHON: "def solve(original, received):\n    i = 0\n    j = 0\n    while j < len(received):\n        if i < len(original) and original[i] == received[j]:\n            i += 1\n            j += 1\n        elif j > 0 and received[j] == received[j-1]:\n            j += 1\n        else:\n            return False\n    return i == len(original)",
      JAVA: "    static boolean solve(String original, String received) {\n        int i = 0, j = 0;\n        while (j < received.length()) {\n            if (i < original.length() && original.charAt(i) == received.charAt(j)) {\n                i++;\n                j++;\n            } else if (j > 0 && received.charAt(j) == received.charAt(j - 1)) {\n                j++;\n            } else {\n                return false;\n            }\n        }\n        return i == original.length();\n    }",
      CPP: "#include <string>\n\nusing namespace std;\n\nbool solve(string original, string received) {\n    int i = 0;\n    int j = 0;\n    while (j < received.length()) {\n        if (i < original.length() && original[i] == received[j]) {\n            i++;\n            j++;\n        } else if (j > 0 && received[j] == received[j - 1]) {\n            j++;\n        } else {\n            return false;\n        }\n    }\n    return i == original.length();\n}",
      GO: "func solve(original string, received string) bool {\n    i := 0\n    j := 0\n    for j < len(received) {\n        if i < len(original) && original[i] == received[j] {\n            i++\n            j++\n        } else if j > 0 && received[j] == received[j-1] {\n            j++\n        } else {\n            return false\n        }\n    }\n    return i == len(original)\n}",
    },
    tests: [
      { stdin: "alpha\naallpphhaa", expectedStdout: "true", isSample: true },
      { stdin: "beta\nbeetaa", expectedStdout: "true", isSample: true },
      { stdin: "gamma\ngamm", expectedStdout: "false" },
      { stdin: "a\na", expectedStdout: "true" },
      { stdin: "a\naa", expectedStdout: "true" },
      { stdin: "a\nb", expectedStdout: "false" },
      { stdin: "ab\naaabbb", expectedStdout: "true" },
      { stdin: "abc\nab", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "maximal-acceleration-phase",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Consecutive Gale Streaks",
    patternTags: ["arrays","linear-scan","running-extremes"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing daily peak wind speeds recorded at an automated weather station. A meteorologist defines a \"gale streak\" as a sequence of consecutive time intervals where the recorded wind speed strictly increases.\n\nYou are given an integer array `speeds` representing the wind speeds over different time intervals. Your task is to determine the maximum number of consecutive intervals that form a gale streak. \n\nReturn the length of the longest strictly increasing contiguous segment of wind speeds.\n\n**Constraints**\n- `0 <= speeds.length <= 100`\n- `1 <= speeds[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 3 5 4 7\noutput:\n3\n```\n*Explanation: The longest continuous strictly increasing segment is [1, 3, 5], which has a length of 3.*\n\n**Example 2**\n```\ninput:\n2 2 2\noutput:\n1\n```\n*Explanation: The wind speed remains constant and never strictly increases, so the longest streak is just a single interval.*\n\n**Example 3**\n```\ninput:\n10 9 2 5 3 7 101 18\noutput:\n3\n```\n*Explanation: The longest continuous strictly increasing segment is [3, 7, 101], which has a length of 3.*\n\n**Follow-up**\nCan you do this in a single pass with O(1) auxiliary space?",
    editorialMarkdown: "## Maximal Acceleration Phase\n\nThe problem asks for the maximum number of consecutive time intervals where a spacecraft's speed was strictly increasing. This requires finding the longest strictly increasing contiguous subarray.\n\nWe can solve this efficiently with a single pass through the array. We maintain a counter for the current increasing streak and another variable for the maximum streak seen so far. If the current element is strictly greater than the previous element, we increment the current streak. Otherwise, we reset the current streak to 1, as a new segment begins. At each step, we update the maximum streak.\n\n**Trap**: A common trap is forgetting to initialize the streak counts to 1, or resetting the streak to 0 instead of 1 when the sequence stops increasing. Every single element is trivially a sequence of length 1.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the speed array, since we perform a single linear scan.\n- **Space:** O(1) as we only use a couple of variables to keep track of the streaks.",
    referenceSolution: {
      JAVASCRIPT: "function solve(speeds) {\n    if (speeds.length === 0) return 0;\n    let maxLen = 1;\n    let curLen = 1;\n    for (let i = 1; i < speeds.length; i++) {\n        if (speeds[i] > speeds[i - 1]) {\n            curLen++;\n            maxLen = Math.max(maxLen, curLen);\n        } else {\n            curLen = 1;\n        }\n    }\n    return maxLen;\n}",
      TYPESCRIPT: "function solve(speeds: number[]): number {\n    if (speeds.length === 0) return 0;\n    let maxLen = 1;\n    let curLen = 1;\n    for (let i = 1; i < speeds.length; i++) {\n        if (speeds[i] > speeds[i - 1]) {\n            curLen++;\n            maxLen = Math.max(maxLen, curLen);\n        } else {\n            curLen = 1;\n        }\n    }\n    return maxLen;\n}",
      PYTHON: "def solve(speeds):\n    if not speeds:\n        return 0\n    max_len = 1\n    cur_len = 1\n    for i in range(1, len(speeds)):\n        if speeds[i] > speeds[i-1]:\n            cur_len += 1\n            max_len = max(max_len, cur_len)\n        else:\n            cur_len = 1\n    return max_len",
      JAVA: "    static int solve(int[] speeds) {\n        if (speeds.length == 0) return 0;\n        int maxLen = 1;\n        int curLen = 1;\n        for (int i = 1; i < speeds.length; i++) {\n            if (speeds[i] > speeds[i - 1]) {\n                curLen++;\n                maxLen = Math.max(maxLen, curLen);\n            } else {\n                curLen = 1;\n            }\n        }\n        return maxLen;\n    }",
      CPP: "#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nint solve(vector<int> speeds) {\n    if (speeds.empty()) return 0;\n    int maxLen = 1;\n    int curLen = 1;\n    for (int i = 1; i < speeds.size(); i++) {\n        if (speeds[i] > speeds[i - 1]) {\n            curLen++;\n            maxLen = max(maxLen, curLen);\n        } else {\n            curLen = 1;\n        }\n    }\n    return maxLen;\n}",
      GO: "func solve(speeds []int) int {\n    if len(speeds) == 0 {\n        return 0\n    }\n    maxLen := 1\n    curLen := 1\n    for i := 1; i < len(speeds); i++ {\n        if speeds[i] > speeds[i-1] {\n            curLen++\n            if curLen > maxLen {\n                maxLen = curLen\n            }\n        } else {\n            curLen = 1\n        }\n    }\n    return maxLen\n}",
    },
    tests: [
      { stdin: "1 3 5 4 7", expectedStdout: "3", isSample: true },
      { stdin: "2 2 2", expectedStdout: "1", isSample: true },
      { stdin: "10 9 2 5 3 7 101 18", expectedStdout: "3" },
      { stdin: "", expectedStdout: "0" },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "1 2 3", expectedStdout: "3" },
      { stdin: "3 2 1", expectedStdout: "1" },
      { stdin: "1 2 3 4 5 6 7 8", expectedStdout: "8" },
    ],
  }),

  p({
    ...base,
    slug: "symmetric-cargo-distribution",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Symmetric Bead Necklace",
    patternTags: ["hash-map","greedy","palindrome"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are designing a beaded necklace. You want the beads to be arranged symmetrically, forming a perfect mirror image from the center outward. \n\nYou are given a string `s` where each character represents a bead of a specific color and shape. You can choose any number of beads from this collection and arrange them in any order. Your goal is to construct the longest possible symmetric sequence (a palindrome).\n\nReturn the maximum length of a symmetric necklace you can create using the given beads. The beads are case-sensitive, meaning `'a'` and `'A'` are considered completely different types of beads.\n\n**Constraints**\n- `1 <= s.length <= 2000`\n- `s` consists of lowercase and/or uppercase English letters.\n\n**Example 1**\n```\ninput:\nabccccdd\noutput:\n7\n```\n*Explanation: One of the longest symmetric necklaces you can string is \"dccaccd\", yielding a total length of 7 beads.*\n\n**Example 2**\n```\ninput:\na\noutput:\n1\n```\n*Explanation: The longest symmetric arrangement is just \"a\", with length 1.*\n\n**Example 3**\n```\ninput:\nbb\noutput:\n2\n```\n*Explanation: The two identical beads can be arranged symmetrically as \"bb\", giving a length of 2.*\n\n**Follow-up**\nCan you determine this maximum possible length by analyzing the frequencies of the beads, rather than trying to construct the sequence itself?",
    editorialMarkdown: "## Symmetric Cargo Distribution\n\nThe problem tasks us with finding the maximum number of cargo pods we can arrange to form a palindrome. A palindrome reads the same forwards and backwards, which means that every character in the sequence must have a matching pair, with the possible exception of a single central character.\n\nTo solve this, we can count the frequencies of each cargo pod type using a hash map or frequency array. For each pod type, if its count is even, all of them can be used in the symmetric arrangement. If the count is odd, we can use an even portion of them (count - 1), and leave one leftover. If there are any leftovers at all across all pod types, we can safely place exactly one of them at the absolute center of our cargo bay. \n\n**Trap**: It is tempting to manually try to build the string, but you do not need to. We only need the maximum length, which is determined purely by the frequency counts.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string, as we do a single pass to count characters and another pass over the (at most 52) unique characters.\n- **Space:** O(1) or O(U) where U is the unique number of characters, which is bounded by 52 (uppercase and lowercase English letters).",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    let counts = {};\n    for (let c of s) {\n        counts[c] = (counts[c] || 0) + 1;\n    }\n    let ans = 0;\n    let hasOdd = false;\n    for (let key in counts) {\n        let count = counts[key];\n        if (count % 2 === 0) {\n            ans += count;\n        } else {\n            ans += count - 1;\n            hasOdd = true;\n        }\n    }\n    return hasOdd ? ans + 1 : ans;\n}",
      TYPESCRIPT: "function solve(s: string): number {\n    let counts: { [key: string]: number } = {};\n    for (let c of s) {\n        counts[c] = (counts[c] || 0) + 1;\n    }\n    let ans = 0;\n    let hasOdd = false;\n    for (let key in counts) {\n        let count = counts[key];\n        if (count % 2 === 0) {\n            ans += count;\n        } else {\n            ans += count - 1;\n            hasOdd = true;\n        }\n    }\n    return hasOdd ? ans + 1 : ans;\n}",
      PYTHON: "def solve(s):\n    counts = {}\n    for c in s:\n        counts[c] = counts.get(c, 0) + 1\n    ans = 0\n    has_odd = False\n    for cnt in counts.values():\n        if cnt % 2 == 0:\n            ans += cnt\n        else:\n            ans += cnt - 1\n            has_odd = True\n    return ans + 1 if has_odd else ans",
      JAVA: "    static int solve(String s) {\n        java.util.Map<Character, Integer> counts = new java.util.HashMap<>();\n        for (char c : s.toCharArray()) {\n            counts.put(c, counts.getOrDefault(c, 0) + 1);\n        }\n        int ans = 0;\n        boolean hasOdd = false;\n        for (int count : counts.values()) {\n            if (count % 2 == 0) {\n                ans += count;\n            } else {\n                ans += count - 1;\n                hasOdd = true;\n            }\n        }\n        return hasOdd ? ans + 1 : ans;\n    }",
      CPP: "#include <string>\n#include <unordered_map>\n\nusing namespace std;\n\nint solve(string s) {\n    unordered_map<char, int> counts;\n    for (char c : s) {\n        counts[c]++;\n    }\n    int ans = 0;\n    bool hasOdd = false;\n    for (auto const& [key, val] : counts) {\n        if (val % 2 == 0) {\n            ans += val;\n        } else {\n            ans += val - 1;\n            hasOdd = true;\n        }\n    }\n    return hasOdd ? ans + 1 : ans;\n}",
      GO: "func solve(s string) int {\n    counts := make(map[rune]int)\n    for _, c := range s {\n        counts[c]++\n    }\n    ans := 0\n    hasOdd := false\n    for _, count := range counts {\n        if count%2 == 0 {\n            ans += count\n        } else {\n            ans += count - 1\n            hasOdd = true\n        }\n    }\n    if hasOdd {\n        return ans + 1\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "abccccdd", expectedStdout: "7", isSample: true },
      { stdin: "a", expectedStdout: "1", isSample: true },
      { stdin: "bb", expectedStdout: "2" },
      { stdin: "", expectedStdout: "0" },
      { stdin: "aabb", expectedStdout: "4" },
      { stdin: "abc", expectedStdout: "1" },
      { stdin: "AAAAAA", expectedStdout: "6" },
      { stdin: "Aa", expectedStdout: "1" },
    ],
  }),
];
