import { useCallback, useEffect, useState } from 'react';
import type { AccomplishmentKind, ProgressView } from '@codelock/shared';
import { api, ApiError } from '../api';

/**
 * What you can do, saved.
 *
 * No streaks, no targets, nothing that resets for being away. Solves on your
 * own and solves with help are counted separately, because both are real and
 * they mean different things.
 */

const KIND_LABELS: Record<AccomplishmentKind, string> = {
  independent: 'On your own',
  assisted: 'With help',
  worked_solution: 'Studied a solution',
  recall: 'Remembered after a gap',
  transfer: 'Applied to a new problem',
};

export function ProgressScreen() {
  const [view, setView] = useState<ProgressView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setView(await api.progress());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your progress.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!view) {
    return (
      <div style={{ fontSize: 13 }}>
        <p style={{ color: error ? 'var(--danger)' : 'var(--faint)', margin: 0 }}>
          {error ?? 'Loading your progress…'}
        </p>
        {error && (
          <button
            type="button"
            onClick={() => void load()}
            style={{
              marginTop: 10,
              font: 'inherit',
              fontSize: 13,
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--fg)',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const total = Object.values(view.counts).reduce((a, b) => a + b, 0);
  const card: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 12px',
    fontSize: 13,
  };

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {view.welcomeBack && <p style={{ ...card, margin: 0, maxWidth: 640 }}>{view.welcomeBack}</p>}

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Skill map</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px', maxWidth: 640 }}>
          “Solved on your own twice” means two separate solves with no help. Solves with help are counted
          too, separately, so you can see how your learning is going.
        </p>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: 8,
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          }}
        >
          {view.skills.map((skill) => (
            <li key={skill.skill} style={card}>
              <p style={{ margin: 0, fontWeight: 500 }}>{skill.label}</p>
              <p style={{ margin: '2px 0 0', color: 'var(--muted)' }}>
                {skill.stateLabel} · {skill.independent} on your own · {skill.assisted} with help
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Recent solves</h2>
        {total === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            A fresh start. When you solve your next lock, it will show up here.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
              {(Object.keys(view.counts) as AccomplishmentKind[])
                .filter((k) => view.counts[k] > 0)
                .map((k) => `${KIND_LABELS[k]}: ${view.counts[k]}`)
                .join(' · ')}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8, maxWidth: 760 }}>
              {view.recent.map((item) => (
                <li key={`${item.at}-${item.title}`} style={card}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--faint)',
                    }}
                  >
                    {KIND_LABELS[item.kind]} · {new Date(item.at).toLocaleDateString()}
                  </p>
                  <p style={{ margin: '2px 0 0' }}>{item.headline || item.title}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
