import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    pause: vi.fn(),
    resume: vi.fn(),
    cancel: vi.fn(),
    sessionReview: vi.fn(),
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
  autoRearm: false,
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
    render(<DashboardScreen />);

    await waitFor(() => expect(lock).toHaveBeenCalledWith('session-1'));
  });

  it('takes the screen when the countdown reaches zero', async () => {
    serverReturns(session({ state: 'ARMED', secondsRemaining: 0 }));
    render(<DashboardScreen />);

    await waitFor(() => expect(lock).toHaveBeenCalledWith('session-1'));
  });

  it('does not take the screen while the countdown is still running', async () => {
    serverReturns(session({ state: 'ARMED', secondsRemaining: 60 }));
    render(<DashboardScreen />);

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
    render(<DashboardScreen />);
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
    render(<DashboardScreen />);
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
    render(<DashboardScreen />);

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
    render(<DashboardScreen />);

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
    render(<DashboardScreen />);

    await waitFor(() =>
      expect(screen.getByText(/cannot reach its database/i)).toBeTruthy(),
    );
    // The exact wording that must never appear on a failed load: a user whose
    // timer is armed would be invited to start a second one.
    expect(screen.queryByText(/No active session/i)).toBeNull();
  });

  it('does not offer the duration presets it cannot honour', async () => {
    render(<DashboardScreen />);

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
    render(<DashboardScreen />);
    await waitFor(() => expect(screen.queryByText('01:30')).toBeTruthy());

    await vi.advanceTimersByTimeAsync(5_000);

    // The server is not counting either. A number falling on screen while the
    // deadline stands still is a claim the server would contradict.
    expect(screen.queryByText('01:30')).toBeTruthy();
    expect(screen.queryByText('01:25')).toBeNull();
  });
});

/**
 * Pausing and resetting.
 *
 * The API has had all three endpoints the whole time; the dashboard rendered a
 * paused countdown and then told you to go and resume it somewhere else. These
 * cover the wiring, and the one rule that matters: the controls exist only
 * before the lock lands.
 */
