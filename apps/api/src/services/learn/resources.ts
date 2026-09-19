import type { PatternFamily } from '@prisma/client';
import type { LessonSource, ResourceEntry } from './catalog.js';

/**
 * Reading for the pattern families that have no in-app lesson yet.
 *
 * Every family beyond the foundations is listed so a recommendation can never
 * fall off the end of the catalog into nothing, and every entry says plainly
 * that it is a reading list rather than a lesson. Sources are the pages most
 * likely to still be right in a year: language reference manuals for the
 * data structures, and MIT 6.006 (OpenCourseWare, freely available) for the
 * algorithmic ideas. Where 6.006 is cited, `section` names the lecture as
 * the course lists it; the URL is the course page, not a deep link that may
 * move.
 */

const REVIEWED = '2026-09-18';

const link = (publisher: string, title: string, url: string, section: string): LessonSource => ({
  publisher,
  title,
  url,
  section,
  runtime: 'concept',
  reviewedOn: REVIEWED,
  adaptation: 'original',
  permission: 'link-only',
});

const OCW = 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/';
const ocw = (section: string) => link('MIT OpenCourseWare', '6.006 Introduction to Algorithms, Spring 2020', OCW, section);
const py = (title: string, path: string, section: string) =>
  link('Python Software Foundation', title, `https://docs.python.org/3.13/${path}`, section);
const cpp = (title: string, path: string, section: string) => link('cppreference.com', title, `https://en.cppreference.com/w/cpp/${path}`, section);

const entry = (family: PatternFamily, title: string, summary: string, resources: LessonSource[]): ResourceEntry => ({
  family,
  coverage: 'resources_only',
  title,
  summary,
  resources,
});

