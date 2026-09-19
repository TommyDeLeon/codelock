import { Router } from 'express';
import { Prisma, SubmissionStatus } from '@prisma/client';
import type {
  Language,
  LearnLessonSummary,
  LearnRecommendationView,
  LearnResourceView,
  LearnSourceView,
  LearnView,
  LessonCheckResultView,
  LessonPracticeView,
  LessonSessionView,
  LessonView,
} from '@codelock/shared';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/error.js';
import { withLocalUser, currentUser } from '../middleware/localUser.js';
import { lockActionLimiter, submitLimiter } from '../middleware/rateLimit.js';
import {
  learnPracticeHintSchema,
  learnPracticeSubmitSchema,
  learnQuerySchema,
  lessonCheckSchema,
  lessonCorrectionSchema,
  lessonDraftSchema,
  lessonFinishSchema,
  lessonParamSchema,
  lessonPlacementSchema,
  lessonPracticeSchema,
  lessonStartSchema,
} from '../validation/schemas.js';
import { acquireGradeSlot } from '../services/gradeQueue.js';
import { gradeSubmission } from '../services/grading.js';
import { runBatch } from '../services/judge0.js';
import { recordStepConfirmed } from '../services/learningLog.js';
import { toPublicProblem } from '../services/publicProblem.js';
import { SKILL_LABELS, fitForLearner, scoreProblemForLearner, skillsRequiredBy, type Skill } from '../services/skills.js';
import { STATE_LABELS } from '../services/tutor/accomplishment.js';
import { CATALOG, CONTENT_VERSION, FOUNDATION_LESSONS, RESOURCE_ENTRIES, TASK_CPU_SECONDS, findLesson, type Lesson, type LessonSource } from '../services/learn/catalog.js';
import { constructsText, techniquesFor } from '../services/tutor/techniques.js';
import { termsIn } from '../services/tutor/glossary.js';
import { isIntroduced, isPractised, type SkillSnapshot } from '../services/skills.js';
import type { LessonPrimerView } from '@codelock/shared';
import { lessonForSkill } from '../services/learn/catalog.js';
import { loadLearnerEvidence } from '../services/learn/evidence.js';
import { recommendLesson, type Recommendation } from '../services/learn/recommend.js';
import { produceHint } from './tutor.js';

/**
 * Learn: what to study next, one lesson at a time, and practice that cannot
 * touch a lock.
 *
 * Reads and writes are kept apart on purpose. `GET /learn` and
 * `GET /learn/lessons/:id` change nothing — no event, no session row, no
 * problem assignment. Starting a lesson, saving a draft, answering a check,
 * finishing and correcting are each an explicit POST/PATCH, and each is
 * written as a `LESSON` event so the log can be read back.
 *
 * Nothing in this file imports `lockSessions.ts` or reads `LockSession`. The
 * practice routes call the grader and the hint builder with no session
 * argument, so a solve here is a practice solve by construction.
 */

export const learnRouter = Router();
learnRouter.use(withLocalUser);

/** The lesson steps, in the order the client walks them. */
const STEP = { idea: 0, example: 1, prediction: 2, task: 3, practice: 4, done: 5 } as const;

/** Task checks run against the judge with the corpus memory default; time is per language. */
const TASK_MEMORY_KB = 512_000;
/** A problem solved this recently is not offered as practice again. */
const PRACTICE_REPEAT_DAYS = 21;

const sourceView = (s: LessonSource): LearnSourceView => ({
  publisher: s.publisher,
  title: s.title,
  url: s.url,
  section: s.section,
  runtime: s.runtime,
  reviewedOn: s.reviewedOn,
});

function summary(lesson: Lesson, state: { state: string }): LearnLessonSummary {
  return {
    id: lesson.id,
    skill: lesson.skill,
    skillLabel: SKILL_LABELS[lesson.skill],
    title: lesson.title,
    objective: lesson.objective,
    prerequisites: lesson.prerequisites.map((p) => SKILL_LABELS[p]),
    skillState: state.state,
    skillStateLabel: STATE_LABELS[state.state] ?? state.state,
    family: lesson.family,
  };
}

function recommendationView(rec: Recommendation, snapshotState: (skill: Skill) => { state: string }): LearnRecommendationView {
  const lesson = rec.lessonId ? findLesson(rec.lessonId) : undefined;
  return {
    lesson: lesson ? summary(lesson, snapshotState(lesson.skill)) : null,
    reasonCode: rec.reasonCode,
    reason: rec.reason,
    confidence: rec.confidence,
    language: rec.language,
    contentVersion: rec.contentVersion,
    variantAvailable: rec.variantAvailable,
    fluencyNote: rec.fluencyNote,
  };
}

