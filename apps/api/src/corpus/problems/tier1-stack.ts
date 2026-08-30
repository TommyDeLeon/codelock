import { AUTHORED, type ProblemDefinition } from '../problem.js';

/**
 * Tier 1 — Stack.
 *
 * Stack sits directly under Arrays & Hashing on the roadmap, so it is one of
 * the two families that open first. See docs/AUTHORING.md; every statement is
 * written from the task, not from anyone's prose.
 *
 * `valid-parentheses` keeps its original slug on purpose. It is one of the
 * three rows that predate the taxonomy and shipped with no editorial and no
 * reference solution — a user who failed it got an empty debrief, which is the
 * exact outcome the debrief exists to prevent. Reusing the slug makes the
 * importer upsert that row into a complete problem rather than leaving the
 * broken one sitting beside a new one.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = {
  tier: 'TIER_1',
  patternFamily: 'STACK',
  provenance: AUTHORED,
} as const;

export const TIER_1_STACK_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: 'valid-parentheses',
    title: 'Balanced Brackets',
    difficulty: 'EASY',
    patternTags: ['stack', 'matching', 'lifo'],
    signatureId: 'fn:string->bool',
    avgSolveSeconds: 420,
    promptMarkdown: [
      'Decide whether a line of brackets is balanced.',
      '',
      'The line contains only these six characters: `(`, `)`, `[`, `]`, `{`, `}`.',
      'It is balanced when every bracket that opens is closed later by the',
      'matching kind, and nothing closes that was never opened.',
      '',
      'Print `true` or `false`.',
      '',
      '**Example**',
      '',
      '```',
      'input:  {[]}',
      'output: true',
      '```',
      '',
      'The `[` closes before the `{` does, so the pairs nest cleanly.',
      '',
      '```',
      'input:  ([)]',
      'output: false',
      '```',
      '',
      'Every bracket here has a partner of the right kind, but they cross rather',
      'than nest — the `(` is still open when the `]` arrives. Crossing is not',
      'balanced.',
      '',
      'The line always has at least one character.',
    ].join('\n'),
    editorialMarkdown: [
      '## The stack is the memory of what is still open',
      '',
      'Counting will not work here, and it is worth knowing exactly why before',
      'reaching for the answer. If you count openers and closers, `([)]` passes —',
      'one of each, perfectly balanced by count. Even counting each kind',
      'separately passes it. What counting cannot see is *order*.',
      '',
      'The rule that actually defines balance is this: when a closer arrives, it',
      'must match the **most recently opened** bracket that is still unclosed.',
      'Not any open bracket — the newest one. "Most recently added, first to be',
      'removed" is the definition of a stack, which is why this problem is the',
      'canonical reason the structure exists.',
      '',
      'So: push every opener. On every closer, pop and compare.',
      '',
      '```',
      'for ch in line:',
      '    if ch opens:  push(ch)',
      '    else:',
      '        if stack is empty:      return false',
      '        if pop() != match(ch):  return false',
      'return stack is empty',
      '```',
      '',
      'Two checks are easy to forget, and each fails quietly on a different input.',
      '',
      'The first is popping an empty stack. On `)` alone there is nothing to pop,',
      'and a language that returns null rather than raising will happily compare',
      'null against `(`, find them unequal, and return false — the right answer,',
      'reached by accident. The bug only shows itself on an input where the pop',
      'should have succeeded, long after you stopped looking. Test `)` on its own.',
      '',
      'The second is the final emptiness check. `(` alone never enters the closer',
      'branch at all, so every comparison you wrote passes and the loop ends',
      'happily. Without that last line you return true for a line that opens a',
      'bracket and never closes it. Leftovers on the stack mean unclosed brackets.',
      '',
      'One pass, O(n) time. The stack holds at most one entry per character, so',
      'O(n) space — bounded by the longest run of openers, which is the whole line',
      'in the worst case of `((((((`.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT:
        "function solve(a) {\n  const match = { ')': '(', ']': '[', '}': '{' };\n  const stack = [];\n  for (const ch of a) {\n    if (ch === '(' || ch === '[' || ch === '{') {\n      stack.push(ch);\n    } else {\n      if (stack.length === 0) return false;\n      if (stack.pop() !== match[ch]) return false;\n    }\n  }\n  return stack.length === 0;\n}",
      TYPESCRIPT:
        "function solve(a: string): boolean {\n  const match: Record<string, string> = { ')': '(', ']': '[', '}': '{' };\n  const stack: string[] = [];\n  for (const ch of a) {\n    if (ch === '(' || ch === '[' || ch === '{') {\n      stack.push(ch);\n    } else {\n      if (stack.length === 0) return false;\n      if (stack.pop() !== match[ch]) return false;\n    }\n  }\n  return stack.length === 0;\n}",
      PYTHON:
        "def solve(a):\n    match = {')': '(', ']': '[', '}': '{'}\n    stack = []\n    for ch in a:\n        if ch in '([{':\n            stack.append(ch)\n        else:\n            if not stack:\n                return False\n            if stack.pop() != match[ch]:\n                return False\n    return len(stack) == 0",
      JAVA: "    static boolean solve(String a) {\n        Deque<Character> stack = new ArrayDeque<>();\n        for (int i = 0; i < a.length(); i++) {\n            char ch = a.charAt(i);\n            if (ch == '(' || ch == '[' || ch == '{') {\n                stack.push(ch);\n            } else {\n                if (stack.isEmpty()) return false;\n                char open = stack.pop();\n                if (ch == ')' && open != '(') return false;\n                if (ch == ']' && open != '[') return false;\n                if (ch == '}' && open != '{') return false;\n            }\n        }\n        return stack.isEmpty();\n    }",
      CPP: "bool solve(string a) {\n    vector<char> stack;\n    for (char ch : a) {\n        if (ch == '(' || ch == '[' || ch == '{') {\n            stack.push_back(ch);\n        } else {\n            if (stack.empty()) return false;\n            char open = stack.back();\n            stack.pop_back();\n            if (ch == ')' && open != '(') return false;\n            if (ch == ']' && open != '[') return false;\n            if (ch == '}' && open != '{') return false;\n        }\n    }\n    return stack.empty();\n}",
      GO: "func solve(a string) bool {\n\tstack := []byte{}\n\tfor i := 0; i < len(a); i++ {\n\t\tch := a[i]\n\t\tif ch == '(' || ch == '[' || ch == '{' {\n\t\t\tstack = append(stack, ch)\n\t\t\tcontinue\n\t\t}\n\t\tif len(stack) == 0 {\n\t\t\treturn false\n\t\t}\n\t\topen := stack[len(stack)-1]\n\t\tstack = stack[:len(stack)-1]\n\t\tif ch == ')' && open != '(' {\n\t\t\treturn false\n\t\t}\n\t\tif ch == ']' && open != '[' {\n\t\t\treturn false\n\t\t}\n\t\tif ch == '}' && open != '{' {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn len(stack) == 0\n}",
    },
    tests: [
      { stdin: '{[]}', expectedStdout: 'true', isSample: true },
      { stdin: '([)]', expectedStdout: 'false', isSample: true },
      { stdin: '()[]{}', expectedStdout: 'true' },
      { stdin: '(', expectedStdout: 'false' },
      { stdin: ')', expectedStdout: 'false' },
      { stdin: '((((((', expectedStdout: 'false' },
      { stdin: '{[()]}', expectedStdout: 'true' },
    ],
  }),
];
