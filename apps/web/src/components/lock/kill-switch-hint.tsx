'use client';

import { useEffect, useState } from 'react';
import { isDesktop, onHoldProgress, type HoldProgress } from '@/lib/desktop-bridge';

/**
 * The way out, stated on screen.
 *
 * An escape hatch nobody can find is the same as no escape hatch, and a lock
 * screen with no visible exit is the kind of thing people uninstall in a panic
 * at 2am. So it is always on screen while locked.
 *
 * What it does *not* do is call the exit a failure.
 *
 * It used to read "It counts as a failed session", which was true in the sense
 * that the ladder counts it, and wrong in every sense that matters. It is the
 * exit people actually use, read at the moment they are least able to hear a
 * telling-off, and the dashboard has always called the same event "stepped
 * away". The lock screen was the only surface scolding anyone for it.
 *
 * The honest, useful version of the same fact is that the ladder notices and
 * responds by easing off — two stepped-away sessions lower the difficulty. The
 * mechanism is unchanged; the sentence stops framing a supported way out as a
 * personal failing.
 *
 * Desktop only — in a browser the tab close button is the escape hatch.
 */
export function KillSwitchHint() {
  const [progress, setProgress] = useState<HoldProgress | null>(null);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    setDesktop(isDesktop());
    return onHoldProgress(setProgress);
  }, []);

  if (!desktop) return null;

  const holding = progress?.holding ?? false;
  const seconds = Math.ceil((progress?.msRemaining ?? 0) / 1000);

  return (
    <div
      // A bar under the workspace rather than a pill floating over it, so it
      // can never cover the output or an error someone is trying to read.
      className="flex shrink-0 justify-center border-t border-border bg-bg px-3 py-1.5"
      // Announced only while actually counting down; a permanent live region
      // would have a screen reader repeat the hint on every render.
      aria-live={holding ? 'assertive' : 'off'}
    >
      <div
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
          holding
            // Not danger. Red means a failure in this product, and stepping
            // away is a supported exit — colouring the countdown red says the
            // opposite of every other decision here.
            ? 'border-accent bg-accent-soft text-accent'
            : 'border-border bg-surface text-faint'
        }`}
      >
        {holding ? (
          <>
            <span
              role="progressbar"
              aria-valuenow={Math.round((progress?.fraction ?? 0) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Hold to step away"
              className="h-1 w-16 overflow-hidden rounded-xs bg-accent/20"
            >
              <span
                className="block h-full bg-accent"
                style={{ width: `${(progress?.fraction ?? 0) * 100}%` }}
              />
            </span>
            <span>Keep holding — stepping away in {seconds}s</span>
          </>
        ) : (
          <span>
            Stuck? Hold <kbd className="font-medium text-muted">Esc</kbd> for 10 seconds to step
            away. Step away twice and the next problems ease off.
          </span>
        )}
      </div>
    </div>
  );
}
