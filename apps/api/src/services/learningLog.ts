import type { LearningEventKind, Prisma, Problem } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { NOT_A_RUN } from '../lib/session-filters.js';
import { logger } from '../lib/logger.js';

/**
 * The learner's own history.
 *
 * This replaces the case study the product used to generate after a solve. A
 * case study was written for an audience — polished prose proving competence to
 * someone else. The thing that actually helps the person learning is duller:
 * which problem they met, how many attempts it took, how long they sat with it,
 * and the ones they walked away from. That only exists if it is written as it
 * happens, so every entry is appended at the moment of the step.
 *
 * Two rules keep it honest:
 *
 * 1. **Append only.** Nothing here is ever revised or deleted by the app. A log
 *    that gets tidied up is a log you cannot trust about the messy parts, and
 *    the messy parts are the ones worth reading.
 * 2. **Never fatal.** Recording a step must not be able to break the step. A
 *    failed write is logged and swallowed — losing one row is a bad trade
 *    against failing a submission or, worse, holding someone's screen hostage
 *    because an insert failed.
 *
 * It is local to this machine and leaves it only if the owner exports it.
 */

export interface StepInput {
  kind: LearningEventKind;
  /** Copied, not referenced: the log must stay readable if a problem changes. */
  problem?: Pick<Problem, 'slug' | 'title' | 'difficulty' | 'tier' | 'patternFamily'> | null;
  language?: Prisma.LearningEventCreateInput['language'];
  attempt?: number;
  elapsedSeconds?: number;
  /** Kept verbatim on attempts so the log can be read — or reviewed — alone. */
  sourceCode?: string;
  submissionId?: string;
  /**
   * The lock session this step belonged to.
   *
   * Optional because some steps genuinely have no session: arming happens
   * before one exists, and a difficulty move belongs to the ladder rather than
   * to any single night.
   */
  sessionId?: string | null;
  detail?: Prisma.InputJsonValue;
}

/**
 * Append one step.
 *
 * Deliberately not awaited by most callers — see the "never fatal" rule above.
 * It returns a promise so tests can await it.
 */
export async function recordStep(userId: string, step: StepInput): Promise<void> {
  try {
    await prisma.learningEvent.create({
      data: {
        userId,
        kind: step.kind,
        problemSlug: step.problem?.slug ?? null,
        problemTitle: step.problem?.title ?? null,
        difficulty: step.problem?.difficulty ?? null,
        tier: step.problem?.tier ?? null,
        patternFamily: step.problem?.patternFamily ?? null,
        language: step.language ?? null,
        attempt: step.attempt ?? null,
        elapsedSeconds: step.elapsedSeconds ?? null,
        sourceCode: step.sourceCode ?? null,
        submissionId: step.submissionId ?? null,
        sessionId: step.sessionId ?? null,
        ...(step.detail === undefined ? {} : { detail: step.detail }),
      },
    });
  } catch (err) {
    // A lost row is not worth failing the action it was describing.
    logger.warn({ err, kind: step.kind }, 'learning log write failed');
  }
}

export interface TimelineOptions {
  limit?: number;
  before?: Date;
  kinds?: LearningEventKind[];
}

/** Most recent first, because that is the end you read from. */
export async function timeline(userId: string, options: TimelineOptions = {}) {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  return prisma.learningEvent.findMany({
    where: {
      userId,
      ...(options.before ? { at: { lt: options.before } } : {}),
      ...(options.kinds?.length ? { kind: { in: options.kinds } } : {}),
    },
    orderBy: { at: 'desc' },
    take: limit,
  });
}

/**
 * What the log is actually for: a plain answer to "am I getting anywhere?".
 *
 * Every figure is counted from rows that exist. Nothing is projected, and a
 * period with no activity reports zero rather than borrowing from another.
 */
