import { useEffect, useState } from 'react';
import {
  TIME_BUDGET_CHOICES,
  type SpeedGateMode,
  type TimeBudgetOption,
  type TimerConfig,
} from '@codelock/shared';
import { api, ApiError } from '../api';

/**
 * The two rules a lock is judged by, chosen ahead of time.
 *
 * Both live here rather than on the lock screen on purpose. A setting the
 * learner can reach while the screen is held is a negotiation under duress:
 * the speed gate would become an unlock button, and the budget would become a
 * way to trade a hard thirty-minute problem for an easy three-minute one. Both
 * are snapshotted onto the session when it arms, so what is chosen here
 * governs the *next* lock and never the one in progress.
 *
 * The lock screen shows both, read-only. Being held to a rule you cannot see
 * is what makes "correct, but still locked" feel arbitrary.
 */

const BUDGET_HINTS: Record<number, string> = {
  3: 'A single short problem. Good when the timer catches you mid-something.',
  10: 'One idea, worked through properly.',
  30: 'Room to get stuck and get unstuck. The default.',
  60: 'A long sitting. Everything in the corpus is eligible.',
};

/** Shared layout for the two radio groups below. Native controls, platform focus rings. */
function RuleFieldset({
  legend,
  helpId,
  help,
  saving,
  status,
  error,
  children,
}: {
  legend: string;
  helpId: string;
  help: React.ReactNode;
  saving: boolean;
  status: string | null;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="rule" style={{ paddingTop: 20 }}>
      <fieldset
        aria-describedby={helpId}
        aria-busy={saving}
        style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
      >
        <legend style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', padding: 0 }}>
          {legend}
        </legend>
        <p
          id={helpId}
          style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--muted)', maxWidth: 560 }}
        >
          {help}
        </p>
        <div style={{ display: 'grid', gap: 8, maxWidth: 560 }}>{children}</div>
      </fieldset>

      <p
        role={error ? 'alert' : 'status'}
        style={{
          margin: '10px 0 0',
          minHeight: '1.4em',
          fontSize: 12.5,
          color: error ? 'var(--danger)' : 'var(--muted)',
        }}
      >
        {saving ? 'Saving…' : (error ?? status ?? '')}
      </p>
    </section>
  );
}

/** One radio with a hint under it, disabled when the choice is not offerable. */
function RuleOption({
  id,
  name,
  label,
  hint,
  checked,
  disabled,
  dimmed,
  onPick,
}: {
  id: string;
  name: string;
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  dimmed: boolean;
  onPick: () => void;
}) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '2px 10px',
        alignItems: 'start',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      <input
        id={id}
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onPick}
        aria-describedby={`${id}-hint`}
        style={{ marginTop: 3 }}
      />
      <span style={{ fontSize: 13.5, color: 'var(--fg)' }}>{label}</span>
      <span id={`${id}-hint`} style={{ gridColumn: 2, fontSize: 12, color: 'var(--faint)' }}>
        {hint}
      </span>
    </label>
  );
}

/** Whether a lock is running, for copy that has to say "not this one". */
function useLiveSession(): boolean {
  const [live, setLive] = useState(false);
  useEffect(() => {
    api
      .activeLock()
      .then((r) => setLive(r.session !== null))
      .catch(() => setLive(false));
  }, []);
  return live;
}

function saveFailed(err: unknown): string {
  return err instanceof ApiError
    ? `Could not save: ${err.message.replace(/\.+$/, '')}. Your previous choice is still in place.`
    : 'Could not save. Your previous choice is still in place.';
}

/**
 * How long the learner has, as a ceiling on what may be served.
 *
 * This setting exists because of an abandoned session: the lock was not too
 * weak, the problem was too big for the moment it arrived in. A budget narrows
 * what may be served and decides nothing about difficulty — the ladder still
 * chooses within it.
 *
 * A band with nothing under it is disabled rather than hidden. Hiding it would
 * read as a missing feature; disabled, with a reason, says the corpus has not
 * caught up to this learner yet, which is the truth.
 */
