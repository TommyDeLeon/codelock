import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w3-053` (anchored to a public problem index; metadata only).
 *
 * Drafted with claude-sonnet-4-6 on 2026-09-16 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W3_053_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "merged-log-prefix",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GREEDY",
    title: "Merged Log Prefix",
    patternTags: ["greedy","strings","suffix","overlap"],
    signatureId: "fn:strings->string",
    avgSolveSeconds: 720,
    promptMarkdown: "A logging system receives a list of message **fragments**. Each fragment may overlap with the next: the end of one fragment may share characters with the start of the next.\n\nYou are given an array `fragments` of strings ordered by arrival time. Merge them left to right: when appending each new fragment, skip the **longest** prefix of that fragment that is already a **suffix** of the current merged result.\n\nReturn the final merged string.\n\n**Constraints**\n- `1 <= fragments.length <= 200`\n- `1 <= fragments[i].length <= 100`\n- Each string consists of lowercase English letters.\n\n**Example 1**\n```\ninput:\nabcde bcdef\noutput: abcdef\n```\n*Explanation: \"abcde\" is the start. \"bcdef\" overlaps by \"bcde\" (the last 4 chars of \"abcde\" match the first 4 chars of \"bcdef\"). Append only \"f\": result is \"abcdef\".*\n\n**Example 2**\n```\ninput:\nhello world\noutput: helloworld\n```\n*Explanation: \"hello\" and \"world\" share no overlap (\"o\" ≠ \"w\"). Append all of \"world\": result is \"helloworld\".*\n\n**Example 3**\n```\ninput:\nabc bcd cde\noutput: abcde\n```\n*Explanation: Merge \"abc\" + \"bcd\" → skip \"bc\" prefix → \"abcd\". Then merge \"abcd\" + \"cde\" → skip \"cd\" prefix → \"abcde\".*\n\n**Follow-up**\nWhat is the time complexity in terms of total characters across all fragments?",
    editorialMarkdown: "## Merged Log Prefix\n\nThis problem exercises **greedy overlap merging** applied left to right.\n\n**Pattern: greedy suffix-prefix overlap**\n\nMaintain the merged string `result`. For each new fragment:\n1. Find the **maximum** length `k` such that `result` ends with the first `k` characters of `fragment` (i.e., `result[-k:] == fragment[:k]`).\n2. Append only `fragment[k:]` to `result`.\n\nTo find the maximum overlap, try lengths from `min(len(result), len(fragment))` down to 0.\n\n**Trap**: Only checking if the entire fragment is a suffix of result (length == fragment length) while missing partial overlaps. The correct approach must find the *longest* matching prefix of `fragment` that is a *suffix* of the current result.\n\nLet N be the number of fragments and L the maximum fragment length.\n\nTime complexity is O(N·L²). Space complexity is O(N·L).",
    referenceSolution: {
      JAVASCRIPT: "function solve(fragments) {\n    let result = fragments[0];\n    for (let i = 1; i < fragments.length; i++) {\n        const frag = fragments[i];\n        let overlap = 0;\n        const maxOv = Math.min(result.length, frag.length);\n        for (let k = maxOv; k >= 1; k--) {\n            if (result.endsWith(frag.substring(0, k))) {\n                overlap = k;\n                break;\n            }\n        }\n        result += frag.substring(overlap);\n    }\n    return result;\n}",
      TYPESCRIPT: "function solve(fragments: string[]): string {\n    let result = fragments[0];\n    for (let i = 1; i < fragments.length; i++) {\n        const frag = fragments[i];\n        let overlap = 0;\n        const maxOv = Math.min(result.length, frag.length);\n        for (let k = maxOv; k >= 1; k--) {\n            if (result.endsWith(frag.substring(0, k))) {\n                overlap = k;\n                break;\n            }\n        }\n        result += frag.substring(overlap);\n    }\n    return result;\n}",
      PYTHON: "def solve(fragments):\n    result = fragments[0]\n    for frag in fragments[1:]:\n        max_ov = min(len(result), len(frag))\n        overlap = 0\n        for k in range(max_ov, 0, -1):\n            if result.endswith(frag[:k]):\n                overlap = k\n                break\n        result += frag[overlap:]\n    return result",
      JAVA: "    static String solve(String[] fragments) {\n        String result = fragments[0];\n        for (int i = 1; i < fragments.length; i++) {\n            String frag = fragments[i];\n            int maxOv = Math.min(result.length(), frag.length());\n            int overlap = 0;\n            for (int k = maxOv; k >= 1; k--) {\n                if (result.endsWith(frag.substring(0, k))) {\n                    overlap = k;\n                    break;\n                }\n            }\n            result += frag.substring(overlap);\n        }\n        return result;\n    }",
      CPP: "string solve(vector<string> fragments) {\n    string result = fragments[0];\n    for (int i = 1; i < (int)fragments.size(); i++) {\n        string& frag = fragments[i];\n        int maxOv = min((int)result.size(), (int)frag.size());\n        int overlap = 0;\n        for (int k = maxOv; k >= 1; k--) {\n            if (result.size() >= (size_t)k && result.substr(result.size() - k) == frag.substr(0, k)) {\n                overlap = k;\n                break;\n            }\n        }\n        result += frag.substr(overlap);\n    }\n    return result;\n}",
      GO: "func solve(fragments []string) string {\n    result := fragments[0]\n    for i := 1; i < len(fragments); i++ {\n        frag := fragments[i]\n        rLen := len(result)\n        fLen := len(frag)\n        maxOv := rLen\n        if fLen < maxOv {\n            maxOv = fLen\n        }\n        overlap := 0\n        for k := maxOv; k >= 1; k-- {\n            match := true\n            for j := 0; j < k; j++ {\n                if result[rLen-k+j] != frag[j] {\n                    match = false\n                    break\n                }\n            }\n            if match {\n                overlap = k\n                break\n            }\n        }\n        result += frag[overlap:]\n    }\n    return result\n}",
    },
    tests: [
      { stdin: "abcde bcdef", expectedStdout: "abcdef", isSample: true },
      { stdin: "hello world", expectedStdout: "helloworld", isSample: true },
      { stdin: "abc bcd cde", expectedStdout: "abcde" },
      { stdin: "abc", expectedStdout: "abc" },
      { stdin: "aaa aaa", expectedStdout: "aaa" },
      { stdin: "abcd cd cde", expectedStdout: "abcde" },
      { stdin: "xyz abc", expectedStdout: "xyzabc" },
      { stdin: "log logfile logfiledata", expectedStdout: "logfiledata" },
    ],
  }),

];