export async function summary(userId: string, since?: Date) {
  const where = { userId, ...(since ? { at: { gte: since } } : {}) };
  const byKind = await prisma.learningEvent.groupBy({
    by: ['kind'],
    where,
    _count: { _all: true },
  });
  const count = (kind: LearningEventKind) =>
    byKind.find((row) => row.kind === kind)?._count._all ?? 0;

  const solved = count('ATTEMPT_PASSED');
  const failed = count('ATTEMPT_FAILED');
  const byFamily = await prisma.learningEvent.groupBy({
    by: ['patternFamily'],
    where: { ...where, kind: 'ATTEMPT_PASSED' },
    _count: { _all: true },
  });

  return {
    locksEngaged: count('LOCK_ENGAGED'),
    problemsServed: count('PROBLEM_SERVED'),
    solved,
    bypassed: count('LOCK_BYPASSED'),
    failedAttempts: failed,
    /** Attempts per solve, to one decimal. Null until something is solved. */
    attemptsPerSolve: solved === 0 ? null : Math.round(((failed + solved) / solved) * 10) / 10,
    solvedByFamily: byFamily
      .filter((row) => row.patternFamily !== null)
      .map((row) => ({ patternFamily: row.patternFamily, solved: row._count._all }))
      .sort((a, b) => b.solved - a.solved),
  };
}

/**
 * One problem's whole story, assembled for review.
 *
 * The point of keeping the code and the failing output is to be able to ask a
 * question later — of yourself, or of a model — that is worth answering. That
 * question needs context a bare diff cannot carry: what the problem asked, what
 * you tried first, what the judge said, how long you sat with it, and what the
 * editorial says the pattern was.
 *
 * Everything here already happened. Nothing is inferred about how you thought,
 * and where a figure is unknown the line is left out rather than guessed.
 */
export async function reviewPacket(userId: string, problemSlug: string) {
  const events = await prisma.learningEvent.findMany({
    where: { userId, problemSlug },
    orderBy: { at: 'asc' },
  });
  if (events.length === 0) return null;

  // The problem is looked up fresh for the statement and editorial; the log's
  // own copies of title and difficulty are what it showed at the time.
  const problem = await prisma.problem.findUnique({
    where: { slug: problemSlug },
    select: {
      slug: true,
      title: true,
      difficulty: true,
      tier: true,
      patternFamily: true,
      patternTags: true,
      promptMarkdown: true,
      editorialMarkdown: true,
    },
  });

  const attempts = events
    .filter((e) => e.kind === 'ATTEMPT_FAILED' || e.kind === 'ATTEMPT_PASSED')
    .map((e) => ({
      at: e.at,
      passed: e.kind === 'ATTEMPT_PASSED',
      attempt: e.attempt,
      language: e.language,
      elapsedSeconds: e.elapsedSeconds,
      sourceCode: e.sourceCode,
      detail: e.detail,
    }));

  return {
    problem,
    firstSeenAt: events[0]?.at ?? null,
    solvedAt: events.find((e) => e.kind === 'ATTEMPT_PASSED')?.at ?? null,
    bypassed: events.some((e) => e.kind === 'LOCK_BYPASSED'),
    debriefOpened: events.some((e) => e.kind === 'DEBRIEF_OPENED'),
    attempts,
    timeline: events.map((e) => ({ at: e.at, kind: e.kind })),
  };
}

/**
 * The same packet as prose, ready to paste into a model.
 *
 * Markdown rather than JSON because the question being asked is a reading
 * question. The prompt at the top is part of the artefact: without it the
 * likeliest reply is a corrected solution, which is the one thing that does not
 * help — the solution is already known by the time this is worth reading.
 */
