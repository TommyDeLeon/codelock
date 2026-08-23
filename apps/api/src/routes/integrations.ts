import { Router } from 'express';
import { IntegrationProvider } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { env } from '../env.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth, currentUser } from '../middleware/auth.js';
import { integrationLimiter } from '../middleware/rateLimit.js';
import { encryptSecret, randomToken, safeEqual } from '../lib/crypto.js';
import {
  authorizeUrl,
  createSolutionsRepo,
  exchangeCode,
  fetchViewer,
  listRepos,
  GITHUB_SCOPES,
} from '../services/github.js';
import { fetchLeetCodeStats } from '../services/leetcode.js';
import { getLeetCodeStats } from '../services/integrations.js';

export const integrationsRouter = Router();

/**
 * OAuth state, held in memory.
 *
 * State is single-use and expires in ten minutes, so a restart costing an
 * in-flight authorization is an acceptable trade for not adding a Redis
 * dependency. Multi-instance deployments should move this to shared storage —
 * a user bounced to a different pod mid-flow would otherwise see "invalid
 * state" and simply retry.
 */
const pendingStates = new Map<string, { userId: string; expiresAt: number }>();

function rememberState(userId: string): string {
  const state = randomToken(24);
  pendingStates.set(state, { userId, expiresAt: Date.now() + 10 * 60_000 });
  for (const [key, value] of pendingStates) {
    if (value.expiresAt < Date.now()) pendingStates.delete(key);
  }
  return state;
}

// --- listing ---------------------------------------------------------------

integrationsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const rows = await prisma.integration.findMany({
      where: { userId: user.id },
      select: {
        provider: true,
        externalUsername: true,
        repoFullName: true,
        repoBranch: true,
        enabled: true,
        lastSyncAt: true,
        lastError: true,
        scopes: true,
      },
    });

    res.json({
      integrations: rows,
      // The UI needs to know whether connecting is even possible before it
      // renders a button that would 503.
      available: {
        github: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
        leetcode: true,
      },
    });
  }),
);

integrationsRouter.delete(
  '/:provider',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const provider = z.nativeEnum(IntegrationProvider).parse(req.params.provider?.toUpperCase());
    await prisma.integration.deleteMany({ where: { userId: user.id, provider } });
    res.status(204).end();
  }),
);

// --- GitHub ----------------------------------------------------------------

/**
 * Returns the URL to open rather than redirecting.
 *
 * The caller is an XHR carrying a bearer token; a 302 here would be followed by
 * fetch() without the browser ever navigating. It also lets the Electron and
 * Expo shells open the URL in a system browser, which is the only correct place
 * to run an OAuth flow on desktop and mobile.
 */
integrationsRouter.get(
  '/github/authorize',
  requireAuth,
  integrationLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    res.json({ url: authorizeUrl(rememberState(user.id)), scopes: GITHUB_SCOPES });
  }),
);

/** GitHub redirects the *browser* here, so there is no Authorization header. */
integrationsRouter.get(
  '/github/callback',
  asyncHandler(async (req, res) => {
    const query = z
      .object({ code: z.string().min(1), state: z.string().min(1) })
      .safeParse(req.query);

    if (!query.success) return res.redirect(`${env.APP_URL}/settings?github=error`);

    // Constant-time lookup: the map key comparison itself is not the secret,
    // but the match must not leak timing about which states exist.
    const entry = [...pendingStates.entries()].find(([key]) => safeEqual(key, query.data.state));
    if (!entry || entry[1].expiresAt < Date.now()) {
      return res.redirect(`${env.APP_URL}/settings?github=expired`);
    }
    pendingStates.delete(entry[0]);
    const userId = entry[1].userId;

    try {
      const { token, scopes } = await exchangeCode(query.data.code);
      const viewer = await fetchViewer(token);

      await prisma.integration.upsert({
        where: { userId_provider: { userId, provider: IntegrationProvider.GITHUB } },
        create: {
          userId,
          provider: IntegrationProvider.GITHUB,
          externalUsername: viewer.login,
          accessTokenCipher: encryptSecret(token),
          scopes,
        },
        update: {
          externalUsername: viewer.login,
          accessTokenCipher: encryptSecret(token),
          scopes,
          enabled: true,
          lastError: null,
        },
      });

      res.redirect(`${env.APP_URL}/settings?github=connected`);
    } catch (err) {
      // The user sees ?github=error either way; without this line nobody can
      // tell whether that was a revoked secret, a GitHub outage, or a failing
      // write. oauth.ts logs the structurally identical failure.
      logger.warn({ err, userId }, 'github integration callback failed');
      res.redirect(`${env.APP_URL}/settings?github=error`);
    }
  }),
);

