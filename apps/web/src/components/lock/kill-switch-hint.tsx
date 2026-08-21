'use client';

import { useEffect, useState } from 'react';
import { isDesktop, onHoldProgress, type HoldProgress } from '@/lib/desktop-bridge';

/**
 * The way out, stated on screen.
 *
 * An escape hatch nobody can find is the same as no escape hatch, and a lock
 * screen with no visible exit is the kind of thing people uninstall in a panic
 * at 2am. So it is always on screen while locked, and it says what it costs:
 * abandoning counts as a failure, which is what stops it becoming the default
 * way to dismiss the lock.
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center p-3"
      // Announced only while actually counting down; a permanent live region
      // would have a screen reader repeat the hint on every render.
      aria-live={holding ? 'assertive' : 'off'}
    >
      <div
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
          holding
            ? 'border-danger bg-danger-soft text-danger'
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
              aria-label="Hold to abandon"
              className="h-1 w-16 overflow-hidden rounded-xs bg-danger/20"
            >
              <span
                className="block h-full bg-danger"
                style={{ width: `${(progress?.fraction ?? 0) * 100}%` }}
              />
            </span>
            <span>Keep holding — abandoning in {seconds}s</span>
          </>
        ) : (
          <span>
            Stuck? Hold <kbd className="font-medium text-muted">Esc</kbd> for 10 seconds to abandon.
            It counts as a failed session.
          </span>
        )}
      </div>
    </div>
  );
}
