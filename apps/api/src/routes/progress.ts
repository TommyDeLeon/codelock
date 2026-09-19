import { Router } from 'express';
import type { AccomplishmentKind, ProgressView } from '@codelock/shared';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import { withLocalUser, currentUser } from '../middleware/localUser.js';
import { SKILLS, SKILL_LABELS } from '../services/skills.js';
import { loadSkillSnapshot } from '../services/skillState.js';
import { STATE_LABELS } from '../services/tutor/accomplishment.js';
import { describeFrontier, loadFrontierLocks, nearestInterview } from '../services/frontier.js';
import { ALL_PROBLEMS } from '../corpus/problems/index.js';
import { buildFeedback, type ComplexityLanguage } from '../services/complexity.js';

export const progressRouter = Router();
progressRouter.use(withLocalUser);

/** Absence long enough that the page says hello again, without any guilt. */
const WELCOME_BACK_DAYS = 7;
const KINDS: AccomplishmentKind[] = ['independent', 'assisted', 'worked_solution', 'recall', 'transfer'];

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
