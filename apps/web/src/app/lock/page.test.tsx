import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { LockSessionView } from '@codelock/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isDesktop: vi.fn(),
  notifyNativeUnlocked: vi.fn(),
  releaseDesktopLock: vi.fn(),
  replace: vi.fn(),
  unlockCompletion: null as Promise<void> | null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock('@/hooks/use-lock-session', () => ({
  useLockSession: () => ({
    session: lockedSession,
    secondsRemaining: 0,
    expired: false,
    isLoading: false,
    unreachable: false,
    failure: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/lib/desktop-bridge', () => ({
  engageDesktopLock: vi.fn(),
  isDesktop: mocks.isDesktop,
  notifyNativeUnlocked: mocks.notifyNativeUnlocked,
  onKillSwitch: vi.fn(() => () => {}),
  releaseDesktopLock: mocks.releaseDesktopLock,
}));

vi.mock('@/components/lock/lock-workspace', () => ({
  LockWorkspace: ({ onUnlocked }: { onUnlocked: (token: string) => Promise<void> }) => (
    <button
      type="button"
      onClick={() => {
        mocks.unlockCompletion = onUnlocked('signed-token');
      }}
    >
      Finish accepted submission
    </button>
  ),
}));

vi.mock('@/components/lock/kill-switch-hint', () => ({
  KillSwitchHint: () => null,
}));

import LockPage from './page';

const lockedSession: LockSessionView = {
  id: 'session-1',
  state: 'LOCKED',
  difficulty: 'EASY',
  fireAt: '2026-09-07T00:00:00.000Z',
  serverNow: '2026-09-07T00:00:00.000Z',
  secondsRemaining: 0,
  pausedAt: null,
  attempts: 0,
  problem: {
    id: 'problem-1',
    slug: 'contains-duplicate',
    title: 'Contains Duplicate',
    difficulty: 'EASY',
    promptMarkdown: 'Find a duplicate.',
    starterCode: { JAVASCRIPT: 'function solve() {}' },
    sampleCases: [],
    avgSolveSeconds: 300,
  },
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <LockPage />
    </QueryClientProvider>,
  );
}

describe('LockPage unlock navigation ownership', () => {
  beforeEach(() => {
    mocks.isDesktop.mockReset();
    mocks.notifyNativeUnlocked.mockReset();
    mocks.releaseDesktopLock.mockReset();
    mocks.replace.mockReset();
    mocks.unlockCompletion = null;
  });

  it('leaves navigation to the shell after a verified desktop unlock', async () => {
    mocks.isDesktop.mockReturnValue(true);
    mocks.releaseDesktopLock.mockResolvedValue(true);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Finish accepted submission' }));
    await act(async () => await mocks.unlockCompletion);

    expect(mocks.releaseDesktopLock).toHaveBeenCalledWith('signed-token');
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.notifyNativeUnlocked).not.toHaveBeenCalled();
  });

  it('keeps the browser completion screen and its route', async () => {
    mocks.isDesktop.mockReturnValue(false);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Finish accepted submission' }));
    await act(async () => await mocks.unlockCompletion);
    const continueButton = screen.getByRole('button', { name: 'Continue' });

    expect(mocks.releaseDesktopLock).not.toHaveBeenCalled();
    expect(mocks.notifyNativeUnlocked).toHaveBeenCalledOnce();
    fireEvent.click(continueButton);
    expect(mocks.replace).toHaveBeenCalledWith('/');
  });
});
