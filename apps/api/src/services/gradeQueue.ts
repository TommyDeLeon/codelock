import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { env } from '../env.js';

/**
 * Admission control for grading.
 *
 * The rate limiter caps how often one user may *ask*. It does nothing about how
 * many requests are in flight at once, and grading is the one operation here
 * that costs a whole CPU core for seconds at a time. Twelve users submitting
 * simultaneously is twelve containers, which on a 2 GB VPS is the host falling
 * over — and the failure mode is everyone's lock screen hanging, including
 * people who submitted nothing.
 *
 * Two limits, doing different jobs:
 *
 *   Per user: one grade at a time. A user is looking at a single lock screen
 *   with a single editor; a second concurrent grade from the same account is a
 *   double-click or a script, never a real workflow. Rejected outright rather
 *   than queued, because the answer "your previous submission is still running"
 *   is more useful than a spinner.
 *
 *   Global: a hard ceiling on concurrent grades, with a bounded wait queue.
 *   Waiting is correct here — the user's request is legitimate, the host is
 *   just busy — but an unbounded queue only converts a CPU exhaustion into a
 *   memory exhaustion, so the queue has a depth and rejects past it.
 */

/** Concurrent grades across the whole process. Matches the judge's own pool. */
const MAX_CONCURRENT = env.GRADE_CONCURRENCY;
/** Requests allowed to wait for a slot before we start refusing. */
const MAX_QUEUED = env.GRADE_QUEUE_DEPTH;
/**
 * A slot held longer than this is assumed leaked and reclaimed.
 *
 * Belt and braces: every acquire is paired with a release in a `finally`, but a
 * leaked slot here is permanent and silently shrinks capacity until a restart.
 * Slightly longer than the judge's own timeout so a legitimately slow grade is
 * never evicted out from under itself.
 */
const SLOT_TTL_MS = 180_000;

interface Slot {
  userId: string;
  acquiredAt: number;
}

const active = new Map<symbol, Slot>();
const waiting: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];

function reclaimExpired(): void {
  const cutoff = Date.now() - SLOT_TTL_MS;
  for (const [token, slot] of active) {
    if (slot.acquiredAt < cutoff) {
      logger.warn({ userId: slot.userId }, 'reclaiming leaked grading slot');
      active.delete(token);
    }
  }
}

function hasActiveFor(userId: string): boolean {
  for (const slot of active.values()) {
    if (slot.userId === userId) return true;
  }
  return false;
}

/**
 * Take a grading slot, or throw.
 *
 * Returns a release function. Callers MUST call it in a `finally` — a slot that
 * is never released permanently reduces the host's capacity.
 */
export async function acquireGradeSlot(userId: string): Promise<() => void> {
  reclaimExpired();

  if (hasActiveFor(userId)) {
    throw ApiError.conflict(
      'Your previous submission is still being graded. Wait for the result.',
    );
  }

  if (active.size >= MAX_CONCURRENT) {
    if (waiting.length >= MAX_QUEUED) {
      logger.warn(
        { active: active.size, waiting: waiting.length },
        'grading queue full, rejecting',
      );
      throw ApiError.unavailable(
        'The judge is busy right now. Try again in a few seconds.',
      );
    }
    await new Promise<void>((resolve, reject) => {
      waiting.push({ resolve, reject });
    });
    // Re-check on the way out of the queue: the user may have submitted again
    // and been admitted first while this one waited.
    if (hasActiveFor(userId)) {
      pump();
      throw ApiError.conflict(
        'Your previous submission is still being graded. Wait for the result.',
      );
    }
  }

  const token = Symbol('grade-slot');
  active.set(token, { userId, acquiredAt: Date.now() });

  let released = false;
  return () => {
    // Idempotent: a double release would let two grades share one slot.
    if (released) return;
    released = true;
    active.delete(token);
    pump();
  };
}

function pump(): void {
  while (active.size < MAX_CONCURRENT && waiting.length > 0) {
    waiting.shift()?.resolve();
    // Only one can be admitted per free slot; the admitted caller registers
    // itself in `active` synchronously after its await resolves, so break here
    // and let the next release pump again.
    break;
  }
}

/** For the health endpoint and tests. */
export function gradeQueueDepth(): { active: number; waiting: number; max: number } {
  return { active: active.size, waiting: waiting.length, max: MAX_CONCURRENT };
}

/** Test-only reset. */
export function resetGradeQueue(): void {
  active.clear();
  while (waiting.length > 0) {
    waiting.shift()?.reject(new Error('queue reset'));
  }
}
