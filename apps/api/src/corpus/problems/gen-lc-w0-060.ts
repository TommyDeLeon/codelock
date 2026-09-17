import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w0-060` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W0_060_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "final-command-length",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Trailing Block Size",
    patternTags: ["strings","pointers","length"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are processing text lines containing multiple segments separated by spaces.\nThere might be trailing spaces at the end of the text. Your objective is to compute the number of characters in the final segment of the text.\n\nGiven a string `transmission`, compute and return the number of characters in the final contiguous non-space segment.\n\n**Constraints**\n- `1 <= transmission.length <= 1000`\n- `transmission` consists of English letters and spaces `' '`.\n- There will be at least one word in `transmission`.\n\n**Example 1**\n```\ninput:\nactivate hover mode\noutput:\n4\n```\n*Explanation: The final segment is \"mode\", which contains 4 characters.*\n\n**Example 2**\n```\ninput:\n   return to base   \noutput:\n4\n```\n*Explanation: The final segment is \"base\", which contains 4 characters.*\n\n**Example 3**\n```\ninput:\nland\noutput:\n4\n```\n*Explanation: The final segment is \"land\", which contains 4 characters.*\n\n**Follow-up**\nIs it possible to determine this metric by examining the string backwards without creating additional copies in memory?",
    editorialMarkdown: "## Final Command Length\n\nWe need to find the length of the last word in a string. Because words are separated by spaces, and there may be trailing spaces, we can optimize this by scanning from the end of the string.\nFirst, we skip any trailing spaces. Once we hit a non-space character, we start counting. We continue counting until we reach another space or the beginning of the string, at which point we return the count.\n\n**Trap**: A common pitfall is allocating memory by splitting the entire string into an array of words, which takes O(N) extra space and unnecessary time, instead of just scanning backwards.\n\n**Complexity:**\n- **Time:** O(N) in the worst case where N is the length of the string.\n- **Space:** O(1) by using pointers instead of splitting strings.",
    referenceSolution: {
      JAVASCRIPT: "function solve(transmission) {\n    let length = 0;\n    let i = transmission.length - 1;\n    while (i >= 0 && transmission[i] === ' ') {\n        i--;\n    }\n    while (i >= 0 && transmission[i] !== ' ') {\n        length++;\n        i--;\n    }\n    return length;\n}",
      TYPESCRIPT: "function solve(transmission: string): number {\n    let length = 0;\n    let i = transmission.length - 1;\n    while (i >= 0 && transmission[i] === ' ') {\n        i--;\n    }\n    while (i >= 0 && transmission[i] !== ' ') {\n        length++;\n        i--;\n    }\n    return length;\n}",
      PYTHON: "def solve(transmission):\n    length = 0\n    i = len(transmission) - 1\n    while i >= 0 and transmission[i] == ' ':\n        i -= 1\n    while i >= 0 and transmission[i] != ' ':\n        length += 1\n        i -= 1\n    return length",
      JAVA: "    static int solve(String transmission) {\n        int length = 0;\n        int i = transmission.length() - 1;\n        while (i >= 0 && transmission.charAt(i) == ' ') {\n            i--;\n        }\n        while (i >= 0 && transmission.charAt(i) != ' ') {\n            length++;\n            i--;\n        }\n        return length;\n    }",
      CPP: "#include <string>\nusing namespace std;\nint solve(string transmission) {\n    int length = 0;\n    int i = transmission.length() - 1;\n    while (i >= 0 && transmission[i] == ' ') {\n        i--;\n    }\n    while (i >= 0 && transmission[i] != ' ') {\n        length++;\n        i--;\n    }\n    return length;\n}",
      GO: "func solve(transmission string) int {\n    length := 0\n    i := len(transmission) - 1\n    for i >= 0 && transmission[i] == ' ' {\n        i--\n    }\n    for i >= 0 && transmission[i] != ' ' {\n        length++\n        i--\n    }\n    return length\n}",
    },
    tests: [
      { stdin: "activate hover mode", expectedStdout: "4", isSample: true },
      { stdin: "   return to base   ", expectedStdout: "4", isSample: true },
      { stdin: "land", expectedStdout: "4" },
      { stdin: " a ", expectedStdout: "1" },
      { stdin: "longword", expectedStdout: "8" },
      { stdin: "mission accomplished", expectedStdout: "12" },
      { stdin: "scan sector seven  ", expectedStdout: "5" },
      { stdin: "execute  ", expectedStdout: "7" },
    ],
  }),

  p({
    ...base,
    slug: "symmetric-signal-repair",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Optimal Mirror String",
    patternTags: ["strings","two-pointers","palindrome","greedy"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 600,
    promptMarkdown: "You are given a sequence of characters that is intended to read the same forwards and backwards.\nHowever, some characters may not match. You are allowed to replace any character with any lowercase English letter.\nYour goal is to transform the sequence into a mirrored sequence using the minimum number of character changes. If there are multiple ways to achieve this, you must output the sequence that comes first in dictionary (alphabetical) order.\n\nGiven a string `signal` of lowercase English letters, compute the required mirrored sequence.\n\n**Constraints**\n- `1 <= signal.length <= 1000`\n- `signal` consists only of lowercase English letters.\n\n**Example 1**\n```\ninput:\negcge\noutput:\negcge\n```\n*Explanation: The sequence already reads the same forwards and backwards.*\n\n**Example 2**\n```\ninput:\nabcd\noutput:\nabba\n```\n*Explanation: A minimum of 2 changes is required. Modifying 'c' to 'b' and 'd' to 'a' yields \"abba\", which comes before \"dccd\" alphabetically.*\n\n**Example 3**\n```\ninput:\nseven\noutput:\nneven\n```\n*Explanation: Modifying 's' to 'n' makes the ends match. 'n' is chosen over 's' because it is earlier in the alphabet.*\n\n**Follow-up**\nCan you determine the resulting string in a single iteration by examining characters from both ends towards the center?",
    editorialMarkdown: "## Symmetric Signal Repair\n\nWe can use two pointers, one starting at the beginning of the string and one at the end, moving towards the center.\nAt each step, we check if the characters at the two pointers are the same. If they are different, we must replace one of them to make the string a palindrome. To make the string lexicographically smallest with the minimum number of replacements, we should always replace the alphabetically larger character with the smaller one. We then construct the new string.\n\n**Trap**: A common mistake is replacing the smaller character with the larger character, which yields a valid palindrome with the minimum replacements, but not the lexicographically smallest one.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string, as we do one pass over it.\n- **Space:** O(N) to store the result string.",
    referenceSolution: {
      JAVASCRIPT: "function solve(signal) {\n    let chars = signal.split('');\n    let i = 0;\n    let j = chars.length - 1;\n    while (i < j) {\n        if (chars[i] !== chars[j]) {\n            if (chars[i] < chars[j]) {\n                chars[j] = chars[i];\n            } else {\n                chars[i] = chars[j];\n            }\n        }\n        i++;\n        j--;\n    }\n    return chars.join('');\n}",
      TYPESCRIPT: "function solve(signal: string): string {\n    let chars = signal.split('');\n    let i = 0;\n    let j = chars.length - 1;\n    while (i < j) {\n        if (chars[i] !== chars[j]) {\n            if (chars[i] < chars[j]) {\n                chars[j] = chars[i];\n            } else {\n                chars[i] = chars[j];\n            }\n        }\n        i++;\n        j--;\n    }\n    return chars.join('');\n}",
      PYTHON: "def solve(signal):\n    chars = list(signal)\n    i = 0\n    j = len(chars) - 1\n    while i < j:\n        if chars[i] != chars[j]:\n            if chars[i] < chars[j]:\n                chars[j] = chars[i]\n            else:\n                chars[i] = chars[j]\n        i += 1\n        j -= 1\n    return \"\".join(chars)",
      JAVA: "    static String solve(String signal) {\n        char[] chars = signal.toCharArray();\n        int i = 0;\n        int j = chars.length - 1;\n        while (i < j) {\n            if (chars[i] != chars[j]) {\n                if (chars[i] < chars[j]) {\n                    chars[j] = chars[i];\n                } else {\n                    chars[i] = chars[j];\n                }\n            }\n            i++;\n            j--;\n        }\n        return new String(chars);\n    }",
      CPP: "#include <string>\nusing namespace std;\nstring solve(string signal) {\n    int i = 0;\n    int j = signal.length() - 1;\n    while (i < j) {\n        if (signal[i] != signal[j]) {\n            if (signal[i] < signal[j]) {\n                signal[j] = signal[i];\n            } else {\n                signal[i] = signal[j];\n            }\n        }\n        i++;\n        j--;\n    }\n    return signal;\n}",
      GO: "func solve(signal string) string {\n    chars := []byte(signal)\n    i := 0\n    j := len(chars) - 1\n    for i < j {\n        if chars[i] != chars[j] {\n            if chars[i] < chars[j] {\n                chars[j] = chars[i]\n            } else {\n                chars[i] = chars[j]\n            }\n        }\n        i++\n        j--\n    }\n    return string(chars)\n}",
    },
    tests: [
      { stdin: "egcge", expectedStdout: "egcge", isSample: true },
      { stdin: "abcd", expectedStdout: "abba", isSample: true },
      { stdin: "seven", expectedStdout: "neven" },
      { stdin: "a", expectedStdout: "a" },
      { stdin: "zza", expectedStdout: "aza" },
      { stdin: "zaz", expectedStdout: "zaz" },
      { stdin: "edcba", expectedStdout: "abcba" },
      { stdin: "xxyyzz", expectedStdout: "xxyyxx" },
    ],
  }),

  p({
    ...base,
    slug: "restrict-inventory-batches",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Filter Repetitive Identifiers",
    patternTags: ["arrays","two-pointers","filtering"],
    signatureId: "fn:ints,int->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "You are processing a sorted list of integer identifiers. Because the list is sorted, identical identifiers are grouped together.\nYour task is to filter the list such that for each identifier, you retain exactly the minimum between its original count and `k` occurrences.\n\nGiven a sorted integer array `batches` and an integer `k`, construct and return a new array where each unique identifier appears exactly `min(original count, k)` times, preserving the sorted order.\n\n**Constraints**\n- `0 <= batches.length <= 100`\n- `1 <= k <= 100`\n- `1 <= batches[i] <= 1000`\n- `batches` is sorted in non-decreasing order.\n\n**Example 1**\n```\ninput:\n1 1 1 2 2 3\n2\noutput:\n1 1 2 2 3\n```\n*Explanation: Identifier 1 is restricted to 2 occurrences. Identifiers 2 and 3 remain unaffected.*\n\n**Example 2**\n```\ninput:\n5 5 5 5\n1\noutput:\n5\n```\n*Explanation: Identifier 5 is restricted to 1 occurrence.*\n\n**Example 3**\n```\ninput:\n\n2\noutput:\n\n```\n*Explanation: An empty input results in an empty output.*\n\n**Follow-up**\nCan you perform this operation in-place in a constrained environment? For this task, you are expected to construct and return a new list.",
    editorialMarkdown: "## Restrict Inventory Batches\n\nWe need to filter a sorted array so that no element appears more than `k` times.\nWe can iterate through the array and add elements to a result list. Since the array is sorted, we only need to check if the current element is equal to the element `k` positions behind it in the result list. If it's different, or if we haven't reached `k` elements yet, we can safely include it.\n\n**Trap**: A common pitfall is manually counting occurrences and using complex nested loops, which is prone to off-by-one errors. The look-back trick makes it much simpler.\n\n**Complexity:**\n- **Time:** O(N) since we process each element exactly once.\n- **Space:** O(N) for the returned array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(batches, k) {\n    let res = [];\n    for (let x of batches) {\n        if (res.length < k || res[res.length - k] !== x) {\n            res.push(x);\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(batches: number[], k: number): number[] {\n    let res: number[] = [];\n    for (let x of batches) {\n        if (res.length < k || res[res.length - k] !== x) {\n            res.push(x);\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(batches, k):\n    res = []\n    for x in batches:\n        if len(res) < k or res[-k] != x:\n            res.append(x)\n    return res",
      JAVA: "    static int[] solve(int[] batches, int k) {\n        java.util.List<Integer> res = new java.util.ArrayList<>();\n        for (int x : batches) {\n            if (res.size() < k || res.get(res.size() - k) != x) {\n                res.add(x);\n            }\n        }\n        int[] out = new int[res.size()];\n        for (int i = 0; i < res.size(); i++) {\n            out[i] = res.get(i);\n        }\n        return out;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<int> batches, int k) {\n    vector<int> res;\n    for (int x : batches) {\n        if (res.size() < k || res[res.size() - k] != x) {\n            res.push_back(x);\n        }\n    }\n    return res;\n}",
      GO: "func solve(batches []int, k int) []int {\n    var res []int\n    for _, x := range batches {\n        if len(res) < k || res[len(res)-k] != x {\n            res = append(res, x)\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 1 1 2 2 3\n2", expectedStdout: "1 1 2 2 3", isSample: true },
      { stdin: "5 5 5 5\n1", expectedStdout: "5", isSample: true },
      { stdin: "\n2", expectedStdout: "" },
      { stdin: "10\n1", expectedStdout: "10" },
      { stdin: "1 2 3 4 5\n2", expectedStdout: "1 2 3 4 5" },
      { stdin: "1 1 1 1 2 2 2 2 3 3\n3", expectedStdout: "1 1 1 2 2 2 3 3" },
      { stdin: "7 7 7 7 7\n5", expectedStdout: "7 7 7 7 7" },
      { stdin: "7 7 7 7 7\n10", expectedStdout: "7 7 7 7 7" },
    ],
  }),

  p({
    ...base,
    slug: "patrol-route-loop",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "TWO_POINTERS",
    title: "Patrol Route Loop",
    patternTags: ["arrays","two-pointers","cycle-detection"],
    signatureId: "fn:ints->bool",
    avgSolveSeconds: 600,
    promptMarkdown: "You are programming a security robot's patrol route. The route is defined by an array of integers `checkpoints`.\nThe robot starts at index `0`. When at index `i`, it must next move to the index given by `checkpoints[i]`.\nYou want to determine if the robot will eventually be trapped in a repeating loop of checkpoints.\n\nGiven the array `checkpoints`, return `true` if the robot's path contains a cycle, and `false` if it eventually reaches a checkpoint that directs it out of bounds (an index less than 0 or greater than or equal to `checkpoints.length`).\n\n**Constraints**\n- `1 <= checkpoints.length <= 100`\n- `-100 <= checkpoints[i] <= 100`\n\n**Example 1**\n```\ninput:\n1 2 0\noutput:\ntrue\n```\n*Explanation: The robot starts at 0, goes to 1, then to 2, then back to 0. This is a cycle.*\n\n**Example 2**\n```\ninput:\n1 -1\noutput:\nfalse\n```\n*Explanation: The robot starts at 0, goes to 1, which points to -1 (out of bounds). It terminates.*\n\n**Example 3**\n```\ninput:\n0\noutput:\ntrue\n```\n*Explanation: The robot starts at 0, which points to 0, forming an immediate cycle.*\n\n**Follow-up**\nCan you determine this using O(1) extra space?",
    editorialMarkdown: "## Patrol Route Loop\n\nThis problem is a variation of cycle detection. We can use Floyd's Tortoise and Hare algorithm.\nWe keep two pointers, `slow` and `fast`. `slow` moves one step at a time (`slow = checkpoints[slow]`), and `fast` moves two steps (`fast = checkpoints[checkpoints[fast]]`).\nIf there is a cycle, the `fast` pointer will eventually catch up to the `slow` pointer. If either pointer goes out of bounds, then there is no cycle.\n\n**Trap**: A common pitfall is forgetting to check if the next step for the `fast` pointer is out of bounds before attempting to take the second step, leading to an index out of bounds error.\n\n**Complexity:**\n- **Time:** O(N) where N is the number of checkpoints, as the fast pointer will find the cycle within N steps.\n- **Space:** O(1) because we only use two pointers.",
    referenceSolution: {
      JAVASCRIPT: "function solve(checkpoints) {\n    let slow = 0;\n    let fast = 0;\n    while (true) {\n        if (slow < 0 || slow >= checkpoints.length) return false;\n        slow = checkpoints[slow];\n        \n        if (fast < 0 || fast >= checkpoints.length) return false;\n        fast = checkpoints[fast];\n        if (fast < 0 || fast >= checkpoints.length) return false;\n        fast = checkpoints[fast];\n        \n        if (slow === fast) return true;\n    }\n}",
      TYPESCRIPT: "function solve(checkpoints: number[]): boolean {\n    let slow = 0;\n    let fast = 0;\n    while (true) {\n        if (slow < 0 || slow >= checkpoints.length) return false;\n        slow = checkpoints[slow];\n        \n        if (fast < 0 || fast >= checkpoints.length) return false;\n        fast = checkpoints[fast];\n        if (fast < 0 || fast >= checkpoints.length) return false;\n        fast = checkpoints[fast];\n        \n        if (slow === fast) return true;\n    }\n}",
      PYTHON: "def solve(checkpoints):\n    slow = 0\n    fast = 0\n    n = len(checkpoints)\n    while True:\n        if slow < 0 or slow >= n:\n            return False\n        slow = checkpoints[slow]\n        \n        if fast < 0 or fast >= n:\n            return False\n        fast = checkpoints[fast]\n        if fast < 0 or fast >= n:\n            return False\n        fast = checkpoints[fast]\n        \n        if slow == fast:\n            return True",
      JAVA: "    static boolean solve(int[] checkpoints) {\n        int slow = 0;\n        int fast = 0;\n        int n = checkpoints.length;\n        while (true) {\n            if (slow < 0 || slow >= n) return false;\n            slow = checkpoints[slow];\n            \n            if (fast < 0 || fast >= n) return false;\n            fast = checkpoints[fast];\n            if (fast < 0 || fast >= n) return false;\n            fast = checkpoints[fast];\n            \n            if (slow == fast) return true;\n        }\n    }",
      CPP: "#include <vector>\nusing namespace std;\nbool solve(vector<int> checkpoints) {\n    int slow = 0;\n    int fast = 0;\n    int n = checkpoints.size();\n    while (true) {\n        if (slow < 0 || slow >= n) return false;\n        slow = checkpoints[slow];\n        \n        if (fast < 0 || fast >= n) return false;\n        fast = checkpoints[fast];\n        if (fast < 0 || fast >= n) return false;\n        fast = checkpoints[fast];\n        \n        if (slow == fast) return true;\n    }\n}",
      GO: "func solve(checkpoints []int) bool {\n    slow := 0\n    fast := 0\n    n := len(checkpoints)\n    for {\n        if slow < 0 || slow >= n {\n            return false\n        }\n        slow = checkpoints[slow]\n        \n        if fast < 0 || fast >= n {\n            return false\n        }\n        fast = checkpoints[fast]\n        if fast < 0 || fast >= n {\n            return false\n        }\n        fast = checkpoints[fast]\n        \n        if slow == fast {\n            return true\n        }\n    }\n}",
    },
    tests: [
      { stdin: "1 2 0", expectedStdout: "true", isSample: true },
      { stdin: "1 -1", expectedStdout: "false", isSample: true },
      { stdin: "0", expectedStdout: "true" },
      { stdin: "5", expectedStdout: "false" },
      { stdin: "1 2 3 4 1", expectedStdout: "true" },
      { stdin: "1 2 3 4 5", expectedStdout: "false" },
      { stdin: "1 1", expectedStdout: "true" },
      { stdin: "2 0 -1", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "highest-voltage-window",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Highest Voltage Window",
    patternTags: ["arrays","maximum","subarray","scanning"],
    signatureId: "fn:ints,int->ints",
    avgSolveSeconds: 600,
    promptMarkdown: "You are analyzing a series of voltage readings from a generator. You need to identify a continuous window of `k` readings that represents the most intense surge.\nA window is considered more intense if its first reading is larger. Since all readings are distinct, this means the most intense window of length `k` starts with the highest possible initial reading among all valid windows of length `k`.\n\nGiven an array of distinct integers `readings` and an integer `k`, return the most intense continuous window of `k` readings.\n\n**Constraints**\n- `1 <= k <= readings.length <= 100`\n- `1 <= readings[i] <= 1000`\n- All integers in `readings` are distinct.\n\n**Example 1**\n```\ninput:\n1 4 3 2 5\n4\noutput:\n4 3 2 5\n```\n*Explanation: The possible windows of length 4 are [1, 4, 3, 2] and [4, 3, 2, 5]. The second starts with 4, which is higher than 1.*\n\n**Example 2**\n```\ninput:\n8 9 7 6 5 4\n3\noutput:\n9 7 6\n```\n*Explanation: The windows of length 3 start with 8, 9, 7, and 6. The one starting with 9 is the most intense.*\n\n**Example 3**\n```\ninput:\n10 5\n1\noutput:\n10\n```\n*Explanation: The largest window of length 1 is simply the single reading 10.*\n\n**Follow-up**\nCan you find the most intense window in O(N) time?",
    editorialMarkdown: "## Highest Voltage Window\n\nSince all voltage readings are distinct, the largest window lexicographically is simply the one that starts with the maximum possible first element.\nWe can iterate through all possible starting indices for a window of length `k` (from `0` to `n - k`). We keep track of the maximum starting value found so far and its index. Finally, we extract and return the subarray of length `k` starting at that optimal index.\n\n**Trap**: A common mistake is iterating all the way to the end of the array to find the maximum, forgetting that a valid window must have at least `k` elements, so the maximum starting index is `n - k`.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the array, to scan for the maximum valid start. Extracting the subarray takes O(k).\n- **Space:** O(k) to store the resulting window.",
    referenceSolution: {
      JAVASCRIPT: "function solve(readings, k) {\n    let maxIdx = 0;\n    for (let i = 1; i <= readings.length - k; i++) {\n        if (readings[i] > readings[maxIdx]) {\n            maxIdx = i;\n        }\n    }\n    return readings.slice(maxIdx, maxIdx + k);\n}",
      TYPESCRIPT: "function solve(readings: number[], k: number): number[] {\n    let maxIdx = 0;\n    for (let i = 1; i <= readings.length - k; i++) {\n        if (readings[i] > readings[maxIdx]) {\n            maxIdx = i;\n        }\n    }\n    return readings.slice(maxIdx, maxIdx + k);\n}",
      PYTHON: "def solve(readings, k):\n    max_idx = 0\n    for i in range(1, len(readings) - k + 1):\n        if readings[i] > readings[max_idx]:\n            max_idx = i\n    return readings[max_idx:max_idx + k]",
      JAVA: "    static int[] solve(int[] readings, int k) {\n        int maxIdx = 0;\n        for (int i = 1; i <= readings.length - k; i++) {\n            if (readings[i] > readings[maxIdx]) {\n                maxIdx = i;\n            }\n        }\n        int[] res = new int[k];\n        for (int i = 0; i < k; i++) {\n            res[i] = readings[maxIdx + i];\n        }\n        return res;\n    }",
      CPP: "#include <vector>\nusing namespace std;\nvector<int> solve(vector<int> readings, int k) {\n    int maxIdx = 0;\n    for (int i = 1; i <= (int)readings.size() - k; i++) {\n        if (readings[i] > readings[maxIdx]) {\n            maxIdx = i;\n        }\n    }\n    vector<int> res(k);\n    for (int i = 0; i < k; i++) {\n        res[i] = readings[maxIdx + i];\n    }\n    return res;\n}",
      GO: "func solve(readings []int, k int) []int {\n    maxIdx := 0\n    for i := 1; i <= len(readings) - k; i++ {\n        if readings[i] > readings[maxIdx] {\n            maxIdx = i\n        }\n    }\n    res := make([]int, k)\n    for i := 0; i < k; i++ {\n        res[i] = readings[maxIdx + i]\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "1 4 3 2 5\n4", expectedStdout: "4 3 2 5", isSample: true },
      { stdin: "8 9 7 6 5 4\n3", expectedStdout: "9 7 6", isSample: true },
      { stdin: "10 5\n1", expectedStdout: "10" },
      { stdin: "1 2 3 4 5\n5", expectedStdout: "1 2 3 4 5" },
      { stdin: "5 4 3 2 1\n1", expectedStdout: "5" },
      { stdin: "10 20 30\n2", expectedStdout: "20 30" },
      { stdin: "99\n1", expectedStdout: "99" },
      { stdin: "10 30 20 40 50 15 25 35\n3", expectedStdout: "50 15 25" },
    ],
  }),
];
