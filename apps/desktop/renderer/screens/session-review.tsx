import { useEffect, useState } from 'react';
import type { SessionReviewStep, SessionReviewView } from '@codelock/shared';
import { api, ApiError } from '../api';

/**
 * One session, read back.
 *
 * The dashboard's run log could say "abandoned" and nothing more, which is the
 * least useful true statement available: you know the night went badly and
 * nothing about why. This opens the same row into what actually happened —
 * armed, engaged, each attempt with the judge's verdict and the code you sent,
 * hints spent, how it ended.
 *
 * It renders whatever the server sent and does not second-guess it. When a
 * session is still running the server withholds the editorial and says so in
 * `withheld`; this prints that note where the editorial would have been, rather
 * than leaving a gap that reads as a bug.
 */

/** What each kind is called in a sentence, rather than in the database. */
const STEP_LABELS: Record<string, string> = {
  TIMER_ARMED: 'Timer armed',
  LOCK_ENGAGED: 'Lock engaged',
  PROBLEM_SERVED: 'Problem served',
  ATTEMPT_FAILED: 'Attempt failed',
  ATTEMPT_PASSED: 'Attempt passed',
  HINT_REVEALED: 'Hint used',
  DEBRIEF_OPENED: 'Debrief opened',
  LOCK_BYPASSED: 'Skipped',
  DIFFICULTY_CHANGED: 'Difficulty changed',
};

const OUTCOMES: Record<string, string> = {
  UNLOCKED: 'cleared',
  BYPASSED: 'skipped',
  ABANDONED: 'abandoned',
  LOCKED: 'in progress',
  ARMED: 'counting down',
};

export function SessionReviewPanel({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const [review, setReview] = useState<SessionReviewView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .sessionReview(sessionId)
      .then((data) => {
        if (!cancelled) setReview(data.review);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Could not load that session.');
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Escape closes it. A panel that covers the dashboard and can only be
  // dismissed by finding the right button is a panel people stop opening.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const s = review?.session;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Session review"
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
          Session review
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

      {review && s && (
        <>
          <h2 style={{ margin: '0 0 4px', fontSize: 19 }}>
            {review.problem?.title ?? 'No problem was served'}
          </h2>
          <p className="mono" style={{ margin: 0, fontSize: 12, color: 'var(--faint)' }}>
            {new Date(s.armedAt).toLocaleString()} · {OUTCOMES[s.state] ?? s.state.toLowerCase()}
            {s.escapeReason ? ` (${s.escapeReason})` : ''} · {s.difficulty.toLowerCase()} ·{' '}
            {s.attempts} attempt{s.attempts === 1 ? '' : 's'}
          </p>

          {review.partial && (
            <p style={{ marginTop: 16, fontSize: 12.5, color: 'var(--faint)' }}>
              No step-by-step record for this session. It ran before the log started tying steps
              to sessions, so only the summary above is known.
            </p>
          )}

          {review.steps.length > 0 && (
            <ol style={{ listStyle: 'none', margin: '20px 0 0', padding: 0 }}>
              {review.steps.map((step, index) => (
                <Step key={`${step.at}-${index}`} step={step} />
              ))}
            </ol>
          )}

          {/* Where the editorial would be. Saying why it is absent is the
              difference between a rule and a missing feature. */}
          {review.withheld.map((note) => (
            <p
              key={note}
              className="rule"
              style={{ marginTop: 24, paddingTop: 16, fontSize: 12.5, color: 'var(--faint)' }}
            >
              {note}
            </p>
          ))}

          {review.editorial && (
            <section className="rule" style={{ marginTop: 24, paddingTop: 16 }}>
              <p className="eyebrow">The editorial</p>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--muted)',
                  margin: '8px 0 0',
                  fontFamily: 'inherit',
                }}
              >
                {review.editorial}
              </pre>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Step({ step }: { step: SessionReviewStep }) {
  return (
    <li className="rule" style={{ padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, fontSize: 13 }}>
        <span className="mono" style={{ color: 'var(--faint)', width: 88 }}>
          {new Date(step.at).toLocaleTimeString()}
        </span>
        <span style={{ fontWeight: 600 }}>{STEP_LABELS[step.kind] ?? step.kind}</span>
        {step.verdict && (
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            {step.verdict} · {step.passedCount ?? '?'}/{step.totalCount ?? '?'} passed
          </span>
        )}
        {step.runtimeMs != null && (
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            {step.runtimeMs} ms
          </span>
        )}
        {step.hintIndex != null && (
          <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            hint {step.hintIndex + 1} of 3
          </span>
        )}
        {step.elapsedSeconds != null && (
          <span
            className="mono"
            style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--faint)' }}
          >
            {step.elapsedSeconds}s in
          </span>
        )}
      </div>

      {step.failedSamples?.map((sample, i) => (
        <pre
          key={i}
          className="mono"
          style={{
            margin: '8px 0 0',
            padding: '8px 10px',
            fontSize: 11.5,
            lineHeight: 1.6,
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-xs)',
            overflowX: 'auto',
          }}
        >
          {`input:    ${sample.stdin ?? ''}\nexpected: ${sample.expected ?? ''}\nactual:   ${sample.actual ?? '(no output)'}`}
        </pre>
      ))}

      {/* A count, never the cases themselves. Hidden inputs stay hidden here
          even after the session ends: the debrief is where those belong. */}
      {step.hiddenFailures ? (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--faint)' }}>
          Plus {step.hiddenFailures} hidden case{step.hiddenFailures === 1 ? '' : 's'} failing.
        </p>
      ) : null}

      {step.sourceCode && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12.5, color: 'var(--muted)' }}>
            What you submitted
          </summary>
          <pre
            className="mono"
            style={{
              margin: '8px 0 0',
              padding: '10px 12px',
              fontSize: 11.5,
              lineHeight: 1.6,
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius-xs)',
              overflowX: 'auto',
            }}
          >
            {step.sourceCode}
          </pre>
        </details>
      )}
    </li>
  );
}
