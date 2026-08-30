/**
 * The I/O signature registry.
 *
 * Every problem in the corpus references one entry here by `signatureId`, and
 * its driver and starter stubs are generated from that entry. This is the file
 * that makes ~695 problems tractable: the arithmetic is 695 harnesses authored
 * naively against roughly 30 authored once.
 *
 * Adding a signature is a real cost — six languages, six stubs, and a round of
 * cross-language testing — so a new entry has to serve a family of problems,
 * not one problem that found a shape convenient. When in doubt, reshape the
 * problem to fit an existing signature.
 */
import { buildDrivers, buildStubs } from './drivers.js';
import type { ClassSignature, FunctionSignature, PerLanguage, Signature } from './types.js';

const fn = (
  id: string,
  description: string,
  params: FunctionSignature['params'],
  returns: FunctionSignature['returns'],
): FunctionSignature => ({ kind: 'function', id, description, params, returns });

const cls = (
  id: string,
  description: string,
  className: string,
  ctorParams: ClassSignature['ctorParams'],
  methods: ClassSignature['methods'],
): ClassSignature => ({ kind: 'class', id, description, className, ctorParams, methods });

/**
 * Free-function signatures — Tiers 0, 1, 2, 3.
 *
 * Naming is `fn:<params>-><returns>`, mechanical on purpose: the id should be
 * checkable against the shape at a glance during review, because a problem
 * pointed at the wrong signature fails in the judge, under a lock, in front of
 * the user.
 */
const FUNCTION_SIGNATURES: readonly FunctionSignature[] = [
  // Arrays & hashing, two pointers, sliding window, binary search, DP, greedy
  fn('fn:ints->int', 'int array in, single int out', ['int[]'], 'int'),
  fn('fn:ints->ints', 'int array in, int array out', ['int[]'], 'int[]'),
  fn('fn:ints->bool', 'int array in, boolean out', ['int[]'], 'bool'),
  fn('fn:ints->matrix', 'int array in, list of int lists out', ['int[]'], 'int[][]'),
  fn('fn:ints->double', 'int array in, real number out (median, average)', ['int[]'], 'double'),
  fn('fn:ints,int->int', 'int array and a scalar in, int out', ['int[]', 'int'], 'int'),
  fn('fn:ints,int->ints', 'int array and a scalar in, int array out', ['int[]', 'int'], 'int[]'),
  fn('fn:ints,int->bool', 'int array and a scalar in, boolean out', ['int[]', 'int'], 'bool'),
  fn('fn:ints,ints->ints', 'two int arrays in, int array out', ['int[]', 'int[]'], 'int[]'),

  // Strings
  fn('fn:string->int', 'string in, int out', ['string'], 'int'),
  fn('fn:string->string', 'string in, string out', ['string'], 'string'),
  fn('fn:string->bool', 'string in, boolean out', ['string'], 'bool'),
  fn('fn:string->strings', 'string in, list of strings out', ['string'], 'string[]'),
  fn('fn:string,int->string', 'string and a scalar in, string out', ['string', 'int'], 'string'),
  fn('fn:string,int->int', 'string and a scalar in, int out', ['string', 'int'], 'int'),
  fn('fn:string,string->bool', 'two strings in, boolean out', ['string', 'string'], 'bool'),
  fn(
    'fn:string,string->int',
    'two strings in, int out (edit distance, longest common subsequence)',
    ['string', 'string'],
    'int',
  ),
  fn('fn:string,string->string', 'two strings in, string out', ['string', 'string'], 'string'),
  fn('fn:strings->string', 'list of strings in, string out', ['string[]'], 'string'),
  fn('fn:strings->strings', 'list of strings in, list of strings out', ['string[]'], 'string[]'),
  fn('fn:strings->int', 'list of strings in, int out', ['string[]'], 'int'),

  // Scalars — Tier 0 arithmetic and bit manipulation
  fn('fn:int->int', 'single int in, single int out', ['int'], 'int'),
  fn('fn:int->bool', 'single int in, boolean out', ['int'], 'bool'),
  fn('fn:int->ints', 'single int in, int array out', ['int'], 'int[]'),
  fn('fn:int->string', 'single int in, string out (roman numerals)', ['int'], 'string'),
  fn('fn:int->strings', 'single int in, list of strings out (FizzBuzz to n)', ['int'], 'string[]'),
  fn('fn:int,int->int', 'two ints in, int out', ['int', 'int'], 'int'),

  // Matrices, grids, intervals, and adjacency-list graphs.
  // A graph is an int[][] — edge list or adjacency list depending on the
  // problem. One representation, one codec; the statement says which.
  fn('fn:matrix->int', 'matrix or edge list in, int out', ['int[][]'], 'int'),
  fn('fn:matrix->bool', 'matrix or edge list in, boolean out', ['int[][]'], 'bool'),
  fn('fn:matrix->ints', 'matrix or edge list in, int array out', ['int[][]'], 'int[]'),
  fn('fn:matrix->matrix', 'matrix in, matrix out (rotate, merge intervals)', ['int[][]'], 'int[][]'),
  fn('fn:matrix,int->int', 'graph and a source vertex in, int out', ['int[][]', 'int'], 'int'),
  fn('fn:matrix,int->ints', 'graph and a source vertex in, int array out', ['int[][]', 'int'], 'int[]'),

  // Trees
  fn('fn:tree->int', 'binary tree in, int out (depth, sum, count)', ['tree'], 'int'),
  fn('fn:tree->ints', 'binary tree in, int array out (traversals)', ['tree'], 'int[]'),
  fn('fn:tree->bool', 'binary tree in, boolean out (balanced, valid BST)', ['tree'], 'bool'),
  fn('fn:tree->tree', 'binary tree in, binary tree out (invert, prune)', ['tree'], 'tree'),
  fn('fn:tree,int->tree', 'binary tree and a scalar in, binary tree out (insert, delete)', ['tree', 'int'], 'tree'),
  fn('fn:tree,int->int', 'binary tree and a scalar in, int out', ['tree', 'int'], 'int'),

  // Linked lists
  fn('fn:list->list', 'linked list in, linked list out (reverse, sort)', ['list'], 'list'),
  fn('fn:list->bool', 'linked list in, boolean out (cycle, palindrome)', ['list'], 'bool'),
  fn('fn:list->int', 'linked list in, int out', ['list'], 'int'),
  fn('fn:list,int->list', 'linked list and a scalar in, linked list out', ['list', 'int'], 'list'),
  fn('fn:list,list->list', 'two linked lists in, linked list out (merge, add)', ['list', 'list'], 'list'),
];

