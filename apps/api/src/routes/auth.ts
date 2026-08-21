import { Router } from 'express';
import argon2 from 'argon2';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { env } from '../env.js';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, currentUser } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { generateRefreshToken, signAccessToken, sha256 } from '../lib/tokens.js';
import { loginSchema, refreshSchema, registerSchema } from '../validation/schemas.js';

export const authRouter = Router();

/** OWASP-recommended argon2id parameters; ~50 ms on typical server hardware. */
const ARGON_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

async function issueSession(userId: string, email: string) {
  const { token, hash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
    },
  });
  return { accessToken: signAccessToken(userId, email), refreshToken: token };
}

authRouter.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw ApiError.conflict('An account with that email already exists');

    const user = await prisma.user.create({
      data: {
        email: body.email,
        displayName: body.displayName,
        timezone: body.timezone,
        passwordHash: await argon2.hash(body.password, ARGON_OPTS),
        // Every user needs both rows from day one; the rest of the API assumes them.
        progress: { create: {} },
        timerConfig: { create: {} },
      },
    });

    const tokens = await issueSession(user.id, user.email);
    res.status(201).json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
      ...tokens,
    });
  }),
);

authRouter.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });

    // Verify even when the user is missing, against a dummy hash, so response
    // time does not reveal which emails are registered.
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const ok = await argon2.verify(hash, body.password).catch(() => false);
    if (!user || !ok) throw ApiError.unauthorized('Invalid email or password');

    const tokens = await issueSession(user.id, user.email);
    res.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
      ...tokens,
    });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const record = await prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
      include: { user: true },
    });

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token is invalid or expired');
    }

    // Rotate: a replayed token is then provably stale.
    await prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await issueSession(record.user.id, record.user.email);
    res.json(tokens);
  }),
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.status(204).end();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id } = currentUser(req);
    const user = await prisma.user.findUnique({
      where: { id },
      include: { progress: true, timerConfig: true },
    });
    if (!user) throw ApiError.notFound('User not found');
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      preferredLanguage: user.preferredLanguage,
      timezone: user.timezone,
      progress: user.progress,
      timerConfig: user.timerConfig,
    });
  }),
);

/** Cost-matched decoy so failed logins take the same time as real ones. */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$8pQfB3ZPvY0i0Wm8mNqQpQ9YQZ2t9k1H0oXgUj0YQ7A';
