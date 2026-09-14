import type { PatternFamily, Problem } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { recordStep } from './learningLog.js';

/**
 * What the learner can now do, said in one sentence, and how they got there.
 *
 * The log already records that a problem was solved. That is a fact about an
 * evening, not about a person, and reading twenty of them back tells you what
 * you met rather than what you can do. This is the other half: after a solve,
 * one plain sentence naming the capability the solve is evidence of.
 *
 * ## The level is the whole point
 *
 * A sentence on its own would be a lie waiting to happen, because three very
 * different evenings produce the same passing submission:
 *
 *   - solved with nothing revealed,
 *   - solved after spending hints,
 *   - solved after the editorial — the worked solution — was opened.
 *
 * These are never collapsed into one value, and the third is never recorded as
 * demonstrated mastery under any wording. Reading a solution and then
 * reproducing it is a real step, and worth keeping; it is not the same claim as
 * having found the idea, and a record that cannot tell them apart is worse than
 * no record at all — it is the highlight reel the learning log exists not to be.
 *
 * The level is derived from the log rather than from a flag someone remembered
 * to set: hints and debriefs are already appended as they happen, so counting
 * the rows for this lock session before the passing submission is the only
 * source that cannot drift from what actually occurred.
 *
 * Derivation is pure and separate from the read, so what a given history means
 * is arguable in a test rather than only observable against a live database.
 */

/**
 * How the capability was earned. Three values, deliberately not ordered into a
 * single score: a score invites comparison, and the useful question here is
 * which of the three happened, not how many points it was worth.
 */
export type CapabilityLevel = 'unaided' | 'after_hints' | 'after_editorial';

export interface CapabilityEvidence {
  /** HINT_REVEALED rows for this session before the passing submission. */
  hintsRevealed: number;
  /** DEBRIEF_OPENED rows for this session before the passing submission. */
  debriefsOpened: number;
}

export interface CapabilityRecord {
  level: CapabilityLevel;
  sentence: string;
  evidence: CapabilityEvidence;
  /**
   * False whenever the answer was seen first. Stored explicitly rather than
   * left for each reader to re-derive from `level`, because a reader that gets
   * it wrong makes exactly the claim this module exists to refuse.
   */
  demonstratesMastery: boolean;
}

/**
 * The capability sentence per family. Keyed by the enum, so a new pattern
 * family fails the build rather than silently reporting nothing — the same
 * reasoning as `BY_FAMILY` in hints.ts.
 *
 * Phrased as what you can now *do*, in the second person, and always naming a
 * recognition and an action: "I solved a sliding-window problem" is a fact
 * about last Tuesday, "you can spot a contiguous-run question and keep a
 * running summary instead of re-scanning" is a thing you can go and use.
 */
export const BY_FAMILY: Record<PatternFamily, string> = {
  ARRAYS_HASHING:
    'recognise when a question is really about what you have already seen, and answer it in one pass with a hash map instead of a nested loop',
  TWO_POINTERS:
    'replace a nested loop with two positions moving through the data, and say what must stay true between them',
  SLIDING_WINDOW:
    'spot a question about a contiguous run and carry a running summary, growing the window on the right and shrinking it from the left',
  STACK:
    'notice when something has to wait for something later, and hold the unresolved items until the thing they were waiting for arrives',
  BINARY_SEARCH:
    'discard half an ordered search space at every step, and hold your bounds steady while doing it',
  LINKED_LIST:
    'work a structure you cannot index into — walking from a node, rewiring links without losing the rest of the list',
  TREES:
    'turn a question about a tree into the same question asked of its children, and decide what to pass down versus what to return up',
  TRIES:
    'store and look things up by prefix, character by character, and tell a stored word from a mere prefix of one',
  HEAP_PRIORITY_QUEUE:
    'get the smallest or largest item repeatedly without ever sorting the whole input',
  BACKTRACKING:
    'build candidates and abandon them the moment they cannot work — choose, recurse, undo',
  GRAPHS:
    'model a problem as nodes and edges whatever shape the input arrives in, and pick BFS or DFS for the question actually being asked',
  ADVANCED_GRAPHS:
    'reach for the right weighted or ordered graph tool — shortest path, topological order, union-find — and state the assumption it needs',
  DP_1D:
    'define a one-dimensional state in a sentence and write the recurrence that builds it from earlier answers',
  DP_2D:
    'say precisely what a two-index state means, and fill it in an order where every cell you read is already computed',
  GREEDY:
    'find a local choice that cannot be beaten, and test it against a small case before trusting it',
  INTERVALS:
    'sort intervals into the order the problem wants rather than the order they arrived in, and be explicit about touching endpoints',
  MATH_GEOMETRY:
    'look for the property or formula that replaces a simulation, and handle zero, negatives and overflow deliberately',
  BIT_MANIPULATION:
    'treat numbers as bits — test with AND, set with OR and shift, cancel pairs with XOR',
  FOUNDATIONS:
    'turn a plainly stated task into a loop that handles its boundaries: empty input, a single item, and the first and last positions',
  DATA_STRUCTURES:
    'build a structure rather than reach for one, and keep every operation it promises cheap at the same time',
};

