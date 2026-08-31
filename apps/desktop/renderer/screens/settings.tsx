import { useCallback, useEffect, useState } from 'react';
import type { TimerConfig } from '@codelock/shared';
import { api, ApiError } from '../api';
import { openExternal } from '../bridge';

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


      {status && <p style={{ fontSize: 12.5, color: 'var(--faint)' }}>{status}</p>}
    </div>
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

