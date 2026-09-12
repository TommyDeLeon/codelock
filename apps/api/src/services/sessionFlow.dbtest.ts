import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { Difficulty, LockState, UnlockOutcome } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { releaseLock } from './lockSessions.js';
import { recordFailure } from './grading.js';
import { completeActivity, offerActivity, swapProblem } from './sessionFlow.js';

/**
 * Database-backed tests for the session-flow controls.
 *
 * The pure tests beside this file cover the decision rules. These cover what
 * those cannot: the conditional updates, the transaction, and the races that
 * two reviews named as the real risks — a stale judge result releasing a
 * replaced assignment, a swap refusing rather than serving something that was
 * not asked for, and a participation release that must be all-or-nothing and
 * must touch nothing on the difficulty ladder.
 *
 * ## Only ever against a disposable database
 *
 * This file writes and deletes rows. It refuses to run unless DATABASE_URL
 * names a database whose name ends in `_test`, and it checks that before any
 * query. The owner's own database must never be the target, however it is
 * invoked. Run with:
 *
 *   DATABASE_URL=postgresql://codelock:codelock@localhost:5433/codelock_test \
 *   JWT_UNLOCK_SECRET=<32+ characters> npm run test:db
 */

const url = process.env.DATABASE_URL ?? '';
const databaseName = url.split('?')[0]?.split('/').pop() ?? '';
if (!databaseName.endsWith('_test')) {
  throw new Error(
    `Refusing to run database tests against "${databaseName || '(none)'}". ` +
      'Point DATABASE_URL at a disposable database whose name ends in _test.',
  );
}

// The imports above are evaluated before this guard runs, and that is safe:
// none of them opens a connection or writes anything at import time. The first
// query is in `before`, which only runs once this check has passed.

type DifficultyValue = (typeof Difficulty)[keyof typeof Difficulty];

/** Rows created by one test, so each can clean up after itself. */
interface Fixture {
  userId: string;
  problemIds: string[];
}

const created: Fixture[] = [];

/** One learner with progress, a timer config, and no skips at all. */
async function makeLearner(progress: { difficulty?: DifficultyValue; failures?: number } = {}) {
  const tag = randomUUID();
  const user = await prisma.user.create({
    data: { email: `flow-${tag}@test.local`, displayName: 'Flow test' },
  });
  await prisma.userProgress.create({
    data: {
      userId: user.id,
      currentDifficulty: progress.difficulty ?? Difficulty.EASY,
      consecutiveFailures: progress.failures ?? 0,
      totalSolved: 3,
      totalFailed: 2,
    },
  });
  // Zero on purpose: the controls must work for someone with no skips left,
  // or they are a skip under another name.
  await prisma.timerConfig.create({ data: { userId: user.id, dailySkipAllowance: 0 } });

  const fixture: Fixture = { userId: user.id, problemIds: [] };
  created.push(fixture);
  return { user, fixture, tag };
}

/** A problem a brand-new learner is ready for: one value in, one out. */
async function makeProblem(
  fixture: Fixture,
  tag: string,
  name: string,
  difficulty: DifficultyValue,
) {
  const problem = await prisma.problem.create({
    data: {
      slug: `flow-${tag}-${name}`,
      title: `Flow ${name}`,
      difficulty,
      promptMarkdown: 'Return the last digit.',
      starterCode: {},
      driverCode: {},
      referenceRuntimeMs: {},
      tier: 'TIER_0',
      patternFamily: 'FOUNDATIONS',
      patternTags: ['arithmetic'],
      signatureId: 'fn:int->int',
      testCases: {
        create: [{ ordinal: 0, stdin: '1234', expectedStdout: '4', isSample: true }],
      },
    },
  });
  fixture.problemIds.push(problem.id);
  return problem;
}

async function makeLockedSession(userId: string, problemId: string, difficulty: DifficultyValue) {
  return prisma.lockSession.create({
    data: {
      userId,
      problemId,
      difficulty,
      state: LockState.LOCKED,
      fireAt: new Date(Date.now() - 60_000),
      lockedAt: new Date(Date.now() - 30_000),
    },
  });
}

