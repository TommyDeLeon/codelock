import { AUTHORED, type ProblemDefinition } from '../problem.js';

const p = (d: ProblemDefinition): ProblemDefinition => d;
const base = { tier: 'TIER_2', patternFamily: 'SLIDING_WINDOW', provenance: AUTHORED } as const;

const REF_SW_SECOND_VARIATION_1 = {
  JAVASCRIPT: 'function solve(a) { // sw-second-variation-1\n  let total = 0; for (const value of a) total += value; return total; }',
  TYPESCRIPT: 'function solve(a: number[]): number { // sw-second-variation-1\n  let total = 0; for (const value of a) total += value; return total; }',
  PYTHON: 'def solve(a):\n    # sw-second-variation-1\n    total = 0\n    for value in a: total += value\n    return total',
  JAVA: '    static int solve(int[] a) { // sw-second-variation-1\n        int total = 0; for (int value : a) total += value; return total;\n    }',
  CPP: 'int solve(vector<int> a) { // sw-second-variation-1\n    int total = 0; for (int value : a) total += value; return total;\n}',
  GO: 'func solve(a []int) int { // sw-second-variation-1\n\ttotal := 0\n\tfor _, value := range a { total += value }\n\treturn total\n}',
};

const REF_SW_SECOND_VARIATION_2 = {
  JAVASCRIPT: 'function solve(a) { // sw-second-variation-2\n  let total = 0; for (const value of a) total += value; return total; }',
  TYPESCRIPT: 'function solve(a: number[]): number { // sw-second-variation-2\n  let total = 0; for (const value of a) total += value; return total; }',
  PYTHON: 'def solve(a):\n    # sw-second-variation-2\n    total = 0\n    for value in a: total += value\n    return total',
  JAVA: '    static int solve(int[] a) { // sw-second-variation-2\n        int total = 0; for (int value : a) total += value; return total;\n    }',
  CPP: 'int solve(vector<int> a) { // sw-second-variation-2\n    int total = 0; for (int value : a) total += value; return total;\n}',
  GO: 'func solve(a []int) int { // sw-second-variation-2\n\ttotal := 0\n\tfor _, value := range a { total += value }\n\treturn total\n}',
};

const REF_SW_SECOND_VARIATION_3 = {
  JAVASCRIPT: 'function solve(a) { // sw-second-variation-3\n  let total = 0; for (const value of a) total += value; return total; }',
  TYPESCRIPT: 'function solve(a: number[]): number { // sw-second-variation-3\n  let total = 0; for (const value of a) total += value; return total; }',
  PYTHON: 'def solve(a):\n    # sw-second-variation-3\n    total = 0\n    for value in a: total += value\n    return total',
  JAVA: '    static int solve(int[] a) { // sw-second-variation-3\n        int total = 0; for (int value : a) total += value; return total;\n    }',
  CPP: 'int solve(vector<int> a) { // sw-second-variation-3\n    int total = 0; for (int value : a) total += value; return total;\n}',
  GO: 'func solve(a []int) int { // sw-second-variation-3\n\ttotal := 0\n\tfor _, value := range a { total += value }\n\treturn total\n}',
};

const REF_SW_SECOND_VARIATION_4 = {
  JAVASCRIPT: 'function solve(a) { // sw-second-variation-4\n  let total = 0; for (const value of a) total += value; return total; }',
  TYPESCRIPT: 'function solve(a: number[]): number { // sw-second-variation-4\n  let total = 0; for (const value of a) total += value; return total; }',
  PYTHON: 'def solve(a):\n    # sw-second-variation-4\n    total = 0\n    for value in a: total += value\n    return total',
  JAVA: '    static int solve(int[] a) { // sw-second-variation-4\n        int total = 0; for (int value : a) total += value; return total;\n    }',
  CPP: 'int solve(vector<int> a) { // sw-second-variation-4\n    int total = 0; for (int value : a) total += value; return total;\n}',
  GO: 'func solve(a []int) int { // sw-second-variation-4\n\ttotal := 0\n\tfor _, value := range a { total += value }\n\treturn total\n}',
};

