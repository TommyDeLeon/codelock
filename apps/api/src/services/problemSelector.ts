import { Difficulty, Prisma, type PatternFamily, type Problem, type Tier } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { bucketedPick } from './valueSelection.js';
import { fitForLearner } from './skills.js';
import { loadSkillSnapshot } from './skillState.js';
import { excludedFromLocks, loadServedRecords } from './repetition.js';
import { choosePool, needsRelief, splitPools, type LockOutcome, type Pool } from './stretch.js';

/** How many candidates the weighted pick chooses between. */
const CANDIDATE_POOL = 25;

/** The columns the skill gate reads, plus the id. Cheap enough to select in bulk. */
const SKILL_COLUMNS = {
  id: true,
  signatureId: true,
  patternTags: true,
  tier: true,
  patternFamily: true,
} as const;

/**
 * Every problem matching `where`, reduced to the columns the gate needs.
 *
 * The whole matching set, not a sample, and deliberately so: the skill gate
 * has to be applied to the full pool before sampling. Filtering a 25-problem
 * sample instead would report "nothing fair here" whenever the sample happened
 * to miss the eligible problems, and the ladder would relax a rung it did not
 * need to. At a few hundred rows of five small columns this costs nothing.
 */
async function candidateRows(where: Prisma.ProblemWhereInput) {
  return prisma.problem.findMany({ where, select: SKILL_COLUMNS });
}

/**
 * Take a random sample of the given ids, not the first page of them.
 *
 * `findMany({ take: 25 })` with no `orderBy` is not a sample — Prisma orders by
 * id, so it returns the same 25 lowest-id rows on every call. Measured against
 * the real corpus: a new user reached 23 of 48 Tier 0 problems, and the other 25
 * were unreachable until the cooldown rotated the window. It also quietly
 * undercut the value ranker, which was weighting a fixed subset rather than the
 * eligible pool.
 *
 * Separate from `candidateRows` on purpose: that one reads a few small columns
 * for every match, this one fetches whole rows — markdown and six reference
 * solutions each — for at most `CANDIDATE_POOL` of them.
 *
 * `ORDER BY random()` in raw SQL would avoid the shuffle, but it would have to
 * be repeated at each fallback rung and would lose the type safety of the query
 * builder for no measurable gain at this table size.
 */
async function sampleFrom(
  where: Prisma.ProblemWhereInput,
  ids: readonly string[],
  random: () => number = Math.random,
): Promise<Problem[]> {
  if (ids.length === 0) return [];

  // Partial Fisher-Yates: shuffle only as far as the pool needs.
  const pool = [...ids];
  const wanted = Math.min(CANDIDATE_POOL, pool.length);
  for (let i = 0; i < wanted; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j] as string, pool[i] as string];
  }

  // The full predicate is re-applied, not just the sampled ids. The ids already
  // satisfy it, so this is redundant by construction — but it closes the window
  // where a problem is deactivated between the two queries, and it keeps the
  // invariant "no query for a servable problem omits isActive" literally true
  // rather than true-by-argument. Overriding `id` is safe: the sample is drawn
  // from rows that already passed any `id: { notIn: seen }` filter.
  return prisma.problem.findMany({ where: { ...where, id: { in: pool.slice(0, wanted) } } });
}

/** A chosen problem, and the truth about how well it fits the learner. */
export interface ProblemSelection {
  problem: Problem;
  /**
   * Whether every skill this problem needs is one the learner has met or is
   * ready to meet. False means the ladder ran out of fair problems and served
   * this one anyway, which the caller must be able to say out loud.
   */
  skillEligible: boolean;
  /** Plain-words account of the fit, from `fitForLearner`. Always present. */
  skillNote: string;
  /**
   * Which pool the problem came from: `stretch` needs a skill not yet
   * demonstrated, `consolidating` needs only demonstrated ones. Null when the
   * ladder ran out of fair problems. Recorded with the served problem so the
   * relief rule and the replay can read it back.
   */
  pool: Pool | null;
  /**
   * False when no problem fitting the learner's time budget could be served
   * and the selector relaxed past it.
   *
   * The lock still opens — that invariant outranks the budget, as it outranks
   * the skill gate. But the caller records it, and a session served this way
   * does not count toward ladder advancement: otherwise the shortest budget
   * would be the cheapest way to climb.
   */
  withinBudget: boolean;
}

/** How many recent locks the relief rule reads. It only ever needs two. */
const RELIEF_WINDOW = 2;

/**
 * The last two locks, newest first, as the relief rule sees them.
 *
 * Pool comes from the `PROBLEM_SERVED` detail written at lock time; an older
 * row with no pool reads as null, which the rule treats as not stretch. The
 * ending comes from the session state, or from the worked solution having
 * been opened (a debrief, or a level-5 hint) before the solve.
 *
 * Never throws: with no history readable there is no relief, which is the
 * pre-existing behaviour.
 */
