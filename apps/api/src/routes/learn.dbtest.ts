import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { Difficulty, LockState, SubmissionStatus } from '@prisma/client';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { resolveLocalUser } from '../middleware/localUser.js';
import { loadLearnerEvidence } from '../services/learn/evidence.js';
import { recommendLesson } from '../services/learn/recommend.js';
import { loadSolveRecords } from '../services/skillState.js';

/**
 * Database-backed tests for Learn: the conditional writes, the row lock on
 * check submissions, and the two things a pure test cannot show — that a
 * practice solve is attributed through the same rule as every other solve,
 * and that nothing here touches a lock session.
 *
 * ## Only ever against a disposable database
 *
 * Same guard as sessionFlow.dbtest.ts: refuses any DATABASE_URL whose
 * database name does not end in `_test`.
 */

const url = process.env.DATABASE_URL ?? '';
const databaseName = url.split('?')[0]?.split('/').pop() ?? '';
if (!databaseName.endsWith('_test')) {
  throw new Error(
    `Refusing to run database tests against "${databaseName || '(none)'}". ` +
      'Point DATABASE_URL at a disposable database whose name ends in _test.',
  );
}

let base = '';
let server: ReturnType<ReturnType<typeof createApp>['listen']>;
let userId = '';
const problemIds: string[] = [];

const json = (method: string, path: string, body?: unknown) =>
  fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

/** A Tier 0 problem needing only `values`, so the first lesson can practise on it. */
async function makeProblem(name: string) {
  const problem = await prisma.problem.create({
    data: {
      slug: `learn-${name}-${randomUUID().slice(0, 8)}`,
      title: `Learn ${name}`,
      difficulty: Difficulty.EASY,
      promptMarkdown: 'Return the last digit.',
      // A Python starter and driver so the hint builder accepts the language;
      // the driver is never run in these tests.
      starterCode: { PYTHON: 'def solve(n):\n    pass\n' },
      driverCode: { PYTHON: 'import sys\n{{SOLUTION}}\nprint(solve(int(sys.stdin.read())))\n' },
      referenceRuntimeMs: {},
      tier: 'TIER_0',
      patternFamily: 'FOUNDATIONS',
      patternTags: ['arithmetic'],
      signatureId: 'fn:int->int',
      testCases: { create: [{ ordinal: 0, stdin: '1234', expectedStdout: '4', isSample: true }] },
    },
  });
  problemIds.push(problem.id);
  return problem;
}

/** Everything this file writes for the local user, so each test starts clean. */
async function wipe() {
  await prisma.lessonSession.deleteMany({ where: { userId } });
  await prisma.learningEvent.deleteMany({ where: { userId } });
  await prisma.submission.deleteMany({ where: { userId } });
  await prisma.lockSession.deleteMany({ where: { userId } });
}

before(async () => {
  await prisma.$queryRaw`select 1`;
  userId = await resolveLocalUser();
  await wipe();
  server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await wipe();
  await prisma.problem.deleteMany({ where: { id: { in: problemIds } } });
  server.close();
  await prisma.$disconnect();
});

describe('Learn reads', { concurrency: false }, () => {
  it('GET /learn writes nothing and reports an empty history as empty, not unavailable', async () => {
    await wipe();
    const before = await prisma.learningEvent.count({ where: { userId } });
    const res = await json('GET', '/v1/learn?language=PYTHON');
    assert.equal(res.status, 200);
    const view = (await res.json()) as { history: string; primary: { reasonCode: string; lesson: { id: string } | null }; active: unknown };
    assert.equal(view.history, 'empty');
    assert.equal(view.primary.reasonCode, 'frontier');
    assert.equal(view.primary.lesson?.id, 'values-arithmetic');
    assert.equal(view.active, null);
    assert.equal(await prisma.learningEvent.count({ where: { userId } }), before);
    assert.equal(await prisma.lessonSession.count({ where: { userId } }), 0);
  });

  it('GET /learn/lessons/:id never carries the answer index or the task solution', async () => {
    const res = await json('GET', '/v1/learn/lessons/loops-running-total?language=GO');
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.doesNotMatch(text, /"answer"/);
    assert.doesNotMatch(text, /"solution"/);
    const body = JSON.parse(text) as { lesson: { language: string; variant: { example: { code: string } } } };
    assert.equal(body.lesson.language, 'GO');
    assert.match(body.lesson.variant.example.code, /package main/);
  });
});

