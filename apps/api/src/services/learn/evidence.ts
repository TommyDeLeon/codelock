import type { Language } from '@codelock/shared';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { emptySkillSnapshot, skillsRequiredBy, type Skill } from '../skills.js';
import { dedupeEpisodes, loadSolveRecords, replaySkillSnapshot } from '../skillState.js';
import { DIAGNOSIS_IDS, type DiagnosisId } from '../tutor/diagnose.js';
import type { ActiveLesson, BlockerEvidence, Correction, LearnerEvidence, RecentProblem } from './recommend.js';
import { ALL_PROBLEMS } from '../../corpus/problems/index.js';
import { SubmissionStatus } from '@prisma/client';

/**
 * Assemble what the recommender reads, from history the app already keeps.
 *
 * Four reads, none of them a write, and none of them a call into the
 * problem selector. The solve records are the same rows the progress page
 * and the skill snapshot use, with help attributed by the same function, so
 * Learn cannot disagree with Progress about whether a solve was assisted.
 *
 * A failed read of the solve history is reported as `available: false`
 * rather than as a beginner. The three smaller reads (blockers, the active
 * lesson, corrections) degrade to empty on failure and are logged: a missing
 * blocker means a less specific recommendation, never a wrong claim.
 */

/** How far back a hint diagnosis counts as recent. */
export const BLOCKER_WINDOW_DAYS = 14;
/** How far back a correction still shapes the recommendation. */
export const CORRECTION_WINDOW_DAYS = 30;
/** How far back the most recent problem still steers the recommendation. */
export const RECENT_PROBLEM_DAYS = 7;

export async function loadLearnerEvidence(userId: string, now = new Date()): Promise<LearnerEvidence> {
  let snapshot = emptySkillSnapshot();
  let available = true;
  const lastPractised: Partial<Record<Skill, Date>> = {};
  const fluency: Partial<Record<Skill, Partial<Record<Language, number>>>> = {};

  try {
    const records = await loadSolveRecords(userId);
    snapshot = replaySkillSnapshot(records, now);
    // Recency from the same deduplicated episodes the snapshot is replayed
    // from. Language application is counted per language and per episode,
    // and a solve with help counts: the note this feeds says whether there
    // is *any record* of applying the concept in a language, which an
    // assisted Java solve is. Unaided counts stay in the snapshot.
    for (const record of dedupeEpisodes(records)) {
      for (const skill of skillsRequiredBy(record.problem)) {
        const seen = lastPractised[skill];
        if (!seen || record.solvedAt > seen) lastPractised[skill] = record.solvedAt;
      }
    }
    const byLanguage = new Map<Language, typeof records>();
    for (const record of records) {
      const language = (record as { language?: Language }).language;
      if (!language) continue;
      const list = byLanguage.get(language);
      if (list) list.push(record);
      else byLanguage.set(language, [record]);
    }
    for (const [language, list] of byLanguage) {
      for (const record of dedupeEpisodes(list)) {
        for (const skill of skillsRequiredBy(record.problem)) {
          const per = (fluency[skill] ??= {});
          per[language] = (per[language] ?? 0) + 1;
        }
      }
    }
  } catch (err) {
    logger.warn({ err, userId }, 'learn: solve history unavailable');
    available = false;
  }

  const [blockers, activeLesson, corrections, recentProblem] = await Promise.all([
    loadBlockers(userId, now),
    loadActiveLesson(userId),
    loadCorrections(userId, now),
    loadRecentProblem(userId, now),
  ]);

  return { snapshot, available, lastPractised, fluency, blockers, activeLesson, corrections, recentProblem };
}

/**
 * The problem the learner met most recently, from the last PROBLEM_SERVED
 * event, with its outcome read from the submissions and help events that
 * followed it. The corpus module supplies the tags, because the event only
 * denormalises slug, title and family.
 */
