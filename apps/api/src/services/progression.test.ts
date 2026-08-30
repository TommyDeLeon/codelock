import { PatternFamily, Tier } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  FAMILY_PREREQUISITES,
  ROADMAP_PREREQUISITES,
  ROADMAP_UNLOCK_SOLVES,
  TIER_0_LOCK_COUNT,
  availableFamilies,
  availableTiers,
  emptyProgress,
  explainGate,
  isFamilyUnlocked,
  nextFamiliesToPractise,
  nextStructuresToBuild,
  type ProgressSnapshot,
} from './progression.js';
import { SIGNATURE_IDS } from '../corpus/signatures.js';

const progress = (over: Partial<ProgressSnapshot> = {}): ProgressSnapshot => ({
  ...emptyProgress(),
  ...over,
});

/** A user who has done the foundations and built everything. */
const graduated = (over: Partial<ProgressSnapshot> = {}): ProgressSnapshot =>
  progress({
    locksServed: 50,
    solvesByTier: { TIER_0: 10, TIER_0_5: 15 },
    builtStructures: SIGNATURE_IDS.filter((id) => id.startsWith('cls:')),
    ...over,
  });

describe('a brand-new user', () => {
  it('is served Tier 0 and nothing else for their first five locks', () => {
    // The acceptance criterion, stated directly. A single Tier 1 problem in
    // someone's first week is the one that convinces them this is not for them.
    for (let locksServed = 0; locksServed < TIER_0_LOCK_COUNT; locksServed++) {
      expect(availableTiers(progress({ locksServed }))).toEqual([Tier.TIER_0]);
    }
  });

  it('cannot reach Tier 0.5 or Tier 1 by being fast', () => {
    // Difficulty promotion is a different axis. Solving three Tier 0 problems
    // quickly makes you HARD at Tier 0; it does not make you ready for DP.
    const speedy = progress({ locksServed: 3, solvesByTier: { TIER_0: 3 } });
    expect(availableTiers(speedy)).toEqual([Tier.TIER_0]);
  });

  it('is told why, in a sentence', () => {
    expect(explainGate(progress({ locksServed: 2 }))).toMatch(/Foundations for your first 5 locks/);
  });
});

describe('opening Tier 0.5', () => {
  it('stays on foundations until enough Tier 0 solves', () => {
    const p = progress({ locksServed: 20, solvesByTier: { TIER_0: 2 } });
    expect(availableTiers(p)).toEqual([Tier.TIER_0]);
    expect(explainGate(p)).toMatch(/Foundations until 5 solves/);
  });

  it('opens "build the structure" once foundations are done', () => {
    const p = progress({ locksServed: 20, solvesByTier: { TIER_0: 5 } });
    expect(availableTiers(p)).toContain(Tier.TIER_0_5);
    expect(availableTiers(p)).not.toContain(Tier.TIER_1);
  });
});

