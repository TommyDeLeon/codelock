import type { Language } from '@codelock/shared';

/**
 * Techniques: what a pattern tag means in code, per language.
 *
 * The owner's first-use report was precise: "I thought I knew it, I just
 * can't write the code." The hint ladder and the lessons both explained
 * ideas well and stopped short of the line to type. This table is the
 * missing rung: for each technique the corpus tags problems with, a focusing
 * question that names the technique rather than the problem, a plain
 * outline with one gap, and the two or three constructs the language needs,
 * as lines you could paste.
 *
 * Constructs are fragments, not programs, so `verify-lessons.ts` cannot run
 * them; each is written against the runtime the judge uses and reviewed
 * against the same manual pages the lessons cite. Keep them to one idea per
 * line and never a full solution.
 */

export interface Construct {
  /** One line, or two at most, as you would type it. */
  code: string;
  /** What it does, in one scannable clause. */
  does: string;
}

export interface Technique {
  tag: string;
  /** Level 1: a question that names the technique, not the problem. */
  question: string;
  /** Level 4: a pseudocode outline with exactly one gap marked ___. */
  outline: string;
  /** The constructs, per language. */
  constructs: Record<Language, Construct[]>;
}

const all = (
  js: Construct[],
  ts: Construct[] | null,
  py: Construct[],
  java: Construct[],
  cpp: Construct[],
  go: Construct[],
): Record<Language, Construct[]> => ({ JAVASCRIPT: js, TYPESCRIPT: ts ?? js, PYTHON: py, JAVA: java, CPP: cpp, GO: go });

