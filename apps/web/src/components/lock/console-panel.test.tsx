import { describe, expect, it, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RunResult } from '@codelock/shared';
import { ConsolePanel } from './console-panel';

/**
 * The console.
 *
 * Its reason for existing is that the lock screen had one button and it graded,
 * so trying something out cost an attempt. These check that a run reads as a
 * run: output shown plainly, a verdict only where there is something to be
 * right about, and no suggestion anywhere that this is how you get out.
 */

afterEach(cleanup);

type RunCase = RunResult['cases'][number];

function runCase(overrides: Partial<RunCase> = {}): RunCase {
  return {
    ordinal: 0,
    stdin: '3\n',
    stdout: '9\n',
    stderr: null,
    status: 'Accepted',
    timeMs: 4,
    expectedStdout: '9\n',
    matched: true,
    ...overrides,
  };
}

function panel(props: Partial<Parameters<typeof ConsolePanel>[0]> = {}) {
  return (
    <ConsolePanel
      result={null}
      running={false}
      stdin=""
      onStdinChange={() => {}}
      useCustomStdin={false}
      onUseCustomStdinChange={() => {}}
      onRun={() => {}}
      {...props}
    />
  );
}

describe('running the code', () => {
  it('runs when the button is pressed', async () => {
    const onRun = vi.fn();
    render(panel({ onRun }));

    await userEvent.click(screen.getByRole('button', { name: /run/i }));

    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it('says plainly that running is free, because that is the whole point', () => {
    render(panel());
    expect(screen.getByText(/without using an attempt/i)).toBeTruthy();
  });

  it('shows a spinner while the judge is working', () => {
    render(panel({ running: true }));
    expect(screen.getByRole('status')).toBeTruthy();
  });
});

describe('reading the output', () => {
  it('shows input, output and expected for a sample', () => {
    render(panel({ result: { ran: true, compileError: null, cases: [runCase()] } }));

    expect(screen.getByText('Case 1')).toBeTruthy();
    expect(screen.getByText('Input')).toBeTruthy();
    expect(screen.getByText('Your output')).toBeTruthy();
    expect(screen.getByText('Expected')).toBeTruthy();
    expect(screen.getByText('matches')).toBeTruthy();
  });

  it('marks a sample whose output differs', () => {
    render(
      panel({
        result: {
          ran: true,
          compileError: null,
          cases: [runCase({ stdout: '8\n', matched: false })],
        },
      }),
    );

    expect(screen.getByText('differs')).toBeTruthy();
  });

  /**
   * A run against input you chose is not a verdict. Showing "differs" there
   * would be the panel marking your homework against an answer it does not
   * have.
   */
  it('offers no verdict on your own input', () => {
    render(
      panel({
        result: {
          ran: true,
          compileError: null,
          cases: [runCase({ ordinal: null, expectedStdout: null, matched: null })],
        },
      }),
    );

    expect(screen.getByText('Your input')).toBeTruthy();
    expect(screen.queryByText('matches')).toBeNull();
    expect(screen.queryByText('differs')).toBeNull();
    expect(screen.queryByText('Expected')).toBeNull();
  });

  it('says so when the program printed nothing, rather than showing a blank', () => {
    render(
      panel({
        result: { ran: true, compileError: null, cases: [runCase({ stdout: null })] },
      }),
    );

    expect(screen.getByText('(printed nothing)')).toBeTruthy();
  });

  it('shows a traceback when the code crashed', () => {
    render(
      panel({
        result: {
          ran: true,
          compileError: null,
          cases: [
            runCase({
              stdout: null,
              stderr: 'NameError: name "x" is not defined',
              status: 'Runtime Error (NZEC)',
              matched: false,
            }),
          ],
        },
      }),
    );

    expect(screen.getByText(/NameError/)).toBeTruthy();
    expect(screen.getByText('Runtime Error (NZEC)')).toBeTruthy();
  });

  it('shows a compile error once, not once per case', () => {
    render(
      panel({
        result: {
          ran: true,
          compileError: 'line 1: syntax error',
          cases: [runCase({ matched: false }), runCase({ ordinal: 1, matched: false })],
        },
      }),
    );

    expect(screen.getAllByText('line 1: syntax error')).toHaveLength(1);
  });
});

describe('your own input', () => {
  it('hides the input box until you ask for it', () => {
    render(panel());
    expect(screen.queryByLabelText('Input')).toBeNull();
  });

  it('shows the box and reports what you type', async () => {
    const onStdinChange = vi.fn();
    render(panel({ useCustomStdin: true, onStdinChange }));

    await userEvent.type(screen.getByLabelText('Input'), '7');

    expect(onStdinChange).toHaveBeenCalled();
  });

  it('toggles the mode from the checkbox', async () => {
    const onUseCustomStdinChange = vi.fn();
    render(panel({ onUseCustomStdinChange }));

    await userEvent.click(screen.getByRole('checkbox', { name: /my own input/i }));

    expect(onUseCustomStdinChange).toHaveBeenCalledWith(true);
  });
});
