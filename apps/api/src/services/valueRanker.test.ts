import { describe, expect, it } from 'vitest';
import {
  ANSWER_LOOKUP_CEILING,
  DEFAULT_UNLOCK_THRESHOLD,
  WEIGHTS,
  adjustFromSolveData,
  explain,
  isEligibleForUnlock,
  judgeability,
  lockWindowFit,
  rank,
  rankOf,
  scoreComponents,
  valueScore,
  type RankInput,
} from './valueRanker.js';

/**
 * The ranker decides what a user is handed when their screen is taken. These
 * tests are about the *properties* the brief demands, not the constants — the
 * numbers should stay tunable without rewriting the suite, but the promises
 * must not.
 */

const problem = (over: Partial<RankInput> = {}): RankInput => ({
  tier: 'TIER_1',
  source: 'codelock-authored',
  avgSolveSeconds: 600,
  editorialMarkdown: 'x'.repeat(400),
  testCaseCount: 8,
  ...over,
});

describe('the weighted sum', () => {
  it('treats a good explanation as a merit, not a leak', () => {
    // The easiest sign error in this file, and the one that would hurt this
    // audience most: the editorial is gated behind the resolution, so a
    // well-explained problem is strictly better for a learner.
    expect(WEIGHTS.explanationQuality).toBeGreaterThan(0);

    const explained = rank(problem({ editorialMarkdown: 'x'.repeat(400) }));
    const bare = rank(problem({ editorialMarkdown: null, editorialUrl: null }));
    expect(explained.valueScore).toBeGreaterThan(bare.valueScore);
  });

  it('penalises answer-lookup risk as hard as it rewards the best component', () => {
    expect(WEIGHTS.answerLookupRisk).toBe(-WEIGHTS.patternTransfer);
  });

  it('uses exactly the weights from the brief', () => {
    const sumOfPositives =
      WEIGHTS.patternTransfer +
      WEIGHTS.interviewFrequency +
      WEIGHTS.lockWindowFit +
      WEIGHTS.explanationQuality +
      WEIGHTS.judgeability;
    expect(sumOfPositives).toBeCloseTo(1, 10);
  });

  it('clamps components rather than letting a bad row swing the score', () => {
    const wild = valueScore({
      patternTransfer: 99,
      interviewFrequency: -99,
      lockWindowFit: 0.5,
      explanationQuality: 0.5,
      judgeability: 0.5,
      answerLookupRisk: 0,
    });
    const clamped = valueScore({
      patternTransfer: 1,
      interviewFrequency: 0,
      lockWindowFit: 0.5,
      explanationQuality: 0.5,
      judgeability: 0.5,
      answerLookupRisk: 0,
    });
    expect(wild).toBeCloseTo(clamped, 10);
  });
});

describe('cold start, seeded from the canonical list taxonomy', () => {
  it('starts a Tier 1 canonical problem at rank S', () => {
    expect(rank(problem({ tier: 'TIER_1' })).rank).toBe('S');
  });

  it('starts a Tier 0.5 "build the structure" problem at rank A', () => {
    expect(rank(problem({ tier: 'TIER_0_5' })).rank).toBe('A');
  });

  it('ranks Tier 1 above Tier 2 above Tier 3, all else equal', () => {
    const score = (tier: RankInput['tier']) => rank(problem({ tier })).valueScore;
    expect(score('TIER_1')).toBeGreaterThan(score('TIER_2'));
    expect(score('TIER_2')).toBeGreaterThan(score('TIER_3'));
  });

  it('still lets a Tier 0 problem be served, despite low interview frequency', () => {
    // Tier 0 is served because the user is not ready for Tier 1, not because it
    // out-ranked one. Ranking low must not mean ineligible.
    const tier0 = rank(problem({ tier: 'TIER_0' }));
    expect(tier0.interviewFrequency).toBeLessThan(0.5);
    expect(tier0.eligibleForUnlock).toBe(true);
  });
});

describe('answer-lookup risk', () => {
  it('drops a single-published-integer problem out of the unlock pool', () => {
    // The Project Euler shape. It must fall out through the score, not through
    // a branch naming the source — so the source here is deliberately something
    // else entirely.
    const euler = rank(
      problem({
        source: 'some-future-corpus',
        hasPublishedSingleAnswer: true,
        editorialMarkdown: null,
        editorialUrl: null,
        tier: 'TIER_3',
      }),
    );
    expect(euler.answerLookupRisk).toBeGreaterThanOrEqual(ANSWER_LOOKUP_CEILING);
    expect(euler.eligibleForUnlock).toBe(false);
  });

  it('excludes a searchable problem even when it scores well otherwise', () => {
    // The dangerous combination: high value AND public answer. The ceiling is
    // not redundant with the threshold precisely because of this case.
    const strong = rank(problem({ tier: 'TIER_1', hasPublishedSingleAnswer: true }));
    expect(strong.valueScore).toBeGreaterThan(DEFAULT_UNLOCK_THRESHOLD);
    expect(strong.eligibleForUnlock).toBe(false);
  });

  it('does not treat a hosted editorial as a leak', () => {
    const withEditorial = scoreComponents(problem({ editorialMarkdown: 'x'.repeat(400) }));
    const without = scoreComponents(problem({ editorialMarkdown: null }));
    expect(withEditorial.answerLookupRisk).toBeLessThan(without.answerLookupRisk);
    expect(withEditorial.answerLookupRisk).toBeLessThan(ANSWER_LOOKUP_CEILING);
  });

  it('requires both conditions for eligibility', () => {
    expect(isEligibleForUnlock(0.9, 0.9)).toBe(false); // good score, public answer
    expect(isEligibleForUnlock(0.1, 0.1)).toBe(false); // private answer, weak problem
    expect(isEligibleForUnlock(0.9, 0.1)).toBe(true);
  });
});

