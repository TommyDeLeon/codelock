import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w4-060` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W4_060_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "highest-frequency-signal-pulse",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Highest Frequency Signal Pulse",
    patternTags: ["string","counting","frequency-count"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing a string of signal pulses received from a deep-space probe. Each character in the string represents a different pulse type.\n\nDetermine the frequency of the most common pulse type and return that count.\n\n**Constraints**\n- `1 <= pulses.length <= 40`\n- `pulses` consists of printable ASCII characters.\n\n**Example 1**\n```\ninput:\naabccba\noutput:\n3\n```\n*Explanation: The pulse 'a' appears 3 times, which is the maximum.* \n\n**Example 2**\n```\ninput:\nxyz\noutput:\n1\n```\n*Explanation: All pulses appear exactly once.*\n\n**Example 3**\n```\ninput:\nooooo\noutput:\n5\n```\n*Explanation: The pulse 'o' appears 5 times.*\n\n**Follow-up**\nCan you solve this in O(N) time and O(1) space?",
    editorialMarkdown: "## Highest Frequency Signal Pulse\n\nThe intended approach is to count the occurrences of each pulse type using an array or a hash map. After counting, we find the maximum frequency. This is a classic frequency counting problem.\n\n**Trap**: Failing to track the maximum correctly or overcomplicating with sorting instead of a single pass of counting.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string.\n- **Space:** O(1) if we use a fixed-size array for ASCII characters.",
    referenceSolution: {
      JAVASCRIPT: "function solve(pulses) {\n    let counts = {};\n    let maxCount = 0;\n    for(let c of pulses) {\n        counts[c] = (counts[c] || 0) + 1;\n        if(counts[c] > maxCount) maxCount = counts[c];\n    }\n    return maxCount;\n}",
      TYPESCRIPT: "function solve(pulses: string): number {\n    let counts: Record<string, number> = {};\n    let maxCount = 0;\n    for(let c of pulses) {\n        counts[c] = (counts[c] || 0) + 1;\n        if(counts[c] > maxCount) maxCount = counts[c];\n    }\n    return maxCount;\n}",
      PYTHON: "def solve(pulses):\n    counts = {}\n    max_count = 0\n    for c in pulses:\n        counts[c] = counts.get(c, 0) + 1\n        if counts[c] > max_count:\n            max_count = counts[c]\n    return max_count",
      JAVA: "    static int solve(String pulses) {\n        int[] counts = new int[256];\n        int maxCount = 0;\n        for(char c: pulses.toCharArray()) {\n            counts[c]++;\n            if(counts[c] > maxCount) maxCount = counts[c];\n        }\n        return maxCount;\n    }",
      CPP: "int solve(string pulses) {\n    vector<int> counts(256, 0);\n    int maxCount = 0;\n    for(char c: pulses) {\n        counts[c]++;\n        if(counts[c] > maxCount) maxCount = counts[c];\n    }\n    return maxCount;\n}",
      GO: "func solve(pulses string) int {\n    counts := make(map[rune]int)\n    maxCount := 0\n    for _, c := range pulses {\n        counts[c]++\n        if counts[c] > maxCount {\n            maxCount = counts[c]\n        }\n    }\n    return maxCount\n}",
    },
    tests: [
      { stdin: "aabccba", expectedStdout: "3", isSample: true },
      { stdin: "xyz", expectedStdout: "1", isSample: true },
      { stdin: "ooooo", expectedStdout: "5" },
      { stdin: "a", expectedStdout: "1" },
      { stdin: "bbaacc", expectedStdout: "2" },
      { stdin: "abacabad", expectedStdout: "4" },
      { stdin: "qwertyuiop", expectedStdout: "1" },
      { stdin: "aaaaaaaaaaaaaaa", expectedStdout: "15" },
    ],
  }),

  p({
    ...base,
    slug: "emp-shield-blasts",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Chain Lightning Attacks",
    patternTags: ["array","distinct-values","counting"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 450,
    promptMarkdown: "You are facing a group of monsters with health points represented by an array of integers `healths`.\n\nA chain lightning spell cast at the group will reduce the health of all alive (health greater than zero) monsters by the exact amount of the currently lowest health among alive monsters. Once a monster's health reaches 0, it is defeated.\n\nReturn the number of chain lightning spells required to defeat all monsters.\n\n**Constraints**\n- `1 <= healths.length <= 40`\n- `0 <= healths[i] <= 100`\n\n**Example 1**\n```\ninput:\n1 5 0 3 5\noutput:\n3\n```\n*Explanation: \nSpell 1: lowest alive health is 1. Healths become: 0 4 0 2 4.\nSpell 2: lowest alive health is 2. Healths become: 0 2 0 0 2.\nSpell 3: lowest alive health is 2. Healths become: 0 0 0 0 0.*\n\n**Example 2**\n```\ninput:\n0 0 0\noutput:\n0\n```\n*Explanation: All monsters are already defeated, requiring zero spells.*\n\n**Example 3**\n```\ninput:\n2 2 2\noutput:\n1\n```\n*Explanation: One spell of damage 2 reduces all healths to 0.*\n\n**Follow-up**\nCan you determine the answer in O(N) time?",
    editorialMarkdown: "## EMP Shield Blasts\n\nThe intended approach is to realize that each EMP blast eliminates exactly one unique non-zero shield value from the array. Therefore, the problem reduces to finding the number of distinct positive integers in the input.\n\n**Trap**: Trying to manually simulate the subtraction process step by step, which is inefficient and unnecessary. Just count the unique non-zero values.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the array.\n- **Space:** O(N) to store the unique values in a set.",
    referenceSolution: {
      JAVASCRIPT: "function solve(shields) {\n    let unique = new Set(shields);\n    unique.delete(0);\n    return unique.size;\n}",
      TYPESCRIPT: "function solve(shields: number[]): number {\n    let unique = new Set<number>(shields);\n    unique.delete(0);\n    return unique.size;\n}",
      PYTHON: "def solve(shields):\n    return len(set(s for s in shields if s > 0))",
      JAVA: "    static int solve(int[] shields) {\n        boolean[] seen = new boolean[101];\n        int count = 0;\n        for(int s: shields) {\n            if(s > 0 && !seen[s]) {\n                seen[s] = true;\n                count++;\n            }\n        }\n        return count;\n    }",
      CPP: "int solve(vector<int> shields) {\n    unordered_set<int> uniqueShields;\n    for(int s: shields) {\n        if(s > 0) uniqueShields.insert(s);\n    }\n    return uniqueShields.size();\n}",
      GO: "func solve(shields []int) int {\n    unique := make(map[int]bool)\n    count := 0\n    for _, s := range shields {\n        if s > 0 && !unique[s] {\n            unique[s] = true\n            count++\n        }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "1 5 0 3 5", expectedStdout: "3", isSample: true },
      { stdin: "0 0 0", expectedStdout: "0", isSample: true },
      { stdin: "2 2 2", expectedStdout: "1" },
      { stdin: "0", expectedStdout: "0" },
      { stdin: "5", expectedStdout: "1" },
      { stdin: "1 2 3 4 5", expectedStdout: "5" },
      { stdin: "10 0 10 0 10", expectedStdout: "1" },
      { stdin: "1 1 2 2 3 3 0", expectedStdout: "3" },
    ],
  }),

  p({
    ...base,
    slug: "max-temperature-trend-count",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Maximum Transaction Type Count",
    patternTags: ["array","counting"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 350,
    promptMarkdown: "You are given an array of financial records `transactions` logged over a period, sorted in non-decreasing order. \n\nNegative values indicate withdrawals, while positive values indicate deposits. A value of zero means no money was moved on that record.\n\nReturn the maximum between the total number of withdrawals and the total number of deposits.\n\n**Constraints**\n- `1 <= transactions.length <= 40`\n- `transactions` is sorted in non-decreasing order.\n\n**Example 1**\n```\ninput:\n-3 -1 0 2 5\noutput:\n2\n```\n*Explanation: There are 2 withdrawals (-3, -1) and 2 deposits (2, 5). The maximum of 2 and 2 is 2.*\n\n**Example 2**\n```\ninput:\n0 0 1 2\noutput:\n2\n```\n*Explanation: There are 0 withdrawals and 2 deposits. The maximum is 2.*\n\n**Example 3**\n```\ninput:\n-5 -4 -3\noutput:\n3\n```\n*Explanation: There are 3 withdrawals and 0 deposits. The maximum is 3.*\n\n**Follow-up**\nBecause the array is sorted, could you theoretically find the answer in O(log N) time using binary search?",
    editorialMarkdown: "## Max Temperature Trend Count\n\nThe intended approach is to iterate through the given sorted array and count the strictly negative elements (cooling days) and strictly positive elements (heating days), then return the maximum of these two counts. \n\n**Trap**: Be careful not to count days with a 0 change as either cooling or heating.\n\n**Complexity:**\n- **Time:** O(N) or O(log N). Given the constraints, a linear scan is perfectly fine.\n- **Space:** O(1) as we only need two counters.",
    referenceSolution: {
      JAVASCRIPT: "function solve(trends) {\n    let cool = 0, heat = 0;\n    for(let t of trends) {\n        if(t < 0) cool++;\n        if(t > 0) heat++;\n    }\n    return Math.max(cool, heat);\n}",
      TYPESCRIPT: "function solve(trends: number[]): number {\n    let cool = 0, heat = 0;\n    for(let t of trends) {\n        if(t < 0) cool++;\n        if(t > 0) heat++;\n    }\n    return Math.max(cool, heat);\n}",
      PYTHON: "def solve(trends):\n    cool = sum(1 for t in trends if t < 0)\n    heat = sum(1 for t in trends if t > 0)\n    return max(cool, heat)",
      JAVA: "    static int solve(int[] trends) {\n        int cool = 0, heat = 0;\n        for(int t: trends) {\n            if(t < 0) cool++;\n            else if(t > 0) heat++;\n        }\n        return Math.max(cool, heat);\n    }",
      CPP: "int solve(vector<int> trends) {\n    int cool = 0, heat = 0;\n    for(int t: trends) {\n        if(t < 0) cool++;\n        else if(t > 0) heat++;\n    }\n    return max(cool, heat);\n}",
      GO: "func solve(trends []int) int {\n    cool, heat := 0, 0\n    for _, t := range trends {\n        if t < 0 {\n            cool++\n        } else if t > 0 {\n            heat++\n        }\n    }\n    if cool > heat {\n        return cool\n    }\n    return heat\n}",
    },
    tests: [
      { stdin: "-3 -1 0 2 5", expectedStdout: "2", isSample: true },
      { stdin: "0 0 1 2", expectedStdout: "2", isSample: true },
      { stdin: "-5 -4 -3", expectedStdout: "3" },
      { stdin: "0 0 0", expectedStdout: "0" },
      { stdin: "-2 -1 0 0", expectedStdout: "2" },
      { stdin: "1 2 3 4", expectedStdout: "4" },
      { stdin: "-1 1", expectedStdout: "1" },
      { stdin: "-100", expectedStdout: "1" },
    ],
  }),

  p({
    ...base,
    slug: "maximum-turret-range-gap",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Maximum Elevation Difference",
    patternTags: ["array","circular","difference"],
    signatureId: "fn:ints->int",
    avgSolveSeconds: 350,
    promptMarkdown: "A series of race checkpoints are placed along a circular track. You are provided with an array `elevations` that dictates the height of each checkpoint in sequence.\n\nBecause the track loops, the final checkpoint in the array is directly connected to the first one. Determine the maximum absolute difference in height between any two adjacent checkpoints.\n\n**Constraints**\n- `2 <= elevations.length <= 40`\n- `-1000 <= elevations[i] <= 1000`\n\n**Example 1**\n```\ninput:\n1 2 4\noutput:\n3\n```\n*Explanation: \nThe adjacent differences are: |1-2|=1, |2-4|=2, and |4-1|=3. The maximum difference is 3.*\n\n**Example 2**\n```\ninput:\n5 5 5\noutput:\n0\n```\n*Explanation: All checkpoints are at the same elevation, yielding a maximum difference of 0.*\n\n**Example 3**\n```\ninput:\n1 10\noutput:\n9\n```\n*Explanation: The only adjacent pair is 1 and 10, resulting in a difference of 9.*\n\n**Follow-up**\nCan you implement the solution cleanly using modulo arithmetic to handle the wrap-around check?",
    editorialMarkdown: "## Maximum Turret Range Gap\n\nThe intended approach is to iterate through the array and compute the absolute difference between each adjacent pair. Since the array is circular, you must also compute the difference between the first and last element.\n\n**Trap**: Forgetting to check the wrap-around difference between the last and first element.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the ranges array.\n- **Space:** O(1) since we only maintain the maximum difference seen so far.",
    referenceSolution: {
      JAVASCRIPT: "function solve(ranges) {\n    let maxDiff = 0;\n    let n = ranges.length;\n    for(let i = 0; i < n; i++) {\n        let diff = Math.abs(ranges[i] - ranges[(i + 1) % n]);\n        if(diff > maxDiff) maxDiff = diff;\n    }\n    return maxDiff;\n}",
      TYPESCRIPT: "function solve(ranges: number[]): number {\n    let maxDiff = 0;\n    let n = ranges.length;\n    for(let i = 0; i < n; i++) {\n        let diff = Math.abs(ranges[i] - ranges[(i + 1) % n]);\n        if(diff > maxDiff) maxDiff = diff;\n    }\n    return maxDiff;\n}",
      PYTHON: "def solve(ranges):\n    n = len(ranges)\n    return max(abs(ranges[i] - ranges[(i + 1) % n]) for i in range(n))",
      JAVA: "    static int solve(int[] ranges) {\n        int maxDiff = 0;\n        int n = ranges.length;\n        for(int i = 0; i < n; i++) {\n            int diff = Math.abs(ranges[i] - ranges[(i + 1) % n]);\n            if(diff > maxDiff) maxDiff = diff;\n        }\n        return maxDiff;\n    }",
      CPP: "int solve(vector<int> ranges) {\n    int maxDiff = 0;\n    int n = ranges.size();\n    for(int i = 0; i < n; i++) {\n        int diff = abs(ranges[i] - ranges[(i + 1) % n]);\n        if(diff > maxDiff) maxDiff = diff;\n    }\n    return maxDiff;\n}",
      GO: "func solve(ranges []int) int {\n    maxDiff := 0\n    n := len(ranges)\n    for i := 0; i < n; i++ {\n        diff := ranges[i] - ranges[(i+1)%n]\n        if diff < 0 {\n            diff = -diff\n        }\n        if diff > maxDiff {\n            maxDiff = diff\n        }\n    }\n    return maxDiff\n}",
    },
    tests: [
      { stdin: "1 2 4", expectedStdout: "3", isSample: true },
      { stdin: "5 5 5", expectedStdout: "0", isSample: true },
      { stdin: "1 10", expectedStdout: "9" },
      { stdin: "10 1", expectedStdout: "9" },
      { stdin: "3 6 15 1", expectedStdout: "14" },
      { stdin: "0 0 0 0", expectedStdout: "0" },
      { stdin: "100 -100 100", expectedStdout: "200" },
      { stdin: "-5 5", expectedStdout: "10" },
    ],
  }),

  p({
    ...base,
    slug: "longest-valid-gene-sequence",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "SLIDING_WINDOW",
    title: "Longest Harmonious Melody",
    patternTags: ["string","sliding-window","frequency-count"],
    signatureId: "fn:string->int",
    avgSolveSeconds: 600,
    promptMarkdown: "You are given a string `melody` that represents a sequence of musical notes played in a song. \n\nA section of the song is considered a \"harmonious sequence\" if no single note (character) is played more than twice within it. Return the maximum length of a harmonious contiguous sequence found in `melody`.\n\n**Constraints**\n- `1 <= melody.length <= 40`\n- `melody` consists only of lowercase English letters.\n\n**Example 1**\n```\ninput:\nbcbbbcba\noutput:\n4\n```\n*Explanation: The longest harmonious sequences are \"bcba\" and \"cbb\". Since \"bcba\" is of length 4 (containing two 'b's, one 'c', one 'a') and \"cbb\" is only length 3, the maximum length is 4.*\n\n**Example 2**\n```\ninput:\naaaa\noutput:\n2\n```\n*Explanation: A harmonious sequence can include at most two 'a's, making \"aa\" the longest valid portion.*\n\n**Example 3**\n```\ninput:\nabcddcba\noutput:\n8\n```\n*Explanation: Every note appears exactly twice in the whole sequence, meaning the entire string is harmonious.*\n\n**Follow-up**\nCan you solve this efficiently in O(N) time by using a sliding window?",
    editorialMarkdown: "## Longest Valid Gene Sequence\n\nThe intended approach is to find the maximum length substring where no character appears more than twice. Because the constraints are small, iterating over all starting points and extending a window until a character count exceeds 2 is acceptable. \n\n**Trap**: Failing to break out of the inner loop immediately when the limit is exceeded.\n\n**Complexity:**\n- **Time:** O(N^2) for a simple nested loop, or O(N) using an optimal sliding window.\n- **Space:** O(1) since the alphabet is limited (ASCII).",
    referenceSolution: {
      JAVASCRIPT: "function solve(dna) {\n    let maxLen = 0;\n    for(let i = 0; i < dna.length; i++) {\n        let counts = {};\n        for(let j = i; j < dna.length; j++) {\n            counts[dna[j]] = (counts[dna[j]] || 0) + 1;\n            if(counts[dna[j]] > 2) break;\n            if(j - i + 1 > maxLen) maxLen = j - i + 1;\n        }\n    }\n    return maxLen;\n}",
      TYPESCRIPT: "function solve(dna: string): number {\n    let maxLen = 0;\n    for(let i = 0; i < dna.length; i++) {\n        let counts: Record<string, number> = {};\n        for(let j = i; j < dna.length; j++) {\n            counts[dna[j]] = (counts[dna[j]] || 0) + 1;\n            if(counts[dna[j]] > 2) break;\n            if(j - i + 1 > maxLen) maxLen = j - i + 1;\n        }\n    }\n    return maxLen;\n}",
      PYTHON: "def solve(dna):\n    max_len = 0\n    for i in range(len(dna)):\n        counts = {}\n        for j in range(i, len(dna)):\n            counts[dna[j]] = counts.get(dna[j], 0) + 1\n            if counts[dna[j]] > 2:\n                break\n            max_len = max(max_len, j - i + 1)\n    return max_len",
      JAVA: "    static int solve(String dna) {\n        int maxLen = 0;\n        for(int i = 0; i < dna.length(); i++) {\n            int[] counts = new int[256];\n            for(int j = i; j < dna.length(); j++) {\n                counts[dna.charAt(j)]++;\n                if(counts[dna.charAt(j)] > 2) break;\n                if(j - i + 1 > maxLen) maxLen = j - i + 1;\n            }\n        }\n        return maxLen;\n    }",
      CPP: "int solve(string dna) {\n    int maxLen = 0;\n    for(int i = 0; i < dna.length(); i++) {\n        vector<int> counts(256, 0);\n        for(int j = i; j < dna.length(); j++) {\n            counts[dna[j]]++;\n            if(counts[dna[j]] > 2) break;\n            if(j - i + 1 > maxLen) maxLen = j - i + 1;\n        }\n    }\n    return maxLen;\n}",
      GO: "func solve(dna string) int {\n    maxLen := 0\n    for i := 0; i < len(dna); i++ {\n        counts := make(map[byte]int)\n        for j := i; j < len(dna); j++ {\n            counts[dna[j]]++\n            if counts[dna[j]] > 2 {\n                break\n            }\n            if j - i + 1 > maxLen {\n                maxLen = j - i + 1\n            }\n        }\n    }\n    return maxLen\n}",
    },
    tests: [
      { stdin: "bcbbbcba", expectedStdout: "4", isSample: true },
      { stdin: "aaaa", expectedStdout: "2", isSample: true },
      { stdin: "abcddcba", expectedStdout: "8" },
      { stdin: "abcdef", expectedStdout: "6" },
      { stdin: "aabbcc", expectedStdout: "6" },
      { stdin: "a", expectedStdout: "1" },
      { stdin: "abaccc", expectedStdout: "5" },
      { stdin: "xyzxyzxyz", expectedStdout: "6" },
    ],
  }),
];
