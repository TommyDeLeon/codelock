import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { withLocalUser, currentUser } from '../middleware/localUser.js';
import {
  availableFamiliesForTiers,
  availableTiers,
  loadProgressSnapshot,
} from '../services/progression.js';
import {
  difficultyFocusSchema,
  profileSchema,
  registerDeviceSchema,
  timerConfigSchema,
} from '../validation/schemas.js';

/**
 * The budgets offered, mirrored from @codelock/shared.
 *
 * A literal rather than an import for the same reason the family labels are:
 * the API ships compiled JavaScript without the shared package's source, so a
 * runtime import from it is a MODULE_NOT_FOUND on boot rather than a type
 * error at build time.
 */
const TIME_BUDGET_CHOICES = [3, 10, 30, 60] as const;

export const settingsRouter = Router();
settingsRouter.use(withLocalUser);

/**
 * GET /settings/profile
 *
 * The learner's own preferences. This replaces what `/auth/me` used to carry:
 * with accounts gone there is no identity to return, but the editor still needs
 * to know which language to open in, and losing that silently made the lock
 * screen forget a setting the user had deliberately chosen.
 */
settingsRouter.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const row = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { displayName: true, preferredLanguage: true, timezone: true },
    });
    res.json({ profile: row });
  }),
);

/** PATCH /settings/profile */
settingsRouter.patch(
  '/profile',
  asyncHandler(async (req, res) => {
    const patch = profileSchema.parse(req.body);
    const user = currentUser(req);
    const row = await prisma.user.update({
      where: { id: user.id },
      data: patch,
      select: { displayName: true, preferredLanguage: true, timezone: true },
    });
    res.json({ profile: row });
  }),
);

/** GET /settings/timer */
settingsRouter.get(
  '/timer',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const config = await prisma.timerConfig.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
    res.json({ timerConfig: config });
  }),
);

/**
 * PATCH /settings/timer
 *
 * Changes apply to the *next* session. An ARMED session keeps the fireAt it was
 * created with, so shortening the timer mid-countdown cannot be used to dodge
 * a lock that is about to land.
 */
settingsRouter.patch(
  '/timer',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = timerConfigSchema.parse(req.body);
    const config = await prisma.timerConfig.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...body },
      update: body,
    });
    res.json({ timerConfig: config });
  }),
);

/**
 * PUT /settings/difficulty
 *
 * Automatic (the default) or a manual focus on one band. Stored on the timer
 * config and read when the next session arms: an ARMED or LOCKED session keeps
 * the difficulty it was armed with. UserProgress is never touched here, so the
 * automatic tier and its streaks are exactly where they were on return.
 */
settingsRouter.put(
  '/difficulty',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = difficultyFocusSchema.parse(req.body);
    const data =
      body.mode === 'MANUAL'
        ? { difficultyMode: 'MANUAL' as const, focusDifficulty: body.difficulty }
        : { difficultyMode: 'AUTOMATIC' as const, focusDifficulty: null };
    const config = await prisma.timerConfig.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
    res.json({ timerConfig: config });
  }),
);

/**
 * GET /settings/time-budgets
 *
 * Which budgets this learner can actually choose, and how many problems sit
 * under each.
 *
 * The dashboard greys out a band with nothing under it rather than letting it
 * be picked and then quietly relaxed by the selector. "Three minutes" that
 * silently serves a twenty-minute problem teaches the learner that the setting
 * is decorative, and the next thing they stop believing is the lock.
 *
 * Counted inside the learner's own curriculum gate, not across the whole
 * corpus: a three-minute Tier 3 problem is no use to someone on Tier 0, and
 * counting it would offer a band that selection cannot honour.
 *
 * This is a snapshot, not a promise. The repetition rule excludes problems
 * seen recently, so a band that is selectable now can be empty tonight — which
 * is why the server still relaxes rather than refusing.
 */
settingsRouter.get(
  '/time-budgets',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const snapshot = await loadProgressSnapshot(user.id);
    const tiers = availableTiers(snapshot);
    const families = availableFamiliesForTiers(snapshot, tiers);

    const curriculum = {
      isActive: true,
      ...(tiers.length > 0 ? { tier: { in: tiers } } : {}),
      ...(families.length > 0 ? { patternFamily: { in: families } } : {}),
    };

    const budgets = await Promise.all(
      TIME_BUDGET_CHOICES.map(async (minutes) => ({
        minutes,
        problemCount: await prisma.problem.count({
          where: { ...curriculum, avgSolveSeconds: { lte: minutes * 60 } },
        }),
      })),
    );

    res.json({ budgets: budgets.map((b) => ({ ...b, available: b.problemCount > 0 })) });
  }),
);

/** POST /settings/devices — register or refresh this device. */
settingsRouter.post(
  '/devices',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = registerDeviceSchema.parse(req.body);
    const device = await prisma.device.create({
      data: {
        userId: user.id,
        platform: body.platform,
        label: body.label,
        pushToken: body.pushToken ?? null,
      },
    });
    res.status(201).json({ device });
  }),
);

/** GET /settings/devices */
settingsRouter.get(
  '/devices',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const devices = await prisma.device.findMany({
      where: { userId: user.id },
      orderBy: { lastSeenAt: 'desc' },
    });
    res.json({ devices });
  }),
);
