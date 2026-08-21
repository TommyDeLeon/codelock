'use client';

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { DIFFICULTIES, type UserProgress } from '@codelock/shared';
import { Card, CardBody, CardHeader, CardTitle, DifficultyBadge } from '@/components/ui/primitives';
import { cn, formatCompact } from '@/lib/utils';

/**
 * The difficulty ladder, made legible.
 *
 * Users complain that adaptive systems feel arbitrary. The fix is showing the
 * rule and the current position in it — "2 of 3 fast solves" — rather than a
 * score that moves for unexplained reasons. Thresholds come from the API so the
 * copy cannot drift from the backend rules.
 */
export function ProgressCard({ progress }: { progress: UserProgress }) {
  const {
    currentDifficulty,
    consecutiveFastSolves,
    consecutiveFailures,
    promoteAfterFastSolves,
    demoteAfterFailures,
  } = progress;

  const atTop = currentDifficulty === 'HARD';
  const atBottom = currentDifficulty === 'EASY';

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Difficulty</CardTitle>
        <DifficultyBadge difficulty={currentDifficulty} />
      </CardHeader>

      <CardBody className="space-y-4">
        <ol className="flex items-center gap-1" aria-label="Difficulty ladder">
          {DIFFICULTIES.map((tier) => {
            const isCurrent = tier === currentDifficulty;
            return (
              <li key={tier} className="flex-1">
                <div
                  className={cn(
                    'h-1 rounded-xs',
                    isCurrent ? 'bg-fg' : 'bg-surface-2',
                  )}
                />
                <span
                  className={cn(
                    'mt-1.5 block text-[11px] uppercase tracking-wider',
                    isCurrent ? 'font-semibold text-fg' : 'text-faint',
                  )}
                >
                  {tier}
                  {isCurrent && <span className="sr-only"> (current level)</span>}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="space-y-2 border-t border-border pt-3">
          <LadderRow
            icon={atTop ? <Minus aria-hidden /> : <ArrowUp aria-hidden />}
            tone={atTop ? 'neutral' : 'success'}
            label={
              atTop
                ? 'Top of the ladder — nowhere further to climb.'
                : `${consecutiveFastSolves} of ${promoteAfterFastSolves} fast solves toward a promotion`
            }
            filled={consecutiveFastSolves}
            total={promoteAfterFastSolves}
            show={!atTop}
          />
          <LadderRow
            icon={atBottom ? <Minus aria-hidden /> : <ArrowDown aria-hidden />}
            tone={atBottom ? 'neutral' : 'danger'}
            label={
              atBottom
                ? 'Already at the gentlest level.'
                : `${consecutiveFailures} of ${demoteAfterFailures} misses before easing off`
            }
            filled={consecutiveFailures}
            total={demoteAfterFailures}
            show={!atBottom}
          />
        </div>

        <p className="text-[13px] text-muted">
          Typical solve time{' '}
          <strong className="font-medium text-fg tabular">
            {formatCompact(progress.emaSolveSeconds)}
          </strong>
          . A solve counts as fast when it beats the average for that problem.
        </p>
      </CardBody>
    </Card>
  );
}

function LadderRow({
  icon,
  label,
  tone,
  filled,
  total,
  show,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'success' | 'danger' | 'neutral';
  filled: number;
  total: number;
  show: boolean;
}) {
  const toneClass = {
    success: 'text-success',
    danger: 'text-danger',
    neutral: 'text-faint',
  }[tone];

  return (
    <div className="flex items-center gap-2.5">
      <span className={cn('[&_svg]:size-3.5', toneClass)}>{icon}</span>
      <span className="flex-1 text-[13px] text-muted">{label}</span>
      {show && (
        // Pips, not just a number: progress toward a threshold is easier to
        // read as discrete steps than as text.
        <span className="flex gap-1" aria-hidden>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'size-1.5 rounded-full',
                i < filled ? toneClass.replace('text-', 'bg-') : 'bg-surface-2',
              )}
            />
          ))}
        </span>
      )}
    </div>
  );
}
