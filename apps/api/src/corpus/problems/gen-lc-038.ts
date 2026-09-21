import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-038` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_038_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "pressure-valve-calibration",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Pressure Valve Calibration",
    patternTags: ["array","arrays","simulation","state-transition"],
    signatureId: "fn:ints,int->ints",
    avgSolveSeconds: 400,
    promptMarkdown: "You are calibrating a digital pressure valve that starts at a given `base` value. You receive an array of `instructions` representing actions taken on the valve, where:\n- `1` means increment the pressure by 1.\n- `-1` means decrement the pressure by 1.\n- `0` means reset the pressure to the initial `base` value.\n\nGiven the `instructions` array and the integer `base`, return an array representing the pressure of the valve immediately after each instruction is executed.\n\n**Constraints**\n- `0 <= instructions.length <= 40`\n- `instructions[i]` is either `-1`, `0`, or `1`.\n- `-1000 <= base <= 1000`\n\n**Example 1**\n```\ninput:\n1 1 0 -1\n5\noutput: 6 7 5 4\n```\n*Explanation: Start at 5. Increment -> 6. Increment -> 7. Reset -> 5. Decrement -> 4.*\n\n**Example 2**\n```\ninput:\n0 0 0\n0\noutput: 0 0 0\n```\n*Explanation: Start at 0. Reset -> 0 three times.*\n\n**Example 3**\n```\ninput:\n\n10\noutput: \n```\n*Explanation: No instructions mean no output sequence is produced.*\n\n**Follow-up:** Can you optimize this to run efficiently even if there are millions of instructions?",
    editorialMarkdown: "## Pressure Valve Calibration\nWe need to track a value that updates dynamically based on an incoming sequence of instructions. A simple variable initialized to `base` can track the current pressure. We iterate through the instruction array, updating the variable according to the instruction (adding 1, subtracting 1, or resetting to `base`), and append the new value to our result array.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N)\\) where \\(N\\) is the number of instructions.\n- **Space Complexity:** \\(\\mathcal{O}(N)\\) to hold the output array.\n\n**Common Trap:**\nWhen a reset instruction (`0`) is processed, the pressure must be reset to the original `base` value, not to 0.",
    referenceSolution: {
      JAVASCRIPT: "function solve(instructions, base) {\n    let res = [];\n    let curr = base;\n    for(let i=0; i<instructions.length; i++) {\n        if(instructions[i] === 1) curr++;\n        else if(instructions[i] === -1) curr--;\n        else curr = base;\n        res.push(curr);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(instructions: number[], base: number): number[] {\n    let res: number[] = [];\n    let curr = base;\n    for(let i=0; i<instructions.length; i++) {\n        if(instructions[i] === 1) curr++;\n        else if(instructions[i] === -1) curr--;\n        else curr = base;\n        res.push(curr);\n    }\n    return res;\n}",
      PYTHON: "def solve(instructions, base):\n    res = []\n    curr = base\n    for ins in instructions:\n        if ins == 1: curr += 1\n        elif ins == -1: curr -= 1\n        else: curr = base\n        res.append(curr)\n    return res",
      JAVA: "    static int[] solve(int[] instructions, int base) {\n        int[] res = new int[instructions.length];\n        int curr = base;\n        for(int i=0; i<instructions.length; i++) {\n            if(instructions[i] == 1) curr++;\n            else if(instructions[i] == -1) curr--;\n            else curr = base;\n            res[i] = curr;\n        }\n        return res;\n    }",
      CPP: "vector<int> solve(vector<int> instructions, int base) {\n    vector<int> res;\n    int curr = base;\n    for(int i=0; i<instructions.size(); i++) {\n        if(instructions[i] == 1) curr++;\n        else if(instructions[i] == -1) curr--;\n        else curr = base;\n        res.push_back(curr);\n    }\n    return res;\n}",
      GO: "func solve(instructions []int, base int) []int {\n    res := make([]int, len(instructions))\n    curr := base\n    for i, ins := range instructions {\n        if ins == 1 {\n            curr++\n        } else if ins == -1 {\n            curr--\n        } else {\n            curr = base\n        }\n        res[i] = curr\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 1 0 -1\n5", expectedStdout: "6 7 5 4", isSample: true },
      { stdin: "0 0 0\n0", expectedStdout: "0 0 0", isSample: true },
      { stdin: "\n10", expectedStdout: "" },
      { stdin: "1 -1 1 -1\n100", expectedStdout: "101 100 101 100" },
      { stdin: "0\n-5", expectedStdout: "-5" },
      { stdin: "-1 -1 -1\n0", expectedStdout: "-1 -2 -3" },
      { stdin: "1 0 -1 0 1\n2", expectedStdout: "3 2 1 2 3" },
      { stdin: "1\n0", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "network-router-bandwidth",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "BIT_MANIPULATION",
    title: "Memory Block Allocation",
    patternTags: ["array","bit-manipulation","counting","popcount"],
    signatureId: "fn:int->ints",
    avgSolveSeconds: 500,
    promptMarkdown: "A computer operating system tracks the status of memory blocks. The fragmentation score of a memory block is exactly equal to the number of '1' bits in the binary representation of the block's integer index.\n\nFor all memory block indices from `0` up to `n` (inclusive), calculate their fragmentation scores. Return an array where the `i`-th element is the fragmentation score of block `i`.\n\n**Constraints**\n- `0 <= n <= 40`\n\n**Example 1**\n```\ninput:\n2\noutput: 0 1 1\n```\n*Explanation: 0 in binary is \"0\" (0 ones), 1 is \"1\" (1 one), and 2 is \"10\" (1 one).*\n\n**Example 2**\n```\ninput:\n5\noutput: 0 1 1 2 1 2\n```\n*Explanation: The binary representations for 0 to 5 are \"0\", \"1\", \"10\", \"11\", \"100\", and \"101\". The counts of ones are 0, 1, 1, 2, 1, 2.*\n\n**Example 3**\n```\ninput:\n0\noutput: 0\n```\n*Explanation: The only memory block index is 0.*\n\n**Follow-up:** Could you solve it in linear time mathcal{O}(n) using a dynamic programming approach rather than recounting bits for each number?",
    editorialMarkdown: "## Network Router Bandwidth\nThe problem asks us to count the number of '1' bits (set bits) for every integer from `0` to `n`. While we can iterate from `0` to `n` and repeatedly shift bits for each number, many standard libraries offer a built-in function for counting set bits (like `popcount`).\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N \\log N)\\) using a simple loop over all bits, which is extremely fast for small \\(N\\). Using dynamic programming, we can achieve \\(\\mathcal{O}(N)\\).\n- **Space Complexity:** \\(\\mathcal{O}(N)\\) for the output array.\n\n**Common Trap:**\nForgetting to include the count for the number `n` itself. The loop should run up to and including `n`.",
    referenceSolution: {
      JAVASCRIPT: "function solve(n) {\n    let res = [];\n    for(let i=0; i<=n; i++) {\n        let c = 0, temp = i;\n        while(temp > 0) {\n            c += temp & 1;\n            temp >>= 1;\n        }\n        res.push(c);\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(n: number): number[] {\n    let res: number[] = [];\n    for(let i=0; i<=n; i++) {\n        let c = 0, temp = i;\n        while(temp > 0) {\n            c += temp & 1;\n            temp >>= 1;\n        }\n        res.push(c);\n    }\n    return res;\n}",
      PYTHON: "def solve(n):\n    return [bin(i).count('1') for i in range(n + 1)]",
      JAVA: "    static int[] solve(int n) {\n        int[] res = new int[n + 1];\n        for(int i=0; i<=n; i++) {\n            int c = 0, temp = i;\n            while(temp > 0) {\n                c += temp & 1;\n                temp >>= 1;\n            }\n            res[i] = c;\n        }\n        return res;\n    }",
      CPP: "vector<int> solve(int n) {\n    vector<int> res;\n    for(int i=0; i<=n; i++) {\n        int c = 0, temp = i;\n        while(temp > 0) {\n            c += temp & 1;\n            temp >>= 1;\n        }\n        res.push_back(c);\n    }\n    return res;\n}",
      GO: "func solve(n int) []int {\n    res := make([]int, n+1)\n    for i := 0; i <= n; i++ {\n        c := 0\n        temp := i\n        for temp > 0 {\n            c += temp & 1\n            temp >>= 1\n        }\n        res[i] = c\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "2", expectedStdout: "0 1 1", isSample: true },
      { stdin: "5", expectedStdout: "0 1 1 2 1 2", isSample: true },
      { stdin: "0", expectedStdout: "0", isSample: true },
      { stdin: "1", expectedStdout: "0 1" },
      { stdin: "10", expectedStdout: "0 1 1 2 1 2 2 3 1 2 2" },
      { stdin: "15", expectedStdout: "0 1 1 2 1 2 2 3 1 2 2 3 2 3 3 4" },
      { stdin: "16", expectedStdout: "0 1 1 2 1 2 2 3 1 2 2 3 2 3 3 4 1" },
      { stdin: "8", expectedStdout: "0 1 1 2 1 2 2 3 1" },
    ],
  }),

  p({
    ...base,
    slug: "valid-card-combos",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Valid Card Combos",
    patternTags: ["array","counting","hash-set"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 400,
    promptMarkdown: "In a fantasy card game, you score exactly one point for each card with value `V` in your hand, but **only if** you also hold at least one card with value `V + 1`.\n\nGiven an array of integers `cards` representing the numerical values of the cards in your hand, calculate your total score.\n\n**Constraints**\n- `0 <= cards.length <= 40`\n- `0 <= cards[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 3\noutput: 2\n```\n*Explanation: The card '1' scores a point because '2' is present. The card '2' scores because '3' is present. Total score is 2.*\n\n**Example 2**\n```\ninput:\n1 1 3 3 5 5 7 7\noutput: 0\n```\n*Explanation: No card has its consecutive higher value present in the hand, so the score is 0.*\n\n**Example 3**\n```\ninput:\n1 1 2 2\noutput: 2\n```\n*Explanation: Both '1's score a point because there is at least one '2' in the hand. The '2's score nothing. Total score is 2.*\n\n**Follow-up:** Can you solve this in mathcal{O}(N) time complexity using a hash set?",
    editorialMarkdown: "## Valid Card Combos\nThis problem asks us to count elements `V` such that `V + 1` also exists in the array. Since order doesn't matter and we only care about existence, we can insert all values into a hash set. Then, we can iterate over the original array, checking for each element if its incremented value exists in the set.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N)\\), as inserting and looking up elements in a hash set takes \\(\\mathcal{O}(1)\\) time on average.\n- **Space Complexity:** \\(\\mathcal{O}(N)\\) to store the hash set of unique elements.\n\n**Common Trap:**\nDeduplicating the array *before* iterating over it to count points. If you have duplicate values in your hand, each duplicate can score a point independently as long as at least one `V + 1` exists.",
    referenceSolution: {
      JAVASCRIPT: "function solve(cards) {\n    let s = new Set(cards);\n    let c = 0;\n    for(let i=0; i<cards.length; i++) {\n        if(s.has(cards[i] + 1)) c++;\n    }\n    return c;\n}",
      TYPESCRIPT: "function solve(cards: number[]): number {\n    let s = new Set(cards);\n    let c = 0;\n    for(let i=0; i<cards.length; i++) {\n        if(s.has(cards[i] + 1)) c++;\n    }\n    return c;\n}",
      PYTHON: "def solve(cards):\n    s = set(cards)\n    return sum(1 for v in cards if v + 1 in s)",
      JAVA: "    static int solve(int[] cards) {\n        java.util.HashSet<Integer> s = new java.util.HashSet<>();\n        for(int v : cards) s.add(v);\n        int c = 0;\n        for(int v : cards) {\n            if(s.contains(v + 1)) c++;\n        }\n        return c;\n    }",
      CPP: "int solve(vector<int> cards) {\n    unordered_set<int> s(cards.begin(), cards.end());\n    int c = 0;\n    for(int v : cards) {\n        if(s.count(v + 1)) c++;\n    }\n    return c;\n}",
      GO: "func solve(cards []int) int {\n    s := make(map[int]bool)\n    for _, v := range cards {\n        s[v] = true\n    }\n    c := 0\n    for _, v := range cards {\n        if s[v+1] {\n            c++\n        }\n    }\n    return c\n}",
    },
    tests: [
      { stdin: "1 2 3", expectedStdout: "2", isSample: true },
      { stdin: "1 1 3 3 5 5 7 7", expectedStdout: "0", isSample: true },
      { stdin: "1 1 2 2", expectedStdout: "2", isSample: true },
      { stdin: "1 1 2", expectedStdout: "2" },
      { stdin: "1000", expectedStdout: "0" },
      { stdin: "", expectedStdout: "0" },
      { stdin: "0 1 0 1", expectedStdout: "2" },
      { stdin: "5 4 3 2 1", expectedStdout: "4" },
    ],
  }),

  p({
    ...base,
    slug: "product-category-matching",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Directory Prefix Search",
    patternTags: ["array","string","prefix","counting"],
    signatureId: "fn:strings->int",
    avgSolveSeconds: 300,
    promptMarkdown: "A file system search tool looks for files that match a specific directory path prefix. The first path in the input is the target prefix, and you need to determine how many of the following paths start with it.\n\nGiven an array of strings `paths`, the first element `paths[0]` is the target prefix. Count and return the number of subsequent strings (`paths[1]` to the end) that begin with this prefix. If the array is empty, return 0.\n\n**Constraints**\n- `0 <= paths.length <= 40`\n- `paths[i]` consists of English letters (both uppercase and lowercase), numbers, hyphens, and underscores.\n- `1 <= paths[i].length <= 20` (if `paths` is not empty)\n\n**Example 1**\n```\ninput:\nsys sys_admin system user_sys sys\noutput: 3\n```\n*Explanation: The target prefix is \"sys\". The subsequent paths are \"sys_admin\" (yes), \"system\" (yes), \"user_sys\" (no), and \"sys\" (yes).*\n\n**Example 2**\n```\ninput:\nPROD PROD-100 PROD-200 TEST-PROD\noutput: 2\n```\n*Explanation: The target prefix is \"PROD\". \"PROD-100\" and \"PROD-200\" start with it. \"TEST-PROD\" does not.*\n\n**Example 3**\n```\ninput:\nabc\noutput: 0\n```\n*Explanation: The target prefix is \"abc\". There are no subsequent paths, so the count is 0.*\n\n**Follow-up:** Can you ensure that you don't encounter an out-of-bounds error when manually comparing characters?",
    editorialMarkdown: "## Product Category Matching\nWe are tasked with determining how many strings in a given array start with a specific string prefix. The prefix to match is designated as the first element of the array. We can iterate over the rest of the array and check each element to see if it starts with the prefix.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N \\times M)\\), where \\(N\\) is the number of words and \\(M\\) is the length of the prefix.\n- **Space Complexity:** \\(\\mathcal{O}(1)\\), as we only need to keep a count.\n\n**Common Trap:**\nIncluding the prefix itself in the count if it isn't specified in the constraints, or checking characters beyond the bounds of shorter strings when implementing a manual prefix check. Standard library `startsWith` functions gracefully handle shorter strings.",
    referenceSolution: {
      JAVASCRIPT: "function solve(tags) {\n    if(tags.length === 0) return 0;\n    let p = tags[0];\n    let c = 0;\n    for(let i=1; i<tags.length; i++) {\n        if(tags[i].startsWith(p)) c++;\n    }\n    return c;\n}",
      TYPESCRIPT: "function solve(tags: string[]): number {\n    if(tags.length === 0) return 0;\n    let p = tags[0];\n    let c = 0;\n    for(let i=1; i<tags.length; i++) {\n        if(tags[i].startsWith(p)) c++;\n    }\n    return c;\n}",
      PYTHON: "def solve(tags):\n    if not tags: return 0\n    p = tags[0]\n    return sum(1 for w in tags[1:] if w.startswith(p))",
      JAVA: "    static int solve(String[] tags) {\n        if(tags.length == 0) return 0;\n        String p = tags[0];\n        int c = 0;\n        for(int i=1; i<tags.length; i++) {\n            if(tags[i].startsWith(p)) c++;\n        }\n        return c;\n    }",
      CPP: "int solve(vector<string> tags) {\n    if(tags.empty()) return 0;\n    string p = tags[0];\n    int c = 0;\n    for(int i=1; i<tags.size(); i++) {\n        if(tags[i].substr(0, p.length()) == p) c++;\n    }\n    return c;\n}",
      GO: "func solve(tags []string) int {\n    if len(tags) == 0 {\n        return 0\n    }\n    p := tags[0]\n    c := 0\n    for i := 1; i < len(tags); i++ {\n        if len(tags[i]) >= len(p) && tags[i][:len(p)] == p {\n            c++\n        }\n    }\n    return c\n}",
    },
    tests: [
      { stdin: "sys sys_admin system user_sys sys", expectedStdout: "3", isSample: true },
      { stdin: "PROD PROD-100 PROD-200 TEST-PROD", expectedStdout: "2", isSample: true },
      { stdin: "abc", expectedStdout: "0", isSample: true },
      { stdin: "a a aa aaa b a", expectedStdout: "4" },
      { stdin: "xyz abc def", expectedStdout: "0" },
      { stdin: "longprefix longprefix-1 longpre", expectedStdout: "1" },
      { stdin: "", expectedStdout: "0" },
      { stdin: "start start1 start2 start3 start4", expectedStdout: "4" },
    ],
  }),

  p({
    ...base,
    slug: "complete-microbiome-sample",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Radio Signal Decoding",
    patternTags: ["string","substring","counting","hash-set"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing a sequence of intercepted radio transmissions represented by a string `transmission`. A contiguous substring of the transmission is considered a *full message* if it consists entirely of the signal codes 'w', 'x', 'y', and 'z', and it contains **at least one of each** of these four codes.\n\nGiven the string `transmission`, return the total number of full messages that can be found in it.\n\n**Constraints**\n- `1 <= transmission.length <= 100`\n- `transmission` consists of lowercase English letters.\n\n**Example 1**\n```\ninput:\nwwxyzz\noutput: 4\n```\n*Explanation: The 4 valid substrings are \"wwxyz\", \"wwxyzz\", \"wxyz\", and \"wxyzz\".*\n\n**Example 2**\n```\ninput:\nwxyz\noutput: 1\n```\n*Explanation: The entire string \"wxyz\" is the only valid substring.*\n\n**Example 3**\n```\ninput:\nww\noutput: 0\n```\n*Explanation: There are no valid substrings because the transmission does not contain all four required signal codes.*\n\n**Follow-up:** Can you solve this efficiently without checking every possible substring from scratch?",
    editorialMarkdown: "## Complete Microbiome Sample\nTo solve this, we can check all possible contiguous substrings since the string length is small. We use two nested loops to iterate over all start and end points of a substring. We maintain a set to track the unique bacteria types seen so far in the current substring. If we encounter a character that is not one of the valid types ('w', 'x', 'y', 'z'), we immediately stop expanding the current substring because no further expansion can be valid. If the set size reaches 4, we increment our count.\n\n**Complexity:**\n- **Time Complexity:** \\(\\mathcal{O}(N^2)\\) using nested loops.\n- **Space Complexity:** \\(\\mathcal{O}(1)\\) since the set can contain at most 4 elements.\n\n**Common Trap:**\nForgetting to break out of the inner loop when an invalid character is encountered. If an invalid character is included, the entire substring (and any extensions of it) is invalid.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    let c = 0;\n    for(let i=0; i<s.length; i++) {\n        let seen = new Set();\n        for(let j=i; j<s.length; j++) {\n            if(s[j] !== 'w' && s[j] !== 'x' && s[j] !== 'y' && s[j] !== 'z') break;\n            seen.add(s[j]);\n            if(seen.size === 4) c++;\n        }\n    }\n    return c;\n}",
      TYPESCRIPT: "function solve(s: string): number {\n    let c = 0;\n    for(let i=0; i<s.length; i++) {\n        let seen = new Set<string>();\n        for(let j=i; j<s.length; j++) {\n            if(s[j] !== 'w' && s[j] !== 'x' && s[j] !== 'y' && s[j] !== 'z') break;\n            seen.add(s[j]);\n            if(seen.size === 4) c++;\n        }\n    }\n    return c;\n}",
      PYTHON: "def solve(s):\n    ans = 0\n    valid = set('wxyz')\n    for i in range(len(s)):\n        seen = set()\n        for j in range(i, len(s)):\n            if s[j] not in valid:\n                break\n            seen.add(s[j])\n            if len(seen) == 4:\n                ans += 1\n    return ans",
      JAVA: "    static int solve(String s) {\n        int c = 0;\n        for (int i = 0; i < s.length(); i++) {\n            boolean w = false, x = false, y = false, z = false;\n            for (int j = i; j < s.length(); j++) {\n                char ch = s.charAt(j);\n                if (ch == 'w') w = true;\n                else if (ch == 'x') x = true;\n                else if (ch == 'y') y = true;\n                else if (ch == 'z') z = true;\n                else break;\n                if (w && x && y && z) c++;\n            }\n        }\n        return c;\n    }",
      CPP: "int solve(string s) {\n    int c = 0;\n    for (int i = 0; i < s.length(); i++) {\n        bool w = false, x = false, y = false, z = false;\n        for (int j = i; j < s.length(); j++) {\n            char ch = s[j];\n            if (ch == 'w') w = true;\n            else if (ch == 'x') x = true;\n            else if (ch == 'y') y = true;\n            else if (ch == 'z') z = true;\n            else break;\n            if (w && x && y && z) c++;\n        }\n    }\n    return c;\n}",
      GO: "func solve(s string) int {\n    c := 0\n    for i := 0; i < len(s); i++ {\n        seen := make(map[byte]bool)\n        for j := i; j < len(s); j++ {\n            ch := s[j]\n            if ch != 'w' && ch != 'x' && ch != 'y' && ch != 'z' {\n                break\n            }\n            seen[ch] = true\n            if len(seen) == 4 {\n                c++\n            }\n        }\n    }\n    return c\n}",
    },
    tests: [
      { stdin: "wwxyzz", expectedStdout: "4", isSample: true },
      { stdin: "wxyz", expectedStdout: "1", isSample: true },
      { stdin: "ww", expectedStdout: "0" },
      { stdin: "xwxyzw", expectedStdout: "5" },
      { stdin: "abc", expectedStdout: "0" },
      { stdin: "wxyza", expectedStdout: "1" },
      { stdin: "a", expectedStdout: "0" },
      { stdin: "wxzyyxxww", expectedStdout: "10" },
    ],
  }),
];
