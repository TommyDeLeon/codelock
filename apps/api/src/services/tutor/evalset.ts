import type { Language } from '@codelock/shared';
import type { DiagnosisId } from './diagnose.js';

/**
 * A small, representative set of beginner mistakes, and correct alternatives.
 *
 * Each case is code a beginner might plausibly write. Its execution evidence
 * is not written by hand: `scripts/record-hint-fixtures.ts` runs every case
 * through the actual judge and saves the response to `fixtures/eval-runs.json`,
 * and the evaluation test reads that file. So the hints under test are built
 * from what the code really did, not from what we assumed it would do.
 *
 * `expect` lists the diagnoses an accurate first hint may lead with. More than
 * one is allowed where two descriptions are both true (an empty list that
 * crashes on `a[0]` is both an empty-input problem and an index problem).
 */

export type EvalCategory =
  | 'off_by_one'
  | 'empty_input'
  | 'comparison'
  | 'unnecessary_loop'
  | 'return_in_loop'
  | 'print_vs_return'
  | 'syntax'
  | 'alternative';

export interface EvalCase {
  id: string;
  category: EvalCategory;
  slug: string;
  language: Language;
  code: string;
  expect: readonly DiagnosisId[];
  /** Words or values a good first hint should point at. */
  mentions?: readonly string[];
}

const src = (...lines: string[]) => lines.join('\n');

