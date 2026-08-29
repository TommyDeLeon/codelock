import { PatternFamily, Tier } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  FAMILY_PREREQUISITES,
  TIER_0_LOCK_COUNT,
  availableFamilies,
  availableTiers,
  emptyProgress,
  explainGate,
  isFamilyUnlocked,
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
    const before = progress({
      locksServed: 20,
      solvesByTier: { TIER_0: 9 },
      builtStructures: ['cls:stack'],
    });
    expect(availableFamilies(before, Tier.TIER_1)).not.toContain(PatternFamily.HEAP_PRIORITY_QUEUE);
    expect(availableFamilies(before, Tier.TIER_1)).toContain(PatternFamily.STACK);

    const after = progress({
      locksServed: 20,
      solvesByTier: { TIER_0: 9 },
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

  it('lets families with no structural prerequisite through immediately', () => {
    const p = progress({ locksServed: 20, solvesByTier: { TIER_0: 9 }, builtStructures: [] });
    // Backtracking needs recursion, not a data structure.
    expect(isFamilyUnlocked(PatternFamily.BACKTRACKING, [])).toBe(true);
    expect(availableFamilies(p, Tier.TIER_1)).toContain(PatternFamily.BACKTRACKING);
  });

  it('hides families whose structures are missing', () => {
    const p = progress({ locksServed: 20, solvesByTier: { TIER_0: 9 }, builtStructures: [] });
    expect(availableFamilies(p, Tier.TIER_1)).not.toContain(PatternFamily.TREES);
    expect(availableFamilies(p, Tier.TIER_1)).not.toContain(PatternFamily.GRAPHS);
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
    expect(explainGate(graduated())).toBe('All pattern families open.');
  });
});