/**
 * The lesson as a client may see it: no answer index, no task solution.
 *
 * `evidence` shapes the depth and the primers: a skill the learner has
 * practised opens on the refresher, one they have not opens on the full
 * explanation, and a prerequisite they have not met at all is explained in
 * place. All of it is a starting point the learner can override; none of it
 * hides an explanation.
 */
function lessonView(
  lesson: Lesson,
  language: Language,
  evidence: { snapshot: SkillSnapshot; fluency: Partial<Record<Skill, Partial<Record<Language, number>>>> } | null,
): LessonView {
  const variant = lesson.variants[language];
  const record = evidence?.snapshot[lesson.skill];
  const known = record ? isPractised(record) : false;
  const appliedHere = (evidence?.fluency[lesson.skill]?.[language] ?? 0) > 0;
  const depth: LessonView['depth'] = !known ? 'beginner' : appliedHere ? 'concise' : 'bridge';
  const primers: LessonPrimerView[] = [];
  for (const skill of lesson.prerequisites) {
    if (evidence && isIntroduced(evidence.snapshot[skill])) continue;
    const prereq = lessonForSkill(skill);
    if (!prereq) continue;
    primers.push({
      skill,
      label: SKILL_LABELS[skill],
      title: prereq.title,
      explanation: prereq.refresher,
      smaller: prereq.smaller,
      lessonId: prereq.id,
    });
  }
  return {
    depth,
    refresher: lesson.refresher,
    terms: termsIn(`${lesson.explanation} ${lesson.refresher} ${lesson.alternate}`, language),
    primers,
    id: lesson.id,
    skill: lesson.skill,
    skillLabel: SKILL_LABELS[lesson.skill],
    title: lesson.title,
    objective: lesson.objective,
    prerequisites: lesson.prerequisites.map((p) => SKILL_LABELS[p]),
    explanation: lesson.explanation,
    alternate: lesson.alternate,
    trace: lesson.trace,
    smaller: lesson.smaller,
    check: { id: lesson.check.id, question: lesson.check.question, options: lesson.check.options },
    language,
    variant: {
      example: variant.example,
      note: variant.note,
      task: { prompt: variant.task.prompt, starter: variant.task.starter, stdout: variant.task.stdout },
      sources: variant.sources.map(sourceView),
      // The lines this lesson's techniques need in this language: the same
      // table the hint ladder shows, so the lesson and the hints agree.
      syntax: constructsText(techniquesFor(lesson.tags), language),
    },
    sources: lesson.sources.map(sourceView),
    contentVersion: CONTENT_VERSION,
  };
}

type SessionRow = Prisma.LessonSessionGetPayload<Record<string, never>>;

/** The checks column, which this file alone writes, read back as what it wrote. */
const checksOf = (value: unknown): Record<string, LessonCheckResultView> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, LessonCheckResultView>) : {};

function sessionView(row: SessionRow): LessonSessionView {
  return {
    id: row.id,
    lessonId: row.lessonId,
    language: row.language,
    contentVersion: row.contentVersion,
    step: row.step,
    status: row.status === 'finished' ? 'finished' : 'active',
    version: row.version,
    draft: (row.draft ?? {}) as Record<string, string>,
    checks: checksOf(row.checks),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function preferredLanguage(userId: string, requested: Language | undefined): Promise<Language> {
  if (requested) return requested;
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { preferredLanguage: true } });
  return row?.preferredLanguage ?? 'JAVASCRIPT';
}

function requireLesson(id: string): Lesson {
  const lesson = findLesson(id);
  if (!lesson) throw ApiError.notFound('Lesson not found');
  return lesson;
}

/** The row a mutation acts on, or 404. Never someone else's: scoped by user. */
async function requireSession(userId: string, lessonId: string): Promise<SessionRow> {
  const row = await prisma.lessonSession.findUnique({ where: { userId_lessonId: { userId, lessonId } } });
  if (!row) throw ApiError.notFound('Lesson has not been started');
  return row;
}

