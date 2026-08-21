import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

const keyByUserOrIp = (req: Request): string => req.user?.id ?? req.ip ?? 'unknown';

/** Credential endpoints: brute-force resistance. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } },
});

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

export const generalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 240,
  keyGenerator: keyByUserOrIp,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
