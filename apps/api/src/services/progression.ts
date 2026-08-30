import { LockState, PatternFamily, SubmissionStatus, Tier } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

/**
 * Which tiers a user is ready for.
 *
 * A separate axis from `difficulty.ts`, and deliberately so. That engine moves
 * a user along EASY -> MEDIUM -> HARD based on how fast they solve; this one
 * decides whether they have any business being shown a dynamic-programming
 * problem at all. A user can be "HARD" at Tier 0 and still never have built a
 * heap. Collapsing the two would mean a fast beginner gets promoted into
 * material they have no foundation for — which, under a lock screen, is not a
 * mild mis-calibration.
 *
 * The rule engine is extended here, not replaced: `applyOutcome` still owns
 * difficulty, and this module only narrows *which pool* that difficulty draws
 * from.
 *
 * Every rule here is pure. The one function that touches Prisma
 * (`loadProgressSnapshot`) sits at the bottom and only gathers inputs, so the
 * gating decisions stay arguable in a test rather than only observable in
 * production.
 */

/**
 * Locks a brand-new user must spend at Tier 0 before anything else opens.
 *
 * The brief is explicit: a first-week user gets Tier 0, not a hard DP problem.
 * Someone who cannot yet write a for-loop confidently and is handed "longest
 * increasing subsequence" with their screen gone does not learn anything — they
 * use the escape hatch, and the escape hatch records a failure against them for
 * something that was never their fault.
 */
export const TIER_0_LOCK_COUNT = 5;

/** Tier 0 solves before "build the structure" opens. */
export const TIER_0_5_AFTER_TIER_0_SOLVES = 5;

/** Tier 1 solves within a family before its variations open. */
export const TIER_2_AFTER_FAMILY_SOLVES = 2;

/** Total Tier 1 solves before the breadth tier opens. */
export const TIER_3_AFTER_TIER_1_SOLVES = 20;

/**
 * Which structures a pattern family assumes you have already built.
 *
 * This is the rule the brief calls for: build the heap before solving heap
 * problems. It is not gatekeeping — it is the difference between knowing that a
 * hashmap is O(1) and knowing *why*, which is exactly what collapses under an
 * interview follow-up.
 *
 * Values are `signatureId`s from the corpus registry, so the dependency is
 * checkable against something real rather than against a string nobody
 * maintains. Families with an empty list need no structure beyond recursion.
 */
export const FAMILY_PREREQUISITES: Record<PatternFamily, readonly string[]> = {
  ARRAYS_HASHING: ['cls:dynamic-array', 'cls:hash-map', 'cls:hash-set'],
  TWO_POINTERS: ['cls:dynamic-array'],
  SLIDING_WINDOW: ['cls:hash-map'],
  STACK: ['cls:stack'],
  BINARY_SEARCH: ['cls:dynamic-array'],
  LINKED_LIST: ['cls:linked-list'],
  TREES: ['cls:bst'],
  TRIES: ['cls:trie'],
  HEAP_PRIORITY_QUEUE: ['cls:min-heap', 'cls:priority-queue'],
  BACKTRACKING: [],
  GRAPHS: ['cls:graph', 'cls:queue', 'cls:union-find'],
  ADVANCED_GRAPHS: ['cls:priority-queue', 'cls:union-find'],
  DP_1D: ['cls:dynamic-array'],
  DP_2D: [],
  GREEDY: [],
  INTERVALS: [],
  MATH_GEOMETRY: [],
  BIT_MANIPULATION: [],
  FOUNDATIONS: [],
  DATA_STRUCTURES: [],
};

/** Solves in a parent family before its roadmap children open. */
export const ROADMAP_UNLOCK_SOLVES = 3;

/**
 * Which families a pattern family assumes you have already practised.
 *
 * This is the roadmap DAG, and it is a different axis from
 * `FAMILY_PREREQUISITES`. That one asks "have you *built* the structure this
 * family runs on"; this one asks "have you *met* the idea this family is a
 * variation of". Both must hold, because they fail in different directions: a
 * user can build a heap without ever having seen a tree traversal, and can
 * grind array problems without ever having written a hash map.
 *
 * Without this, six families have no structural prerequisite at all, so
 * building a single dynamic array opened nine of eighteen families at once —
 * two-dimensional dynamic programming among them, which sits six hops below the
 * root here. That is not a hard problem served early; it is a problem served
 * before its vocabulary exists.
 *
 * `ARRAYS_HASHING` is the root and depends on nothing: it is the way in.
 */
