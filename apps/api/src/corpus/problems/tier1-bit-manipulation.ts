import { AUTHORED, type ProblemDefinition } from '../problem.js';

/**
 * Tier 1 — Bit manipulation.
 *
 * These small-looking tasks teach the algebra hiding behind binary digits:
 * clearing one bit, toggling with XOR, and carrying without a plus operator.
 * Every input bound stays in 0..2^30 so JavaScript's signed 32-bit bitwise
 * representation and Python's unbounded integers agree exactly.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = {
  tier: 'TIER_1',
  patternFamily: 'BIT_MANIPULATION',
  provenance: AUTHORED,
} as const;

export const TIER_1_BIT_MANIPULATION_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: 'count-one-bits', title: 'Count the Lit Switches', difficulty: 'EASY',
    patternTags: ['bit-manipulation', 'popcount'], signatureId: 'fn:int->int', avgSolveSeconds: 240,
    promptMarkdown: ['Return how many `1` digits appear in the ordinary binary form of a non-negative integer `n`.', '', '`0 <= n <= 2^30`. Leading zeroes are not written; in particular, `0` maps to `0`.', '', '**Example**', '', '```', 'input:  44', 'output: 3', '```', '', '`44` is binary `101100`, which has three lit digits.'].join('\n'),
    editorialMarkdown: ['## Bit manipulation: clear the lowest set bit', '', 'A positive binary number has a lowest `1`. Subtracting one turns that lowest `1` into `0` and turns only the zeroes beneath it into ones. Therefore `n & (n - 1)` keeps the higher prefix but clears exactly that lowest set bit. Repeat until the value becomes zero, counting one cleared bit each time.', '', 'The quiet mistake is using this expression on zero without considering the loop condition: `0 - 1` is not part of this problem’s unsigned model, and a careless do-while loop counts a bit that does not exist. Start with `while n > 0`; zero then naturally returns zero.', '', 'The loop runs once per set bit, so it is O(k) time for k lit bits and O(1) extra space.'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let count = 0;\n  while (a > 0) {\n    a = a & (a - 1);\n    count++;\n  }\n  return count;\n}',
      TYPESCRIPT: 'function solve(a: number): number {\n  let count = 0;\n  while (a > 0) {\n    a = a & (a - 1);\n    count++;\n  }\n  return count;\n}',
      PYTHON: 'def solve(a):\n    count = 0\n    while a > 0:\n        a = a & (a - 1)\n        count += 1\n    return count',
      JAVA: '    static int solve(int a) {\n        int count = 0;\n        while (a > 0) {\n            a = a & (a - 1);\n            count++;\n        }\n        return count;\n    }',
      CPP: 'int solve(int a) {\n    int count = 0;\n    while (a > 0) {\n        a = a & (a - 1);\n        count++;\n    }\n    return count;\n}',
      GO: 'func solve(a int) int {\n\tcount := 0\n\tfor a > 0 {\n\t\ta = a & (a - 1)\n\t\tcount++\n\t}\n\treturn count\n}',
    },
    tests: [
      { stdin: '44', expectedStdout: '3', isSample: true }, { stdin: '7', expectedStdout: '3', isSample: true },
      { stdin: '0', expectedStdout: '0' }, { stdin: '1', expectedStdout: '1' }, { stdin: '1024', expectedStdout: '1' }, { stdin: '1073741823', expectedStdout: '30' },
    ],
  }),
  p({
    ...base,
    slug: 'lonely-number-among-pairs', title: 'The Unpaired Badge', difficulty: 'EASY',
    patternTags: ['bit-manipulation', 'xor'], signatureId: 'fn:ints->int', avgSolveSeconds: 300,
    promptMarkdown: ['One non-negative value in the list appears once. Every other value appears exactly twice. Return the value without a partner.', '', 'Values are in `0..2^30`; the list has at least one value. The answer may be `0`.', '', '**Example**', '', '```', 'input:  6 1 6 9 1', 'output: 9', '```', '', 'The two `6`s and two `1`s form pairs, leaving `9`.'].join('\n'),
    editorialMarkdown: ['## Bit manipulation: XOR cancellation', '', 'XOR has two useful rules: `x ^ x` is zero, and `x ^ 0` is x. It is also associative and commutative, so XOR every list item in any order. Each paired value meets its copy and vanishes; the one unpaired value is all that remains.', '', 'The quiet mistake is reaching for addition and subtraction. That can look fine on a small example but repeated values do not identify themselves through a sum, and a frequency table uses more storage than the stated pattern needs. XOR does not need sorting or a map.', '', 'The scan is O(n) time for n items and O(1) extra space.'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let answer = 0;\n  for (const value of a) answer = answer ^ value;\n  return answer;\n}', TYPESCRIPT: 'function solve(a: number[]): number {\n  let answer = 0;\n  for (const value of a) answer = answer ^ value;\n  return answer;\n}', PYTHON: 'def solve(a):\n    answer = 0\n    for value in a:\n        answer ^= value\n    return answer', JAVA: '    static int solve(int[] a) {\n        int answer = 0;\n        for (int value : a) answer ^= value;\n        return answer;\n    }', CPP: 'int solve(vector<int> a) {\n    int answer = 0;\n    for (int value : a) answer ^= value;\n    return answer;\n}', GO: 'func solve(a []int) int {\n\tanswer := 0\n\tfor _, value := range a {\n\t\tanswer ^= value\n\t}\n\treturn answer\n}',
    },
    tests: [
      { stdin: '6 1 6 9 1', expectedStdout: '9', isSample: true }, { stdin: '4 4 12', expectedStdout: '12', isSample: true }, { stdin: '0', expectedStdout: '0' }, { stdin: '0 5 5', expectedStdout: '0' }, { stdin: '8 3 8 3 21', expectedStdout: '21' }, { stdin: '1073741823 2 2', expectedStdout: '1073741823' },
    ],
  }),
  p({
    ...base,
    slug: 'is-power-of-two-by-bits', title: 'One Light Only', difficulty: 'EASY',
    patternTags: ['bit-manipulation', 'power-of-two'], signatureId: 'fn:int->bool', avgSolveSeconds: 240,
    promptMarkdown: ['Return `true` when non-negative integer `n` is a power of two, otherwise return `false`.', '', '`0 <= n <= 2^30`. Zero is **not** a power of two.', '', '**Example**', '', '```', 'input:  32', 'output: true', '```', '', '`32` is `100000` in binary, with exactly one `1`.'].join('\n'),
    editorialMarkdown: ['## Bit manipulation: one set bit', '', 'A positive power of two has exactly one set bit. As with popcount, `n & (n - 1)` clears the lowest set bit. If that was the only set bit, the result is zero; if any other one was above it, the result stays positive. Thus the test is `n > 0 && (n & (n - 1)) == 0`.', '', 'The quiet mistake is omitting `n > 0`. For zero, `(0 & -1)` is zero, so the second half alone silently labels zero as a power of two. The explicit guard is the mathematical definition, not defensive clutter.', '', 'It uses O(1) time and O(1) space.'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  return a > 0 && (a & (a - 1)) === 0;\n}', TYPESCRIPT: 'function solve(a: number): boolean {\n  return a > 0 && (a & (a - 1)) === 0;\n}', PYTHON: 'def solve(a):\n    return a > 0 and (a & (a - 1)) == 0', JAVA: '    static boolean solve(int a) {\n        return a > 0 && (a & (a - 1)) == 0;\n    }', CPP: 'bool solve(int a) {\n    return a > 0 && (a & (a - 1)) == 0;\n}', GO: 'func solve(a int) bool {\n\treturn a > 0 && (a&(a-1)) == 0\n}',
    },
    tests: [
      { stdin: '32', expectedStdout: 'true', isSample: true }, { stdin: '12', expectedStdout: 'false', isSample: true }, { stdin: '0', expectedStdout: 'false' }, { stdin: '1', expectedStdout: 'true' }, { stdin: '1073741824', expectedStdout: 'true' }, { stdin: '1073741823', expectedStdout: 'false' },
    ],
  }),
  p({
    ...base,
    slug: 'reverse-eight-bit-value', title: 'Mirror Eight Switches', difficulty: 'EASY',
    patternTags: ['bit-manipulation', 'shifts'], signatureId: 'fn:int->int', avgSolveSeconds: 300,
    promptMarkdown: ['Treat `n` as exactly eight binary digits and return the value made by reading those eight digits backwards.', '', '`0 <= n <= 255`. Leading zeroes are part of this fixed-width view, so `0` reverses to `0` and `1` (`00000001`) reverses to `128` (`10000000`).', '', '**Example**', '', '```', 'input:  44', 'output: 52', '```', '', '`44` is `00101100`; reversed, it is `00110100`, which is `52`.'].join('\n'),
    editorialMarkdown: ['## Bit manipulation: peel and rebuild', '', 'Read the input from right to left. Its lowest bit is `n & 1`; append that bit to the right of the answer by shifting the answer left once and OR-ing the bit. Then divide the input by two with a right shift. Exactly eight repetitions move every position to its mirror.', '', 'The quiet mistake is stopping when the input becomes zero. That loses leading zeroes, yet those zeroes have positions in a fixed eight-bit number and must still push earlier bits left. Run eight iterations even for zero.', '', 'The fixed width bounds the work: O(8) time, which is O(1), and O(1) space.'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let out = 0;\n  for (let i = 0; i < 8; i++) {\n    out = (out << 1) | (a & 1);\n    a = a >> 1;\n  }\n  return out;\n}', TYPESCRIPT: 'function solve(a: number): number {\n  let out = 0;\n  for (let i = 0; i < 8; i++) {\n    out = (out << 1) | (a & 1);\n    a = a >> 1;\n  }\n  return out;\n}', PYTHON: 'def solve(a):\n    out = 0\n    for _ in range(8):\n        out = (out << 1) | (a & 1)\n        a >>= 1\n    return out', JAVA: '    static int solve(int a) {\n        int out = 0;\n        for (int i = 0; i < 8; i++) {\n            out = (out << 1) | (a & 1);\n            a = a >> 1;\n        }\n        return out;\n    }', CPP: 'int solve(int a) {\n    int out = 0;\n    for (int i = 0; i < 8; i++) {\n        out = (out << 1) | (a & 1);\n        a = a >> 1;\n    }\n    return out;\n}', GO: 'func solve(a int) int {\n\tout := 0\n\tfor i := 0; i < 8; i++ {\n\t\tout = (out << 1) | (a & 1)\n\t\ta = a >> 1\n\t}\n\treturn out\n}',
    },
    tests: [
      { stdin: '44', expectedStdout: '52', isSample: true }, { stdin: '1', expectedStdout: '128', isSample: true }, { stdin: '0', expectedStdout: '0' }, { stdin: '128', expectedStdout: '1' }, { stdin: '255', expectedStdout: '255' }, { stdin: '18', expectedStdout: '72' },
    ],
  }),
  p({
    ...base,
    slug: 'total-set-bits-through-n', title: 'All the Lit Digits So Far', difficulty: 'MEDIUM',
    patternTags: ['bit-manipulation', 'counting'], signatureId: 'fn:int->int', avgSolveSeconds: 480,
    promptMarkdown: ['Return the total number of `1` digits written when every integer from `0` through `n`, inclusive, is written in binary without leading zeroes.', '', '`0 <= n <= 1,000,000`. Zero contributes zero set bits.', '', '**Example**', '', '```', 'input:  5', 'output: 7', '```', '', 'The values `0, 1, 10, 11, 100, 101` contain `0 + 1 + 1 + 2 + 1 + 2 = 7` lit digits.'].join('\n'),
    editorialMarkdown: ['## Bit manipulation: repeatedly clear a set bit', '', 'There is no need to build binary strings. For each number from zero through n, use `x & (x - 1)` to clear its lowest set bit and count how many clears occur. The subtraction changes the lowest one to zero and the AND preserves only the unchanged higher ones, so each iteration accounts for one real bit.', '', 'The quiet mistake is treating the upper bound as exclusive. The wording says through n, so the loop must include n; missing it is especially quiet when n has few set bits. Zero needs no special branch because its inner loop performs zero iterations.', '', 'The outer range has n + 1 values and the inner loops run once per set bit, so time is O(total set bits through n), at most O(n log n), and extra space is O(1).'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let total = 0;\n  for (let x = 0; x <= a; x++) {\n    let value = x;\n    while (value > 0) {\n      value = value & (value - 1);\n      total++;\n    }\n  }\n  return total;\n}', TYPESCRIPT: 'function solve(a: number): number {\n  let total = 0;\n  for (let x = 0; x <= a; x++) {\n    let value = x;\n    while (value > 0) {\n      value = value & (value - 1);\n      total++;\n    }\n  }\n  return total;\n}', PYTHON: 'def solve(a):\n    total = 0\n    for x in range(a + 1):\n        value = x\n        while value > 0:\n            value &= value - 1\n            total += 1\n    return total', JAVA: '    static int solve(int a) {\n        int total = 0;\n        for (int x = 0; x <= a; x++) {\n            int value = x;\n            while (value > 0) {\n                value = value & (value - 1);\n                total++;\n            }\n        }\n        return total;\n    }', CPP: 'int solve(int a) {\n    int total = 0;\n    for (int x = 0; x <= a; x++) {\n        int value = x;\n        while (value > 0) {\n            value = value & (value - 1);\n            total++;\n        }\n    }\n    return total;\n}', GO: 'func solve(a int) int {\n\ttotal := 0\n\tfor x := 0; x <= a; x++ {\n\t\tvalue := x\n\t\tfor value > 0 {\n\t\t\tvalue = value & (value - 1)\n\t\t\ttotal++\n\t\t}\n\t}\n\treturn total\n}',
    },
    tests: [
      { stdin: '5', expectedStdout: '7', isSample: true }, { stdin: '3', expectedStdout: '4', isSample: true }, { stdin: '0', expectedStdout: '0' }, { stdin: '1', expectedStdout: '1' }, { stdin: '8', expectedStdout: '13' }, { stdin: '10', expectedStdout: '17' },
    ],
  }),
  p({
    ...base,
    slug: 'missing-value-by-xor', title: 'The Gap in the Roll Call', difficulty: 'EASY',
    patternTags: ['bit-manipulation', 'xor'], signatureId: 'fn:ints->int', avgSolveSeconds: 300,
    promptMarkdown: ['The list has length `n` and contains distinct values drawn from `0` through `n`, with exactly one value absent. Return the absent value.', '', 'All values, including `n`, are at most `2^30`. A one-item list can therefore be `0` and has missing value `1`.', '', '**Example**', '', '```', 'input:  3 0 1', 'output: 2', '```', '', 'Here `n` is `3`, so the full roll call is `0, 1, 2, 3`; only `2` is missing.'].join('\n'),
    editorialMarkdown: ['## Bit manipulation: XOR the complete roll', '', 'Begin with n, then XOR each index and the value stored at that index. Across the whole calculation, every present number appears twice: once as an index or n, and once in the input. XOR cancels equal pairs because `x ^ x` is zero. The only unpaired number is the missing value.', '', 'The quiet mistake is XOR-ing only the values. That merely combines the values you have; it never introduces the full range that is supposed to cancel them. Including n before the index loop matters because the indices stop at n - 1.', '', 'The single pass is O(n) time and O(1) extra space.'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let answer = a.length;\n  for (let i = 0; i < a.length; i++) answer = answer ^ i ^ a[i];\n  return answer;\n}', TYPESCRIPT: 'function solve(a: number[]): number {\n  let answer = a.length;\n  for (let i = 0; i < a.length; i++) answer = answer ^ i ^ a[i];\n  return answer;\n}', PYTHON: 'def solve(a):\n    answer = len(a)\n    for i, value in enumerate(a):\n        answer ^= i ^ value\n    return answer', JAVA: '    static int solve(int[] a) {\n        int answer = a.length;\n        for (int i = 0; i < a.length; i++) answer ^= i ^ a[i];\n        return answer;\n    }', CPP: 'int solve(vector<int> a) {\n    int answer = (int) a.size();\n    for (int i = 0; i < (int) a.size(); i++) answer ^= i ^ a[i];\n    return answer;\n}', GO: 'func solve(a []int) int {\n\tanswer := len(a)\n\tfor i, value := range a {\n\t\tanswer ^= i ^ value\n\t}\n\treturn answer\n}',
    },
    tests: [
      { stdin: '3 0 1', expectedStdout: '2', isSample: true }, { stdin: '0', expectedStdout: '1', isSample: true }, { stdin: '1 2 3', expectedStdout: '0' }, { stdin: '0 1 2', expectedStdout: '3' }, { stdin: '4 2 0 1', expectedStdout: '3' }, { stdin: '0 2 1 4 5', expectedStdout: '3' },
    ],
  }),
  p({
    ...base,
    slug: 'sum-without-plus', title: 'Add With Wires', difficulty: 'MEDIUM',
    patternTags: ['bit-manipulation', 'xor', 'carry'], signatureId: 'fn:int,int->int', avgSolveSeconds: 420,
    promptMarkdown: ['Return the sum of two non-negative integers without using `+`, `-`, `*`, or `/` in the solution.', '', '`0 <= a, b <= 2^29`, and `a + b <= 2^30`, so every intermediate result is non-negative and fits the shared language range. Zero is allowed.', '', '**Example**', '', '```', 'input:  13', '        6', 'output: 19', '```', '', 'Binary `1101` plus `0110` is `10011`.'].join('\n'),
    editorialMarkdown: ['## Bit manipulation: XOR plus carry', '', 'At one bit position, XOR gives the sum bit if no carry enters: equal bits produce zero, different bits produce one. AND finds positions where both inputs have one and therefore create a carry; shift that result left to move each carry into the next position. Repeat with the partial sum and carries until no carry remains.', '', 'The quiet mistake is calculating the carry after replacing a with `a ^ b`. The carry must come from the original pair, where both bits were one. Save `(a & b) << 1` first, then update a. The non-negative bound prevents any signed-shift disagreement between languages.', '', 'Each pass moves carries left, so this is O(log(a + b)) time under the stated bit bound and O(1) space.'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a, b) {\n  while (b !== 0) {\n    const carry = (a & b) << 1;\n    a = a ^ b;\n    b = carry;\n  }\n  return a;\n}', TYPESCRIPT: 'function solve(a: number, b: number): number {\n  while (b !== 0) {\n    const carry = (a & b) << 1;\n    a = a ^ b;\n    b = carry;\n  }\n  return a;\n}', PYTHON: 'def solve(a, b):\n    while b != 0:\n        carry = (a & b) << 1\n        a = a ^ b\n        b = carry\n    return a', JAVA: '    static int solve(int a, int b) {\n        while (b != 0) {\n            int carry = (a & b) << 1;\n            a = a ^ b;\n            b = carry;\n        }\n        return a;\n    }', CPP: 'int solve(int a, int b) {\n    while (b != 0) {\n        int carry = (a & b) << 1;\n        a = a ^ b;\n        b = carry;\n    }\n    return a;\n}', GO: 'func solve(a int, b int) int {\n\tfor b != 0 {\n\t\tcarry := (a & b) << 1\n\t\ta = a ^ b\n\t\tb = carry\n\t}\n\treturn a\n}',
    },
    tests: [
      { stdin: '13\n6', expectedStdout: '19', isSample: true }, { stdin: '7\n9', expectedStdout: '16', isSample: true }, { stdin: '0\n0', expectedStdout: '0' }, { stdin: '0\n17', expectedStdout: '17' }, { stdin: '1023\n1', expectedStdout: '1024' }, { stdin: '536870912\n536870912', expectedStdout: '1073741824' },
    ],
  }),
  p({
    ...base,
    slug: 'binary-without-leading-zeroes', title: 'Write It in Binary', difficulty: 'EASY',
    patternTags: ['bit-manipulation', 'binary'], signatureId: 'fn:int->string', avgSolveSeconds: 240,
    promptMarkdown: ['Return the binary representation of non-negative integer `n` as a string, with no leading zeroes.', '', '`0 <= n <= 2^30`. The special representation for zero is the single character `0`.', '', '**Example**', '', '```', 'input:  44', 'output: 101100', '```', '', '`44 = 32 + 8 + 4`, so its lit positions write as `101100`.'].join('\n'),
    editorialMarkdown: ['## Bit manipulation: collect low bits', '', 'The low bit of n is `n & 1`. Record it, then shift n right to discard that bit and expose the next one. These bits arrive from least significant to most significant, so reverse the collected characters before returning them. The given non-negative bound makes the right shift a simple division by two in every language.', '', 'The quiet mistake is using the same loop for zero: it records nothing and returns an empty string. Zero has no set bit to peel, but its requested written form is still `0`, so return it before the loop.', '', 'There is one iteration per binary digit: O(log n) time and O(log n) space for the output.'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  if (a === 0) return "0";\n  let out = "";\n  while (a > 0) {\n    out += String(a & 1);\n    a = a >> 1;\n  }\n  return out.split("").reverse().join("");\n}', TYPESCRIPT: 'function solve(a: number): string {\n  if (a === 0) return "0";\n  let out = "";\n  while (a > 0) {\n    out += String(a & 1);\n    a = a >> 1;\n  }\n  return out.split("").reverse().join("");\n}', PYTHON: 'def solve(a):\n    if a == 0:\n        return "0"\n    out = []\n    while a > 0:\n        out.append(str(a & 1))\n        a >>= 1\n    out.reverse()\n    return "".join(out)', JAVA: '    static String solve(int a) {\n        if (a == 0) return "0";\n        StringBuilder out = new StringBuilder();\n        while (a > 0) {\n            out.append(a & 1);\n            a = a >> 1;\n        }\n        return out.reverse().toString();\n    }', CPP: 'string solve(int a) {\n    if (a == 0) return "0";\n    string out;\n    while (a > 0) {\n        out.push_back((char) (\'0\' + (a & 1)));\n        a = a >> 1;\n    }\n    reverse(out.begin(), out.end());\n    return out;\n}', GO: 'func solve(a int) string {\n\tif a == 0 {\n\t\treturn "0"\n\t}\n\tout := ""\n\tfor a > 0 {\n\t\tif (a & 1) == 1 {\n\t\t\tout += "1"\n\t\t} else {\n\t\t\tout += "0"\n\t\t}\n\t\ta = a >> 1\n\t}\n\tbytes := []byte(out)\n\tfor left, right := 0, len(bytes)-1; left < right; left, right = left+1, right-1 {\n\t\tbytes[left], bytes[right] = bytes[right], bytes[left]\n\t}\n\treturn string(bytes)\n}',
    },
    tests: [
      { stdin: '44', expectedStdout: '101100', isSample: true }, { stdin: '5', expectedStdout: '101', isSample: true }, { stdin: '0', expectedStdout: '0' }, { stdin: '1', expectedStdout: '1' }, { stdin: '1024', expectedStdout: '10000000000' }, { stdin: '1073741824', expectedStdout: '1000000000000000000000000000000' },
    ],
  }),
];
