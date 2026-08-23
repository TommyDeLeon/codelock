import { Router } from 'express';
import { OAuthProvider } from '@prisma/client';
import { z } from 'zod';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { env } from '../env.js';
import { asyncHandler } from '../middleware/error.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { issueSession } from './auth.js';
import {
  authorizeUrl,
  configuredProviders,
  exchangeCode,
  fetchProfile,
  isProviderConfigured,
  pkcePair,
  type ProviderProfile,
} from '../services/oauth.js';

export const oauthRouter = Router();

/**
 * Signing in and signing up with an identity provider.
 *
 * They are the same flow: an identity nobody has seen before becomes a new
 * account. There is no separate "sign up with GitHub" endpoint because there is
 * no separate act — the provider says who someone is, and either we already
 * know them or we do not.
 *
 * Two short-lived server-side maps, and no tokens in any URL. The obvious
 * implementation redirects back to the app with the session in the query
 * string, which leaks it into browser history, the Referer header, and every
 * proxy log along the way. For this product the leaked value releases a device
 * lock, so it is worth an extra hop: the client mints a `handoff` when it
 * starts, the callback stashes the finished session under it, and the client
 * exchanges the handoff for tokens over POST. Only the client that began the
 * flow holds the handoff, and that is what binds the two halves together.
 *
 * In memory on purpose. These live for two minutes; putting them in Postgres
 * would add a table, a migration and a sweeper to persist something that is
 * meaningless after a redirect. A restart mid-sign-in costs one retry.
 */

interface PendingAuth {
  provider: OAuthProvider;
  handoff: string;
  verifier: string | null;
  expiresAt: number;
}

interface FinishedAuth {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string };
  expiresAt: number;
}

const OAUTH_TTL_MS = 2 * 60_000;
const pendingAuth = new Map<string, PendingAuth>();
const finishedAuth = new Map<string, FinishedAuth>();

function sweep(): void {
  const now = Date.now();
  for (const [key, value] of pendingAuth) if (value.expiresAt < now) pendingAuth.delete(key);
  for (const [key, value] of finishedAuth) if (value.expiresAt < now) finishedAuth.delete(key);
}

function parseProvider(raw: string): OAuthProvider {
  const upper = raw.toUpperCase();
  if (upper !== 'GITHUB' && upper !== 'GOOGLE') {
    throw ApiError.badRequest('Unknown sign-in provider');
  }
  if (!isProviderConfigured(upper)) {
    throw ApiError.badRequest(`${upper} sign-in is not configured on this server`);
  }
  return upper;
}

/** Which buttons the sign-in screens should render. */
oauthRouter.get('/providers', (_req, res) => {
  res.json({ providers: configuredProviders() });
});

/** Begin. Returns the provider URL to open, and the handoff to claim with. */
oauthRouter.post(
  '/:provider/start',
  authLimiter,
  asyncHandler(async (req, res) => {
    sweep();
    const provider = parseProvider(req.params.provider ?? '');

    const state = crypto.randomBytes(32).toString('base64url');
    const handoff = crypto.randomBytes(32).toString('base64url');
    // GitHub ignores PKCE parameters; Google honours them when sent.
    const pkce = provider === OAuthProvider.GOOGLE ? pkcePair() : null;

    pendingAuth.set(state, {
      provider,
      handoff,
      verifier: pkce?.verifier ?? null,
      expiresAt: Date.now() + OAUTH_TTL_MS,
    });

    res.json({ url: authorizeUrl(provider, state, pkce?.challenge ?? null), handoff });
  }),
);

/** The provider redirects the browser here, so there is no Authorization header. */
oauthRouter.get(
  '/:provider/callback',
  asyncHandler(async (req, res) => {
    sweep();
    const query = z
      .object({ code: z.string().min(1), state: z.string().min(1) })
      .safeParse(req.query);

    const done = (status: string) => res.redirect(`${env.APP_URL}/login?oauth=${status}`);
    if (!query.success) return done('error');

    const pending = pendingAuth.get(query.data.state);
    // Single use: deleting before the exchange means a replayed callback URL
    // cannot mint a second session.
    pendingAuth.delete(query.data.state);
    if (!pending || pending.expiresAt < Date.now()) return done('expired');

    try {
      const token = await exchangeCode(pending.provider, query.data.code, pending.verifier);
      const profile = await fetchProfile(pending.provider, token);
      const user = await resolveUser(pending.provider, profile);
      const tokens = await issueSession(user.id, user.email);

      finishedAuth.set(pending.handoff, {
        ...tokens,
        user: { id: user.id, email: user.email, displayName: user.displayName },
        expiresAt: Date.now() + OAUTH_TTL_MS,
      });
      return done('complete');
    } catch (err) {
      logger.warn({ err, provider: pending.provider }, 'oauth sign-in failed');
      return done(err instanceof ApiError && err.status === 409 ? 'noemail' : 'error');
    }
  }),
);

/** Exchange the handoff for the session. One shot, then it is gone. */
oauthRouter.post(
  '/claim',
  authLimiter,
  asyncHandler(async (req, res) => {
    sweep();
    const { handoff } = z.object({ handoff: z.string().min(20).max(200) }).parse(req.body);

    const finished = finishedAuth.get(handoff);
    if (!finished || finished.expiresAt < Date.now()) {
      throw ApiError.unauthorized('That sign-in has expired. Please try again.');
    }
    finishedAuth.delete(handoff);

    res.json({
      user: finished.user,
      accessToken: finished.accessToken,
      refreshToken: finished.refreshToken,
    });
  }),
);

/**
 * Find or create the local user behind a provider identity.
 *
 * Three cases, in order:
 *
 *  1. The identity is already linked. Sign that user in — the email is not
 *     consulted at all, because a user may have changed it at the provider
 *     since, and the link is what identifies them.
 *  2. No link, but the provider reports a VERIFIED email matching a local
 *     account. Attach the identity to it. Verification is the whole safety of
 *     this step: without it, anyone able to set that address at any provider
 *     could adopt someone else's CodeLock account.
 *  3. Otherwise, a new account with no password. The login route can never
 *     match one for it, because argon2 verifies against a decoy hash instead.
 */
async function resolveUser(provider: OAuthProvider, profile: ProviderProfile) {
  const linked = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: { provider, providerAccountId: profile.providerAccountId },
    },
    include: { user: true },
  });
  if (linked) return linked.user;

  // An unverified address is treated as no address at all.
  const email = profile.emailVerified ? profile.email : null;

  if (!email) {
    // GitHub allows a private, unverified address, and there is nothing safe to
    // key an account on without one. Asking for an email and password is better
    // than inventing a placeholder nobody can receive mail at or de-duplicate.
    throw new ApiError(
      409,
      'OAUTH_NO_EMAIL',
      'That provider did not give us a verified email address. Sign up with an email and password instead, then link the provider from Settings.',
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.oAuthAccount.create({
      data: {
        userId: existing.id,
        provider,
        providerAccountId: profile.providerAccountId,
        providerEmail: profile.email,
      },
    });
    return existing;
  }

  return prisma.user.create({
    data: {
      email,
      displayName: profile.displayName.slice(0, 60),
      // No password: this account is reachable only through the provider until
      // the user sets one.
      passwordHash: null,
      progress: { create: {} },
      timerConfig: { create: {} },
      oauthAccounts: {
        create: {
          provider,
          providerAccountId: profile.providerAccountId,
          providerEmail: profile.email,
        },
      },
    },
  });
}