export const EVAL_CASES: readonly EvalCase[] = [
  // --- off by one ------------------------------------------------------------------
  {
    id: 'nth-unguarded-py',
    category: 'off_by_one',
    slug: 'nth-character',
    language: 'PYTHON',
    code: src('def solve(a, b):', '    return a[b]'),
    expect: ['unguarded_index', 'index_crash'],
    mentions: ['0 to 4', '9', 'b'],
  },
  {
    id: 'sum-range-plus-one-py',
    category: 'off_by_one',
    slug: 'sum-of-array',
    language: 'PYTHON',
    code: src('def solve(a):', '    total = 0', '    for i in range(len(a) + 1):', '        total += a[i]', '    return total'),
    expect: ['index_crash', 'index_bound'],
    mentions: ['IndexError'],
  },
  {
    id: 'nth-unguarded-js',
    category: 'off_by_one',
    slug: 'nth-character',
    language: 'JAVASCRIPT',
    code: src('function solve(a, b) {', '  return a[b];', '}'),
    expect: ['unguarded_index', 'wrong_output'],
    mentions: ['b'],
  },
  {
    id: 'largest-le-length-js',
    category: 'off_by_one',
    slug: 'largest-number',
    language: 'JAVASCRIPT',
    // Reads one past the end, but `undefined > best` is false, so the examples
    // pass. The hint must not call working output wrong.
    code: src(
      'function solve(a) {',
      '  let best = a[0];',
      '  for (let i = 0; i <= a.length; i++) {',
      '    if (a[i] > best) best = a[i];',
      '  }',
      '  return best;',
      '}',
    ),
    expect: ['passing'],
  },

  // --- empty input -------------------------------------------------------------------
  {
    id: 'first-char-index-py',
    category: 'empty_input',
    slug: 'first-character',
    language: 'PYTHON',
    code: src('def solve(a):', '    return a[0]'),
    expect: ['index_crash', 'empty_input'],
    mentions: ['empty'],
  },
  {
    id: 'sum-start-first-py',
    category: 'empty_input',
    slug: 'sum-of-array',
    language: 'PYTHON',
    code: src('def solve(a):', '    total = a[0]', '    for n in a[1:]:', '        total += n', '    return total'),
    expect: ['index_crash', 'empty_input'],
    mentions: ['empty'],
  },
  {
    id: 'count-even-fallback-js',
    category: 'empty_input',
    slug: 'count-even-numbers',
    language: 'JAVASCRIPT',
    code: src(
      'function solve(a) {',
      '  let count = 0;',
      '  for (let i = 0; i < a.length; i++) {',
      '    if (a[i] % 2 === 0) count++;',
      '  }',
      '  return count || a[0];',
      '}',
    ),
    expect: ['wrong_output', 'empty_input'],
    mentions: ['empty'],
  },

  // --- comparisons -----------------------------------------------------------------------
  {
    id: 'count-gt-inclusive-py',
    category: 'comparison',
    slug: 'count-greater-than',
    language: 'PYTHON',
    code: src('def solve(a, b):', '    count = 0', '    for n in a:', '        if n >= b:', '            count += 1', '    return count'),
    expect: ['strictness'],
    mentions: ['>=', 'strictly'],
  },
  {
    id: 'index-assign-in-if-js',
    category: 'comparison',
    slug: 'index-of-target',
    language: 'JAVASCRIPT',
    code: src(
      'function solve(a, b) {',
      '  for (let i = 0; i < a.length; i++) {',
      '    if (a[i] = b) return i;',
      '  }',
      '  return -1;',
      '}',
    ),
    expect: ['assignment_in_condition'],
    mentions: ['='],
  },
  {
    id: 'largest-best-zero-py',
    category: 'comparison',
    slug: 'largest-number',
    language: 'PYTHON',
    code: src('def solve(a):', '    best = 0', '    for n in a:', '        if n > best:', '            best = n', '    return best'),
    expect: ['running_best_start'],
    mentions: ['-5 -2 -9'],
  },

  // --- unnecessary loops ---------------------------------------------------------------------
  {
    id: 'first-char-loop-js',
    category: 'unnecessary_loop',
    slug: 'first-character',
    language: 'JAVASCRIPT',
    code: src('function solve(a) {', '  for (const ch of a) {', '    return ch;', '  }', "  return '';", '}'),
    expect: ['passing'],
  },
  {
    id: 'nth-loop-py',
    category: 'unnecessary_loop',
    slug: 'nth-character',
    language: 'PYTHON',
    code: src('def solve(a, b):', '    for i in range(len(a)):', '        if i == b:', '            return a[i]', "    return ''"),
    expect: ['passing'],
  },

  // --- return inside loops ---------------------------------------------------------------------
  {
    id: 'index-else-return-py',
    category: 'return_in_loop',
    slug: 'index-of-target',
    language: 'PYTHON',
    code: src(
      'def solve(a, b):',
      '    for i in range(len(a)):',
      '        if a[i] == b:',
      '            return i',
      '        else:',
      '            return -1',
      '    return -1',
    ),
    expect: ['return_in_loop'],
    mentions: ['return -1'],
  },
  {
    id: 'sum-return-in-loop-js',
    category: 'return_in_loop',
    slug: 'sum-of-array',
    language: 'JAVASCRIPT',
    code: src(
      'function solve(a) {',
      '  let total = 0;',
      '  for (const n of a) {',
      '    total += n;',
      '    return total;',
      '  }',
      '  return total;',
      '}',
    ),
    expect: ['return_in_loop'],
    mentions: ['return total'],
  },
  {
    id: 'sum-reset-in-loop-py',
    category: 'return_in_loop',
    slug: 'sum-of-array',
    language: 'PYTHON',
    code: src('def solve(a):', '    for n in a:', '        total = 0', '        total += n', '    return total'),
    expect: ['accumulator_reset'],
    mentions: ['total = 0', '4'],
  },

  // --- printing versus returning ---------------------------------------------------------------
  {
    id: 'sum-print-py',
    category: 'print_vs_return',
    slug: 'sum-of-array',
    language: 'PYTHON',
    code: src('def solve(a):', '    total = 0', '    for n in a:', '        total += n', '    print(total)'),
    expect: ['print_not_return'],
    mentions: ['None', 'print'],
  },
  {
    id: 'count-even-print-js',
    category: 'print_vs_return',
    slug: 'count-even-numbers',
    language: 'JAVASCRIPT',
    code: src('function solve(a) {', '  let count = 0;', '  for (const n of a) if (n % 2 === 0) count++;', '  console.log(count);', '}'),
    expect: ['print_not_return'],
    mentions: ['undefined'],
  },
  {
    id: 'sum-stray-print-py',
    category: 'print_vs_return',
    slug: 'sum-of-array',
    language: 'PYTHON',
    code: src('def solve(a):', '    total = 0', '    for n in a:', '        total += n', '        print(total)', '    return total'),
    expect: ['stray_print'],
    mentions: ['print'],
  },

  // --- syntax errors ---------------------------------------------------------------------------------
  {
    id: 'sum-missing-colon-py',
    category: 'syntax',
    slug: 'sum-of-array',
    language: 'PYTHON',
    code: src('def solve(a):', '    total = 0', '    for n in a', '        total += n', '    return total'),
    expect: ['syntax_error'],
    mentions: ['colon'],
  },
  {
    id: 'sum-missing-brace-js',
    category: 'syntax',
    slug: 'sum-of-array',
    language: 'JAVASCRIPT',
    code: src('function solve(a) {', '  let total = 0;', '  for (const n of a) {', '    total += n;', '  return total;', '}'),
    expect: ['syntax_error'],
  },
  {
    id: 'largest-typo-name-py',
    category: 'syntax',
    slug: 'largest-number',
    language: 'PYTHON',
    code: src('def solve(a):', '    best = a[0]', '    for n in a:', '        if n > best:', '            best = n', '    return bets'),
    expect: ['name_error'],
    mentions: ['bets'],
  },

  // --- valid alternatives ---------------------------------------------------------------------------
  {
    id: 'sum-builtin-py',
    category: 'alternative',
    slug: 'sum-of-array',
    language: 'PYTHON',
    code: src('def solve(a):', '    return sum(a)'),
    expect: ['passing'],
  },
  {
    id: 'sum-reduce-js',
    category: 'alternative',
    slug: 'sum-of-array',
    language: 'JAVASCRIPT',
    code: src('function solve(a) {', '  return a.reduce((s, n) => s + n, 0);', '}'),
    expect: ['passing'],
  },
  {
    id: 'index-builtin-py',
    category: 'alternative',
    slug: 'index-of-target',
    language: 'PYTHON',
    code: src('def solve(a, b):', '    return a.index(b) if b in a else -1'),
    expect: ['passing'],
  },
  {
    id: 'largest-max-py',
    category: 'alternative',
    slug: 'largest-number',
    language: 'PYTHON',
    code: src('def solve(a):', '    return max(a)'),
    expect: ['passing'],
  },
  {
    id: 'nth-guard-py',
    category: 'alternative',
    slug: 'nth-character',
    language: 'PYTHON',
    code: src('def solve(a, b):', "    return a[b] if b < len(a) else ''"),
    expect: ['passing'],
  },
  {
    id: 'first-slice-py',
    category: 'alternative',
    slug: 'first-character',
    language: 'PYTHON',
    code: src('def solve(a):', '    return a[:1]'),
    expect: ['passing'],
  },
  {
    id: 'count-gt-while-java',
    category: 'alternative',
    slug: 'count-greater-than',
    language: 'JAVA',
    code: src(
      '    static int solve(int[] a, int b) {',
      '        int count = 0;',
      '        int i = 0;',
      '        while (i < a.length) {',
      '            if (a[i] > b) count++;',
      '            i++;',
      '        }',
      '        return count;',
      '    }',
    ),
    expect: ['passing'],
  },
];
