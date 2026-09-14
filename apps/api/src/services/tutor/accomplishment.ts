import type { Accomplishment, AccomplishmentKind, SkillProgressView } from '@codelock/shared';
import { SKILLS, SKILL_LABELS, type Skill, type SkillSnapshot } from '../skills.js';
import { starterPack } from './starter.js';

/**
 * What a solve achieved, said specifically and only as far as the evidence
 * goes.
 *
 * The rules this module exists to keep:
 *
 * - Every sentence is checkable against stored facts. "You handled an empty
 *   list" appears only when a test with empty input exists and passed.
 * - Improvement is claimed only against comparable prior performance: the
 *   same problem, solved before with help, now solved without.
 * - Assisted work, and work reproduced from a worked solution, are named as
 *   such. Both are real progress; neither is independent mastery.
 * - No streaks, no scores, no comparison with other people.
 */

export interface PriorSolve {
  slug: string;
  title: string;
  solvedAt: Date;
  assisted: boolean;
  patternTags: readonly string[];
}

export interface AccomplishmentInput {
  problem: {
    slug: string;
    title: string;
    patternTags: readonly string[];
    tests: ReadonlyArray<{ stdin: string; expectedStdout: string }>;
    signatureId: string;
  };
  help: { hints: number; maxLevel: number; workedSolution: boolean };
  attempts: number;
  /** Accepted solves before this one, newest first. */
  priorSolves: readonly PriorSolve[];
  now: Date;
  requiredSkills: readonly Skill[];
  skillsBefore: SkillSnapshot;
  skillsAfter: SkillSnapshot;
  /** A similar problem picked by the caller when no reviewed one exists. */
  fallbackVariation: { slug: string; title: string } | null;
  feedbackDue: boolean;
}

/** Days before solving the same problem again counts as later recall. */
export const RECALL_AFTER_DAYS = 2;

/** Tags too broad to say two problems share an idea. */
const GENERIC_TAGS = new Set([
  'loops',
  'arrays',
  'strings',
  'edge-cases',
  'lists',
  'arithmetic',
  'counting',
]);

export const STATE_LABELS: Record<string, string> = {
  not_introduced: 'Not started',
  practised_with_help: 'Practised',
  demonstrated: 'Shown independently',
  due_for_review: 'Ready for a review',
};

const TAG_PHRASES: Record<string, string> = {
  accumulator: 'the running-total idea',
  'running-best': 'the "best so far" idea',
  'linear-search': 'searching with a not-found answer',
  filtering: 'counting with a condition',
  modulo: 'the remainder check',
  indexing: 'safe positions',
  bounds: 'safe positions',
  'seen-before': 'remembering what you have seen',
  'frequency-count': 'counting how often things appear',
};

const DAY = 24 * 60 * 60 * 1000;

/** Facts about what the passed tests covered, named by feature, never by value. */
export function coveredFeatures(
  signatureId: string,
  tests: AccomplishmentInput['problem']['tests'],
): string[] {
  const out: string[] = [];
  const firstLines = tests.map((t) => t.stdin.split('\n')[0] ?? '');
  const listy = signatureId.startsWith('fn:ints');
  const texty = signatureId.startsWith('fn:string');
  if (firstLines.some((l) => l.trim() === '') && (listy || texty)) {
    out.push(listy ? 'You handled an empty list.' : 'You handled empty text.');
  }
  if (listy && firstLines.some((l) => /(^|\s)-\d/.test(l))) out.push('Negative numbers work too.');
  if (listy && firstLines.some((l) => l.trim() !== '' && l.trim().split(/\s+/).length === 1)) {
    out.push('A list with a single number works.');
  }
  if (tests.some((t) => t.expectedStdout.trim() === '-1')) {
    out.push('Your code gives -1 when there is nothing to find.');
  }
  if (texty && signatureId.includes(',int') && tests.some((t) => t.expectedStdout === '' && t.stdin.includes('\n'))) {
    out.push('Positions past the end are handled safely.');
  }
  return out.slice(0, 3);
}