export function renderReviewPacket(packet: NonNullable<Awaited<ReturnType<typeof reviewPacket>>>): string {
  const lines: string[] = [];
  const p = packet.problem;

  lines.push('# Review request', '');
  lines.push(
    'Below is my full attempt history for one programming problem, in order, with',
    'the code I submitted each time and what the judge said. Please tell me:',
    '',
    '1. What was actually wrong in each failed attempt — the specific defect, not a rewrite.',
    '2. What the failures have in common, if anything, and what that suggests I should drill.',
    '3. What I should have noticed in the statement that would have pointed at the pattern.',
    '',
    'Do not just give me a correct solution; I can already see one in the editorial.',
    '',
  );

  if (p) {
    lines.push(`## Problem: ${p.title}`, '');
    lines.push(`- Difficulty: ${p.difficulty}`, `- Tier: ${p.tier}`);
    if (p.patternTags.length) lines.push(`- Tags: ${p.patternTags.join(', ')}`);
    lines.push('', '### Statement', '', p.promptMarkdown, '');
  }

  lines.push('## What I did', '');
  if (packet.attempts.length === 0) {
    lines.push('_No submissions — this problem was served but never attempted._', '');
  }
  packet.attempts.forEach((a, i) => {
    const verdict = a.passed ? 'PASSED' : 'FAILED';
    lines.push(`### Attempt ${a.attempt ?? i + 1} — ${verdict}`, '');
    if (a.elapsedSeconds != null) lines.push(`Time into the lock: ${a.elapsedSeconds}s`, '');
    const d = a.detail as Record<string, unknown> | null;
    if (d && !a.passed) {
      if (typeof d.status === 'string') lines.push(`Judge verdict: ${d.status}`, '');
      const failed = Array.isArray(d.failedSamples) ? d.failedSamples : [];
      for (const f of failed as Array<Record<string, unknown>>) {
        lines.push('```', `input:    ${String(f.stdin ?? '')}`,
          `expected: ${String(f.expected ?? '')}`,
          `actual:   ${String(f.actual ?? '(no output)')}`, '```', '');
      }
      if (typeof d.hiddenFailures === 'number' && d.hiddenFailures > 0) {
        lines.push(`Plus ${d.hiddenFailures} hidden case(s) failing.`, '');
      }
    }
    if (a.sourceCode) {
      lines.push('```' + String(a.language ?? '').toLowerCase(), a.sourceCode, '```', '');
    }
  });

  if (p?.editorialMarkdown) {
    lines.push('## The editorial, for reference', '', p.editorialMarkdown, '');
  }
  return lines.join('\n');
}

/**
 * The list of sessions worth opening.
 *
 * Built from `lock_sessions` rather than from the log, because a session that
 * produced no steps at all — armed, then locked, then walked away from — is
 * still a night that happened, and a list assembled from events would silently
 * drop exactly the evenings the user is most likely to be looking for.
 *
 * The one thing it does drop is a countdown stopped before the lock ever
 * landed. `/cancel` has no state of its own and resolves to ABANDONED, the same
 * value a real surrender gets, so a timer the user simply reset was listed
 * beside genuine give-ups as 'Session — 0 attempts — abandoned'. Nothing was
 * ever assigned and nothing was ever at stake; it is not an evening, it is a
 * button press.
 *
 * Keyed on the missing problem rather than on the state, because that is what
 * actually separates the two: the reaper only ever resolves sessions that were
 * LOCKED, and a LOCKED session always has a problem. So `ABANDONED` with no
 * problem is reachable from `/cancel` and nowhere else.
 */
export async function sessionsIndex(userId: string, limit = 30) {
  const sessions = await prisma.lockSession.findMany({
    where: { userId, ...NOT_A_RUN },
    orderBy: { armedAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 200),
    select: {
      id: true,
      state: true,
      difficulty: true,
      armedAt: true,
      lockedAt: true,
      resolvedAt: true,
      attempts: true,
      escapeReason: true,
      // The title only. The statement, the editorial and the test cases all
      // stay out of a list that is rendered while a lock may still be up.
      problem: { select: { slug: true, title: true } },
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    state: s.state,
    difficulty: s.difficulty,
    armedAt: s.armedAt,
    lockedAt: s.lockedAt,
    resolvedAt: s.resolvedAt,
    attempts: s.attempts,
    escapeReason: s.escapeReason,
    problemTitle: s.problem?.title ?? null,
    problemSlug: s.problem?.slug ?? null,
  }));
}

/**
 * One lock session, read back afterwards.
 *
 * The difference from `reviewPacket` is the unit. That one answers "how did I
 * do on this problem, across every time I met it"; this answers "what happened
 * that evening" — armed, engaged, served, the attempts in order, the hints
 * spent, how it ended.
 *
 * ## What this refuses to show
 *
 * A review of a session that is **still running** is a route into the answer,
 * so while the session is unresolved it withholds everything solution-bearing
 * and names what it withheld. Concretely: no editorial, and never the text of a
 * hint. The learner's own submitted source is never withheld — it is theirs,
 * and hiding it would protect nobody.
 *
 * The mechanism is an allowlist, not a blocklist. Step details are rebuilt
 * field by field rather than passed through, so a later addition to a `detail`
 * blob cannot leak by simply existing: it has to be named here first. Same
 * reasoning as the grader omitting hidden expectations rather than nulling
 * them — a value sent for the client to hide is still a value in the response.
 */
