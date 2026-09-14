import { argLines, numbersOn } from './diagnose.js';

/**
 * Reviewed help for the starter problems, usable with no AI connection.
 *
 * These are the problems a beginner meets first and the ones the project arc is
 * built from, so each gets hand-written content for the levels that cannot be
 * derived safely from rules: the plain-language idea, an outline with exactly
 * one gap, and the reasoning behind the worked solution.
 *
 * Each also carries a reference tracer. A trace is only shown when its values
 * are real, and `starter.test.ts` runs every tracer against every one of the
 * problem's tests, so a tracer that disagrees with the tests fails the suite
 * rather than teaching something false. Tracers are only ever run on sample
 * inputs or smaller inputs derived from them, never on a hidden test, because
 * a trace ends in the answer.
 */

export interface TraceTable {
  columns: string[];
  rows: string[][];
  result: string;
}

export interface StarterPack {
  slug: string;
  /** Level 1 when nothing specific is wrong yet: a question that directs attention. */
  firstQuestion: string;
  /** Level 3. */
  concept: string;
  /** Level 3, said another way. */
  conceptAlt: string;
  /** Level 4: pseudocode with one meaningful blank, marked ___. */
  outline: string;
  gapNote: string;
  /** Level 5: why the worked solution is shaped the way it is. */
  reasoning: string;
  /** A small different problem that checks the same idea. */
  checkUnderstanding: { slug: string; title: string; why: string };
  trace(stdin: string): TraceTable | null;
  /** A smaller input derived from a sample, for "give me a smaller example". */
  smaller(stdin: string): string | null;
}

const list = (stdin: string) => numbersOn(argLines(stdin)[0] ?? '');
const shown = (values: readonly number[]) => (values.length === 0 ? '' : values.join(' '));

const SUM: StarterPack = {
  slug: 'sum-of-array',
  firstQuestion:
    'Before any code: if you add up `1 2 3 4` on paper, what number do you hold before you have added anything, and what do you do with it at each number?',
  concept:
    'This uses a running total. You make one variable before the loop and set it to 0. Then, on every pass of the loop, you add the current number to it. Because the variable lives outside the loop, it remembers what was added on earlier passes. When the loop ends, it holds the sum. An empty list is handled for free: the loop runs zero times and the total is still 0.',
  conceptAlt:
    'Think of a jar and some coins. You put the empty jar down once, before you start. Each coin goes into the same jar. If you swapped in a fresh empty jar for every coin, you would end with only the last coin. The jar is your total variable, and putting it down once is creating it before the loop.',
  outline: ['total = 0', 'for each number in the list:', '    ___', 'return total'].join('\n'),
  gapNote: 'Fill the one blank: what has to happen to `total` on every pass?',
  reasoning:
    'The total is created once, before the loop, and starts at 0 because adding 0 changes nothing. The loop visits each number once and adds it to the total. The return comes after the loop, so it runs only once every number has been added. An empty list skips the loop and returns 0, which is exactly what the problem asks for.',
  checkUnderstanding: {
    slug: 'product-of-list',
    title: 'Product of a List',
    why: 'Same running-total idea, but multiplying. Watch what the starting value has to be.',
  },
  trace(stdin) {
    const values = list(stdin);
    if (!values) return null;
    let total = 0;
    const rows = [['before the loop', '—', '0']];
    values.forEach((n, i) => {
      total += n;
      rows.push([`pass ${i + 1}`, String(n), String(total)]);
    });
    rows.push(['after the loop: return', '', String(total)]);
    return { columns: ['step', 'number', 'total after this step'], rows, result: String(total) };
  },
  smaller(stdin) {
    const values = list(stdin);
    return values && values.length > 2 ? shown(values.slice(0, 2)) : null;
  },
};

const LARGEST: StarterPack = {
  slug: 'largest-number',
  firstQuestion:
    'If you scan `3 9 2 7` with your finger, which number do you remember at the start, and when do you swap it for a new one?',
  concept:
    'This keeps a "best so far" variable. Start it at a value that is definitely in the list — the first number — and walk through the numbers. Each time a number is bigger than your best so far, it becomes the new best. Starting at 0 looks natural but breaks when every number is negative, because 0 would win without being in the list.',
  conceptAlt:
    'Imagine judging a contest one entrant at a time. The first entrant is automatically the current champion. Each new entrant only takes the title by beating the champion. You never crown someone who did not enter.',
  outline: [
    'best = the first number',
    'for each number in the list:',
    '    if ___:',
    '        best = number',
    'return best',
  ].join('\n'),
  gapNote: 'Fill the blank: when should `best` be replaced?',
  reasoning:
    'Best starts as the first number, so it is always a real value from the list, even when every value is negative. Each number is compared with best and replaces it only when it is bigger. After the loop, best has been compared with every number, so it is the largest. The problem promises at least one number, so reading the first one is safe here.',
  checkUnderstanding: {
    slug: 'smallest-number',
    title: 'Smallest Number',
    why: 'The mirror image. It checks that you know why the starting value matters.',
  },
  trace(stdin) {
    const values = list(stdin);
    if (!values || values.length === 0) return null;
    let best = values[0]!;
    const rows = [['before the loop', '—', 'best = first number', String(best)]];
    values.forEach((n, i) => {
      const before = best;
      const bigger = n > best;
      if (bigger) best = n;
      rows.push([`pass ${i + 1}`, String(n), `${n} > ${before} is ${bigger}`, String(best)]);
    });
    rows.push(['after the loop: return', '', '', String(best)]);
    return { columns: ['step', 'number', 'check', 'best so far'], rows, result: String(best) };
  },
  smaller(stdin) {
    const values = list(stdin);
    return values && values.length > 2 ? shown(values.slice(0, 2)) : null;
  },
};

