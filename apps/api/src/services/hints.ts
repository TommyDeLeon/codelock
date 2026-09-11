import type { PatternFamily, Problem } from '@prisma/client';

/**
 * Three nudges, available while the lock is still up.
 *
 * The editorial is gated behind the solve, and rightly so — it is the answer.
 * But that left a learner stuck at minute forty with exactly two moves: abandon
 * the session, or stare at it. Neither teaches anything, and the second is how
 * a commitment device becomes something you resent. A hint that names the idea
 * without writing the code is what keeps someone working, which is the only
 * outcome this product actually wants.
 *
 * Ordered vaguest to most concrete, and revealed one at a time:
 *
 *   1. What *kind* of problem this is. Often the whole blocker: a beginner who
 *      cannot see that a question is really about a hash map will not get there
 *      by rereading the statement.
 *   2. The technique, and the invariant it maintains.
 *   3. What to watch out for — the edge case, or the complexity target that the
 *      obvious solution misses.
 *
 * None of the three contains code, and none names an answer.
 *
 * Authored hints on the problem row override these. The derived set exists so
 * that all ~695 problems have hints on day one rather than the handful someone
 * found time to write, and so an unwritten problem degrades to "generic but
 * true" instead of "nothing".
 */

/** The per-family trio. Keyed by the enum, so a new family fails the build. */
export const BY_FAMILY: Record<PatternFamily, readonly [string, string, string]> = {
  ARRAYS_HASHING: [
    'Ask what you would need to have already seen in order to answer in a single pass.',
    'A hash map trades memory for lookups: store what you have seen, keyed by the thing you will later want to look up.',
    'One pass with a map is usually the target. If you are scanning the array inside another loop over the array, that is the O(n²) the speed gate exists to catch.',
  ],
  TWO_POINTERS: [
    'Two positions moving through the data can often replace a nested loop.',
    'Decide what each pointer means and what must stay true between them — then every step is just "which pointer moves, and why".',
    'Moving the wrong pointer is the usual bug. At each step, ask which one cannot possibly improve the answer where it currently stands.',
  ],
  SLIDING_WINDOW: [
    'You are looking at a contiguous run, and consecutive runs overlap heavily.',
    'Grow the window on the right; shrink it from the left the moment it stops being valid. Keep the running summary in a variable rather than re-scanning the window.',
    'Every element should enter and leave the window at most once. Recomputing the whole window each step is the nested loop again in disguise.',
  ],
  STACK: [
    'Something here has to wait for something later before it can be resolved.',
    'Push the unresolved items; pop them when the thing they were waiting for finally arrives.',
    'Check what is left on the stack at the end — the unmatched leftovers are almost always either part of the answer or the whole bug.',
  ],
  BINARY_SEARCH: [
    'The search space is ordered, or can be made ordered — which means half of it can be discarded at every step.',
    'Be precise about your bounds: is the range inclusive at both ends, and does the loop run while `low < high` or `low <= high`? Pick one and hold it.',
    'Off-by-one errors and infinite loops come from the same place — the case where the range holds one or two items. Walk that case by hand.',
  ],
  LINKED_LIST: [
    'You cannot index into it. Everything is "walk from here, remembering what you passed".',
    'A dummy head node removes almost every special case around the first element, and two pointers moving at different speeds answer most of the rest.',
    'Draw three nodes and the pointer moves before writing them. The classic bug is losing the rest of the list by reassigning `next` one line too early.',
  ],
  TREES: [
    'The problem is almost certainly the same question asked of the left subtree and the right subtree.',
    'Write the recursion: what does a leaf return, what does an empty child return, and how do two answers combine into one?',
    'Decide whether you need the value on the way down (passing context in) or on the way up (combining results). Mixing the two is where these go wrong.',
  ],
  TRIES: [
    'You are looking things up by prefix, which is exactly what a character-by-character tree is for.',
    'Each node is a map from character to child, plus a flag for "a word ends here". Insert and lookup are the same walk.',
    'Do not forget the end-of-word flag. Without it you cannot tell a stored word from a mere prefix of one.',
  ],
  HEAP_PRIORITY_QUEUE: [
    'You need the smallest or largest thing repeatedly, but never the whole order.',
    'A heap gives you that in log time. For "top k", keep a heap of exactly k and evict — do not sort everything.',
    'Sorting the whole input is the easy answer and often too slow. Check which end of the heap your language gives you cheaply.',
  ],
  BACKTRACKING: [
    'You are building candidates and abandoning them the moment they cannot work.',
    'Choose, recurse, then undo the choice. The undo is not optional — the same structure is reused down every branch.',
    'Prune as early as you can, and append a *copy* when you record a result. Recording the working list stores a reference that later mutations will change under you.',
  ],
  GRAPHS: [
    'Model it as nodes and edges first, even when the input arrives as a grid or a list of pairs.',
    'BFS for fewest steps, DFS for reachability and connected pieces. Both need a visited set.',
    'Mark a node visited when you enqueue it, not when you dequeue it, or the same node gets queued many times over.',
  ],
  ADVANCED_GRAPHS: [
    'A plain traversal is not enough here — the edges carry weights, direction, or ordering constraints.',
    'Name the right tool: shortest path for weights, topological order for dependencies, union-find for merging groups.',
    'Watch the assumptions. Dijkstra needs non-negative weights; a topological sort needs the cycle case answered explicitly.',
  ],
  DP_1D: [
    'The answer at each position is built from answers at earlier positions.',
    'Define the state in one sentence — "dp[i] is the best answer considering the first i items" — then write the recurrence for dp[i] from its predecessors.',
    'Get the base case right, then ask whether you need the whole array at all. Many of these only ever look back one or two steps.',
  ],
  DP_2D: [
    'Two things vary independently, so the state needs two indices.',
    'Say plainly what dp[i][j] means before writing any loop. Almost every bug in these is a state that was never defined precisely.',
    'Fill order matters: every cell your recurrence reads must already be computed. Check the first row and the first column separately.',
  ],
  GREEDY: [
    'There may be a rule that picks the right next step without looking ahead at all.',
    'Find the ordering or the local choice that provably cannot be beaten — usually "earliest finish first", "largest first", or "sort by one key".',
    'Greedy is either right or badly wrong. Try to build a small counterexample; failing to find one is your evidence.',
  ],
  INTERVALS: [
    'The order the intervals arrive in is not the order you should process them.',
    'Sort by start (or by end, for scheduling), then walk once, comparing each interval only against the one you are currently holding.',
    'Be explicit about touching endpoints: does [1,2] overlap [2,3] for this problem? The statement usually says, and the answer changes.',
  ],
  MATH_GEOMETRY: [
    'There is likely a formula or a property that replaces the simulation entirely.',
    'Work a small case by hand and look for the pattern before writing a loop over every possibility.',
    'Mind overflow and integer division, and handle zero and negatives explicitly. That is where these break.',
  ],
  BIT_MANIPULATION: [
    'Think about the numbers as bits rather than as values.',
    'The three workhorses: AND to test, OR and shift to set, XOR to cancel pairs. XOR is the one that makes duplicates disappear.',
    'Shifting a negative number, and assuming 32 bits, are the two portability traps. Be explicit about width.',
  ],
  FOUNDATIONS: [
    'Restate the task in one sentence in your own words. Most of these are exactly as simple as they sound.',
    'Work the sample by hand, writing down each step you take. The steps you write down are the code.',
    'Check the boundaries: empty input, a single item, and the very first and very last positions. That is where these are failed.',
  ],
  DATA_STRUCTURES: [
    'The structure itself is the subject — the question is what it must guarantee, not what it computes.',
    'List the operations and the cost each one has to hit, then choose internals that make all of them work at once.',
    'The hard part is keeping every operation cheap simultaneously. Check that adding, removing and reading do not each undo the other two.',
  ],
};

