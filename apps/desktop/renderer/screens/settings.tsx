import { useCallback, useEffect, useState } from 'react';
import type { Difficulty, DifficultyFocusInput, TimerConfig } from '@codelock/shared';
import { SpeedGateSettings, TimeBudgetSettings } from './session-rules';
import { api, ApiError } from '../api';
import { openExternal } from '../bridge';
import {
  chime,
  readCelebrationPrefs,
  writeCelebrationPrefs,
  type CelebrationPrefs,
} from '../celebration';

/** Sunday first, matching the bitmask where Sunday is bit 0. */
const DAYS = [
  { bit: 0, short: 'S', label: 'Sunday' },
  { bit: 1, short: 'M', label: 'Monday' },
  { bit: 2, short: 'T', label: 'Tuesday' },
  { bit: 3, short: 'W', label: 'Wednesday' },
  { bit: 4, short: 'T', label: 'Thursday' },
  { bit: 5, short: 'F', label: 'Friday' },
  { bit: 6, short: 'S', label: 'Saturday' },
] as const;

const WEEKDAYS = 0b0111110;
const EVERY_DAY = 0b1111111;

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const fromTime = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59) return null;
  return h * 60 + m;
};

/**
 * Settings, native.
 *
 * Three self-contained panels separated by rules. GitHub connects here rather
 * than on mobile, because its OAuth redirect targets a desktop browser — and
 * the shell can open a real one with a visible address bar, which is the whole
 * reason not to run OAuth inside an app window.
 */
