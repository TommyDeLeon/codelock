'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Play } from 'lucide-react';
import { toast } from 'sonner';
import { LANGUAGES, type GradeResult, type Language, type PublicProblem, type RunResult } from '@codelock/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ErrorState, Skeleton } from '@/components/ui/primitives';
import { CodeEditor } from '@/components/lock/code-editor';
import { ConsolePanel } from '@/components/lock/console-panel';
import { HintsPanel } from '@/components/lock/hints-panel';
import { ProblemPanel } from '@/components/lock/problem-panel';
import { SuccessMoment } from '@/components/lock/success-moment';
import { TestResults } from '@/components/lock/test-results';

/**
 * Practice, with nothing locked.
 *
 * Where the optional variation and the low-energy task lead. The same editor,
 * tests and help as the lock screen, but leaving is always one click and never
 * costs anything. Help used here is recorded as help.
 */
export default function PracticePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const search = useSearchParams();
  const lowEnergy = search.get('low') === '1';

  const query = useQuery({
    queryKey: ['practice', slug],
    queryFn: () => api.progress.problem(slug),
  });

  if (query.isLoading) {
    return (
      <main id="main" className="flex min-h-dvh items-center justify-center p-4">
        <Skeleton className="h-64 w-full max-w-2xl" />
      </main>
    );
  }
  if (query.error || !query.data) {
    return (
      <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4">
        <ErrorState
          message={query.error instanceof Error ? query.error.message : 'Could not load this problem.'}
          retry={() => void query.refetch()}
        />
        <Link href="/progress" className="text-[13px] underline">
          Back to your progress
        </Link>
      </main>
    );
  }
  return <Practice key={query.data.problem.id} problem={query.data.problem} lowEnergy={lowEnergy} />;
}

function Practice({ problem, lowEnergy }: { problem: PublicProblem; lowEnergy: boolean }) {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>(
    () => LANGUAGES.find((l) => problem.starterCode[l]) ?? 'PYTHON',
  );
  const draftKey = `codelock.practice.${problem.slug}.${language}`;
  const [code, setCode] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [useCustomStdin, setUseCustomStdin] = useState(false);
  const [stdin, setStdin] = useState(() => problem.sampleCases[0]?.stdin ?? '');
  const [pane, setPane] = useState<'console' | 'results'>('console');
  const [solvedSubmissionId, setSolvedSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(draftKey);
    } catch {
      saved = null;
    }
    setCode(saved ?? problem.starterCode[language] ?? '');
  }, [draftKey, language, problem.starterCode]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, code);
      } catch {
        // A draft that cannot be saved is not worth interrupting anyone over.
      }
    }, 500);
    return () => window.clearTimeout(id);
  }, [code, draftKey]);

  const run = useMutation({
    mutationFn: () =>
      api.run({ problemId: problem.id, language, sourceCode: code, ...(useCustomStdin ? { stdin } : {}) }),
    onSuccess: (output) => {
      setRunResult(output);
      setPane('console');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submit = useMutation({
    mutationFn: () => api.submissions.create({ problemId: problem.id, language, sourceCode: code }),
    onSuccess: (grade) => {
      setResult(grade);
      setPane('results');
      if (grade.accepted) {
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          // Nothing to do.
        }
        setSolvedSubmissionId(grade.submissionId);
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const busy = run.isPending || submit.isPending;
  const doRun = useCallback(() => {
    if (!busy && code.trim()) run.mutate();
  }, [busy, code, run]);
  const doSubmit = useCallback(() => {
    if (!busy && code.trim()) {
      setSubmittedCode(code);
      submit.mutate();
    }
  }, [busy, code, submit]);

  if (solvedSubmissionId) {
    return <SuccessMoment submissionId={solvedSubmissionId} onFinish={() => router.push('/progress')} />;
  }

  const failedHidden =
    result && submittedCode === code ? result.cases.find((c) => !c.passed && !c.isSample) : undefined;

  return (
    <div className="flex min-h-dvh flex-col bg-bg lg:h-dvh">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <Link href="/progress" className="inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline">
          <ArrowLeft className="size-3.5" aria-hidden />
          Leave practice
        </Link>
        <p className="text-[13px] text-muted">Nothing is locked. Leave whenever you like.</p>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={doRun} loading={run.isPending} disabled={submit.isPending}>
            <Play aria-hidden />
            Run
          </Button>
          <Button variant="accent" onClick={doSubmit} loading={submit.isPending} disabled={run.isPending}>
            Submit
          </Button>
        </div>
      </header>

      {lowEnergy && (
        <p className="border-b border-border bg-surface-2 px-4 py-2 text-[13px]">
          One small task. When it passes, that is today done — nothing else is waiting.
        </p>
      )}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(320px,2fr)_3fr]">
        <section
          aria-label="Problem statement"
          className="min-h-0 overflow-y-auto border-b border-border lg:border-b-0 lg:border-r"
        >
          <ProblemPanel problem={problem} skillEligible={null} skillNote={null} />
          <HintsPanel
            problemId={problem.id}
            problemSlug={problem.slug}
            language={language}
            code={code}
            hiddenFailure={failedHidden ? { ordinal: failedHidden.ordinal, actualStdout: null, stderr: null } : null}
          />
        </section>

        <section aria-label="Your solution" className="flex min-h-[70dvh] flex-col lg:min-h-0">
          <div className="min-h-[18rem] flex-1">
            <CodeEditor
              language={language}
              value={code}
              onChange={setCode}
              onLanguageChange={setLanguage}
              disabled={busy}
              alwaysDark
            />
          </div>
          <div className="flex max-h-[45%] min-h-[13rem] shrink-0 flex-col overflow-hidden border-t border-border bg-surface">
            <div role="tablist" aria-label="Output" className="flex shrink-0 border-b border-border">
              {(['console', 'results'] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={pane === id}
                  onClick={() => setPane(id)}
                  className={
                    pane === id
                      ? 'border-b-2 border-fg px-4 py-2 text-[13px] font-semibold'
                      : 'border-b-2 border-transparent px-4 py-2 text-[13px] font-semibold text-muted hover:text-fg'
                  }
                >
                  {id === 'console' ? 'Console' : 'Test results'}
                </button>
              ))}
            </div>
            <div role="tabpanel" hidden={pane !== 'console'} className="min-h-0 overflow-auto">
              <ConsolePanel
                result={runResult}
                running={run.isPending}
                stdin={stdin}
                onStdinChange={setStdin}
                useCustomStdin={useCustomStdin}
                onUseCustomStdinChange={setUseCustomStdin}
                onRun={doRun}
              />
            </div>
            <div role="tabpanel" hidden={pane !== 'results'} className="min-h-0 overflow-auto">
              <TestResults result={result} running={submit.isPending} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
