import type { Language } from '@codelock/shared';

/** Learner-facing names. Mirrors LANGUAGE_LABELS in @codelock/shared, whose runtime is not in the API image. */
const LANGUAGE_LABELS: Record<Language, string> = {
  JAVASCRIPT: 'JavaScript',
  TYPESCRIPT: 'TypeScript',
  PYTHON: 'Python',
  JAVA: 'Java',
  CPP: 'C++',
  GO: 'Go',
};
import {
  SKILLS,
  SKILL_LABELS,
  SKILL_PREREQUISITES,
  isIntroduced,
  isSatisfied,
  type Skill,
  type SkillSnapshot,
} from '../skills.js';
import type { DiagnosisId } from '../tutor/diagnose.js';
import { CATALOG, CONTENT_VERSION, lessonForProblem, lessonForSkill, lessonsForDiagnosis, type Lesson } from './catalog.js';
import type { PatternFamily } from '@prisma/client';

/**
 * Which lesson to offer, and why — as a pure function.
 *
 * Everything the rule needs is in `LearnerEvidence`, assembled by
 * `evidence.ts` from history the app already keeps. Nothing here reads a
 * database, picks a problem, or writes an event, so the same inputs always
 * give the same answer and every branch is testable with a fixture.
 *
 * The rule is deliberately modest about what evidence can say. A hint
 * diagnosis is a hypothesis the tutor formed about one piece of code; two
 * of them on different occasions are a pattern worth a lesson, one is not.
 * A skill the snapshot calls demonstrated was solved twice without help;
 * that is a reason to move on, not proof of mastery. The learner copy is
 * written to match.
 */

/** Diagnoses that never mean a missing concept: syntax, names, slowness, not having started. */
export const NON_CONCEPT_DIAGNOSES: readonly DiagnosisId[] = [
  'syntax_error',
  'name_error',
  'timeout',
  'not_started',
  'passing',
  'wrong_output',
];

/** How many distinct episodes a diagnosis must recur across to be `likely`. */
export const BLOCKER_EPISODES = 2;

export interface BlockerEvidence {
  diagnosis: DiagnosisId;
  /** Distinct solving episodes (session, or problem+day for practice) it appeared in. */
  episodes: number;
  eventIds: string[];
  lastAt: Date;
}

export interface Correction {
  lessonId: string;
  kind: 'known' | 'too_hard';
  at: Date;
}

export interface ActiveLesson {
  lessonId: string;
  language: Language;
  contentVersion: string;
  step: number;
}

/** The problem the learner met most recently, and how it went. */
export interface RecentProblem {
  slug: string;
  title: string;
  patternFamily: PatternFamily;
  patternTags: string[];
  /** Solved without help, solved with help, or not solved (failed, bypassed, still open). */
  outcome: 'unaided' | 'assisted' | 'unsolved';
  at: Date;
  /** The PROBLEM_SERVED event id, for the evidence list. */
  eventId: string;
}

export interface LearnerEvidence {
  snapshot: SkillSnapshot;
  /** The last lock or practice problem within the recent window, or null. */
  recentProblem: RecentProblem | null;
  /** False when history could not be read; the snapshot is then a placeholder. */
  available: boolean;
  /** Most recent solving occasion per skill, from the deduplicated solve records. */
  lastPractised: Partial<Record<Skill, Date>>;
  /** Accepted episodes per skill per language, help included. Absent means no record, not inability. */
  fluency: Partial<Record<Skill, Partial<Record<Language, number>>>>;
  blockers: BlockerEvidence[];
  activeLesson: ActiveLesson | null;
  corrections: Correction[];
}

export type ReasonCode =
  | 'resumed'
  | 'blocker'
  | 'problem'
  | 'pattern'
  | 'prerequisite'
  | 'frontier'
  | 'review'
  | 'consolidation'
  | 'content_gap'
  | 'history_unavailable';

export type Confidence = 'confirmed' | 'likely' | 'possible';

export interface EvidenceRef {
  id: string;
  at: string;
}

export interface Recommendation {
  lessonId: string | null;
  skill: Skill | null;
  reasonCode: ReasonCode;
  /** Learner copy. Names what was observed, never a verdict about the learner. */
  reason: string;
  confidence: Confidence;
  evidence: EvidenceRef[];
  language: Language;
  contentVersion: string;
  /** A lesson exists and has a variant in `language`. */
  variantAvailable: boolean;
  /** Said only when the concept has been applied in another language and not this one. */
  fluencyNote: string | null;
}

