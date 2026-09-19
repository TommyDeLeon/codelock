import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { Difficulty, DifficultyMode, LockState } from '@prisma/client';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { resolveLocalUser } from '../middleware/localUser.js';
import { armSession, engageLock, rearmAfterSession, reapStaleSessions } from './lockSessions.js';
import { recordFailure } from './grading.js';

/**
 * Database-backed tests for the difficulty focus: persistence and validation
 * at the route, the arm-time snapshot, immutability of live sessions, re-arm,
 * concurrency, ladder isolation on the failure path, and the selector's
 * fallback under a focus nothing in the pool matches.
 *
 * Same guard as sessionFlow.dbtest.ts: only ever a database named *_test.
 */

const url = process.env.DATABASE_URL ?? '';
const databaseName = url.split('?')[0]?.split('/').pop() ?? '';
if (!databaseName.endsWith('_test')) {
  throw new Error(
    `Refusing to run database tests against "${databaseName || '(none)'}". ` +
      'Point DATABASE_URL at a disposable database whose name ends in _test.',
  );
}

type DifficultyValue = (typeof Difficulty)[keyof typeof Difficulty];

const users: string[] = [];
const problems: string[] = [];

async function makeLearner(difficulty: DifficultyValue = Difficulty.MEDIUM) {
  const user = await prisma.user.create({
    data: {
      email: `focus-${randomUUID()}@test.local`,
      displayName: 'Focus test',
      progress: {
        create: {
          currentDifficulty: difficulty,
          consecutiveFastSolves: 2,
          consecutiveFailures: 1,
          totalSolved: 5,
          totalFailed: 3,
        },
      },
      // Defaults only: what an existing row looks like after the migration.
      timerConfig: { create: {} },
    },
  });
  users.push(user.id);
  return user.id;
}

async function makeProblem(difficulty: DifficultyValue) {
  const tag = randomUUID();
  const problem = await prisma.problem.create({
    data: {
      slug: `focus-${tag}`,
      title: `Focus ${tag.slice(0, 6)}`,
      difficulty,
      promptMarkdown: 'Return the last digit.',
      starterCode: {},
      driverCode: {},
      referenceRuntimeMs: {},
      tier: 'TIER_0',
      patternFamily: 'FOUNDATIONS',
      patternTags: ['arithmetic'],
      signatureId: 'fn:int->int',
      testCases: { create: [{ ordinal: 0, stdin: '1234', expectedStdout: '4', isSample: true }] },
    },
  });
  problems.push(problem.id);
  return problem;
}

const setFocus = (userId: string, mode: DifficultyMode, focus: DifficultyValue | null) =>
  prisma.timerConfig.update({
    where: { userId },
    data: { difficultyMode: mode, focusDifficulty: focus },
  });

async function withServer<T>(fn: (base: string) => Promise<T>): Promise<T> {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const { port } = server.address() as AddressInfo;
    return await fn(`http://127.0.0.1:${port}/v1`);
  } finally {
    server.close();
  }
}

