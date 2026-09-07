import { z } from 'zod';
import { Language, Platform } from '@prisma/client';

const languageEnum = z.nativeEnum(Language);

export const registerSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  // Length over composition rules: NIST 800-63B, and it is what actually helps.
  password: z.string().min(12).max(128),
  displayName: z.string().min(1).max(60).trim(),
  timezone: z.string().max(64).default('UTC'),
});

export const loginSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).max(200),
});

/**
 * What the learner may change about themselves.
 *
 * Every field optional: a PATCH that sets only the language must not blank the
 * timezone, and an empty body is a no-op rather than a reset.
 */
export const profileSchema = z
  .object({
    displayName: z.string().min(1).max(80),
    preferredLanguage: z.enum(['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CPP', 'GO']),
    timezone: z.string().min(1).max(64),
  })
  .partial();

export const timerConfigSchema = z.object({
  enabled: z.boolean().optional(),
  durationMinutes: z.number().int().min(5).max(600).optional(),
  graceSeconds: z.number().int().min(0).max(600).optional(),
  activeDaysMask: z.number().int().min(0).max(127).optional(),
  activeFromMinute: z.number().int().min(0).max(1440).optional(),
  activeToMinute: z.number().int().min(0).max(1440).optional(),
  dailySkipAllowance: z.number().int().min(0).max(10).optional(),
  /// The recurring timer. Absent from this schema until now, which meant the
  /// column existed, was read on every solve, and could not be turned on by
  /// any client — the feature was unreachable rather than missing.
  autoRearm: z.boolean().optional(),
}).refine(
  (v) =>
    v.activeFromMinute === undefined ||
    v.activeToMinute === undefined ||
    v.activeFromMinute < v.activeToMinute,
  { message: 'activeFromMinute must be before activeToMinute', path: ['activeFromMinute'] },
);

export const armSessionSchema = z.object({
  deviceId: z.string().uuid().optional(),
  /// One-off override, e.g. "just 30 minutes this time".
  durationMinutes: z.number().int().min(5).max(600).optional(),
});

/// Which of the three hints to reveal. Bounded here rather than in the route so
/// an out-of-range index is a 400 with a field name, not a null deep inside.
export const hintRequestSchema = z.object({
  index: z.number().int().min(0).max(2),
});

export const abandonSchema = z.object({
  /// Why the lock ended without a solve. Recorded in the audit trail, so it is
  /// a closed set rather than free text a client can write anything into.
  reason: z.enum(['user_gave_up', 'kill_switch']).optional(),
});

export const submitSchema = z.object({
  problemId: z.string().uuid(),
  lockSessionId: z.string().uuid().optional(),
  language: languageEnum,
  sourceCode: z.string().min(1).max(64 * 1024),
});

/**
 * Running is a superset of submitting in shape and a subset in consequence:
 * the same source, plus optional input of the learner's own. `stdin` absent
 * means "the samples"; `stdin` present and empty means an empty input, which
 * is a different question and a legitimate one.
 */
export const runSchema = submitSchema.extend({
  stdin: z.string().max(8 * 1024).nullish(),
});

export const registerDeviceSchema = z.object({
  platform: z.nativeEnum(Platform),
  label: z.string().min(1).max(80),
  pushToken: z.string().max(500).optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});
