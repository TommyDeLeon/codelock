'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { DemoGradeResult, Language } from '@codelock/shared';
import { api } from '@/lib/api';
import { failureOf } from '@/lib/query-result';
import { CodeEditor } from '@/components/lock/code-editor';
import { ProblemPanel } from '@/components/lock/problem-panel';
import { TestResults } from '@/components/lock/test-results';
import { Button } from '@/components/ui/button';
import { ErrorState, Skeleton } from '@/components/ui/primitives';
import { formatDuration } from '@/lib/utils';

/**
 * The demo.
 *
 * Same judge, same sandbox, same gate arithmetic as the installed product — and
 * no lock at all, because a browser tab cannot lock anything and pretending
 * otherwise would undermine the one thing this project is careful about.
 *
 * The editor, problem panel and results are the *same components* the real lock
 * screen uses, not copies. Two implementations of the lock UI would drift, and
 * the demo would slowly stop resembling the thing it demonstrates.
 *
 * Three phases: `idle` (arm it), `armed` (a short countdown, so the interruption
 * is felt rather than described), `fired` (the takeover). The banner is present
 * in all three.
 */

type Phase = 'idle' | 'armed' | 'fired';

/** Short on purpose. Nobody will sit through a real 25-minute block. */
const COUNTDOWN_SECONDS = 8;

