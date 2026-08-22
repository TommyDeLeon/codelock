'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useLockSession } from '@/hooks/use-lock-session';
import { LockWorkspace } from '@/components/lock/lock-workspace';
import { KillSwitchHint } from '@/components/lock/kill-switch-hint';
import { Button } from '@/components/ui/button';
import { ErrorState, Skeleton } from '@/components/ui/primitives';
import { formatDuration } from '@/lib/utils';
import {
  engageDesktopLock,
  releaseDesktopLock,
  isDesktop,
  notifyNativeUnlocked,
  onKillSwitch,
} from '@/lib/desktop-bridge';

export default function LockPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, secondsRemaining, expired, isLoading, unreachable, failure, refetch } =
    useLockSession({ pollMs: 5_000 });
  const [unlocked, setUnlocked] = useState(false);

  /**
   * Ask the server to move ARMED -> LOCKED once the deadline passes. The server
   * re-checks the deadline against its own clock and assigns the problem, so
   * calling this early achieves nothing.
   */
  const engage = useMutation({
    mutationFn: (id: string) => api.lock.engage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lock', 'active'] }),
  });

  const abandon = useMutation({
    mutationFn: (input: { id: string; reason: 'user_gave_up' | 'kill_switch' }) =>
      api.lock.abandon(input.id, input.reason),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['lock', 'active'] }),
  });

  useEffect(() => {
    if (session?.state === 'ARMED' && expired && !engage.isPending) {
      engage.mutate(session.id);
    }
  }, [session, expired, engage]);

  // Hand the desktop shell the lock as soon as the server confirms it, with
  // the session id so the shell can persist it. In a browser this is a no-op
  // and the route itself is the only barrier.
  useEffect(() => {
    if (session?.state === 'LOCKED' && !unlocked) void engageDesktopLock(session.id);
  }, [session?.state, session?.id, unlocked]);

  // The shell's hold-Escape kill switch fired. It has already dropped the
  // overlay locally; our job is to tell the server, so the session resolves as
  // abandoned — a recorded failure — rather than dangling until it is reaped.
  useEffect(() => {
    return onKillSwitch(({ sessionId }) => {
      // Recorded distinctly in the audit trail: a kill switch is a different
      // event from a user pressing 'give up' in the UI.
      if (sessionId) abandon.mutate({ id: sessionId, reason: 'kill_switch' });
      router.replace('/dashboard');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While locked, warn on navigation away. Advisory only in a browser — the
  // desktop shell is what turns this into an actual barrier.
  useEffect(() => {
    if (session?.state !== 'LOCKED' || unlocked) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [session?.state, unlocked]);

  if (isLoading) {
    return (
      <main id="main" className="flex h-dvh items-center justify-center p-4">
        <Skeleton className="h-64 w-full max-w-2xl" />
        <span className="sr-only" role="status">
          Checking lock status
        </span>
      </main>
    );
  }

  // Fail closed. An unreachable server is never evidence that nothing is
  // locked — the shell stays up and this screen says so, rather than falling
  // through to "Nothing is locked right now" and offering a way out.
  if (unreachable) {
    return (
      <main id="main" className="flex h-dvh items-center justify-center p-4">
        <ErrorState
          message={`${failure?.message ?? 'Could not reach CodeLock.'} Staying locked until it answers — retrying.`}
          retry={() => void refetch()}
        />
      </main>
    );
  }

  if (unlocked) return <UnlockedScreen onContinue={() => router.replace('/dashboard')} />;

  if (!session) {
    return (
      <main id="main" className="flex h-dvh flex-col items-center justify-center gap-4 p-4">
        <p className="text-sm text-muted">Nothing is locked right now.</p>
        <Button onClick={() => router.replace('/dashboard')}>Back to dashboard</Button>
      </main>
    );
  }

  if (session.state === 'ARMED') {
    return (
      <main id="main" className="flex h-dvh flex-col items-center justify-center gap-3 p-4">
        <p className="text-[13px] uppercase tracking-wider text-muted">Locks in</p>
        <p className="tabular text-6xl font-semibold tracking-tight">
          {formatDuration(secondsRemaining)}
        </p>
        <p className="max-w-xs text-center text-sm text-muted">
          You can keep working. This screen takes over when the timer reaches zero.
        </p>
        <Button variant="outline" onClick={() => router.replace('/dashboard')}>
          Back to dashboard
        </Button>
      </main>
    );
  }

  if (session.state === 'LOCKED' && session.problem) {
    return (
      <>
        <LockWorkspace
          session={session}
          onUnlocked={async (token) => {
            // On desktop the shell must verify the token before the overlay
            // drops. If verification fails we stay locked rather than trusting
            // this renderer's word for it.
            if (isDesktop()) {
              const released = await releaseDesktopLock(token);
              if (!released) return;
            }
            notifyNativeUnlocked();
            setUnlocked(true);
          }}
        />
        <KillSwitchHint />
      </>
    );
  }

  return <UnlockedScreen onContinue={() => router.replace('/dashboard')} />;
}

function UnlockedScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <main id="main" className="flex h-dvh flex-col items-center justify-center gap-4 p-4">
      <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
        <CircleCheck className="size-6" aria-hidden />
      </span>
      <h1 className="text-xl font-semibold tracking-tight" role="status">
        Unlocked
      </h1>
      <p className="max-w-xs text-center text-sm text-muted">
        All test cases passed. Your device is yours again.
      </p>
      <Button size="lg" onClick={onContinue} autoFocus>
        Continue
      </Button>
    </main>
  );
}