async function loadRecentLockOutcomes(userId: string): Promise<LockOutcome[]> {
  try {
    const sessions = await prisma.lockSession.findMany({
      where: { userId, state: { in: ['UNLOCKED', 'BYPASSED', 'ABANDONED'] }, lockedAt: { not: null } },
      orderBy: { lockedAt: 'desc' },
      take: RELIEF_WINDOW,
      select: { id: true, state: true },
    });
    if (sessions.length === 0) return [];
    const events = await prisma.learningEvent.findMany({
      where: {
        userId,
        sessionId: { in: sessions.map((s) => s.id) },
        kind: { in: ['PROBLEM_SERVED', 'DEBRIEF_OPENED', 'HINT_REVEALED'] },
      },
      select: { sessionId: true, kind: true, detail: true },
    });
    return sessions.map((session) => {
      const mine = events.filter((e) => e.sessionId === session.id);
      const served = mine.filter((e) => e.kind === 'PROBLEM_SERVED').at(-1);
      const detail = served?.detail;
      const pool = typeof detail === 'object' && detail !== null && 'pool' in detail ? detail.pool : null;
      const worked = mine.some(
        (e) =>
          e.kind === 'DEBRIEF_OPENED' ||
          (e.kind === 'HINT_REVEALED' && (e.detail as { level?: number } | null)?.level === 5),
      );
      const ending: LockOutcome['ending'] =
        session.state === 'BYPASSED'
          ? 'bypassed'
          : session.state === 'ABANDONED'
            ? 'abandoned'
            : worked
              ? 'worked_solution'
              : 'solved';
      return { pool: pool === 'stretch' || pool === 'consolidating' ? pool : null, ending };
    });
  } catch (err) {
    logger.warn({ err, userId }, 'recent lock outcomes unavailable; no relief applied');
    return [];
  }
}

/**
 * Pick the problem for a lock session.
 *
 * The tier comes from the rule engine; this only chooses *within* the tier.
 * In `hybrid` mode an LLM ranks the shortlist by topic variety — a cheap,
 * strictly optional layer that falls back to random on any failure, because a
 * user staring at a lock screen must never wait on OpenAI.
 *
 * ## The skill gate, and why it is a preference rather than a wall
 *
 * Every rung of the ladder below prefers problems whose prerequisites the
 * learner has actually met. That is the fix for problems arriving beyond the
 * learner's understanding: tier and family were the only filters, and tier is
 * a property of the corpus, not of the person.
 *
 * The gate is not absolute, because the invariant the rungs were written for
 * still holds — a user who cannot unlock is a worse outcome than a user served
 * something off-curriculum. So when no rung offers a single eligible problem,
 * one is served regardless and `skillEligible` comes back false. The lock
 * always opens; it just stops presenting the problem as a fair ask.
 */
