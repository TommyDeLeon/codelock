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
const BY_FAMILY: Record<PatternFamily, readonly [string, string, string]> = {
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

/** How many hints every problem has. Fixed, so the UI can say "1 of 3". */
export const HINT_COUNT = 3;

type HintSource = Pick<Problem, 'hints' | 'patternFamily' | 'patternTags'>;

/**
 * The three hints for a problem, authored ones taking precedence.
 *
 * A partially authored row is honoured position by position rather than thrown
 * away: someone who wrote a good first hint and left the rest should get their
 * first hint plus derived seconds and thirds, not all-or-nothing.
 */
export function hintsFor(problem: HintSource): string[] {
  const derived = [...BY_FAMILY[problem.patternFamily]];

  const tagHint = problem.patternTags.map((tag) => BY_TAG[tag]).find(Boolean);
  if (tagHint) derived[1] = tagHint;

  const authored = problem.hints ?? [];
  return derived.map((fallback, i) => authored[i]?.trim() || fallback);
}

/** One hint by index, or null when the index falls outside the trio. */
export function hintAt(problem: HintSource, index: number): string | null {
  if (!Number.isInteger(index) || index < 0 || index >= HINT_COUNT) return null;
  return hintsFor(problem)[index] ?? null;
}
