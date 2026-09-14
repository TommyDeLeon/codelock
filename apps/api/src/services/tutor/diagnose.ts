import type { Language } from '@codelock/shared';

/**
 * Read the learner's current code, and what it actually did, and say what is
 * most likely in the way.
 *
 * Deliberately rules rather than a model. Every rule here is small enough to
 * test against real code, and each one reports how sure it is:
 *
 * - `confirmed` — execution shows it directly: a traceback, a compiler
 *   message, `None` printed where a value belonged.
 * - `likely` — a code pattern that is almost always wrong, together with a
 *   failing test that the pattern would explain.
 * - `possible` — a code pattern alone. Worth a question, never a verdict.
 *
 * A rule that fires on a correct alternative solution is a bug in the rule, so
 * when the examples pass, pattern-only findings stop being blocking and the
 * hint says the code works.
 */

/** One case as it ran. Hidden cases never carry an expected output. */
export interface ExecCase {
  ordinal: number | null;
  stdin: string;
  expected: string | null;
  actual: string | null;
  stderr: string | null;
  status: string;
  passed: boolean;
  hidden: boolean;
}

export type Evidence =
  | { ran: true; cases: ExecCase[]; compileError: string | null; hiddenFailure: ExecCase | null }
  | {
      ran: false;
      reason: 'unchanged_starter' | 'judge_unavailable' | 'not_needed';
      hiddenFailure: ExecCase | null;
    };

export const DIAGNOSIS_IDS = [
  'not_started',
  'syntax_error',
  'name_error',
  'timeout',
  'index_crash',
  'missing_return',
  'print_not_return',
  'stray_print',
  'empty_input',
  'return_in_loop',
  'accumulator_reset',
  'running_best_start',
  'assignment_in_condition',
  'strictness',
  'index_bound',
  'unguarded_index',
  'wrong_output',
  'unnecessary_loop',
  'passing',
] as const;

export type DiagnosisId = (typeof DIAGNOSIS_IDS)[number];
export type Confidence = 'confirmed' | 'likely' | 'possible';

export interface Diagnosis {
  id: DiagnosisId;
  confidence: Confidence;
  /** False for findings that do not stop the code being correct. */
  blocking: boolean;
  line: number | null;
  lineText: string | null;
  kase: ExecCase | null;
  data: Record<string, string>;
}

export interface DiagnoseInput {
  language: Language;
  code: string;
  starterCode: string | null;
  signatureId: string;
  promptMarkdown: string;
  patternTags: readonly string[];
  evidence: Evidence;
  /** Driver lines above the learner's code, for mapping traceback lines back. */
  lineOffset: number;
}

// ---------------------------------------------------------------------------
// Source helpers
// ---------------------------------------------------------------------------

export interface SrcLine {
  n: number;
  text: string;
  code: string;
  indent: number;
}

const isPython = (language: Language) => language === 'PYTHON';

export function sourceLines(code: string, language: Language): SrcLine[] {
  return code.split(/\r?\n/).map((text, i) => {
    const trimmed = text.trim();
    const comment = isPython(language) ? trimmed.startsWith('#') : trimmed.startsWith('//');
    return {
      n: i + 1,
      text,
      code: comment ? '' : text,
      indent: (text.match(/^[ \t]*/)?.[0] ?? '').replace(/\t/g, '    ').length,
    };
  });
}

const normalise = (code: string) => code.replace(/\s+/g, '');

