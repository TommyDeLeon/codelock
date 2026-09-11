import type { PatternFamily } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

/**
 * Spaced retrieval of ideas already practised.
 *
 * A solve proves the idea worked once, with the problem in front of you and
 * the pattern freshly primed. It says nothing about next month. This module
 * is the other half: after a solve, that pattern family becomes due for a
 * short recall question on an expanding interval — 1, 3, 7, 16, 35, then 60
 * days, capped there — so the idea gets revisited before it has faded rather
 * than only when a later problem happens to reuse it.
 *
 * ## The one rule this module exists to enforce
 *
 * A correct recall advances one step. A wrong one moves this family back to
 * tomorrow and costs **nothing**: no points, no difficulty change, no effect
 * on the lock, no penalty anywhere in the product. Coming back sooner is how
 * spacing works, not a punishment. The owner is a beginner who
 * already struggles to persist, so a recall question that could also cost
 * them something would make the safest move avoiding it — and every returned
 * result says this in plain words, not just enforces it silently.
 *
 * ## Structure
 *
 * Same split as capabilities.ts: the schedule arithmetic and the question
 * selection are pure functions, exported so the one decision worth arguing
 * about — how the interval moves — is testable with no database in sight.
 * Thin database functions sit on top and are never fatal, the same discipline
 * learningLog.ts uses for recordStep: a failed read or write here must not be
 * able to cost the learner their main problem, or their screen.
 */

// ---------------------------------------------------------------------------
// Pure: schedule arithmetic
// ---------------------------------------------------------------------------

/** The expanding schedule, in days. Capped at the last value. */
const SCHEDULE_DAYS = [1, 3, 7, 16, 35, 60] as const;

export const MIN_INTERVAL_DAYS: number = SCHEDULE_DAYS[0];
export const MAX_INTERVAL_DAYS: number = SCHEDULE_DAYS[SCHEDULE_DAYS.length - 1]!;

/**
 * The next step after `currentDays`, capped at 60.
 *
 * Takes the first schedule value strictly greater than the current one,
 * rather than indexing by position, so a value that has drifted off the
 * exact five (it never should, but nothing enforces that at the type level)
 * still advances sensibly instead of throwing or silently stalling.
 */