export interface LearnPlan {
  primary: Recommendation;
  /** A due skill offered beside the primary, or null when nothing is due. */
  review: Recommendation | null;
}

const CORRECTION_WINDOW_MS = 30 * 86_400_000;

/**
 * The next skill to *learn*, ignoring review. `nextSkillToLearn` in
 * `skills.ts` puts a due skill first, which is right for the selector and
 * wrong here: a review offered beside the lesson must not stop the lesson
 * from being the next new idea.
 */
export function nextNewSkill(snapshot: SkillSnapshot): Skill | null {
  return (
    SKILLS.find(
      (skill) =>
        !isSatisfied(snapshot[skill]) &&
        SKILL_PREREQUISITES[skill].every((prereq) => isIntroduced(snapshot[prereq])),
    ) ?? null
  );
}

function recentCorrections(corrections: readonly Correction[], now: Date): Correction[] {
  const since = now.getTime() - CORRECTION_WINDOW_MS;
  return corrections.filter((c) => c.at.getTime() >= since);
}

function markedKnown(lesson: Lesson, corrections: readonly Correction[]): boolean {
  return corrections.some((c) => c.kind === 'known' && c.lessonId === lesson.id);
}

function markedTooHard(lesson: Lesson, corrections: readonly Correction[]): boolean {
  return corrections.some((c) => c.kind === 'too_hard' && c.lessonId === lesson.id);
}

/** The first prerequisite of a lesson the learner has not met, in teaching order. */
function firstUnmetPrerequisite(lesson: Lesson, snapshot: SkillSnapshot): Skill | null {
  return SKILLS.find((s) => lesson.prerequisites.includes(s) && !isIntroduced(snapshot[s])) ?? null;
}

function fluencyNoteFor(skill: Skill, evidence: LearnerEvidence, language: Language): string | null {
  const record = evidence.snapshot[skill];
  if (!isIntroduced(record)) return null;
  const perLanguage = evidence.fluency[skill] ?? {};
  const here = perLanguage[language] ?? 0;
  if (here > 0) return null;
  const elsewhere = (Object.keys(perLanguage) as Language[]).filter((l) => (perLanguage[l] ?? 0) > 0);
  if (elsewhere.length === 0) return null;
  const names = elsewhere.map((l) => LANGUAGE_LABELS[l]).join(' and ');
  return `You have applied this in ${names}. There is no record of it in ${LANGUAGE_LABELS[language]} yet, so the examples here are in ${LANGUAGE_LABELS[language]}.`;
}

function build(
  lesson: Lesson | null,
  reasonCode: ReasonCode,
  reason: string,
  confidence: Confidence,
  evidence: LearnerEvidence,
  language: Language,
  refs: EvidenceRef[] = [],
): Recommendation {
  return {
    lessonId: lesson?.id ?? null,
    skill: lesson?.skill ?? null,
    reasonCode,
    reason,
    confidence,
    evidence: refs,
    language,
    contentVersion: CONTENT_VERSION,
    variantAvailable: lesson !== null && lesson.variants[language] !== undefined,
    fluencyNote: lesson ? fluencyNoteFor(lesson.skill, evidence, language) : null,
  };
}

/**
 * Apply a "too hard" correction: step back to the lesson's first unmet
 * prerequisite, or its earliest prerequisite when all are met, so the learner
 * gets something smaller rather than the same thing again.
 */
function stepBack(lesson: Lesson, snapshot: SkillSnapshot): Lesson | null {
  const unmet = firstUnmetPrerequisite(lesson, snapshot);
  const target = unmet ?? SKILLS.find((s) => lesson.prerequisites.includes(s)) ?? null;
  return target ? (lessonForSkill(target) ?? null) : null;
}

/**
 * The plan for one learner in one language. See the module comment for the
 * priorities; each branch below is one of them, in order.
 */