export const TECHNIQUES: readonly Technique[] = [
  {
    tag: 'split',
    question: 'What separates the pieces in the input — a space, a comma? Once you cut the text at that separator, what do you hold: a list of what?',
    outline: ['parts = split the text at ___', 'for each part:', '    handle it', 'combine the results'].join('\n'),
    constructs: all(
      [{ code: 'const words = s.split(" ");', does: 'cut at each space into an array of strings' }],
      null,
      [{ code: 'words = s.split(" ")', does: 'cut at each space into a list of strings' }, { code: 'words = s.split()', does: 'cut at any run of whitespace' }],
      [{ code: 'String[] words = s.split(" ");', does: 'cut at each space into an array' }],
      [{ code: 'std::istringstream in(s); std::string w; while (in >> w) { /* use w */ }', does: 'read whitespace-separated words one at a time (include <sstream>)' }],
      [{ code: 'words := strings.Split(s, " ")', does: 'cut at each space into a slice (import "strings")' }, { code: 'words := strings.Fields(s)', does: 'cut at any run of whitespace' }],
    ),
  },
  {
    tag: 'join',
    question: 'You have the pieces in order. What single character has to sit between each pair when they are put back together?',
    outline: ['parts = the pieces, in order', 'result = join parts with ___', 'return result'].join('\n'),
    constructs: all(
      [{ code: 'const out = words.join("_");', does: 'glue an array of strings with _ between' }],
      null,
      [{ code: 'out = "_".join(words)', does: 'glue a list of strings with _ between' }],
      [{ code: 'String out = String.join("_", words);', does: 'glue an array or list with _ between' }],
      [{ code: 'std::string out; for (size_t i = 0; i < w.size(); ++i) { if (i) out += "_"; out += w[i]; }', does: 'glue with _ between; the if skips the first' }],
      [{ code: 'out := strings.Join(words, "_")', does: 'glue a slice of strings with _ between' }],
    ),
  },
  {
    tag: 'case-conversion',
    question: 'Which characters need to change case — all of them, or only one at a fixed position? What does the rest of the string do?',
    outline: ['for the characters that must change:', '    convert ___', 'leave the others as they are', 'build the new string'].join('\n'),
    constructs: all(
      [{ code: 's.toUpperCase()', does: 'a new string, all upper case' }, { code: 'c.toLowerCase()', does: 'one character lowered' }],
      null,
      [{ code: 's.upper()', does: 'a new string, all upper case' }, { code: 's.capitalize()', does: 'first letter upper, rest lower' }],
      [{ code: 's.toUpperCase()', does: 'a new string, all upper case' }, { code: 'Character.toLowerCase(c)', does: 'one char lowered' }],
      [{ code: 'for (char& c : s) c = std::toupper(c);', does: 'upper every char in place (include <cctype>)' }],
      [{ code: 'strings.ToUpper(s)', does: 'a new string, all upper case' }, { code: 'unicode.ToLower(r)', does: 'one rune lowered (import "unicode")' }],
    ),
  },
  {
    tag: 'characters',
    question: 'Do you need to look at every character one by one, or only at particular positions? What is the very first character you would look at?',
    outline: ['for each character c in s:', '    if c ___:', '        do the thing', 'return the answer'].join('\n'),
    constructs: all(
      [{ code: 'for (const c of s) { /* c is one character */ }', does: 'visit every character' }, { code: 's[i]', does: 'the character at position i' }],
      null,
      [{ code: 'for c in s:', does: 'visit every character' }, { code: 's[i]', does: 'the character at position i' }],
      [{ code: 'for (char c : s.toCharArray()) { }', does: 'visit every character' }, { code: 's.charAt(i)', does: 'the character at position i' }],
      [{ code: 'for (char c : s) { }', does: 'visit every character' }, { code: 's[i]', does: 'the character at position i' }],
      [{ code: 'for _, r := range s { }', does: 'visit every character as a rune' }, { code: 's[i]', does: 'the byte at position i (ASCII only)' }],
    ),
  },
  {
    tag: 'substring',
    question: 'Which positions does the piece you need start and end at? Is the end position included or one past the end?',
    outline: ['start = ___', 'end = the position one past the last character you want', 'return the slice from start to end'].join('\n'),
    constructs: all(
      [{ code: 's.slice(start, end)', does: 'characters from start up to, not including, end' }],
      null,
      [{ code: 's[start:end]', does: 'characters from start up to, not including, end' }],
      [{ code: 's.substring(start, end)', does: 'characters from start up to, not including, end' }],
      [{ code: 's.substr(start, count)', does: 'count characters starting at start' }],
      [{ code: 's[start:end]', does: 'bytes from start up to, not including, end' }],
    ),
  },
  {
    tag: 'accumulator',
    question: 'What is the one value you carry from item to item, and what is it before you have seen anything?',
    outline: ['total = ___', 'for each item:', '    total = total combined with item', 'return total'].join('\n'),
    constructs: all(
      [{ code: 'let total = 0;\nfor (const n of nums) total += n;', does: 'a running total that survives the loop' }],
      null,
      [{ code: 'total = 0\nfor n in nums:\n    total += n', does: 'a running total that survives the loop' }],
      [{ code: 'int total = 0;\nfor (int n : nums) total += n;', does: 'a running total that survives the loop' }],
      [{ code: 'int total = 0;\nfor (int n : nums) total += n;', does: 'a running total that survives the loop' }],
      [{ code: 'total := 0\nfor _, n := range nums { total += n }', does: 'a running total that survives the loop' }],
    ),
  },
  {
    tag: 'counting',
    question: 'What exactly is being counted — items that satisfy a condition? Write that condition as a yes-or-no question about one item.',
    outline: ['count = 0', 'for each item:', '    if item ___:', '        count = count + 1', 'return count'].join('\n'),
    constructs: all(
      [{ code: 'let count = 0;\nfor (const x of items) if (x % 2 === 0) count++;', does: 'count the items that pass a test' }],
      null,
      [{ code: 'count = 0\nfor x in items:\n    if x % 2 == 0:\n        count += 1', does: 'count the items that pass a test' }],
      [{ code: 'int count = 0;\nfor (int x : items) if (x % 2 == 0) count++;', does: 'count the items that pass a test' }],
      [{ code: 'int count = 0;\nfor (int x : items) if (x % 2 == 0) count++;', does: 'count the items that pass a test' }],
      [{ code: 'count := 0\nfor _, x := range items { if x%2 == 0 { count++ } }', does: 'count the items that pass a test' }],
    ),
  },
  {
    tag: 'running-best',
    question: 'What should the "best so far" hold before you look at anything — the first item, or a value nothing can beat?',
    outline: ['best = ___', 'for each item:', '    if item is better than best:', '        best = item', 'return best'].join('\n'),
    constructs: all(
      [{ code: 'let best = nums[0];\nfor (const n of nums) if (n > best) best = n;', does: 'largest so far, seeded with the first item' }],
      null,
      [{ code: 'best = nums[0]\nfor n in nums:\n    if n > best:\n        best = n', does: 'largest so far, seeded with the first item' }],
      [{ code: 'int best = nums[0];\nfor (int n : nums) if (n > best) best = n;', does: 'largest so far, seeded with the first item' }],
      [{ code: 'int best = nums[0];\nfor (int n : nums) if (n > best) best = n;', does: 'largest so far, seeded with the first item' }],
      [{ code: 'best := nums[0]\nfor _, n := range nums { if n > best { best = n } }', does: 'largest so far, seeded with the first item' }],
    ),
  },
  {
    tag: 'frequency-count',
    question: 'For each value, where will you keep its count so that seeing the value again finds the same count?',
    outline: ['counts = an empty map', 'for each item:', '    counts[item] = ___ + 1', 'read the counts you need'].join('\n'),
    constructs: all(
      [{ code: 'const counts = new Map();\nfor (const x of items) counts.set(x, (counts.get(x) ?? 0) + 1);', does: 'count occurrences per value' }],
      [{ code: 'const counts = new Map<string, number>();\nfor (const x of items) counts.set(x, (counts.get(x) ?? 0) + 1);', does: 'count occurrences per value' }],
      [{ code: 'counts = {}\nfor x in items:\n    counts[x] = counts.get(x, 0) + 1', does: 'count occurrences per value' }],
      [{ code: 'Map<String, Integer> counts = new HashMap<>();\nfor (String x : items) counts.merge(x, 1, Integer::sum);', does: 'count occurrences per value' }],
      [{ code: 'std::unordered_map<std::string, int> counts;\nfor (const auto& x : items) counts[x]++;', does: 'count occurrences per value' }],
      [{ code: 'counts := map[string]int{}\nfor _, x := range items { counts[x]++ }', does: 'count occurrences per value' }],
    ),
  },
  {
    tag: 'hash-map',
    question: 'What is the key you would look something up by, and what do you need to find when you look it up? Can you fill the map in the same pass that reads it?',
    outline: ['seen = an empty map', 'for each item:', '    if ___ is in seen:', '        answer found', '    seen[item] = its position'].join('\n'),
    constructs: all(
      [{ code: 'const seen = new Map();\nif (seen.has(key)) { /* found */ }\nseen.set(key, i);', does: 'look up a key, then remember one' }],
      [{ code: 'const seen = new Map<number, number>();\nif (seen.has(key)) { /* found */ }\nseen.set(key, i);', does: 'look up a key, then remember one' }],
      [{ code: 'seen = {}\nif key in seen:\n    ...  # found\nseen[x] = i', does: 'look up a key, then remember one' }],
      [{ code: 'Map<Integer, Integer> seen = new HashMap<>();\nif (seen.containsKey(key)) { }\nseen.put(x, i);', does: 'look up a key, then remember one' }],
      [{ code: 'std::unordered_map<int, int> seen;\nif (seen.count(key)) { }\nseen[x] = i;', does: 'look up a key, then remember one' }],
      [{ code: 'seen := map[int]int{}\nif j, ok := seen[key]; ok { _ = j }\nseen[x] = i', does: 'look up a key, then remember one' }],
    ),
  },
  {
    tag: 'hash-set',
    question: 'What are you checking membership of — have I seen this value before? A set answers exactly that, in one step.',
    outline: ['seen = an empty set', 'for each item:', '    if item is in seen: ___', '    add item to seen'].join('\n'),
    constructs: all(
      [{ code: 'const seen = new Set();\nif (seen.has(x)) { }\nseen.add(x);', does: 'membership test, then remember' }],
      [{ code: 'const seen = new Set<number>();\nif (seen.has(x)) { }\nseen.add(x);', does: 'membership test, then remember' }],
      [{ code: 'seen = set()\nif x in seen:\n    ...\nseen.add(x)', does: 'membership test, then remember' }],
      [{ code: 'Set<Integer> seen = new HashSet<>();\nif (seen.contains(x)) { }\nseen.add(x);', does: 'membership test, then remember' }],
      [{ code: 'std::unordered_set<int> seen;\nif (seen.count(x)) { }\nseen.insert(x);', does: 'membership test, then remember' }],
      [{ code: 'seen := map[int]bool{}\nif seen[x] { }\nseen[x] = true', does: 'membership test, then remember (a map as a set)' }],
    ),
  },
  {
    tag: 'two-pointers',
    question: 'Which two positions start the walk — both ends, or both at the start? On each step, which one moves, and what decides that?',
    outline: ['left = 0, right = last position', 'while left < right:', '    if ___:', '        move left forward', '    else:', '        move right back'].join('\n'),
    constructs: all(
      [{ code: 'let l = 0, r = a.length - 1;\nwhile (l < r) { /* compare a[l], a[r]; then l++ or r-- */ }', does: 'two indices closing in from both ends' }],
      null,
      [{ code: 'l, r = 0, len(a) - 1\nwhile l < r:\n    # compare a[l], a[r]; then l += 1 or r -= 1', does: 'two indices closing in from both ends' }],
      [{ code: 'int l = 0, r = a.length - 1;\nwhile (l < r) { /* compare a[l], a[r]; then l++ or r-- */ }', does: 'two indices closing in from both ends' }],
      [{ code: 'int l = 0, r = (int)a.size() - 1;\nwhile (l < r) { /* compare a[l], a[r]; then ++l or --r */ }', does: 'two indices closing in from both ends' }],
      [{ code: 'l, r := 0, len(a)-1\nfor l < r { /* compare a[l], a[r]; then l++ or r-- */ }', does: 'two indices closing in from both ends' }],
    ),
  },
  {
    tag: 'sliding-window',
    question: 'What is the window — a fixed width, or "as wide as a condition allows"? When the right edge moves one step, what leaves on the left?',
    outline: ['left = 0, running = 0', 'for right over every position:', '    add a[right] to running', '    while ___:', '        remove a[left] from running; left = left + 1', '    record the best window'].join('\n'),
    constructs: all(
      [{ code: 'let left = 0, sum = 0;\nfor (let right = 0; right < a.length; right++) {\n  sum += a[right];\n  while (right - left + 1 > k) sum -= a[left++];\n}', does: 'a window of at most k items, sum kept up to date' }],
      null,
      [{ code: 'left = 0\nrunning = 0\nfor right in range(len(a)):\n    running += a[right]\n    while right - left + 1 > k:\n        running -= a[left]\n        left += 1', does: 'a window of at most k items, sum kept up to date' }],
      [{ code: 'int left = 0, sum = 0;\nfor (int right = 0; right < a.length; right++) {\n  sum += a[right];\n  while (right - left + 1 > k) sum -= a[left++];\n}', does: 'a window of at most k items, sum kept up to date' }],
      [{ code: 'int left = 0, sum = 0;\nfor (int right = 0; right < (int)a.size(); ++right) {\n  sum += a[right];\n  while (right - left + 1 > k) sum -= a[left++];\n}', does: 'a window of at most k items, sum kept up to date' }],
      [{ code: 'left, sum := 0, 0\nfor right := range a {\n  sum += a[right]\n  for right-left+1 > k { sum -= a[left]; left++ }\n}', does: 'a window of at most k items, sum kept up to date' }],
    ),
  },
  {
    tag: 'prefix-sum',
    question: 'If you knew the total of everything before position i, how would you get the total of any range ending at i in one subtraction?',
    outline: ['prefix[0] = 0', 'for i over positions:', '    prefix[i + 1] = prefix[i] + a[i]', 'sum of a[l..r] = prefix[r + 1] - ___'].join('\n'),
    constructs: all(
      [{ code: 'const prefix = [0];\nfor (const n of a) prefix.push(prefix[prefix.length - 1] + n);', does: 'prefix[i] is the sum of the first i items' }],
      null,
      [{ code: 'prefix = [0]\nfor n in a:\n    prefix.append(prefix[-1] + n)', does: 'prefix[i] is the sum of the first i items' }],
      [{ code: 'int[] prefix = new int[a.length + 1];\nfor (int i = 0; i < a.length; i++) prefix[i + 1] = prefix[i] + a[i];', does: 'prefix[i] is the sum of the first i items' }],
      [{ code: 'std::vector<long long> prefix(a.size() + 1, 0);\nfor (size_t i = 0; i < a.size(); ++i) prefix[i + 1] = prefix[i] + a[i];', does: 'prefix[i] is the sum of the first i items' }],
      [{ code: 'prefix := make([]int, len(a)+1)\nfor i, n := range a { prefix[i+1] = prefix[i] + n }', does: 'prefix[i] is the sum of the first i items' }],
    ),
  },
  {
    tag: 'modulo',
    question: 'What does the remainder tell you here — evenness, the last digit, a wrap-around? Which number are you dividing by?',
    outline: ['remainder = n % ___', 'decide from the remainder'].join('\n'),
    constructs: all(
      [{ code: 'n % 10', does: 'last digit of a non-negative n' }, { code: 'n % 2 === 0', does: 'true when n is even' }],
      null,
      [{ code: 'n % 10', does: 'last digit of a non-negative n' }, { code: 'n % 2 == 0', does: 'True when n is even' }],
      [{ code: 'n % 10', does: 'last digit of a non-negative n' }, { code: 'n % 2 == 0', does: 'true when n is even' }],
      [{ code: 'n % 10', does: 'last digit of a non-negative n' }, { code: 'n % 2 == 0', does: 'true when n is even' }],
      [{ code: 'n % 10', does: 'last digit of a non-negative n' }, { code: 'n%2 == 0', does: 'true when n is even' }],
    ),
  },
  {
    tag: 'linear-search',
    question: 'What are you looking for, and what do you do the moment you find it — return at once, or keep going?',
    outline: ['for each position i:', '    if a[i] ___:', '        return i', 'return -1'].join('\n'),
    constructs: all(
      [{ code: 'for (let i = 0; i < a.length; i++) if (a[i] === target) return i;\nreturn -1;', does: 'first position of target, or -1' }],
      null,
      [{ code: 'for i, x in enumerate(a):\n    if x == target:\n        return i\nreturn -1', does: 'first position of target, or -1' }],
      [{ code: 'for (int i = 0; i < a.length; i++) if (a[i] == target) return i;\nreturn -1;', does: 'first position of target, or -1' }],
      [{ code: 'for (size_t i = 0; i < a.size(); ++i) if (a[i] == target) return (int)i;\nreturn -1;', does: 'first position of target, or -1' }],
      [{ code: 'for i, x := range a { if x == target { return i } }\nreturn -1', does: 'first position of target, or -1' }],
    ),
  },
  {
    tag: 'sorting',
    question: 'If the items were in order, would the answer be easy to read off? Sort first, then think about what sorted order gives you.',
    outline: ['sort a', 'walk a in order and ___'].join('\n'),
    constructs: all(
      [{ code: 'a.sort((x, y) => x - y);', does: 'numbers ascending, in place (without the comparator JS sorts as text)' }],
      null,
      [{ code: 'a.sort()', does: 'ascending, in place' }, { code: 'sorted(a, key=len)', does: 'a new list, ordered by a key' }],
      [{ code: 'Arrays.sort(a);', does: 'ascending, in place' }, { code: 'list.sort(Comparator.comparingInt(String::length));', does: 'by a key' }],
      [{ code: 'std::sort(a.begin(), a.end());', does: 'ascending, in place (include <algorithm>)' }],
      [{ code: 'sort.Ints(a)', does: 'ascending, in place (import "sort")' }, { code: 'sort.Slice(a, func(i, j int) bool { return a[i] < a[j] })', does: 'by any rule' }],
    ),
  },
];

