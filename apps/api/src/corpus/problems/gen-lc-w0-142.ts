import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w0-142` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W0_142_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "recent-weather-readings",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "SLIDING_WINDOW",
    title: "Recent Weather Readings",
    patternTags: ["array","sliding-window","queue"],
    signatureId: "fn:ints->ints",
    avgSolveSeconds: 540,
    promptMarkdown: "A weather station receives sequential temperature readings. You are given an array of strictly increasing integers `timestamps` representing the time (in milliseconds) each reading was received. \n\nFor each reading, you need to determine the number of readings that occurred in the previous 1000 milliseconds (including the current reading itself). \n\nReturn an integer array of these counts.\n\n**Constraints**\n- `1 ≤ timestamps.length ≤ 10^4`\n- `1 ≤ timestamps[i] ≤ 10^9`\n- `timestamps` is strictly increasing.\n\n**Example 1**\n```\ninput:\n1 100 1001 1100\noutput:\n1 2 3 3\n```\n*Explanation: \n- At 1, readings in [-999, 1] are [1] (count: 1).\n- At 100, readings in [-900, 100] are [1, 100] (count: 2).\n- At 1001, readings in [1, 1001] are [1, 100, 1001] (count: 3).\n- At 1100, readings in [100, 1100] are [100, 1001, 1100] (count: 3).*\n\n**Example 2**\n```\ninput:\n1 2000 4000 6000\noutput:\n1 1 1 1\n```\n*Explanation: Each reading is more than 1000ms apart, so they only count themselves.*\n\n**Example 3**\n```\ninput:\n1 2 3 4 5\noutput:\n1 2 3 4 5\n```\n*Explanation: All readings fall within 1000ms of each other, so the count increases by 1 each time.*\n\n**Follow-up**\nCan you determine the count for each reading in O(1) amortized time?",
    editorialMarkdown: "## Recent Weather Readings\n\nThe problem requires us to count how many readings occurred in the past 1000 milliseconds for every given timestamp. Since the timestamps are strictly increasing, this perfectly fits a sliding window (or two pointers) approach.\n\nWe can maintain a `left` pointer representing the earliest reading that falls within the 1000-millisecond window of the current `right` reading. As we iterate `right` through the timestamps, we continuously advance the `left` pointer as long as `timestamps[right] - timestamps[left] > 1000`. \n\nBecause the `left` pointer only moves forward and never resets, the time complexity remains very efficient. The number of valid readings in the current window is simply `right - left + 1`.\n\n**Trap**: Avoid scanning backwards from `right` for every timestamp. In the worst case (where all readings are within 1000ms), this would take O(N^2) time.\n\n**Complexity:**\n- **Time:** O(N), where N is the length of the `timestamps` array. Both pointers only traverse the array once.\n- **Space:** O(1) extra space (excluding the output array).",
    referenceSolution: {
      JAVASCRIPT: "function solve(timestamps) {\n    let ans = [];\n    let left = 0;\n    for (let right = 0; right < timestamps.length; right++) {\n        while (timestamps[right] - timestamps[left] > 1000) {\n            left++;\n        }\n        ans.push(right - left + 1);\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(timestamps: number[]): number[] {\n    let ans: number[] = [];\n    let left = 0;\n    for (let right = 0; right < timestamps.length; right++) {\n        while (timestamps[right] - timestamps[left] > 1000) {\n            left++;\n        }\n        ans.push(right - left + 1);\n    }\n    return ans;\n}",
      PYTHON: "def solve(timestamps):\n    ans = []\n    left = 0\n    for right in range(len(timestamps)):\n        while timestamps[right] - timestamps[left] > 1000:\n            left += 1\n        ans.append(right - left + 1)\n    return ans",
      JAVA: "    static int[] solve(int[] timestamps) {\n        int[] ans = new int[timestamps.length];\n        int left = 0;\n        for (int right = 0; right < timestamps.length; right++) {\n            while (timestamps[right] - timestamps[left] > 1000) {\n                left++;\n            }\n            ans[right] = right - left + 1;\n        }\n        return ans;\n    }",
      CPP: "#include <vector>\n\nstd::vector<int> solve(std::vector<int> timestamps) {\n    std::vector<int> ans;\n    int left = 0;\n    for (int right = 0; right < timestamps.size(); right++) {\n        while (timestamps[right] - timestamps[left] > 1000) {\n            left++;\n        }\n        ans.push_back(right - left + 1);\n    }\n    return ans;\n}",
      GO: "func solve(timestamps []int) []int {\n    ans := make([]int, len(timestamps))\n    left := 0\n    for right := 0; right < len(timestamps); right++ {\n        for timestamps[right] - timestamps[left] > 1000 {\n            left++\n        }\n        ans[right] = right - left + 1\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "1 100 1001 1100", expectedStdout: "1 2 3 3", isSample: true },
      { stdin: "1 2000 4000 6000", expectedStdout: "1 1 1 1", isSample: true },
      { stdin: "1 2 3 4 5", expectedStdout: "1 2 3 4 5" },
      { stdin: "100 200 1200 1201", expectedStdout: "1 2 2 2" },
      { stdin: "1", expectedStdout: "1" },
      { stdin: "1 1000", expectedStdout: "1 2" },
      { stdin: "1 1002", expectedStdout: "1 1" },
      { stdin: "10 20 30 1010", expectedStdout: "1 2 3 4" },
    ],
  }),

  p({
    ...base,
    slug: "critical-failure-consequences",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Critical Failure Consequences",
    patternTags: ["string","array","parsing"],
    signatureId: "fn:string->strings",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing a system log consisting of words separated by single spaces. You need to identify what events happen immediately following a specific sequence of errors. \n\nGiven a string `log`, find every word that immediately follows the exact two-word sequence `\"critical\" \"failure\"`. \n\nReturn an array of these words in the order they appear in the log.\n\n**Constraints**\n- `1 ≤ log.length ≤ 1000`\n- `log` consists of lowercase English letters and spaces.\n- There are no leading or trailing spaces, and words are separated by a single space.\n\n**Example 1**\n```\ninput:\nsystem critical failure database restart critical failure network offline\noutput:\ndatabase network\n```\n*Explanation: The sequence \"critical failure\" is followed by \"database\" and then later by \"network\".*\n\n**Example 2**\n```\ninput:\ncritical failure critical failure critical failure\noutput:\ncritical critical\n```\n*Explanation: The first \"critical failure\" is followed by \"critical\". The second \"critical failure\" is also followed by \"critical\".*\n\n**Example 3**\n```\ninput:\nno errors here today\noutput:\n\n```\n*Explanation: The sequence does not appear in the log.*\n\n**Follow-up**\nCan you extract the words in O(N) time?",
    editorialMarkdown: "## Critical Failure Consequences\n\nThe objective is to find every word in a space-separated string that immediately follows the two words `\"critical\"` and `\"failure\"`.\n\nThe simplest and most effective approach is to first split the input string by spaces to get an array of words. Then, iterate through the array from the first word up to the third-to-last word. At each step `i`, check if `words[i]` equals `\"critical\"` and `words[i+1]` equals `\"failure\"`. If both match, the word at `words[i+2]` is a consequence, and we append it to our result array.\n\n**Trap**: Make sure the loop ends at `length - 2` to avoid out-of-bounds errors when checking `words[i+2]`. Also, be careful to match exact words, not substrings.\n\n**Complexity:**\n- **Time:** O(N), where N is the length of the string. Splitting the string and iterating through the words both take linear time.\n- **Space:** O(N) to store the array of split words and the output array.",
    referenceSolution: {
      JAVASCRIPT: "function solve(log) {\n    let words = log.split(' ');\n    let ans = [];\n    for (let i = 0; i < words.length - 2; i++) {\n        if (words[i] === \"critical\" && words[i+1] === \"failure\") {\n            ans.push(words[i+2]);\n        }\n    }\n    return ans;\n}",
      TYPESCRIPT: "function solve(log: string): string[] {\n    let words = log.split(' ');\n    let ans: string[] = [];\n    for (let i = 0; i < words.length - 2; i++) {\n        if (words[i] === \"critical\" && words[i+1] === \"failure\") {\n            ans.push(words[i+2]);\n        }\n    }\n    return ans;\n}",
      PYTHON: "def solve(log):\n    words = log.split(' ')\n    ans = []\n    for i in range(len(words) - 2):\n        if words[i] == \"critical\" and words[i+1] == \"failure\":\n            ans.append(words[i+2])\n    return ans",
      JAVA: "    static String[] solve(String log) {\n        String[] words = log.split(\" \");\n        java.util.List<String> ans = new java.util.ArrayList<>();\n        if (words.length < 2) return new String[0];\n        for (int i = 0; i < words.length - 2; i++) {\n            if (words[i].equals(\"critical\") && words[i+1].equals(\"failure\")) {\n                ans.add(words[i+2]);\n            }\n        }\n        return ans.toArray(new String[0]);\n    }",
      CPP: "#include <string>\n#include <vector>\n#include <sstream>\n\nstd::vector<std::string> solve(std::string log) {\n    std::vector<std::string> words;\n    std::string word;\n    std::stringstream ss(log);\n    while (ss >> word) {\n        words.push_back(word);\n    }\n    std::vector<std::string> ans;\n    if (words.size() < 2) return ans;\n    for (size_t i = 0; i < words.size() - 2; i++) {\n        if (words[i] == \"critical\" && words[i+1] == \"failure\") {\n            ans.push_back(words[i+2]);\n        }\n    }\n    return ans;\n}",
      GO: "func solve(log string) []string {\n    words := strings.Split(log, \" \")\n    var ans []string\n    if len(words) < 2 {\n        return ans\n    }\n    for i := 0; i < len(words) - 2; i++ {\n        if words[i] == \"critical\" && words[i+1] == \"failure\" {\n            ans = append(ans, words[i+2])\n        }\n    }\n    return ans\n}",
    },
    tests: [
      { stdin: "system critical failure database restart critical failure network offline", expectedStdout: "database network", isSample: true },
      { stdin: "critical failure critical failure critical failure", expectedStdout: "critical critical", isSample: true },
      { stdin: "no errors here today", expectedStdout: "" },
      { stdin: "critical failure", expectedStdout: "" },
      { stdin: "critical failure system critical failure", expectedStdout: "system" },
      { stdin: "a b critical failure c d critical failure e", expectedStdout: "c e" },
      { stdin: "critical failure critical failure x", expectedStdout: "critical x" },
      { stdin: "error critical failure one critical failure two", expectedStdout: "one two" },
    ],
  }),
];
