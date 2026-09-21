import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-018` (anchored to a public problem index; metadata only).
 *
 * Machine-drafted on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_018_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "verify-system-acronym",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Verify System Acronym",
    patternTags: ["string","simulation"],
    signatureId: "fn:string,string->bool",
    avgSolveSeconds: 400,
    promptMarkdown: "You are debugging a legacy networking system that labels daily events with a space-separated log string `logs`. The system generates a condensed event `signature` string by taking the first letter of each word in the `logs`.\n\nGiven the string `logs` and a string `signature`, return `true` if `signature` is exactly the condensed version of `logs`, and `false` otherwise.\n\n**Constraints**\n- `1 <= logs.length <= 1000`\n- `logs` consists of lowercase English letters and single spaces. It does not start or end with a space.\n- `1 <= signature.length <= 100`\n- `signature` consists of lowercase English letters.\n\n**Example 1**\n```\ninput:\nserver error timeout\nset\noutput: true\n```\nExplanation: The first letters are 's', 'e', and 't', which form \"set\".\n\n**Example 2**\n```\ninput:\nreboot database backup\nrdb\noutput: true\n```\nExplanation: The first letters are 'r', 'd', and 'b', forming \"rdb\".\n\n**Example 3**\n```\ninput:\nstart connection\nstop\noutput: false\n```\nExplanation: The first letters form \"sc\", which does not match \"stop\".\n\n**Follow-up:** Can you solve this without explicitly splitting the string into an array of words?",
    editorialMarkdown: "## Extracting Initial Letters\n\nTo verify if the given signature matches the system logs, we need to extract the first letter of each word in the space-separated string `logs`.\n\nWe can split the string by spaces, construct a new string using the first character of each token, and then check if the constructed string exactly matches the `signature`.\n\nThe time complexity is O(N), where N is the length of `logs`, and space complexity is O(N) to store the tokens and the newly formed string.\n\nThe main trap solvers hit is failing to handle consecutive spaces if they iterate manually without proper tokenization, though most built-in split functions or simple scanners handle this cleanly.",
    referenceSolution: {
      JAVASCRIPT: "function solve(logs, signature) {\n    const words = logs.split(' ');\n    let acronym = '';\n    for (const w of words) {\n        acronym += w[0];\n    }\n    return acronym === signature;\n}",
      TYPESCRIPT: "function solve(logs: string, signature: string): boolean {\n    const words = logs.split(' ');\n    let acronym = '';\n    for (const w of words) {\n        acronym += w[0];\n    }\n    return acronym === signature;\n}",
      PYTHON: "def solve(logs, signature):\n    words = logs.split(' ')\n    acronym = \"\".join([w[0] for w in words])\n    return acronym == signature",
      JAVA: "    static boolean solve(String logs, String signature) {\n        StringBuilder sb = new StringBuilder();\n        if (logs.length() > 0) {\n            sb.append(logs.charAt(0));\n        }\n        for (int i = 1; i < logs.length(); i++) {\n            if (logs.charAt(i - 1) == ' ' && logs.charAt(i) != ' ') {\n                sb.append(logs.charAt(i));\n            }\n        }\n        return sb.toString().equals(signature);\n    }",
      CPP: "#include <string>\n\nbool solve(std::string logs, std::string signature) {\n    std::string acronym = \"\";\n    if (logs.length() > 0) {\n        acronym += logs[0];\n    }\n    for (int i = 1; i < logs.length(); i++) {\n        if (logs[i - 1] == ' ' && logs[i] != ' ') {\n            acronym += logs[i];\n        }\n    }\n    return acronym == signature;\n}",
      GO: "func solve(logs string, signature string) bool {\n    acronym := \"\"\n    if len(logs) > 0 {\n        acronym += string(logs[0])\n    }\n    for i := 1; i < len(logs); i++ {\n        if logs[i-1] == ' ' && logs[i] != ' ' {\n            acronym += string(logs[i])\n        }\n    }\n    return acronym == signature\n}",
    },
    tests: [
      { stdin: "server error timeout\nset", expectedStdout: "true", isSample: true },
      { stdin: "reboot database backup\nrdb", expectedStdout: "true", isSample: true },
      { stdin: "start connection\nstop", expectedStdout: "false" },
      { stdin: "a\na", expectedStdout: "true" },
      { stdin: "a b c\nab", expectedStdout: "false" },
      { stdin: "hello world\nhelloworld", expectedStdout: "false" },
      { stdin: "one two three\nont", expectedStdout: "false" },
      { stdin: "very important person\nvip", expectedStdout: "true" },
    ],
  }),

  p({
    ...base,
    slug: "validate-assembly-order",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Strict Task Dependency",
    patternTags: ["string","linear-scan","validation"],
    signatureId: "fn:string->bool",
    avgSolveSeconds: 400,
    promptMarkdown: "You are analyzing a series of logged operations from a data processing system. The sequence is represented by a string `tasks`, which consists of the characters 'P' (for \"Parse\") and 'A' (for \"Analyze\"). A sequence is considered properly ordered if all \"Parse\" operations are completed before any \"Analyze\" operations begin.\n\nWrite a function that returns `true` if there are no instances of a 'P' occurring after an 'A' in the sequence, and `false` otherwise.\n\n**Constraints**\n- `1 <= tasks.length <= 100`\n- `tasks` consists only of the characters 'P' and 'A'.\n\n**Example 1**\n```\ninput:\nPPPAA\noutput: true\n```\nExplanation: Every 'P' operation occurs prior to the first 'A' operation.\n\n**Example 2**\n```\ninput:\nPAP\noutput: false\n```\nExplanation: A 'P' operation occurs after an 'A', making the sequence invalid.\n\n**Example 3**\n```\ninput:\nPPP\noutput: true\n```\nExplanation: Since there are no 'A' operations, the sequence is automatically valid.\n\n**Follow-up:** Is there a way to determine the validity using a simple substring search?",
    editorialMarkdown: "## Inversion Search\n\nTo verify the order of tasks, we just need to ensure that no assembly task ('A') occurs before a prep task ('P'). In other words, we should never see the sequence \"AP\" in the string.\n\nWe can iterate through the string and look for an index where `tasks[i] == 'A'` and `tasks[i+1] == 'P'`. If we find one, we immediately return `false`. If the loop finishes without finding this inversion, we return `true`.\n\nThe time complexity is O(N) where N is the length of the string, and space complexity is O(1).\n\nThe main trap solvers hit is counting the occurrences or finding the first/last index of each character, which works but is far more complex than just checking if \"AP\" exists in the string.",
    referenceSolution: {
      JAVASCRIPT: "function solve(tasks) {\n    return !tasks.includes(\"AP\");\n}",
      TYPESCRIPT: "function solve(tasks: string): boolean {\n    return !tasks.includes(\"AP\");\n}",
      PYTHON: "def solve(tasks):\n    return \"AP\" not in tasks",
      JAVA: "    static boolean solve(String tasks) {\n        for (int i = 0; i < tasks.length() - 1; i++) {\n            if (tasks.charAt(i) == 'A' && tasks.charAt(i + 1) == 'P') {\n                return false;\n            }\n        }\n        return true;\n    }",
      CPP: "#include <string>\n\nbool solve(std::string tasks) {\n    for (int i = 0; i < (int)tasks.length() - 1; i++) {\n        if (tasks[i] == 'A' && tasks[i+1] == 'P') {\n            return false;\n        }\n    }\n    return true;\n}",
      GO: "func solve(tasks string) bool {\n    for i := 0; i < len(tasks)-1; i++ {\n        if tasks[i] == 'A' && tasks[i+1] == 'P' {\n            return false\n        }\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "PPPAA", expectedStdout: "true", isSample: true },
      { stdin: "PAP", expectedStdout: "false", isSample: true },
      { stdin: "PPP", expectedStdout: "true" },
      { stdin: "A", expectedStdout: "true" },
      { stdin: "P", expectedStdout: "true" },
      { stdin: "AAAA", expectedStdout: "true" },
      { stdin: "AAAP", expectedStdout: "false" },
      { stdin: "PPAAP", expectedStdout: "false" },
    ],
  }),

  p({
    ...base,
    slug: "balanced-server-load",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Balanced Server Load",
    patternTags: ["hash-map","string","counting"],
    signatureId: "fn:string->bool",
    avgSolveSeconds: 400,
    promptMarkdown: "A load balancer routes requests to various servers, with each server identified by a lowercase English letter. You are given a string `logs` representing the sequence of servers that processed incoming requests.\n\nThe load is considered perfectly balanced if every server that handled at least one request handled the exact same number of requests as the others.\n\nReturn `true` if the load is perfectly balanced, and `false` otherwise.\n\n**Constraints**\n- `1 <= logs.length <= 1000`\n- `logs` consists only of lowercase English letters.\n\n**Example 1**\n```\ninput:\nabacbc\noutput: true\n```\nExplanation: Server 'a', 'b', and 'c' all processed exactly 2 requests.\n\n**Example 2**\n```\ninput:\naabbc\noutput: false\n```\nExplanation: 'a' and 'b' processed 2 requests, but 'c' only processed 1.\n\n**Example 3**\n```\ninput:\nzz\noutput: true\n```\nExplanation: Server 'z' processed 2 requests, and it's the only active server, so the load is perfectly balanced.\n\n**Follow-up:** Can you solve this with O(1) auxiliary space?",
    editorialMarkdown: "## Frequency Counting\n\nTo check if every active server processed the exact same number of requests, we can count the frequency of each character in the string using a hash map or an integer array of size 26.\n\nAfter populating the frequencies, we scan through the frequency counts. We record the frequency of the first character we encounter, and then ensure every other non-zero frequency exactly matches this recorded value. If any differ, we return `false`.\n\nThe time complexity is O(N) where N is the length of the string, and the space complexity is O(1) because the number of distinct characters is bounded by 26.\n\nThe main trap solvers hit is failing to ignore zero counts when checking if all frequencies are equal, which would falsely reject strings that don't use every single letter of the alphabet.",
    referenceSolution: {
      JAVASCRIPT: "function solve(logs) {\n    const counts = {};\n    for (const c of logs) {\n        counts[c] = (counts[c] || 0) + 1;\n    }\n    const vals = Object.values(counts);\n    return vals.every(v => v === vals[0]);\n}",
      TYPESCRIPT: "function solve(logs: string): boolean {\n    const counts: Record<string, number> = {};\n    for (const c of logs) {\n        counts[c] = (counts[c] || 0) + 1;\n    }\n    const vals = Object.values(counts);\n    return vals.every(v => v === vals[0]);\n}",
      PYTHON: "def solve(logs):\n    from collections import Counter\n    counts = Counter(logs)\n    return len(set(counts.values())) == 1",
      JAVA: "    static boolean solve(String logs) {\n        int[] counts = new int[26];\n        for (char c : logs.toCharArray()) {\n            counts[c - 'a']++;\n        }\n        int firstCount = 0;\n        for (int count : counts) {\n            if (count > 0) {\n                if (firstCount == 0) {\n                    firstCount = count;\n                } else if (count != firstCount) {\n                    return false;\n                }\n            }\n        }\n        return true;\n    }",
      CPP: "#include <string>\n#include <vector>\n\nbool solve(std::string logs) {\n    std::vector<int> counts(26, 0);\n    for (char c : logs) {\n        counts[c - 'a']++;\n    }\n    int first_count = 0;\n    for (int count : counts) {\n        if (count > 0) {\n            if (first_count == 0) {\n                first_count = count;\n            } else if (count != first_count) {\n                return false;\n            }\n        }\n    }\n    return true;\n}",
      GO: "func solve(logs string) bool {\n    counts := make([]int, 26)\n    for _, c := range logs {\n        counts[c - 'a']++\n    }\n    firstCount := 0\n    for _, count := range counts {\n        if count > 0 {\n            if firstCount == 0 {\n                firstCount = count\n            } else if count != firstCount {\n                return false\n            }\n        }\n    }\n    return true\n}",
    },
    tests: [
      { stdin: "abacbc", expectedStdout: "true", isSample: true },
      { stdin: "aabbc", expectedStdout: "false", isSample: true },
      { stdin: "zz", expectedStdout: "true" },
      { stdin: "a", expectedStdout: "true" },
      { stdin: "abcde", expectedStdout: "true" },
      { stdin: "aaaabbbbcc", expectedStdout: "false" },
      { stdin: "abcdea", expectedStdout: "false" },
      { stdin: "qwertyuiopqwertyuiop", expectedStdout: "true" },
    ],
  }),
];