/**
 * Class signatures — Tier 0.5, "build the structure".
 *
 * These are the reason the operation-log driver exists. The rationale from the
 * brief holds: pattern-matching without knowing *why* a hashmap is O(1)
 * collapses under interview follow-ups, and the way to know is to have built one.
 *
 * Method names are the contract. They appear in the generated stub, so the user
 * never has to guess what the judge will call — and they are, deliberately, the
 * conventional names, so what is learned here transfers.
 */
const CLASS_SIGNATURES: readonly ClassSignature[] = [
  cls('cls:dynamic-array', 'Growable array over a fixed buffer', 'DynamicArray', [], [
    { name: 'push', params: ['int'], returns: 'void' },
    { name: 'pop', params: [], returns: 'int' },
    { name: 'get', params: ['int'], returns: 'int' },
    { name: 'set', params: ['int', 'int'], returns: 'void' },
    { name: 'size', params: [], returns: 'int' },
  ]),
  cls('cls:stack', 'LIFO stack', 'Stack', [], [
    { name: 'push', params: ['int'], returns: 'void' },
    { name: 'pop', params: [], returns: 'int' },
    { name: 'peek', params: [], returns: 'int' },
    { name: 'isEmpty', params: [], returns: 'bool' },
    { name: 'size', params: [], returns: 'int' },
  ]),
  cls('cls:queue', 'FIFO queue', 'Queue', [], [
    { name: 'enqueue', params: ['int'], returns: 'void' },
    { name: 'dequeue', params: [], returns: 'int' },
    { name: 'peek', params: [], returns: 'int' },
    { name: 'isEmpty', params: [], returns: 'bool' },
    { name: 'size', params: [], returns: 'int' },
  ]),
  cls('cls:deque', 'Double-ended queue', 'Deque', [], [
    { name: 'pushFront', params: ['int'], returns: 'void' },
    { name: 'pushBack', params: ['int'], returns: 'void' },
    { name: 'popFront', params: [], returns: 'int' },
    { name: 'popBack', params: [], returns: 'int' },
    { name: 'size', params: [], returns: 'int' },
  ]),
  cls('cls:linked-list', 'Singly linked list', 'LinkedList', [], [
    { name: 'addFirst', params: ['int'], returns: 'void' },
    { name: 'addLast', params: ['int'], returns: 'void' },
    { name: 'removeFirst', params: [], returns: 'int' },
    { name: 'get', params: ['int'], returns: 'int' },
    { name: 'size', params: [], returns: 'int' },
    { name: 'toArray', params: [], returns: 'int[]' },
  ]),
  cls('cls:hash-map', 'Hash table — chaining, then open addressing', 'HashMap', [], [
    { name: 'put', params: ['int', 'int'], returns: 'void' },
    { name: 'get', params: ['int'], returns: 'int' },
    { name: 'remove', params: ['int'], returns: 'void' },
    { name: 'containsKey', params: ['int'], returns: 'bool' },
    { name: 'size', params: [], returns: 'int' },
  ]),
  cls('cls:hash-set', 'Hash set', 'HashSet', [], [
    { name: 'add', params: ['int'], returns: 'void' },
    { name: 'contains', params: ['int'], returns: 'bool' },
    { name: 'remove', params: ['int'], returns: 'void' },
    { name: 'size', params: [], returns: 'int' },
  ]),
  cls('cls:lru-cache', 'Least-recently-used cache with a capacity bound', 'LRUCache', ['int'], [
    { name: 'get', params: ['int'], returns: 'int' },
    { name: 'put', params: ['int', 'int'], returns: 'void' },
  ]),
  cls('cls:lfu-cache', 'Least-frequently-used cache with a capacity bound', 'LFUCache', ['int'], [
    { name: 'get', params: ['int'], returns: 'int' },
    { name: 'put', params: ['int', 'int'], returns: 'void' },
  ]),
  cls('cls:bst', 'Binary search tree', 'BST', [], [
    { name: 'insert', params: ['int'], returns: 'void' },
    { name: 'contains', params: ['int'], returns: 'bool' },
    { name: 'remove', params: ['int'], returns: 'void' },
    { name: 'inorder', params: [], returns: 'int[]' },
  ]),
  cls('cls:trie', 'Prefix tree', 'Trie', [], [
    { name: 'insert', params: ['string'], returns: 'void' },
    { name: 'search', params: ['string'], returns: 'bool' },
    { name: 'startsWith', params: ['string'], returns: 'bool' },
  ]),
  cls('cls:min-heap', 'Binary min-heap with sift-up and sift-down', 'MinHeap', [], [
    { name: 'push', params: ['int'], returns: 'void' },
    { name: 'pop', params: [], returns: 'int' },
    { name: 'peek', params: [], returns: 'int' },
    { name: 'size', params: [], returns: 'int' },
  ]),
  cls('cls:priority-queue', 'Priority queue over (value, priority) pairs', 'PriorityQueue', [], [
    { name: 'push', params: ['int', 'int'], returns: 'void' },
    { name: 'pop', params: [], returns: 'int' },
    { name: 'peek', params: [], returns: 'int' },
    { name: 'size', params: [], returns: 'int' },
  ]),
  cls('cls:union-find', 'Disjoint set — path compression and union by rank', 'UnionFind', ['int'], [
    { name: 'unite', params: ['int', 'int'], returns: 'void' },
    { name: 'find', params: ['int'], returns: 'int' },
    { name: 'connected', params: ['int', 'int'], returns: 'bool' },
    { name: 'count', params: [], returns: 'int' },
  ]),
  cls('cls:graph', 'Adjacency-list graph with traversals', 'Graph', ['int'], [
    { name: 'addEdge', params: ['int', 'int'], returns: 'void' },
    { name: 'neighbors', params: ['int'], returns: 'int[]' },
    { name: 'bfs', params: ['int'], returns: 'int[]' },
    { name: 'dfs', params: ['int'], returns: 'int[]' },
  ]),
];

