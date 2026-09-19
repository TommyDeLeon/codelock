import { createHash } from 'node:crypto';
import type {
  HintEvidence,
  HintLevel,
  HintRequestKind,
  HintTrace,
  HintView,
  Language,
} from '@codelock/shared';

// Mirrors HINT_LEVEL_LABELS in @codelock/shared. The API may import only types
// from that package: it ships as TypeScript source, so a runtime value import
// fails in the compiled server.
const HINT_LEVEL_LABELS: Record<HintLevel, string> = {
  1: 'A question to focus on',
  2: 'Step through an example',
  3: 'Explain the idea',
  4: 'Outline with one gap',
  5: 'Full worked solution',
};
import {
  MISSING_VALUE,
  argLines,
  numbersOn,
  relation,
  type Diagnosis,
  type DiagnosisId,
  type Evidence,
  type ExecCase,
} from './diagnose.js';
import { define, listWord, termsIn } from './glossary.js';
import { starterPack, type StarterPack } from './starter.js';
import { constructsText, techniquesFor } from './techniques.js';

/**
 * Turn a diagnosis into one clear next step, at the level of help asked for.
 *
 * The five levels are distinct in kind, not just in length:
 *
 *   1. a question that points at one line, value or condition;
 *   2. a trace on a small concrete input;
 *   3. the missing idea in plain words;
 *   4. an outline with exactly one meaningful gap;
 *   5. the worked solution, with the reasoning.
 *
 * Any level can be requested directly. "That didn't help" never repeats the
 * same approach: it moves to an unused strategy at the same level, which is
 * more specific, and only when those run out does it step up a level.
 */

export interface HintHistoryItem {
  level: HintLevel;
  strategy: string;
  diagnosis: string;
  codeHash: string;
}

export interface LadderProblem {
  slug: string;
  title: string;
  signatureId: string;
  promptMarkdown: string;
  patternTags: readonly string[];
  editorialMarkdown: string | null;
  referenceSolution: Partial<Record<Language, string>>;
  sampleCases: ReadonlyArray<{ stdin: string; expectedStdout: string }>;
  /** A plain family-level idea for problems with no reviewed starter pack. */
  familyConcept: string;
}

export interface LadderInput {
  problem: LadderProblem;
  language: Language;
  code: string;
  codeHash: string;
  evidence: Evidence;
  diagnoses: readonly Diagnosis[];
  request: HintRequestKind;
  level?: HintLevel;
  term?: string;
  history: readonly HintHistoryItem[];
  prerequisiteNote: string | null;
}

export const STRATEGIES: Record<HintLevel, readonly string[]> = {
  1: ['question', 'contrast'],
  2: ['trace', 'smaller', 'io_table'],
  3: ['concept', 'analogy'],
  4: ['outline'],
  5: ['worked'],
};

export function hashCode(code: string): string {
  return createHash('sha256')
    .update(code.replace(/[ \t]+$/gm, '').trim())
    .digest('hex')
    .slice(0, 16);
}

export const ISSUE_LABELS: Record<DiagnosisId, string> = {
  not_started: 'the starter code has not been changed yet',
  syntax_error: 'a syntax error stops the code from running',
  name_error: 'a name is used before it exists',
  timeout: 'a loop that does not stop',
  index_crash: 'reading a position that does not exist',
  missing_return: 'the function does not return a value',
  print_not_return: 'the answer is printed instead of returned',
  stray_print: 'an extra print changes the output',
  empty_input: 'empty input is not handled',
  return_in_loop: 'a return inside the loop ends the function early',
  accumulator_reset: 'the total is reset inside the loop',
  running_best_start: 'the "best so far" starts at 0',
  assignment_in_condition: 'a single = inside a condition',
  strictness: 'the comparison includes equal values',
  index_bound: 'the loop goes one position past the end',
  unguarded_index: 'a position is read without checking it',
  wrong_output: 'an example gives a different answer',
  unnecessary_loop: 'a loop that is not needed',
  passing: 'nothing is failing in the examples',
};

const LANGUAGE_NAMES: Record<Language, string> = {
  PYTHON: 'Python',
  JAVASCRIPT: 'JavaScript',
  TYPESCRIPT: 'TypeScript',
  JAVA: 'Java',
  CPP: 'C++',
  GO: 'Go',
};