export const ROADMAP_PREREQUISITES: Record<PatternFamily, readonly PatternFamily[]> = {
  ARRAYS_HASHING: [],
  TWO_POINTERS: [PatternFamily.ARRAYS_HASHING],
  STACK: [PatternFamily.ARRAYS_HASHING],
  BINARY_SEARCH: [PatternFamily.TWO_POINTERS],
  SLIDING_WINDOW: [PatternFamily.TWO_POINTERS],
  LINKED_LIST: [PatternFamily.TWO_POINTERS],
  TREES: [PatternFamily.BINARY_SEARCH, PatternFamily.SLIDING_WINDOW, PatternFamily.LINKED_LIST],
  TRIES: [PatternFamily.TREES],
  BACKTRACKING: [PatternFamily.TREES],
  HEAP_PRIORITY_QUEUE: [PatternFamily.TREES],
  INTERVALS: [PatternFamily.HEAP_PRIORITY_QUEUE],
  GREEDY: [PatternFamily.HEAP_PRIORITY_QUEUE],
  GRAPHS: [PatternFamily.BACKTRACKING],
  DP_1D: [PatternFamily.BACKTRACKING],
  ADVANCED_GRAPHS: [PatternFamily.GRAPHS, PatternFamily.HEAP_PRIORITY_QUEUE],
  DP_2D: [PatternFamily.GRAPHS, PatternFamily.DP_1D],
  BIT_MANIPULATION: [PatternFamily.DP_1D],
  MATH_GEOMETRY: [PatternFamily.DP_2D, PatternFamily.BIT_MANIPULATION],
  FOUNDATIONS: [],
  DATA_STRUCTURES: [],
};

/** What the gate needs to know about a user. */
export interface ProgressSnapshot {
  /** Resolved lock sessions, solved or bypassed. Locks *served*, not solved. */
  locksServed: number;
  /** Solves per tier. */
  solvesByTier: Partial<Record<Tier, number>>;
  /** Solves per pattern family, Tier 1 and above. */
  solvesByFamily: Partial<Record<PatternFamily, number>>;
  /** `signatureId`s of the Tier 0.5 structures this user has built. */
  builtStructures: readonly string[];
}

export const emptyProgress = (): ProgressSnapshot => ({
  locksServed: 0,
  solvesByTier: {},
  solvesByFamily: {},
  builtStructures: [],
});

const at = <K extends string>(rec: Partial<Record<K, number>>, key: K): number => rec[key] ?? 0;

/**
 * Has this user built everything the family assumes?
 *
 * All-or-nothing on purpose. Half a prerequisite list is not half a foundation:
 * a graph problem needs the queue *and* the adjacency structure, and being
 * shown one because you built the other is how a user concludes they are bad at
 * graphs when they are actually missing a queue.
 */
export function isFamilyUnlocked(family: PatternFamily, built: readonly string[]): boolean {
  return FAMILY_PREREQUISITES[family].every((signatureId) => built.includes(signatureId));
}

/**
 * Has this user practised everything the family descends from?
 *
 * All-or-nothing for the same reason as the structural gate, and with the same
 * consequence if it is relaxed: Trees sits below binary search, sliding window
 * *and* linked lists, because a tree problem draws on all three. Opening it
 * after one of them is how a user concludes they are bad at trees when they
 * have simply never held two pointers.
 *
 * Counted in solves rather than in problems served: a family you were shown and
 * bypassed is a family you have not met.
 */
export function isFamilyReached(
  family: PatternFamily,
  solvesByFamily: Partial<Record<PatternFamily, number>>,
): boolean {
  return ROADMAP_PREREQUISITES[family].every(
    (parent) => at(solvesByFamily, parent) >= ROADMAP_UNLOCK_SOLVES,
  );
}

/** Both gates. A family opens when its structures are built *and* its roadmap parents are solved. */
export function isFamilyOpen(family: PatternFamily, progress: ProgressSnapshot): boolean {
  return (
    isFamilyUnlocked(family, progress.builtStructures) &&
    isFamilyReached(family, progress.solvesByFamily)
  );
}

