import type { PatternFamily } from '@prisma/client';
import { Language } from '@prisma/client';

// The API image ships only the shared package's types, so the language list
// comes from the Prisma enum, which is the same six values.
const LANGUAGES = Object.values(Language) as readonly Language[];
import { SKILLS, SKILL_PREREQUISITES, allPrerequisites, skillsRequiredBy, type Skill, type SkillProblem } from '../skills.js';
import type { DiagnosisId } from '../tutor/diagnose.js';
import { LESSONS } from './lessons.js';
import { PATTERN_LESSONS } from './patterns.js';
import { RESOURCES } from './resources.js';
import { techniquesFor } from '../tutor/techniques.js';

/**
 * The lesson catalog: what Learn can teach, versioned and checked.
 *
 * ## Why a TypeScript module and not a table
 *
 * The content is authored, reviewed and shipped with the code, the same way
 * the hint packs in `tutor/starter.ts` are. A row in a database would be a
 * second copy of something the repository already versions, with none of the
 * review that a diff gets. `CONTENT_VERSION` is bumped by hand whenever a
 * lesson's meaning changes, so a lesson session started against one version
 * can be told apart from one started against the next.
 *
 * ## What a lesson promises
 *
 * One skill from `skills.ts`, one observable objective, and a shared
 * explanation that is true in every supported language. Anything that
 * differs by language — the code, its exact output, which manual page says
 * so — lives in a `LanguageVariant`, one per language, each of which is run
 * on the actual judge by `scripts/verify-lessons.ts`. A variant whose program
 * does not print what it claims is a bug in the catalog, not in the learner.
 *
 * Sources are links, not copies. `permission: 'link-only'` is the default
 * because linking needs no permission and copying does; nothing here is
 * adapted from a licensed text.
 */

/** Bump when a lesson's content changes meaning. Recorded on every session and event. */
export const CONTENT_VERSION = '2026-09-18.1';

/**
 * Seconds a lesson program may take on the judge, compile included.
 *
 * The judge runs compile and execution under one `timeout`, in a fresh
 * container with an empty build cache. Measured on the owner's machine
 * (Docker Desktop, 2026-09-18): a one-line Go program takes about 9.8 s
 * because `go run` compiles the standard library it imports from cold; every
 * other language finishes well inside 2 s. Lesson checks are not a speed
 * gate, so Go gets the time it needs. The corpus grader keeps its own
 * per-problem limit and is not changed here.
 */
export const TASK_CPU_SECONDS: Record<Language, number> = {
  JAVASCRIPT: 2,
  TYPESCRIPT: 2,
  PYTHON: 2,
  JAVA: 5,
  CPP: 5,
  GO: 20,
};

export interface LessonSource {
  publisher: string;
  title: string;
  url: string;
  /** The exact section the claim rests on. */
  section: string;
  /** The runtime the section was checked against, or 'concept' for shared material. */
  runtime: string;
  /** ISO date the link and its content were last read. */
  reviewedOn: string;
  /** 'original' — our own words, link for further reading. Nothing is 'adapted'. */
  adaptation: 'original';
  /** Links need no permission; that is the only mode used. */
  permission: 'link-only';
}

/** One program and what it prints when run with no stdin. */
export interface CodeSample {
  code: string;
  stdout: string;
}

/** A small program with one gap or one mistake, and the fixed program. */
export interface CompletionTask {
  /** What to change, in one or two sentences. */
  prompt: string;
  starter: string;
  /** Never sent to a client. Run by the verifier, and used to grade nothing. */
  solution: string;
  /** What the fixed program prints. The learner's program is graded against this. */
  stdout: string;
}

export interface LanguageVariant {
  language: Language;
  /** The worked example the shared trace describes, in this language. */
  example: CodeSample;
  /** One note that is only true in this language, or null. */
  note: string | null;
  task: CompletionTask;
  sources: LessonSource[];
}

/** A labelled step of the worked example, language-neutral. */
export interface TraceStep {
  label: string;
  text: string;
}

/**
 * A prediction question asked before the example's output is revealed.
 * `answer` is an index into `options` and never leaves the server.
 */
export interface PredictionCheck {
  id: string;
  question: string;
  options: string[];
  answer: number;
  /** Shown after answering, whichever option was chosen. */
  explanation: string;
}

