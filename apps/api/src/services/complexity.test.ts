import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALL_PROBLEMS } from '../corpus/problems/index.js';
import {
  approachName,
  buildFeedback,
  compareGrowth,
  estimateComplexity,
  parseBigO,
  statedComplexity,
  type ComplexityLanguage,
} from './complexity.js';

/**
 * The complexity estimator and the editorial reader.
 *
 * Hand-labelled cases pin the patterns the estimator must get right. The
 * corpus calibration at the end measures agreement between the estimate on
 * each reference solution and the complexity its editorial states. That is a
 * noisy yardstick — some reference solutions are genuinely slower than their
 * editorial (hand-written sorts where the judge cannot import one) — so it is
 * a regression floor, not a claim of accuracy.
 */

const est = (code: string, language: ComplexityLanguage = 'PYTHON') => estimateComplexity(code, language);

describe('estimateComplexity: hand-labelled', () => {
  const cases: Array<[string, ComplexityLanguage, string, string, string]> = [
    ['constant', 'PYTHON', 'def solve(a, b):\n    return a + b\n', 'O(1)', 'O(1)'],
    ['built-in sum', 'PYTHON', 'def solve(xs):\n    return sum(xs) // len(xs)\n', 'O(n)', 'O(1)'],
    [
      'single loop',
      'PYTHON',
      'def solve(xs):\n    best = 0\n    for x in xs:\n        best = max(best, x)\n    return best\n',
      'O(n)',
      'O(1)',
    ],
    [
      'nested loops',
      'JAVASCRIPT',
      'function solve(a) {\n  let c = 0;\n  for (let i = 0; i < a.length; i++) {\n    for (let j = i + 1; j < a.length; j++) {\n      if (a[i] === a[j]) c++;\n    }\n  }\n  return c;\n}\n',
      'O(n^2)',
      'O(1)',
    ],
    [
      'hash map one pass',
      'PYTHON',
      'def solve(nums, target):\n    seen = {}\n    for i, x in enumerate(nums):\n        if target - x in seen:\n            return [seen[target - x], i]\n        seen[x] = i\n',
      'O(n)',
      'O(n)',
    ],
    [
      'linear search inside a loop',
      'PYTHON',
      'def solve(xs):\n    out = []\n    for x in xs:\n        if x not in out:\n            out.append(x)\n    return out\n',
      'O(n^2)',
      'O(n)',
    ],
    [
      'sort then scan',
      'JAVA',
      'static int solve(int[] a) {\n    java.util.Arrays.sort(a);\n    int best = Integer.MAX_VALUE;\n    for (int i = 1; i < a.length; i++) {\n        best = Math.min(best, a[i] - a[i - 1]);\n    }\n    return best;\n}\n',
      'O(n log n)',
      'O(1)',
    ],
    [
      'binary search',
      'CPP',
      'int solve(vector<int>& a, int t) {\n    int lo = 0, hi = a.size() - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (a[mid] == t) return mid;\n        if (a[mid] < t) lo = mid + 1; else hi = mid - 1;\n    }\n    return -1;\n}\n',
      'O(log n)',
      'O(1)',
    ],
    [
      'sliding window (amortised)',
      'PYTHON',
      'def solve(ts):\n    ans = []\n    left = 0\n    for right in range(len(ts)):\n        while ts[right] - ts[left] > 1000:\n            left += 1\n        ans.append(right - left + 1)\n    return ans\n',
      'O(n)',
      'O(n)',
    ],
    [
      'Go condition loop, amortised',
      'GO',
      'func solve(ts []int) []int {\n    ans := make([]int, len(ts))\n    left := 0\n    for right := 0; right < len(ts); right++ {\n        for ts[right]-ts[left] > 1000 {\n            left++\n        }\n        ans[right] = right - left + 1\n    }\n    return ans\n}\n',
      'O(n)',
      'O(n)',
    ],
    [
      'loop over each word’s letters',
      'JAVA',
      'static int solve(String s) {\n    String[] words = s.split(" ");\n    int n = 0;\n    for (String w : words) {\n        for (int i = 0; i < w.length(); i++) {\n            if (w.charAt(i) == \'a\') n++;\n        }\n    }\n    return n;\n}\n',
      'O(n)',
      'O(n)',
    ],
    [
      'constant-bounded inner loop',
      'PYTHON',
      'def solve(words):\n    total = 0\n    for w in words:\n        for k in range(26):\n            total += k\n    return total\n',
      'O(n)',
      'O(1)',
    ],
    [
      'one-line loop body',
      'JAVASCRIPT',
      'function solve(a, b) {\n  const out = [];\n  for (let i = a; i <= b; i++) out.push(i);\n  return out;\n}\n',
      'O(n)',
      'O(n)',
    ],
    [
      'chained calls do not multiply',
      'JAVASCRIPT',
      "function solve(s) {\n  return s.split('').map(Number).filter((d) => d % 2 === 0).length;\n}\n",
      'O(n)',
      'O(n)',
    ],
    [
      'naive fibonacci',
      'PYTHON',
      'def fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n',
      'O(2^n)',
      'O(n)',
    ],
    [
      'tree traversal',
      'GO',
      'func solve(root *TreeNode) int {\n    var depth func(n *TreeNode) int\n    depth = func(n *TreeNode) int {\n        if n == nil {\n            return 0\n        }\n        return 1 + max(depth(n.Left), depth(n.Right))\n    }\n    return depth(root)\n}\n',
      'O(n)',
      'O(n)',
    ],
    [
      'fixed-size counter array',
      'JAVA',
      'static int solve(String s) {\n    int[] count = new int[26];\n    for (char c : s.toCharArray()) count[c - \'a\']++;\n    return count[0];\n}\n',
      'O(n)',
      'O(n)',
    ],
    [
      '2-D table',
      'PYTHON',
      'def solve(a, b):\n    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]\n    for i in range(len(a)):\n        for j in range(len(b)):\n            dp[i + 1][j + 1] = dp[i][j] + 1 if a[i] == b[j] else max(dp[i][j + 1], dp[i + 1][j])\n    return dp[-1][-1]\n',
      'O(n^2)',
      'O(n^2)',
    ],
    [
      'digit loop',
      'PYTHON',
      'def solve(n):\n    s = 0\n    while n > 0:\n        s += n % 10\n        n //= 10\n    return s\n',
      'O(log n)',
      'O(1)',
    ],
  ];

  for (const [name, language, code, time, space] of cases) {
    it(`${name} (${language}) → ${time} time, ${space} space`, () => {
      const e = est(code, language);
      assert.equal(e.time, time, `time: ${e.reasons.join('; ')}`);
      assert.equal(e.space, space, `space: ${e.reasons.join('; ')}`);
      assert.ok(e.reasons.length > 0, 'always gives its reasons');
    });
  }

  it('ignores loops that only appear in comments and strings', () => {
    const e = est('def solve(x):\n    # for i in range(n): for j in range(n)\n    s = "for x in y"\n    return x\n');
    assert.equal(e.time, 'O(1)');
  });

  it('marks recursive estimates as low confidence', () => {
    assert.equal(est('def f(n):\n    return 0 if n == 0 else f(n - 1)\n').confidence, 'low');
  });
});

