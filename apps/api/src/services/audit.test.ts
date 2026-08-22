import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * Two invariants, both about the same thing: paperwork must never keep someone
 * locked out of their own machine.
 */

// vi.hoisted, not a plain const: vi.mock factories are hoisted above the
// imports, so a factory closing over a normal module-scope binding hits the
// temporal dead zone. Top-level await would also work for vitest but not for
// tsc, which compiles these as CommonJS.
const { create, logged } = vi.hoisted(() => ({
  create: vi.fn(),
  logged: [] as unknown[],
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: { unlockAudit: { create: (...args: unknown[]) => create(...args) } },
}));

vi.mock('../lib/logger.js', () => ({
  logger: {
    info: (...args: unknown[]) => logged.push(args),
    error: (...args: unknown[]) => logged.push(args),
    warn: (...args: unknown[]) => logged.push(args),
  },
}));

import { recordUnlock, secondsLocked } from './audit.js';

beforeEach(() => {
  create.mockReset();
  logged.length = 0;
});

describe('recordUnlock', () => {
  const entry = {
    userId: 'u1',
    lockSessionId: 's1',
    problemId: 'p1',
    outcome: 'SOLVED' as const,
    submissionId: 'sub1',
    runtimeMs: 120,
    gateMs: 200,
    secondsLocked: 45,
  };

  it('writes the verdict, not merely the fact', async () => {
    create.mockResolvedValue({});
    await recordUnlock(entry);

    expect(create).toHaveBeenCalledOnce();
    const written = create.mock.calls[0]![0] as { data: Record<string, unknown> };
    // Session, problem, verdict, runtime, timestamp — the timestamp is the
    // column default, everything else has to be passed.
    expect(written.data).toMatchObject({
      userId: 'u1',
      lockSessionId: 's1',
      problemId: 'p1',
      outcome: 'SOLVED',
      submissionId: 'sub1',
      runtimeMs: 120,
      gateMs: 200,
      secondsLocked: 45,
    });
  });

  it('does not throw when the database refuses the write', async () => {
    // The lock has already been released by the time this runs. Throwing here
    // would turn a logging failure into a user staring at an overlay.
    create.mockRejectedValue(new Error('connection reset'));
    await expect(recordUnlock(entry)).resolves.toBeUndefined();
    expect(logged.length).toBeGreaterThan(0);
  });

  it('normalises absent optional fields to null rather than undefined', async () => {
    create.mockResolvedValue({});
    await recordUnlock({ userId: 'u1', lockSessionId: 's1', outcome: 'ABANDONED' });
    const written = create.mock.calls[0]![0] as { data: Record<string, unknown> };
    for (const key of ['problemId', 'submissionId', 'runtimeMs', 'gateMs', 'reason']) {
      expect(written.data[key]).toBeNull();
    }
  });

  it('also emits to the log stream, so an outcome survives a database failure', async () => {
    create.mockResolvedValue({});
    await recordUnlock(entry);
    const line = logged.find((args) => (args as unknown[])[1] === 'lock resolved');
    expect(line).toBeDefined();
    expect((line as [Record<string, unknown>])[0]).toMatchObject({
      audit: 'unlock',
      outcome: 'SOLVED',
      sessionId: 's1',
    });
  });
});

describe('secondsLocked', () => {
  it('measures from the overlay appearing', () => {
    const lockedAt = new Date('2026-08-22T10:00:00Z');
    const resolvedAt = new Date('2026-08-22T10:07:30Z');
    expect(secondsLocked(lockedAt, resolvedAt)).toBe(450);
  });

  it('is null when the session never locked', () => {
    expect(secondsLocked(null)).toBeNull();
  });

  it('never goes negative when clocks disagree', () => {
    const lockedAt = new Date('2026-08-22T10:00:00Z');
    const resolvedAt = new Date('2026-08-22T09:59:00Z');
    expect(secondsLocked(lockedAt, resolvedAt)).toBe(0);
  });
});
