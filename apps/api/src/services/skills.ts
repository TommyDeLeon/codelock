import type { PatternFamily, Tier } from '@prisma/client';

/**
 * The beginner skill path, and what a learner may safely be shown next.
 *
 * ## Why this exists
 *
 * `progression.ts` already gates by tier and pattern family, and does it well.
 * But its finest grain is a family, and FOUNDATIONS is one family containing
 * sixty problems. Of those, 33 need a loop and 30 need an array, so a learner
 * who has never written a loop can be handed one on their first lock. That is
 * the reported failure: "questions beyond my current understanding".
 *
 * The corpus already contains the earlier material. `is-even-number` and
 * `last-digit` need no loop and no collection; twenty-two of the sixty need
 * neither. Nothing was ordering them. So this module adds the missing ordering
 * rather than new content, which is the smaller and safer change.
 *
 * ## Shape
 *
 * Deliberately the same shape as `progression.ts`: a prerequisite graph, pure
 * predicates over a snapshot, and no database access in this file. The one
 * decision worth arguing about, what a learner is ready for, stays arguable in
 * a test rather than only observable against a live database.
 */

// ---------------------------------------------------------------------------
// The skills
// ---------------------------------------------------------------------------

/**
 * The six groups from the brief, plus `combining` for problems needing several
 * at once.
 *
 * Kept small on purpose. A finer taxonomy would be more accurate and less
 * usable: every extra skill is another state to reach before anything unlocks,
 * and a learner stuck behind a gate they cannot see is worse off than one
 * shown a slightly imperfect ordering.
 */
export const SKILLS = [
  'values',
  'comparisons',
  'strings',
  'indexing',
  'lists',
  'loops',
  'functions',
  'combining',
] as const;

export type Skill = (typeof SKILLS)[number];

/** What a learner sees for each skill, in plain words. */
export const SKILL_LABELS: Record<Skill, string> = {
  values: 'Values, variables and types',
  comparisons: 'Comparisons and conditionals',
  strings: 'Working with text',
  indexing: 'Positions and bounds',
  lists: 'Lists',
  loops: 'Loops, and when you actually need one',
  functions: 'Functions, parameters and return values',
  combining: 'Putting several of these together',
};

/**
 * Direct prerequisites. Acyclic, and checked by a test rather than trusted.
 *
 * `indexing` depends on `strings` rather than on `lists` because reaching for
 * one character of a word is where a beginner first meets a position, and it
 * is where the off-by-one lesson lands most cheaply. Lists then inherit it.
 */
export const SKILL_PREREQUISITES: Record<Skill, readonly Skill[]> = {
  values: [],
  comparisons: ['values'],
  strings: ['values'],
  indexing: ['strings'],
  lists: ['indexing'],
  loops: ['lists', 'comparisons'],
  functions: ['values', 'comparisons'],
  combining: ['loops', 'functions'],
};

// ---------------------------------------------------------------------------
// Skill state
// ---------------------------------------------------------------------------

/**
 * The four states from the brief.
 *
 * `practised_with_help` covers both "solved with hints" and "solved unaided
 * for the first time", and that second case is deliberate: a single correct
 * answer is not mastery. It may be right for the wrong reason, a lucky guess,
 * or a problem that happened to be shaped like the worked example. Two
 * separate unaided solves is a low bar, and it is a bar.
 */
export const SKILL_STATES = [
  'not_introduced',
  'practised_with_help',
  'demonstrated',
  'due_for_review',
] as const;

export type SkillState = (typeof SKILL_STATES)[number];

/** One skill's record. `unaidedSolves` is what promotes it, not a flag. */
export interface SkillRecord {
  state: SkillState;
  unaidedSolves: number;
  assistedSolves: number;
}

export type SkillSnapshot = Record<Skill, SkillRecord>;

/** Unaided solves needed before a skill counts as demonstrated. */
export const UNAIDED_SOLVES_TO_DEMONSTRATE = 2;

export const emptySkillRecord = (): SkillRecord => ({
  state: 'not_introduced',
  unaidedSolves: 0,
  assistedSolves: 0,
});

export function emptySkillSnapshot(): SkillSnapshot {
  const out = {} as SkillSnapshot;
  for (const skill of SKILLS) out[skill] = emptySkillRecord();
  return out;
}

