import { Router } from 'express';
import type {
  AccomplishmentKind,
  FamilyProgress,
  PatternFamily,
  ProgressView,
} from '@codelock/shared';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import { withLocalUser, currentUser } from '../middleware/localUser.js';
import { SKILLS, SKILL_LABELS } from '../services/skills.js';
import { loadSkillSnapshot } from '../services/skillState.js';
import {
  availableFamiliesForTiers,
  availableTiers,
  loadProgressSnapshot,
} from '../services/progression.js';
import { STATE_LABELS } from '../services/tutor/accomplishment.js';
import { describeFrontier, loadFrontierLocks, nearestInterview } from '../services/frontier.js';
import { ALL_PROBLEMS } from '../corpus/problems/index.js';
import { buildFeedback, type ComplexityLanguage } from '../services/complexity.js';

export const progressRouter = Router();
progressRouter.use(withLocalUser);

/** Absence long enough that the page says hello again, without any guilt. */
const WELCOME_BACK_DAYS = 7;
/**
 * The curriculum's families, in the order they are met, and what to call them.
 *
 * Defined here rather than imported from @codelock/shared, and the reason is
 * not taste. The API compiles to JavaScript and ships without the shared
 * package's source, so a *value* imported from it resolves to a TypeScript
 * file Node cannot require. Every other import from that package in this app
 * is `import type`, which erases at compile time; the one runtime import added
 * here crashed the container on boot with MODULE_NOT_FOUND — a failure that
 * cannot happen in development, where tsx reads the TypeScript directly.
 *
 * The labels belong on this side anyway: the route serves them, so no client
 * has to know the mapping.
 */
const PATTERN_FAMILIES = [
  'FOUNDATIONS',
  'ARRAYS_HASHING',
  'TWO_POINTERS',
  'SLIDING_WINDOW',
  'STACK',
  'BINARY_SEARCH',
  'LINKED_LIST',
  'TREES',
  'TRIES',
  'HEAP_PRIORITY_QUEUE',
  'BACKTRACKING',
  'GRAPHS',
  'ADVANCED_GRAPHS',
  'DP_1D',
  'DP_2D',
  'GREEDY',
  'INTERVALS',
  'MATH_GEOMETRY',
  'BIT_MANIPULATION',
] as const satisfies readonly PatternFamily[];

const FAMILY_LABELS: Record<PatternFamily, string> = {
  FOUNDATIONS: 'Foundations',
  ARRAYS_HASHING: 'Arrays & hashing',
  TWO_POINTERS: 'Two pointers',
  SLIDING_WINDOW: 'Sliding window',
  STACK: 'Stack',
  BINARY_SEARCH: 'Binary search',
  LINKED_LIST: 'Linked list',
  TREES: 'Trees',
  TRIES: 'Tries',
  HEAP_PRIORITY_QUEUE: 'Heap & priority queue',
  BACKTRACKING: 'Backtracking',
  GRAPHS: 'Graphs',
  ADVANCED_GRAPHS: 'Advanced graphs',
  DP_1D: 'Dynamic programming, 1D',
  DP_2D: 'Dynamic programming, 2D',
  GREEDY: 'Greedy',
  INTERVALS: 'Intervals',
  MATH_GEOMETRY: 'Maths & geometry',
  BIT_MANIPULATION: 'Bit manipulation',
};

const KINDS: AccomplishmentKind[] = ['independent', 'assisted', 'worked_solution', 'recall', 'transfer'];

/**
 * GET /progress/families — the curriculum, and how much of it has been met.
 *
 * The skill map above answers "what can you do"; this answers "where have you
 * been". They are different axes and the second is the one that reads as
 * progress: a family fills in, and the gaps say what to study next.
 *
 * Distinct problems, never submissions. Solving the same problem six times is
 * one problem met — counting attempts would let the map be filled by repeating
 * the easiest thing in it, which is exactly the habit the corpus exists to
 * break.
 *
 * Every family is returned, including the locked ones. A map with future
 * families hidden cannot show a route; it only shows where you already are.
 */
