import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { LockSessionView, StatsSummary, TimerConfig } from '@codelock/shared';

/**
 * The desktop dashboard's timer behaviour.
 *
 * Two things on this screen are load-bearing and neither is visual:
 *
 *   1. When the timer fires, the shell takes the screen without being asked.
 *      That is the product. A dashboard that renders "Time is up" and waits
 *      for a click has made the lock opt-in.
 *   2. A user with a running timer must never be told they have none. That is
 *      the user-visible half of PRE-LAUNCH-CHECKLIST 3.5 — being told "No
 *      active session" invites starting a second one on top of the first.
 */

const { apiMock, lock, schedule, FakeApiError } = vi.hoisted(() => ({
  // Declared inside the hoist: vi.mock factories run before the module body,
  // so anything they close over has to be created there too.
  FakeApiError: class FakeApiError extends Error {},
  apiMock: {
    stats: vi.fn(),
    activeLock: vi.fn(),
    timer: vi.fn(),
    arm: vi.fn(),
  },
  lock: vi.fn(),
  schedule: vi.fn(),
}));

vi.mock('../api', () => ({ api: apiMock, ApiError: FakeApiError }));

vi.mock('../bridge', () => ({
  bridge: () => ({ lock, schedule }),
}));

import { DashboardScreen } from './dashboard';

const STATS: StatsSummary = {
  progress: {
    currentDifficulty: 'EASY',
    consecutiveFastSolves: 0,
    consecutiveFailures: 0,
    totalSolved: 3,
    totalFailed: 1,
    emaSolveSeconds: 120,
    firstTryRate: 0.75,
    lastPromotedAt: null,
    lastDemotedAt: null,
    promoteAfterFastSolves: 3,
    demoteAfterFailures: 2,
  },
  submissions: { total: 4, accepted: 3, acceptanceRate: 75, last30DaysByStatus: {} },
  personalBests: [],
  speed: { medianRatio: null, recordsHeld: 0, sampleSize: 0 },
  locks: { recent: [], unlockedCount: 2, medianUnlockSeconds: 180 },
};

const TIMER: TimerConfig = {
  enabled: true,
  durationMinutes: 30,
  graceSeconds: 0,
  activeDaysMask: 0b1111111,
  activeFromMinute: 0,
  activeToMinute: 1440,
  dailySkipAllowance: 1,
};

function session(overrides: Partial<LockSessionView> = {}): LockSessionView {
  return {
    id: 'session-1',
    state: 'ARMED',
    difficulty: 'EASY',
    fireAt: new Date(Date.now() + 60_000).toISOString(),
    serverNow: new Date().toISOString(),
    secondsRemaining: 60,
    pausedAt: null,
    attempts: 0,
    problem: null,
    ...overrides,
  };
}

/** The server answering normally, with whatever session the case needs. */
function serverReturns(active: LockSessionView | null) {
  apiMock.stats.mockResolvedValue(STATS);
  apiMock.timer.mockResolvedValue({ timerConfig: TIMER });
  apiMock.activeLock.mockResolvedValue({ session: active });
}

beforeEach(() => {
  vi.clearAllMocks();
  lock.mockResolvedValue({ locked: true });
  schedule.mockResolvedValue({ scheduled: true });
});

afterEach(() => {
  // Explicit rather than automatic: React Testing Library only registers its
  // own afterEach cleanup when vitest runs with globals enabled, and this
  // workspace does not. Without it the previous test's DOM is still mounted
  // and every query finds two of everything.
  cleanup();
  vi.useRealTimers();
});