/**
 * Sharpen the middle hint with the problem's own tag where it has one.
 *
 * The families are broad — "arrays and hashing" covers prefix sums and cyclic
 * sort alike — so where the corpus has already named the technique, saying it
 * is worth more than the family-level sentence it replaces.
 */
const BY_TAG: Record<string, string> = {
  'prefix-sum':
    'Precompute running totals once, and any range answer becomes a subtraction of two of them.',
  'monotonic-stack':
    'Keep the stack ordered as you go: pop everything the new element makes irrelevant before pushing it.',
  kadane:
    'Walk once, carrying the best run ending here. At each step that run either extends or restarts from this element.',
  'fast-slow-pointers':
    'Two pointers moving at different speeds. Where they meet, and how far apart they are, is the answer.',
  'cyclic-sort':
    'The values themselves say where they belong. Put each one at its own index and read off what is left out of place.',
  'union-find':
    'Merge groups as you meet them and keep one representative per group. Two things are connected when they share a representative.',
  'topological-sort':
    'Process only what has no unmet dependency left, removing edges as you go.',
  memoization:
    'The recursion is right but recomputes. Cache on the arguments: the shape stays, the cost does not.',
  'binary-search-on-answer':
    'You are not searching the input — you are searching the answer, asking "is this value achievable?" at each step.',
  backtracking: 'Choose, recurse, undo. The undo is what lets one structure serve every branch.',
  'sliding-window':
    'Grow right, shrink left the moment the window stops being valid, and keep the summary in a variable.',
  'two-heaps':
    'Two heaps facing each other split the data at the middle, and the middle is what you are being asked for.',
  'in-place':
    'You are asked to use no extra space, so the output has to be written over the input as you read it.',
  greedy:
    'Find the local choice that cannot be beaten, and test it against a small case before you write it.',
};


