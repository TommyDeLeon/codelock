import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimerCard } from './timer-card';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

/**
 * The user-visible half of PRE-LAUNCH-CHECKLIST 3.5. A user with a running
 * timer must never be told they have none — telling them that invites a second
 * session stacked on the first.
 */
function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
}

const serviceUnavailable = () =>
  new Response(
    JSON.stringify({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'CodeLock cannot reach its database right now.',
      },
    }),
    { status: 503, headers: { 'Content-Type': 'application/json' } },
  );

function renderCard() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 10_000, retry: 1, networkMode: 'always' },
      mutations: { networkMode: 'always' },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <TimerCard />
    </QueryClientProvider>,
  );
}

describe('TimerCard when the API is unreachable', () => {
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

  for (const visibility of ['visible', 'hidden'] as const) {
    it(`shows the outage instead of "No active session" (tab ${visibility})`, async () => {
      setVisibility(visibility);
      renderCard();

      await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy(), { timeout: 4000 });
      expect(screen.getByRole('alert').textContent).toContain('still running on the server');
      expect(screen.queryByText(/No active session/i)).toBeNull();
    });
  }
});
