'use client';

import type { SolveStanding } from '@codelock/shared';

/**
 * The two things worth saying after a correct run that the speed gate does not
 * already say: you beat your own time, and — rarely — you beat everyone's.
 *
 * Both are measurements. There is no score here, no currency and no streak
 * guilt; the reward is a green number appearing on an otherwise ink-on-paper
 * screen, which is the whole mechanism and is enough.
 */
export function Standing({ standing }: { standing: SolveStanding }) {
  const improved = standing.personalBestDeltaMs !== null && standing.personalBestDeltaMs < 0;

  // Nothing earned, nothing to announce. An ordinary solve gets no celebration:
  // getting the machine back is the reward.
  if (!standing.recordBroken && !improved) return null;

  return (
    <div className="px-4 py-3">
      {standing.recordBroken && (
        <div className="animate-record -mx-4 mb-2 border-y border-success/40 bg-success-soft px-4 py-2">
          <p className="tabular text-[13px] font-semibold text-success">
            New record. You are the fastest known answer to this problem.
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            The budget for everyone who attempts it next just moved to{' '}
            <span className="tabular">{standing.newGateMs} ms</span>.
          </p>
        </div>
      )}

      {improved && (
        <p className="text-[13px] text-muted">
          <span className="tabular font-semibold text-success">
            {standing.personalBestDeltaMs} ms
          </span>{' '}
          on your previous best of{' '}
          <span className="tabular">{standing.previousBestMs} ms</span>.
        </p>
      )}

      <p className="sr-only" role="status">
        {standing.recordBroken
          ? `New record. The budget for this problem is now ${standing.newGateMs} milliseconds.`
          : `${Math.abs(standing.personalBestDeltaMs!)} milliseconds faster than your previous best.`}
      </p>
    </div>
  );
}