const COUNT_GT: StarterPack = {
  slug: 'count-greater-than',
  firstQuestion:
    'With the list `3 3 3` and threshold `3`, how many numbers are strictly greater than 3? Which comparison gives that answer for each 3?',
  concept:
    'This is counting with a condition. Keep a count that starts at 0. For each number, ask one yes-or-no question — "is it strictly greater than the threshold?" — and add 1 only when the answer is yes. "Strictly greater" means equal does not count, so the comparison is `>`, not `>=`.',
  conceptAlt:
    'Picture a sign at a ride: "taller than 120 cm". Someone exactly 120 cm does not get on. Your code is the attendant, checking each person once and clicking a counter only for people who are taller.',
  outline: [
    'count = 0',
    'for each number in the list:',
    '    if ___:',
    '        count = count + 1',
    'return count',
  ].join('\n'),
  gapNote: 'Fill the blank with the comparison. Check it against `3 3 3` with threshold 3.',
  reasoning:
    'The count starts at 0, which is also the right answer when nothing qualifies or the list is empty. Each number gets one strict comparison with the threshold; `>` makes numbers equal to the threshold not count. The return sits after the loop so every number is checked first.',
  checkUnderstanding: {
    slug: 'count-even-numbers',
    title: 'Count Even Numbers',
    why: 'Same counting shape with a different yes-or-no question.',
  },
  trace(stdin) {
    const [line = '', limitText = ''] = argLines(stdin);
    const values = numbersOn(line);
    const limit = Number(limitText);
    if (!values || limitText === '' || !Number.isFinite(limit)) return null;
    let count = 0;
    const rows = [['before the loop', '—', '—', '0']];
    values.forEach((n, i) => {
      const yes = n > limit;
      if (yes) count++;
      rows.push([`pass ${i + 1}`, String(n), `${n} > ${limit} is ${yes}`, String(count)]);
    });
    rows.push(['after the loop: return', '', '', String(count)]);
    return { columns: ['step', 'number', 'check', 'count'], rows, result: String(count) };
  },
  smaller(stdin) {
    const [line = '', limit = ''] = argLines(stdin);
    const values = numbersOn(line);
    return values && values.length > 2 ? `${shown(values.slice(0, 2))}\n${limit}` : null;
  },
};

const INDEX_OF: StarterPack = {
  slug: 'index-of-target',
  firstQuestion:
    'For `5 3 7` looking for `7`: after checking `5` and seeing it is not 7, do you know yet that 7 is missing from the list?',
  concept:
    'This is a search that can end early. Check positions one at a time from 0. The moment you find the target, you know the answer, so return its position straight away. But "not found" is only known after every position has been checked, so returning -1 belongs after the loop, not inside it.',
  conceptAlt:
    'Looking for your keys in five pockets: you can stop the moment you find them. You can only say "they are not here" after the fifth pocket. Saying it after the first empty pocket is the mistake.',
  outline: [
    'for each position i in the list:',
    '    if the item at i equals the target:',
    '        return i',
    '___',
  ].join('\n'),
  gapNote: 'Fill the last line. Does it sit inside the loop or after it, and why?',
  reasoning:
    'The loop checks positions from 0 upward, so the first match found is the first time the number appears. Returning inside the `if` stops as soon as it is found. `return -1` is placed after the loop, because reaching that line means every position was checked without a match. An empty list skips the loop and correctly returns -1.',
  checkUnderstanding: {
    slug: 'count-occurrences',
    title: 'Count Occurrences',
    why: 'Same walk through the list, but this time you must not stop early. It checks you know when a return belongs inside a loop.',
  },
  trace(stdin) {
    const [line = '', targetText = ''] = argLines(stdin);
    const values = numbersOn(line);
    const target = Number(targetText);
    if (!values || targetText === '' || !Number.isFinite(target)) return null;
    const columns = ['i', 'item', 'check', 'what happens'];
    const rows: string[][] = [];
    for (let i = 0; i < values.length; i++) {
      const n = values[i]!;
      const match = n === target;
      rows.push([String(i), String(n), `${n} == ${target} is ${match}`, match ? `return ${i}` : 'keep going']);
      if (match) return { columns, rows, result: String(i) };
    }
    rows.push(['after the loop', '', 'every position checked', 'return -1']);
    return { columns, rows, result: '-1' };
  },
  smaller(stdin) {
    const [line = '', target = ''] = argLines(stdin);
    const values = numbersOn(line);
    if (!values || values.length <= 2) return null;
    const t = Number(target);
    const found = values.indexOf(t);
    // Keep the target in the smaller list when it was there, so the lesson —
    // finding it after a miss — survives the shrink.
    const kept = found >= 1 ? [values[found - 1]!, t] : values.slice(0, 2);
    return `${shown(kept)}\n${target}`;
  },
};