progressRouter.get(
  '/families',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);

    const [snapshot, totals, solves] = await Promise.all([
      loadProgressSnapshot(user.id),
      prisma.problem.groupBy({
        by: ['patternFamily'],
        where: { isActive: true },
        _count: { _all: true },
      }),
      // Correct-but-too-slow counts as met: the solution existed. The speed is
      // reported separately, below, rather than deciding whether it happened.
      prisma.submission.findMany({
        where: {
          userId: user.id,
          status: { in: ['ACCEPTED', 'ACCEPTED_TOO_SLOW'] },
        },
        select: {
          problemId: true,
          runtimeMs: true,
          gateMs: true,
          createdAt: true,
          problem: { select: { patternFamily: true } },
        },
      }),
    ]);

    const unlocked = new Set<string>(
      availableFamiliesForTiers(snapshot, availableTiers(snapshot)),
    );
    const totalByFamily = new Map(totals.map((row) => [row.patternFamily, row._count._all]));

    // One pass, because the volume is one person's history and a query per
    // family would be nineteen round trips to say the same thing.
    const seen = new Map<string, Set<string>>();
    const ratios = new Map<string, number[]>();
    const lastAt = new Map<string, number>();
    for (const solve of solves) {
      const family = solve.problem?.patternFamily;
      if (!family) continue;
      const problems = seen.get(family) ?? new Set<string>();
      problems.add(solve.problemId);
      seen.set(family, problems);

      // A gate of zero would divide to Infinity, and a missing runtime means
      // the solve predates timing. Neither is a measurement.
      if (solve.runtimeMs !== null && solve.gateMs !== null && solve.gateMs > 0) {
        const list = ratios.get(family) ?? [];
        list.push(solve.runtimeMs / solve.gateMs);
        ratios.set(family, list);
      }

      const at = solve.createdAt.getTime();
      if (at > (lastAt.get(family) ?? 0)) lastAt.set(family, at);
    }

    const families: FamilyProgress[] = PATTERN_FAMILIES.map((family: PatternFamily) => {
      const list = (ratios.get(family) ?? []).sort((a, b) => a - b);
      return {
        family,
        label: FAMILY_LABELS[family],
        unlocked: unlocked.has(family),
        solved: seen.get(family)?.size ?? 0,
        total: totalByFamily.get(family) ?? 0,
        lastSolvedAt: lastAt.has(family) ? new Date(lastAt.get(family)!).toISOString() : null,
        // Median rather than mean: one pathological first attempt at a hard
        // problem would drag an average far enough to misdescribe the family.
        typicalRatio: list.length === 0 ? null : Number(median(list).toFixed(2)),
      };
    });

    res.json({ families });
  }),
);

/** Middle value of an already-sorted list; the mean of the middle two if even. */
function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] as number;
  return ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/**
 * GET /progress — skills and recent accomplishments, for the desktop app.
 *
 * Everything here is derived from stored submissions and events, so it
 * survives a restart by construction. There are no streaks and nothing that
 * resets for being away.
 */
progressRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const [snapshot, events, lastEvent, frontierLocks] = await Promise.all([
      loadSkillSnapshot(user.id),
      prisma.learningEvent.findMany({
        where: { userId: user.id, kind: 'ACCOMPLISHMENT' },
        orderBy: { at: 'desc' },
        take: 200,
        select: { at: true, problemTitle: true, detail: true },
      }),
      prisma.learningEvent.findFirst({
        where: { userId: user.id },
        orderBy: { at: 'desc' },
        select: { at: true },
      }),
      loadFrontierLocks(user.id),
    ]);

    // Counted across the whole history, not the recent window above: a total
    // taken from the last 200 rows would silently drop older solves.
    const kindCounts = await Promise.all(
      KINDS.map((kind) =>
        prisma.learningEvent.count({
          where: { userId: user.id, kind: 'ACCOMPLISHMENT', detail: { path: ['kind'], equals: kind } },
        }),
      ),
    );
    const counts = Object.fromEntries(KINDS.map((k, i) => [k, kindCounts[i] ?? 0])) as Record<
      AccomplishmentKind,
      number
    >;

    const lastActiveAt = lastEvent?.at ?? null;
    const awayDays = lastActiveAt ? (Date.now() - lastActiveAt.getTime()) / 86_400_000 : 0;

    const view: ProgressView = {
      // Values included: the earliest problems use nothing else, and hiding it
      // made a real solve look like no progress at all.
      skills: SKILLS.map((skill) => ({
        skill,
        label: SKILL_LABELS[skill],
        state: snapshot[skill].state,
        stateLabel: STATE_LABELS[snapshot[skill].state] ?? snapshot[skill].state,
        independent: snapshot[skill].unaidedSolves,
        assisted: snapshot[skill].assistedSolves,
      })),
      recent: events.slice(0, 8).map((event) => {
        const detail = (event.detail ?? {}) as { kind?: AccomplishmentKind; headline?: string };
        return {
          at: event.at.toISOString(),
          title: event.problemTitle ?? 'A problem',
          kind: detail.kind ?? 'independent',
          headline: detail.headline ?? '',
        };
      }),
      // Where the edge is: the next skill, how close in words, what the last
      // attempt on it showed, and the first-try pass rate as an observable.
      frontier: {
        ...describeFrontier(snapshot, frontierLocks),
        nearestInterview: nearestInterview(snapshot, ALL_PROBLEMS),
      },
      counts,
      welcomeBack:
        awayDays >= WELCOME_BACK_DAYS
          ? 'Welcome back. Everything you did before is saved exactly where you left it. There is nothing to catch up on.'
          : null,
      lastActiveAt: lastActiveAt?.toISOString() ?? null,
    };
    res.json(view);
  }),
);

