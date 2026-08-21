'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { failureOf } from '@/lib/query-result';
import { AppHeader } from '@/components/app-header';
import { SiteFooter } from '@/components/site-footer';
import { TimerCard } from '@/components/dashboard/timer-card';
import { ProgressCard } from '@/components/dashboard/progress-card';
import { SessionHistory } from '@/components/dashboard/session-history';
import { Card, CardBody, ErrorState, Skeleton } from '@/components/ui/primitives';
import { formatCompact } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);

  useEffect(() => {
    if (status === 'anonymous') router.replace('/login');
  }, [status, router]);

  const stats = useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: () => api.stats.summary(),
    enabled: status === 'authenticated',
  });

  // Not `stats.isError`: a paused retry carries a failure with no error set,
  // and reading only `isError` leaves the page on skeletons through an outage.
  const statsFailure = stats.data ? null : failureOf(stats);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main id="main" className="mx-auto max-w-5xl px-4 py-7">
        <h1 className="text-xl font-semibold tracking-tight">
          {user ? `Afternoon, ${user.displayName.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Start a block, work, then earn your way back in.
        </p>

        {statsFailure ? (
          <Card className="mt-6">
            <CardBody>
              <ErrorState message={statsFailure.message} retry={() => void stats.refetch()} />
            </CardBody>
          </Card>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {/* Timer leads: it is the only thing most visits are here to do. */}
            <div className="lg:col-span-2">
              <TimerCard />
            </div>

            <div className="lg:row-span-2">
              {stats.isLoading || !stats.data ? (
                <Skeleton className="h-64" />
              ) : (
                <ProgressCard progress={stats.data.progress} />
              )}
            </div>

            <div className="lg:col-span-2">
              {stats.isLoading || !stats.data ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Stat
                    label="Problems solved"
                    value={String(stats.data.progress.totalSolved)}
                    detail={`${stats.data.submissions.acceptanceRate}% of submissions accepted`}
                  />
                  <Stat
                    label="Locks cleared"
                    value={String(stats.data.locks.unlockedCount)}
                    detail="in the last 30 sessions"
                  />
                  <Stat
                    label="Median unlock"
                    value={formatCompact(stats.data.locks.medianUnlockSeconds)}
                    detail="from lock to solved"
                  />
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              {stats.isLoading || !stats.data ? (
                <Skeleton className="h-72" />
              ) : (
                <SessionHistory sessions={stats.data.locks.recent} />
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-[13px] text-muted">{label}</p>
        <p className="tabular mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-[13px] text-faint">{detail}</p>
      </CardBody>
    </Card>
  );
}
