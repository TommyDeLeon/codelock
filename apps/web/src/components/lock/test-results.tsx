'use client';

import { Check, X } from 'lucide-react';
import { STATUS_LABELS, type DemoGradeResult, type GradeResult } from '@codelock/shared';
import { SpeedGate } from './speed-gate';
import { cn } from '@/lib/utils';

/**
 * Verdict panel.
 *
 * Hidden cases show pass/fail and nothing else — revealing their inputs would
 * let a user hard-code answers instead of solving the problem.
 */
/**
 * Accepts either a real verdict or a demo one.
 *
 * Widened rather than duplicated: the brief for the demo was that it must not
 * become a second implementation of the lock UI that can drift from the real
 * one. Everything this component reads is common to both shapes, and
 * DemoGradeResult deliberately omits the unlock token, so nothing here can
 * render one by accident.
 */
export function TestResults({
  result,
  running,
}: {
  result: GradeResult | DemoGradeResult | null;
  running: boolean;
}) {
  if (running) {
    return (
      <div role="status" className="px-4 py-6 text-center text-[13px] text-muted">
        <span
          aria-hidden
          className="mx-auto mb-2 block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
        Running your code against the test cases…
      </div>
    );
  }

  if (!result) {
    return (
      <p className="px-4 py-6 text-center text-[13px] text-muted">
        Submit to see how your solution does against the hidden tests.
      </p>
    );
  }

  const failed = result.totalCount - result.passedCount;
  // Correct-but-slow is its own state: green tests, red gate, still locked.
  const tone = result.accepted ? 'success' : 'danger';

  return (
    <div className="divide-y divide-border">
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xs px-2 py-1 text-[13px] font-semibold',
            tone === 'success' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
          )}
        >
          {result.accepted ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
          {STATUS_LABELS[result.status]}
        </span>
        <span className="tabular text-[13px] text-muted">
          {result.passedCount}/{result.totalCount} passed
        </span>
        {result.runtimeMs !== null && (
          <span className="tabular ml-auto text-[13px] text-faint">{result.runtimeMs} ms</span>
        )}
      </div>

      {result.performance && <SpeedGate verdict={result.performance} />}

      {result.message && (
        <pre className="max-h-32 overflow-auto bg-danger-soft px-4 py-3 font-mono text-[12px] leading-relaxed text-danger">
          {result.message}
        </pre>
      )}

      <ul role="list" className="max-h-44 overflow-auto">
        {result.cases.map((testCase) => (
          <li
            key={testCase.ordinal}
            className="flex items-center gap-2.5 px-4 py-2 text-[13px]"
          >
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-xs',
                testCase.passed ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
              )}
            >
              {testCase.passed ? <Check className="size-3" aria-hidden /> : <X className="size-3" aria-hidden />}
            </span>
            <span className="text-muted">
              Case {testCase.ordinal + 1}
              {testCase.isSample ? ' (sample)' : ''}
            </span>
            <span className="ml-auto text-faint">
              {testCase.passed ? `${testCase.timeMs} ms` : testCase.status}
            </span>
          </li>
        ))}
      </ul>

      {/* One live region, announced once, rather than a stream of per-case noise. */}
      <p className="sr-only" role="status">
        {result.accepted
          ? 'All tests passed and the solution is fast enough. Unlocking.'
          : result.correct
            ? `All tests passed, but the runtime of ${result.performance?.runtimeMs} ` +
              `milliseconds exceeds the budget of ${result.performance?.gateMs}. Still locked.`
            : `${failed} of ${result.totalCount} tests failed. ${STATUS_LABELS[result.status]}.`}
      </p>
    </div>
  );
}
