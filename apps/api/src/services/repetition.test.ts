import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { excludedFromLocks, type ServedRecord } from './repetition.js';
import { advanceSkillState, emptySkillSnapshot, markDueForReview, type SkillSnapshot } from './skills.js';

/**
 * Why a solved problem may not come back as a full lock.
 *
 * Reproduced from the owner's own history on 2026-09-15: every skill a Tier 0
 * text problem needs was demonstrated, and the problem was still eligible to
 * return the moment 21 days passed, at full weight. A solve of something
 * already mastered teaches nothing and surprises nobody.
 */

const DAY = 86_400_000;
const now = new Date('2026-09-16T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);

const textProblem = {
  id: 'p-shout',
  signatureId: 'fn:string->string',
  patternTags: ['strings'] as string[],
  tier: 'TIER_0' as const,
  patternFamily: 'FOUNDATIONS' as const,
};

const demonstratedText = (): SkillSnapshot => {
  const snap = emptySkillSnapshot();
  for (const skill of ['values', 'strings'] as const) {
    snap[skill] = advanceSkillState(advanceSkillState(snap[skill], false), false);
  }
  return snap;
};

const record = (over: Partial<ServedRecord> = {}): ServedRecord => ({
  problem: textProblem,
  solved: true,
  lastAt: daysAgo(30),
  ...over,
});

describe('a solved problem whose skills are all demonstrated stays out of full locks', () => {
  it('does not return just because the 21-day cooldown has passed', () => {
    const out = excludedFromLocks([record({ lastAt: daysAgo(30) })], demonstratedText(), now);
    assert.ok(out.has('p-shout'), 'mastered and solved a month ago must still be excluded');
  });

  it('is excluded inside the cooldown as before', () => {
    const out = excludedFromLocks([record({ lastAt: daysAgo(1) })], demonstratedText(), now);
    assert.ok(out.has('p-shout'));
  });

  it('may return once one of its skills is due for review', () => {
    const snap = demonstratedText();
    snap.strings = markDueForReview(snap.strings);
    const out = excludedFromLocks([record({ lastAt: daysAgo(30) })], snap, now);
    assert.ok(!out.has('p-shout'), 'review is the one reason a solved problem comes back');
  });

  it('may return when it still carries a skill that is not demonstrated', () => {
    const snap = demonstratedText();
    snap.strings = advanceSkillState(emptySkillSnapshot().strings, true); // met with help only
    const out = excludedFromLocks([record({ lastAt: daysAgo(30) })], snap, now);
    assert.ok(!out.has('p-shout'), 'further practice on a shaky skill is legitimate');
  });

  it('lets an attempted-but-unsolved problem return after the cooldown', () => {
    const out = excludedFromLocks([record({ solved: false, lastAt: daysAgo(30) })], demonstratedText(), now);
    assert.ok(!out.has('p-shout'));
  });

  it('keeps an attempted-but-unsolved problem out inside the cooldown', () => {
    const out = excludedFromLocks([record({ solved: false, lastAt: daysAgo(3) })], demonstratedText(), now);
    assert.ok(out.has('p-shout'));
  });
});
