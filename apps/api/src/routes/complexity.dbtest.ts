import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { Difficulty, LockState, type SubmissionStatus } from '@prisma/client';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { resolveLocalUser } from '../middleware/localUser.js';

/**
 * GET /progress/complexity/:submissionId — the gates.
 *
 * The feedback includes the standard solution, which is the answer. These
 * tests hold the rule that it is only ever served for a passing submission
 * whose lock is over, and never for someone else's submission.
 *
 * Only ever against a database named *_test, like the other DB suites.
 */

const url = process.env.DATABASE_URL ?? '';
const databaseName = url.split('?')[0]?.split('/').pop() ?? '';
if (!databaseName.endsWith('_test')) {
  throw new Error(
    `Refusing to run database tests against "${databaseName || '(none)'}". ` +
      'Point DATABASE_URL at a disposable database whose name ends in _test.',
  );
}

const otherUsers: string[] = [];
const problems: string[] = [];
let base = '';
let close: () => void = () => undefined;
let localUser = '';

const REFERENCE = 'def solve(xs):\n    seen = set()\n    for x in xs:\n        seen.add(x)\n    return len(seen)\n';
const QUADRATIC =
  'def solve(xs):\n    out = []\n    for x in xs:\n        if x not in out:\n            out.append(x)\n    return len(out)\n';

async function makeProblem() {
  const tag = randomUUID();
  const problem = await prisma.problem.create({
    data: {
      slug: `cx-${tag}`,
      title: `Complexity ${tag.slice(0, 6)}`,
      difficulty: Difficulty.EASY,
      promptMarkdown: 'Count distinct values.',
      starterCode: {},
      driverCode: {},
      referenceRuntimeMs: {},
      tier: 'TIER_0',
      patternFamily: 'FOUNDATIONS',
      patternTags: ['arithmetic'],
      signatureId: 'fn:int->int',
      editorialMarkdown: '## Hash Set\n\nTime complexity is O(N). Space complexity is O(N).',
      referenceSolution: { PYTHON: REFERENCE },
    },
  });
  problems.push(problem.id);
  return problem;
}

async function makeSubmission(
  userId: string,
  problemId: string,
  status: SubmissionStatus,
  session: LockState | null,
) {
  const lockSession = session
    ? await prisma.lockSession.create({
        data: {
          userId,
          problemId,
          state: session,
          fireAt: new Date(Date.now() - 60_000),
          lockedAt: new Date(Date.now() - 30_000),
          resolvedAt: session === LockState.LOCKED ? null : new Date(),
        },
      })
    : null;
  return prisma.submission.create({
    data: {
      userId,
      problemId,
      lockSessionId: lockSession?.id ?? null,
      language: 'PYTHON',
      sourceCode: QUADRATIC,
      status,
    },
  });
}

const get = (id: string) =>
  fetch(`${base}/progress/complexity/${id}`, { signal: AbortSignal.timeout(10_000) });

before(async () => {
  await prisma.$queryRaw`select 1`;
  localUser = await resolveLocalUser();
  // One active session per user: clear any the local learner left behind.
  await prisma.lockSession.updateMany({
    where: { userId: localUser, state: { in: [LockState.ARMED, LockState.LOCKED] } },
    data: { state: LockState.ABANDONED, resolvedAt: new Date() },
  });
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
  close = () => server.close();
});

after(async () => {
  close();
  await prisma.submission.deleteMany({ where: { problemId: { in: problems } } });
  await prisma.lockSession.deleteMany({ where: { problemId: { in: problems } } });
  await prisma.user.deleteMany({ where: { id: { in: otherUsers } } });
  await prisma.problem.deleteMany({ where: { id: { in: problems } } });
  await prisma.$disconnect();
});

describe('GET /progress/complexity/:submissionId', { concurrency: false }, () => {
  it('serves feedback for a solved lock: estimate, standard, verdict and the standard solution', async () => {
    const problem = await makeProblem();
    const sub = await makeSubmission(localUser, problem.id, 'ACCEPTED', LockState.UNLOCKED);
    const res = await get(sub.id);
    assert.equal(res.status, 200, await res.clone().text());
    const { complexity } = (await res.json()) as {
      complexity: {
        yours: { time: string };
        standard: { time: string };
        verdict: { time: string };
        standardSolution: { code: string; approach: string };
        summary: string;
      };
    };
    assert.equal(complexity.yours.time, 'O(n^2)');
    assert.equal(complexity.standard.time, 'O(N)');
    assert.equal(complexity.verdict.time, 'slower');
    assert.equal(complexity.standardSolution.code, REFERENCE);
    assert.equal(complexity.standardSolution.approach, 'Hash Set');
    assert.match(complexity.summary, /Hash Set/);
  });

  it('serves feedback for a passing practice solve with no lock', async () => {
    const problem = await makeProblem();
    const sub = await makeSubmission(localUser, problem.id, 'ACCEPTED', null);
    assert.equal((await get(sub.id)).status, 200);
  });

  it('refuses while the lock is still up, even for a correct-but-slow run', async () => {
    const problem = await makeProblem();
    const sub = await makeSubmission(localUser, problem.id, 'ACCEPTED_TOO_SLOW', LockState.LOCKED);
    const res = await get(sub.id);
    assert.equal(res.status, 409);
    assert.doesNotMatch(await res.text(), /seen = set/, 'the standard solution must not leak');
    // Resolve it so the next test can create a session for the same learner.
    await prisma.lockSession.update({
      where: { id: sub.lockSessionId! },
      data: { state: LockState.ABANDONED, resolvedAt: new Date() },
    });
  });

  it('refuses a submission that did not pass', async () => {
    const problem = await makeProblem();
    const sub = await makeSubmission(localUser, problem.id, 'WRONG_ANSWER', null);
    assert.equal((await get(sub.id)).status, 409);
  });

  it('serves a correct-but-slow run once its lock is over', async () => {
    const problem = await makeProblem();
    const sub = await makeSubmission(localUser, problem.id, 'ACCEPTED_TOO_SLOW', LockState.ABANDONED);
    assert.equal((await get(sub.id)).status, 200);
  });

  it('answers 404 for someone else’s submission and 400 for a malformed id', async () => {
    const other = await prisma.user.create({
      data: { email: `cx-${randomUUID()}@test.local`, displayName: 'Other' },
    });
    otherUsers.push(other.id);
    const problem = await makeProblem();
    const sub = await makeSubmission(other.id, problem.id, 'ACCEPTED', null);
    assert.equal((await get(sub.id)).status, 404);
    assert.equal((await get('not-a-uuid')).status, 400);
    assert.equal((await get(randomUUID())).status, 404);
  });
});
