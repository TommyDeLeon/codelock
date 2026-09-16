import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-020` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_020_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "detect-suspicious-artifacts",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Detect Suspicious Artifacts",
    patternTags: ["array","hash-map","frequency-count","prime"],
    signatureId: "fn:ints->bool",
    avgSolveSeconds: 450,
    promptMarkdown: "An expedition team is cataloging a collection of alien artifacts, where each artifact is identified by an integer ID. According to alien lore, an artifact type is \\\"suspicious\\\" if the total number of times it was collected is exactly a prime number.\n\nGiven an array of integers `artifacts` representing the collected IDs, return `true` if at least one artifact type is suspicious, and `false` otherwise.\n\n**Constraints**\n- `1 <= artifacts.length <= 1000`\n- `1 <= artifacts[i] <= 1000`\n\n**Example 1**\n```\ninput:\n10 10 20 20 20 30\noutput: true\n```\nExplanation: Artifact 10 appears 2 times (prime). Artifact 20 appears 3 times (prime). Artifact 30 appears 1 time (not prime). At least one frequency is prime, so return true.\n\n**Example 2**\n```\ninput:\n5 5 5 5\noutput: false\n```\nExplanation: Artifact 5 appears 4 times, and 4 is not a prime number.\n\n**Example 3**\n```\ninput:\n12\noutput: false\n```\nExplanation: Artifact 12 appears 1 time, and 1 is not a prime number.\n\n**Follow-up:** Can you optimize the prime checking step given that the maximum frequency is bounded by the length of the array?",
    editorialMarkdown: "## Frequency Counting and Prime Check\n\nWe can solve this problem in two main steps. First, we determine the frequency of each artifact ID using a hash map or dictionary, where the keys are the artifact IDs and the values are their counts. Second, we iterate over the values in our hash map to check if any frequency is a prime number. A number is prime if it is greater than 1 and has no divisors other than 1 and itself, which can be checked in O(sqrt{F}) time where F is the frequency.\n\nThe time complexity is O(N + U sqrt{N}), where N is the number of elements and U is the number of unique elements, because counting takes O(N) and checking primes takes up to O(sqrt{N}) per unique count. The space complexity is O(U) to store the frequencies.\n\nThe main trap solvers hit is forgetting that `1` is not a prime number, which causes the prime checking logic to incorrectly flag a frequency of `1` as prime.",
    referenceSolution: {
      JAVASCRIPT: "function solve(artifacts) {\n    const counts = new Map();\n    for (let i = 0; i < artifacts.length; i++) {\n        counts.set(artifacts[i], (counts.get(artifacts[i]) || 0) + 1);\n    }\n    for (let freq of counts.values()) {\n        if (freq < 2) continue;\n        let isPrime = true;\n        for (let i = 2; i * i <= freq; i++) {\n            if (freq % i === 0) {\n                isPrime = false;\n                break;\n            }\n        }\n        if (isPrime) return true;\n    }\n    return false;\n}",
      TYPESCRIPT: "function solve(artifacts: number[]): boolean {\n    const counts = new Map<number, number>();\n    for (let i = 0; i < artifacts.length; i++) {\n        counts.set(artifacts[i], (counts.get(artifacts[i]) || 0) + 1);\n    }\n    for (let freq of counts.values()) {\n        if (freq < 2) continue;\n        let isPrime = true;\n        for (let i = 2; i * i <= freq; i++) {\n            if (freq % i === 0) {\n                isPrime = false;\n                break;\n            }\n        }\n        if (isPrime) return true;\n    }\n    return false;\n}",
      PYTHON: "def solve(artifacts):\n    counts = {}\n    for a in artifacts:\n        counts[a] = counts.get(a, 0) + 1\n    for freq in counts.values():\n        if freq < 2:\n            continue\n        is_prime = True\n        i = 2\n        while i * i <= freq:\n            if freq % i == 0:\n                is_prime = False\n                break\n            i += 1\n        if is_prime:\n            return True\n    return False",
      JAVA: "    static boolean solve(int[] artifacts) {\n        java.util.Map<Integer, Integer> counts = new java.util.HashMap<>();\n        for (int a : artifacts) {\n            counts.put(a, counts.getOrDefault(a, 0) + 1);\n        }\n        for (int freq : counts.values()) {\n            if (freq < 2) continue;\n            boolean isPrime = true;\n            for (int i = 2; i * i <= freq; i++) {\n                if (freq % i == 0) {\n                    isPrime = false;\n                    break;\n                }\n            }\n            if (isPrime) return true;\n        }\n        return false;\n    }",
      CPP: "#include <vector>\n#include <unordered_map>\n\nbool solve(std::vector<int> artifacts) {\n    std::unordered_map<int, int> counts;\n    for (int a : artifacts) {\n        counts[a]++;\n    }\n    for (auto const& [key, freq] : counts) {\n        if (freq < 2) continue;\n        bool is_prime = true;\n        for (int i = 2; i * i <= freq; i++) {\n            if (freq % i == 0) {\n                is_prime = false;\n                break;\n            }\n        }\n        if (is_prime) return true;\n    }\n    return false;\n}",
      GO: "func solve(artifacts []int) bool {\n    counts := make(map[int]int)\n    for _, a := range artifacts {\n        counts[a]++\n    }\n    for _, freq := range counts {\n        if freq < 2 {\n            continue\n        }\n        isPrime := true\n        for i := 2; i*i <= freq; i++ {\n            if freq % i == 0 {\n                isPrime = false\n                break\n            }\n        }\n        if isPrime {\n            return true\n        }\n    }\n    return false\n}",
    },
    tests: [
      { stdin: "10 10 20 20 20 30", expectedStdout: "true", isSample: true },
      { stdin: "5 5 5 5", expectedStdout: "false", isSample: true },
      { stdin: "12", expectedStdout: "false" },
      { stdin: "1 1 1 1 1 1", expectedStdout: "false" },
      { stdin: "2 2", expectedStdout: "true" },
      { stdin: "3 3 3", expectedStdout: "true" },
      { stdin: "7 7 7 7 7 7 7 7 7 7", expectedStdout: "false" },
      { stdin: "9 9 9 9 9 9 9", expectedStdout: "true" },
    ],
  }),

  p({
    ...base,
    slug: "validate-building-block-set",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Validate Building Block Set",
    patternTags: ["array","frequency-count","hash-map","validation"],
    signatureId: "fn:ints->bool",
    avgSolveSeconds: 500,
    promptMarkdown: "A construction kit uses different sizes of building blocks. A set of blocks is considered \\\"complete\\\" if it contains exactly one block of every size from 1 to k-1, and exactly two blocks of the maximum size k, for some integer k ≥ 1.\n\nGiven an integer array `blocks` representing the sizes of the blocks in a set, return `true` if the set is complete, and `false` otherwise.\n\n**Constraints**\n- `1 <= blocks.length <= 100`\n- `1 <= blocks[i] <= 100`\n\n**Example 1**\n```\ninput:\n1 2 3 3\noutput: true\n```\nExplanation: The maximum value is 3. The array contains exactly one 1, one 2, and two 3s, which forms a complete set.\n\n**Example 2**\n```\ninput:\n1 2 3 4\noutput: false\n```\nExplanation: The maximum value is 4. The array is missing a second 4 and therefore is not complete.\n\n**Example 3**\n```\ninput:\n3 2 1 3\noutput: true\n```\nExplanation: The elements can appear in any order. The set contains 1, 2, and two 3s.\n\n**Follow-up:** Can you determine if the array is complete by sorting it instead of using a hash map?",
    editorialMarkdown: "## Analyzing Frequency Distributions\n\nTo check if the set of building blocks is complete, we first need to determine the target k, which is the maximum value in the array. Since a valid complete set must have exactly one block of every size from 1 to k-1 and exactly two blocks of size k, the array must have a length of exactly k + 1. If the length does not match, we can immediately return `false`.\n\nWe then count the frequency of each block size using a hash map or an array. Finally, we verify that each number from 1 to k-1 appears exactly once, and k appears exactly twice. If any condition fails, the array is not a complete set.\n\nThe time complexity is O(N) because we make a constant number of passes over the elements. The space complexity is O(N) to store the frequencies.\n\nThe main trap solvers hit is omitting the initial check on the array's total length, which might lead to falsely approving an array that contains extra unintended elements.",
    referenceSolution: {
      JAVASCRIPT: "function solve(blocks) {\n    if (blocks.length === 0) return false;\n    let max = 0;\n    for (let i = 0; i < blocks.length; i++) {\n        if (blocks[i] > max) max = blocks[i];\n    }\n    if (blocks.length !== max + 1) return false;\n    \n    const counts = new Map();\n    for (let i = 0; i < blocks.length; i++) {\n        counts.set(blocks[i], (counts.get(blocks[i]) || 0) + 1);\n    }\n    \n    for (let i = 1; i < max; i++) {\n        if (counts.get(i) !== 1) return false;\n    }\n    if (counts.get(max) !== 2) return false;\n    \n    return true;\n}",
      TYPESCRIPT: "function solve(blocks: number[]): boolean {\n    if (blocks.length === 0) return false;\n    let max = 0;\n    for (let i = 0; i < blocks.length; i++) {\n        if (blocks[i] > max) max = blocks[i];\n    }\n    if (blocks.length !== max + 1) return false;\n    \n    const counts = new Map<number, number>();\n    for (let i = 0; i < blocks.length; i++) {\n        counts.set(blocks[i], (counts.get(blocks[i]) || 0) + 1);\n    }\n    \n    for (let i = 1; i < max; i++) {\n        if (counts.get(i) !== 1) return false;\n    }\n    if (counts.get(max) !== 2) return false;\n    \n    return true;\n}",
      PYTHON: "def solve(blocks):\n    if not blocks:\n        return False\n    max_val = max(blocks)\n    if len(blocks) != max_val + 1:\n        return False\n        \n    counts = {}\n    for b in blocks:\n        counts[b] = counts.get(b, 0) + 1\n        \n    for i in range(1, max_val):\n        if counts.get(i, 0) != 1:\n            return False\n    if counts.get(max_val, 0) != 2:\n        return False\n        \n    return True",
      JAVA: "    static boolean solve(int[] blocks) {\n        if (blocks.length == 0) return false;\n        int max_val = 0;\n        for (int b : blocks) {\n            if (b > max_val) max_val = b;\n        }\n        if (blocks.length != max_val + 1) return false;\n        \n        java.util.Map<Integer, Integer> counts = new java.util.HashMap<>();\n        for (int b : blocks) {\n            counts.put(b, counts.getOrDefault(b, 0) + 1);\n        }\n        \n        for (int i = 1; i < max_val; i++) {\n            if (counts.getOrDefault(i, 0) != 1) return false;\n        }\n        if (counts.getOrDefault(max_val, 0) != 2) return false;\n        \n        return true;\n    }",
      CPP: "#include <vector>\n#include <unordered_map>\n#include <algorithm>\n\nbool solve(std::vector<int> blocks) {\n    if (blocks.empty()) return false;\n    int max_val = 0;\n    for (int b : blocks) {\n        if (b > max_val) max_val = b;\n    }\n    if (blocks.size() != max_val + 1) return false;\n    \n    std::unordered_map<int, int> counts;\n    for (int b : blocks) {\n        counts[b]++;\n    }\n    \n    for (int i = 1; i < max_val; i++) {\n        if (counts[i] != 1) return false;\n    }\n    if (counts[max_val] != 2) return false;\n    \n    return true;\n}",
      GO: "func solve(blocks []int) bool {\n    if len(blocks) == 0 {\n        return false\n    }\n    max_val := 0\n    for _, b := range blocks {\n        if b > max_val {\n            max_val = b\n        }\n    }\n    if len(blocks) != max_val + 1 {\n        return false\n    }\n    \n    counts := make(map[int]int)\n    for _, b := range blocks {\n        counts[b]++\n    }\n    \n    for i := 1; i < max_val; i++ {\n        if counts[i] != 1 {\n            return false\n        }\n    }\n    if counts[max_val] != 2 {\n        return false\n    }\n    \n    return true\n}",
    },
    tests: [
      { stdin: "1 2 3 3", expectedStdout: "true", isSample: true },
      { stdin: "1 2 3 4", expectedStdout: "false", isSample: true },
      { stdin: "3 2 1 3", expectedStdout: "true" },
      { stdin: "1 1", expectedStdout: "true" },
      { stdin: "1", expectedStdout: "false" },
      { stdin: "1 2 3 4 5 5 5", expectedStdout: "false" },
      { stdin: "1 3 3", expectedStdout: "false" },
      { stdin: "1 2 2 3 3", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "verify-cyclic-pressure-log",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Looped Playlist Durations",
    patternTags: ["array","arrays","linear-scan","circular-array","rotation"],
    signatureId: "fn:ints->bool",
    avgSolveSeconds: 400,
    promptMarkdown: "A music application plays a playlist of songs that were originally sorted by their track durations in non-decreasing order. Because the playlist is on loop, a user might start listening from an arbitrary song and continue through the end of the playlist back to the beginning.\n\nGiven an array of integers `readings` representing the durations of the songs in the order they were played, verify if this sequence could have come from a playlist that was sorted in non-decreasing order.\n\nReturn `true` if it could represent a valid looped sorted playlist, and `false` otherwise.\n\n**Constraints**\n- `1 <= readings.length <= 100`\n- `1 <= readings[i] <= 100`\n\n**Example 1**\n```\ninput:\n3 4 5 1 2\noutput: true\n```\nExplanation: The original sorted durations were 1, 2, 3, 4, 5. The user started listening from duration 3.\n\n**Example 2**\n```\ninput:\n2 1 3 4\noutput: false\n```\nExplanation: The sequence cannot be rotated to become sorted.\n\n**Example 3**\n```\ninput:\n1 2 3\noutput: true\n```\nExplanation: The durations are already sorted and haven't been shifted.\n\n**Follow-up:** Can you check the validity without modifying the array or using extra space?",
    editorialMarkdown: "## Checking for a Single Disruption\n\nIf the readings represent a continuously non-decreasing sequence that was split at most once, there can be at most one point in the array where a value is greater than the one immediately following it. Because the array is considered cyclical, we also have to compare the last element to the first element to see if there is a \\\"drop\\\" when wrapping around.\n\nBy iterating through the array and counting the number of times `readings[i] > readings[(i + 1) % N]`, we can determine the answer. If the drop count is 0 or 1, the sequence is valid. If it is 2 or more, it cannot be formed by splitting a single sorted sequence.\n\nThe time complexity is O(N) since we iterate through the array once. The space complexity is O(1) as we only maintain a counter.\n\nThe main trap solvers hit is forgetting to use the modulo operator to link the last element back to the first, resulting in failing to spot the final transition.",
    referenceSolution: {
      JAVASCRIPT: "function solve(readings) {\n    let drops = 0;\n    const n = readings.length;\n    if (n === 0) return true;\n    for (let i = 0; i < n; i++) {\n        if (readings[i] > readings[(i + 1) % n]) {\n            drops++;\n        }\n    }\n    return drops <= 1;\n}",
      TYPESCRIPT: "function solve(readings: number[]): boolean {\n    let drops = 0;\n    const n = readings.length;\n    if (n === 0) return true;\n    for (let i = 0; i < n; i++) {\n        if (readings[i] > readings[(i + 1) % n]) {\n            drops++;\n        }\n    }\n    return drops <= 1;\n}",
      PYTHON: "def solve(readings):\n    drops = 0\n    n = len(readings)\n    if n == 0:\n        return True\n    for i in range(n):\n        if readings[i] > readings[(i + 1) % n]:\n            drops += 1\n    return drops <= 1",
      JAVA: "    static boolean solve(int[] readings) {\n        int drops = 0;\n        int n = readings.length;\n        if (n == 0) return true;\n        for (int i = 0; i < n; i++) {\n            if (readings[i] > readings[(i + 1) % n]) {\n                drops++;\n            }\n        }\n        return drops <= 1;\n    }",
      CPP: "#include <vector>\n\nbool solve(std::vector<int> readings) {\n    int drops = 0;\n    int n = readings.size();\n    if (n == 0) return true;\n    for (int i = 0; i < n; i++) {\n        if (readings[i] > readings[(i + 1) % n]) {\n            drops++;\n        }\n    }\n    return drops <= 1;\n}",
      GO: "func solve(readings []int) bool {\n    drops := 0\n    n := len(readings)\n    if n == 0 {\n        return true\n    }\n    for i := 0; i < n; i++ {\n        if readings[i] > readings[(i+1)%n] {\n            drops++\n        }\n    }\n    return drops <= 1\n}",
    },
    tests: [
      { stdin: "3 4 5 1 2", expectedStdout: "true", isSample: true },
      { stdin: "2 1 3 4", expectedStdout: "false", isSample: true },
      { stdin: "1 2 3", expectedStdout: "true" },
      { stdin: "1 1 1", expectedStdout: "true" },
      { stdin: "1", expectedStdout: "true" },
      { stdin: "5 1 2 3 1 2", expectedStdout: "false" },
      { stdin: "2 1 2 2 2", expectedStdout: "true" },
      { stdin: "2 3 1 2 3 1", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "find-first-matching-broadcast",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Project Codename Locator",
    patternTags: ["string","strings","prefix","parsing"],
    signatureId: "fn:string,string->int",
    avgSolveSeconds: 400,
    promptMarkdown: "A tech company assigns internal codenames to its upcoming projects. The codenames are stored together in a single space-separated string known as `transmission`. An engineer wants to locate the first project whose codename begins with a specific sequence of letters, provided as `signal_prefix`.\n\nGiven the strings `transmission` and `signal_prefix`, return the **1-based** index of the first codename in the string that starts with the specified prefix. If no such codename exists, return `-1`.\n\n**Constraints**\n- `1 <= transmission.length <= 1000`\n- `1 <= signal_prefix.length <= 50`\n- `transmission` consists of lowercase English letters and single spaces. It does not have leading or trailing spaces.\n- `signal_prefix` consists of lowercase English letters.\n\n**Example 1**\n```\ninput:\nalpha bravo charlie\nbrav\noutput: 2\n```\nExplanation: The 2nd codename \"bravo\" starts with \"brav\".\n\n**Example 2**\n```\ninput:\ndelta echo\nfoxtrot\noutput: -1\n```\nExplanation: No codename starts with \"foxtrot\".\n\n**Example 3**\n```\ninput:\ngamma ray burst\nr\noutput: 2\n```\nExplanation: The 2nd codename \"ray\" starts with \"r\".\n\n**Follow-up:** Can you do this in O(N) time without allocating extra space for an array of all words?",
    editorialMarkdown: "## String Splitting and Prefix Checking\n\nTo solve this, we can split the space-separated `transmission` string into individual words using the space character as a delimiter. We then iterate through the array of words, checking if each word starts with the `signal_prefix`. As soon as we find a match, we return its 1-based index (i.e., `index + 1`). If we complete the loop without finding any match, we return `-1`.\n\nThe time complexity is O(N), where N is the length of the `transmission` string, as we traverse the string to split it and check prefixes. The space complexity is O(N) to store the array of words.\n\nThe main trap solvers hit is returning a 0-based index instead of a 1-based index, or searching for the prefix in the middle of a word rather than strictly at the beginning.",
    referenceSolution: {
      JAVASCRIPT: "function solve(transmission, signal_prefix) {\n    transmission = transmission.trim();\n    signal_prefix = signal_prefix.trim();\n    const words = transmission.split(\" \");\n    for (let i = 0; i < words.length; i++) {\n        if (words[i].startsWith(signal_prefix)) {\n            return i + 1;\n        }\n    }\n    return -1;\n}",
      TYPESCRIPT: "function solve(transmission: string, signal_prefix: string): number {\n    transmission = transmission.trim();\n    signal_prefix = signal_prefix.trim();\n    const words = transmission.split(\" \");\n    for (let i = 0; i < words.length; i++) {\n        if (words[i].startsWith(signal_prefix)) {\n            return i + 1;\n        }\n    }\n    return -1;\n}",
      PYTHON: "def solve(transmission, signal_prefix):\n    words = transmission.split(\" \")\n    for i, word in enumerate(words):\n        if word.startswith(signal_prefix):\n            return i + 1\n    return -1",
      JAVA: "    static int solve(String transmission, String signal_prefix) {\n        String[] words = transmission.split(\" \");\n        for (int i = 0; i < words.length; i++) {\n            if (words[i].startsWith(signal_prefix)) {\n                return i + 1;\n            }\n        }\n        return -1;\n    }",
      CPP: "#include <string>\n#include <sstream>\n\nint solve(std::string transmission, std::string signal_prefix) {\n    std::stringstream ss(transmission);\n    std::string word;\n    int index = 1;\n    while (ss >> word) {\n        if (word.rfind(signal_prefix, 0) == 0) {\n            return index;\n        }\n        index++;\n    }\n    return -1;\n}",
      GO: "func solve(transmission string, signal_prefix string) int {\n    words := strings.Split(transmission, \" \")\n    for i, word := range words {\n        if strings.HasPrefix(word, signal_prefix) {\n            return i + 1\n        }\n    }\n    return -1\n}",
    },
    tests: [
      { stdin: "alpha bravo charlie\nbrav", expectedStdout: "2", isSample: true },
      { stdin: "delta echo\nfoxtrot", expectedStdout: "-1", isSample: true },
      { stdin: "gamma ray burst\nr", expectedStdout: "2" },
      { stdin: "a\na", expectedStdout: "1" },
      { stdin: "apple banana\nbananarama", expectedStdout: "-1" },
      { stdin: "the quick brown fox\nbrown", expectedStdout: "3" },
      { stdin: "hello world\noracle", expectedStdout: "-1" },
      { stdin: "start beginning\nstar", expectedStdout: "1" },
    ],
  }),
];