/**
 * Sharpen the sentence with the problem's own tag where it has one.
 *
 * Same reason hints.ts carries a tag layer: the families are broad, so where
 * the corpus has already named the technique, naming it is worth more than the
 * family-level phrasing it replaces. A capability that reads identically for
 * forty problems is one nobody believes.
 */
const BY_TAG: Record<string, string> = {
  'prefix-sum':
    'answer any range question as a subtraction of two running totals you computed once',
  'monotonic-stack':
    'keep a stack ordered as you go, popping everything a new element makes irrelevant',
  kadane:
    'walk a sequence once carrying the best run ending here, extending or restarting at each step',
  'fast-slow-pointers':
    'use two pointers at different speeds to find where a sequence meets itself, or how far apart two positions are',
  'cyclic-sort':
    'use the values themselves as their own indices, and read off what is left out of place',
  'union-find':
    'merge groups as you meet them and answer "are these connected?" by comparing representatives',
  'topological-sort':
    'process only what has no unmet dependency left, removing edges as you go',
  memoization:
    'keep a correct recursion and remove its cost by caching on the arguments',
  'binary-search-on-answer':
    'search the answer rather than the input, asking "is this value achievable?" at each step',
  backtracking: 'choose, recurse and undo, so one structure serves every branch',
  'sliding-window':
    'grow a window on the right and shrink it from the left the moment it stops being valid',
  'two-heaps': 'split data with two heaps facing each other and read the middle straight off',
  'hash-map':
    'reach for a map when the question is really "have I seen this before", and answer in one pass instead of two nested ones',
  'two-pointers':
    'replace a nested loop with two positions moving through the data, and say what has to stay true between them',
  'binary-search':
    'halve an ordered search space each step, and get the bounds and the loop condition right at the one-and-two-element case',
  'counting':
    'count occurrences with a map rather than re-scanning, and read the answer off the counts',
  'frequency-count':
    'build a frequency table in one pass and answer questions about the whole input from it',
  'stack':
    'use a stack for the things that have to wait, and know that what is left on it at the end is either the answer or the bug',
  'dfs':
    'walk a structure depth-first and be explicit about what you carry down and what you return up',
  'recursion':
    'write a recursive case and a base case that actually terminates, and trust the recursive call',
  'trees':
    'build a tree answer from its two children, deciding what one node contributes',
  'heap':
    'keep only what you need ordered, so the best item is cheap to find without sorting everything',
  'sorting':
    'sort first when order turns a hard question into an obvious one, and account for the cost of doing so',
  'dynamic-programming':
    'define a subproblem precisely enough that the answer to the whole is built from the answers to the parts',
  'prefix':
    'precompute once so that each later question is a lookup rather than a walk',
  'accumulator':
    'carry a running value through a loop, declared outside it so it survives each pass',
  'in-place': 'write an answer over its own input without extra space',
  greedy: 'commit to a local choice you can argue cannot be beaten',
};

/** What the sentence needs to know about the problem. Nothing else is read. */
export type CapabilitySource = Pick<Problem, 'patternFamily' | 'patternTags' | 'title'>;

/**
 * The capability sentence, and the honest framing for how it was earned.
 *
 * Pure, so the one decision worth arguing about — what a history of hints and
 * an opened editorial entitles the learner to claim — is testable with no
 * database in sight.
 *
 * The three prefixes are not three politenesses. `after_editorial` says
 * "reproduced" and nothing stronger, because that is what happened: the worked
 * solution was on screen. Calling it mastery would make this record useless for
 * the only purpose it has, which is telling the learner later which things they
 * actually found for themselves.
 */
export function capabilitySentence(problem: CapabilitySource, level: CapabilityLevel): string {
  const tagged = problem.patternTags
    .map((tag) => BY_TAG[tag])
    .find((phrase): phrase is string => Boolean(phrase));
  const skill = tagged ?? BY_FAMILY[problem.patternFamily];

  switch (level) {
    case 'unaided':
      return `You can ${skill}. Worked out unaided, on ${problem.title}.`;
    case 'after_hints':
      return `You can ${skill}. Reached with hints on ${problem.title}, so the idea is within reach but was not yet the first thing you saw.`;
    // Phrased with "to" + the verb phrase unchanged, rather than bending it
    // into the third person. The skill strings contain a conjunction and a
    // second verb, so rewriting only the leading one produced "a solution that
    // recognises ... and answer it in one pass". An infinitive takes both.
    case 'after_editorial':
      return `The idea here is to ${skill}. You reproduced it on ${problem.title} after reading the worked solution, which is not yet evidence you can find it yourself, so this is the one to meet again.`;
  }
}

