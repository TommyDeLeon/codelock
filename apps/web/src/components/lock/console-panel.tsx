'use client';

import { Check, Play, X } from 'lucide-react';
import type { RunResult } from '@codelock/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The console: run your code and read what it printed.
 *
 * This is the half of the lock screen that was missing. Submitting was the only
 * way to execute anything, so every "what does this actually print?" cost an
 * attempt, and the attempt counter ended up measuring curiosity rather than
 * wrong answers.
 *
 * Not a shell. There is no host terminal here and there will not be one — a
 * prompt inside a lock screen is a way to close the lock screen. What runs is
 * the learner's own code, in the same sandboxed judge that grades it.
 */
export function ConsolePanel({
  result,
  running,
  stdin,
  onStdinChange,
  useCustomStdin,
  onUseCustomStdinChange,
  onRun,
}: {
  result: RunResult | null;
  running: boolean;
  stdin: string;
  onStdinChange: (value: string) => void;
  useCustomStdin: boolean;
  onUseCustomStdinChange: (value: boolean) => void;
  onRun: () => void;
}) {
  return (
    <div className="divide-y divide-border">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <Button variant="outline" size="sm" onClick={onRun} loading={running}>
          <Play aria-hidden />
          Run
        </Button>
        <span className="text-[13px] text-muted">Runs your code without using an attempt.</span>

        <label className="ml-auto flex items-center gap-2 text-[13px] text-muted">
          <input
            type="checkbox"
            checked={useCustomStdin}
            onChange={(event) => onUseCustomStdinChange(event.target.checked)}
            className="size-3.5 accent-accent"
          />
          My own input
        </label>
      </div>

      {useCustomStdin && (
        <div className="px-4 py-3">
          <label
            htmlFor="run-stdin"
            className="mb-1.5 block text-[12px] font-mono font-medium uppercase tracking-wide text-faint"
          >
            Input
          </label>
          <textarea
            id="run-stdin"
            value={stdin}
            onChange={(event) => onStdinChange(event.target.value)}
            spellCheck={false}
            rows={3}
            placeholder="Type the input your program should read."
            className="w-full resize-y rounded-xs border border-border bg-bg px-2.5 py-2 font-mono text-[12px] leading-relaxed text-fg outline-none focus-visible:border-accent"
          />
        </div>
      )}

      {running ? (
        <div role="status" className="px-4 py-6 text-center text-[13px] text-muted">
          <span
            aria-hidden
            className="mx-auto mb-2 block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          Running…
        </div>
      ) : !result ? (
        <p className="px-4 py-6 text-center text-[13px] text-muted">
          Press Run to execute your code against the sample cases. Nothing here counts against
          your attempts.
        </p>
      ) : (
        <>
          {result.compileError && (
            // Hoisted out of the cases: a compile error is a property of the
            // program, and printing the same wall of text once per case buries
            // the one line that says what is wrong.
            <pre className="max-h-40 overflow-auto bg-danger-soft px-4 py-3 font-mono text-[12px] leading-relaxed text-danger">
              {result.compileError}
            </pre>
          )}

          <ul
            role="list"
            className="max-h-80 divide-y divide-border overflow-y-auto overscroll-contain"
          >
            {result.cases.map((runCase, index) => (
              <li key={runCase.ordinal ?? `custom-${index}`} className="px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[13px] font-semibold">
                    {runCase.ordinal === null ? 'Your input' : `Case ${runCase.ordinal + 1}`}
                  </span>
                  {/* A verdict only where there is something to be right
                      about. Your own input has no expected answer, so the
                      panel shows output and stays quiet about correctness. */}
                  {runCase.matched !== null && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-[12px] font-semibold',
                        runCase.matched
                          ? 'bg-success-soft text-success'
                          : 'bg-danger-soft text-danger',
                      )}
                    >
                      {runCase.matched ? (
                        <Check className="size-3" aria-hidden />
                      ) : (
                        <X className="size-3" aria-hidden />
                      )}
                      {runCase.matched ? 'matches' : 'differs'}
                    </span>
                  )}
                  <span className="text-[12px] text-faint">{runCase.status}</span>
                  <span className="tabular ml-auto text-[12px] text-faint">
                    {runCase.timeMs} ms
                  </span>
                </div>

                <Block label="Input" value={runCase.stdin} />
                <Block label="Your output" value={runCase.stdout} empty="(printed nothing)" />
                {runCase.expectedStdout !== null && (
                  <Block label="Expected" value={runCase.expectedStdout} />
                )}
                {runCase.stderr && <Block label="Error" value={runCase.stderr} tone="danger" />}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Block({
  label,
  value,
  empty = '(empty)',
  tone,
}: {
  label: string;
  value: string | null;
  empty?: string;
  tone?: 'danger';
}) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="mb-1 text-[12px] font-mono font-medium uppercase tracking-wide text-faint">{label}</p>
      <pre
        className={cn(
          'max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xs px-2.5 py-2 font-mono text-[12px] leading-relaxed',
          tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-bg text-fg',
        )}
      >
        {value && value.length > 0 ? value : <span className="text-faint">{empty}</span>}
      </pre>
    </div>
  );
}