export const RESOURCES: readonly ResourceEntry[] = [
  entry(
    'ARRAYS_HASHING',
    'Arrays and hashing',
    'Looking things up by key in constant time, and the trade-off that makes it possible. The foundation lesson on combining a loop with a map is the in-app starting point.',
    [ocw('Lecture 4: Hashing'), py('The Python Tutorial — Data Structures', 'tutorial/datastructures.html#dictionaries', 'Dictionaries')],
  ),
  entry(
    'TWO_POINTERS',
    'Two pointers',
    'Walking a sequence from both ends, or with two positions that move at different speeds, so one pass replaces a nested loop.',
    [ocw('Lecture 2: Data Structures — sequence interface'), ocw('Lecture 3: Sorting — two-finger merge')],
  ),
  entry(
    'SLIDING_WINDOW',
    'Sliding window',
    'Keeping a running summary of a contiguous range while its ends move, so the summary is updated rather than recomputed.',
    [ocw('Lecture 2: Data Structures — sequence interface'), py('Built-in Types', 'library/stdtypes.html#common-sequence-operations', 'Slicing and the cost of s[i:j]')],
  ),
  entry(
    'STACK',
    'Stacks',
    'Last in, first out: matching brackets, undo, and any problem where the most recent unfinished thing is the next thing to finish.',
    [py('The Python Tutorial — Data Structures', 'tutorial/datastructures.html#using-lists-as-stacks', 'Using Lists as Stacks'), cpp('std::stack', 'container/stack', 'Member functions')],
  ),
  entry(
    'BINARY_SEARCH',
    'Binary search',
    'Halving a sorted range until one candidate remains, and the boundary conditions that make the loop stop where it should.',
    [ocw('Lecture 3: Sorting — binary search on a sorted array'), py('bisect — Array bisection algorithm', 'library/bisect.html', 'bisect_left and bisect_right')],
  ),
  entry(
    'LINKED_LIST',
    'Linked lists',
    'Nodes that point to the next node, so inserting in the middle is cheap and finding position k is not.',
    [ocw('Lecture 2: Data Structures — linked list sequence'), cpp('std::forward_list', 'container/forward_list', 'Description')],
  ),
  entry(
    'TREES',
    'Trees',
    'Hierarchies with a root, and the recursive walks that visit every node once.',
    [ocw('Lecture 6: Binary Trees, Part 1'), ocw('Lecture 7: Binary Trees, Part 2 — AVL')],
  ),
  entry(
    'TRIES',
    'Tries',
    'A tree keyed one character per level, so every word with a common prefix shares a path.',
    [ocw('Lecture 6: Binary Trees, Part 1 — tree traversal as the foundation'), link('The Go Authors', 'Go maps in action', 'https://go.dev/blog/maps', 'Key types — what a map can and cannot key on, which is why a trie exists')],
  ),
  entry(
    'HEAP_PRIORITY_QUEUE',
    'Heaps and priority queues',
    'Always able to hand you the smallest (or largest) item next, with each insert and removal costing a logarithm.',
    [ocw('Lecture 8: Binary Heaps'), py('heapq — Heap queue algorithm', 'library/heapq.html', 'Basic Examples')],
  ),
  entry(
    'BACKTRACKING',
    'Backtracking',
    'Building a candidate one choice at a time and undoing the last choice when it cannot lead anywhere.',
    [ocw('Lecture 10: Depth-First Search'), ocw('Lecture 15: Dynamic Programming, Part 1 — recursive problem framing')],
  ),
  entry(
    'GRAPHS',
    'Graphs',
    'Nodes and edges, and the two searches — breadth-first and depth-first — that most graph problems are dressed-up versions of.',
    [ocw('Lecture 9: Breadth-First Search'), ocw('Lecture 10: Depth-First Search')],
  ),
  entry(
    'ADVANCED_GRAPHS',
    'Weighted graphs and shortest paths',
    'Shortest paths when edges carry weights, and the conditions under which each algorithm is allowed.',
    [ocw('Lecture 11: Weighted Shortest Paths'), ocw('Lecture 12: Bellman-Ford'), ocw('Lecture 13: Dijkstra')],
  ),
  entry(
    'DP_1D',
    'Dynamic programming in one dimension',
    'Answering a problem by remembering the answers to smaller versions of it, in the order that makes each answer available when needed.',
    [ocw('Lecture 15: Dynamic Programming, Part 1'), ocw('Lecture 16: Dynamic Programming, Part 2')],
  ),
  entry(
    'DP_2D',
    'Dynamic programming in two dimensions',
    'The same idea over a grid of subproblems, where the order of filling the grid is most of the work.',
    [ocw('Lecture 17: Dynamic Programming, Part 3'), ocw('Lecture 18: Dynamic Programming, Part 4')],
  ),
  entry(
    'GREEDY',
    'Greedy choices',
    'Taking the locally best option at each step, which is only correct for problems with a particular structure — and proving that structure is the real work.',
    [ocw('Lecture 13: Dijkstra — a greedy algorithm with a proof'), ocw('Lecture 3: Sorting — the ordering that greedy choices depend on')],
  ),
  entry(
    'INTERVALS',
    'Intervals',
    'Sorting ranges by one endpoint and then sweeping, which turns overlap questions into a single pass.',
    [ocw('Lecture 3: Sorting'), py('Built-in Functions', 'library/functions.html#sorted', 'sorted() with a key function')],
  ),
  entry(
    'MATH_GEOMETRY',
    'Maths and geometry',
    'Integer arithmetic, remainders and coordinates, where the difficulty is usually in the edge cases rather than the algorithm.',
    [py('Built-in Types', 'library/stdtypes.html#numeric-types-int-float-complex', 'Numeric Types — floor division and modulo'), cpp('Arithmetic operators', 'language/operator_arithmetic', 'Multiplicative operators')],
  ),
  entry(
    'BIT_MANIPULATION',
    'Bit manipulation',
    'Treating an integer as a row of switches: masking, shifting, and counting set bits.',
    [py('Built-in Types', 'library/stdtypes.html#bitwise-operations-on-integer-types', 'Bitwise Operations on Integer Types'), cpp('Arithmetic operators', 'language/operator_arithmetic', 'Bitwise logic operators; bitwise shift operators')],
  ),
  entry(
    'DATA_STRUCTURES',
    'Building the structures yourself',
    'Implementing a stack, queue, heap or hash table from parts, so their costs stop being facts to memorise.',
    [ocw('Lecture 2: Data Structures'), ocw('Lecture 4: Hashing'), ocw('Lecture 8: Binary Heaps')],
  ),
];
