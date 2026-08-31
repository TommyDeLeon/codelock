import { AUTHORED, type ProblemDefinition } from '../problem.js';

/**
 * Tier 1 — Tries.
 *
 * A child of Trees on the roadmap, and the family that pays off the Tier 0.5
 * `cls:trie` exercise: there the user builds the structure, here they use the
 * idea to answer a question no scan answers cheaply. Every statement is written
 * from the task — see the non-negotiable at the top of docs/AUTHORING.md.
 *
 * The through-line: a list of words has enormous redundancy in its prefixes,
 * and a trie is what you get when you refuse to re-walk the same prefix twice.
 * Each editorial answers the same question — what does the shared path buy you
 * that a loop over the words does not?
 *
 * Every trie here is stored as a preallocated pool of 26-way child arrays with
 * index 0 meaning "no child" (the root is node 0 and is never anyone's child).
 * That representation is deliberate and repeated across all six languages: it
 * needs no hash map, no pointers, and — importantly for the Go and C++ drivers,
 * which import very little — no sorting, because iterating 0..25 is already
 * alphabetical order.
 */

const p = (d: ProblemDefinition): ProblemDefinition => d;

const base = {
  tier: 'TIER_1',
  patternFamily: 'TRIES',
  provenance: AUTHORED,
} as const;

