import { useState } from 'react';
import { api, ApiError, isSignedIn, signOut } from './api';
import { DashboardScreen } from './screens/dashboard';
import { SettingsScreen } from './screens/settings';

type Tab = 'dashboard' | 'settings';

/**
 * The desktop shell's own UI.
 *
 * Two screens and a sign-in, deliberately. Everything else the product does
 * either lives on the lock screen — which the main process loads from the web
 * app, because it is a code editor — or on the marketing site, which has no
 * business being inside an installed application.
 */
export function App() {
  const [signedIn, setSignedIn] = useState(isSignedIn());
  const [tab, setTab] = useState<Tab>('dashboard');

  if (!signedIn) return <SignIn onSignedIn={() => setSignedIn(true)} />;

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 28px 40px' }}>
      <header
        className="rule"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          borderTop: 'none',
          borderBottom: '1px solid var(--border)',
          paddingBottom: 12,
          marginBottom: 26,
        }}
      >
        <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>CodeLock</span>
        <nav style={{ display: 'flex', gap: 4 }}>
          {(['dashboard', 'settings'] as const).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              aria-current={tab === name ? 'page' : undefined}
              style={{
                border: 'none',
                background: 'none',
                padding: '4px 8px',
                borderRadius: 'var(--radius-xs)',
                color: tab === name ? 'var(--fg)' : 'var(--muted)',
                textTransform: 'capitalize',
              }}
            >
              {name}
            </button>
          ))}
        </nav>
      </header>

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
  );
}

function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login(email.trim(), password);
      onSignedIn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 340, margin: '18vh auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Sign in</h1>
      <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--muted)' }}>
        The same account as the web and mobile apps.
      </p>

      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        <label style={{ display: 'grid', gap: 4, fontSize: 12.5, color: 'var(--muted)' }}>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label style={{ display: 'grid', gap: 4, fontSize: 12.5, color: 'var(--muted)' }}>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p style={{ margin: 0, fontSize: 12.5, color: 'var(--danger)' }}>{error}</p>}

        <button
          type="submit"
          disabled={busy}
          style={{
            marginTop: 6,
            height: 40,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            fontWeight: 600,
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
