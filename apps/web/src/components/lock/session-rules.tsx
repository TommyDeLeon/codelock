import { Clock, Gauge } from 'lucide-react';
import type { LockSessionView } from '@codelock/shared';

/**
 * The rules this lock is being judged by, stated while it is being enforced.
 *
 * Read-only, and deliberately so. These are chosen on the dashboard before a
 * lock arms and snapshotted onto the session, because a control reachable from
 * inside a lock that is going badly is not a setting — the speed gate would be
 * an unlock button, and the time budget would be a way to trade a hard problem
 * for an easy one. So this says what the rules are and offers no way to move
 * them.
 *
 * Saying them at all is the point. "Correct, but still locked" is only fair if
 * the learner can see which gate they are under, and a first solve that passes
 * without meeting the budget is confusing unless the screen already said the
 * budget would not apply.
 */
export function SessionRules({ session }: { session: LockSessionView }) {
  // An older server sends neither field. It only ever behaved one way: the
  // gate always applied, and there was no budget to speak of.
  const gateMode = session.speedGateMode ?? 'ALWAYS';
  const budget = session.timeBudgetMinutes ?? null;

  return (
    <section aria-label="How this session is judged" className="border-t border-border px-4 py-3">
      <ul className="space-y-1.5 text-[12px] text-muted">
        {budget !== null && (
          <li className="flex items-start gap-2">
            <Clock className="mt-0.5 size-3.5 shrink-0 text-faint" aria-hidden />
            <span>
              Chosen to fit <span className="tabular font-medium">{budget} minutes</span>.{' '}
              {session.overBudget === true
                ? 'Nothing at your level fitted, so this one runs longer — it opens the lock, but it will not move your level.'
                : 'Most people finish inside that.'}
            </span>
          </li>
        )}
        <li className="flex items-start gap-2">
          <Gauge className="mt-0.5 size-3.5 shrink-0 text-faint" aria-hidden />
          <span>
            {gateMode === 'ALWAYS'
              ? 'The speed gate applies: passing every test is not enough on its own.'
              : 'First time on this problem, passing every test is enough. Your time is measured either way.'}
          </span>
        </li>
      </ul>
      <p className="mt-2 text-[11px] text-faint">
        Both are set on the dashboard and fixed for the session once it starts.
      </p>
    </section>
  );
}
