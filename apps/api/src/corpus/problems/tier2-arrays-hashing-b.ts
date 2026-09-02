import { AUTHORED, type ProblemDefinition } from '../problem.js';

const p = (d: ProblemDefinition): ProblemDefinition => d;
const base = { tier: 'TIER_2', patternFamily: 'ARRAYS_HASHING', provenance: AUTHORED } as const;

export const TIER_2_ARRAYS_HASHING_B_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base, slug: 'earliest-target-pair', title: 'First Pair to Finish', difficulty: 'MEDIUM', patternTags: ['hash-map', 'complement', 'tie-breaking'], signatureId: 'fn:ints,int->ints', avgSolveSeconds: 660,
    promptMarkdown: ['Return positions of two different numbers whose sum is the target. Several pairs may work. Choose the pair with the smallest second position; if two pairs finish at that position, choose the one with the smaller first position. Return the two positions in increasing order.', '', '**Example**', '', '```', 'input:  4 1 5 4 2', '        6', 'output: 1 2', '```', '', 'Positions `1` and `2` finish a pair before positions `0` and `4`. The list is non-empty. Return `-1` as the one-item list when no pair exists.'].join('\n'),
    editorialMarkdown: ['## First-completing complement lookup', '', 'The parent promises one answer, so any complement match can be returned. Here the output order is part of the task: scanning left to right makes the first match automatically have the smallest second position. Store the earliest position for each value. When the current value has a stored complement, return that stored position and the current one.', '', 'The quiet mistake is overwriting a stored position with a later duplicate. It still finds a valid pair, but can violate the smaller-first-position tie rule. Keep the first position only. The scan is O(n) time and the map uses O(n) space.'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a, b) {\n  const seen = new Map();\n  for (let i = 0; i < a.length; i++) {\n    const j = seen.get(b - a[i]);\n    if (j !== undefined) return [j, i];\n    if (!seen.has(a[i])) seen.set(a[i], i);\n  }\n  return [-1];\n}',
      TYPESCRIPT: 'function solve(a: number[], b: number): number[] {\n  const seen = new Map<number, number>();\n  for (let i = 0; i < a.length; i++) {\n    const j = seen.get(b - a[i]);\n    if (j !== undefined) return [j, i];\n    if (!seen.has(a[i])) seen.set(a[i], i);\n  }\n  return [-1];\n}',
      PYTHON: 'def solve(a, b):\n    seen = {}\n    for i, x in enumerate(a):\n        if b - x in seen:\n            return [seen[b - x], i]\n        if x not in seen:\n            seen[x] = i\n    return [-1]',
      JAVA: '    static int[] solve(int[] a, int b) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < a.length; i++) {\n            Integer j = seen.get(b - a[i]);\n            if (j != null) return new int[] { j, i };\n            if (!seen.containsKey(a[i])) seen.put(a[i], i);\n        }\n        return new int[] { -1 };\n    }',
      CPP: 'vector<int> solve(vector<int> a, int b) {\n    unordered_map<int, int> seen;\n    for (int i = 0; i < (int)a.size(); i++) {\n        auto it = seen.find(b - a[i]);\n        if (it != seen.end()) return {it->second, i};\n        if (!seen.count(a[i])) seen[a[i]] = i;\n    }\n    return {-1};\n}',
      GO: 'func solve(a []int, b int) []int {\n\tseen := map[int]int{}\n\tfor i, x := range a {\n\t\tif j, ok := seen[b-x]; ok { return []int{j, i} }\n\t\tif _, ok := seen[x]; !ok { seen[x] = i }\n\t}\n\treturn []int{-1}\n}',
    },
    tests: [
      { stdin: '4 1 5 4 2\n6', expectedStdout: '1 2', isSample: true },
      { stdin: '3 8 2 7\n10', expectedStdout: '1 2', isSample: true },
      { stdin: '5 5 5\n10', expectedStdout: '0 1' },
      { stdin: '-3 9 1 4\n6', expectedStdout: '0 1' },
      { stdin: '1 2 3\n20', expectedStdout: '-1' },
    ],
  }),
  p({
    ...base, slug: 'zero-producing-exclusions', title: 'Excluded Products That Vanish', difficulty: 'MEDIUM', patternTags: ['zero-count', 'product', 'case-analysis'], signatureId: 'fn:ints->int', avgSolveSeconds: 600,
    promptMarkdown: ['For each position, multiply every value except the one at that position. Return how many of those excluded-position products equal zero. Do not construct the products. The list is non-empty and every value is between `-1000000` and `1000000`.', '', '**Example**', '', '```', 'input:  7 0 -2 0', 'output: 4', '```', '', 'Every excluded-position product still contains at least one of the two zeroes. With exactly one zero, every position except that zero position qualifies.'].join('\n'),
    editorialMarkdown: ['## Zero count replaces multiplication', '', 'The parent builds every product except one position. That is the wrong tool when the question only asks whether each product is zero, and multiplying large values can overflow. Count the zeroes instead. With no zeroes, no excluded product is zero. With one zero, removing that zero leaves a nonzero product, while removing any other value leaves the zero. With two or more zeroes, removing one value can never remove all zeroes.', '', 'The quiet mistake is saying that a single zero makes every result zero; its own excluded position is the exception. This is O(n) time and O(1) extra space.'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let z = 0;\n  for (const x of a) if (x === 0) z++;\n  if (z === 0) return 0;\n  if (z === 1) return a.length - 1;\n  return a.length;\n}',
      TYPESCRIPT: 'function solve(a: number[]): number {\n  let z = 0;\n  for (const x of a) if (x === 0) z++;\n  if (z === 0) return 0;\n  if (z === 1) return a.length - 1;\n  return a.length;\n}',
      PYTHON: 'def solve(a):\n    z = 0\n    for x in a:\n        if x == 0:\n            z += 1\n    if z == 0:\n        return 0\n    if z == 1:\n        return len(a) - 1\n    return len(a)',
      JAVA: '    static int solve(int[] a) {\n        int z = 0;\n        for (int x : a) if (x == 0) z++;\n        if (z == 0) return 0;\n        if (z == 1) return a.length - 1;\n        return a.length;\n    }',
      CPP: 'int solve(vector<int> a) {\n    int z = 0;\n    for (int x : a) if (x == 0) z++;\n    if (z == 0) return 0;\n    if (z == 1) return (int)a.size() - 1;\n    return (int)a.size();\n}',
      GO: 'func solve(a []int) int {\n\tz := 0\n\tfor _, x := range a { if x == 0 { z++ } }\n\tif z == 0 { return 0 }\n\tif z == 1 { return len(a) - 1 }\n\treturn len(a)\n}',
    },
    tests: [
      { stdin: '7 0 -2 0', expectedStdout: '4', isSample: true },
      { stdin: '4 0 9', expectedStdout: '2', isSample: true },
      { stdin: '3 -1 2', expectedStdout: '0' },
      { stdin: '0', expectedStdout: '0' },
      { stdin: '0 0', expectedStdout: '2' },
    ],
  }),
  p({
    ...base, slug: 'start-of-longest-consecutive-run', title: 'Start of the Longest Run', difficulty: 'MEDIUM', patternTags: ['hash-set', 'sequence', 'tie-breaking'], signatureId: 'fn:ints->int', avgSolveSeconds: 720,
    promptMarkdown: ['Ignore duplicate values. Find the longest run of consecutive integers present in the list and return its smallest value. If several runs have the same length, return the smaller start. The list is non-empty.', '', '**Example**', '', '```', 'input:  8 4 5 6 10 11', 'output: 4', '```', '', 'The run `4 5 6` is longer than `10 11`. A one-value run starts at that value.'].join('\n'),
    editorialMarkdown: ['## Hash-set run starts with a recorded start', '', 'The parent returns a run length. This variation needs the value that begins the winning run, plus an explicit tie rule. Put values in a set, and only grow a run from a value whose predecessor is absent. Each such value is a genuine start. Walk upward while successive values are present, then compare the length and start against the best answer.', '', 'The quiet mistake is starting from every value, which repeats nearly the whole scan on one long run. Another is replacing the best answer on an equal length, which makes the result depend on hash iteration order. Time is O(n) expected and space is O(n).'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  const s = new Set(a); let bestStart = a[0], bestLen = 0;\n  for (const x of s) {\n    if (s.has(x - 1)) continue;\n    let y = x, len = 0;\n    while (s.has(y)) { len++; y++; }\n    if (len > bestLen || (len === bestLen && x < bestStart)) { bestLen = len; bestStart = x; }\n  }\n  return bestStart;\n}',
      TYPESCRIPT: 'function solve(a: number[]): number {\n  const s = new Set<number>(a); let bestStart = a[0], bestLen = 0;\n  for (const x of s) {\n    if (s.has(x - 1)) continue;\n    let y = x, len = 0;\n    while (s.has(y)) { len++; y++; }\n    if (len > bestLen || (len === bestLen && x < bestStart)) { bestLen = len; bestStart = x; }\n  }\n  return bestStart;\n}',
      PYTHON: 'def solve(a):\n    s = set(a)\n    best_start, best_len = a[0], 0\n    for x in s:\n        if x - 1 in s:\n            continue\n        y, length = x, 0\n        while y in s:\n            length += 1\n            y += 1\n        if length > best_len or (length == best_len and x < best_start):\n            best_start, best_len = x, length\n    return best_start',
      JAVA: '    static int solve(int[] a) {\n        Set<Integer> s = new HashSet<>(); for (int x : a) s.add(x);\n        int bestStart = a[0], bestLen = 0;\n        for (int x : s) {\n            if (s.contains(x - 1)) continue;\n            int y = x, len = 0; while (s.contains(y)) { len++; y++; }\n            if (len > bestLen || (len == bestLen && x < bestStart)) { bestLen = len; bestStart = x; }\n        }\n        return bestStart;\n    }',
      CPP: 'int solve(vector<int> a) {\n    unordered_set<int> s(a.begin(), a.end()); int bestStart = a[0], bestLen = 0;\n    for (int x : s) {\n        if (s.count(x - 1)) continue;\n        int y = x, len = 0; while (s.count(y)) { len++; y++; }\n        if (len > bestLen || (len == bestLen && x < bestStart)) { bestLen = len; bestStart = x; }\n    }\n    return bestStart;\n}',
      GO: 'func solve(a []int) int {\n\ts := map[int]bool{}; for _, x := range a { s[x] = true }\n\tbestStart, bestLen := a[0], 0\n\tfor x := range s {\n\t\tif s[x-1] { continue }\n\t\ty, length := x, 0; for s[y] { length++; y++ }\n\t\tif length > bestLen || (length == bestLen && x < bestStart) { bestStart, bestLen = x, length }\n\t}\n\treturn bestStart\n}',
    },
    tests: [
      { stdin: '8 4 5 6 10 11', expectedStdout: '4', isSample: true },
      { stdin: '9 1 2 7 8', expectedStdout: '7', isSample: true },
      { stdin: '3 3 3', expectedStdout: '3' },
      { stdin: '-4 -3 -2 5', expectedStdout: '-4' },
      { stdin: '12', expectedStdout: '12' },
    ],
  }),
  p({
    ...base, slug: 'shortest-target-slice', title: 'Shortest Exact-Sum Slice', difficulty: 'HARD', patternTags: ['prefix-sum', 'hash-map', 'shortest-subarray'], signatureId: 'fn:ints,int->int', avgSolveSeconds: 900,
    promptMarkdown: ['Return the smallest length of a non-empty contiguous slice whose values sum to the target. Values may be negative. Return `-1` when no such slice exists. The list is non-empty.', '', '**Example**', '', '```', 'input:  2 -1 2 3 -2', '        3', 'output: 1', '```', '', 'The one-value slice `3` is shorter than `2 -1 2`.'].join('\n'),
    editorialMarkdown: ['## Latest matching prefix for the shortest slice', '', 'The parent counts every slice with the target sum, so it keeps how many times each prefix total occurred. To make a slice as short as possible, the useful matching prefix is instead the latest one. At position `i`, a prior prefix total of `sum - target` marks a slice ending at `i`; its length is `i - priorIndex`. Store the latest index for each prefix total.', '', 'The quiet mistake is preserving the first index, which is correct for a longest slice but makes this answer too long. Seed total zero at index `-1` so a qualifying prefix is considered. Time is O(n), and the map uses O(n) space.'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a, b) {\n  const last = new Map([[0, -1]]); let sum = 0, best = a.length + 1;\n  for (let i = 0; i < a.length; i++) {\n    sum += a[i]; const j = last.get(sum - b);\n    if (j !== undefined && i - j < best) best = i - j;\n    last.set(sum, i);\n  }\n  return best === a.length + 1 ? -1 : best;\n}',
      TYPESCRIPT: 'function solve(a: number[], b: number): number {\n  const last = new Map<number, number>([[0, -1]]); let sum = 0, best = a.length + 1;\n  for (let i = 0; i < a.length; i++) {\n    sum += a[i]; const j = last.get(sum - b);\n    if (j !== undefined && i - j < best) best = i - j;\n    last.set(sum, i);\n  }\n  return best === a.length + 1 ? -1 : best;\n}',
      PYTHON: 'def solve(a, b):\n    last = {0: -1}\n    total, best = 0, len(a) + 1\n    for i, x in enumerate(a):\n        total += x\n        if total - b in last:\n            best = min(best, i - last[total - b])\n        last[total] = i\n    return -1 if best == len(a) + 1 else best',
      JAVA: '    static int solve(int[] a, int b) {\n        Map<Integer, Integer> last = new HashMap<>(); last.put(0, -1);\n        int sum = 0, best = a.length + 1;\n        for (int i = 0; i < a.length; i++) {\n            sum += a[i]; Integer j = last.get(sum - b);\n            if (j != null && i - j < best) best = i - j;\n            last.put(sum, i);\n        }\n        return best == a.length + 1 ? -1 : best;\n    }',
      CPP: 'int solve(vector<int> a, int b) {\n    unordered_map<int, int> last; last[0] = -1; int sum = 0, best = (int)a.size() + 1;\n    for (int i = 0; i < (int)a.size(); i++) {\n        sum += a[i]; auto it = last.find(sum - b);\n        if (it != last.end() && i - it->second < best) best = i - it->second;\n        last[sum] = i;\n    }\n    return best == (int)a.size() + 1 ? -1 : best;\n}',
      GO: 'func solve(a []int, b int) int {\n\tlast := map[int]int{0: -1}; sum, best := 0, len(a)+1\n\tfor i, x := range a {\n\t\tsum += x\n\t\tif j, ok := last[sum-b]; ok && i-j < best { best = i-j }\n\t\tlast[sum] = i\n\t}\n\tif best == len(a)+1 { return -1 }; return best\n}',
    },
    tests: [
      { stdin: '2 -1 2 3 -2\n3', expectedStdout: '1', isSample: true },
      { stdin: '1 -1 5 -2 3\n3', expectedStdout: '1', isSample: true },
      { stdin: '4 -2 -2 6\n2', expectedStdout: '2' },
      { stdin: '-5 2 1\n-3', expectedStdout: '2' },
      { stdin: '6 1 -4\n10', expectedStdout: '-1' },
    ],
  }),
  p({
    ...base, slug: 'first-list-distinct-outsiders', title: 'First List Values Missing From Second', difficulty: 'MEDIUM', patternTags: ['hash-set', 'set-difference', 'stable-order'], signatureId: 'fn:ints,ints->ints', avgSolveSeconds: 660,
    promptMarkdown: ['Return every value that occurs in the first list but never in the second list. Include each qualifying value once, in the order of its first appearance in the first list. Either list may be empty.', '', '**Example**', '', '```', 'input:  4 1 4 2 3 2', '        2 5 3', 'output: 4 1', '```', '', 'Values `2` and `3` appear in the second list, and the repeated `4` contributes only once. Return an empty list when no value qualifies.'].join('\n'),
    editorialMarkdown: ['## Stable set difference', '', 'The parent asks for common values and must account for how many copies each list has. This inverted question only needs membership in the second list, then a second set to suppress repeated output from the first list. Scan the first list in order: append a value only when it is absent from the second-list set and has not already been emitted.', '', 'The quiet mistake is iterating the result set at the end. A set has no required input order, while this problem explicitly asks for first-list order. Time is O(n + m) expected, and the two sets plus answer use O(n + m) space.'].join('\n'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a, b) {\n  const blocked = new Set(b), used = new Set(), out = [];\n  for (const x of a) if (!blocked.has(x) && !used.has(x)) { used.add(x); out.push(x); }\n  return out;\n}',
      TYPESCRIPT: 'function solve(a: number[], b: number[]): number[] {\n  const blocked = new Set<number>(b), used = new Set<number>(), out: number[] = [];\n  for (const x of a) if (!blocked.has(x) && !used.has(x)) { used.add(x); out.push(x); }\n  return out;\n}',
      PYTHON: 'def solve(a, b):\n    blocked, used, out = set(b), set(), []\n    for x in a:\n        if x not in blocked and x not in used:\n            used.add(x)\n            out.append(x)\n    return out',
      JAVA: '    static int[] solve(int[] a, int[] b) {\n        Set<Integer> blocked = new HashSet<>(), used = new HashSet<>();\n        for (int x : b) blocked.add(x);\n        List<Integer> out = new ArrayList<>();\n        for (int x : a) if (!blocked.contains(x) && used.add(x)) out.add(x);\n        int[] r = new int[out.size()]; for (int i = 0; i < r.length; i++) r[i] = out.get(i);\n        return r;\n    }',
      CPP: 'vector<int> solve(vector<int> a, vector<int> b) {\n    unordered_set<int> blocked(b.begin(), b.end()), used; vector<int> out;\n    for (int x : a) if (!blocked.count(x) && used.insert(x).second) out.push_back(x);\n    return out;\n}',
      GO: 'func solve(a []int, b []int) []int {\n\tblocked := map[int]bool{}; used := map[int]bool{}; out := []int{}\n\tfor _, x := range b { blocked[x] = true }\n\tfor _, x := range a { if !blocked[x] && !used[x] { used[x] = true; out = append(out, x) } }\n\treturn out\n}',
    },
    tests: [
      { stdin: '4 1 4 2 3 2\n2 5 3', expectedStdout: '4 1', isSample: true },
      { stdin: '7 7 8\n7', expectedStdout: '8', isSample: true },
      { stdin: '1 2\n1 2 3', expectedStdout: '' },
      { stdin: '-1 -2 -1 0\n-2', expectedStdout: '-1 0' },
      { stdin: '9 9 8\n', expectedStdout: '9 8' },
    ],
  }),
];
