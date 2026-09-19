import { z } from 'zod';
import { Language, Platform } from '@prisma/client';

const languageEnum = z.nativeEnum(Language);

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

/**
 * PATCH /settings/difficulty. Two shapes only, so an incoherent pair (a mode
 * with no focus, or a focus left behind under AUTOMATIC) cannot be expressed.
 * Strict, so a stray field is a 400 rather than silently ignored.
 */
export const difficultyFocusSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('AUTOMATIC') }).strict(),
  z.object({ mode: z.literal('MANUAL'), difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']) }).strict(),
]);

export const armSessionSchema = z.object({
  deviceId: z.string().uuid().optional(),
  /// One-off override, e.g. "just 30 minutes this time".
  durationMinutes: z.number().int().min(5).max(600).optional(),
});

/// Which of the three hints to reveal. Bounded here rather than in the route so
/// an out-of-range index is a 400 with a field name, not a null deep inside.
/**
 * One of the session-flow controls.
 *
 * `low_energy` offers the warm-up and `low_energy_done` finishes it: two
 * actions rather than one, because opening the activity and completing it are
 * different facts and only the second ends the lock.
 */
export const sessionFlowSchema = z.object({
  action: z.enum(['too_hard', 'too_easy', 'explain_differently', 'low_energy', 'low_energy_done']),
  /// The learner's own words about the example. Only read by `low_energy_done`.
  response: z.string().max(400).optional(),
  /// The assignment revision the offer returned. Only read by `low_energy_done`.
  revision: z.number().int().min(0).optional(),
});

export const hintRequestSchema = z.object({
  index: z.number().int().min(0).max(2),
});

/**
 * Take time *off* a running countdown.
 *
 * Reduce-only, and the direction is the whole point. Shortening brings the lock
 * forward, which can only make the commitment stricter — there is nothing to
 * defend against. Extending pushes it away, and a timer that can be pushed away
 * indefinitely is not a commitment device at all, so this schema has no way to
 * express it. Someone who genuinely wants longer resets and arms again, which
 * costs them the interval already served.
 */
export const shortenSchema = z.object({
  /// Minutes to remove. Clamped at the deadline, never past it into the past.
  minutes: z.number().int().min(1).max(600),
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

/** POST /tutor/hint. The source is the learner's current code, run on samples only. */
export const tutorHintSchema = z.object({
  problemId: z.string().uuid(),
  lockSessionId: z.string().uuid().optional(),
  language: submitSchema.shape.language,
  sourceCode: z.string().max(64 * 1024),
  request: z.enum(['next', 'level', 'didnt_help', 'explain_word', 'step_by_step', 'smaller_example', 'different_explanation']),
  level: z.number().int().min(1).max(5).optional(),
  term: z.string().trim().min(1).max(60).optional(),
  // Only the ordinal is used. The server re-runs that hidden case against the
  // current code and uses it only if it still fails, so a stale or guessed
  // ordinal can reveal nothing grading would not.
  hiddenFailure: z
    .object({
      ordinal: z.number().int().min(0),
      actualStdout: z.string().max(2000).nullable().optional(),
      stderr: z.string().max(4000).nullable().optional(),
    })
    .optional(),
});

/** POST /tutor/feedback. Everything optional beyond what it is about. */
export const feedbackSchema = z.object({
  kind: z.enum(['hint', 'success']),
  problemSlug: z.string().max(120).optional(),
  helpful: z.boolean().optional(),
  feeling: z.enum(['satisfying', 'fine', 'flat', 'frustrating']).optional(),
  hintLevel: z.number().int().min(1).max(5).optional(),
  strategy: z.string().max(40).optional(),
  note: z.string().trim().max(500).optional(),
});

// ---------------------------------------------------------------------------
// Learn
// ---------------------------------------------------------------------------
// None of these carries a lockSessionId, and that is the point: a lesson's
// practice and hints reach the grader and the hint builder with no session
// at all, so a stale or leaked session id on the client cannot turn a
// practice solve into a release.

const lessonIdParam = z.string().regex(/^[a-z0-9-]{3,64}$/);

export const learnQuerySchema = z.object({
  language: languageEnum.optional(),
});

export const lessonParamSchema = z.object({ id: lessonIdParam });

export const lessonStartSchema = z.object({
  language: languageEnum,
});

export const lessonDraftSchema = z.object({
  version: z.number().int().min(1),
  step: z.number().int().min(0).max(5).optional(),
  /** Unsent answers by check id. Bounded so a draft cannot become a dump. */
  draft: z.record(z.string().max(64), z.string().max(64 * 1024)).optional(),
});

export const lessonCheckSchema = z.object({
  attemptId: z.string().uuid(),
  /** Accepted for older clients; a check is keyed by attemptId, not by row version. */
  version: z.number().int().min(1).optional(),
  kind: z.enum(['prediction', 'task']),
  checkId: z.string().max(64),
  /** For a prediction: the chosen option index. */
  answer: z.number().int().min(0).max(16).optional(),
  /** For a task: the whole program. */
  sourceCode: z.string().max(64 * 1024).optional(),
});

export const lessonFinishSchema = z.object({
  version: z.number().int().min(1),
});

export const lessonPlacementSchema = z.object({
  foundations: z.literal('known'),
});

export const lessonCorrectionSchema = z.object({
  lessonId: lessonIdParam,
  correction: z.enum(['known', 'too_hard']),
});

export const lessonPracticeSchema = z.object({
  language: languageEnum,
});

export const learnPracticeSubmitSchema = z.object({
  problemId: z.string().uuid(),
  language: languageEnum,
  sourceCode: z.string().min(1).max(64 * 1024),
});

export const learnPracticeHintSchema = tutorHintSchema.omit({ lockSessionId: true });