export async function sessionReview(userId: string, sessionId: string) {
  const session = await prisma.lockSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      state: true,
      difficulty: true,
      armedAt: true,
      lockedAt: true,
      resolvedAt: true,
      attempts: true,
      escapeReason: true,
      problemId: true,
    },
  });
  // Not found and not yours give the same answer on purpose: a distinct message
  // for "exists but belongs to someone else" is an existence oracle.
  if (!session || session.userId !== userId) return null;

  const events = await prisma.learningEvent.findMany({
    where: { userId, sessionId },
    orderBy: { at: 'asc' },
  });

  // UNLOCKED, BYPASSED and ABANDONED are all endings. ARMED and LOCKED are not,
  // and that distinction is the whole access rule below.
  const resolved = session.state !== 'ARMED' && session.state !== 'LOCKED';

  const problem = session.problemId
    ? await prisma.problem.findUnique({
        where: { id: session.problemId },
        select: {
          slug: true,
          title: true,
          difficulty: true,
          tier: true,
          patternFamily: true,
          patternTags: true,
          // Solution-bearing. Read here, returned only once resolved.
          editorialMarkdown: true,
        },
      })
    : null;

  const steps = events.map((e) => ({
    at: e.at,
    kind: e.kind,
    attempt: e.attempt,
    language: e.language,
    elapsedSeconds: e.elapsedSeconds,
    // The learner's own code. Theirs whether the lock is open or shut.
    sourceCode: e.sourceCode,
    ...summariseDetail(e.kind, e.detail),
  }));

  return {
    session: {
      id: session.id,
      state: session.state,
      difficulty: session.difficulty,
      armedAt: session.armedAt,
      lockedAt: session.lockedAt,
      resolvedAt: session.resolvedAt,
      attempts: session.attempts,
      escapeReason: session.escapeReason,
    },
    resolved,
    problem: problem
      ? {
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          tier: problem.tier,
          patternFamily: problem.patternFamily,
          patternTags: problem.patternTags,
        }
      : null,
    /** Null until the session ends. See the docblock. */
    editorial: resolved ? (problem?.editorialMarkdown ?? null) : null,
    steps,
    /**
     * True when the session left no attributable steps — it ran before the log
     * began carrying a session id, or it ended before anything happened. The
     * interface says so rather than rendering an empty evening as though
     * nothing did.
     */
    partial: events.length === 0,
    /**
     * What was deliberately left out, in plain words. A blank space with no
     * explanation reads as a bug; naming the omission makes the rule visible
     * instead of mysterious.
     */
    withheld: resolved
      ? []
      : [
          'The editorial is hidden until this session ends. It names the pattern, ' +
            'which is most of the answer.',
        ],
  };
}

/**
 * Rebuild the readable part of a `detail` blob, field by field.
 *
 * An allowlist, because `detail` is untyped JSON that several call sites write
 * to. Passing it through would publish every future addition the moment it was
 * written, which is how a "small kind-specific field" becomes a leak nobody
 * reviewed. Anything not named here does not appear.
 *
 * `failedSamples` is safe to carry: the grader only ever puts *sample* cases
 * there, and a sample's expected output is printed in the problem statement.
 * Hidden cases arrive as a count and stay a count.
 */
