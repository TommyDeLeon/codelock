import type { Language } from '@prisma/client';

/**
 * A written record of one solve, in Problem / Solution / Results form.
 *
 * The repository of accepted solutions is the only artefact of this product
 * that outlives a session, and a folder of bare source files is close to
 * worthless six months later: it shows what was typed and nothing about what it
 * was up against or why the approach was right. For an audience changing
 * careers it is also the thing they will actually show someone, so it should
 * read as evidence of reasoning rather than proof of attendance.
 *
 * Everything here comes from figures the grader already produced. Nothing is
 * inferred about how the user thought, and nothing is invented: where a figure
 * is unknown the line is omitted rather than filled with a plausible number.
 */

export interface CaseStudyInput {
  problemTitle: string;
  problemSlug: string;
  difficulty: string;
  patternTags: string[];
  language: Language;
  sourceCode: string;
  /** Wall-clock runtime of the accepted submission. */
  runtimeMs: number | null;
  /** The budget it had to come in under. */
  gateMs: number | null;
  /** Best runtime known for this problem. */
  bestKnownMs: number | null;
  /** Attempts made during this lock, including the accepted one. */
  attempts: number;
  /** How long the screen was locked, in seconds. */
  secondsLocked: number | null;
  /** Median time this problem takes, for context on the above. */
  avgSolveSeconds: number | null;
  solvedAt: Date;
  leetcodeSlug: string | null;
}

function humanDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

/**
 * The Results section, the only part with a claim to objectivity.
 *
 * A ratio against the best known solution is the honest headline: "110 ms"
 * alone means nothing without the hardware and the budget it ran against, and
 * this product's whole argument is that a correct answer is not automatically
 * a good one.
 */
function renderResults(input: CaseStudyInput): string[] {
  const lines: string[] = [];

  if (input.runtimeMs !== null && input.gateMs !== null) {
    const margin = input.gateMs - input.runtimeMs;
    lines.push(
      `- Ran in **${input.runtimeMs} ms** against a **${input.gateMs} ms** budget` +
        (margin >= 0 ? ` — ${margin} ms inside it.` : '.'),
    );
  } else if (input.runtimeMs !== null) {
    lines.push(`- Ran in **${input.runtimeMs} ms**.`);
  }

  if (input.runtimeMs !== null && input.bestKnownMs !== null && input.bestKnownMs > 0) {
    const ratio = input.runtimeMs / input.bestKnownMs;
    const verdict =
      ratio <= 1
        ? 'the fastest run on record for this problem'
        : `${ratio.toFixed(2)}x the best known solution`;
    lines.push(`- That is ${verdict}.`);
  }

  if (input.secondsLocked !== null) {
    const context =
      input.avgSolveSeconds !== null
        ? ` (most people take about ${humanDuration(input.avgSolveSeconds)})`
        : '';
    lines.push(`- Solved after **${humanDuration(input.secondsLocked)}** locked out${context}.`);
  }

  // One attempt is worth stating; so is twelve. Both are honest signals, and
  // hiding the second would make the first meaningless.
  lines.push(
    input.attempts <= 1
      ? '- Accepted on the first submission.'
      : `- Accepted on submission **${input.attempts}**.`,
  );

  return lines;
}

/** Fenced-code language hints; Prisma's enum is upper-case and Markdown's is not. */
const FENCE: Record<string, string> = {
  JAVASCRIPT: 'javascript',
  TYPESCRIPT: 'typescript',
  PYTHON: 'python',
  JAVA: 'java',
  CPP: 'cpp',
  GO: 'go',
};

export function renderCaseStudy(input: CaseStudyInput): string {
  const link = input.leetcodeSlug ? `https://leetcode.com/problems/${input.leetcodeSlug}/` : null;
  const tags = input.patternTags.filter(Boolean);

  const out: string[] = [
    `# ${input.problemTitle}`,
    '',
    `\`${input.difficulty.toUpperCase()}\`` +
      (tags.length ? ` · ${tags.map((t) => `\`${t}\``).join(' ')}` : '') +
      ` · solved ${input.solvedAt.toISOString().slice(0, 10)}`,
    '',
    '## Problem',
    '',
  ];

  // The statement itself is deliberately not reproduced: on problems mirrored
  // from elsewhere it is not ours to copy, and a link stays correct when the
  // original is edited.
  out.push(
    link
      ? `[${input.problemTitle}](${link}) — ${input.difficulty.toLowerCase()}.`
      : `${input.problemTitle} — ${input.difficulty.toLowerCase()}.`,
  );
  if (tags.length) out.push('', `The shape of it: ${tags.join(', ')}.`);

  out.push(
    '',
    'This arrived as a lock screen: the machine stayed locked until a correct',
    'solution came in **inside a runtime budget**, so passing the tests was',
    'necessary and not sufficient.',
    '',
    '## Solution',
    '',
    `Written in ${input.language.toLowerCase()}.`,
    '',
    '```' + (FENCE[input.language] ?? ''),
    input.sourceCode.trimEnd(),
    '```',
    '',
    '## Results',
    '',
    ...renderResults(input),
    '',
    '---',
    '',
    '<sub>Written automatically by [CodeLock](https://codelock.tommydeleon.com) when the',
    "lock was released. Runtimes are measured in CodeLock's own sandbox and are",
    'comparable only against its own budgets.</sub>',
    '',
  );

  return out.join('\n');
}
