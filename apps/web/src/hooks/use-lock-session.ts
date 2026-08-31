'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiFailure, LockSessionView } from '@codelock/shared';
import { api } from '@/lib/api';
import { failureOf } from '@/lib/query-result';

/**
 * The client's view of the lock.
 *
 * Three rules drive the design:
 *
 * 1. The server owns the deadline. We compute a one-time offset between the
 *    server clock and this machine's clock, then render every countdown through
 *    it. Changing the system clock does not move the deadline.
 * 2. Only elapsed *wall* time counts. We tick from Date.now(), not by
 *    decrementing a counter, so a backgrounded tab that stops firing timers
 *    still shows the correct remaining time when it wakes.
 * 3. "No session" and "we could not ask" are different answers. Callers get
 *    `unreachable` and must render it as an outage; `session === null` alone
 *    means nothing until `unreachable` is false. Collapsing the two told users
 *    with a running timer that they had none (PRE-LAUNCH-CHECKLIST 3.5).
 */
export function useLockSession(options: { pollMs?: number } = {}) {
  const pollMs = options.pollMs ?? 15_000;

  const query = useQuery({
    queryKey: ['lock', 'active'],
    queryFn: () => api.lock.active(),
    refetchInterval: pollMs,
    retry: 1,
  });

  const failure: ApiFailure | null = failureOf(query);
  // Data already in hand survives a failed background refetch: blanking a
  // correct countdown because one poll failed would be its own lie.
  const session = query.data?.session ?? null;
  const clockOffsetMs = useServerClockOffset(session);
  const secondsRemaining = useCountdown(session?.fireAt ?? null, clockOffsetMs);

  return {
    session,
    secondsRemaining,
    /** True the instant the deadline passes, before the server confirms. */
    expired: session?.state === 'ARMED' && secondsRemaining === 0,
    isLoading: query.isPending && !failure,
    /**
     * We have no trustworthy answer from the server. True for a settled error,
     * an in-flight retry, and a *paused* retry — the last of which reports
     * `error: null, data: undefined, isLoading: false` and is why this hook
     * cannot just hand back `query.error`.
     */
    unreachable: failure !== null && query.data === undefined,
    failure,
    error: failure ? new Error(failure.message) : null,
    refetch: query.refetch,
  };
}

/** serverNow - clientNow, sampled once per response. */
function useServerClockOffset(session: LockSessionView | null): number {
  const [offset, setOffset] = useState(0);
  const lastSample = useRef<string | null>(null);

  useEffect(() => {
    if (!session || session.serverNow === lastSample.current) return;
    lastSample.current = session.serverNow;
    setOffset(new Date(session.serverNow).getTime() - Date.now());
  }, [session]);

  return offset;
}

function useCountdown(fireAtIso: string | null, offsetMs: number): number {
  const fireAt = useMemo(
    () => (fireAtIso ? new Date(fireAtIso).getTime() : null),
    [fireAtIso],
  );

  const compute = (): number => {
    if (fireAt === null) return 0;
    return Math.max(0, Math.round((fireAt - (Date.now() + offsetMs)) / 1000));
  };

  const [seconds, setSeconds] = useState(compute);

  useEffect(() => {
    setSeconds(compute());
    if (fireAt === null) return;

    const id = window.setInterval(() => setSeconds(compute()), 1000);
    // A hidden tab may throttle to once per minute; recompute the moment it
    // becomes visible so the number is never stale on screen.
    const onVisible = () => setSeconds(compute());
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireAt, offsetMs]);

  return seconds;
}