function lessonEvent(lesson: Lesson, language: Language, action: string, extra: Record<string, unknown> = {}) {
  return {
    kind: 'LESSON' as const,
    language,
    detail: { action, lessonId: lesson.id, contentVersion: CONTENT_VERSION, ...extra },
  };
}

function stale(res: { status: (n: number) => { json: (b: unknown) => void } }, row: SessionRow): void {
  res.status(409).json({
    error: { code: 'STALE_SESSION', message: 'This lesson moved on elsewhere; reloaded.' },
    session: sessionView(row),
  });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/**
 * GET /learn — the recommendation, an optional review, the topic list and
 * the reading list, for one language. Writes nothing.
 */
learnRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const query = learnQuerySchema.parse(req.query);
    const language = await preferredLanguage(user.id, query.language);
    const now = new Date();
    const evidence = await loadLearnerEvidence(user.id, now);
    const plan = recommendLesson(evidence, language, now);
    const state = (skill: Skill) => evidence.snapshot[skill];

    let active: LessonSessionView | null = null;
    if (evidence.activeLesson) {
      const row = await prisma.lessonSession
        .findUnique({ where: { userId_lessonId: { userId: user.id, lessonId: evidence.activeLesson.lessonId } } })
        .catch(() => null);
      active = row ? sessionView(row) : null;
    }

    const anyHistory = Object.values(evidence.snapshot).some((r) => r.state !== 'not_introduced');
    const view: LearnView = {
      language,
      contentVersion: CONTENT_VERSION,
      history: !evidence.available ? 'unavailable' : anyHistory ? 'available' : 'empty',
      primary: recommendationView(plan.primary, state),
      review: plan.review ? recommendationView(plan.review, state) : null,
      topics: CATALOG.map((lesson) => summary(lesson, state(lesson.skill))),
      resources: RESOURCE_ENTRIES.map(
        (entry): LearnResourceView => ({
          family: entry.family,
          title: entry.title,
          summary: entry.summary,
          coverage: entry.coverage,
          resources: entry.resources.map(sourceView),
        }),
      ),
      active,
    };
    res.json(view);
  }),
);

/** GET /learn/lessons/:id — one lesson in one language, plus the saved session if any. Writes nothing. */
learnRouter.get(
  '/lessons/:id',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = lessonParamSchema.parse(req.params);
    const query = learnQuerySchema.parse(req.query);
    const lesson = requireLesson(id);
    const language = await preferredLanguage(user.id, query.language);
    const [row, evidence] = await Promise.all([
      prisma.lessonSession.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } } }).catch(() => null),
      loadLearnerEvidence(user.id),
    ]);
    res.json({
      lesson: lessonView(lesson, language, evidence.available ? { snapshot: evidence.snapshot, fluency: evidence.fluency } : null),
      session: row ? sessionView(row) : null,
    });
  }),
);

// ---------------------------------------------------------------------------
// Lesson session mutations
// ---------------------------------------------------------------------------

/**
 * POST /learn/lessons/:id/start — open or reopen the lesson.
 *
 * One row per learner and lesson. Starting again after finishing reopens
 * the row from the first step, keeping drafts and check results; a lesson
 * merely left open resumes where it was. The event says which. Switching
 * language updates the row's language: checks already passed were passed in
 * the old language and stay recorded under their attempt ids.
 */
learnRouter.post(
  '/lessons/:id/start',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = lessonParamSchema.parse(req.params);
    const body = lessonStartSchema.parse(req.body ?? {});
    const lesson = requireLesson(id);

    const existing = await prisma.lessonSession.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    });
    const row = existing
      ? await prisma.lessonSession.update({
          where: { id: existing.id },
          data: {
            language: body.language,
            status: 'active',
            finishedAt: null,
            version: { increment: 1 },
            ...(existing.status === 'finished' ? { step: STEP.idea } : {}),
          },
        })
      : await prisma.lessonSession.create({
          data: { userId: user.id, lessonId: lesson.id, language: body.language, contentVersion: CONTENT_VERSION },
        });

    await recordStepConfirmed(
      user.id,
      lessonEvent(lesson, body.language, existing && existing.status === 'active' ? 'resumed' : 'started', {
        step: row.step,
      }),
    );
    res.status(existing ? 200 : 201).json({ session: sessionView(row) });
  }),
);

/**
 * PATCH /learn/lessons/:id/draft — save unsent answers and the open step.
 *
 * Conditional on `version`: a request built against an older row is refused
 * with 409 and the current row, so a save that lands after a restart cannot
 * overwrite newer work. No event: a draft is not a step the log needs.
 */