/**
 * Which of the three levels this evidence supports.
 *
 * Order matters and the editorial wins outright. An evening where the debrief
 * was opened and then the problem was solved is `after_editorial` however few
 * hints were spent, because once the worked solution has been seen no later
 * submission can be evidence about anything else.
 */
export function capabilityLevel(evidence: CapabilityEvidence): CapabilityLevel {
  if (evidence.debriefsOpened > 0) return 'after_editorial';
  if (evidence.hintsRevealed > 0) return 'after_hints';
  return 'unaided';
}

/** The whole derivation, from a history to a record. Pure. */
export function deriveCapability(
  problem: CapabilitySource,
  evidence: CapabilityEvidence,
): CapabilityRecord {
  const level = capabilityLevel(evidence);
  return {
    level,
    sentence: capabilitySentence(problem, level),
    evidence,
    // The single rule this module exists to enforce.
    // Only unaided work demonstrates. Reaching the idea with hints is progress,
    // and it is not yet evidence the learner can find it alone.
    demonstratesMastery: level === 'unaided',
  };
}

/**
 * Read the session's history and derive the level from it.
 *
 * Bounded by `before` — the moment the passing submission landed — because a
 * debrief opened *after* the solve says nothing about how the solve was
 * reached. Without that bound, reading the editorial to see how you should have
 * done it would retroactively demote a solve that owed it nothing, which would
 * teach people not to open the debrief at all.
 *
 * Scoped to one session id rather than to the problem. The same problem met
 * again months later is a new attempt with its own help, and hints spent that
 * evening are not evidence about this one.
 */
export async function readCapabilityEvidence(
  userId: string,
  sessionId: string,
  before: Date,
  problemSlug?: string,
): Promise<CapabilityEvidence> {
  const rows = await prisma.learningEvent.groupBy({
    by: ['kind'],
    where: {
      userId,
      sessionId,
      // Scoped to the problem, not just the session. A session can now serve
      // more than one problem: asking for a different one keeps the lock up
      // and swaps the problem under it. Without this, hints spent on the
      // problem they set aside would be counted against the one they went on
      // to solve unaided, and the sentence written down would understate what
      // they did. The slug is denormalised onto every event for this reason.
      ...(problemSlug ? { problemSlug } : {}),
      kind: { in: ['HINT_REVEALED', 'DEBRIEF_OPENED'] },
      at: { lt: before },
    },
    _count: { _all: true },
  });
  const count = (kind: 'HINT_REVEALED' | 'DEBRIEF_OPENED') =>
    rows.find((row) => row.kind === kind)?._count._all ?? 0;

  // A worked solution shown by the tutor (level 5) is the answer on screen,
  // the same as the editorial, so it counts as one.
  const workedSolutions = await prisma.learningEvent.count({
    where: {
      userId,
      sessionId,
      ...(problemSlug ? { problemSlug } : {}),
      kind: 'HINT_REVEALED',
      detail: { path: ['level'], equals: 5 },
      at: { lt: before },
    },
  });

  return {
    hintsRevealed: count('HINT_REVEALED'),
    debriefsOpened: count('DEBRIEF_OPENED') + workedSolutions,
  };
}

/**
 * Record what the learner can now do, via the append-only log.
 *
 * Never fatal, for the same reason nothing else in the log is: this runs after
 * the unlock token has been signed, and a failed insert must not be able to
 * hold someone out of their own machine. A lost capability row costs one
 * sentence in a history; the alternative costs an evening.
 *
 * Returns the record so a caller that wants to show the sentence immediately
 * can, without a second read.
 */
export async function recordCapability(params: {
  userId: string;
  sessionId: string;
  problem: Pick<Problem, 'slug' | 'title' | 'difficulty' | 'tier' | 'patternFamily' | 'patternTags'>;
  submissionId?: string | null;
  /** When the passing submission landed. Bounds the evidence window. */
  solvedAt?: Date;
}): Promise<CapabilityRecord | null> {
  try {
    const evidence = await readCapabilityEvidence(
      params.userId,
      params.sessionId,
      params.solvedAt ?? new Date(),
      params.problem.slug,
    );
    const record = deriveCapability(params.problem, evidence);

    await recordStep(params.userId, {
      kind: 'CAPABILITY_RECORDED',
      problem: params.problem,
      sessionId: params.sessionId,
      submissionId: params.submissionId ?? undefined,
      detail: {
        level: record.level,
        sentence: record.sentence,
        hintsRevealed: evidence.hintsRevealed,
        debriefsOpened: evidence.debriefsOpened,
        demonstratesMastery: record.demonstratesMastery,
      },
    });
    return record;
  } catch (err) {
    // Same trade as recordStep's: one lost row beats failing the solve it was
    // describing.
    logger.warn({ err, sessionId: params.sessionId }, 'capability record failed');
    return null;
  }
}
