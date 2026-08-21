'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { apiFailure, type ApiFailure } from '@codelock/shared';
import { ApiClientError } from './api';

/**
 * One shape every screen reads, with exactly three states.
 *
 * The bug this exists to make unrepresentable (PRE-LAUNCH-CHECKLIST 3.5): a
 * React Query result can sit at `status: 'pending'`, `error: null`,
 * `data: undefined`, `isLoading: false` while an outage is in progress. That
 * happens whenever a *retry* is paused, and query-core pauses retries while
 * `focusManager.isFocused()` is false — which, with the default focus manager,
 * means any time `document.visibilityState === 'hidden'`.
 *
 * Read naively, that state is identical to "the request succeeded and there is
 * nothing to show". For a lock app the difference is the whole product: one
 * means "no timer running", the other means "we have no idea whether a timer is
 * running". Destructuring a `UseQueryResult` cannot tell them apart; this can.
 */
export type QueryState<T> =
  | { phase: 'loading' }
  | { phase: 'failed'; failure: ApiFailure }
  | { phase: 'ready'; data: T };

const UNREACHABLE = (message: string): ApiFailure =>
  apiFailure(0, message, 'UNREACHABLE');

/** The failure behind a query result, if there is one — settled or in-flight. */
export function failureOf(query: {
  error: unknown;
  failureReason: unknown;
  fetchStatus: 'fetching' | 'paused' | 'idle';
}): ApiFailure | null {
  if (query.error) return asFailure(query.error);

  // A paused retry is a failure the user is entitled to see. `failureReason`
  // holds the error from the attempt that has already failed; when the pause
  // happened before any attempt ran there is none, and the honest answer is
  // still "we cannot reach the server".
  if (query.fetchStatus === 'paused') {
    return query.failureReason
      ? asFailure(query.failureReason)
      : UNREACHABLE('Waiting to reach CodeLock. Retrying as soon as it can.');
  }

  return null;
}

export function asFailure(err: unknown): ApiFailure {
  if (err instanceof ApiClientError) return err.failure;
  if (err instanceof Error) return UNREACHABLE(err.message);
  return UNREACHABLE('Could not reach CodeLock.');
}

/**
 * Collapse a React Query result into `QueryState`.
 *
 * Data already in hand wins over an in-flight failure: a background refetch
 * that fails should not blank a screen that is showing valid, recent data. The
 * caller can still surface a "reconnecting" banner from `failureOf`.
 */
export function toQueryState<T>(query: UseQueryResult<T, unknown>): QueryState<T> {
  const failure = failureOf(query);

  if (query.data !== undefined && !query.isError) {
    return { phase: 'ready', data: query.data };
  }
  if (failure) return { phase: 'failed', failure };
  if (query.data !== undefined) return { phase: 'ready', data: query.data };

  return { phase: 'loading' };
}
