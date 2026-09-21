'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import stats from '@/data/corpus-stats.json';
import { readDemoSolve } from '@/lib/demo-progress';

/**
 * Beat 4: the curriculum, with nothing filled in on your behalf.
 *
 * Every number here is counted from the corpus by
 * `apps/api/scripts/corpus-stats.ts`, and CI fails if the file is stale, so the
 * map grows as problems are authored without anyone editing this component.
 *
 * The bars start empty. A visitor has solved nothing, and a map pre-filled to
 * look like progress would be the lie this section was rebuilt to avoid. The
 * one cell that can fill is the family of the demo problem, and only after the
 * visitor has cleared it themselves.
 */
export function CurriculumMap() {
  const [solved, setSolved] = useState<string | null>(null);
  useEffect(() => setSolved(readDemoSolve()), []);

  const largest = Math.max(...stats.families.map((f) => f.total), 1);

  return (
    <div className="curriculum-map">
      <div className="instrument-heading">
        <span>{stats.total.toLocaleString('en')} problems · {stats.families.length} families</span>
        <span>{solved ? 'Your progress: 1 solved' : 'Your progress: none yet'}</span>
      </div>
      <ol className="curriculum-rows">
        {stats.families.map((f, i) => {
          const mine = solved === f.family;
          return (
            <li key={f.family} className={mine ? 'is-mine' : undefined}>
              <span className="curriculum-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="curriculum-label">{f.label}</span>
              <span
                className="curriculum-bar"
                style={{ '--share': `${(f.total / largest) * 100}%` } as React.CSSProperties}
                aria-hidden
              >
                {mine && <span className="curriculum-fill" style={{ width: `${Math.max(100 / f.total, 1.5)}%` }} />}
              </span>
              <span className="curriculum-count">
                {mine ? `1 / ${f.total}` : f.total}
                {f.total === 0 && <span className="text-muted"> · coming</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="instrument-caption">
        {solved
          ? 'That one is yours: the demo problem, cleared in this browser. Everything else is still ahead.'
          : <>Counted from the corpus as it stands, and growing. Nothing is filled in until you solve something. <Link href="/demo" className="text-link">Solve the demo →</Link></>}
      </p>
    </div>
  );
}
