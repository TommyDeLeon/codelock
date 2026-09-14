import { Router } from 'express';
import type { AccomplishmentKind, ProgressView, ProjectStepView } from '@codelock/shared';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { asyncHandler } from '../middleware/error.js';
import { withLocalUser, currentUser } from '../middleware/localUser.js';
import { lockActionLimiter } from '../middleware/rateLimit.js';
import { runBatch } from '../services/judge0.js';
import { assembleSource } from '../services/grading.js';
import { toPublicProblem } from '../services/lockSessions.js';
import { SKILLS, SKILL_LABELS } from '../services/skills.js';
import { loadSkillSnapshot, loadSolveRecords } from '../services/skillState.js';
import { STATE_LABELS } from '../services/tutor/accomplishment.js';
import { SCOREBOARD_ARC, composeScoreboard, type StepOutput } from '../services/tutor/projects.js';

export const progressRouter = Router();
progressRouter.use(withLocalUser);

/** Absence long enough that the page says hello again, without any guilt. */
const WELCOME_BACK_DAYS = 7;
const KINDS: AccomplishmentKind[] = ['independent', 'assisted', 'worked_solution', 'recall', 'transfer'];

/**
 * GET /progress — skills, the project, and recent accomplishments.
 *
 * Everything here is derived from stored submissions and events, so it
 * survives a restart by construction. There are no streaks and nothing that
 * resets for being away.
 */
progressRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const [snapshot, solves, events, lastEvent, arcProblems] = await Promise.all([
      loadSkillSnapshot(user.id),
      loadSolveRecords(user.id),
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
      prisma.problem.findMany({
        where: { slug: { in: SCOREBOARD_ARC.steps.map((s) => s.slug) } },
        select: { id: true, slug: true },
      }),
    ]);

    const idBySlug = new Map(arcProblems.map((p) => [p.slug, p.id]));
    const steps: ProjectStepView[] = SCOREBOARD_ARC.steps.map((step) => {
      const mine = solves.filter((s) => s.slug === step.slug);
      return {
        slug: step.slug,
        title: step.title,
        concept: step.concept,
        adds: step.adds,
        status: mine.some((s) => !s.assisted) ? 'independent' : mine.length > 0 ? 'assisted' : 'not_started',
        problemId: idBySlug.get(step.slug) ?? null,
      };
    });

    const counts = Object.fromEntries(KINDS.map((k) => [k, 0])) as Record<AccomplishmentKind, number>;
    for (const event of events) {
      const kind = (event.detail as { kind?: AccomplishmentKind } | null)?.kind;
      if (kind && kind in counts) counts[kind]++;
    }

    const lastActiveAt = lastEvent?.at ?? null;
    const awayDays = lastActiveAt ? (Date.now() - lastActiveAt.getTime()) / 86_400_000 : 0;

    const view: ProgressView = {
      skills: SKILLS.filter((s) => s !== 'values').map((skill) => ({
        skill,
        label: SKILL_LABELS[skill],
        state: snapshot[skill].state,
        stateLabel: STATE_LABELS[snapshot[skill].state] ?? snapshot[skill].state,
        independent: snapshot[skill].unaidedSolves,
        assisted: snapshot[skill].assistedSolves,
      })),
      arc: {
        id: SCOREBOARD_ARC.id,
        title: SCOREBOARD_ARC.title,
        blurb: SCOREBOARD_ARC.blurb,
        steps,
        completed: steps.filter((s) => s.status !== 'not_started').length,
      },
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
          ? 'Welcome back. Everything you did before is saved exactly where you left it. There is nothing to catch up on — pick one small thing, or just look around.'
          : null,
      lastActiveAt: lastActiveAt?.toISOString() ?? null,
    };
    res.json(view);
  }),
);

/**
 * GET /progress/accomplishment/:submissionId — the success moment for a solve.
 *
 * Written just after the graded response, so the screen may ask a moment
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

/** GET /progress/problem/:slug — a problem to practise outside a lock. */
progressRouter.get(
  '/problem/:slug',
  asyncHandler(async (req, res) => {
    const slug = String(req.params.slug ?? '');
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) throw ApiError.badRequest('Invalid problem');
    const problem = await prisma.problem.findUnique({ where: { slug } });
    if (!problem || !problem.isActive) throw ApiError.notFound('Problem not found');
    res.json({ problem: await toPublicProblem(problem) });
  }),
);

