'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { failureOf } from '@/lib/query-result';

export type Connection =
  | { status: 'online' }
  /** The browser says there is no network at all. */
  | { status: 'offline'; message: string }
  /** The network is up but CodeLock's API is not answering, or its DB is down. */
  | { status: 'unreachable'; message: string };

/**
 * Is the API actually usable right now?
 *
 * Deliberately separate from any authenticated query: during an outage those
 * are the queries that fail, and a banner sourced from them would flicker with
 * whatever screen happens to be mounted. This polls one cheap unauthenticated
 * endpoint so every screen agrees on the answer.
 */
export function useConnection(pollMs = 20_000): Connection {
  const browserOffline = useBrowserOffline();

  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => api.health(),
    refetchInterval: pollMs,
    // The banner is the thing that explains an outage; it must not itself sit
    // in a retry backoff while the outage is happening.
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  if (browserOffline) {
    return {
      status: 'offline',
      message: 'You are offline. CodeLock cannot confirm your lock state.',
    };
  }

  const failure = failureOf(health);
  if (failure) return { status: 'unreachable', message: failure.message };

  return { status: 'online' };
}

function useBrowserOffline(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return offline;
}
