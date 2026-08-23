import { OAuthProvider } from '@prisma/client';
import crypto from 'node:crypto';
import { env } from '../env.js';
import { ApiError } from '../lib/errors.js';

/**
 * Signing in through an identity provider.
 *
 * Deliberately separate from services/github.ts. That module asks GitHub for
 * permission to *act* — push commits to a repository — and keeps an encrypted
 * access token around to do it with. This module only ever asks "who is this",
 * uses the answer once, and keeps no provider credential at all. Conflating the
 * two would mean a user who wanted to sign in had also granted repo write.
 *
 * Not included, and not an oversight: LeetCode. It is not an identity provider
 * — it publishes no OAuth or OIDC endpoints — so "sign in with LeetCode" cannot
 * be built without asking users to hand over their LeetCode password, which is
 * phishing with extra steps. LeetCode stays linkable from Settings after
 * sign-in, which is the honest version of the same thing.
 */

export interface ProviderProfile {
  /** The provider's immutable id. Never the email. */
  providerAccountId: string;
  email: string | null;
  /**
   * Whether the provider states the email is verified.
   *
   * This decides whether an OAuth identity may attach itself to an existing
   * local account. An unverified provider email would let anyone who can claim
   * `victim@example.com` at a sloppy provider take over that user's CodeLock
   * account, so an unverified address is treated as no address at all.
   */
  emailVerified: boolean;
  displayName: string;
}

interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizeEndpoint: string;
  tokenEndpoint: string;
  scope: string;
  fetchProfile: (accessToken: string) => Promise<ProviderProfile>;
}

export const PROVIDERS = [OAuthProvider.GITHUB, OAuthProvider.GOOGLE] as const;

export function isProviderConfigured(provider: OAuthProvider): boolean {
  const config = configFor(provider);
  return Boolean(config.clientId && config.clientSecret);
}

/** Which providers this deployment can actually offer, for the login screen. */
export function configuredProviders(): OAuthProvider[] {
  return PROVIDERS.filter(isProviderConfigured);
}

function configFor(provider: OAuthProvider): ProviderConfig {
  switch (provider) {
    case OAuthProvider.GITHUB:
      return {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        authorizeEndpoint: 'https://github.com/login/oauth/authorize',
        tokenEndpoint: 'https://github.com/login/oauth/access_token',
        // Identity only. Notably NOT `repo` — that is the integration's job.
        scope: 'read:user user:email',
        fetchProfile: fetchGitHubProfile,
      };
    case OAuthProvider.GOOGLE:
      return {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        authorizeEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        scope: 'openid email profile',
        fetchProfile: fetchGoogleProfile,
      };
  }
}

export const redirectUri = (provider: OAuthProvider): string =>
  `${env.API_URL}/v1/auth/oauth/${provider.toLowerCase()}/callback`;

/**
 * The URL to send the browser to.
 *
 * `state` is the CSRF defence: minted per attempt, stored server-side, and it
 * must come back unchanged. PKCE is layered on top for Google, which supports
 * it — the verifier never leaves this server, so an intercepted authorization
 * code is useless without it.
 */
export function authorizeUrl(
  provider: OAuthProvider,
  state: string,
  codeChallenge: string | null,
): string {
  const config = configFor(provider);
  if (!config.clientId) throw ApiError.badRequest(`${provider} sign-in is not configured`);

  const url = new URL(config.authorizeEndpoint);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', redirectUri(provider));
  url.searchParams.set('scope', config.scope);
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');

  if (codeChallenge) {
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
  }
  return url.toString();
}

/** PKCE: a random verifier, and the SHA-256 challenge derived from it. */
export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

const base64Url = (buffer: Buffer): string =>
  buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function exchangeCode(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string | null,
): Promise<string> {
  const config = configFor(provider);

  const body: Record<string, string> = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri(provider),
    grant_type: 'authorization_code',
  };
  if (codeVerifier) body.code_verifier = codeVerifier;

  const res = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(body).toString(),
  });

  if (!res.ok) throw ApiError.unauthorized('Could not complete sign-in with that provider');

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw ApiError.unauthorized('Provider did not return an access token');
  return data.access_token;
}

export function fetchProfile(
  provider: OAuthProvider,
  accessToken: string,
): Promise<ProviderProfile> {
  return configFor(provider).fetchProfile(accessToken);
}

async function fetchGitHubProfile(accessToken: string): Promise<ProviderProfile> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'CodeLock',
  };

  const res = await fetch('https://api.github.com/user', { headers });
  if (!res.ok) throw ApiError.unauthorized('Could not read your GitHub profile');
  const user = (await res.json()) as { id: number; login: string; name?: string };

  // The profile email is null whenever the user keeps it private, and it is not
  // marked verified there in any case. The dedicated endpoint is the only place
  // that says both which address is primary and whether it is verified.
  let email: string | null = null;
  let emailVerified = false;

  const emails = await fetch('https://api.github.com/user/emails', { headers });
  if (emails.ok) {
    const list = (await emails.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    const primary = list.find((e) => e.primary && e.verified) ?? list.find((e) => e.verified);
    if (primary) {
      email = primary.email.toLowerCase();
      emailVerified = true;
    }
  }

  return {
    providerAccountId: String(user.id),
    email,
    emailVerified,
    displayName: user.name?.trim() || user.login,
  };
}

async function fetchGoogleProfile(accessToken: string): Promise<ProviderProfile> {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw ApiError.unauthorized('Could not read your Google profile');

  const profile = (await res.json()) as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };

  return {
    providerAccountId: profile.sub,
    email: profile.email?.toLowerCase() ?? null,
    emailVerified: profile.email_verified === true,
    displayName: profile.name?.trim() || profile.email?.split('@')[0] || 'CodeLock user',
  };
}