/**
 * GET /progress/low-energy — one small, meaningful task and an honest end.
 *
 * The next unbuilt project step if there is one; otherwise a project step that
 * was only ever solved with help; otherwise a short review of the first step.
 */
progressRouter.get(
  '/low-energy',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const solves = await loadSolveRecords(user.id);
    const solved = new Set(solves.map((s) => s.slug));
    const unaided = new Set(solves.filter((s) => !s.assisted).map((s) => s.slug));

    const nextStep = SCOREBOARD_ARC.steps.find((s) => !solved.has(s.slug));
    const assistedOnly = SCOREBOARD_ARC.steps.find((s) => solved.has(s.slug) && !unaided.has(s.slug));
    const review = SCOREBOARD_ARC.steps[0]!;

    const task = nextStep
      ? {
          slug: nextStep.slug,
          title: nextStep.title,
          why: `One small step: it adds ${nextStep.adds.charAt(0).toLowerCase()}${nextStep.adds.slice(1)} to your scoreboard.`,
        }
      : assistedOnly
        ? {
            slug: assistedOnly.slug,
            title: assistedOnly.title,
            why: 'You solved this one with help before. Trying it on your own is a small, useful check.',
          }
        : {
            slug: review.slug,
            title: review.title,
            why: 'A quick review of something you already know. Recalling it after a gap helps it stay.',
          };
    res.json({ task, finish: 'When it passes, that is today done. Nothing else is waiting.' });
  }),
);

/**
 * POST /progress/project/run — run the scoreboard with the learner's own code.
 *
 * Uses each step's most recent accepted solution, on fixed public inputs. It
 * grades nothing and records nothing. If the runner is down, the page says so
 * and nothing is lost.
 */
progressRouter.post(
  '/project/run',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const results: StepOutput[] = [];

    for (const step of SCOREBOARD_ARC.steps) {
      const submission = await prisma.submission.findFirst({
        where: {
          userId: user.id,
          problem: { slug: step.slug },
          status: { in: ['ACCEPTED', 'ACCEPTED_TOO_SLOW'] },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          language: true,
          sourceCode: true,
          problem: { select: { driverCode: true, cpuTimeLimit: true, memoryLimitKb: true } },
        },
      });
      if (!submission) continue;

      try {
        const { results: ran } = await runBatch({
          language: submission.language,
          sourceCode: assembleSource(
            (submission.problem.driverCode as Record<string, string>)[submission.language],
            submission.sourceCode,
          ),
          cases: SCOREBOARD_ARC.players.map((p) => ({ stdin: step.stdinFor(p.rounds), expectedOutput: '' })),
          cpuTimeLimit: submission.problem.cpuTimeLimit,
          memoryLimitKb: submission.problem.memoryLimitKb,
        });
        results.push({
          slug: step.slug,
          outputs: ran.map((r) => {
            // The expected output is deliberately blank, so a finished run is
            // "Wrong Answer" to the judge. Anything else — a time limit, a crash,
            // a compile error — is not a value to show, even with partial stdout.
            const finished = /^(Accepted|Wrong Answer)$/i.test(r.statusDescription);
            const message = (r.stderr ?? r.compileOutput ?? '').trim();
            return {
              stdout: finished ? r.stdout : null,
              error: !finished
                ? (message.split('\n').pop() || r.statusDescription).slice(0, 160)
                : message
                  ? (message.split('\n').pop() ?? 'error').slice(0, 160)
                  : null,
            };
          }),
        });
      } catch (err) {
        logger.warn({ err, step: step.slug }, 'scoreboard run unavailable');
        const view = composeScoreboard(
          [],
          'The code runner did not answer, so the scoreboard cannot run right now. Nothing is lost: your solutions are saved.',
        );
        res.json({ ...view, ran: false });
        return;
      }
    }

    const message =
      results.length === 0
        ? 'Solve Sum of an Array to add the first feature, then run the scoreboard.'
        : `Ran ${results.length} of ${SCOREBOARD_ARC.steps.length} features with your own code. The same function scored both players.`;
    res.json(composeScoreboard(results, message));
  }),
);