export function SettingsScreen() {
  const [timer, setTimer] = useState<TimerConfig | null>(null);
  const [fromText, setFromText] = useState('00:00');
  const [toText, setToText] = useState('24:00');
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { timerConfig } = await api.timer();
      setTimer(timerConfig);
      setFromText(toTime(timerConfig.activeFromMinute));
      setToText(toTime(timerConfig.activeToMinute));
    } catch (err) {
      setStatus(err instanceof ApiError ? err.message : 'Could not reach CodeLock.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(patch: Partial<TimerConfig>) {
    if (!timer) return;
    const previous = timer;
    setTimer({ ...timer, ...patch });
    try {
      await api.saveTimer(patch);
      setStatus('Saved. It applies to the next session.');
    } catch (err) {
      setTimer(previous);
      setStatus(err instanceof ApiError ? err.message : 'Could not save.');
    }
  }

  function commitWindow() {
    const from = fromTime(fromText);
    const to = fromTime(toText);
    if (from === null || to === null) return setStatus('Times must look like 09:00.');
    if (from === to) return setStatus('A zero-length window would never fire.');
    void save({ activeFromMinute: from, activeToMinute: to });
  }

  if (!timer) {
    return (
      <p
        style={{
          fontSize: 13,
          color: status ? 'var(--danger)' : 'var(--faint)',
        }}
      >
        {status ?? 'Loading…'}
      </p>
    );
  }

  // The panels span the window; the prose inside them does not. A 640px column
  // left most of a maximised window empty, but settings text set to 1400px
  // would be worse — so the width limit moves onto the paragraphs, where a
  // reading measure belongs, and the controls get the full span.
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
          When CodeLock can lock you
        </h2>

        {/* Capped, unlike the panels around it. Stretching seven one-letter
            toggles across a maximised window gives each a 120px hit area for a
            single glyph, which reads as seven buttons rather than one week. */}
        <div style={{ display: 'flex', gap: 4, maxWidth: 460 }}>
          {DAYS.map((day) => {
            const on = (timer.activeDaysMask & (1 << day.bit)) !== 0;
            return (
              <button
                key={day.bit}
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-label={day.label}
                onClick={() =>
                  void save({
                    activeDaysMask: timer.activeDaysMask ^ (1 << day.bit),
                  })
                }
                // Seven solid accent blocks made the quietest panel on the
                // screen the loudest thing in the window. A day being enabled
                // is the ordinary state, not an alert, so it gets the same
                // tinted chip the duration presets use.
                className="btn btn-chip"
                style={{ flex: 1, padding: 0 }}
              >
                {day.short}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Quiet onClick={() => void save({ activeDaysMask: WEEKDAYS })}>Weekdays</Quiet>
          <Quiet onClick={() => void save({ activeDaysMask: EVERY_DAY })}>Every day</Quiet>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          <label
            style={{
              display: 'grid',
              gap: 4,
              fontSize: 12.5,
              color: 'var(--muted)',
            }}
          >
            From
            <input
              value={fromText}
              onChange={(e) => setFromText(e.target.value)}
              onBlur={commitWindow}
            />
          </label>
          <label
            style={{
              display: 'grid',
              gap: 4,
              fontSize: 12.5,
              color: 'var(--muted)',
            }}
          >
            To
            <input
              value={toText}
              onChange={(e) => setToText(e.target.value)}
              onBlur={commitWindow}
            />
          </label>
          <label
            style={{
              display: 'grid',
              gap: 4,
              fontSize: 12.5,
              color: 'var(--muted)',
            }}
          >
            Default length
            <input
              type="number"
              min={5}
              max={600}
              value={timer.durationMinutes}
              onChange={(e) => void save({ durationMinutes: Number(e.target.value) })}
              style={{ width: 92 }}
            />
          </label>
        </div>

        {timer.activeDaysMask === 0 && (
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 12.5,
              color: 'var(--warning)',
            }}
          >
            No days selected — CodeLock will never lock you.
          </p>
        )}
      </section>


      {/* --- the recurring timer --------------------------------------- */}
      <section className="rule" style={{ paddingTop: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Repeat sessions</h2>
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 12.5,
            color: 'var(--muted)',
            maxWidth: 560,
          }}
        >
          When a session ends — solved, or skipped — start the next countdown
          straight away, for {timer.durationMinutes} minutes. It keeps running on
          its own until you stop it here, and it stops by itself outside the
          hours above.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            role="switch"
            aria-checked={timer.autoRearm}
            onClick={() => void save({ autoRearm: !timer.autoRearm })}
            className={timer.autoRearm ? 'btn btn-chip' : 'btn btn-quiet'}
          >
            {timer.autoRearm ? 'Repeating' : 'Off'}
          </button>
          {/* Named rather than implied. A toggle whose off-state is a quieter
              shade of the on-state is the wrong control for something a user
              may want to stop in a hurry, so the way out says what it does. */}
          {timer.autoRearm && (
            <Quiet onClick={() => void save({ autoRearm: false })}>
              Stop repeating
            </Quiet>
          )}
        </div>

        {timer.autoRearm && (
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 12.5,
              color: 'var(--faint)',
            }}
          >
            Holding Escape to force a lock open never re-arms — that exit stays
            an exit.
          </p>
        )}
      </section>

      {/* --- difficulty focus ------------------------------------------- */}
      <DifficultyFocusSettings timer={timer} onSaved={setTimer} />

      {/* --- how long, and whether speed counts --------------------------- */}
      <TimeBudgetSettings timer={timer} onSaved={setTimer} />
      <SpeedGateSettings timer={timer} onSaved={setTimer} />

      {/* --- after a solve ----------------------------------------------- */}
      <CelebrationSettings />

      {status && <p style={{ fontSize: 12.5, color: 'var(--faint)' }}>{status}</p>}
    </div>
  );
}