export function TimeBudgetSettings({
  timer,
  onSaved,
}: {
  timer: TimerConfig;
  onSaved: (config: TimerConfig) => void;
}) {
  const saved = timer.timeBudgetMinutes ?? 30;
  const [choice, setChoice] = useState<number>(saved);
  const [budgets, setBudgets] = useState<TimeBudgetOption[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const liveSession = useLiveSession();

  useEffect(() => setChoice(saved), [saved]);

  useEffect(() => {
    // A failed availability read must not disable the control. Unknown is
    // treated as available: the server relaxes if it turns out not to be, and
    // a settings screen that greys out every option because one request failed
    // is worse than a band that quietly runs long.
    api
      .timeBudgets()
      .then((r) => setBudgets(r.budgets))
      .catch(() => setBudgets(null));
  }, []);

  const options: TimeBudgetOption[] =
    budgets ??
    TIME_BUDGET_CHOICES.map((minutes) => ({ minutes, problemCount: 0, available: true }));

  async function pick(next: number) {
    if (next === choice || saving) return;
    const previous = choice;
    setChoice(next);
    setSaving(true);
    setError(null);
    setNote(null);
    try {
      const { timerConfig } = await api.saveTimer({ timeBudgetMinutes: next });
      onSaved(timerConfig);
      setNote(
        liveSession
          ? 'Saved. Your current session keeps the budget it started with; this applies from the next one.'
          : 'Saved. This applies from your next session.',
      );
    } catch (err) {
      setChoice(previous);
      // Keyboard focus followed the arrow key to the choice that failed. Put it
      // back on the restored one, so focus and selection agree again.
      document.getElementById(`time-budget-${previous}`)?.focus();
      setError(saveFailed(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <RuleFieldset
      legend="Time budget"
      helpId="time-budget-help"
      saving={saving}
      status={note}
      error={error}
      help={
        <>
          The most time one locked problem should take. A ceiling, not a target: thirty minutes
          leaves everything shorter eligible too, and your level still decides how hard the problem
          is. Choose it here rather than when the lock lands — the moment you are being held is the
          least honest time to decide how long you have.
          {liveSession && ' A session already running keeps the budget it started with.'}
        </>
      }
    >
      {options.map((option) => (
        <RuleOption
          key={option.minutes}
          id={`time-budget-${option.minutes}`}
          name="time-budget"
          label={`${option.minutes} minutes`}
          hint={
            option.available
              ? (BUDGET_HINTS[option.minutes] ?? '')
              : 'Nothing at your level fits in this yet. It opens up as you move through the corpus.'
          }
          checked={choice === option.minutes}
          disabled={!option.available || saving}
          dimmed={!option.available}
          onPick={() => void pick(option.minutes)}
        />
      ))}
    </RuleFieldset>
  );
}

const SPEED_GATE_OPTIONS: Array<{ value: SpeedGateMode; label: string; hint: string }> = [
  {
    value: 'AFTER_FIRST_SOLVE',
    label: 'Only on problems you have solved before',
    hint: 'The first time you meet a problem, passing every test is enough. Your time is still measured and shown, so you know the bar when you meet it again.',
  },
  {
    value: 'ALWAYS',
    label: 'Every time, including the first',
    hint: 'Correct is not enough: every solve must also land inside the speed budget. Harder, and closer to an interview.',
  },
];

/**
 * When the speed gate applies.
 *
 * The gate measures how close you are to the best known answer. That is a fair
 * question about a problem you have solved before and an unfair one about a
 * problem you are still forming a solution to — it asks for recall of
 * something that does not exist yet, and the reachable answer to that is to
 * hold Escape. So the default no longer does it.
 */
export function SpeedGateSettings({
  timer,
  onSaved,
}: {
  timer: TimerConfig;
  onSaved: (config: TimerConfig) => void;
}) {
  // An older server sends nothing, and its behaviour was ALWAYS.
  const saved: SpeedGateMode = timer.speedGateMode ?? 'ALWAYS';
  const [choice, setChoice] = useState<SpeedGateMode>(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const liveSession = useLiveSession();

  useEffect(() => setChoice(saved), [saved]);

  async function pick(next: SpeedGateMode) {
    if (next === choice || saving) return;
    const previous = choice;
    setChoice(next);
    setSaving(true);
    setError(null);
    setNote(null);
    try {
      const { timerConfig } = await api.saveTimer({ speedGateMode: next });
      onSaved(timerConfig);
      setNote(
        liveSession
          ? 'Saved. Your current session is graded by the rule it started with; this applies from the next one.'
          : 'Saved. This applies from your next session.',
      );
    } catch (err) {
      setChoice(previous);
      document.getElementById(`speed-gate-${previous.toLowerCase()}`)?.focus();
      setError(saveFailed(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <RuleFieldset
      legend="Speed gate"
      helpId="speed-gate-help"
      saving={saving}
      status={note}
      error={error}
      help={
        <>
          Unlocking always needs every test to pass. This decides whether it also needs to be fast.
          {liveSession && ' A session already running is graded by the rule it started with.'}
        </>
      }
    >
      {SPEED_GATE_OPTIONS.map((option) => (
        <RuleOption
          key={option.value}
          id={`speed-gate-${option.value.toLowerCase()}`}
          name="speed-gate"
          label={option.label}
          hint={option.hint}
          checked={choice === option.value}
          disabled={saving}
          dimmed={false}
          onPick={() => void pick(option.value)}
        />
      ))}
    </RuleFieldset>
  );
}