/**
 * What shape the work has, keyed by the problem's own signature.
 *
 * This is the layer that was missing. `BY_FAMILY` describes a *category*, so
 * every problem in a category got identical text, which is what made the
 * hints feel useless once you had seen two problems from the same family. A
 * signature is far narrower: `fn:ints->int` and `fn:ints->ints` are both
 * arrays-and-hashing, and what you have to *produce* is completely different,
 * which changes what the first useful thought is.
 *
 * Phrased as "you are handed X and must return Y, so...", because naming the
 * gap between input and output is the move a stuck beginner has not made yet.
 */
const BY_SIGNATURE: Record<string, string> = {
  'fn:ints->int':
    'You are handed a list and must return one number, so the answer is something you accumulate or select across the whole list rather than a position in it.',
  'fn:ints->ints':
    'List in, list out. Decide early whether every input element produces an output element, or whether you are filtering, because that choice decides the whole structure.',
  'fn:ints->bool':
    'You return yes or no, which means you can stop the moment you know. Look for the earliest point at which the answer is certain.',
  'fn:ints->double':
    'The answer is not a whole number, so ordering and division both matter. Work out what you are dividing by before you start summing.',
  'fn:ints->matrix':
    'A flat list becomes rows and columns, so the only real question is how an index maps to a position. Division and remainder answer it.',
  'fn:ints,int->int':
    'A list and one extra number. That number is almost always a target, a count, or a limit, and deciding which one tells you what to do with it.',
  'fn:ints,int->ints':
    'A list and one number, list out. The number usually says how much, how far, or how many, and the output length often depends on it.',
  'fn:ints,ints->ints':
    'Two lists, one out. Ask whether they are being merged, compared, or indexed into each other, because the three look nothing alike in code.',
  'fn:int->int':
    'One number in, one out. There is no collection to walk, so the work is arithmetic or digits, and the loop condition is about the number shrinking.',
  'fn:int->ints':
    'One number decides how much to produce. It is a size or a count, so the loop is over what you are building, not over an input.',
  'fn:int->bool':
    'One number, yes or no. This is a property of the number itself, so think digits, divisibility, or bits.',
  'fn:int->string':
    'A number becomes text, so the answer is built up piece by piece, usually from the smallest unit upwards.',
  'fn:int->strings':
    'One number decides how many lines come out. The count drives the loop, and each pass decides its own line.',
  'fn:int,int->int':
    'Two numbers. Their relationship is the problem: difference, ratio, common factor, or the range between them.',
  'fn:string->int':
    'Text in, a number out, so you are counting or measuring something inside the string. Decide what one unit of that thing is first.',
  'fn:string->string':
    'Text in, text out. Decide whether you are building a new string or reading the original in a different order, because one costs memory and the other does not.',
  'fn:string->bool':
    'Text, yes or no. Usually a property you can check in one pass, and usually one that fails fast.',
  'fn:string,int->int':
    'A string and a number. The number is a length, a position, or a count of something to find.',
  'fn:string,int->string':
    'A string and a number, text out. The number nearly always says how far to move, how many to take, or where to cut.',
  'fn:string,string->bool':
    'Two strings, yes or no. Ask whether order matters between them: if it does not, counting characters is usually enough.',
  'fn:string,string->int':
    'Two strings, one number. You are measuring how they relate: shared parts, distance, or how many times one sits inside the other.',
  'fn:string,string->string':
    'Two strings in, one out. Either you are combining them or picking a part common to both.',
  'fn:strings->int':
    'A list of strings, one number out. Two levels to keep straight: across the list, and within each string.',
  'fn:strings->string':
    'Many strings, one out. You are selecting one of them or building a new one from all of them, and those are different loops.',
  'fn:strings->strings':
    'Strings in, strings out. Grouping is the usual shape here, and grouping means deciding what key two strings share.',
  'fn:matrix->int':
    'A grid, one number out. Be explicit about which index is the row and which the column before you write the loops.',
  'fn:matrix->ints':
    'A grid becomes a flat list, so the order you walk the grid is the answer.',
  'fn:matrix->bool':
    'A grid, yes or no. Usually a rule that must hold everywhere, so the first place it fails ends the work.',
  'fn:matrix->matrix':
    'Grid in, grid out. Decide whether you can write over the input or need a copy, because rotating or shifting in place needs care about read order.',
  'fn:matrix,int->int':
    'A grid and a number. The number is usually a target to find or a limit on how far you may move.',
  'fn:tree->int':
    'A tree, one number out. Every tree answer is built from the answers of the two children, so decide what one node contributes.',
  'fn:tree->bool':
    'A tree, yes or no. A rule that must hold at every node, which means you need what to pass down as well as what to return up.',
  'fn:tree->ints':
    'A tree becomes a flat list, so the traversal order is the whole answer. Name the order you want before you write it.',
  'fn:tree->tree':
    'A tree in, a tree out. You are rebuilding or rearranging links, so be clear about what each call returns before you use it.',
  'fn:tree,int->int':
    'A tree and a number. The number is usually a target, a depth, or a running total carried down through the calls.',
  'fn:list->int':
    'A linked list, one number out. You cannot index into it, so everything is "walk from here, remembering what you passed".',
  'fn:list->list':
    'A linked list in and out, which means you are rewiring links rather than moving values. A dummy head removes most of the special cases.',
  'fn:list,int->list':
    'A linked list and a number. The number counts positions, so two pointers a fixed distance apart usually beats counting the length first.',
  'fn:list,list->list':
    'Two linked lists, one out. Walk both at once and decide at each step which one advances.',
  'cls:stack':
    'You are building the structure, not using one. Decide which end everything happens at, and every operation becomes obvious.',
  'cls:queue':
    'You are building the structure. Things enter one end and leave the other, so the two ends need separate bookkeeping.',
  'cls:deque':
    'Both ends are live. Every operation has a mirror image, so write one end and reflect it.',
  'cls:dynamic-array':
    'You own the storage. The interesting part is what happens when it is full, and how often that costs you.',
  'cls:hash-set':
    'You are building the lookup itself. Decide how a value becomes a slot, and what happens when two values want the same one.',
  'cls:hash-map':
    'You are building the map, not using one. A key has to become a slot, and two keys wanting the same slot is the whole problem.',
  'cls:bst':
    'You own the tree. Every operation is "compare, then go left or right", and the interesting part is what happens at the node that is missing.',
  'cls:min-heap':
    'You maintain one guarantee: the smallest is on top. Every operation is about restoring that after the shape changes.',
  'cls:priority-queue':
    'Order of service, not order of arrival. Decide what "most important" means here, then keep that cheap to find.',
  'cls:union-find':
    'Groups that merge. Keep one representative per group, and two things are connected exactly when they share it.',
  'cls:linked-list':
    'You own the links. Nothing can be indexed, so every operation is a walk, and a dummy head removes most of the special cases.',
  'cls:trie':
    'One node per character, shared prefixes shared. The subtlety is marking where a whole word ends, separately from where a path continues.',
  'cls:graph':
    'You own the adjacency. Decide how a node finds its neighbours before writing anything that walks them.',
  'cls:lru-cache':
    'Two requirements at once: find by key, and know what was used longest ago. One structure cannot do both, so you need two that stay in step.',
  'cls:lfu-cache':
    'Eviction is by how often, not how recently, which means counts change on every read and the ordering has to follow.',
};