export const TIER_1_TRIES_PROBLEMS: ProblemDefinition[] = [
  p({
    ...base,
    slug: 'longest-shared-prefix',
    title: 'The Part They All Agree On',
    difficulty: 'EASY',
    patternTags: ['trie', 'prefix', 'strings'],
    signatureId: 'fn:strings->string',
    avgSolveSeconds: 420,
    promptMarkdown: [
      'You are given a list of words on one line, separated by spaces.',
      '',
      'Print the longest prefix that **every** word in the list starts with.',
      '',
      '**Example**',
      '',
      '```',
      'input:  flower flow flight',
      'output: fl',
      '```',
      '',
      'All three start with `fl`. They do not all start with `flo`, because',
      '`flight` does not.',
      '',
      'Guarantees: there is always at least one word, and every word is one or',
      'more lowercase letters `a`–`z`.',
      '',
      'The named edge case: when the words share nothing — `dog cat bird` — the',
      'answer is the empty prefix, so print an **empty line**. A list of one word',
      'answers with that whole word.',
    ].join('\n'),
    editorialMarkdown: [
      '## Trie: walk the shared path until it forks',
      '',
      'Push every word into a trie. The root has one child per distinct first',
      'letter, that child has one per distinct second letter, and so on. Now the',
      'question answers itself geometrically: the longest shared prefix is the path',
      'from the root that runs while there is exactly **one** way forward and no',
      'word has ended yet.',
      '',
      '```',
      'node = root, out = ""',
      'while node is not the end of a word and node has exactly one child c:',
      '    out += c',
      '    node = child(node, c)',
      '```',
      '',
      'Why the fork is the right stopping point: two children at a node means two',
      'words disagreed on that character, so no prefix reaching past it is common',
      'to both. And a word ending at the node means one word is exactly this long,',
      'so nothing longer can be a prefix of it.',
      '',
      'What the trie buys you over comparing the words pairwise is that each',
      'character of each word is looked at once, on the way in, instead of being',
      'rescanned for every comparison. The prefixes are shared, so the work on them',
      'is shared too.',
      '',
      'The quiet mistake is forgetting the word-end check and only stopping at a',
      'fork. On `pre prefix` the trie path `p → r → e → f → i → x` never forks, so',
      'that version answers `prefix` — a string the shorter word does not even',
      'contain. It is quiet because it passes on every input where no word is a',
      'prefix of another, which is most of the inputs you will invent by hand.',
      '',
      'O(total characters) time to build and O(length of the answer) to walk, so',
      'building the trie is what bounds it. Space is O(total characters) for the',
      'nodes — which is the honest cost of the structure, and why a plain',
      'character-by-character scan across the words is the better answer if you only',
      'ever ask this question once.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(words) {
  let total = 1;
  for (const w of words) total += w.length;
  const nxt = Array.from({ length: total }, () => new Array(26).fill(0));
  const ends = new Array(total).fill(0);
  let sz = 1;
  for (const w of words) {
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
    }
    ends[node]++;
  }
  let node = 0;
  let out = '';
  for (;;) {
    if (ends[node] > 0) break;
    let child = -1;
    let found = 0;
    for (let c = 0; c < 26; c++) {
      if (nxt[node][c] !== 0) {
        found++;
        child = c;
      }
    }
    if (found !== 1) break;
    out += String.fromCharCode(97 + child);
    node = nxt[node][child];
  }
  return out;
}`,
      TYPESCRIPT: `function solve(words: string[]): string {
  let total = 1;
  for (const w of words) total += w.length;
  const nxt: number[][] = Array.from({ length: total }, () => new Array<number>(26).fill(0));
  const ends: number[] = new Array<number>(total).fill(0);
  let sz = 1;
  for (const w of words) {
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
    }
    ends[node]++;
  }
  let node = 0;
  let out = '';
  for (;;) {
    if (ends[node] > 0) break;
    let child = -1;
    let found = 0;
    for (let c = 0; c < 26; c++) {
      if (nxt[node][c] !== 0) {
        found++;
        child = c;
      }
    }
    if (found !== 1) break;
    out += String.fromCharCode(97 + child);
    node = nxt[node][child];
  }
  return out;
}`,
      PYTHON: `def solve(words):
    total = 1
    for w in words:
        total += len(w)
    nxt = [[0] * 26 for _ in range(total)]
    ends = [0] * total
    sz = 1
    for w in words:
        node = 0
        for ch in w:
            c = ord(ch) - 97
            if nxt[node][c] == 0:
                nxt[node][c] = sz
                sz += 1
            node = nxt[node][c]
        ends[node] += 1
    node = 0
    out = []
    while True:
        if ends[node] > 0:
            break
        child = -1
        found = 0
        for c in range(26):
            if nxt[node][c] != 0:
                found += 1
                child = c
        if found != 1:
            break
        out.append(chr(97 + child))
        node = nxt[node][child]
    return ''.join(out)`,
      JAVA: `    static String solve(String[] words) {
        int total = 1;
        for (String w : words) total += w.length();
        int[][] nxt = new int[total][26];
        int[] ends = new int[total];
        int sz = 1;
        for (String w : words) {
            int node = 0;
            for (int j = 0; j < w.length(); j++) {
                int c = w.charAt(j) - 'a';
                if (nxt[node][c] == 0) {
                    nxt[node][c] = sz;
                    sz++;
                }
                node = nxt[node][c];
            }
            ends[node]++;
        }
        int node = 0;
        StringBuilder out = new StringBuilder();
        while (true) {
            if (ends[node] > 0) break;
            int child = -1;
            int found = 0;
            for (int c = 0; c < 26; c++) {
                if (nxt[node][c] != 0) {
                    found++;
                    child = c;
                }
            }
            if (found != 1) break;
            out.append((char) ('a' + child));
            node = nxt[node][child];
        }
        return out.toString();
    }`,
      CPP: `string solve(vector<string> words) {
    int total = 1;
    for (size_t i = 0; i < words.size(); i++) total += (int) words[i].size();
    vector<vector<int> > nxt(total, vector<int>(26, 0));
    vector<int> ends(total, 0);
    int sz = 1;
    for (size_t i = 0; i < words.size(); i++) {
        int node = 0;
        for (size_t j = 0; j < words[i].size(); j++) {
            int c = words[i][j] - 'a';
            if (nxt[node][c] == 0) {
                nxt[node][c] = sz;
                sz++;
            }
            node = nxt[node][c];
        }
        ends[node]++;
    }
    int node = 0;
    string out;
    while (true) {
        if (ends[node] > 0) break;
        int child = -1;
        int found = 0;
        for (int c = 0; c < 26; c++) {
            if (nxt[node][c] != 0) {
                found++;
                child = c;
            }
        }
        if (found != 1) break;
        out += (char) ('a' + child);
        node = nxt[node][child];
    }
    return out;
}`,
      GO: `func solve(words []string) string {
    total := 1
    for _, w := range words {
        total += len(w)
    }
    nxt := make([][26]int, total)
    ends := make([]int, total)
    sz := 1
    for _, w := range words {
        node := 0
        for j := 0; j < len(w); j++ {
            c := int(w[j] - 'a')
            if nxt[node][c] == 0 {
                nxt[node][c] = sz
                sz++
            }
            node = nxt[node][c]
        }
        ends[node]++
    }
    node := 0
    out := []byte{}
    for {
        if ends[node] > 0 {
            break
        }
        child := -1
        found := 0
        for c := 0; c < 26; c++ {
            if nxt[node][c] != 0 {
                found++
                child = c
            }
        }
        if found != 1 {
            break
        }
        out = append(out, byte('a'+child))
        node = nxt[node][child]
    }
    return string(out)
}`,
    },
    tests: [
      { stdin: 'flower flow flight', expectedStdout: 'fl', isSample: true },
      { stdin: 'dog cat bird', expectedStdout: '', isSample: true },
      { stdin: 'same same same', expectedStdout: 'same' },
      { stdin: 'prefix pre', expectedStdout: 'pre' },
      { stdin: 'a', expectedStdout: 'a' },
      { stdin: 'abc abcd abcde', expectedStdout: 'abc' },
    ],
  }),

  p({
    ...base,
    slug: 'count-words-with-prefix',
    title: 'How Many Start Like This',
    difficulty: 'MEDIUM',
    patternTags: ['trie', 'prefix', 'counting'],
    signatureId: 'fn:strings->int',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'You are given a list of tokens on one line, separated by spaces.',
      '',
      'The **last** token is a query prefix. Every token before it is a word.',
      'Print how many of the words start with the query prefix.',
      '',
      'A word counts if the prefix matches its opening characters, and a word that',
      'is exactly equal to the prefix counts too.',
      '',
      '**Example**',
      '',
      '```',
      'input:  apple apply apt banana ap',
      'output: 3',
      '```',
      '',
      'The words are `apple apply apt banana` and the prefix is `ap`. Three of them',
      'start with `ap`; `banana` does not.',
      '',
      'Guarantees: there are always at least two tokens, so there is at least one',
      'word and always a prefix. Every token is one or more lowercase letters',
      '`a`–`z`. Duplicate words are possible and each copy counts separately.',
      '',
      'The named edge case: when nothing matches, print `0`.',
    ].join('\n'),
    editorialMarkdown: [
      '## Trie with a pass-through counter',
      '',
      'The scan answer is one loop: for each word, compare the first `m` characters',
      'against the prefix. That is O(n·m) *per query* and it is completely fine for',
      'one query. The trie answer earns its keep when the same word list is asked',
      'many prefixes, which is the situation the pattern exists for.',
      '',
      'Insert every word into a trie, and as you walk each word in, increment a',
      'counter on **every node you pass through**. That counter now holds an',
      'invariant worth stating plainly: `count[node]` is the number of inserted',
      'words that have the path to `node` as a prefix. Answering a query is then a',
      'walk of length `m` and a single read.',
      '',
      '```',
      'insert(w): node = root; for ch in w: node = child(node, ch); count[node] += 1',
      'query(q):  node = root; for ch in q: node = child(node, ch) or return 0',
      '           return count[node]',
      '```',
      '',
      'Sharing prefixes is what turns the repeated O(m) scans into one walk: all the',
      'words beginning `ap` travelled the same two edges, so the fact that there are',
      'three of them was already recorded at the `ap` node when they went by.',
      '',
      'The quiet mistake is incrementing the counter at the root as well, or',
      'incrementing at the node *before* stepping. Either shifts every count one',
      'level up, so `ap` reports the number of words starting with `a`. It is quiet',
      'because on a list where every word shares its first letter the two numbers',
      'are identical, and a hand-written test almost always looks like that.',
      '',
      'The other quiet one is falling off the trie: if the prefix runs into a missing',
      'child you must return `0`, not read the counter of wherever you stopped.',
      '',
      'O(total characters) to build, O(m) to answer, and the build is what bounds it.',
      'Space is O(total characters) of nodes.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(tokens) {
  const prefix = tokens[tokens.length - 1];
  let total = 1;
  for (const w of tokens) total += w.length;
  const nxt = Array.from({ length: total }, () => new Array(26).fill(0));
  const cnt = new Array(total).fill(0);
  let sz = 1;
  for (let i = 0; i < tokens.length - 1; i++) {
    const w = tokens[i];
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
      cnt[node]++;
    }
  }
  let node = 0;
  for (let j = 0; j < prefix.length; j++) {
    const c = prefix.charCodeAt(j) - 97;
    if (nxt[node][c] === 0) return 0;
    node = nxt[node][c];
  }
  return cnt[node];
}`,
      TYPESCRIPT: `function solve(tokens: string[]): number {
  const prefix = tokens[tokens.length - 1];
  let total = 1;
  for (const w of tokens) total += w.length;
  const nxt: number[][] = Array.from({ length: total }, () => new Array<number>(26).fill(0));
  const cnt: number[] = new Array<number>(total).fill(0);
  let sz = 1;
  for (let i = 0; i < tokens.length - 1; i++) {
    const w = tokens[i];
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
      cnt[node]++;
    }
  }
  let node = 0;
  for (let j = 0; j < prefix.length; j++) {
    const c = prefix.charCodeAt(j) - 97;
    if (nxt[node][c] === 0) return 0;
    node = nxt[node][c];
  }
  return cnt[node];
}`,
      PYTHON: `def solve(tokens):
    prefix = tokens[-1]
    total = 1
    for w in tokens:
        total += len(w)
    nxt = [[0] * 26 for _ in range(total)]
    cnt = [0] * total
    sz = 1
    for w in tokens[:-1]:
        node = 0
        for ch in w:
            c = ord(ch) - 97
            if nxt[node][c] == 0:
                nxt[node][c] = sz
                sz += 1
            node = nxt[node][c]
            cnt[node] += 1
    node = 0
    for ch in prefix:
        c = ord(ch) - 97
        if nxt[node][c] == 0:
            return 0
        node = nxt[node][c]
    return cnt[node]`,
      JAVA: `    static int solve(String[] tokens) {
        String prefix = tokens[tokens.length - 1];
        int total = 1;
        for (String w : tokens) total += w.length();
        int[][] nxt = new int[total][26];
        int[] cnt = new int[total];
        int sz = 1;
        for (int i = 0; i < tokens.length - 1; i++) {
            String w = tokens[i];
            int node = 0;
            for (int j = 0; j < w.length(); j++) {
                int c = w.charAt(j) - 'a';
                if (nxt[node][c] == 0) {
                    nxt[node][c] = sz;
                    sz++;
                }
                node = nxt[node][c];
                cnt[node]++;
            }
        }
        int node = 0;
        for (int j = 0; j < prefix.length(); j++) {
            int c = prefix.charAt(j) - 'a';
            if (nxt[node][c] == 0) return 0;
            node = nxt[node][c];
        }
        return cnt[node];
    }`,
      CPP: `int solve(vector<string> tokens) {
    string prefix = tokens[tokens.size() - 1];
    int total = 1;
    for (size_t i = 0; i < tokens.size(); i++) total += (int) tokens[i].size();
    vector<vector<int> > nxt(total, vector<int>(26, 0));
    vector<int> cnt(total, 0);
    int sz = 1;
    for (size_t i = 0; i + 1 < tokens.size(); i++) {
        int node = 0;
        for (size_t j = 0; j < tokens[i].size(); j++) {
            int c = tokens[i][j] - 'a';
            if (nxt[node][c] == 0) {
                nxt[node][c] = sz;
                sz++;
            }
            node = nxt[node][c];
            cnt[node]++;
        }
    }
    int node = 0;
    for (size_t j = 0; j < prefix.size(); j++) {
        int c = prefix[j] - 'a';
        if (nxt[node][c] == 0) return 0;
        node = nxt[node][c];
    }
    return cnt[node];
}`,
      GO: `func solve(tokens []string) int {
    prefix := tokens[len(tokens)-1]
    total := 1
    for _, w := range tokens {
        total += len(w)
    }
    nxt := make([][26]int, total)
    cnt := make([]int, total)
    sz := 1
    for i := 0; i < len(tokens)-1; i++ {
        w := tokens[i]
        node := 0
        for j := 0; j < len(w); j++ {
            c := int(w[j] - 'a')
            if nxt[node][c] == 0 {
                nxt[node][c] = sz
                sz++
            }
            node = nxt[node][c]
            cnt[node]++
        }
    }
    node := 0
    for j := 0; j < len(prefix); j++ {
        c := int(prefix[j] - 'a')
        if nxt[node][c] == 0 {
            return 0
        }
        node = nxt[node][c]
    }
    return cnt[node]
}`,
    },
    tests: [
      { stdin: 'apple apply apt banana ap', expectedStdout: '3', isSample: true },
      { stdin: 'cat car cart z', expectedStdout: '0', isSample: true },
      { stdin: 'dog dot dove do', expectedStdout: '3' },
      { stdin: 'a ab abc a', expectedStdout: '3' },
      { stdin: 'hello hello he', expectedStdout: '2' },
      { stdin: 'x x', expectedStdout: '1' },
    ],
  }),

  p({
    ...base,
    slug: 'words-matching-pattern-with-wildcard',
    title: 'One Letter, Any Letter',
    difficulty: 'MEDIUM',
    patternTags: ['trie', 'wildcard', 'backtracking'],
    signatureId: 'fn:strings->strings',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'You are given a list of tokens on one line, separated by spaces.',
      '',
      'The **last** token is a search pattern. Every token before it is a word.',
      '',
      'A word matches the pattern when the two have the **same length** and, at',
      'every position, the pattern character is either the same letter as the word',
      'character or a dot `.`, which matches any single letter.',
      '',
      'Print the matching words on one line, separated by spaces, in',
      '**lexicographically ascending order**. If a word appears twice in the input',
      'and matches, print it twice.',
      '',
      '**Example**',
      '',
      '```',
      'input:  cat car cot dog c.t',
      'output: cat cot',
      '```',
      '',
      '`cat` and `cot` both have `c` first, `t` last and anything in the middle.',
      '`car` fails on the last letter and `dog` fails on the first.',
      '',
      'Guarantees: there are always at least two tokens. Words are one or more',
      'lowercase letters `a`–`z`; the pattern is one or more characters, each a',
      'lowercase letter or `.`.',
      '',
      'The named edge case: when nothing matches, print an **empty line**.',
    ].join('\n'),
    editorialMarkdown: [
      '## Trie with a branching walk',
      '',
      'Without the dot this is a plain trie lookup: follow one edge per character.',
      'The dot is what makes it interesting, because at a dot you do not know which',
      'edge to take — so you take **all of them**, and let the trie throw away the',
      'branches that die.',
      '',
      '```',
      'walk(node, i):',
      '    if i == len(pattern): emit the words ending here',
      '    else if pattern[i] == ".": for every existing child c: walk(child, i+1)',
      '    else: if child(node, pattern[i]) exists: walk(it, i+1)',
      '```',
      '',
      'This is where sharing prefixes actually shows up as a saving. Checking the',
      'words one at a time re-examines the leading `c` of `cat`, `car` and `cot`',
      'three separate times. In the trie that `c` is a single edge, walked once, and',
      'everything below it is explored together. A branch that dies — no child for',
      'the required letter — prunes every word underneath it at once.',
      '',
      'Iterating the children as slots `0..25` gives lexicographic order for free,',
      'which is what makes the output order in the statement achievable without a',
      'sort. Store a count of words ending at each node rather than a flag, so a',
      'duplicated word is emitted the right number of times.',
      '',
      'The quiet mistake is not checking the length. If you stop as soon as the',
      'pattern is exhausted and emit every word in the subtree, then `c.t` matches',
      '`cattle`. It is quiet because the answer still looks plausible and every word',
      'in it does begin the right way — the failure only appears when the word list',
      'happens to contain a longer word sharing a prefix with a shorter one.',
      '',
      'O(total characters) to build. A query with `d` dots can, in the worst case,',
      'branch 26 ways at each of them, so the walk is O(26^d) nodes — the number of',
      'dots is what bounds it, not the number of words.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(tokens) {
  const pattern = tokens[tokens.length - 1];
  let total = 1;
  for (const w of tokens) total += w.length;
  const nxt = Array.from({ length: total }, () => new Array(26).fill(0));
  const ends = new Array(total).fill(0);
  let sz = 1;
  for (let i = 0; i < tokens.length - 1; i++) {
    const w = tokens[i];
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
    }
    ends[node]++;
  }
  const out = [];
  const walk = (node, depth, built) => {
    if (depth === pattern.length) {
      for (let i = 0; i < ends[node]; i++) out.push(built);
      return;
    }
    const ch = pattern[depth];
    if (ch === '.') {
      for (let c = 0; c < 26; c++) {
        if (nxt[node][c] !== 0) {
          walk(nxt[node][c], depth + 1, built + String.fromCharCode(97 + c));
        }
      }
    } else {
      const c = ch.charCodeAt(0) - 97;
      if (nxt[node][c] !== 0) walk(nxt[node][c], depth + 1, built + ch);
    }
  };
  walk(0, 0, '');
  return out;
}`,
      TYPESCRIPT: `function solve(tokens: string[]): string[] {
  const pattern = tokens[tokens.length - 1];
  let total = 1;
  for (const w of tokens) total += w.length;
  const nxt: number[][] = Array.from({ length: total }, () => new Array<number>(26).fill(0));
  const ends: number[] = new Array<number>(total).fill(0);
  let sz = 1;
  for (let i = 0; i < tokens.length - 1; i++) {
    const w = tokens[i];
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
    }
    ends[node]++;
  }
  const out: string[] = [];
  const walk = (node: number, depth: number, built: string): void => {
    if (depth === pattern.length) {
      for (let i = 0; i < ends[node]; i++) out.push(built);
      return;
    }
    const ch = pattern[depth];
    if (ch === '.') {
      for (let c = 0; c < 26; c++) {
        if (nxt[node][c] !== 0) {
          walk(nxt[node][c], depth + 1, built + String.fromCharCode(97 + c));
        }
      }
    } else {
      const c = ch.charCodeAt(0) - 97;
      if (nxt[node][c] !== 0) walk(nxt[node][c], depth + 1, built + ch);
    }
  };
  walk(0, 0, '');
  return out;
}`,
      PYTHON: `def solve(tokens):
    pattern = tokens[-1]
    total = 1
    for w in tokens:
        total += len(w)
    nxt = [[0] * 26 for _ in range(total)]
    ends = [0] * total
    sz = 1
    for w in tokens[:-1]:
        node = 0
        for ch in w:
            c = ord(ch) - 97
            if nxt[node][c] == 0:
                nxt[node][c] = sz
                sz += 1
            node = nxt[node][c]
        ends[node] += 1
    out = []
    stack = [(0, 0, '')]
    while stack:
        node, depth, built = stack.pop()
        if depth == len(pattern):
            for _ in range(ends[node]):
                out.append(built)
            continue
        ch = pattern[depth]
        if ch == '.':
            for c in range(25, -1, -1):
                if nxt[node][c] != 0:
                    stack.append((nxt[node][c], depth + 1, built + chr(97 + c)))
        else:
            c = ord(ch) - 97
            if nxt[node][c] != 0:
                stack.append((nxt[node][c], depth + 1, built + ch))
    return out`,
      JAVA: `    static void collectMatches(int[][] nxt, int[] ends, String pattern, int node, int depth,
                               StringBuilder built, ArrayList<String> out) {
        if (depth == pattern.length()) {
            for (int i = 0; i < ends[node]; i++) out.add(built.toString());
            return;
        }
        char ch = pattern.charAt(depth);
        if (ch == '.') {
            for (int c = 0; c < 26; c++) {
                if (nxt[node][c] != 0) {
                    built.append((char) ('a' + c));
                    collectMatches(nxt, ends, pattern, nxt[node][c], depth + 1, built, out);
                    built.deleteCharAt(built.length() - 1);
                }
            }
        } else {
            int c = ch - 'a';
            if (nxt[node][c] != 0) {
                built.append(ch);
                collectMatches(nxt, ends, pattern, nxt[node][c], depth + 1, built, out);
                built.deleteCharAt(built.length() - 1);
            }
        }
    }

    static String[] solve(String[] tokens) {
        String pattern = tokens[tokens.length - 1];
        int total = 1;
        for (String w : tokens) total += w.length();
        int[][] nxt = new int[total][26];
        int[] ends = new int[total];
        int sz = 1;
        for (int i = 0; i < tokens.length - 1; i++) {
            String w = tokens[i];
            int node = 0;
            for (int j = 0; j < w.length(); j++) {
                int c = w.charAt(j) - 'a';
                if (nxt[node][c] == 0) {
                    nxt[node][c] = sz;
                    sz++;
                }
                node = nxt[node][c];
            }
            ends[node]++;
        }
        ArrayList<String> out = new ArrayList<String>();
        collectMatches(nxt, ends, pattern, 0, 0, new StringBuilder(), out);
        return out.toArray(new String[0]);
    }`,
      CPP: `static void collectMatches(const vector<vector<int> > &nxt, const vector<int> &ends,
                           const string &pattern, int node, int depth,
                           string &built, vector<string> &out) {
    if (depth == (int) pattern.size()) {
        for (int i = 0; i < ends[node]; i++) out.push_back(built);
        return;
    }
    char ch = pattern[depth];
    if (ch == '.') {
        for (int c = 0; c < 26; c++) {
            if (nxt[node][c] != 0) {
                built.push_back((char) ('a' + c));
                collectMatches(nxt, ends, pattern, nxt[node][c], depth + 1, built, out);
                built.erase(built.size() - 1);
            }
        }
    } else {
        int c = ch - 'a';
        if (nxt[node][c] != 0) {
            built.push_back(ch);
            collectMatches(nxt, ends, pattern, nxt[node][c], depth + 1, built, out);
            built.erase(built.size() - 1);
        }
    }
}

