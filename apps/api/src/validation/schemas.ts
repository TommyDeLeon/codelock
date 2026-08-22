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

export const timerConfigSchema = z.object({
  enabled: z.boolean().optional(),
  durationMinutes: z.number().int().min(5).max(600).optional(),
  graceSeconds: z.number().int().min(0).max(600).optional(),
  activeDaysMask: z.number().int().min(0).max(127).optional(),
  activeFromMinute: z.number().int().min(0).max(1440).optional(),
  activeToMinute: z.number().int().min(0).max(1440).optional(),
  dailySkipAllowance: z.number().int().min(0).max(10).optional(),
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