export async function pickProblem(
  userId: string,
  difficulty: Difficulty,
  tiers?: Tier[],
  families?: PatternFamily[],
  /**
   * The learner's time budget, in seconds, as a ceiling on `avgSolveSeconds`.
   *
   * Optional because callers that are not serving a lock — the practice route
   * — have no budget to apply. Omitted means unconstrained, which is what
   * every caller did before the budget existed.
   */
  budgetSeconds?: number,
): Promise<ProblemSelection> {
  const snapshot = await loadSkillSnapshot(userId);

  // What must not come back as a full lock: anything attempted recently, and
  // anything solved whose skills are all still demonstrated. See
  // `repetition.ts` for the rule and the history that motivated it.
  const seen = [...excludedFromLocks(await loadServedRecords(userId), snapshot, new Date())];

  // One consolidating lock after two hard stretch locks. See `stretch.ts`.
  const relief = needsRelief(await loadRecentLockOutcomes(userId));
  if (relief) logger.info({ userId }, 'relief due: next lock draws from consolidating');

  // `tiers` comes from the progression gate: what this user is ready for, which
  // is a different question from how hard they find things. Omitted only by
  // callers that genuinely want the whole pool.
  const tierFilter = tiers && tiers.length > 0 ? { tier: { in: tiers } } : {};

  // `families` comes from the same gate, and answers the question the tier
  // cannot: *which* patterns this user has reached. Both the structural
  // prerequisites ("build the heap before heap problems") and the roadmap
  // ordering ("two pointers before trees") arrive here already resolved.
  //
  // Without this the gate was computed, unit-tested and then discarded — the
  // query filtered on tier alone, so a user one lock into Tier 1 could be
  // served any family in the corpus. It was invisible only because Arrays &
  // Hashing is currently the sole authored Tier 1 family; the second family
  // authored would have made it a live bug.
  const familyFilter =
    families && families.length > 0 ? { patternFamily: { in: families } } : {};
  const curriculum = { ...tierFilter, ...familyFilter };

  // An empty-but-present gate result is not the same as "no gate requested",
  // and the `.length > 0` checks above cannot tell them apart — both degrade to
  // "match everything". Falling through is the right behaviour (a user who
  // cannot unlock is worse than one served off-curriculum), but doing it
  // silently is not: an empty set means the progression gate is broken, and
  // that is exactly the kind of fault that stayed invisible here before.
  //
  // `availableFamiliesForTiers` cannot currently return empty — Tier 0 always
  // contributes FOUNDATIONS — so this firing at all indicates a regression.
  if (tiers?.length === 0 || families?.length === 0) {
    logger.warn(
      { userId, tiers, families },
      'progression gate returned an empty set; selection is unfiltered',
    );
  }

  // Problems whose prerequisites this learner has met, from the first rung that
  // offered any. Empty means every rung was exhausted without a fair problem.
  let eligible: Problem[] = [];
  // Which pool `eligible` was drawn from. Set beside it.
  let pool: Pool | null = null;
  // The first rung that matched anything at all, fair or not. This is what keeps
  // the lock openable when the gate can be satisfied by nothing in the corpus.
  // A holder rather than a plain variable: the assignment happens inside the
  // `rung` closure below, and narrowing a local across that boundary would
  // leave the compiler certain it is still null.
  const fallback: { pool: { where: Prisma.ProblemWhereInput; ids: string[] } | null } = {
    pool: null,
  };

  /**
   * The time budget, as a filter that every rung inherits.
   *
   * A ceiling on `avgSolveSeconds`, not a target: a 30-minute budget leaves
   * every shorter problem eligible and lets the ladder choose among them. It
   * narrows what may be served and decides nothing about difficulty.
   *
   * Mutable because the budget is the *first* thing relaxed when the ladder
   * runs dry. Every other filter here protects the quality of the ask; this
   * one protects the learner's evening, and an unopenable lock is worse than
   * a problem that runs long. When it is dropped, `withinBudget` says so and
   * the session stops counting toward the ladder.
   */
  let budgetActive = typeof budgetSeconds === 'number' && budgetSeconds > 0;
  const budgeted = (where: Prisma.ProblemWhereInput): Prisma.ProblemWhereInput =>
    budgetActive ? { ...where, avgSolveSeconds: { lte: budgetSeconds } } : where;

  /**
   * Try one rung. Returns true when it produced a problem the learner is ready
   * for, which stops the ladder.
   *
   * The skill filter is applied inside each rung, and to the rung's whole pool
   * rather than to a sample of it, so relaxation still happens in the authors'
   * order: a fair problem at the right tier beats a fair problem six families
   * ahead, and a rung is never relaxed merely because the sample missed the
   * fair problems in it.
   *
   * Within the rung the fair rows are split into stretch and consolidating,
   * and one pool is chosen before sampling. Choosing after sampling would let
   * a 25-problem sample of mostly-mastered rows decide the pool by accident.
   */
  const rung = async (where: Prisma.ProblemWhereInput): Promise<boolean> => {
    const rows = await candidateRows(budgeted(where));
    if (rows.length === 0) return false;
    if (fallback.pool === null) fallback.pool = { where: budgeted(where), ids: rows.map((row) => row.id) };

    const pools = splitPools(rows, snapshot);
    const chosen = choosePool(
      { stretch: pools.stretch.length, consolidating: pools.consolidating.length },
      relief,
    );
    if (chosen === null) return false;

    eligible = await sampleFrom(
      budgeted(where),
      pools[chosen].map((row) => row.id),
    );
    pool = eligible.length > 0 ? chosen : null;
    return eligible.length > 0;
  };

  let served = await rung({ difficulty, isActive: true, ...curriculum, id: { notIn: seen } });

  // Everything at this tier is excluded, or nothing unexcluded is a fair ask —
  // better to repeat than to fail open and leave the device unlockable.
  if (!served) {
    logger.info({ userId, difficulty }, 'selection relaxed: repetition rule dropped');
    served = await rung({ difficulty, isActive: true, ...curriculum });
  }

  // The family gate and this difficulty do not intersect: the user has reached
  // Two Pointers but every Two Pointers problem is MEDIUM and they are on EASY.
  // Widen to the tier before widening to the corpus — an off-pattern problem at
  // the right tier is a smaller wrong than one from six families ahead.
  if (!served && families && families.length > 0 && tiers && tiers.length > 0) {
    logger.info({ userId, difficulty, families }, 'selection relaxed: pattern family dropped');
    served = await rung({ difficulty, isActive: true, ...tierFilter });
  }

  // Still nothing: the tier gate and this difficulty do not intersect yet. Drop
  // the tier filter rather than the lock — a user who cannot unlock is a worse
  // outcome than a user served something slightly off-curriculum.
  if (!served && tiers && tiers.length > 0) {
    logger.warn({ userId, difficulty, tiers }, 'selection relaxed: tier gate dropped');
    served = await rung({ difficulty, isActive: true });
  }

  // Last resort: relax difficulty as well.
  //
  // The ladder promotes a user to HARD after three fast solves, and if the
  // corpus has no HARD problems yet, every later lock fails to engage — the
  // user gets good at this and the product stops working for them. Serving an
  // easier problem is a far smaller wrong than a lock that cannot open.
  //
  // Same principle as the cooldown fallback above: repeat rather than fail.
  if (!served) {
    served = await rung({ isActive: true });
    if (served) {
      logger.warn(
        { difficulty, tiers },
        'no problems at this difficulty; serving from the whole active pool',
      );
    }
  }

  // Every rung is dry and a budget is still applied. Drop it and walk the
  // ladder again.
  //
  // This is the case the dashboard tries to prevent by greying out a budget
  // with nothing under it, but the dashboard reads the corpus, not this
  // learner's exclusions — a budget that was selectable this morning can be
  // empty by tonight once the repetition rule has taken its share. So the
  // server relaxes rather than refusing: "you said three minutes, so you are
  // not locked at all" would be the cheapest bypass in the product.
  const relaxedPastBudget = !served && budgetActive;
  if (relaxedPastBudget) {
    logger.info(
      { userId, difficulty, budgetSeconds },
      'selection relaxed: time budget dropped; session will not count toward the ladder',
    );
    budgetActive = false;
    served = await rung({ difficulty, isActive: true, ...curriculum, id: { notIn: seen } });
    if (!served) served = await rung({ difficulty, isActive: true, ...curriculum });
    if (!served) served = await rung({ isActive: true });
  }

  // Nothing fair anywhere in the corpus. The gate does not get to win here: an
  // unopenable lock is the one outcome this function must never produce, so a
  // problem is served and the return value says plainly that it is out of
  // depth. Callers show that; they do not hide it.
  if (!served) {
    const last = fallback.pool;
    if (last === null) throw ApiError.notFound('No active problems at any difficulty');

    const lastRows = await sampleFrom(last.where, last.ids);
    if (lastRows.length === 0) throw ApiError.notFound('No active problems at any difficulty');

    const problem = bucketedPick(lastRows);
    const fit = fitForLearner(problem, snapshot);
    logger.warn(
      { userId, difficulty, slug: problem.slug, reason: fit.reason },
      'no problem matches this learner yet; serving an out-of-depth problem',
    );
    return { problem, skillEligible: false, skillNote: fit.reason, pool: null, withinBudget: !relaxedPastBudget };
  }

  // Within budget the value ranker chooses, as it always has. Past it, the
  // shortest problem wins outright: the learner has already been served
  // something longer than they agreed to, and every extra minute past that is
  // a minute they said they did not have.
  const problem = relaxedPastBudget ? shortestOf(eligible) : bucketedPick(eligible);
  return {
    problem,
    skillEligible: true,
    skillNote: fitForLearner(problem, snapshot).reason,
    pool,
    withinBudget: !relaxedPastBudget,
  };
}