const REAL_FAMILIES = (Object.values(PatternFamily) as PatternFamily[]).filter(
  (f) => f !== PatternFamily.FOUNDATIONS && f !== PatternFamily.DATA_STRUCTURES,
);

/**
 * The tiers this user may currently be served, in ascending order.
 *
 * Never empty. An empty result would mean a locked machine with nothing to
 * serve, and no rule in this file is worth that.
 */
export function availableTiers(progress: ProgressSnapshot): Tier[] {
  // The first locks are Tier 0, unconditionally. Not "mostly Tier 0" — a single
  // Tier 1 problem slipped into someone's first week is the one that convinces
  // them this is not for them.
  if (progress.locksServed < TIER_0_LOCK_COUNT) {
    return [Tier.TIER_0];
  }

  const tiers: Tier[] = [Tier.TIER_0];

  if (at(progress.solvesByTier, Tier.TIER_0) < TIER_0_5_AFTER_TIER_0_SOLVES) {
    // Still working through foundations.
    return tiers;
  }
  tiers.push(Tier.TIER_0_5);

  // Tier 1 needs at least one structure actually built.
  //
  // Several families — greedy, backtracking, bit manipulation — have no
  // structural prerequisite, so without this check Tier 1 would open the
  // instant Tier 0.5 did, and a user could pass straight from "reverse a
  // string" to "partition a set" having built nothing. Tier 0.5 is a phase, not
  // a side quest.
  //
  // *Which* families then open is decided separately by `availableFamilies`:
  // someone who has built a stack gets stack problems without also having built
  // a trie.
  //
  // With the roadmap gate in place the only family that can open first is
  // ARRAYS_HASHING — the root — so in practice this asks whether the user has
  // built the dynamic array, hash map and hash set. That is the intended way
  // in, and it is why those three are the Tier 0.5 problems that matter most.
  if (progress.builtStructures.length === 0) return tiers;
  if (!REAL_FAMILIES.some((family) => isFamilyOpen(family, progress))) {
    return tiers;
  }
  tiers.push(Tier.TIER_1);

  const practised = REAL_FAMILIES.some(
    (family) => at(progress.solvesByFamily, family) >= TIER_2_AFTER_FAMILY_SOLVES,
  );
  if (practised) tiers.push(Tier.TIER_2);
  if (at(progress.solvesByTier, Tier.TIER_1) >= TIER_3_AFTER_TIER_1_SOLVES) {
    tiers.push(Tier.TIER_3);
  }

  return tiers;
}

/**
 * Which families may be served at Tier 1 and above.
 *
 * Tier 0 and Tier 0.5 are not family-gated: FOUNDATIONS and DATA_STRUCTURES
 * have no prerequisites by construction, which is what makes them the way in.
 */
export function availableFamilies(progress: ProgressSnapshot, tier: Tier): PatternFamily[] {
  if (tier === Tier.TIER_0) return [PatternFamily.FOUNDATIONS];
  if (tier === Tier.TIER_0_5) return [PatternFamily.DATA_STRUCTURES];
  return REAL_FAMILIES.filter((family) => isFamilyOpen(family, progress));
}

/**
 * Every family this user may be served across the tiers they can reach.
 *
 * The selector filters on one flat list rather than per-tier, so this unions
 * them. Tier 0 always contributes FOUNDATIONS and Tier 0.5 DATA_STRUCTURES,
 * which is why a user deep in Tier 1 can still be served a foundation problem —
 * intended, and the reason the tier filter stays alongside this one rather than
 * being replaced by it.
 */
export function availableFamiliesForTiers(
  progress: ProgressSnapshot,
  tiers: readonly Tier[],
): PatternFamily[] {
  const families = new Set<PatternFamily>();
  for (const tier of tiers) {
    for (const family of availableFamilies(progress, tier)) families.add(family);
  }
  return [...families];
}

/**
 * Which structures to steer the user toward next.
 *
 * Ordered by how many still-locked families each one would open, so the answer
 * to "what should I build next" is the thing that unlocks the most, not the
 * next item in an arbitrary list.
 */
export function nextStructuresToBuild(progress: ProgressSnapshot, limit = 3): string[] {
  const missing = new Map<string, number>();

  for (const family of REAL_FAMILIES) {
    if (isFamilyUnlocked(family, progress.builtStructures)) continue;
    for (const signatureId of FAMILY_PREREQUISITES[family]) {
      if (progress.builtStructures.includes(signatureId)) continue;
      missing.set(signatureId, (missing.get(signatureId) ?? 0) + 1);
    }
  }

  return [...missing.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([signatureId]) => signatureId);
}

