import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

/**
 * The desktop sign-in screen's provider poll.
 *
 * OAuth cannot happen inside this window — an application drawing its own
 * address bar is indistinguishable from one drawing a fake, so the shell hands
 * the user to a real browser and then waits. Waiting is the risk: the handoff
 * expires server-side after two minutes, and a poll that outlives it spins on a
 * window the user quietly closed, forever, with the UI still saying "waiting
 * for your browser".
 */

const { apiMock, openExternal, signedIn } = vi.hoisted(() => ({
  apiMock: {
    oauthProviders: vi.fn(),
    oauthStart: vi.fn(),
    oauthClaim: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  },
  openExternal: vi.fn(),
  signedIn: { value: false },
}));

vi.mock('./api', () => ({
  api: apiMock,
  ApiError: class ApiError extends Error {},
  isSignedIn: () => signedIn.value,
  signOut: vi.fn(),
}));

vi.mock('./bridge', () => ({ openExternal, bridge: () => null }));

import { App } from './app';

beforeEach(() => {
  vi.clearAllMocks();
  signedIn.value = false;
  apiMock.oauthProviders.mockResolvedValue({ providers: ['GITHUB'] });
  apiMock.oauthStart.mockResolvedValue({
    url: 'https://github.com/login/oauth/authorize?x=1',
    handoff: 'handoff-token',
  });
  // The browser half never finishes: every claim comes back empty.
  apiMock.oauthClaim.mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('the OAuth poll', () => {
  it('gives up at the two-minute deadline instead of polling forever', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);

    const button = await screen.findByRole('button', { name: /continue with github/i });
    button.click();

    await waitFor(() => expect(openExternal).toHaveBeenCalledWith(expect.stringContaining('github.com')));

    // Just short of the deadline: still waiting, still polling.
    await vi.advanceTimersByTimeAsync(110_000);
    expect(screen.queryByText(/timed out/i)).toBeNull();
    const callsBeforeDeadline = apiMock.oauthClaim.mock.calls.length;
    expect(callsBeforeDeadline).toBeGreaterThan(1);

    // Past it: the loop must stop and say so.
    await vi.advanceTimersByTimeAsync(30_000);
    await waitFor(() => expect(screen.queryByText(/timed out/i)).toBeTruthy());

    // And stay stopped. A poll that keeps running after the message is the
    // same leak, just harder to notice.
    const callsAtDeadline = apiMock.oauthClaim.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(apiMock.oauthClaim.mock.calls.length).toBe(callsAtDeadline);
  });

  /**
   * Closing the browser tab tells this process nothing — there is no event for
   * "the user gave up". Without Cancel the screen sits on "Finish signing in"
   * for the full two minutes and reads as frozen, which is exactly how it
   * looked in practice.
   */
  it('stops polling immediately when the sign-in is cancelled', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);

    const button = await screen.findByRole('button', { name: /continue with github/i });
    button.click();
    await waitFor(() => expect(openExternal).toHaveBeenCalled());

    await vi.advanceTimersByTimeAsync(6_000);
    expect(apiMock.oauthClaim.mock.calls.length).toBeGreaterThan(0);

    screen.getByRole('button', { name: /cancel/i }).click();
    await vi.advanceTimersByTimeAsync(4_000);
    const callsAtCancel = apiMock.oauthClaim.mock.calls.length;

    // Polling stops, and well before the deadline.
    await vi.advanceTimersByTimeAsync(120_000);
    expect(apiMock.oauthClaim.mock.calls.length).toBe(callsAtCancel);

    // Cancelling is a choice, not a failure: no error is shown for it.
    expect(screen.queryByText(/timed out/i)).toBeNull();

    // And the buttons come back rather than staying disabled forever.
    await waitFor(() => {
      const retry = screen.getByRole('button', {
        name: /continue with github/i,
      }) as HTMLButtonElement;
      expect(retry.disabled).toBe(false);
    });
  });

  it('stops polling the moment the session is claimed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    apiMock.oauthClaim
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ user: { id: 'u1' }, accessToken: 'a', refreshToken: 'r' });

    render(<App />);
    const button = await screen.findByRole('button', { name: /continue with github/i });
    button.click();

    await vi.advanceTimersByTimeAsync(10_000);
    const settled = apiMock.oauthClaim.mock.calls.length;

    await vi.advanceTimersByTimeAsync(30_000);
    expect(apiMock.oauthClaim.mock.calls.length).toBe(settled);
  });
});

/**
 * main.tsx renders <App/> inside <StrictMode>, so this is the tree the app
 * actually ships. StrictMode deliberately mounts, unmounts and remounts every
 * component in development to surface effects that cannot survive it — and the
 * poll's `cancelled` ref is only ever set to true, in that unmount cleanup,
 * and never reset when the component comes back.
 */
describe('under StrictMode, as main.tsx renders it', () => {
  it('still polls after the remount', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { StrictMode } = await import('react');

    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    const button = await screen.findByRole('button', { name: /continue with github/i });
    button.click();

    await waitFor(() => expect(openExternal).toHaveBeenCalled());
    await vi.advanceTimersByTimeAsync(6_000);

    // A ref left latched at "cancelled" makes the loop exit on its first check,
    // which reads to the user as an instant, inexplicable timeout.
    expect(apiMock.oauthClaim).toHaveBeenCalled();
    expect(screen.queryByText(/timed out/i)).toBeNull();
  });
});
