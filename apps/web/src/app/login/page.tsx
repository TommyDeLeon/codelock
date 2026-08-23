'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OAUTH_PROVIDER_LABELS, type OAuthProviderName } from '@codelock/shared';
import { useAuth } from '@/lib/auth-store';
import { ApiClientError, api, tokenStore } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardBody, Field, Input } from '@/components/ui/primitives';
import { LockMark } from '@/components/ui/lock-mark';
import { GithubMark } from '@/components/ui/github-mark';

/** Where the one-time handoff waits while the browser is at the provider. */
const HANDOFF_KEY = 'codelock.oauth.handoff';

type Mode = 'login' | 'register';

/** What the callback can report, in words the user can act on. */
const OAUTH_FAILURES: Record<string, string> = {
  error: 'That sign-in did not complete. Please try again.',
  expired: 'That sign-in took too long and expired. Please try again.',
  noemail:
    'That provider did not share a verified email address. Create an account with an email and password, then link the provider from Settings.',
};

export default function LoginPage() {
  const router = useRouter();
  const { status, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState<OAuthProviderName[]>([]);
  const { hydrate } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  // Only offer buttons this deployment can actually complete. A provider with
  // no client id configured would send the user to a broken consent screen.
  useEffect(() => {
    void api.oauth
      .providers()
      .then((r) => setProviders(r.providers))
      .catch(() => setProviders([]));
  }, []);

  /**
   * Coming back from a provider.
   *
   * The callback redirected here with a status only — never with tokens, which
   * would put a session-bearing secret into browser history and the Referer
   * header. The session is claimed over POST using the handoff this tab minted
   * before it left.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get('oauth');
    if (!outcome) return;

    const handoff = sessionStorage.getItem(HANDOFF_KEY);
    sessionStorage.removeItem(HANDOFF_KEY);
    window.history.replaceState({}, '', '/login');

    if (outcome !== 'complete' || !handoff) {
      setError(OAUTH_FAILURES[outcome] ?? OAUTH_FAILURES.error!);
      return;
    }

    setBusy(true);
    void api.oauth
      .claim(handoff)
      .then(async (session) => {
        tokenStore.set(session.accessToken, session.refreshToken);
        await hydrate();
        router.replace('/dashboard');
      })
      .catch((err: unknown) =>
        setError(
          err instanceof ApiClientError ? err.message : 'Could not finish signing in. Try again.',
        ),
      )
      .finally(() => setBusy(false));
  }, [hydrate, router]);

  async function startProvider(provider: OAuthProviderName) {
    setError(null);
    setBusy(true);
    try {
      const { url, handoff } = await api.oauth.start(provider);
      // sessionStorage, not localStorage: this must not outlive the tab, and it
      // is the only thing binding the returning browser to this attempt.
      sessionStorage.setItem(HANDOFF_KEY, handoff);
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Could not reach the server. Try again.',
      );
      setBusy(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register({ email, password, displayName });
      router.replace('/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Could not reach the server. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex items-center gap-2.5">
          <LockMark className="size-8 shrink-0" />
          <div>
            <h1 className="text-[15px] font-semibold leading-none tracking-tight">CodeLock</h1>
            <p className="mt-1 text-[13px] text-muted">Earn your screen time.</p>
          </div>
        </div>

        <Card>
          <CardBody>
            {providers.length > 0 && (
              <>
                <div className="space-y-2">
                  {providers.map((provider) => (
                    <Button
                      key={provider}
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full"
                      disabled={busy}
                      onClick={() => void startProvider(provider)}
                    >
                      {provider === 'GITHUB' && <GithubMark className="size-4" aria-hidden />}
                      Continue with {OAUTH_PROVIDER_LABELS[provider]}
                    </Button>
                  ))}
                </div>

                {/* One control for both. A provider identity nobody has seen
                    before becomes an account; there is no separate sign-up. */}
                <p className="mt-2 text-center text-[12.5px] text-faint">
                  Works for signing in and signing up.
                </p>

                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[12px] text-faint">or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {mode === 'register' && (
                <Field label="Name" htmlFor="displayName">
                  <Input
                    id="displayName"
                    name="name"
                    autoComplete="name"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </Field>
              )}

              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field
                label="Password"
                htmlFor="password"
                hint={mode === 'register' ? 'At least 12 characters.' : undefined}
              >
                <Input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                  minLength={mode === 'register' ? 12 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              {error && (
                <p role="alert" className="rounded-sm bg-danger-soft px-3 py-2 text-[13px] text-danger">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" loading={busy} className="w-full">
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="mt-6 text-center text-[13px] text-faint">
          By continuing you agree to the{' '}
          <a href="/terms" className="underline underline-offset-4 hover:text-fg">terms</a>{' '}
          and{' '}
          <a href="/privacy" className="underline underline-offset-4 hover:text-fg">privacy policy</a>.
        </p>

        <p className="mt-4 text-center text-[13px] text-muted">
          {mode === 'login' ? 'No account yet?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="font-medium text-fg underline underline-offset-4 hover:text-accent"
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </main>
  );
}
