import type { AccomplishmentKind, NearMiss, RewardEvent, RewardSurface } from '@codelock/shared';
import { SKILL_LABELS, type Skill, type SkillSnapshot } from '../skills.js';

/**
 * Reward as prediction error.
 *
 * ## Why
 *
 * The success moment fired identically on every solve. A signal that arrives
 * every time is fully predicted, and a fully predicted reward carries no
 * prediction error — which is the thing that makes a reward feel like
 * anything and the thing that drives learning (Schultz 2016; RESEARCH.md).
 * It also fades with repetition.
 *
 * So the moment is split from the solve. Events below name what the learner
 * could not do before this attempt. The full moment is reserved for them; a
 * plain solve is recorded exactly as before and shown quietly.
 *
 * ## What is deliberately absent
 *
 * No random draw: a lottery over plain solves is a variable-ratio schedule,
 * which is a controlling reward under Deci, Koestner & Ryan, not information.
 * No "faster than last time": it rewards rushing. No "fewer hints than last
 * time" as its own event: it invites spending hints on a first solve to bank
 * the event later; `first_unaided` covers the honest case.
 *
 * Pure. Everything here is derived from snapshots the success path already
 * computes, so no new query and no schema.
 */

export interface RewardInput {
  requiredSkills: readonly Skill[];
  skillsBefore: SkillSnapshot;
  skillsAfter: SkillSnapshot;
  /** Any hint or the worked solution before the solve. */
  assisted: boolean;
  kind: AccomplishmentKind;
}

/**
 * The events an accepted submission produced, rarest first, `solved` last.
 *
 * `values` is skipped when it is not the only skill, matching
 * `deriveAccomplishment`: every problem needs it, so it would fire on the
 * first two solves and never again.
 */
export function deriveRewardEvents(input: RewardInput): RewardEvent[] {
  const events: RewardEvent[] = [];
  const skills = input.requiredSkills.filter(
    (skill) => skill !== 'values' || input.requiredSkills.length === 1,
  );

  for (const skill of skills) {
    const before = input.skillsBefore[skill];
    const after = input.skillsAfter[skill];
    const label = SKILL_LABELS[skill];

    if (before.state === 'due_for_review' && after.state === 'demonstrated') {
      events.push({
        kind: 'review_held',
        skill,
        note: `“${label}” held after a gap: you solved this without help.`,
      });
      continue;
    }
    if (before.state !== 'demonstrated' && after.state === 'demonstrated') {
      events.push({
        kind: 'skill_demonstrated',
        skill,
        note: `“${label}”: you have now solved two separate problems without help.`,
      });
      continue;
    }
    if (
      !input.assisted &&
      before.state === 'practised_with_help' &&
      before.unaidedSolves === 0 &&
      after.unaidedSolves === 1
    ) {
      events.push({
        kind: 'first_unaided',
        skill,
        note: `First time on “${label}” without a hint. Before this you had help each time.`,
      });
    }
  }

  // Rarest first within the skill events, then the accomplishment kinds the
  // existing derivation already knows about, then the solve itself.
  const rank: Record<RewardEvent['kind'], number> = {
    skill_demonstrated: 0,
    first_unaided: 1,
    review_held: 2,
    near_miss_improved: 3,
    transfer: 4,
    recall: 5,
    solved: 6,
  };
  events.sort((a, b) => rank[a.kind] - rank[b.kind]);

  if (input.kind === 'transfer') {
    events.push({ kind: 'transfer', note: 'You used an idea from an earlier problem on a new one, without help.' });
  } else if (input.kind === 'recall') {
    events.push({ kind: 'recall', note: 'You solved this again after a gap, without help.' });
  }

  events.push({ kind: 'solved', note: 'Solved.' });
  return events;
}

/**
 * Full only when something rarer than a solve happened. Deterministic on
 * purpose; see the module comment.
 */
export function chooseSurface(events: readonly RewardEvent[]): RewardSurface {
  return events.some((event) => event.kind !== 'solved') ? 'full' : 'quiet';
}

/**
 * A failed attempt that passed more cases than the previous attempt on the
 * same problem in the same session. Null on the first attempt, when the count
 * did not rise, and once it has already been acknowledged this session — so
 * resubmitting broken code one case at a time earns nothing after the first
 * improvement.
 */
export function nearMissImproved(
  previous: { passedCount: number; totalCount: number } | null,
  current: { passedCount: number; totalCount: number },
  alreadyAcknowledged: boolean,
): NearMiss | null {
  if (!previous || alreadyAcknowledged) return null;
  if (current.passedCount <= previous.passedCount) return null;
  if (current.passedCount >= current.totalCount) return null;
  return { passed: current.passedCount, total: current.totalCount, previousPassed: previous.passedCount };
}

/** One plain line for the lock screen under a failed result. */
export function describeNearMiss(nearMiss: NearMiss): string {
  const left = nearMiss.total - nearMiss.passed;
  return `${nearMiss.passed} of ${nearMiss.total} cases now, up from ${nearMiss.previousPassed}. ${left === 1 ? 'One' : left} left.`;
}