const BY_TAG = new Map(TECHNIQUES.map((t) => [t.tag, t]));

/** Tags that are only ever a second word for one of the above. */
const ALIASES: Record<string, string> = {
  frequency: 'frequency-count',
  'seen-before': 'hash-set',
  deduplication: 'hash-set',
  'distinct-values': 'hash-set',
  search: 'linear-search',
  'linear-scan': 'linear-search',
  'early-exit': 'linear-search',
  maximum: 'running-best',
  minimum: 'running-best',
  transform: 'characters',
  parsing: 'split',
  'sorted-input': 'two-pointers',
  'two-sum': 'hash-map',
  complement: 'hash-map',
  palindrome: 'two-pointers',
};

/** The techniques a problem's tags name, in the tags' own order, without repeats. */
export function techniquesFor(tags: readonly string[]): Technique[] {
  const out: Technique[] = [];
  for (const tag of tags) {
    const t = BY_TAG.get(tag) ?? BY_TAG.get(ALIASES[tag] ?? '');
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

/** The constructs for one language as one code block, with the "does" beside each. */
export function constructsText(techniques: readonly Technique[], language: Language): string | null {
  const lines: string[] = [];
  const comment = language === 'PYTHON' ? '#' : '//';
  for (const t of techniques) {
    for (const c of t.constructs[language]) lines.push(`${comment} ${c.does}`, c.code, '');
  }
  return lines.length ? lines.join('\n').trimEnd() : null;
}
