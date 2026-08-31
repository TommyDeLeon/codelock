import { AUTHORED, type ProblemDefinition } from '../problem.js';

/**
 * Tier 1 — Greedy.
 *
 * These problems ask for one irrevocable local decision at a time. Each
 * editorial supplies the exchange argument that makes that decision safe.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = {
  tier: 'TIER_1',
  patternFamily: 'GREEDY',
  provenance: AUTHORED,
} as const;

const greedyEditorial = (name: string, body: string, mistake: string, complexity: string): string =>
  [
    `## Greedy: ${name}`,
    '',
    body,
    '',
    `The quiet mistake is ${mistake}. It often passes a friendly first example because the accidental choice happens to agree there, but it loses information that a later position needs.`,
    '',
    complexity,
  ].join('\n');

export const TIER_1_GREEDY_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: 'reach-last-platform',
    title: 'Can You Reach the Last Platform?',
    difficulty: 'EASY',
    patternTags: ['greedy', 'reachability', 'jump-game'],
    signatureId: 'fn:ints->bool',
    avgSolveSeconds: 300,
    promptMarkdown: [
      'Each number says the farthest distance you may jump from that position. Decide whether you can reach the last position.',
      '',
      'Start at position `0`. A jump may be shorter than the number shown, including zero steps only when you are already at the finish. Print `true` if some sequence of jumps reaches the final position; otherwise print `false`.',
      '',
      '**Example**', '', '```', 'input:  2 3 1 1 4', 'output: true', '```', '',
      'Jump from position 0 to 1, then from 1 to the end.', '',
      'The list has between 1 and 20 non-negative numbers. A one-number list is already finished, so its answer is `true`. A `0` before the reachable frontier can stop every route.',
    ].join('\n'),
    editorialMarkdown: greedyEditorial('keep the farthest reachable frontier', 'Scan from left to right while storing `far`, the greatest index reachable from every position seen so far. A position beyond `far` cannot be stood on, so it cannot improve anything and the answer is immediately false. Otherwise update `far` with `max(far, i + a[i])`. The greedy choice is safe by exchange: among all routes that have reached this prefix, replacing one that ends earlier with one that reaches `far` never removes a future jump—every destination available from the earlier route is still at or before the new frontier. Thus only the farthest frontier matters, not the path that produced it.', 'treating the current jump as mandatory. You may choose any shorter jump, and tracking only one chosen landing spot can throw away a better route.', 'O(n) time for the number of platforms and O(1) extra space.'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let far = 0;\n  for (let i = 0; i < a.length; i++) {\n    if (i > far) return false;\n    far = Math.max(far, i + a[i]);\n  }\n  return true;\n}',
      TYPESCRIPT: 'function solve(a: number[]): boolean {\n  let far = 0;\n  for (let i = 0; i < a.length; i++) {\n    if (i > far) return false;\n    far = Math.max(far, i + a[i]);\n  }\n  return true;\n}',
      PYTHON: 'def solve(a):\n    far = 0\n    for i, jump in enumerate(a):\n        if i > far:\n            return False\n        far = max(far, i + jump)\n    return True',
      JAVA: '    static boolean solve(int[] a) {\n        int far = 0;\n        for (int i = 0; i < a.length; i++) {\n            if (i > far) return false;\n            if (i + a[i] > far) far = i + a[i];\n        }\n        return true;\n    }',
      CPP: 'bool solve(vector<int> a) {\n    int far = 0;\n    for (int i = 0; i < (int) a.size(); i++) {\n        if (i > far) return false;\n        if (i + a[i] > far) far = i + a[i];\n    }\n    return true;\n}',
      GO: 'func solve(a []int) bool {\n\tfar := 0\n\tfor i := 0; i < len(a); i++ {\n\t\tif i > far { return false }\n\t\tif i+a[i] > far { far = i + a[i] }\n\t}\n\treturn true\n}',
    },
    tests: [
      { stdin: '2 3 1 1 4', expectedStdout: 'true', isSample: true },
      { stdin: '3 2 1 0 4', expectedStdout: 'false', isSample: true },
      { stdin: '0', expectedStdout: 'true' },
      { stdin: '1 0 1', expectedStdout: 'false' },
      { stdin: '2 0 0', expectedStdout: 'true' },
      { stdin: '1 2 0 1', expectedStdout: 'true' },
    ],
  }),

  p({
    ...base,
    slug: 'fewest-hops-to-finish', title: 'Fewest Hops to the End', difficulty: 'MEDIUM', patternTags: ['greedy', 'jump-game', 'range'], signatureId: 'fn:ints->int', avgSolveSeconds: 480,
    promptMarkdown: ['Each number is the farthest distance you may jump from that position. Return the fewest jumps needed to reach the last position.', '', 'You start at position `0`, may make shorter jumps, and may assume the last position is reachable.', '', '**Example**', '', '```', 'input:  2 3 1 1 4', 'output: 2', '```', '', 'Jump to position 1, then to the end. The list has between 1 and 20 non-negative numbers. A one-number list needs **0 jumps**.'].join('\n'),
    editorialMarkdown: greedyEditorial('finish one reachable layer before choosing the next', 'While scanning the positions reachable with the current number of jumps, record the farthest place any of them can reach. When the scan arrives at the end of that layer, one more jump is forced; promote that farthest place to the next layer. This is safe by exchange: if an optimal route takes its next jump from an earlier position in the layer, replace that departure with the layer position that reaches farthest. It uses the same one jump and leaves every later option at least as reachable, so no optimal answer is lost.', 'incrementing once for every position that extends the frontier. Several positions belong to the same jump layer, so that quietly overcounts.', 'O(n) time over the platforms and O(1) extra space.'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let jumps = 0, end = 0, far = 0;\n  for (let i = 0; i < a.length - 1; i++) {\n    far = Math.max(far, i + a[i]);\n    if (i === end) { jumps++; end = far; }\n  }\n  return jumps;\n}',
      TYPESCRIPT: 'function solve(a: number[]): number {\n  let jumps = 0, end = 0, far = 0;\n  for (let i = 0; i < a.length - 1; i++) {\n    far = Math.max(far, i + a[i]);\n    if (i === end) { jumps++; end = far; }\n  }\n  return jumps;\n}',
      PYTHON: 'def solve(a):\n    jumps = end = far = 0\n    for i in range(len(a) - 1):\n        far = max(far, i + a[i])\n        if i == end:\n            jumps += 1\n            end = far\n    return jumps',
      JAVA: '    static int solve(int[] a) {\n        int jumps = 0, end = 0, far = 0;\n        for (int i = 0; i < a.length - 1; i++) {\n            if (i + a[i] > far) far = i + a[i];\n            if (i == end) { jumps++; end = far; }\n        }\n        return jumps;\n    }',
      CPP: 'int solve(vector<int> a) {\n    int jumps = 0, end = 0, far = 0;\n    for (int i = 0; i < (int) a.size() - 1; i++) {\n        if (i + a[i] > far) far = i + a[i];\n        if (i == end) { jumps++; end = far; }\n    }\n    return jumps;\n}',
      GO: 'func solve(a []int) int {\n\tjumps, end, far := 0, 0, 0\n\tfor i := 0; i < len(a)-1; i++ {\n\t\tif i+a[i] > far { far = i + a[i] }\n\t\tif i == end { jumps++; end = far }\n\t}\n\treturn jumps\n}',
    },
    tests: [{ stdin: '2 3 1 1 4', expectedStdout: '2', isSample: true }, { stdin: '2 3 0 1 4', expectedStdout: '2', isSample: true }, { stdin: '0', expectedStdout: '0' }, { stdin: '1 1 1 1', expectedStdout: '3' }, { stdin: '4 0 0 0 0', expectedStdout: '1' }, { stdin: '1 2 1 1 1', expectedStdout: '3' }],
  }),

  p({
    ...base,
    slug: 'choose-circuit-start', title: 'Choose a Starting Pump', difficulty: 'MEDIUM', patternTags: ['greedy', 'gas-station', 'prefix-sum'], signatureId: 'fn:ints->int', avgSolveSeconds: 600,
    promptMarkdown: ['The list gives the net fuel change at pumps arranged in a circle: add the number when you leave that pump. Return the index where a full clockwise lap can begin without fuel ever becoming negative, or `-1` if no such index exists.', '', '**Example**', '', '```', 'input:  -2 3 -1 2', 'output: 1', '```', '', 'Starting at index 1 gives running fuel `3, 2, 4, 2`, so the lap succeeds. The list has between 1 and 20 integers. A one-pump list works at index `0` when its value is non-negative; otherwise it returns `-1`.'].join('\n'),
    editorialMarkdown: greedyEditorial('discard every start before a failed prefix', 'Walk once, keeping a running tank and a candidate start. If the tank becomes negative at index `i`, reset the candidate to `i + 1` and reset the tank. No start from the discarded block can work: each of them reaches the same failed prefix with no more fuel than the candidate did, so moving the start within that block only removes non-positive help before the failure. If the total net fuel is negative, no start can complete a lap; otherwise the final candidate works because all discarded deficits have been paid for by the remaining total.', 'resetting the candidate but forgetting to reset the running tank. That carries a debt from pumps no longer on the proposed route and rejects a valid start.', 'O(n) time for n pumps and O(1) extra space.'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  let total = 0, tank = 0, start = 0;\n  for (let i = 0; i < a.length; i++) { total += a[i]; tank += a[i]; if (tank < 0) { start = i + 1; tank = 0; } }\n  return total >= 0 ? start % a.length : -1;\n}', TYPESCRIPT: 'function solve(a: number[]): number {\n  let total = 0, tank = 0, start = 0;\n  for (let i = 0; i < a.length; i++) { total += a[i]; tank += a[i]; if (tank < 0) { start = i + 1; tank = 0; } }\n  return total >= 0 ? start % a.length : -1;\n}', PYTHON: 'def solve(a):\n    total = tank = start = 0\n    for i, x in enumerate(a):\n        total += x\n        tank += x\n        if tank < 0:\n            start = i + 1\n            tank = 0\n    return start % len(a) if total >= 0 else -1', JAVA: '    static int solve(int[] a) {\n        int total = 0, tank = 0, start = 0;\n        for (int i = 0; i < a.length; i++) { total += a[i]; tank += a[i]; if (tank < 0) { start = i + 1; tank = 0; } }\n        return total >= 0 ? start % a.length : -1;\n    }', CPP: 'int solve(vector<int> a) {\n    int total = 0, tank = 0, start = 0;\n    for (int i = 0; i < (int) a.size(); i++) { total += a[i]; tank += a[i]; if (tank < 0) { start = i + 1; tank = 0; } }\n    return total >= 0 ? start % (int) a.size() : -1;\n}', GO: 'func solve(a []int) int {\n\ttotal, tank, start := 0, 0, 0\n\tfor i := 0; i < len(a); i++ { total += a[i]; tank += a[i]; if tank < 0 { start = i + 1; tank = 0 } }\n\tif total < 0 { return -1 }; return start % len(a)\n}',
    },
    tests: [{ stdin: '-2 3 -1 2', expectedStdout: '1', isSample: true }, { stdin: '1 -2 1', expectedStdout: '2', isSample: true }, { stdin: '-1', expectedStdout: '-1' }, { stdin: '0', expectedStdout: '0' }, { stdin: '-1 2 -1', expectedStdout: '1' }, { stdin: '2 -3 1', expectedStdout: '2' }],
  }),

  p({
    ...base,
    slug: 'load-highest-value-units', title: 'Fill the Truck With the Best Units', difficulty: 'MEDIUM', patternTags: ['greedy', 'sorting', 'knapsack'], signatureId: 'fn:ints,int->int', avgSolveSeconds: 600,
    promptMarkdown: ['Load at most a given number of units into a truck to maximize total value. The first line is pairs `count value`, one pair per item type; the second line is truck capacity. You may take any number from zero through `count` of each type.', '', '**Example**', '', '```', 'input:  3 4 2 7 5 2', '        5', 'output: 26', '```', '', 'Take both units worth 7 and three units worth 4. There are between 1 and 10 pairs, each count and value is non-negative, and capacity is non-negative. With capacity `0`, the answer is `0`.'].join('\n'),
    editorialMarkdown: greedyEditorial('take the highest value per unit first', 'Sort the item types by value per unit descending, then take as many as capacity allows from each type. The choice is safe by exchange: suppose a full solution takes one lower-value unit while a higher-value available unit was skipped. Swapping those two units keeps the used capacity identical and never decreases value, while it increases it when the values differ. Repeating the swap transforms an optimum into the greedy loading, so greedy is optimal. Counts only limit how long each value tier lasts.', 'sorting by the total value of a type (`count * value`) instead of value per unit. A large pile of cheap units can then wrongly outrank one valuable unit.', 'O(k^2) time here because the inline insertion sort handles k item types, and O(k) extra space for the copied pairs.'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a, b) {\n  const p = []; for (let i = 0; i < a.length; i += 2) p.push([a[i], a[i + 1]]);\n  p.sort((x, y) => y[1] - x[1]); let ans = 0;\n  for (const [count, value] of p) { const take = Math.min(count, b); ans += take * value; b -= take; } return ans;\n}', TYPESCRIPT: 'function solve(a: number[], b: number): number {\n  const p: number[][] = []; for (let i = 0; i < a.length; i += 2) p.push([a[i], a[i + 1]]);\n  p.sort((x, y) => y[1] - x[1]); let ans = 0;\n  for (const [count, value] of p) { const take = Math.min(count, b); ans += take * value; b -= take; } return ans;\n}', PYTHON: 'def solve(a, b):\n    pairs = [(a[i], a[i + 1]) for i in range(0, len(a), 2)]\n    pairs.sort(key=lambda pair: pair[1], reverse=True)\n    total = 0\n    for count, value in pairs:\n        take = min(count, b)\n        total += take * value\n        b -= take\n    return total', JAVA: '    static int solve(int[] a, int b) {\n        int[][] p = new int[a.length / 2][2];\n        for (int i = 0; i < p.length; i++) { p[i][0] = a[2 * i]; p[i][1] = a[2 * i + 1]; }\n        for (int i = 1; i < p.length; i++) { int[] x = p[i]; int j = i - 1; while (j >= 0 && p[j][1] < x[1]) { p[j + 1] = p[j]; j--; } p[j + 1] = x; }\n        int total = 0; for (int[] x : p) { int take = x[0] < b ? x[0] : b; total += take * x[1]; b -= take; } return total;\n    }', CPP: 'int solve(vector<int> a, int b) {\n    vector<vector<int>> p; for (int i = 0; i < (int) a.size(); i += 2) p.push_back({a[i], a[i + 1]});\n    for (int i = 1; i < (int) p.size(); i++) { vector<int> x = p[i]; int j = i - 1; while (j >= 0 && p[j][1] < x[1]) { p[j + 1] = p[j]; j--; } p[j + 1] = x; }\n    int total = 0; for (auto x : p) { int take = x[0] < b ? x[0] : b; total += take * x[1]; b -= take; } return total;\n}', GO: 'func solve(a []int, b int) int {\n\tp := make([][]int, 0); for i := 0; i < len(a); i += 2 { p = append(p, []int{a[i], a[i+1]}) }\n\tfor i := 1; i < len(p); i++ { x := p[i]; j := i-1; for j >= 0 && p[j][1] < x[1] { p[j+1] = p[j]; j-- }; p[j+1] = x }\n\ttotal := 0; for _, x := range p { take := x[0]; if take > b { take = b }; total += take*x[1]; b -= take }; return total\n}',
    },
    tests: [{ stdin: '3 4 2 7 5 2\n5', expectedStdout: '26', isSample: true }, { stdin: '1 10 2 5\n2', expectedStdout: '15', isSample: true }, { stdin: '3 9\n0', expectedStdout: '0' }, { stdin: '2 3 4 1\n10', expectedStdout: '10' }, { stdin: '1 1 3 8 2 5\n4', expectedStdout: '29' }, { stdin: '0 9 2 4\n2', expectedStdout: '8' }],
  }),

  p({
    ...base,
    slug: 'split-letters-into-closed-pieces', title: 'Close Each Letter in One Piece', difficulty: 'MEDIUM', patternTags: ['greedy', 'strings', 'intervals'], signatureId: 'fn:string->int', avgSolveSeconds: 600,
    promptMarkdown: ['Split a lowercase string into as many consecutive non-empty pieces as possible so that every letter occurs in only one piece. Return the number of pieces.', '', '**Example**', '', '```', 'input:  abacbc', 'output: 1', '```', '', 'The `a`, `b`, and `c` each appear on both sides of any possible early cut, so the whole string must stay together. The string has between 1 and 100 lowercase letters. A one-letter string has one piece.'].join('\n'),
    editorialMarkdown: greedyEditorial('cut exactly when the open interval closes', 'First record the last index of every letter. Scan again with `end`, the farthest last index among letters in the current piece. Extend `end` whenever a letter demands it; when the scan index equals `end`, cut immediately. That earliest cut is safe by exchange: every letter already seen ends within it, so no future letter needs to join this piece. Any valid partition that delays this cut can split at the same point instead and leaves the suffix unchanged, gaining a piece without breaking the rule. Therefore cutting at every closure maximizes the count.', 'cutting when a letter is seen for the second time. A later occurrence may still exist, so this looks locally closed while silently splitting one letter across pieces.', 'O(n) time for string length n and O(1) extra space because the alphabet has 26 letters.'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  const last = new Array(26).fill(-1); for (let i = 0; i < a.length; i++) last[a.charCodeAt(i)-97] = i;\n  let end = 0, count = 0; for (let i = 0; i < a.length; i++) { end = Math.max(end, last[a.charCodeAt(i)-97]); if (i === end) count++; } return count;\n}', TYPESCRIPT: 'function solve(a: string): number {\n  const last: number[] = new Array(26).fill(-1); for (let i = 0; i < a.length; i++) last[a.charCodeAt(i)-97] = i;\n  let end = 0, count = 0; for (let i = 0; i < a.length; i++) { end = Math.max(end, last[a.charCodeAt(i)-97]); if (i === end) count++; } return count;\n}', PYTHON: 'def solve(a):\n    last = [-1] * 26\n    for i, ch in enumerate(a): last[ord(ch) - 97] = i\n    end = count = 0\n    for i, ch in enumerate(a):\n        end = max(end, last[ord(ch) - 97])\n        if i == end: count += 1\n    return count', JAVA: '    static int solve(String a) {\n        int[] last = new int[26]; for (int i = 0; i < a.length(); i++) last[a.charAt(i) - \'a\'] = i;\n        int end = 0, count = 0; for (int i = 0; i < a.length(); i++) { if (last[a.charAt(i) - \'a\'] > end) end = last[a.charAt(i) - \'a\']; if (i == end) count++; } return count;\n    }', CPP: 'int solve(string a) {\n    vector<int> last(26, -1); for (int i = 0; i < (int) a.size(); i++) last[a[i] - \'a\'] = i;\n    int end = 0, count = 0; for (int i = 0; i < (int) a.size(); i++) { if (last[a[i] - \'a\'] > end) end = last[a[i] - \'a\']; if (i == end) count++; } return count;\n}', GO: 'func solve(a string) int {\n\tlast := make([]int, 26); for i := 0; i < len(a); i++ { last[a[i]-\'a\'] = i }\n\tend, count := 0, 0; for i := 0; i < len(a); i++ { if last[a[i]-\'a\'] > end { end = last[a[i]-\'a\'] }; if i == end { count++ } }; return count\n}',
    },
    tests: [{ stdin: 'abacbc', expectedStdout: '1', isSample: true }, { stdin: 'abaccbdeffed', expectedStdout: '2', isSample: true }, { stdin: 'z', expectedStdout: '1' }, { stdin: 'abc', expectedStdout: '3' }, { stdin: 'aaaa', expectedStdout: '1' }, { stdin: 'eccbbbbdec', expectedStdout: '1' }],
  }),

  p({
    ...base,
    slug: 'collect-every-rise', title: 'Collect Every Rise', difficulty: 'EASY', patternTags: ['greedy', 'stocks', 'array'], signatureId: 'fn:ints->int', avgSolveSeconds: 300,
    promptMarkdown: ['Given daily prices, return the greatest profit from any number of buy-then-sell trades. You may hold at most one unit at a time, and you may buy again on the same day you sell.', '', '**Example**', '', '```', 'input:  7 1 5 3 6 4', 'output: 7', '```', '', 'Buy at 1 and sell at 5, then buy at 3 and sell at 6. Prices are non-negative and the list has between 1 and 20 days. With one day, or with prices that never rise, the answer is `0`.'].join('\n'),
    editorialMarkdown: greedyEditorial('take every positive day-to-day rise', 'Add `price[i] - price[i-1]` whenever it is positive. This is equivalent to buying before each rising edge and selling after it. The exchange argument is telescoping: any trade from price x to a later higher price y earns `y-x`, exactly the sum of all intervening daily rises minus declines. Splitting a trade around a decline avoids that decline while preserving every positive rise, so an optimal schedule can be transformed into one that collects each positive adjacent difference. Same-day sell then buy makes the splits legal.', 'trying to find just one lowest buy and one highest later sell. That misses profit after a drop, even though selling before it and buying back is allowed.', 'O(n) time over days and O(1) extra space.'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) { let profit = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[i-1]) profit += a[i]-a[i-1]; return profit; }', TYPESCRIPT: 'function solve(a: number[]): number { let profit = 0; for (let i = 1; i < a.length; i++) if (a[i] > a[i-1]) profit += a[i]-a[i-1]; return profit; }', PYTHON: 'def solve(a):\n    profit = 0\n    for i in range(1, len(a)):\n        if a[i] > a[i - 1]: profit += a[i] - a[i - 1]\n    return profit', JAVA: '    static int solve(int[] a) { int profit = 0; for (int i = 1; i < a.length; i++) if (a[i] > a[i - 1]) profit += a[i] - a[i - 1]; return profit; }', CPP: 'int solve(vector<int> a) { int profit = 0; for (int i = 1; i < (int) a.size(); i++) if (a[i] > a[i - 1]) profit += a[i] - a[i - 1]; return profit; }', GO: 'func solve(a []int) int { profit := 0; for i := 1; i < len(a); i++ { if a[i] > a[i-1] { profit += a[i]-a[i-1] } }; return profit }',
    },
    tests: [{ stdin: '7 1 5 3 6 4', expectedStdout: '7', isSample: true }, { stdin: '1 2 3 4 5', expectedStdout: '4', isSample: true }, { stdin: '5', expectedStdout: '0' }, { stdin: '7 6 4 3 1', expectedStdout: '0' }, { stdin: '2 1 2 0 1', expectedStdout: '2' }, { stdin: '3 3 3', expectedStdout: '0' }],
  }),

  p({
    ...base,
    slug: 'canonical-coins-fewest-count', title: 'Fewest Standard Coins', difficulty: 'EASY', patternTags: ['greedy', 'coins', 'canonical-system'], signatureId: 'fn:ints,int->int', avgSolveSeconds: 360,
    promptMarkdown: ['Use the unlimited coin denominations `1, 5, 10, 25` to make the target amount. Return the fewest coins needed.', '', 'The first line is ignored except that it must be the exact list `1 5 10 25`; the second line is the target. This shape keeps the exercise in the shared array-and-number signature.', '', '**Example**', '', '```', 'input:  1 5 10 25', '        68', 'output: 7', '```', '', 'Take two 25s, one 10, one 5, and three 1s. The target is between 0 and 200. Target `0` needs **0 coins**.'].join('\n'),
    editorialMarkdown: greedyEditorial('take the largest canonical coin that fits', 'Repeatedly take as many 25s as fit, then 10s, 5s, and 1s. This is deliberately a canonical coin system, not an arbitrary denomination problem. The exchange argument works by ranges: five 1s can always be exchanged for one 5, two 5s for one 10, and two 10s plus one 5 for one 25; each exchange preserves value and reduces coin count. Therefore no minimum solution keeps enough smaller coins to replace a larger fitting standard coin, so taking the largest coin first is safe.', 'assuming this proof works for every set of denominations. With coins `1, 3, 4`, greedy makes 6 with `4+1+1` although `3+3` is better.', 'O(1) time and O(1) space: there are exactly four fixed denominations.'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a, b) { let count = 0; for (const coin of [25, 10, 5, 1]) { count += Math.floor(b / coin); b %= coin; } return count; }', TYPESCRIPT: 'function solve(a: number[], b: number): number { let count = 0; for (const coin of [25, 10, 5, 1]) { count += Math.floor(b / coin); b %= coin; } return count; }', PYTHON: 'def solve(a, b):\n    count = 0\n    for coin in (25, 10, 5, 1):\n        count += b // coin\n        b %= coin\n    return count', JAVA: '    static int solve(int[] a, int b) { int count = 0; int[] coins = {25, 10, 5, 1}; for (int coin : coins) { count += b / coin; b %= coin; } return count; }', CPP: 'int solve(vector<int> a, int b) { int count = 0; int coins[4] = {25, 10, 5, 1}; for (int coin : coins) { count += b / coin; b %= coin; } return count; }', GO: 'func solve(a []int, b int) int { count := 0; coins := []int{25, 10, 5, 1}; for _, coin := range coins { count += b / coin; b %= coin }; return count }',
    },
    tests: [{ stdin: '1 5 10 25\n68', expectedStdout: '7', isSample: true }, { stdin: '1 5 10 25\n41', expectedStdout: '4', isSample: true }, { stdin: '1 5 10 25\n0', expectedStdout: '0' }, { stdin: '1 5 10 25\n25', expectedStdout: '1' }, { stdin: '1 5 10 25\n99', expectedStdout: '9' }, { stdin: '1 5 10 25\n4', expectedStdout: '4' }],
  }),

  p({
    ...base,
    slug: 'arrange-pieces-for-largest-number', title: 'Arrange Pieces Into the Largest Number', difficulty: 'MEDIUM', patternTags: ['greedy', 'sorting', 'strings'], signatureId: 'fn:strings->string', avgSolveSeconds: 600,
    promptMarkdown: ['Arrange the non-negative integer text pieces so their concatenation is as large as possible. Return that concatenation, except return exactly `0` if every piece is zero.', '', '**Example**', '', '```', 'input:  3 30 34 5 9', 'output: 9534330', '```', '', 'The pieces are digit strings with no leading zero unless the piece is `0`. There are between 1 and 10 pieces. If all pieces are `0`, return `0`, not many zeroes.'].join('\n'),
    editorialMarkdown: greedyEditorial('compare two possible concatenation orders', 'Sort pieces `x` and `y` by whether `x + y` is larger than `y + x`. Joining the sorted pieces is the answer. The exchange argument is direct: if adjacent pieces appear as `y,x` while `x+y` is larger, swapping only those two improves the whole number because the prefix and suffix are unchanged. Thus no optimum contains an inverted adjacent pair; repeatedly exchanging inversions yields exactly this ordering. Numeric comparison is irrelevant because `9` must precede `34` even though the decision is about their joined text.', 'sorting pieces as ordinary numbers or lexicographic strings. Both give plausible orders but fail on pairs such as `3` and `30`.', 'O(n^2 * L) time with insertion sort, where n is the number of pieces and L bounds a comparison, and O(n) extra space for the copied list.'),
    referenceSolution: {
      JAVASCRIPT: 'function solve(a) {\n  const p = a.slice(); p.sort((x, y) => (y + x).localeCompare(x + y));\n  const out = p.join(\'\'); return out[0] === \'0\' ? \'0\' : out;\n}', TYPESCRIPT: 'function solve(a: string[]): string {\n  const p = a.slice(); p.sort((x, y) => (y + x).localeCompare(x + y));\n  const out = p.join(\'\'); return out[0] === \'0\' ? \'0\' : out;\n}', PYTHON: 'from functools import cmp_to_key\n\ndef solve(a):\n    p = list(a)\n    p.sort(key=cmp_to_key(lambda x, y: -1 if x + y > y + x else (1 if x + y < y + x else 0)))\n    out = \'\'.join(p)\n    return \'0\' if out[0] == \'0\' else out', JAVA: '    static String solve(String[] a) {\n        String[] p = a.clone();\n        for (int i = 1; i < p.length; i++) { String x = p[i]; int j = i - 1; while (j >= 0 && (x + p[j]).compareTo(p[j] + x) > 0) { p[j + 1] = p[j]; j--; } p[j + 1] = x; }\n        StringBuilder out = new StringBuilder(); for (String x : p) out.append(x); return out.charAt(0) == \'0\' ? "0" : out.toString();\n    }', CPP: 'string solve(vector<string> a) {\n    for (int i = 1; i < (int) a.size(); i++) { string x = a[i]; int j = i - 1; while (j >= 0 && x + a[j] > a[j] + x) { a[j + 1] = a[j]; j--; } a[j + 1] = x; }\n    string out; for (string x : a) out += x; return out[0] == \'0\' ? "0" : out;\n}', GO: 'func solve(a []string) string {\n\tp := make([]string, len(a)); copy(p, a)\n\tfor i := 1; i < len(p); i++ { x := p[i]; j := i-1; for j >= 0 && x+p[j] > p[j]+x { p[j+1] = p[j]; j-- }; p[j+1] = x }\n\tout := strings.Join(p, ""); if out[0] == \'0\' { return "0" }; return out\n}',
    },
    tests: [{ stdin: '3 30 34 5 9', expectedStdout: '9534330', isSample: true }, { stdin: '10 2', expectedStdout: '210', isSample: true }, { stdin: '0 0', expectedStdout: '0' }, { stdin: '1', expectedStdout: '1' }, { stdin: '121 12', expectedStdout: '12121' }, { stdin: '8 89', expectedStdout: '898' }],
  }),
];
