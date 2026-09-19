import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SKILL_REVIEW_DAYS,
  dedupeEpisodes,
  replaySkillSnapshot,
  type SolveRecord,
} from './skillState.js';
import { isSatisfied, skillsRequiredBy, type SkillProblem } from './skills.js';

/**
 * Tests for deriving skill state from solve history.
 *
 * `replaySkillSnapshot` is the whole rule; `loadSkillSnapshot` around it is two
 * queries and a map. Keeping the rule pure is what makes it testable with no
 * database, which is why it is shaped this way.
 */

const DAY = 86_400_000;
const NOW = new Date('2026-09-12T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);

const problem = (over: Partial<SkillProblem> = {}): SkillProblem => ({
  signatureId: 'fn:int->int',
  patternTags: ['arithmetic'],
  tier: 'TIER_0',
  patternFamily: 'FOUNDATIONS',
  ...over,
});

let nextId = 0;

/** A distinct solve by default, so nothing is deduplicated by accident. */
const solve = (over: Partial<SolveRecord> = {}): SolveRecord => ({
  problemId: `problem-${++nextId}`,
  sessionId: `session-${nextId}`,
  problem: problem(),
  assisted: false,
  solvedAt: daysAgo(1),
  ...over,
});

describe('deriving a snapshot from history', () => {
  it('starts everyone at not_introduced', () => {
    const snapshot = replaySkillSnapshot([], NOW);
    for (const record of Object.values(snapshot)) {
      assert.equal(record.state, 'not_introduced');
      assert.equal(record.unaidedSolves, 0);
    }
  });

  it('introduces a skill on one unaided solve without demonstrating it', () => {
    const snapshot = replaySkillSnapshot([solve()], NOW);
    assert.equal(snapshot.values.state, 'practised_with_help');
    assert.equal(isSatisfied(snapshot.values), false);
  });

  it('demonstrates a skill on the second unaided solve', () => {
    const snapshot = replaySkillSnapshot([solve(), solve({ solvedAt: daysAgo(2) })], NOW);
    assert.equal(snapshot.values.state, 'demonstrated');
  });

  it('never demonstrates from assisted solves, however many', () => {
    const solves = Array.from({ length: 12 }, (_, i) =>
      solve({ assisted: true, solvedAt: daysAgo(i + 1) }),
    );
    const snapshot = replaySkillSnapshot(solves, NOW);
    assert.equal(snapshot.values.state, 'practised_with_help');
    assert.equal(snapshot.values.unaidedSolves, 0);
    assert.equal(snapshot.values.assistedSolves, 12);
  });

  it('replays oldest first, so the order of the input cannot change the outcome', () => {
    // The state machine is order-dependent, and the query that feeds it reads
    // newest-first. If the sort were dropped, an assisted solve recorded later
    // would be applied before the earlier unaided ones.
    const a = solve({ solvedAt: daysAgo(5) });
    const b = solve({ solvedAt: daysAgo(4) });
    const c = solve({ assisted: true, solvedAt: daysAgo(3) });

    const forwards = replaySkillSnapshot([a, b, c], NOW);
    const backwards = replaySkillSnapshot([c, b, a], NOW);
    assert.deepEqual(backwards, forwards);
    assert.equal(forwards.values.state, 'demonstrated');
  });

  it('credits every skill the problem needs, not only its headline one', () => {
    const loops = problem({ signatureId: 'fn:ints->int', patternTags: ['loops', 'arrays'] });
    const required = skillsRequiredBy(loops);
    const snapshot = replaySkillSnapshot([solve({ problem: loops })], NOW);

    assert.ok(required.length > 1, 'a loop problem should require its prerequisites too');
    for (const skill of required) {
      assert.notEqual(snapshot[skill].state, 'not_introduced', `${skill} was not credited`);
    }
  });
});

describe('when a skill goes stale', () => {
  const twice = (at: number): SolveRecord[] => [
    solve({ solvedAt: daysAgo(at) }),
    solve({ solvedAt: daysAgo(at + 1) }),
  ];

  it('leaves a recently practised skill demonstrated', () => {
    const snapshot = replaySkillSnapshot(twice(1), NOW);
    assert.equal(snapshot.values.state, 'demonstrated');
  });

  it('marks a skill due for review once it is older than the window', () => {
    const snapshot = replaySkillSnapshot(twice(SKILL_REVIEW_DAYS + 1), NOW);
    assert.equal(snapshot.values.state, 'due_for_review');
  });

  it('keeps a due skill satisfied, so nothing downstream re-locks', () => {
    // The point of the review mechanism: it is an invitation, never a
    // demotion. If this failed, a fortnight away would re-lock the corpus.
    const snapshot = replaySkillSnapshot(twice(SKILL_REVIEW_DAYS + 30), NOW);
    assert.equal(isSatisfied(snapshot.values), true);
    assert.equal(snapshot.values.unaidedSolves, 2);
  });

  it('does not mark a skill that was never demonstrated', () => {
    const snapshot = replaySkillSnapshot([solve({ solvedAt: daysAgo(400) })], NOW);
    assert.equal(snapshot.values.state, 'practised_with_help');
  });

  it('measures staleness from the most recent practice, not the first', () => {
    const snapshot = replaySkillSnapshot(
      [...twice(SKILL_REVIEW_DAYS + 10), solve({ solvedAt: daysAgo(1) })],
      NOW,
    );
    assert.equal(snapshot.values.state, 'demonstrated');
  });
});

describe('one solving occasion counts once', () => {
  it('collapses a slow pass and its faster resubmission', () => {
    // Both rows are accepted submissions: ACCEPTED_TOO_SLOW followed by
    // ACCEPTED. Counted separately they would demonstrate a skill from one
    // piece of work, which is the false mastery claim this layer exists to
    // prevent.
    const slow = solve({ problemId: 'p1', sessionId: 's1', solvedAt: daysAgo(3) });
    const fast = { ...slow, solvedAt: daysAgo(2.9) };

    assert.equal(dedupeEpisodes([slow, fast]).length, 1);
    const snapshot = replaySkillSnapshot([slow, fast], NOW);
    assert.equal(snapshot.values.unaidedSolves, 1);
    assert.equal(snapshot.values.state, 'practised_with_help');
  });

  it('keeps the earliest of a group, whose help record describes the work', () => {
    const first = solve({ problemId: 'p1', sessionId: 's1', solvedAt: daysAgo(3), assisted: true });
    const later = { ...first, solvedAt: daysAgo(2), assisted: false };

    const [kept] = dedupeEpisodes([later, first]);
    assert.equal(kept?.assisted, true);
    assert.equal(kept?.solvedAt.getTime(), first.solvedAt.getTime());
  });

  it('counts the same problem again in a later session as real practice', () => {
    const monday = solve({ problemId: 'p1', sessionId: 's1', solvedAt: daysAgo(8) });
    const friday = solve({ problemId: 'p1', sessionId: 's2', solvedAt: daysAgo(1) });

    assert.equal(dedupeEpisodes([monday, friday]).length, 2);
    assert.equal(replaySkillSnapshot([monday, friday], NOW).values.state, 'demonstrated');
  });

  it('collapses sessionless resubmissions within a sitting, across midnight, and keeps a later sitting', () => {
    const late = solve({ problemId: 'p1', sessionId: null, solvedAt: new Date('2026-09-10T23:59:00Z') });
    const justAfter = solve({ problemId: 'p1', sessionId: null, solvedAt: new Date('2026-09-11T00:01:00Z') });
    const nextWeek = solve({ problemId: 'p1', sessionId: null, solvedAt: new Date('2026-09-17T10:00:00Z') });
    const kept = dedupeEpisodes([nextWeek, justAfter, late]);
    assert.equal(kept.length, 2);
    assert.ok(kept.some((s) => s.solvedAt.getTime() === late.solvedAt.getTime()), 'the earliest of the sitting is kept');
  });

  it('does not collapse different problems in one session', () => {
    const a = solve({ problemId: 'p1', sessionId: 's1', solvedAt: daysAgo(2) });
    const b = solve({ problemId: 'p2', sessionId: 's1', solvedAt: daysAgo(1) });
    assert.equal(dedupeEpisodes([a, b]).length, 2);
  });
});