const FIRST_CHAR: StarterPack = {
  slug: 'first-character',
  firstQuestion:
    'What should happen for an empty line, which has no first character at all? Does your code reach that case safely?',
  concept:
    'Text is a sequence of characters with positions starting at 0, so the first character is at position 0. But an empty line has no position 0. Before reading position 0, the code has to know the text is not empty — or use a way of taking "up to one character" that is safe on empty text.',
  conceptAlt:
    'Asking for the first letter in an empty envelope: there is nothing to hand over. Check the envelope is not empty first, and if it is, hand back an empty result.',
  outline: ['if ___:', '    return an empty string', 'return the character at position 0'].join('\n'),
  gapNote: 'Fill the blank: what condition means there is no first character?',
  reasoning:
    'Position 0 exists only when the text has at least one character, so the empty case is handled first and returns an empty string. Every other line has a character at position 0, which is returned directly. No loop is needed, because only one position is ever looked at.',
  checkUnderstanding: {
    slug: 'nth-character',
    title: 'Nth Character',
    why: 'Same idea, but the position is given to you, so the safety check depends on its value.',
  },
  trace(stdin) {
    const text = stdin.split('\n')[0] ?? '';
    const empty = text.length === 0;
    return {
      columns: ['step', 'value'],
      rows: [
        ['text', empty ? '(empty)' : text],
        ['length', String(text.length)],
        ['is it empty?', String(empty)],
        ['return', empty ? '"" (empty)' : `"${text[0]}"`],
      ],
      result: empty ? '' : text[0]!,
    };
  },
  smaller: () => null,
};

const NTH_CHAR: StarterPack = {
  slug: 'nth-character',
  firstQuestion:
    'The text `hello` has 5 characters, so its positions are 0 to 4. One example asks for position 9. What must be true about the position before reading that character is safe?',
  concept:
    'Positions count from 0, so text of length 5 has positions 0, 1, 2, 3 and 4 — the last position is always the length minus 1. A position equal to or larger than the length does not exist. This problem says the position is never negative, so the only check needed is on the upper end.',
  conceptAlt:
    'A row of 5 seats is numbered 0 to 4. A ticket for seat 9 is not a seat in this row, so the usher says "no such seat" (an empty result) instead of walking off the end of the row.',
  outline: ['if ___:', '    return an empty string', 'return the character at the given position'].join('\n'),
  gapNote: 'Fill the blank using the position and the length of the text. Test it with position 5 on `hello`.',
  reasoning:
    'Valid positions run from 0 to length − 1, so any position greater than or equal to the length is past the end, and the function returns an empty string for it. Otherwise the position is safe and its character is returned. The problem rules out negative positions, so they are not checked here — in Python a negative index would be valid and count from the end.',
  checkUnderstanding: {
    slug: 'first-character',
    title: 'First Character',
    why: 'A smaller version of the same safety check, for a fixed position.',
  },
  trace(stdin) {
    const [text = '', positionText = ''] = stdin.split('\n');
    const position = Number(positionText.trim());
    if (positionText.trim() === '' || !Number.isInteger(position)) return null;
    const safe = position < text.length;
    return {
      columns: ['step', 'value'],
      rows: [
        ['text', text === '' ? '(empty)' : text],
        ['length', String(text.length)],
        ['valid positions', text.length === 0 ? 'none' : `0 to ${text.length - 1}`],
        ['position asked for', String(position)],
        [`${position} < ${text.length}?`, String(safe)],
        ['return', safe ? `"${text[position]}"` : '"" (empty)'],
      ],
      result: safe ? text[position]! : '',
    };
  },
  smaller: () => null,
};

export const STARTER_PACKS: Readonly<Record<string, StarterPack>> = Object.fromEntries(
  [SUM, LARGEST, COUNT_GT, INDEX_OF, FIRST_CHAR, NTH_CHAR].map((pack) => [pack.slug, pack]),
);

export function starterPack(slug: string): StarterPack | null {
  return STARTER_PACKS[slug] ?? null;
}
