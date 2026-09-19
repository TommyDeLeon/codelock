import { useEffect, useState } from 'react';
import type { ComplexityFeedback, ComplexityVerdict } from '@codelock/shared';
import { api, ApiError } from './api';

/**
 * How the solution scales, after a solve.
 *
 * Yours is an estimate read from the code, and the panel says so; the
 * standard comes from the problem's editorial. The standard solution sits
 * behind a disclosure, closed by default, so a learner who wants to try the
 * better approach themselves first is not shown it before they choose to be.
 */

const VERDICT_TEXT: Record<ComplexityVerdict, string> = {
  matches: 'Same as the standard',
  slower: 'Slower than the standard',
  faster: 'Looks faster — worth double-checking',
  unknown: 'No direct comparison',
};

const LANGUAGE_NAMES: Record<string, string> = {
  JAVASCRIPT: 'JavaScript',
  TYPESCRIPT: 'TypeScript',
  PYTHON: 'Python',
  JAVA: 'Java',
  CPP: 'C++',
  GO: 'Go',
};

export function ComplexityPanel({ submissionId }: { submissionId: string }) {
  const [data, setData] = useState<ComplexityFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    api
      .complexity(submissionId)
      .then((r) => !cancelled && setData(r.complexity))
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Could not load the complexity breakdown.');
      });
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const headingId = `cx-${submissionId}`;
  const heading = (
    <h3 id={headingId} style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
      How your solution scales
    </h3>
  );

  if (error) {
    return (
      <section aria-labelledby={headingId} style={panel}>
        {heading}
        <p role="status" style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)' }}>
          {error}
        </p>
      </section>
    );
  }
  if (!data) {
    return (
      <section aria-labelledby={headingId} aria-busy style={panel}>
        {heading}
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--faint)' }}>Reading your solution…</p>
      </section>
    );
  }

  const solution = data.standardSolution;
  return (
    <section aria-labelledby={headingId} style={panel}>
      {heading}
      <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5 }}>{data.summary}</p>

      <table style={{ marginTop: 12, width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <caption style={srOnly}>Your solution compared with the standard approach</caption>
        <thead>
          <tr style={{ color: 'var(--muted)', textAlign: 'left' }}>
            <td style={cell} />
            <th scope="col" style={cell}>
              Yours (estimated)
            </th>
            <th scope="col" style={cell}>
              Standard
            </th>
            <th scope="col" style={cell}>
              <span style={srOnly}>Comparison</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {(['time', 'space'] as const).map((k) => (
            <tr key={k} style={{ borderTop: '1px solid var(--border)' }}>
              <th scope="row" style={{ ...cell, textAlign: 'left', fontWeight: 500 }}>
                {k === 'time' ? 'Time' : 'Space'}
              </th>
              <td style={cell} className="mono">
                {data.yours[k]}
              </td>
              <td style={cell} className="mono">
                {data.standard[k] ?? '—'}
              </td>
              <td style={{ ...cell, color: data.verdict[k] === 'slower' ? 'var(--warning)' : 'var(--muted)' }}>
                {VERDICT_TEXT[data.verdict[k]]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <details style={{ marginTop: 10, fontSize: 13 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--muted)' }}>How the estimate was read</summary>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
          {data.yours.reasons.map((r) => (
            <li key={r}>Your code {r}.</li>
          ))}
        </ul>
        <p style={{ margin: '6px 0 0', color: 'var(--faint)' }}>
          Estimated from the shape of your code, not measured
          {data.yours.confidence === 'low' ? ', and recursion makes this one less certain' : ''}.
        </p>
      </details>

      {solution && (
        <details style={{ marginTop: 10, fontSize: 13 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
            See the standard solution{solution.approach ? `: ${solution.approach}` : ''} (
            {LANGUAGE_NAMES[solution.language] ?? solution.language})
          </summary>
          {solution.note && <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{solution.note}</p>}
          <p style={{ margin: '6px 0 0', color: 'var(--faint)' }}>
            Worth trying it yourself first, then comparing.
          </p>
          <pre
            className="mono"
            tabIndex={0}
            aria-label="Standard solution code"
            style={{
              margin: '8px 0 0',
              padding: 12,
              maxHeight: 280,
              overflow: 'auto',
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12.5,
              lineHeight: 1.5,
              whiteSpace: 'pre',
            }}
          >
            {solution.code}
          </pre>
        </details>
      )}
    </section>
  );
}

const panel: React.CSSProperties = {
  marginTop: 20,
  padding: '14px 16px',
  textAlign: 'left',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
};

const cell: React.CSSProperties = { padding: '6px 8px 6px 0', verticalAlign: 'top' };

const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};
