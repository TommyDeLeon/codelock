import { useEffect, useRef, useState } from 'react';
import type { OAuthProviderName } from '@codelock/shared';
import { openExternal } from './bridge';
import { DashboardScreen } from './screens/dashboard';
import { SettingsScreen } from './screens/settings';
import { LockMark } from './lock-mark';
import { ProviderMark } from './provider-mark';

type Tab = 'dashboard' | 'settings';

/**
 * The desktop shell's own UI.
 *
 * Two screens, deliberately. Everything else the product does either lives on
 * the lock screen — which the main process loads from the web app, because it
 * is a code editor — or on the marketing site, which has no business being
 * inside an installed application.
 *
 * There is no sign-in. CodeLock keeps one learner's history in a database on
 * their own machine, so an account would guard nothing the operating system
 * does not already guard — and the borrowed-session handshake it required was
 * the cause of a lock screen that could fail to authenticate while a timer ran.
 */
export function App() {
  const [tab, setTab] = useState<Tab>('dashboard');

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
          <DashboardScreen />
        ) : (
          <SettingsScreen />
        )}
      </div>
    </>
  );
}