/**
 * Keep only this test's problems active, so a swap's candidate pool is exactly
 * the fixtures and the outcome is deterministic. Returns a restore function.
 */
async function isolate(keep: string[]) {
  const others = await prisma.problem.findMany({
    where: { isActive: true, id: { notIn: keep } },
    select: { id: true },
  });
  const ids = others.map((p) => p.id);
  await prisma.problem.updateMany({ where: { id: { in: ids } }, data: { isActive: false } });
  return () => prisma.problem.updateMany({ where: { id: { in: ids } }, data: { isActive: true } });
}

/** Fire-and-forget log writes land after the call returns; let them settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

before(async () => {
  await prisma.$queryRaw`select 1`;
});

after(async () => {
  await settle();
  for (const fixture of created) {
    await prisma.user.deleteMany({ where: { id: fixture.userId } });
    await prisma.problem.deleteMany({ where: { id: { in: fixture.problemIds } } });
  }
  await prisma.$disconnect();
});

describe('a stale result cannot release a replaced assignment', { concurrency: false }, () => {
  it('refuses the first A after swapping A to B and back to A', async () => {
    const { user, fixture, tag } = await makeLearner();
    const a = await makeProblem(fixture, tag, 'a', Difficulty.EASY);
    const b = await makeProblem(fixture, tag, 'b', Difficulty.EASY);
    const session = await makeLockedSession(user.id, a.id, Difficulty.EASY);
    const restore = await isolate([a.id, b.id]);

    try {
      // A submission for A would have captured this revision when it began.
      const revisionWhenSubmitted = session.problemRevision;

      // EASY is the floor, so "too hard" offers another EASY problem. With only
      // two problems active, the first swap must be B and the second A.
      const first = await swapProblem({
        userId: user.id,
        sessionId: session.id,
        request: 'too_hard',
      });
      assert.equal(first.problem.id, b.id);
      assert.equal(first.sameBand, true, 'the floor offer must be labelled as the same level');

      const second = await swapProblem({
        userId: user.id,
        sessionId: session.id,
        request: 'too_hard',
      });
      assert.equal(second.problem.id, a.id, 'the session is back on A');

      // The judge result for the original A now arrives.
      await assert.rejects(
        releaseLock({
          userId: user.id,
          sessionId: session.id,
          problemId: a.id,
          problemRevision: revisionWhenSubmitted,
        }),
        /no longer the one this lock is showing/,
      );

      const row = await prisma.lockSession.findUniqueOrThrow({ where: { id: session.id } });
      assert.equal(row.state, LockState.LOCKED, 'the lock must still be up');
      assert.equal(row.problemRevision, revisionWhenSubmitted + 2);
      assert.equal(row.adjusted, true, 'the swap must have persisted its protection');
    } finally {
      await restore();
    }
  });

  it('still releases for a result graded against the current assignment', async () => {
    const { user, fixture, tag } = await makeLearner();
    const a = await makeProblem(fixture, tag, 'a', Difficulty.EASY);
    const b = await makeProblem(fixture, tag, 'b', Difficulty.EASY);
    const session = await makeLockedSession(user.id, a.id, Difficulty.EASY);
    const restore = await isolate([a.id, b.id]);

    try {
      const swapped = await swapProblem({
        userId: user.id,
        sessionId: session.id,
        request: 'too_hard',
      });
      const current = await prisma.lockSession.findUniqueOrThrow({ where: { id: session.id } });

      const { unlockToken } = await releaseLock({
        userId: user.id,
        sessionId: session.id,
        problemId: swapped.problem.id,
        problemRevision: current.problemRevision,
      });
      assert.ok(unlockToken.length > 0);

      const row = await prisma.lockSession.findUniqueOrThrow({ where: { id: session.id } });
      assert.equal(row.state, LockState.UNLOCKED);
    } finally {
      await restore();
    }
  });
});

describe('a swap refuses rather than serve what was not asked for', { concurrency: false }, () => {
  it('leaves a MEDIUM problem in place when no ready EASY problem exists', async () => {
    const { user, fixture, tag } = await makeLearner({ difficulty: Difficulty.MEDIUM });
    const current = await makeProblem(fixture, tag, 'current', Difficulty.MEDIUM);
    // Another MEDIUM problem exists and is ready. The old fallback would have
    // served it under a "smaller" label.
    const other = await makeProblem(fixture, tag, 'other-medium', Difficulty.MEDIUM);
    const session = await makeLockedSession(user.id, current.id, Difficulty.MEDIUM);
    const restore = await isolate([current.id, other.id]);

    try {
      await assert.rejects(
        swapProblem({ userId: user.id, sessionId: session.id, request: 'too_hard' }),
        /nothing smaller available/,
      );
    } finally {
      await restore();
    }

    const row = await prisma.lockSession.findUniqueOrThrow({ where: { id: session.id } });
    assert.equal(row.problemId, current.id, 'the problem must not change');
    assert.equal(row.problemRevision, session.problemRevision, 'nothing was assigned');
    assert.equal(row.adjusted, false, 'a refused swap must not mark the session adjusted');
  });
});

describe('saying a problem was too hard never costs a level', { concurrency: false }, () => {
  it('does not demote after a swap, even one failure from demotion', async () => {
    const { user, fixture, tag } = await makeLearner({ difficulty: Difficulty.HARD, failures: 1 });
    const a = await makeProblem(fixture, tag, 'a', Difficulty.HARD);
    const b = await makeProblem(fixture, tag, 'b', Difficulty.HARD);
    const session = await makeLockedSession(user.id, a.id, Difficulty.HARD);
    const restore = await isolate([a.id, b.id]);

    try {
      await swapProblem({ userId: user.id, sessionId: session.id, request: 'too_easy' });
    } finally {
      await restore();
    }
    const row = await prisma.lockSession.findUniqueOrThrow({ where: { id: session.id } });
    assert.equal(row.adjusted, true);

    const update = await recordFailure(user.id, 600, row.adjusted);
    assert.equal(update.transition, 'held');

    const progress = await prisma.userProgress.findUniqueOrThrow({ where: { userId: user.id } });
    assert.equal(progress.currentDifficulty, Difficulty.HARD, 'the level must not drop');
    assert.equal(progress.consecutiveFailures, 1, 'the streak toward demotion must not advance');
    assert.equal(progress.totalFailed, 3, 'the failure itself still counts');
  });
});

describe('not tonight is participation, and only participation', { concurrency: false }, () => {
  it('releases the lock with no skips, no ladder change, no solve and no re-arm', async () => {
    const { user, fixture, tag } = await makeLearner({
      difficulty: Difficulty.MEDIUM,
      failures: 1,
    });
    const problem = await makeProblem(fixture, tag, 'a', Difficulty.MEDIUM);
    const session = await makeLockedSession(user.id, problem.id, Difficulty.MEDIUM);

    const progressBefore = await prisma.userProgress.findUniqueOrThrow({
      where: { userId: user.id },
    });

    const offer = await offerActivity({ userId: user.id, sessionId: session.id });
    assert.equal(offer.expectedStdout, '4', 'the answer is shown, because this is not a test');

    const result = await completeActivity({
      userId: user.id,
      sessionId: session.id,
      response: 'It prints the last digit, 4.',
      revision: offer.revision,
    });
    assert.equal(result.released, true);
    assert.ok(/not recorded as solved/.test(result.message), result.message);

    const row = await prisma.lockSession.findUniqueOrThrow({ where: { id: session.id } });
    assert.equal(row.state, LockState.BYPASSED);
    assert.equal(row.escapeReason, 'low_energy_activity');

    const audits = await prisma.unlockAudit.findMany({ where: { lockSessionId: session.id } });
    assert.equal(audits.length, 1);
    assert.equal(audits[0]?.outcome, UnlockOutcome.PARTICIPATED);

    const flow = await prisma.learningEvent.findMany({
      where: { sessionId: session.id, kind: 'SESSION_FLOW' },
    });
    const done = flow.filter(
      (event) => (event.detail as { result?: string } | null)?.result === 'completed',
    );
    assert.equal(done.length, 1);
    assert.equal((done[0]?.detail as { participationOnly?: boolean }).participationOnly, true);

    // Nothing on the ladder moved, including the counters and the averages.
    const progressAfter = await prisma.userProgress.findUniqueOrThrow({
      where: { userId: user.id },
    });
    const { updatedAt: _before, ...beforeFields } = progressBefore;
    const { updatedAt: _after, ...afterFields } = progressAfter;
    assert.deepEqual(afterFields, beforeFields, 'participation must not touch progress at all');

    // No fabricated evidence of a solve.
    assert.equal(await prisma.submission.count({ where: { lockSessionId: session.id } }), 0);
    assert.equal(
      await prisma.learningEvent.count({
        where: { sessionId: session.id, kind: { in: ['ATTEMPT_PASSED', 'CAPABILITY_RECORDED'] } },
      }),
      0,
    );

    // No re-arm: saying you have no energy must not start the next countdown.
    assert.equal(
      await prisma.lockSession.count({
        where: { userId: user.id, state: { in: [LockState.ARMED, LockState.LOCKED] } },
      }),
      0,
    );
  });

  it('refuses a completion for an example from before a swap', async () => {
    const { user, fixture, tag } = await makeLearner();
    const a = await makeProblem(fixture, tag, 'a', Difficulty.EASY);
    const b = await makeProblem(fixture, tag, 'b', Difficulty.EASY);
    const session = await makeLockedSession(user.id, a.id, Difficulty.EASY);

    const offer = await offerActivity({ userId: user.id, sessionId: session.id });
    const restore = await isolate([a.id, b.id]);
    try {
      await swapProblem({ userId: user.id, sessionId: session.id, request: 'too_hard' });
    } finally {
      await restore();
    }

    await assert.rejects(
      completeActivity({
        userId: user.id,
        sessionId: session.id,
        response: 'about the old example',
        revision: offer.revision,
      }),
      /problem changed since/,
    );

    const row = await prisma.lockSession.findUniqueOrThrow({ where: { id: session.id } });
    assert.equal(row.state, LockState.LOCKED, 'the lock must stay up');
    assert.equal(await prisma.unlockAudit.count({ where: { lockSessionId: session.id } }), 0);
  });

  it('writes exactly one ending when two completions race', async () => {
    const { user, fixture, tag } = await makeLearner();
    const problem = await makeProblem(fixture, tag, 'a', Difficulty.EASY);
    const session = await makeLockedSession(user.id, problem.id, Difficulty.EASY);
    const offer = await offerActivity({ userId: user.id, sessionId: session.id });

    // Both pass the pre-check, because both read the session while it is still
    // locked. Only the conditional update inside the transaction can decide,
    // and the loser's throw must roll back its event and audit with it.
    const attempt = () =>
      completeActivity({
        userId: user.id,
        sessionId: session.id,
        response: 'twice',
        revision: offer.revision,
      });
    const outcomes = await Promise.allSettled([attempt(), attempt()]);

    assert.equal(outcomes.filter((o) => o.status === 'fulfilled').length, 1, 'exactly one wins');
    assert.equal(outcomes.filter((o) => o.status === 'rejected').length, 1, 'exactly one loses');

    assert.equal(await prisma.unlockAudit.count({ where: { lockSessionId: session.id } }), 1);
    const flow = await prisma.learningEvent.findMany({
      where: { sessionId: session.id, kind: 'SESSION_FLOW' },
    });
    assert.equal(
      flow.filter((e) => (e.detail as { result?: string } | null)?.result === 'completed').length,
      1,
      'the loser must not leave a completed event behind',
    );
  });
});
