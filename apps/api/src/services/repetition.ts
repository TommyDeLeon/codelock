import { SubmissionStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { skillsRequiredBy, type SkillProblem, type SkillSnapshot } from './skills.js';

/**
 * Which problems must not come back as a full lock, and why.
 *
 * ## The bug this replaces
 *
 * Selection excluded "anything submitted in the last 21 days" and nothing
 * else. Two consequences, both seen in the owner's own history on 2026-09-15:
 *
 * - A swap looked only at the problem on screen, so seven "too hard" requests
 *   in one day each served a problem solved earlier that day.
 * - A problem whose every skill was demonstrated was due to return at full
 *   weight the moment the window closed, as if it had never been solved.
 *
 * Re-serving mastered work produces almost no learning and almost no surprise.
 * The rule below keys exclusion on what the learner has demonstrated, not on
 * a calendar.
 *
 * ## The rule
 *
 * A problem stays out of full locks while either of these holds:
 *
 * 1. It was attempted within `REPEAT_COOLDOWN_DAYS` — the old rule, kept for
 *    unsolved attempts so a failed problem is not served again next morning.
 * 2. It was solved and every skill it needs is still `demonstrated`. Time does
 *    not lift this; only a skill falling `due_for_review` does, and then the
 *    problem is a candidate for review rather than for new work.
 *
 * A solved problem that still carries a shaky skill is *not* excluded past the
 * cooldown: further practice on something not yet demonstrated is the point.
 *
 * Pure, so the rule is arguable in a test. `loadServedRecords` is the one
 * database read, and it is small.
 */

/** Do not serve a problem the user has attempted within this window. */
export const REPEAT_COOLDOWN_DAYS = 21;

/** One problem the learner has met before, reduced to what the rule reads. */
export interface ServedRecord {
  problem: SkillProblem & { id: string };
  /** Any accepted submission, ever. */
  solved: boolean;
  /** Most recent submission of any status. */
  lastAt: Date;
}

/** Ids that must not be served as a full lock right now. */
export function excludedFromLocks(
  records: readonly ServedRecord[],
  snapshot: SkillSnapshot,
  now: Date,
): Set<string> {
  const cooldownStart = now.getTime() - REPEAT_COOLDOWN_DAYS * 86_400_000;
  const out = new Set<string>();
  for (const record of records) {
    if (record.lastAt.getTime() >= cooldownStart) {
      out.add(record.problem.id);
      continue;
    }
    if (!record.solved) continue;
    const mastered = skillsRequiredBy(record.problem).every(
      (skill) => snapshot[skill].state === 'demonstrated',
    );
    if (mastered) out.add(record.problem.id);
  }
  return out;
}

/**
 * Every problem this learner has submitted against, one record each.
 *
 * Two aggregate queries bounded by the number of distinct problems, not by
 * the number of submissions: this runs on every lock and every swap, and a
 * per-submission read would grow with the learner's whole history.
 *
 * Never throws: with no history readable the caller falls back to the plain
 * unexcluded pool, which can repeat but can always open.
 */
export async function loadServedRecords(userId: string): Promise<ServedRecord[]> {
  try {
    const [latest, solved] = await Promise.all([
      prisma.submission.groupBy({
        by: ['problemId'],
        where: { userId },
        _max: { createdAt: true },
      }),
      prisma.submission.findMany({
        where: {
          userId,
          status: { in: [SubmissionStatus.ACCEPTED, SubmissionStatus.ACCEPTED_TOO_SLOW] },
        },
        distinct: ['problemId'],
        select: { problemId: true },
      }),
    ]);
    if (latest.length === 0) return [];
    const problems = await prisma.problem.findMany({
      where: { id: { in: latest.map((row) => row.problemId) } },
      select: { id: true, signatureId: true, patternTags: true, tier: true, patternFamily: true },
    });
    const solvedIds = new Set(solved.map((row) => row.problemId));
    const byId = new Map(problems.map((problem) => [problem.id, problem]));
    const out: ServedRecord[] = [];
    for (const row of latest) {
      const problem = byId.get(row.problemId);
      if (!problem || !row._max.createdAt) continue;
      out.push({ problem, solved: solvedIds.has(row.problemId), lastAt: row._max.createdAt });
    }
    return out;
  } catch (err) {
    logger.warn({ err, userId }, 'served history unavailable; repetition rule not applied');
    return [];
  }
}