describe('lesson sessions', { concurrency: false }, () => {
  it('a duplicate check submission counts once: one result, one event', async () => {
    await wipe();
    const started = await json('POST', '/v1/learn/lessons/values-arithmetic/start', { language: 'PYTHON' });
    assert.equal(started.status, 201);
    const { session } = (await started.json()) as { session: { version: number } };

    const attemptId = randomUUID();
    const body = { attemptId, version: session.version, kind: 'prediction', checkId: 'values-remainder', answer: 1 };
    // Two concurrent sends of the same attempt: the row lock serialises them.
    const [a, b] = await Promise.all([
      json('POST', '/v1/learn/lessons/values-arithmetic/checks', body),
      json('POST', '/v1/learn/lessons/values-arithmetic/checks', body),
    ]);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    const ra = (await a.json()) as { result: { correct: boolean; attemptId: string }; duplicate: boolean };
    const rb = (await b.json()) as { result: { correct: boolean; attemptId: string }; duplicate: boolean };
    assert.equal(ra.result.correct, true);
    assert.equal(rb.result.correct, true);
    assert.equal(ra.result.attemptId, rb.result.attemptId);
    assert.equal([ra.duplicate, rb.duplicate].filter(Boolean).length, 1, 'exactly one of the two is the duplicate');

    const events = await prisma.learningEvent.findMany({
      where: { userId, kind: 'LESSON', detail: { path: ['action'], equals: 'check' } },
    });
    assert.equal(events.length, 1);

    // A third send, later, with a stale version: still the stored result.
    const again = await json('POST', '/v1/learn/lessons/values-arithmetic/checks', body);
    assert.equal(again.status, 200);
    assert.equal(((await again.json()) as { duplicate: boolean }).duplicate, true);

    // A new attempt after the lesson was finished is refused, even though it
    // was built against the row before finishing.
    const rowNow = await prisma.lessonSession.findUniqueOrThrow({ where: { userId_lessonId: { userId, lessonId: 'values-arithmetic' } } });
    await json('POST', '/v1/learn/lessons/values-arithmetic/finish', { version: rowNow.version });
    const late = await json('POST', '/v1/learn/lessons/values-arithmetic/checks', { ...body, attemptId: randomUUID() });
    assert.equal(late.status, 409);
    const again2 = await json('POST', '/v1/learn/lessons/values-arithmetic/checks', body);
    assert.equal(again2.status, 200, 'the stored attempt is still returned after finishing');
    assert.equal(await prisma.learningEvent.count({ where: { userId, kind: 'LESSON', detail: { path: ['action'], equals: 'check' } } }), 1);
  });

  it('a stale version is refused with 409 and the current row', async () => {
    await wipe();
    const started = await json('POST', '/v1/learn/lessons/strings-build/start', { language: 'JAVA' });
    const { session } = (await started.json()) as { session: { version: number } };

    const ok = await json('PATCH', '/v1/learn/lessons/strings-build/draft', { version: session.version, step: 1, draft: { task: 'x' } });
    assert.equal(ok.status, 200);
    const fresh = (await ok.json()) as { session: { version: number; step: number; draft: Record<string, string> } };
    assert.equal(fresh.session.version, session.version + 1);
    assert.equal(fresh.session.draft.task, 'x');

    // A request built against the old version — a restart that replayed a save.
    const stale = await json('PATCH', '/v1/learn/lessons/strings-build/draft', { version: session.version, step: 0, draft: {} });
    assert.equal(stale.status, 409);
    const conflict = (await stale.json()) as { error: { code: string }; session: { step: number; draft: Record<string, string> } };
    assert.equal(conflict.error.code, 'STALE_SESSION');
    assert.equal(conflict.session.step, 1, 'the newer work survived');
    assert.equal(conflict.session.draft.task, 'x');

    const finishStale = await json('POST', '/v1/learn/lessons/strings-build/finish', { version: session.version });
    assert.equal(finishStale.status, 409);
    const finishOk = await json('POST', '/v1/learn/lessons/strings-build/finish', { version: fresh.session.version });
    assert.equal(finishOk.status, 200);
    assert.equal(((await finishOk.json()) as { session: { status: string } }).session.status, 'finished');
  });

  it('a finished lesson is participation: no skill moves', async () => {
    await wipe();
    const started = await json('POST', '/v1/learn/lessons/values-arithmetic/start', { language: 'PYTHON' });
    const { session } = (await started.json()) as { session: { version: number } };
    await json('POST', '/v1/learn/lessons/values-arithmetic/checks', {
      attemptId: randomUUID(), version: session.version, kind: 'prediction', checkId: 'values-remainder', answer: 1,
    });
    const row = await prisma.lessonSession.findUniqueOrThrow({ where: { userId_lessonId: { userId, lessonId: 'values-arithmetic' } } });
    await json('POST', '/v1/learn/lessons/values-arithmetic/finish', { version: row.version });

    const evidence = await loadLearnerEvidence(userId);
    assert.equal(evidence.snapshot.values.state, 'not_introduced');
    assert.equal(evidence.activeLesson, null);
  });

  it('a correction changes the next recommendation without touching history', async () => {
    await wipe();
    const before = await json('GET', '/v1/learn?language=PYTHON');
    assert.equal(((await before.json()) as { primary: { lesson: { id: string } } }).primary.lesson.id, 'values-arithmetic');

    const res = await json('POST', '/v1/learn/correction', { lessonId: 'values-arithmetic', correction: 'known' });
    assert.equal(res.status, 200);
    const after = await json('GET', '/v1/learn?language=PYTHON');
    assert.equal(((await after.json()) as { primary: { lesson: { id: string } } }).primary.lesson.id, 'comparisons-boundaries');

    const evidence = await loadLearnerEvidence(userId);
    assert.equal(evidence.snapshot.values.state, 'not_introduced', '"I know this" is not a demonstration');
  });
});

