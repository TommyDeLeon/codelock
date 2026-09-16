import { LockState } from '@prisma/client';
import type { FrontierView, NearMiss } from '@codelock/shared';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import {
  SKILL_LABELS,
  SKILLS,
  nextSkillToLearn,
  skillsRequiredBy,
  type Skill,
  type SkillProblem,
  type SkillSnapshot,
} from './skills.js';
import { describeNearMiss } from './tutor/reward.js';

/**
 * The frontier: which skill is next, how close, what the last attempt on it
 * proved, and the first-try pass rate as an observable.
 *
 * Competence feedback in the informational sense (Ryan & Deci): it tells the
 * learner where they are and what the last attempt showed. Distance is words,
 * not a counter — the one-step case is named because that is where the
 * information is actionable, and nothing here is a bar to fill.
 *
 * The pass rate is shown beside the band the app aims for so the learner can
 * see when locks are landing too easy or too hard. It is measured, never
 * acted on; the 85% figure it is compared with is an analogy from
 * gradient-descent classifiers, and the app does not tune itself toward it.
 *
 * Pure `describeFrontier`, one loader that never throws.
 */

/** How many recent locks the pass rate is over. */
export const PASS_RATE_WINDOW = 20;

/** The band the app aims for. A product choice; see RESEARCH.md. */
export const PASS_RATE_BAND: [number, number] = [0.75, 0.85];

/** One recent lock, reduced to what the frontier reads. Newest first. */
export interface FrontierLock {
  requiredSkills: readonly Skill[];
  /** The first submission in the session was accepted. */
  firstTryPass: boolean;
  assisted: boolean;
  ending: 'solved' | 'bypassed' | 'abandoned';
  nearMiss: NearMiss | null;
}

/**
 * A `nearMiss` read back from a JSON column, or null. The column is written
 * by this codebase, but an older or hand-edited row must not be able to throw
 * through the loader's never-throws promise.
 */
function parseNearMiss(value: unknown): NearMiss | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const ok = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  return ok(v.passed) && ok(v.total) && ok(v.previousPassed)
    ? { passed: v.passed, total: v.total, previousPassed: v.previousPassed }
    : null;
}

/**
 * The Tier 1 problem with the fewest skills the learner has not demonstrated,
 * and which skills those are, in teaching order. This is what turns "lists is
 * next" into "Election Winner is three skills away", which is the distance
 * the owner actually cares about.
 */
export function nearestInterview(
  snapshot: SkillSnapshot,
  problems: readonly (SkillProblem & { title: string })[],
): { title: string; missing: string[] } | null {
  let best: { title: string; missing: Skill[] } | null = null;
  for (const problem of problems) {
    if (problem.tier !== 'TIER_1') continue;
    const missing = skillsRequiredBy(problem).filter((s) => {
      const state = snapshot[s].state;
      return state !== 'demonstrated' && state !== 'due_for_review';
    });
    if (!best || missing.length < best.missing.length) best = { title: problem.title, missing };
    if (missing.length === 0) break;
  }
  if (!best || best.missing.length === 0) return null;
  const ordered = SKILLS.filter((s) => best!.missing.includes(s));
  return { title: best.title, missing: ordered.map((s) => SKILL_LABELS[s]) };
}

export function describeFrontier(snapshot: SkillSnapshot, recent: readonly FrontierLock[]): FrontierView {
  const skill = nextSkillToLearn(snapshot);
  const window = recent.slice(0, PASS_RATE_WINDOW);
  const passRate = {
    rate: window.length === 0 ? null : window.filter((lock) => lock.firstTryPass).length / window.length,
    locks: window.length,
    band: PASS_RATE_BAND,
  };
  if (!skill) return { next: null, distance: '', lastProved: null, passRate };

  const record = snapshot[skill];
  const distance =
    record.state === 'due_for_review'
      ? 'due for a review'
      : record.unaidedSolves === 1
        ? 'one unaided solve away'
        : record.state === 'practised_with_help'
          ? 'practised with help'
          : 'not met yet';

  const last = recent.find((lock) => lock.requiredSkills.includes(skill));
  const label = SKILL_LABELS[skill];
  let lastProved: string | null = null;
  if (last) {
    if (last.ending === 'solved') {
      lastProved = last.assisted
        ? `Your last attempt on “${label}”: solved with help.`
        : `Your last attempt on “${label}”: solved without help.`;
    } else if (last.nearMiss) {
      lastProved = `Your last attempt on “${label}”: ${describeNearMiss(last.nearMiss).toLowerCase()}`;
    } else {
      lastProved = `Your last attempt on “${label}” was left unsolved. That is where the next one picks up.`;
    }
  }

  return { next: { skill, label }, distance, lastProved, passRate };
}

/**
 * The recent locks, newest first, as `describeFrontier` reads them. Never
 * throws; an empty list means no pass rate and no "last attempt" line.
 */
export async function loadFrontierLocks(userId: string): Promise<FrontierLock[]> {
  try {
    const sessions = await prisma.lockSession.findMany({
      where: {
        userId,
        state: { in: [LockState.UNLOCKED, LockState.BYPASSED, LockState.ABANDONED] },
        lockedAt: { not: null },
      },
      orderBy: { lockedAt: 'desc' },
      take: PASS_RATE_WINDOW,
      select: {
        id: true,
        state: true,
        problem: { select: { signatureId: true, patternTags: true, tier: true, patternFamily: true } },
        submissions: {
          orderBy: { createdAt: 'asc' },
          select: { status: true },
        },
      },
    });
    const ids = sessions.map((s) => s.id);
    const events = ids.length
      ? await prisma.learningEvent.findMany({
          where: { userId, sessionId: { in: ids }, kind: { in: ['HINT_REVEALED', 'DEBRIEF_OPENED', 'ATTEMPT_FAILED'] } },
          select: { sessionId: true, kind: true, detail: true },
        })
      : [];
    return sessions
      .filter((s) => s.problem !== null)
      .map((s) => {
        const mine = events.filter((e) => e.sessionId === s.id);
        const first = s.submissions[0];
        const nearMiss =
          mine
            .filter((e) => e.kind === 'ATTEMPT_FAILED')
            .map((e) => parseNearMiss((e.detail as { nearMiss?: unknown } | null)?.nearMiss))
            .find((n): n is NearMiss => n !== null) ?? null;
        return {
          requiredSkills: skillsRequiredBy(s.problem!),
          firstTryPass: first?.status === 'ACCEPTED' || first?.status === 'ACCEPTED_TOO_SLOW',
          assisted: mine.some((e) => e.kind === 'HINT_REVEALED' || e.kind === 'DEBRIEF_OPENED'),
          ending: s.state === LockState.BYPASSED ? 'bypassed' : s.state === LockState.ABANDONED ? 'abandoned' : 'solved',
          nearMiss,
        };
      });
  } catch (err) {
    logger.warn({ err, userId }, 'frontier history unavailable');
    return [];
  }
}