const put = (base: string, body: unknown) =>
  fetch(`${base}/settings/difficulty`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

/** Make an ARMED session due now, so engageLock will take it. */
const makeDue = (id: string) =>
  prisma.lockSession.update({ where: { id }, data: { fireAt: new Date(Date.now() - 1000) } });

/** Only these problems are active while `fn` runs, so selection is deterministic. */
async function isolated<T>(keep: string[], fn: () => Promise<T>): Promise<T> {
  const others = await prisma.problem.findMany({
    where: { isActive: true, id: { notIn: keep } },
    select: { id: true },
  });
  const ids = others.map((p) => p.id);
  await prisma.problem.updateMany({ where: { id: { in: ids } }, data: { isActive: false } });
  try {
    return await fn();
  } finally {
    await prisma.problem.updateMany({ where: { id: { in: ids } }, data: { isActive: true } });
  }
}

before(async () => {
  await prisma.$queryRaw`select 1`;
});

after(async () => {
  await new Promise((r) => setTimeout(r, 150));
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.problem.deleteMany({ where: { id: { in: problems } } });
  await prisma.$disconnect();
});

describe('defaults and migration', { concurrency: false }, () => {
  it('a default config is AUTOMATIC and arms at the automatic tier', async () => {
    const userId = await makeLearner(Difficulty.MEDIUM);
    const config = await prisma.timerConfig.findUniqueOrThrow({ where: { userId } });
    assert.equal(config.difficultyMode, DifficultyMode.AUTOMATIC);
    assert.equal(config.focusDifficulty, null);

    const view = await armSession({ userId });
    assert.equal(view.difficulty, Difficulty.MEDIUM);
    assert.equal(view.difficultySource, DifficultyMode.AUTOMATIC);
  });

  it('the database refuses an incoherent pair on any path', async () => {
    const userId = await makeLearner();
    await assert.rejects(setFocus(userId, DifficultyMode.MANUAL, null));
    await assert.rejects(setFocus(userId, DifficultyMode.AUTOMATIC, Difficulty.HARD));
  });
});

describe('PUT /settings/difficulty', { concurrency: false }, () => {
  it('persists each choice, rejects invalid input, and never touches progress', async () => {
    const userId = await resolveLocalUser();
    users.push(userId);
    const before = await prisma.userProgress.findUniqueOrThrow({ where: { userId } });

    await withServer(async (base) => {
      for (const d of ['EASY', 'MEDIUM', 'HARD'] as const) {
        const res = await put(base, { mode: 'MANUAL', difficulty: d });
        assert.equal(res.status, 200, await res.text());
        const row = await prisma.timerConfig.findUniqueOrThrow({ where: { userId } });
        assert.equal(row.difficultyMode, DifficultyMode.MANUAL);
        assert.equal(row.focusDifficulty, d);
      }

      for (const bad of [
        { mode: 'MANUAL' },
        { mode: 'AUTOMATIC', difficulty: 'HARD' },
        { mode: 'MANUAL', difficulty: 'EXPERT' },
        { difficulty: 'EASY' },
        {},
      ]) {
        const res = await put(base, bad);
        assert.equal(res.status, 400, `${JSON.stringify(bad)} must be rejected`);
      }
      // A rejected request left the last good value in place.
      const kept = await prisma.timerConfig.findUniqueOrThrow({ where: { userId } });
      assert.equal(kept.focusDifficulty, Difficulty.HARD);

      const back = await put(base, { mode: 'AUTOMATIC' });
      assert.equal(back.status, 200);
      const body = (await back.json()) as {
        timerConfig: { difficultyMode: string; focusDifficulty: null };
      };
      assert.equal(body.timerConfig.difficultyMode, 'AUTOMATIC');
      assert.equal(body.timerConfig.focusDifficulty, null);

      // A stale client that only knows the timer PATCH is unaffected, and
      // cannot set the focus through it.
      const legacy = await fetch(`${base}/settings/timer`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ durationMinutes: 45, difficultyMode: 'MANUAL' }),
        signal: AbortSignal.timeout(10_000),
      });
      assert.equal(legacy.status, 200);
      const row = await prisma.timerConfig.findUniqueOrThrow({ where: { userId } });
      assert.equal(row.durationMinutes, 45);
      assert.equal(row.difficultyMode, DifficultyMode.AUTOMATIC);
    });

    const after = await prisma.userProgress.findUniqueOrThrow({ where: { userId } });
    assert.deepEqual(
      { ...after, updatedAt: null },
      { ...before, updatedAt: null },
      'changing the focus must not write progress',
    );
  });
});