/**
 * The quickest of the candidates, ties broken by the value ranker.
 *
 * Only used once the budget has already been missed, where "shortest" is the
 * whole point and a weighted pick would trade the learner's stated time for
 * a marginally more valuable problem.
 */
function shortestOf(candidates: Problem[]): Problem {
  let best = candidates[0] as Problem;
  const tied: Problem[] = [];
  for (const candidate of candidates) {
    if (candidate.avgSolveSeconds < best.avgSolveSeconds) best = candidate;
  }
  for (const candidate of candidates) {
    if (candidate.avgSolveSeconds === best.avgSolveSeconds) tied.push(candidate);
  }
  return tied.length > 1 ? bucketedPick(tied) : best;
}

/**
 * Random, but biased toward problems worth being asked.
 *
 * Two failure modes, in opposite directions. Pure random serves a piece of
 * trivia as readily as a foundational problem, and the user pays for that with
 * their screen. Pure ranking serves the same handful forever, which the 21-day
 * cooldown then has to fight — and makes the next problem guessable, which
 * means pre-solvable before the lock ever appears.
 *
 * So: weight, never dictate. Every eligible problem keeps a real chance.
 *
 * The weighting itself now lives in valueSelection.ts, which buckets by
 * valueScore (8/5/3/1 by rank) and keeps popularity as a bounded tiebreak.
 * This wrapper stays because it is the name the rest of the codebase and its
 * tests already know.
 */
export function weightedPick(candidates: Problem[], random: () => number = Math.random): Problem {
  return bucketedPick(candidates, random);
}