/** How many hints every problem has. Fixed, so the UI can say "1 of 3". */
export const HINT_COUNT = 3;

/** Just enough of a test case to reason about its shape. */
export interface HintCase {
  stdin: string;
  expectedStdout: string;
}

type HintSource = Pick<
  Problem,
  'hints' | 'patternFamily' | 'patternTags' | 'signatureId' | 'title'
>;

/**
 * The arguments of one case, split the way the driver actually reads them.
 *
 * This is load-bearing, and the first version of this file got it wrong. A
 * `fn:ints,int->int` case looks like:
 *
 *     1 2 2 3
 *     2
 *
 * The list is line one and the target is line two. Splitting the whole of
 * stdin on whitespace folds the target into the list, which produced
 * confidently wrong hints: a target of 2 next to a 2 in the list became "a
 * check repeats a value", and a negative target became "negative numbers are
 * in the checks". A hint that names a boundary the problem does not have is
 * worse than a generic one, because the learner goes looking for it.
 */
function argumentLines(stdin: string): string[] {
  return stdin.split('\n').map((line) => line.trim());
}

/** The numbers on one line, or null when that line is not numeric. */
function numbersOn(line: string): number[] | null {
  if (line === '') return [];
  const numbers = line.split(/\s+/).filter(Boolean).map(Number);
  return numbers.every((n) => Number.isFinite(n)) ? numbers : null;
}