describe('arm-time snapshot', { concurrency: false }, () => {
  for (const focus of [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]) {
    it(`MANUAL ${focus} snapshots ${focus} on the next session`, async () => {
      const userId = await makeLearner(Difficulty.MEDIUM);
      await setFocus(userId, DifficultyMode.MANUAL, focus);
      const view = await armSession({ userId });
      const row = await prisma.lockSession.findUniqueOrThrow({ where: { id: view.id } });
      assert.equal(row.difficulty, focus);
      assert.equal(row.difficultySource, DifficultyMode.MANUAL);
      const progress = await prisma.userProgress.findUniqueOrThrow({ where: { userId } });
      assert.equal(progress.currentDifficulty, Difficulty.MEDIUM, 'automatic tier untouched');
    });
  }

  it('changing the focus while ARMED leaves that session alone', async () => {
    const userId = await makeLearner(Difficulty.EASY);
    const armed = await armSession({ userId });
    await setFocus(userId, DifficultyMode.MANUAL, Difficulty.HARD);

    // Re-arming is idempotent and returns the same, unchanged session.
    const again = await armSession({ userId });
    assert.equal(again.id, armed.id);
    const row = await prisma.lockSession.findUniqueOrThrow({ where: { id: armed.id } });
    assert.equal(row.difficulty, Difficulty.EASY);
    assert.equal(row.difficultySource, DifficultyMode.AUTOMATIC);
  });

  it('changing the focus while LOCKED leaves its problem and difficulty alone', async () => {
    const userId = await makeLearner(Difficulty.EASY);
    const easy = await makeProblem(Difficulty.EASY);
    const hard = await makeProblem(Difficulty.HARD);
    await isolated([easy.id, hard.id], async () => {
      const armed = await armSession({ userId });
      await makeDue(armed.id);
      const locked = await engageLock({ userId, sessionId: armed.id });
      assert.equal(locked.state, LockState.LOCKED);
      const snapshot = await prisma.lockSession.findUniqueOrThrow({ where: { id: armed.id } });

      await setFocus(userId, DifficultyMode.MANUAL, Difficulty.HARD);
      const relocked = await engageLock({ userId, sessionId: armed.id });
      const row = await prisma.lockSession.findUniqueOrThrow({ where: { id: armed.id } });
      assert.equal(row.problemId, snapshot.problemId);
      assert.equal(row.difficulty, Difficulty.EASY);
      assert.equal(row.difficultySource, DifficultyMode.AUTOMATIC);
      assert.equal(relocked.problem?.id, locked.problem?.id);
    });
  });

  it('the next arm after a session ends reads the latest preference', async () => {
    const userId = await makeLearner(Difficulty.EASY);
    const first = await armSession({ userId });
    await setFocus(userId, DifficultyMode.MANUAL, Difficulty.HARD);
    // End the first session the way a solve would, then re-arm through the
    // same function the grader calls.
    await prisma.lockSession.update({
      where: { id: first.id },
      data: { state: LockState.UNLOCKED, resolvedAt: new Date() },
    });
    await rearmAfterSession(userId);
    const next = await armSession({ userId });
    assert.notEqual(next.id, first.id);
    assert.equal(next.difficulty, Difficulty.HARD);
    assert.equal(next.difficultySource, DifficultyMode.MANUAL);
    const old = await prisma.lockSession.findUniqueOrThrow({ where: { id: first.id } });
    assert.equal(old.difficulty, Difficulty.EASY, 'the ended session keeps its snapshot');
  });

  it('concurrent arms produce one active session with a coherent snapshot', async () => {
    const userId = await makeLearner(Difficulty.MEDIUM);
    await setFocus(userId, DifficultyMode.MANUAL, Difficulty.HARD);
    const views = await Promise.all(Array.from({ length: 6 }, () => armSession({ userId })));
    assert.equal(new Set(views.map((v) => v.id)).size, 1);
    const active = await prisma.lockSession.findMany({
      where: { userId, state: { in: [LockState.ARMED, LockState.LOCKED] } },
    });
    assert.equal(active.length, 1);
    assert.equal(active[0]!.difficulty, Difficulty.HARD);
    assert.equal(active[0]!.difficultySource, DifficultyMode.MANUAL);
  });
});

