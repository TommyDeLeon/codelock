'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useLockSession } from '@/hooks/use-lock-session';
import { LockWorkspace } from '@/components/lock/lock-workspace';
import { Button } from '@/components/ui/button';
import { ErrorState, Skeleton } from '@/components/ui/primitives';
import { formatDuration } from '@/lib/utils';
import {
  engageDesktopLock,
  releaseDesktopLock,
  isDesktop,
  notifyNativeUnlocked,
} from '@/lib/desktop-bridge';

export default function LockPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, secondsRemaining, expired, isLoading, error, refetch } = useLockSession({
    pollMs: 5_000,
  });
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

  useEffect(() => {
    if (session?.state === 'ARMED' && expired && !engage.isPending) {
      engage.mutate(session.id);
    }
  }, [session, expired, engage]);

  // Hand the desktop shell the lock as soon as the server confirms it. In a
  // browser this is a no-op and the route itself is the only barrier.
  useEffect(() => {
    if (session?.state === 'LOCKED' && !unlocked) void engageDesktopLock();
  }, [session?.state, unlocked]);

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

  if (error) {
    return (
      <main id="main" className="flex h-dvh items-center justify-center p-4">
        <ErrorState message={error.message} retry={() => void refetch()} />
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