learnRouter.patch(
  '/lessons/:id/draft',
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = lessonParamSchema.parse(req.params);
    const body = lessonDraftSchema.parse(req.body ?? {});
    const lesson = requireLesson(id);
    const row = await requireSession(user.id, lesson.id);

    const updated = await prisma.lessonSession.updateMany({
      where: { id: row.id, version: body.version, status: 'active' },
      data: {
        version: { increment: 1 },
        ...(body.step !== undefined ? { step: body.step } : {}),
        ...(body.draft !== undefined ? { draft: body.draft } : {}),
      },
    });
    if (updated.count === 0) {
      stale(res, await requireSession(user.id, lesson.id));
      return;
    }
    res.json({ session: sessionView(await requireSession(user.id, lesson.id)) });
  }),
);

/**
 * POST /learn/lessons/:id/checks — answer the prediction, or run the task.
 *
 * Graded here, never trusted from the client. The transaction locks the
 * session row (`FOR UPDATE`) before reading `checks` and `status`, so two
 * retries of the same `attemptId` serialise: the second finds the first's
 * result and returns it without writing a second event. A task is run on
 * the judge before the transaction opens, because a judge round-trip must
 * not hold a row lock; the result is then claimed under the lock, and if
 * the row already holds this attempt by then, the stored result wins and
 * the fresh run is discarded. A lesson finished while the judge was running
 * refuses the claim under that same lock, not only in the pre-check.
 *
 * A check is additive — keyed by attempt id, never overwriting another
 * attempt — so it does not carry the row `version` the way a draft does. A
 * draft save that lands while a check is in flight is not a conflict.
 */
learnRouter.post(
  '/lessons/:id/checks',
  submitLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = lessonParamSchema.parse(req.params);
    const body = lessonCheckSchema.parse(req.body ?? {});
    const lesson = requireLesson(id);
    const row = await requireSession(user.id, lesson.id);

    // Short-circuit before any grading: a retry that already landed. Before
    // the status check, because a stored result stays readable after the
    // lesson is finished — a retry of it is not a new attempt.
    const already = checksOf(row.checks)[body.attemptId];
    if (already) {
      res.json({ result: already, duplicate: true, session: sessionView(row) });
      return;
    }
    if (row.status !== 'active') throw ApiError.conflict('This lesson is finished; start it again to answer checks');

    let result: LessonCheckResultView;
    if (body.kind === 'prediction') {
      if (body.checkId !== lesson.check.id || body.answer === undefined) throw ApiError.badRequest('Unknown check');
      result = {
        attemptId: body.attemptId,
        checkId: body.checkId,
        kind: 'prediction',
        correct: body.answer === lesson.check.answer,
        explanation: lesson.check.explanation,
        stdout: null,
        stderr: null,
        at: new Date().toISOString(),
      };
    } else {
      if (body.checkId !== 'task' || !body.sourceCode?.trim()) throw ApiError.badRequest('A task check needs the program');
      const variant = lesson.variants[row.language];
      const release = await acquireGradeSlot(user.id);
      let graded;
      try {
        graded = await runBatch({
          language: row.language,
          sourceCode: body.sourceCode,
          cases: [{ stdin: '', expectedOutput: variant.task.stdout }],
          cpuTimeLimit: TASK_CPU_SECONDS[row.language],
          memoryLimitKb: TASK_MEMORY_KB,
        });
      } finally {
        release();
      }
      const first = graded.results[0];
      if (!first) throw ApiError.upstream('The judge returned no result');
      const want = JSON.stringify(variant.task.stdout.trimEnd());
      result = {
        attemptId: body.attemptId,
        checkId: 'task',
        kind: 'task',
        correct: first.passed,
        explanation: first.passed
          ? `It prints ${want}, which is what the task asked for.`
          : first.compileOutput
            ? 'The program did not build. The compiler message is below; the line it names is where to look.'
            : `Expected ${want}. What it printed is below.`,
        stdout: first.stdout,
        stderr: first.compileOutput ?? first.stderr,
        at: new Date().toISOString(),
      };
    }

    const stored = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ checks: unknown; step: number; status: string }[]>`
        SELECT "checks", "step", "status" FROM "lesson_sessions" WHERE "id" = ${row.id}::uuid FOR UPDATE
      `;
      const current = locked[0];
      if (!current) throw ApiError.notFound('Lesson has not been started');
      const checks = checksOf(current.checks);
      const existing = checks[body.attemptId];
      if (existing) return { result: existing, duplicate: true };
      if (current.status !== 'active') {
        throw ApiError.conflict('This lesson was finished while the check was running; start it again to answer checks');
      }

      const next = { ...checks, [body.attemptId]: result };
      const step = Math.max(current.step, body.kind === 'prediction' ? STEP.prediction : STEP.task);
      await tx.lessonSession.update({
        where: { id: row.id },
        data: { checks: next as unknown as Prisma.InputJsonValue, version: { increment: 1 }, step },
      });
      await tx.learningEvent.create({
        data: {
          userId: user.id,
          kind: 'LESSON',
          language: row.language,
          detail: {
            action: 'check',
            lessonId: lesson.id,
            contentVersion: row.contentVersion,
            attemptId: body.attemptId,
            checkId: body.checkId,
            kind: body.kind,
            correct: result.correct,
          },
        },
      });
      return { result, duplicate: false };
    });

    res.json({ ...stored, session: sessionView(await requireSession(user.id, lesson.id)) });
  }),
);

