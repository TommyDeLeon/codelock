'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AccomplishmentKind, ProjectRunView } from '@codelock/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ErrorState, Skeleton } from '@/components/ui/primitives';
import { Scoreboard } from '@/components/lock/success-moment';

/**
 * What you have built and what you can do, saved.
 *
 * No streaks, no daily targets, nothing that resets for being away. Solves on
 * your own and solves with help are shown separately, because both are real and
 * they mean different things. Coming back after a gap is greeted, not counted.
 */

const KIND_LABELS: Record<AccomplishmentKind, string> = {
  independent: 'On your own',
  assisted: 'With help',
  worked_solution: 'From a worked solution',
  recall: 'Remembered after a gap',
  transfer: 'Used on a new problem',
};

const STEP_LABELS = {
  not_started: 'Not built yet',
  assisted: 'Built with help',
  independent: 'Built on your own',
} as const;

export default function ProgressPage() {
  const router = useRouter();
  const query = useQuery({ queryKey: ['progress'], queryFn: () => api.progress.view() });
  const [board, setBoard] = useState<ProjectRunView | null>(null);

  const runBoard = useMutation({
    mutationFn: () => api.progress.runProject(),
    onSuccess: setBoard,
    onError: (err: Error) => toast.error(`The scoreboard could not run: ${err.message}`),
  });

  const lowEnergy = useMutation({
    mutationFn: () => api.progress.lowEnergy(),
    onSuccess: ({ task }) => router.push(`/practice/${task.slug}?low=1`),
    onError: (err: Error) => toast.error(err.message),
  });

  if (query.isLoading) {
    return (
      <main id="main" className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }
  if (query.error || !query.data) {
    return (
      <main id="main" className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-4 px-4">
        <ErrorState
          message={query.error instanceof Error ? query.error.message : 'Could not load your progress.'}
          retry={() => void query.refetch()}
        />
        <Link href="/" className="text-[13px] underline">
          Back to CodeLock
        </Link>
      </main>
    );
  }

  const view = query.data;
  const total = Object.values(view.counts).reduce((a, b) => a + b, 0);

  return (
    <main id="main" className="mx-auto min-h-dvh max-w-3xl bg-bg px-4 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your progress</h1>
        <Link href="/" className="text-[13px] underline">
          Back to CodeLock
        </Link>
      </div>

      {view.welcomeBack && (
        <p className="mt-4 rounded-sm border border-border bg-surface-2 p-3 text-[14px]">{view.welcomeBack}</p>
      )}

      <section aria-label="A small start" className="mt-6 rounded-sm border border-border bg-surface p-4">
        <h2 className="text-[15px] font-semibold">Low on energy?</h2>
        <p className="mt-1 text-[13px] text-muted">One small task with a clear end. When it passes, you are done for today.</p>
        <Button className="mt-3" size="sm" variant="outline" onClick={() => lowEnergy.mutate()} loading={lowEnergy.isPending}>
          Give me one small task
        </Button>
      </section>

      <section aria-label="Project" className="mt-8">
        <h2 className="text-[15px] font-semibold">{view.arc.title}</h2>
        <p className="mt-1 text-[13px] text-muted">{view.arc.blurb}</p>
        <ol className="mt-3 space-y-2">
          {view.arc.steps.map((step, i) => (
            <li key={step.slug} className="flex flex-wrap items-center gap-3 rounded-sm border border-border px-3 py-2">
              <span className="tabular text-[12px] text-faint">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{step.adds}</p>
                <p className="text-[12px] text-muted">
                  {step.title} · {step.concept}
                </p>
              </div>
              <span className="text-[12px] text-muted">{STEP_LABELS[step.status]}</span>
              <Link href={`/practice/${step.slug}`} className="text-[13px] font-semibold underline">
                {step.status === 'not_started' ? 'Build it' : 'Practise again'}
              </Link>
            </li>
          ))}
        </ol>
        <Button className="mt-3" size="sm" variant="outline" onClick={() => runBoard.mutate()} loading={runBoard.isPending}>
          Run the scoreboard with your code
        </Button>
        {board && <Scoreboard board={board} animate={false} />}
      </section>

      <section aria-label="Skill map" className="mt-8">
        <h2 className="text-[15px] font-semibold">Skill map</h2>
        <p className="mt-1 text-[13px] text-muted">
          “Shown independently” means two separate solves with no help. Solves with help are counted too, just separately.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {view.skills.map((skill) => (
            <li key={skill.skill} className="rounded-sm border border-border px-3 py-2 text-[13px]">
              <p className="font-medium">{skill.label}</p>
              <p className="text-muted">
                {skill.stateLabel} · {skill.independent} on your own · {skill.assisted} with help
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Recent" className="mt-8">
        <h2 className="text-[15px] font-semibold">Recent solves</h2>
        {total === 0 ? (
          <p className="mt-2 text-[13px] text-muted">Nothing here yet. Your first solve will show up here.</p>
        ) : (
          <>
            <p className="mt-1 text-[13px] text-muted">
              {(Object.keys(view.counts) as AccomplishmentKind[])
                .filter((k) => view.counts[k] > 0)
                .map((k) => `${KIND_LABELS[k]}: ${view.counts[k]}`)
                .join(' · ')}
            </p>
            <ul className="mt-3 space-y-2">
              {view.recent.map((item) => (
                <li key={`${item.at}-${item.title}`} className="rounded-sm border border-border px-3 py-2 text-[13px]">
                  <p className="text-[11px] font-mono uppercase tracking-wide text-faint">
                    {KIND_LABELS[item.kind]} · {new Date(item.at).toLocaleDateString()}
                  </p>
                  <p className="mt-0.5">{item.headline || item.title}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
