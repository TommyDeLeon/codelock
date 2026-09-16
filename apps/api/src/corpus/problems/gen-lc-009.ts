import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-009` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_009_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "vip-customer-rewards",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "VIP Customer Rewards",
    patternTags: ["hash-map","aggregation","counting","matrix"],
    signatureId: "fn:matrix->int",
    avgSolveSeconds: 400,
    promptMarkdown: "A store wants to identify its VIP customers based on their purchase history. You are given a 2D integer array `transactions` where each element is `[customerId, amount]`. A customer's total spending is the sum of the `amount` across all their transactions.\n\nReturn the number of unique customers whose total spending is strictly greater than `10000`.\n\n**Constraints**\n- `0 <= transactions.length <= 40`\n- `transactions[i].length == 2`\n- `1 <= customerId <= 100`\n- `-10000 <= amount <= 20000`\n\n**Example 1**\n```\ninput:\n1 5000;1 6000;2 2000\noutput: 1\n```\nExplanation: Customer 1 spent 11000 (> 10000). Customer 2 spent 2000. Only 1 customer is a VIP.\n\n**Example 2**\n```\ninput:\n3 10001;4 10000;3 -500\noutput: 0\n```\nExplanation: Customer 3's total is 9501. Customer 4's total is 10000. Neither is strictly greater than 10000.\n\n**Example 3**\n```\ninput:\n\noutput: 0\n```\nExplanation: No transactions, so 0 VIP customers.\n\n**Follow-up:** Can you optimize your space complexity if you know that the customer IDs are tightly packed between 1 and a small upper bound?",
    editorialMarkdown: "## Hash Map Aggregation\n\nWe can solve this by iterating through the transactions and using a hash map to accumulate the total amount spent by each customer. Once we have the sum for every customer, we iterate through the hash map's values and count how many are strictly greater than 10000.\n\nTime complexity is O(N) where N is the number of transactions, and space complexity is O(U) where U is the number of unique customers.\n\nThe one trap most solvers hit is failing to account for negative transaction amounts (refunds) when summing the totals.",
    referenceSolution: {
      JAVASCRIPT: "function solve(transactions) {\n    let map = new Map();\n    for (let t of transactions) {\n        if (!t || t.length < 2) continue;\n        let c = t[0], a = t[1];\n        map.set(c, (map.get(c) || 0) + a);\n    }\n    let count = 0;\n    for (let val of map.values()) {\n        if (val > 10000) count++;\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(transactions: number[][]): number {\n    let map = new Map<number, number>();\n    for (let t of transactions) {\n        if (!t || t.length < 2) continue;\n        let c = t[0], a = t[1];\n        map.set(c, (map.get(c) || 0) + a);\n    }\n    let count = 0;\n    for (let val of map.values()) {\n        if (val > 10000) count++;\n    }\n    return count;\n}",
      PYTHON: "def solve(transactions):\n    totals = {}\n    for t in transactions:\n        if not t or len(t) < 2: continue\n        c, a = t[0], t[1]\n        totals[c] = totals.get(c, 0) + a\n    return sum(1 for v in totals.values() if v > 10000)",
      JAVA: "    static int solve(int[][] transactions) {\n        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();\n        for (int[] t : transactions) {\n            if (t == null || t.length < 2) continue;\n            map.put(t[0], map.getOrDefault(t[0], 0) + t[1]);\n        }\n        int count = 0;\n        for (int val : map.values()) {\n            if (val > 10000) count++;\n        }\n        return count;\n    }",
      CPP: "int solve(vector<vector<int>> transactions) {\n    unordered_map<int, int> totals;\n    for (auto& t : transactions) {\n        if (t.size() < 2) continue;\n        totals[t[0]] += t[1];\n    }\n    int count = 0;\n    for (auto& p : totals) {\n        if (p.second > 10000) count++;\n    }\n    return count;\n}",
      GO: "func solve(transactions [][]int) int {\n    totals := make(map[int]int)\n    for _, t := range transactions {\n        if len(t) < 2 { continue }\n        totals[t[0]] += t[1]\n    }\n    count := 0\n    for _, v := range totals {\n        if v > 10000 { count++ }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "1 5000;1 6000;2 2000", expectedStdout: "1", isSample: true },
      { stdin: "3 10001;4 10000;3 -500", expectedStdout: "0", isSample: true },
      { stdin: "", expectedStdout: "0" },
      { stdin: "1 10001", expectedStdout: "1" },
      { stdin: "1 5000;2 5000;3 10001", expectedStdout: "1" },
      { stdin: "5 10000;5 1", expectedStdout: "1" },
      { stdin: "1 15000;1 -6000", expectedStdout: "0" },
      { stdin: "100 20000;100 -5000;99 10001", expectedStdout: "2" },
    ],
  }),

  p({
    ...base,
    slug: "quinary-number-encoding",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "MATH_GEOMETRY",
    title: "Quinary Number Encoding",
    patternTags: ["math","base-conversion","string","integer-arithmetic"],
    signatureId: "fn:int->string",
    avgSolveSeconds: 500,
    promptMarkdown: "An alien civilization uses a number system with only 5 digits. You need to translate our base-10 numbers into their base-5 representation.\n\nGiven an integer `num`, return its base-5 string representation.\n\n**Constraints**\n- `-10^7 <= num <= 10^7`\n\n**Example 1**\n```\ninput:\n12\noutput: 22\n```\nExplanation: 12 in base 10 is 2 * 5^1 + 2 * 5^0 = 22 in base 5.\n\n**Example 2**\n```\ninput:\n-7\noutput: -12\n```\nExplanation: -7 in base 10 is -(1 * 5^1 + 2 * 5^0) = -12 in base 5.\n\n**Example 3**\n```\ninput:\n0\noutput: 0\n```\nExplanation: 0 is simply \"0\".\n\n**Follow-up:** Can you implement this iteratively without relying on built-in library functions for base conversion?",
    editorialMarkdown: "## Modulo Arithmetic and Base Conversion\n\nWe can find the base-5 representation by repeatedly taking the modulo 5 of the absolute value of the number to extract the least significant digit, and then performing integer division by 5 to shift the number. The extracted digits are accumulated and then reversed to form the correct order. \n\nTime complexity is O(log_5(N)) which is bounded by a small constant given the constraints, and space complexity is O(log_5(N)) for storing the result string.\n\nThe one trap most solvers hit is failing to correctly handle the negative sign or returning an empty string instead of \"0\" for the input zero.",
    referenceSolution: {
      JAVASCRIPT: "function solve(num) {\n    if (num === 0) return \"0\";\n    let isNeg = num < 0;\n    let n = Math.abs(num);\n    let res = [];\n    while (n > 0) {\n        res.push(n % 5);\n        n = Math.floor(n / 5);\n    }\n    let ans = res.reverse().join('');\n    return isNeg ? \"-\" + ans : ans;\n}",
      TYPESCRIPT: "function solve(num: number): string {\n    if (num === 0) return \"0\";\n    let isNeg = num < 0;\n    let n = Math.abs(num);\n    let res: number[] = [];\n    while (n > 0) {\n        res.push(n % 5);\n        n = Math.floor(n / 5);\n    }\n    let ans = res.reverse().join('');\n    return isNeg ? \"-\" + ans : ans;\n}",
      PYTHON: "def solve(num):\n    if num == 0: return \"0\"\n    n = abs(num)\n    res = []\n    while n > 0:\n        res.append(str(n % 5))\n        n //= 5\n    ans = \"\".join(res[::-1])\n    return \"-\" + ans if num < 0 else ans",
      JAVA: "    static String solve(int num) {\n        if (num == 0) return \"0\";\n        boolean isNeg = num < 0;\n        long n = Math.abs((long)num);\n        StringBuilder sb = new StringBuilder();\n        while (n > 0) {\n            sb.append(n % 5);\n            n /= 5;\n        }\n        String ans = sb.reverse().toString();\n        return isNeg ? \"-\" + ans : ans;\n    }",
      CPP: "string solve(int num) {\n    if (num == 0) return \"0\";\n    bool isNeg = num < 0;\n    long long n = abs((long long)num);\n    string res = \"\";\n    while (n > 0) {\n        res += to_string(n % 5);\n        n /= 5;\n    }\n    reverse(res.begin(), res.end());\n    return isNeg ? \"-\" + res : res;\n}",
      GO: "func solve(num int) string {\n    if num == 0 { return \"0\" }\n    isNeg := num < 0\n    n := num\n    if isNeg { n = -n }\n    res := \"\"\n    for n > 0 {\n        res = strconv.Itoa(n%5) + res\n        n /= 5\n    }\n    if isNeg { return \"-\" + res }\n    return res\n}",
    },
    tests: [
      { stdin: "12", expectedStdout: "22", isSample: true },
      { stdin: "-7", expectedStdout: "-12", isSample: true },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "100", expectedStdout: "400" },
      { stdin: "-100", expectedStdout: "-400" },
      { stdin: "5", expectedStdout: "10" },
      { stdin: "-5", expectedStdout: "-10" },
      { stdin: "1", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "potion-mixing-scores",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "STACK",
    title: "Potion Mixing Scores",
    patternTags: ["stack","simulation","array","string"],
    signatureId: "fn:strings->int",
    avgSolveSeconds: 500,
    promptMarkdown: "You are brewing potions and keeping track of the potency scores of the ingredients you add. You are given an array of strings `operations`, where each operation is one of the following:\n\n- An integer: Adds a new ingredient with that potency score.\n- `\"DOUBLE\"`: Adds a new ingredient with a score exactly double the previous ingredient's score.\n- `\"MIX\"`: Adds a new ingredient with a score equal to the sum of the previous two ingredients' scores.\n- `\"BURN\"`: Removes the last added ingredient's score from the record, as the ingredient was ruined.\n\nReturn the sum of all valid potency scores on the record after applying all operations.\n\n**Constraints**\n- `1 <= operations.length <= 40`\n- Each operation is an integer between `-100` and `100`, or `\"DOUBLE\"`, `\"MIX\"`, or `\"BURN\"`.\n- It is guaranteed that there will always be previous scores available when `\"DOUBLE\"`, `\"MIX\"`, or `\"BURN\"` is called.\n\n**Example 1**\n```\ninput:\n5 2 DOUBLE BURN MIX\noutput: 14\n```\nExplanation:\n- \"5\": Record is [5], sum is 5.\n- \"2\": Record is [5, 2], sum is 7.\n- \"DOUBLE\": double of 2 is 4. Record is [5, 2, 4], sum is 11.\n- \"BURN\": Removes 4. Record is [5, 2], sum is 7.\n- \"MIX\": 5 + 2 = 7. Record is [5, 2, 7], sum is 14.\n\n**Example 2**\n```\ninput:\n10 BURN\noutput: 0\n```\nExplanation:\n- \"10\": Record is [10], sum is 10.\n- \"BURN\": Removes 10. Record is [], sum is 0.\n\n**Example 3**\n```\ninput:\n1\noutput: 1\n```\nExplanation:\n- \"1\": Record is [1], sum is 1.\n\n**Follow-up:** Can you optimize this to compute the running sum in O(1) auxiliary space without keeping track of the entire history (if BURN operations were not allowed)?",
    editorialMarkdown: "## Stack-Based Simulation\n\nWe can simulate this process using a stack to maintain the valid scores. When we encounter an integer, we push it onto the stack. For `\"DOUBLE\"`, we peek at the top, double it, and push. For `\"MIX\"`, we read the top two elements, sum them, and push. For `\"BURN\"`, we simply pop the top element. Finally, we sum all elements in the stack.\n\nTime complexity is O(N) where N is the number of operations, and space complexity is O(N) to store the scores in the stack.\n\nThe one trap most solvers hit is incorrectly parsing the integer strings into proper numeric types before performing additions, leading to unexpected string concatenation bugs.",
    referenceSolution: {
      JAVASCRIPT: "function solve(ops) {\n    let stack = [];\n    for (let op of ops) {\n        if (op === \"DOUBLE\") {\n            stack.push(stack[stack.length - 1] * 2);\n        } else if (op === \"MIX\") {\n            stack.push(stack[stack.length - 1] + stack[stack.length - 2]);\n        } else if (op === \"BURN\") {\n            stack.pop();\n        } else {\n            stack.push(parseInt(op, 10));\n        }\n    }\n    return stack.reduce((a, b) => a + b, 0);\n}",
      TYPESCRIPT: "function solve(ops: string[]): number {\n    let stack: number[] = [];\n    for (let op of ops) {\n        if (op === \"DOUBLE\") {\n            stack.push(stack[stack.length - 1] * 2);\n        } else if (op === \"MIX\") {\n            stack.push(stack[stack.length - 1] + stack[stack.length - 2]);\n        } else if (op === \"BURN\") {\n            stack.pop();\n        } else {\n            stack.push(parseInt(op, 10));\n        }\n    }\n    return stack.reduce((a, b) => a + b, 0);\n}",
      PYTHON: "def solve(ops):\n    stack = []\n    for op in ops:\n        if op == \"DOUBLE\":\n            stack.append(stack[-1] * 2)\n        elif op == \"MIX\":\n            stack.append(stack[-1] + stack[-2])\n        elif op == \"BURN\":\n            stack.pop()\n        else:\n            stack.append(int(op))\n    return sum(stack)",
      JAVA: "    static int solve(String[] ops) {\n        java.util.List<Integer> stack = new java.util.ArrayList<>();\n        for (String op : ops) {\n            if (op.equals(\"DOUBLE\")) {\n                stack.add(stack.get(stack.size() - 1) * 2);\n            } else if (op.equals(\"MIX\")) {\n                stack.add(stack.get(stack.size() - 1) + stack.get(stack.size() - 2));\n            } else if (op.equals(\"BURN\")) {\n                stack.remove(stack.size() - 1);\n            } else {\n                stack.add(Integer.parseInt(op));\n            }\n        }\n        int sum = 0;\n        for (int v : stack) sum += v;\n        return sum;\n    }",
      CPP: "int solve(vector<string> ops) {\n    vector<int> stack;\n    for (string& op : ops) {\n        if (op == \"DOUBLE\") {\n            stack.push_back(stack.back() * 2);\n        } else if (op == \"MIX\") {\n            stack.push_back(stack.back() + stack[stack.size() - 2]);\n        } else if (op == \"BURN\") {\n            stack.pop_back();\n        } else {\n            stack.push_back(stoi(op));\n        }\n    }\n    int sum = 0;\n    for (int v : stack) sum += v;\n    return sum;\n}",
      GO: "func solve(ops []string) int {\n    stack := []int{}\n    for _, op := range ops {\n        if op == \"DOUBLE\" {\n            stack = append(stack, stack[len(stack)-1]*2)\n        } else if op == \"MIX\" {\n            n := len(stack)\n            stack = append(stack, stack[n-1]+stack[n-2])\n        } else if op == \"BURN\" {\n            stack = stack[:len(stack)-1]\n        } else {\n            val, _ := strconv.Atoi(op)\n            stack = append(stack, val)\n        }\n    }\n    sum := 0\n    for _, v := range stack { sum += v }\n    return sum\n}",
    },
    tests: [
      { stdin: "5 2 DOUBLE BURN MIX", expectedStdout: "14", isSample: true },
      { stdin: "10 BURN", expectedStdout: "0", isSample: true },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "5 -2 4 BURN DOUBLE 9 MIX", expectedStdout: "13" },
      { stdin: "1 DOUBLE DOUBLE DOUBLE", expectedStdout: "15" },
      { stdin: "3 4 MIX MIX", expectedStdout: "25" },
      { stdin: "10 BURN 20 BURN 30", expectedStdout: "30" },
      { stdin: "-5 -1 MIX DOUBLE", expectedStdout: "-24" },
    ],
  }),

  p({
    ...base,
    slug: "monster-squad-tier",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Monster Squad Tier",
    patternTags: ["hash-map","counting","frequency","array"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are assembling a squad of 5 monsters, where each monster has a specific power level. The synergy of your squad depends on how many monsters share the exact same power level.\n\nGiven an integer array `powers` of length 5, return an integer representing the squad's synergy tier:\n- `3` if there are 3 or more monsters with the same power level (\"Squad\").\n- `2` if there are exactly 2 monsters with the same power level (and no group of 3 or more) (\"Duo\").\n- `1` if all 5 monsters have different power levels (\"Solo\").\n\n**Constraints**\n- `powers.length == 5`\n- `1 <= powers[i] <= 13`\n\n**Example 1**\n```\ninput:\n4 4 4 2 8\noutput: 3\n```\nExplanation: There are three monsters with power level 4, so it qualifies as tier 3.\n\n**Example 2**\n```\ninput:\n1 9 10 9 2\noutput: 2\n```\nExplanation: There are two monsters with power level 9, so it qualifies as tier 2.\n\n**Example 3**\n```\ninput:\n1 2 3 4 5\noutput: 1\n```\nExplanation: All monsters have different power levels.\n\n**Follow-up:** Can you calculate the frequency array in exactly a single pass and early return if you find a count >= 3?",
    editorialMarkdown: "## Frequency Counting using Hash Maps\n\nWe can determine the synergy tier by counting the frequencies of each power level in the array. Using a hash map or an array of size 14, we count occurrences. We then find the maximum frequency among all power levels. If the max frequency is >= 3, we return 3. If it is 2, we return 2. Otherwise, we return 1.\n\nTime complexity is O(1) because the input size is always 5, and space complexity is O(1) for the small frequency map.\n\nThe one trap most solvers hit is returning 3 when there are two pairs (e.g., `[2, 2, 4, 4, 5]`); we must ensure we are finding the *maximum* frequency of a single power level, not the total number of duplicates or pairs.",
    referenceSolution: {
      JAVASCRIPT: "function solve(powers) {\n    let counts = {};\n    for (let p of powers) {\n        counts[p] = (counts[p] || 0) + 1;\n    }\n    let maxFreq = 0;\n    for (let p in counts) {\n        if (counts[p] > maxFreq) maxFreq = counts[p];\n    }\n    if (maxFreq >= 3) return 3;\n    if (maxFreq === 2) return 2;\n    return 1;\n}",
      TYPESCRIPT: "function solve(powers: number[]): number {\n    let counts: {[key: number]: number} = {};\n    for (let p of powers) {\n        counts[p] = (counts[p] || 0) + 1;\n    }\n    let maxFreq = 0;\n    for (let p in counts) {\n        if (counts[p] > maxFreq) maxFreq = counts[p];\n    }\n    if (maxFreq >= 3) return 3;\n    if (maxFreq === 2) return 2;\n    return 1;\n}",
      PYTHON: "def solve(powers):\n    counts = {}\n    for p in powers:\n        counts[p] = counts.get(p, 0) + 1\n    max_freq = max(counts.values()) if counts else 0\n    if max_freq >= 3:\n        return 3\n    elif max_freq == 2:\n        return 2\n    else:\n        return 1",
      JAVA: "    static int solve(int[] powers) {\n        java.util.Map<Integer, Integer> counts = new java.util.HashMap<>();\n        for (int p : powers) {\n            counts.put(p, counts.getOrDefault(p, 0) + 1);\n        }\n        int maxFreq = 0;\n        for (int f : counts.values()) {\n            if (f > maxFreq) maxFreq = f;\n        }\n        if (maxFreq >= 3) return 3;\n        if (maxFreq == 2) return 2;\n        return 1;\n    }",
      CPP: "int solve(vector<int> powers) {\n    unordered_map<int, int> counts;\n    for (int p : powers) {\n        counts[p]++;\n    }\n    int maxFreq = 0;\n    for (auto& pair : counts) {\n        if (pair.second > maxFreq) maxFreq = pair.second;\n    }\n    if (maxFreq >= 3) return 3;\n    if (maxFreq == 2) return 2;\n    return 1;\n}",
      GO: "func solve(powers []int) int {\n    counts := make(map[int]int)\n    for _, p := range powers {\n        counts[p]++\n    }\n    maxFreq := 0\n    for _, v := range counts {\n        if v > maxFreq {\n            maxFreq = v\n        }\n    }\n    if maxFreq >= 3 {\n        return 3\n    } else if maxFreq == 2 {\n        return 2\n    }\n    return 1\n}",
    },
    tests: [
      { stdin: "4 4 4 2 8", expectedStdout: "3", isSample: true },
      { stdin: "1 9 10 9 2", expectedStdout: "2", isSample: true },
      { stdin: "1 2 3 4 5", expectedStdout: "1" },
      { stdin: "10 10 10 10 10", expectedStdout: "3" },
      { stdin: "2 2 4 4 5", expectedStdout: "2" },
      { stdin: "13 13 1 13 13", expectedStdout: "3" },
      { stdin: "7 8 7 8 9", expectedStdout: "2" },
      { stdin: "5 4 3 2 1", expectedStdout: "1" },
    ],
  }),
];