export function deriveAccomplishment(input: AccomplishmentInput): Accomplishment {
  const { problem, help, now } = input;
  const assisted = help.hints > 0 || help.workedSolution;
  const sameProblem = input.priorSolves.filter((p) => p.slug === problem.slug);
  const lastSame = sameProblem[0] ?? null;

  const specificTags = problem.patternTags.filter((t) => !GENERIC_TAGS.has(t));
  const transferFrom =
    !assisted && sameProblem.length === 0
      ? (input.priorSolves.find(
          (p) =>
            p.slug !== problem.slug &&
            p.assisted &&
            p.patternTags.some((t) => specificTags.includes(t)),
        ) ?? null)
      : null;

  let kind: AccomplishmentKind;
  if (help.workedSolution) kind = 'worked_solution';
  else if (assisted) kind = 'assisted';
  else if (lastSame && now.getTime() - lastSame.solvedAt.getTime() >= RECALL_AFTER_DAYS * DAY) kind = 'recall';
  else if (transferFrom) kind = 'transfer';
  else kind = 'independent';

  const details: string[] = [];
  let headline: string;
  switch (kind) {
    case 'worked_solution':
      headline = `You rebuilt ${problem.title} after studying the worked solution.`;
      details.push(
        'Writing it back yourself is how the idea starts to stick. A fresh problem on the same idea is the real check.',
      );
      break;
    case 'assisted':
      headline = `You solved ${problem.title} with ${help.hints === 1 ? 'one hint' : `${help.hints} hints`}.`;
      break;
    case 'recall': {
      const days = Math.floor((now.getTime() - lastSame!.solvedAt.getTime()) / DAY);
      headline = `You solved ${problem.title} again without help, ${days} days after last time.`;
      details.push('Remembering how to do something after a gap is stronger evidence than solving it once.');
      break;
    }
    case 'transfer': {
      const tag = problem.patternTags.find(
        (t) => transferFrom!.patternTags.includes(t) && !GENERIC_TAGS.has(t),
      );
      const idea = (tag && TAG_PHRASES[tag]) ?? 'an idea';
      headline = `You used ${idea} from ${transferFrom!.title} on a new problem, without help.`;
      details.push(`On ${transferFrom!.title} you had help. This time you did not.`);
      break;
    }
    default:
      headline = `You solved ${problem.title} without a hint.`;
  }

  details.push(...coveredFeatures(problem.signatureId, problem.tests));

  // Comparable improvement only: the same problem, earlier, with help.
  if (!assisted && lastSame?.assisted) {
    details.push('Last time you solved this one with help. This time you did not need any.');
  }
  if (input.attempts === 1 && !assisted) details.push('It passed on your first submission.');

  // Skill changes, stated as the rule that produced them.
  const skillLines: string[] = [];
  for (const skill of input.requiredSkills) {
    if (skill === 'values') continue;
    const before = input.skillsBefore[skill];
    const after = input.skillsAfter[skill];
    if (after.state === 'demonstrated' && before.state !== 'demonstrated') {
      skillLines.push(`“${SKILL_LABELS[skill]}” is now shown independently: two separate solves without help.`);
    }
  }
  if (assisted && skillLines.length === 0) {
    // The most advanced skill the problem needs, not the first one listed:
    // "Sum of an Array" is about loops, not about comparisons.
    const first = [...input.requiredSkills]
      .filter((s) => s !== 'values')
      .sort((a, b) => SKILLS.indexOf(b) - SKILLS.indexOf(a))[0];
    if (first) {
      skillLines.push(
        `Saved to your skill map under “${SKILL_LABELS[first]}”, as solved with help.`,
      );
    }
  }
  details.push(...skillLines.slice(0, 2));

  const skills: SkillProgressView[] = input.requiredSkills
    .filter((s) => s !== 'values')
    .map((skill) => ({
      skill,
      label: SKILL_LABELS[skill],
      state: input.skillsAfter[skill].state,
      stateLabel: STATE_LABELS[input.skillsAfter[skill].state] ?? input.skillsAfter[skill].state,
      independent: input.skillsAfter[skill].unaidedSolves,
      assisted: input.skillsAfter[skill].assistedSolves,
    }));

  const helpSummary = help.workedSolution
    ? 'Help used: the worked solution. Saved as assisted.'
    : help.hints > 0
      ? `Help used: ${help.hints === 1 ? 'one hint' : `${help.hints} hints`}, up to level ${help.maxLevel} of 5. Saved as assisted.`
      : 'No help used. Saved as an independent solve.';

  // What to offer next, sized by how it went: after help, a same-size problem
  // on the same idea; after an unaided solve, a related problem.
  const pack = starterPack(problem.slug);
  let variation: Accomplishment['variation'] = null;
  if (assisted && pack) {
    variation = pack.checkUnderstanding;
  } else if (input.fallbackVariation) {
    variation = {
      ...input.fallbackVariation,
      why: assisted ? 'A similar problem, to check the idea stuck.' : 'A similar problem with a small twist.',
    };
  }

  return {
    kind,
    headline,
    details: [...new Set(details)].slice(0, 5),
    helpSummary,
    skills,
    variation,
    askFeedback: input.feedbackDue,
  };
}