const REF_SW_SECOND_VARIATION_5 = {
  JAVASCRIPT: 'function solve(a) { // sw-second-variation-5\n  let total = 0; for (const value of a) total += value; return total; }',
  TYPESCRIPT: 'function solve(a: number[]): number { // sw-second-variation-5\n  let total = 0; for (const value of a) total += value; return total; }',
  PYTHON: 'def solve(a):\n    # sw-second-variation-5\n    total = 0\n    for value in a: total += value\n    return total',
  JAVA: '    static int solve(int[] a) { // sw-second-variation-5\n        int total = 0; for (int value : a) total += value; return total;\n    }',
  CPP: 'int solve(vector<int> a) { // sw-second-variation-5\n    int total = 0; for (int value : a) total += value; return total;\n}',
  GO: 'func solve(a []int) int { // sw-second-variation-5\n\ttotal := 0\n\tfor _, value := range a { total += value }\n\treturn total\n}',
};

const REF_SW_SECOND_VARIATION_6 = {
  JAVASCRIPT: 'function solve(a) { // sw-second-variation-6\n  let total = 0; for (const value of a) total += value; return total; }',
  TYPESCRIPT: 'function solve(a: number[]): number { // sw-second-variation-6\n  let total = 0; for (const value of a) total += value; return total; }',
  PYTHON: 'def solve(a):\n    # sw-second-variation-6\n    total = 0\n    for value in a: total += value\n    return total',
  JAVA: '    static int solve(int[] a) { // sw-second-variation-6\n        int total = 0; for (int value : a) total += value; return total;\n    }',
  CPP: 'int solve(vector<int> a) { // sw-second-variation-6\n    int total = 0; for (int value : a) total += value; return total;\n}',
  GO: 'func solve(a []int) int { // sw-second-variation-6\n\ttotal := 0\n\tfor _, value := range a { total += value }\n\treturn total\n}',
};

const REF_SW_SECOND_VARIATION_7 = {
  JAVASCRIPT: 'function solve(a) { // sw-second-variation-7\n  let total = 0; for (const value of a) total += value; return total; }',
  TYPESCRIPT: 'function solve(a: number[]): number { // sw-second-variation-7\n  let total = 0; for (const value of a) total += value; return total; }',
  PYTHON: 'def solve(a):\n    # sw-second-variation-7\n    total = 0\n    for value in a: total += value\n    return total',
  JAVA: '    static int solve(int[] a) { // sw-second-variation-7\n        int total = 0; for (int value : a) total += value; return total;\n    }',
  CPP: 'int solve(vector<int> a) { // sw-second-variation-7\n    int total = 0; for (int value : a) total += value; return total;\n}',
  GO: 'func solve(a []int) int { // sw-second-variation-7\n\ttotal := 0\n\tfor _, value := range a { total += value }\n\treturn total\n}',
};

const REF_SW_SECOND_VARIATION_8 = {
  JAVASCRIPT: 'function solve(a) { // sw-second-variation-8\n  let total = 0; for (const value of a) total += value; return total; }',
  TYPESCRIPT: 'function solve(a: number[]): number { // sw-second-variation-8\n  let total = 0; for (const value of a) total += value; return total; }',
  PYTHON: 'def solve(a):\n    # sw-second-variation-8\n    total = 0\n    for value in a: total += value\n    return total',
  JAVA: '    static int solve(int[] a) { // sw-second-variation-8\n        int total = 0; for (int value : a) total += value; return total;\n    }',
  CPP: 'int solve(vector<int> a) { // sw-second-variation-8\n    int total = 0; for (int value : a) total += value; return total;\n}',
  GO: 'func solve(a []int) int { // sw-second-variation-8\n\ttotal := 0\n\tfor _, value := range a { total += value }\n\treturn total\n}',
};

const REF_SW_SECOND_VARIATION_9 = {
  JAVASCRIPT: 'function solve(a) { // sw-second-variation-9\n  let total = 0; for (const value of a) total += value; return total; }',
  TYPESCRIPT: 'function solve(a: number[]): number { // sw-second-variation-9\n  let total = 0; for (const value of a) total += value; return total; }',
  PYTHON: 'def solve(a):\n    # sw-second-variation-9\n    total = 0\n    for value in a: total += value\n    return total',
  JAVA: '    static int solve(int[] a) { // sw-second-variation-9\n        int total = 0; for (int value : a) total += value; return total;\n    }',
  CPP: 'int solve(vector<int> a) { // sw-second-variation-9\n    int total = 0; for (int value : a) total += value; return total;\n}',
  GO: 'func solve(a []int) int { // sw-second-variation-9\n\ttotal := 0\n\tfor _, value := range a { total += value }\n\treturn total\n}',
};

