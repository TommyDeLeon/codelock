'use client';

import { useEffect, useState } from 'react';
import type { ComplexityFeedback, ComplexityVerdict } from '@codelock/shared';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * How the solution scales, after a solve.
 *
 * Yours is an estimate read from the code, and the panel says so; the
 * standard comes from the problem's editorial. The standard solution sits
 * behind a disclosure, closed by default, so a learner who wants to try the
 * better approach first is not shown it before they choose to be.
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
    api.progress
      .complexity(submissionId)
      .then((r) => {
        if (!cancelled) setData(r.complexity);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load the complexity breakdown.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const headingId = `cx-${submissionId}`;
  const heading = (
    <h2 id={headingId} className="text-[13px] font-semibold">
      How your solution scales
    </h2>
  );

  if (error) {
    return (
      <section aria-labelledby={headingId} className="mt-6 rounded-sm border border-border px-4 py-3">
        {heading}
        <p role="status" className="mt-1 text-[13px] text-muted">
          {error}
        </p>
      </section>
    );
  }
  if (!data) {
    return (
      <section aria-labelledby={headingId} aria-busy className="mt-6 rounded-sm border border-border px-4 py-3">
        {heading}
        <p className="mt-1 text-[13px] text-muted">Reading your solution…</p>
      </section>
    );
  }

  const solution = data.standardSolution;
  return (
    <section aria-labelledby={headingId} className="mt-6 rounded-sm border border-border px-4 py-3">
      {heading}
      <p className="mt-1 text-[14px] leading-relaxed">{data.summary}</p>

      <table className="mt-3 w-full border-collapse text-[13px]">
        <caption className="sr-only">Your solution compared with the standard approach</caption>
        <thead>
          <tr className="text-left text-muted">
            <td className="py-1.5 pr-2" />
            <th scope="col" className="py-1.5 pr-2 font-medium">
              Yours (estimated)
            </th>
            <th scope="col" className="py-1.5 pr-2 font-medium">
              Standard
            </th>
            <th scope="col" className="py-1.5">
              <span className="sr-only">Comparison</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {(['time', 'space'] as const).map((k) => (
            <tr key={k} className="border-t border-border">
              <th scope="row" className="py-1.5 pr-2 text-left font-medium">
                {k === 'time' ? 'Time' : 'Space'}
              </th>
              <td className="py-1.5 pr-2 font-mono">{data.yours[k]}</td>
              <td className="py-1.5 pr-2 font-mono">{data.standard[k] ?? '—'}</td>
              <td className={cn('py-1.5', data.verdict[k] === 'slower' ? 'text-warning' : 'text-muted')}>
                {VERDICT_TEXT[data.verdict[k]]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <details className="mt-3 text-[13px]">
        <summary className="cursor-pointer text-muted">How the estimate was read</summary>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
          {data.yours.reasons.map((r) => (
            <li key={r}>Your code {r}.</li>
          ))}
        </ul>
        <p className="mt-1.5 text-muted">
          Estimated from the shape of your code, not measured
          {data.yours.confidence === 'low' ? ', and recursion makes this one less certain' : ''}.
        </p>
      </details>

      {solution && (
        <details className="mt-3 text-[13px]">
          <summary className="cursor-pointer font-medium">
            See the standard solution{solution.approach ? `: ${solution.approach}` : ''} (
            {LANGUAGE_NAMES[solution.language] ?? solution.language})
          </summary>
          {solution.note && <p className="mt-1.5 text-muted">{solution.note}</p>}
          <p className="mt-1.5 text-muted">Worth trying it yourself first, then comparing.</p>
          <pre
            tabIndex={0}
            aria-label="Standard solution code"
            className="mt-2 max-h-72 overflow-auto rounded-sm bg-surface-2 p-3 font-mono text-[12.5px] leading-normal"
          >
            {solution.code}
          </pre>
        </details>
      )}
    </section>
  );
}