/** Motion and the soft chime for the moment after a solve. Both on by default. */
function CelebrationSettings() {
  const [prefs, setPrefs] = useState<CelebrationPrefs>(readCelebrationPrefs);
  const update = (next: CelebrationPrefs) => {
    setPrefs(next);
    writeCelebrationPrefs(next);
  };
  return (
    <section className="rule" style={{ paddingTop: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>After you solve</h2>
      <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--muted)', maxWidth: 560 }}>
        A short celebration shows what the solve achieved. Your system&apos;s reduced-motion
        setting always turns the animation off.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.motion}
          onClick={() => update({ ...prefs, motion: !prefs.motion })}
          className={prefs.motion ? 'btn btn-chip' : 'btn btn-quiet'}
        >
          Motion: {prefs.motion ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={prefs.sound}
          onClick={() => {
            const next = { ...prefs, sound: !prefs.sound };
            update(next);
            if (next.sound) chime();
          }}
          className={prefs.sound ? 'btn btn-chip' : 'btn btn-quiet'}
        >
          Soft chime: {prefs.sound ? 'On' : 'Off'}
        </button>
      </div>
    </section>
  );
}

function Quiet({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-quiet"
      style={{ marginTop: 10 }}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="mono" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
        {value}
      </p>
      <p className="eyebrow" style={{ margin: 0 }}>
        {label}
      </p>
    </div>
  );
}


const FOCUS_OPTIONS: {
  value: 'AUTOMATIC' | Difficulty;
  label: string;
  hint: string;
}[] = [
  {
    value: 'AUTOMATIC',
    label: 'Automatic (recommended)',
    hint: 'Moves between easy, medium and hard as you go. 3 fast solves step up; 2 failed sessions ease back down.',
  },
  { value: 'EASY', label: 'Focus on easy', hint: 'Every new session asks for an easy problem.' },
  { value: 'MEDIUM', label: 'Focus on medium', hint: 'Every new session asks for a medium problem.' },
  { value: 'HARD', label: 'Focus on hard', hint: 'Every new session asks for a hard problem.' },
];

/**
 * Automatic, or a deliberate focus on one band.
 *
 * Native radios in a fieldset, so arrow keys, focus rings and the group label
 * come from the platform. Saved on change; a failed save puts the previous
 * choice back and says so. The copy is careful about two things: a chosen
 * focus is not a promotion, and nothing here changes a session already under
 * way.
 */
function DifficultyFocusSettings({
  timer,
  onSaved,
}: {
  timer: TimerConfig;
  onSaved: (config: TimerConfig) => void;
}) {
  // An older server sends neither field: that is Automatic.
  const saved: 'AUTOMATIC' | Difficulty =
    timer.difficultyMode === 'MANUAL' && timer.focusDifficulty ? timer.focusDifficulty : 'AUTOMATIC';
  const [choice, setChoice] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [liveSession, setLiveSession] = useState(false);

  useEffect(() => setChoice(saved), [saved]);

  useEffect(() => {
    api
      .activeLock()
      .then((r) => setLiveSession(r.session !== null))
      .catch(() => setLiveSession(false));
  }, []);

  async function pick(next: 'AUTOMATIC' | Difficulty) {
    if (next === choice || saving) return;
    const previous = choice;
    setChoice(next);
    setSaving(true);
    setError(null);
    setNote(null);
    const body: DifficultyFocusInput =
      next === 'AUTOMATIC' ? { mode: 'AUTOMATIC' } : { mode: 'MANUAL', difficulty: next };
    try {
      const { timerConfig } = await api.saveDifficultyFocus(body);
      onSaved(timerConfig);
      setNote(
        liveSession
          ? 'Saved. Your current session keeps its level; this applies from the next one.'
          : 'Saved. This applies from your next session.',
      );
    } catch (err) {
      setChoice(previous);
      // Keyboard focus followed the arrow key to the choice that failed. Put it
      // back on the restored one, so focus and selection agree again.
      document.getElementById(`difficulty-focus-${previous.toLowerCase()}`)?.focus();
      setError(
        err instanceof ApiError
          ? `Could not save: ${err.message.replace(/\.+$/, '')}. Your previous choice is still in place.`
          : 'Could not save. Your previous choice is still in place.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rule" style={{ paddingTop: 20 }}>
      <fieldset
        aria-describedby="difficulty-focus-help"
        aria-busy={saving}
        style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
      >
        <legend style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', padding: 0 }}>
          Difficulty
        </legend>
        <p
          id="difficulty-focus-help"
          style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--muted)', maxWidth: 560 }}
        >
          Automatic is the default. Choosing a focus asks for that level instead, while your
          automatic level and its streak wait unchanged: focus sessions count toward your totals
          but never move the automatic level up or down. You can switch back at any time.
          {liveSession && ' A session already running keeps the level it started with.'}
        </p>

        <div style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
          {FOCUS_OPTIONS.map((option) => {
            const id = `difficulty-focus-${option.value.toLowerCase()}`;
            return (
              <label
                key={option.value}
                htmlFor={id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '2px 10px',
                  alignItems: 'start',
                  cursor: saving ? 'progress' : 'pointer',
                }}
              >
                <input
                  id={id}
                  type="radio"
                  name="difficulty-focus"
                  value={option.value}
                  checked={choice === option.value}
                  onChange={() => void pick(option.value)}
                  aria-describedby={`${id}-hint`}
                  style={{ marginTop: 3 }}
                />
                <span style={{ fontSize: 13.5, color: 'var(--fg)' }}>{option.label}</span>
                <span
                  id={`${id}-hint`}
                  style={{ gridColumn: 2, fontSize: 12, color: 'var(--faint)' }}
                >
                  {option.hint}
                </span>
              </label>
            );
          })}
        </div>
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
        {saving ? 'Saving…' : (error ?? note ?? '')}
      </p>
    </section>
  );
}