/**
 * POST /learn/lessons/:id/practice — pick a practice problem for this lesson.
 *
 * Resolved now, not when the recommendation was made: eligibility is judged
 * against the snapshot as it is at this moment, over the active corpus, for
 * problems that need the lesson's skill. Solved-lately problems are skipped
 * so "a different problem" means one. Never a lock: the problem is returned
 * for a practice solve, and nothing is assigned anywhere.
 */
learnRouter.post(
  '/lessons/:id/practice',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = lessonParamSchema.parse(req.params);
    const body = lessonPracticeSchema.parse(req.body ?? {});
    const lesson = requireLesson(id);
    const row = await requireSession(user.id, lesson.id);

    const evidence = await loadLearnerEvidence(user.id);
    if (!evidence.available) throw ApiError.unavailable('Your history could not be read; try practice again in a moment.');

    const since = new Date(Date.now() - PRACTICE_REPEAT_DAYS * 86_400_000);
    const [candidates, recent] = await Promise.all([
      prisma.problem.findMany({
        where: lesson.family
          ? { isActive: true, patternFamily: lesson.family, tier: { in: ['TIER_0', 'TIER_1'] } }
          : { isActive: true, tier: 'TIER_0' },
        orderBy: { slug: 'asc' },
        select: { id: true, slug: true, signatureId: true, patternTags: true, tier: true, patternFamily: true },
      }),
      prisma.submission.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: since },
          status: { in: [SubmissionStatus.ACCEPTED, SubmissionStatus.ACCEPTED_TOO_SLOW] },
        },
        select: { problemId: true },
        distinct: ['problemId'],
      }),
    ]);
    const solvedLately = new Set(recent.map((r) => r.problemId));

    // Best score wins; slugs are already in order, so a tie keeps the first.
    let best: { id: string; score: number } | null = null;
    for (const problem of candidates) {
      if (solvedLately.has(problem.id)) continue;
      if (!lesson.family && !skillsRequiredBy(problem).includes(lesson.practiceSkill)) continue;
      // A pattern lesson's practice is a problem of its family; the skill
      // gate still applies, and a tag match is preferred over the family alone.
      const score = scoreProblemForLearner(problem, evidence.snapshot, lesson.practiceSkill);
      if (score === null) continue;
      const bonus = lesson.family && lesson.tags.some((t) => problem.patternTags.includes(t)) ? 20 : 0;
      if (!best || score + bonus > best.score) best = { id: problem.id, score: score + bonus };
    }
    if (!best) {
      throw ApiError.notFound(
        'No practice problem fits right now: everything on this skill was solved recently, or needs something not yet met.',
      );
    }
    const problem = await prisma.problem.findUniqueOrThrow({ where: { id: best.id } });
    const fit = fitForLearner(problem, evidence.snapshot);

    // No version guard on purpose: this only moves `step` forward with
    // `Math.max`, which cannot undo newer work, and a learner pressing
    // "Practise" while a draft save is in flight must not be refused.
    await prisma.lessonSession.updateMany({
      where: { id: row.id, status: 'active' },
      data: { step: Math.max(row.step, STEP.practice), version: { increment: 1 } },
    });
    await recordStepConfirmed(user.id, {
      ...lessonEvent(lesson, body.language, 'practice_started', { problemSlug: problem.slug }),
      problem,
    });

    const view: LessonPracticeView = {
      problem: await toPublicProblem(problem),
      fit: `It ${fit.reason}.`,
      note: 'A pass here is saved as a practice solve. Hints and the worked solution are free; using them records the solve as with help.',
    };
    res.json(view);
  }),
);

