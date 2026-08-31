import { AUTHORED, type ProblemDefinition } from '../problem.js';

/**
 * Tier 1 — Heap / Priority Queue.
 *
 * A child of Trees on the roadmap and the parent of Intervals and Greedy, so
 * this family gates a lot of what comes after it. Tier 0.5 already asks the user
 * to *build* a binary heap (`cls:min-heap`, `cls:priority-queue`); here they use
 * one to answer a question, which is the part that transfers.
 *
 * The through-line across the nine: sorting answers every question about order,
 * and almost none of these questions is about the whole order. A heap gives you
 * the one element at the boundary — the smallest of the k largest, the two
 * heaviest stones, the middle of the stream — and nothing else, and that is
 * exactly the trade that turns O(n log n) into O(n log k).
 *
 * The counter-intuitive half is repeated in every editorial because it is the
 * thing people get backwards: to keep the k *largest* you hold a **min**-heap,
 * because the element you must be able to see and evict is the weakest one you
 * are currently keeping.
 *
 * Note for anyone editing the reference solutions: the generated Go driver
 * imports only bufio, fmt, os, strconv and strings — there is no `sort` and no
 * `math`. Every Go solution here therefore carries its own heap, and JavaScript
 * and TypeScript do too, since neither language ships one.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = {
  tier: 'TIER_1',
  patternFamily: 'HEAP_PRIORITY_QUEUE',
  provenance: AUTHORED,
} as const;

export const TIER_1_HEAP_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: 'kth-largest-value',
    title: 'The Kth Biggest',
    difficulty: 'MEDIUM',
    patternTags: ['heap', 'top-k', 'selection'],
    signatureId: 'fn:ints,int->int',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'Line 1 is a list of numbers separated by spaces. Line 2 is a number `k`.',
      '',
      'Print the `k`-th largest value. Counting is by position in the sorted order,',
      'not by distinct value: in `5 5 5 5` the 3rd largest is `5`.',
      '',
      '**Example**',
      '',
      '```',
      'input:  3 2 1 5 6 4',
      '        2',
      'output: 5',
      '```',
      '',
      'Sorted descending the list is `6 5 4 3 2 1`, and the second entry is `5`.',
      '',
      'Guarantees: the list has at least one number and `1 <= k <= length`, so the',
      'answer always exists. Values may be negative and may repeat.',
      '',
      'The named edge cases: `k = 1` asks for the maximum, and `k = length` asks for',
      'the minimum. Duplicates each occupy their own position.',
    ].join('\n'),
    editorialMarkdown: [
      '## Heap of size k',
      '',
      'Sorting the list and indexing position `k-1` is correct and costs',
      'O(n log n). But look at what you actually asked for: one value. Sorting',
      'computed the relative order of every pair in the list, and you threw all of',
      'it away except a single boundary.',
      '',
      'Keep instead a heap holding the `k` largest values seen so far. Push each',
      'value; whenever the heap holds more than `k`, evict its weakest member. At',
      'the end the heap contains exactly the top `k`, and the answer is its weakest',
      'member — the `k`-th largest.',
      '',
      'And here is the part that is backwards from the naive guess: for the `k`',
      '**largest** you want a **min**-heap. The operation you need to be fast is',
      '"throw away the worst thing I am keeping", so the element that must sit at',
      'the top, visible in O(1), is the *smallest* of your keepers. A max-heap would',
      'show you the biggest value, which is precisely the one you never want to',
      'touch.',
      '',
      '```',
      'h = min-heap',
      'for v in a:',
      '    h.push(v)',
      '    if h.size() > k: h.pop()   # drops the smallest keeper',
      'return h.top()',
      '```',
      '',
      'The quiet mistake is deduplicating — using a set, or skipping a value equal',
      'to one already held. That answers a different question, the `k`-th largest',
      '*distinct* value, and on a list with no repeats the two answers are',
      'identical, so the test you wrote by hand passes and the one with a repeated',
      'maximum does not.',
      '',
      'O(n log k) time, since each of the n values does at most one push and one pop',
      'on a heap of height log k, and O(k) space. When k is small that beats sorting',
      'outright; when k is n it is the same work, which is the honest answer to',
      '"is this always better".',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a, k) {
  const h = [];
  const up = (i) => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (h[i] < h[par]) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i) => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && h[l] < h[m]) m = l;
      if (r < h.length && h[r] < h[m]) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v) => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = () => {
    const top = h[0];
    const last = h.pop();
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const v of a) {
    push(v);
    if (h.length > k) pop();
  }
  return h[0];
}`,
      TYPESCRIPT: `function solve(a: number[], k: number): number {
  const h: number[] = [];
  const up = (i: number): void => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (h[i] < h[par]) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i: number): void => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && h[l] < h[m]) m = l;
      if (r < h.length && h[r] < h[m]) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v: number): void => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = (): number => {
    const top = h[0];
    const last = h.pop() as number;
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const v of a) {
    push(v);
    if (h.length > k) pop();
  }
  return h[0];
}`,
      PYTHON: `import heapq


def solve(a, k):
    h = []
    for v in a:
        heapq.heappush(h, v)
        if len(h) > k:
            heapq.heappop(h)
    return h[0]`,
      JAVA: `    static int solve(int[] a, int k) {
        PriorityQueue<Integer> h = new PriorityQueue<Integer>();
        for (int v : a) {
            h.add(v);
            if (h.size() > k) h.poll();
        }
        return h.peek();
    }`,
      CPP: `int solve(vector<int> a, int k) {
    priority_queue<int, vector<int>, greater<int> > h;
    for (size_t i = 0; i < a.size(); i++) {
        h.push(a[i]);
        if ((int) h.size() > k) h.pop();
    }
    return h.top();
}`,
      GO: `type intHeap struct {
    a    []int
    less func(x, y int) bool
}

func (h *intHeap) push(v int) {
    h.a = append(h.a, v)
    i := len(h.a) - 1
    for i > 0 {
        par := (i - 1) / 2
        if h.less(h.a[i], h.a[par]) {
            h.a[i], h.a[par] = h.a[par], h.a[i]
            i = par
        } else {
            break
        }
    }
}

func (h *intHeap) pop() int {
    top := h.a[0]
    n := len(h.a) - 1
    h.a[0] = h.a[n]
    h.a = h.a[:n]
    i := 0
    for {
        l, r := 2*i+1, 2*i+2
        m := i
        if l < len(h.a) && h.less(h.a[l], h.a[m]) {
            m = l
        }
        if r < len(h.a) && h.less(h.a[r], h.a[m]) {
            m = r
        }
        if m == i {
            break
        }
        h.a[i], h.a[m] = h.a[m], h.a[i]
        i = m
    }
    return top
}

func solve(a []int, k int) int {
    h := &intHeap{less: func(x, y int) bool { return x < y }}
    for _, v := range a {
        h.push(v)
        if len(h.a) > k {
            h.pop()
        }
    }
    return h.a[0]
}`,
    },
    tests: [
      { stdin: '3 2 1 5 6 4\n2', expectedStdout: '5', isSample: true },
      { stdin: '1\n1', expectedStdout: '1', isSample: true },
      { stdin: '5 5 5 5\n3', expectedStdout: '5' },
      { stdin: '7 6 5 4 3\n5', expectedStdout: '3' },
      { stdin: '-1 -5 -3\n1', expectedStdout: '-1' },
      { stdin: '2 1 3\n3', expectedStdout: '1' },
    ],
  }),

  p({
    ...base,
    slug: 'k-smallest-values-sorted',
    title: 'The k Smallest, In Order',
    difficulty: 'MEDIUM',
    patternTags: ['heap', 'top-k', 'selection'],
    signatureId: 'fn:ints,int->ints',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'Line 1 is a list of numbers separated by spaces. Line 2 is a number `k`.',
      '',
      'Print the `k` smallest values, in **ascending order**, separated by spaces.',
      'Duplicates count as separate values.',
      '',
      '**Example**',
      '',
      '```',
      'input:  5 1 4 2 3',
      '        3',
      'output: 1 2 3',
      '```',
      '',
      'Guarantees: the list has at least one number and `1 <= k <= length`. Values',
      'may be negative and may repeat.',
      '',
      'The named edge cases: `k = 1` prints just the minimum, `k = length` prints',
      'the whole list sorted ascending, and a repeated value such as `4 4 4 1` with',
      '`k = 2` prints `1 4`.',
    ].join('\n'),
    editorialMarkdown: [
      '## Heap of size k, drained backwards',
      '',
      'Sorting the whole list and slicing the first `k` is O(n log n) and it is fine.',
      'But you were not asked for the order of the values you are discarding, and a',
      'heap lets you not compute it.',
      '',
      'Hold a heap of the `k` smallest values seen so far. Push each value; when the',
      'heap exceeds `k`, evict its weakest member. Here "weakest" means *largest*,',
      'because you are keeping the small ones — so this is the mirror of the k-largest',
      'problem and it wants a **max**-heap. The general rule is worth memorising in',
      'that form: the heap is always the opposite kind from the extreme you are',
      'chasing, because its top must be the candidate you are most willing to throw',
      'away.',
      '',
      'When the loop ends the heap holds exactly the k smallest, but a heap is not a',
      'sorted structure — only its top is guaranteed. To print in ascending order,',
      'pop everything: a max-heap yields descending, so reverse it.',
      '',
      '```',
      'h = max-heap',
      'for v in a:',
      '    h.push(v)',
      '    if h.size() > k: h.pop()   # drops the largest keeper',
      'out = [h.pop() while h non-empty]   # descending',
      'reverse(out)',
      '```',
      '',
      'The quiet mistake is printing the heap array directly instead of draining it.',
      'The internal array satisfies the heap property, not sorted order — but for',
      'small k it very often *looks* sorted, because with three or four elements the',
      'two coincide more often than not. It passes the example you tried and fails on',
      'the first input with five.',
      '',
      'O(n log k) for the scan plus O(k log k) to drain, and O(k) space. The scan',
      'bounds it whenever k is much smaller than n, which is the case the pattern is',
      'for.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a, k) {
  const h = [];
  const up = (i) => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (h[i] > h[par]) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i) => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && h[l] > h[m]) m = l;
      if (r < h.length && h[r] > h[m]) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v) => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = () => {
    const top = h[0];
    const last = h.pop();
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const v of a) {
    push(v);
    if (h.length > k) pop();
  }
  const out = [];
  while (h.length > 0) out.push(pop());
  out.reverse();
  return out;
}`,
      TYPESCRIPT: `function solve(a: number[], k: number): number[] {
  const h: number[] = [];
  const up = (i: number): void => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (h[i] > h[par]) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i: number): void => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && h[l] > h[m]) m = l;
      if (r < h.length && h[r] > h[m]) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v: number): void => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = (): number => {
    const top = h[0];
    const last = h.pop() as number;
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const v of a) {
    push(v);
    if (h.length > k) pop();
  }
  const out: number[] = [];
  while (h.length > 0) out.push(pop());
  out.reverse();
  return out;
}`,
      PYTHON: `import heapq


def solve(a, k):
    h = []
    for v in a:
        heapq.heappush(h, -v)
        if len(h) > k:
            heapq.heappop(h)
    out = []
    while h:
        out.append(-heapq.heappop(h))
    out.reverse()
    return out`,
      JAVA: `    static int[] solve(int[] a, int k) {
        PriorityQueue<Integer> h = new PriorityQueue<Integer>(Collections.reverseOrder());
        for (int v : a) {
            h.add(v);
            if (h.size() > k) h.poll();
        }
        int[] out = new int[h.size()];
        for (int i = out.length - 1; i >= 0; i--) out[i] = h.poll();
        return out;
    }`,
      CPP: `vector<int> solve(vector<int> a, int k) {
    priority_queue<int> h;
    for (size_t i = 0; i < a.size(); i++) {
        h.push(a[i]);
        if ((int) h.size() > k) h.pop();
    }
    vector<int> out(h.size());
    for (int i = (int) out.size() - 1; i >= 0; i--) {
        out[i] = h.top();
        h.pop();
    }
    return out;
}`,
      GO: `type intHeap struct {
    a    []int
    less func(x, y int) bool
}

func (h *intHeap) push(v int) {
    h.a = append(h.a, v)
    i := len(h.a) - 1
    for i > 0 {
        par := (i - 1) / 2
        if h.less(h.a[i], h.a[par]) {
            h.a[i], h.a[par] = h.a[par], h.a[i]
            i = par
        } else {
            break
        }
    }
}

func (h *intHeap) pop() int {
    top := h.a[0]
    n := len(h.a) - 1
    h.a[0] = h.a[n]
    h.a = h.a[:n]
    i := 0
    for {
        l, r := 2*i+1, 2*i+2
        m := i
        if l < len(h.a) && h.less(h.a[l], h.a[m]) {
            m = l
        }
        if r < len(h.a) && h.less(h.a[r], h.a[m]) {
            m = r
        }
        if m == i {
            break
        }
        h.a[i], h.a[m] = h.a[m], h.a[i]
        i = m
    }
    return top
}

func solve(a []int, k int) []int {
    h := &intHeap{less: func(x, y int) bool { return x > y }}
    for _, v := range a {
        h.push(v)
        if len(h.a) > k {
            h.pop()
        }
    }
    out := make([]int, len(h.a))
    for i := len(out) - 1; i >= 0; i-- {
        out[i] = h.pop()
    }
    return out
}`,
    },
    tests: [
      { stdin: '5 1 4 2 3\n3', expectedStdout: '1 2 3', isSample: true },
      { stdin: '9\n1', expectedStdout: '9', isSample: true },
      { stdin: '4 4 4 1\n2', expectedStdout: '1 4' },
      { stdin: '3 1 2\n3', expectedStdout: '1 2 3' },
      { stdin: '-2 0 -5 7\n2', expectedStdout: '-5 -2' },
      { stdin: '8 6\n1', expectedStdout: '6' },
    ],
  }),

  p({
    ...base,
    slug: 'k-most-frequent-values',
    title: 'The k That Turn Up Most',
    difficulty: 'MEDIUM',
    patternTags: ['heap', 'top-k', 'frequency'],
    signatureId: 'fn:ints,int->ints',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'Line 1 is a list of numbers separated by spaces. Line 2 is a number `k`.',
      '',
      'Print the `k` values that occur most often, separated by spaces, ordered by',
      '**higher frequency first**, and where two values occur equally often, by',
      '**smaller value first**. That order is total, so there is exactly one correct',
      'line of output.',
      '',
      '**Example**',
      '',
      '```',
      'input:  9 9 8 8 8 7',
      '        3',
      'output: 8 9 7',
      '```',
      '',
      '`8` occurs three times, `9` twice, `7` once.',
      '',
      'Guarantees: the list has at least one number, and `k` is at least 1 and at',
      'most the number of **distinct** values, so the answer always exists. Values',
      'may be negative.',
      '',
      'The named edge cases: when several values tie on frequency — `4 4 5 5 6` with',
      '`k = 2` — the tie-break picks the smaller values first, giving `4 5`. When',
      'every value occurs once, the answer is simply the `k` smallest values in',
      'ascending order.',
    ].join('\n'),
    editorialMarkdown: [
      '## Count, then a heap of size k over the counts',
      '',
      'Two phases. Count occurrences with a hash map — that part is unavoidable and',
      'is O(n). Then you need the best `k` of those `(value, frequency)` pairs under',
      'the stated order, and that is the same top-k question as before, one level up.',
      '',
      'Sorting all `d` distinct pairs costs O(d log d) and hands you an order you',
      'mostly discard. A heap of size `k` costs O(d log k) and gives you the boundary',
      'and nothing more.',
      '',
      'The heap is again the opposite kind from the naive guess. You are keeping the',
      '*best* `k`, so the top must be the **worst** of your keepers — the one to',
      'evict. Under this problem’s order, worse means lower frequency, and on a tie,',
      'a larger value. Give the heap exactly that comparison and it will surface the',
      'right victim every time.',
      '',
      '```',
      'worse(x, y) = x.freq < y.freq  or  (x.freq == y.freq and x.value > y.value)',
      'h = heap with worst on top',
      'for each (value, freq): h.push(pair); if h.size() > k: h.pop()',
      'out = [h.pop() while non-empty]   # worst first',
      'reverse(out)                      # best first — the required order',
      '```',
      '',
      'Draining and reversing is what produces the printed order: a heap only',
      'guarantees its top, so the k pairs come out worst-first and must be turned',
      'around.',
      '',
      'The quiet mistake is a comparator that only looks at frequency. Everything is',
      'correct whenever the frequencies happen to be distinct, which is nearly every',
      'input a person types while testing — and then on the first tie the output',
      'depends on hash-map iteration order, which differs between languages and',
      'sometimes between runs. The judge compares stdout exactly, so an unspecified',
      'tie is not a small risk, it is a coin flip.',
      '',
      'O(n) to count, O(d log k) to select, O(k log k) to drain. Counting bounds the',
      'time when the values repeat a lot; the selection bounds it when they do not.',
      'Space is O(d) for the map plus O(k) for the heap.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a, k) {
  const freq = new Map();
  for (const v of a) freq.set(v, (freq.get(v) || 0) + 1);
  // worse(x, y): true when x should be evicted before y
  const worse = (x, y) => (x[1] !== y[1] ? x[1] < y[1] : x[0] > y[0]);
  const h = [];
  const up = (i) => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (worse(h[i], h[par])) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i) => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && worse(h[l], h[m])) m = l;
      if (r < h.length && worse(h[r], h[m])) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v) => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = () => {
    const top = h[0];
    const last = h.pop();
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const [value, count] of freq) {
    push([value, count]);
    if (h.length > k) pop();
  }
  const out = [];
  while (h.length > 0) out.push(pop()[0]);
  out.reverse();
  return out;
}`,
      TYPESCRIPT: `function solve(a: number[], k: number): number[] {
  const freq = new Map<number, number>();
  for (const v of a) freq.set(v, (freq.get(v) ?? 0) + 1);
  // worse(x, y): true when x should be evicted before y
  const worse = (x: number[], y: number[]): boolean =>
    x[1] !== y[1] ? x[1] < y[1] : x[0] > y[0];
  const h: number[][] = [];
  const up = (i: number): void => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (worse(h[i], h[par])) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i: number): void => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && worse(h[l], h[m])) m = l;
      if (r < h.length && worse(h[r], h[m])) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v: number[]): void => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = (): number[] => {
    const top = h[0];
    const last = h.pop() as number[];
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const [value, count] of freq) {
    push([value, count]);
    if (h.length > k) pop();
  }
  const out: number[] = [];
  while (h.length > 0) out.push(pop()[0]);
  out.reverse();
  return out;
}`,
      PYTHON: `import heapq


def solve(a, k):
    freq = {}
    for v in a:
        freq[v] = freq.get(v, 0) + 1
    # (count, -value) ordered ascending puts the worst keeper on top
    h = []
    for value, count in freq.items():
        heapq.heappush(h, (count, -value))
        if len(h) > k:
            heapq.heappop(h)
    out = []
    while h:
        count, negvalue = heapq.heappop(h)
        out.append(-negvalue)
    out.reverse()
    return out`,
      JAVA: `    static int[] solve(int[] a, int k) {
        HashMap<Integer, Integer> freq = new HashMap<Integer, Integer>();
        for (int v : a) freq.put(v, freq.getOrDefault(v, 0) + 1);
        // head of the queue is the worst keeper: lowest frequency, then largest value
        PriorityQueue<int[]> h = new PriorityQueue<int[]>(new Comparator<int[]>() {
            public int compare(int[] x, int[] y) {
                if (x[1] != y[1]) return Integer.compare(x[1], y[1]);
                return Integer.compare(y[0], x[0]);
            }
        });
        for (Map.Entry<Integer, Integer> e : freq.entrySet()) {
            h.add(new int[] { e.getKey(), e.getValue() });
            if (h.size() > k) h.poll();
        }
        int[] out = new int[h.size()];
        for (int i = out.length - 1; i >= 0; i--) out[i] = h.poll()[0];
        return out;
    }`,
      CPP: `struct WorseByFreq {
    bool operator()(const pair<int, int> &x, const pair<int, int> &y) const {
        // true when x has LOWER eviction priority than y, so the worst keeper ends on top
        if (x.second != y.second) return x.second > y.second;
        return x.first < y.first;
    }
};

vector<int> solve(vector<int> a, int k) {
    map<int, int> freq;
    for (size_t i = 0; i < a.size(); i++) freq[a[i]]++;
    priority_queue<pair<int, int>, vector<pair<int, int> >, WorseByFreq> h;
    for (map<int, int>::iterator it = freq.begin(); it != freq.end(); ++it) {
        h.push(make_pair(it->first, it->second));
        if ((int) h.size() > k) h.pop();
    }
    vector<int> out(h.size());
    for (int i = (int) out.size() - 1; i >= 0; i--) {
        out[i] = h.top().first;
        h.pop();
    }
    return out;
}`,
      GO: `type pairHeap struct {
    a     [][2]int
    worse func(x, y [2]int) bool
}

func (h *pairHeap) push(v [2]int) {
    h.a = append(h.a, v)
    i := len(h.a) - 1
    for i > 0 {
        par := (i - 1) / 2
        if h.worse(h.a[i], h.a[par]) {
            h.a[i], h.a[par] = h.a[par], h.a[i]
            i = par
        } else {
            break
        }
    }
}

func (h *pairHeap) pop() [2]int {
    top := h.a[0]
    n := len(h.a) - 1
    h.a[0] = h.a[n]
    h.a = h.a[:n]
    i := 0
    for {
        l, r := 2*i+1, 2*i+2
        m := i
        if l < len(h.a) && h.worse(h.a[l], h.a[m]) {
            m = l
        }
        if r < len(h.a) && h.worse(h.a[r], h.a[m]) {
            m = r
        }
        if m == i {
            break
        }
        h.a[i], h.a[m] = h.a[m], h.a[i]
        i = m
    }
    return top
}

func solve(a []int, k int) []int {
    freq := map[int]int{}
    order := []int{}
    for _, v := range a {
        if _, ok := freq[v]; !ok {
            order = append(order, v)
        }
        freq[v]++
    }
    h := &pairHeap{worse: func(x, y [2]int) bool {
        if x[1] != y[1] {
            return x[1] < y[1]
        }
        return x[0] > y[0]
    }}
    for _, v := range order {
        h.push([2]int{v, freq[v]})
        if len(h.a) > k {
            h.pop()
        }
    }
    out := make([]int, len(h.a))
    for i := len(out) - 1; i >= 0; i-- {
        out[i] = h.pop()[0]
    }
    return out
}`,
    },
    tests: [
      { stdin: '9 9 8 8 8 7\n3', expectedStdout: '8 9 7', isSample: true },
      { stdin: '4 4 5 5 6\n2', expectedStdout: '4 5', isSample: true },
      { stdin: '1 1 1 2 2 3\n2', expectedStdout: '1 2' },
      { stdin: '7\n1', expectedStdout: '7' },
      { stdin: '1 2 3\n3', expectedStdout: '1 2 3' },
      { stdin: '-1 -1 2\n1', expectedStdout: '-1' },
    ],
  }),

  p({
    ...base,
    slug: 'merge-sorted-groups',
    title: 'Zip The Sorted Runs Together',
    difficulty: 'MEDIUM',
    patternTags: ['heap', 'k-way-merge', 'sorting'],
    signatureId: 'fn:ints,int->ints',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'Line 1 is a list of numbers separated by spaces. Line 2 is a group size `g`.',
      '',
      'The list is a series of back-to-back groups of exactly `g` numbers each: the',
      'first `g` numbers are group 1, the next `g` are group 2, and so on. **Each',
      'group is already sorted ascending.** The list as a whole is not.',
      '',
      'Merge every group into one list sorted ascending and print it, separated by',
      'spaces.',
      '',
      '**Example**',
      '',
      '```',
      'input:  1 4 7 2 5 8 3 6 9',
      '        3',
      'output: 1 2 3 4 5 6 7 8 9',
      '```',
      '',
      'The groups are `1 4 7`, `2 5 8` and `3 6 9`.',
      '',
      'Guarantees: the list has at least one number, `g` is at least 1, and the',
      'length is an exact multiple of `g`. Values may be negative and may repeat',
      'across or within groups.',
      '',
      'The named edge cases: `g = 1` means every number is its own group, so the',
      'answer is the whole list sorted. A `g` equal to the length means one group,',
      'already sorted, printed unchanged.',
    ].join('\n'),
    editorialMarkdown: [
      '## k-way merge with a heap of front-runners',
      '',
      'You could concatenate everything and sort — O(n log n), and it ignores',
      'everything you were told. The groups are already sorted, and that is the',
      'whole gift: the next number in the merged output is always the front of one',
      'of the groups. Never anything deeper.',
      '',
      'So keep a heap of exactly one candidate per group: the front-runner. Pop the',
      'smallest, emit it, and push the next number from the group it came from. The',
      'heap holds at most `m` entries — one per group — no matter how long the',
      'groups are.',
      '',
      '```',
      'h = min-heap of (value, group, index)',
      'for each group j: h.push((first value of j, j, 0))',
      'while h non-empty:',
      '    (v, j, i) = h.pop(); emit v',
      '    if i + 1 < g: h.push((group j value at i+1, j, i + 1))',
      '```',
      '',
      'Why a min-heap here, when the top-k problems wanted the opposite kind: this',
      'time the top *is* the answer, not the victim. The heap is small because you',
      'only ever hold the boundary between what is emitted and what is not — that is',
      'the same principle as a size-k heap, seen from the other side.',
      '',
      'The quiet mistake is pushing every element of every group up front. It still',
      'produces the right answer, because a heap sorts fine, but the heap is now size',
      'n and you have written a heapsort with extra steps — the O(m) memory bound,',
      'the property that makes this pattern work on streams too big for memory, is',
      'gone. It is quiet because nothing fails; only the complexity changed.',
      '',
      'O(n log m) time for m groups, and O(m) space. The number of groups bounds the',
      'memory; the total element count bounds the time.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a, g) {
  const groups = a.length / g;
  const worse = (x, y) => (x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1]);
  const h = [];
  const up = (i) => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (worse(h[i], h[par])) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i) => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && worse(h[l], h[m])) m = l;
      if (r < h.length && worse(h[r], h[m])) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v) => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = () => {
    const top = h[0];
    const last = h.pop();
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (let j = 0; j < groups; j++) push([a[j * g], j, 0]);
  const out = [];
  while (h.length > 0) {
    const cur = pop();
    out.push(cur[0]);
    const j = cur[1];
    const i = cur[2];
    if (i + 1 < g) push([a[j * g + i + 1], j, i + 1]);
  }
  return out;
}`,
      TYPESCRIPT: `function solve(a: number[], g: number): number[] {
  const groups = a.length / g;
  const worse = (x: number[], y: number[]): boolean =>
    x[0] !== y[0] ? x[0] < y[0] : x[1] < y[1];
  const h: number[][] = [];
  const up = (i: number): void => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (worse(h[i], h[par])) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i: number): void => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && worse(h[l], h[m])) m = l;
      if (r < h.length && worse(h[r], h[m])) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v: number[]): void => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = (): number[] => {
    const top = h[0];
    const last = h.pop() as number[];
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (let j = 0; j < groups; j++) push([a[j * g], j, 0]);
  const out: number[] = [];
  while (h.length > 0) {
    const cur = pop();
    out.push(cur[0]);
    const j = cur[1];
    const i = cur[2];
    if (i + 1 < g) push([a[j * g + i + 1], j, i + 1]);
  }
  return out;
}`,
      PYTHON: `import heapq


def solve(a, g):
    groups = len(a) // g
    h = []
    for j in range(groups):
        heapq.heappush(h, (a[j * g], j, 0))
    out = []
    while h:
        value, j, i = heapq.heappop(h)
        out.append(value)
        if i + 1 < g:
            heapq.heappush(h, (a[j * g + i + 1], j, i + 1))
    return out`,
      JAVA: `    static int[] solve(int[] a, int g) {
        int groups = a.length / g;
        PriorityQueue<int[]> h = new PriorityQueue<int[]>(new Comparator<int[]>() {
            public int compare(int[] x, int[] y) {
                if (x[0] != y[0]) return Integer.compare(x[0], y[0]);
                return Integer.compare(x[1], y[1]);
            }
        });
        for (int j = 0; j < groups; j++) h.add(new int[] { a[j * g], j, 0 });
        int[] out = new int[a.length];
        int at = 0;
        while (!h.isEmpty()) {
            int[] cur = h.poll();
            out[at] = cur[0];
            at++;
            int j = cur[1];
            int i = cur[2];
            if (i + 1 < g) h.add(new int[] { a[j * g + i + 1], j, i + 1 });
        }
        return out;
    }`,
      CPP: `struct AheadInMerge {
    bool operator()(const vector<int> &x, const vector<int> &y) const {
        // true when x has LOWER priority than y, so the smallest value ends on top
        if (x[0] != y[0]) return x[0] > y[0];
        return x[1] > y[1];
    }
};

vector<int> solve(vector<int> a, int g) {
    int groups = (int) a.size() / g;
    priority_queue<vector<int>, vector<vector<int> >, AheadInMerge> h;
    for (int j = 0; j < groups; j++) {
        vector<int> entry(3);
        entry[0] = a[j * g];
        entry[1] = j;
        entry[2] = 0;
        h.push(entry);
    }
    vector<int> out;
    while (!h.empty()) {
        vector<int> cur = h.top();
        h.pop();
        out.push_back(cur[0]);
        int j = cur[1];
        int i = cur[2];
        if (i + 1 < g) {
            vector<int> nextEntry(3);
            nextEntry[0] = a[j * g + i + 1];
            nextEntry[1] = j;
            nextEntry[2] = i + 1;
            h.push(nextEntry);
        }
    }
    return out;
}`,
      GO: `type tripleHeap struct {
    a     [][3]int
    worse func(x, y [3]int) bool
}

func (h *tripleHeap) push(v [3]int) {
    h.a = append(h.a, v)
    i := len(h.a) - 1
    for i > 0 {
        par := (i - 1) / 2
        if h.worse(h.a[i], h.a[par]) {
            h.a[i], h.a[par] = h.a[par], h.a[i]
            i = par
        } else {
            break
        }
    }
}

func (h *tripleHeap) pop() [3]int {
    top := h.a[0]
    n := len(h.a) - 1
    h.a[0] = h.a[n]
    h.a = h.a[:n]
    i := 0
    for {
        l, r := 2*i+1, 2*i+2
        m := i
        if l < len(h.a) && h.worse(h.a[l], h.a[m]) {
            m = l
        }
        if r < len(h.a) && h.worse(h.a[r], h.a[m]) {
            m = r
        }
        if m == i {
            break
        }
        h.a[i], h.a[m] = h.a[m], h.a[i]
        i = m
    }
    return top
}

func solve(a []int, g int) []int {
    groups := len(a) / g
    h := &tripleHeap{worse: func(x, y [3]int) bool {
        if x[0] != y[0] {
            return x[0] < y[0]
        }
        return x[1] < y[1]
    }}
    for j := 0; j < groups; j++ {
        h.push([3]int{a[j*g], j, 0})
    }
    out := []int{}
    for len(h.a) > 0 {
        cur := h.pop()
        out = append(out, cur[0])
        j := cur[1]
        i := cur[2]
        if i+1 < g {
            h.push([3]int{a[j*g+i+1], j, i + 1})
        }
    }
    return out
}`,
    },
    tests: [
      { stdin: '1 4 7 2 5 8 3 6 9\n3', expectedStdout: '1 2 3 4 5 6 7 8 9', isSample: true },
      { stdin: '2 1\n1', expectedStdout: '1 2', isSample: true },
      { stdin: '1 2 3 4\n4', expectedStdout: '1 2 3 4' },
      { stdin: '5 5 1 5\n2', expectedStdout: '1 5 5 5' },
      { stdin: '-3 0 -1 4\n2', expectedStdout: '-3 -1 0 4' },
      { stdin: '7 8\n2', expectedStdout: '7 8' },
    ],
  }),

  p({
    ...base,
    slug: 'last-remaining-stone-weight',
    title: 'Smash The Two Heaviest',
    difficulty: 'MEDIUM',
    patternTags: ['heap', 'simulation', 'max-heap'],
    signatureId: 'fn:ints->int',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'A line of stone weights, separated by spaces.',
      '',
      'Repeat this while two or more stones remain: take the two heaviest, and',
      '',
      '- if they weigh the same, both are destroyed;',
      '- otherwise both are destroyed and a new stone of the difference is added.',
      '',
      'Print the weight of the stone that is left. Print `0` if nothing is left.',
      '',
      '**Example**',
      '',
      '```',
      'input:  2 7 4 1 8 1',
      'output: 1',
      '```',
      '',
      '`8` and `7` leave `1`, so the stones are `2 4 1 1 1`. Then `4` and `2` leave',
      '`2`, giving `2 1 1 1`. Then `2` and `1` leave `1`, giving `1 1 1`. Then two',
      '`1`s cancel, leaving `1`.',
      '',
      'Guarantees: there is at least one stone and every weight is at least 1.',
      '',
      'The named edge cases: a single stone is already the answer and is printed',
      'unchanged. Two equal stones — `3 3` — destroy each other, and the answer is',
      '`0`.',
    ].join('\n'),
    editorialMarkdown: [
      '## Max-heap simulation',
      '',
      'The rule names "the two heaviest" at every step, and the set of stones keeps',
      'changing, so what you need is not a sorted list but a structure that can hand',
      'you the current maximum repeatedly while accepting new values. That is exactly',
      'a max-heap.',
      '',
      'Sorting up front does not survive the first round: the difference you push',
      'back has to land in the right place, and re-sorting after every smash is',
      'O(n² log n). The heap re-establishes its one guarantee — the top is the',
      'largest — in O(log n) per insertion, and that guarantee is all the rule asks',
      'for.',
      '',
      '```',
      'h = max-heap of all weights',
      'while h.size() >= 2:',
      '    x = h.pop(); y = h.pop()          # x >= y',
      '    if x != y: h.push(x - y)',
      'return h.empty() ? 0 : h.top()',
      '```',
      '',
      'This is the one family member where the heap is the *same* kind as the',
      'extreme you are chasing — because here you genuinely consume the maximum,',
      'rather than guarding a boundary against it.',
      '',
      'The quiet mistake is pushing the difference back even when it is zero. A stone',
      'of weight 0 is not a stone, but it sits in the heap as the smallest element,',
      'so it never surfaces as one of "the two heaviest" until the very end — and',
      'then it is the survivor, and the function returns 0 for an input that should',
      'have answered with a real stone. It is quiet because every intermediate step',
      'is right and only the final read is wrong.',
      '',
      'O(n log n): building is O(n), and each round removes at least one stone while',
      'doing O(log n) work, so the number of rounds bounds it. Space is O(n).',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a) {
  const h = [];
  const up = (i) => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (h[i] > h[par]) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i) => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && h[l] > h[m]) m = l;
      if (r < h.length && h[r] > h[m]) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v) => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = () => {
    const top = h[0];
    const last = h.pop();
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const v of a) push(v);
  while (h.length >= 2) {
    const x = pop();
    const y = pop();
    if (x !== y) push(x - y);
  }
  return h.length === 0 ? 0 : h[0];
}`,
      TYPESCRIPT: `function solve(a: number[]): number {
  const h: number[] = [];
  const up = (i: number): void => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (h[i] > h[par]) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i: number): void => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && h[l] > h[m]) m = l;
      if (r < h.length && h[r] > h[m]) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v: number): void => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = (): number => {
    const top = h[0];
    const last = h.pop() as number;
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const v of a) push(v);
  while (h.length >= 2) {
    const x = pop();
    const y = pop();
    if (x !== y) push(x - y);
  }
  return h.length === 0 ? 0 : h[0];
}`,
      PYTHON: `import heapq


def solve(a):
    h = [-v for v in a]
    heapq.heapify(h)
    while len(h) >= 2:
        x = -heapq.heappop(h)
        y = -heapq.heappop(h)
        if x != y:
            heapq.heappush(h, -(x - y))
    if not h:
        return 0
    return -h[0]`,
      JAVA: `    static int solve(int[] a) {
        PriorityQueue<Integer> h = new PriorityQueue<Integer>(Collections.reverseOrder());
        for (int v : a) h.add(v);
        while (h.size() >= 2) {
            int x = h.poll();
            int y = h.poll();
            if (x != y) h.add(x - y);
        }
        if (h.isEmpty()) return 0;
        return h.peek();
    }`,
      CPP: `int solve(vector<int> a) {
    priority_queue<int> h;
    for (size_t i = 0; i < a.size(); i++) h.push(a[i]);
    while (h.size() >= 2) {
        int x = h.top();
        h.pop();
        int y = h.top();
        h.pop();
        if (x != y) h.push(x - y);
    }
    if (h.empty()) return 0;
    return h.top();
}`,
      GO: `type intHeap struct {
    a    []int
    less func(x, y int) bool
}

func (h *intHeap) push(v int) {
    h.a = append(h.a, v)
    i := len(h.a) - 1
    for i > 0 {
        par := (i - 1) / 2
        if h.less(h.a[i], h.a[par]) {
            h.a[i], h.a[par] = h.a[par], h.a[i]
            i = par
        } else {
            break
        }
    }
}

func (h *intHeap) pop() int {
    top := h.a[0]
    n := len(h.a) - 1
    h.a[0] = h.a[n]
    h.a = h.a[:n]
    i := 0
    for {
        l, r := 2*i+1, 2*i+2
        m := i
        if l < len(h.a) && h.less(h.a[l], h.a[m]) {
            m = l
        }
        if r < len(h.a) && h.less(h.a[r], h.a[m]) {
            m = r
        }
        if m == i {
            break
        }
        h.a[i], h.a[m] = h.a[m], h.a[i]
        i = m
    }
    return top
}

func solve(a []int) int {
    h := &intHeap{less: func(x, y int) bool { return x > y }}
    for _, v := range a {
        h.push(v)
    }
    for len(h.a) >= 2 {
        x := h.pop()
        y := h.pop()
        if x != y {
            h.push(x - y)
        }
    }
    if len(h.a) == 0 {
        return 0
    }
    return h.a[0]
}`,
    },
    tests: [
      { stdin: '2 7 4 1 8 1', expectedStdout: '1', isSample: true },
      { stdin: '3 3', expectedStdout: '0', isSample: true },
      { stdin: '1', expectedStdout: '1' },
      { stdin: '10 4 2 10', expectedStdout: '2' },
      { stdin: '5 4 3 2 1', expectedStdout: '1' },
      { stdin: '9 1 1', expectedStdout: '7' },
    ],
  }),

  p({
    ...base,
    slug: 'minimum-cost-to-join-ropes',
    title: 'Cheapest Way To Tie Them All',
    difficulty: 'MEDIUM',
    patternTags: ['heap', 'greedy', 'min-heap'],
    signatureId: 'fn:ints->int',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'A line of rope lengths, separated by spaces.',
      '',
      'You may join any two ropes into one. Joining ropes of length `x` and `y`',
      'costs `x + y`, and leaves a single rope of length `x + y` that can be joined',
      'again. Keep going until one rope remains.',
      '',
      'Print the smallest total cost achievable.',
      '',
      '**Example**',
      '',
      '```',
      'input:  4 3 2 6',
      'output: 29',
      '```',
      '',
      'Join `2 + 3 = 5` (cost 5), then `4 + 5 = 9` (cost 9), then `6 + 9 = 15`',
      '(cost 15). Total `5 + 9 + 15 = 29`. No other order is cheaper.',
      '',
      'Guarantees: there is at least one rope and every length is at least 1.',
      '',
      'The named edge case: a single rope needs no joining at all, so the cost is',
      '`0`.',
    ].join('\n'),
    editorialMarkdown: [
      '## Greedy with a min-heap',
      '',
      'Every join charges you the combined length, and that combined length gets',
      'charged again in every later join it takes part in. So a rope’s length is',
      'paid once for every join it survives — which means the ropes you want to',
      'combine **first**, and therefore carry through the most joins, are the',
      '**shortest** ones.',
      '',
      'That is the greedy rule: repeatedly take the two shortest ropes, pay their',
      'sum, and put the result back. The result is longer than either input, so it',
      'sinks in the ordering naturally and gets joined later, which is exactly what',
      'you want.',
      '',
      '```',
      'h = min-heap of all lengths',
      'total = 0',
      'while h.size() >= 2:',
      '    s = h.pop() + h.pop()',
      '    total += s',
      '    h.push(s)',
      'return total',
      '```',
      '',
      'A sorted array does not survive this, because the sum you push back is a new',
      'value that has to slot into the middle of the remaining lengths. A min-heap',
      'gives you exactly the two operations the rule needs — smallest out, arbitrary',
      'value in — at O(log n) each, and gives you nothing else, which is why it is',
      'cheaper than maintaining a full order.',
      '',
      'The quiet mistake is adding the *final* rope length to the total, or adding',
      'each rope’s original length once at the start. On two ropes the totals agree,',
      'so a two-element test passes; from three ropes onward the answer is too large',
      'by the sum of the inputs. The cost is only ever charged at a join, and a',
      'single rope is charged nothing — which is also why the one-rope answer is `0`',
      'rather than that rope’s length.',
      '',
      'O(n log n): each join does O(log n) heap work and there are n-1 of them, so',
      'the number of joins bounds it. Space is O(n).',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a) {
  const h = [];
  const up = (i) => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (h[i] < h[par]) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i) => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && h[l] < h[m]) m = l;
      if (r < h.length && h[r] < h[m]) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v) => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = () => {
    const top = h[0];
    const last = h.pop();
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const v of a) push(v);
  let total = 0;
  while (h.length >= 2) {
    const s = pop() + pop();
    total += s;
    push(s);
  }
  return total;
}`,
      TYPESCRIPT: `function solve(a: number[]): number {
  const h: number[] = [];
  const up = (i: number): void => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (h[i] < h[par]) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i: number): void => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && h[l] < h[m]) m = l;
      if (r < h.length && h[r] < h[m]) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v: number): void => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = (): number => {
    const top = h[0];
    const last = h.pop() as number;
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const v of a) push(v);
  let total = 0;
  while (h.length >= 2) {
    const s = pop() + pop();
    total += s;
    push(s);
  }
  return total;
}`,
      PYTHON: `import heapq


def solve(a):
    h = list(a)
    heapq.heapify(h)
    total = 0
    while len(h) >= 2:
        s = heapq.heappop(h) + heapq.heappop(h)
        total += s
        heapq.heappush(h, s)
    return total`,
      JAVA: `    static int solve(int[] a) {
        PriorityQueue<Integer> h = new PriorityQueue<Integer>();
        for (int v : a) h.add(v);
        int total = 0;
        while (h.size() >= 2) {
            int s = h.poll() + h.poll();
            total += s;
            h.add(s);
        }
        return total;
    }`,
      CPP: `int solve(vector<int> a) {
    priority_queue<int, vector<int>, greater<int> > h;
    for (size_t i = 0; i < a.size(); i++) h.push(a[i]);
    int total = 0;
    while (h.size() >= 2) {
        int x = h.top();
        h.pop();
        int y = h.top();
        h.pop();
        int s = x + y;
        total += s;
        h.push(s);
    }
    return total;
}`,
      GO: `type intHeap struct {
    a    []int
    less func(x, y int) bool
}

func (h *intHeap) push(v int) {
    h.a = append(h.a, v)
    i := len(h.a) - 1
    for i > 0 {
        par := (i - 1) / 2
        if h.less(h.a[i], h.a[par]) {
            h.a[i], h.a[par] = h.a[par], h.a[i]
            i = par
        } else {
            break
        }
    }
}

func (h *intHeap) pop() int {
    top := h.a[0]
    n := len(h.a) - 1
    h.a[0] = h.a[n]
    h.a = h.a[:n]
    i := 0
    for {
        l, r := 2*i+1, 2*i+2
        m := i
        if l < len(h.a) && h.less(h.a[l], h.a[m]) {
            m = l
        }
        if r < len(h.a) && h.less(h.a[r], h.a[m]) {
            m = r
        }
        if m == i {
            break
        }
        h.a[i], h.a[m] = h.a[m], h.a[i]
        i = m
    }
    return top
}

func solve(a []int) int {
    h := &intHeap{less: func(x, y int) bool { return x < y }}
    for _, v := range a {
        h.push(v)
    }
    total := 0
    for len(h.a) >= 2 {
        s := h.pop() + h.pop()
        total += s
        h.push(s)
    }
    return total
}`,
    },
    tests: [
      { stdin: '4 3 2 6', expectedStdout: '29', isSample: true },
      { stdin: '5', expectedStdout: '0', isSample: true },
      { stdin: '1 2 3 4 5', expectedStdout: '33' },
      { stdin: '2 2', expectedStdout: '4' },
      { stdin: '1 1 1 1', expectedStdout: '8' },
      { stdin: '10 20 30', expectedStdout: '90' },
    ],
  }),

  p({
    ...base,
    slug: 'running-median-of-a-stream',
    title: 'The Middle, After Every Number',
    difficulty: 'HARD',
    patternTags: ['heap', 'two-heaps', 'streaming'],
    signatureId: 'fn:ints->ints',
    avgSolveSeconds: 900,
    promptMarkdown: [
      'A line of numbers separated by spaces, read one at a time from left to right.',
      '',
      'After reading each number, print the median of everything read so far. Print',
      'all the medians on one line, separated by spaces, in order.',
      '',
      'Because the output is a list of whole numbers, the median of an **even** count',
      'is defined here as the **lower** of the two middle values — not their average.',
      'So the median of `1 3 5 15` is `3`.',
      '',
      '**Example**',
      '',
      '```',
      'input:  5 15 1 3',
      'output: 5 5 5 3',
      '```',
      '',
      'After `5` the median is `5`. After `5 15` the two middles are `5` and `15`,',
      'and the lower is `5`. After `1 5 15` it is `5`. After `1 3 5 15` the middles',
      'are `3` and `5`, and the lower is `3`.',
      '',
      'Guarantees: there is at least one number. Values may be negative and may',
      'repeat.',
      '',
      'The named edge cases: a single number is its own median. When every value is',
      'the same, every median is that value.',
    ].join('\n'),
    editorialMarkdown: [
      '## Two heaps facing each other',
      '',
      'Re-sorting after every number is O(n² log n), and it computes the full order n',
      'times to read one element out of the middle. What you actually need is the',
      'boundary between the lower half and the upper half — and a heap is a device',
      'for holding exactly one boundary.',
      '',
      'So use two. A **max**-heap `lo` holds the smaller half, so its top is the',
      'largest of the small numbers. A **min**-heap `hi` holds the larger half, so',
      'its top is the smallest of the large ones. The two tops sit either side of the',
      'middle, and neither heap has to be sorted internally.',
      '',
      'Keep `lo` the same size as `hi` or exactly one larger. Then the lower middle',
      'is always `lo.top()`, whether the count is odd or even — which is precisely',
      'the definition the statement uses, so nothing extra is needed for even counts.',
      '',
      '```',
      'for v in stream:',
      '    lo.push(v)',
      '    hi.push(lo.pop())          # hands the new largest of the small half over',
      '    if hi.size() > lo.size(): lo.push(hi.pop())',
      '    emit lo.top()',
      '```',
      '',
      'The push-then-transfer dance is what keeps the two halves correct without a',
      'comparison: whatever arrives goes into `lo`, and `lo` immediately gives up its',
      'largest, so a value that belongs on the high side ends up there in one step.',
      '',
      'The quiet mistake is balancing sizes without transferring across, or',
      'transferring only when the new value is bigger than `lo.top()`. Both keep the',
      'counts right while letting a value sit in the wrong half, and the median is',
      'then wrong only for the inputs where a late small number arrives after a run',
      'of large ones. On a sorted or nearly sorted stream — which is what people type',
      'when testing — every version agrees.',
      '',
      'O(n log n) overall, O(log n) per element, and the number of elements bounds it.',
      'Space is O(n), because the whole stream ends up distributed across the two',
      'heaps.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a) {
  const makeHeap = (isBefore) => {
    const h = [];
    const up = (i) => {
      while (i > 0) {
        const par = (i - 1) >> 1;
        if (isBefore(h[i], h[par])) {
          const t = h[i];
          h[i] = h[par];
          h[par] = t;
          i = par;
        } else break;
      }
    };
    const down = (i) => {
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < h.length && isBefore(h[l], h[m])) m = l;
        if (r < h.length && isBefore(h[r], h[m])) m = r;
        if (m === i) break;
        const t = h[i];
        h[i] = h[m];
        h[m] = t;
        i = m;
      }
    };
    return {
      data: h,
      size: () => h.length,
      top: () => h[0],
      push: (v) => {
        h.push(v);
        up(h.length - 1);
      },
      pop: () => {
        const top = h[0];
        const last = h.pop();
        if (h.length > 0) {
          h[0] = last;
          down(0);
        }
        return top;
      },
    };
  };
  const lo = makeHeap((x, y) => x > y);
  const hi = makeHeap((x, y) => x < y);
  const out = [];
  for (const v of a) {
    lo.push(v);
    hi.push(lo.pop());
    if (hi.size() > lo.size()) lo.push(hi.pop());
    out.push(lo.top());
  }
  return out;
}`,
      TYPESCRIPT: `interface NumHeap {
  size: () => number;
  top: () => number;
  push: (v: number) => void;
  pop: () => number;
}

function solve(a: number[]): number[] {
  const makeHeap = (isBefore: (x: number, y: number) => boolean): NumHeap => {
    const h: number[] = [];
    const up = (i: number): void => {
      while (i > 0) {
        const par = (i - 1) >> 1;
        if (isBefore(h[i], h[par])) {
          const t = h[i];
          h[i] = h[par];
          h[par] = t;
          i = par;
        } else break;
      }
    };
    const down = (i: number): void => {
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < h.length && isBefore(h[l], h[m])) m = l;
        if (r < h.length && isBefore(h[r], h[m])) m = r;
        if (m === i) break;
        const t = h[i];
        h[i] = h[m];
        h[m] = t;
        i = m;
      }
    };
    return {
      size: () => h.length,
      top: () => h[0],
      push: (v: number) => {
        h.push(v);
        up(h.length - 1);
      },
      pop: () => {
        const top = h[0];
        const last = h.pop() as number;
        if (h.length > 0) {
          h[0] = last;
          down(0);
        }
        return top;
      },
    };
  };
  const lo = makeHeap((x, y) => x > y);
  const hi = makeHeap((x, y) => x < y);
  const out: number[] = [];
  for (const v of a) {
    lo.push(v);
    hi.push(lo.pop());
    if (hi.size() > lo.size()) lo.push(hi.pop());
    out.push(lo.top());
  }
  return out;
}`,
      PYTHON: `import heapq


def solve(a):
    lo = []  # max-heap, stored negated
    hi = []  # min-heap
    out = []
    for v in a:
        heapq.heappush(lo, -v)
        heapq.heappush(hi, -heapq.heappop(lo))
        if len(hi) > len(lo):
            heapq.heappush(lo, -heapq.heappop(hi))
        out.append(-lo[0])
    return out`,
      JAVA: `    static int[] solve(int[] a) {
        PriorityQueue<Integer> lo = new PriorityQueue<Integer>(Collections.reverseOrder());
        PriorityQueue<Integer> hi = new PriorityQueue<Integer>();
        int[] out = new int[a.length];
        for (int i = 0; i < a.length; i++) {
            lo.add(a[i]);
            hi.add(lo.poll());
            if (hi.size() > lo.size()) lo.add(hi.poll());
            out[i] = lo.peek();
        }
        return out;
    }`,
      CPP: `vector<int> solve(vector<int> a) {
    priority_queue<int> lo;
    priority_queue<int, vector<int>, greater<int> > hi;
    vector<int> out;
    for (size_t i = 0; i < a.size(); i++) {
        lo.push(a[i]);
        hi.push(lo.top());
        lo.pop();
        if (hi.size() > lo.size()) {
            lo.push(hi.top());
            hi.pop();
        }
        out.push_back(lo.top());
    }
    return out;
}`,
      GO: `type intHeap struct {
    a    []int
    less func(x, y int) bool
}

func (h *intHeap) push(v int) {
    h.a = append(h.a, v)
    i := len(h.a) - 1
    for i > 0 {
        par := (i - 1) / 2
        if h.less(h.a[i], h.a[par]) {
            h.a[i], h.a[par] = h.a[par], h.a[i]
            i = par
        } else {
            break
        }
    }
}

func (h *intHeap) pop() int {
    top := h.a[0]
    n := len(h.a) - 1
    h.a[0] = h.a[n]
    h.a = h.a[:n]
    i := 0
    for {
        l, r := 2*i+1, 2*i+2
        m := i
        if l < len(h.a) && h.less(h.a[l], h.a[m]) {
            m = l
        }
        if r < len(h.a) && h.less(h.a[r], h.a[m]) {
            m = r
        }
        if m == i {
            break
        }
        h.a[i], h.a[m] = h.a[m], h.a[i]
        i = m
    }
    return top
}

func solve(a []int) []int {
    lo := &intHeap{less: func(x, y int) bool { return x > y }}
    hi := &intHeap{less: func(x, y int) bool { return x < y }}
    out := []int{}
    for _, v := range a {
        lo.push(v)
        hi.push(lo.pop())
        if len(hi.a) > len(lo.a) {
            lo.push(hi.pop())
        }
        out = append(out, lo.a[0])
    }
    return out
}`,
    },
    tests: [
      { stdin: '5 15 1 3', expectedStdout: '5 5 5 3', isSample: true },
      { stdin: '1', expectedStdout: '1', isSample: true },
      { stdin: '2 2 2', expectedStdout: '2 2 2' },
      { stdin: '4 3 2 1', expectedStdout: '4 3 3 2' },
      { stdin: '-1 -2', expectedStdout: '-1 -2' },
      { stdin: '1 2 3 4 5', expectedStdout: '1 1 2 2 3' },
    ],
  }),

  p({
    ...base,
    slug: 'k-closest-values-to-zero',
    title: 'The k Nearest To Nothing',
    difficulty: 'HARD',
    patternTags: ['heap', 'top-k', 'tie-break'],
    signatureId: 'fn:ints,int->ints',
    avgSolveSeconds: 900,
    promptMarkdown: [
      'Line 1 is a list of numbers separated by spaces. Line 2 is a number `k`.',
      '',
      'Print the `k` values closest to zero, that is, with the smallest distance',
      'from zero regardless of sign.',
      '',
      'Print them ordered by **smaller distance first**, and where two values are the',
      'same distance away, by **smaller value first** — so `-5` comes before `5`.',
      'That order is total, so there is exactly one correct line of output.',
      '',
      '**Example**',
      '',
      '```',
      'input:  -3 1 2 -1 5',
      '        3',
      'output: -1 1 2',
      '```',
      '',
      '`-1` and `1` are both one away, and `-1` sorts first; `2` is two away.',
      '',
      'Guarantees: the list has at least one number and `1 <= k <= length`. Values',
      'may repeat, and each copy is a separate candidate.',
      '',
      'The named edge cases: `k = 1` prints the single nearest value. Ties on',
      'distance are settled by the smaller value, so `5 5 -5` with `k = 2` prints',
      '`-5 5`. Zero is distance 0 and therefore always first when present.',
    ].join('\n'),
    editorialMarkdown: [
      '## Heap of size k over a compound key',
      '',
      'This is the top-k pattern with the ranking key changed from the value itself',
      'to the pair `(distance from zero, value)`. Nothing else about the shape moves:',
      'you hold `k` candidates, and each new value either displaces the worst keeper',
      'or is discarded.',
      '',
      'The heap is again the opposite kind from the extreme you are chasing. You want',
      'the *closest* values, so the top must be the **furthest** of the ones you are',
      'holding — that is the only element you would ever evict, and it must be',
      'visible in O(1). Sorting the whole list would compute the relative order of',
      'every far-away pair too, and you never look at those.',
      '',
      '```',
      'worse(x, y) = |x| > |y|  or  (|x| == |y| and x > y)',
      'h = heap with worst on top',
      'for v in a: h.push(v); if h.size() > k: h.pop()',
      'out = [h.pop() while non-empty]   # worst first',
      'reverse(out)                      # nearest first — the required order',
      '```',
      '',
      'Write the absolute value yourself — `v < 0 ? -v : v` — rather than reaching',
      'for a library function; some of these language drivers do not import a maths',
      'package, and comparing `|x|` by squaring instead works here but quietly',
      'overflows on larger inputs.',
      '',
      'The quiet mistake is comparing distances only and letting equal distances fall',
      'where they may. `3` and `-3` are indistinguishable to that comparator, so which',
      'one survives the eviction depends on the order the values arrived in — and',
      'the two are not interchangeable in the output. It is quiet because a list',
      'without a ± pair never triggers it, and most hand-written tests do not have',
      'one.',
      '',
      'O(n log k) time and O(k) space. The scan over the input bounds it, and the',
      'final drain adds O(k log k), which is dominated whenever k is smaller than n.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(a, k) {
  const abs = (v) => (v < 0 ? -v : v);
  // worse(x, y): true when x should be evicted before y
  const worse = (x, y) => (abs(x) !== abs(y) ? abs(x) > abs(y) : x > y);
  const h = [];
  const up = (i) => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (worse(h[i], h[par])) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i) => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && worse(h[l], h[m])) m = l;
      if (r < h.length && worse(h[r], h[m])) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v) => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = () => {
    const top = h[0];
    const last = h.pop();
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const v of a) {
    push(v);
    if (h.length > k) pop();
  }
  const out = [];
  while (h.length > 0) out.push(pop());
  out.reverse();
  return out;
}`,
      TYPESCRIPT: `function solve(a: number[], k: number): number[] {
  const abs = (v: number): number => (v < 0 ? -v : v);
  // worse(x, y): true when x should be evicted before y
  const worse = (x: number, y: number): boolean =>
    abs(x) !== abs(y) ? abs(x) > abs(y) : x > y;
  const h: number[] = [];
  const up = (i: number): void => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (worse(h[i], h[par])) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i: number): void => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && worse(h[l], h[m])) m = l;
      if (r < h.length && worse(h[r], h[m])) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v: number): void => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = (): number => {
    const top = h[0];
    const last = h.pop() as number;
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const v of a) {
    push(v);
    if (h.length > k) pop();
  }
  const out: number[] = [];
  while (h.length > 0) out.push(pop());
  out.reverse();
  return out;
}`,
      PYTHON: `import heapq


def solve(a, k):
    # (-abs, -value) ascending puts the worst keeper on top
    h = []
    for v in a:
        d = v if v >= 0 else -v
        heapq.heappush(h, (-d, -v))
        if len(h) > k:
            heapq.heappop(h)
    out = []
    while h:
        negd, negv = heapq.heappop(h)
        out.append(-negv)
    out.reverse()
    return out`,
      JAVA: `    static int[] solve(int[] a, int k) {
        // head of the queue is the worst keeper: furthest from zero, then larger value
        PriorityQueue<Integer> h = new PriorityQueue<Integer>(new Comparator<Integer>() {
            public int compare(Integer x, Integer y) {
                int dx = x < 0 ? -x : x;
                int dy = y < 0 ? -y : y;
                if (dx != dy) return Integer.compare(dy, dx);
                return Integer.compare(y, x);
            }
        });
        for (int v : a) {
            h.add(v);
            if (h.size() > k) h.poll();
        }
        int[] out = new int[h.size()];
        for (int i = out.length - 1; i >= 0; i--) out[i] = h.poll();
        return out;
    }`,
      CPP: `struct FurthestFirst {
    bool operator()(int x, int y) const {
        // true when x has LOWER priority than y, so the worst keeper ends on top
        int dx = x < 0 ? -x : x;
        int dy = y < 0 ? -y : y;
        if (dx != dy) return dx < dy;
        return x < y;
    }
};

vector<int> solve(vector<int> a, int k) {
    priority_queue<int, vector<int>, FurthestFirst> h;
    for (size_t i = 0; i < a.size(); i++) {
        h.push(a[i]);
        if ((int) h.size() > k) h.pop();
    }
    vector<int> out(h.size());
    for (int i = (int) out.size() - 1; i >= 0; i--) {
        out[i] = h.top();
        h.pop();
    }
    return out;
}`,
      GO: `type intHeap struct {
    a     []int
    worse func(x, y int) bool
}

func (h *intHeap) push(v int) {
    h.a = append(h.a, v)
    i := len(h.a) - 1
    for i > 0 {
        par := (i - 1) / 2
        if h.worse(h.a[i], h.a[par]) {
            h.a[i], h.a[par] = h.a[par], h.a[i]
            i = par
        } else {
            break
        }
    }
}

func (h *intHeap) pop() int {
    top := h.a[0]
    n := len(h.a) - 1
    h.a[0] = h.a[n]
    h.a = h.a[:n]
    i := 0
    for {
        l, r := 2*i+1, 2*i+2
        m := i
        if l < len(h.a) && h.worse(h.a[l], h.a[m]) {
            m = l
        }
        if r < len(h.a) && h.worse(h.a[r], h.a[m]) {
            m = r
        }
        if m == i {
            break
        }
        h.a[i], h.a[m] = h.a[m], h.a[i]
        i = m
    }
    return top
}

func absInt(v int) int {
    if v < 0 {
        return -v
    }
    return v
}

func solve(a []int, k int) []int {
    h := &intHeap{worse: func(x, y int) bool {
        if absInt(x) != absInt(y) {
            return absInt(x) > absInt(y)
        }
        return x > y
    }}
    for _, v := range a {
        h.push(v)
        if len(h.a) > k {
            h.pop()
        }
    }
    out := make([]int, len(h.a))
    for i := len(out) - 1; i >= 0; i-- {
        out[i] = h.pop()
    }
    return out
}`,
    },
    tests: [
      { stdin: '-3 1 2 -1 5\n3', expectedStdout: '-1 1 2', isSample: true },
      { stdin: '5 5 -5\n2', expectedStdout: '-5 5', isSample: true },
      { stdin: '4\n1', expectedStdout: '4' },
      { stdin: '-2 2\n2', expectedStdout: '-2 2' },
      { stdin: '0 -1 1\n3', expectedStdout: '0 -1 1' },
      { stdin: '9 -7 3\n3', expectedStdout: '3 -7 9' },
    ],
  }),

  p({
    ...base,
    slug: 'top-k-by-frequency-then-value',
    title: 'The k Loudest Words',
    difficulty: 'HARD',
    patternTags: ['heap', 'top-k', 'frequency'],
    signatureId: 'fn:strings->strings',
    avgSolveSeconds: 900,
    promptMarkdown: [
      'You are given a list of tokens on one line, separated by spaces.',
      '',
      'The **last** token is a number `k`. Every token before it is a word.',
      '',
      'Print the `k` words that occur most often, separated by spaces, ordered by',
      '**higher count first**, and where two words occur equally often, by',
      '**alphabetically earlier first**. That order is total, so there is exactly one',
      'correct line of output.',
      '',
      '**Example**',
      '',
      '```',
      'input:  one two two three three three 2',
      'output: three two',
      '```',
      '',
      '`three` occurs three times and `two` twice.',
      '',
      'Guarantees: there is always at least one word and then `k`. Words are one or',
      'more lowercase letters `a`–`z`, and `k` is at least 1 and at most the number',
      'of **distinct** words, so the answer always exists.',
      '',
      'The named edge cases: when words tie on count — `dog cat dog cat bird` with',
      '`k = 2` — the alphabetical tie-break gives `cat dog`. When `k = 1` and two',
      'words tie for the top count, the alphabetically earlier one wins.',
    ].join('\n'),
    editorialMarkdown: [
      '## Count, then a heap of size k with a two-part comparator',
      '',
      'Count the words with a hash map, then select the best `k` of the distinct',
      'words under the stated order. Sorting all `d` distinct words is O(d log d)',
      'and computes the relative order of every pair, including all the pairs far',
      'below the cut that you will never print. A heap of size `k` costs O(d log k)',
      'and maintains only the boundary — the weakest word you are still keeping.',
      '',
      'Which means, once more, the heap is the opposite kind from the naive guess.',
      'You are collecting the *most frequent* words, so the top of the heap must be',
      'the **least** frequent of your keepers: the eviction candidate. Under this',
      'problem’s order, worse means a lower count, and on a tie, a word that sorts',
      'later alphabetically.',
      '',
      '```',
      'worse(x, y) = x.count < y.count  or  (x.count == y.count and x.word > y.word)',
      'h = heap with worst on top',
      'for each distinct word: h.push(word); if h.size() > k: h.pop()',
      'out = [h.pop() while non-empty]   # worst first',
      'reverse(out)                      # best first — the required order',
      '```',
      '',
      'The quiet mistake — and it is the reason this one is HARD rather than MEDIUM —',
      'is getting the tie-break direction inverted in the comparator. The printed',
      'order wants the alphabetically *earlier* word first, but the heap must evict',
      'the alphabetically *later* one, so the comparison inside the heap runs the',
      'opposite way to the comparison in the output. Write it the intuitive way and',
      'you keep the wrong half of every tie, while every input without a tie still',
      'passes. Anchor it on the sentence "the top of the heap is the thing I am about',
      'to throw away" and the direction follows.',
      '',
      'The second quiet one is comparing counts and forgetting to reverse the drained',
      'list — a heap guarantees only its top, so the k words come out worst-first.',
      '',
      'O(n) to count, O(d log k) to select, O(k log k) to drain. Counting bounds it',
      'when words repeat heavily; selection bounds it when they do not. Space is O(d).',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(tokens) {
  const k = parseInt(tokens[tokens.length - 1], 10);
  const freq = new Map();
  const order = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const w = tokens[i];
    if (!freq.has(w)) order.push(w);
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  // worse(x, y): true when x should be evicted before y
  const worse = (x, y) => (freq.get(x) !== freq.get(y) ? freq.get(x) < freq.get(y) : x > y);
  const h = [];
  const up = (i) => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (worse(h[i], h[par])) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i) => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && worse(h[l], h[m])) m = l;
      if (r < h.length && worse(h[r], h[m])) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v) => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = () => {
    const top = h[0];
    const last = h.pop();
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const w of order) {
    push(w);
    if (h.length > k) pop();
  }
  const out = [];
  while (h.length > 0) out.push(pop());
  out.reverse();
  return out;
}`,
      TYPESCRIPT: `function solve(tokens: string[]): string[] {
  const k = parseInt(tokens[tokens.length - 1], 10);
  const freq = new Map<string, number>();
  const order: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const w = tokens[i];
    if (!freq.has(w)) order.push(w);
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const countOf = (w: string): number => freq.get(w) ?? 0;
  // worse(x, y): true when x should be evicted before y
  const worse = (x: string, y: string): boolean =>
    countOf(x) !== countOf(y) ? countOf(x) < countOf(y) : x > y;
  const h: string[] = [];
  const up = (i: number): void => {
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (worse(h[i], h[par])) {
        const t = h[i];
        h[i] = h[par];
        h[par] = t;
        i = par;
      } else break;
    }
  };
  const down = (i: number): void => {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < h.length && worse(h[l], h[m])) m = l;
      if (r < h.length && worse(h[r], h[m])) m = r;
      if (m === i) break;
      const t = h[i];
      h[i] = h[m];
      h[m] = t;
      i = m;
    }
  };
  const push = (v: string): void => {
    h.push(v);
    up(h.length - 1);
  };
  const pop = (): string => {
    const top = h[0];
    const last = h.pop() as string;
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
    return top;
  };
  for (const w of order) {
    push(w);
    if (h.length > k) pop();
  }
  const out: string[] = [];
  while (h.length > 0) out.push(pop());
  out.reverse();
  return out;
}`,
      PYTHON: `import heapq


class Worse:
    def __init__(self, word, count):
        self.word = word
        self.count = count

    def __lt__(self, other):
        if self.count != other.count:
            return self.count < other.count
        return self.word > other.word


def solve(tokens):
    k = int(tokens[-1])
    freq = {}
    order = []
    for w in tokens[:-1]:
        if w not in freq:
            order.append(w)
            freq[w] = 0
        freq[w] += 1
    h = []
    for w in order:
        heapq.heappush(h, Worse(w, freq[w]))
        if len(h) > k:
            heapq.heappop(h)
    out = []
    while h:
        out.append(heapq.heappop(h).word)
    out.reverse()
    return out`,
      JAVA: `    static String[] solve(String[] tokens) {
        final int k = Integer.parseInt(tokens[tokens.length - 1]);
        final HashMap<String, Integer> freq = new HashMap<String, Integer>();
        ArrayList<String> order = new ArrayList<String>();
        for (int i = 0; i < tokens.length - 1; i++) {
            String w = tokens[i];
            if (!freq.containsKey(w)) order.add(w);
            freq.put(w, freq.getOrDefault(w, 0) + 1);
        }
        // head of the queue is the worst keeper: lowest count, then alphabetically later
        PriorityQueue<String> h = new PriorityQueue<String>(new Comparator<String>() {
            public int compare(String x, String y) {
                int fx = freq.get(x);
                int fy = freq.get(y);
                if (fx != fy) return Integer.compare(fx, fy);
                return y.compareTo(x);
            }
        });
        for (String w : order) {
            h.add(w);
            if (h.size() > k) h.poll();
        }
        String[] out = new String[h.size()];
        for (int i = out.length - 1; i >= 0; i--) out[i] = h.poll();
        return out;
    }`,
      CPP: `struct WordCount {
    string word;
    int count;
};

struct WorseWordFirst {
    bool operator()(const WordCount &x, const WordCount &y) const {
        // true when x has LOWER priority than y, so the worst keeper ends on top
        if (x.count != y.count) return x.count > y.count;
        return x.word < y.word;
    }
};

vector<string> solve(vector<string> tokens) {
    int k = atoi(tokens[tokens.size() - 1].c_str());
    map<string, int> freq;
    for (size_t i = 0; i + 1 < tokens.size(); i++) freq[tokens[i]]++;
    priority_queue<WordCount, vector<WordCount>, WorseWordFirst> h;
    for (map<string, int>::iterator it = freq.begin(); it != freq.end(); ++it) {
        WordCount wc;
        wc.word = it->first;
        wc.count = it->second;
        h.push(wc);
        if ((int) h.size() > k) h.pop();
    }
    vector<string> out(h.size());
    for (int i = (int) out.size() - 1; i >= 0; i--) {
        out[i] = h.top().word;
        h.pop();
    }
    return out;
}`,
      GO: `type wordCount struct {
    word  string
    count int
}

type wordHeap struct {
    a     []wordCount
    worse func(x, y wordCount) bool
}

func (h *wordHeap) push(v wordCount) {
    h.a = append(h.a, v)
    i := len(h.a) - 1
    for i > 0 {
        par := (i - 1) / 2
        if h.worse(h.a[i], h.a[par]) {
            h.a[i], h.a[par] = h.a[par], h.a[i]
            i = par
        } else {
            break
        }
    }
}

func (h *wordHeap) pop() wordCount {
    top := h.a[0]
    n := len(h.a) - 1
    h.a[0] = h.a[n]
    h.a = h.a[:n]
    i := 0
    for {
        l, r := 2*i+1, 2*i+2
        m := i
        if l < len(h.a) && h.worse(h.a[l], h.a[m]) {
            m = l
        }
        if r < len(h.a) && h.worse(h.a[r], h.a[m]) {
            m = r
        }
        if m == i {
            break
        }
        h.a[i], h.a[m] = h.a[m], h.a[i]
        i = m
    }
    return top
}

func solve(tokens []string) []string {
    k, _ := strconv.Atoi(tokens[len(tokens)-1])
    freq := map[string]int{}
    order := []string{}
    for i := 0; i < len(tokens)-1; i++ {
        w := tokens[i]
        if _, ok := freq[w]; !ok {
            order = append(order, w)
        }
        freq[w]++
    }
    h := &wordHeap{worse: func(x, y wordCount) bool {
        if x.count != y.count {
            return x.count < y.count
        }
        return x.word > y.word
    }}
    for _, w := range order {
        h.push(wordCount{word: w, count: freq[w]})
        if len(h.a) > k {
            h.pop()
        }
    }
    out := make([]string, len(h.a))
    for i := len(out) - 1; i >= 0; i-- {
        out[i] = h.pop().word
    }
    return out
}`,
    },
    tests: [
      { stdin: 'one two two three three three 2', expectedStdout: 'three two', isSample: true },
      { stdin: 'dog cat dog cat bird 2', expectedStdout: 'cat dog', isSample: true },
      { stdin: 'a b a c b a 2', expectedStdout: 'a b' },
      { stdin: 'x 1', expectedStdout: 'x' },
      { stdin: 'p q r 3', expectedStdout: 'p q r' },
      { stdin: 'zz aa zz aa bb 1', expectedStdout: 'aa' },
    ],
  }),
];