describe('ladder isolation', { concurrency: false }, () => {
  it('a focus-session failure counts but moves no automatic counter', async () => {
    const userId = await makeLearner(Difficulty.MEDIUM);
    const before = await prisma.userProgress.findUniqueOrThrow({ where: { userId } });
    // consecutiveFailures is 1: an automatic failure here would demote.
    const update = await recordFailure(userId, 600, { adjusted: false, manualFocus: true });
    assert.equal(update.transition, 'held');
    const after = await prisma.userProgress.findUniqueOrThrow({ where: { userId } });
    assert.equal(after.currentDifficulty, before.currentDifficulty);
    assert.equal(after.consecutiveFailures, before.consecutiveFailures);
    assert.equal(after.consecutiveFastSolves, before.consecutiveFastSolves);
    assert.equal(after.totalFailed, before.totalFailed + 1);
  });

  it('the abandon route reads the session snapshot, not the current preference', async () => {
    const userId = await resolveLocalUser();
    users.push(userId);
    await prisma.lockSession.updateMany({
      where: { userId, state: { in: [LockState.ARMED, LockState.LOCKED] } },
      data: { state: LockState.ABANDONED, resolvedAt: new Date() },
    });
    await prisma.userProgress.update({
      where: { userId },
      data: {
        currentDifficulty: Difficulty.MEDIUM,
        consecutiveFailures: 1,
        consecutiveFastSolves: 0,
      },
    });
    await setFocus(userId, DifficultyMode.MANUAL, Difficulty.HARD);
    const problem = await makeProblem(Difficulty.HARD);
    const session = await prisma.lockSession.create({
      data: {
        userId,
        problemId: problem.id,
        difficulty: Difficulty.HARD,
        difficultySource: DifficultyMode.MANUAL,
        state: LockState.LOCKED,
        fireAt: new Date(Date.now() - 60_000),
        lockedAt: new Date(Date.now() - 30_000),
      },
    });
    // Back to Automatic before giving up: the session is still a focus session.
    await setFocus(userId, DifficultyMode.AUTOMATIC, null);

    await withServer(async (base) => {
      const res = await fetch(`${base}/lock/${session.id}/abandon`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
        signal: AbortSignal.timeout(10_000),
      });
      assert.equal(res.status, 200, await res.text());
    });

    const progress = await prisma.userProgress.findUniqueOrThrow({ where: { userId } });
    assert.equal(progress.currentDifficulty, Difficulty.MEDIUM, 'no demotion');
    assert.equal(progress.consecutiveFailures, 1, 'no failure-streak change');

    // Returning to Automatic resumes the preserved tier.
    const next = await armSession({ userId });
    assert.equal(next.difficulty, Difficulty.MEDIUM);
    assert.equal(next.difficultySource, DifficultyMode.AUTOMATIC);
  });
});

describe('reaper', { concurrency: false }, () => {
  // A guard, not a regression: the reaper has never touched the ladder. It is
  // here because a stale focus session is the path most likely to be wired to
  // a failure later without reading the snapshot.
  it('reaping a stale MANUAL lock abandons it and moves no progress field', async () => {
    const userId = await makeLearner(Difficulty.MEDIUM);
    const problem = await makeProblem(Difficulty.HARD);
    const armedAt = new Date(Date.now() - 13 * 3_600_000);
    const session = await prisma.lockSession.create({
      data: {
        userId,
        problemId: problem.id,
        difficulty: Difficulty.HARD,
        difficultySource: DifficultyMode.MANUAL,
        state: LockState.LOCKED,
        armedAt,
        fireAt: armedAt,
        lockedAt: armedAt,
      },
    });
    const before = await prisma.userProgress.findUniqueOrThrow({ where: { userId } });

    await reapStaleSessions();

    const row = await prisma.lockSession.findUniqueOrThrow({ where: { id: session.id } });
    assert.equal(row.state, LockState.ABANDONED);
    const after = await prisma.userProgress.findUniqueOrThrow({ where: { userId } });
    assert.deepEqual({ ...after, updatedAt: null }, { ...before, updatedAt: null });
  });
});

describe('fallback', { concurrency: false }, () => {
  it('a HARD focus with no HARD problem still engages a lock with a problem', async () => {
    const userId = await makeLearner(Difficulty.EASY);
    const easy = await makeProblem(Difficulty.EASY);
    await isolated([easy.id], async () => {
      await setFocus(userId, DifficultyMode.MANUAL, Difficulty.HARD);
      const armed = await armSession({ userId });
      await makeDue(armed.id);
      const locked = await engageLock({ userId, sessionId: armed.id });
      assert.equal(locked.state, LockState.LOCKED);
      assert.equal(locked.problem?.id, easy.id, 'the only problem available is served');
      assert.equal(locked.difficulty, Difficulty.HARD, 'the snapshot records what was asked');
    });
  });
});