export interface Lesson {
  /** Stable. Stored on sessions and events; never renamed. */
  id: string;
  skill: Skill;
  /**
   * Null for the eight foundation lessons. A pattern family for a lesson
   * beyond them: not part of the skill frontier, reached by the problem the
   * learner met or by choice, and practised on that family's problems.
   */
  family: PatternFamily | null;
  /**
   * The corpus pattern tags this lesson prepares for. Two uses: a lock
   * problem carrying one of them maps to this lesson, and the techniques
   * table turns them into the syntax card shown with the lesson.
   */
  tags: string[];
  title: string;
  /** One observable thing the learner will be able to do. */
  objective: string;
  /** Skills the explanation assumes. A subset of the skill's transitive prerequisites. */
  prerequisites: Skill[];
  /** Diagnoses from `tutor/diagnose.ts` that this lesson addresses. */
  misconceptions: DiagnosisId[];
  /** The beginner explanation: literal, small steps, every term met on the way. */
  explanation: string;
  /**
   * The concise version for a learner with evidence on this skill: the
   * specific detail people miss, in a few sentences, no re-teaching.
   */
  refresher: string;
  /** The same idea from a different angle, for "explain another way". */
  alternate: string;
  trace: TraceStep[];
  /** A smaller instance of the same example, for "show a smaller example". */
  smaller: { description: string; trace: TraceStep[] };
  check: PredictionCheck;
  /** The skill a practice problem must need. Resolved to a problem at practice time. */
  practiceSkill: Skill;
  variants: Record<Language, LanguageVariant>;
  /** Language-neutral sources for the concept. */
  sources: LessonSource[];
}

/** An advanced family with reviewed reading and, honestly, no lesson yet. */
export interface ResourceEntry {
  family: PatternFamily;
  coverage: 'resources_only';
  title: string;
  summary: string;
  resources: LessonSource[];
}

export const CATALOG: readonly Lesson[] = [...LESSONS, ...PATTERN_LESSONS];
/** The eight foundation lessons, in teaching order. */
export const FOUNDATION_LESSONS: readonly Lesson[] = LESSONS;
export const RESOURCE_ENTRIES: readonly ResourceEntry[] = RESOURCES;

export function findLesson(id: string): Lesson | undefined {
  return CATALOG.find((lesson) => lesson.id === id);
}

export function lessonForSkill(skill: Skill): Lesson | undefined {
  return CATALOG.find((lesson) => lesson.skill === skill && lesson.family === null);
}

/**
 * The lesson a problem prepares for, by its tags first and its family
 * second. Tags win because a FOUNDATIONS problem tagged `split` and `join`
 * is a strings lesson, not a foundations one; family catches the pattern
 * problems whose tags are their own.
 */
export function lessonForProblem(problem: { patternTags: readonly string[]; patternFamily: PatternFamily }): Lesson | undefined {
  const byTag = CATALOG.find((lesson) => lesson.tags.some((t) => problem.patternTags.includes(t)));
  if (byTag) return byTag;
  return CATALOG.find((lesson) => lesson.family !== null && lesson.family === problem.patternFamily);
}

export function lessonsForDiagnosis(diagnosis: DiagnosisId): Lesson[] {
  return CATALOG.filter((lesson) => lesson.misconceptions.includes(diagnosis));
}

/**
 * Every way the catalog can be wrong that a test can catch.
 *
 * Returns problems rather than throwing so the test can print all of them at
 * once. A lesson whose practice skill no active problem needs would send the
 * learner to "Practise" and find nothing; a prerequisite outside the skill
 * graph would promise a foundation the app cannot check; an unknown language
 * id would be a variant nobody can run.
 */