/**
 * GET /progress/latest-accomplishment — the most recent solve's success moment.
 *
 * The desktop shell drops the lock straight back to its own dashboard, so the
 * dashboard asks for the newest accomplishment and shows it once. Nulls when
 * there has never been one.
 */
progressRouter.get(
  '/latest-accomplishment',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    // Only solves that opened a lock: a practice or browser solve must not be
    // celebrated as though it had just released the desktop.
    // Start from the solve itself: the most recent accepted submission that
    // belonged to a lock. Events are written after the fact and can land out
    // of order, so they are never what decides "latest".
    const submission = await prisma.submission.findFirst({
      where: { userId: user.id, lockSessionId: { not: null }, status: 'ACCEPTED' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    });
    const event = submission
      ? await prisma.learningEvent.findFirst({
          where: { userId: user.id, kind: 'ACCOMPLISHMENT', submissionId: submission.id },
          select: { submissionId: true, sessionId: true, detail: true },
        })
      : null;
    const accomplishment = (event?.detail as { accomplishment?: unknown } | null)?.accomplishment ?? null;
    // Right after an unlock the event may not be written yet. Report nothing
    // rather than half an answer; the desktop simply asks again.
    const ready = submission !== null && event !== null;
    res.json({
      submissionId: ready ? event.submissionId : null,
      sessionId: ready ? event.sessionId : null,
      at: ready ? submission.createdAt.toISOString() : null,
      accomplishment: ready ? accomplishment : null,
    });
  }),
);

/**
 * GET /progress/accomplishment/:submissionId — the success moment for a solve.
 *
 * Written just after the graded response, so the lock screen may ask a moment
 * before it exists; `pending: true` means "not written yet", not "failed".
 */
progressRouter.get(
  '/accomplishment/:submissionId',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const submissionId = String(req.params.submissionId ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(submissionId)) throw ApiError.badRequest('Invalid submission');
    const event = await prisma.learningEvent.findFirst({
      where: { userId: user.id, kind: 'ACCOMPLISHMENT', submissionId },
      select: { detail: true },
    });
    const accomplishment = (event?.detail as { accomplishment?: unknown } | null)?.accomplishment ?? null;
    res.json({ accomplishment, pending: event === null });
  }),
);

/**
 * GET /progress/complexity/:submissionId — how this solution scales, and the
 * standard approach to practise.
 *
 * Two gates, both about not handing over an answer:
 * - the submission must have passed every test (ACCEPTED, or ACCEPTED_TOO_SLOW
 *   where the slow run is exactly what this explains), and
 * - if it belonged to a lock, that lock must be over. A correct-but-slow run
 *   leaves the lock up, and the standard solution would then be the way out.
 */
progressRouter.get(
  '/complexity/:submissionId',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const submissionId = String(req.params.submissionId ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(submissionId)) throw ApiError.badRequest('Invalid submission');

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        userId: true,
        status: true,
        language: true,
        sourceCode: true,
        lockSession: { select: { state: true } },
        problem: {
          select: { editorialMarkdown: true, editorialUrl: true, referenceSolution: true },
        },
      },
    });
    // Same answer for missing and someone else's, so ids cannot be probed.
    if (!submission || submission.userId !== user.id) throw ApiError.notFound('Submission not found');
    if (submission.status !== 'ACCEPTED' && submission.status !== 'ACCEPTED_TOO_SLOW') {
      throw ApiError.conflict('Complexity feedback is available once a solution passes every test');
    }
    const state = submission.lockSession?.state;
    if (state === 'ARMED' || state === 'LOCKED') {
      throw ApiError.conflict('Complexity feedback is available once the lock is over');
    }

    const feedback = buildFeedback({
      language: submission.language as ComplexityLanguage,
      sourceCode: submission.sourceCode,
      editorialMarkdown: submission.problem.editorialMarkdown,
      editorialUrl: submission.problem.editorialUrl,
      referenceSolution: (submission.problem.referenceSolution ?? {}) as Partial<
        Record<ComplexityLanguage, string>
      >,
    });
    res.json({ complexity: feedback });
  }),
);