/** POST /learn/lessons/:id/finish — close the lesson for now. Participation only. */
learnRouter.post(
  '/lessons/:id/finish',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { id } = lessonParamSchema.parse(req.params);
    const body = lessonFinishSchema.parse(req.body ?? {});
    const lesson = requireLesson(id);
    const row = await requireSession(user.id, lesson.id);

    // One transaction: the row moves to finished and the event that says so
    // land together or not at all, and only an active row can be finished,
    // so re-sending the last version of an already finished row is a 409
    // rather than a second finish event.
    const finished = await prisma.$transaction(async (tx) => {
      const updated = await tx.lessonSession.updateMany({
        where: { id: row.id, version: body.version, status: 'active' },
        data: { status: 'finished', finishedAt: new Date(), step: STEP.done, version: { increment: 1 } },
      });
      if (updated.count === 0) return false;
      const event = lessonEvent(lesson, row.language, 'finished', { step: row.step });
      await tx.learningEvent.create({ data: { userId: user.id, kind: event.kind, language: event.language, detail: event.detail } });
      return true;
    });
    if (!finished) {
      stale(res, await requireSession(user.id, lesson.id));
      return;
    }
    res.json({ session: sessionView(await requireSession(user.id, lesson.id)) });
  }),
);

/**
 * POST /learn/placement — "I already know the foundations".
 *
 * Eight `known` corrections in one request, one per foundation lesson, so a
 * learner who clears Tier 0 without thinking is not walked through values
 * and comparisons. Corrections, not evidence: the skill map still moves
 * only on solves, and each can be reversed by opening the lesson.
 */
learnRouter.post(
  '/placement',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    lessonPlacementSchema.parse(req.body ?? {});
    const language = await preferredLanguage(user.id, undefined);
    for (const lesson of FOUNDATION_LESSONS) {
      await recordStepConfirmed(user.id, lessonEvent(lesson, language, 'correction', { correction: 'known', placement: true }));
    }
    res.json({ ok: true, marked: FOUNDATION_LESSONS.length });
  }),
);

/**
 * POST /learn/correction — "I know this" or "this is too hard".
 *
 * An event, not an edit: the next recommendation reads it and steps
 * forward or back, and the history it was based on is untouched. "I know
 * this" does not mark a skill demonstrated; only a solve does that.
 */
learnRouter.post(
  '/correction',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = lessonCorrectionSchema.parse(req.body ?? {});
    const lesson = requireLesson(body.lessonId);
    const language = await preferredLanguage(user.id, undefined);
    await recordStepConfirmed(user.id, lessonEvent(lesson, language, 'correction', { correction: body.correction }));
    res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------------
// Practice: the grader and the hint builder with no session, by construction
// ---------------------------------------------------------------------------

/**
 * POST /learn/practice/submit — grade a practice solve.
 *
 * The request schema has no `lockSessionId`, and the grader is called with
 * `lockSessionId: null`, so whatever the client holds, this cannot release a
 * lock, mint a token, move the difficulty ladder or re-arm a timer. What it
 * does do is exactly what a practice solve always did: record the
 * submission, and on a pass, the accomplishment.
 */
learnRouter.post(
  '/practice/submit',
  submitLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = learnPracticeSubmitSchema.parse(req.body ?? {});
    const release = await acquireGradeSlot(user.id);
    try {
      const result = await gradeSubmission({
        userId: user.id,
        problemId: body.problemId,
        lockSessionId: null,
        language: body.language,
        sourceCode: body.sourceCode,
      });
      res.status(201).json(result);
    } finally {
      release();
    }
  }),
);

/**
 * POST /learn/practice/hint — one hint on the practice problem, no session.
 *
 * Recorded as `HINT_REVEALED` with no session id, which is what makes the
 * practice solve that follows it count as assisted; level 5 is the worked
 * solution, and counts the same way.
 */
learnRouter.post(
  '/practice/hint',
  lockActionLimiter,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const body = learnPracticeHintSchema.parse(req.body ?? {});
    res.json(await produceHint(user.id, { ...body, lockSessionId: undefined }));
  }),
);