/**
 * How one attempt moves one skill.
 *
 * Pure, and the only place a state transition is decided. Three rules:
 *
 * 1. Help never demonstrates. An assisted solve records that the learner has
 *    met the idea and no more, whatever state they were in, so it can raise
 *    `not_introduced` but can never raise `practised_with_help`.
 * 2. Unaided solves accumulate, and the second one demonstrates. The first is
 *    exposure; two separate occasions is evidence.
 * 3. `due_for_review` is not a demotion and does not lose the count. A skill
 *    returns to `demonstrated` on its next unaided solve rather than starting
 *    again, because the learner did demonstrate it once and time passing is
 *    not a mistake they made.
 */
export function advanceSkillState(record: SkillRecord, assisted: boolean): SkillRecord {
  if (assisted) {
    return {
      ...record,
      assistedSolves: record.assistedSolves + 1,
      state: record.state === 'not_introduced' ? 'practised_with_help' : record.state,
    };
  }

  const unaidedSolves = record.unaidedSolves + 1;
  return {
    ...record,
    unaidedSolves,
    state: unaidedSolves >= UNAIDED_SOLVES_TO_DEMONSTRATE ? 'demonstrated' : 'practised_with_help',
  };
}

/** A demonstrated skill whose review has come due. Never a demotion. */
export function markDueForReview(record: SkillRecord): SkillRecord {
  if (record.state !== 'demonstrated') return record;
  return { ...record, state: 'due_for_review' };
}

/** Demonstrated at least once. The bar for the skill itself. */
export function isSatisfied(record: SkillRecord): boolean {
  return record.state === 'demonstrated' || record.state === 'due_for_review';
}

/**
 * Met at all. The bar for unlocking what comes *after* a skill.
 *
 * Deliberately lower than `isSatisfied`, and the reason is a deadlock found by
 * walking a real first session. Demonstrating a skill takes two unaided solves,
 * and the corpus holds exactly one problem needing `values` alone. If nothing
 * unlocked until `values` was demonstrated, the learner would be served that
 * same problem forever with no second way to demonstrate it.
 *
 * Requiring only that a prerequisite has been introduced keeps the teaching
 * order intact — a skill still cannot be met before the thing it builds on —
 * while `MAX_NEW_SKILLS_PER_PROBLEM` is what actually prevents the reported
 * failure of meeting three new ideas at once.
 */
export function isIntroduced(record: SkillRecord): boolean {
  return record.state !== 'not_introduced';
}

/**
 * Practised enough that a problem may lean on it without that being the whole
 * of the problem.
 *
 * One unaided solve, or two solves with help. Neither is mastery and neither
 * changes the state — that bar stays at two unaided solves — but both are real
 * work with the idea, which is the question being asked here.
 *
 * This exists because `isIntroduced` turned out to be far too low a bar for
 * eligibility, as opposed to for ordering. Observed in the running app: a
 * learner with every skill at one assisted solve and nothing demonstrated had
 * the entire 695-problem corpus judged eligible, Tier 2 included, described as
 * using only what they had already practised. Three of those skills had never
 * been used unaided at all.
 */
export function isPractised(record: SkillRecord): boolean {
  return isSatisfied(record) || record.unaidedSolves >= 1 || record.assistedSolves >= 2;
}

// ---------------------------------------------------------------------------
// What a problem actually needs
// ---------------------------------------------------------------------------

/**
 * Tags that imply a skill, read from the corpus as it already is.
 *
 * Derived from the real tag vocabulary on the 60 TIER_0 problems rather than
 * invented, so no problem needs re-tagging and no migration touches the
 * corpus. A tag absent from this map contributes no skill on its own, which
 * understates what a problem needs — the unsafe direction for a gate, since it
 * can present an out-of-depth problem as fair. The signature rules in
 * `skillsRequiredBy` are the backstop: every argument and return type is
 * covered there, so an untagged problem is still classified by its shape. What
 * remains uncaught is a problem whose difficulty lives only in its wording.
 */
