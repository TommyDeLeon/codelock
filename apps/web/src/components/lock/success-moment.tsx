'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import type { Accomplishment, FeedbackFeeling } from '@codelock/shared';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * The moment after a solve.
 *
 * What it is for: saying specifically what was achieved, showing the code do
 * something, confirming the progress is saved, and then getting out of the
 * way. The lock is already released when this appears, and both ways forward
 * are equally easy — finishing is never harder than continuing.
 *
 * What it deliberately is not: a celebration anyone has to sit through, a
 * streak, a score, or a nudge to do one more. Motion is short and optional,
 * and sound is off unless the learner turns it on.
 */

interface Prefs {
  motion: 'system' | 'on' | 'off';
  sound: boolean;
}

const PREFS_KEY = 'codelock.successPrefs';
const DEFAULT_PREFS: Prefs = { motion: 'system', sound: false };

function readPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs: Prefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // A preference that cannot be saved still applies for this screen.
  }
}

function motionAllowed(prefs: Prefs): boolean {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  return prefs.motion === 'on' || (prefs.motion === 'system' && !reduced);
}

/** Two soft notes. Only ever played when the learner has turned sound on. */
function chime() {
  try {
    const Context =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const ctx = new Context();
    [523.25, 783.99].forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = frequency;
      osc.type = 'sine';
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.06, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    window.setTimeout(() => void ctx.close(), 900);
  } catch {
    // Sound is decoration. It must never break the screen.
  }
}

const KIND_LABELS: Record<Accomplishment['kind'], string> = {
  independent: 'Solved on your own',
  assisted: 'Solved with help',
  worked_solution: 'Studied a solution',
  recall: 'Remembered after a gap',
  transfer: 'Applied to a new problem',
};

