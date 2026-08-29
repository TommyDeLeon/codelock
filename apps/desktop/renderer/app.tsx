import { useEffect, useRef, useState } from 'react';
import type { OAuthProviderName } from '@codelock/shared';
import { api, ApiError, isSignedIn, signOut } from './api';
import { openExternal } from './bridge';
import { DashboardScreen } from './screens/dashboard';
import { SettingsScreen } from './screens/settings';
import { LockMark } from './lock-mark';
import { ProviderMark } from './provider-mark';

type Tab = 'dashboard' | 'settings';

/**
 * The desktop shell's own UI.
 *
 * Two screens and an auth screen, deliberately. Everything else the product
 * does either lives on the lock screen — which the main process loads from the
 * web app, because it is a code editor — or on the marketing site, which has no
 * business being inside an installed application.
 */
export function App() {
  const [signedIn, setSignedIn] = useState(isSignedIn());
  const [tab, setTab] = useState<Tab>('dashboard');

  if (!signedIn) return <AuthScreen onSignedIn={() => setSignedIn(true)} />;

  return (
    <>
      {/* The web app's chrome minus its promotional band. That band belongs to
          a storefront, where the visitor has not decided yet; here they have
          installed the thing and open it several times a day, and a strip
          selling it back to them is the loudest reason this window read as a
          web page rather than an application. DESIGN.md §3 specifies a slim
          app header for this screen and no band. */}
      <header style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          style={{
            padding: '12px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <LockMark size={22} />
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>CodeLock</span>
        </div>
      </header>

      <nav className="section-strip" aria-label="Sections">
        <div
          style={{
            padding: '0 32px',
            display: 'flex',
            gap: 28,
          }}
        >
          {(['dashboard', 'settings'] as const).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              aria-current={tab === name ? 'page' : undefined}
              style={{ textTransform: 'capitalize' }}
            >
              {name}
            </button>
          ))}
        </div>
      </nav>

      {/* Full width, not a centred column. This is an application window the
          user sizes themselves; reserving their extra width as empty margin
          second-guesses that. Long prose inside still carries its own measure,
          which is where a reading limit actually belongs. */}
      <div style={{ padding: '28px 32px 40px' }}>
        {tab === 'dashboard' ? (
          <DashboardScreen
            onSignOut={() => {
              signOut();
              setSignedIn(false);
            }}
          />
        ) : (
          <SettingsScreen />
        )}
      </div>
    </>
  );
}

/**
 * Sign in and sign up, in one screen.
 *
 * Provider sign-in has to leave the app: OAuth belongs in a real browser with a
 * visible address bar, never inside an application window that could be drawing
 * its own. So the shell opens the system browser, and this screen polls for the
 * finished session using the one-time handoff it minted beforehand — that
 * handoff is what binds the returning browser back to this window.
 */
function AuthScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [providers, setProviders] = useState<OAuthProviderName[]>([]);
  const cancelled = useRef(false);
  /**
   * Set by the Cancel button, and distinct from `cancelled`, which means the
   * component is going away. Closing the browser tab tells this process
   * nothing at all — there is no event for "the user gave up" — so without a
   * way to say so the screen sits on "Waiting for your browser" for the full
   * two minutes and looks frozen.
   */
  const abandoned = useRef(false);

  // Only offer buttons the server can complete. A provider with no client id
  // configured would send the user to a broken consent screen.
  useEffect(() => {
    // Reset on every mount, not just initialise once. StrictMode mounts,
    // unmounts and remounts in development, and the cleanup below latches this
    // ref at true — so without this line the poll's `!cancelled.current` check
    // fails on its first pass and provider sign-in times out instantly.
    cancelled.current = false;

    void api
      .oauthProviders()
      .then((r) => setProviders(r.providers))
      .catch(() => setProviders([]));
    return () => {
      cancelled.current = true;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') await api.login(email.trim(), password);
      else
        await api.register({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
        });
      onSignedIn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach CodeLock.');
    } finally {
      setBusy(false);
    }
  }

  async function startProvider(provider: OAuthProviderName) {
    setError(null);
    abandoned.current = false;
    setWaiting(true);
    try {
      const { url, handoff } = await api.oauthStart(provider);
      openExternal(url);

      // Poll until the browser half finishes. The handoff expires server-side
      // after two minutes, so this gives up at the same moment rather than
      // spinning forever on a window the user quietly closed.
      const deadline = Date.now() + 2 * 60_000;
      while (Date.now() < deadline && !cancelled.current && !abandoned.current) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const session = await api.oauthClaim(handoff);
        if (session) return onSignedIn();
      }
      // Cancelling is a deliberate act, not a failure. Saying "timed out"
      // after the user pressed Cancel reads as though something went wrong.
      if (abandoned.current) return;
      if (cancelled.current) return;
      setError('That sign-in timed out. Try again.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start that sign-in.');
    } finally {
      setWaiting(false);
    }
  }

  const disabled = busy || waiting;

  return (
    <>
      <main style={{ maxWidth: 340, margin: '12vh auto', padding: '0 24px' }}>
        <LockMark size={26} />
        <h1 className="display" style={{ fontSize: 26, margin: '12px 0 4px' }}>
          {mode === 'login' ? 'Sign in' : 'Create your account'}
        </h1>
        <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--muted)' }}>
          The same account as the web and mobile apps.
        </p>

        {providers.length > 0 && (
          <>
            <div style={{ display: 'grid', gap: 8 }}>
              {providers.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  className="btn btn-secondary"
                  disabled={disabled}
                  onClick={() => void startProvider(provider)}
                  style={{ width: '100%' }}
                >
                  <ProviderMark provider={provider} />
                  Continue with {provider === 'GITHUB' ? 'GitHub' : 'Google'}
                </button>
              ))}
            </div>

            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: 'var(--faint)',
                textAlign: 'center',
                // Without this the line breaks after "signing" and orphans
                // "up." on a line of its own under a 340px column.
                textWrap: 'balance',
              }}
            >
              {waiting ? (
                <>
                  Finish signing in from your browser, then come back.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      abandoned.current = true;
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      font: 'inherit',
                      color: 'var(--fg)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                'Opens your browser. Works for signing in and signing up.'
              )}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '18px 0',
              }}
            >
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--faint)' }}>or</span>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
          </>
        )}

        <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
          {mode === 'register' && (
            <label
              style={{
                display: 'grid',
                gap: 4,
                fontSize: 12.5,
                color: 'var(--muted)',
              }}
            >
              Name
              <input
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </label>
          )}

          <label
            style={{
              display: 'grid',
              gap: 4,
              fontSize: 12.5,
              color: 'var(--muted)',
            }}
          >
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label
            style={{
              display: 'grid',
              gap: 4,
              fontSize: 12.5,
              color: 'var(--muted)',
            }}
          >
            Password
            <input
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={mode === 'register' ? 12 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {mode === 'register' && (
              <span style={{ fontSize: 11.5, color: 'var(--faint)' }}>At least 12 characters.</span>
            )}
          </label>

          {error && <p style={{ margin: 0, fontSize: 12.5, color: 'var(--danger)' }}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={disabled}
            style={{ marginTop: 6, width: '100%' }}
          >
            {busy ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p
          style={{
            marginTop: 16,
            fontSize: 13,
            color: 'var(--muted)',
            textAlign: 'center',
          }}
        >
          {mode === 'login' ? 'No account yet?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="btn btn-quiet"
            style={{ color: 'var(--fg)', fontWeight: 600 }}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </main>
    </>
  );
}
