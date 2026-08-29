import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { Integration, TimerConfig } from '@codelock/shared';

/**
 * The settings screen's LeetCode panel.
 *
 * The panel is a fork: stats when connected, a username form when not. A failed
 * stats fetch used to collapse into the same null as "never connected", so a
 * user whose LeetCode link was fine but whose upstream was down was shown the
 * sign-up form they had already completed — and clicking through it would
 * re-link an account that was never unlinked.
 */

const { apiMock, FakeApiError } = vi.hoisted(() => ({
  FakeApiError: class FakeApiError extends Error {},
  apiMock: {
    timer: vi.fn(),
    integrations: vi.fn(),
    leetcodeStats: vi.fn(),
    linkLeetCode: vi.fn(),
    disconnect: vi.fn(),
    saveTimer: vi.fn(),
  },
}));

vi.mock('../api', () => ({ api: apiMock, ApiError: FakeApiError }));
vi.mock('../bridge', () => ({ bridge: () => null, openExternal: vi.fn() }));

import { SettingsScreen } from './settings';

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

const LEETCODE_CONNECTED = [
  { provider: 'LEETCODE', externalUsername: 'someone', lastError: null },
] as unknown as Integration[];

beforeEach(() => {
  vi.clearAllMocks();
  apiMock.timer.mockResolvedValue({ timerConfig: TIMER });
  apiMock.integrations.mockResolvedValue({ integrations: LEETCODE_CONNECTED });
});

afterEach(() => cleanup());

describe('the LeetCode panel when the stats fetch fails', () => {
  beforeEach(() => {
    apiMock.leetcodeStats.mockRejectedValue(
      new FakeApiError('Could not reach LeetCode just now. Your account is still connected.'),
    );
  });

  it('says the fetch failed rather than offering to connect an already-connected account', async () => {
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.queryByText(/could not reach leetcode/i)).toBeTruthy());
    expect(screen.queryByLabelText(/LeetCode username/i)).toBeNull();
  });

  it('offers a retry', async () => {
    render(<SettingsScreen />);
    await waitFor(() => expect(screen.queryByText(/could not reach leetcode/i)).toBeTruthy());

    expect(screen.getByText(/try again/i)).toBeTruthy();
  });
});

describe('the LeetCode panel when nothing is connected', () => {
  it('still offers the username form', async () => {
    apiMock.integrations.mockResolvedValue({ integrations: [] });
    render(<SettingsScreen />);

    // The control for the tests above: without it, "the form is absent" could
    // pass because the form never renders under any condition.
    await waitFor(() => expect(screen.queryByLabelText(/LeetCode username/i)).toBeTruthy());
    expect(screen.queryByText(/could not reach leetcode/i)).toBeNull();
  });
});

describe('the LeetCode panel when the stats fetch succeeds', () => {
  it('shows the figures', async () => {
    apiMock.leetcodeStats.mockResolvedValue({
      stats: {
        username: 'someone',
        fetchedAt: new Date().toISOString(),
        solved: { total: 42, easy: 20, medium: 18, hard: 4 },
      },
      stale: false,
    });
    render(<SettingsScreen />);

    await waitFor(() => expect(screen.queryByText('42')).toBeTruthy());
    expect(screen.queryByText(/could not reach leetcode/i)).toBeNull();
    expect(screen.queryByLabelText(/LeetCode username/i)).toBeNull();
  });
});