const clampLevel = (n: number): HintLevel => Math.min(5, Math.max(1, n)) as HintLevel;
const tick = (s: string) => '`' + s.replace(/`/g, "'") + '`';

// ---------------------------------------------------------------------------
// Describing cases in plain words
// ---------------------------------------------------------------------------

function paramKinds(signatureId: string): string[] {
  const args = signatureId.slice(signatureId.indexOf(':') + 1).split('->')[0] ?? '';
  return args.split(',').filter(Boolean);
}

/** "the list `5 3 7` and the number `7`" */
export function describeInput(signatureId: string, stdin: string): string {
  const kinds = paramKinds(signatureId);
  const lines = stdin.split('\n');
  if (kinds.length === 0 || signatureId.startsWith('cls:')) {
    return stdin.trim() === '' ? 'an empty input' : tick(stdin.trim().split('\n').join(' / '));
  }
  return kinds
    .map((kind, i) => {
      const line = (lines[i] ?? '').replace(/\r$/, '');
      switch (kind) {
        case 'ints':
          return line.trim() === '' ? 'an empty list' : `the list ${tick(line.trim())}`;
        case 'int':
          return `the number ${tick(line.trim())}`;
        case 'string':
          return line === '' ? 'empty text' : `the text ${tick(line)}`;
        case 'strings':
          return line.trim() === '' ? 'no words' : `the words ${tick(line.trim())}`;
        default:
          return tick(line.trim());
      }
    })
    .join(' and ');
}

const describeOutput = (s: string | null) =>
  s === null ? 'no output' : s.trim() === '' ? 'an empty line' : tick(s.trim());

function positions(size: number): string {
  if (size === 0) return 'none';
  if (size === 1) return 'just 0';
  if (size <= 4) {
    const all = Array.from({ length: size }, (_, i) => String(i));
    return `${all.slice(0, -1).join(', ')} and ${all[all.length - 1]}`;
  }
  return `0 to ${size - 1}`;
}

/** What the case actually did, as a clause. Only facts from execution. */
function outcome(kase: ExecCase, language: Language): string {
  const stderr = (kase.stderr ?? '').trim();
  if (stderr) {
    const last = stderr
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .reverse()
      .find((l) => /(Error|Exception|panic)/.test(l));
    return `stopped with ${tick((last ?? stderr.split('\n')[0] ?? '').slice(0, 120))}`;
  }
  if (/Time Limit/i.test(kase.status)) return 'ran until the time limit and was stopped';
  const actual = (kase.actual ?? '').trim();
  if (actual === '') return 'printed nothing';
  if (actual === MISSING_VALUE[language]) return `gave back ${tick(actual)} (no value)`;
  return `printed ${tick(actual.split('\n').join(' / '))}`;
}

function caseFact(signatureId: string, kase: ExecCase, language: Language): string {
  const input = describeInput(signatureId, kase.stdin);
  if (kase.hidden) {
    return `Your last submission failed a hidden test: for ${input}, your code ${outcome(kase, language)}. Hidden tests do not show their expected answer.`;
  }
  return `For ${input}, the test expects ${describeOutput(kase.expected)} and your code ${outcome(kase, language)}.`;
}

const lineRef = (d: Diagnosis) => (d.line ? `Line ${d.line}: ${tick(d.lineText ?? '')}` : null);
const lowerLineRef = (d: Diagnosis) => (d.line ? `line ${d.line}: ${tick(d.lineText ?? '')}` : null);

const pythonNegativeNote = (language: Language, prompt: string) =>
  language === 'PYTHON' && !/never negative|not negative|non-?negative/i.test(prompt)
    ? ' Python also accepts negative positions such as -1 (the last item), so check what the problem says about negatives before ruling them out.'
    : '';

// ---------------------------------------------------------------------------
// Lessons: what each diagnosis says at levels 1, 3 and 4
// ---------------------------------------------------------------------------

interface Parts {
  notice: string | null;
  explain: string | null;
  tryThis: string | null;
}

interface Lesson {
  question: Parts;
  contrast: Parts;
  concept: string;
  analogy: string;
  outline: string | null;
}

const joinText = (...parts: Array<string | null | undefined>) => parts.filter(Boolean).join(' ') || null;

/** A concrete input the statement itself calls out, for "check this yourself". */
export function edgeSuggestion(problem: LadderProblem): string | null {
  const prompt = problem.promptMarkdown.toLowerCase();
  const kinds = paramKinds(problem.signatureId);
  const sample = problem.sampleCases[0];
  const covered = (stdin: string) => problem.sampleCases.some((c) => c.stdin === stdin);
  if (/empty/.test(prompt) && (kinds[0] === 'ints' || kinds[0] === 'string')) {
    const rest = (sample?.stdin.split('\n') ?? []).slice(1);
    const input = ['', ...rest].join('\n');
    if (!covered(input)) return input;
  }
  if (/strictly/.test(prompt) && kinds[0] === 'ints' && kinds[1] === 'int' && sample) {
    const limit = argLines(sample.stdin)[1] ?? '3';
    const input = `${limit} ${limit}\n${limit}`;
    if (!covered(input)) return input;
  }
  if (/not in the list|return `-1`/.test(prompt) && kinds[1] === 'int' && sample) {
    const values = numbersOn(argLines(sample.stdin)[0] ?? '') ?? [];
    const input = `${values.join(' ')}\n${values.length ? Math.max(...values) + 100 : 99}`;
    if (!covered(input)) return input;
  }
  if (/negative/.test(prompt) && kinds[0] === 'ints' && kinds.length === 1 && !covered('-4 -9 -2')) {
    return '-4 -9 -2';
  }
  return null;
}

function lessonFor(d: Diagnosis, input: LadderInput, pack: StarterPack | null): Lesson {
  const { problem, language } = input;
  const sig = problem.signatureId;
  const lw = listWord(language);
  const none = MISSING_VALUE[language] || 'no value';
  const line = lineRef(d);
  const fact = d.kase ? caseFact(sig, d.kase, language) : null;
  const concept = pack?.concept ?? problem.familyConcept;
  const analogy =
    pack?.conceptAlt ??
    'Solve the first example by hand and write down every step you take as a short sentence. Each sentence usually becomes one or two lines of code, and the step you could not write down is the one to focus on.';

  switch (d.id) {
    case 'not_started': {
      const sample = problem.sampleCases[0];
      const example = sample
        ? `For ${describeInput(sig, sample.stdin)} the answer is ${describeOutput(sample.expectedStdout)}.`
        : null;
      return {
        question: {
          notice: 'Your editor still has the starter code, so there is nothing of yours to run yet.',
          explain: example,
          tryThis:
            pack?.firstQuestion ??
            techniquesFor(problem.patternTags)[0]?.question ??
            'Work that example out on paper first. What is the very first thing you look at, and what do you do with it?',
        },
        contrast: {
          notice: example,
          explain:
            'A first version does not need to be complete. Getting one example right is real progress you can build on.',
          tryThis: 'Write just enough code to produce that one answer, then press Run and see what happens.',
        },
        concept,
        analogy,
        outline: null,
      };
    }

    case 'syntax_error': {
      const message = d.data.message ?? '';
      const tip =
        /expected ':'|invalid syntax/.test(message) && language === 'PYTHON'
          ? 'Does every line that starts a block — `def`, `if`, `for`, `while`, `else` — end with a colon?'
          : /Indentation|TabError/.test(message)
            ? 'Are the lines inside each block indented by the same amount, using only spaces?'
            : /Unexpected (token|end)|missing \)|expected '\)'|expected ';'|';' expected/.test(message)
              ? 'Count the brackets near that line: does every `(` and `{` that opens also close?'
              : 'Read that line and the one just above it. Is a bracket, quote, colon or semicolon missing or extra?';
      return {
        question: {
          notice: joinText(
            line ? `${line}.` : null,
            `${LANGUAGE_NAMES[language]} stopped before running anything, with ${tick(message)}.`,
          ),
          explain:
            'That is a syntax error: the code is not yet written in a shape the language can read, so none of the tests ran. The mistake is usually on that line or the line just above it.',
          tryThis: tip,
        },
        contrast: {
          notice: joinText(line ? `${line}.` : null, `The message was ${tick(message)}.`),
          explain:
            'Only the syntax is blocking right now. Your logic has not been tested yet, so it may already be fine.',
          tryThis:
            'Temporarily comment out half of the function and press Run. If the message moves or disappears, the mistake is in the half you removed.',
        },
        concept:
          language === 'PYTHON'
            ? 'Python reads structure from colons and indentation. A line that opens a block ends with `:`, and every line inside that block is indented the same amount. Brackets and quotes must also come in pairs. When any of these is off, Python cannot tell where things begin and end, so it refuses to run and points near the confusion.'
            : `${LANGUAGE_NAMES[language]} reads structure from brackets and punctuation: \`( )\` around conditions and calls, \`{ }\` around blocks, quotes around text. When one is missing or extra, the language cannot tell where a statement ends, so it stops before running and points near where it got confused.`,
        analogy:
          'It is like a sentence with an opening quotation mark and no closing one: a reader cannot tell where the quote ends, so they stop and point at roughly where they got lost.',
        outline: null,
      };
    }

    case 'name_error': {
      const name = d.data.name ?? 'that name';
      return {
        question: {
          notice: joinText(
            line ? `${line}.` : null,
            `${LANGUAGE_NAMES[language]} says ${tick(name)} does not exist at that point.`,
          ),
          explain:
            'A name has to be created before it is used — by assigning it, or receiving it as a parameter — and spelled exactly the same way each time, including capital letters.',
          tryThis: `Where in your code is ${tick(name)} first given a value? Is that above this line, and spelled identically?`,
        },
        contrast: {
          notice: `The error names ${tick(name)}.`,
          explain: 'This is often a small typo, or a variable created inside a block and used outside it.',
          tryThis: `Find every place ${tick(name)} appears in your code. Do they all match exactly?`,
        },
        concept:
          'Code runs top to bottom. A variable exists from the line that creates it onward. Using it earlier, or with different spelling, means the language has no value to use, so it stops.',
        analogy: 'It is like asking someone to pass "the blue folder" before anyone has put a blue folder on the desk.',
        outline: null,
      };
    }

    case 'timeout':
      return {
        question: {
          notice: joinText(fact, d.line ? `The loop starts on ${lowerLineRef(d)}.` : null),
          explain:
            'Running until the time limit usually means a loop whose stop condition never becomes true, so it repeats forever.',
          tryThis:
            "Which variable in the loop's condition changes on each pass, and does it move toward making the condition false?",
        },
        contrast: {
          notice: line ? `${line}.` : fact,
          explain: 'A loop stops only when its condition turns false.',
          tryThis:
            'Write down that variable’s value for the first three passes. Is it getting closer to the stopping point, staying the same, or moving away?',
        },
        concept:
          'A `while` loop keeps going as long as its condition is true. Something inside the loop has to change a value in that condition, step by step, until it becomes false. If nothing changes it — or it changes in the wrong direction — the loop never ends.',
        analogy: 'Walking toward a door without taking a step: you will not arrive, however long you wait.',
        outline: null,
      };

    case 'index_crash':
    case 'unguarded_index':
    case 'index_bound': {
      const kase = d.kase;
      let sizeFact: string | null = null;
      let valueFact: string | null = null;
      const position = d.data.position ?? 'the position';
      const collection = d.data.collection ?? 'the text';
      if (kase) {
        const [first = '', second = ''] = kase.stdin.split('\n');
        const kinds = paramKinds(sig);
        const isText = kinds[0] === 'string';
        const size = isText ? first.length : (numbersOn(first)?.length ?? 0);
        const unit = isText ? (size === 1 ? 'character' : 'characters') : size === 1 ? 'item' : 'items';
        const what = isText
          ? first === ''
            ? 'The text is empty'
            : `The text ${tick(first)} has ${size} ${unit}`
          : first.trim() === ''
            ? `The ${lw} is empty`
            : `Your ${lw} ${tick(first.trim())} has ${size} ${unit}`;
        sizeFact = size === 0 ? `${what}, so it has no valid positions.` : `${what}, so its positions are ${positions(size)}.`;
        if (kinds[1] === 'int' && second.trim() !== '') {
          valueFact = `This test uses ${tick(`${position === 'the position' ? 'position' : position} = ${second.trim()}`)}.`;
        }
      }
      const ranFact = kase ? `Your code ${outcome(kase, language)}.` : null;
      const staticOnly = kase ? null : '(This comes from reading your code; no failing test has shown it yet.)';
      const safety =
        d.id === 'unguarded_index'
          ? `What must be true about ${tick(position)} before ${tick(`${collection}[${position}]`)} is safe?`
          : d.id === 'index_bound'
            ? 'On the last pass of your loop, what is the position, and does an item exist there?'
            : 'At the moment it stops, which position is being read, and is it one of the valid ones?';
      return {
        question: {
          notice: joinText(sizeFact, valueFact, ranFact, staticOnly),
          explain: joinText(
            line ? `${line} reads a position without checking it first.` : null,
            d.id === 'index_bound' ? 'Your loop condition lets the position reach the length itself.' : null,
          ),
          tryThis: safety + pythonNegativeNote(language, problem.promptMarkdown),
        },
        contrast: {
          notice: joinText(line ? `${line}.` : null, sizeFact),
          explain:
            d.id === 'index_bound'
              ? `For a ${lw} of 3 items, a loop that includes the length visits positions 0, 1, 2 and 3.`
              : 'The last valid position is always the length minus 1, and nothing before that line compares the position with the length.',
          tryThis:
            d.id === 'index_bound'
              ? 'Which of those four positions has no item?'
              : 'Finish this sentence before writing code: "if the position is ___ the length, there is no item there."',
        },
        concept:
          'Positions start at 0, so the last valid position is always the length minus 1. A position equal to or larger than the length does not exist. Reading one either stops the program with an error (Python, Java, Go) or quietly gives a missing value (JavaScript gives `undefined`). Safe code checks the position first and reads second.' +
          pythonNegativeNote(language, problem.promptMarkdown),
        analogy:
          'A row of 5 seats is numbered 0 to 4. A ticket for seat 5 or seat 9 is not a seat in this row, so the usher has to check the number before walking you there.',
        outline:
          d.id === 'index_bound'
            ? ['for position from 0 while position ___ length:', '    use the item at position'].join('\n')
            : ['if the position is ___ the length:', '    return the "nothing there" answer', 'return the item at the position'].join('\n'),
      };
    }

    case 'print_not_return':
      return {
        question: {
          notice: joinText(
            line ? `${line} shows a value on the screen.` : null,
            d.kase
              ? `For ${describeInput(sig, d.kase.stdin)}, the tests received ${tick(none)} from your function: it handed back no value.`
              : null,
          ),
          explain:
            '`print` is for a person to read. `return` is how a function hands its answer to the code that called it, and that returned value is what the tests check.',
          tryThis: 'What would change if that line handed the value back instead of showing it?',
        },
        contrast: {
          notice: d.kase
            ? `The full output for ${describeInput(sig, d.kase.stdin)} was ${tick((d.kase.actual ?? '').trim().split('\n').join(' / '))}.`
            : line,
          explain: d.kase
            ? `The earlier part comes from your print. The last part, ${tick(none)}, is what your function returned.`
            : 'Your function has no line that returns a value.',
          tryThis: 'Which of those is the one the tests treat as your answer?',
        },
        concept:
          'A function is like a small machine: inputs go in, and `return` sends one answer out to whoever used it. `print` only displays something on the screen along the way. The tests call your function and look at what comes out, so an answer that is only printed never reaches them.',
        analogy:
          'Saying your answer out loud in an exam (print) versus writing it on the paper you hand in (return). Only the paper gets marked.',
        outline: ['work out the answer', '___ the answer   (instead of showing it)'].join('\n'),
      };

    case 'missing_return': {
      const partial = d.data.someReturn === 'yes';
      return {
        question: {
          notice: d.kase ? `For ${describeInput(sig, d.kase.stdin)}, your function handed back ${tick(none)}: no value.` : null,
          explain: partial
            ? 'Your code does have a return. So either this input reaches the end of the function without passing through it, or the value being returned is itself missing — for example an item read from a position that does not exist.'
            : `When a function ends without \`return\`, ${LANGUAGE_NAMES[language]} hands back ${tick(none)} automatically.`,
          tryThis: partial
            ? 'Follow this input through your code. Which path does it take, and does that path end with a return?'
            : 'Which variable holds your answer at the end, and what single line would hand it back?',
        },
        contrast: {
          notice: fact,
          explain: 'Every path through a function that should produce an answer needs to end in a return.',
          tryThis: 'Look at the very last line inside your function. What does it do with the answer?',
        },
        concept:
          'A function gives its answer back with `return`. Reaching the end of a function without one gives back "no value", which never matches a test. If there are several paths — an `if` and what happens otherwise — each path that finishes the job needs a return, or one return after they join.',
        analogy: 'Doing a calculation on scrap paper and then walking away without handing in the result.',
        outline: ['work out the answer', '___'].join('\n'),
      };
    }

    case 'stray_print':
      return {
        question: {
          notice: d.kase
            ? `For ${describeInput(sig, d.kase.stdin)}, the test expects ${describeOutput(d.kase.expected)}, but your program showed ${tick((d.kase.actual ?? '').trim().split('\n').join(' / '))}.`
            : null,
          explain:
            'The tests read everything your program shows. A print left in for checking adds extra output, so it no longer matches even when the returned answer is right.',
          tryThis: `${d.line ? `Is the print on ${lowerLineRef(d)} still needed` : 'Is your print still needed'}, now that you have seen the value?`,
        },
        contrast: {
          notice: line,
          explain: 'Printing while debugging is a good habit. It just has to come out before the tests look.',
          tryThis: 'Remove or comment out that print and press Run. Does the output match now?',
        },
        concept:
          'Tests compare the whole output with the expected answer. Your function’s returned value is printed for you; anything else printed appears as extra lines and makes the comparison fail.',
        analogy: 'Handing in an answer sheet with rough working scribbled across the answer box.',
        outline: null,
      };

    case 'empty_input':
      return {
        question: {
          notice: fact,
          explain: `With nothing in the ${lw}, a loop runs zero times and there is no first item${d.line ? `, so ${lowerLineRef(d)} has nothing to read` : ''}.`,
          tryThis:
            'What should your function give back when there is nothing to look at, and does your code reach that answer for empty input?',
        },
        contrast: {
          notice: line ? `${line}.` : fact,
          explain:
            'The problem statement says what empty input should give. Your code has to produce it without reading an item that is not there.',
          tryThis: 'Trace your function by hand with the empty input. Which line runs first, and what value does it use?',
        },
        concept:
          'Empty input is a real case, not a trick. A loop over nothing simply does not run, so whatever a variable held before the loop is what gets returned. Reading position 0, or asking for the largest of nothing, fails because there is no item. So either choose a starting value that is already the right empty answer, or check for empty first.',
        analogy: 'Counting the apples in an empty bowl: the answer is 0, and you get it without picking up an apple.',
        outline: ['if there is nothing in the input:', '    return ___', 'otherwise work it out as before'].join('\n'),
      };

    case 'return_in_loop': {
      const elseForm = d.data.form === 'else';
      return {
        question: {
          notice: joinText(line ? `${line} is inside the loop.` : null, fact),
          explain:
            '`return` ends the whole function immediately. When it runs, the loop does not get to look at the remaining items.',
          tryThis: elseForm
            ? 'When the first item checked is not a match, should the function give up right away, or keep checking the others?'
            : 'How many passes of your loop can finish before that return runs?',
        },
        contrast: {
          notice: joinText(
            line ? `${line}.` : null,
            d.kase
              ? `Reading your code with ${describeInput(sig, d.kase.stdin)}: on the first pass, the function reaches this line and ends.`
              : null,
          ),
          explain: 'So the answer is decided by the first item alone.',
          tryThis: 'Which items in this example does your code never look at?',
        },
        concept:
          'A loop repeats, but `return` exits the whole function. Returning inside a loop is right when one item settles the answer — "found it". An answer that depends on every item — "not found", a total, a count — is only known after the loop has finished, so that return belongs after the loop.',
        analogy:
          pack?.slug === 'index-of-target'
            ? pack.conceptAlt
            : 'Checking five pockets for your keys: you can stop the moment you find them, but you can only say "not here" after the fifth pocket.',
        outline: [
          'for each item:',
          '    if this item settles the answer:',
          '        return it',
          '___   (the answer when no item settled it)',
        ].join('\n'),
      };
    }

    case 'accumulator_reset': {
      const v = d.data.variable ?? 'total';
      return {
        question: {
          notice: joinText(
            line ? `${line} sets ${tick(v)} back to 0 inside the loop.` : null,
            fact,
            d.kase ? relation(sig, d.kase) : null,
          ),
          explain: 'Everything inside a loop runs again on every pass, so that line wipes the total each time.',
          tryThis: `What does ${tick(v)} hold at the start of the second pass?`,
        },
        contrast: {
          notice: line ? `${line}.` : null,
          explain: `Trace it: after pass 1, ${tick(v)} holds the first item. Then pass 2 begins, and this line runs again.`,
          tryThis: `So after the last pass, which items has ${tick(v)} actually added up?`,
        },
        concept:
          'A running total has two separate jobs: start once, and grow on every pass of the loop. Put the starting line before the loop, so it runs only once. Put only the adding inside the loop. If the starting line is inside, the total starts again from 0 on every pass, and only the last item is left.',
        analogy:
          pack?.slug === 'sum-of-array'
            ? pack.conceptAlt
            : 'A jar you put down once and drop every coin into. Swapping in an empty jar for each coin leaves you with one coin.',
        outline: ['___   (where does the starting value go?)', 'for each item:', '    add the item to the total', 'return the total'].join('\n'),
      };
    }

    case 'running_best_start': {
      const v = d.data.variable ?? 'best';
      const max = d.data.direction !== 'min';
      const values = d.kase ? argLines(d.kase.stdin)[0] : null;
      return {
        question: {
          notice: joinText(
            line ? `${line} starts ${tick(v)} at 0.` : null,
            values ? `This test's numbers, ${tick(values)}, are all ${max ? 'negative' : 'positive'}.` : null,
            d.kase ? `Your code ${outcome(d.kase, language)}.` : null,
          ),
          explain: max
            ? 'No negative number is bigger than 0, so 0 stays "best" — but 0 is not in the list.'
            : 'No positive number is smaller than 0, so 0 stays "smallest" — but 0 is not in the list.',
          tryThis: 'What starting value is guaranteed to be one of the numbers in the list?',
        },
        contrast: {
          notice: line ? `${line}.` : null,
          explain: 'Starting at 0 only works when some number beats 0.',
          tryThis: `Which number in the list could ${tick(v)} start as, so it is a real candidate from the beginning?`,
        },
        concept:
          pack?.slug === 'largest-number'
            ? pack.concept
            : 'A "best so far" variable should start as a real candidate — usually the first item — so the answer is always one of the actual values, whatever their sign.',
        analogy:
          'The first entrant in a contest is the champion until someone beats them. You never crown someone who did not enter.',
        outline: [`${v} = ___`, 'for each number:', `    if the number beats ${v}:`, `        ${v} = the number`, `return ${v}`].join('\n'),
      };
    }

    case 'assignment_in_condition': {
      const eq = language === 'JAVASCRIPT' || language === 'TYPESCRIPT' ? '===' : '==';
      return {
        question: {
          notice: line ? `${line} has a single ${tick('=')} inside the condition.` : null,
          explain: `A single ${tick('=')} stores a value; ${tick(eq)} compares two values. Inside a condition, storing changes your variable instead of checking it.`,
          tryThis: 'On that line, do you mean "make these equal", or "are these equal"?',
        },
        contrast: {
          notice: line,
          explain: 'Your condition currently copies one value into the variable, then asks whether that value counts as true.',
          tryThis: `Which symbol asks "are these equal?" in ${LANGUAGE_NAMES[language]}?`,
        },
        concept: `Programming languages use two different symbols: ${tick('=')} means "store this value in that name", and ${tick(eq)} means "are these the same?". A condition should ask a question, so it needs the comparison symbol.`,
        analogy: 'Writing "x = 5" on a whiteboard (setting it) versus asking out loud "is x 5?" (checking it).',
        outline: null,
      };
    }

    case 'strictness': {
      const op = d.data.operator ?? '>=';
      return {
        question: {
          notice: joinText(line ? `${line} uses ${tick(op)}.` : null, fact),
          explain: `${tick(op)} also counts numbers equal to the threshold, but the problem says "strictly": equal does not count.`,
          tryThis: 'For a number exactly equal to the threshold, which comparison answers false?',
        },
        contrast: {
          notice: line,
          explain: `With the list ${tick('3 3 3')} and threshold ${tick('3')}, each check is ${tick(`3 ${op} 3`)}, which is true.`,
          tryThis: 'How many of those three should count, according to the problem?',
        },
        concept:
          pack?.concept ??
          '"Strictly greater" means bigger and not equal. `>` means strictly greater; `>=` means greater or equal. Choosing between them decides whether the boundary value counts.',
        analogy: pack?.conceptAlt ?? '"Taller than 120 cm" at a ride: someone exactly 120 cm does not get on.',
        outline: pack?.outline ?? null,
      };
    }

    case 'passing': {
      const edge = edgeSuggestion(problem);
      const optional = input.diagnoses.some((x) => x.id === 'unnecessary_loop');
      const count = input.evidence.ran ? input.evidence.cases.length : 0;
      return {
        question: {
          notice: `Your current code passes all ${count} example ${count === 1 ? 'test' : 'tests'}.`,
          explain:
            edge !== null
              ? `The hidden tests include inputs the examples do not show. The problem statement mentions one worth checking yourself: ${describeInput(sig, edge)}.`
              : 'The hidden tests check more inputs than the examples show.',
          tryThis:
            edge !== null
              ? 'Before you submit, tick "custom input", enter that input and press Run. What do you expect it to print, and does it?'
              : 'Submit when you are ready. If a hidden test fails, its input will be shown and the next hint will use it.',
        },
        contrast: {
          notice: 'Nothing in the examples is failing.',
          explain: optional
            ? 'Optional, only if you are curious: your loop works, but this problem only ever looks at one position, so it can also be done without a loop.'
            : null,
          tryThis: 'Reread the last paragraph of the problem statement. Does your code handle every case it names?',
        },
        concept,
        analogy,
        outline: pack?.outline ?? null,
      };
    }

    case 'wrong_output':
    case 'unnecessary_loop':
    default: {
      const rel = d.kase ? relation(sig, d.kase) : null;
      return {
        question: {
          notice: fact,
          explain: rel,
          tryThis:
            d.kase && !d.kase.hidden
              ? "Work that input out by hand, one step at a time. At which step would your code's value stop matching what you wrote?"
              : 'Run your code on that input using custom input. Then work the same input out by hand: what should it be, and where does your code differ?',
        },
        contrast: {
          notice: fact,
          explain: 'To find where it goes wrong, compare values during the run, not just the final answer.',
          tryThis:
            'Temporarily print the variable that holds your answer, inside your loop, and press Run. Which printed value is the first one that surprises you? (Remove the print before submitting.)',
        },
        concept,
        analogy,
        outline: pack?.outline ?? null,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Level 2: traces
// ---------------------------------------------------------------------------

function pickCase(input: LadderInput, top: Diagnosis): { stdin: string; ran: ExecCase | null } | null {
  const ranCases = input.evidence.ran ? input.evidence.cases : [];
  if (top.kase && !top.kase.hidden) return { stdin: top.kase.stdin, ran: top.kase };
  const failingSample = ranCases.find((c) => !c.passed);
  if (failingSample) return { stdin: failingSample.stdin, ran: failingSample };
  const sample = [...input.problem.sampleCases].sort((a, b) => b.stdin.length - a.stdin.length)[0];
  if (!sample) return null;
  return { stdin: sample.stdin, ran: ranCases.find((c) => c.stdin === sample.stdin) ?? null };
}

function traceFor(
  input: LadderInput,
  top: Diagnosis,
  pack: StarterPack | null,
  strategy: string,
): { trace: HintTrace | null; parts: Parts } {
  const { problem, language } = input;
  const sig = problem.signatureId;
  const chosen = pickCase(input, top);
  let note: string | null = null;

  if (pack && chosen) {
    let stdin = chosen.stdin;
    let smaller = false;
    if (strategy === 'smaller') {
      const derived = pack.smaller(chosen.stdin);
      if (derived !== null) {
        stdin = derived;
        smaller = true;
      } else {
        note = 'This example is already about as small as it gets, so the trace uses it directly.';
      }
    }
    const table = pack.trace(stdin);
    if (table) {
      const ranHere = !smaller && chosen.ran && !chosen.ran.passed ? chosen.ran : null;
      const divergence = ranHere
        ? [
            `The reference ends with ${describeOutput(table.result)}. Your code, run on this same input, ${outcome(ranHere, language)}.`,
            relation(sig, ranHere),
          ]
            .filter(Boolean)
            .join(' ')
        : !smaller && chosen.ran?.passed
          ? 'Your code gave this same answer when it ran on this example.'
          : null;
      return {
        trace: {
          title: `${smaller ? 'A smaller example' : 'Step by step'}: ${describeInput(sig, stdin)}`,
          grounding: 'reference',
          groundingNote: smaller
            ? 'A smaller input made from the example. Your code was not run on it; every value in the table comes from CodeLock’s checked reference solution.'
            : 'Values come from CodeLock’s checked reference solution, not from your code. Compare them with what your code does.',
          columns: table.columns,
          rows: table.rows,
          divergence,
        },
        parts: {
          notice: note,
          explain: null,
          tryThis: smaller
            ? `Tick "custom input", enter ${describeInput(sig, stdin)}, and press Run. Does your code print ${describeOutput(table.result)}? If not, which row is the first your code would disagree with?`
            : ranHere
              ? 'Print the variable that holds your answer inside the loop, press Run, and compare each value with the table. Which row is the first where they differ? (Remove the print before submitting.)'
              : 'Follow your own code through the same input. Does each step match a row in the table?',
        },
      };
    }
  }

  // No reviewed tracer: show only what really ran, or the problem's own data.
  if (strategy === 'smaller') {
    note =
      'CodeLock cannot work out answers for new inputs to this problem without a connected analysis service, so this shows the smallest example instead of inventing one.';
  }
  const ranCases = input.evidence.ran ? input.evidence.cases : [];
  if (ranCases.length > 0) {
    const rows = [...ranCases]
      .sort((a, b) => a.stdin.length - b.stdin.length)
      .slice(0, strategy === 'smaller' ? 1 : 5)
      .map((c) => [
        c.stdin.trim() === '' ? '(empty)' : c.stdin.split('\n').join(' / '),
        c.expected === null ? '(hidden)' : c.expected.trim() === '' ? '(empty line)' : c.expected.trim(),
        (c.stderr ?? '').trim() ? 'error' : (c.actual ?? '').trim() === '' ? '(nothing)' : (c.actual ?? '').trim(),
        c.passed ? 'yes' : 'no',
      ]);
    const bad = ranCases.find((c) => !c.passed);
    return {
      trace: {
        title: 'What your code did on the examples',
        grounding: 'executed',
        groundingNote: 'Your current code, run just now on the example tests.',
        columns: ['input', 'expected', 'your output', 'match'],
        rows,
        divergence: bad ? [caseFact(sig, bad, language), relation(sig, bad)].filter(Boolean).join(' ') : null,
      },
      parts: {
        notice: note,
        explain: null,
        tryThis: bad
          ? 'Take the first row that does not match. Write the steps your code takes for that input, one line per step. Where does the value first go wrong?'
          : 'All of these match. If a hidden test failed, run its input with custom input and compare.',
      },
    };
  }

  const rows = problem.sampleCases.map((c) => [
    c.stdin.trim() === '' ? '(empty)' : c.stdin.split('\n').join(' / '),
    c.expectedStdout.trim() === '' ? '(empty line)' : c.expectedStdout.trim(),
  ]);
  return {
    trace: rows.length
      ? {
          title: 'The examples',
          grounding: 'reference',
          groundingNote:
            'From the problem’s own tests. Your code was not run for this hint, so there is no “your output” column.',
          columns: ['input', 'expected'],
          rows,
          divergence: null,
        }
      : null,
    parts: {
      notice: note,
      explain: null,
      tryThis: 'Press Run to see what your code prints for each example, then ask for this step again — it will include your output.',
    },
  };
}

// ---------------------------------------------------------------------------
// Choosing the level and strategy
// ---------------------------------------------------------------------------

export function chooseStep(
  input: Pick<LadderInput, 'history' | 'request' | 'level'>,
  diagnosis: string,
): { level: HintLevel; strategy: string; escalationNote: string | null } {
  const { history, request } = input;
  const sameIssue = history.filter((h) => h.diagnosis === diagnosis);
  const last = history[history.length - 1] ?? null;
  const lastSame = sameIssue[sameIssue.length - 1] ?? null;
  const usedAt = (level: HintLevel) => sameIssue.filter((h) => h.level === level).map((h) => h.strategy);
  const unusedAt = (level: HintLevel) => STRATEGIES[level].find((s) => !usedAt(level).includes(s));

  switch (request) {
    case 'level': {
      const level = input.level ?? 1;
      return { level, strategy: unusedAt(level) ?? STRATEGIES[level][0]!, escalationNote: null };
    }
    case 'step_by_step':
      return { level: 2, strategy: 'trace', escalationNote: null };
    case 'smaller_example':
      return { level: 2, strategy: 'smaller', escalationNote: null };
    case 'explain_word':
      return { level: last?.level ?? 1, strategy: 'glossary', escalationNote: null };
    case 'different_explanation': {
      const level = lastSame?.level ?? 3;
      const fresh = STRATEGIES[level].find((s) => s !== lastSame?.strategy && !usedAt(level).includes(s));
      if (fresh) return { level, strategy: fresh, escalationNote: 'The same step, explained a different way.' };
      if (level >= 4) {
        return {
          level: 3,
          strategy: lastSame?.strategy === 'analogy' ? 'concept' : 'analogy',
          escalationNote: 'The idea behind that step, explained a different way.',
        };
      }
      const other = STRATEGIES[level].find((s) => s !== lastSame?.strategy) ?? STRATEGIES[level][0]!;
      return { level, strategy: other, escalationNote: 'The same step, explained a different way.' };
    }
    case 'didnt_help': {
      if (!lastSame) {
        return {
          level: last ? clampLevel(last.level) : 1,
          strategy: last && last.level > 1 ? STRATEGIES[clampLevel(last.level)][0]! : 'contrast',
          escalationNote: last
            ? 'Your code changed since that hint, so this looks at it fresh, with more specific detail.'
            : 'A more specific version.',
        };
      }
      const fresh = unusedAt(lastSame.level);
      if (fresh) {
        return { level: lastSame.level, strategy: fresh, escalationNote: 'A different approach, with more specific detail.' };
      }
      const level = clampLevel(lastSame.level + 1);
      return {
        level,
        strategy: unusedAt(level) ?? STRATEGIES[level][0]!,
        escalationNote:
          level > lastSame.level
            ? 'That approach did not land, so this goes one step more concrete.'
            : 'This is the most complete help available. If it still does not make sense, the “Explain this word” list or a smaller example may.',
      };
    }
    case 'next':
    default: {
      if (!lastSame) return { level: 1, strategy: 'question', escalationNote: null };
      const level = clampLevel(lastSame.level + 1);
      return { level, strategy: unusedAt(level) ?? STRATEGIES[level][0]!, escalationNote: null };
    }
  }
}

// ---------------------------------------------------------------------------
// Evidence, and the whole hint
// ---------------------------------------------------------------------------

function evidenceFor(input: LadderInput, top: Diagnosis): HintEvidence {
  const { evidence, problem, language } = input;
  const facts: string[] = [];
  let summary: string;
  if (evidence.ran) {
    const passed = evidence.cases.filter((c) => c.passed).length;
    summary = `Ran your current code on ${evidence.cases.length} example ${evidence.cases.length === 1 ? 'test' : 'tests'}: ${passed} passed.`;
    if (evidence.compileError) facts.push(`It did not compile: ${tick(evidence.compileError.split('\n')[0]!.slice(0, 160))}.`);
    for (const c of evidence.cases.filter((x) => !x.passed).slice(0, 2)) {
      facts.push(caseFact(problem.signatureId, c, language));
    }
  } else if (evidence.reason === 'judge_unavailable') {
    summary =
      'Your code could not be run just now because the code runner did not answer. This hint comes from reading your code, not running it.';
  } else if (evidence.reason === 'not_needed') {
    summary = 'Nothing was run for this: it is a word definition.';
  } else {
    summary = 'Your editor still has the starter code, so nothing was run.';
  }
  if (evidence.hiddenFailure) facts.push(caseFact(problem.signatureId, evidence.hiddenFailure, language));

  const suspicion =
    top.blocking && !['wrong_output', 'not_started', 'passing'].includes(top.id)
      ? { text: ISSUE_LABELS[top.id], confidence: top.confidence }
      : null;
  return { ran: evidence.ran, summary, facts, suspicion };
}

const FALLBACK_DIAGNOSIS: Diagnosis = {
  id: 'wrong_output',
  confidence: 'possible',
  blocking: false,
  line: null,
  lineText: null,
  kase: null,
  data: {},
};

export function topDiagnosis(diagnoses: readonly Diagnosis[]): Diagnosis {
  return (
    diagnoses.find((d) => d.blocking) ??
    diagnoses.find((d) => d.id === 'passing') ??
    diagnoses[0] ??
    FALLBACK_DIAGNOSIS
  );
}

export function buildHint(input: LadderInput): HintView {
  const { problem, language, history } = input;
  const top = topDiagnosis(input.diagnoses);
  const pack = starterPack(problem.slug);
  const { level, strategy, escalationNote } = chooseStep(input, top.id);
  const lesson = lessonFor(top, input, pack);

  const last = history[history.length - 1] ?? null;
  const fixable =
    last !== null && !['wrong_output', 'passing', 'not_started', 'unnecessary_loop'].includes(last.diagnosis);
  const resolvedNote =
    last && fixable && last.codeHash !== input.codeHash && last.diagnosis !== top.id &&
    !input.diagnoses.some((d) => d.id === last.diagnosis)
      ? `Your change fixed what the last hint was about (${ISSUE_LABELS[last.diagnosis as DiagnosisId] ?? last.diagnosis}). This hint looks at your code as it is now.`
      : null;

  let parts: Parts = { notice: null, explain: null, tryThis: null };
  let body: string | null = null;
  let code: HintView['code'] = null;
  let trace: HintTrace | null = null;
  let checkUnderstanding: HintView['checkUnderstanding'] = null;

  switch (strategy) {
    case 'question':
      parts = lesson.question;
      break;
    case 'contrast':
      parts = lesson.contrast;
      break;
    case 'trace':
    case 'smaller':
    case 'io_table': {
      const built = traceFor(input, top, strategy === 'io_table' ? null : pack, strategy);
      trace = built.trace;
      parts = built.parts;
      break;
    }
    case 'concept':
    case 'analogy': {
      body = [input.prerequisiteNote, strategy === 'concept' ? lesson.concept : lesson.analogy]
        .filter(Boolean)
        .join('\n\n');
      // The idea, and then the lines: the constructs the problem's technique
      // tags name, in this language. Knowing the idea and not the syntax was
      // the owner's exact complaint, and the idea alone left it standing.
      const constructs = constructsText(techniquesFor(problem.patternTags), language);
      if (constructs) {
        code = { label: `The pieces in ${LANGUAGE_NAMES[language]}`, text: constructs, language };
      }
      parts = {
        notice: top.line && top.blocking ? `This is about ${lowerLineRef(top)}.` : null,
        explain: null,
        tryThis: top.blocking
          ? 'With that idea in mind, look at your code again. What would you change first?'
          : constructs
            ? 'These are the pieces, not the answer. Put them in the order the outline needs.'
            : null,
      };
      break;
    }
    case 'outline': {
      const technique = techniquesFor(problem.patternTags);
      const techniqueOutline = technique.length > 0 ? technique.map((t) => t.outline).join('\n\n') : null;
      const outline = pack?.outline ?? lesson.outline ?? techniqueOutline;
      if (outline) {
        code = { label: 'Outline with one gap', text: outline, language: 'pseudocode' };
        body =
          pack?.gapNote ??
          (outline === techniqueOutline
            ? `Fill in each blank marked ___. This is the shape of ${technique.map((t) => t.tag.replace('-', ' ')).join(' and ')}, which is what this problem is tagged with; the constructs for ${LANGUAGE_NAMES[language]} are one level down.`
            : 'Fill in the blank marked ___. Everything else is the plan in plain words.');
      } else {
        body = `There is no reviewed outline for ${problem.title} yet, so here is the idea it would be built on instead.\n\n${lesson.concept}`;
      }
      parts = {
        notice: null,
        explain: null,
        tryThis: 'Turn the outline into code one line at a time, then press Run.',
      };
      break;
    }
    case 'worked': {
      const solution = problem.referenceSolution[language] ?? null;
      code = solution ? { label: `Worked solution (${LANGUAGE_NAMES[language]})`, text: solution, language } : null;
      const reasoning = pack?.reasoning ?? trimEditorial(problem.editorialMarkdown);
      body = [
        solution ? null : `There is no reviewed ${LANGUAGE_NAMES[language]} solution for this problem yet.`,
        reasoning ?? 'No written reasoning is available for this problem yet.',
      ]
        .filter(Boolean)
        .join('\n\n');
      parts = {
        notice: null,
        explain: null,
        tryThis:
          'Read it, then hide it and write it again from memory. When you pass, it is saved as solved with help, so your progress shows what you did on your own and what you did with support.',
      };
      checkUnderstanding = pack?.checkUnderstanding ?? null;
      break;
    }
    case 'glossary': {
      const found = input.term ? define(input.term, language) : null;
      body = found
        ? `${found.term}: ${found.definition}`
        : `There is no plain-language entry for “${input.term ?? ''}” yet. Pick one of the words listed under the hint, or ask for a different explanation.`;
      break;
    }
  }

  const allText = [parts.notice, parts.explain, parts.tryThis, body, trace?.divergence].filter(Boolean).join(' ');

  return {
    level,
    levelLabel: HINT_LEVEL_LABELS[level],
    strategy,
    request: input.request,
    diagnosis: top.id,
    notice: parts.notice,
    explain: parts.explain,
    tryThis: parts.tryThis,
    body,
    code,
    trace,
    evidence: evidenceFor(input, top),
    terms: termsIn(allText, language),
    analysisNote: input.evidence.ran
      ? 'No AI model is connected. This hint was built by running your current code on the example tests and applying CodeLock’s reviewed hint rules.'
      : 'No AI model is connected, and your code was not run for this hint. It was built by reading your code with CodeLock’s reviewed hint rules.',
    resolvedNote,
    escalationNote,
    checkUnderstanding,
    nextLevel: level < 5 ? clampLevel(level + 1) : null,
  };
}

function trimEditorial(markdown: string | null): string | null {
  if (!markdown) return null;
  const text = markdown.trim();
  return text.length > 1400 ? `${text.slice(0, 1400).replace(/\s+\S*$/, '')}…` : text;
}
