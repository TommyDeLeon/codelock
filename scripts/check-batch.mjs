#!/usr/bin/env node
/**
 * Pre-judge structural check for an authored batch.
 *
 * The judge is the real gate, but it costs ~28 runs per problem and answers
 * ~40 minutes later. Every defect below has actually shipped in a batch and is
 * cheap to catch here: a shared reference solution means two problems are the
 * same task, and a missing language means someone's debrief is empty.
 *
 * Usage: node scripts/check-batch.mjs apps/api/src/corpus/problems/tier1-graphs.ts
 */
import { readFileSync } from 'node:fs';

/**
 * The two vocabularies a batch can silently get wrong.
 *
 * Both were found the expensive way. A batch used `patternFamily: 'HEAP'` when
 * the enum member is `HEAP_PRIORITY_QUEUE`; the judge ran all 1782 of its
 * submissions, every one passed, and then Prisma rejected the whole write —
 * forty minutes for nothing. Another invented `fn:tree,int->bool`, which would
 * have failed at driver generation. Neither is visible to any other check
 * here, and both cost a full measurement round trip.
 */
const VALID_SIGNATURES = new Set(
  [
    ...readFileSync('apps/api/src/corpus/signatures.ts', 'utf8').matchAll(
      /'((?:fn|cls):[^']*)'/g,
    ),
  ].map((m) => m[1]),
);
const VALID_FAMILIES = new Set(
  (
    readFileSync('apps/api/prisma/schema.prisma', 'utf8').match(
      /enum PatternFamily \{([^}]*)\}/,
    )?.[1] ?? ''
  )
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[A-Z][A-Z0-9_]*$/.test(l)),
);

const LANGS = ['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CPP', 'GO'];
let bad = 0;
const fail = (m) => { console.log(`  FAIL ${m}`); bad++; };