describe('auto-lock', () => {
  it('takes the screen when the server says the session is LOCKED', async () => {
    serverReturns(session({ state: 'LOCKED', secondsRemaining: 0 }));
    render(<DashboardScreen onSignOut={() => {}} />);

    await waitFor(() => expect(lock).toHaveBeenCalledWith('session-1'));
  });

  it('takes the screen when the countdown reaches zero', async () => {
    serverReturns(session({ state: 'ARMED', secondsRemaining: 0 }));
    render(<DashboardScreen onSignOut={() => {}} />);

    await waitFor(() => expect(lock).toHaveBeenCalledWith('session-1'));
  });

  it('does not take the screen while the countdown is still running', async () => {
    serverReturns(session({ state: 'ARMED', secondsRemaining: 60 }));
    render(<DashboardScreen onSignOut={() => {}} />);

    await screen.findByText(/locks at/i);
    expect(lock).not.toHaveBeenCalled();
  });

  /**
   * A paused countdown has no deadline. The API freezes secondsRemaining while
   * pausedAt is set and refuses to engage such a session — so the shell must
   * not pre-empt it. The local per-second countdown is the trap here: it
   * decrements between polls regardless of pause state, so a session paused
   * with a few seconds left ticks itself to zero and fires.
   */
  it('does not take the screen while the session is paused', async () => {
    // Fake timers must be installed BEFORE render. The per-second countdown is
    // a setInterval created during the first effect pass; faking the clock
    // afterwards leaves that interval on the real one, so advancing does
    // nothing and the assertion passes without the screen ever counting.
    // shouldAdvanceTime keeps waitFor's own polling alive under fake timers.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    serverReturns(
      session({ state: 'ARMED', secondsRemaining: 3, pausedAt: new Date().toISOString() }),
    );
    render(<DashboardScreen onSignOut={() => {}} />);
    await waitFor(() => expect(screen.queryByText(/paused/i)).toBeTruthy());

    // Long enough for a 3-second countdown to reach zero twice over.
    await vi.advanceTimersByTimeAsync(6_000);

    expect(lock).not.toHaveBeenCalled();
  });

  /**
   * The control for the test above: the same clock handling, without the
   * pause. If this does not fire, the test above proves nothing.
   */
  it('takes the screen when a running countdown ticks down to zero', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    serverReturns(session({ state: 'ARMED', secondsRemaining: 3 }));
    render(<DashboardScreen onSignOut={() => {}} />);
    await waitFor(() => expect(screen.queryByText(/locks at/i)).toBeTruthy());

    await vi.advanceTimersByTimeAsync(6_000);

    expect(lock).toHaveBeenCalledWith('session-1');
  });

  /**
   * The control for the test below. Without it, "schedule was not called with
   * this session" could pass simply because the effect had not run yet, which
   * is how the paused version of this assertion first fooled me.
   */
  it('hands a running session to the shell as a scheduled deadline', async () => {
    serverReturns(session({ state: 'ARMED', secondsRemaining: 300 }));
    render(<DashboardScreen onSignOut={() => {}} />);

    await screen.findByText(/locks at/i);
    await waitFor(() =>
      expect(schedule).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'session-1' })),
    );
  });

  /**
   * Worse than the renderer firing early: the shell's scheduled deadline
   * survives the window being closed to the tray, so a paused session handed
   * over here locks the machine with nothing on screen to explain why.
   */
  it('does not hand a paused session to the shell as a scheduled deadline', async () => {
    serverReturns(
      session({ state: 'ARMED', secondsRemaining: 300, pausedAt: new Date().toISOString() }),
    );
    render(<DashboardScreen onSignOut={() => {}} />);

    // Again, wait for the session to actually reach the component. The mount
    // pass always schedules null, so asserting before the fetch lands proves
    // nothing.
    await screen.findByText(/paused/i);
    // Let every pending effect settle, so this is a real absence rather than
    // an assertion that simply ran too early.
    await waitFor(() => expect(schedule).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(schedule).not.toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-1' }),
    );
  });
});

describe('when the API is unreachable', () => {
  beforeEach(() => {
    const down = new FakeApiError('CodeLock cannot reach its database right now.');
    apiMock.stats.mockRejectedValue(down);
    apiMock.activeLock.mockRejectedValue(down);
    apiMock.timer.mockRejectedValue(down);
  });

  it('shows the outage rather than "No active session"', async () => {
    render(<DashboardScreen onSignOut={() => {}} />);

    await waitFor(() =>
      expect(screen.getByText(/cannot reach its database/i)).toBeTruthy(),
    );
    // The exact wording that must never appear on a failed load: a user whose
    // timer is armed would be invited to start a second one.
    expect(screen.queryByText(/No active session/i)).toBeNull();
  });

  it('does not offer the duration presets it cannot honour', async () => {
    render(<DashboardScreen onSignOut={() => {}} />);

    await waitFor(() => expect(screen.getByText(/cannot reach its database/i)).toBeTruthy());
    expect(screen.queryByLabelText(/Start a 30 minute session/i)).toBeNull();
  });
});

describe('the paused countdown', () => {
  it('freezes rather than ticking down', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    serverReturns(
      session({ state: 'ARMED', secondsRemaining: 90, pausedAt: new Date().toISOString() }),
    );
    render(<DashboardScreen onSignOut={() => {}} />);
    await waitFor(() => expect(screen.queryByText('01:30')).toBeTruthy());

    await vi.advanceTimersByTimeAsync(5_000);

    // The server is not counting either. A number falling on screen while the
    // deadline stands still is a claim the server would contradict.
    expect(screen.queryByText('01:30')).toBeTruthy();
    expect(screen.queryByText('01:25')).toBeNull();
  });
});
