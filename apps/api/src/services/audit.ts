import { UnlockOutcome } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

/**
 * The record of every lock that ended.
 *
 * `LockSession` already has a `state`, so why a second table? Because a session
 * row is mutable and answers "what is true now". This answers "what happened",
 * and it is the only thing that can answer the question actually worth asking
 * about a lock: *did this machine ever open without a passing submission?*
 *
 * Two rules:
 *
 *  1. **Append only.** Nothing updates or deletes these rows except the user
 *     deleting their account, which cascades. An audit trail you can edit is a
 *     log, not an audit.
 *  2. **Never blocks.** A failure to write the audit must not keep someone
 *     locked out of their own machine. Writes are awaited where the caller can
 *     spare it and logged-and-dropped when they cannot — the lock releasing is
 *     more important than the paperwork about it.
 */

export interface AuditEntry {
  userId: string;
  lockSessionId: string;
  problemId?: string | null;
  outcome: UnlockOutcome;
  submissionId?: string | null;
  runtimeMs?: number | null;
  gateMs?: number | null;
  /** Seconds from the overlay appearing to this outcome. */
  secondsLocked?: number | null;
  reason?: string | null;
}

export async function recordUnlock(entry: AuditEntry): Promise<void> {
  try {
    await prisma.unlockAudit.create({
      data: {
        userId: entry.userId,
        lockSessionId: entry.lockSessionId,
        problemId: entry.problemId ?? null,
        outcome: entry.outcome,
        submissionId: entry.submissionId ?? null,
        runtimeMs: entry.runtimeMs ?? null,
        gateMs: entry.gateMs ?? null,
        secondsLocked: entry.secondsLocked ?? null,
        reason: entry.reason ?? null,
      },
    });

    // Also to the log stream, so an outcome survives even if the database is
    // the thing that failed later. The log is where you look during an
    // incident; the table is where you look afterwards.
    logger.info(
      {
        audit: 'unlock',
        userId: entry.userId,
        sessionId: entry.lockSessionId,
        problemId: entry.problemId ?? null,
        outcome: entry.outcome,
        runtimeMs: entry.runtimeMs ?? null,
        gateMs: entry.gateMs ?? null,
        secondsLocked: entry.secondsLocked ?? null,
        reason: entry.reason ?? null,
      },
      'lock resolved',
    );
  } catch (err) {
    // Deliberately swallowed. See rule 2.
    logger.error({ err, entry }, 'failed to write unlock audit');
  }
}

/** Seconds a session spent locked, or null if it never locked. */
export function secondsLocked(lockedAt: Date | null, resolvedAt = new Date()): number | null {
  if (!lockedAt) return null;
  return Math.max(0, Math.round((resolvedAt.getTime() - lockedAt.getTime()) / 1000));
}