vector<string> solve(vector<string> tokens) {
    string pattern = tokens[tokens.size() - 1];
    int total = 1;
    for (size_t i = 0; i < tokens.size(); i++) total += (int) tokens[i].size();
    vector<vector<int> > nxt(total, vector<int>(26, 0));
    vector<int> ends(total, 0);
    int sz = 1;
    for (size_t i = 0; i + 1 < tokens.size(); i++) {
        int node = 0;
        for (size_t j = 0; j < tokens[i].size(); j++) {
            int c = tokens[i][j] - 'a';
            if (nxt[node][c] == 0) {
                nxt[node][c] = sz;
                sz++;
            }
            node = nxt[node][c];
        }
        ends[node]++;
    }
    vector<string> out;
    string built;
    collectMatches(nxt, ends, pattern, 0, 0, built, out);
    return out;
}`,
      GO: `func solve(tokens []string) []string {
    pattern := tokens[len(tokens)-1]
    total := 1
    for _, w := range tokens {
        total += len(w)
    }
    nxt := make([][26]int, total)
    ends := make([]int, total)
    sz := 1
    for i := 0; i < len(tokens)-1; i++ {
        w := tokens[i]
        node := 0
        for j := 0; j < len(w); j++ {
            c := int(w[j] - 'a')
            if nxt[node][c] == 0 {
                nxt[node][c] = sz
                sz++
            }
            node = nxt[node][c]
        }
        ends[node]++
    }
    out := []string{}
    var walk func(node int, depth int, built string)
    walk = func(node int, depth int, built string) {
        if depth == len(pattern) {
            for i := 0; i < ends[node]; i++ {
                out = append(out, built)
            }
            return
        }
        ch := pattern[depth]
        if ch == '.' {
            for c := 0; c < 26; c++ {
                if nxt[node][c] != 0 {
                    walk(nxt[node][c], depth+1, built+string([]byte{byte('a' + c)}))
                }
            }
        } else {
            c := int(ch - 'a')
            if nxt[node][c] != 0 {
                walk(nxt[node][c], depth+1, built+string([]byte{ch}))
            }
        }
    }
    walk(0, 0, "")
    return out
}`,
    },
    tests: [
      { stdin: 'cat car cot dog c.t', expectedStdout: 'cat cot', isSample: true },
      { stdin: 'abc abd ab ...', expectedStdout: 'abc abd', isSample: true },
      { stdin: 'bad dad mad .ad', expectedStdout: 'bad dad mad' },
      { stdin: 'hello world h....', expectedStdout: 'hello' },
      { stdin: 'aa ab ba zz', expectedStdout: '' },
      { stdin: 'xyz xyz x.z', expectedStdout: 'xyz xyz' },
    ],
  }),

  p({
    ...base,
    slug: 'shortest-unique-prefixes',
    title: 'Just Enough To Tell Them Apart',
    difficulty: 'MEDIUM',
    patternTags: ['trie', 'prefix', 'counting'],
    signatureId: 'fn:strings->strings',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'You are given a list of words on one line, separated by spaces.',
      '',
      'For each word, find the **shortest** prefix of it that no other word in the',
      'list also starts with. Print those prefixes on one line, separated by spaces,',
      'in the **same order as the input words**.',
      '',
      '**Example**',
      '',
      '```',
      'input:  dog cat apple',
      'output: d c a',
      '```',
      '',
      'One letter is already enough here — no two words share a first letter.',
      '',
      'Guarantees: there is at least one word; every word is one or more lowercase',
      'letters `a`–`z`; all the words are distinct; and no word is a prefix of',
      'another word. Those last two together mean a unique prefix always exists.',
      '',
      'The named edge case: when two words agree until the very end — `abc abd abe`',
      '— the shortest unique prefix is the whole word, and the whole word is what',
      'you print. A list of one word answers with that word’s first letter.',
    ].join('\n'),
    editorialMarkdown: [
      '## Trie with a pass-through counter, read on the way out',
      '',
      'Same structure as counting words by prefix, asked backwards. Insert every',
      'word and increment a counter on every node the insertion passes through, so',
      '`count[node]` ends up holding how many words share the path to that node.',
      '',
      'Now walk each word again from the root. The first node you reach whose count',
      'is `1` is, by definition, a prefix that exactly one word has — and since you',
      'are walking that word, the word is this one. Stop there.',
      '',
      '```',
      'node = root',
      'for i, ch in word:',
      '    node = child(node, ch)',
      '    if count[node] == 1: return word[0 .. i]',
      'return word',
      '```',
      '',
      'The counts are the whole trick, and they exist only because the prefixes are',
      'shared. Comparing every word against every other word to find where they',
      'first differ is O(n²·m); the trie collapses all of those comparisons into one',
      'number per node, computed during a single pass over the input.',
      '',
      'Why the *first* count of 1 is the shortest such prefix: counts never increase',
      'as you descend — every word through a child also went through its parent — so',
      'once it hits 1 it stays 1, and the first place it does is the shortest.',
      '',
      'The quiet mistake is counting words that *end* at a node instead of words',
      'that pass through it. On `cat car` the terminal counts are 1 at `cat` and 1',
      'at `car` and 0 everywhere above, so that version answers `c c` — two',
      'identical prefixes, which is exactly what the problem forbids. It is quiet',
      'because on a list of words with distinct first letters both versions give the',
      'same answer.',
      '',
      'O(total characters) to build and O(total characters) to re-walk, so the total',
      'input length is what bounds it. Space is O(total characters) of nodes.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(words) {
  let total = 1;
  for (const w of words) total += w.length;
  const nxt = Array.from({ length: total }, () => new Array(26).fill(0));
  const cnt = new Array(total).fill(0);
  let sz = 1;
  for (const w of words) {
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
      cnt[node]++;
    }
  }
  const out = [];
  for (const w of words) {
    let node = 0;
    let taken = w;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      node = nxt[node][c];
      if (cnt[node] === 1) {
        taken = w.slice(0, j + 1);
        break;
      }
    }
    out.push(taken);
  }
  return out;
}`,
      TYPESCRIPT: `function solve(words: string[]): string[] {
  let total = 1;
  for (const w of words) total += w.length;
  const nxt: number[][] = Array.from({ length: total }, () => new Array<number>(26).fill(0));
  const cnt: number[] = new Array<number>(total).fill(0);
  let sz = 1;
  for (const w of words) {
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
      cnt[node]++;
    }
  }
  const out: string[] = [];
  for (const w of words) {
    let node = 0;
    let taken = w;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      node = nxt[node][c];
      if (cnt[node] === 1) {
        taken = w.slice(0, j + 1);
        break;
      }
    }
    out.push(taken);
  }
  return out;
}`,
      PYTHON: `def solve(words):
    total = 1
    for w in words:
        total += len(w)
    nxt = [[0] * 26 for _ in range(total)]
    cnt = [0] * total
    sz = 1
    for w in words:
        node = 0
        for ch in w:
            c = ord(ch) - 97
            if nxt[node][c] == 0:
                nxt[node][c] = sz
                sz += 1
            node = nxt[node][c]
            cnt[node] += 1
    out = []
    for w in words:
        node = 0
        taken = w
        for j in range(len(w)):
            c = ord(w[j]) - 97
            node = nxt[node][c]
            if cnt[node] == 1:
                taken = w[:j + 1]
                break
        out.append(taken)
    return out`,
      JAVA: `    static String[] solve(String[] words) {
        int total = 1;
        for (String w : words) total += w.length();
        int[][] nxt = new int[total][26];
        int[] cnt = new int[total];
        int sz = 1;
        for (String w : words) {
            int node = 0;
            for (int j = 0; j < w.length(); j++) {
                int c = w.charAt(j) - 'a';
                if (nxt[node][c] == 0) {
                    nxt[node][c] = sz;
                    sz++;
                }
                node = nxt[node][c];
                cnt[node]++;
            }
        }
        String[] out = new String[words.length];
        for (int i = 0; i < words.length; i++) {
            String w = words[i];
            int node = 0;
            String taken = w;
            for (int j = 0; j < w.length(); j++) {
                int c = w.charAt(j) - 'a';
                node = nxt[node][c];
                if (cnt[node] == 1) {
                    taken = w.substring(0, j + 1);
                    break;
                }
            }
            out[i] = taken;
        }
        return out;
    }`,
      CPP: `vector<string> solve(vector<string> words) {
    int total = 1;
    for (size_t i = 0; i < words.size(); i++) total += (int) words[i].size();
    vector<vector<int> > nxt(total, vector<int>(26, 0));
    vector<int> cnt(total, 0);
    int sz = 1;
    for (size_t i = 0; i < words.size(); i++) {
        int node = 0;
        for (size_t j = 0; j < words[i].size(); j++) {
            int c = words[i][j] - 'a';
            if (nxt[node][c] == 0) {
                nxt[node][c] = sz;
                sz++;
            }
            node = nxt[node][c];
            cnt[node]++;
        }
    }
    vector<string> out;
    for (size_t i = 0; i < words.size(); i++) {
        const string &w = words[i];
        int node = 0;
        string taken = w;
        for (size_t j = 0; j < w.size(); j++) {
            int c = w[j] - 'a';
            node = nxt[node][c];
            if (cnt[node] == 1) {
                taken = w.substr(0, j + 1);
                break;
            }
        }
        out.push_back(taken);
    }
    return out;
}`,
      GO: `func solve(words []string) []string {
    total := 1
    for _, w := range words {
        total += len(w)
    }
    nxt := make([][26]int, total)
    cnt := make([]int, total)
    sz := 1
    for _, w := range words {
        node := 0
        for j := 0; j < len(w); j++ {
            c := int(w[j] - 'a')
            if nxt[node][c] == 0 {
                nxt[node][c] = sz
                sz++
            }
            node = nxt[node][c]
            cnt[node]++
        }
    }
    out := []string{}
    for _, w := range words {
        node := 0
        taken := w
        for j := 0; j < len(w); j++ {
            c := int(w[j] - 'a')
            node = nxt[node][c]
            if cnt[node] == 1 {
                taken = w[:j+1]
                break
            }
        }
        out = append(out, taken)
    }
    return out
}`,
    },
    tests: [
      { stdin: 'dog cat apple', expectedStdout: 'd c a', isSample: true },
      { stdin: 'zebra zoo', expectedStdout: 'ze zo', isSample: true },
      { stdin: 'abc abd abe', expectedStdout: 'abc abd abe' },
      { stdin: 'hello', expectedStdout: 'h' },
      { stdin: 'bear bell bid', expectedStdout: 'bea bel bi' },
      { stdin: 'apple apply', expectedStdout: 'apple apply' },
    ],
  }),

  p({
    ...base,
    slug: 'count-distinct-prefixes',
    title: 'Count The Branches',
    difficulty: 'MEDIUM',
    patternTags: ['trie', 'prefix', 'counting'],
    signatureId: 'fn:strings->int',
    avgSolveSeconds: 600,
    promptMarkdown: [
      'You are given a list of words on one line, separated by spaces.',
      '',
      'Count the **distinct non-empty prefixes** across the whole list. A prefix is',
      'any opening run of a word, including the word itself. Two words that share a',
      'prefix contribute it only once.',
      '',
      '**Example**',
      '',
      '```',
      'input:  cat car',
      'output: 4',
      '```',
      '',
      'The prefixes are `c`, `ca`, `cat`, `car`. `c` and `ca` come from both words',
      'but are counted once each.',
      '',
      'Guarantees: there is at least one word, and every word is one or more',
      'lowercase letters `a`–`z`.',
      '',
      'The named edge case: a repeated word — `dog dog` — contributes nothing the',
      'second time, so the answer is `3`.',
    ].join('\n'),
    editorialMarkdown: [
      '## Trie node counting',
      '',
      'The answer is the number of nodes in the trie, not counting the root. That',
      'is not a trick, it is the definition read out loud: a trie node *is* a',
      'distinct prefix, since the path from the root to it spells that prefix and no',
      'two different prefixes reach the same node.',
      '',
      'So you do not need to collect anything or deduplicate anything. Insert every',
      'word and count how many times you had to create a new child.',
      '',
      '```',
      'created = 0',
      'for w in words:',
      '    node = root',
      '    for ch in w:',
      '        if child(node, ch) is missing: create it; created += 1',
      '        node = child(node, ch)',
      'return created',
      '```',
      '',
      'The alternative is to put every prefix of every word into a hash set, which',
      'is also correct but builds O(total characters) *strings* of average length',
      'O(m) — that is O(n·m²) characters of work and memory. The trie is where the',
      'sharing lives: the prefix `ca` exists once as an edge, not once per word that',
      'happens to start with it.',
      '',
      'The quiet mistake is counting the root. It is a real node, but it spells the',
      'empty prefix, and the statement asks for non-empty ones. The answer comes out',
      'exactly one too high on every input, which is the kind of error that survives',
      'a glance at the output because the output still looks like a plausible count.',
      '',
      'The second quiet one is counting a duplicated word twice, which happens if',
      'you count characters inserted rather than nodes created.',
      '',
      'O(total characters) time and O(total characters) nodes, and the total input',
      'length is what bounds both — there is no second pass.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(words) {
  let total = 1;
  for (const w of words) total += w.length;
  const nxt = Array.from({ length: total }, () => new Array(26).fill(0));
  let sz = 1;
  for (const w of words) {
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
    }
  }
  return sz - 1;
}`,
      TYPESCRIPT: `function solve(words: string[]): number {
  let total = 1;
  for (const w of words) total += w.length;
  const nxt: number[][] = Array.from({ length: total }, () => new Array<number>(26).fill(0));
  let sz = 1;
  for (const w of words) {
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
    }
  }
  return sz - 1;
}`,
      PYTHON: `def solve(words):
    total = 1
    for w in words:
        total += len(w)
    nxt = [[0] * 26 for _ in range(total)]
    sz = 1
    for w in words:
        node = 0
        for ch in w:
            c = ord(ch) - 97
            if nxt[node][c] == 0:
                nxt[node][c] = sz
                sz += 1
            node = nxt[node][c]
    return sz - 1`,
      JAVA: `    static int solve(String[] words) {
        int total = 1;
        for (String w : words) total += w.length();
        int[][] nxt = new int[total][26];
        int sz = 1;
        for (String w : words) {
            int node = 0;
            for (int j = 0; j < w.length(); j++) {
                int c = w.charAt(j) - 'a';
                if (nxt[node][c] == 0) {
                    nxt[node][c] = sz;
                    sz++;
                }
                node = nxt[node][c];
            }
        }
        return sz - 1;
    }`,
      CPP: `int solve(vector<string> words) {
    int total = 1;
    for (size_t i = 0; i < words.size(); i++) total += (int) words[i].size();
    vector<vector<int> > nxt(total, vector<int>(26, 0));
    int sz = 1;
    for (size_t i = 0; i < words.size(); i++) {
        int node = 0;
        for (size_t j = 0; j < words[i].size(); j++) {
            int c = words[i][j] - 'a';
            if (nxt[node][c] == 0) {
                nxt[node][c] = sz;
                sz++;
            }
            node = nxt[node][c];
        }
    }
    return sz - 1;
}`,
      GO: `func solve(words []string) int {
    total := 1
    for _, w := range words {
        total += len(w)
    }
    nxt := make([][26]int, total)
    sz := 1
    for _, w := range words {
        node := 0
        for j := 0; j < len(w); j++ {
            c := int(w[j] - 'a')
            if nxt[node][c] == 0 {
                nxt[node][c] = sz
                sz++
            }
            node = nxt[node][c]
        }
    }
    return sz - 1
}`,
    },
    tests: [
      { stdin: 'cat car', expectedStdout: '4', isSample: true },
      { stdin: 'dog dog', expectedStdout: '3', isSample: true },
      { stdin: 'a ab abc', expectedStdout: '3' },
      { stdin: 'a b c', expectedStdout: '3' },
      { stdin: 'abc def', expectedStdout: '6' },
      { stdin: 'x', expectedStdout: '1' },
    ],
  }),

  p({
    ...base,
    slug: 'longest-word-built-one-letter-at-a-time',
    title: 'Grown One Letter At A Time',
    difficulty: 'HARD',
    patternTags: ['trie', 'prefix', 'tie-break'],
    signatureId: 'fn:strings->string',
    avgSolveSeconds: 900,
    promptMarkdown: [
      'You are given a list of words on one line, separated by spaces.',
      '',
      'A word is **buildable** when every one of its non-empty prefixes shorter than',
      'itself is also a word in the list. So `apple` is buildable if `a`, `ap`,',
      '`app` and `appl` are all present. Every single-letter word is buildable,',
      'since it has no shorter prefixes to check.',
      '',
      'Print the longest buildable word. If several buildable words tie for longest,',
      'print the **lexicographically smallest** of them.',
      '',
      '**Example**',
      '',
      '```',
      'input:  a b ap app appl apple',
      'output: apple',
      '```',
      '',
      '`apple` needs `appl`, `app`, `ap` and `a`, and all four are in the list.',
      '',
      'Guarantees: there is at least one word, and every word is one or more',
      'lowercase letters `a`–`z`. Words may repeat; a repeat changes nothing.',
      '',
      'The named edge cases: when no word is buildable — `cat dog`, where neither',
      '`c` nor `d` is present — print an **empty line**. When two buildable words',
      'are the same length, such as `ab` and `ba`, the tie-break above picks `ab`.',
    ].join('\n'),
    editorialMarkdown: [
      '## Trie plus a walk that checks every step',
      '',
      'The condition is about a chain, so check it as a chain. Insert every word',
      'into a trie and mark the node where each one ends. A word is buildable',
      'exactly when the walk from the root down to its last node passes only through',
      'marked nodes — every intermediate node spells a prefix, and the mark says',
      'that prefix is itself a word.',
      '',
      '```',
      'buildable(w):',
      '    node = root',
      '    for i, ch in w:',
      '        node = child(node, ch)              # always exists: w was inserted',
      '        if i < len(w) - 1 and not isWord[node]: return false',
      '    return true',
      '```',
      '',
      'This is the payoff of sharing prefixes. Checking membership of each prefix in',
      'a hash set means rebuilding `a`, `ap`, `app`, `appl` as separate strings and',
      'hashing each — O(m²) characters per word. In the trie those prefixes are the',
      'nodes you are already standing on as you walk, so the check costs one array',
      'read per character and the repeated O(m) scans collapse into one walk of',
      'length m.',
      '',
      'For the tie-break, keep the best answer and replace it when a candidate is',
      'strictly longer, or the same length and lexicographically smaller. Do not sort',
      'anything.',
      '',
      'The quiet mistake is checking the word’s own final node for the mark and',
      'treating a failure as a failure. Every word in the list is marked at its end,',
      'so that check always passes and does no harm — but the mirror error, checking',
      '`i <= len(w) - 1` in a version where the mark is only set for *some* words,',
      'silently drops candidates. The commoner one is forgetting that a single-letter',
      'word is buildable, so a solver requires its length-0 prefix to be a word and',
      'answers empty on `a b ap app`. It is quiet because it produces a valid-looking',
      'shorter answer rather than an error.',
      '',
      'O(total characters) to build and O(total characters) to check every word, so',
      'the total input length bounds it. Space is O(total characters) of nodes.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(words) {
  let total = 1;
  for (const w of words) total += w.length;
  const nxt = Array.from({ length: total }, () => new Array(26).fill(0));
  const isWord = new Array(total).fill(false);
  let sz = 1;
  for (const w of words) {
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
    }
    isWord[node] = true;
  }
  let best = '';
  for (const w of words) {
    let node = 0;
    let ok = true;
    for (let j = 0; j < w.length - 1; j++) {
      node = nxt[node][w.charCodeAt(j) - 97];
      if (!isWord[node]) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    if (w.length > best.length || (w.length === best.length && w < best)) best = w;
  }
  return best;
}`,
      TYPESCRIPT: `function solve(words: string[]): string {
  let total = 1;
  for (const w of words) total += w.length;
  const nxt: number[][] = Array.from({ length: total }, () => new Array<number>(26).fill(0));
  const isWord: boolean[] = new Array<boolean>(total).fill(false);
  let sz = 1;
  for (const w of words) {
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
    }
    isWord[node] = true;
  }
  let best = '';
  for (const w of words) {
    let node = 0;
    let ok = true;
    for (let j = 0; j < w.length - 1; j++) {
      node = nxt[node][w.charCodeAt(j) - 97];
      if (!isWord[node]) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    if (w.length > best.length || (w.length === best.length && w < best)) best = w;
  }
  return best;
}`,
      PYTHON: `def solve(words):
    total = 1
    for w in words:
        total += len(w)
    nxt = [[0] * 26 for _ in range(total)]
    is_word = [False] * total
    sz = 1
    for w in words:
        node = 0
        for ch in w:
            c = ord(ch) - 97
            if nxt[node][c] == 0:
                nxt[node][c] = sz
                sz += 1
            node = nxt[node][c]
        is_word[node] = True
    best = ''
    for w in words:
        node = 0
        ok = True
        for j in range(len(w) - 1):
            node = nxt[node][ord(w[j]) - 97]
            if not is_word[node]:
                ok = False
                break
        if not ok:
            continue
        if len(w) > len(best) or (len(w) == len(best) and w < best):
            best = w
    return best`,
      JAVA: `    static String solve(String[] words) {
        int total = 1;
        for (String w : words) total += w.length();
        int[][] nxt = new int[total][26];
        boolean[] isWord = new boolean[total];
        int sz = 1;
        for (String w : words) {
            int node = 0;
            for (int j = 0; j < w.length(); j++) {
                int c = w.charAt(j) - 'a';
                if (nxt[node][c] == 0) {
                    nxt[node][c] = sz;
                    sz++;
                }
                node = nxt[node][c];
            }
            isWord[node] = true;
        }
        String best = "";
        for (String w : words) {
            int node = 0;
            boolean ok = true;
            for (int j = 0; j < w.length() - 1; j++) {
                node = nxt[node][w.charAt(j) - 'a'];
                if (!isWord[node]) {
                    ok = false;
                    break;
                }
            }
            if (!ok) continue;
            if (w.length() > best.length() || (w.length() == best.length() && w.compareTo(best) < 0)) {
                best = w;
            }
        }
        return best;
    }`,
      CPP: `string solve(vector<string> words) {
    int total = 1;
    for (size_t i = 0; i < words.size(); i++) total += (int) words[i].size();
    vector<vector<int> > nxt(total, vector<int>(26, 0));
    vector<char> isWord(total, 0);
    int sz = 1;
    for (size_t i = 0; i < words.size(); i++) {
        int node = 0;
        for (size_t j = 0; j < words[i].size(); j++) {
            int c = words[i][j] - 'a';
            if (nxt[node][c] == 0) {
                nxt[node][c] = sz;
                sz++;
            }
            node = nxt[node][c];
        }
        isWord[node] = 1;
    }
    string best = "";
    for (size_t i = 0; i < words.size(); i++) {
        const string &w = words[i];
        int node = 0;
        bool ok = true;
        for (size_t j = 0; j + 1 < w.size(); j++) {
            node = nxt[node][w[j] - 'a'];
            if (!isWord[node]) {
                ok = false;
                break;
            }
        }
        if (!ok) continue;
        if (w.size() > best.size() || (w.size() == best.size() && w < best)) best = w;
    }
    return best;
}`,
      GO: `func solve(words []string) string {
    total := 1
    for _, w := range words {
        total += len(w)
    }
    nxt := make([][26]int, total)
    isWord := make([]bool, total)
    sz := 1
    for _, w := range words {
        node := 0
        for j := 0; j < len(w); j++ {
            c := int(w[j] - 'a')
            if nxt[node][c] == 0 {
                nxt[node][c] = sz
                sz++
            }
            node = nxt[node][c]
        }
        isWord[node] = true
    }
    best := ""
    for _, w := range words {
        node := 0
        ok := true
        for j := 0; j < len(w)-1; j++ {
            node = nxt[node][int(w[j]-'a')]
            if !isWord[node] {
                ok = false
                break
            }
        }
        if !ok {
            continue
        }
        if len(w) > len(best) || (len(w) == len(best) && w < best) {
            best = w
        }
    }
    return best
}`,
    },
    tests: [
      { stdin: 'a b ap app appl apple', expectedStdout: 'apple', isSample: true },
      { stdin: 'cat dog', expectedStdout: '', isSample: true },
      { stdin: 'w wo wor worl world a ap', expectedStdout: 'world' },
      { stdin: 'a b ab ba', expectedStdout: 'ab' },
      { stdin: 'x', expectedStdout: 'x' },
      { stdin: 'a at ate an ant ants', expectedStdout: 'ants' },
    ],
  }),

  p({
    ...base,
    slug: 'replace-words-with-roots',
    title: 'Cut Them Back To The Root',
    difficulty: 'HARD',
    patternTags: ['trie', 'prefix', 'strings'],
    signatureId: 'fn:strings->strings',
    avgSolveSeconds: 900,
    promptMarkdown: [
      'You are given a list of tokens on one line, separated by spaces, containing',
      'exactly one `|` token.',
      '',
      'Everything **before** the `|` is a root. Everything **after** it is the',
      'sentence.',
      '',
      'For each word of the sentence, if any root is a prefix of it, replace the word',
      'with the **shortest** such root. If no root is a prefix of it, leave the word',
      'alone. Print the resulting sentence on one line, words separated by spaces,',
      'in the original order.',
      '',
      '**Example**',
      '',
      '```',
      'input:  cat bat rat | the cattle was rattled by the battery',
      'output: the cat was rat by the bat',
      '```',
      '',
      '`cattle` starts with the root `cat`, `rattled` with `rat`, `battery` with',
      '`bat`. `the`, `was` and `by` match no root and stay as they are.',
      '',
      'Guarantees: the `|` appears exactly once. Roots and sentence words are one or',
      'more lowercase letters `a`–`z`. A word that is exactly equal to a root',
      'becomes that root, which is to say it does not change.',
      '',
      'The named edge cases: when the root list is empty — the `|` comes first — the',
      'sentence is printed unchanged. When a word matches two roots, such as `cat`',
      'and `catt` both prefixing `cattle`, the shorter one `cat` wins.',
    ].join('\n'),
    editorialMarkdown: [
      '## Trie lookup that stops at the first word-end',
      '',
      'Put every root into a trie and mark the node where each root ends. Now',
      'replacing a sentence word is one walk: descend character by character, and',
      'the **first** marked node you land on spells the shortest root that prefixes',
      'the word. Stop immediately. If the walk falls off the trie — no child for the',
      'next character — no root prefixes the word and you keep it.',
      '',
      '```',
      'reduce(w):',
      '    node = root',
      '    for i, ch in w:',
      '        if child(node, ch) missing: return w',
      '        node = child(node, ch)',
      '        if isRoot[node]: return w[0 .. i]',
      '    return w',
      '```',
      '',
      'Why the first mark is the shortest: you are descending, so marks are',
      'encountered in increasing length. The shortest-root rule is free — it is just',
      '"do not keep walking".',
      '',
      'The alternative is, for every sentence word, to test every root with a',
      '`startsWith`. That is O(words × roots × length). The trie makes the cost',
      'depend on the word alone: all the roots beginning `ca` share one edge, so a',
      'word that does not begin `ca` rules out every one of them by failing a single',
      'array lookup. That is exactly what sharing prefixes buys — repeated O(m)',
      'scans over the root list become one walk of length m.',
      '',
      'The quiet mistake is walking the whole word and then taking the *last* mark',
      'you saw, or worse, taking the longest matching root because that felt like',
      'the more thorough answer. On a root list where no root is a prefix of another',
      'root — which is most root lists, and certainly every one you would type by',
      'hand — the two rules agree exactly, so the bug never shows up until a list',
      'contains both `cat` and `catt`.',
      '',
      'O(total root characters) to build and O(total sentence characters) to reduce.',
      'The sentence length bounds the query phase; the root list bounds the memory,',
      'at O(total root characters) nodes.',
    ].join('\n'),
    referenceSolution: {
      JAVASCRIPT: `function solve(tokens) {
  let bar = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === '|') bar = i;
  }
  let total = 1;
  for (let i = 0; i < bar; i++) total += tokens[i].length;
  const nxt = Array.from({ length: total }, () => new Array(26).fill(0));
  const isRoot = new Array(total).fill(false);
  let sz = 1;
  for (let i = 0; i < bar; i++) {
    const w = tokens[i];
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
    }
    isRoot[node] = true;
  }
  const out = [];
  for (let i = bar + 1; i < tokens.length; i++) {
    const w = tokens[i];
    let node = 0;
    let taken = w;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) break;
      node = nxt[node][c];
      if (isRoot[node]) {
        taken = w.slice(0, j + 1);
        break;
      }
    }
    out.push(taken);
  }
  return out;
}`,
      TYPESCRIPT: `function solve(tokens: string[]): string[] {
  let bar = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === '|') bar = i;
  }
  let total = 1;
  for (let i = 0; i < bar; i++) total += tokens[i].length;
  const nxt: number[][] = Array.from({ length: total }, () => new Array<number>(26).fill(0));
  const isRoot: boolean[] = new Array<boolean>(total).fill(false);
  let sz = 1;
  for (let i = 0; i < bar; i++) {
    const w = tokens[i];
    let node = 0;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) {
        nxt[node][c] = sz;
        sz++;
      }
      node = nxt[node][c];
    }
    isRoot[node] = true;
  }
  const out: string[] = [];
  for (let i = bar + 1; i < tokens.length; i++) {
    const w = tokens[i];
    let node = 0;
    let taken = w;
    for (let j = 0; j < w.length; j++) {
      const c = w.charCodeAt(j) - 97;
      if (nxt[node][c] === 0) break;
      node = nxt[node][c];
      if (isRoot[node]) {
        taken = w.slice(0, j + 1);
        break;
      }
    }
    out.push(taken);
  }
  return out;
}`,
      PYTHON: `def solve(tokens):
    bar = 0
    for i in range(len(tokens)):
        if tokens[i] == '|':
            bar = i
    total = 1
    for i in range(bar):
        total += len(tokens[i])
    nxt = [[0] * 26 for _ in range(total)]
    is_root = [False] * total
    sz = 1
    for i in range(bar):
        w = tokens[i]
        node = 0
        for ch in w:
            c = ord(ch) - 97
            if nxt[node][c] == 0:
                nxt[node][c] = sz
                sz += 1
            node = nxt[node][c]
        is_root[node] = True
    out = []
    for i in range(bar + 1, len(tokens)):
        w = tokens[i]
        node = 0
        taken = w
        for j in range(len(w)):
            c = ord(w[j]) - 97
            if nxt[node][c] == 0:
                break
            node = nxt[node][c]
            if is_root[node]:
                taken = w[:j + 1]
                break
        out.append(taken)
    return out`,
      JAVA: `    static String[] solve(String[] tokens) {
        int bar = 0;
        for (int i = 0; i < tokens.length; i++) {
            if (tokens[i].equals("|")) bar = i;
        }
        int total = 1;
        for (int i = 0; i < bar; i++) total += tokens[i].length();
        int[][] nxt = new int[total][26];
        boolean[] isRoot = new boolean[total];
        int sz = 1;
        for (int i = 0; i < bar; i++) {
            String w = tokens[i];
            int node = 0;
            for (int j = 0; j < w.length(); j++) {
                int c = w.charAt(j) - 'a';
                if (nxt[node][c] == 0) {
                    nxt[node][c] = sz;
                    sz++;
                }
                node = nxt[node][c];
            }
            isRoot[node] = true;
        }
        ArrayList<String> out = new ArrayList<String>();
        for (int i = bar + 1; i < tokens.length; i++) {
            String w = tokens[i];
            int node = 0;
            String taken = w;
            for (int j = 0; j < w.length(); j++) {
                int c = w.charAt(j) - 'a';
                if (nxt[node][c] == 0) break;
                node = nxt[node][c];
                if (isRoot[node]) {
                    taken = w.substring(0, j + 1);
                    break;
                }
            }
            out.add(taken);
        }
        return out.toArray(new String[0]);
    }`,
      CPP: `vector<string> solve(vector<string> tokens) {
    int bar = 0;
    for (size_t i = 0; i < tokens.size(); i++) {
        if (tokens[i] == "|") bar = (int) i;
    }
    int total = 1;
    for (int i = 0; i < bar; i++) total += (int) tokens[i].size();
    vector<vector<int> > nxt(total, vector<int>(26, 0));
    vector<char> isRoot(total, 0);
    int sz = 1;
    for (int i = 0; i < bar; i++) {
        const string &w = tokens[i];
        int node = 0;
        for (size_t j = 0; j < w.size(); j++) {
            int c = w[j] - 'a';
            if (nxt[node][c] == 0) {
                nxt[node][c] = sz;
                sz++;
            }
            node = nxt[node][c];
        }
        isRoot[node] = 1;
    }
    vector<string> out;
    for (size_t i = (size_t) bar + 1; i < tokens.size(); i++) {
        const string &w = tokens[i];
        int node = 0;
        string taken = w;
        for (size_t j = 0; j < w.size(); j++) {
            int c = w[j] - 'a';
            if (nxt[node][c] == 0) break;
            node = nxt[node][c];
            if (isRoot[node]) {
                taken = w.substr(0, j + 1);
                break;
            }
        }
        out.push_back(taken);
    }
    return out;
}`,
      GO: `func solve(tokens []string) []string {
    bar := 0
    for i := 0; i < len(tokens); i++ {
        if tokens[i] == "|" {
            bar = i
        }
    }
    total := 1
    for i := 0; i < bar; i++ {
        total += len(tokens[i])
    }
    nxt := make([][26]int, total)
    isRoot := make([]bool, total)
    sz := 1
    for i := 0; i < bar; i++ {
        w := tokens[i]
        node := 0
        for j := 0; j < len(w); j++ {
            c := int(w[j] - 'a')
            if nxt[node][c] == 0 {
                nxt[node][c] = sz
                sz++
            }
            node = nxt[node][c]
        }
        isRoot[node] = true
    }
    out := []string{}
    for i := bar + 1; i < len(tokens); i++ {
        w := tokens[i]
        node := 0
        taken := w
        for j := 0; j < len(w); j++ {
            c := int(w[j] - 'a')
            if nxt[node][c] == 0 {
                break
            }
            node = nxt[node][c]
            if isRoot[node] {
                taken = w[:j+1]
                break
            }
        }
        out = append(out, taken)
    }
    return out
}`,
    },
    tests: [
      {
        stdin: 'cat bat rat | the cattle was rattled by the battery',
        expectedStdout: 'the cat was rat by the bat',
        isSample: true,
      },
      { stdin: 'a b c | aaa bbb ccc ddd', expectedStdout: 'a b c ddd', isSample: true },
      { stdin: '| hello world', expectedStdout: 'hello world' },
      { stdin: 'catt cat | the cattle', expectedStdout: 'the cat' },
      { stdin: 'ab | ab abc b', expectedStdout: 'ab ab b' },
      { stdin: 'x | x', expectedStdout: 'x' },
    ],
  }),
];
