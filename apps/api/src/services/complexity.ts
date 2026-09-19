/**
 * Complexity feedback for a solved problem.
 *
 * Two readings, kept apart on purpose:
 *
 * - **The standard** comes from the problem's editorial, which states the
 *   complexity of the intended solution in prose. It is authored, so it is the
 *   reference, and when it cannot be read the feedback says so rather than
 *   guessing.
 * - **Yours** is a static estimate from the submitted source: loop nesting,
 *   halving loops, sorts, recursion, and containers that grow with the input.
 *   Deterministic and instant — no model call, nothing leaves the machine — and
 *   therefore fallible. It is always presented as an estimate with the reasons
 *   it rests on, so a learner can check the reasoning rather than trust a
 *   verdict.
 *
 * Pure: no I/O. Calibrated against the corpus reference solutions in
 * complexity.test.ts, which measures how often the estimator agrees with the
 * editorial on known-good code.
 */

export type ComplexityLanguage = 'JAVASCRIPT' | 'TYPESCRIPT' | 'PYTHON' | 'JAVA' | 'CPP' | 'GO';

/** A growth rate as n^power · (log n)^logPower, or exponential. */
export interface Growth {
  power: number;
  logPower: number;
  exponential?: boolean;
}

export interface ComplexityEstimate {
  time: string;
  space: string;
  timeGrowth: Growth;
  spaceGrowth: Growth;
  /** Low when the code leans on recursion, callbacks or shapes the estimator reads poorly. */
  confidence: 'medium' | 'low';
  /** Plain-language reasons, so the learner can check the reading. */
  reasons: string[];
}

export interface StatedComplexity {
  /** As written in the editorial, e.g. "O(N log N)". Null when not stated. */
  time: string | null;
  space: string | null;
  /** Comparable form, or null when the expression is not a simple single-variable growth. */
  timeGrowth: Growth | null;
  spaceGrowth: Growth | null;
}

export type Verdict = 'matches' | 'slower' | 'faster' | 'unknown';

// ---------------------------------------------------------------------------
// Growth arithmetic
// ---------------------------------------------------------------------------

export const CONSTANT: Growth = { power: 0, logPower: 0 };

/** Order two growth rates. Negative when a grows slower than b. */
export function compareGrowth(a: Growth, b: Growth): number {
  if (!!a.exponential !== !!b.exponential) return a.exponential ? 1 : -1;
  if (a.power !== b.power) return a.power - b.power;
  return a.logPower - b.logPower;
}

const maxGrowth = (a: Growth, b: Growth): Growth => (compareGrowth(a, b) >= 0 ? a : b);

export function formatGrowth(g: Growth): string {
  if (g.exponential) return 'O(2^n)';
  const parts: string[] = [];
  if (g.power === 1) parts.push('n');
  else if (g.power > 1) parts.push(`n^${g.power}`);
  if (g.logPower === 1) parts.push('log n');
  else if (g.logPower > 1) parts.push(`log^${g.logPower} n`);
  return parts.length === 0 ? 'O(1)' : `O(${parts.join(' ')})`;
}

/**
 * Read a big-O expression into a comparable growth, when it is simple enough
 * to compare honestly: one size variable, powers and logs of it. Products of
 * different sizes ("O(N * M)", "O(S * A)") return null — those cannot be
 * compared with a single-variable estimate without knowing the input shape.
 */
