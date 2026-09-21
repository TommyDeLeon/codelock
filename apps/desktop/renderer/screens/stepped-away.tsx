import { useEffect, useState } from 'react';
import type { Language, SessionReviewView } from '@codelock/shared';
import { api, ApiError } from '../api';

/**
 * The moment after stepping away from a session.
 *
 * The counterpart to the success moment, and it exists for the same reason:
 * the end of a session is the one time the learner is definitely paying
 * attention, so it is worth saying something true then. After a solve that is
 * "here is what you did". After stepping away it is "this is what the problem
 * wanted", because the alternative — the run log quietly recording a failure
 * and moving on — teaches nothing at all.
 *
 * The tone is deliberate. Stepping away from a hard problem is ordinary and
 * says nothing about whether someone can program; what would be costly is
 * never finding out how the problem worked. So this leads with that, then
 * hands over the editorial and a worked solution to read while the problem is
 * still fresh.
 *
 * It never scolds, never counts a streak, and closing it is one key away.
 */

/** Rotated so the same sentence does not greet every session. */
const OPENERS = [
  'You stepped away from this one. That is a normal part of learning to program.',
  'This one did not come together tonight. That happens to everyone who writes code.',
  'Stepping away is not failing. The problem was hard, and now you get to see how it works.',
  'No shame in this one. Reading a worked solution is how most people learn a new pattern.',
];

const LANGUAGE_LABELS: Record<string, string> = {
  JAVASCRIPT: 'JavaScript',
  TYPESCRIPT: 'TypeScript',
  PYTHON: 'Python',
  JAVA: 'Java',
  CPP: 'C++',
  GO: 'Go',
};