describe('practice attribution', { concurrency: false }, () => {
  it('a practice solve after a lesson is an unaided solve; the same solve after the worked solution is assisted', async () => {
    await wipe();
    const problem = await makeProblem('practice');
    await json('POST', '/v1/learn/lessons/values-arithmetic/start', { language: 'PYTHON' });

    // Unaided: an accepted practice submission with no session and no help.
    await prisma.submission.create({
      data: {
        userId, problemId: problem.id, lockSessionId: null, language: 'PYTHON', sourceCode: 'def f(n): return n % 10',
        status: SubmissionStatus.ACCEPTED, passedCount: 1, totalCount: 1,
      },
    });
    let records = await loadSolveRecords(userId);
    assert.equal(records.length, 1);
    assert.equal(records[0]!.assisted, false);
    assert.equal(records[0]!.language, 'PYTHON');

    // Now the worked solution is opened for it (level 5 hint, no session), and
    // the next day it is solved again.
    await prisma.learningEvent.create({
      data: {
        userId, kind: 'HINT_REVEALED', problemSlug: problem.slug, problemTitle: problem.title, sessionId: null,
        at: new Date(Date.now() + 86_400_000 - 60_000),
        detail: { source: 'tutor', level: 5, strategy: 'worked_solution', diagnosis: 'wrong_output', ran: true },
      },
    });
    await prisma.submission.create({
      data: {
        userId, problemId: problem.id, lockSessionId: null, language: 'PYTHON', sourceCode: 'def f(n): return n % 10',
        status: SubmissionStatus.ACCEPTED, passedCount: 1, totalCount: 1, createdAt: new Date(Date.now() + 86_400_000),
      },
    });
    records = await loadSolveRecords(userId);
    const later = records.find((r) => r.solvedAt.getTime() > Date.now() + 3_600_000);
    assert.ok(later);
    assert.equal(later.assisted, true, 'the solve after the worked solution is recorded as with help');

    const evidence = await loadLearnerEvidence(userId, new Date(Date.now() + 2 * 86_400_000));
    assert.equal(evidence.snapshot.values.unaidedSolves, 1);
    assert.equal(evidence.snapshot.values.assistedSolves, 1);
    assert.equal(evidence.snapshot.values.state, 'practised_with_help');
    assert.equal(evidence.fluency.values?.PYTHON, 2, 'both sittings are a record of applying it in Python, help or not');
    assert.equal(evidence.fluency.values?.JAVA, undefined, 'no Java record is unknown, not zero');
  });

  it('the same accepted answer resubmitted in one sitting is one episode', async () => {
    await wipe();
    const problem = await makeProblem('retry');
    const at = new Date('2026-09-10T10:00:00Z');
    for (const offset of [0, 60_000, 120_000]) {
      await prisma.submission.create({
        data: {
          userId, problemId: problem.id, lockSessionId: null, language: 'GO', sourceCode: 'x',
          status: SubmissionStatus.ACCEPTED, passedCount: 1, totalCount: 1, createdAt: new Date(at.getTime() + offset),
        },
      });
    }
    const evidence = await loadLearnerEvidence(userId, new Date('2026-09-11T10:00:00Z'));
    assert.equal(evidence.snapshot.values.unaidedSolves, 1);
    assert.equal(evidence.snapshot.values.state, 'practised_with_help');
  });
});