integrationsRouter.get(
  '/github/repos',
  requireAuth,
  integrationLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const integration = await requireIntegration(user.id, IntegrationProvider.GITHUB);
    if (!integration.accessTokenCipher) throw ApiError.conflict('GitHub is not connected');
    res.json({ repos: await listRepos(integration.accessTokenCipher) });
  }),
);

const repoSchema = z.object({
  /** Either pick an existing repo... */
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/).optional(),
  branch: z.string().min(1).max(100).optional(),
  /** ...or have CodeLock create one. */
  createRepoNamed: z.string().regex(/^[\w.-]{1,80}$/).optional(),
});

integrationsRouter.patch(
  '/github',
  requireAuth,
  integrationLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = repoSchema.parse(req.body);
    const integration = await requireIntegration(user.id, IntegrationProvider.GITHUB);
    if (!integration.accessTokenCipher) throw ApiError.conflict('GitHub is not connected');

    let repoFullName = body.repoFullName;
    let branch = body.branch ?? integration.repoBranch;

    if (body.createRepoNamed) {
      const created = await createSolutionsRepo(
        integration.accessTokenCipher,
        body.createRepoNamed,
      );
      repoFullName = created.fullName;
      branch = created.defaultBranch;
    }

    if (!repoFullName) throw ApiError.badRequest('Pick a repository or supply a name to create');

    const updated = await prisma.integration.update({
      where: { id: integration.id },
      data: { repoFullName, repoBranch: branch, lastError: null },
      select: { repoFullName: true, repoBranch: true, externalUsername: true },
    });
    res.json({ integration: updated });
  }),
);

// --- LeetCode --------------------------------------------------------------

integrationsRouter.post(
  '/leetcode',
  requireAuth,
  integrationLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { username } = z
      .object({ username: z.string().min(1).max(50).trim() })
      .parse(req.body);

    // Verify before storing so a typo fails here rather than as a broken card.
    const stats = await fetchLeetCodeStats(username);

    const integration = await prisma.integration.upsert({
      where: { userId_provider: { userId: user.id, provider: IntegrationProvider.LEETCODE } },
      create: {
        userId: user.id,
        provider: IntegrationProvider.LEETCODE,
        externalUsername: stats.username,
        cachedStats: stats as object,
        lastSyncAt: new Date(),
      },
      update: {
        externalUsername: stats.username,
        cachedStats: stats as object,
        lastSyncAt: new Date(),
        enabled: true,
        lastError: null,
      },
      select: { externalUsername: true, lastSyncAt: true },
    });

    res.status(201).json({ integration, stats });
  }),
);

integrationsRouter.get(
  '/leetcode/stats',
  requireAuth,
  integrationLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const force = req.query.refresh === 'true';
    const result = await getLeetCodeStats(user.id, { force });
    if (!result) throw ApiError.notFound('LeetCode is not connected');
    res.json(result);
  }),
);

// --- shared ----------------------------------------------------------------

integrationsRouter.get(
  '/syncs',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const syncs = await prisma.syncRecord.findMany({
      where: { integration: { userId: user.id } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        externalUrl: true,
        detail: true,
        createdAt: true,
        submission: {
          select: { language: true, problem: { select: { title: true, slug: true } } },
        },
      },
    });
    res.json({ syncs });
  }),
);

async function requireIntegration(userId: string, provider: IntegrationProvider) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!integration) throw ApiError.notFound(`${provider} is not connected`);
  return integration;
}