/**
 * The collection argument only, never the scalars that follow it.
 *
 * Returns null for signatures whose first argument is not a list of numbers,
 * so no caller can accidentally reason about a string or an operation script
 * as though it were numeric.
 */
export function primaryList(signatureId: string, stdin: string): number[] | null {
  if (!signatureId.startsWith('fn:ints')) return null;
  const [first = ''] = argumentLines(stdin);
  return numbersOn(first);
}

/** Class-building problems feed an operation script rather than arguments. */
function isClassProblem(signatureId: string): boolean {
  return signatureId.startsWith('cls:');
}

/**
 * The operations in a class problem's script, lowercased, in order.
 *
 * The first line is a count and the second names the class, so both are
 * dropped: what is left is the sequence that actually exercises the structure.
 */
function operations(stdin: string): string[] {
  return argumentLines(stdin)
    .slice(2)
    .map((line) => line.split(/\s+/)[0]?.toLowerCase() ?? '')
    .filter(Boolean);
}

/** Collapse a case to one short line, so it can be quoted inside a hint. */
function oneLine(text: string, limit = 48): string {
  const flat = text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' / ');
  return flat.length > limit ? flat.slice(0, limit - 1) + '…' : flat;
}

/**
 * What makes one case worth tracing by hand, if anything does.
 *
 * Returned as a clause rather than a sentence, so the caller can attach it to
 * the case it belongs to. Ordered by how often each one is the real reason a
 * solution fails rather than by how easy it is to detect: an empty input
 * silently returns whatever you initialised, which is both the commonest miss
 * and the hardest to notice, so it goes first.
 */