describe('the lock is untouched', { concurrency: false }, () => {
  it('a lesson open while a timer is armed and fires changes nothing on the session', async () => {
    await wipe();
    const fireAt = new Date(Date.now() + 30_000);
    const armed = await prisma.lockSession.create({
      data: { userId, state: LockState.ARMED, difficulty: Difficulty.EASY, fireAt },
    });

    const started = await json('POST', '/v1/learn/lessons/loops-running-total/start', { language: 'CPP' });
    const { session } = (await started.json()) as { session: { version: number } };
    await json('PATCH', '/v1/learn/lessons/loops-running-total/draft', { version: session.version, step: 2, draft: { task: 'int main(){}' } });
    const row = await prisma.lessonSession.findUniqueOrThrow({ where: { userId_lessonId: { userId, lessonId: 'loops-running-total' } } });
    await json('POST', '/v1/learn/lessons/loops-running-total/checks', {
      attemptId: randomUUID(), version: row.version, kind: 'prediction', checkId: 'loops-third-pass', answer: 1,
    });

    // The timer "fires": the lock moves to LOCKED by its own path, not ours.
    await prisma.lockSession.update({ where: { id: armed.id }, data: { state: LockState.LOCKED, lockedAt: new Date() } });

    const row2 = await prisma.lessonSession.findUniqueOrThrow({ where: { userId_lessonId: { userId, lessonId: 'loops-running-total' } } });
    const finished = await json('POST', '/v1/learn/lessons/loops-running-total/finish', { version: row2.version });
    assert.equal(finished.status, 200);

    const lock = await prisma.lockSession.findUniqueOrThrow({ where: { id: armed.id } });
    assert.equal(lock.state, LockState.LOCKED);
    assert.equal(lock.fireAt.getTime(), fireAt.getTime());
    assert.equal(lock.unlockTokenHash, null);
    assert.equal(lock.problemRevision, 0);
    assert.equal(await prisma.unlockAudit.count({ where: { userId } }), 0);

    // The lesson state survived the lock and is recoverable.
    const reread = await json('GET', '/v1/learn/lessons/loops-running-total?language=CPP');
    const body = (await reread.json()) as { session: { status: string; draft: Record<string, string>; checks: Record<string, unknown> } };
    assert.equal(body.session.status, 'finished');
    assert.equal(body.session.draft.task, 'int main(){}');
    assert.equal(Object.keys(body.session.checks).length, 1);
  });

  it('practice submit has no lockSessionId field and cannot release a live lock', async () => {
    await wipe();
    const problem = await makeProblem('lock');
    const live = await prisma.lockSession.create({
      data: { userId, problemId: problem.id, state: LockState.LOCKED, difficulty: Difficulty.EASY, fireAt: new Date(Date.now() - 60_000), lockedAt: new Date() },
    });
    // The schema strips unknown fields, so a leaked lockSessionId is dropped
    // rather than honoured. With the judge up the grade succeeds and must
    // still carry no token; with it down the grade fails upstream. Either
    // way nothing about the lock may move.
    const res = await json('POST', '/v1/learn/practice/submit', {
      problemId: problem.id, language: 'PYTHON', sourceCode: 'def solve(n):\n    return n % 10\n', lockSessionId: live.id,
    });
    if (res.status === 201) {
      const grade = (await res.json()) as { accepted: boolean; unlockToken: string | null };
      assert.equal(grade.unlockToken, null, 'a practice grade never carries a token');
    }
    const lock = await prisma.lockSession.findUniqueOrThrow({ where: { id: live.id } });
    assert.equal(lock.state, LockState.LOCKED);
    assert.equal(lock.unlockTokenHash, null);
    assert.equal(lock.attempts, 0);
    const subs = await prisma.submission.findMany({ where: { userId, problemId: problem.id } });
    for (const s of subs) assert.equal(s.lockSessionId, null, 'no submission is tied to the lock');
  });

  it('practice hint has no lockSessionId field, records help with no session, and leaves a live lock alone', async () => {
    await wipe();
    const problem = await makeProblem('hint');
    const live = await prisma.lockSession.create({
      data: { userId, problemId: problem.id, state: LockState.LOCKED, difficulty: Difficulty.EASY, fireAt: new Date(Date.now() - 60_000), lockedAt: new Date() },
    });
    // A word's meaning needs no run, so this holds with no judge and with a
    // fixture problem that has no driver.
    const res = await json('POST', '/v1/learn/practice/hint', {
      problemId: problem.id, language: 'PYTHON', sourceCode: 'def solve(n):\n    return n\n', request: 'explain_word', term: 'loop', lockSessionId: live.id,
    });
    assert.equal(res.status, 200, await res.text());
    const hints = await prisma.learningEvent.findMany({ where: { userId, kind: 'HINT_REVEALED' } });
    assert.equal(hints.length, 1);
    assert.equal(hints[0]!.sessionId, null, 'the hint is a practice hint, not a lock hint');
    const lock = await prisma.lockSession.findUniqueOrThrow({ where: { id: live.id } });
    assert.equal(lock.state, LockState.LOCKED);
    assert.equal(lock.attempts, 0);
  });

  it('an accepted practice solve returns no unlock token and leaves a live lock alone (needs the judge and last-digit)', async (t) => {
    await wipe();
    const judgeUp = await fetch(`${process.env.JUDGE0_URL ?? 'http://127.0.0.1:2358'}/healthz`).then((r) => r.ok).catch(() => false);
    const problem = await prisma.problem.findFirst({ where: { slug: 'last-digit', isActive: true } });
    if (!judgeUp || !problem) {
      t.skip('judge not reachable or last-digit not imported into the test database');
      return;
    }
    const live = await prisma.lockSession.create({
      data: { userId, problemId: problem.id, state: LockState.LOCKED, difficulty: Difficulty.EASY, fireAt: new Date(Date.now() - 60_000), lockedAt: new Date() },
    });
    const res = await json('POST', '/v1/learn/practice/submit', {
      problemId: problem.id, language: 'PYTHON', sourceCode: 'def solve(a: int) -> int:\n    return a % 10\n', lockSessionId: live.id,
    });
    assert.equal(res.status, 201);
    const grade = (await res.json()) as { accepted: boolean; correct: boolean; status: string; unlockToken: string | null; submissionId: string };
    // Under a saturated judge a correct solve can miss the speed gate or time
    // out; the invariants under test are the token and the lock, not speed.
    assert.ok(grade.correct || grade.status === 'TIME_LIMIT_EXCEEDED', `unexpected grade ${grade.status}`);
    assert.equal(grade.unlockToken, null);
    const submission = await prisma.submission.findUniqueOrThrow({ where: { id: grade.submissionId } });
    assert.equal(submission.lockSessionId, null);
    const lock = await prisma.lockSession.findUniqueOrThrow({ where: { id: live.id } });
    assert.equal(lock.state, LockState.LOCKED);
    assert.equal(lock.unlockTokenHash, null);
    assert.equal(lock.attempts, 0);
    assert.equal(await prisma.unlockAudit.count({ where: { userId } }), 0);
  });

  it('the recommendation plan is a pure function of the loaded evidence', async () => {
    await wipe();
    const evidence = await loadLearnerEvidence(userId);
    const a = recommendLesson(evidence, 'PYTHON', new Date('2026-09-18T00:00:00Z'));
    const b = recommendLesson(evidence, 'PYTHON', new Date('2026-09-18T00:00:00Z'));
    assert.deepEqual(a, b);
  });
});
