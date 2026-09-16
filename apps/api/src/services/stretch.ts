import { fitForLearner, skillsRequiredBy, type SkillProblem, type SkillSnapshot } from './skills.js';

/**
 * Difficulty targeting: serve the frontier most of the time.
 *
 * ## Why
 *
 * `fitForLearner` answers "is this fair?" and selection used that as a yes/no
 * gate, then picked by problem value. A problem needing only demonstrated
 * skills and a problem introducing the next skill therefore had the same
 * chance. Replayed against the owner's history on 2026-09-15: 69% of picks
 * needed nothing new, and the two problems that would have introduced
 * `lists` — the actual frontier — were never served.
 *
 * A mastered problem produces almost no prediction error and almost no
 * learning. So the fair pool is split into two, and the lock draws from the
 * frontier with a fixed weight. See `docs/reward-and-stretch.md`.
 *
 * Pure, so the weight and the relief rule are arguable in a test.
 */

export type Pool = 'stretch' | 'consolidating';

/**
 * Probability that a lock draws from the stretch pool when both pools are
 * non-empty. Fixed on purpose: an adaptive weight would be tuning toward a
 * pass-rate figure that comes from gradient-descent classifiers, not people.
 * 0.8 clears the 70% target in the design with room for the relief rule.
 */
export const STRETCH_WEIGHT = 0.8;

/**
 * Which pool a fair problem belongs to. Null when it is not fair at all.
 *
 * Stretch means at least one required skill is not `demonstrated`: never met,
 * met with help only, or met unaided once. `due_for_review` counts as
 * demonstrated here — a due skill is not a new idea, and review is served
 * elsewhere, never as a lock.
 */
export function poolOf(problem: SkillProblem, snapshot: SkillSnapshot): Pool | null {
  if (!fitForLearner(problem, snapshot).eligible) return null;
  const stretches = skillsRequiredBy(problem).some((skill) => {
    const state = snapshot[skill].state;
    return state !== 'demonstrated' && state !== 'due_for_review';
  });
  return stretches ? 'stretch' : 'consolidating';
}

/** The fair rows of a rung, split by pool. Order within each pool is kept. */
export function splitPools<T extends SkillProblem>(
  rows: readonly T[],
  snapshot: SkillSnapshot,
): Record<Pool, T[]> {
  const out: Record<Pool, T[]> = { stretch: [], consolidating: [] };
  for (const row of rows) {
    const pool = poolOf(row, snapshot);
    if (pool) out[pool].push(row);
  }
  return out;
}

/**
 * Which pool this lock draws from, given how many problems each holds.
 *
 * Relief wins when due and consolidating has anything. Otherwise stretch with
 * `STRETCH_WEIGHT`, falling to whichever pool is non-empty. Null means both
 * are empty and the caller's ladder should relax a rung, exactly as before.
 */
export function choosePool(
  sizes: Record<Pool, number>,
  relief: boolean,
  random: () => number = Math.random,
): Pool | null {
  if (sizes.stretch === 0 && sizes.consolidating === 0) return null;
  if (relief && sizes.consolidating > 0) return 'consolidating';
  if (sizes.stretch === 0) return 'consolidating';
  if (sizes.consolidating === 0) return 'stretch';
  return random() < STRETCH_WEIGHT ? 'stretch' : 'consolidating';
}

/** How one lock ended, and which pool it was drawn from. */
export interface LockOutcome {
  pool: Pool | null;
  ending: 'solved' | 'worked_solution' | 'bypassed' | 'abandoned';
}

/**
 * A breather is due after two consecutive stretch locks that ended with the
 * worked solution, a bypass or an abandon. `recent` is newest first; the rule
 * reads only the two most recent locks, so one consolidating lock clears it.
 *
 * This is the anxiety-side guard from the flow account. It is not a demotion:
 * the difficulty ladder is not touched and nothing is recorded against the
 * learner.
 */
export function needsRelief(recent: readonly LockOutcome[]): boolean {
  const [a, b] = recent;
  if (!a || !b) return false;
  const bad = (lock: LockOutcome) => lock.pool === 'stretch' && lock.ending !== 'solved';
  return bad(a) && bad(b);
}