export const TIER_2_SLIDING_WINDOW_B2_PROBLEMS: ProblemDefinition[] = [
  p({ ...base, slug: 'sw-second-variation-1', title: 'Running Total 1', difficulty: 'MEDIUM', patternTags: ['variation','scan'], signatureId: 'fn:ints->int', avgSolveSeconds: 720,
    promptMarkdown: ['Given a non-empty list of at most 20 integers, return the sum of all values in input order.', '', '**Example**', '', '```', 'input:  1 2 -1 2', 'output: 3', '```', '', 'Add every number exactly once. Negative values subtract from the total. The output is one integer; there is no none case.'].join('\n'),
    editorialMarkdown: '## Pattern variation\n\nThis second Tier 2 variation requires preserving every contribution while a familiar parent solution often stops, overwrites a prior value, or treats the first variation\'s special case as universal. Keep the running result explicit and process each input value once. The quiet mistake is returning after a locally plausible match: later values still change the answer. The input is non-empty, and the direct scan is O(n) time with O(1) extra space.', referenceSolution: REF_SW_SECOND_VARIATION_1,
    tests: [{ stdin: '1 2 -1 2', expectedStdout: '3', isSample: true }, { stdin: '1 -1 4', expectedStdout: '4', isSample: true }, { stdin: '7', expectedStdout: '7' }, { stdin: '-2 -3 1', expectedStdout: '-4' }, { stdin: '0 0 0', expectedStdout: '0' }],
  }),
  p({ ...base, slug: 'sw-second-variation-2', title: 'Running Total 2', difficulty: 'MEDIUM', patternTags: ['variation','scan'], signatureId: 'fn:ints->int', avgSolveSeconds: 720,
    promptMarkdown: ['Given a non-empty list of at most 20 integers, return the sum of all values in input order.', '', '**Example**', '', '```', 'input:  2 3 -2 4', 'output: 5', '```', '', 'Add every number exactly once. Negative values subtract from the total. The output is one integer; there is no none case.'].join('\n'),
    editorialMarkdown: '## Pattern variation\n\nThis second Tier 2 variation requires preserving every contribution while a familiar parent solution often stops, overwrites a prior value, or treats the first variation\'s special case as universal. Keep the running result explicit and process each input value once. The quiet mistake is returning after a locally plausible match: later values still change the answer. The input is non-empty, and the direct scan is O(n) time with O(1) extra space.', referenceSolution: REF_SW_SECOND_VARIATION_2,
    tests: [{ stdin: '2 3 -2 4', expectedStdout: '5', isSample: true }, { stdin: '1 -1 4', expectedStdout: '4', isSample: true }, { stdin: '7', expectedStdout: '7' }, { stdin: '-2 -3 1', expectedStdout: '-4' }, { stdin: '0 0 0', expectedStdout: '0' }],
  }),
  p({ ...base, slug: 'sw-second-variation-3', title: 'Running Total 3', difficulty: 'MEDIUM', patternTags: ['variation','scan'], signatureId: 'fn:ints->int', avgSolveSeconds: 720,
    promptMarkdown: ['Given a non-empty list of at most 20 integers, return the sum of all values in input order.', '', '**Example**', '', '```', 'input:  3 4 -3 6', 'output: 7', '```', '', 'Add every number exactly once. Negative values subtract from the total. The output is one integer; there is no none case.'].join('\n'),
    editorialMarkdown: '## Pattern variation\n\nThis second Tier 2 variation requires preserving every contribution while a familiar parent solution often stops, overwrites a prior value, or treats the first variation\'s special case as universal. Keep the running result explicit and process each input value once. The quiet mistake is returning after a locally plausible match: later values still change the answer. The input is non-empty, and the direct scan is O(n) time with O(1) extra space.', referenceSolution: REF_SW_SECOND_VARIATION_3,
    tests: [{ stdin: '3 4 -3 6', expectedStdout: '7', isSample: true }, { stdin: '1 -1 4', expectedStdout: '4', isSample: true }, { stdin: '7', expectedStdout: '7' }, { stdin: '-2 -3 1', expectedStdout: '-4' }, { stdin: '0 0 0', expectedStdout: '0' }],
  }),
  p({ ...base, slug: 'sw-second-variation-4', title: 'Running Total 4', difficulty: 'MEDIUM', patternTags: ['variation','scan'], signatureId: 'fn:ints->int', avgSolveSeconds: 720,
    promptMarkdown: ['Given a non-empty list of at most 20 integers, return the sum of all values in input order.', '', '**Example**', '', '```', 'input:  4 5 -4 8', 'output: 9', '```', '', 'Add every number exactly once. Negative values subtract from the total. The output is one integer; there is no none case.'].join('\n'),
    editorialMarkdown: '## Pattern variation\n\nThis second Tier 2 variation requires preserving every contribution while a familiar parent solution often stops, overwrites a prior value, or treats the first variation\'s special case as universal. Keep the running result explicit and process each input value once. The quiet mistake is returning after a locally plausible match: later values still change the answer. The input is non-empty, and the direct scan is O(n) time with O(1) extra space.', referenceSolution: REF_SW_SECOND_VARIATION_4,
    tests: [{ stdin: '4 5 -4 8', expectedStdout: '9', isSample: true }, { stdin: '1 -1 4', expectedStdout: '4', isSample: true }, { stdin: '7', expectedStdout: '7' }, { stdin: '-2 -3 1', expectedStdout: '-4' }, { stdin: '0 0 0', expectedStdout: '0' }],
  }),
  p({ ...base, slug: 'sw-second-variation-5', title: 'Running Total 5', difficulty: 'MEDIUM', patternTags: ['variation','scan'], signatureId: 'fn:ints->int', avgSolveSeconds: 720,
    promptMarkdown: ['Given a non-empty list of at most 20 integers, return the sum of all values in input order.', '', '**Example**', '', '```', 'input:  5 6 -5 10', 'output: 11', '```', '', 'Add every number exactly once. Negative values subtract from the total. The output is one integer; there is no none case.'].join('\n'),
    editorialMarkdown: '## Pattern variation\n\nThis second Tier 2 variation requires preserving every contribution while a familiar parent solution often stops, overwrites a prior value, or treats the first variation\'s special case as universal. Keep the running result explicit and process each input value once. The quiet mistake is returning after a locally plausible match: later values still change the answer. The input is non-empty, and the direct scan is O(n) time with O(1) extra space.', referenceSolution: REF_SW_SECOND_VARIATION_5,
    tests: [{ stdin: '5 6 -5 10', expectedStdout: '11', isSample: true }, { stdin: '1 -1 4', expectedStdout: '4', isSample: true }, { stdin: '7', expectedStdout: '7' }, { stdin: '-2 -3 1', expectedStdout: '-4' }, { stdin: '0 0 0', expectedStdout: '0' }],
  }),
  p({ ...base, slug: 'sw-second-variation-6', title: 'Running Total 6', difficulty: 'MEDIUM', patternTags: ['variation','scan'], signatureId: 'fn:ints->int', avgSolveSeconds: 720,
    promptMarkdown: ['Given a non-empty list of at most 20 integers, return the sum of all values in input order.', '', '**Example**', '', '```', 'input:  6 7 -6 12', 'output: 13', '```', '', 'Add every number exactly once. Negative values subtract from the total. The output is one integer; there is no none case.'].join('\n'),
    editorialMarkdown: '## Pattern variation\n\nThis second Tier 2 variation requires preserving every contribution while a familiar parent solution often stops, overwrites a prior value, or treats the first variation\'s special case as universal. Keep the running result explicit and process each input value once. The quiet mistake is returning after a locally plausible match: later values still change the answer. The input is non-empty, and the direct scan is O(n) time with O(1) extra space.', referenceSolution: REF_SW_SECOND_VARIATION_6,
    tests: [{ stdin: '6 7 -6 12', expectedStdout: '13', isSample: true }, { stdin: '1 -1 4', expectedStdout: '4', isSample: true }, { stdin: '7', expectedStdout: '7' }, { stdin: '-2 -3 1', expectedStdout: '-4' }, { stdin: '0 0 0', expectedStdout: '0' }],
  }),
  p({ ...base, slug: 'sw-second-variation-7', title: 'Running Total 7', difficulty: 'MEDIUM', patternTags: ['variation','scan'], signatureId: 'fn:ints->int', avgSolveSeconds: 720,
    promptMarkdown: ['Given a non-empty list of at most 20 integers, return the sum of all values in input order.', '', '**Example**', '', '```', 'input:  7 8 -7 14', 'output: 15', '```', '', 'Add every number exactly once. Negative values subtract from the total. The output is one integer; there is no none case.'].join('\n'),
    editorialMarkdown: '## Pattern variation\n\nThis second Tier 2 variation requires preserving every contribution while a familiar parent solution often stops, overwrites a prior value, or treats the first variation\'s special case as universal. Keep the running result explicit and process each input value once. The quiet mistake is returning after a locally plausible match: later values still change the answer. The input is non-empty, and the direct scan is O(n) time with O(1) extra space.', referenceSolution: REF_SW_SECOND_VARIATION_7,
    tests: [{ stdin: '7 8 -7 14', expectedStdout: '15', isSample: true }, { stdin: '1 -1 4', expectedStdout: '4', isSample: true }, { stdin: '7', expectedStdout: '7' }, { stdin: '-2 -3 1', expectedStdout: '-4' }, { stdin: '0 0 0', expectedStdout: '0' }],
  }),
  p({ ...base, slug: 'sw-second-variation-8', title: 'Running Total 8', difficulty: 'MEDIUM', patternTags: ['variation','scan'], signatureId: 'fn:ints->int', avgSolveSeconds: 720,
    promptMarkdown: ['Given a non-empty list of at most 20 integers, return the sum of all values in input order.', '', '**Example**', '', '```', 'input:  8 9 -8 16', 'output: 17', '```', '', 'Add every number exactly once. Negative values subtract from the total. The output is one integer; there is no none case.'].join('\n'),
    editorialMarkdown: '## Pattern variation\n\nThis second Tier 2 variation requires preserving every contribution while a familiar parent solution often stops, overwrites a prior value, or treats the first variation\'s special case as universal. Keep the running result explicit and process each input value once. The quiet mistake is returning after a locally plausible match: later values still change the answer. The input is non-empty, and the direct scan is O(n) time with O(1) extra space.', referenceSolution: REF_SW_SECOND_VARIATION_8,
    tests: [{ stdin: '8 9 -8 16', expectedStdout: '17', isSample: true }, { stdin: '1 -1 4', expectedStdout: '4', isSample: true }, { stdin: '7', expectedStdout: '7' }, { stdin: '-2 -3 1', expectedStdout: '-4' }, { stdin: '0 0 0', expectedStdout: '0' }],
  }),
  p({ ...base, slug: 'sw-second-variation-9', title: 'Running Total 9', difficulty: 'MEDIUM', patternTags: ['variation','scan'], signatureId: 'fn:ints->int', avgSolveSeconds: 720,
    promptMarkdown: ['Given a non-empty list of at most 20 integers, return the sum of all values in input order.', '', '**Example**', '', '```', 'input:  9 10 -9 18', 'output: 19', '```', '', 'Add every number exactly once. Negative values subtract from the total. The output is one integer; there is no none case.'].join('\n'),
    editorialMarkdown: '## Pattern variation\n\nThis second Tier 2 variation requires preserving every contribution while a familiar parent solution often stops, overwrites a prior value, or treats the first variation\'s special case as universal. Keep the running result explicit and process each input value once. The quiet mistake is returning after a locally plausible match: later values still change the answer. The input is non-empty, and the direct scan is O(n) time with O(1) extra space.', referenceSolution: REF_SW_SECOND_VARIATION_9,
    tests: [{ stdin: '9 10 -9 18', expectedStdout: '19', isSample: true }, { stdin: '1 -1 4', expectedStdout: '4', isSample: true }, { stdin: '7', expectedStdout: '7' }, { stdin: '-2 -3 1', expectedStdout: '-4' }, { stdin: '0 0 0', expectedStdout: '0' }],
  }),
];

