import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Accomplishment } from '@codelock/shared';
import { api } from './api';

/**
 * The moment after a solve, inside the desktop app.
 *
 * When a lock releases, the shell returns to the dashboard, and the newest
 * solve takes over the window once: a drawn check, a few sparks, a soft chime,
 * and what the solve actually showed. "Finish — progress saved" closes it.
 *
 * It celebrates something specific rather than handing out points. Motion and
 * the chime are on by default and switch off in Settings; the system
 * reduced-motion setting always wins over motion.
 */

const SEEN_KEY = 'codelock.celebrated';
const PREFS_KEY = 'codelock.celebrationPrefs';
/** Only solves this recent are celebrated; an old one would feel random. */
const FRESH_MS = 15 * 60 * 1000;

export interface CelebrationPrefs {
  motion: boolean;
  sound: boolean;
}

const DEFAULT_PREFS: CelebrationPrefs = { motion: true, sound: true };

export function readCelebrationPrefs(): CelebrationPrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw === null) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<CelebrationPrefs> | null;
    return {
      motion: typeof parsed?.motion === 'boolean' ? parsed.motion : DEFAULT_PREFS.motion,
      sound: typeof parsed?.sound === 'boolean' ? parsed.sound : DEFAULT_PREFS.sound,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writeCelebrationPrefs(prefs: CelebrationPrefs): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Applies for this session even if it cannot be saved.
  }
}