describe('parseBigO', () => {
  const g = (s: string) => parseBigO(s);
  it('reads common forms', () => {
    assert.deepEqual(g('O(1)'), { power: 0, logPower: 0 });
    assert.deepEqual(g('O(N)'), { power: 1, logPower: 0 });
    assert.deepEqual(g('O(n log n)'), { power: 1, logPower: 1 });
    assert.deepEqual(g('O(NlogN)'), { power: 1, logPower: 1 });
    assert.deepEqual(g('O(N * log(N))'), { power: 1, logPower: 1 });
    assert.deepEqual(g('O(n^2)'), { power: 2, logPower: 0 });
    assert.deepEqual(g('O(n²)'), { power: 2, logPower: 0 });
    assert.deepEqual(g('O(log n)'), { power: 0, logPower: 1 });
    assert.equal(g('O(2^n)')?.exponential, true);
  });
  it('declines what it cannot compare honestly', () => {
    assert.equal(g('O(N * M)'), null);
    assert.equal(g('O(S * A)'), null);
    assert.equal(g('O(sqrt(n))'), null);
    assert.equal(g('O(V + E)'), null);
  });
});

describe('statedComplexity', () => {
  it('takes the final statement, not the brute force before it', () => {
    const s = statedComplexity(
      '## Two Pointers\n\nA brute force would be O(n^2). Instead we walk two pointers.\n\nTime complexity is O(N). Space complexity is O(1).',
    );
    assert.equal(s.time, 'O(N)');
    assert.equal(s.space, 'O(1)');
  });
  it('does not let an explanatory O(1) override the stated time', () => {
    const s = statedComplexity(
      'Time complexity is O(N) where N is the number of rows, as hash map insertions and lookups are O(1) on average. Space complexity is O(U).',
    );
    assert.equal(s.time, 'O(N)');
    assert.equal(s.space, 'O(U)');
  });
  it('reads "O(n) time and O(1) space"', () => {
    const s = statedComplexity('This runs in O(n) time and O(1) extra space.');
    assert.equal(s.time, 'O(n)');
    assert.equal(s.space, 'O(1)');
  });
  it('returns nulls when nothing is stated', () => {
    assert.deepEqual(statedComplexity('Just loop.'), {
      time: null,
      space: null,
      timeGrowth: null,
      spaceGrowth: null,
    });
    assert.equal(statedComplexity(null).time, null);
  });
  it('names the approach from the first heading', () => {
    assert.equal(approachName('## Sliding **Window**\n\ntext'), 'Sliding Window');
    assert.equal(approachName('no heading'), null);
  });
});