/** Text after a `for (...)` / `while (...)` / `if (...)` header's closing paren. */
export function afterHeader(code: string): { condition: string; rest: string } | null {
  const match = /\b(for|while|if)\s*\(/.exec(code);
  if (!match) return null;
  let depth = 0;
  for (let i = match.index + match[0].length - 1; i < code.length; i++) {
    if (code[i] === '(') depth++;
    else if (code[i] === ')') {
      depth--;
      if (depth === 0) {
        return {
          condition: code.slice(match.index + match[0].length, i),
          rest: code.slice(i + 1),
        };
      }
    }
  }
  return null;
}

function isLoopHeader(line: SrcLine, language: Language): boolean {
  if (isPython(language)) return /^\s*(for|while)\b.*:\s*$/.test(line.code);
  if (language === 'GO') return /^\s*for\b/.test(line.code);
  return /\b(for|while)\s*\(/.test(line.code);
}

export interface LoopBlock {
  header: SrcLine;
  /** Body lines; for brace languages the header's own trailing text counts. */
  body: SrcLine[];
  /** Body lines at the loop's own nesting level (not inside an inner block). */
  topLevel: SrcLine[];
}

export function loops(lines: readonly SrcLine[], language: Language): LoopBlock[] {
  const out: LoopBlock[] = [];
  lines.forEach((header, index) => {
    if (!isLoopHeader(header, language)) return;

    if (isPython(language)) {
      const body: SrcLine[] = [];
      for (const line of lines.slice(index + 1)) {
        if (line.code.trim() === '') continue;
        if (line.indent <= header.indent) break;
        body.push(line);
      }
      const bodyIndent = body[0]?.indent ?? 0;
      out.push({ header, body, topLevel: body.filter((l) => l.indent === bodyIndent) });
      return;
    }

    // Brace languages. Strip the header so `for (let i = 0; ...)` is not read
    // as a statement inside the body.
    const tail =
      language === 'GO'
        ? header.code.replace(/^\s*for\b[^{]*/, '')
        : (afterHeader(header.code)?.rest ?? '');
    const first: SrcLine = { ...header, code: tail };
    const body: SrcLine[] = [];
    const topLevel: SrcLine[] = [];
    const hasBrace =
      tail.includes('{') || (tail.trim() === '' && (lines[index + 1]?.code.trim().startsWith('{') ?? false));

    if (!hasBrace) {
      // A single statement: on the header line, or on the next line.
      const single = tail.trim() !== '' ? first : lines[index + 1];
      if (single) {
        body.push(single);
        topLevel.push(single);
      }
      out.push({ header, body, topLevel });
      return;
    }

    let depth = 0;
    let opened = false;
    for (const line of [first, ...lines.slice(index + 1)]) {
      const startDepth = depth;
      for (const ch of line.code) {
        if (ch === '{') {
          depth++;
          opened = true;
        } else if (ch === '}') depth--;
      }
      body.push(line);
      const trimmed = line.code.replace(/^[\s{}]+|[\s{}]+$/g, '');
      if (trimmed !== '' && (startDepth === 1 || (startDepth === 0 && depth <= 1))) {
        topLevel.push(line);
      }
      if (opened && depth <= 0) break;
    }
    out.push({ header, body, topLevel });
  });
  return out;
}

const PRINT: Record<Language, RegExp> = {
  PYTHON: /\bprint\s*\(/,
  JAVASCRIPT: /\bconsole\.(log|info|error)\s*\(/,
  TYPESCRIPT: /\bconsole\.(log|info|error)\s*\(/,
  JAVA: /\bSystem\.out\.print/,
  CPP: /\bcout\s*<<|\bprintf\s*\(/,
  GO: /\bfmt\.Print/,
};

export const MISSING_VALUE: Record<Language, string> = {
  PYTHON: 'None',
  JAVASCRIPT: 'undefined',
  TYPESCRIPT: 'undefined',
  JAVA: 'null',
  CPP: '',
  GO: '',
};

function returnsValue(code: string, language: Language): boolean {
  if (isPython(language)) return /^\s*return\s+\S/m.test(code) || /\blambda\b[^:]*:/.test(code);
  if (/\breturn\s+[^;\s}]/.test(code)) return true;
  // An expression-bodied arrow returns its expression: `const solve = a => a[0]`.
  return (language === 'JAVASCRIPT' || language === 'TYPESCRIPT') && /=>\s*(?!\{)[^\s]/.test(code);
}

/** The learner's parameter names, in order, from their `solve` definition. */
export function parameterNames(code: string, language: Language): string[] {
  const patterns: Record<Language, RegExp> = {
    PYTHON: /def\s+solve\s*\(([^)]*)\)/,
    JAVASCRIPT: /(?:function\s+solve\s*|solve\s*=\s*(?:function\s*)?)\(([^)]*)\)/,
    TYPESCRIPT: /(?:function\s+solve\s*|solve\s*=\s*(?:function\s*)?)\(([^)]*)\)/,
    JAVA: /\bsolve\s*\(([^)]*)\)/,
    CPP: /\bsolve\s*\(([^)]*)\)/,
    GO: /func\s+solve\s*\(([^)]*)\)/,
  };
  const inside = patterns[language].exec(code)?.[1];
  if (!inside) return [];
  return inside
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (language === 'GO') return part.split(/\s+/)[0] ?? '';
      if (language === 'JAVA' || language === 'CPP') {
        return part.replace(/[&*[\]<>]/g, ' ').trim().split(/\s+/).pop() ?? '';
      }
      return part.split(/[:=]/)[0]?.trim() ?? '';
    })
    .filter((name) => /^[A-Za-z_]\w*$/.test(name));
}

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------------------------------------------------------------------------
// Case helpers
// ---------------------------------------------------------------------------

