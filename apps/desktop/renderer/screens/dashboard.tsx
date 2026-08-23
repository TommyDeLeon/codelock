import { useCallback, useEffect, useRef, useState } from 'react';
import type { LockSessionView, StatsSummary, TimerConfig } from '@codelock/shared';
import { api, ApiError } from '../api';
import { bridge } from '../bridge';
import { PersonalBests, RankReadout, StreakPips, TierLadder } from '../game';

/** Offered durations: a short focus block plus the three standard lengths. */
const PRESETS = [15, 30, 60, 90] as const;

/**
 * The desktop dashboard.
 *
 * The timer leads, because arming one is what most visits are for. The game
 * layer sits beside it, and the run log closes the page.
 *
 * Note what this screen does NOT do: it never decides the machine is unlocked.
 * It asks the shell to lock, and the shell verifies a server-signed token
 * before it will ever come back down.
 */
export function DashboardScreen({ onSignOut }: { onSignOut: () => void }) {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [session, setSession] = useState<LockSessionView | null>(null);
  const [timer, setTimer] = useState<TimerConfig | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [outage, setOutage] = useState<string | null>(null);
  const [lockFailed, setLockFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  // Distinguishes "the server says there is no session" from "we could not ask".
  const asked = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [summary, active, config] = await Promise.all([
        api.stats(),
        api.activeLock(),
        api.timer(),
      ]);
      setStats(summary);
      setSession(active.session);
      setRemaining(active.session?.secondsRemaining ?? null);
      setTimer(config.timerConfig);
      setOutage(null);
      asked.current = true;
    } catch (err) {
      // Never fall back to "No active session": a user whose timer is armed
      // would be told they have none and might start a second one on top.
      setOutage(err instanceof ApiError ? err.message : 'Could not reach CodeLock.');
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Five seconds, not fifteen: this interval is what makes the lock land on
    // time, so it is a deadline check rather than a dashboard refresh.
    const id = setInterval(() => void refresh(), 5_000);
    return () => clearInterval(id);
  }, [refresh]);

  // A local countdown between polls, so the figure moves every second without
  // asking the server sixty times a minute. The server still owns the deadline.
  const counting = remaining !== null;
  useEffect(() => {
    if (!counting) return;
    const id = setInterval(
      () => setRemaining((r) => (r === null ? null : Math.max(0, r - 1))),
      1000,
    );
    return () => clearInterval(id);
  }, [counting]);

  // Hand the deadline to the shell, so the lock lands even with this window
  // closed to the tray. Cleared when there is no armed session to wait for.
  useEffect(() => {
    void bridge()?.schedule(
      session?.state === 'ARMED' ? { sessionId: session.id, fireAt: session.fireAt } : null,
    );
  }, [session?.id, session?.state, session?.fireAt]);

  const fired = session !== null && (session.state === 'LOCKED' || remaining === 0);

  /**
   * The whole point of the product: when the timer fires, the screen goes away
   * on its own. Requiring a click here would make the lock opt-in, which anyone
   * who did not want to be locked would simply decline.
   *
   * Idempotent by design — the shell treats a second lock request for a live
   * session as a re-assert, so a poll landing during a lock costs nothing.
   */
  useEffect(() => {
    if (!fired || !session) return;
    let cancelled = false;
    void (async () => {
      const shell = bridge();
      if (!shell) return setLockFailed(true);
      try {
        const result = await shell.lock(session.id);
        if (!cancelled && !result.locked) setLockFailed(true);
      } catch {
        // Surfacing the manual route beats silently leaving the machine open.
        if (!cancelled) setLockFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fired, session?.id]);

  return (
    <div
      style={{ display: 'grid', gap: 28, gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)' }}
    >
      <div style={{ display: 'grid', gap: 28, minWidth: 0 }}>
        {/* --- timer ----------------------------------------------------- */}
        <section>
          <p className="eyebrow">Session</p>

          {outage && !asked.current ? (
            <Outage message={outage} onRetry={() => void refresh()} />
          ) : fired ? (
            <>
              <p style={{ fontSize: 22, margin: '10px 0 4px' }}>Time is up</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                Taking over the screen now. Solve the problem correctly and fast enough and the
                machine comes back.
              </p>
              {/* Only ever shown when the automatic path failed. */}
              {lockFailed && (
                <>
                  <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--danger)' }}>
                    The shell did not take the screen. Open it manually.
                  </p>
                  <button
                    type="button"
                    onClick={() => void bridge()?.lock(session?.id)}
                    style={primaryButton}
                  >
                    Open the lock screen
                  </button>
                </>
              )}
            </>
          ) : remaining !== null ? (
            <>
              <p
                className="mono"
                style={{
                  fontSize: 56,
                  fontWeight: 600,
                  margin: '8px 0 0',
                  letterSpacing: '-0.02em',
                }}
              >
                {clock(remaining)}
              </p>
              <p className="mono" style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--faint)' }}>
                locks at {session ? new Date(session.fireAt).toLocaleTimeString() : '—'}
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 15, margin: '10px 0 12px', color: 'var(--muted)' }}>
                No active session. Start a block, work, then earn your way back in.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    disabled={busy}
                    onClick={() => void arm(minutes)}
                    aria-label={`Start a ${minutes} minute session`}
                    style={{
                      ...chipButton,
                      borderColor:
                        timer?.durationMinutes === minutes ? 'var(--accent)' : 'var(--border)',
                    }}
                  >
                    <span className="mono">{minutes}m</span>
                  </button>
                ))}
              </div>
              {timer && (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--faint)' }}>
                  Your default is {timer.durationMinutes} minutes. Change it in Settings.
                </p>
              )}
            </>
          )}

          {outage && asked.current && (
            <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--warning)' }}>
              {outage} Showing the last known state.
            </p>
          )}
        </section>

        {/* --- figures --------------------------------------------------- */}
        {stats && (
          <section className="rule" style={{ paddingTop: 20 }}>
            <div style={{ display: 'flex', gap: 32 }}>
              <Figure
                label="Problems solved"
                value={String(stats.progress.totalSolved)}
                detail={`${stats.submissions.acceptanceRate}% of submissions accepted`}
              />
              <Figure
                label="Locks cleared"
                value={String(stats.locks.unlockedCount)}
                detail="in the last 30 sessions"
              />
              <Figure
                label="Median unlock"
                value={compact(stats.locks.medianUnlockSeconds)}
                detail="from lock to solved"
              />
            </div>
          </section>
        )}

        {/* --- run log --------------------------------------------------- */}
        {stats && (
          <section className="rule" style={{ paddingTop: 20 }}>
            <p className="eyebrow">Run log</p>
            {stats.locks.recent.length === 0 ? (
              <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--faint)' }}>
                No sessions yet. Arm a timer and this fills in.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
                {stats.locks.recent.map((lock) => (
                  <li
                    key={lock.id}
                    className="rule"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '9px 0',
                      fontSize: 13,
                    }}
                  >
                    <span className="mono" style={{ color: 'var(--faint)', width: 88 }}>
                      {lock.resolvedAt ? new Date(lock.resolvedAt).toLocaleDateString() : '—'}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lock.problem?.title ?? 'Session'}
                    </span>
                    <span className="mono" style={{ color: 'var(--faint)' }}>
                      {lock.attempts} attempt{lock.attempts === 1 ? '' : 's'}
                    </span>
                    {/* Cleared is the only outcome that earns colour. */}
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid',
                        borderColor: lock.state === 'UNLOCKED' ? 'var(--accent)' : 'var(--border)',
                        color: lock.state === 'UNLOCKED' ? 'var(--accent)' : 'var(--muted)',
                      }}
                    >
                      {OUTCOME[lock.state] ?? lock.state.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {/* --- the game layer ---------------------------------------------- */}
      <aside style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
        {stats ? (
          <>
            <TierLadder progress={stats.progress} />
            <div className="rule" style={{ paddingTop: 20 }}>
              <StreakPips progress={stats.progress} />
            </div>
            <div className="rule" style={{ paddingTop: 20 }}>
              <RankReadout speed={stats.speed} />
            </div>
            <div className="rule" style={{ paddingTop: 20 }}>
              <PersonalBests bests={stats.personalBests} />
            </div>
          </>
        ) : (
          <p style={{ fontSize: 12.5, color: 'var(--faint)' }}>Loading your progress…</p>
        )}

        <button type="button" onClick={onSignOut} style={quietButton}>
          Sign out
        </button>
      </aside>
    </div>
  );

  async function arm(minutes: number) {
    setBusy(true);
    try {
      const armed = await api.arm(minutes);
      setSession(armed);
      setRemaining(armed.secondsRemaining);
      setOutage(null);
    } catch (err) {
      setOutage(err instanceof ApiError ? err.message : 'Could not start a session.');
    } finally {
      setBusy(false);
    }
  }
}

const OUTCOME: Record<string, string> = {
  UNLOCKED: 'solved',
  ABANDONED: 'abandoned',
  EXPIRED: 'expired',
  LOCKED: 'locked',
  ARMED: 'armed',
};

function Outage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ marginTop: 10 }}>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--danger)' }}>{message}</p>
      <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>
        Your session, if you have one, is still running on the server.
      </p>
      <button type="button" onClick={onRetry} style={quietButton}>
        Try again
      </button>
    </div>
  );
}

function Figure({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>{label}</p>
      <p className="mono" style={{ margin: '2px 0', fontSize: 24, fontWeight: 600 }}>
        {value}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--faint)' }}>{detail}</p>
    </div>
  );
}

/** mm:ss, or h:mm:ss once there is an hour to show. */
function clock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Seconds as the shortest honest reading: 45s, 12m, 1h 04m. */
function compact(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

const primaryButton: React.CSSProperties = {
  marginTop: 14,
  padding: '9px 16px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--accent)',
  color: 'var(--accent-fg)',
  fontWeight: 600,
};

const chipButton: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--fg)',
};

const quietButton: React.CSSProperties = {
  marginTop: 10,
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'var(--muted)',
  fontSize: 13,
  textAlign: 'left',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};
