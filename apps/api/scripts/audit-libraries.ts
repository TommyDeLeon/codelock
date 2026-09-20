/**
 * Which reference solutions lean on a library to do the thinking.
 *
 * The corpus teaches logic, so a worked solution that calls `sorted()` or
 * `PriorityQueue` hands the learner the one step the problem was about. This
 * script reports every reference solution that does, per language, so the
 * retrofit has a worklist and the authoring gate has something to measure.
 *
 * What counts as "the library doing the thinking" (banned): sorting, heaps and
 * priority queues, binary-search helpers, regular expressions,
 * frequency/grouping helpers, permutation generators, gcd helpers, and the
 * sweep-in-one-call helpers of <algorithm> and Java streams.
 *
 * What stays allowed: plain arrays, lists, maps and sets, string indexing,
 * arithmetic, and the language's own I/O. Re-implementing a hash map by hand
 * teaches nothing about the problem in front of the learner.
 *
 *   npx tsx scripts/audit-libraries.ts [--json] [--slug <slug>]
 */
import { ALL_PROBLEMS } from '../src/corpus/problems/index.js';
import { applyUpgrades } from '../src/corpus/upgrade.js';
import type { Lang } from '../src/corpus/types.js';

/** One banned construct: a pattern, and what it is called in a sentence. */
interface Rule {
  pattern: RegExp;
  what: string;
}

export const RULES: Record<Lang, Rule[]> = {
  PYTHON: [
    { pattern: /\bimport\s+\w+/, what: 'import' },
    { pattern: /\bsorted\s*\(/, what: 'sorted()' },
    { pattern: /\.sort\s*\(/, what: 'list.sort()' },
    { pattern: /\b(?:heapq|bisect|itertools|functools|collections|re)\./, what: 'stdlib module' },
    { pattern: /\b(?:Counter|defaultdict|deque|OrderedDict)\s*\(/, what: 'collections type' },
    { pattern: /\bmath\.\w+/, what: 'math module' },
  ],
  JAVASCRIPT: [
    { pattern: /\.sort\s*\(/, what: 'Array.sort()' },
    {
      pattern: /\bnew\s+RegExp\b|\/[^/\n]+\/[gimsuy]*\.(?:test|exec)\s*\(/,
      what: 'regular expression',
    },
    { pattern: /\.(?:match|replace|replaceAll|split)\s*\(\s*\//, what: 'regular expression' },
    { pattern: /\bMath\.(?:hypot|cbrt|log2|log10|sign|trunc)\b/, what: 'Math helper' },
  ],
  TYPESCRIPT: [
    { pattern: /\.sort\s*\(/, what: 'Array.sort()' },
    {
      pattern: /\bnew\s+RegExp\b|\/[^/\n]+\/[gimsuy]*\.(?:test|exec)\s*\(/,
      what: 'regular expression',
    },
    { pattern: /\.(?:match|replace|replaceAll|split)\s*\(\s*\//, what: 'regular expression' },
    { pattern: /\bMath\.(?:hypot|cbrt|log2|log10|sign|trunc)\b/, what: 'Math helper' },
  ],
  JAVA: [
    { pattern: /\b(?:Arrays|Collections)\.sort\s*\(/, what: 'Arrays/Collections.sort' },
    {
      pattern: /\b(?:Arrays|Collections)\.(?:binarySearch|fill|copyOf|reverse|frequency)\s*\(/,
      what: 'Arrays/Collections helper',
    },
    { pattern: /\bnew\s+PriorityQueue\b/, what: 'PriorityQueue' },
    { pattern: /\b(?:stream|Stream|Collectors)\b/, what: 'streams' },
    { pattern: /\b(?:Pattern|Matcher)\b/, what: 'regular expression' },
    { pattern: /\bMath\.(?:hypot|cbrt|log10|floorMod|floorDiv)\b/, what: 'Math helper' },
  ],
  CPP: [
    { pattern: /\bstd::sort\b|\bsort\s*\(\s*\w+\.begin\s*\(/, what: 'std::sort' },
    { pattern: /\b(?:priority_queue|make_heap|push_heap|pop_heap)\b/, what: 'heap' },
    {
      pattern:
        /\b(?:lower_bound|upper_bound|binary_search|nth_element|next_permutation|accumulate|reverse|max_element|min_element|count_if)\s*\(/,
      what: '<algorithm> helper',
    },
    { pattern: /\b(?:regex|smatch)\b/, what: 'regular expression' },
    { pattern: /\b__gcd\b|\bstd::gcd\b/, what: 'gcd helper' },
  ],
  GO: [
    { pattern: /\bsort\.\w+/, what: 'sort package' },
    { pattern: /\b(?:regexp|container\/heap|math\/bits)\b/, what: 'stdlib package' },
    // Splitting and joining are parsing, the same work every language does to
    // read its input, so they stay. Searching and rewriting a string are the
    // algorithm in several problems, so they go.
    {
      pattern: /\bstrings\.(?:Contains|ContainsAny|Index|LastIndex|Count|Replace|ReplaceAll|Repeat|EqualFold)\b/,
      what: 'strings helper',
    },
    { pattern: /\bmath\.(?:Sqrt|Abs|Pow|Max|Min)\b/, what: 'math helper' },
  ],
};

/** Every banned construct this source uses, or an empty list. */
export function libraryUses(lang: Lang, source: string): string[] {
  const found = new Set<string>();
  for (const rule of RULES[lang] ?? []) {
    if (rule.pattern.test(source)) found.add(rule.what);
  }
  return [...found];
}

function main(): void {
  const json = process.argv.includes('--json');
  const only = process.argv.includes('--slug')
    ? process.argv[process.argv.indexOf('--slug') + 1]
    : null;

  const problems = applyUpgrades(ALL_PROBLEMS).filter((p) => !only || p.slug === only);
  const offenders: Array<{ slug: string; languages: Record<string, string[]> }> = [];
  const perLanguage = new Map<string, number>();

  for (const p of problems) {
    const languages: Record<string, string[]> = {};
    for (const [lang, source] of Object.entries(p.referenceSolution ?? {})) {
      if (!source) continue;
      const uses = libraryUses(lang as Lang, source);
      if (uses.length > 0) {
        languages[lang] = uses;
        perLanguage.set(lang, (perLanguage.get(lang) ?? 0) + 1);
      }
    }
    if (Object.keys(languages).length > 0) offenders.push({ slug: p.slug, languages });
  }

  if (json) {
    console.log(JSON.stringify({ total: problems.length, offenders }, null, 1));
    return;
  }
  for (const o of offenders.slice(0, 40)) {
    const detail = Object.entries(o.languages)
      .map(([lang, uses]) => `${lang}: ${uses.join(', ')}`)
      .join(' | ');
    console.log(`${o.slug}  ${detail}`);
  }
  console.log(
    `\n${offenders.length} of ${problems.length} problems use a library in at least one language`,
  );
  for (const [lang, count] of [...perLanguage].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${lang}: ${count}`);
  }
}

if (process.argv[1]?.includes('audit-libraries')) main();
