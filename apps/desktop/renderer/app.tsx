import { useEffect, useRef, useState } from 'react';
import type { OAuthProviderName } from '@codelock/shared';
import { openExternal } from './bridge';
import { DashboardScreen } from './screens/dashboard';
import { SettingsScreen } from './screens/settings';
import { LockMark } from './lock-mark';
import { ProviderMark } from './provider-mark';
import {
  applyTheme,
  readPreference,
  writePreference,
  THEME_ORDER,
  type ThemePreference,
} from './theme';

type Tab = 'dashboard' | 'settings';

/**
 * Light, dark, or whatever the machine is doing.
 *
 * Three states rather than a two-way switch, matching the web app. "System" is
 * not the same as having picked the OS's current setting: a machine that
 * changes theme on a schedule should carry the app with it, and only an
 * explicit Light or Dark should refuse to move.
 *
 * The preference is applied before paint in main.tsx; this control only has to
 * keep the button state and the document attribute in step afterwards.
 */
function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);

  const choose = (next: ThemePreference) => {
    setPreference(next);
    writePreference(next);
    applyTheme(next);
  };

  const label: Record<ThemePreference, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  };

  return (
    <div role="group" aria-label="Theme" style={{ display: 'flex', gap: 4 }}>
      {THEME_ORDER.map((option) => {
        const active = option === preference;
        return (
          <button
            key={option}
            type="button"
            onClick={() => choose(option)}
            aria-pressed={active}
            style={{
              font: 'inherit',
              fontSize: 12,
              padding: '4px 10px',
              cursor: 'pointer',
              borderRadius: 'var(--radius-xs)',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              background: active ? 'var(--accent-soft)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            {label[option]}
          </button>
        );
      })}
    </div>
  );
}

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
          <div style={{ marginLeft: 'auto' }}>
            <ThemeToggle />
          </div>
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