export function validateCatalog(
  lessons: readonly Lesson[] = CATALOG,
  resources: readonly ResourceEntry[] = RESOURCE_ENTRIES,
  problems: readonly SkillProblem[] = [],
): string[] {
  const problemsFound: string[] = [];
  const ids = new Set<string>();

  const validSource = (source: LessonSource, where: string) => {
    if (!source.url.startsWith('https://')) problemsFound.push(`${where}: source url must be https: ${source.url}`);
    if (!source.section.trim()) problemsFound.push(`${where}: source has no section: ${source.url}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.reviewedOn)) problemsFound.push(`${where}: bad reviewedOn: ${source.reviewedOn}`);
  };

  for (const lesson of lessons) {
    const where = `lesson ${lesson.id}`;
    if (ids.has(lesson.id)) problemsFound.push(`${where}: duplicate id`);
    ids.add(lesson.id);

    if (!SKILLS.includes(lesson.skill)) problemsFound.push(`${where}: unknown skill ${lesson.skill}`);
    for (const tag of lesson.tags) {
      if (techniquesFor([tag]).length === 0) problemsFound.push(`${where}: tag ${tag} has no technique entry`);
    }
    if (!SKILLS.includes(lesson.practiceSkill)) problemsFound.push(`${where}: unknown practice skill ${lesson.practiceSkill}`);

    // Prerequisites must be real skills, must be prerequisites of this skill
    // in the graph (a lesson may not invent a dependency the selector does
    // not enforce), and must not include the skill itself.
    const transitive = allPrerequisites(lesson.skill);
    for (const prereq of lesson.prerequisites) {
      if (!SKILLS.includes(prereq)) problemsFound.push(`${where}: unknown prerequisite ${prereq}`);
      else if (prereq === lesson.skill) problemsFound.push(`${where}: lists itself as a prerequisite`);
      else if (!transitive.includes(prereq)) {
        problemsFound.push(`${where}: ${prereq} is not a prerequisite of ${lesson.skill} in SKILL_PREREQUISITES`);
      }
    }

    if (!lesson.objective.trim()) problemsFound.push(`${where}: empty objective`);
    if (!lesson.refresher.trim()) problemsFound.push(`${where}: empty refresher`);
    if (lesson.trace.length === 0) problemsFound.push(`${where}: no trace steps`);
    if (lesson.smaller.trace.length === 0) problemsFound.push(`${where}: no smaller trace`);
    if (lesson.check.options.length < 2) problemsFound.push(`${where}: check needs at least two options`);
    if (lesson.check.answer < 0 || lesson.check.answer >= lesson.check.options.length) {
      problemsFound.push(`${where}: check answer index out of range`);
    }
    if (lesson.sources.length === 0) problemsFound.push(`${where}: no sources`);
    for (const source of lesson.sources) validSource(source, where);

    for (const language of LANGUAGES) {
      const variant = lesson.variants[language];
      if (!variant) {
        problemsFound.push(`${where}: no ${language} variant`);
        continue;
      }
      const vwhere = `${where} ${language}`;
      if (variant.language !== language) problemsFound.push(`${vwhere}: variant labelled ${variant.language}`);
      if (!variant.example.code.trim()) problemsFound.push(`${vwhere}: empty example`);
      if (!variant.task.starter.trim() || !variant.task.solution.trim()) problemsFound.push(`${vwhere}: empty task`);
      if (variant.task.starter === variant.task.solution) problemsFound.push(`${vwhere}: task starter equals solution`);
      if (variant.sources.length === 0) problemsFound.push(`${vwhere}: no language source`);
      for (const source of variant.sources) validSource(source, vwhere);
    }
    for (const key of Object.keys(lesson.variants)) {
      if (!(LANGUAGES as readonly string[]).includes(key)) problemsFound.push(`${where}: unknown language id ${key}`);
    }

    if (problems.length > 0) {
      const needed = lesson.family
        ? problems.some((p) => p.patternFamily === lesson.family)
        : problems.some((p) => p.tier === 'TIER_0' && skillsRequiredBy(p).includes(lesson.practiceSkill));
      if (!needed) {
        problemsFound.push(
          lesson.family
            ? `${where}: no problem in family ${lesson.family}`
            : `${where}: no Tier 0 problem needs practice skill ${lesson.practiceSkill}`,
        );
      }
    }
  }

  // The skill graph itself: acyclic, every edge to a known skill. Cheap, and
  // the one place the catalog and the selector would silently disagree.
  for (const skill of SKILLS) {
    for (const prereq of SKILL_PREREQUISITES[skill]) {
      if (!SKILLS.includes(prereq)) problemsFound.push(`skill graph: ${skill} -> unknown ${prereq}`);
    }
    if (allPrerequisites(skill).includes(skill)) problemsFound.push(`skill graph: cycle through ${skill}`);
  }

  const families = new Set<PatternFamily>();
  for (const entry of resources) {
    const where = `resources ${entry.family}`;
    if (families.has(entry.family)) problemsFound.push(`${where}: duplicate family`);
    families.add(entry.family);
    if (entry.resources.length === 0) problemsFound.push(`${where}: no resources`);
    for (const source of entry.resources) validSource(source, where);
  }

  return problemsFound;
}