export default function DemoPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);
  const [language, setLanguage] = useState<Language>('JAVASCRIPT');
  const [source, setSource] = useState('');
  const [result, setResult] = useState<DemoGradeResult | null>(null);
  const [running, setRunning] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const seededFor = useRef<Language | null>(null);

  const problemQuery = useQuery({
    queryKey: ['demo', 'problem'],
    queryFn: () => api.demo.problem(),
    staleTime: Infinity,
  });
  const problem = problemQuery.data?.problem ?? null;
  const problemFailure = problem ? null : failureOf(problemQuery);

  // Seed the editor once per language, and never overwrite work in progress —
  // clobbering a half-written answer because a query refetched is the kind of
  // small betrayal nobody forgives in an editor.
  useEffect(() => {
    if (!problem || seededFor.current === language) return;
    seededFor.current = language;
    setSource(problem.starterCode[language] ?? '');
  }, [problem, language]);

  useEffect(() => {
    if (phase !== 'armed') return;
    if (remaining <= 0) {
      setPhase('fired');
      return;
    }
    const id = window.setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, remaining]);

  const submit = useCallback(async () => {
    setRunning(true);
    setSubmitError(null);
    try {
      setResult(await api.demo.grade({ language, sourceCode: source }));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The demo judge did not respond.');
    } finally {
      setRunning(false);
    }
  }, [language, source]);

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <DemoBanner />

      {phase === 'idle' && (
        <Intro
          onArm={() => {
            setRemaining(COUNTDOWN_SECONDS);
            setPhase('armed');
          }}
        />
      )}

      {phase === 'armed' && <Countdown remaining={remaining} onSkip={() => setPhase('fired')} />}

      {phase === 'fired' && (
        <section className="flex-1">
          {problemFailure ? (
            <div className="mx-auto max-w-2xl px-5 py-20">
              <ErrorState
                message={`${problemFailure.message} The demo needs the CodeLock API to run your code.`}
                retry={() => void problemQuery.refetch()}
              />
            </div>
          ) : !problem ? (
            <div className="mx-auto max-w-6xl px-5 py-10">
              <Skeleton className="h-96" />
            </div>
          ) : (
            <div className="mx-auto grid max-w-7xl gap-px bg-rule lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
              <div className="bg-bg">
                <ProblemPanel problem={problem} />
              </div>

              <div className="flex min-h-[34rem] flex-col bg-bg">
                <div className="flex-1">
                  <CodeEditor
                    language={language}
                    value={source}
                    onChange={setSource}
                    onLanguageChange={(next) => {
                      seededFor.current = null;
                      setLanguage(next);
                      setResult(null);
                    }}
                    disabled={running}
                  />
                </div>

                <div className="rule-t flex items-center gap-3 px-4 py-3">
                  <p className="text-[13px] text-muted">
                    Two visible cases, one hidden case of 30,000 values.
                  </p>
                  <Button
                    className="ml-auto"
                    onClick={() => void submit()}
                    loading={running}
                    disabled={!source.trim()}
                  >
                    Run against the judge
                  </Button>
                </div>

                {submitError && (
                  <div className="rule-t px-4 py-3">
                    <p role="alert" className="text-[13px] text-danger">
                      {submitError}
                    </p>
                  </div>
                )}

                <div className="rule-t">
                  <TestResults result={result} running={running} />
                </div>

                {result?.accepted && <SolvedNotice />}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/**
 * Always on screen, in every phase.
 *
 * The demo must be visibly a demo. A dismissible notice would be gone by the
 * time it mattered, so this one cannot be closed.
 */
function DemoBanner() {
  return (
    <div className="rule-b sticky top-14 z-30 bg-warning-soft">
      <div className="mx-auto flex max-w-7xl flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-2 sm:px-8">
        <p className="eyebrow text-warning">Demo</p>
        <p className="text-[13px] text-fg">
          Your code really runs in the sandbox and the verdict is real. Nothing is locked, and
          solving this <strong className="font-semibold">cannot unlock anything</strong>.
        </p>
        <Link
          href="/install"
          className="ml-auto text-[13px] font-medium underline decoration-border-strong
                     underline-offset-4 hover:decoration-current"
        >
          Get the real thing →
        </Link>
      </div>
    </div>
  );
}

function Intro({ onArm }: { onArm: () => void }) {
  return (
    <section className="flex flex-1 items-center">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow">Try it</p>
            <h1 className="display display-lg mt-5">
              Arm a timer.
              <br />
              <em>See what happens</em> when it fires.
            </h1>
            <div className="prose-site measure mt-7 text-[15.5px]">
              <p>
                On a real install this would be twenty-five minutes and it would take your whole
                screen. Here it is eight seconds and it takes this page — enough to show you the
                shape of the thing.
              </p>
              <p>
                The problem you get is deliberately winnable the wrong way: the obvious nested loop
                is correct, passes every test, and will not clear the gate.
              </p>
            </div>
            <Button size="lg" className="mt-8" onClick={onArm}>
              Arm the timer
            </Button>
          </div>

          <div className="lg:col-span-5">
            <dl className="rule-t">
              {[
                [
                  'Runs your code',
                  'In the same throwaway container: no network, dropped capabilities, read-only filesystem.',
                ],
                [
                  'Times it honestly',
                  'Measured inside the container, worst case across the suite, not around the call.',
                ],
                [
                  'Unlocks nothing',
                  'There is no session and no token. The response has nowhere to put one.',
                ],
              ].map(([term, detail]) => (
                <div key={term} className="rule-b py-4">
                  <dt className="text-[14px] font-medium text-fg">{term}</dt>
                  <dd className="mt-1 text-[13.5px] leading-relaxed text-muted">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function Countdown({ remaining, onSkip }: { remaining: number; onSkip: () => void }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-24">
      <p className="eyebrow">Locks in</p>
      <p className="tabular text-7xl font-semibold tracking-tight" aria-live="polite">
        {formatDuration(remaining)}
      </p>
      <p className="measure text-center text-sm text-muted">
        Keep working. On a real install you would not be watching this — the screen would take
        itself over whatever you were doing.
      </p>
      <Button variant="outline" onClick={onSkip}>
        Skip the wait
      </Button>
    </section>
  );
}

/**
 * The moment the demo has to be most careful.
 *
 * A green "unlocked" here would be a lie, so the wording says exactly what
 * happened: the gate cleared, and nothing was unlocked, because there was never
 * a lock.
 */
function SolvedNotice() {
  return (
    <div className="rule-t bg-success-soft px-4 py-4">
      <p className="text-[14px] text-fg">
        <strong className="font-semibold">That would have unlocked a real session.</strong> Here it
        unlocks nothing — this is a browser tab, and a tab you can close was never a lock.
      </p>
      <Link
        href="/install"
        className="mt-3 inline-flex h-10 items-center rounded-md bg-fg px-4 text-[14px]
                   font-medium text-bg transition-colors hover:bg-fg/90"
      >
        Install CodeLock
      </Link>
    </div>
  );
}
