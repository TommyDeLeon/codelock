'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, ShieldCheck, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatDuration } from '@/lib/utils';
import { useLockSession } from '@/hooks/use-lock-session';
import { Button } from '@/components/ui/button';
import { Card, CardBody, ErrorState, Skeleton } from '@/components/ui/primitives';

/** Offered durations. Matches the spec's 30/60/90 plus a short focus block. */
const PRESETS = [15, 30, 60, 90] as const;

export function TimerCard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, secondsRemaining, expired, isLoading, unreachable, failure, refetch } =
    useLockSession();

  const timerQuery = useQuery({
    queryKey: ['settings', 'timer'],
    queryFn: () => api.settings.timer(),
  });

  const arm = useMutation({
    mutationFn: (durationMinutes: number) => api.lock.arm({ durationMinutes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lock', 'active'] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const setDefault = useMutation({
    mutationFn: (durationMinutes: number) => api.settings.updateTimer({ durationMinutes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'timer'] });
      toast.success('Default session length updated.');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardBody className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-9 w-full" />
        </CardBody>
      </Card>
    );
  }

  // An unreachable API must not render as "No active session". A user whose
  // timer is actually armed would otherwise be told they have none, and might
  // start a second one on top of it. `unreachable` covers a settled error *and*
  // a retry that query-core has paused — the latter reports no error at all,
  // which is exactly how this used to slip through. See use-lock-session.ts.
  if (unreachable) {
    return (
      <Card>
        <CardBody>
          <ErrorState
            message={`${failure?.message ?? 'Could not reach CodeLock.'} Your session, if you have one, is still running on the server.`}
            retry={() => void refetch()}
          />
        </CardBody>
      </Card>
    );
  }

  // Deadline passed. The overlay is the only way forward, so send them there
  // rather than offering a dismissible prompt.
  if (session && (expired || session.state === 'LOCKED')) {
    return (
      <Card className="border-warning">
        <CardBody className="flex flex-col items-start gap-3">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-warning">
            <TriangleAlert className="size-4" aria-hidden />
            Time is up
          </span>
          <p className="text-sm text-muted">
            Your session ended. Solve the assigned problem to unlock.
          </p>
          <Button variant="primary" size="lg" onClick={() => router.push('/lock')}>
            Open the lock screen
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (session?.state === 'ARMED') {
    const total = (timerQuery.data?.timerConfig.durationMinutes ?? 60) * 60;
    const progress = Math.min(100, Math.max(0, ((total - secondsRemaining) / total) * 100));
    const urgent = secondsRemaining <= 60;

    return (
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-muted">Session in progress</span>
            <span className="text-[13px] text-faint">
              locks at {new Date(session.fireAt).toLocaleTimeString([], { timeStyle: 'short' })}
            </span>
          </div>

          <p
            className={`tabular text-5xl font-semibold tracking-tight ${urgent ? 'text-warning' : ''}`}
            // Announce each minute, not each second — per-second updates would
            // make a screen reader unusable.
            aria-live={urgent ? 'assertive' : 'off'}
          >
            {formatDuration(secondsRemaining)}
          </p>

          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Time elapsed this session"
            className="h-1 w-full overflow-hidden rounded-xs bg-surface-2"
          >
            <div
              className={`h-full transition-[width] duration-1000 ease-linear ${urgent ? 'bg-warning' : 'bg-fg'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[13px] text-muted">
            {urgent
              ? 'Wrap up — the lock screen is about to appear.'
              : 'Keep working. CodeLock will interrupt you when the timer ends.'}
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-muted" aria-hidden />
          <span className="text-[13px] font-medium text-muted">No active session</span>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm">Start a focus block</legend>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((minutes) => (
              <Button
                key={minutes}
                variant={
                  timerQuery.data?.timerConfig.durationMinutes === minutes ? 'primary' : 'outline'
                }
                loading={arm.isPending && arm.variables === minutes}
                onClick={() => arm.mutate(minutes)}
                onDoubleClick={() => setDefault.mutate(minutes)}
                title={`Start ${minutes} minutes. Double-click to make this the default.`}
              >
                <Play aria-hidden />
                {minutes}m
              </Button>
            ))}
          </div>
        </fieldset>

        <p className="text-[13px] text-muted">
          Double-click a duration to make it your default. Current default:{' '}
          <strong className="font-medium text-fg">
            {timerQuery.data?.timerConfig.durationMinutes ?? 60} minutes
          </strong>
          .
        </p>
      </CardBody>
    </Card>
  );
}
