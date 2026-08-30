import { AUTHORED, type ProblemDefinition } from '../problem.js';

/**
 * Tier 0 — foundations, third batch. Completes the tier.
 *
 * Same audience and contract as `tier0.ts`; see docs/AUTHORING.md. Written in a
 * more compact form than the first two batches — the helpers below build the
 * statement and editorial skeletons, so each entry carries only what is
 * actually different about it. The prose obligations are unchanged: name the
 * edge case, explain the quiet mistake, give the complexity.
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

export const TIER_0C_PROBLEMS: ProblemDefinition[] = [
  p({
    ...B,
    slug: 'count-odd-numbers',
    title: 'Count the Odd Numbers',
    patternTags: ['loops', 'arrays', 'modulo'],
    signatureId: 'fn:ints->int',
    avgSolveSeconds: 180,
    promptMarkdown: ask(
      'Count how many numbers in a list are odd.\n\nA number is odd when dividing by 2 leaves a remainder.',
      'input:  1 2 3 4\noutput: 2',
      'Negative odd numbers like `-3` count too. An empty list has `0`.',
    ),
    editorialMarkdown: why(
      'Test for "not even", not for "equals one"',
      'The accumulator pattern again: a counter outside the loop, `+1` when the test passes.',
      'The trap is writing `n % 2 == 1`. In most of these languages `-3 % 2` is `-1`, not `1`, so every negative odd number is silently missed. Write `n % 2 != 0` instead — it is true for both `1` and `-1`, and it says what you actually mean.',
      'O(n) time, O(1) space.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let c = 0;\n  for (const n of a) if (n % 2 !== 0) c++;\n  return c;\n}',
      TYPESCRIPT: 'function solve(a: number[]): number {\n  let c = 0;\n  for (const n of a) if (n % 2 !== 0) c++;\n  return c;\n}',
      PYTHON: 'def solve(a):\n    c = 0\n    for n in a:\n        if n % 2 != 0:\n            c += 1\n    return c',
      JAVA: '    static int solve(int[] a) {\n        int c = 0;\n        for (int n : a) if (n % 2 != 0) c++;\n        return c;\n    }',
      CPP: 'int solve(vector<int> a) {\n    int c = 0;\n    for (int n : a) if (n % 2 != 0) c++;\n    return c;\n}',
      GO: 'func solve(a []int) int {\n\tc := 0\n\tfor _, n := range a {\n\t\tif n%2 != 0 {\n\t\t\tc++\n\t\t}\n\t}\n\treturn c\n}',
    },
    tests: [
      { stdin: '1 2 3 4', expectedStdout: '2', isSample: true },
      { stdin: '', expectedStdout: '0', isSample: true },
      { stdin: '2 4 6', expectedStdout: '0' },
      { stdin: '-3 -1', expectedStdout: '2' },
      { stdin: '7', expectedStdout: '1' },
    ],
  }),

  p({
    ...B,
    slug: 'product-of-list',
    title: 'Multiply Everything',
    patternTags: ['loops', 'arrays', 'accumulator'],
    signatureId: 'fn:ints->int',
    avgSolveSeconds: 200,
    promptMarkdown: ask(
      'Multiply every number in a list together.',
      'input:  2 3 4\noutput: 24',
      'An empty list gives `1`. The inputs are small enough that the answer fits in a normal integer.',
    ),
    editorialMarkdown: why(
      'The identity for multiplication is one',
      'Same accumulator as summing, but the starting value is `1`, not `0`. Multiplying by one changes nothing, which is exactly what you want before you have multiplied anything.',
      'Start at `0` and every answer is `0` — obvious once you see it, and invisible if you never test a non-empty list. The empty list returning `1` is not a special case either; the loop simply never runs, which is why the statement can state it without any extra code.',
      'O(n) time, O(1) space.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let t = 1;\n  for (const n of a) t *= n;\n  return t;\n}',
      TYPESCRIPT: 'function solve(a: number[]): number {\n  let t = 1;\n  for (const n of a) t *= n;\n  return t;\n}',
      PYTHON: 'def solve(a):\n    t = 1\n    for n in a:\n        t *= n\n    return t',
      JAVA: '    static int solve(int[] a) {\n        int t = 1;\n        for (int n : a) t *= n;\n        return t;\n    }',
      CPP: 'int solve(vector<int> a) {\n    int t = 1;\n    for (int n : a) t *= n;\n    return t;\n}',
      GO: 'func solve(a []int) int {\n\tt := 1\n\tfor _, n := range a {\n\t\tt *= n\n\t}\n\treturn t\n}',
    },
    tests: [
      { stdin: '2 3 4', expectedStdout: '24', isSample: true },
      { stdin: '', expectedStdout: '1', isSample: true },
      { stdin: '5', expectedStdout: '5' },
      { stdin: '2 0 9', expectedStdout: '0' },
      { stdin: '-2 3', expectedStdout: '-6' },
    ],
  }),

  p({
    ...B,
    slug: 'absolute-values',
    title: 'Drop the Minus Signs',
    patternTags: ['loops', 'arrays', 'transform'],
    signatureId: 'fn:ints->ints',
    avgSolveSeconds: 180,
    promptMarkdown: ask(
      'Replace every number with its distance from zero.',
      'input:  -3 2 -1\noutput: 3 2 1',
      'Zero stays zero. An empty list comes back empty.',
    ),
    editorialMarkdown: why(
      'Transform every element',
      'The shape is: build a new list, append one transformed value per input value. Every language has an absolute-value function, and writing `n < 0 ? -n : n` by hand is equally fine.',
      'The quiet mistake is modifying the input list while iterating it, in languages where that aliases the caller\'s data. Building a new list avoids the question entirely, and "return a new thing rather than mutating the argument" is a habit worth having by default.',
      'O(n) time, O(n) for the output.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  const o = [];\n  for (const n of a) o.push(n < 0 ? -n : n);\n  return o;\n}',
      TYPESCRIPT: 'function solve(a: number[]): number[] {\n  const o: number[] = [];\n  for (const n of a) o.push(n < 0 ? -n : n);\n  return o;\n}',
      PYTHON: 'def solve(a):\n    return [abs(n) for n in a]',
      JAVA: '    static int[] solve(int[] a) {\n        int[] o = new int[a.length];\n        for (int i = 0; i < a.length; i++) o[i] = Math.abs(a[i]);\n        return o;\n    }',
      CPP: 'vector<int> solve(vector<int> a) {\n    vector<int> o;\n    for (int n : a) o.push_back(n < 0 ? -n : n);\n    return o;\n}',
      GO: 'func solve(a []int) []int {\n\to := []int{}\n\tfor _, n := range a {\n\t\tif n < 0 {\n\t\t\tn = -n\n\t\t}\n\t\to = append(o, n)\n\t}\n\treturn o\n}',
    },
    tests: [
      { stdin: '-3 2 -1', expectedStdout: '3 2 1', isSample: true },
      { stdin: '', expectedStdout: '', isSample: true },
      { stdin: '0', expectedStdout: '0' },
      { stdin: '-5 -5', expectedStdout: '5 5' },
      { stdin: '1 2 3', expectedStdout: '1 2 3' },
    ],
  }),

  p({
    ...B,
    slug: 'double-each-number',
    title: 'Double Everything',
    patternTags: ['loops', 'arrays', 'transform'],
    signatureId: 'fn:ints->ints',
    avgSolveSeconds: 150,
    promptMarkdown: ask(
      'Return a list where every number has been multiplied by two.',
      'input:  1 2 3\noutput: 2 4 6',
      'An empty list comes back empty.',
    ),
    editorialMarkdown: why(
      'One in, one out',
      'The simplest possible transform: the output has exactly the same length as the input, with each value replaced. This is what `map` means in languages that have it, and writing the loop once makes the word concrete.',
      'The mistake to avoid is appending conditionally — a transform is not a filter. If your loop can skip an element, the lengths no longer match and you have written a different function than the one asked for.',
      'O(n) time, O(n) for the output.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  const o = [];\n  for (const n of a) o.push(n * 2);\n  return o;\n}',
      TYPESCRIPT: 'function solve(a: number[]): number[] {\n  const o: number[] = [];\n  for (const n of a) o.push(n * 2);\n  return o;\n}',
      PYTHON: 'def solve(a):\n    return [n * 2 for n in a]',
      JAVA: '    static int[] solve(int[] a) {\n        int[] o = new int[a.length];\n        for (int i = 0; i < a.length; i++) o[i] = a[i] * 2;\n        return o;\n    }',
      CPP: 'vector<int> solve(vector<int> a) {\n    vector<int> o;\n    for (int n : a) o.push_back(n * 2);\n    return o;\n}',
      GO: 'func solve(a []int) []int {\n\to := []int{}\n\tfor _, n := range a {\n\t\to = append(o, n*2)\n\t}\n\treturn o\n}',
    },
    tests: [
      { stdin: '1 2 3', expectedStdout: '2 4 6', isSample: true },
      { stdin: '', expectedStdout: '', isSample: true },
      { stdin: '0', expectedStdout: '0' },
      { stdin: '-2 5', expectedStdout: '-4 10' },
      { stdin: '7', expectedStdout: '14' },
    ],
  }),

  p({
    ...B,
    slug: 'count-greater-than',
    title: 'How Many Are Bigger?',
    patternTags: ['loops', 'arrays', 'filtering'],
    signatureId: 'fn:ints,int->int',
    avgSolveSeconds: 200,
    promptMarkdown: ask(
      'Count how many numbers are strictly greater than a threshold.\n\nThe first line is the list, the second the threshold.',
      'input:  1 5 3 9\n        3\noutput: 2',
      'Strictly greater: a number equal to the threshold does not count. If none qualify, the answer is `0`.',
    ),
    editorialMarkdown: why(
      'Strictly, or not strictly',
      'A counter and a condition. The whole problem is which comparison to write.',
      '"Greater than" is `>`; "greater than or equal" is `>=`. The statement says strictly, so `5 > 3` counts and `3 > 3` does not. This boundary is the single most common off-by-one in real code, and the fix is not cleverness — it is reading the requirement and picking the operator deliberately. When a specification does not say, that is the question to ask before writing anything.',
      'O(n) time, O(1) space.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a, b) {\n  let c = 0;\n  for (const n of a) if (n > b) c++;\n  return c;\n}',
      TYPESCRIPT: 'function solve(a: number[], b: number): number {\n  let c = 0;\n  for (const n of a) if (n > b) c++;\n  return c;\n}',
      PYTHON: 'def solve(a, b):\n    c = 0\n    for n in a:\n        if n > b:\n            c += 1\n    return c',
      JAVA: '    static int solve(int[] a, int b) {\n        int c = 0;\n        for (int n : a) if (n > b) c++;\n        return c;\n    }',
      CPP: 'int solve(vector<int> a, int b) {\n    int c = 0;\n    for (int n : a) if (n > b) c++;\n    return c;\n}',
      GO: 'func solve(a []int, b int) int {\n\tc := 0\n\tfor _, n := range a {\n\t\tif n > b {\n\t\t\tc++\n\t\t}\n\t}\n\treturn c\n}',
    },
    tests: [
      { stdin: '1 5 3 9\n3', expectedStdout: '2', isSample: true },
      { stdin: '3 3 3\n3', expectedStdout: '0', isSample: true },
      { stdin: '\n0', expectedStdout: '0' },
      { stdin: '-1 0 1\n-2', expectedStdout: '3' },
      { stdin: '10\n5', expectedStdout: '1' },
    ],
  }),

  p({
    ...B,
    slug: 'sum-of-squares',
    title: 'Sum of Squares',
    patternTags: ['loops', 'arrays', 'accumulator'],
    signatureId: 'fn:ints->int',
    avgSolveSeconds: 180,
    promptMarkdown: ask(
      'Square every number, then add the results together.',
      'input:  1 2 3\noutput: 14',
      '`1 + 4 + 9 = 14`. An empty list gives `0`. Negative numbers square to positives.',
    ),
    editorialMarkdown: why(
      'Transform and accumulate in one pass',
      'You could build a list of squares and then sum it, and that reads well. Doing both in one loop — `total += n * n` — avoids allocating the intermediate list, and the two-step version is worth writing once to see they are the same computation.',
      'The quiet detail is negatives: `-3` squared is `9`, so the total is never smaller for having negative inputs. Anyone who reaches for an absolute value first has done extra work that changes nothing.',
      'O(n) time, O(1) space.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let t = 0;\n  for (const n of a) t += n * n;\n  return t;\n}',
      TYPESCRIPT: 'function solve(a: number[]): number {\n  let t = 0;\n  for (const n of a) t += n * n;\n  return t;\n}',
      PYTHON: 'def solve(a):\n    return sum(n * n for n in a)',
      JAVA: '    static int solve(int[] a) {\n        int t = 0;\n        for (int n : a) t += n * n;\n        return t;\n    }',
      CPP: 'int solve(vector<int> a) {\n    int t = 0;\n    for (int n : a) t += n * n;\n    return t;\n}',
      GO: 'func solve(a []int) int {\n\tt := 0\n\tfor _, n := range a {\n\t\tt += n * n\n\t}\n\treturn t\n}',
    },
    tests: [
      { stdin: '1 2 3', expectedStdout: '14', isSample: true },
      { stdin: '', expectedStdout: '0', isSample: true },
      { stdin: '-3', expectedStdout: '9' },
      { stdin: '0 0', expectedStdout: '0' },
      { stdin: '5 5', expectedStdout: '50' },
    ],
  }),

  p({
    ...B,
    slug: 'last-digit',
    title: 'The Last Digit',
    patternTags: ['arithmetic', 'modulo'],
    signatureId: 'fn:int->int',
    avgSolveSeconds: 150,
    promptMarkdown: ask(
      'Return the last digit of a number.\n\nThe input is zero or greater.',
      'input:  1234\noutput: 4',
      'The last digit of `0` is `0`.',
    ),
    editorialMarkdown: why(
      'Remainder by ten',
      '`n % 10` is the last digit, because dividing by ten shifts the decimal point one place and the remainder is whatever fell off the end. The same idea in base 2 gives you the lowest bit, which is how bit manipulation problems start.',
      'The alternative is converting to text and taking the last character, which works but then hands you a character rather than a number — and forgetting to convert it back is the quiet bug. The arithmetic version never leaves the numeric domain.',
      'O(1) time and space.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  return a % 10;\n}',
      TYPESCRIPT: 'function solve(a: number): number {\n  return a % 10;\n}',
      PYTHON: 'def solve(a):\n    return a % 10',
      JAVA: '    static int solve(int a) {\n        return a % 10;\n    }',
      CPP: 'int solve(int a) {\n    return a % 10;\n}',
      GO: 'func solve(a int) int {\n\treturn a % 10\n}',
    },
    tests: [
      { stdin: '1234', expectedStdout: '4', isSample: true },
      { stdin: '0', expectedStdout: '0', isSample: true },
      { stdin: '7', expectedStdout: '7' },
      { stdin: '100', expectedStdout: '0' },
      { stdin: '99', expectedStdout: '9' },
    ],
  }),

  p({
    ...B,
    slug: 'is-even-number',
    title: 'Is It Even?',
    patternTags: ['arithmetic', 'modulo', 'booleans'],
    signatureId: 'fn:int->bool',
    avgSolveSeconds: 150,
    promptMarkdown: ask(
      'Decide whether a number is even.',
      'input:  4\noutput: true',
      'Zero is even. Negative numbers can be even too.',
    ),
    editorialMarkdown: why(
      'Return the comparison, do not branch on it',
      'The answer is `n % 2 == 0`. That expression is already a boolean, so you can return it directly.',
      'The pattern worth unlearning is `if (test) return true; else return false;`. It is not wrong, but it says the same thing in four times the space, and the version that returns the comparison is the one that stays readable when the condition grows. Negative numbers are the correctness detail: `-4 % 2` is `0` in every one of these languages, so the simple test handles them.',
      'O(1) time and space.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  return a % 2 === 0;\n}',
      TYPESCRIPT: 'function solve(a: number): boolean {\n  return a % 2 === 0;\n}',
      PYTHON: 'def solve(a):\n    return a % 2 == 0',
      JAVA: '    static boolean solve(int a) {\n        return a % 2 == 0;\n    }',
      CPP: 'bool solve(int a) {\n    return a % 2 == 0;\n}',
      GO: 'func solve(a int) bool {\n\treturn a%2 == 0\n}',
    },
    tests: [
      { stdin: '4', expectedStdout: 'true', isSample: true },
      { stdin: '7', expectedStdout: 'false', isSample: true },
      { stdin: '0', expectedStdout: 'true' },
      { stdin: '-4', expectedStdout: 'true' },
      { stdin: '-3', expectedStdout: 'false' },
    ],
  }),

  p({
    ...B,
    slug: 'countdown-list',
    title: 'Count Down',
    patternTags: ['loops', 'arrays', 'descending'],
    signatureId: 'fn:int->ints',
    avgSolveSeconds: 180,
    promptMarkdown: ask(
      'Return the numbers from `n` down to 1.',
      'input:  5\noutput: 5 4 3 2 1',
      'If `n` is `0`, the answer is an empty list.',
    ),
    editorialMarkdown: why(
      'A loop that runs backwards',
      'Three parts to get right: start at `n`, keep going while the counter is at least `1`, and step by `-1` each time.',
      'The quiet mistake is the stopping condition. `> 0` and `>= 1` both work here; `> 1` drops the final `1` and the output still looks plausible. And when `n` is `0` the loop must not run at all — which it does not, provided the condition is checked before the first pass rather than after.',
      'O(n) time, O(n) for the output.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  const o = [];\n  for (let i = a; i >= 1; i--) o.push(i);\n  return o;\n}',
      TYPESCRIPT: 'function solve(a: number): number[] {\n  const o: number[] = [];\n  for (let i = a; i >= 1; i--) o.push(i);\n  return o;\n}',
      PYTHON: 'def solve(a):\n    return list(range(a, 0, -1))',
      JAVA: '    static int[] solve(int a) {\n        int[] o = new int[Math.max(0, a)];\n        for (int i = 0; i < o.length; i++) o[i] = a - i;\n        return o;\n    }',
      CPP: 'vector<int> solve(int a) {\n    vector<int> o;\n    for (int i = a; i >= 1; i--) o.push_back(i);\n    return o;\n}',
      GO: 'func solve(a int) []int {\n\to := []int{}\n\tfor i := a; i >= 1; i-- {\n\t\to = append(o, i)\n\t}\n\treturn o\n}',
    },
    tests: [
      { stdin: '5', expectedStdout: '5 4 3 2 1', isSample: true },
      { stdin: '0', expectedStdout: '', isSample: true },
      { stdin: '1', expectedStdout: '1' },
      { stdin: '3', expectedStdout: '3 2 1' },
      { stdin: '10', expectedStdout: '10 9 8 7 6 5 4 3 2 1' },
    ],
  }),

  p({
    ...B,
    slug: 'range-from-one',
    title: 'Count Up',
    patternTags: ['loops', 'arrays', 'ascending'],
    signatureId: 'fn:int->ints',
    avgSolveSeconds: 150,
    promptMarkdown: ask(
      'Return the numbers from 1 up to `n`.',
      'input:  4\noutput: 1 2 3 4',
      'If `n` is `0`, the answer is an empty list.',
    ),
    editorialMarkdown: why(
      'Inclusive on both ends',
      'The mirror of counting down, and the interesting part is that the bound is *inclusive*: the answer contains `n` itself.',
      'That is why the condition is `i <= n` and not `i < n`. Most loops you write count from zero and stop before the limit, so the fingers type `<` automatically — and here it silently drops the last element. Whenever a range is described in words, check both ends against an example before writing the loop.',
      'O(n) time, O(n) for the output.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  const o = [];\n  for (let i = 1; i <= a; i++) o.push(i);\n  return o;\n}',
      TYPESCRIPT: 'function solve(a: number): number[] {\n  const o: number[] = [];\n  for (let i = 1; i <= a; i++) o.push(i);\n  return o;\n}',
      PYTHON: 'def solve(a):\n    return list(range(1, a + 1))',
      JAVA: '    static int[] solve(int a) {\n        int[] o = new int[Math.max(0, a)];\n        for (int i = 0; i < o.length; i++) o[i] = i + 1;\n        return o;\n    }',
      CPP: 'vector<int> solve(int a) {\n    vector<int> o;\n    for (int i = 1; i <= a; i++) o.push_back(i);\n    return o;\n}',
      GO: 'func solve(a int) []int {\n\to := []int{}\n\tfor i := 1; i <= a; i++ {\n\t\to = append(o, i)\n\t}\n\treturn o\n}',
    },
    tests: [
      { stdin: '4', expectedStdout: '1 2 3 4', isSample: true },
      { stdin: '0', expectedStdout: '', isSample: true },
      { stdin: '1', expectedStdout: '1' },
      { stdin: '6', expectedStdout: '1 2 3 4 5 6' },
      { stdin: '2', expectedStdout: '1 2' },
    ],
  }),

  p({
    ...B,
    slug: 'repeat-a-string',
    title: 'Say It Again',
    patternTags: ['strings', 'loops', 'concatenation'],
    signatureId: 'fn:string,int->string',
    avgSolveSeconds: 200,
    promptMarkdown: ask(
      'Repeat a line of text a given number of times, with nothing in between.\n\nThe first line is the text, the second is how many times.',
      'input:  ab\n        3\noutput: ababab',
      'Repeating `0` times gives an empty line. The count is never negative.',
    ),
    editorialMarkdown: why(
      'Build up, starting from empty',
      'Start with an empty string and append the text once per repetition. The empty string is the identity for concatenation, the same way zero is for addition — which is why repeating zero times needs no special case.',
      'The performance note worth knowing: in several languages, repeatedly appending to a string creates a whole new string each time, so building a long result this way is quadratic. That is what string builders exist for, and why most languages also ship a repeat function that does it properly in one allocation.',
      'O(n x k) in the length of the result.',
    ),
    referenceSolution: {
      JAVASCRIPT: "function solve(a, b) {\n  let o = '';\n  for (let i = 0; i < b; i++) o += a;\n  return o;\n}",
      TYPESCRIPT: "function solve(a: string, b: number): string {\n  let o = '';\n  for (let i = 0; i < b; i++) o += a;\n  return o;\n}",
      PYTHON: 'def solve(a, b):\n    return a * b',
      JAVA: '    static String solve(String a, int b) {\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < b; i++) sb.append(a);\n        return sb.toString();\n    }',
      CPP: 'string solve(string a, int b) {\n    string o;\n    for (int i = 0; i < b; i++) o += a;\n    return o;\n}',
      GO: 'func solve(a string, b int) string {\n\treturn strings.Repeat(a, b)\n}',
    },
    tests: [
      { stdin: 'ab\n3', expectedStdout: 'ababab', isSample: true },
      { stdin: 'x\n0', expectedStdout: '', isSample: true },
      { stdin: 'hi\n1', expectedStdout: 'hi' },
      { stdin: '\n5', expectedStdout: '' },
      { stdin: 'ab c\n2', expectedStdout: 'ab cab c' },
    ],
  }),

  p({
    ...B,
    slug: 'first-character',
    title: 'The First Character',
    patternTags: ['strings', 'indexing', 'edge-cases'],
    signatureId: 'fn:string->string',
    avgSolveSeconds: 180,
    promptMarkdown: ask(
      'Return just the first character of a line, as a one-character string.',
      'input:  hello\noutput: h',
      'An empty line has no first character — return an empty line.',
    ),
    editorialMarkdown: why(
      'Guard before you index',
      'Character zero is the first one. The whole problem is the empty line.',
      'Asking for character zero of an empty string is out of bounds, and the languages disagree about what happens: some throw, some hand back an empty value, one hands back undefined. Relying on any of them is relying on a detail you did not choose. Check the length first and the code means the same thing everywhere — which is the actual lesson, not the indexing.',
      'O(1) time and space.',
    ),
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n  return a.length === 0 ? '' : a[0];\n}",
      TYPESCRIPT: "function solve(a: string): string {\n  return a.length === 0 ? '' : a[0];\n}",
      PYTHON: 'def solve(a):\n    return a[:1]',
      JAVA: '    static String solve(String a) {\n        return a.isEmpty() ? "" : a.substring(0, 1);\n    }',
      CPP: 'string solve(string a) {\n    return a.empty() ? string("") : string(1, a[0]);\n}',
      GO: 'func solve(a string) string {\n\tif a == "" {\n\t\treturn ""\n\t}\n\treturn a[:1]\n}',
    },
    tests: [
      { stdin: 'hello', expectedStdout: 'h', isSample: true },
      { stdin: '', expectedStdout: '', isSample: true },
      { stdin: 'a', expectedStdout: 'a' },
      { stdin: 'xyz', expectedStdout: 'x' },
      { stdin: 'two words', expectedStdout: 't' },
    ],
  }),

  p({
    ...B,
    slug: 'length-of-string',
    title: 'How Long Is It?',
    patternTags: ['strings', 'counting'],
    signatureId: 'fn:string->int',
    avgSolveSeconds: 150,
    promptMarkdown: ask(
      'Return how many characters a line contains.',
      'input:  hello\noutput: 5',
      'Spaces count. An empty line has length `0`.',
    ),
    editorialMarkdown: why(
      'Length is a property, not a loop',
      'Every language can tell you a string\'s length directly. Counting characters in a loop gives the same answer and is worth writing once, because it makes clear that length is just "how many times can I step forward".',
      'Spaces are the detail people trip on: a space is a character like any other, so `a b` has length three. The habit worth forming is asking what counts as a character before you count them — which becomes a real question the moment text stops being plain English letters.',
      'O(1) in most languages, O(n) if you count by hand.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  return a.length;\n}',
      TYPESCRIPT: 'function solve(a: string): number {\n  return a.length;\n}',
      PYTHON: 'def solve(a):\n    return len(a)',
      JAVA: '    static int solve(String a) {\n        return a.length();\n    }',
      CPP: 'int solve(string a) {\n    return (int) a.size();\n}',
      GO: 'func solve(a string) int {\n\treturn len(a)\n}',
    },
    tests: [
      { stdin: 'hello', expectedStdout: '5', isSample: true },
      { stdin: '', expectedStdout: '0', isSample: true },
      { stdin: 'a', expectedStdout: '1' },
      { stdin: 'a b', expectedStdout: '3' },
      { stdin: 'the quick', expectedStdout: '9' },
    ],
  }),

  p({
    ...B,
    slug: 'count-spaces',
    title: 'Count the Spaces',
    patternTags: ['strings', 'loops', 'counting'],
    signatureId: 'fn:string->int',
    avgSolveSeconds: 180,
    promptMarkdown: ask(
      'Count how many space characters a line contains.',
      'input:  a b c\noutput: 2',
      'An empty line has `0` spaces.',
    ),
    editorialMarkdown: why(
      'Characters are values you can compare',
      'Walk the line and count the characters equal to a space. The only new idea is that a space is an ordinary character with an ordinary value — nothing about it is special to the language.',
      'Worth noticing what this is *not*: the number of spaces is not the number of words minus one, unless you already know there are no double spaces and no leading or trailing ones. Two facts that coincide on tidy input and diverge on real input are exactly the kind of assumption that ships bugs.',
      'O(n) time, O(1) space.',
    ),
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n  let c = 0;\n  for (const ch of a) if (ch === ' ') c++;\n  return c;\n}",
      TYPESCRIPT: "function solve(a: string): number {\n  let c = 0;\n  for (const ch of a) if (ch === ' ') c++;\n  return c;\n}",
      PYTHON: "def solve(a):\n    return a.count(' ')",
      JAVA: "    static int solve(String a) {\n        int c = 0;\n        for (char ch : a.toCharArray()) if (ch == ' ') c++;\n        return c;\n    }",
      CPP: "int solve(string a) {\n    int c = 0;\n    for (char ch : a) if (ch == ' ') c++;\n    return c;\n}",
      GO: 'func solve(a string) int {\n\treturn strings.Count(a, " ")\n}',
    },
    tests: [
      { stdin: 'a b c', expectedStdout: '2', isSample: true },
      { stdin: '', expectedStdout: '0', isSample: true },
      { stdin: 'abc', expectedStdout: '0' },
      { stdin: 'a  b', expectedStdout: '2' },
      { stdin: 'one two three', expectedStdout: '2' },
    ],
  }),

  p({
    ...B,
    slug: 'shout-the-line',
    title: 'Shout It',
    patternTags: ['strings', 'case-conversion'],
    signatureId: 'fn:string->string',
    avgSolveSeconds: 150,
    promptMarkdown: ask(
      'Return the line in upper case.\n\nThe input is lower-case letters and spaces.',
      'input:  hello world\noutput: HELLO WORLD',
      'Spaces are unchanged. An empty line comes back empty.',
    ),
    editorialMarkdown: why(
      'Let the library do it',
      'Every language has an upper-case function, and using it is the right answer. Writing the conversion by hand — adding a fixed offset to each letter\'s code — works for plain English and quietly breaks on anything else.',
      'That is the real lesson. Case is a property of human writing, not of bytes: some alphabets have no case at all, and one Turkish letter upper-cases differently depending on locale. The library carries that knowledge and your offset arithmetic does not, so reach for it by default and be suspicious of code that does character arithmetic on letters.',
      'O(n) time, O(n) for the output.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  return a.toUpperCase();\n}',
      TYPESCRIPT: 'function solve(a: string): string {\n  return a.toUpperCase();\n}',
      PYTHON: 'def solve(a):\n    return a.upper()',
      JAVA: '    static String solve(String a) {\n        return a.toUpperCase();\n    }',
      CPP: 'string solve(string a) {\n    for (size_t i = 0; i < a.size(); i++) a[i] = toupper(a[i]);\n    return a;\n}',
      GO: 'func solve(a string) string {\n\treturn strings.ToUpper(a)\n}',
    },
    tests: [
      { stdin: 'hello world', expectedStdout: 'HELLO WORLD', isSample: true },
      { stdin: '', expectedStdout: '', isSample: true },
      { stdin: 'a', expectedStdout: 'A' },
      { stdin: 'abc def', expectedStdout: 'ABC DEF' },
      { stdin: 'x y z', expectedStdout: 'X Y Z' },
    ],
  }),

  p({
    ...B,
    slug: 'starts-with-vowel',
    title: 'Does It Start With a Vowel?',
    patternTags: ['strings', 'membership', 'edge-cases'],
    signatureId: 'fn:string->bool',
    avgSolveSeconds: 200,
    promptMarkdown: ask(
      'Decide whether a line begins with a vowel.\n\nThe vowels are `a`, `e`, `i`, `o`, `u`. The input is lower case.',
      'input:  apple\noutput: true',
      'An empty line does not start with a vowel, so the answer is `false`.',
    ),
    editorialMarkdown: why(
      'Two questions, in the right order',
      'Is there a first character at all, and if so is it a vowel? Both have to be asked, and the order matters — asking the second first is the out-of-bounds read.',
      'Most languages short-circuit their `and`, so "length is not zero" followed by "first character is a vowel" is safe: the right side is never evaluated when the left is false. Relying on that is fine, but only once you know your language does it — the same expression in a language that evaluates both sides would crash on an empty line, and that is a genuinely surprising bug to meet for the first time in production.',
      'O(1) time and space.',
    ),
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n  if (a.length === 0) return false;\n  return 'aeiou'.includes(a[0]);\n}",
      TYPESCRIPT: "function solve(a: string): boolean {\n  if (a.length === 0) return false;\n  return 'aeiou'.includes(a[0]);\n}",
      PYTHON: "def solve(a):\n    return len(a) > 0 and a[0] in 'aeiou'",
      JAVA: '    static boolean solve(String a) {\n        if (a.isEmpty()) return false;\n        return "aeiou".indexOf(a.charAt(0)) >= 0;\n    }',
      CPP: 'bool solve(string a) {\n    if (a.empty()) return false;\n    return string("aeiou").find(a[0]) != string::npos;\n}',
      GO: 'func solve(a string) bool {\n\tif a == "" {\n\t\treturn false\n\t}\n\treturn strings.ContainsRune("aeiou", rune(a[0]))\n}',
    },
    tests: [
      { stdin: 'apple', expectedStdout: 'true', isSample: true },
      { stdin: 'banana', expectedStdout: 'false', isSample: true },
      { stdin: '', expectedStdout: 'false' },
      { stdin: 'u', expectedStdout: 'true' },
      { stdin: 'z', expectedStdout: 'false' },
    ],
  }),

  p({
    ...B,
    slug: 'contains-word',
    title: 'Is It In There?',
    patternTags: ['strings', 'search', 'substring'],
    signatureId: 'fn:string,string->bool',
    avgSolveSeconds: 200,
    promptMarkdown: ask(
      'Decide whether the first line contains the second line somewhere inside it.\n\nBoth are lower-case letters and spaces.',
      'input:  hello world\n        lo w\noutput: true',
      'Every line contains the empty line, so an empty second line gives `true`.',
    ),
    editorialMarkdown: why(
      'Substring, not word',
      'Every language has a "contains" function and it is the right tool. The name of this problem is deliberately misleading: it asks about a *substring*, which can start and end in the middle of words — `lo w` is inside `hello world` even though it is not a word.',
      'That gap between what a function is called and what it does is worth internalising. If you actually wanted whole words, "contains" is the wrong tool and you would need to split on spaces and compare pieces. Reading the example rather than the title is what tells you which one is being asked for.',
      'O(n x m) naively; the built-in is usually better.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a, b) {\n  return a.includes(b);\n}',
      TYPESCRIPT: 'function solve(a: string, b: string): boolean {\n  return a.includes(b);\n}',
      PYTHON: 'def solve(a, b):\n    return b in a',
      JAVA: '    static boolean solve(String a, String b) {\n        return a.contains(b);\n    }',
      CPP: 'bool solve(string a, string b) {\n    return a.find(b) != string::npos;\n}',
      GO: 'func solve(a string, b string) bool {\n\treturn strings.Contains(a, b)\n}',
    },
    tests: [
      { stdin: 'hello world\nlo w', expectedStdout: 'true', isSample: true },
      { stdin: 'hello\nxyz', expectedStdout: 'false', isSample: true },
      { stdin: 'abc\n', expectedStdout: 'true' },
      { stdin: '\nabc', expectedStdout: 'false' },
      { stdin: 'abc\nabc', expectedStdout: 'true' },
    ],
  }),

  p({
    ...B,
    slug: 'join-with-dashes',
    title: 'Join With Dashes',
    patternTags: ['strings', 'join', 'lists'],
    signatureId: 'fn:strings->string',
    avgSolveSeconds: 180,
    promptMarkdown: ask(
      'Join a list of words with dashes between them.\n\nThe input line is words separated by spaces.',
      'input:  red green blue\noutput: red-green-blue',
      'One word gives that word with no dashes. An empty list gives an empty line.',
    ),
    editorialMarkdown: why(
      'Separators go between, not after',
      'A join puts the separator *between* items: three words need two dashes, not three.',
      'Writing the loop by hand is where the off-by-one lives — appending the word and then a dash every time leaves a trailing dash you then have to strip, which works and always looks like an apology. The version without a special case appends the separator only when the output is not empty yet, or equivalently before every item except the first. Every language\'s built-in join already does this, which is a good reason to use it and a better reason to know what it is doing.',
      'O(n) in the total length.',
    ),
    referenceSolution: {
      JAVASCRIPT: "function solve(a) {\n  return a.join('-');\n}",
      TYPESCRIPT: "function solve(a: string[]): string {\n  return a.join('-');\n}",
      PYTHON: "def solve(a):\n    return '-'.join(a)",
      JAVA: '    static String solve(String[] a) {\n        return String.join("-", a);\n    }',
      CPP: "string solve(vector<string> a) {\n    string o;\n    for (size_t i = 0; i < a.size(); i++) {\n        if (i) o += '-';\n        o += a[i];\n    }\n    return o;\n}",
      GO: 'func solve(a []string) string {\n\treturn strings.Join(a, "-")\n}',
    },
    tests: [
      { stdin: 'red green blue', expectedStdout: 'red-green-blue', isSample: true },
      { stdin: 'solo', expectedStdout: 'solo', isSample: true },
      { stdin: '', expectedStdout: '' },
      { stdin: 'a b', expectedStdout: 'a-b' },
      { stdin: 'one two three four', expectedStdout: 'one-two-three-four' },
    ],
  }),

  p({
    ...B,
    slug: 'longest-word',
    title: 'The Longest Word',
    patternTags: ['strings', 'parsing', 'running-best'],
    signatureId: 'fn:string->string',
    avgSolveSeconds: 260,
    promptMarkdown: ask(
      'Find the longest word in a line.\n\nWords are separated by single spaces.',
      'input:  the quick brown fox\noutput: quick',
      'If two words tie for longest, return the one that appears **first**. An empty line gives an empty line.',
    ),
    editorialMarkdown: why(
      'Running best, over words instead of numbers',
      'Split into words, then keep the best one seen so far — the same shape as finding the largest number, with "longer than" as the comparison.',
      'The tie-break is the part that decides your comparison operator. Replacing the best only when a word is **strictly longer** keeps the first of any tie; using "longer than or equal" would keep the last, and both look correct until a test has two words of equal length. When a statement specifies which one wins, that sentence is telling you which operator to write.',
      'O(n) in the length of the line.',
    ),
    referenceSolution: {
      JAVASCRIPT:
        "function solve(a) {\n  let best = '';\n  for (const w of a.split(' ')) if (w.length > best.length) best = w;\n  return best;\n}",
      TYPESCRIPT:
        "function solve(a: string): string {\n  let best = '';\n  for (const w of a.split(' ')) if (w.length > best.length) best = w;\n  return best;\n}",
      PYTHON:
        "def solve(a):\n    best = ''\n    for w in a.split():\n        if len(w) > len(best):\n            best = w\n    return best",
      JAVA: '    static String solve(String a) {\n        String best = "";\n        for (String w : a.split(" ")) if (w.length() > best.length()) best = w;\n        return best;\n    }',
      CPP: 'string solve(string a) {\n    istringstream ss(a);\n    string w, best;\n    while (ss >> w) if (w.size() > best.size()) best = w;\n    return best;\n}',
      GO: 'func solve(a string) string {\n\tbest := ""\n\tfor _, w := range strings.Fields(a) {\n\t\tif len(w) > len(best) {\n\t\t\tbest = w\n\t\t}\n\t}\n\treturn best\n}',
    },
    tests: [
      { stdin: 'the quick brown fox', expectedStdout: 'quick', isSample: true },
      { stdin: 'aa bb', expectedStdout: 'aa', isSample: true },
      { stdin: '', expectedStdout: '' },
      { stdin: 'one', expectedStdout: 'one' },
      { stdin: 'a bb ccc', expectedStdout: 'ccc' },
    ],
  }),

  p({
    ...B,
    slug: 'count-multiples',
    title: 'Count the Multiples',
    patternTags: ['loops', 'arrays', 'modulo'],
    signatureId: 'fn:ints,int->int',
    avgSolveSeconds: 220,
    promptMarkdown: ask(
      'Count how many numbers divide exactly by a given divisor.\n\nThe first line is the list, the second the divisor.',
      'input:  3 6 7 9\n        3\noutput: 3',
      '`3`, `6` and `9` all divide exactly by 3. The divisor is never zero. Zero itself is a multiple of everything.',
    ),
    editorialMarkdown: why(
      'Divides exactly means remainder zero',
      '`n % d == 0` is the test, and it works for negatives too — `-6 % 3` is `0` in all of these languages.',
      'The promise that the divisor is never zero is doing real work: dividing by zero is a crash in the integer languages here, not a quiet not-a-number. When a statement rules something out, it is usually ruling out the case that would otherwise need a guard — and if it were not ruled out, deciding what "how many multiples of zero" even means would be your problem, not the compiler\'s.',
      'O(n) time, O(1) space.',
    ),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a, b) {\n  let c = 0;\n  for (const n of a) if (n % b === 0) c++;\n  return c;\n}',
      TYPESCRIPT: 'function solve(a: number[], b: number): number {\n  let c = 0;\n  for (const n of a) if (n % b === 0) c++;\n  return c;\n}',
      PYTHON: 'def solve(a, b):\n    c = 0\n    for n in a:\n        if n % b == 0:\n            c += 1\n    return c',
      JAVA: '    static int solve(int[] a, int b) {\n        int c = 0;\n        for (int n : a) if (n % b == 0) c++;\n        return c;\n    }',
      CPP: 'int solve(vector<int> a, int b) {\n    int c = 0;\n    for (int n : a) if (n % b == 0) c++;\n    return c;\n}',
      GO: 'func solve(a []int, b int) int {\n\tc := 0\n\tfor _, n := range a {\n\t\tif n%b == 0 {\n\t\t\tc++\n\t\t}\n\t}\n\treturn c\n}',
    },
    tests: [
      { stdin: '3 6 7 9\n3', expectedStdout: '3', isSample: true },
      { stdin: '1 2 4\n5', expectedStdout: '0', isSample: true },
      { stdin: '\n2', expectedStdout: '0' },
      { stdin: '0 5\n5', expectedStdout: '2' },
      { stdin: '-6 -3 4\n3', expectedStdout: '2' },
    ],
  }),
];