function whyThisCase(signatureId: string, kase: HintCase): string | null {
  const lines = argumentLines(kase.stdin);
  const expected = kase.expectedStdout.trim();
  const list = primaryList(signatureId, kase.stdin);

  if (kase.stdin.trim() === '' || (list !== null && list.length === 0)) {
    return 'it passes nothing at all, so the loop never runs and whatever you initialised is what gets returned';
  }
  if (list !== null) {
    if (list.length === 1) {
      return 'it passes a single value, so anything written around comparing neighbours has no neighbour on that row';
    }
    if (list.some((n) => n < 0)) {
      return 'the values go negative, which breaks anything that starts a running maximum at zero';
    }
    if (new Set(list).size < list.length) {
      return 'a value repeats, and whether a duplicate counts once or twice is a decision you have to make deliberately';
    }
    if (list.length >= 12) {
      return `it is the largest case at ${list.length} values, which is where a nested loop starts to show against the speed gate`;
    }
  }
  if (signatureId.startsWith('fn:string')) {
    const [text = ''] = lines;
    if (text.length === 1) {
      return 'it is a single character, so anything looking at pairs has no pair';
    }
    if (/\s/.test(text)) {
      return 'there is a space inside the text, which breaks anything that assumes a single word';
    }
    if (/[^a-zA-Z0-9\s]/.test(text)) {
      return 'it contains characters that are neither letters nor digits, and you have to decide what those count as';
    }
  }
  if (isClassProblem(signatureId)) {
    const ops = operations(kase.stdin);
    const counts = new Map<string, number>();
    for (const op of ops) counts.set(op, (counts.get(op) ?? 0) + 1);

    const removal = ops.find((op) => /remove|delete|pop|evict/.test(op));
    if (removal && ops.indexOf(removal) < ops.length - 1) {
      return `it calls ${removal} and then keeps going, so the structure has to stay correct after something leaves it`;
    }
    const repeated = [...counts.entries()].find(([, n]) => n > 1);
    if (repeated) {
      return `it calls ${repeated[0]} ${repeated[1]} times, so the later call has to cope with what the earlier one left behind`;
    }
  }
  if (expected === '0') {
    return 'it expects 0, which is easy to lose if the code reports "nothing found" some other way';
  }
  if (expected === '-1') {
    return 'it expects -1, the "no answer" signal here, so that path has to exist rather than falling off the end';
  }
  if (expected === '') {
    return 'it expects no output at all, which has to be a deliberate branch rather than an accident';
  }
  return null;
}

/**
 * The third hint: one of this problem's own checks, quoted, worth tracing.
 *
 * This replaced a per-family sentence about complexity, and then replaced a
 * per-*category* sentence about boundaries. Both were true of dozens of
 * problems at once and so felt canned, which was the original complaint that
 * the hints were all the same. Quoting the real input and expected output
 * fixes that structurally, because no two problems have the same test data.
 *
 * It is also simply the better hint. "Negative numbers are in the checks" is
 * a fact to file away. "Trace `-5 5` expecting `0` by hand" is an instruction
 * that can be carried out immediately, and tracing one concrete case is how
 * most people actually find their own bug.
 */