const SKILL_BY_TAG: Record<string, Skill> = {
  arithmetic: 'values',
  modulo: 'values',
  'integer-division': 'values',
  booleans: 'comparisons',
  comparison: 'comparisons',
  conditionals: 'comparisons',
  'edge-cases': 'comparisons',
  membership: 'comparisons',
  strings: 'strings',
  characters: 'strings',
  'case-conversion': 'strings',
  substring: 'strings',
  split: 'strings',
  join: 'strings',
  parsing: 'strings',
  transform: 'strings',
  indexing: 'indexing',
  bounds: 'indexing',
  arrays: 'lists',
  lists: 'lists',
  filtering: 'lists',
  loops: 'loops',
  accumulator: 'loops',
  counting: 'loops',
  'running-best': 'loops',
  'frequency-count': 'loops',
  'parallel-iteration': 'loops',
  search: 'loops',
  'seen-before': 'loops',
  'hash-map': 'combining',
  'hash-set': 'combining',
  'two-pointers': 'combining',
};

/** The subset of a problem this module reads. Nothing else is touched. */
export interface SkillProblem {
  signatureId: string;
  patternTags: readonly string[];
  tier: Tier;
  patternFamily: PatternFamily;
}

/** Transitive prerequisites of one skill, nearest first. */
export function allPrerequisites(skill: Skill): Skill[] {
  const out: Skill[] = [];
  const queue = [...SKILL_PREREQUISITES[skill]];
  while (queue.length > 0) {
    const next = queue.shift()!;
    if (out.includes(next)) continue;
    out.push(next);
    queue.push(...SKILL_PREREQUISITES[next]);
  }
  return out;
}

/**
 * Every skill a problem requires.
 *
 * Tags first, then two structural rules the tags do not reliably carry:
 *
 * - A collection argument needs `lists`, whatever the tags say. A problem
 *   handed `fn:ints->int` requires holding many values whether or not anyone
 *   remembered to tag it `arrays`.
 * - Everything needs `values`, because every problem has a value in it. This
 *   keeps `values` the genuine root of the graph instead of a skill a learner
 *   can somehow skip past.
 *
 * Anything outside TIER_0 also counts as `combining`, since by definition it
 * layers a named pattern on top of the basics.
 */
