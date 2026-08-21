import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLockSession } from './use-lock-session';

/**
 * Regression guard for PRE-LAUNCH-CHECKLIST 3.5.
 *
 * React Query pauses a *retry* whenever `focusManager.isFocused()` is false,
 * and its default focus manager reports `document.visibilityState !== 'hidden'`.
 * A query that fails its first attempt while the tab is hidden therefore parks
 * at `status: 'pending'`, `fetchStatus: 'paused'`, `error: null`,
 * `data: undefined` — indistinguishable from "loaded fine, nothing to show"
 * unless the consumer looks at `fetchStatus`/`failureReason`.
 *
 * `networkMode: 'always'` does not help: focus is AND-ed *outside* the
 * networkMode clause in query-core's `canContinue()`.
 *
 * For a lock app this is the worst possible collapse: a hidden tab during a
 * database outage tells the user they have no session while one is running.
 */
function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
}

function serviceUnavailable() {
  return new Response(
    JSON.stringify({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'CodeLock cannot reach its database right now.',
      },
    }),
    { status: 503, headers: { 'Content-Type': 'application/json' } },
  );
}

function renderHook() {
  const seen: Array<ReturnType<typeof useLockSession>> = [];
  function Probe() {
    seen.push(useLockSession());
    return null;
  }
  const client = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 10_000, retry: 1, networkMode: 'always' },
      mutations: { networkMode: 'always' },
    },
  });
  render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { seen, last: () => seen[seen.length - 1] };
}

describe('useLockSession when the API is unreachable', () => {
  beforeEach(() => {
    window.localStorage.setItem('codelock.access', 'test-access-token');
    window.localStorage.setItem('codelock.refresh', 'test-refresh-token');
    vi.stubGlobal('fetch', vi.fn(async () => serviceUnavailable()));
  });

  afterEach(() => {
    setVisibility('visible');
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('reports the outage when the tab is visible', async () => {
    setVisibility('visible');
    const { last } = renderHook();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2500));
    });
    expect(last().unreachable).toBe(true);
    expect(last().session).toBeNull();
  });

  it('reports the outage when the tab is hidden', async () => {
    setVisibility('hidden');
    const { last } = renderHook();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 2500));
    });
    // Before the fix this was `false`: the retry paused, the hook reported
    // no error and no data, and the UI rendered "No active session".
    expect(last().unreachable).toBe(true);
    expect(last().session).toBeNull();
  });
});