export function SteppedAwayMoment({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const [review, setReview] = useState<SessionReviewView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  // Chosen once per mount: a message that changes on every re-render reads as
  // a glitch rather than as a voice.
  const [opener] = useState(() => OPENERS[Math.floor(Math.random() * OPENERS.length)]!);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.sessionReview(sessionId), api.profile().catch(() => null)])
      .then(([data, profile]) => {
        if (cancelled) return;
        setReview(data.review);
        const available = Object.keys(data.review.referenceSolution ?? {}) as Language[];
        const preferred = profile?.profile.preferredLanguage;
        // The language they write in, when there is a solution in it; any
        // available one otherwise, so the panel is never empty for no reason.
        setLanguage(preferred && available.includes(preferred) ? preferred : (available[0] ?? null));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Could not load that session.');
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  /**
   * Escape closes it, but not the Escape that got here.
   *
   * Stepping away means holding Escape for ten seconds. The shell drops the
   * lock mid-hold and this panel opens underneath a key that is still down, so
   * a plain Escape handler dismissed it instantly — and marked it seen, which
   * is worse than not showing it at all.
   *
   * Two guards: auto-repeat never closes anything, and a short settling window
   * ignores the tail of that hold. A deliberate press a second later still
   * works, which is the behaviour anyone expects from a dialog.
   */
  useEffect(() => {
    const openedAt = Date.now();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.repeat) return;
      if (Date.now() - openedAt < 1200) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const solutions = review?.referenceSolution ?? {};
  const languages = Object.keys(solutions) as Language[];
  const code = language ? solutions[language] : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Session ended"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        overflowY: 'auto',
        padding: '28px 32px 48px',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 18 }}>
        <p className="eyebrow" style={{ margin: 0 }}>
          Stepped away
        </p>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-chip"
          style={{ marginLeft: 'auto' }}
        >
          Close
        </button>
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      {!review && !error && <p style={{ color: 'var(--faint)', fontSize: 13 }}>Loading…</p>}

      {review && (
        <>
          <h2 style={{ margin: '0 0 8px', fontSize: 19 }}>
            {review.problem?.title ?? 'That session has ended'}
          </h2>
          <p style={{ margin: '0 0 6px', fontSize: 14, maxWidth: '62ch' }}>{opener}</p>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)', maxWidth: '62ch' }}>
            Read how it works below, then try it again another evening. Understanding the pattern
            is worth more than a solve you guessed your way into.
          </p>

          <ReasonPicker sessionId={sessionId} />

          {review.editorial && (
            <section className="rule" style={{ marginTop: 24, paddingTop: 16 }}>
              <p className="eyebrow" style={{ margin: '0 0 8px' }}>
                How it works
              </p>
              <div
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  maxWidth: '72ch',
                }}
              >
                {review.editorial}
              </div>
            </section>
          )}

          {code && (
            <section className="rule" style={{ marginTop: 24, paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <p className="eyebrow" style={{ margin: 0 }}>
                  A worked solution
                </p>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      className="btn btn-chip"
                      aria-pressed={lang === language}
                      onClick={() => setLanguage(lang)}
                      style={{
                        borderColor: lang === language ? 'var(--accent)' : 'var(--border)',
                        color: lang === language ? 'var(--accent)' : 'var(--muted)',
                      }}
                    >
                      {LANGUAGE_LABELS[lang] ?? lang}
                    </button>
                  ))}
                </div>
              </div>
              <pre
                className="mono"
                style={{
                  margin: 0,
                  padding: 12,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  overflowX: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                {code}
              </pre>
            </section>
          )}

          {!review.editorial && !code && (
            <p
              className="rule"
              style={{ marginTop: 24, paddingTop: 16, fontSize: 12.5, color: 'var(--faint)' }}
            >
              No worked solution is stored for this problem yet.
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <button type="button" onClick={onClose} className="btn">
              Got it
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** The four answers, in the order someone is most likely to mean them. */
const REASONS = [
  { value: 'NO_TIME', label: 'I ran out of time' },
  { value: 'WRONG_MOMENT', label: 'Caught me mid-something' },
  { value: 'TOO_HARD', label: 'This one was too hard' },
  { value: 'NOT_TONIGHT', label: 'Not tonight' },
] as const;

/**
 * One tap, and only one.
 *
 * Stepping away is counted against the difficulty ladder the moment it
 * happens, because an exit that waits for an answer nobody has to give is a
 * free exit. This is where that count gets *withdrawn*: three of these four
 * answers describe a moment rather than a difficulty, and a device that makes
 * the next problems easier because a timer fired at a bad time has learned
 * the wrong thing.
 *
 * Nothing here blocks anything. There is no submit, no confirmation step, and
 * skipping it is the default — the panel closes on Escape like it always did,
 * and an unanswered session simply keeps the count it already had.
 */
function ReasonPicker({ sessionId }: { sessionId: string }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);

  if (chosen) {
    return (
      <p style={{ margin: '18px 0 0', fontSize: 13, color: 'var(--muted)' }} role="status">
        {outcome ?? 'Noted.'}
      </p>
    );
  }

  return (
    <section style={{ marginTop: 22 }} aria-label="What happened">
      <p style={{ margin: '0 0 8px', fontSize: 12.5, color: 'var(--faint)' }}>
        Optional — what happened? It decides whether this counts toward your level.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {REASONS.map((reason) => (
          <button
            key={reason.value}
            type="button"
            onClick={() => {
              setChosen(reason.value);
              api
                .setAbandonReason(sessionId, reason.value)
                .then((r) =>
                  setOutcome(
                    r.countedAgainstLevel
                      ? 'Noted — this one counts toward easing the level.'
                      : 'Noted — this one will not count toward your level.',
                  ),
                )
                // A reason that fails to save is not worth a word to someone
                // who has just stepped away from a problem.
                .catch(() => setOutcome('Noted.'));
            }}
            style={{
              font: 'inherit',
              fontSize: 12.5,
              padding: '7px 13px',
              cursor: 'pointer',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--muted)',
            }}
          >
            {reason.label}
          </button>
        ))}
      </div>
    </section>
  );
}