export function skillsRequiredBy(problem: SkillProblem): Skill[] {
  const found = new Set<Skill>(['values']);

  for (const tag of problem.patternTags) {
    const skill = SKILL_BY_TAG[tag];
    if (skill) found.add(skill);
  }

  const sig = problem.signatureId;
  const args = sig.slice(sig.indexOf(':') + 1).split('->')[0] ?? '';

  if (sig.startsWith('fn:ints') || sig.startsWith('fn:strings') || sig.startsWith('fn:matrix')) {
    found.add('lists');
  }
  if (sig.startsWith('cls:') || sig.startsWith('fn:tree') || sig.startsWith('fn:list')) {
    found.add('combining');
  }
  if (problem.tier !== 'TIER_0') found.add('combining');

  // Text anywhere in the signature needs `strings`, whatever the tags say. The
  // tag map is the wrong place to catch this: `fn:string->string` with no tags
  // at all otherwise reports `values` only, and a learner who has never
  // touched text would be handed it as a fair first problem.
  if (sig.includes('string')) found.add('strings');

  // Two arguments is where `functions` actually lives. Nothing in the corpus
  // tag vocabulary names it, so without this rule the skill had no source and
  // could only ever arrive as a prerequisite of `combining` — which requires
  // it, making every `combining` problem two new skills at once and therefore
  // permanently ineligible. `fn:ints,int->int` is the largest group in the
  // corpus, and coordinating a collection with a separate argument is exactly
  // the skill being named.
  if (args.includes(',')) found.add('functions');

  // A skill implies its prerequisites. Without this, a problem tagged only
  // `loops` would look like it needs one skill, and selection would hand it to
  // someone who has never indexed anything.
  for (const skill of [...found]) for (const prereq of allPrerequisites(skill)) found.add(prereq);

  return SKILLS.filter((skill) => found.has(skill));
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/** Every prerequisite has at least been introduced, so this one can be too. */
export function isSkillReady(skill: Skill, snapshot: SkillSnapshot): boolean {
  return SKILL_PREREQUISITES[skill].every((prereq) => isIntroduced(snapshot[prereq]));
}

/**
 * The one skill to work on next.
 *
 * Review first, because a skill that has faded is worth more than a new one:
 * the learner already paid for it. Then the earliest unfinished skill whose
 * prerequisites are met, in declaration order, which is the teaching order.
 * Null when everything is demonstrated and nothing is due.
 */
export function nextSkillToLearn(snapshot: SkillSnapshot): Skill | null {
  const due = SKILLS.find((skill) => snapshot[skill].state === 'due_for_review');
  if (due) return due;

  return (
    SKILLS.find((skill) => !isSatisfied(snapshot[skill]) && isSkillReady(skill, snapshot)) ?? null
  );
}

/** Why a problem was or was not offered. Shown to the learner, so plain words. */
export interface Fit {
  eligible: boolean;
  /** Skills the problem needs that the learner has not met at all. */
  missing: Skill[];
  /** Skills it needs that they have met but not demonstrated. */
  shaky: Skill[];
  /** How many brand-new skills it would introduce at once. */
  newSkills: number;
  reason: string;
}

/** Skills a learner may be asked to meet for the first time in one problem. */
export const MAX_NEW_SKILLS_PER_PROBLEM = 1;

/**
 * Whether this problem is fair to serve right now, and why.
 *
 * A problem is eligible when every skill it needs is either satisfied or is
 * itself ready to be introduced, and when it introduces at most one genuinely
 * new skill. That second condition is what stops the jump the learner
 * reported: a problem needing loops and lists and indexing, none of them met,
 * is not a hard problem, it is three lessons at once behind a locked screen.
 */
export function fitForLearner(problem: SkillProblem, snapshot: SkillSnapshot): Fit {
  const required = skillsRequiredBy(problem);
  const missing: Skill[] = [];
  const shaky: Skill[] = [];

  for (const skill of required) {
    const record = snapshot[skill];
    if (record.state === 'not_introduced') missing.push(skill);
    else if (!isSatisfied(record)) shaky.push(skill);
  }

  const introducible = missing.filter((skill) => isSkillReady(skill, snapshot));
  const blocked = missing.filter((skill) => !isSkillReady(skill, snapshot));
  // Introduced, but not yet practised enough for a problem to lean on it.
  const weak = shaky.filter((skill) => !isPractised(snapshot[skill]));

  if (blocked.length > 0) {
    // Name the earliest missing skill and count the rest. Listing all seven
    // reads as a wall of text and tells the learner nothing they can act on.
    //
    // `missing[0]`, not `blocked[0]`: `required` is in teaching order, so the
    // first missing skill is the one they can actually start on today. A
    // blocked skill is by definition the one they cannot — naming it would
    // point them at the destination and call it the starting line.
    const first = SKILL_LABELS[missing[0] ?? blocked[0]!];
    const rest = blocked.length - 1;
    const tail = rest > 0 ? `, and ${rest} more after that` : '';
    return {
      eligible: false,
      missing,
      shaky,
      newSkills: missing.length,
      reason: `starts with ${first.toLowerCase()}${tail}`,
    };
  }
  if (introducible.length + weak.length > MAX_NEW_SKILLS_PER_PROBLEM) {
    // One unfamiliar idea at a time, counting both the genuinely new and the
    // barely-met. Without the second half of that count, a learner who had
    // met every skill once with help would find the whole corpus open.
    const ideas = [...introducible, ...weak];
    const first = SKILL_LABELS[SKILLS.find((skill) => ideas.includes(skill))!];
    return {
      eligible: false,
      missing,
      shaky,
      newSkills: missing.length,
      reason: `${ideas.length} new ideas at once, starting with ${first.toLowerCase()}`,
    };
  }
  const frontier = introducible[0] ?? weak[0];
  return {
    eligible: true,
    missing,
    shaky,
    newSkills: missing.length,
    reason: frontier
      ? `one new idea here: ${SKILL_LABELS[frontier].toLowerCase()}`
      : 'uses only what you have already practised',
  };
}

/**
 * How good a fit an eligible problem is. Higher is better.
 *
 * Prefers a problem that practises the skill being worked on, then one that
 * firms up something shaky, and mildly prefers fewer total skills so the
 * earliest problems stay small. Returns null for anything ineligible, so a
 * caller cannot accidentally rank its way past a prerequisite.
 */
export function scoreProblemForLearner(
  problem: SkillProblem,
  snapshot: SkillSnapshot,
  target: Skill | null,
): number | null {
  const fit = fitForLearner(problem, snapshot);
  if (!fit.eligible) return null;

  const required = skillsRequiredBy(problem);
  let score = 10;
  if (target && required.includes(target)) score += 40;
  score += fit.shaky.length * 8;
  score += fit.newSkills * 15;
  score -= required.length * 2;
  return score;
}
