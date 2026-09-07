import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

const keyByUserOrIp = (req: Request): string => req.user?.id ?? req.ip ?? 'unknown';

/**
 * Judging costs money and CPU. Generous enough for genuine iteration on a hard
 * problem, tight enough that a loop cannot drain the Judge0 quota.
 */
export const submitLimiter = rateLimit({
  windowMs: 60_000,
  limit: 12,
  keyGenerator: keyByUserOrIp,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Wait a moment before submitting again' } },
});

/**
 * Running code, which is cheaper per call and far more frequent than grading.
 *
 * Deliberately looser than `submitLimiter`. Iteration is the behaviour this
 * feature exists to encourage, and a learner who has to ration runs is back to
 * the problem Run was added to solve. It is still capped: a run is a container,
 * and `acquireGradeSlot` is what actually protects the host.
 */
export const runLimiter = rateLimit({
  windowMs: 60_000,
  limit: 40,
  keyGenerator: keyByUserOrIp,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Wait a moment before running again' } },
});

export const generalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 240,
  keyGenerator: keyByUserOrIp,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

/**
 * The endpoints that end a lock: engage, skip, abandon.
 *
 * Submitting was already capped, but the escape hatches were not, and they are
 * the more interesting target — `abandon` resolves a session with no passing
 * submission, and `skip` spends a finite daily allowance. A loop against either
 * is either a way to churn through the skip counter or a way to make the
 * difficulty engine record failures that never happened.
 *
 * Generous by human standards: nobody legitimately ends thirty locks a minute.
 */
export const lockActionLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  keyGenerator: keyByUserOrIp,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many lock actions, slow down' } },
});

/**
 * The health endpoint.
 *
 * Unauthenticated by design — a client that cannot authenticate still needs to
 * know why — and it touches the database on every call, which makes it the
 * cheapest unauthenticated way to generate load. `SELECT 1` is trivial, but
 * "trivial times unbounded" is still a way to spend a connection pool.
 *
 * Keyed by IP rather than user: there is no user here. Generous enough for the
 * connection banner's 20-second poll across a dozen tabs and devices behind one
 * NAT, tight enough to stop a flood.
 */
export const healthLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many health checks' } },
});
