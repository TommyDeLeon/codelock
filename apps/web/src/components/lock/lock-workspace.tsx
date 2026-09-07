'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, Play, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import {
  LANGUAGES,
  type GradeResult,
  type Language,
  type LockSessionView,
  type RunResult,
} from '@codelock/shared';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { isDesktop } from '@/lib/desktop-bridge';
import { useProfile } from '@/lib/profile-store';
import { Button } from '@/components/ui/button';
import { CodeEditor } from './code-editor';
import { ConsolePanel } from './console-panel';
import { HintsPanel } from './hints-panel';
import { ProblemPanel } from './problem-panel';
import { TestResults } from './test-results';

/**
 * The lock screen itself.
 *
 * On the web this is a full-viewport route, not a true OS lock — a browser tab
 * can always be closed. The Electron shell (apps/desktop) reuses this same
 * component inside a kiosk window where it *is* enforced. Copy is written to be
 * honest in both places.
 */
export function LockWorkspace({
  session,
  onUnlocked,
}: {
  session: LockSessionView;
  onUnlocked: (token: string) => void | Promise<void>;
}) {
  const problem = session.problem!;
  const preferred = useProfile((s) => s.profile?.preferredLanguage);

  // Open in the user's own language. The previous default took the first key of
  // starterCode, whose order is whatever the JSON happened to have — which put
  // people into Go. Fall back through the declared LANGUAGES order so the
  // choice is at least deterministic when there is no preference.
  const [language, setLanguage] = useState<Language>(
    () =>
      (preferred && problem.starterCode[preferred] ? preferred : undefined) ??
      LANGUAGES.find((l) => problem.starterCode[l]) ??
      'JAVASCRIPT',
  );
  const [code, setCode] = useState(() => problem.starterCode[language] ?? '');
  const [result, setResult] = useState<GradeResult | null>(null);

  // The console. Its input defaults to the first sample, because the first
  // thing anyone wants to try is the example they were just shown.
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [useCustomStdin, setUseCustomStdin] = useState(false);
  const [stdin, setStdin] = useState(() => problem.sampleCases[0]?.stdin ?? '');
  // Which half of the bottom pane is showing. Whichever one just produced
  // output wins, so pressing a button always shows you its answer.
  const [pane, setPane] = useState<'console' | 'results'>('console');

  // Draft survives a reload: losing 20 minutes of work to a stray refresh
  // would make the lock feel punitive rather than motivating.
  const draftKey = `codelock.draft.${session.id}.${language}`;
  useEffect(() => {
    const saved = window.localStorage.getItem(draftKey);
    setCode(saved ?? problem.starterCode[language] ?? '');
  }, [draftKey, language, problem.starterCode]);

  useEffect(() => {
    const id = window.setTimeout(() => window.localStorage.setItem(draftKey, code), 500);
    return () => window.clearTimeout(id);
  }, [code, draftKey]);

  const run = useMutation({
    mutationFn: () =>
      api.run({
        problemId: problem.id,
        lockSessionId: session.id,
        language,
        sourceCode: code,
        // Absent means "the samples". Present-and-empty is a real question, so
        // the checkbox is what decides, not whether the box has text in it.
        ...(useCustomStdin ? { stdin } : {}),
      }),
    onSuccess: (output) => {
      setRunResult(output);
      setPane('console');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submit = useMutation({
    mutationFn: () =>
      api.submissions.create({
        problemId: problem.id,
        lockSessionId: session.id,
        language,
        sourceCode: code,
      }),
    onSuccess: (grade) => {
      setResult(grade);
      setPane('results');
      if (grade.accepted && grade.unlockToken) {
        if (grade.progress?.transition === 'promoted') {
          toast.success(grade.progress.reason);
        } else if (grade.progress?.transition === 'demoted') {
          toast.info(grade.progress.reason);
        }
        // Clear the draft only once it can no longer be needed.
        window.localStorage.removeItem(draftKey);
        void onUnlocked(grade.unlockToken);
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const skip = useMutation({
    mutationFn: () => api.lock.skip(session.id),
    onSuccess: (data) => {
      toast.info(`Skipped. ${data.skipsRemaining} left today.`);
      // In the shell, this page must not decide where the window goes next.
      // Sending it to '/' here is what produced a kiosk window sitting on the
      // marketing site with the lock still up: the session was resolved on the
      // server, but the shell was never told and kept holding the screen. It
      // polls the server for exactly this, notices the session has ended, drops
      // the overlay and puts the app back — so the right move here is nothing.
      if (isDesktop()) return;
      window.location.href = '/';
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const busy = submit.isPending || run.isPending;

  const runSubmit = useCallback(() => {
    if (!busy && code.trim()) submit.mutate();
  }, [busy, submit, code]);

  const runCode = useCallback(() => {
    if (!busy && code.trim()) run.mutate();
  }, [busy, run, code]);

  /**
   * Ctrl+Enter runs; Ctrl+Shift+Enter submits.
   *
   * Ctrl+Enter used to submit, and that binding is the reflex this feature
   * exists to protect: the cheap, repeatable action deserves the cheap key, and
   * the one that spends an attempt should take a deliberate extra finger.
   */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (event.shiftKey) runSubmit();
        else runCode();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runSubmit, runCode]);

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        {/* Ink, not the accent. The accent is now the brand green, and a green
            padlock would say the opposite of what this badge means. Locked is
            deliberately hueless — the gravity comes from the absence of colour. */}
        <span className="flex size-7 items-center justify-center rounded-sm bg-fg text-bg">
          <Lock className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight">Locked</p>
          <p className="truncate text-[13px] text-muted">
            Pass every test case to get back in.
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {session.attempts > 0 && (
            <span className="tabular hidden text-[13px] text-faint sm:inline">
              {session.attempts} {session.attempts === 1 ? 'attempt' : 'attempts'}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => skip.mutate()}
            loading={skip.isPending}
            title="Uses one of your daily skips, if you have any left"
          >
            <SkipForward aria-hidden />
            Skip
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={runCode}
            loading={run.isPending}
            disabled={submit.isPending}
            title="Run your code against the samples. Ctrl+Enter. Does not use an attempt."
          >
            <Play aria-hidden />
            Run
          </Button>
          <Button
            variant="accent"
            onClick={runSubmit}
            loading={submit.isPending}
            disabled={run.isPending}
            title="Grade it for real. Ctrl+Shift+Enter. Uses an attempt."
          >
            Submit
          </Button>
        </div>
      </header>

      {/* Stacks on phones, splits on desktop. The editor keeps the larger share
          because reading the statement is a one-time cost and writing is not. */}
      <div className="grid min-h-0 flex-1 grid-rows-2 lg:grid-cols-[minmax(320px,2fr)_3fr] lg:grid-rows-1">
        {/* The statement scrolls, and the hints ride along under it rather than
            in a corner of the editor: someone reaching for a hint is reading,
            not typing, and the nudge belongs next to the thing it is about. */}
        <section
          aria-label="Problem statement"
          className="min-h-0 overflow-y-auto border-b border-border lg:border-b-0 lg:border-r"
        >
          <ProblemPanel problem={problem} />
          <HintsPanel sessionId={session.id} />
        </section>

        <section aria-label="Your solution" className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1">
            <CodeEditor
              language={language}
              value={code}
              onChange={setCode}
              onLanguageChange={setLanguage}
              disabled={busy}
              // The lock screen is dark regardless of the site theme, and
              // Monaco paints its own surface rather than inheriting the page's.
              alwaysDark
            />
          </div>
          {/* Two panes, one at a time, because they answer different questions:
              the console says what your code did, the results say whether it
              was good enough. Stacking both would halve the space each gets on
              the screen where space is already scarce. */}
          <div className="flex max-h-[45%] shrink-0 flex-col overflow-hidden border-t border-border bg-surface">
            <div role="tablist" aria-label="Output" className="flex shrink-0 border-b border-border">
              <PaneTab
                id="console"
                current={pane}
                onSelect={setPane}
                label="Console"
              />
              <PaneTab
                id="results"
                current={pane}
                onSelect={setPane}
                label="Test results"
              />
            </div>

            <div
              role="tabpanel"
              id="pane-console"
              aria-labelledby="tab-console"
              hidden={pane !== 'console'}
              className="min-h-0 overflow-auto"
            >
              <ConsolePanel
                result={runResult}
                running={run.isPending}
                stdin={stdin}
                onStdinChange={setStdin}
                useCustomStdin={useCustomStdin}
                onUseCustomStdinChange={setUseCustomStdin}
                onRun={runCode}
              />
            </div>

            <div
              role="tabpanel"
              id="pane-results"
              aria-labelledby="tab-results"
              hidden={pane !== 'results'}
              className="min-h-0 overflow-auto"
            >
              <TestResults result={result} running={submit.isPending} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/** One tab. Roving state lives in the parent; this only reports a click. */
function PaneTab({
  id,
  current,
  onSelect,
  label,
}: {
  id: 'console' | 'results';
  current: 'console' | 'results';
  onSelect: (pane: 'console' | 'results') => void;
  label: string;
}) {
  const selected = current === id;
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={selected}
      aria-controls={`pane-${id}`}
      onClick={() => onSelect(id)}
      className={cn(
        'px-4 py-2 text-[13px] font-semibold outline-none',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
        selected
          ? 'border-b-2 border-fg text-fg'
          : 'border-b-2 border-transparent text-muted hover:text-fg',
      )}
    >
      {label}
    </button>
  );
}
