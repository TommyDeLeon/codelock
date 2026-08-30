import { AUTHORED, type ProblemDefinition } from '../problem.js';

/**
 * Tier 1 — Sliding Window.
 *
 * On the roadmap this family sits under Two Pointers, which sits under Arrays &
 * Hashing. Until Two Pointers has problems authored, nothing here is reachable
 * — the progression gate requires three solves in every parent family. That is
 * intended, not an oversight: a window is two pointers with a rule about when
 * to move each one, and meeting it before that idea exists teaches the shape
 * without the reason.
 *
 * `longest-unique-substring` keeps its original slug. It is the last of the
 * three pre-taxonomy rows that shipped with no editorial and no reference
 * solution; reusing the slug upserts that row into a complete problem instead
 * of stranding it beside a new one.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = {
  tier: 'TIER_1',
  patternFamily: 'SLIDING_WINDOW',
  provenance: AUTHORED,
} as const;

export const TIER_1_SLIDING_WINDOW_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: 'longest-unique-substring',
    title: 'Longest Run Without a Repeat',
    difficulty: 'MEDIUM',
    patternTags: ['sliding-window', 'hash-map', 'two-pointers'],
    signatureId: 'fn:string->int',
    avgSolveSeconds: 720,
    promptMarkdown: [
      'Find the length of the longest stretch of a string that contains no',
      'repeated character.',
      '',
      'The stretch must be **contiguous** — a run of neighbouring characters, not',
      'a selection picked from anywhere in the string. Return only its length.',
      '',
      '**Example**',
      '',
      '```',
      'input:  abcabcbb',
      'output: 3',
      '```',
      '',
      'The best runs are `abc`, `bca` and `cab`, all of length 3. Nothing longer',
      'works, because a fourth character always repeats one already in the run.',
      '',
      '```',
      'input:  bbbbb',
      'output: 1',
      '```',
      '',
      'Every character is the same, so the longest repeat-free run is a single',
      '`b`.',
      '',
      'The string always has at least one character, so the answer is never 0.',
      'Characters are compared exactly; treat upper and lower case as different.',
    ].join('\n'),
    editorialMarkdown: [
      '## Move the back of the window, never rebuild it',
      '',
      'The brute-force version checks every substring for uniqueness: O(n^2)',
      'substrings, each costing up to O(n) to check, so O(n^3). Even the improved',
      'version that grows each start until it hits a repeat is O(n^2). Both are',
      'correct, and both re-examine characters they have already looked at.',
      '',
      'The observation that removes the repeated work: a window `[start, i]` with',
      'no repeats does not need to be rebuilt when it breaks. When the character',
      'at `i` already sits inside the window, every window starting before that',
      'earlier copy is dead — it would contain the copy *and* the new one. So the',
      'start jumps straight past the old position and never walks backwards.',
      '',
      'Keep a map from character to the position it was last seen:',
      '',
      '```',
      'start = 0, best = 0',
      'for i, ch in string:',
      '    if ch in last and last[ch] >= start:',
      '        start = last[ch] + 1',
      '    last[ch] = i',
      '    best = max(best, i - start + 1)',
      '```',
      '',
      'Each index is visited once and `start` only moves forward, so this is O(n)',
      'time. Space is O(k) for the map, where k is the number of distinct',
      'characters — bounded by the alphabet, not by the length of the string.',
      '',
      'The mistake this problem is built to catch is the `last[ch] >= start`',
      'guard, and it is quiet because it only matters on *some* inputs. Drop it',
      'and `abcabcbb` still comes out correct. Then run `abba`:',
      '',
      '```',
      'i=0 a  start=0',
      'i=1 b  start=0',
      'i=2 b  repeat inside the window -> start=2',
      'i=3 a  a was last seen at 0, which is behind start',
      '```',
      '',
      'Without the guard, `start` is dragged back to 1 by a character that left',
      'the window two steps ago, and the answer comes out 3 for a string whose',
      'best run is `ab`, length 2. The map remembers every character it has ever',
      'seen; the window does not. The guard is what reconciles the two.',
      '',
      'Keeping the stale entry is deliberate. Clearing the map as the window slid',
      'would cost the O(1) lookup that makes the whole approach work — checking',
      'the position is cheaper than maintaining the invariant.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT:
        'function solve(a) {\n  const last = new Map();\n  let start = 0;\n  let best = 0;\n  for (let i = 0; i < a.length; i++) {\n    const ch = a[i];\n    const seen = last.get(ch);\n    if (seen !== undefined && seen >= start) start = seen + 1;\n    last.set(ch, i);\n    const width = i - start + 1;\n    if (width > best) best = width;\n  }\n  return best;\n}',
      TYPESCRIPT:
        'function solve(a: string): number {\n  const last = new Map<string, number>();\n  let start = 0;\n  let best = 0;\n  for (let i = 0; i < a.length; i++) {\n    const ch = a[i] as string;\n    const seen = last.get(ch);\n    if (seen !== undefined && seen >= start) start = seen + 1;\n    last.set(ch, i);\n    const width = i - start + 1;\n    if (width > best) best = width;\n  }\n  return best;\n}',
      PYTHON:
        'def solve(a):\n    last = {}\n    start = 0\n    best = 0\n    for i, ch in enumerate(a):\n        if ch in last and last[ch] >= start:\n            start = last[ch] + 1\n        last[ch] = i\n        width = i - start + 1\n        if width > best:\n            best = width\n    return best',
      JAVA: '    static int solve(String a) {\n        Map<Character, Integer> last = new HashMap<>();\n        int start = 0;\n        int best = 0;\n        for (int i = 0; i < a.length(); i++) {\n            char ch = a.charAt(i);\n            Integer seen = last.get(ch);\n            if (seen != null && seen >= start) start = seen + 1;\n            last.put(ch, i);\n            int width = i - start + 1;\n            if (width > best) best = width;\n        }\n        return best;\n    }',
      CPP: 'int solve(string a) {\n    unordered_map<char, int> last;\n    int start = 0;\n    int best = 0;\n    for (int i = 0; i < (int) a.size(); i++) {\n        char ch = a[i];\n        auto it = last.find(ch);\n        if (it != last.end() && it->second >= start) start = it->second + 1;\n        last[ch] = i;\n        int width = i - start + 1;\n        if (width > best) best = width;\n    }\n    return best;\n}',
      GO: 'func solve(a string) int {\n\tlast := map[byte]int{}\n\tstart := 0\n\tbest := 0\n\tfor i := 0; i < len(a); i++ {\n\t\tch := a[i]\n\t\tif seen, ok := last[ch]; ok && seen >= start {\n\t\t\tstart = seen + 1\n\t\t}\n\t\tlast[ch] = i\n\t\twidth := i - start + 1\n\t\tif width > best {\n\t\t\tbest = width\n\t\t}\n\t}\n\treturn best\n}',
    },
    tests: [
      { stdin: 'abcabcbb', expectedStdout: '3', isSample: true },
      { stdin: 'bbbbb', expectedStdout: '1', isSample: true },
      { stdin: 'abba', expectedStdout: '2' },
      { stdin: 'pwwkew', expectedStdout: '3' },
      { stdin: 'a', expectedStdout: '1' },
      { stdin: 'abcdef', expectedStdout: '6' },
      { stdin: 'tmmzuxt', expectedStdout: '5' },
    ],
  }),
];