/**
 * Build a snapshot from the database.
 *
 * The only impure function in this file, and it is kept at the bottom on
 * purpose: everything above it is decidable without a connection, which is what
 * makes the gating rules arguable in a test rather than only observable in
 * production.
 *
 * "Solved" means an accepted submission, not a resolved session — a session can
 * end in a bypass, and a bypass is precisely the case where the user did *not*
 * demonstrate the thing the next tier assumes.
 */
export async function loadProgressSnapshot(userId: string): Promise<ProgressSnapshot> {
  const [locksServed, solved] = await Promise.all([
    prisma.lockSession.count({
      where: { userId, state: { in: [LockState.UNLOCKED, LockState.BYPASSED, LockState.ABANDONED] } },
    }),
    prisma.submission.findMany({
      where: { userId, status: SubmissionStatus.ACCEPTED },
      select: { problem: { select: { tier: true, patternFamily: true, signatureId: true } } },
      distinct: ['problemId'],
    }),
  ]);

  const solvesByTier: Partial<Record<Tier, number>> = {};
  const solvesByFamily: Partial<Record<PatternFamily, number>> = {};
  const builtStructures: string[] = [];

  for (const { problem } of solved) {
    if (!problem) continue;
    solvesByTier[problem.tier] = (solvesByTier[problem.tier] ?? 0) + 1;
    solvesByFamily[problem.patternFamily] = (solvesByFamily[problem.patternFamily] ?? 0) + 1;
    // A structure counts as built only if the user solved the Tier 0.5 problem
    // that *is* that structure.
    if (problem.tier === Tier.TIER_0_5 && problem.signatureId.startsWith('cls:')) {
      builtStructures.push(problem.signatureId);
    }
  }

  return { locksServed, solvesByTier, solvesByFamily, builtStructures };
}

/** One line for the UI: why is this the tier I am being given? */
export function explainGate(progress: ProgressSnapshot): string {
  if (progress.locksServed < TIER_0_LOCK_COUNT) {
    const left = TIER_0_LOCK_COUNT - progress.locksServed;
    return `Foundations for your first ${TIER_0_LOCK_COUNT} locks — ${left} to go.`;
  }
  const tier0 = at(progress.solvesByTier, Tier.TIER_0);
  if (tier0 < TIER_0_5_AFTER_TIER_0_SOLVES) {
    return `Foundations until ${TIER_0_5_AFTER_TIER_0_SOLVES} solves — ${tier0} so far.`;
  }
  const next = nextStructuresToBuild(progress, 1);
  if (next.length > 0) {
    return `Build ${next[0]} to open more pattern families.`;
  }
  // Every structure is built, so anything still shut is shut on the roadmap.
  // Saying "build X" here would be a lie the user cannot act on.
  const frontier = nextFamiliesToPractise(progress, 1);
  if (frontier.length > 0) {
    const family = frontier[0]!;
    const have = at(progress.solvesByFamily, family);
    return `Solve ${ROADMAP_UNLOCK_SOLVES - have} more in ${family} to open what follows it.`;
  }
  return 'All pattern families open.';
}

/**
 * Which open families to practise next to advance along the roadmap.
 *
 * Ordered by how many still-closed families each one would open, mirroring
 * `nextStructuresToBuild`: the answer to "what should I do next" is the thing
 * that unlocks the most, not the next item in an arbitrary list. Only families
 * that are themselves open are proposed — advising practice in a family the
 * user cannot be served is the same permanent lock this file exists to avoid.
 */
export function nextFamiliesToPractise(progress: ProgressSnapshot, limit = 3): PatternFamily[] {
  const opens = new Map<PatternFamily, number>();

  for (const family of REAL_FAMILIES) {
    if (isFamilyOpen(family, progress)) continue;
    for (const parent of ROADMAP_PREREQUISITES[family]) {
      if (at(progress.solvesByFamily, parent) >= ROADMAP_UNLOCK_SOLVES) continue;
      if (!isFamilyOpen(parent, progress)) continue;
      opens.set(parent, (opens.get(parent) ?? 0) + 1);
    }
  }

  return [...opens.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([family]) => family);
}
