'use client';

import { Gauge } from 'lucide-react';
import type { PerformanceVerdict } from '@codelock/shared';
import { cn } from '@/lib/utils';

/**
 * The speed budget, made visible.
 *
 * "Correct but still locked" is infuriating unless the user can see exactly how
 * far off they are and that the bar is reachable. So this shows the actual
 * numbers — your time, the budget, the record — rather than a verdict alone.
 */
export function SpeedGate({ verdict }: { verdict: PerformanceVerdict }) {
  // Scale the bar against the budget, capped so a 20x-slower run still renders
  // a readable (full) bar instead of overflowing the container.
  const fill = Math.min(100, (verdict.runtimeMs / verdict.gateMs) * 100);

  // Measured, shown, not enforced: a first solve under the AFTER_FIRST_SOLVE
  // setting. It is neither a pass nor a failure of the gate, and painting it
  // green would teach the wrong bar — the number is over budget, and next time
  // that will hold. So it reads in the ordinary ink, with the budget beside it.
  const waived = verdict.waived === true;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2">
        <Gauge
          className={cn(
            'size-4',
            waived ? 'text-muted' : verdict.passed ? 'text-success' : 'text-danger',
          )}
          aria-hidden
        />
        <span className="text-[13px] font-semibold">
          {waived ? 'Speed gate — not applied' : 'Speed gate'}
        </span>
        <span
          className={cn(
            'tabular ml-auto text-[13px] font-semibold',
            waived ? 'text-muted' : verdict.passed ? 'text-success' : 'text-danger',
          )}
        >
          {verdict.runtimeMs} ms / {verdict.gateMs} ms
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={Math.round(fill)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Runtime ${verdict.runtimeMs} ms against a budget of ${verdict.gateMs} ms`}
        className="relative mt-2 h-1.5 w-full overflow-hidden rounded-xs bg-surface-2"
      >
        <div
          className={cn(
            'h-full transition-[width]',
            waived ? 'bg-muted' : verdict.passed ? 'bg-success' : 'bg-danger',
          )}
          style={{ width: `${fill}%` }}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-faint">
        <span>
          best known <span className="tabular">{verdict.targetMs} ms</span>
        </span>
        <span>
          budget <span className="tabular">{verdict.gateMs} ms</span>
        </span>
      </div>

      <p className={cn('mt-2 text-[13px]', !waived && !verdict.passed ? 'text-danger' : 'text-muted')}>
        {verdict.reason}
      </p>

      {waived && (
        <p className="mt-1 text-[13px] text-muted">
          First solve of this problem, so the budget did not hold you. Meet it again and it will.
        </p>
      )}

      {!verdict.passed && (
        <p className="mt-1 text-[13px] text-muted">
          Your answer is correct — the lock stays on because it is roughly{' '}
          {/*
            Rounded here rather than trusting the caller.

            This printed `verdict.ratio` raw, which was survivable only because
            the API happened to hand back an already-rounded number. The browser
            judge computes it as a plain division, and the screen read "roughly
            40.00000002055332x slower" — sixteen significant figures in a
            sentence whose first word is "roughly".

            A component that is correct only when its data arrives pre-formatted
            is not correct. Presentation belongs to the thing presenting.
          */}
          <strong className="font-medium text-fg tabular">
            {verdict.ratio.toFixed(1)}x
          </strong>{' '}
          slower than the
          best known solution. This is usually a complexity problem, not a
          micro-optimisation one.
        </p>
      )}
    </div>
  );
}