describe('lock-window fit', () => {
  it('peaks at about ten minutes', () => {
    expect(lockWindowFit(600)).toBeGreaterThan(lockWindowFit(60));
    expect(lockWindowFit(600)).toBeGreaterThan(lockWindowFit(2400));
  });

  it('punishes a problem that traps the user far harder than a quick one', () => {
    // Being stuck behind an unsolvable problem with your screen gone is the
    // state the escape hatch exists for. Trivially quick is merely wasteful.
    expect(lockWindowFit(120)).toBeGreaterThan(lockWindowFit(3600));
  });

  it('never leaves the unit interval', () => {
    for (const s of [0, 1, 60, 600, 6000, 86_400]) {
      expect(lockWindowFit(s)).toBeGreaterThanOrEqual(0);
      expect(lockWindowFit(s)).toBeLessThanOrEqual(1);
    }
  });
});

describe('judgeability', () => {
  it('is zero with no test cases, so an unjudgeable problem cannot rank', () => {
    expect(judgeability(0)).toBe(0);
  });

  it('rises with test coverage and saturates', () => {
    expect(judgeability(1)).toBeLessThan(judgeability(4));
    expect(judgeability(4)).toBeLessThan(judgeability(8));
    expect(judgeability(50)).toBeLessThanOrEqual(1);
  });
});

describe('explainability', () => {
  it('returns one line per component plus a verdict', () => {
    const lines = explain(rank(problem()));
    expect(lines).toHaveLength(8);
    for (const name of [
      'Pattern transfer',
      'Interview frequency',
      'Lock-window fit',
      'Explanation quality',
      'Judgeability',
      'Answer-lookup risk',
    ]) {
      expect(lines.some((l) => l.startsWith(name))).toBe(true);
    }
  });

  it('says which of the two eligibility conditions failed', () => {
    const searchable = explain(rank(problem({ hasPublishedSingleAnswer: true })));
    expect(searchable.at(-1)).toMatch(/single published value/);

    const weak = explain(
      rank(problem({ tier: 'TIER_0', testCaseCount: 0, editorialMarkdown: null, editorialUrl: null })),
    );
    expect(weak.at(-1)).toMatch(/below threshold/);
  });
});

describe('learning from solve data', () => {
  it('ignores a handful of attempts', () => {
    const seeded = { patternTransfer: 0.95, interviewFrequency: 0.9 };
    expect(adjustFromSolveData(seeded, { attempts: 5, solves: 0 })).toEqual(seeded);
  });

  it('pulls a problem nobody can solve away from its seed', () => {
    const seeded = { patternTransfer: 0.95, interviewFrequency: 0.9 };
    const adjusted = adjustFromSolveData(seeded, { attempts: 100, solves: 2 });
    expect(adjusted.patternTransfer).toBeLessThan(seeded.patternTransfer);
  });

  it('never lets our own usage rewrite what interviews ask', () => {
    // solveCount measures what CodeLock happened to serve. Letting it move
    // interview frequency would amplify whatever was served first.
    const seeded = { patternTransfer: 0.95, interviewFrequency: 0.9 };
    const adjusted = adjustFromSolveData(seeded, { attempts: 1000, solves: 999 });
    expect(adjusted.interviewFrequency).toBe(seeded.interviewFrequency);
  });

  it('stays within the unit interval under absurd data', () => {
    const adjusted = adjustFromSolveData(
      { patternTransfer: 1, interviewFrequency: 1 },
      { attempts: 10_000, solves: 0 },
    );
    expect(adjusted.patternTransfer).toBeGreaterThanOrEqual(0);
    expect(adjusted.patternTransfer).toBeLessThanOrEqual(1);
  });
});

describe('rank boundaries', () => {
  it('is monotonic in score', () => {
    const order = { S: 3, A: 2, B: 1, C: 0 };
    let previous = -1;
    for (const score of [0, 0.2, 0.45, 0.5, 0.6, 0.7, 0.75, 0.9, 1.2]) {
      const current = order[rankOf(score)];
      expect(current).toBeGreaterThanOrEqual(previous);
      previous = current;
    }
  });
});
