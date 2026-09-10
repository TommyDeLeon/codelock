import { useCallback, useEffect, useRef, useState } from 'react';
import type { LockSessionView, StatsSummary, TimerConfig } from '@codelock/shared';
import { api, ApiError } from '../api';
import { SessionReviewPanel } from './session-review';
import { bridge } from '../bridge';
import { PersonalBests, RankReadout, StreakPips, TierLadder } from '../game';

/** Offered durations: a short focus block plus the three standard lengths. */
const PRESETS = [15, 30, 60, 90] as const;

/**
 * How much a single press takes off a running countdown.
 *
 * A chip is only offered while the countdown is longer than the step it would
 * remove. The server clamps an overshoot to the present rather than erroring,
 * so without that rule '-30m' on a four-minute timer would silently be a Lock
 * now button wearing someone else's label — and taking the screen is not
 * something to do by implication.
 */
const SHORTEN_STEPS = [5, 15, 30] as const;

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
export function DashboardScreen() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [session, setSession] = useState<LockSessionView | null>(null);
  const [timer, setTimer] = useState<TimerConfig | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [outage, setOutage] = useState<string | null>(null);
  const [lockFailed, setLockFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  // Reset is two-step. It ends the block outright and sits next to Pause.
  const [confirmReset, setConfirmReset] = useState(false);
  // So is locking now, and for the stronger reason: it takes the screen this
  // second, and the way back out is a problem the user has not seen yet.
  const [confirmLockNow, setConfirmLockNow] = useState(false);
  // Which past session is open for review, if any. Null is the dashboard.
  const [reviewing, setReviewing] = useState<string | null>(null);

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

  /**
   * A paused countdown has no deadline.
   *
   * The API freezes secondsRemaining while this is set and refuses to engage
   * such a session, so nothing on this screen may act as though a deadline is
   * approaching — not the local tick, not the auto-lock, and not the deadline
   * handed to the shell.
   */
  const paused = session?.pausedAt != null;

  // A local countdown between polls, so the figure moves every second without
  // asking the server sixty times a minute. The server still owns the deadline.
  // Frozen while paused: the server is not counting either, so ticking here
  // would both show a falling number the server disagrees with and walk the
  // figure down to zero, which is what fires the lock below.
  const counting = remaining !== null && !paused;
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
      session?.state === 'ARMED' && !paused
        ? { sessionId: session.id, fireAt: session.fireAt }
        : null,
    );
  }, [session?.id, session?.state, session?.fireAt, paused]);

  const fired =
    session !== null && (session.state === 'LOCKED' || (remaining === 0 && !paused));

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
      style={{
        display: 'grid',
        gap: 28,
        gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
      }}
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
                  <p
                    style={{
                      margin: '10px 0 0',
                      fontSize: 12.5,
                      color: 'var(--danger)',
                    }}
                  >
                    The shell did not take the screen. Open it manually.
                  </p>
                  <button
                    type="button"
                    onClick={() => void bridge()?.lock(session?.id)}
                    className="btn btn-primary" style={{ marginTop: 14 }}
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
              <p
                className="mono"
                style={{
                  margin: '4px 0 0',
                  fontSize: 12,
                  color: 'var(--faint)',
                }}
              >
                {/* fireAt is only meaningful again once resumed, so quoting a
                    time here while paused would be the second untruth after
                    a number that is no longer counting down. */}
                {paused
                  ? 'Paused. The clock is holding and gives the time back when you resume.'
                  : `locks at ${session ? new Date(session.fireAt).toLocaleTimeString() : '—'}`}
              </p>

              {/* Take time off, or take the screen now.
                  Both directions of "change the deadline" are not offered here:
                  there is no way to add time, because a countdown that can be
                  pushed away on demand is not a commitment. Shortening only
                  ever makes the deal stricter, so it needs no confirmation —
                  except at the end of the range, where it stops being a nudge
                  and becomes the lock itself.

                  Hidden while paused: the server refuses to shorten a held
                  clock, because resume moves `fireAt` forward by the paused
                  interval and the subtraction would be against a number that is
                  about to change. */}
              {session?.state === 'ARMED' && !paused && remaining !== null && (
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 14,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <span className="mono" style={{ fontSize: 12, color: 'var(--faint)' }}>
                    Lock sooner
                  </span>
                  {SHORTEN_STEPS.filter((m) => remaining > m * 60).map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      disabled={busy}
                      onClick={() => void shorten(minutes)}
                      aria-label={`Lock ${minutes} minutes sooner`}
                      className="btn btn-chip"
                    >
                      −{minutes}m
                    </button>
                  ))}

                  {confirmLockNow ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void lockNow()}
                        className="btn btn-chip"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      >
                        Lock now — sure?
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmLockNow(false)}
                        className="btn btn-chip"
                      >
                        Not yet
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmLockNow(true)}
                      className="btn btn-chip"
                    >
                      Lock now
                    </button>
                  )}
                </div>
              )}

              {confirmLockNow && (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--faint)' }}>
                  This takes the screen immediately. The way back is the problem you
                  are given — there is no reset once it lands.
                </p>
              )}

              {/* Only before the lock lands. Afterwards the server refuses all
                  three, and offering buttons that can only fail would read as
                  the lock being negotiable when it is not. */}
              {session?.state === 'ARMED' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void setPaused(!paused)}
                    className="btn btn-chip"
                  >
                    {paused ? 'Resume' : 'Pause'}
                  </button>

                  {confirmReset ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void reset()}
                        className="btn btn-chip"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      >
                        Reset — sure?
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmReset(false)}
                        className="btn btn-chip"
                      >
                        Keep it
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmReset(true)}
                      className="btn btn-chip"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}

              {confirmReset && (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--faint)' }}>
                  Resetting ends this block and starts nothing. It is not recorded as a failure —
                  no problem has been assigned yet.
                </p>
              )}
            </>
          ) : (
            <>
              <p
                style={{
                  fontSize: 15,
                  margin: '10px 0 12px',
                  color: 'var(--muted)',
                }}
              >
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
                    // The default duration is a selected state, not merely a
                    // coloured edge: aria-pressed carries it to assistive tech
                    // and drives the styling from that one source.
                    aria-pressed={timer?.durationMinutes === minutes}
                    className="btn btn-chip"
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
              {timer && (
                <p
                  style={{
                    margin: '10px 0 0',
                    fontSize: 12,
                    color: 'var(--faint)',
                  }}
                >
                  Your default is {timer.durationMinutes} minutes. Change it in Settings.
                </p>
              )}
            </>
          )}

          {/* The recurring timer, and the way out of it.
              A repeat that can only be stopped two screens away is a trap: the
              moment a user wants it off is the moment they are staring at the
              next countdown, not browsing Settings. */}
          {timer?.autoRearm && !fired && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                margin: '14px 0 0',
              }}
            >
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>
                Repeating: another {timer.durationMinutes}-minute countdown starts
                when this session ends.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void stopRepeating()}
                className="btn btn-quiet"
              >
                Stop repeating
              </button>
            </div>
          )}

          {outage && asked.current && (
            <p
              style={{
                margin: '10px 0 0',
                fontSize: 12.5,
                color: 'var(--warning)',
              }}
            >
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
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 12.5,
                  color: 'var(--faint)',
                }}
              >
                No sessions yet. Arm a timer and this fills in.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
                {stats.locks.recent.map((lock) => (
                  <li key={lock.id} className="rule">
                    {/* A real button, so the row is reachable by Tab and
                        announced as something that can be opened — the whole
                        point is that "abandoned" stops being the end of the
                        story. */}
                    <button
                      type="button"
                      onClick={() => setReviewing(lock.id)}
                      className="log-row"
                      aria-label={`Review the session on ${
                        lock.resolvedAt ? new Date(lock.resolvedAt).toLocaleDateString() : 'an unknown date'
                      }`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '9px 0',
                        fontSize: 13,
                        width: '100%',
                        background: 'none',
                        border: 0,
                        color: 'inherit',
                        font: 'inherit',
                        textAlign: 'left',
                        cursor: 'pointer',
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
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {reviewing && (
        <SessionReviewPanel sessionId={reviewing} onClose={() => setReviewing(null)} />
      )}

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
      </aside>
    </div>
  );

  /**
   * Hold the clock, or give the time back.
   *
   * Both replace the whole session from the response rather than patching
   * `pausedAt` locally, because resume also moves `fireAt` forward by exactly
   * the paused interval. Recomputing that here would be a second copy of the
   * server's arithmetic, and the two would drift the first time either changed.
   */
  async function setPaused(next: boolean) {
    if (!session) return;
    setBusy(true);
    try {
      const { session: updated } = next ? await api.pause(session.id) : await api.resume(session.id);
      if (updated) {
        setSession(updated);
        setRemaining(updated.secondsRemaining);
      }
      setOutage(null);
    } catch (err) {
      setOutage(
        err instanceof ApiError ? err.message : `Could not ${next ? 'pause' : 'resume'} the timer.`,
      );
    } finally {
      setBusy(false);
    }
  }

  /**
   * Bring the lock forward.
   *
   * The whole session is replaced from the response for the same reason pause
   * and resume do it: the server owns the arithmetic, including the clamp at
   * the present moment, and recomputing the new deadline here would be a second
   * copy of it that drifts the first time either side changes.
   *
   * Re-scheduling is not done here either. The effect that hands the shell its
   * wake-up time already watches `session.fireAt`, so setting the session is
   * what moves the native schedule — doing it again by hand would be two
   * schedules for one deadline.
   */
  async function shorten(minutes: number) {
    if (!session) return;
    setBusy(true);
    try {
      const { session: updated } = await api.shorten(session.id, minutes);
      if (updated) {
        setSession(updated);
        setRemaining(updated.secondsRemaining);
      }
      setOutage(null);
    } catch (err) {
      setOutage(err instanceof ApiError ? err.message : 'Could not shorten the timer.');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Take the screen now.
   *
   * Expressed as a shortening rather than as its own endpoint, so there is
   * exactly one path that moves a deadline and exactly one place the clamp
   * lives. The minutes sent are whatever is left, rounded up: the server floors
   * the result at the present moment, so overshooting by a fraction is the
   * intended way to hit zero rather than an off-by-one to be avoided.
   *
   * The lock itself still lands through the ordinary engage path once the
   * session is due. Nothing here assigns a problem, because a problem chosen
   * anywhere but at fire time is a problem that could have been prefetched.
   */
  async function lockNow() {
    if (remaining === null) return;
    setConfirmLockNow(false);
    await shorten(Math.max(1, Math.ceil(remaining / 60)));
  }

  /**
   * Stop the timer outright.
   *
   * Confirmed rather than immediate: it sits beside the pause button and it ends
   * the block. The server records no failure for it — nothing was ever assigned
   * to fail at — so the cost is the lost interval, not the difficulty ladder.
   */
  async function reset() {
    if (!session) return;
    setBusy(true);
    try {
      await api.cancel(session.id);
      setSession(null);
      setRemaining(null);
      setConfirmReset(false);
      setOutage(null);
      // The stats panel counts sessions, so re-read it rather than guess at
      // what cancelling did.
      void refresh();
    } catch (err) {
      setOutage(err instanceof ApiError ? err.message : 'Could not reset the timer.');
    } finally {
      setBusy(false);
    }
  }

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

  /**
   * Turn the repeat off, from here.
   *
   * It does not touch the session already running: a countdown that is armed
   * keeps its deadline, and stopping the repeat is a promise about the *next*
   * one. Cancelling the current lock from a button labelled "stop repeating"
   * would be a free reset, which is the one thing this product may never offer.
   */
  async function stopRepeating() {
    if (!timer) return;
    const previous = timer;
    setTimer({ ...timer, autoRearm: false });
    setBusy(true);
    try {
      const { timerConfig } = await api.saveTimer({ autoRearm: false });
      setTimer(timerConfig);
    } catch (err) {
      setTimer(previous);
      setOutage(err instanceof ApiError ? err.message : 'Could not stop the repeat.');
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
      <button type="button" onClick={onRetry} className="btn btn-quiet" style={{ marginTop: 10 }}>
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