export const SIGNATURES: readonly Signature[] = [...FUNCTION_SIGNATURES, ...CLASS_SIGNATURES];

const BY_ID = new Map<string, Signature>(SIGNATURES.map((s) => [s.id, s]));

/** Every signature id, for the importer's validation and for the docs table. */
export const SIGNATURE_IDS: readonly string[] = SIGNATURES.map((s) => s.id);

/**
 * Look up a signature, or throw.
 *
 * Throws rather than returning undefined because the caller is the importer,
 * and a problem referencing a signature that does not exist must fail ingestion
 * loudly — the alternative is an INACTIVE row nobody notices until the corpus is
 * mysteriously short.
 */
export function getSignature(id: string): Signature {
  const sig = BY_ID.get(id);
  if (!sig) {
    throw new Error(`Unknown signatureId "${id}". Known ids: ${SIGNATURE_IDS.join(', ')}`);
  }
  return sig;
}

/** The driver set a problem with this signature should be stored with. */
export function driversFor(id: string): PerLanguage {
  return buildDrivers(getSignature(id));
}

/** The starter-code set a problem with this signature should be stored with. */
export function stubsFor(id: string): PerLanguage {
  return buildStubs(getSignature(id));
}

/** Whether this signature uses the operation-log driver — the Tier 0.5 shape. */
export function isClassSignature(id: string): boolean {
  return getSignature(id).kind === 'class';
}