describe('structures gate the families that depend on them', () => {
  it('withholds Tier 1 entirely until at least one structure is built', () => {
    // Greedy, backtracking and bit manipulation have no structural
    // prerequisite, so without an explicit floor a user could pass from
    // "reverse a string" straight to "partition a set" having built nothing.
    // Tier 0.5 is a phase, not a side quest.
    const p = progress({ locksServed: 20, solvesByTier: { TIER_0: 9 }, builtStructures: [] });
    expect(availableTiers(p)).toContain(Tier.TIER_0_5);
    expect(availableTiers(p)).not.toContain(Tier.TIER_1);
  });

  it('opens heap problems only after the heap is built', () => {
    // The brief's example, verbatim: build the heap before solving heap problems.
    // Roadmap parents are satisfied here so the structure is the only variable
    // under test — Heap sits below Trees, which sits below three more families.
    const reachedTrees = {
      ARRAYS_HASHING: 3,
      TWO_POINTERS: 3,
      BINARY_SEARCH: 3,
      SLIDING_WINDOW: 3,
      LINKED_LIST: 3,
      TREES: 3,
    };
    const before = progress({
      locksServed: 20,
      solvesByTier: { TIER_0: 9 },
      solvesByFamily: reachedTrees,
      builtStructures: ['cls:stack'],
    });
    expect(availableFamilies(before, Tier.TIER_1)).not.toContain(PatternFamily.HEAP_PRIORITY_QUEUE);
    expect(availableFamilies(before, Tier.TIER_1)).toContain(PatternFamily.STACK);

    const after = progress({
      locksServed: 20,
      solvesByTier: { TIER_0: 9 },
      solvesByFamily: reachedTrees,
      builtStructures: ['cls:stack', 'cls:min-heap', 'cls:priority-queue'],
    });
    expect(availableFamilies(after, Tier.TIER_1)).toContain(PatternFamily.HEAP_PRIORITY_QUEUE);
  });

  it('requires the whole prerequisite list, not part of it', () => {
    // Half a foundation is not half a chance. A graph problem needs the queue
    // *and* the adjacency structure; serving one because the other was built is
    // how a user concludes they are bad at graphs when they are missing a queue.
    const partial = ['cls:graph', 'cls:queue'];
    expect(isFamilyUnlocked(PatternFamily.GRAPHS, partial)).toBe(false);
    expect(isFamilyUnlocked(PatternFamily.GRAPHS, [...partial, 'cls:union-find'])).toBe(true);
  });

  it('lets families with no structural prerequisite through the structural gate', () => {
    // Backtracking needs recursion, not a data structure — so the *structural*
    // gate lets it through. The roadmap gate is what still holds it back, and
    // that separation is the point: two gates that fail differently.
    expect(isFamilyUnlocked(PatternFamily.BACKTRACKING, [])).toBe(true);

    const p = progress({ locksServed: 20, solvesByTier: { TIER_0: 9 }, builtStructures: [] });
    expect(availableFamilies(p, Tier.TIER_1)).not.toContain(PatternFamily.BACKTRACKING);
  });

  it('hides families whose structures are missing', () => {
    const p = progress({ locksServed: 20, solvesByTier: { TIER_0: 9 }, builtStructures: [] });
    expect(availableFamilies(p, Tier.TIER_1)).not.toContain(PatternFamily.TREES);
    expect(availableFamilies(p, Tier.TIER_1)).not.toContain(PatternFamily.GRAPHS);
  });

  it('does not open nine families for one dynamic array', () => {
    // The defect this gate was added for. Before the roadmap edges existed,
    // building `cls:dynamic-array` opened every family with no structural
    // prerequisite — backtracking, greedy, intervals, bit manipulation, both
    // dynamic programming families — plus the three that need only an array.
    // Two-dimensional DP sits six hops below the root; serving it here is not a
    // hard problem early, it is a problem before its vocabulary exists.
    const p = progress({
      locksServed: 20,
      solvesByTier: { TIER_0: 9 },
      builtStructures: ['cls:dynamic-array'],
    });
    const open = availableFamilies(p, Tier.TIER_1);
    expect(open).not.toContain(PatternFamily.DP_2D);
    expect(open).not.toContain(PatternFamily.MATH_GEOMETRY);
    expect(open).not.toContain(PatternFamily.TWO_POINTERS);
    expect(open).toEqual([]);
  });

  it('names prerequisites that actually exist in the signature registry', () => {
    // A dependency on a structure nobody can build is a permanent lock.
    for (const [family, required] of Object.entries(FAMILY_PREREQUISITES)) {
      for (const signatureId of required) {
        expect(SIGNATURE_IDS, `${family} requires ${signatureId}`).toContain(signatureId);
      }
    }
  });
});

describe('Tier 2 and Tier 3', () => {
  it('opens variations only after real practice in some family', () => {
    const fresh = graduated({ solvesByFamily: {} });
    expect(availableTiers(fresh)).not.toContain(Tier.TIER_2);

    const practised = graduated({ solvesByFamily: { STACK: 2 } });
    expect(availableTiers(practised)).toContain(Tier.TIER_2);
  });

  it('holds back breadth until a substantial body of Tier 1 solves', () => {
    const early = graduated({
      solvesByTier: { TIER_0: 10, TIER_1: 5 },
      solvesByFamily: { STACK: 2 },
    });
    expect(availableTiers(early)).not.toContain(Tier.TIER_3);

    const seasoned = graduated({
      solvesByTier: { TIER_0: 10, TIER_1: 25 },
      solvesByFamily: { STACK: 2 },
    });
    expect(availableTiers(seasoned)).toContain(Tier.TIER_3);
  });
});

