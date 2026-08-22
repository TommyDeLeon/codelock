'use client';

import { DIFFICULTIES, type StatsSummary, type UserProgress } from '@codelock/shared';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

/**
 * The game layer.
 *
 * Three mechanics, all of them real fields rather than invented currency: the
 * tier you are on, the streak that moves you, and how close you run to the best
 * known answer. No XP, no coins, no levels beyond the three the backend has.
 *
 * Rendered as instrumentation — thin bars, pips and mono figures — because
 * these numbers mean something and should look like measurements. Colour is
 * reward-only: green is the thing the user is trying to make appear, and a
 * monochrome panel is one that has not earned it yet.
 *
 * Every threshold comes from the API so this copy cannot drift from the rules
 * the backend actually enforces.
 */
export function ProgressCard({
  progress,
  speed,
}: {
  progress: UserProgress;
  speed?: StatsSummary['speed'];
}) {
  const {
    currentDifficulty,
    consecutiveFastSolves,
    consecutiveFailures,
    promoteAfterFastSolves,
    demoteAfterFailures,
  } = progress;

  const atTop = currentDifficulty === 'HARD';
  const tierIndex = DIFFICULTIES.indexOf(currentDifficulty);
  const nextTier = DIFFICULTIES[tierIndex + 1];

  return (
    <Card>
      <CardHeader className="flex items-baseline justify-between">
        <CardTitle>Progress</CardTitle>
        <span className="font-mono text-[11px] uppercase tracking-wider text-faint">
          {currentDifficulty.toLowerCase()}
        </span>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* --- 1. Tier ladder -------------------------------------------- */}
        <section>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Tier</p>
          <ol className="mt-2 flex items-center gap-1" aria-label="Difficulty ladder">
            {DIFFICULTIES.map((tier, i) => (
              <li key={tier} className="flex-1">
                <div
                  className={cn(
                    'h-1 rounded-xs transition-colors duration-500',
                    i <= tierIndex ? 'bg-accent' : 'bg-surface-2',
                  )}
                />
                <span
                  className={cn(
                    'mt-1.5 block font-mono text-[10.5px] uppercase tracking-wider',
                    i === tierIndex ? 'text-fg' : 'text-faint',
                  )}
                >
                  {tier.toLowerCase()}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* --- 2. Streak -------------------------------------------------- */}
        <section>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Streak</p>
          <div className="mt-2 flex items-center gap-3">
            <div
              className="flex items-center gap-1.5"
              role="img"
              aria-label={`${consecutiveFastSolves} of ${promoteAfterFastSolves} fast solves`}
            >
              {Array.from({ length: promoteAfterFastSolves }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    'size-2.5 rounded-full transition-colors duration-500',
                    i < consecutiveFastSolves
                      ? 'bg-accent'
                      : 'border border-border-strong bg-transparent',
                  )}
                />
              ))}
            </div>
            {/* The rule in words, always. This product never shows a number the
                user cannot interrogate. */}
            <p className="font-mono text-[12px] text-muted">
              {atTop
                ? `${consecutiveFastSolves} fast solves in a row`
                : `${consecutiveFastSolves} / ${promoteAfterFastSolves} fast solves to ${nextTier?.toLowerCase()}`}
            </p>
          </div>

          {/* Stated as a fact, never as a threat. This app can take your screen
              away; loss-aversion pressure on top of that would be coercive. */}
          <p className="mt-2 text-[12.5px] text-faint">
            {consecutiveFailures > 0
              ? `${consecutiveFailures} of ${demoteAfterFailures} failed sessions toward easing back down.`
              : 'A solve inside the problem’s average time counts as fast. One slow solve resets the streak.'}
          </p>
        </section>

        {/* --- 3. Rank ---------------------------------------------------- */}
        <section>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
            Against the record
          </p>

          {speed && speed.medianRatio !== null && speed.medianRatio > 0 ? (
            <>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="tabular font-mono text-2xl font-semibold text-fg">
                  {speed.medianRatio.toFixed(2)}×
                </span>
                <span className="text-[12.5px] text-muted">off the best known answer</span>
              </div>

              {/* 1.00x is the record, so the bar fills as you approach it. */}
              <div
                className="mt-3 h-1 w-full overflow-hidden rounded-xs bg-surface-2"
                role="progressbar"
                aria-valuenow={Math.round(Math.min(1, 1 / speed.medianRatio) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="How close your solves run to the record"
              >
                <div
                  className="h-full bg-accent transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.min(100, (1 / speed.medianRatio) * 100)}%` }}
                />
              </div>

              <p className="mt-2 font-mono text-[12px] text-faint">
                median of {speed.sampleSize} solve{speed.sampleSize === 1 ? '' : 's'}
                {speed.recordsHeld > 0 && (
                  <>
                    {' · '}
                    <span className="text-accent">
                      {speed.recordsHeld} record{speed.recordsHeld === 1 ? '' : 's'} held
                    </span>
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[12.5px] text-faint">
              No ratio yet. Solve a problem that already has a recorded best and your distance from
              it appears here.
            </p>
          )}
        </section>
      </CardBody>
    </Card>
  );
}