export function traceHint(signatureId: string, cases: readonly HintCase[]): string | null {
  if (cases.length === 0) return null;

  const scored = cases.map((kase) => ({ kase, why: whyThisCase(signatureId, kase) }));
  const chosen = scored.find((entry) => entry.why !== null) ?? scored[0]!;
  const { kase, why } = chosen;

  // A class problem's input is a script of twenty-odd operations. Quoting it
  // truncated reads worse than not quoting it at all, so name its shape and
  // let the reason clause carry the specifics.
  if (isClassProblem(signatureId)) {
    const ops = operations(kase.stdin);
    const lead =
      'Walk the first check through by hand before writing anything: ' +
      ops.length +
      ' operations, beginning ' +
      ops.slice(0, 4).join(', ');
    return why ? lead + '. It is the one worth picking because ' + why + '.' : lead + '.';
  }

  const input = kase.stdin.trim() === '' ? 'nothing' : '`' + oneLine(kase.stdin) + '`';
  const expected =
    kase.expectedStdout.trim() === '' ? 'nothing' : '`' + oneLine(kase.expectedStdout) + '`';
  const lead =
    'Work this check through by hand before writing anything. It is given ' +
    input +
    ' and must produce ' +
    expected;
  return why ? lead + ', and it is the one worth picking because ' + why + '.' : lead + '.';
}

/**
 * Make sure no two hints are the same sentence.
 *
 * The layers draw from overlapping sources, so a problem whose tag hint and
 * signature hint happen to coincide would otherwise show the same text twice,
 * which is exactly the complaint this change exists to fix.
 */
function dedupe(
  hints: readonly [string, string, string],
  family: readonly [string, string, string],
  tagHints: readonly string[],
): [string, string, string] {
  const out: string[] = [];
  for (const [i, hint] of hints.entries()) {
    if (!out.includes(hint)) {
      out.push(hint);
      continue;
    }
    const alternative = [...tagHints, ...family].find((candidate) => !out.includes(candidate));
    out.push(alternative ?? family[i]!);
  }
  return [out[0]!, out[1]!, out[2]!];
}

/**
 * The three hints for a problem, authored ones taking precedence.
 *
 * Three layers, each read from something that differs between problems:
 *
 *   1. **What kind of problem this is**, from the most specific pattern tag
 *      the problem carries, falling back to its family.
 *   2. **What shape the work has**, from its signature, which says what you
 *      are handed and what you must produce.
 *   3. **Which of its own checks to trace**, quoted, with the reason that one
 *      is the revealing one.
 *
 * The version before this used the family for all three and substituted one
 * tag, so every problem in a family read identically. Authored hints still
 * override position by position: someone who wrote a good first hint and left
 * the rest gets their first plus derived seconds and thirds, not
 * all-or-nothing.
 */
export function hintsFor(problem: HintSource, cases: readonly HintCase[] = []): string[] {
  const family = BY_FAMILY[problem.patternFamily];
  const tagHints = problem.patternTags
    .map((tag) => BY_TAG[tag])
    .filter((hint): hint is string => Boolean(hint));

  const concept = tagHints[0] ?? family[0];
  const shape = BY_SIGNATURE[problem.signatureId] ?? tagHints[1] ?? family[1];
  const trace = traceHint(problem.signatureId, cases) ?? family[2];

  const derived = dedupe([concept, shape, trace], family, tagHints);
  const authored = problem.hints ?? [];
  return derived.map((fallback, i) => authored[i]?.trim() || fallback);
}

/** One hint by index, or null when the index falls outside the trio. */
export function hintAt(
  problem: HintSource,
  index: number,
  cases: readonly HintCase[] = [],
): string | null {
  if (!Number.isInteger(index) || index < 0 || index >= HINT_COUNT) return null;
  return hintsFor(problem, cases)[index] ?? null;
}