export function SuccessMoment({
  submissionId,
  onFinish,
  finishLabel = 'Finish — progress saved',
}: {
  /** The accepted submission. Its success moment is written just after grading. */
  submissionId: string | null;
  onFinish: () => void;
  finishLabel?: string;
}) {
  const [accomplishment, setAccomplishment] = useState<Accomplishment | null>(null);
  const [loading, setLoading] = useState(submissionId !== null);

  // A few short tries, then stop. The buttons work the whole time; this only
  // fills in the words.
  useEffect(() => {
    if (!submissionId) return;
    let cancelled = false;
    let tries = 0;
    const load = async () => {
      tries++;
      try {
        const result = await api.progress.accomplishment(submissionId);
        if (cancelled) return;
        // Trusted only when every part this screen renders has the right shape,
        // so malformed saved data falls back to the plain message, not a crash.
        const a = result.accomplishment as Partial<Accomplishment> | null;
        const valid =
          !!a &&
          typeof a.headline === 'string' &&
          typeof a.helpSummary === 'string' &&
          typeof a.kind === 'string' &&
          Object.prototype.hasOwnProperty.call(KIND_LABELS, a.kind) &&
          Array.isArray(a.details) &&
          a.details.every((d) => typeof d === 'string') &&
          Array.isArray(a.skills) &&
          a.skills.every(
            (s) =>
              !!s &&
              typeof s.skill === 'string' &&
              typeof s.label === 'string' &&
              typeof s.stateLabel === 'string' &&
              typeof s.independent === 'number' &&
              typeof s.assisted === 'number',
          ) &&
          (a.variation == null ||
            (typeof a.variation.title === 'string' && typeof a.variation.why === 'string')) &&
          // Newer fields, optional on older rows. An unknown surface must not
          // default to motion and sound; it is dropped and the row treated as
          // full-by-omission only when the field is genuinely absent.
          (a.surface === undefined || a.surface === 'full' || a.surface === 'quiet') &&
          (a.events === undefined ||
            (Array.isArray(a.events) &&
              a.events.every((e) => !!e && typeof e.kind === 'string' && typeof e.note === 'string')));
        if (valid) {
          setAccomplishment(a as Accomplishment);
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to another try, then give up quietly.
      }
      if (!cancelled && tries < 8) window.setTimeout(() => void load(), 400);
      else if (!cancelled) setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [animate, setAnimate] = useState(false);
  const [feeling, setFeeling] = useState<FeedbackFeeling | 'dismissed' | null>(null);
  const played = useRef(false);

  useEffect(() => {
    setPrefs(readPrefs());
  }, []);

  // Which moment this is. Full is the existing motion and chime; quiet is the
  // headline and one detail, still. Decided by the server from what the solve
  // showed (see docs/reward-and-stretch.md), never by chance here. Older rows
  // and a moment that never loads fall back to full, which is what they were.
  const surface = accomplishment?.surface ?? (loading ? null : 'full');
  const full = surface === 'full';

  // The chime waits for the surface to be known and plays once, on the
  // moment becoming full — never on a later preference change, which would
  // make a settings toggle sound like a solve.
  useEffect(() => {
    if (!full || played.current) return;
    if (readPrefs().sound) {
      played.current = true;
      chime();
    }
  }, [full]);

  // Motion follows the prefs live, so turning it off mid-screen stops it.
  useEffect(() => {
    setAnimate(full && motionAllowed(prefs));
  }, [full, prefs]);

  function update(next: Prefs) {
    setPrefs(next);
    writePrefs(next);
  }

  function sendFeeling(value: FeedbackFeeling) {
    setFeeling(value);
    void api.tutor.feedback({ kind: 'success', feeling: value }).catch(() => undefined);
  }

  const a = accomplishment;

  // On the full surface the rarer events lead: what the learner could not do
  // before this solve. `solved` is never listed; the headline already says it.
  const eventNotes = full ? (a?.events ?? []).filter((e) => e.kind !== 'solved').map((e) => e.note) : [];
  const details = a ? [...new Set([...eventNotes, ...a.details])].slice(0, full ? 5 : 1) : [];

  return (
    <main id="main" className="flex min-h-dvh justify-center overflow-y-auto bg-bg px-4 py-10">
      <div className={cn('w-full max-w-xl', animate && 'success-rise')} data-surface={surface ?? 'pending'}>
        <p className="flex items-center gap-2 text-[13px] font-semibold text-success">
          <span className="flex size-6 items-center justify-center rounded-full bg-success-soft">
            <Check className="size-3.5" aria-hidden />
          </span>
          {a ? KIND_LABELS[a.kind] : 'All tests passed'}
        </p>

        <h1 className="mt-3 text-2xl font-semibold leading-snug tracking-tight" role="status">
          {a ? a.headline : 'Your solution passed every test. Your progress is saved.'}
        </h1>
        {!a && loading && <p className="mt-2 text-[13px] text-muted">Working out what this solve showed…</p>}

        {a && details.length > 0 && (
          <ul aria-label="What this solve showed" className="mt-4 space-y-1.5 text-[15px] leading-relaxed">
            {details.map((detail) => (
              <li key={detail} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-success" />
                {detail}
              </li>
            ))}
          </ul>
        )}

        {a && <p className="mt-3 text-[13px] text-muted">{a.helpSummary}</p>}

        {a && full && a.skills.length > 0 && (
          <section aria-label="Skills" className="mt-6">
            <h2 className="text-[13px] font-semibold">Saved to your skill map</h2>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {a.skills.map((skill) => (
                <li key={skill.skill} className="rounded-sm border border-border px-3 py-2 text-[13px]">
                  <p className="font-medium">{skill.label}</p>
                  <p className="text-muted">
                    {skill.stateLabel} · {skill.independent} on your own · {skill.assisted} with help
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8">
          <Button size="lg" variant="outline" onClick={onFinish} autoFocus>
            {finishLabel}
          </Button>
        </div>
        {a?.variation && (
          <p className="mt-2 text-[13px] text-muted">
            If you want more later: {a.variation.title}. {a.variation.why}
          </p>
        )}

        {a?.askFeedback && feeling === null && (
          <section aria-label="Optional feedback" className="mt-8 border-t border-border pt-4 text-[13px]">
            <p>Optional: how did that feel?</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(['satisfying', 'fine', 'flat', 'frustrating'] as FeedbackFeeling[]).map((value) => (
                <Button key={value} size="sm" variant="ghost" onClick={() => sendFeeling(value)}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setFeeling('dismissed')}>
                Skip
              </Button>
            </div>
          </section>
        )}
        {feeling !== null && feeling !== 'dismissed' && (
          <p className="mt-6 text-[13px] text-muted">Thanks — noted.</p>
        )}

        <details className="mt-8 text-[12px] text-muted">
          <summary className="cursor-pointer">Motion and sound</summary>
          <div className="mt-2 flex flex-wrap gap-4">
            <label className="flex items-center gap-1.5">
              Motion
              <select
                value={prefs.motion}
                onChange={(event) => update({ ...prefs, motion: event.target.value as Prefs['motion'] })}
                className="rounded-xs border border-border bg-bg px-1 py-0.5"
              >
                <option value="system">Follow system</option>
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={prefs.sound}
                onChange={(event) => update({ ...prefs, sound: event.target.checked })}
              />
              Soft sound after a solve
            </label>
          </div>
        </details>
      </div>
    </main>
  );
}