async function loadRecentProblem(userId: string, now: Date): Promise<RecentProblem | null> {
  try {
    const since = new Date(now.getTime() - RECENT_PROBLEM_DAYS * 86_400_000);
    const served = await prisma.learningEvent.findFirst({
      where: { userId, kind: 'PROBLEM_SERVED', at: { gte: since }, problemSlug: { not: null } },
      orderBy: { at: 'desc' },
      select: { id: true, at: true, problemSlug: true, problemTitle: true, patternFamily: true, sessionId: true },
    });
    if (!served?.problemSlug || !served.patternFamily) return null;
    const definition = ALL_PROBLEMS.find((p) => p.slug === served.problemSlug);
    const [accepted, help] = await Promise.all([
      prisma.submission.findFirst({
        where: {
          userId,
          createdAt: { gte: served.at },
          status: { in: [SubmissionStatus.ACCEPTED, SubmissionStatus.ACCEPTED_TOO_SLOW] },
          problem: { slug: served.problemSlug },
        },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      prisma.learningEvent.findFirst({
        where: { userId, problemSlug: served.problemSlug, at: { gte: served.at }, kind: { in: ['HINT_REVEALED', 'DEBRIEF_OPENED'] } },
        orderBy: { at: 'asc' },
        select: { at: true },
      }),
    ]);
    const outcome: RecentProblem['outcome'] = !accepted
      ? 'unsolved'
      : help && help.at < accepted.createdAt
        ? 'assisted'
        : 'unaided';
    return {
      slug: served.problemSlug,
      title: served.problemTitle ?? served.problemSlug,
      patternFamily: served.patternFamily,
      patternTags: definition?.patternTags ?? [],
      outcome,
      at: served.at,
      eventId: served.id,
    };
  } catch (err) {
    logger.warn({ err, userId }, 'learn: recent problem unavailable');
    return null;
  }
}

/**
 * Recent hint diagnoses grouped by diagnosis, counting distinct episodes.
 *
 * An episode is a lock session, or for practice hints (no session) the
 * problem and the UTC day, matching how `dedupeEpisodes` bounds a practice
 * solve. Hints built while the judge was unavailable (`ran: false`) are
 * skipped: a diagnosis made without running the code is a weaker reading,
 * and the rule already needs two.
 */
async function loadBlockers(userId: string, now: Date): Promise<BlockerEvidence[]> {
  try {
    const since = new Date(now.getTime() - BLOCKER_WINDOW_DAYS * 86_400_000);
    const events = await prisma.learningEvent.findMany({
      where: { userId, kind: 'HINT_REVEALED', at: { gte: since } },
      orderBy: { at: 'desc' },
      take: 500,
      select: { id: true, at: true, sessionId: true, problemSlug: true, detail: true },
    });
    const byDiagnosis = new Map<DiagnosisId, { episodes: Set<string>; ids: string[]; lastAt: Date }>();
    for (const event of events) {
      const detail = (event.detail ?? {}) as { diagnosis?: unknown; ran?: unknown; source?: unknown };
      if (detail.source !== 'tutor' || detail.ran === false) continue;
      const diagnosis = String(detail.diagnosis ?? '');
      if (!(DIAGNOSIS_IDS as readonly string[]).includes(diagnosis)) continue;
      // Per session *and problem*: one lock can serve several problems, and
      // the same diagnosis on two of them is two episodes, not one.
      const episode = event.sessionId
        ? `${event.sessionId}:${event.problemSlug ?? '?'}`
        : `practice:${event.problemSlug ?? '?'}:${event.at.toISOString().slice(0, 10)}`;
      const entry = byDiagnosis.get(diagnosis as DiagnosisId) ?? { episodes: new Set(), ids: [], lastAt: event.at };
      entry.episodes.add(episode);
      entry.ids.push(event.id);
      if (event.at > entry.lastAt) entry.lastAt = event.at;
      byDiagnosis.set(diagnosis as DiagnosisId, entry);
    }
    return [...byDiagnosis.entries()].map(([diagnosis, entry]) => ({
      diagnosis,
      episodes: entry.episodes.size,
      eventIds: entry.ids,
      lastAt: entry.lastAt,
    }));
  } catch (err) {
    logger.warn({ err, userId }, 'learn: hint history unavailable');
    return [];
  }
}

async function loadActiveLesson(userId: string): Promise<ActiveLesson | null> {
  try {
    const row = await prisma.lessonSession.findFirst({
      where: { userId, status: 'active' },
      orderBy: { updatedAt: 'desc' },
      select: { lessonId: true, language: true, contentVersion: true, step: true },
    });
    return row ? { lessonId: row.lessonId, language: row.language, contentVersion: row.contentVersion, step: row.step } : null;
  } catch (err) {
    logger.warn({ err, userId }, 'learn: active lesson unavailable');
    return null;
  }
}

async function loadCorrections(userId: string, now: Date): Promise<Correction[]> {
  try {
    const since = new Date(now.getTime() - CORRECTION_WINDOW_DAYS * 86_400_000);
    const events = await prisma.learningEvent.findMany({
      where: { userId, kind: 'LESSON', at: { gte: since }, detail: { path: ['action'], equals: 'correction' } },
      orderBy: { at: 'desc' },
      take: 100,
      select: { at: true, detail: true },
    });
    const out: Correction[] = [];
    for (const event of events) {
      const detail = (event.detail ?? {}) as { lessonId?: unknown; correction?: unknown };
      const kind = detail.correction === 'known' || detail.correction === 'too_hard' ? detail.correction : null;
      if (kind && typeof detail.lessonId === 'string') out.push({ lessonId: detail.lessonId, kind, at: event.at });
    }
    return out;
  } catch (err) {
    logger.warn({ err, userId }, 'learn: corrections unavailable');
    return [];
  }
}
