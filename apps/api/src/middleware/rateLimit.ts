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
 * Refresh tokens are 48 random bytes, so guessing one is infeasible — but this
 * endpoint takes an unauthenticated credential and hits the database on every
 * call, which makes it the cheapest way to load the API from outside. Looser
 * than the login limit because a legitimate client with several tabs open can
 * rotate more than once in a window.
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many refresh attempts' } },
});

/**
 * Endpoints that call someone else's API on our behalf: GitHub and LeetCode.
 * Without a cap, one user can burn the GitHub rate limit for everyone sharing
 * the token, or get the server's IP blocked by LeetCode's unofficial endpoint.
 */
export const integrationLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  keyGenerator: keyByUserOrIp,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMITED', message: 'Too many requests to connected services' },
  },
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
