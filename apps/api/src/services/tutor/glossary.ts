import type { Language } from '@codelock/shared';

/**
 * Plain-language definitions for words a hint might use.
 *
 * A hint is only as useful as its least familiar word. Rather than banning
 * every technical term — some of them are exactly what the learner needs to
 * learn — each one the hints use is defined here, and the panel offers
 * "Explain this word" for any that appear.
 */

interface Entry {
  term: string;
  aliases: readonly string[];
  define: (language: Language) => string;
}

export const listWord = (language: Language): string =>
  ({
    PYTHON: 'list',
    JAVASCRIPT: 'array',
    TYPESCRIPT: 'array',
    JAVA: 'array',
    CPP: 'vector',
    GO: 'slice',
  })[language];

const equalsOperator = (language: Language) =>
  language === 'JAVASCRIPT' || language === 'TYPESCRIPT' ? '`===`' : '`==`';

const ENTRIES: readonly Entry[] = [
  {
    term: 'index',
    aliases: ['indexes', 'indices', 'position', 'positions'],
    define: (l) =>
      `A number that says where an item sits. Counting starts at 0, so in a ${listWord(l)} of 3 items the indexes are 0, 1 and 2. There is no index 3.`,
  },
  {
    term: 'loop',
    aliases: ['loops', 'pass', 'passes'],
    define: () =>
      'Code that repeats. Each repeat is called a pass: once for every item, or until a condition stops being true.',
  },
  {
    term: 'variable',
    aliases: ['variables'],
    define: () =>
      'A name that holds a value, like a labelled box. Setting it again replaces what was inside.',
  },
  {
    term: 'block',
    aliases: ['blocks'],
    define: (l) =>
      l === 'PYTHON'
        ? 'A group of lines that belong together, like the lines inside an `if` or a loop. In Python the line that starts it ends with `:` and the lines inside are indented.'
        : 'A group of lines that belong together, like the lines inside an `if` or a loop, wrapped in `{` and `}`.',
  },
  {
    term: 'return',
    aliases: ['returns', 'returned', 'hand back', 'hands back'],
    define: () =>
      'Hands a value back to whoever called the function, and ends the function right there — even in the middle of a loop.',
  },
  {
    term: 'print',
    aliases: ['printing', 'printed', 'prints'],
    define: () =>
      'Shows text on the screen for a person to read. It does not hand the value back to the code, so the tests do not treat it as your answer.',
  },
  {
    term: 'condition',
    aliases: ['conditions'],
    define: () =>
      'A yes-or-no question the code asks, like `n > 3`. The code inside an `if` runs only when the answer is yes.',
  },
  {
    term: 'comparison',
    aliases: ['compare', 'compares', 'comparing', 'operator'],
    define: (l) =>
      `A check between two values. \`>\` is "greater than", \`>=\` is "greater than or equal to", and ${equalsOperator(l)} asks "are these equal?". A single \`=\` does not compare; it stores.`,
  },
  {
    term: 'running total',
    aliases: ['accumulator', 'accumulate', 'total'],
    define: () =>
      'A variable that is created before the loop and grows on each pass, so by the end it holds the combined result of every item.',
  },
  {
    term: 'starting value',
    aliases: ['initial value', 'initialise', 'initialised', 'initialize', 'initialized', 'starts at'],
    define: () =>
      'What a variable holds before the loop begins. It is the answer your code gives if the loop never runs at all.',
  },
  {
    term: 'empty',
    aliases: ['empty list', 'empty input', 'nothing at all'],
    define: (l) =>
      `A ${listWord(l)} or text with nothing in it. A loop over it runs zero times, and it has no first item.`,
  },
  {
    term: 'syntax error',
    aliases: ['syntax'],
    define: () =>
      'The code is not written in a shape the language can read yet — a missing bracket, colon or quote — so none of it runs.',
  },
  {
    term: 'error message',
    aliases: ['traceback', 'stack trace'],
    define: () =>
      'What the language prints when the program stops early. The last line usually names the problem, and a line number points near it.',
  },
  {
    term: 'strictly greater',
    aliases: ['strictly'],
    define: () => '"Strictly greater than 3" means 4 counts and 3 does not. Equal is not enough.',
  },
  {
    term: 'trace',
    aliases: ['tracing', 'step by step'],
    define: () =>
      'Following code one step at a time and writing down what each variable holds after each step. It is how most bugs are found.',
  },
  {
    term: 'pseudocode',
    aliases: ['outline'],
    define: () =>
      'The steps of a solution written in plain words, without the exact rules of any one language.',
  },
  {
    term: 'function',
    aliases: ['functions'],
    define: () =>
      'A named, reusable piece of code. It takes inputs (parameters) and hands back one answer with return.',
  },
  {
    term: 'parameter',
    aliases: ['parameters', 'argument', 'arguments'],
    define: () => 'A name for one input a function receives, like `a` in `solve(a)`.',
  },
  {
    term: 'None',
    aliases: ['undefined', 'null'],
    define: (l) =>
      l === 'PYTHON'
        ? 'Python\'s way of saying "no value". A function that ends without `return` hands back None.'
        : 'The language\'s way of saying "no value". A function that ends without `return` hands it back.',
  },
];

export function define(term: string, language: Language): { term: string; definition: string } | null {
  const wanted = term.trim().toLowerCase();
  const entry = ENTRIES.find(
    (e) => e.term.toLowerCase() === wanted || e.aliases.some((a) => a.toLowerCase() === wanted),
  );
  return entry ? { term: entry.term, definition: entry.define(language) } : null;
}

/** The glossary entries whose words appear in some hint text. */
export function termsIn(
  text: string,
  language: Language,
): Array<{ term: string; definition: string }> {
  const lower = text.toLowerCase();
  const out: Array<{ term: string; definition: string }> = [];
  for (const entry of ENTRIES) {
    const words = [entry.term, ...entry.aliases].map((w) =>
      w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );
    if (words.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(lower))) {
      out.push({ term: entry.term, definition: entry.define(language) });
    }
  }
  return out.slice(0, 6);
}

export const GLOSSARY_TERMS = ENTRIES.map((e) => e.term);
