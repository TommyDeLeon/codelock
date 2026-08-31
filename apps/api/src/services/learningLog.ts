import type { LearningEventKind, Prisma, Problem } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
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