export function argLines(stdin: string): string[] {
  return stdin.split('\n').map((line) => line.trim());
}

export function numbersOn(line: string): number[] | null {
  if (line.trim() === '') return [];
  const values = line.trim().split(/\s+/).map(Number);
  return values.every((n) => Number.isFinite(n)) ? values : null;
}

/** Map a line number in an error message back into the learner's own code. */
export function mapErrorLine(
  message: string,
  language: Language,
  lineOffset: number,
  codeLineCount: number,
): number | null {
  const found = isPython(language)
    ? [...message.matchAll(/line (\d+)/g)].map((m) => Number(m[1]))
    : [...message.matchAll(/:(\d+)(?::\d+)?|\((\d+),\d+\)/g)].map((m) => Number(m[1] ?? m[2]));
  // Python's last frame is where it stopped; a JavaScript stack lists it first.
  const mapped = found.map((n) => n - lineOffset).filter((n) => n >= 1 && n <= codeLineCount);
  if (mapped.length === 0) return null;
  return isPython(language) ? mapped[mapped.length - 1]! : mapped[0]!;
}

export function firstErrorLine(message: string): string {
  const lines = message
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const telling = [...lines].reverse().find((l) => /(Error|Exception|error:|panic:)/.test(l));
  return (telling ?? lines[lines.length - 1] ?? '').slice(0, 200);
}

/**
 * A plain arithmetic relationship between a wrong answer and its input, when
 * one holds. Every sentence returned is checkable from the case alone.
 */
