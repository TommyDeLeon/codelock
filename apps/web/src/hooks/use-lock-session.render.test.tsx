import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LockSessionView } from '@codelock/shared';
import { useLockSession } from './use-lock-session';

/**
 * What the per-second countdown actually costs the lock screen.
 *
 * PRE-LAUNCH-CHECKLIST 3.9 flagged this as NOT PROFILED. The worry is specific:
 * the countdown lives in the same component that renders the editor, and
 * nothing below it is memoised — CodeEditor rebuilds its Monaco `options`
 * object on every render, which makes @monaco-editor/react call
 * `editor.updateOptions()` again. A forced re-render of that subtree measured
 * 13.5 ms median in a real browser, so a tick landing on it every second while
 * the judge is grading would be a frame gone.
 *
 * What saves it is a bail-out rather than a design: past the deadline
 * `secondsRemaining` is pinned at 0, so `setSeconds(0)` sets state to the value
 * it already holds and React stops without re-rendering children. These tests
 * pin that down, because it is load-bearing and invisible — anyone "fixing" the
 * countdown to keep counting negative, or swapping the clamp for a signed
 * difference, turns 0 re-renders per minute into 60 with no failing test.
 */

function session(overrides: Partial<LockSessionView> = {}): LockSessionView {
  return {
    id: 'session-1',
    state: 'ARMED',
    difficulty: 'EASY',
    fireAt: new Date(Date.now() + 300_000).toISOString(),
    serverNow: new Date().toISOString(),
    secondsRemaining: 300,
    pausedAt: null,
    attempts: 0,
    problem: null,
    ...overrides,
  };
}

function respondWith(active: LockSessionView) {
  return new Response(JSON.stringify({ session: active }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Mounts the hook and counts how many times its consumer re-rendered. */
function renderCounting() {
  let renders = 0;
  function Probe() {
    renders++;
    useLockSession({ pollMs: 60_000 });
    return null;
  }
  const client = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 10_000, retry: false, networkMode: 'always' },
      mutations: { networkMode: 'always' },
    },
  });
  render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return { count: () => renders };
}

/** Five seconds of wall clock, one second at a time. */
const TICKS = 5;
async function runSeconds() {
  for (let i = 0; i < TICKS; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    });
  }
}

beforeEach(() => {
  window.localStorage.setItem('codelock.access', 'test-access-token');
  window.localStorage.setItem('codelock.refresh', 'test-refresh-token');
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('the per-second countdown', () => {
  it('does not re-render the lock screen at all once the deadline has passed', async () => {
    // LOCKED: fireAt is behind us, so every tick computes the same 0.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respondWith(
          session({
            state: 'LOCKED',
            fireAt: new Date(Date.now() - 60_000).toISOString(),
            secondsRemaining: 0,
          }),
        ),
      ),
    );

    const { count } = renderCounting();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    const settled = count();
    await runSeconds();

    // Five ticks, zero renders. This is the whole finding: the editor subtree is
    // never touched while it is on screen.
    expect(count() - settled).toBe(0);
  }, 20_000);

  it('re-renders once per second while the countdown is visibly running', async () => {
    // ARMED: the number is on screen and changing, so a render per second is
    // the point, not waste — and this branch does not render the editor.
    vi.stubGlobal('fetch', vi.fn(async () => respondWith(session())));

    const { count } = renderCounting();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    const settled = count();
    await runSeconds();

    // The control for the test above: without it, "zero renders" could mean the
    // interval never ran at all rather than that React bailed out.
    const ticks = count() - settled;
    expect(ticks).toBeGreaterThanOrEqual(TICKS - 2);
    expect(ticks).toBeLessThanOrEqual(TICKS + 2);
  }, 20_000);
});