export function nextIntervalDays(currentDays: number): number {
  const next = SCHEDULE_DAYS.find((d) => d > currentDays);
  return next ?? MAX_INTERVAL_DAYS;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export interface ScheduleState {
  intervalDays: number;
  streak: number;
  lapseCount: number;
}

export interface ScheduleUpdate extends ScheduleState {
  nextDueAt: Date;
}

/**
 * Apply one recall result to a schedule.
 *
 * Pure: given a state and an outcome, this is the entire arithmetic, and it
 * is the only place either branch is decided. Correct advances one step and
 * counts toward the current run of correct recalls. Wrong resets the interval
 * to one day and ends that run, because a run that survived a miss would be a
 * false number. `lapseCount` is a plain tally of how many times this family
 * has been missed, and nothing reads it back to turn it into a penalty.
 */
export function applyRecallResult(
  state: ScheduleState,
  correct: boolean,
  now: Date,
): ScheduleUpdate {
  if (correct) {
    const intervalDays = nextIntervalDays(state.intervalDays);
    return {
      intervalDays,
      streak: state.streak + 1,
      lapseCount: state.lapseCount,
      nextDueAt: addDays(now, intervalDays),
    };
  }
  // The streak resets, because it counts the current run of correct recalls
  // and a miss ends that run. Leaving it at four after getting one wrong would
  // make the stored number false, and a false number is worse for the learner
  // than a small one.
  //
  // This is not the punitive streak reset the design rules out. Nothing is
  // awarded for a streak and nothing is taken away here: no points, no
  // difficulty change, no effect on the lock. The only consequence of a miss
  // anywhere in the system is that this one family comes back tomorrow, which
  // is the point of spacing rather than a penalty for failing.
  return {
    intervalDays: MIN_INTERVAL_DAYS,
    streak: 0,
    lapseCount: state.lapseCount + 1,
    nextDueAt: addDays(now, MIN_INTERVAL_DAYS),
  };
}

/** The plain-words explanation of what a wrong answer did and did not do. */
export function recallOutcomeMessage(correct: boolean, nextDueInDays: number): string {
  if (correct) {
    return `Correct. This comes back in ${nextDueInDays} day${nextDueInDays === 1 ? '' : 's'}.`;
  }
  return (
    "Not quite, and that is all that happens. This one comes back tomorrow " +
    'instead of later, which is how spacing works rather than a penalty. Nothing ' +
    'else changes: no points, no difficulty change, and no effect on the lock.'
  );
}

// ---------------------------------------------------------------------------
// Pure: question bank and selection
// ---------------------------------------------------------------------------

export interface RecallQuestion {
  id: string;
  prompt: string;
  acceptedAnswers: readonly string[];
  /** Shown after answering, correct or not. */
  explanation: string;
}

/**
 * Two or three questions per family, in the voice of `BY_FAMILY` in hints.ts:
 * plain language, short sentences, nothing a beginner has not met. Each one
 * asks for the idea, not the code, and accepts the ordinary way a beginner
 * would say it.
 */
export const QUESTIONS_BY_FAMILY: Record<PatternFamily, readonly RecallQuestion[]> = {
  ARRAYS_HASHING: [
    {
      id: 'arrays_hashing_1',
      prompt:
        "You need to check whether you've already seen a value, and answer fast. What structure do you reach for?",
      acceptedAnswers: ['hash map', 'hashmap', 'hash table', 'map', 'dictionary', 'dict'],
      explanation:
        'A hash map lets you check whether something has already been seen in roughly constant time, instead of scanning back through everything stored so far.',
    },
    {
      id: 'arrays_hashing_2',
      prompt: 'Why is checking a hash map usually faster than scanning an array for the same value?',
      acceptedAnswers: [
        'constant time',
        'o(1)',
        'it looks up by key instead of scanning',
        'lookup is instant',
        "because it doesn't need to scan",
        'it does not need to scan',
      ],
      explanation:
        "A hash map looks a value up directly by its key, so the check doesn't depend on how many items are stored — an array scan does.",
    },
  ],
  TWO_POINTERS: [
    {
      id: 'two_pointers_1',
      prompt:
        'On a sorted array, looking for a pair that sums to a target: if the current sum is too small, which pointer moves?',
      acceptedAnswers: ['left', 'the left pointer', 'move left pointer', 'left one'],
      explanation:
        'Moving the left pointer forward increases the sum, since the array is sorted and later values are larger.',
    },
    {
      id: 'two_pointers_2',
      prompt: 'What does a two-pointer approach usually replace?',
      acceptedAnswers: ['a nested loop', 'nested loops', 'two nested loops'],
      explanation:
        'Two pointers moving through the data once, instead of one loop inside another, is what turns an O(n²) scan into an O(n) one.',
    },
  ],
  SLIDING_WINDOW: [
    {
      id: 'sliding_window_1',
      prompt: 'When your sliding window becomes invalid, which side do you shrink from?',
      acceptedAnswers: ['left', 'the left side', 'the left', 'shrink from the left'],
      explanation:
        'You grow the window on the right and shrink it from the left, so each element still enters and leaves at most once.',
    },
    {
      id: 'sliding_window_2',
      prompt: 'What do you keep in a variable instead of re-scanning the whole window each step?',
      acceptedAnswers: [
        'a running summary',
        'a running total',
        'a running sum',
        'running count',
        'a running value',
      ],
      explanation:
        'Keeping a running summary in a variable is what keeps a sliding window at one pass instead of re-scanning it every time it moves.',
    },
  ],
  STACK: [
    {
      id: 'stack_1',
      prompt: 'A stack is the right tool when something has to do what, before it can be resolved?',
      acceptedAnswers: ['wait', 'wait for something later', 'wait for later'],
      explanation:
        'A stack holds unresolved items until the thing they were waiting for finally arrives, then resolves them in reverse order.',
    },
    {
      id: 'stack_2',
      prompt: 'What order does a stack give items back in?',
      acceptedAnswers: [
        'last in first out',
        'lifo',
        'last-in-first-out',
        'the reverse order they went in',
        'reverse order',
      ],
      explanation: 'A stack is last-in-first-out: the most recently pushed item is the first one popped.',
    },
  ],
  BINARY_SEARCH: [
    {
      id: 'binary_search_1',
      prompt: 'Binary search only works on data that is what?',
      acceptedAnswers: ['sorted', 'ordered', 'in order'],
      explanation:
        'Binary search discards half the remaining space at each step, which is only safe when the data is ordered.',
    },
    {
      id: 'binary_search_2',
      prompt: 'Each step of binary search discards about how much of the remaining search space?',
      acceptedAnswers: ['half', 'one half', '50%', 'about half'],
      explanation: 'Halving the search space every step is what gives binary search its speed.',
    },
  ],
  LINKED_LIST: [
    {
      id: 'linked_list_1',
      prompt: "Why can't you jump straight to the 5th node of a linked list, the way you would with an array?",
      acceptedAnswers: [
        "you can't index into it",
        'you cannot index into it',
        'no indexing',
        'you have to walk from the start',
        "there's no index",
        'there is no index',
      ],
      explanation:
        'A linked list has no index — you can only get anywhere by walking from a node you already hold, following its links.',
    },
    {
      id: 'linked_list_2',
      prompt: 'What kind of extra node removes most of the special-casing around the first element?',
      acceptedAnswers: ['a dummy head', 'dummy node', 'a dummy head node', 'sentinel node', 'dummy head node'],
      explanation:
        'A dummy head node gives every real node a predecessor, so inserting or removing at the front needs no special case.',
    },
  ],
  TREES: [
    {
      id: 'trees_1',
      prompt: 'A typical tree problem is really the same question asked of what?',
      acceptedAnswers: [
        'its children',
        'the left and right subtree',
        'the subtrees',
        'left and right children',
        'its subtrees',
      ],
      explanation:
        'Most tree problems reduce to asking the same question of the left and right subtree and combining their answers.',
    },
    {
      id: 'trees_2',
      prompt: 'What does an empty subtree — a null child — usually give you in the recursion?',
      acceptedAnswers: [
        'a base case value',
        'a neutral value like 0 or true',
        'a safe default',
        'the base case',
        'a base case',
      ],
      explanation:
        'The empty-child case is the base case of the recursion — getting it right is what stops the recursion from crashing or lying.',
    },
  ],
  TRIES: [
    {
      id: 'tries_1',
      prompt: 'What does each node in a trie represent?',
      acceptedAnswers: ['a character', 'one letter', 'a character in a word', 'a letter'],
      explanation: 'A trie is a tree of characters, one node per character, with shared prefixes sharing the same path.',
    },
    {
      id: 'tries_2',
      prompt: 'How does a trie tell a stored word apart from a mere prefix of one?',
      acceptedAnswers: [
        'an end-of-word flag',
        'a flag marking the end',
        'end of word marker',
        'a boolean flag at that node',
        'end-of-word flag',
      ],
      explanation:
        "Without a flag marking where a word actually ends, a trie can't distinguish a complete stored word from a path that's only a prefix of one.",
    },
  ],
  HEAP_PRIORITY_QUEUE: [
    {
      id: 'heap_1',
      prompt:
        'What do you reach for when you repeatedly need the smallest or largest item, but never the whole sorted order?',
      acceptedAnswers: ['a heap', 'a priority queue', 'heap', 'priority queue'],
      explanation: 'A heap gives you the smallest or largest item in log time without ever sorting the whole collection.',
    },
    {
      id: 'heap_2',
      prompt: "For a 'top k' problem, how big should the heap you keep be?",
      acceptedAnswers: ['k', 'size k', 'exactly k'],
      explanation: 'Keeping a heap of exactly size k and evicting the worst item as you go avoids sorting the entire input.',
    },
  ],
  BACKTRACKING: [
    {
      id: 'backtracking_1',
      prompt: 'In choose-recurse-undo, why is the undo step not optional?',
      acceptedAnswers: [
        'the same structure is reused down every branch',
        'because the structure is reused',
        'other branches need it back',
        "it's shared across branches",
        'it is shared across branches',
      ],
      explanation:
        'The same list or set is reused down every branch of the search, so undoing a choice is what makes it safe to try the next one.',
    },
    {
      id: 'backtracking_2',
      prompt: 'When you record a found result mid-backtrack, should you store the working list itself or a copy?',
      acceptedAnswers: ['a copy', 'a copy of it', 'copy it', 'copy'],
      explanation:
        'Storing the working list directly stores a reference that later mutations will change out from under you — you need a copy.',
    },
  ],
  GRAPHS: [
    {
      id: 'graphs_1',
      prompt: 'Which traversal finds the fewest steps between two nodes?',
      acceptedAnswers: ['bfs', 'breadth first search', 'breadth-first search'],
      explanation: 'BFS explores level by level, so the first time it reaches a node is guaranteed to be by the fewest steps.',
    },
    {
      id: 'graphs_2',
      prompt: 'What do both BFS and DFS need to avoid processing the same node twice?',
      acceptedAnswers: ['a visited set', 'visited set', 'a set of visited nodes'],
      explanation: 'Without a visited set, a graph with cycles sends the traversal around in circles forever.',
    },
  ],
  ADVANCED_GRAPHS: [
    {
      id: 'advanced_graphs_1',
      prompt: 'Which shortest-path algorithm needs every edge weight to be non-negative?',
      acceptedAnswers: ['dijkstra', "dijkstra's algorithm", "dijkstra's"],
      explanation: "Dijkstra's algorithm assumes non-negative weights; a negative edge can make it settle on the wrong distance.",
    },
    {
      id: 'advanced_graphs_2',
      prompt: 'What must a graph not have for a topological sort to exist?',
      acceptedAnswers: ['a cycle', 'cycles', 'no cycles'],
      explanation:
        'A topological order only exists when the dependency graph has no cycles — a cycle means no valid ordering can satisfy it.',
    },
  ],
  DP_1D: [
    {
      id: 'dp_1d_1',
      prompt: 'Before writing any code for a 1D DP problem, what should you be able to say in one sentence?',
      acceptedAnswers: [
        'what dp[i] means',
        'the meaning of the state',
        'what the state represents',
        'what dp of i represents',
        'what dp i means',
      ],
      explanation: 'Defining precisely what dp[i] means is what makes the recurrence for it possible to write correctly.',
    },
    {
      id: 'dp_1d_2',
      prompt: 'A 1D DP recurrence builds the answer at each position from what?',
      acceptedAnswers: ['earlier positions', 'previous answers', 'answers at earlier positions'],
      explanation:
        'Each dp[i] is built from the answers at earlier positions, which is what makes it dynamic programming rather than plain recursion.',
    },
  ],
  DP_2D: [
    {
      id: 'dp_2d_1',
      prompt: 'Why does a 2D DP problem need two indices in its state instead of one?',
      acceptedAnswers: [
        'two things vary independently',
        'because two things vary',
        'two quantities change independently',
        'two things change independently',
      ],
      explanation:
        'Two things varying independently — like two positions in two strings — is exactly what needs a two-index state to capture.',
    },
    {
      id: 'dp_2d_2',
      prompt: 'What must be true about a cell before your recurrence is allowed to read it?',
      acceptedAnswers: ['it must already be computed', 'already filled in', 'computed already', 'already computed'],
      explanation: 'The fill order has to guarantee every cell your recurrence reads is already computed, or the recurrence reads garbage.',
    },
  ],
  GREEDY: [
    {
      id: 'greedy_1',
      prompt: 'How do you build confidence that a greedy local choice is actually correct?',
      acceptedAnswers: [
        'try to find a counterexample',
        'test it against a small case',
        'look for a counterexample',
        'try to break it with a small case',
      ],
      explanation:
        'Greedy is either right or badly wrong — trying hard to build a small counterexample, and failing, is the evidence worth having.',
    },
    {
      id: 'greedy_2',
      prompt: 'A greedy rule makes its choice based on what, without doing what dynamic programming does?',
      acceptedAnswers: ['only the current step', 'looking ahead', 'without looking ahead', 'local information'],
      explanation: "A greedy choice is made from local information only, with no lookahead — that's what makes it fast when it's actually correct.",
    },
  ],
  INTERVALS: [
    {
      id: 'intervals_1',
      prompt: 'Before processing a list of intervals, what do you almost always do first?',
      acceptedAnswers: ['sort them', 'sort by start', 'sort the intervals'],
      explanation:
        'The order intervals arrive in is rarely the order you should process them — sorting first turns most interval problems into a single walk.',
    },
    {
      id: 'intervals_2',
      prompt: 'What detail about touching endpoints does an interval problem usually have to state explicitly?',
      acceptedAnswers: [
        'whether touching counts as overlapping',
        'if endpoints count as overlap',
        'whether adjacent intervals overlap',
        'whether touching intervals overlap',
      ],
      explanation: 'Whether [1,2] and [2,3] count as overlapping changes the answer, and the statement has to say which rule applies.',
    },
  ],
  MATH_GEOMETRY: [
    {
      id: 'math_geometry_1',
      prompt: 'Before writing a loop that simulates a math problem, what should you look for instead?',
      acceptedAnswers: ['a formula or property', 'a pattern', 'a formula', 'a shortcut formula'],
      explanation: 'There is often a formula or property that replaces the simulation entirely and is much cheaper to compute.',
    },
    {
      id: 'math_geometry_2',
      prompt: "What two cases do math problems most often break on, if you don't handle them explicitly?",
      acceptedAnswers: ['zero and negatives', 'zero and negative numbers', 'negatives and zero'],
      explanation:
        'Zero and negative numbers are the cases that most often break a formula that was only tested on ordinary positive input.',
    },
  ],
  BIT_MANIPULATION: [
    {
      id: 'bit_manipulation_1',
      prompt: 'Which bitwise operator cancels a pair of identical values?',
      acceptedAnswers: ['xor', 'exclusive or'],
      explanation: 'XOR cancels identical bits to zero, which is why it makes matched pairs disappear and leaves the odd one out.',
    },
    {
      id: 'bit_manipulation_2',
      prompt: 'Which operator do you use to test whether a specific bit is set?',
      acceptedAnswers: ['and', 'bitwise and', '&'],
      explanation: "ANDing with a mask that has only that bit set tells you whether it's on, by leaving everything else zeroed out.",
    },
  ],
  FOUNDATIONS: [
    {
      id: 'foundations_1',
      prompt: 'Before writing any code for a plainly stated task, what should you do first?',
      acceptedAnswers: ['restate it in your own words', 'restate the task', 'put it in your own words'],
      explanation: "Restating the task in your own words is usually enough to reveal that it's exactly as simple as it sounds.",
    },
    {
      id: 'foundations_2',
      prompt: 'Name two boundary cases worth checking on almost any loop over a list.',
      acceptedAnswers: [
        'empty input and a single item',
        'empty and single item',
        'empty list and one item',
        'first and last position',
        'empty input and single item',
      ],
      explanation:
        'Empty input, a single item, and the very first and last positions are where the simplest-looking loops usually get failed.',
    },
  ],
  DATA_STRUCTURES: [
    {
      id: 'data_structures_1',
      prompt: "When you build a structure rather than use one, what's the actual subject of the question?",
      acceptedAnswers: [
        'what it must guarantee',
        'the guarantees it must keep',
        'what operations it must support',
        'what it has to guarantee',
      ],
      explanation: 'The question is what the structure has to guarantee — not what it computes, since it usually computes nothing at all.',
    },
    {
      id: 'data_structures_2',
      prompt: 'What is the hard part of building a structure that supports several operations at once?',
      acceptedAnswers: [
        'keeping every operation cheap at the same time',
        'keeping all operations cheap together',
        "making sure none of the operations undo the others' speed",
        'keeping every operation cheap simultaneously',
      ],
      explanation: 'Each operation is easy alone; the hard part is choosing internals where adding, removing and reading all stay cheap together.',
    },
  ],
};

/**
 * Trim, lowercase, and strip one layer of surrounding quotes.
 *
 * Failing someone for typing `'hi'` instead of `hi` teaches nothing — the
 * leniency here is deliberate, not an oversight.
 */
export function normalizeAnswer(raw: string): string {
  let s = raw.trim().toLowerCase();
  const quotePairs: ReadonlyArray<readonly [string, string]> = [
    ['"', '"'],
    ["'", "'"],
    ['“', '”'],
    ['‘', '’'],
  ];
  for (const [open, close] of quotePairs) {
    if (s.length >= 2 && s.startsWith(open) && s.endsWith(close)) {
      s = s.slice(1, -1).trim();
      break;
    }
  }
  return s;
}

/** Whether `raw` matches one of the question's accepted answers, leniently. */
export function isCorrectAnswer(question: RecallQuestion, raw: string): boolean {
  const normalized = normalizeAnswer(raw);
  return question.acceptedAnswers.some((accepted) => normalizeAnswer(accepted) === normalized);
}

/**
 * Pick one question for a family, deterministically from `seed`.
 *
 * Pure: the same seed always picks the same question, so selection is
 * testable without a database or a random-number generator in the loop. The
 * thin wrapper below supplies a seed that varies lock to lock.
 */
export function pickQuestion(family: PatternFamily, seed: number): RecallQuestion {
  const questions = QUESTIONS_BY_FAMILY[family];
  const index = ((seed % questions.length) + questions.length) % questions.length;
  return questions[index]!;
}

/** Find a family's question by id, or undefined if the id doesn't belong to it. */
export function findQuestion(family: PatternFamily, questionId: string): RecallQuestion | undefined {
  return QUESTIONS_BY_FAMILY[family].find((q) => q.id === questionId);
}

// ---------------------------------------------------------------------------
// Thin: database
// ---------------------------------------------------------------------------

/**
 * Mark a pattern family as freshly solved, starting its recall schedule.
 *
 * Only creates the schedule row when one doesn't already exist — a second
 * solve of the same family does not reset a recall schedule already in
 * progress from an earlier one. Only a wrong recall answer resets it; a fresh
 * solve is not itself a lapse, and treating it as one would move the goalpost
 * every time the learner did well.
 *
 * Never fatal: this runs alongside the rest of the solve path (recordCapability,
 * recordStep), and a lost schedule row must not be able to cost a passing
 * submission. Worst case, a family simply doesn't come up for recall.
 */
export async function recordSolve(
  userId: string,
  patternFamily: PatternFamily,
  now: Date = new Date(),
): Promise<void> {
  try {
    const existing = await prisma.retrievalSchedule.findUnique({
      where: { userId_patternFamily: { userId, patternFamily } },
    });
    if (existing) return;
    await prisma.retrievalSchedule.create({
      data: {
        userId,
        patternFamily,
        intervalDays: MIN_INTERVAL_DAYS,
        nextDueAt: addDays(now, MIN_INTERVAL_DAYS),
        streak: 0,
        lapseCount: 0,
      },
    });
  } catch (err) {
    logger.warn({ err, patternFamily }, 'retrieval schedule write failed');
  }
}

export interface RecallOffer {
  patternFamily: PatternFamily;
  question: RecallQuestion;
}

/**
 * The one recall question to offer when a lock engages, or null.
 *
 * Never blocks the lock: any read failure is caught and logged here, and the
 * caller gets null exactly as it would if nothing were due. Never returns
 * more than one family's question — callers that already know a recall was
 * offered this lock (e.g. from their own session state) should pass
 * `alreadyOffered: true` rather than call this at all, so a fortnight away
 * cannot surface a backlog of catch-up questions in one sitting.
 *
 * This module does not itself know which lock session is asking, because it
 * owns no lock-session state — the caller (lockSessions.ts) is responsible
 * for calling this at most once per lock and for not calling it again once a
 * question has been shown.
 */
export async function offerRecall(
  userId: string,
  options: { now?: Date; alreadyOffered?: boolean; seed?: number } = {},
): Promise<RecallOffer | null> {
  if (options.alreadyOffered) return null;
  const now = options.now ?? new Date();
  try {
    const due = await prisma.retrievalSchedule.findFirst({
      where: { userId, nextDueAt: { lte: now } },
      orderBy: { nextDueAt: 'asc' },
    });
    if (!due) return null;
    const seed = options.seed ?? now.getTime();
    return { patternFamily: due.patternFamily, question: pickQuestion(due.patternFamily, seed) };
  } catch (err) {
    logger.warn({ err, userId }, 'retrieval due-check failed');
    return null;
  }
}

export interface RecallResult {
  correct: boolean;
  message: string;
  explanation: string;
  nextDueAt: Date;
  intervalDays: number;
}

/**
 * Score one recall answer and advance (or reset) its schedule.
 *
 * The scoring and the message are computed purely, from `applyRecallResult`
 * and `recallOutcomeMessage`, before any database write is attempted — so the
 * learner gets an honest answer even if persisting the new schedule fails.
 * That failure is logged and swallowed, the same trade recordStep makes: a
 * lost schedule update costs one recall's worth of spacing, not the feedback
 * the learner is owed right now.
 *
 * Returns null only when `questionId` does not belong to `patternFamily` —
 * a caller error, not a database one — since answering a question that was
 * never asked is not a result to score.
 */
export async function submitRecall(
  userId: string,
  patternFamily: PatternFamily,
  questionId: string,
  rawAnswer: string,
  now: Date = new Date(),
): Promise<RecallResult | null> {
  const question = findQuestion(patternFamily, questionId);
  if (!question) return null;

  const correct = isCorrectAnswer(question, rawAnswer);

  let state: ScheduleState = { intervalDays: MIN_INTERVAL_DAYS, streak: 0, lapseCount: 0 };
  try {
    const existing = await prisma.retrievalSchedule.findUnique({
      where: { userId_patternFamily: { userId, patternFamily } },
    });
    if (existing) {
      state = {
        intervalDays: existing.intervalDays,
        streak: existing.streak,
        lapseCount: existing.lapseCount,
      };
    }
  } catch (err) {
    logger.warn({ err, patternFamily }, 'retrieval schedule read failed; scoring from a fresh state');
  }

  const update = applyRecallResult(state, correct, now);

  try {
    await prisma.retrievalSchedule.upsert({
      where: { userId_patternFamily: { userId, patternFamily } },
      create: {
        userId,
        patternFamily,
        intervalDays: update.intervalDays,
        nextDueAt: update.nextDueAt,
        streak: update.streak,
        lapseCount: update.lapseCount,
      },
      update: {
        intervalDays: update.intervalDays,
        nextDueAt: update.nextDueAt,
        streak: update.streak,
        lapseCount: update.lapseCount,
      },
    });
  } catch (err) {
    logger.warn({ err, patternFamily }, 'retrieval schedule write failed');
  }

  return {
    correct,
    message: recallOutcomeMessage(correct, update.intervalDays),
    explanation: question.explanation,
    nextDueAt: update.nextDueAt,
    intervalDays: update.intervalDays,
  };
}