export function parseBigO(expression: string): Growth | null {
  const inner = expression
    .replace(/^O\(/i, '')
    .replace(/\)$/, '')
    .replace(/\\cdot|\\times|·|×/g, '*')
    .replace(/\\log/g, 'log')
    .replace(/[\s`{}]/g, '');
  if (!inner) return null;
  if (inner === '1') return CONSTANT;
  if (/2\^|!/.test(inner)) return { power: 0, logPower: 0, exponential: true };

  // "log" is split out first so "NlogN" reads as n · log · n, not one name.
  const lower = inner.toLowerCase();
  const vars = new Set(
    lower
      .split(/log(?:_?2)?|sqrt/)
      .flatMap((part) => part.match(/[a-z]+/g) ?? []),
  );
  if (vars.size !== 1 || /sqrt/.test(lower)) return null;
  const v = [...vars][0]!;

  let rest = lower.replace(/\*/g, '');
  let power = 0;
  let logPower = 0;
  const logRe = new RegExp(`log(?:_?2)?\\(?${v}\\)?(?:\\^(\\d))?`);
  for (let m = logRe.exec(rest); m; m = logRe.exec(rest)) {
    logPower += m[1] ? Number(m[1]) : 1;
    rest = rest.replace(m[0], '');
  }
  const powRe = new RegExp(`${v}(?:\\^(\\d)|(²)|(³))?`);
  for (let m = powRe.exec(rest); m; m = powRe.exec(rest)) {
    power += m[1] ? Number(m[1]) : m[2] ? 2 : m[3] ? 3 : 1;
    rest = rest.replace(m[0], '');
  }
  if (rest.replace(/[()]/g, '').length > 0) return null;
  return { power, logPower };
}

export function verdict(yours: Growth, standard: Growth | null): Verdict {
  if (!standard) return 'unknown';
  const c = compareGrowth(yours, standard);
  return c === 0 ? 'matches' : c > 0 ? 'slower' : 'faster';
}

// ---------------------------------------------------------------------------
// The standard, from the editorial
// ---------------------------------------------------------------------------

/** Every O(...) in the text, with balanced parentheses, and where it sits. */
function bigOs(text: string): Array<{ expr: string; start: number; end: number }> {
  const found: Array<{ expr: string; start: number; end: number }> = [];
  const re = /(?<![A-Za-z])O\(/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    let depth = 0;
    let i = m.index + 1;
    for (; i < text.length; i++) {
      if (text[i] === '(') depth++;
      else if (text[i] === ')' && --depth === 0) break;
    }
    if (depth !== 0) continue;
    found.push({ expr: text.slice(m.index, i + 1), start: m.index, end: i + 1 });
    re.lastIndex = i + 1;
  }
  return found;
}

/**
 * The complexity the editorial states for its solution.
 *
 * Editorials discuss brute force before the real answer, so the last mention
 * wins and mentions introduced as the naive approach are skipped. A mention is
 * attributed to time or space by the word right after it ("O(n) time") first,
 * then by the nearest keyword before it in the same sentence.
 */
export function statedComplexity(editorial: string | null | undefined): StatedComplexity {
  const none: StatedComplexity = { time: null, space: null, timeGrowth: null, spaceGrowth: null };
  if (!editorial) return none;
  const text = editorial.replace(/\$/g, '');
  let time: string | null = null;
  let space: string | null = null;

  let previousEnd = 0;
  for (const { expr, start, end } of bigOs(text)) {
    const after = text.slice(end, end + 30).toLowerCase();
    // Context runs back to the sentence start or the previous O(...), so in
    // "Time complexity is O(N), as lookups are O(1)" the O(1) inherits
    // nothing: it explains the O(N), it is not a second answer.
    const sentenceStart = Math.max(
      text.lastIndexOf('. ', start - 1),
      text.lastIndexOf('\n', start - 1),
      start - 120,
      previousEnd,
      0,
    );
    previousEnd = end;
    const before = text.slice(sentenceStart, start).toLowerCase();
    if (/brute|naive|naïve|instead of|rather than|would be|too slow|would take/.test(before)) continue;

    let kind: 'time' | 'space' | null = null;
    if (/^[\s`*)]*(extra |auxiliary |additional )?(space|memory)/.test(after)) kind = 'space';
    else if (/^[\s`*)]*(time|runtime|operations)/.test(after)) kind = 'time';
    else {
      const t = Math.max(before.lastIndexOf('time'), before.lastIndexOf('runs in'), before.lastIndexOf('runtime'));
      const s = Math.max(before.lastIndexOf('space'), before.lastIndexOf('memory'));
      if (t >= 0 || s >= 0) kind = s > t ? 'space' : 'time';
    }
    if (kind === 'time') time = expr;
    else if (kind === 'space') space = expr;
  }

  return {
    time,
    space,
    timeGrowth: time ? parseBigO(time) : null,
    spaceGrowth: space ? parseBigO(space) : null,
  };
}

// ---------------------------------------------------------------------------
// Yours, from the source
// ---------------------------------------------------------------------------

/** Remove comments and string contents, keeping line structure. */
export function stripNoise(source: string, language: ComplexityLanguage): string {
  const hash = language === 'PYTHON';
  let out = '';
  let i = 0;
  while (i < source.length) {
    const c = source[i]!;
    const next = source[i + 1];
    if (hash && c === '#') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (!hash && c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (!hash && c === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') out += '\n';
        i++;
      }
      i += 2;
      continue;
    }
    // C++/Java/Go char literals and every language's strings: keep a stub.
    if (c === '"' || c === "'" || c === '`') {
      const triple = hash && source.startsWith(c.repeat(3), i);
      const close = triple ? c.repeat(3) : c;
      out += '""';
      i += close.length;
      while (i < source.length && !source.startsWith(close, i)) {
        if (source[i] === '\\') i++;
        else if (source[i] === '\n') {
          out += '\n';
          if (!triple && c !== '`') break;
        }
        i++;
      }
      i += close.length;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

const SORT =
  /\bsorted\(|\.sort\(|(?<![\w.])sort\(|Arrays\.sort|Collections\.sort|sort\.(Ints|Strings|Slice|SliceStable|Sort|Float64s)\(|slices\.Sort/;
/** Loops that shrink their range geometrically: binary search, digit loops, doubling. */
const HALVING =
  /\bmid\b|>>=?\s*1\b|\/\/=?\s*(2|10)\b|\/=\s*(2|10)\b|\*=\s*2\b|<<=\s*1\b|=\s*\w+\s*\/\s*(2|10)\b/;
const LINEAR_INLINE_JS =
  /\.(includes|indexOf|lastIndexOf|slice|concat|join|reverse|splice|shift|unshift|split)\(|\[\.\.\./;
const LINEAR_INLINE_PY =
  /\b(if|elif|while|and|or|not)\b[^:]*\bin\s+\w+\s*(\[|:|\)|$)|\.(index|count|remove|insert)\(|\.pop\(0\)|\bsum\(|\bmax\(\s*\w+\s*\)|\bmin\(\s*\w+\s*\)|\[::-1\]/;
const LINEAR_INLINE_JAVA = /\.(contains|indexOf|remove)\((?!.*Set)|\.substring\(|String\.join|\.toCharArray\(/;
const CALLBACK = /\.(forEach|map|filter|reduce|reduceRight|some|every|find|findIndex|flatMap)\(/g;

function loopHeader(line: string, language: ComplexityLanguage): boolean {
  if (language === 'PYTHON') return /^\s*(for|while)\b/.test(line);
  if (language === 'GO') return /^\s*(}\s*else\s*)?for\b/.test(line);
  return /(^|[^\w.])(for|while)\s*\(/.test(line) || /^\s*do\s*\{?\s*$/.test(line);
}

/** A loop whose bound is a literal (range(26), i < 4): constant work, not n. */
function constantBound(line: string): boolean {
  return (
    /range\(\s*-?\d+\s*(,\s*-?\d+\s*)?(,\s*-?\d+\s*)?\)/.test(line) ||
    /;\s*\w+\s*[<>]=?\s*\d+\s*;/.test(line) ||
    /\bin\s*[([]\s*[-\d"'\s,()[\]]+[)\]]\s*:/.test(line) ||
    /:\s*\[\s*\[?-?\d/.test(line)
  );
}

/** A condition-only loop: `while`, or Go's `for cond {`. */
function whileLike(line: string, language: ComplexityLanguage): boolean {
  if (/\bwhile\b/.test(line)) return true;
  // Go has no while: `for cond {` is one, `for i := 0; …` and `for … range` are not.
  return language === 'GO' && /^\s*for\b/.test(line) && !/;|\brange\b/.test(line);
}

function indentOf(line: string): number {
  return /^[ \t]*/.exec(line)![0].replace(/\t/g, '    ').length;
}

interface Scope {
  indent: number;
  /** n-sized loops count toward power, halving loops toward logPower. */
  kind: 'n' | 'log' | 'const';
  /** The element variable of a for-each loop (`for x in xs` → x), if any. */
  element: string | null;
  /** Line index of the header. */
  line: number;
}

/** The item variable of a for-each header, in each language's syntax. */
function elementOf(line: string): string | null {
  const m =
    /\bfor\s+(\w+)\s+in\b/.exec(line) ??
    /\bfor\s+\w+\s*,\s*(\w+)\s+in\s+enumerate\(/.exec(line) ??
    /\bfor\s*\(\s*(?:const|let|var)\s+(\w+)\s+of\b/.exec(line) ??
    /\bfor\s*\(\s*[\w<>[\],:&*\s]+?\s+&?(\w+)\s*:(?!:)/.exec(line) ??
    /\bfor\s+\w+\s*,\s*(\w+)\s*:=\s*range\b/.exec(line);
  return m?.[1] ?? null;
}

/** Does this inner header iterate over the outer loop's current item? */
function overElement(line: string, element: string | null): boolean {
  if (!element) return false;
  const e = element.replace(/\$/g, '\\$');
  return new RegExp(
    `\\bin\\s+${e}\\b|\\b${e}\\s*\\.\\s*(length|size\\(\\)|len\\(\\))|len\\(\\s*${e}\\s*\\)|range\\s+${e}\\b|:\\s*${e}\\s*\\)|\\bof\\s+${e}\\b|${e}\\.toCharArray\\(\\)`,
  ).test(line);
}

/**
 * A `while` nested in a loop that only advances a pointer declared outside
 * the outer loop — the sliding-window and monotonic-stack shape. Each pointer
 * moves at most n times in total, so the pair is linear, not quadratic.
 */
function amortised(
  lines: string[],
  header: number,
  indent: number,
  outer: Scope,
  language: ComplexityLanguage,
): boolean {
  if (!whileLike(lines[header]!, language)) return false;
  const body = bodyOf(lines, header, indent);
  const moved = new Set<string>();
  for (const m of body.matchAll(/\b(\w+)\s*(\+\+|--|\+=|-=)|(\+\+|--)(\w+)\b/g)) moved.add((m[1] ?? m[4])!);
  const pops =
    /\.(pop|popleft|poll|pollFirst|pollLast|removeLast|removeFirst|pop_back|pop_front)\(|\.shift\(\)|=\s*\w+\[:len\(\w+\)-1\]/.test(
      body,
    );
  if (moved.size === 0 && !pops) return false;
  // The pointer must not be reset inside the outer loop before this while.
  const outerBody = lines.slice(outer.line + 1, header).join('\n');
  for (const v of moved) {
    if (new RegExp(`\\b${v}\\s*=(?!=)`).test(outerBody)) return false;
  }
  return true;
}

/**
 * Estimate time and space from source.
 *
 * Nesting is read from indentation, which every formatter and nearly every
 * learner already produces. Each line's cost is the product of the loops
 * around it, plus anything linear it does inline (a sort, an `in list`, an
 * `.includes`). The result is the most expensive line.
 */
export function estimateComplexity(source: string, language: ComplexityLanguage): ComplexityEstimate {
  const code = stripNoise(source, language);
  const lines = code.split('\n');
  const hashed = hashedNames(code);
  const reasons = new Set<string>();
  let confidence: 'medium' | 'low' = 'medium';
  let time: Growth = CONSTANT;
  let space: Growth = CONSTANT;

  const scopes: Scope[] = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]!;
    if (!line.trim()) continue;
    const indent = indentOf(line);
    // Leaving a loop body: any line at or left of the header's indentation.
    while (scopes.length > 0 && indent <= scopes.at(-1)!.indent) scopes.pop();

    const depthN = scopes.filter((s) => s.kind === 'n').length;
    const depthLog = scopes.filter((s) => s.kind === 'log').length;
    const header = loopHeader(line, language);
    let here: Growth = { power: depthN, logPower: depthLog };

    if (SORT.test(line)) {
      here = { power: depthN + 1, logPower: depthLog + 1 };
      reasons.add('sorts (n log n)');
    } else if (
      !header &&
      ((language === 'PYTHON' && LINEAR_INLINE_PY.test(line) && !hashedLookup(line, hashed)) ||
        ((language === 'JAVASCRIPT' || language === 'TYPESCRIPT') && LINEAR_INLINE_JS.test(line)) ||
        (language === 'JAVA' && LINEAR_INLINE_JAVA.test(line)))
    ) {
      here = { power: depthN + 1, logPower: depthLog };
      reasons.add(depthN > 0 ? 'does a linear-time search, slice or copy inside a loop' : 'does a linear-time pass (search, slice, copy or sum)');
    }

    // Comprehensions and one-line callbacks are loops on this line only.
    const inlineLoops =
      language === 'PYTHON'
        ? Math.max(0, (line.match(/\bfor\b[^:]*?\bin\b/g) ?? []).length - (header ? 1 : 0))
        : 0;
    if (inlineLoops > 0 && !constantBound(line)) {
      // sum(x for x in xs) is one pass, so the comprehension replaces the
      // linear call rather than multiplying it.
      here = maxGrowth(here, { power: depthN + inlineLoops, logPower: depthLog });
      reasons.add('uses a comprehension over the input');
    }
    const callbacks = (line.match(CALLBACK) ?? []).length;
    const multiLineCallback = callbacks > 0 && /(\{|=>)\s*$/.test(line.trim());
    if (callbacks > 0) {
      // Chained calls on one line run one after another, so they do not multiply.
      here = maxGrowth(here, { power: depthN + 1, logPower: depthLog });
      reasons.add('iterates with array methods (map, filter, forEach…)');
    }
    time = maxGrowth(time, here);

    // Space: containers that grow with the input.
    const alloc = signatureLine(line, language) ? null : allocation(line, language);
    if (alloc === 'grid') {
      space = maxGrowth(space, { power: 2, logPower: 0 });
      reasons.add('builds a 2-D table');
    } else if (alloc === 'linear') {
      space = maxGrowth(space, { power: 1, logPower: 0 });
      reasons.add('builds a container that can grow with the input');
    }

    // Open a scope for a loop header or a multi-line callback.
    if (header || multiLineCallback) {
      let kind: Scope['kind'] = 'n';
      const enclosing = scopes.filter((s) => s.kind === 'n').at(-1);
      if (header && constantBound(line)) kind = 'const';
      else if (header && enclosing && overElement(line, enclosing.element)) {
        // for word in words: for ch in word — linear in the total size.
        kind = 'const';
        reasons.add('loops over each item’s own contents (linear in the total input size)');
      } else if (header && enclosing && amortised(lines, idx, indent, enclosing, language)) {
        kind = 'const';
        reasons.add('moves a pointer that never resets (amortised, linear overall)');
      }
      else if (header && (HALVING.test(line) || (whileLike(line, language) && HALVING.test(bodyOf(lines, idx, indent))))) {
        kind = 'log';
        reasons.add('shrinks the range geometrically each step (log n)');
      }
      if (kind === 'n' && header) {
        reasons.add(depthN >= 1 ? 'nests a loop inside another loop' : 'loops over the input');
        // The loop itself runs n times even when its body sits on this line.
        time = maxGrowth(time, { power: depthN + 1, logPower: depthLog });
      } else if (kind === 'log') {
        time = maxGrowth(time, { power: depthN, logPower: depthLog + 1 });
      }
      scopes.push({ indent, kind, element: elementOf(line), line: idx });
    }
  }

  const recursion = recursionOf(code, language);
  if (recursion.selfCalls > 0) {
    confidence = 'low';
    if (recursion.memoised) {
      reasons.add('recurses with memoisation, so cost follows the number of distinct states');
      time = maxGrowth(time, { power: 1, logPower: 0 });
      space = maxGrowth(space, { power: 1, logPower: 0 });
    } else if (recursion.halves) {
      reasons.add(recursion.selfCalls >= 2 ? 'divides and conquers (n log n)' : 'recurses on half the range (log n)');
      time = maxGrowth(time, recursion.selfCalls >= 2 ? { power: 1, logPower: 1 } : { power: 0, logPower: 1 });
      space = maxGrowth(space, { power: 0, logPower: 1 });
    } else if (recursion.selfCalls >= 2 && !recursion.tree) {
      reasons.add('recurses into two or more branches without memoisation (exponential)');
      time = { power: 0, logPower: 0, exponential: true };
      space = maxGrowth(space, { power: 1, logPower: 0 });
    } else {
      reasons.add(
        recursion.tree
          ? 'visits each node once recursively (the call stack grows with the depth)'
          : 'recurses once per step (the call stack uses O(n) space)',
      );
      time = maxGrowth(time, { power: 1, logPower: 0 });
      space = maxGrowth(space, { power: 1, logPower: 0 });
    }
  }
  if (reasons.size === 0) reasons.add('no loops over the input and no growing containers');

  return {
    time: formatGrowth(time),
    space: formatGrowth(space),
    timeGrowth: time,
    spaceGrowth: space,
    confidence,
    reasons: [...reasons],
  };
}

/** Python names bound to a dict, set or Counter, where `in` is O(1). */
function hashedNames(code: string): Set<string> {
  const names = new Set<string>();
  for (const m of code.matchAll(/\b(\w+)\s*(?::[^=]+)?=\s*(\{|set\(|dict\(|defaultdict\(|Counter\(|frozenset\()/g)) {
    names.add(m[1]!);
  }
  return names;
}

/** `x in seen` where `seen` is a dict or set: a hash lookup, not a scan. */
function hashedLookup(line: string, hashed: Set<string>): boolean {
  const targets = [...line.matchAll(/\bin\s+(\w+)\b(?!\s*\()/g)].map((m) => m[1]!);
  if (targets.length === 0) return false;
  const scans = /\.(index|count|remove|insert)\(|\.pop\(0\)|\bsum\(|\bmax\(\s*\w+\s*\)|\bmin\(\s*\w+\s*\)|\[::-1\]/.test(line);
  return !scans && targets.every((t) => hashed.has(t));
}

/** A function signature: its parameters are the input, not an allocation. */
function signatureLine(line: string, language: ComplexityLanguage): boolean {
  if (language === 'GO') return /^\s*func\b/.test(line);
  if (language === 'CPP' || language === 'JAVA') {
    return /^\s*(?:(?:public|private|protected|static|final|inline)\s+)*[\w<>[\],:*& ]+\s+[*&]?\w+\s*\([^;]*\)\s*(?:const\s*)?\{?\s*$/.test(line);
  }
  return false;
}

function bodyOf(lines: string[], header: number, indent: number): string {
  const body: string[] = [];
  for (let i = header + 1; i < lines.length; i++) {
    const l = lines[i]!;
    if (!l.trim()) continue;
    if (indentOf(l) <= indent) break;
    body.push(l);
  }
  return body.join('\n');
}

/** Fixed-size containers ([0] * 26, new int[26]) are constant, not linear. */
function allocation(line: string, language: ComplexityLanguage): 'grid' | 'linear' | null {
  const fixed =
    /\[\s*0\s*\]\s*\*\s*\d+\b|new\s+\w+\s*\[\s*\d+\s*\]|make\(\s*\[\]\w+\s*,\s*\d+\s*\)|<[\w\s,]+>\s*\w+\s*\(\s*\d+\s*[,)]|Array\(\s*\d+\s*\)|\[\s*\d+\s*\]\w+\{/;
  const grid =
    /\[\s*\[.*\]\s*\*.*\bfor\b|\[\s*\[.*\bfor\b.*\]\s*for\b|new\s+\w+\s*\[\s*[a-z_][^\]]*\]\s*\[[^\]]+\]|vector<\s*vector<|make\(\s*\[\]\[\]|Array\.from\(\s*\{[^}]*\}\s*,\s*\(\)\s*=>\s*(new Array|Array\(|\[)/i;
  if (grid.test(line)) return 'grid';
  let linear: RegExp;
  switch (language) {
    case 'PYTHON':
      linear =
        /=\s*(\[|\{|set\(|dict\(|list\(|defaultdict\(|Counter\(|deque\(|collections\.|sorted\(|\w+\[::-1\]|\w+\.split\()|\.append\(|\.add\(|\.appendleft\(/;
      break;
    case 'JAVASCRIPT':
    case 'TYPESCRIPT':
      linear = /new\s+(Map|Set|Array)\b|=\s*\[|=\s*\{\s*\}|Array\.from\(|\.split\(|\[\.\.\.|\.push\(|\.(map|filter|slice|concat)\(/;
      break;
    case 'JAVA':
      linear =
        /new\s+(ArrayList|LinkedList|HashMap|HashSet|TreeMap|TreeSet|ArrayDeque|PriorityQueue|StringBuilder|Stack|\w+\s*\[)|\.toCharArray\(|\.split\(/;
      break;
    case 'CPP':
      linear = /\b(vector|unordered_map|unordered_set|map|set|deque|priority_queue|queue|stack|string)\s*<|\bstring\s+\w+\s*(=|;)|\.push_back\(/;
      break;
    case 'GO':
      linear = /\bmake\(|\bappend\(|map\[|\[\]\w+\{/;
      break;
  }
  if (!linear.test(line)) return null;
  if (fixed.test(line) && !/\.(append|push|add|push_back)\(|append\(/.test(line)) return null;
  return 'linear';
}

/**
 * Functions that call themselves, and how.
 *
 * `tree` recognises the common recursive traversal (`node.left`, `node.right`,
 * a neighbour loop): two self-calls there visit each node once rather than
 * branching exponentially.
 */
function recursionOf(code: string, language: ComplexityLanguage) {
  const defs =
    language === 'PYTHON'
      ? [...code.matchAll(/^([ \t]*)def\s+(\w+)\s*\(/gm)]
      : language === 'GO'
        ? [...code.matchAll(/^([ \t]*)(?:func\s+(?:\([^)]*\)\s*)?(\w+)\s*\(|(\w+)\s*:?=\s*func\s*\()/gm)]
        : [
            ...code.matchAll(
              /^([ \t]*)(?:(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function\b|(?:\([^)]*\)|\w+)\s*(?::[^=]+)?=>)|(?:(?:public|private|protected|static|final|inline)\s+)*[\w<>[\],:*& ]+?\s+[*&]?(\w+)\s*\([^;{]*\)\s*(?:const\s*)?\{)/gm,
            ),
          ];
  let selfCalls = 0;
  let halves = false;
  let tree = false;
  const memoised = /lru_cache|@cache\b|\bmemo\b|\bcache\b|\bdp\b|memo\[|memo\.|computeIfAbsent|\bseen\b|\bvisited\b/.test(code);
  for (const d of defs) {
    const name = d[2] ?? d[3] ?? d[4];
    if (!name || /^(if|for|while|switch|return|catch|main|else)$/.test(name)) continue;
    const indent = indentOf(d[1] ?? '');
    const rest = code.slice(d.index! + d[0].length).split('\n');
    const body: string[] = [rest[0] ?? ''];
    for (const l of rest.slice(1)) {
      if (l.trim() && indentOf(l) <= indent) break;
      body.push(l);
    }
    const text = body.join('\n');
    const calls = (text.match(new RegExp(`(?<![\\w.])${name}\\s*\\(`, 'g')) ?? []).length;
    if (calls > selfCalls) {
      selfCalls = calls;
      halves = /\bmid\b|\/\/\s*2|\/\s*2\b|>>\s*1/.test(text);
      tree = /\.(left|right|children|next)\b|\bLeft\b|\bRight\b|\bneighbou?rs?\b|\badj\b|\bgraph\[/.test(text);
    }
  }
  return { selfCalls, memoised, halves, tree };
}

// ---------------------------------------------------------------------------
// The feedback a learner sees
// ---------------------------------------------------------------------------

const LANGUAGE_ORDER: ComplexityLanguage[] = ['PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'JAVA', 'CPP', 'GO'];

const LANGUAGE_NAMES: Record<ComplexityLanguage, string> = {
  JAVASCRIPT: 'JavaScript',
  TYPESCRIPT: 'TypeScript',
  PYTHON: 'Python',
  JAVA: 'Java',
  CPP: 'C++',
  GO: 'Go',
};

/** The editorial's first heading, which names the approach ("## Sliding Window"). */
export function approachName(editorial: string | null | undefined): string | null {
  const m = /^#{1,3}\s+(.+?)\s*$/m.exec(editorial ?? '');
  return m ? m[1]!.replace(/[*_`]/g, '').trim() : null;
}

export interface FeedbackInput {
  language: ComplexityLanguage;
  sourceCode: string;
  editorialMarkdown: string | null;
  editorialUrl: string | null;
  referenceSolution: Partial<Record<ComplexityLanguage, string>>;
}

export interface Feedback {
  language: ComplexityLanguage;
  yours: { time: string; space: string; confidence: 'medium' | 'low'; reasons: string[] };
  standard: { time: string | null; space: string | null };
  verdict: { time: Verdict; space: Verdict };
  summary: string;
  standardSolution: {
    language: ComplexityLanguage;
    code: string;
    approach: string | null;
    note: string | null;
  } | null;
  editorialMarkdown: string | null;
  editorialUrl: string | null;
}

/**
 * Put the two readings side by side and pick the solution to show.
 *
 * The reference solution in the learner's language is preferred, but only if
 * it actually reaches the editorial's complexity: some corpus solutions were
 * written without library sorts (the judge's Go toolchain, for one) and are
 * slower than the approach the editorial teaches. Showing one of those as
 * "the standard" would teach the wrong lesson, so another language's solution
 * that does reach it is shown instead, and the note says why.
 */
export function buildFeedback(input: FeedbackInput): Feedback {
  const yours = estimateComplexity(input.sourceCode, input.language);
  const stated = statedComplexity(input.editorialMarkdown);
  const time = verdict(yours.timeGrowth, stated.timeGrowth);
  const space = verdict(yours.spaceGrowth, stated.spaceGrowth);

  const reaches = (code: string, language: ComplexityLanguage) =>
    !stated.timeGrowth || compareGrowth(estimateComplexity(code, language).timeGrowth, stated.timeGrowth) <= 0;

  const approach = approachName(input.editorialMarkdown);
  let standardSolution: Feedback['standardSolution'] = null;
  const own = input.referenceSolution[input.language];
  if (own && reaches(own, input.language)) {
    standardSolution = { language: input.language, code: own, approach, note: null };
  } else {
    const other = LANGUAGE_ORDER.find((l) => {
      const code = input.referenceSolution[l];
      return l !== input.language && code && reaches(code, l);
    });
    if (other) {
      standardSolution = {
        language: other,
        code: input.referenceSolution[other]!,
        approach,
        note: own
          ? `Shown in ${LANGUAGE_NAMES[other]}: the ${LANGUAGE_NAMES[input.language]} reference solution does not reach the standard complexity.`
          : `Shown in ${LANGUAGE_NAMES[other]}: there is no ${LANGUAGE_NAMES[input.language]} reference solution for this problem.`,
      };
    } else if (own) {
      standardSolution = { language: input.language, code: own, approach, note: null };
    }
  }

  return {
    language: input.language,
    yours: { time: yours.time, space: yours.space, confidence: yours.confidence, reasons: yours.reasons },
    standard: { time: stated.time, space: stated.space },
    verdict: { time, space },
    summary: summarise(yours, stated, time, space, approach),
    standardSolution,
    editorialMarkdown: input.editorialMarkdown,
    editorialUrl: input.editorialUrl,
  };
}

function summarise(
  yours: ComplexityEstimate,
  stated: StatedComplexity,
  time: Verdict,
  space: Verdict,
  approach: string | null,
): string {
  const technique = approach ? ` (${approach})` : '';
  if (time === 'unknown') {
    return stated.time
      ? `The standard approach${technique} runs in ${stated.time} time. Yours looks like ${yours.time}; compare the two below.`
      : `Yours looks like ${yours.time} time and ${yours.space} space. This problem's editorial does not state a complexity to compare against.`;
  }
  if (time === 'slower') {
    return `Yours looks like ${yours.time} time; the standard approach${technique} runs in ${stated.time}. That is the one worth practising next.`;
  }
  if (time === 'faster') {
    return `Yours looks like ${yours.time} time, faster than the editorial's ${stated.time}. The estimate may have missed a loop, so check it against the reasons below.`;
  }
  if (space === 'slower') {
    return `Your time matches the standard ${stated.time}. It uses ${yours.space} extra space where the standard uses ${stated.space}.`;
  }
  return `Yours matches the standard approach${technique}: ${stated.time} time${stated.space ? `, ${stated.space} space` : ''}.`;
}
