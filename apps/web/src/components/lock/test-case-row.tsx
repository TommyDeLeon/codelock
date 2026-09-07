'use client';

import { Check, ChevronRight, X } from 'lucide-react';
import type { GradeResult } from '@codelock/shared';
import { cn } from '@/lib/utils';

type CaseView = GradeResult['cases'][number];

/**
 * One reviewable test case.
 *
 * The rows used to be plain `<li>`s with no handler at all, so there was
 * nothing to click and nothing to reveal — the panel could say case 4 failed
 * and never what it ran. For a tool aimed at someone learning to program,
 * "wrong, work out why" is close to the least useful thing it could say.
 *
 * A real `<button>` rather than a div with a click handler: it gets Tab, Enter
 * and Space, a focus ring and the right role for free, and each of those is
 * something a hand-rolled version forgets.
 */

/**
 * Blank output is invisible inside a `<pre>`, so name it rather than show
 * nothing.
 *
 * The name has to fit the block, which is why it is a prop. An input that is
 * the empty string is a real and often decisive test case — it is exactly the
 * one that breaks `a[b]` — and labelling it "(nothing printed)" described the
 * wrong side of the case entirely.
 */
function OutputBlock({
  label,
  value,
  tone = 'neutral',
  emptyLabel = '(nothing printed)',
}: {
  label: string;
  value: string | null | undefined;
  tone?: 'neutral' | 'good' | 'bad';
  emptyLabel?: string;
}) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-mono font-medium uppercase tracking-wide text-faint">{label}</p>
      <pre
        className={cn(
          'max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-xs px-2.5 py-2 font-mono text-[12px] leading-relaxed',
          tone === 'good' && 'bg-success-soft text-success',
          tone === 'bad' && 'bg-danger-soft text-danger',
          tone === 'neutral' && 'bg-surface-2 text-muted',
        )}
      >
        {empty ? <span className="italic opacity-70">{emptyLabel}</span> : value}
      </pre>
    </div>
  );
}

/**
 * The smallest true thing that can be said about a mismatch.
 *
 * Deliberately not a diff library. The cases that actually help a beginner are
 * the boring ones — printed nothing, right answer with a stray newline, right
 * shape but a different value — and naming those beats highlighting characters.
 * Anything it cannot characterise gets no hint at all rather than a wrong one.
 */
export function describeMismatch(expected: string, actual: string | null): string | null {
  if (actual === null || actual === '') return 'Your program printed nothing at all.';
  if (expected === actual) return null;

  const e = expected.trim();
  const a = actual.trim();
  if (e === a) {
    return 'The answer is right, but the spacing around it differs — usually a stray blank line or a trailing space.';
  }
  if (e.toLowerCase() === a.toLowerCase()) {
    return `Only the capitalisation differs: expected ${e}, printed ${a}.`;
  }
  const eLines = e.split('\n');
  const aLines = a.split('\n');
  if (eLines.length !== aLines.length) {
    return `Expected ${eLines.length} line${eLines.length === 1 ? '' : 's'} of output, printed ${aLines.length}.`;
  }
  const firstDiff = eLines.findIndex((line, i) => line !== aLines[i]);
  if (eLines.length > 1 && firstDiff > 0) {
    return `The first ${firstDiff} line${firstDiff === 1 ? '' : 's'} match; line ${firstDiff + 1} differs.`;
  }
  return null;
}

export function TestCaseRow({
  testCase,
  expanded,
  onToggle,
}: {
  testCase: CaseView;
  expanded: boolean;
  onToggle: () => void;
}) {
  const panelId = `case-panel-${testCase.ordinal}`;
  const buttonId = `case-button-${testCase.ordinal}`;
  const hint =
    testCase.expectedStdout !== undefined && !testCase.passed
      ? describeMismatch(testCase.expectedStdout, testCase.actualStdout ?? null)
      : null;

  // The API sends `stdin` exactly when the case is reviewable — every sample,
  // and any hidden case that failed. Reading presence rather than re-deriving
  // the rule keeps one policy in one place.
  const revealsInput = testCase.stdin !== undefined;

  return (
    <li className="border-b border-border last:border-b-0">
      <h3 className="m-0">
        <button
          id={buttonId}
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className={cn(
            'flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px]',
            'cursor-pointer transition-colors hover:bg-surface-2',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
            expanded && 'bg-surface-2',
          )}
        >
          <ChevronRight
            aria-hidden
            className={cn(
              'size-3.5 shrink-0 text-faint transition-transform',
              expanded && 'rotate-90',
            )}
          />
          <span
            className={cn(
              'flex size-4 shrink-0 items-center justify-center rounded-xs',
              testCase.passed ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
            )}
          >
            {testCase.passed ? (
              <Check className="size-3" aria-hidden />
            ) : (
              <X className="size-3" aria-hidden />
            )}
          </span>
          <span className="text-muted">
            Case {testCase.ordinal + 1}
            {testCase.isSample ? ' (sample)' : ''}
          </span>
          {/* The status is the interesting half when a case fails, and the clock
              is the interesting half when it passes. */}
          <span className="ml-auto shrink-0 text-faint">
            {testCase.passed ? `${testCase.timeMs} ms` : testCase.status}
          </span>
        </button>
      </h3>

      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!expanded}>
        <div className="space-y-3 bg-surface px-4 pb-3 pt-1">
          <p className="text-[12px] text-muted">
            {testCase.passed ? 'Passed' : 'Failed'} · {testCase.status} · {testCase.timeMs} ms
          </p>

          {/* Three tiers, matching what the API actually sent. A sample shows
              everything; a failed hidden case shows its input and what your
              code did with it, but not the answer; a passed hidden case has
              nothing worth showing. Driven off field presence rather than a
              second copy of the policy, so the panel cannot claim to be hiding
              something the response already contains. */}
          {revealsInput ? (
            <>
              <OutputBlock label="Input" value={testCase.stdin} emptyLabel="(empty input)" />
              {testCase.expectedStdout !== undefined ? (
                <OutputBlock
                  label="Expected output"
                  value={testCase.expectedStdout}
                  tone="good"
                  emptyLabel="(expected: no output at all)"
                />
              ) : (
                <p className="text-[12px] leading-relaxed text-muted">
                  The expected output is held back until this session ends — five of them in one
                  panel would make copying them out faster than solving. You get every case in full
                  in the debrief.
                </p>
              )}
              <OutputBlock
                label="Your output"
                value={testCase.actualStdout}
                tone={testCase.passed ? 'good' : 'bad'}
              />
              {hint && <p className="text-[12px] leading-relaxed text-warning">{hint}</p>}
              {testCase.stderr && (
                <OutputBlock label="Error output" value={testCase.stderr} tone="bad" />
              )}
              {!testCase.isSample && (
                <p className="text-[12px] leading-relaxed text-faint">
                  A hidden case, shown because it failed. Working out what it should have printed is
                  the part being tested.
                </p>
              )}
            </>
          ) : (
            /* The rule said plainly rather than by omission. An empty panel
               reads as a bug; this reads as a decision. */
            <p className="text-[12px] leading-relaxed text-muted">
              A hidden test case, and your solution handled it correctly. Its input stays private
              while the lock is live — there is nothing to debug here, and the full set of cases is
              revealed in the debrief once this session ends.
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
