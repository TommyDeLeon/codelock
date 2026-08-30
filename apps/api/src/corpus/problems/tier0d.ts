import { AUTHORED, type ProblemDefinition } from '../problem.js';

/**
 * Tier 0 — foundations, fourth batch.
 *
 * Same audience and contract as `tier0.ts` and `tier0c.ts`; see
 * docs/AUTHORING.md. Written in the compact form introduced by `tier0c.ts`:
 * the `ask` / `why` helpers carry the statement and editorial skeletons so
 * each entry holds only what is different about it. The prose obligations are
 * unchanged — name the edge case, name the quiet mistake, give the complexity.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const B = {
  tier: 'TIER_0',
  patternFamily: 'FOUNDATIONS',
  difficulty: 'EASY',
  provenance: AUTHORED,
} as const;

/** Statement skeleton: what it does, a worked example, and the edge case. */
const ask = (lead: string, example: string, edge: string): string =>
  [lead, '', '**Example**', '', '```', example, '```', '', edge].join('\n');

/** Editorial skeleton: the idea, the quiet mistake, the cost. */
const why = (heading: string, idea: string, trap: string, cost: string): string =>
  ['## ' + heading, '', idea, '', trap, '', cost].join('\n');

export const TIER_0D_PROBLEMS: ProblemDefinition[] = [
  p({
    ...B,
    slug: 'min-and-max',
    title: 'Smallest and Largest, One Pass',
    patternTags: ['loops', 'arrays', 'running-best'],
    signatureId: 'fn:ints->ints',
    avgSolveSeconds: 240,
    promptMarkdown: ask(
      'Return two numbers: the smallest in the list, then the largest.\n\nThe list always has at least one number.',
      'input:  3 1 4 1 5\noutput: 1 5',
      'A list of one number gives that number twice — it is both the smallest and the largest.',
    ),
    editorialMarkdown: why(
      'Two running bests in the same loop',
      'Seed both answers with the first element, then walk the rest once, shrinking the minimum and growing the maximum as you go. Seeding from the data — rather than from a made-up starting value — is what makes this correct for negatives without any extra thought.',
      'The quiet mistake is starting the minimum at `0` (or at some "very large" constant you picked). Start at `0` and a list of all-positive numbers reports a minimum of `0`, which was never in the list; that answer looks reasonable enough to sail through a glance. Because the statement guarantees at least one element, `a[0]` is always available and is always a real answer.',
      'O(n) time with a single pass, O(1) extra space. Two separate loops would also be O(n) — the one-pass version is about touching each value once, not about a better bound.',
    ),
    referenceSolution: {
      JAVASCRIPT:
        'function solve(a) {\n  let lo = a[0];\n  let hi = a[0];\n  for (const n of a) {\n    if (n < lo) lo = n;\n    if (n > hi) hi = n;\n  }\n  return [lo, hi];\n}',
      TYPESCRIPT:
        'function solve(a: number[]): number[] {\n  let lo = a[0];\n  let hi = a[0];\n  for (const n of a) {\n    if (n < lo) lo = n;\n    if (n > hi) hi = n;\n  }\n  return [lo, hi];\n}',
      PYTHON:
        'def solve(a):\n    lo = a[0]\n    hi = a[0]\n    for n in a:\n        if n < lo:\n            lo = n\n        if n > hi:\n            hi = n\n    return [lo, hi]',
      JAVA: '    static int[] solve(int[] a) {\n        int lo = a[0];\n        int hi = a[0];\n        for (int n : a) {\n            if (n < lo) lo = n;\n            if (n > hi) hi = n;\n        }\n        return new int[] { lo, hi };\n    }',
      CPP: 'vector<int> solve(vector<int> a) {\n    int lo = a[0];\n    int hi = a[0];\n    for (int n : a) {\n        if (n < lo) lo = n;\n        if (n > hi) hi = n;\n    }\n    return vector<int>{ lo, hi };\n}',
      GO: 'func solve(a []int) []int {\n\tlo := a[0]\n\thi := a[0]\n\tfor _, n := range a {\n\t\tif n < lo {\n\t\t\tlo = n\n\t\t}\n\t\tif n > hi {\n\t\t\thi = n\n\t\t}\n\t}\n\treturn []int{lo, hi}\n}',
    },
    tests: [
      { stdin: '3 1 4 1 5', expectedStdout: '1 5', isSample: true },
      { stdin: '7', expectedStdout: '7 7', isSample: true },
      { stdin: '-2 -9 -4', expectedStdout: '-9 -2' },
      { stdin: '2 2 2', expectedStdout: '2 2' },
      { stdin: '0 100', expectedStdout: '0 100' },
    ],
  }),

  p({
    ...B,
    slug: 'sum-of-even-numbers',
    title: 'Add Up the Even Ones',
    patternTags: ['loops', 'arrays', 'modulo', 'accumulator'],
    signatureId: 'fn:ints->int',
    avgSolveSeconds: 180,
    promptMarkdown: ask(
      'Add together only the even numbers in a list, ignoring the odd ones.',
      'input:  1 2 3 4\noutput: 6',
      'Zero is even, so it is included (it just adds nothing). Negative even numbers count too. An empty list gives `0`.',
    ),
    editorialMarkdown: why(
      'Filter and accumulate in one loop',
      'A running total outside the loop, and inside it a test that decides whether this value joins the total. `n % 2 == 0` is true for `0`, for `4`, and for `-4` in every one of these six languages, so the plain test needs no help.',
      'The quiet mistake is reaching for `n % 2 == 1` and inverting it, or writing `n % 2 != 1` as the "even" test. In C, C++, Java, Go, JavaScript and TypeScript the remainder keeps the sign of the left operand, so `-3 % 2` is `-1`; `-3 % 2 != 1` is then true and an odd negative number is silently added. Comparing against `0` sidesteps the whole question, because zero has no sign to disagree about.',
      'O(n) time, O(1) space — one pass over the list, with a fixed amount of memory regardless of its size.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let t = 0;\n  for (const n of a) if (n % 2 === 0) t += n;\n  return t;\n}',
      TYPESCRIPT:
        'function solve(a: number[]): number {\n  let t = 0;\n  for (const n of a) if (n % 2 === 0) t += n;\n  return t;\n}',
      PYTHON: 'def solve(a):\n    t = 0\n    for n in a:\n        if n % 2 == 0:\n            t += n\n    return t',
      JAVA: '    static int solve(int[] a) {\n        int t = 0;\n        for (int n : a) if (n % 2 == 0) t += n;\n        return t;\n    }',
      CPP: 'int solve(vector<int> a) {\n    int t = 0;\n    for (int n : a) if (n % 2 == 0) t += n;\n    return t;\n}',
      GO: 'func solve(a []int) int {\n\tt := 0\n\tfor _, n := range a {\n\t\tif n%2 == 0 {\n\t\t\tt += n\n\t\t}\n\t}\n\treturn t\n}',
    },
    tests: [
      { stdin: '1 2 3 4', expectedStdout: '6', isSample: true },
      { stdin: '', expectedStdout: '0', isSample: true },
      { stdin: '1 3 5', expectedStdout: '0' },
      { stdin: '-4 -3', expectedStdout: '-4' },
      { stdin: '0 8', expectedStdout: '8' },
    ],
  }),

  p({
    ...B,
    slug: 'is-sorted-ascending',
    title: 'Is It Already Sorted?',
    patternTags: ['loops', 'arrays', 'adjacent-pairs', 'booleans'],
    signatureId: 'fn:ints->bool',
    avgSolveSeconds: 220,
    promptMarkdown: ask(
      'Decide whether a list is in ascending order.\n\nAscending means every number is greater than **or equal to** the one before it, so repeats are allowed.',
      'input:  1 2 2 5\noutput: true',
      'An empty list and a one-element list are both sorted, so both give `true`.',
    ),
    editorialMarkdown: why(
      'Compare neighbours, not everything',
      'A list is in order exactly when every adjacent pair is in order — you never have to compare distant elements, because "in order" chains along. So loop from index `1` to the end and return `false` the moment `a[i] < a[i - 1]`. If the loop finishes without finding a break, return `true`.',
      'The quiet mistake is the loop bounds. Starting at `0` and reading `a[i - 1]` reads index `-1` on the very first step, which crashes in some of these languages and quietly hands you garbage in others. Starting at `1` fixes it and also makes the empty and single-element cases free: the loop body simply never runs, and the function falls through to `true` — which is the right answer, not a lucky one.',
      'O(n) time and O(1) space, and it can stop early: the first out-of-order pair ends the work, so a badly sorted list is often much faster than the worst case.',
    ),
    referenceSolution: {
      JAVASCRIPT:
        'function solve(a) {\n  for (let i = 1; i < a.length; i++) {\n    if (a[i] < a[i - 1]) return false;\n  }\n  return true;\n}',
      TYPESCRIPT:
        'function solve(a: number[]): boolean {\n  for (let i = 1; i < a.length; i++) {\n    if (a[i] < a[i - 1]) return false;\n  }\n  return true;\n}',
      PYTHON:
        'def solve(a):\n    for i in range(1, len(a)):\n        if a[i] < a[i - 1]:\n            return False\n    return True',
      JAVA: '    static boolean solve(int[] a) {\n        for (int i = 1; i < a.length; i++) {\n            if (a[i] < a[i - 1]) return false;\n        }\n        return true;\n    }',
      CPP: 'bool solve(vector<int> a) {\n    for (size_t i = 1; i < a.size(); i++) {\n        if (a[i] < a[i - 1]) return false;\n    }\n    return true;\n}',
      GO: 'func solve(a []int) bool {\n\tfor i := 1; i < len(a); i++ {\n\t\tif a[i] < a[i-1] {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}',
    },
    tests: [
      { stdin: '1 2 2 5', expectedStdout: 'true', isSample: true },
      { stdin: '3 1', expectedStdout: 'false', isSample: true },
      { stdin: '', expectedStdout: 'true' },
      { stdin: '4', expectedStdout: 'true' },
      { stdin: '-3 0 7', expectedStdout: 'true' },
      { stdin: '5 4 3', expectedStdout: 'false' },
    ],
  }),

  p({
    ...B,
    slug: 'reverse-a-list',
    title: 'Back to Front',
    patternTags: ['loops', 'arrays', 'indexing'],
    signatureId: 'fn:ints->ints',
    avgSolveSeconds: 200,
    promptMarkdown: ask(
      'Return the same numbers in the opposite order.',
      'input:  1 2 3\noutput: 3 2 1',
      'Repeated values keep their relative order reversed along with everything else. An empty list comes back empty.',
    ),
    editorialMarkdown: why(
      'Walk backwards, append forwards',
      'The clearest version builds a new list: start at the last index and step down to zero, appending each value. Position `i` of the output is position `n - 1 - i` of the input, and writing that formula down once is what stops the guessing.',
      'The quiet mistake is the swap-in-place version. Swapping `a[i]` with `a[n - 1 - i]` works, but only if the loop stops at the **middle**. Run it over the whole list and every pair gets swapped twice, so the list comes back exactly as it started — and on a palindromic test case, or a two-element one, that bug produces the correct answer anyway and hides. Building a new list has no midpoint to get wrong.',
      'O(n) time and O(n) space for the returned list; the in-place swap version is O(1) extra space, which is the only reason to prefer it.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  const o = [];\n  for (let i = a.length - 1; i >= 0; i--) o.push(a[i]);\n  return o;\n}',
      TYPESCRIPT:
        'function solve(a: number[]): number[] {\n  const o: number[] = [];\n  for (let i = a.length - 1; i >= 0; i--) o.push(a[i]);\n  return o;\n}',
      PYTHON: 'def solve(a):\n    o = []\n    for i in range(len(a) - 1, -1, -1):\n        o.append(a[i])\n    return o',
      JAVA: '    static int[] solve(int[] a) {\n        int n = a.length;\n        int[] o = new int[n];\n        for (int i = 0; i < n; i++) o[i] = a[n - 1 - i];\n        return o;\n    }',
      CPP: 'vector<int> solve(vector<int> a) {\n    vector<int> o;\n    for (int i = (int) a.size() - 1; i >= 0; i--) o.push_back(a[i]);\n    return o;\n}',
      GO: 'func solve(a []int) []int {\n\to := []int{}\n\tfor i := len(a) - 1; i >= 0; i-- {\n\t\to = append(o, a[i])\n\t}\n\treturn o\n}',
    },
    tests: [
      { stdin: '1 2 3', expectedStdout: '3 2 1', isSample: true },
      { stdin: '', expectedStdout: '', isSample: true },
      { stdin: '7', expectedStdout: '7' },
      { stdin: '1 1 2', expectedStdout: '2 1 1' },
      { stdin: '-1 5', expectedStdout: '5 -1' },
    ],
  }),

  p({
    ...B,
    slug: 'count-distinct-values',
    title: 'How Many Different Numbers?',
    patternTags: ['arrays', 'sets', 'deduplication'],
    signatureId: 'fn:ints->int',
    avgSolveSeconds: 240,
    promptMarkdown: ask(
      'Count how many **different** numbers appear in a list, however many times each one shows up.',
      'input:  1 2 2 3 1\noutput: 3',
      'The distinct values there are `1`, `2` and `3`. A list where every number is the same gives `1`. An empty list gives `0`.',
    ),
    editorialMarkdown: why(
      'A set answers "have I seen this before?"',
      'Put every number into a set and ask the set how big it is. A set stores each value at most once, so insertion does the deduplicating for you and the size is the answer. The reason it is fast is hashing: checking membership does not scan what is already stored, it jumps straight to where the value would be.',
      'The quiet mistake is counting positions where the value differs from the previous one — that works beautifully on `1 1 2 3` and is wrong on `1 2 1`, which has three positions but only two distinct values. That trick is valid only on a **sorted** list, and nothing in this statement promises sorting. When a shortcut depends on an assumption, the assumption has to be written down somewhere or it is a bug waiting for the wrong input.',
      'O(n) average time thanks to hashing, and O(k) space where `k` is the number of distinct values — the memory, not the time, is what this approach spends.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  const seen = new Set();\n  for (const n of a) seen.add(n);\n  return seen.size;\n}',
      TYPESCRIPT:
        'function solve(a: number[]): number {\n  const seen = new Set<number>();\n  for (const n of a) seen.add(n);\n  return seen.size;\n}',
      PYTHON: 'def solve(a):\n    seen = set()\n    for n in a:\n        seen.add(n)\n    return len(seen)',
      JAVA: '    static int solve(int[] a) {\n        Set<Integer> seen = new HashSet<>();\n        for (int n : a) seen.add(n);\n        return seen.size();\n    }',
      CPP: 'int solve(vector<int> a) {\n    set<int> seen;\n    for (int n : a) seen.insert(n);\n    return (int) seen.size();\n}',
      GO: 'func solve(a []int) int {\n\tseen := map[int]bool{}\n\tfor _, n := range a {\n\t\tseen[n] = true\n\t}\n\treturn len(seen)\n}',
    },
    tests: [
      { stdin: '1 2 2 3 1', expectedStdout: '3', isSample: true },
      { stdin: '4 4 4', expectedStdout: '1', isSample: true },
      { stdin: '', expectedStdout: '0' },
      { stdin: '5', expectedStdout: '1' },
      { stdin: '-1 1 -1', expectedStdout: '2' },
    ],
  }),

  p({
    ...B,
    slug: 'alternating-sum',
    title: 'Plus, Minus, Plus, Minus',
    patternTags: ['loops', 'arrays', 'indexing', 'accumulator'],
    signatureId: 'fn:ints->int',
    avgSolveSeconds: 240,
    promptMarkdown: ask(
      'Add the first number, subtract the second, add the third, subtract the fourth, and so on to the end of the list.',
      'input:  1 2 3 4\noutput: -2',
      '`1 - 2 + 3 - 4 = -2`. A one-element list gives that element unchanged. An empty list gives `0`.',
    ),
    editorialMarkdown: why(
      'The index decides the sign',
      'Loop by index rather than by value, because the sign depends on **where** a number is, not on what it is. Even indices — `0`, `2`, `4` and so on — are added and odd ones are subtracted, so `if (i % 2 == 0) t += a[i]; else t -= a[i];` is the whole computation. An equivalent trick is to keep a `sign` variable holding `1` or `-1` and flip it — `sign = -sign` — after each step.',
      'The quiet mistake is subtracting a negative number and expecting the total to go down. In `-1 -2` the answer is `-1 - (-2) = 1`, a positive result from two negative inputs. That is arithmetic behaving correctly, but it reads as wrong at a glance, so people "fix" it by taking an absolute value somewhere and break every other case. Trust the two-line rule and test the negative case rather than eyeballing it.',
      'O(n) time, O(1) space. Nothing here depends on the values, only on the length, so the cost is exactly one pass.',
    ),
    referenceSolution: {
      JAVASCRIPT:
        'function solve(a) {\n  let t = 0;\n  for (let i = 0; i < a.length; i++) {\n    if (i % 2 === 0) t += a[i];\n    else t -= a[i];\n  }\n  return t;\n}',
      TYPESCRIPT:
        'function solve(a: number[]): number {\n  let t = 0;\n  for (let i = 0; i < a.length; i++) {\n    if (i % 2 === 0) t += a[i];\n    else t -= a[i];\n  }\n  return t;\n}',
      PYTHON:
        'def solve(a):\n    t = 0\n    for i in range(len(a)):\n        if i % 2 == 0:\n            t += a[i]\n        else:\n            t -= a[i]\n    return t',
      JAVA: '    static int solve(int[] a) {\n        int t = 0;\n        for (int i = 0; i < a.length; i++) {\n            if (i % 2 == 0) t += a[i];\n            else t -= a[i];\n        }\n        return t;\n    }',
      CPP: 'int solve(vector<int> a) {\n    int t = 0;\n    for (size_t i = 0; i < a.size(); i++) {\n        if (i % 2 == 0) t += a[i];\n        else t -= a[i];\n    }\n    return t;\n}',
      GO: 'func solve(a []int) int {\n\tt := 0\n\tfor i, n := range a {\n\t\tif i%2 == 0 {\n\t\t\tt += n\n\t\t} else {\n\t\t\tt -= n\n\t\t}\n\t}\n\treturn t\n}',
    },
    tests: [
      { stdin: '1 2 3 4', expectedStdout: '-2', isSample: true },
      { stdin: '', expectedStdout: '0', isSample: true },
      { stdin: '5', expectedStdout: '5' },
      { stdin: '1 1 1', expectedStdout: '1' },
      { stdin: '-1 -2', expectedStdout: '1' },
    ],
  }),

  p({
    ...B,
    slug: 'cap-at-maximum',
    title: 'Cap Everything at a Maximum',
    patternTags: ['loops', 'arrays', 'transform', 'clamping'],
    signatureId: 'fn:ints,int->ints',
    avgSolveSeconds: 200,
    promptMarkdown: ask(
      'Replace every number that is above a given cap with the cap itself. Numbers at or below the cap are left alone.\n\nThe first line is the list, the second is the cap.',
      'input:  1 9 4 7\n        5\noutput: 1 5 4 5',
      'A number exactly equal to the cap is unchanged. The cap may be negative. An empty list comes back empty.',
    ),
    editorialMarkdown: why(
      'Clamping is a transform, not a filter',
      'One value in, one value out: `n > cap ? cap : n`, appended for every element. The output always has the same length as the input, because nothing is being removed — the values above the cap are being *rewritten*, not dropped.',
      'The quiet mistake is exactly that confusion: writing `if (n <= cap) output.push(n)` skips the big numbers instead of capping them, and on a list where nothing exceeds the cap it gives the right answer, so a lazy test suite says it passes. The other quiet one is the boundary — `n > cap` and `n >= cap` differ only on values that equal the cap, which is the single case most people never write a test for. The statement names it for you; write that test.',
      'O(n) time and O(n) for the returned list. Each element is examined once and the comparison is constant work.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a, b) {\n  const o = [];\n  for (const n of a) o.push(n > b ? b : n);\n  return o;\n}',
      TYPESCRIPT:
        'function solve(a: number[], b: number): number[] {\n  const o: number[] = [];\n  for (const n of a) o.push(n > b ? b : n);\n  return o;\n}',
      PYTHON: 'def solve(a, b):\n    o = []\n    for n in a:\n        o.append(b if n > b else n)\n    return o',
      JAVA: '    static int[] solve(int[] a, int b) {\n        int[] o = new int[a.length];\n        for (int i = 0; i < a.length; i++) o[i] = a[i] > b ? b : a[i];\n        return o;\n    }',
      CPP: 'vector<int> solve(vector<int> a, int b) {\n    vector<int> o;\n    for (int n : a) o.push_back(n > b ? b : n);\n    return o;\n}',
      GO: 'func solve(a []int, b int) []int {\n\to := []int{}\n\tfor _, n := range a {\n\t\tif n > b {\n\t\t\tn = b\n\t\t}\n\t\to = append(o, n)\n\t}\n\treturn o\n}',
    },
    tests: [
      { stdin: '1 9 4 7\n5', expectedStdout: '1 5 4 5', isSample: true },
      { stdin: '5 5\n5', expectedStdout: '5 5', isSample: true },
      { stdin: '\n3', expectedStdout: '' },
      { stdin: '-3 10\n0', expectedStdout: '-3 0' },
      { stdin: '1 2\n9', expectedStdout: '1 2' },
    ],
  }),

  p({
    ...B,
    slug: 'sum-of-a-digit-string',
    title: 'Add Up a Line of Digits',
    patternTags: ['strings', 'parsing', 'characters', 'accumulator'],
    signatureId: 'fn:string->int',
    avgSolveSeconds: 240,
    promptMarkdown: ask(
      'A line contains only digit characters. Add them up as numbers and return the total.',
      'input:  1234\noutput: 10',
      '`1 + 2 + 3 + 4 = 10`. An empty line gives `0`. There are no spaces, signs or other characters — only `0` to `9`.',
    ),
    editorialMarkdown: why(
      'A digit character is not the number it looks like',
      "The character `'7'` and the number `7` are different values. Characters are stored as numeric codes, and the codes for `'0'` through `'9'` sit next to each other in order — so subtracting the code of `'0'` from the code of any digit gives you the number it stands for. `'7' - '0'` is `7`, in every language here.",
      "The quiet mistake is adding the characters directly and getting a wildly large total, or — in JavaScript and Python — concatenating instead of adding, so `1234` comes back as the string `\"1234\"` rather than `10`. Neither raises an error. Whichever language you are in, convert each character to a number *deliberately* before it reaches the accumulator, and the whole class of bug disappears.",
      'O(n) time in the length of the line, O(1) space — one running total, one character at a time.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let t = 0;\n  for (const ch of a) t += Number(ch);\n  return t;\n}',
      TYPESCRIPT: 'function solve(a: string): number {\n  let t = 0;\n  for (const ch of a) t += Number(ch);\n  return t;\n}',
      PYTHON: 'def solve(a):\n    t = 0\n    for ch in a:\n        t += int(ch)\n    return t',
      JAVA: "    static int solve(String a) {\n        int t = 0;\n        for (char ch : a.toCharArray()) t += ch - '0';\n        return t;\n    }",
      CPP: "int solve(string a) {\n    int t = 0;\n    for (char ch : a) t += ch - '0';\n    return t;\n}",
      GO: "func solve(a string) int {\n\tt := 0\n\tfor _, ch := range a {\n\t\tt += int(ch - '0')\n\t}\n\treturn t\n}",
    },
    tests: [
      { stdin: '1234', expectedStdout: '10', isSample: true },
      { stdin: '', expectedStdout: '0', isSample: true },
      { stdin: '0', expectedStdout: '0' },
      { stdin: '999', expectedStdout: '27' },
      { stdin: '50005', expectedStdout: '10' },
    ],
  }),

  p({
    ...B,
    slug: 'count-uppercase-letters',
    title: 'Count the Capitals',
    patternTags: ['strings', 'characters', 'counting'],
    signatureId: 'fn:string->int',
    avgSolveSeconds: 200,
    promptMarkdown: ask(
      'Count how many characters in a line are capital letters, `A` to `Z`.',
      'input:  Hello World\noutput: 2',
      'Digits, spaces and punctuation are not letters and never count. An empty line gives `0`.',
    ),
    editorialMarkdown: why(
      'Range check, not a case comparison',
      "Walk the characters and count the ones between `'A'` and `'Z'` inclusive. Letter codes are contiguous and in alphabetical order, so a single range test recognises every capital, and every language here also ships a built-in that does the same thing.",
      'The quiet mistake is testing `ch == toUpperCase(ch)`. It looks elegant and it is wrong, because a space, a digit and a comma are all equal to their own upper-case form — so `A1b2C` reports four "capitals" instead of two. The test you want is "is a letter **and** is upper case", and the range check answers both halves at once. This is worth noticing whenever a shortcut only checks half of what you meant.',
      'O(n) time in the length of the line, O(1) space. The cost is one comparison per character and nothing else.',
    ),
    referenceSolution: {
      JAVASCRIPT:
        "function solve(a) {\n  let c = 0;\n  for (const ch of a) if (ch >= 'A' && ch <= 'Z') c++;\n  return c;\n}",
      TYPESCRIPT:
        "function solve(a: string): number {\n  let c = 0;\n  for (const ch of a) if (ch >= 'A' && ch <= 'Z') c++;\n  return c;\n}",
      PYTHON: "def solve(a):\n    c = 0\n    for ch in a:\n        if 'A' <= ch <= 'Z':\n            c += 1\n    return c",
      JAVA: "    static int solve(String a) {\n        int c = 0;\n        for (char ch : a.toCharArray()) if (ch >= 'A' && ch <= 'Z') c++;\n        return c;\n    }",
      CPP: "int solve(string a) {\n    int c = 0;\n    for (char ch : a) if (ch >= 'A' && ch <= 'Z') c++;\n    return c;\n}",
      GO: "func solve(a string) int {\n\tc := 0\n\tfor _, ch := range a {\n\t\tif ch >= 'A' && ch <= 'Z' {\n\t\t\tc++\n\t\t}\n\t}\n\treturn c\n}",
    },
    tests: [
      { stdin: 'Hello World', expectedStdout: '2', isSample: true },
      { stdin: 'A1b2C', expectedStdout: '2', isSample: true },
      { stdin: '', expectedStdout: '0' },
      { stdin: 'abc', expectedStdout: '0' },
      { stdin: 'ABC', expectedStdout: '3' },
    ],
  }),

  p({
    ...B,
    slug: 'nth-character',
    title: 'The Character at Position N',
    patternTags: ['strings', 'indexing', 'bounds', 'edge-cases'],
    signatureId: 'fn:string,int->string',
    avgSolveSeconds: 220,
    promptMarkdown: ask(
      'Return the character at a given position in a line, as a one-character string.\n\nPositions are counted from **zero**: position `0` is the first character. The first line is the text, the second is the position.',
      'input:  hello\n        1\noutput: e',
      'If the position is past the end of the line there is no such character — return an empty line. The position is never negative.',
    ),
    editorialMarkdown: why(
      'Check the bound before you read',
      'Two steps, in this order: is the position less than the length, and only then read it. Zero-based counting means the valid positions are `0` up to `length - 1`, so `hello` has positions `0` through `4` and position `5` is already past the end.',
      'The quiet mistake is `position <= length` as the guard, which lets exactly one bad read through — the classic off-by-one, and the one that is hardest to see because every test except the boundary passes. What makes it quiet in particular is that the languages here disagree about the punishment: Java and C++ raise or read past the buffer, while JavaScript hands back `undefined` and carries on until the value shows up somewhere far away as `"undefined"` in your output. Deciding the bound yourself means the code behaves the same everywhere.',
      'O(1) time and space — a length comparison and a single character read, neither of which depends on how long the line is.',
    ),
    referenceSolution: {
      JAVASCRIPT: "function solve(a, b) {\n  if (b >= a.length) return '';\n  return a[b];\n}",
      TYPESCRIPT: "function solve(a: string, b: number): string {\n  if (b >= a.length) return '';\n  return a[b];\n}",
      PYTHON: "def solve(a, b):\n    if b >= len(a):\n        return ''\n    return a[b]",
      JAVA: '    static String solve(String a, int b) {\n        if (b >= a.length()) return "";\n        return a.substring(b, b + 1);\n    }',
      CPP: 'string solve(string a, int b) {\n    if (b >= (int) a.size()) return string("");\n    return string(1, a[b]);\n}',
      GO: 'func solve(a string, b int) string {\n\tif b >= len(a) {\n\t\treturn ""\n\t}\n\treturn a[b : b+1]\n}',
    },
    tests: [
      { stdin: 'hello\n1', expectedStdout: 'e', isSample: true },
      { stdin: 'hello\n9', expectedStdout: '', isSample: true },
      { stdin: 'abc\n0', expectedStdout: 'a' },
      { stdin: 'abc\n2', expectedStdout: 'c' },
      { stdin: '\n0', expectedStdout: '' },
    ],
  }),

  p({
    ...B,
    slug: 'count-substring-occurrences',
    title: 'How Many Times Does It Appear?',
    patternTags: ['strings', 'search', 'substring', 'counting'],
    signatureId: 'fn:string,string->int',
    avgSolveSeconds: 280,
    promptMarkdown: ask(
      'Count how many times the second line appears inside the first.\n\nMatches are counted **without overlapping**: after a match, the search resumes at the character right after it.',
      'input:  aaaa\n        aa\noutput: 2',
      '`aaaa` contains `aa` twice this way, not three times. If the pattern never appears the answer is `0`. The pattern is never empty.',
    ),
    editorialMarkdown: why(
      'Find, then jump past the match',
      'Search for the pattern from a moving start position. On a hit, add one to the count and move the start to the end of the match — that jump is what makes the counting non-overlapping. When the search finds nothing, stop.',
      "The quiet mistake is advancing the start by one instead of by the pattern's length. That counts overlapping matches, so `aaaa` with `aa` gives three, and on the example `banana` with `ana` it gives two instead of one. Both numbers are defensible answers to *some* question, which is why the statement has to say which one it wants — and why an implementation that silently picks the other one is not obviously broken to anyone reading it. The second quiet mistake is forgetting to advance at all, which never terminates.",
      'O(n x m) in the worst case for the hand-written version, where `n` is the text length and `m` the pattern length; the built-in search in each language is usually better. Space is O(1).',
    ),
    referenceSolution: {
      JAVASCRIPT:
        'function solve(a, b) {\n  let c = 0;\n  let i = a.indexOf(b);\n  while (i !== -1) {\n    c++;\n    i = a.indexOf(b, i + b.length);\n  }\n  return c;\n}',
      TYPESCRIPT:
        'function solve(a: string, b: string): number {\n  let c = 0;\n  let i = a.indexOf(b);\n  while (i !== -1) {\n    c++;\n    i = a.indexOf(b, i + b.length);\n  }\n  return c;\n}',
      PYTHON: 'def solve(a, b):\n    return a.count(b)',
      JAVA: '    static int solve(String a, String b) {\n        int c = 0;\n        int i = a.indexOf(b);\n        while (i != -1) {\n            c++;\n            i = a.indexOf(b, i + b.length());\n        }\n        return c;\n    }',
      CPP: 'int solve(string a, string b) {\n    int c = 0;\n    size_t i = a.find(b);\n    while (i != string::npos) {\n        c++;\n        i = a.find(b, i + b.size());\n    }\n    return c;\n}',
      GO: 'func solve(a string, b string) int {\n\treturn strings.Count(a, b)\n}',
    },
    tests: [
      { stdin: 'aaaa\naa', expectedStdout: '2', isSample: true },
      { stdin: 'banana\nana', expectedStdout: '1', isSample: true },
      { stdin: 'hello\nz', expectedStdout: '0' },
      { stdin: 'aaa\na', expectedStdout: '3' },
      { stdin: '\nx', expectedStdout: '0' },
    ],
  }),

  p({
    ...B,
    slug: 'swap-letter-case',
    title: 'Swap Upper and Lower',
    patternTags: ['strings', 'characters', 'case-conversion', 'transform'],
    signatureId: 'fn:string->string',
    avgSolveSeconds: 240,
    promptMarkdown: ask(
      'Return the line with every capital letter made lower case and every lower-case letter made capital.',
      'input:  Hello World\noutput: hELLO wORLD',
      'Anything that is not a letter — spaces, digits, punctuation — is copied through unchanged. An empty line comes back empty.',
    ),
    editorialMarkdown: why(
      'Three cases per character, not two',
      'Build the result one character at a time. For each one there are exactly three possibilities: it is upper case and becomes lower, it is lower case and becomes upper, or it is neither and is copied as it is. Missing the third branch is what breaks this problem.',
      'The quiet mistake is writing it as an if/else with only two arms — "if upper, lower it; otherwise upper it". Now every space and digit goes through the upper-casing path. For a space or a digit upper-casing changes nothing, so the output still looks right, and the bug hides completely until a character shows up whose upper-case form differs from itself in a way you did not intend. An explicit "otherwise, keep it" arm states what you actually meant and cannot drift.',
      'O(n) time and O(n) space for the new string — one pass, constant work per character, and the output is the same length as the input.',
    ),
    referenceSolution: {
      JAVASCRIPT:
        "function solve(a) {\n  let o = '';\n  for (const ch of a) {\n    if (ch >= 'A' && ch <= 'Z') o += ch.toLowerCase();\n    else if (ch >= 'a' && ch <= 'z') o += ch.toUpperCase();\n    else o += ch;\n  }\n  return o;\n}",
      TYPESCRIPT:
        "function solve(a: string): string {\n  let o = '';\n  for (const ch of a) {\n    if (ch >= 'A' && ch <= 'Z') o += ch.toLowerCase();\n    else if (ch >= 'a' && ch <= 'z') o += ch.toUpperCase();\n    else o += ch;\n  }\n  return o;\n}",
      PYTHON:
        "def solve(a):\n    o = []\n    for ch in a:\n        if 'A' <= ch <= 'Z':\n            o.append(ch.lower())\n        elif 'a' <= ch <= 'z':\n            o.append(ch.upper())\n        else:\n            o.append(ch)\n    return ''.join(o)",
      JAVA: "    static String solve(String a) {\n        StringBuilder sb = new StringBuilder();\n        for (char ch : a.toCharArray()) {\n            if (ch >= 'A' && ch <= 'Z') sb.append((char) (ch + 32));\n            else if (ch >= 'a' && ch <= 'z') sb.append((char) (ch - 32));\n            else sb.append(ch);\n        }\n        return sb.toString();\n    }",
      CPP: "string solve(string a) {\n    string o;\n    for (char ch : a) {\n        if (ch >= 'A' && ch <= 'Z') o += (char) (ch + 32);\n        else if (ch >= 'a' && ch <= 'z') o += (char) (ch - 32);\n        else o += ch;\n    }\n    return o;\n}",
      GO: "func solve(a string) string {\n\tb := []byte(a)\n\tfor i, ch := range b {\n\t\tif ch >= 'A' && ch <= 'Z' {\n\t\t\tb[i] = ch + 32\n\t\t} else if ch >= 'a' && ch <= 'z' {\n\t\t\tb[i] = ch - 32\n\t\t}\n\t}\n\treturn string(b)\n}",
    },
    tests: [
      { stdin: 'Hello World', expectedStdout: 'hELLO wORLD', isSample: true },
      { stdin: 'A1b2', expectedStdout: 'a1B2', isSample: true },
      { stdin: '', expectedStdout: '' },
      { stdin: 'abc', expectedStdout: 'ABC' },
      { stdin: 'XYZ', expectedStdout: 'xyz' },
    ],
  }),
];
