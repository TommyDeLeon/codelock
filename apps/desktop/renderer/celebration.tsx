import { useCallback, useEffect, useRef, useState } from 'react';
import type { Accomplishment } from '@codelock/shared';
import { api } from './api';

/**
 * The moment after a solve, inside the desktop app.
 *
 * When a lock releases, the shell returns straight to this dashboard, so the
 * lock screen's own success page never gets a chance to appear. This fills
 * that gap: the newest accomplishment, shown once, with a short celebration.
 *
 * It celebrates something specific — what the solve actually showed — rather
 * than handing out points. It never blocks: the dashboard is fully usable
 * underneath, and "Finish" closes it. Motion and sound each have a switch, and
 * reduced motion is always respected.
 */

const SEEN_KEY = 'codelock.celebrated';
const PREFS_KEY = 'codelock.celebrationPrefs';
/** Only solves this recent are celebrated; an old one would feel random. */
const FRESH_MS = 15 * 60 * 1000;

interface Prefs {
  motion: boolean;
  sound: boolean;
}

const KIND_LABELS: Record<Accomplishment['kind'], string> = {
  independent: 'Solved on your own',
  assisted: 'Solved with help',
  worked_solution: 'Studied a solution',
  recall: 'Remembered after a gap',
  transfer: 'Applied to a new problem',
};

function readPrefs(): Prefs {
  // Motion on, sound off: the animation marks the moment without startling
  // anyone who unlocks in a quiet room or while listening to something else.
  const fallback: Prefs = { motion: true, sound: false };
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw === null ? fallback : { ...fallback, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return fallback;
  }
}

function seen(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function markSeen(submissionId: string) {
  try {
    window.localStorage.setItem(SEEN_KEY, submissionId);
  } catch {
    // Worst case it shows again next launch.
  }
}

/** Three soft rising notes. Decoration only; never allowed to throw. */
function chime() {
  try {
    const ctx = new AudioContext();
    [523.25, 659.25, 783.99].forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      const start = ctx.currentTime + i * 0.11;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.07, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
    window.setTimeout(() => void ctx.close(), 1200);
  } catch {
    // No audio device, or blocked. Nothing to do.
  }
}

const SPARKS = [
  { dx: '-46px', dy: '-38px', delay: 180 },
  { dx: '48px', dy: '-34px', delay: 240 },
  { dx: '-54px', dy: '12px', delay: 300 },
  { dx: '56px', dy: '16px', delay: 220 },
  { dx: '-18px', dy: '-58px', delay: 280 },
  { dx: '20px', dy: '54px', delay: 340 },
];

/**
 * The celebration currently on screen, kept outside the component.
 *
 * Switching to another tab unmounts the dashboard. Held here, the same moment
 * is still there on return — without a second chime — until Finish is pressed.
 */
let current: { submissionId: string; accomplishment: Accomplishment } | null = null;
let chimed: string | null = null;

/** Saved data is only trusted when it has the shape this screen renders. */
function isAccomplishment(value: unknown): value is Accomplishment {
  const a = value as Partial<Accomplishment> | null;
  return (
    !!a &&
    typeof a.headline === 'string' &&
    typeof a.kind === 'string' &&
    a.kind in KIND_LABELS &&
    typeof a.helpSummary === 'string' &&
    Array.isArray(a.details) &&
    Array.isArray(a.skills)
  );
}

export function Celebration() {
  const [item, setItem] = useState(current);
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const played = useRef<string | null>(chimed);

  const check = useCallback(async () => {
    if (current) return true;
    try {
      const latest = await api.latestAccomplishment();
      // Only a solve that opened a lock, judged by when it was solved.
      if (!latest.submissionId || !latest.sessionId || !latest.at) return false;
      if (!isAccomplishment(latest.accomplishment)) return false;
      if (Date.now() - new Date(latest.at).getTime() > FRESH_MS) return false;
      if (seen() === latest.submissionId) return false;
      current = { submissionId: latest.submissionId, accomplishment: latest.accomplishment };
      setItem(current);
      return true;
    } catch {
      return false;
    }
  }, []);

  // The accomplishment is written a moment after the unlock, so keep looking
  // for about half a minute after the dashboard appears, and again whenever
  // the window comes back into focus.
  useEffect(() => {
    let tries = 0;
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      const found = await check();
      tries++;
      if (!found && tries < 20 && !stopped) window.setTimeout(() => void tick(), 1500);
    };
    void tick();
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);
    return () => {
      stopped = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [check]);

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const animate = prefs.motion && !reduced;

  useEffect(() => {
    if (item && prefs.sound && played.current !== item.submissionId) {
      played.current = item.submissionId;
      chimed = item.submissionId;
      chime();
    }
  }, [item, prefs.sound]);

  if (!item) return null;
  const a = item.accomplishment;

  const update = (next: Prefs) => {
    setPrefs(next);
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      // Applies for now even if it cannot be saved.
    }
  };

  const finish = () => {
    markSeen(item.submissionId);
    current = null;
    setItem(null);
  };

  return (
    <section
      aria-label="You solved it"
      className={animate ? 'cl-animate' : undefined}
      style={{
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface)',
        padding: '22px 24px',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 20,
        alignItems: 'start',
      }}
    >
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        {animate &&
          SPARKS.map((spark, i) => (
            <span
              key={i}
              aria-hidden
              className="cl-spark"
              style={
                {
                  position: 'absolute',
                  left: 29,
                  top: 29,
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: 'var(--accent)',
                  animationDelay: `${spark.delay}ms`,
                  '--dx': spark.dx,
                  '--dy': spark.dy,
                } as React.CSSProperties
              }
            />
          ))}
        <div
          className="cl-badge"
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: 'var(--accent)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
            <path
              className="cl-check"
              d="M5 12.5l4.5 4.5L19 7.5"
              fill="none"
              stroke="var(--accent-fg)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="cl-rise" style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}
        >
          {KIND_LABELS[a.kind]}
        </p>
        <h2
          role="status"
          style={{ margin: '6px 0 0', fontFamily: 'var(--display)', fontSize: 24, lineHeight: 1.25, fontWeight: 600 }}
        >
          {a.headline}
        </h2>

        {a.details.length > 0 && (
          <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
            {a.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}

        {a.skills.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            {a.skills.map((skill) => (
              <span
                key={skill.skill}
                style={{
                  fontSize: 12,
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  padding: '3px 10px',
                  color: 'var(--muted)',
                }}
              >
                {skill.label} · {skill.stateLabel}
              </span>
            ))}
          </div>
        )}

        <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--muted)' }}>
          {a.helpSummary} It is on your Progress tab.
          {a.variation ? ` If you want more later: ${a.variation.title}.` : ''}
        </p>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
          <button
            type="button"
            onClick={finish}
            autoFocus
            style={{
              font: 'inherit',
              fontSize: 14,
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--accent)',
              color: 'var(--accent-fg)',
              cursor: 'pointer',
            }}
          >
            Finish — progress saved
          </button>
          {/* Tucked away so the card reads as a moment, not a settings panel. */}
          <details style={{ fontSize: 12, color: 'var(--muted)' }}>
            <summary style={{ cursor: 'pointer' }}>Motion and sound</summary>
            <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={prefs.motion}
                  onChange={(e) => update({ ...prefs, motion: e.target.checked })}
                />
                Motion
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={prefs.sound}
                  onChange={(e) => update({ ...prefs, sound: e.target.checked })}
                />
                Soft chime
              </label>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