export function relation(signatureId: string, kase: ExecCase): string | null {
  const actual = (kase.actual ?? '').trim();
  if (actual === '') return 'Your code printed nothing for this input.';
  if (!signatureId.startsWith('fn:ints')) return null;
  const list = numbersOn(argLines(kase.stdin)[0] ?? '');
  const value = Number(actual);
  if (!list || list.length === 0 || !Number.isFinite(value)) return null;
  const expected = kase.expected === null ? null : Number(kase.expected.trim());

  if (list.length > 1 && value === list[list.length - 1] && expected !== value) {
    return `Your answer, ${actual}, is exactly the last number in the list.`;
  }
  if (list.length > 1 && value === list[0] && expected !== value) {
    return `Your answer, ${actual}, is exactly the first number in the list.`;
  }
  if (expected !== null && Number.isFinite(expected)) {
    if (value === expected + 1) return `Your answer is one more than the expected ${expected}.`;
    if (value === expected - 1) return `Your answer is one less than the expected ${expected}.`;
  }
  if (value === list.length && expected !== value) {
    return `Your answer, ${actual}, matches how many numbers are in the list.`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// The rules
// ---------------------------------------------------------------------------

const make = (
  id: DiagnosisId,
  confidence: Confidence,
  extra: Partial<Omit<Diagnosis, 'id' | 'confidence'>> = {},
): Diagnosis => ({
  id,
  confidence,
  blocking: true,
  line: null,
  lineText: null,
  kase: null,
  data: {},
  ...extra,
});

const at = (line: SrcLine | undefined | null) =>
  line ? { line: line.n, lineText: line.text.trim() } : {};

const SYNTAX =
  /SyntaxError|IndentationError|TabError|Unexpected token|Unexpected identifier|Unexpected end of input|missing \) after|expected ';'|';' expected|expected '\)'|expected declaration|syntax error|ERR_INVALID_TYPESCRIPT_SYNTAX|class, interface, enum, or record expected|illegal start of|unexpected newline|non-declaration statement/i;
const NAME =
  /NameError: name '(\w+)'|ReferenceError: (\w+) is not defined|symbol:\s*variable (\w+)|'(\w+)' was not declared|undefined: (\w+)|Cannot find name '(\w+)'/;
const INDEX =
  /IndexError|index out of range|out of bounds|OutOfBounds|std::out_of_range|Cannot read propert(?:y|ies) of undefined|RangeError/;

export function diagnose(input: DiagnoseInput): Diagnosis[] {
  const { language, code, evidence } = input;
  const lines = sourceLines(code, language);
  const blocks = loops(lines, language);
  const out: Diagnosis[] = [];

  // --- not started -------------------------------------------------------------
  if (
    code.trim() === '' ||
    (input.starterCode !== null && normalise(code) === normalise(input.starterCode))
  ) {
    return [make('not_started', 'confirmed')];
  }

  const ranCases = evidence.ran ? evidence.cases : [];
  const hidden = evidence.hiddenFailure;
  const allCases = hidden ? [...ranCases, hidden] : ranCases;
  const failing = allCases.filter((c) => !c.passed);

  // --- execution-confirmed problems ---------------------------------------------
  const compileText = evidence.ran ? evidence.compileError : null;
  const errorText =
    compileText ?? failing.map((c) => c.stderr ?? '').find((s) => s.trim() !== '') ?? null;

  if (errorText && SYNTAX.test(errorText)) {
    const line = mapErrorLine(errorText, language, input.lineOffset, lines.length);
    return [
      make('syntax_error', 'confirmed', {
        ...at(line ? lines[line - 1] : null),
        data: { message: firstErrorLine(errorText) },
      }),
    ];
  }

  const name = errorText ? NAME.exec(errorText) : null;
  if (errorText && name) {
    const missing = name.slice(1).find(Boolean) ?? '';
    const line = mapErrorLine(errorText, language, input.lineOffset, lines.length);
    const fallback = lines.find((l) => new RegExp(`\\b${escapeRegex(missing)}\\b`).test(l.code));
    out.push(
      make('name_error', 'confirmed', {
        ...at(line ? lines[line - 1] : fallback),
        kase: failing.find((c) => (c.stderr ?? '').includes(missing)) ?? null,
        data: { name: missing, message: firstErrorLine(errorText) },
      }),
    );
  }

  const slow = failing.find((c) => /Time Limit/i.test(c.status));
  if (slow) {
    const whileLoop = blocks.find((b) => /\bwhile\b|^\s*for\s*\{/.test(b.header.code));
    out.push(make('timeout', 'confirmed', { ...at(whileLoop?.header ?? blocks[0]?.header), kase: slow }));
  }

  const crash = failing.find((c) => INDEX.test(c.stderr ?? ''));
  if (crash) {
    const line = mapErrorLine(crash.stderr ?? '', language, input.lineOffset, lines.length);
    out.push(
      make('index_crash', 'confirmed', {
        ...at(line ? lines[line - 1] : lines.find((l) => /\w\s*\[[^\]]+\]/.test(l.code))),
        kase: crash,
        data: { message: firstErrorLine(crash.stderr ?? '') },
      }),
    );
  }

  // --- returning versus printing ---------------------------------------------------
  const hasPrint = PRINT[language].test(code);
  const hasReturn = returnsValue(code, language);
  const missingToken = MISSING_VALUE[language];
  const noneCase = failing.find((c) => {
    const outLines = (c.actual ?? '').trim().split('\n');
    return missingToken !== '' && outLines[outLines.length - 1]?.trim() === missingToken;
  });
  const printLine = lines.find((l) => PRINT[language].test(l.code));

  if (noneCase && hasPrint && !hasReturn) {
    out.push(make('print_not_return', 'confirmed', { ...at(printLine), kase: noneCase }));
  } else if (noneCase && !(hasReturn && (argLines(noneCase.stdin)[0] ?? '') === '')) {
    // With a return present and empty input, the missing value almost always
    // comes from reading an item that is not there; empty_input says that
    // accurately, and "no return" would not.
    out.push(
      make('missing_return', hasReturn ? 'likely' : 'confirmed', {
        kase: noneCase,
        data: { someReturn: hasReturn ? 'yes' : 'no' },
      }),
    );
  } else if (hasPrint && !hasReturn) {
    out.push(make('print_not_return', 'possible', { ...at(printLine) }));
  }

  const extraLines = failing.find(
    (c) =>
      c.expected !== null &&
      (c.actual ?? '').trim().split('\n').length > c.expected.trim().split('\n').length,
  );
  if (extraLines && hasPrint && hasReturn) {
    out.push(make('stray_print', 'confirmed', { ...at(printLine), kase: extraLines }));
  }

  // --- empty input -------------------------------------------------------------------
  const params = parameterNames(code, language);
  const emptyFail = failing.find((c) => (argLines(c.stdin)[0] ?? '') === '');
  if (emptyFail) {
    const first = params[0];
    const risky = lines.find(
      (l) =>
        (first !== undefined &&
          new RegExp(`\\b${escapeRegex(first)}\\s*\\[\\s*0\\s*\\]`).test(l.code)) ||
        /\b(max|min)\s*\(|Math\.(max|min)\s*\(/.test(l.code),
    );
    out.push(make('empty_input', 'confirmed', { ...at(risky), kase: emptyFail }));
  }

  // --- patterns inside loops ------------------------------------------------------------
  for (const block of blocks) {
    // return_in_loop: an unconditional return, or `else: return`, at the loop's
    // own level ends the function on the first pass.
    const topReturn = block.topLevel.find((l) =>
      /^\s*[{}\s]*return\b/.test(l.code.replace(/^.*\)\s*(?=return)/, '')) &&
      !/\bif\b/.test(l.code),
    );
    let elseReturn: SrcLine | undefined;
    block.body.forEach((l, i) => {
      if (elseReturn) return;
      if (isPython(language)) {
        if (/^\s*else\s*:\s*return\b/.test(l.code)) elseReturn = l;
        else if (/^\s*else\s*:\s*$/.test(l.code) && /^\s*return\b/.test(block.body[i + 1]?.code ?? '')) {
          elseReturn = block.body[i + 1];
        }
      } else if (/\belse\b\s*\{?\s*return\b/.test(l.code)) {
        elseReturn = l;
      } else if (/\belse\b\s*\{?\s*$/.test(l.code) && /^\s*return\b/.test(block.body[i + 1]?.code ?? '')) {
        elseReturn = block.body[i + 1];
      }
    });
    const earlyReturn = elseReturn ?? topReturn;
    if (earlyReturn) {
      out.push(
        make('return_in_loop', failing.length > 0 ? 'likely' : 'possible', {
          ...at(earlyReturn),
          kase: failing[0] ?? null,
          data: { form: elseReturn ? 'else' : 'unconditional' },
        }),
      );
    }

    // accumulator_reset: a variable set to zero inside the loop and also added
    // to inside it, so it forgets everything from earlier passes.
    for (const line of block.topLevel) {
      const assign =
        /^[\s{]*(?:let|var|int|long|double|auto|float)?\s*([A-Za-z_]\w*)\s*:?=\s*0(?:\.0)?\s*;?\s*$/.exec(
          line.code,
        );
      if (!assign) continue;
      const variable = escapeRegex(assign[1]!);
      const grows = new RegExp(
        `\\b${variable}\\s*(\\+=|\\+\\+|\\*=|=\\s*${variable}\\s*[+*])|\\+\\+\\s*${variable}\\b`,
      );
      if (block.body.some((l) => l.n !== line.n && grows.test(l.code))) {
        out.push(
          make('accumulator_reset', failing.length > 0 ? 'likely' : 'possible', {
            ...at(line),
            kase: failing[0] ?? null,
            data: { variable: assign[1]! },
          }),
        );
        break;
      }
    }
  }

  // running_best_start: a running maximum or minimum that starts at zero.
  const loopLines = new Set(blocks.flatMap((b) => b.body.map((l) => l.n)));
  for (const line of lines) {
    if (loopLines.has(line.n)) continue;
    const assign = /^\s*(?:let|var|int|long|auto)?\s*([A-Za-z_]\w*)\s*:?=\s*0\s*;?\s*$/.exec(line.code);
    if (!assign) continue;
    const variable = assign[1]!;
    const v = escapeRegex(variable);
    const greater = new RegExp(`\\w\\s*>=?\\s*${v}\\b|\\b${v}\\s*<=?\\s*\\w|max\\(\\s*${v}\\b|max\\([^)]*,\\s*${v}\\s*\\)`);
    const smaller = new RegExp(`\\w\\s*<=?\\s*${v}\\b|\\b${v}\\s*>=?\\s*\\w|min\\(\\s*${v}\\b|min\\([^)]*,\\s*${v}\\s*\\)`);
    const grows = new RegExp(`\\b${v}\\s*(\\+=|\\+\\+|-=|--)`);
    if (grows.test(code)) continue;
    const direction = greater.test(code) ? 'max' : smaller.test(code) ? 'min' : null;
    if (!direction) continue;
    const telling = failing.find((c) => {
      const values = numbersOn(argLines(c.stdin)[0] ?? '');
      return (
        values !== null &&
        values.length > 0 &&
        values.every((n) => (direction === 'max' ? n < 0 : n > 0))
      );
    });
    if (telling || input.patternTags.includes('running-best')) {
      out.push(
        make('running_best_start', telling ? 'likely' : 'possible', {
          ...at(line),
          kase: telling ?? null,
          data: { variable, direction },
        }),
      );
    }
    break;
  }

  // assignment_in_condition: `if (x = y)` stores instead of compares.
  if (!isPython(language)) {
    for (const line of lines) {
      let condition: string | null = null;
      if (language === 'GO') condition = /^\s*if\s+([^{]*)\{/.exec(line.code)?.[1] ?? null;
      else if (/\b(if|while)\s*\(/.test(line.code)) condition = afterHeader(line.code)?.condition ?? null;
      if (condition && /(^|[^=!<>+\-*/%&|^:])=(?![=>])/.test(condition) && !/:=/.test(condition)) {
        out.push(make('assignment_in_condition', failing.length > 0 ? 'likely' : 'possible', { ...at(line) }));
        break;
      }
    }
  }

  // strictness: the statement says "strictly", the code includes equality.
  const strictGreater = /strictly\s+(greater|larger|bigger|more)/i.test(input.promptMarkdown);
  const strictLess = /strictly\s+(less|smaller|fewer)/i.test(input.promptMarkdown);
  const inclusive = lines.find(
    (l) => (strictGreater && />=/.test(l.code)) || (strictLess && /<=/.test(l.code)),
  );
  if (inclusive) {
    const telling = failing.find((c) => {
      const [listLine = '', limitLine = ''] = argLines(c.stdin);
      const values = numbersOn(listLine);
      const limit = Number(limitLine);
      return values !== null && limitLine !== '' && Number.isFinite(limit) && values.includes(limit);
    });
    out.push(
      make('strictness', telling ? 'likely' : 'possible', {
        ...at(inclusive),
        kase: telling ?? null,
        data: { operator: strictGreater ? '>=' : '<=', meant: strictGreater ? '>' : '<' },
      }),
    );
  }

  // index_bound: a loop that runs one position past the end.
  const bound = lines.find((l) =>
    isPython(language)
      ? /range\(\s*(?:[^,()]+,\s*)?len\(\s*\w+\s*\)\s*\+\s*1\s*\)/.test(l.code)
      : /<=\s*(?:\w+\s*\.\s*(?:length\b|length\s*\(\s*\)|size\s*\(\s*\)|Length\b)|len\(\s*\w+\s*\))(?!\s*-)/.test(l.code),
  );
  if (bound) {
    out.push(
      make('index_bound', crash || failing.length > 0 ? 'likely' : 'possible', {
        ...at(bound),
        kase: crash ?? failing[0] ?? null,
      }),
    );
  }

  // unguarded_index: `text[position]` where position is a parameter and the
  // code never compares it with anything.
  if (params.length >= 2 && /,int->/.test(input.signatureId)) {
    const [collection, position] = params as [string, string];
    const c = escapeRegex(collection);
    const p = escapeRegex(position);
    const access = lines.find((l) =>
      new RegExp(`\\b${c}\\s*\\[\\s*${p}\\s*\\]|\\b${c}\\s*\\.\\s*(charAt|at)\\s*\\(\\s*${p}\\s*\\)`).test(l.code),
    );
    const compared = new RegExp(`\\b${p}\\s*(<|<=|>|>=)|(<|<=|>|>=)\\s*${p}\\b`).test(code);
    const guarded =
      /\btry\b|\bexcept\b|\bcatch\b|\?\?|\|\|\s*['"]/.test(code) ||
      (isPython(language) && new RegExp(`\\b${c}\\s*\\[\\s*${p}\\s*:`).test(code));
    if (access && !compared && !guarded) {
      const telling = failing.find((kase) => {
        const [text = '', index = ''] = kase.stdin.split('\n');
        const n = Number(index.trim());
        const size = input.signatureId.startsWith('fn:ints')
          ? (numbersOn(text)?.length ?? 0)
          : text.length;
        return index.trim() !== '' && Number.isInteger(n) && n >= size;
      });
      out.push(
        make('unguarded_index', telling ? (crash ? 'confirmed' : 'likely') : 'possible', {
          ...at(access),
          kase: telling ?? null,
          data: { collection, position },
        }),
      );
    }
  }

  // --- anything still failing -------------------------------------------------------
  const wrong = failing.find((c) => !c.hidden) ?? failing[0] ?? null;
  if (wrong) out.push(make('wrong_output', 'confirmed', { kase: wrong }));

  // --- optional simplification (never blocking) ----------------------------------------
  if (
    input.patternTags.includes('indexing') &&
    blocks.length > 0 &&
    /->string$/.test(input.signatureId) &&
    /,int->|string->string/.test(input.signatureId) &&
    !/reverse/.test(input.promptMarkdown.toLowerCase())
  ) {
    out.push(make('unnecessary_loop', 'possible', { ...at(blocks[0]?.header), blocking: false }));
  }

  const examplesPass = evidence.ran && ranCases.length > 0 && ranCases.every((c) => c.passed);
  if (examplesPass && !hidden) {
    // Correct code is correct. Pattern-only findings stay available as optional
    // notes and stop being treated as the problem.
    for (const d of out) d.blocking = false;
    out.push(make('passing', 'confirmed', { blocking: false }));
  } else if (examplesPass && hidden) {
    for (const d of out) if (d.kase === null && d.confidence === 'likely') d.confidence = 'possible';
  }

  return prioritise(out);
}

const PRIORITY: DiagnosisId[] = [
  'not_started',
  'syntax_error',
  'name_error',
  'timeout',
  'unguarded_index',
  'index_crash',
  'print_not_return',
  'missing_return',
  'stray_print',
  'return_in_loop',
  'accumulator_reset',
  'running_best_start',
  'empty_input',
  'assignment_in_condition',
  'strictness',
  'index_bound',
  'wrong_output',
  'unnecessary_loop',
  'passing',
];

function prioritise(found: Diagnosis[]): Diagnosis[] {
  const seen = new Set<DiagnosisId>();
  const unique = found.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });
  return unique.sort((a, b) => {
    if (a.blocking !== b.blocking) return a.blocking ? -1 : 1;
    // A bare pattern never outranks something execution actually showed.
    const aBare = a.confidence === 'possible' ? 1 : 0;
    const bBare = b.confidence === 'possible' ? 1 : 0;
    if (aBare !== bBare) return aBare - bBare;
    return PRIORITY.indexOf(a.id) - PRIORITY.indexOf(b.id);
  });
}
