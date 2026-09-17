import { GENERATED, type ProblemDefinition } from '../problem.js';

/**
 * Generated batch `gen-lc-w2-058` (anchored to a public problem index; metadata only).
 *
 * Drafted with gemini-3.1-pro-low on 2026-09-17 and admitted only after
 * every reference solution passed every test on the judge
 * (`scripts/author-batch.ts`). Statements are original; provenance says so.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = { provenance: GENERATED } as const;

export const GEN_LC_W2_058_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: "alien-message-decoder",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "ARRAYS_HASHING",
    title: "Macro Expansion Utility",
    patternTags: ["strings","parsing"],
    signatureId: "fn:string->string",
    avgSolveSeconds: 400,
    promptMarkdown: "You are building a text expansion utility for a specialized keyboard. The utility processes a sequence of shortcut macros represented by a string `s`, which is formed by concatenating three distinct patterns. Your task is to expand the sequence into its final readable text.\n\nThe expansion rules are as follows:\n- The macro `\"M\"` expands to `\"M\"`.\n- The macro `\"(o)\"` expands to `\"o\"`.\n- The macro `\"(ar)\"` expands to `\"ar\"`.\n\nGiven the input string `s`, return the fully expanded text.\n\n**Constraints**\n- `1 <= s.length <= 100`\n- `s` is composed only of the macros `\"M\"`, `\"(o)\"`, and `\"(ar)\"` concatenated in some order.\n\n**Example 1**\n```\ninput:\nM(o)(ar)M\noutput:\nMoarM\n```\n*Explanation: The macros are expanded sequentially: \"M\" -> \"M\", \"(o)\" -> \"o\", \"(ar)\" -> \"ar\", \"M\" -> \"M\".*\n\n**Example 2**\n```\ninput:\n(ar)(ar)\noutput:\narar\n```\n*Explanation: The macro \"(ar)\" appears twice and is expanded to \"ar\" both times.*\n\n**Example 3**\n```\ninput:\nM\noutput:\nM\n```\n*Explanation: A single macro \"M\" expands directly to \"M\".*\n\n**Follow-up**\nCan you implement the expansion in O(N) time without using built-in string replace operations?",
    editorialMarkdown: "## Alien Message Decoder\n\nThis is a string parsing and replacement problem. We iterate through the given string and build the result according to specific translation rules.\n\nThe simplest approach is to use a while-loop or for-loop with an index `i`. If `s[i] == 'M'`, append `'M'` and increment `i` by 1. If `s[i] == '('`, we peek at `s[i+1]`. If it is `'o'`, it represents `(o)`, so we append `'o'` and increment `i` by 2. Otherwise, it must be `(ar)`, so we append `'ar'` and increment `i` by 4.\n\n**Trap**: Be careful with manual index manipulation to not go out of bounds, although the problem guarantees the input string is a valid encoding of the symbols. Alternatively, using built-in string replace methods (like `.replace()` or `.replaceAll()`) works just as well and is less prone to off-by-one errors.\n\n**Complexity:**\n- **Time:** O(N) where N is the length of the string, since we process each character at most once.\n- **Space:** O(N) for storing the resulting decoded string.",
    referenceSolution: {
      JAVASCRIPT: "function solve(s) {\n    let res = \"\";\n    for (let i = 0; i < s.length; ) {\n        if (s[i] === 'M') {\n            res += 'M';\n            i += 1;\n        } else if (s[i] === '(' && s[i+1] === 'o') {\n            res += 'o';\n            i += 3;\n        } else {\n            res += 'ar';\n            i += 4;\n        }\n    }\n    return res;\n}",
      TYPESCRIPT: "function solve(s: string): string {\n    let res = \"\";\n    for (let i = 0; i < s.length; ) {\n        if (s[i] === 'M') {\n            res += 'M';\n            i += 1;\n        } else if (s[i] === '(' && s[i+1] === 'o') {\n            res += 'o';\n            i += 3;\n        } else {\n            res += 'ar';\n            i += 4;\n        }\n    }\n    return res;\n}",
      PYTHON: "def solve(s):\n    return s.replace(\"(ar)\", \"ar\").replace(\"(o)\", \"o\")",
      JAVA: "    static String solve(String s) {\n        StringBuilder res = new StringBuilder();\n        for (int i = 0; i < s.length(); ) {\n            if (s.charAt(i) == 'M') {\n                res.append('M');\n                i += 1;\n            } else if (s.charAt(i) == '(' && s.charAt(i+1) == 'o') {\n                res.append('o');\n                i += 3;\n            } else {\n                res.append(\"ar\");\n                i += 4;\n            }\n        }\n        return res.toString();\n    }",
      CPP: "string solve(string s) {\n    string res = \"\";\n    for (int i = 0; i < s.length(); ) {\n        if (s[i] == 'M') {\n            res += \"M\";\n            i += 1;\n        } else if (s[i] == '(' && s[i+1] == 'o') {\n            res += \"o\";\n            i += 3;\n        } else {\n            res += \"ar\";\n            i += 4;\n        }\n    }\n    return res;\n}",
      GO: "func solve(s string) string {\n    res := \"\"\n    for i := 0; i < len(s); {\n        if s[i] == 'M' {\n            res += \"M\"\n            i += 1\n        } else if s[i] == '(' && s[i+1] == 'o' {\n            res += \"o\"\n            i += 3\n        } else {\n            res += \"ar\"\n            i += 4\n        }\n    }\n    return res\n}",
    },
    tests: [
      { stdin: "M(o)(ar)M", expectedStdout: "MoarM", isSample: true },
      { stdin: "(ar)(ar)", expectedStdout: "arar", isSample: true },
      { stdin: "M", expectedStdout: "M" },
      { stdin: "(o)", expectedStdout: "o" },
      { stdin: "(ar)", expectedStdout: "ar" },
      { stdin: "(o)M(o)(o)M", expectedStdout: "oMooM" },
      { stdin: "M(o)(ar)M(o)(ar)M", expectedStdout: "MoarMoarM" },
      { stdin: "MMM", expectedStdout: "MMM" },
    ],
  }),

  p({
    ...base,
    slug: "cargo-ship-loading",
    difficulty: "EASY",
    tier: "TIER_1",
    patternFamily: "GREEDY",
    title: "Cargo Ship Loading",
    patternTags: ["arrays","greedy","sorting"],
    signatureId: "fn:ints,int->int",
    avgSolveSeconds: 400,
    promptMarkdown: "You are coordinating the loading of a cargo ship. You are given an integer array `weights` where each element represents the weight of a cargo container, and an integer `limit` representing the maximum total weight the ship can carry.\n\nYou want to load as many cargo containers onto the ship as possible. Return the maximum number of containers you can load such that the sum of their weights is less than or equal to `limit`.\n\n**Constraints**\n- `1 <= weights.length <= 40`\n- `1 <= weights[i] <= 1000`\n- `1 <= limit <= 40000`\n\n**Example 1**\n```\ninput:\n10 20 30\n50\noutput:\n2\n```\n*Explanation: You can take the containers weighing 10 and 20, or 10 and 30, or 20 and 30. You can't take all three since 10+20+30 = 60 > 50. The maximum count is 2.*\n\n**Example 2**\n```\ninput:\n1 1 1 1\n2\noutput:\n2\n```\n*Explanation: You can pick any two containers of weight 1 to reach a total of 2. You cannot take more without exceeding the limit.*\n\n**Example 3**\n```\ninput:\n50 60\n10\noutput:\n0\n```\n*Explanation: No container is light enough to be loaded on the ship.*\n\n**Follow-up**\nWhat is the time complexity when the weights are arbitrarily large?",
    editorialMarkdown: "## Cargo Ship Loading\n\nThis is a classic greedy problem. We want to maximize the number of items we can select without exceeding a total weight limit.\n\nTo pick as many items as possible, we should always prefer the lightest items. We can achieve this by sorting the `weights` array in ascending order and iteratively picking items until adding the next item would cause the total weight to exceed the `limit`.\n\n**Trap**: Make sure to check the boundary condition where the sum perfectly matches the limit, and gracefully break out of the loop if a weight exceeds the remaining capacity.\n\n**Complexity:**\n- **Time:** O(N log N) to sort the array, followed by an O(N) pass, giving O(N log N) overall.\n- **Space:** O(1) or O(log N) depending on the sorting algorithm's auxiliary space usage.",
    referenceSolution: {
      JAVASCRIPT: "function solve(a, b) {\n    a = a.map(Number);\n    b = Number(b);\n    a.sort(function(x, y) { return x - y; });\n    var count = 0;\n    for (var i = 0; i < a.length; i++) {\n        if (b >= a[i]) {\n            b -= a[i];\n            count++;\n        } else {\n            break;\n        }\n    }\n    return count;\n}",
      TYPESCRIPT: "function solve(a: number[], b: number): number {\n    a.sort((x, y) => x - y);\n    let count = 0;\n    for (let w of a) {\n        if (b >= w) {\n            b -= w;\n            count++;\n        } else {\n            break;\n        }\n    }\n    return count;\n}",
      PYTHON: "def solve(a, b):\n    a.sort()\n    count = 0\n    for w in a:\n        if b >= w:\n            b -= w\n            count += 1\n        else:\n            break\n    return count",
      JAVA: "    static int solve(int[] a, int b) {\n        java.util.Arrays.sort(a);\n        int count = 0;\n        for (int w : a) {\n            if (b >= w) {\n                b -= w;\n                count++;\n            } else {\n                break;\n            }\n        }\n        return count;\n    }",
      CPP: "int solve(vector<int> a, int b) {\n    sort(a.begin(), a.end());\n    int count = 0;\n    for (int w : a) {\n        if (b >= w) {\n            b -= w;\n            count++;\n        } else {\n            break;\n        }\n    }\n    return count;\n}",
      GO: "func solve(a []int, b int) int {\n    for i := 0; i < len(a); i++ {\n        for j := i + 1; j < len(a); j++ {\n            if a[i] > a[j] {\n                a[i], a[j] = a[j], a[i]\n            }\n        }\n    }\n    count := 0\n    for _, w := range a {\n        if b >= w {\n            b -= w\n            count++\n        } else {\n            break\n        }\n    }\n    return count\n}",
    },
    tests: [
      { stdin: "10 20 30\n50", expectedStdout: "2", isSample: true },
      { stdin: "1 1 1 1\n2", expectedStdout: "2", isSample: true },
      { stdin: "50 60\n10", expectedStdout: "0" },
      { stdin: "100 200 150 50\n500", expectedStdout: "4" },
      { stdin: "10\n10", expectedStdout: "1" },
      { stdin: "2 2 2 2 2\n10", expectedStdout: "5" },
      { stdin: "100\n1", expectedStdout: "0" },
      { stdin: "5 10 15 20\n30", expectedStdout: "3" },
    ],
  }),
];
