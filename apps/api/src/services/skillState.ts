import { SubmissionStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import {
  advanceSkillState,
  emptySkillSnapshot,
  markDueForReview,
  skillsRequiredBy,
  type Skill,
  type SkillProblem,
  type SkillSnapshot,
} from './skills.js';

/**
 * Where a learner actually is, derived from what they have already done.
 *
 * ## Why this reads history instead of storing a snapshot
 *
 * The obvious design is a table of skill states written on each solve. This
 * deliberately does not do that.
 *
 * The facts are already stored. Which problems were solved lives in
 * `submissions`; which of those took help lives in `learning_events` as
 * `HINT_REVEALED` and `DEBRIEF_OPENED` rows. A skill table would be a second
 * copy of a conclusion the first already implies, and the failure mode of two
 * sources is that they disagree — at which point the one nobody can recompute
 * wins, which is the wrong one.
 *
 * It needs no migration. Postgres cannot drop an enum value, and this
 * repository already carries one such one-way change from
 * `20260911120000_capability_recorded`. Adding no schema at all is safer than
 * adding a careful one.
 *
 * Existing history counts immediately. Someone who has already solved thirty
 * problems does not start at zero and needs no backfill script, because their
 * state was never anything other than a function of their submissions.
 *
 * The cost is recomputation on the selection path: two indexed queries and a
 * replay over one user's solves. That is the right trade for a single-user
 * local tool, and `REPLAY_LIMIT` bounds it. The shape to revisit is a solve
 * history in the tens of thousands, which this tool will not reach soon.
 */

/**
 * How many recent solves to replay.
 *
 * A bound rather than a guess: eight skills needing two unaided solves each
 * means sixteen well-chosen solves can finish the path, so nothing past a few
 * hundred can change the outcome. An unbounded query on the selection path is
 * how a fast tool becomes a slow one.
 */
export const REPLAY_LIMIT = 500;

/** Days a demonstrated skill stays fresh before its review comes due. */
export const SKILL_REVIEW_DAYS = 7;

/** One solved problem, and whether that solve had help. */
export interface SolveRecord {
  problemId: string;
  /** The lock session it belonged to, or null for a practice solve. */
  sessionId: string | null;
  problem: SkillProblem;
  assisted: boolean;
  solvedAt: Date;
}

/**
 * Collapse repeated accepted submissions for the same problem in the same
 * sitting into the one solving occasion they actually were.
 *
 * `ACCEPTED_TOO_SLOW` is an accepted submission that missed the performance
 * gate, so a learner who passes slowly and then resubmits faster has two
 * accepted rows for one piece of work. Counted separately, those two rows
 * demonstrate a skill on their own — which is exactly the false claim of
 * mastery this whole layer exists to avoid.
 *
 * Keyed on problem and session, not problem alone: coming back to the same
 * problem a week later is genuine further practice and should count again.
 * A practice solve has no session, so each of those counts once per replay,
 * which is the closest available reading of the evidence.
 *
 * The earliest of a group is kept, because that is the attempt whose help
 * record describes the work.
 */
export function dedupeEpisodes(solves: readonly SolveRecord[]): SolveRecord[] {
  const earliest = new Map<string, SolveRecord>();
  for (const solve of solves) {
    const key = `${solve.problemId}::${solve.sessionId ?? solve.solvedAt.toISOString()}`;
    const seen = earliest.get(key);
    if (!seen || solve.solvedAt < seen.solvedAt) earliest.set(key, solve);
  }
  return [...earliest.values()];
}

/**
 * Replay solves into a snapshot. Pure, so the rule is testable with no
 * database.
 *
 * Deduplicated first, so one solving occasion counts once; see
 * `dedupeEpisodes`. Then oldest first, because the state machine is
 * order-dependent: two unaided solves demonstrate a skill, and replaying
 * newest-first would count a later assisted solve before the earlier unaided
 * ones.
 *
 * A skill whose most recent practice is older than `SKILL_REVIEW_DAYS` is
 * marked due for review. Only demonstrated skills can be marked, and it is not
 * a demotion: a due skill stays satisfied, so nothing downstream re-locks.
 */
export function replaySkillSnapshot(solves: readonly SolveRecord[], now: Date): SkillSnapshot {
  const snapshot = emptySkillSnapshot();
  const lastPractised = new Map<Skill, Date>();

  const ordered = dedupeEpisodes(solves).sort(
    (a, b) => a.solvedAt.getTime() - b.solvedAt.getTime(),
  );
  for (const solve of ordered) {
    for (const skill of skillsRequiredBy(solve.problem)) {
      snapshot[skill] = advanceSkillState(snapshot[skill], solve.assisted);
      lastPractised.set(skill, solve.solvedAt);
    }
  }

  const staleBefore = now.getTime() - SKILL_REVIEW_DAYS * 86_400_000;
  for (const [skill, when] of lastPractised) {
    if (when.getTime() < staleBefore) snapshot[skill] = markDueForReview(snapshot[skill]);
  }

  return snapshot;
}

/**
 * Read this learner's solve history and derive their snapshot.
 *
 * Never throws. A learner whose history cannot be read is treated as a
 * beginner, which serves them the earliest material — the safe direction to
 * fail in. The alternative, failing the selection, would mean a lock that
 * cannot be opened, and no learning feature is worth that.
 */
export async function loadSkillSnapshot(userId: string, now = new Date()): Promise<SkillSnapshot> {
  try {
    const solved = await prisma.submission.findMany({
      where: {
        userId,
        status: { in: [SubmissionStatus.ACCEPTED, SubmissionStatus.ACCEPTED_TOO_SLOW] },
      },
      orderBy: { createdAt: 'desc' },
      take: REPLAY_LIMIT,
      select: {
        createdAt: true,
        problemId: true,
        lockSessionId: true,
        problem: {
          select: { signatureId: true, patternTags: true, tier: true, patternFamily: true },
        },
      },
    });
    if (solved.length === 0) return emptySkillSnapshot();

    const solves = await attributeHelp(userId, solved);
    return replaySkillSnapshot(solves, now);
  } catch (err) {
    logger.warn({ err, userId }, 'skill snapshot unavailable; treating as a new learner');
    return emptySkillSnapshot();
  }
}

/** The subset of a submission row this module needs. */
interface SolvedRow {
  createdAt: Date;
  problemId: string;
  lockSessionId: string | null;
  problem: SkillProblem;
}

/**
 * Decide which solves had help.
 *
 * One query for every help event across the sessions involved, rather than one
 * per solve.
 *
 * Help counts only if it came *before* the solve, matching
 * `readCapabilityEvidence`: a hint read after the passing submission changes
 * nothing about whether that submission was unaided. This matters because a
 * session outlives its solve — the debrief is usually opened afterwards, and
 * counting it would make almost every solve look assisted.
 *
 * `DEBRIEF_OPENED` counts as help because the debrief carries the worked
 * solution.
 *
 * A solve with no session came from practice rather than a lock, and nothing
 * recorded help for it. Treated as unaided, which is what the evidence says;
 * the alternative would be to invent an assist that never happened.
 */
async function attributeHelp(userId: string, solved: readonly SolvedRow[]): Promise<SolveRecord[]> {
  const sessionIds = [
    ...new Set(solved.map((row) => row.lockSessionId).filter((id): id is string => Boolean(id))),
  ];

  const helpAt = new Map<string, number>();
  if (sessionIds.length > 0) {
    const events = await prisma.learningEvent.findMany({
      where: {
        userId,
        sessionId: { in: sessionIds },
        kind: { in: ['HINT_REVEALED', 'DEBRIEF_OPENED'] },
      },
      select: { sessionId: true, at: true },
    });
    // Earliest help per session is all that is needed: any solve after it was
    // assisted, and any solve before it was not.
    for (const event of events) {
      if (!event.sessionId) continue;
      const seen = helpAt.get(event.sessionId);
      const at = event.at.getTime();
      if (seen === undefined || at < seen) helpAt.set(event.sessionId, at);
    }
  }

  return solved.map((row) => {
    const firstHelp = row.lockSessionId ? helpAt.get(row.lockSessionId) : undefined;
    return {
      problemId: row.problemId,
      sessionId: row.lockSessionId,
      problem: row.problem,
      assisted: firstHelp !== undefined && firstHelp < row.createdAt.getTime(),
      solvedAt: row.createdAt,
    };
  });
}
