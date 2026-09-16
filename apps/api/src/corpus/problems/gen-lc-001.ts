import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-001` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_001_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "final-message-packet-type",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Final Message Packet Type",
    patternTags: ["array","greedy","one-pass"],
    signatureId: "fn:ints->bool",
    avgSolveSeconds: 300,
    promptMarkdown: "You are writing a parser for a proprietary network protocol. The data stream consists of a series of packets, which are encoded as an array of integers `0` and `1`.\n\nThere are two types of packets:\n- A **Type A** packet is represented by a single `0`.\n- A **Type B** packet is represented by two integers: either `1, 0` or `1, 1`.\n\nGiven an array `packets` that represents a valid sequence of packets, return `true` if the very last packet in the array is guaranteed to be a **Type A** packet, and `false` otherwise.\n\n**Constraints**\n- `1 <= packets.length <= 1000`\n- `packets[i]` is either `0` or `1`.\n- The array always represents a valid sequence of packets.\n- The last element of `packets` is always `0`.\n\n**Example 1**\n```\ninput: 1 0 0\noutput: true\n```\nThe sequence can only be parsed as `[1, 0]` and `[0]`. The last packet is a Type A packet.\n\n**Example 2**\n```\ninput: 1 1 1 0\noutput: false\n```\nThe sequence can only be parsed as `[1, 1]` and `[1, 0]`. The last packet is a Type B packet.\n\n**Example 3**\n```\ninput: 0\noutput: true\n```\nThe sequence is a single Type A packet.\n\n**Follow-up:** Can you determine the last packet type with only one pass through the array?",
    editorialMarkdown: "## Greedy Scanning\n\nSince we know the rules for the packets (a `0` is always a 1-unit packet, and a `1` is always the start of a 2-unit packet), we can deterministically scan the array from left to right. \n\nWe maintain an index `i` starting at 0. If `a[i]` is `1`, we know it's a 2-unit packet, so we skip the next element by incrementing `i` by 2. If `a[i]` is `0`, it's a 1-unit packet, so we increment `i` by 1. We continue this until `i` reaches or exceeds the last index of the array.\n\nIf our loop terminates with `i` exactly equal to `length - 1`, it means we landed on the last element as the start of a new packet, which must be a 1-unit packet since it's the last one. If `i` goes past `length - 1`, the last element was part of a 2-unit packet.\n\nTime complexity is O(N) where N is the length of the array. Space complexity is O(1).\nThe one trap most solvers hit is trying to look backwards from the end, which is more complicated because a sequence of `1`s can be paired up in different ways depending on where the sequence started. Scanning forward avoids this ambiguity completely.",
    referenceSolution: {
      JAVASCRIPT: "function solve(packets) {\n    let i = 0;\n    while (i < packets.length - 1) {\n        if (packets[i] === 1) {\n            i += 2;\n        } else {\n            i += 1;\n        }\n    }\n    return i === packets.length - 1;\n}",
      TYPESCRIPT: "function solve(packets: number[]): boolean {\n    let i = 0;\n    while (i < packets.length - 1) {\n        if (packets[i] === 1) {\n            i += 2;\n        } else {\n            i += 1;\n        }\n    }\n    return i === packets.length - 1;\n}",
      PYTHON: "def solve(packets):\n    i = 0\n    while i < len(packets) - 1:\n        if packets[i] == 1:\n            i += 2\n        else:\n            i += 1\n    return i == len(packets) - 1",
      JAVA: "    static boolean solve(int[] packets) {\n        int i = 0;\n        while (i < packets.length - 1) {\n            if (packets[i] == 1) {\n                i += 2;\n            } else {\n                i += 1;\n            }\n        }\n        return i == packets.length - 1;\n    }",
      CPP: "bool solve(vector<int> packets) {\n    int i = 0;\n    while (i < (int)packets.size() - 1) {\n        if (packets[i] == 1) {\n            i += 2;\n        } else {\n            i += 1;\n        }\n    }\n    return i == (int)packets.size() - 1;\n}",
      GO: "func solve(packets []int) bool {\n    i := 0\n    for i < len(packets) - 1 {\n        if packets[i] == 1 {\n            i += 2\n        } else {\n            i += 1\n        }\n    }\n    return i == len(packets) - 1\n}",
    },
    tests: [
      { stdin: "1 0 0", expectedStdout: "true", isSample: true },
      { stdin: "1 1 1 0", expectedStdout: "false", isSample: true },
      { stdin: "0", expectedStdout: "true" },
      { stdin: "1 0", expectedStdout: "false" },
      { stdin: "0 0 0 0", expectedStdout: "true" },
      { stdin: "1 1 1 1 1 0", expectedStdout: "false" },
      { stdin: "1 0 1 1 0", expectedStdout: "true" },
      { stdin: "0 1 0 1 1 0 0", expectedStdout: "true" },
    ],
  }),

  p({
    ...base,
    slug: "valid-reversible-barcode",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Valid Reversible Barcode",
    patternTags: ["math","integer-arithmetic"],
    signatureId: "fn:int->bool",
    avgSolveSeconds: 300,
    promptMarkdown: "A warehouse uses a simple optical scanner to read numerical barcodes on boxes. Because boxes can be placed backwards on the conveyor belt, the scanner sometimes reads the barcode in reverse. The system attempts to compensate by reversing the scanned digits again before looking it up in the database.\n\nA barcode is considered \"reversible-safe\" if reversing its digits (and dropping any leading zeroes, as it is processed as a standard integer), and then reversing it a second time, results in the exact same original integer.\n\nGiven an integer `barcode`, return `true` if it is reversible-safe, and `false` otherwise.\n\n**Constraints**\n- `0 <= barcode <= 10^7`\n\n**Example 1**\n```\ninput: 456\noutput: true\n```\nReversing 456 gives 654. Reversing 654 gives 456, which matches the original.\n\n**Example 2**\n```\ninput: 1200\noutput: false\n```\nReversing 1200 gives 21 (leading zeroes are dropped). Reversing 21 gives 12, which does not match 1200.\n\n**Example 3**\n```\ninput: 0\noutput: true\n```\nReversing 0 gives 0, and reversing it again gives 0.\n\n**Follow-up:** Can you solve this in O(1) time and space without converting the integer to a string?",
    editorialMarkdown: "## Mathematical Invariant\n\nThe operation of reversing a number drops any leading zeroes in the resulting number (e.g., reversing 120 gives 021, which becomes 21). When we reverse it a second time, the zeroes that were dropped are permanently lost, so the number will not match the original.\n\nThis means a number will match its double-reversal if and only if no zeroes are dropped during the first reversal. Zeroes are only dropped if the original number ends in a zero. The only exception is the number `0` itself, which remains `0` after any number of reversals.\n\nThus, we can solve this in O(1) time and O(1) space by simply checking if the number is `0` or if it does not end in `0` (using modulo 10).\n\nThe one trap most solvers hit is actually converting the number to a string, reversing it, converting back to integer, and doing it again. While this works, it requires O(log N) string allocations and time, missing the much simpler O(1) math check.",
    referenceSolution: {
      JAVASCRIPT: "function solve(barcode) {\n    return barcode === 0 || barcode % 10 !== 0;\n}",
      TYPESCRIPT: "function solve(barcode: number): boolean {\n    return barcode === 0 || barcode % 10 !== 0;\n}",
      PYTHON: "def solve(barcode):\n    return barcode == 0 or barcode % 10 != 0",
      JAVA: "    static boolean solve(int barcode) {\n        return barcode == 0 || barcode % 10 != 0;\n    }",
      CPP: "bool solve(int barcode) {\n    return barcode == 0 || barcode % 10 != 0;\n}",
      GO: "func solve(barcode int) bool {\n    return barcode == 0 || barcode % 10 != 0\n}",
    },
    tests: [
      { stdin: "456", expectedStdout: "true", isSample: true },
      { stdin: "1200", expectedStdout: "false", isSample: true },
      { stdin: "0", expectedStdout: "true", isSample: true },
      { stdin: "10", expectedStdout: "false" },
      { stdin: "101", expectedStdout: "true" },
      { stdin: "9999999", expectedStdout: "true" },
      { stdin: "123450", expectedStdout: "false" },
      { stdin: "1000000", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "loyalty-balance-after-purchase",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Loyalty Balance After Purchase",
    patternTags: ["math","integer-arithmetic"],
    signatureId: "fn:int->int",
    avgSolveSeconds: 300,
    promptMarkdown: "A coffee shop loyalty program gives every new customer a starting balance of exactly 100 points. When a customer makes a purchase, the cost in points is deducted from their balance. \n\nHowever, the shop's point register only processes multiples of 10. Every purchase amount is first rounded to the nearest multiple of 10. If the purchase amount is exactly in the middle of two multiples of 10 (i.e. ends in 5), it is rounded **up**. \n\nGiven the exact `purchase` amount, return the customer's loyalty point balance after the rounded deduction is applied.\n\n**Constraints**\n- `0 <= purchase <= 100`\n\n**Example 1**\n```\ninput: 12\noutput: 90\n```\n`12` rounds down to `10`. The remaining balance is `100 - 10 = 90`.\n\n**Example 2**\n```\ninput: 25\noutput: 70\n```\n`25` ends in 5, so it rounds up to `30`. The remaining balance is `100 - 30 = 70`.\n\n**Example 3**\n```\ninput: 0\noutput: 100\n```\n`0` is already a multiple of 10. Balance remains `100`.\n\n**Follow-up:** Can you solve this using only integer arithmetic without any built-in math rounding functions?",
    editorialMarkdown: "## Mathematics and Modulo\n\nThe task asks us to deduct a purchase amount from a starting balance of 100, but the purchase amount must first be rounded to the nearest multiple of 10. If it's exactly halfway between two multiples (i.e. ends in 5), it rounds up.\n\nWe can compute the remainder of the purchase amount when divided by 10 (`rem = purchase % 10`). \n- If `rem >= 5`, the amount is rounded up by adding `10 - rem` to the purchase amount.\n- If `rem < 5`, the amount is rounded down by subtracting `rem` from the purchase amount.\n\nAfter calculating the rounded purchase amount, we simply subtract it from 100 and return the result.\n\nTime complexity is O(1) and space complexity is O(1).\nThe one trap most solvers hit is rounding incorrectly for amounts ending in 5, or trying to use floating point math (like `Math.round`) which might handle 0.5 ties differently depending on the programming language (e.g., Python 3's `round` rounds to the nearest even number). Using integer arithmetic avoids these pitfalls.",
    referenceSolution: {
      JAVASCRIPT: "function solve(purchase) {\n    let rem = purchase % 10;\n    if (rem >= 5) {\n        purchase += 10 - rem;\n    } else {\n        purchase -= rem;\n    }\n    return 100 - purchase;\n}",
      TYPESCRIPT: "function solve(purchase: number): number {\n    let rem = purchase % 10;\n    if (rem >= 5) {\n        purchase += 10 - rem;\n    } else {\n        purchase -= rem;\n    }\n    return 100 - purchase;\n}",
      PYTHON: "def solve(purchase):\n    rem = purchase % 10\n    if rem >= 5:\n        purchase += 10 - rem\n    else:\n        purchase -= rem\n    return 100 - purchase",
      JAVA: "    static int solve(int purchase) {\n        int rem = purchase % 10;\n        if (rem >= 5) {\n            purchase += 10 - rem;\n        } else {\n            purchase -= rem;\n        }\n        return 100 - purchase;\n    }",
      CPP: "int solve(int purchase) {\n    int rem = purchase % 10;\n    if (rem >= 5) {\n        purchase += 10 - rem;\n    } else {\n        purchase -= rem;\n    }\n    return 100 - purchase;\n}",
      GO: "func solve(purchase int) int {\n    rem := purchase % 10\n    if rem >= 5 {\n        purchase += 10 - rem\n    } else {\n        purchase -= rem\n    }\n    return 100 - purchase\n}",
    },
    tests: [
      { stdin: "12", expectedStdout: "90", isSample: true },
      { stdin: "25", expectedStdout: "70", isSample: true },
      { stdin: "0", expectedStdout: "100", isSample: true },
      { stdin: "50", expectedStdout: "50" },
      { stdin: "89", expectedStdout: "10" },
      { stdin: "95", expectedStdout: "0" },
      { stdin: "100", expectedStdout: "0" },
      { stdin: "14", expectedStdout: "90" },
    ],
  }),

  p({
    ...base,
    slug: "frequent-collaborator-pairs",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Frequent Collaborator Pairs",
    patternTags: ["hash-map","counting","frequency-count"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing collaboration logs for a tech company. Each log entry records a meeting between an engineer and a designer.\n\nThe data is provided as a 2D array `logs`, where each element `logs[i] = [engineer_id, designer_id]` indicates that the engineer with `engineer_id` and the designer with `designer_id` worked together on a feature.\n\nYour goal is to find the number of unique engineer-designer pairs who have collaborated **at least three times**.\n\nGiven the `logs` matrix, return the integer count of such frequent collaborator pairs.\n\n**Constraints**\n- `1 <= logs.length <= 10^4`\n- `logs[i].length == 2`\n- `0 <= engineer_id, designer_id <= 10^5`\n\n**Example 1**\n```\ninput: 1 1;1 1;1 1;2 3;2 3;1 2\noutput: 1\n```\nThe pair `(1, 1)` collaborated 3 times. The pair `(2, 3)` collaborated 2 times. The pair `(1, 2)` collaborated 1 time. Thus, only 1 pair collaborated at least 3 times.\n\n**Example 2**\n```\ninput: 10 20;10 20;10 20;30 40;30 40;30 40;10 20\noutput: 2\n```\nThe pair `(10, 20)` collaborated 4 times, and `(30, 40)` collaborated 3 times. Both pairs meet the threshold.\n\n**Example 3**\n```\ninput: 1 2;2 1;1 2;2 1\noutput: 0\n```\nNote that `(1, 2)` where engineer is 1 and designer is 2 is different from `(2, 1)` where engineer is 2 and designer is 1. Both pairs only collaborated twice, so no pair meets the threshold.\n\n**Follow-up:** What is the space complexity of your algorithm, and how does it depend on the input?",
    editorialMarkdown: "## Hash Map with Composite Keys\n\nWe need to count how many pairs of `(engineer_id, designer_id)` appear 3 or more times in the logs. \n\nWe can iterate through each row of the matrix, taking the engineer and designer IDs. We can combine them into a single unique identifier (a composite key). In many languages, a string like `\"engineer_id,designer_id\"` works well. In statically typed languages, a tuple or a custom struct/pair can be used as the map key. We increment the count for this key in a hash map.\n\nAfter processing all logs, we iterate through the values in the hash map. For every count that is `3` or greater, we increment our final answer tally.\n\nTime complexity is O(N) where N is the number of rows in the matrix, as hash map insertions and lookups are O(1) on average. Space complexity is O(U) where U is the number of unique engineer-designer pairs, bounded by N.\nThe one trap most solvers hit is not correctly uniquely identifying the pairs (e.g. adding the IDs together instead of concatenating them, which means `1 + 22` is treated the same as `12 + 11`).",
    referenceSolution: {
      JAVASCRIPT: "function solve(logs) {\n    let counts = new Map();\n    for (let row of logs) {\n        if (row.length >= 2) {\n            let key = row[0] + \",\" + row[1];\n            counts.set(key, (counts.get(key) || 0) + 1);\n        }\n    }\n    let ans = 0;\n    for (let count of counts.values()) {\n        if (count >= 3) ans++;\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(logs: number[][]): number {\n    let counts = new Map<string, number>();\n    for (let row of logs) {\n        if (row.length >= 2) {\n            let key = row[0] + \",\" + row[1];\n            counts.set(key, (counts.get(key) || 0) + 1);\n        }\n    }\n    let ans = 0;\n    for (let count of counts.values()) {\n        if (count >= 3) ans++;\n    }\n    return ans;\n}",
      PYTHON: "def solve(logs):\n    counts = {}\n    for row in logs:\n        if len(row) >= 2:\n            key = (row[0], row[1])\n            counts[key] = counts.get(key, 0) + 1\n    ans = 0\n    for v in counts.values():\n        if v >= 3:\n            ans += 1\n    return ans",
      JAVA: "    static int solve(int[][] logs) {\n        java.util.Map<Long, Integer> counts = new java.util.HashMap<>();\n        for (int[] row : logs) {\n            if (row.length >= 2) {\n                long key = ((long)row[0] << 32) | (row[1] & 0xFFFFFFFFL);\n                counts.put(key, counts.getOrDefault(key, 0) + 1);\n            }\n        }\n        int ans = 0;\n        for (int count : counts.values()) {\n            if (count >= 3) ans++;\n        }\n        return ans;\n    }",
      CPP: "int solve(vector<vector<int>> logs) {\n    unordered_map<long long, int> counts;\n    for (auto& row : logs) {\n        if (row.size() >= 2) {\n            long long key = ((long long)row[0] << 32) | (unsigned int)row[1];\n            counts[key]++;\n        }\n    }\n    int ans = 0;\n    for (auto& kv : counts) {\n        if (kv.second >= 3) ans++;\n    }\n    return ans;\n}",
      GO: "func solve(logs [][]int) int {\n    counts := make(map[[2]int]int)\n    for _, row := range logs {\n        if len(row) >= 2 {\n            key := [2]int{row[0], row[1]}\n            counts[key]++\n        }\n    }\n    ans := 0\n    for _, count := range counts {\n        if count >= 3 {\n            ans++\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "1 1;1 1;1 1;2 3;2 3;1 2", expectedStdout: "1", isSample: true },
      { stdin: "10 20;10 20;10 20;30 40;30 40;30 40;10 20", expectedStdout: "2", isSample: true },
      { stdin: "1 2;2 1;1 2;2 1", expectedStdout: "0", isSample: true },
      { stdin: "5 5;5 5", expectedStdout: "0" },
      { stdin: "9 9;9 9;9 9", expectedStdout: "1" },
      { stdin: "1 2;1 3;1 4;1 5;1 6", expectedStdout: "0" },
      { stdin: "1 1;1 1;1 1;2 2;2 2;2 2;3 3;3 3;3 3", expectedStdout: "3" },
      { stdin: "12 34;12 34;56 78;12 34;56 78", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "undisturbed-gaming-sessions",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "INTERVALS",
    title: "Undisturbed Gaming Sessions",
    patternTags: ["intervals","array","brute-force"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 500,
    promptMarkdown: "You are building an analytics dashboard for a gaming console. The system records events in a matrix `events`, where each row is structured as `[start_time, end_time, event_type]`. \n\n- `event_type == 0` represents a **gaming session**.\n- `event_type == 1` represents a **system alert** (e.g., low battery, notification).\n\nA gaming session is considered \"undisturbed\" if there are absolutely no system alerts during its entire duration. If a system alert overlaps with a gaming session at any time (including exactly at the start or end time), the session is disturbed.\n\nReturn the total number of undisturbed gaming sessions.\n\n**Constraints**\n- `1 <= events.length <= 1000`\n- `events[i].length == 3`\n- `0 <= start_time <= end_time <= 10^5`\n- `event_type` is either `0` or `1`.\n\n**Example 1**\n```\ninput: 1 10 0; 5 6 1; 15 20 0\noutput: 1\n```\nThe first session `[1, 10]` overlaps with the alert `[5, 6]`. The second session `[15, 20]` has no overlapping alerts. So there is 1 undisturbed session.\n\n**Example 2**\n```\ninput: 10 20 0; 20 30 1\noutput: 0\n```\nThe session `[10, 20]` and the alert `[20, 30]` overlap at exactly time 20. Thus, there are 0 undisturbed sessions.\n\n**Example 3**\n```\ninput: 5 10 1; 15 20 1\noutput: 0\n```\nThere are no gaming sessions in the logs, so there are 0 undisturbed sessions.\n\n**Follow-up:** Can you solve this efficiently if there are tens of thousands of events?",
    editorialMarkdown: "## Comparing Intervals\n\nWe are given a mixed list of events (gaming sessions and system alerts) and need to find the number of gaming sessions that do not overlap with any system alerts.\n\nFirst, we separate the input matrix into two lists: one for sessions and one for alerts. \n\nThen, for each gaming session `(s_start, s_end)`, we check if it overlaps with any alert `(a_start, a_end)`. An overlap occurs if the alert happens at any point during the session. We can define this logically: two intervals `[A, B]` and `[C, D]` do **not** overlap if one ends before the other begins (`B < C` or `A > D`). Therefore, they **do** overlap if it is *not* true that they don't overlap: `!(B < C || A > D)`. \n\nIf a session overlaps with any alert, we skip it. If we check all alerts and find no overlap, we increment our count of undisturbed sessions.\n\nSince the constraints are small, iterating over all alerts for every session runs well within the time limit. Time complexity is O(S * A) where S is the number of sessions and A is the number of alerts. Space complexity is O(N) to store the separated lists, where N is the total number of events.\nThe one trap most solvers hit is incorrectly writing the interval overlap logic, often missing the edge cases where an alert starts exactly when a session ends or vice versa.",
    referenceSolution: {
      JAVASCRIPT: "function solve(events) {\n    let sessions = [];\n    let alerts = [];\n    for (let row of events) {\n        if (row.length === 3) {\n            if (row[2] === 0) sessions.push([row[0], row[1]]);\n            else alerts.push([row[0], row[1]]);\n        }\n    }\n    let ans = 0;\n    for (let s of sessions) {\n        let ok = true;\n        for (let al of alerts) {\n            if (!(al[1] < s[0] || al[0] > s[1])) {\n                ok = false;\n                break;\n            }\n        }\n        if (ok) ans++;\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(events: number[][]): number {\n    let sessions: [number, number][] = [];\n    let alerts: [number, number][] = [];\n    for (let row of events) {\n        if (row.length === 3) {\n            if (row[2] === 0) sessions.push([row[0], row[1]]);\n            else alerts.push([row[0], row[1]]);\n        }\n    }\n    let ans = 0;\n    for (let s of sessions) {\n        let ok = true;\n        for (let al of alerts) {\n            if (!(al[1] < s[0] || al[0] > s[1])) {\n                ok = false;\n                break;\n            }\n        }\n        if (ok) ans++;\n    }\n    return ans;\n}",
      PYTHON: "def solve(events):\n    sessions = []\n    alerts = []\n    for row in events:\n        if len(row) == 3:\n            if row[2] == 0:\n                sessions.append((row[0], row[1]))\n            else:\n                alerts.append((row[0], row[1]))\n    ans = 0\n    for s_start, s_end in sessions:\n        ok = True\n        for a_start, a_end in alerts:\n            if not (a_end < s_start or a_start > s_end):\n                ok = False\n                break\n        if ok:\n            ans += 1\n    return ans",
      JAVA: "    static int solve(int[][] events) {\n        java.util.List<int[]> sessions = new java.util.ArrayList<>();\n        java.util.List<int[]> alerts = new java.util.ArrayList<>();\n        for (int[] row : events) {\n            if (row.length == 3) {\n                if (row[2] == 0) sessions.add(new int[]{row[0], row[1]});\n                else alerts.add(new int[]{row[0], row[1]});\n            }\n        }\n        int ans = 0;\n        for (int[] s : sessions) {\n            boolean ok = true;\n            for (int[] al : alerts) {\n                if (!(al[1] < s[0] || al[0] > s[1])) {\n                    ok = false;\n                    break;\n                }\n            }\n            if (ok) ans++;\n        }\n        return ans;\n    }",
      CPP: "int solve(vector<vector<int>> events) {\n    vector<pair<int, int>> sessions;\n    vector<pair<int, int>> alerts;\n    for (auto& row : events) {\n        if (row.size() == 3) {\n            if (row[2] == 0) sessions.push_back({row[0], row[1]});\n            else alerts.push_back({row[0], row[1]});\n        }\n    }\n    int ans = 0;\n    for (auto& s : sessions) {\n        bool ok = true;\n        for (auto& al : alerts) {\n            if (!(al.second < s.first || al.first > s.second)) {\n                ok = false;\n                break;\n            }\n        }\n        if (ok) ans++;\n    }\n    return ans;\n}",
      GO: "func solve(events [][]int) int {\n    var sessions [][2]int\n    var alerts [][2]int\n    for _, row := range events {\n        if len(row) == 3 {\n            if row[2] == 0 {\n                sessions = append(sessions, [2]int{row[0], row[1]})\n            } else {\n                alerts = append(alerts, [2]int{row[0], row[1]})\n            }\n        }\n    }\n    ans := 0\n    for _, s := range sessions {\n        ok := true\n        for _, al := range alerts {\n            if !(al[1] < s[0] || al[0] > s[1]) {\n                ok = false\n                break\n            }\n        }\n        if ok {\n            ans++\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "1 10 0;5 6 1;15 20 0", expectedStdout: "1", isSample: true },
      { stdin: "10 20 0;20 30 1", expectedStdout: "0", isSample: true },
      { stdin: "5 10 1;15 20 1", expectedStdout: "0", isSample: true },
      { stdin: "5 10 0;11 15 1", expectedStdout: "1" },
      { stdin: "1 5 0;6 10 0", expectedStdout: "2" },
      { stdin: "0 100 0;50 50 1", expectedStdout: "0" },
      { stdin: "0 50 1;51 100 0", expectedStdout: "1" },
      { stdin: "10 20 0;5 10 1", expectedStdout: "0" },
    ],
  }),
];