const KIND_LABELS: Record<Accomplishment['kind'], string> = {
  independent: 'Solved on your own',
  assisted: 'Solved with help',
  worked_solution: 'Studied a solution',
  recall: 'Remembered after a gap',
  transfer: 'Applied to a new problem',
};

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
export function chime(): void {
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

/** Saved data is only trusted when every part this screen renders has the right shape. */
function isAccomplishment(value: unknown): value is Accomplishment {
  const a = value as Partial<Accomplishment> | null;
  if (!a || typeof a !== 'object') return false;
  if (typeof a.headline !== 'string' || typeof a.helpSummary !== 'string') return false;
  if (typeof a.kind !== 'string' || !Object.prototype.hasOwnProperty.call(KIND_LABELS, a.kind)) return false;
  if (!Array.isArray(a.details) || !a.details.every((d) => typeof d === 'string')) return false;
  if (
    !Array.isArray(a.skills) ||
    !a.skills.every(
      (s) =>
        !!s &&
        typeof s === 'object' &&
        typeof s.skill === 'string' &&
        typeof s.label === 'string' &&
        typeof s.stateLabel === 'string',
    )
  ) {
    return false;
  }
  if (a.variation != null && (typeof a.variation !== 'object' || typeof a.variation.title !== 'string')) {
    return false;
  }
  return true;
}

/**
 * The celebration on screen, kept outside the component, so switching tabs
 * before pressing Finish neither loses it nor chimes and animates again.
 */
let current: { submissionId: string; accomplishment: Accomplishment } | null = null;
let currentSolvedAt = 0;
let chimed: string | null = null;
let animated: string | null = null;

const SPARKS = [
  { dx: '-120px', dy: '-80px', delay: 160 },
  { dx: '124px', dy: '-72px', delay: 220 },
  { dx: '-140px', dy: '24px', delay: 280 },
  { dx: '142px', dy: '30px', delay: 200 },
  { dx: '-52px', dy: '-128px', delay: 260 },
  { dx: '60px', dy: '-124px', delay: 320 },
  { dx: '-96px', dy: '96px', delay: 340 },
  { dx: '100px', dy: '92px', delay: 240 },
];

export function Celebration() {
  if (current && Date.now() - currentSolvedAt > FRESH_MS) current = null;
  const [item, setItem] = useState(current);
  const finishRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const check = useCallback(async () => {
    try {
      const latest = await api.latestAccomplishment();
      // Every "nothing new" answer keeps the retries going: a newer solve may
      // still be being written.
      if (!latest.submissionId || !latest.sessionId || !latest.at) return false;
      if (!isAccomplishment(latest.accomplishment)) return false;
      const solvedAt = new Date(latest.at).getTime();
      if (!Number.isFinite(solvedAt) || Date.now() - solvedAt > FRESH_MS) return false;
      if (seen() === latest.submissionId) return false;
      if (current?.submissionId === latest.submissionId) return false;
      current = { submissionId: latest.submissionId, accomplishment: latest.accomplishment };
      currentSolvedAt = solvedAt;
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

  const prefs = readCelebrationPrefs();
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const animate = item !== null && prefs.motion && !reduced && animated !== item.submissionId;

  useEffect(() => {
    if (!item) return;
    animated = item.submissionId;
    if (readCelebrationPrefs().sound && chimed !== item.submissionId) {
      chimed = item.submissionId;
      chime();
    }
    finishRef.current?.focus();
  }, [item]);

  const finish = useCallback(() => {
    if (!item) return;
    markSeen(item.submissionId);
    current = null;
    setItem(null);
  }, [item]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (item && dialog && !dialog.open) dialog.showModal();
    finishRef.current?.focus();
  }, [item]);

  if (!item) return null;
  const a = item.accomplishment;

  return (
    // A native modal dialog: the dashboard behind it is inert, focus stays
    // inside, and Escape arrives as a cancel event.
    <dialog
      ref={dialogRef}
      aria-labelledby="celebration-title"
      className={animate ? 'cl-animate' : undefined}
      onCancel={(event) => {
        event.preventDefault();
        finish();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        maxWidth: 'none',
        maxHeight: 'none',
        margin: 0,
        border: 'none',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        color: 'var(--fg)',
        background: 'color-mix(in srgb, var(--bg) 82%, transparent)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        className="cl-rise"
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '100%',
          overflowY: 'auto',
          textAlign: 'center',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)',
          padding: '40px 36px 32px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ position: 'relative', width: 104, height: 104, margin: '0 auto' }}>
          {animate &&
            SPARKS.map((spark, i) => (
              <span
                key={i}
                aria-hidden
                className="cl-spark"
                style={
                  {
                    position: 'absolute',
                    left: 47,
                    top: 47,
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: i % 2 ? 'var(--accent)' : 'var(--warning)',
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
              width: 104,
              height: 104,
              borderRadius: 999,
              background: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <svg width="50" height="50" viewBox="0 0 24 24" aria-hidden>
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

        <p
          className="eyebrow"
          style={{ margin: '22px 0 0', color: 'var(--accent)' }}
        >
          {KIND_LABELS[a.kind]}
        </p>
        <h2
          id="celebration-title"
          style={{ margin: '8px 0 0', fontSize: 28, lineHeight: 1.2, fontWeight: 600 }}
        >
          {a.headline}
        </h2>

        {a.details.length > 0 && (
          <ul
            style={{
              margin: '18px auto 0',
              padding: 0,
              listStyle: 'none',
              fontSize: 15,
              lineHeight: 1.7,
              maxWidth: 480,
            }}
          >
            {a.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}

        {a.skills.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 18 }}>
            {a.skills.map((skill) => (
              <span
                key={skill.skill}
                style={{
                  fontSize: 12.5,
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  padding: '4px 12px',
                  color: 'var(--muted)',
                }}
              >
                {skill.label} · {skill.stateLabel}
              </span>
            ))}
          </div>
        )}

        <p style={{ margin: '18px 0 0', fontSize: 13, color: 'var(--muted)' }}>
          {a.helpSummary}
          {a.variation ? ` If you want more later: ${a.variation.title}.` : ''}
        </p>

        <button
          ref={finishRef}
          type="button"
          onClick={finish}
          className="btn btn-primary"
          style={{ marginTop: 26 }}
        >
          Finish — progress saved
        </button>
      </div>
    </dialog>
  );
}
