import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error.js';
import { withLocalUser, currentUser } from '../middleware/localUser.js';
import { profileSchema, registerDeviceSchema, timerConfigSchema } from '../validation/schemas.js';

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
