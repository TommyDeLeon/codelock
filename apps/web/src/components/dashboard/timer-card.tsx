'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, ShieldCheck, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatDuration } from '@/lib/utils';
import { useLockSession } from '@/hooks/use-lock-session';
import { scheduleDesktopLock } from '@/lib/desktop-bridge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, ErrorState, Skeleton } from '@/components/ui/primitives';

/** Offered durations. Matches the spec's 30/60/90 plus a short focus block. */
const PRESETS = [15, 30, 60, 90] as const;

export function TimerCard() {
  const [custom, setCustom] = useState('');
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

  // All three of these are only ever possible before the lock lands; the API
  // refuses a LOCKED session, so none of them can become an unlock.
  const pause = useMutation({
    mutationFn: (id: string) => api.lock.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lock', 'active'] });
      // The shell must forget the deadline too, or it would fire on time
      // regardless of the pause.
      void scheduleDesktopLock(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resume = useMutation({
    mutationFn: (id: string) => api.lock.resume(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lock', 'active'] });
      if (data.session) {
        void scheduleDesktopLock({ sessionId: data.session.id, fireAt: data.session.fireAt });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api.lock.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lock', 'active'] });
      void scheduleDesktopLock(null);
      toast.success('Timer reset.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const setDefault = useMutation({
    mutationFn: (durationMinutes: number) => api.settings.updateTimer({ durationMinutes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'timer'] });
      toast.success('Default session length updated.');
    },
  });

  // The lock is not opt-in. When the deadline passes the screen is taken over
  // without asking: a button the user has to press is one they can decline,
  // which is the whole thing the product exists to prevent. `/lock` engages the
  // desktop shell on mount, so this is the trigger for the real overlay too.
  const fired =
    session !== null && ((expired && !session.pausedAt) || session.state === 'LOCKED');
  useEffect(() => {
    if (fired) router.replace('/lock');
  }, [fired, router]);

  // Hand the deadline to the desktop shell so the lock still lands if this
  // window is closed. Cleared whenever there is no armed session to wait for.
  useEffect(() => {
    void scheduleDesktopLock(
      session?.state === 'ARMED' && !session.pausedAt
        ? { sessionId: session.id, fireAt: session.fireAt }
        : null,
    );
  }, [session?.id, session?.state, session?.fireAt, session?.pausedAt]);

  // The API caps a session at 5–600 minutes; rejecting it here as well means
  // the user finds out before a round trip rather than after one.
  const customMinutes = Number(custom);
  const validCustom =
    custom.trim() !== '' &&
    Number.isInteger(customMinutes) &&
    customMinutes >= 5 &&
    customMinutes <= 600;

  const startCustom = () => {
    if (!validCustom) return;
    arm.mutate(customMinutes);
    setCustom('');
  };

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
  if (session && ((expired && !session.pausedAt) || session.state === 'LOCKED')) {
    return (
      <Card className="border-fg">
        <CardBody className="flex flex-col items-start gap-3">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-fg">
            <TriangleAlert className="size-4" aria-hidden />
            Time is up
          </span>
          <p className="text-sm text-muted">
            Taking you to the lock screen. Solve the assigned problem to unlock.
          </p>
          {/* A fallback, not the mechanism. The redirect fires on its own; this
              is here for the moment before it lands, and for a stalled router. */}
          <Button variant="ghost" size="sm" onClick={() => router.replace('/lock')}>
            Open the lock screen
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (session?.state === 'ARMED') {
    const total = (timerQuery.data?.timerConfig.durationMinutes ?? 60) * 60;
    const progress = Math.min(100, Math.max(0, ((total - secondsRemaining) / total) * 100));
    const paused = session.pausedAt !== null;
    const urgent = !paused && secondsRemaining <= 60;

    return (
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-muted">
              {paused ? 'Paused' : 'Session in progress'}
            </span>
            <span className="text-[13px] text-faint">
              {paused
                ? 'the clock is stopped'
                : `locks at ${new Date(session.fireAt).toLocaleTimeString([], { timeStyle: 'short' })}`}
            </span>
          </div>

          <p
            className={`tabular text-5xl font-semibold tracking-tight ${urgent ? 'text-fg' : ''}`}
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
              className={`h-full transition-[width] duration-1000 ease-linear ${urgent ? 'bg-fg' : 'bg-border-strong'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[13px] text-muted">
            {paused
              ? 'Nothing will happen until you resume. Resuming gives you back exactly the time you had left.'
              : urgent
                ? 'Wrap up — the lock screen is about to appear.'
                : 'Keep working. CodeLock will interrupt you when the timer ends.'}
          </p>

          {/* Allowed right up until the lock lands, and never after. Hiding
              these would not make anyone more disciplined; it would just make
              the app feel like something done to them. */}
          <div className="flex flex-wrap gap-2">
            {paused ? (
              <Button
                variant="primary"
                size="sm"
                loading={resume.isPending}
                onClick={() => resume.mutate(session.id)}
              >
                Resume
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                loading={pause.isPending}
                onClick={() => pause.mutate(session.id)}
              >
                Pause
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              loading={cancel.isPending}
              onClick={() => cancel.mutate(session.id)}
            >
              Reset
            </Button>
          </div>
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
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label htmlFor="custom-minutes" className="text-[13px] text-muted">
              Or type any length
              <span className="ml-1 text-faint">(5–600 minutes)</span>
              <input
                id="custom-minutes"
                type="number"
                min={5}
                max={600}
                inputMode="numeric"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') startCustom();
                }}
                placeholder="45"
                className="mt-1 block h-11 w-28 rounded-sm border border-border-strong bg-surface
                           px-2.5 text-base tabular sm:h-9 sm:text-[13px]"
              />
            </label>
            <Button
              variant="outline"
              disabled={!validCustom}
              loading={arm.isPending && arm.variables === Number(custom)}
              onClick={startCustom}
            >
              Start
            </Button>
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
