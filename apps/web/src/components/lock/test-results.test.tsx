import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GradeResult } from '@codelock/shared';
import { TestResults } from './test-results';
import { describeMismatch } from './test-case-row';

/**
 * The panel that tells you why you are still locked.
 *
 * These rows were `<li>`s with no handler: nothing to click, and no detail
 * rendered even though the grader had it. Every test here exists so a beginner
 * can open a case and see what it actually ran.
 */

afterEach(cleanup);

type CaseView = GradeResult['cases'][number];

function verdict(cases: CaseView[]): GradeResult {
  return {
    submissionId: 'sub-1',
    status: 'WRONG_ANSWER',
    passedCount: cases.filter((c) => c.passed).length,
    totalCount: cases.length,
    runtimeMs: 120,
    memoryKb: 51200,
    message: null,
    cases,
    correct: false,
    performance: null,
    accepted: false,
    standing: null,
    unlockToken: null,
  } as unknown as GradeResult;
}

const failingSample: CaseView = {
  ordinal: 0,
  isSample: true,
  passed: false,
  status: 'Wrong Answer',
  timeMs: 42,
  stdin: 'aabbc',
  expectedStdout: '1',
  actualStdout: '3',
  stderr: null,
};

const passingSample: CaseView = {
  ordinal: 1,
  isSample: true,
  passed: true,
  status: 'Accepted',
  timeMs: 38,
  stdin: 'abc',
  expectedStdout: '3',
  actualStdout: '3',
  stderr: null,
};

const hidden: CaseView = {
  ordinal: 2,
  isSample: false,
  passed: false,
  status: 'Wrong Answer',
  timeMs: 51,
};

const row = (n: number) => screen.getByRole('button', { name: new RegExp(`^Case ${n}`) });

describe('opening a case', () => {
  it('starts with every case closed', () => {
    render(<TestResults result={verdict([failingSample, hidden])} running={false} />);
    expect(row(1).getAttribute('aria-expanded')).toBe('false');
    // The panel stays mounted and carries `hidden`, so assert on that rather
    // than on the text being absent — queryByText finds hidden nodes.
    expect(document.getElementById('case-panel-0')!.hasAttribute('hidden')).toBe(true);
  });

  it('shows what the case ran when clicked', async () => {
    const user = userEvent.setup();
    render(<TestResults result={verdict([failingSample, hidden])} running={false} />);

    await user.click(row(1));

    expect(row(1).getAttribute('aria-expanded')).toBe('true');
    const panel = document.getElementById('case-panel-0')!;
    expect(within(panel).getByText('aabbc')).toBeTruthy();
    expect(within(panel).getByText('1')).toBeTruthy();
    expect(within(panel).getByText('3')).toBeTruthy();
  });

  it('points the panel at the row that controls it', () => {
    render(<TestResults result={verdict([failingSample])} running={false} />);
    expect(row(1).getAttribute('aria-controls')).toBe('case-panel-0');
    expect(document.getElementById('case-panel-0')).toBeTruthy();
  });

  it('closes again when the same row is clicked twice', async () => {
    const user = userEvent.setup();
    render(<TestResults result={verdict([failingSample])} running={false} />);

    await user.click(row(1));
    await user.click(row(1));

    expect(row(1).getAttribute('aria-expanded')).toBe('false');
  });

  /**
   * The panel shares a column with the editor, so only one case opens at a
   * time. Without this, opening a third case pushes the one being read off the
   * bottom of a fixed-height list.
   */
  it('swaps to the other case rather than opening both', async () => {
    const user = userEvent.setup();
    render(<TestResults result={verdict([failingSample, passingSample])} running={false} />);

    await user.click(row(1));
    await user.click(row(2));

    expect(row(1).getAttribute('aria-expanded')).toBe('false');
    expect(row(2).getAttribute('aria-expanded')).toBe('true');
    expect(within(document.getElementById('case-panel-1')!).getByText('abc')).toBeTruthy();
  });

  // A double click is the obvious way to desync a naive toggle that reads the
  // current value instead of the previous one.
  it('survives a burst of rapid clicks', async () => {
    const user = userEvent.setup();
    render(<TestResults result={verdict([failingSample])} running={false} />);

    await user.dblClick(row(1));

    expect(row(1).getAttribute('aria-expanded')).toBe('false');
  });
});

describe('keyboard use', () => {
  it('reaches a row with Tab and opens it with Enter', async () => {
    const user = userEvent.setup();
    render(<TestResults result={verdict([failingSample])} running={false} />);

    await user.tab();
    expect(document.activeElement).toBe(row(1));

    await user.keyboard('{Enter}');
    expect(row(1).getAttribute('aria-expanded')).toBe('true');
  });

  it('opens with Space too', async () => {
    const user = userEvent.setup();
    render(<TestResults result={verdict([failingSample])} running={false} />);

    row(1).focus();
    await user.keyboard(' ');

    expect(row(1).getAttribute('aria-expanded')).toBe('true');
  });
});

describe('what each kind of case shows', () => {
  it('renders a passing case with its output', async () => {
    const user = userEvent.setup();
    render(<TestResults result={verdict([passingSample])} running={false} />);

    // passingSample is ordinal 1, so it is labelled "Case 2" even when it is
    // the only row on screen. The label follows the ordinal, not the position.
    await user.click(row(2));
    const panel = document.getElementById('case-panel-1')!;

    expect(panel.textContent).toContain('Passed');
    expect(within(panel).getByText('abc')).toBeTruthy();
  });

  it('renders a traceback when the case errored', async () => {
    const user = userEvent.setup();
    const errored: CaseView = {
      ...failingSample,
      status: 'Runtime Error (NZEC)',
      actualStdout: null,
      stderr: 'Traceback (most recent call last):\n  IndexError: list index out of range',
    };
    render(<TestResults result={verdict([errored])} running={false} />);

    await user.click(row(1));
    const panel = document.getElementById('case-panel-0')!;

    expect(panel.textContent).toContain('IndexError');
    expect(panel.textContent).toContain('Runtime Error');
  });

  /**
   * The privacy rule, which the grader enforces by omitting the fields
   * entirely. The row still has to open — a dead row reads as a broken button.
   */
  it('opens a hidden case without revealing it', async () => {
    const user = userEvent.setup();
    render(<TestResults result={verdict([hidden])} running={false} />);

    await user.click(row(3));
    const panel = document.getElementById('case-panel-2')!;

    expect(panel.textContent).toContain('hidden test case');
    expect(panel.textContent).toContain('failed this category');
    expect(panel.textContent).not.toContain('Expected output');
    expect(panel.textContent).not.toContain('Input');
  });
});

describe('describeMismatch', () => {
  it('names an empty result rather than showing a blank box', () => {
    expect(describeMismatch('1', null)).toBe('Your program printed nothing at all.');
    expect(describeMismatch('1', '')).toBe('Your program printed nothing at all.');
  });

  // The most common near-miss for a beginner, and invisible on screen.
  it('spots output that is right apart from whitespace', () => {
    expect(describeMismatch('YES', 'YES\n')).toContain('spacing');
  });

  it('spots a capitalisation-only difference', () => {
    expect(describeMismatch('YES', 'yes')).toContain('capitalisation');
  });

  it('counts lines when the shape is wrong', () => {
    expect(describeMismatch('1\n2\n3', '1\n2')).toContain('Expected 3 lines');
  });

  it('says nothing rather than guessing when the values simply differ', () => {
    expect(describeMismatch('1', '3')).toBeNull();
  });

  it('says nothing when the output is correct', () => {
    expect(describeMismatch('1', '1')).toBeNull();
  });
});
