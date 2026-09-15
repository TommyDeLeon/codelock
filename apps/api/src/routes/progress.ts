import { Router } from 'express';
import type { AccomplishmentKind, ProgressView } from '@codelock/shared';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import { withLocalUser, currentUser } from '../middleware/localUser.js';
import { SKILLS, SKILL_LABELS } from '../services/skills.js';
import { loadSkillSnapshot } from '../services/skillState.js';
import { STATE_LABELS } from '../services/tutor/accomplishment.js';

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
    const [snapshot, events, lastEvent] = await Promise.all([
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
    const event = await prisma.learningEvent.findFirst({
      where: { userId: user.id, kind: 'ACCOMPLISHMENT', sessionId: { not: null }, submissionId: { not: null } },
      orderBy: { at: 'desc' },
      select: { submissionId: true, sessionId: true, detail: true },
    });
    // Freshness is judged by when the solve happened, not by when this event
    // was written, which can lag behind a slow database.
    const submission = event?.submissionId
      ? await prisma.submission.findFirst({
          where: { id: event.submissionId, userId: user.id },
          select: { createdAt: true },
        })
      : null;
    const accomplishment = (event?.detail as { accomplishment?: unknown } | null)?.accomplishment ?? null;
    res.json({
      submissionId: submission ? event!.submissionId : null,
      sessionId: submission ? event!.sessionId : null,
      at: submission?.createdAt.toISOString() ?? null,
      accomplishment: submission ? accomplishment : null,
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
