'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import { LANGUAGES, type GradeResult, type Language, type LockSessionView } from '@codelock/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { CodeEditor } from './code-editor';
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
  const preferred = useAuth((s) => s.user?.preferredLanguage);

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
      window.location.href = '/';
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const runSubmit = useCallback(() => {
    if (!submit.isPending && code.trim()) submit.mutate();
  }, [submit, code]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        runSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runSubmit]);

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
          <Button variant="accent" onClick={runSubmit} loading={submit.isPending}>
            Submit
          </Button>
        </div>
      </header>

      {/* Stacks on phones, splits on desktop. The editor keeps the larger share
          because reading the statement is a one-time cost and writing is not. */}
      <div className="grid min-h-0 flex-1 grid-rows-2 lg:grid-cols-[minmax(320px,2fr)_3fr] lg:grid-rows-1">
        <section
          aria-label="Problem statement"
          className="min-h-0 border-b border-border lg:border-b-0 lg:border-r"
        >
          <ProblemPanel problem={problem} />
        </section>

        <section aria-label="Your solution" className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1">
            <CodeEditor
              language={language}
              value={code}
              onChange={setCode}
              onLanguageChange={setLanguage}
              disabled={submit.isPending}
              // The lock screen is dark regardless of the site theme, and
              // Monaco paints its own surface rather than inheriting the page's.
              alwaysDark
            />
          </div>
          <div className="max-h-[45%] shrink-0 overflow-auto border-t border-border bg-surface">
            <TestResults result={result} running={submit.isPending} />
          </div>
        </section>
      </div>
    </div>
  );
}