describe('never leaving a user with nothing', () => {
  it('always returns at least one tier', () => {
    const cases = [
      progress(),
      progress({ locksServed: 1000 }),
      graduated(),
      progress({ locksServed: 7, solvesByTier: { TIER_0: 100 }, builtStructures: [] }),
    ];
    for (const p of cases) {
      expect(availableTiers(p).length).toBeGreaterThan(0);
    }
  });

  it('always offers at least one family at every available tier', () => {
    const p = graduated({ solvesByFamily: { STACK: 5 } });
    for (const tier of availableTiers(p)) {
      expect(availableFamilies(p, tier).length).toBeGreaterThan(0);
    }
  });

  it('keeps Tier 0 available forever, as the floor', () => {
    expect(availableTiers(graduated())).toContain(Tier.TIER_0);
  });
});

describe('what to build next', () => {
  it('recommends the structure that opens the most families', () => {
    // dynamic-array is required by four families; the trie by one. A user
    // asking "what next" should be pointed at the lever, not at the next
    // alphabetical item.
    const [first] = nextStructuresToBuild(progress({ locksServed: 20 }), 3);
    expect(first).toBe('cls:dynamic-array');
  });

  it('stops recommending a structure once it is built', () => {
    const built = ['cls:dynamic-array'];
    expect(nextStructuresToBuild(progress({ builtStructures: built }), 5)).not.toContain(
      'cls:dynamic-array',
    );
  });

  it('has nothing left to recommend once everything is built', () => {
    expect(nextStructuresToBuild(graduated())).toEqual([]);
  });

  it('still has a roadmap to walk once every structure is built', () => {
    // Building everything is not the same as having met everything. Before the
    // roadmap gate this user was told "All pattern families open" while having
    // solved nothing at Tier 1 — true of their shelf, false of their head.
    expect(explainGate(graduated())).toMatch(/Solve 3 more in ARRAYS_HASHING/);
  });

  it('reports everything open only when the whole roadmap is walked', () => {
    const everyFamily = Object.fromEntries(
      (Object.values(PatternFamily) as PatternFamily[]).map((f) => [f, ROADMAP_UNLOCK_SOLVES]),
    ) as Partial<Record<PatternFamily, number>>;
    expect(explainGate(graduated({ solvesByFamily: everyFamily }))).toBe('All pattern families open.');
  });
});