for (const file of process.argv.slice(2)) {
  const src = readFileSync(file, 'utf8');
  console.log(`\n== ${file}`);

  const slugs = [...src.matchAll(/slug: *'([a-z0-9-]+)'/g)].map((m) => m[1]);
  console.log(`  problems: ${slugs.length}`);
  const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dupSlugs.length) fail(`duplicate slugs in file: ${[...new Set(dupSlugs)].join(', ')}`);

  // A reference solution reused by two problems means they are one problem.
  // `referenceSolution: makeSix(...)` is a factory call producing a fresh set;
  // `referenceSolution: mergeSolutions` without parens is a shared object, which
  // means two problems are literally the same task.
  const refs = [...src.matchAll(/referenceSolution: *([A-Za-z_$][\w$]*)(\s*\()?/g)]
    .filter((m) => !m[2])
    .map((m) => m[1]);
  const shared = refs.filter((r, i) => refs.indexOf(r) !== i);
  if (shared.length) fail(`reference solutions shared by >1 problem: ${[...new Set(shared)].join(', ')}`);

  // Inline solution objects are counted separately; either form is fine.
  const inline = (src.match(/referenceSolution: *(\{|[A-Za-z_$][\w$]*\s*\()/g) || []).length;
  if (refs.length + inline !== slugs.length) {
    fail(`${slugs.length} problems but ${refs.length + inline} referenceSolution fields`);
  }

  // A file may build its six-language objects through a factory
  // (`const six = (JS, TS, PY, JAVA, CPP, GO) => ({...})`). Then each language
  // name appears literally once no matter how many problems there are, so the
  // per-language count means nothing and the set count above is the real check.
  // Every language must appear, and (when solutions are written out per problem
  // rather than built by a factory) once per problem. A factory makes each name
  // appear a single time regardless of count, so 1 is accepted; the set-count
  // check above is what proves one solution set per problem either way.
  for (const lang of LANGS) {
    const n = (src.match(new RegExp(lang + ':', 'g')) || []).length;
    if (n === 0) fail(`${lang}: missing entirely`);
    else if (n > 1 && n < slugs.length) {
      fail(`${lang}: ${n} solutions for ${slugs.length} problems`);
    }
  }

  // The factory allowance above has a hole, and a batch has already fallen
  // through it. A legitimate factory is a passthrough — `six(JS, TS, PY, JAVA,
  // CPP, GO)`, six parameters, one real solution per language per call. A
  // factory taking *fewer* than six parameters cannot be receiving six
  // solutions, so every problem calling it gets the same program. One batch
  // passed every check above with `six(tag)` returning a single traversal for
  // all twelve problems, distinguished only by a `/* ${tag} */` comment; a
  // sibling shipped `six(kind)` as a dispatcher that returned 0 for the seven
  // kinds it never implemented. Both read as authored and neither was.
  //
  // Tier 0.5 is the deliberate exception: a batch there implements one data
  // structure and every problem is an operation log against it.
  const tier = src.match(/tier: *'([A-Z_0-9]+)'/)?.[1];
  if (tier !== 'TIER_0_5') {
    const factoryUse = new Map();
    for (const m of src.matchAll(/referenceSolution: *([A-Za-z_$][\w$]*) *\(/g)) {
      factoryUse.set(m[1], (factoryUse.get(m[1]) ?? 0) + 1);
    }
    for (const [name, uses] of factoryUse) {
      if (uses < 2) continue;

      // Declared arity is not enough on its own. A batch evaded exactly that
      // check with `six = (j, t = '', py = '', ja = '', c = '', g = '')` — six
      // parameters, five of them defaulting to the empty string — and then
      // called it with one argument, shipping eleven problems that had a
      // JavaScript solution and five empty programs. So count the arguments
      // actually passed at every call site.
      const def = src.match(new RegExp(`const ${name} *= *\\(([^)]*)\\)`));
      if (def && /=\s*(''|""|``)/.test(def[1])) {
        fail(
          `${name}() gives its parameters empty defaults — a caller can then omit whole languages`,
        );
      }

      for (const call of src.matchAll(new RegExp(`referenceSolution: *${name} *\\(`, 'g'))) {
        // Walk from the open paren to its match, counting commas at depth 1 and
        // skipping string literals so commas inside code do not count.
        let depth = 0;
        let args = 0;
        let quote = null;
        for (let i = call.index + call[0].length - 1; i < src.length; i++) {
          const ch = src[i];
          if (quote) {
            if (ch === '\\') i++;
            else if (ch === quote) quote = null;
            continue;
          }
          if (ch === "'" || ch === '"' || ch === '`') quote = ch;
          else if (ch === '(' || ch === '[' || ch === '{') depth++;
          else if (ch === ')' || ch === ']' || ch === '}') {
            depth--;
            if (depth === 0) break;
          } else if (ch === ',' && depth === 1) args++;
        }
        if (args + 1 < LANGS.length) {
          fail(
            `${name}(...) is called with ${args + 1} argument(s) for one problem — ` +
              `every problem needs one real solution per language (${LANGS.length})`,
          );
          break;
        }
      }
    }
  }

  for (const m of src.matchAll(/signatureId: *'([^']*)'/g)) {
    if (!VALID_SIGNATURES.has(m[1])) {
      fail(`signatureId '${m[1]}' does not exist in signatures.ts — reshape the problem`);
    }
  }
  for (const m of src.matchAll(/patternFamily: *'([^']*)'/g)) {
    if (!VALID_FAMILIES.has(m[1])) {
      fail(`patternFamily '${m[1]}' is not a PatternFamily enum member`);
    }
  }

  const tests = (src.match(/tests: *\[/g) || []).length;
  if (tests !== slugs.length) fail(`${tests} tests arrays for ${slugs.length} problems`);
  const samples = (src.match(/isSample: *true/g) || []).length;
  if (samples !== slugs.length * 2) {
    fail(`${samples} isSample:true across ${slugs.length} problems (expected ${slugs.length * 2})`);
  }

  // An array literal handed straight to promptMarkdown/editorialMarkdown is a
  // type error, not a runtime one — it never reaches the judge, it just fails
  // the build. A whole batch once shipped with .join('\n') missing on all
  // eight statements.
  for (const key of ['promptMarkdown', 'editorialMarkdown']) {
    let from = 0;
    let unjoined = 0;
    for (;;) {
      const at = src.indexOf(`${key}:`, from);
      if (at < 0) break;
      let i = at + key.length + 1;
      while (i < src.length && /\s/.test(src[i])) i++;
      if (src[i] !== '[') { from = at + 1; continue; }
      // Walk to the matching bracket, ignoring brackets inside string literals —
      // these statements are full of prose like "[1,2] and [2,3] overlap".
      let depth = 0;
      let quote = null;
      for (; i < src.length; i++) {
        const c = src[i];
        if (quote) {
          if (c === '\\') i++;
          else if (c === quote) quote = null;
        } else if (c === "'" || c === '"' || c === '`') quote = c;
        else if (c === '[') depth++;
        else if (c === ']' && --depth === 0) break;
      }
      if (!src.slice(i + 1, i + 6).startsWith('.join')) unjoined++;
      from = i + 1;
    }
    if (unjoined > 0) fail(`${key}: ${unjoined} array literal(s) not followed by .join()`);
  }

  // --- filler detection -----------------------------------------------------
  //
  // A batch can satisfy every structural rule above and still be worthless. One
  // author, asked for third variations, wrote a generator: 88 problems titled
  // "Third Variation 1..9", slugs like `tree-nodes-third-4`, one editorial
  // shared by all of them, and a `makeSix(k)` factory whose solution counted the
  // input and added k. Distinct constants, six languages, two samples — clean by
  // every check that existed, and not a single real problem.
  //
  // These heuristics are deliberately blunt. They cannot judge whether a problem
  // is *good*; they only catch a batch that was mass-produced from one template,
  // which is the cheap way to hit a target and the expensive way to ruin a
  // corpus nobody can trust.

  const editorialHeadings = new Set(
    [...src.matchAll(/##\s+([^\\'"`\n]{3,60})/g)].map((m) => m[1].trim()),
  );
  if (slugs.length >= 4 && editorialHeadings.size <= 1) {
    fail(
      `all ${slugs.length} problems share one editorial heading ` +
        `(${[...editorialHeadings][0] ?? 'none found'}) — templated, not authored`,
    );
  }

  const titles = [...src.matchAll(/title: *'([^']+)'/g)].map((m) => m[1]);
  const numbered = titles.filter((t) => /\b(variation|problem|version)\s*\d+$/i.test(t));
  if (numbered.length >= 3) {
    fail(`${numbered.length} titles are numbered placeholders, e.g. "${numbered[0]}"`);
  }

  const slugStems = slugs.map((s) => s.replace(/-\d+$/, ''));
  const repeatedStem = slugStems.find(
    (stem, _i, all) => all.filter((s) => s === stem).length >= 3,
  );
  if (repeatedStem) {
    fail(`3+ slugs share the stem "${repeatedStem}" with only a number to tell them apart`);
  }

  // One statement reused verbatim is the same problem however it is titled.
  const prompts = [...src.matchAll(/promptMarkdown: *`([^`]{20,})`/g)].map((m) => m[1].trim());
  const dupPrompt = prompts.find((p, i) => prompts.indexOf(p) !== i);
  if (dupPrompt) fail(`identical promptMarkdown reused: "${dupPrompt.slice(0, 60)}..."`);

  // Gotchas that only surface as a compile error on the judge, long after.
  for (const [re, msg] of [
    [/\bsort\.(Ints|Slice|Strings)\b/, 'Go uses sort.* — the driver imports only bufio/fmt/os/strconv/strings'],
    [/\bmath\.(Abs|Max|Min|MaxInt|Inf)\b/, 'Go uses math.* — not importable by the driver'],
    [/\bbits\.OnesCount\b/, 'Go uses math/bits — not importable by the driver'],
    [/same as above|remaining solutions|TODO|FIXME|\.\.\.\s*$/m, 'truncation marker'],
  ]) if (re.test(src)) fail(msg);

  if (/std::sort/.test(src) && !/#include <algorithm>/.test(src)) {
    fail('C++ uses std::sort without #include <algorithm> (compile error arrives as empty output)');
  }
  if (/(queue|priority_queue)</.test(src) && !/#include <queue>/.test(src)) {
    fail('C++ uses queue without #include <queue>');
  }
}
console.log(bad ? `\n${bad} problem(s) found` : '\nall checks passed');
process.exit(bad ? 1 : 0);