describe('buildFeedback', () => {
  const editorial = '## Hash Map\n\nTime complexity is O(N). Space complexity is O(N).';
  const quadratic =
    'def solve(xs):\n    c = 0\n    for i in range(len(xs)):\n        for j in range(i + 1, len(xs)):\n            c += xs[i] == xs[j]\n    return c\n';
  const linear =
    'def solve(xs):\n    seen = {}\n    for x in xs:\n        seen[x] = seen.get(x, 0) + 1\n    return sum(v * (v - 1) // 2 for v in seen.values())\n';

  it('says when yours is slower and names the approach to practise', () => {
    const f = buildFeedback({
      language: 'PYTHON',
      sourceCode: quadratic,
      editorialMarkdown: editorial,
      editorialUrl: null,
      referenceSolution: { PYTHON: linear },
    });
    assert.equal(f.verdict.time, 'slower');
    assert.match(f.summary, /Hash Map/);
    assert.equal(f.standardSolution?.language, 'PYTHON');
    assert.equal(f.standardSolution?.note, null);
  });

  it('says when yours matches', () => {
    const f = buildFeedback({
      language: 'PYTHON',
      sourceCode: linear,
      editorialMarkdown: editorial,
      editorialUrl: null,
      referenceSolution: { PYTHON: linear },
    });
    assert.equal(f.verdict.time, 'matches');
    assert.match(f.summary, /matches/);
  });

  it('never presents a slower reference solution as the standard when a faster one exists', () => {
    const goBubble =
      'func solve(a []int) int {\n    for i := 0; i < len(a); i++ {\n        for j := 0; j < len(a)-1-i; j++ {\n            if a[j] > a[j+1] {\n                a[j], a[j+1] = a[j+1], a[j]\n            }\n        }\n    }\n    return a[0]\n}\n';
    const f = buildFeedback({
      language: 'GO',
      sourceCode: goBubble,
      editorialMarkdown: editorial,
      editorialUrl: null,
      referenceSolution: { GO: goBubble, PYTHON: linear },
    });
    assert.equal(f.standardSolution?.language, 'PYTHON');
    assert.match(f.standardSolution?.note ?? '', /Go reference solution does not reach/);
  });

  it('says so when the editorial states no comparable complexity', () => {
    const f = buildFeedback({
      language: 'PYTHON',
      sourceCode: linear,
      editorialMarkdown: '## Grid\n\nTime complexity is O(R * C).',
      editorialUrl: null,
      referenceSolution: {},
    });
    assert.equal(f.verdict.time, 'unknown');
    assert.match(f.summary, /O\(R \* C\)/);
    assert.equal(f.standardSolution, null);
  });
});

describe('corpus calibration (regression floor)', () => {
  it('agrees with editorials on reference solutions at least as often as when measured', () => {
    // Measured 2026-09-20: time agreement 74% JS/TS/Java, 70% C++, 69% Python,
    // 47% Go (Go references hand-roll sorts). Floors sit a few points below.
    const floors: Record<ComplexityLanguage, number> = {
      JAVASCRIPT: 0.7,
      TYPESCRIPT: 0.7,
      JAVA: 0.7,
      CPP: 0.66,
      PYTHON: 0.65,
      GO: 0.43,
    };
    const hits: Record<string, [number, number]> = {};
    for (const p of ALL_PROBLEMS) {
      const stated = statedComplexity(p.editorialMarkdown);
      if (!stated.timeGrowth) continue;
      for (const [language, code] of Object.entries(p.referenceSolution ?? {})) {
        if (!code) continue;
        const e = estimateComplexity(code, language as ComplexityLanguage);
        const row = (hits[language] ??= [0, 0]);
        row[1]++;
        if (compareGrowth(e.timeGrowth, stated.timeGrowth) === 0) row[0]++;
      }
    }
    for (const [language, floor] of Object.entries(floors)) {
      const [agree, total] = hits[language] ?? [0, 0];
      assert.ok(total > 100, `${language}: expected a real sample, got ${total}`);
      assert.ok(agree / total >= floor, `${language}: ${agree}/${total} below the ${floor} floor`);
    }
  });
});