describe('the roadmap orders families, above difficulty', () => {
  /** Every structure built, so the roadmap is the only gate left standing. */
  const built = (over: Partial<ProgressSnapshot> = {}): ProgressSnapshot =>
    progress({
      locksServed: 50,
      solvesByTier: { TIER_0: 10, TIER_0_5: 15 },
      builtStructures: SIGNATURE_IDS.filter((id) => id.startsWith('cls:')),
      ...over,
    });

  it('starts everyone at the root and nowhere else', () => {
    // Arrays & Hashing is the way in. Not "mostly" — exactly one family.
    expect(availableFamilies(built(), Tier.TIER_1)).toEqual([PatternFamily.ARRAYS_HASHING]);
  });

  it('opens a child only at the full solve threshold, not one short', () => {
    const short = built({ solvesByFamily: { ARRAYS_HASHING: ROADMAP_UNLOCK_SOLVES - 1 } });
    expect(availableFamilies(short, Tier.TIER_1)).not.toContain(PatternFamily.TWO_POINTERS);

    const met = built({ solvesByFamily: { ARRAYS_HASHING: ROADMAP_UNLOCK_SOLVES } });
    const open = availableFamilies(met, Tier.TIER_1);
    expect(open).toContain(PatternFamily.TWO_POINTERS);
    expect(open).toContain(PatternFamily.STACK);
  });

  it('requires every roadmap parent, not just one', () => {
    // Trees descends from binary search, sliding window AND linked lists.
    // Arriving via one of the three is how a user concludes they are bad at
    // trees when they have simply never held two pointers.
    const one = built({
      solvesByFamily: { ARRAYS_HASHING: 3, TWO_POINTERS: 3, BINARY_SEARCH: 3 },
    });
    expect(availableFamilies(one, Tier.TIER_1)).not.toContain(PatternFamily.TREES);

    const all = built({
      solvesByFamily: {
        ARRAYS_HASHING: 3,
        TWO_POINTERS: 3,
        BINARY_SEARCH: 3,
        SLIDING_WINDOW: 3,
        LINKED_LIST: 3,
      },
    });
    expect(availableFamilies(all, Tier.TIER_1)).toContain(PatternFamily.TREES);
  });

  it('keeps the deepest families shut until the whole path is walked', () => {
    // Math & Geometry is the last node on the roadmap. Nothing short of the
    // full traversal should reach it.
    const nearly = built({
      solvesByFamily: {
        ARRAYS_HASHING: 9,
        TWO_POINTERS: 9,
        BINARY_SEARCH: 9,
        SLIDING_WINDOW: 9,
        LINKED_LIST: 9,
        TREES: 9,
        BACKTRACKING: 9,
        GRAPHS: 9,
        DP_1D: 9,
      },
    });
    const open = availableFamilies(nearly, Tier.TIER_1);
    expect(open).toContain(PatternFamily.DP_2D);
    expect(open).toContain(PatternFamily.BIT_MANIPULATION);
    expect(open).not.toContain(PatternFamily.MATH_GEOMETRY);
  });

  it('is a DAG — no family reaches itself through its parents', () => {
    // A cycle here is a permanent lock that no amount of solving escapes, and
    // it would be invisible until a user actually got that far.
    const reaches = (from: PatternFamily, target: PatternFamily, seen = new Set<PatternFamily>()): boolean => {
      if (seen.has(from)) return false;
      seen.add(from);
      return ROADMAP_PREREQUISITES[from].some((p) => p === target || reaches(p, target, seen));
    };
    for (const family of Object.values(PatternFamily) as PatternFamily[]) {
      expect(reaches(family, family), `${family} depends on itself`).toBe(false);
    }
  });

  it('roots every family at Arrays & Hashing', () => {
    // An orphan family is unreachable by construction: nothing opens it.
    const roots: PatternFamily[] = [
      PatternFamily.FOUNDATIONS,
      PatternFamily.DATA_STRUCTURES,
      PatternFamily.ARRAYS_HASHING,
    ];
    // Each branch gets its own path set — a shared one would let the first
    // parent's traversal mark nodes that the second then reads as a cycle.
    const climbs = (f: PatternFamily, path: ReadonlySet<PatternFamily> = new Set()): boolean => {
      if (roots.includes(f)) return true;
      if (path.has(f)) return false;
      const next = new Set(path).add(f);
      const parents = ROADMAP_PREREQUISITES[f];
      return parents.length > 0 && parents.every((p) => climbs(p, next));
    };
    for (const family of Object.values(PatternFamily) as PatternFamily[]) {
      expect(climbs(family), `${family} is orphaned from the roadmap root`).toBe(true);
    }
  });

  it('always leaves something to serve at every open tier', () => {
    // The rule no gate in this file is allowed to break: a locked machine with
    // nothing to show is worse than a problem served slightly early.
    const walker = built({ solvesByFamily: { ARRAYS_HASHING: 3 } });
    for (const tier of availableTiers(walker)) {
      expect(availableFamilies(walker, tier).length, `nothing to serve at ${tier}`).toBeGreaterThan(0);
    }
  });

  it('tells the user which family to practise, not which structure to build', () => {
    // Every structure is built, so "build cls:trie" would be a lie they cannot
    // act on. The blocker is roadmap practice, and the sentence must say so.
    const p = built({ solvesByFamily: { ARRAYS_HASHING: 1 } });
    expect(nextFamiliesToPractise(p, 1)).toEqual([PatternFamily.ARRAYS_HASHING]);
    expect(explainGate(p)).toMatch(/Solve 2 more in ARRAYS_HASHING/);
  });

  it('proposes only families the user can actually be served', () => {
    // Advising practice in a family that is itself shut is the same permanent
    // lock, one level up.
    const p = built({ solvesByFamily: { ARRAYS_HASHING: 3 } });
    for (const family of nextFamiliesToPractise(p, 5)) {
      expect(availableFamilies(p, Tier.TIER_1), `${family} was proposed but is shut`).toContain(family);
    }
  });
});