function summariseDetail(kind: LearningEventKind, detail: Prisma.JsonValue | null) {
  const d = (detail ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' ? v : null);
  const str = (v: unknown) => (typeof v === 'string' ? v : null);

  switch (kind) {
    case 'TIMER_ARMED':
      return { minutes: num(d.minutes) };
    case 'LOCK_ENGAGED':
      return { engagedDifficulty: str(d.difficulty) };
    case 'ATTEMPT_FAILED':
      return {
        verdict: str(d.status),
        passedCount: num(d.passedCount),
        totalCount: num(d.totalCount),
        hiddenFailures: num(d.hiddenFailures),
        failedSamples: Array.isArray(d.failedSamples)
          ? (d.failedSamples as Array<Record<string, unknown>>).map((f) => ({
              ordinal: num(f.ordinal),
              stdin: str(f.stdin),
              expected: str(f.expected),
              actual: str(f.actual),
              status: str(f.status),
            }))
          : [],
      };
    case 'ATTEMPT_PASSED':
      return { runtimeMs: num(d.runtimeMs), gateMs: num(d.gateMs) };
    case 'HINT_REVEALED':
      // The index, never the text. Which hint was spent is the fact worth
      // reviewing; reprinting it would put a third of the answer into a
      // response that is also readable while the lock is still up.
      return { hintIndex: num(d.index) };
    case 'LOCK_BYPASSED':
      return { skipsRemaining: num(d.skipsRemaining) };
    case 'DIFFICULTY_CHANGED':
      return { transition: str(d.transition), reason: str(d.reason) };
    default:
      return {};
  }
}

/**
 * The session as prose, for reading back or handing to a model.
 *
 * The same decision as `renderReviewPacket`: the framing at the top is part of
 * the artefact. Without it the likeliest reply to a night's log is a corrected
 * solution, and by the time this is worth reading the solution is not the
 * interesting part — the sequence is.
 */
export function renderSessionReview(
  review: NonNullable<Awaited<ReturnType<typeof sessionReview>>>,
): string {
  const lines: string[] = [];
  const s = review.session;
  const heldMinutes =
    s.lockedAt && s.resolvedAt
      ? Math.max(0, Math.round((s.resolvedAt.getTime() - s.lockedAt.getTime()) / 60_000))
      : null;

  lines.push(`# Session — ${s.armedAt.toISOString().slice(0, 16).replace('T', ' ')}`, '');
  lines.push(`- Outcome: ${s.state}${s.escapeReason ? ` (${s.escapeReason})` : ''}`);
  lines.push(`- Difficulty: ${s.difficulty}`);
  lines.push(`- Attempts: ${s.attempts}`);
  if (heldMinutes !== null) lines.push(`- Locked for: ${heldMinutes} min`);
  if (review.problem) lines.push(`- Problem: ${review.problem.title} (${review.problem.slug})`);
  lines.push('');

  if (review.partial) {
    lines.push(
      '_No step-by-step record for this session: it ran before the log began',
      'attributing steps to sessions, so only the summary above is known._',
      '',
    );
  }

  if (review.steps.length > 0) {
    lines.push('## What happened', '');
    for (const step of review.steps) {
      lines.push(`### ${step.at.toISOString().slice(11, 19)} — ${step.kind}`, '');
      if (step.elapsedSeconds != null) lines.push(`Into the lock: ${step.elapsedSeconds}s`, '');
      if ('verdict' in step && step.verdict) {
        lines.push(
          `Judge: ${step.verdict} (${step.passedCount ?? '?'}/${step.totalCount ?? '?'} passed)`,
          '',
        );
      }
      if ('failedSamples' in step && step.failedSamples) {
        for (const f of step.failedSamples) {
          lines.push(
            '```',
            `input:    ${f.stdin ?? ''}`,
            `expected: ${f.expected ?? ''}`,
            `actual:   ${f.actual ?? '(no output)'}`,
            '```',
            '',
          );
        }
      }
      if ('hiddenFailures' in step && step.hiddenFailures) {
        lines.push(`Plus ${step.hiddenFailures} hidden case(s) failing.`, '');
      }
      if ('hintIndex' in step && step.hintIndex != null) {
        lines.push(`Spent hint ${step.hintIndex + 1}.`, '');
      }
      if (step.sourceCode) {
        lines.push('```' + String(step.language ?? '').toLowerCase(), step.sourceCode, '```', '');
      }
    }
  }

  for (const note of review.withheld) lines.push(`_${note}_`, '');
  if (review.editorial) lines.push('## The editorial, for reference', '', review.editorial, '');

  return lines.join('\n');
}
