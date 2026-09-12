import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { Difficulty, LockState, UnlockOutcome } from '@prisma/client';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { resetLocalUserCache, resolveLocalUser } from '../middleware/localUser.js';
import { claimResolution, releaseLock } from './lockSessions.js';
import {
  commitParticipation,
  completeActivity,
  offerActivity,
  swapProblem,
} from './sessionFlow.js';

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
  // Self-healing. `isolate` restores what it deactivates in a `finally`, but a
  // dropped connection or a killed process during that restore would leave the
  // pool depleted for every later run. This database is disposable, guarded
  // above, and holds only fixtures, so reactivating everything at the start is
  // always safe and always correct.
  await prisma.problem.updateMany({ where: { isActive: false }, data: { isActive: true } });
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

      // The read-time check above is not the guarantee; the conditional update
      // is. Call it directly with the stale assignment, skipping every earlier
      // check, so this fails if only the database predicate is removed. A
      // stale result that slipped past the read — because the swaps landed
      // between the read and the write — would reach exactly this call.
      const staleWon = await claimResolution(
        session.id,
        [LockState.LOCKED],
        { state: LockState.UNLOCKED, resolvedAt: new Date() },
        { problemId: a.id, revision: revisionWhenSubmitted },
      );
      assert.equal(staleWon, false, 'the database must refuse a stale assignment on its own');

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
  it('does not demote through the real abandon route after a swap', async () => {
    // Through HTTP, not by calling `recordFailure` with the flag already in
    // hand. The earlier version passed `adjusted` itself, so it would have kept
    // passing if the abandon route stopped reading the flag from the session —
    // which is the wiring this test exists to hold in place.
    //
    // The route acts as the single local learner, so the fixture has to be that
    // user. It is created here in the disposable database and deleted by the
    // cleanup like every other fixture.
    resetLocalUserCache();
    const userId = await resolveLocalUser();
    const fixture: Fixture = { userId, problemIds: [] };
    created.push(fixture);
    await prisma.userProgress.update({
      where: { userId },
      data: { currentDifficulty: Difficulty.HARD, consecutiveFailures: 1, totalFailed: 2 },
    });

    const tag = randomUUID();
    const a = await makeProblem(fixture, tag, 'a', Difficulty.HARD);
    const b = await makeProblem(fixture, tag, 'b', Difficulty.HARD);
    const session = await makeLockedSession(userId, a.id, Difficulty.HARD);
    const restore = await isolate([a.id, b.id]);
    try {
      await swapProblem({ userId, sessionId: session.id, request: 'too_easy' });
    } finally {
      await restore();
    }

    const server = createApp().listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${port}/v1/lock/${session.id}/abandon`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      assert.equal(response.status, 200, await response.text());
    } finally {
      server.close();
    }

    const row = await prisma.lockSession.findUniqueOrThrow({ where: { id: session.id } });
    assert.equal(row.state, LockState.ABANDONED, 'the route really did abandon the session');

    const progress = await prisma.userProgress.findUniqueOrThrow({ where: { userId } });
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
    // The whole row, timestamp included. Excluding `updatedAt` would let a
    // write that changed nothing visible pass as no write at all.
    assert.deepEqual(
      progressAfter,
      progressBefore,
      'participation must not write to the progress row at all, not even its timestamp',
    );

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

  /** The completed-event count for a session, the fact a partial write would leave. */
  const completedEvents = async (sessionId: string) =>
    (
      await prisma.learningEvent.findMany({ where: { sessionId, kind: 'SESSION_FLOW' } })
    ).filter((e) => (e.detail as { result?: string } | null)?.result === 'completed').length;

  it('leaves nothing behind when the transaction fails after every write', async () => {
    // A forced failure *after* all three writes. Replaces a test that started
    // two completions at once and hoped they overlapped: that could pass with
    // one simply finishing first, and even when they overlapped the loser threw
    // before writing anything, so it never exercised a rollback. This does,
    // deterministically — and it fails if any of the three writes bypasses the
    // transaction client, because that write would commit on its own.
    const { user, fixture, tag } = await makeLearner();
    const problem = await makeProblem(fixture, tag, 'a', Difficulty.EASY);
    const session = await makeLockedSession(user.id, problem.id, Difficulty.EASY);

    await assert.rejects(
      prisma.$transaction(async (tx) => {
        await commitParticipation(tx, {
          userId: user.id,
          sessionId: session.id,
          revision: session.problemRevision,
          response: 'then the audit fails',
          resolvedAt: new Date(),
          secondsLocked: 30,
          problem,
        });
        throw new Error('forced failure after every participation write');
      }),
      /forced failure/,
    );

    const row = await prisma.lockSession.findUniqueOrThrow({ where: { id: session.id } });
    assert.equal(row.state, LockState.LOCKED, 'the release must have rolled back');
    assert.equal(row.escapeReason, null);
    assert.equal(await prisma.unlockAudit.count({ where: { lockSessionId: session.id } }), 0);
    assert.equal(await completedEvents(session.id), 0, 'the completed event must have rolled back');
  });

  it('refuses the loser that passed the pre-check, and writes nothing for it', async () => {
    // The race, made deterministic. The first completion ends the lock. The
    // second is driven straight into the transactional writer, which is where a
    // caller lands after passing the pre-check while the session was still
    // locked. It must lose on the conditional update and leave no second audit
    // or completed event.
    const { user, fixture, tag } = await makeLearner();
    const problem = await makeProblem(fixture, tag, 'a', Difficulty.EASY);
    const session = await makeLockedSession(user.id, problem.id, Difficulty.EASY);
    const offer = await offerActivity({ userId: user.id, sessionId: session.id });

    await completeActivity({
      userId: user.id,
      sessionId: session.id,
      response: 'first',
      revision: offer.revision,
    });

    await assert.rejects(
      prisma.$transaction((tx) =>
        commitParticipation(tx, {
          userId: user.id,
          sessionId: session.id,
          revision: offer.revision,
          response: 'second, after passing the pre-check',
          resolvedAt: new Date(),
          secondsLocked: 30,
          problem,
        }),
      ),
      /already ended/,
    );

    assert.equal(await prisma.unlockAudit.count({ where: { lockSessionId: session.id } }), 1);
    assert.equal(await completedEvents(session.id), 1, 'the loser must leave no completed event');
  });
});