export function recommendLesson(evidence: LearnerEvidence, language: Language, now: Date): LearnPlan {
  const corrections = recentCorrections(evidence.corrections, now);
  const { snapshot } = evidence;

  // A review is offered whenever a demonstrated skill has fallen due. It is
  // computed first so the primary rule can fall back to it, but it becomes
  // the primary only when nothing new is ready (below).
  const dueSkill = SKILLS.find((s) => snapshot[s].state === 'due_for_review') ?? null;
  const dueLesson = dueSkill ? (lessonForSkill(dueSkill) ?? null) : null;
  const review =
    dueSkill && dueLesson && evidence.available
      ? build(
          dueLesson,
          'review',
          `${SKILL_LABELS[dueSkill]} was solved on your own before and has not come up for a while. A short practice keeps it current; nothing you earned is lost either way.`,
          'confirmed',
          evidence,
          language,
        )
      : null;

  // 0. History unavailable: say so, and offer the first lesson as a lesson,
  //    not as a diagnosis.
  if (!evidence.available) {
    const first = CATALOG[0] ?? null;
    return {
      primary: build(
        first,
        'history_unavailable',
        'Your history could not be read just now, so this is the first lesson on the map rather than one chosen for you. This is a read that failed, not an empty history; try again in a moment for a personal pick.',
        'possible',
        evidence,
        language,
      ),
      review: null,
    };
  }

  // 1. Resume. Unless the learner has since said they know it or it was too
  //    hard, in which case the correction wins and the rule continues.
  if (evidence.activeLesson) {
    const lesson = CATALOG.find((l) => l.id === evidence.activeLesson!.lessonId) ?? null;
    if (lesson && !markedKnown(lesson, corrections) && !markedTooHard(lesson, corrections)) {
      return {
        primary: build(lesson, 'resumed', 'You were part-way through this. It picks up where you left off.', 'confirmed', evidence, language),
        review,
      };
    }
  }

  // 2. A recurring blocker with a lesson for it. Two episodes is the bar;
  //    one occurrence is noted in the evidence but never acted on alone.
  const catalogRank = (d: DiagnosisId) => {
    const at = CATALOG.findIndex((l) => l.misconceptions.includes(d));
    return at === -1 ? CATALOG.length : at;
  };
  const blockers = evidence.blockers
    .filter((b) => !NON_CONCEPT_DIAGNOSES.includes(b.diagnosis) && b.episodes >= BLOCKER_EPISODES)
    .sort(
      (a, b) =>
        b.episodes - a.episodes ||
        b.lastAt.getTime() - a.lastAt.getTime() ||
        catalogRank(a.diagnosis) - catalogRank(b.diagnosis),
    );
  for (const blocker of blockers) {
    const lesson = lessonsForDiagnosis(blocker.diagnosis).find((l) => !markedKnown(l, corrections));
    if (!lesson) continue;
    const refs = blocker.eventIds.map((id) => ({ id, at: blocker.lastAt.toISOString() }));
    const unmet = firstUnmetPrerequisite(lesson, snapshot);
    if (unmet) {
      const prereq = lessonForSkill(unmet);
      if (prereq && !markedKnown(prereq, corrections)) {
        return {
          primary: build(
            prereq,
            'prerequisite',
            `Recent hints on ${blocker.episodes} different attempts pointed at ${lesson.title.toLowerCase()}. That lesson leans on ${SKILL_LABELS[unmet].toLowerCase()}, which you have not met here yet, so this comes first.`,
            'likely',
            evidence,
            language,
            refs,
          ),
          review,
        };
      }
    }
    const target = markedTooHard(lesson, corrections) ? stepBack(lesson, snapshot) : lesson;
    if (!target) continue;
    return {
      primary: build(
        target,
        target === lesson ? 'blocker' : 'prerequisite',
        target === lesson
          ? `Hints on ${blocker.episodes} different attempts pointed at the same thing. That is a pattern worth a look, not a verdict: this lesson walks through it with a trace, then a small fix.`
          : `You said the lesson on ${lesson.title.toLowerCase()} was too hard, so this steps back to what it builds on.`,
        'likely',
        evidence,
        language,
        refs,
      ),
      review,
    };
  }

  // 2b. The problem the learner just met. If it was not solved on its own
  //     and a lesson prepares for it, that lesson is the most useful thing
  //     to show: it is what "personalised" means to someone mid-problem. A
  //     problem solved unaided needs no lesson.
  const recent = evidence.recentProblem;
  if (recent && recent.outcome !== 'unaided') {
    const lesson = lessonForProblem(recent);
    if (lesson && !markedKnown(lesson, corrections)) {
      const unmet = firstUnmetPrerequisite(lesson, snapshot);
      const target = unmet ? (lessonForSkill(unmet) ?? lesson) : lesson;
      return {
        primary: build(
          target,
          target === lesson ? 'problem' : 'prerequisite',
          target === lesson
            ? `Preparing you for problems like “${recent.title}”, which you ${recent.outcome === 'assisted' ? 'solved with help' : 'did not finish'}. This lesson is the technique it needs, with the ${LANGUAGE_LABELS[language]} you would write for it.`
            : `“${recent.title}” needs ${lesson.title.toLowerCase()}, which builds on ${SKILL_LABELS[unmet!].toLowerCase()}. That comes first.`,
          'likely',
          evidence,
          language,
          [{ id: recent.eventId, at: recent.at.toISOString() }],
        ),
        review,
      };
    }
  }

  // 3. The frontier: the next new skill whose prerequisites are met.
  const frontierSkill = nextNewSkill(snapshot);
  if (frontierSkill) {
    let lesson = lessonForSkill(frontierSkill) ?? null;
    // Skip lessons the learner marked as known, in teaching order, but only
    // among skills whose prerequisites are met — a correction can move the
    // learner forward, never past a gap.
    let cursor = SKILLS.indexOf(frontierSkill);
    while (lesson && markedKnown(lesson, corrections)) {
      cursor += 1;
      const next = SKILLS[cursor];
      if (!next) {
        lesson = null;
        break;
      }
      lesson = lessonForSkill(next) ?? null;
    }
    if (lesson && markedTooHard(lesson, corrections)) lesson = stepBack(lesson, snapshot) ?? lesson;
    if (lesson) {
      const record = snapshot[lesson.skill];
      const nothingYet = SKILLS.every((s) => !isIntroduced(snapshot[s]));
      const reason = nothingYet
        ? 'Nothing here is based on your history yet: this is the first idea on the map, and every lesson after it builds on it.'
        : record.state === 'not_introduced'
          ? `${SKILL_LABELS[lesson.skill]} is the next idea on the map, and everything it builds on has been met. It prepares you for problems that need it.`
          : record.unaidedSolves === 1
            ? `${SKILL_LABELS[lesson.skill]} has been solved on your own once. A short walk-through and a different practice problem is the shortest route to a second.`
            : `${SKILL_LABELS[lesson.skill]} has been practised with help but not yet on your own. This lesson gives you a trace to check your thinking against before the next attempt.`;
      return {
        primary: build(lesson, lesson.skill === frontierSkill ? 'frontier' : 'prerequisite', reason, 'confirmed', evidence, language),
        review,
      };
    }
  }

  // 3b. Foundations done or marked known: the first pattern lesson the
  //     learner has not marked known, in catalog order — by the family of
  //     the recent problem first, so the pattern shown is one they have met.
  const patterns = CATALOG.filter((l) => l.family !== null && !markedKnown(l, corrections));
  const byRecent = recent ? patterns.find((l) => l.family === recent.patternFamily) : undefined;
  const pattern = byRecent ?? patterns[0];
  if (pattern) {
    return {
      primary: build(
        pattern,
        'pattern',
        byRecent
          ? `The foundations are behind you. This is the pattern behind “${recent!.title}”, the kind of problem the lock has been serving.`
          : 'The foundations are behind you. This is the first pattern beyond them, and the lock serves problems built on it.',
        'confirmed',
        evidence,
        language,
      ),
      review,
    };
  }

  // 4. Nothing new is ready: a due review becomes the primary.
  if (review) return { primary: review, review: null };

  // 5. Consolidation: the most recently practised skill. The recency comes
  //    from the solve records, not the snapshot, which does not keep it.
  const practised = (Object.entries(evidence.lastPractised) as [Skill, Date][])
    .filter(([, at]) => at instanceof Date)
    .sort((a, b) => b[1].getTime() - a[1].getTime() || SKILLS.indexOf(a[0]) - SKILLS.indexOf(b[0]));
  for (const [skill] of practised) {
    const lesson = lessonForSkill(skill);
    if (lesson && !markedKnown(lesson, corrections)) {
      return {
        primary: build(
          lesson,
          'consolidation',
          `Every foundation skill is solved on your own and nothing is due. ${SKILL_LABELS[skill]} is the one you used most recently; this is a short read to keep it sharp, and the reading list covers what comes after the foundations.`,
          'confirmed',
          evidence,
          language,
        ),
        review: null,
      };
    }
  }

  return {
    primary: build(
      null,
      'content_gap',
      'The foundation lessons are done. There is no in-app lesson for the next patterns yet; the reading list below is reviewed material for them, and the lock keeps serving problems that stretch you.',
      'confirmed',
      evidence,
      language,
    ),
    review: null,
  };
}
