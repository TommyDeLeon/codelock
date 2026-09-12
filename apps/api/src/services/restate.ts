import type { HintCase } from './hints.js';

/**
 * The same problem, said a different way.
 *
 * ## Why this is derived rather than authored or generated
 *
 * "Explain differently" has three possible sources. A second authored prompt
 * would mean writing 695 of them, and a second prompt nobody maintains rots
 * into a contradiction of the first. A model call would cost money, add a wait
 * to a screen someone is already stuck on, and fail exactly when the network
 * does. What is left is the problem's own structure, which is not a
 * compromise: the signature and the real sample cases are the two things a
 * beginner most often cannot extract from prose, and stating them flatly is
 * the restatement that actually helps.
 *
 * Deliberately a different register from both neighbours. The prompt is
 * authored prose. The hints name the idea without writing the code. This says
 * what goes in, what comes out, and what one real example does — no strategy,
 * no encouragement, no retelling of the story.
 *
 * Pure, so it needs no database and no network.
 */

/** Plain-words reading of one signature atom. */
const ATOMS: Record<string, string> = {
  int: 'a whole number',
  ints: 'a list of whole numbers',
  string: 'a piece of text',
  strings: 'a list of pieces of text',
  matrix: 'a grid of whole numbers, given as rows',
  bool: 'either yes or no',
  double: 'a number that can have a fractional part',
  tree: 'a tree of nodes',
  list: 'a chain of linked nodes',
};

/** Stand-in when a second argument's type is not in the map. */
const SECOND_ARGUMENT = 'a second value alongside it';

export interface RestateSource {
  title: string;
  signatureId: string;
}

/** Split `fn:a,b->c` into its argument atoms and its return atom. */
function parseSignature(signatureId: string): { args: string[]; returns: string } | null {
  if (!signatureId.startsWith('fn:')) return null;
  const body = signatureId.slice(3);
  const arrow = body.indexOf('->');
  if (arrow < 0) return null;
  const args = body
    .slice(0, arrow)
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
  const returns = body.slice(arrow + 2).trim();
  if (args.length === 0 || returns === '') return null;
  return { args, returns };
}

function quote(text: string): string {
  return `\`${text}\``;
}

/** One sample case as a sentence, when there is one worth quoting. */
function exampleSentence(kase: HintCase | undefined): string | null {
  if (!kase) return null;

  const lines = kase.stdin.split('\n').map((line) => line.trim());
  const expected = kase.expectedStdout.trim();
  // A long input quoted in full stops being an example and becomes a wall.
  const shown = lines.filter(Boolean).map(quote).join(' and then ');
  if (shown === '' || shown.length > 90) return null;

  if (expected === '') return `Given ${shown}, nothing is printed.`;
  if (expected.length > 60) {
    return `Given ${shown}, the answer is longer than this line, so read it from the sample below.`;
  }
  return `Given ${shown}, the answer is ${quote(expected)}.`;
}

/**
 * A restatement of one problem, as two or three short sentences.
 *
 * Never throws and never returns an empty string. An unrecognised signature
 * falls back to the sample cases alone, and a problem with neither still gets
 * an honest sentence saying so — a control that sometimes renders nothing is
 * worse than one that admits it has nothing to add.
 */
export function restate(problem: RestateSource, cases: readonly HintCase[] = []): string {
  const parts: string[] = [];

  if (problem.signatureId.startsWith('cls:')) {
    // Class problems are driven by a script of operations rather than one
    // call, which is the single most common thing beginners miss about them.
    parts.push(
      'This one is not a single function. You build something that remembers state, ' +
        'and the input is a list of instructions performed on it one at a time, in order.',
    );
    parts.push('Each instruction that asks a question prints its answer; the others print nothing.');
  } else {
    const parsed = parseSignature(problem.signatureId);
    if (parsed) {
      const [first, second] = parsed.args;
      const given =
        parsed.args.length === 1
          ? (ATOMS[first!] ?? 'one value')
          : `${ATOMS[first!] ?? 'one value'}, and ${ATOMS[second!] ?? SECOND_ARGUMENT}`;

      parts.push(`You are given ${given}.`);
      parts.push(
        parsed.returns === 'bool'
          ? 'You return either yes or no, so you can stop as soon as the answer is certain.'
          : `You return ${ATOMS[parsed.returns] ?? 'one value'}.`,
      );
    }
  }

  const example = exampleSentence(cases[0]);
  if (example) parts.push(example);

  if (parts.length === 0) {
    return 'There is no shorter way to say this one than the statement above. The sample cases are the clearest part of it.';
  }
  return parts.join(' ');
}
