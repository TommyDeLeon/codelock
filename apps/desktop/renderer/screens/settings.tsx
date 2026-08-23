import { useCallback, useEffect, useState } from 'react';
import type { Integration, LeetCodeStats, TimerConfig } from '@codelock/shared';
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
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [leetcode, setLeetcode] = useState<LeetCodeStats | null>(null);
  /** Connected, but the last stats fetch failed. Distinct from not connected. */
  const [leetcodeOffline, setLeetcodeOffline] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [fromText, setFromText] = useState('00:00');
  const [toText, setToText] = useState('24:00');
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [{ timerConfig }, list] = await Promise.all([api.timer(), api.integrations()]);
      setTimer(timerConfig);
      setFromText(toTime(timerConfig.activeFromMinute));
      setToText(toTime(timerConfig.activeToMinute));
      setIntegrations(list.integrations);

      if (list.integrations.some((i) => i.provider === 'LEETCODE')) {
        // The upstream endpoint is unofficial and does go down, and that is not
        // worth failing the whole settings load over — but it is not the same
        // as being disconnected either. Falling back to null here used to drop
        // the user into the "enter your LeetCode username" form they had
        // already filled in.
        setLeetcodeOffline(null);
        try {
          const stats = await api.leetcodeStats();
          setLeetcode(stats.stats);
        } catch (err) {
          setLeetcode(null);
          setLeetcodeOffline(
            err instanceof ApiError ? err.message : 'Could not reach LeetCode just now.',
          );
        }
      }
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

  const github = integrations.find((i) => i.provider === 'GITHUB') ?? null;

  return (
    <div style={{ maxWidth: 640, display: 'grid', gap: 24 }}>
      <section>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>
          When CodeLock can lock you
        </h2>

        <div style={{ display: 'flex', gap: 4 }}>
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
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                  background: on ? 'var(--accent)' : 'var(--surface)',
                  color: on ? 'var(--accent-fg)' : 'var(--muted)',
                  fontWeight: 600,
                }}
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

      <section className="rule" style={{ paddingTop: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>LeetCode</h2>
        {leetcode ? (
          <>
            <div style={{ display: 'flex', gap: 24 }}>
              <Stat label="solved" value={leetcode.solved.total} />
              <Stat label="easy" value={leetcode.solved.easy} />
              <Stat label="medium" value={leetcode.solved.medium} />
              <Stat label="hard" value={leetcode.solved.hard} />
            </div>
            <p
              style={{
                margin: '10px 0 0',
                fontSize: 12,
                color: 'var(--faint)',
              }}
            >
              {leetcode.username} · snapshot from{' '}
              {new Date(leetcode.fetchedAt).toLocaleDateString()}
            </p>
            <Quiet onClick={() => void api.disconnect('LEETCODE').then(load)}>Disconnect</Quiet>
          </>
        ) : leetcodeOffline ? (
          <>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{leetcodeOffline}</p>
            <Quiet onClick={() => void load()}>Try again</Quiet>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="LeetCode username"
              aria-label="LeetCode username"
            />
            <button
              type="button"
              disabled={!username.trim()}
              onClick={() =>
                void api
                  .linkLeetCode(username.trim())
                  .then((r) => {
                    setLeetcode(r.stats);
                    setUsername('');
                  })
                  .catch((err: unknown) =>
                    setStatus(
                      err instanceof ApiError ? err.message : 'Could not link that account.',
                    ),
                  )
              }
              style={outlineButton}
            >
              Link
            </button>
          </div>
        )}
      </section>

      <section className="rule" style={{ paddingTop: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>GitHub</h2>
        {github ? (
          <>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
              Connected as {github.externalUsername}
              {github.repoFullName ? `, mirroring to ${github.repoFullName}` : ''}. Accepted
              solutions are committed after the lock releases; a failed push never keeps you locked.
            </p>
            <Quiet onClick={() => void api.disconnect('GITHUB').then(load)}>Disconnect</Quiet>
          </>
        ) : (
          <>
            <p
              style={{
                margin: '0 0 10px',
                fontSize: 13,
                color: 'var(--muted)',
              }}
            >
              Mirror accepted solutions to a repository. Sign-in opens in your real browser, so you
              can see the address bar you are typing a password into.
            </p>
            <button
              type="button"
              onClick={() =>
                void api
                  .githubAuthorizeUrl()
                  .then((r) => openExternal(r.url))
                  .catch((err: unknown) =>
                    setStatus(err instanceof ApiError ? err.message : 'GitHub is not configured.'),
                  )
              }
              style={outlineButton}
            >
              Connect GitHub
            </button>
          </>
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
      style={{
        marginTop: 10,
        padding: 0,
        border: 'none',
        background: 'none',
        color: 'var(--muted)',
        fontSize: 13,
        textDecoration: 'underline',
        textUnderlineOffset: 3,
      }}
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

const outlineButton: React.CSSProperties = {
  padding: '0 14px',
  height: 38,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--fg)',
};