describe('holding and stopping the timer', () => {
  it('pauses a running timer and shows the session as held', async () => {
    serverReturns(session());
    apiMock.pause.mockResolvedValue({ session: session({ pausedAt: new Date().toISOString() }) });
    render(<DashboardScreen />);

    fireEvent.click(await screen.findByRole('button', { name: 'Pause' }));

    await waitFor(() => expect(apiMock.pause).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('button', { name: 'Resume' })).toBeTruthy();
  });

  /**
   * Resume moves `fireAt` forward by the paused interval, so the whole session
   * is taken from the response. Patching `pausedAt` alone would leave the
   * deadline where it was and quietly steal the paused time.
   */
  it('takes the new deadline from the resume response', async () => {
    serverReturns(session({ pausedAt: new Date().toISOString(), secondsRemaining: 60 }));
    apiMock.resume.mockResolvedValue({
      session: session({ pausedAt: null, secondsRemaining: 90 }),
    });
    render(<DashboardScreen />);

    fireEvent.click(await screen.findByRole('button', { name: 'Resume' }));

    await waitFor(() => expect(apiMock.resume).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('01:30')).toBeTruthy();
  });

  it('asks before resetting, and does nothing until confirmed', async () => {
    serverReturns(session());
    render(<DashboardScreen />);

    fireEvent.click(await screen.findByRole('button', { name: 'Reset' }));

    expect(await screen.findByRole('button', { name: /sure/i })).toBeTruthy();
    expect(apiMock.cancel).not.toHaveBeenCalled();
  });

  it('backs out of a reset without touching the session', async () => {
    serverReturns(session());
    render(<DashboardScreen />);

    fireEvent.click(await screen.findByRole('button', { name: 'Reset' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Keep it' }));

    expect(await screen.findByRole('button', { name: 'Reset' })).toBeTruthy();
    expect(apiMock.cancel).not.toHaveBeenCalled();
  });

  it('cancels the session once confirmed', async () => {
    serverReturns(session());
    apiMock.cancel.mockImplementation(async () => {
      // The reset re-reads the dashboard afterwards, so the server has to stop
      // handing the cancelled session back or the screen would rebuild it.
      apiMock.activeLock.mockResolvedValue({ session: null });
      return { session: { id: 'session-1', state: 'ABANDONED' } };
    });
    render(<DashboardScreen />);

    fireEvent.click(await screen.findByRole('button', { name: 'Reset' }));
    fireEvent.click(await screen.findByRole('button', { name: /sure/i }));

    await waitFor(() => expect(apiMock.cancel).toHaveBeenCalledTimes(1));
    // Back to the starting state, offering the presets again.
    expect(await screen.findByRole('button', { name: /Start a 60 minute session/ })).toBeTruthy();
  });

  /**
   * The rule the server enforces, mirrored so the buttons are not offered at
   * all. Pausing a lock that has already landed would be an unlock with extra
   * steps, and a button that can only fail reads as the lock being negotiable.
   */
  it('offers neither control once the lock has landed', async () => {
    serverReturns(session({ state: 'LOCKED' }));
    render(<DashboardScreen />);

    await waitFor(() => expect(apiMock.activeLock).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
  });
});

/**
 * Reading a past session back.
 *
 * The run log could say "abandoned" and stop there, which tells you the night
 * went badly and nothing about why. These cover the row being openable at all,
 * and the one thing the panel must get right: it prints what the server sent,
 * including the note explaining what the server refused to send.
 */
describe('opening a session from the run log', () => {
  const EDITORIAL = 'Use a sliding window.';

  function reviewReturns(overrides: Record<string, unknown> = {}) {
    apiMock.sessionReview.mockResolvedValue({
      review: {
        session: {
          id: 'past-1',
          state: 'ABANDONED',
          difficulty: 'EASY',
          armedAt: '2026-09-07T20:00:00.000Z',
          lockedAt: '2026-09-07T20:30:00.000Z',
          resolvedAt: '2026-09-07T20:52:00.000Z',
          attempts: 3,
          escapeReason: null,
        },
        resolved: true,
        problem: {
          slug: 'p',
          title: 'Longest Unique Substring',
          difficulty: 'EASY',
          tier: null,
          patternFamily: null,
          patternTags: [],
        },
        editorial: EDITORIAL,
        steps: [
          {
            at: '2026-09-07T20:31:00.000Z',
            kind: 'ATTEMPT_FAILED',
            attempt: 1,
            language: 'PYTHON',
            elapsedSeconds: 60,
            sourceCode: 'print(0)',
            verdict: 'WRONG_ANSWER',
            passedCount: 2,
            totalCount: 5,
            hiddenFailures: 2,
            failedSamples: [{ ordinal: 0, stdin: 'abc', expected: '3', actual: '1' }],
          },
        ],
        partial: false,
        withheld: [],
        ...overrides,
      },
    });
  }

  /** A run log with one past session in it. */
  function withHistory() {
    apiMock.stats.mockResolvedValue({
      ...STATS,
      locks: {
        ...STATS.locks,
        recent: [
          {
            id: 'past-1',
            state: 'ABANDONED',
            difficulty: 'EASY',
            lockedAt: '2026-09-07T20:30:00.000Z',
            resolvedAt: '2026-09-07T20:52:00.000Z',
            attempts: 3,
            problem: { slug: 'p', title: 'Longest Unique Substring' },
          },
        ],
      },
    });
    apiMock.timer.mockResolvedValue({ timerConfig: TIMER });
    apiMock.activeLock.mockResolvedValue({ session: null });
  }

  it('opens the session behind a run-log row', async () => {
    withHistory();
    reviewReturns();
    render(<DashboardScreen />);

    fireEvent.click(await screen.findByRole('button', { name: /Review the session/ }));

    await waitFor(() => expect(apiMock.sessionReview).toHaveBeenCalledWith('past-1'));
    expect(await screen.findByRole('dialog', { name: 'Session review' })).toBeTruthy();
    expect(screen.getByText(/WRONG_ANSWER/)).toBeTruthy();
  });

  it('shows the failing sample and the code that produced it', async () => {
    withHistory();
    reviewReturns();
    render(<DashboardScreen />);

    fireEvent.click(await screen.findByRole('button', { name: /Review the session/ }));

    expect(await screen.findByText(/expected: 3/)).toBeTruthy();
    expect(screen.getByText('print(0)')).toBeTruthy();
    // A count, never the hidden cases themselves.
    expect(screen.getByText(/Plus 2 hidden cases failing/)).toBeTruthy();
  });

  /**
   * The privacy rule, from the client's side. The server decides; the panel's
   * job is to print the explanation rather than leave a gap that reads as a
   * missing feature.
   */
  it('prints the withholding note instead of the editorial for a live session', async () => {
    withHistory();
    reviewReturns({
      resolved: false,
      editorial: null,
      withheld: ['The editorial is hidden until this session ends.'],
    });
    render(<DashboardScreen />);

    fireEvent.click(await screen.findByRole('button', { name: /Review the session/ }));

    expect(await screen.findByText(/editorial is hidden until this session ends/i)).toBeTruthy();
    expect(screen.queryByText(EDITORIAL)).toBeNull();
  });

  it('closes again and puts the dashboard back', async () => {
    withHistory();
    reviewReturns();
    render(<DashboardScreen />);

    fireEvent.click(await screen.findByRole('button', { name: /Review the session/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
