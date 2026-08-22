import { describe, expect, it, beforeEach } from 'vitest';
import { acquireGradeSlot, gradeQueueDepth, resetGradeQueue } from './gradeQueue.js';
import { ApiError } from '../lib/errors.js';

/**
 * Admission control is the difference between "the judge is busy" and "the
 * host fell over and took everyone's lock screen with it". Worth testing
 * properly, because the failure only shows up under load.
 *
 * GRADE_CONCURRENCY defaults to 4 and the vitest env does not override it.
 */
describe('grade admission control', () => {
  beforeEach(() => resetGradeQueue());

  it('admits a single request', async () => {
    const release = await acquireGradeSlot('user-1');
    expect(gradeQueueDepth().active).toBe(1);
    release();
    expect(gradeQueueDepth().active).toBe(0);
  });

  it('refuses a second concurrent grade from the same user', async () => {
    const release = await acquireGradeSlot('user-1');
    await expect(acquireGradeSlot('user-1')).rejects.toThrow(/still being graded/);
    release();
  });

  it('allows the same user again once the first finishes', async () => {
    (await acquireGradeSlot('user-1'))();
    const second = await acquireGradeSlot('user-1');
    expect(gradeQueueDepth().active).toBe(1);
    second();
  });

  it('admits different users up to the concurrency limit', async () => {
    const releases = [];
    for (let i = 0; i < 4; i++) releases.push(await acquireGradeSlot(`user-${i}`));
    expect(gradeQueueDepth().active).toBe(4);
    for (const release of releases) release();
  });

  it('queues past the limit rather than refusing outright', async () => {
    const releases = [];
    for (let i = 0; i < 4; i++) releases.push(await acquireGradeSlot(`user-${i}`));

    // The fifth user's request is legitimate — the host is merely busy — so it
    // waits instead of failing.
    let admitted = false;
    const pending = acquireGradeSlot('user-5').then((release) => {
      admitted = true;
      return release;
    });

    await new Promise((r) => setTimeout(r, 20));
    expect(admitted).toBe(false);
    expect(gradeQueueDepth().waiting).toBe(1);

    releases[0]!();
    const release5 = await pending;
    expect(admitted).toBe(true);
    release5();
    for (const release of releases.slice(1)) release();
  });

  it('is idempotent on release, so a double release cannot hand out a free slot', async () => {
    const release = await acquireGradeSlot('user-1');
    release();
    release();
    release();
    expect(gradeQueueDepth().active).toBe(0);

    // Fill to capacity; if the double releases had leaked capacity this would
    // admit a fifth immediately instead of queueing it.
    const releases = [];
    for (let i = 0; i < 4; i++) releases.push(await acquireGradeSlot(`u${i}`));
    expect(gradeQueueDepth().active).toBe(4);
    for (const r of releases) r();
  });

  it('rejects with a retryable 503 once the wait queue is full', async () => {
    const releases = [];
    for (let i = 0; i < 4; i++) releases.push(await acquireGradeSlot(`user-${i}`));

    // GRADE_QUEUE_DEPTH defaults to 20.
    const queued = [];
    for (let i = 0; i < 20; i++) {
      queued.push(acquireGradeSlot(`waiter-${i}`).catch(() => undefined));
    }
    await new Promise((r) => setTimeout(r, 20));
    expect(gradeQueueDepth().waiting).toBe(20);

    // An unbounded queue only converts CPU exhaustion into memory exhaustion,
    // so past the depth we refuse — and refuse with something the client knows
    // to retry.
    await expect(acquireGradeSlot('one-too-many')).rejects.toMatchObject({
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
    });

    resetGradeQueue();
    await Promise.all(queued);
    for (const release of releases) release();
  });

  it('reports a 409 for the same-user case, not a 503', async () => {
    const release = await acquireGradeSlot('user-1');
    // Different codes because they need different client behaviour: a 409 means
    // stop and look at the result you already asked for; a 503 means try again.
    await expect(acquireGradeSlot('user-1')).rejects.toBeInstanceOf(ApiError);
    await acquireGradeSlot('user-1').catch((err: ApiError) => {
      expect(err.status).toBe(409);
    });
    release();
  });
});
