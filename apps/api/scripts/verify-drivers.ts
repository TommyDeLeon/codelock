/**
 * Run every generated driver through the real judge, in all six languages.
 *
 * The unit tests in `src/corpus/signatures.test.ts` prove the *shape* of the
 * generated source. Only a compiler can prove it compiles, and only the sandbox
 * can prove six languages read the wire format the same way. This script is
 * that proof, and it is the gate the brief puts in front of Tier 0.5 authoring:
 * the operation-log driver passes standalone, in all six, before a single
 * "implement the data structure" problem is written.
 *
 * Deliberately separate from `vitest`: it needs Docker, it takes minutes, and a
 * test suite that cannot run on a laptop is a test suite people stop running.
 *
 *   npm run verify:drivers -w @codelock/api
 *   npm run verify:drivers -w @codelock/api -- cls:lru-cache
 */
import { driversFor } from '../src/corpus/signatures.js';
import type { Lang } from '../src/corpus/types.js';

const JUDGE_URL = process.env.JUDGE0_URL ?? 'http://localhost:2358';

/** Matches Judge0 1.13.1, which is what `apps/judge` speaks. */
const LANGUAGE_IDS: Record<Lang, number> = {
  JAVASCRIPT: 63,
  TYPESCRIPT: 74,
  PYTHON: 71,
  JAVA: 62,
  CPP: 54,
  GO: 60,
};

interface Fixture {
  signatureId: string;
  /** What this fixture is actually checking, for the failure message. */
  note: string;
  solutions: Record<Lang, string>;
  cases: Array<{ stdin: string; expected: string }>;
}

// --- the operation-log fixture ---------------------------------------------
//
// The canonical LRU trace: capacity 2, evict on the third distinct key, and a
// `get` that must *promote* rather than merely read. A cache that ignores
// promotion still passes a naive trace, which is why `get 1` comes before
// `put 3 3` here.

const LRU_TRACE = [
  '10',
  'LRUCache 2',
  'put 1 1',
  'put 2 2',
  'get 1',
  'put 3 3',
  'get 2',
  'put 4 4',
  'get 1',
  'get 3',
  'get 4',
].join('\n');

const LRU_EXPECTED = ['null', 'null', 'null', '1', 'null', '-1', 'null', '-1', '3', '4'].join('\n');

const lruCache: Fixture = {
  signatureId: 'cls:lru-cache',
  note: 'operation-log driver: constructs the user class and replays a command list',
  cases: [{ stdin: LRU_TRACE, expected: LRU_EXPECTED }],
  solutions: {
    JAVASCRIPT: `class LRUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.m = new Map();
  }
  get(key) {
    if (!this.m.has(key)) return -1;
    const v = this.m.get(key);
    this.m.delete(key);
    this.m.set(key, v);
    return v;
  }
  put(key, value) {
    if (this.m.has(key)) this.m.delete(key);
    this.m.set(key, value);
    if (this.m.size > this.cap) this.m.delete(this.m.keys().next().value);
  }
}`,
    // Valid TypeScript, and erasable-syntax-only so Node 24 runs it directly.
    TYPESCRIPT: `class LRUCache {
  cap: number;
  m: Map<number, number>;
  constructor(capacity: number) {
    this.cap = capacity;
    this.m = new Map();
  }
  get(key: number): number {
    if (!this.m.has(key)) return -1;
    const v = this.m.get(key) as number;
    this.m.delete(key);
    this.m.set(key, v);
    return v;
  }
  put(key: number, value: number): void {
    if (this.m.has(key)) this.m.delete(key);
    this.m.set(key, value);
    if (this.m.size > this.cap) this.m.delete(this.m.keys().next().value as number);
  }
}`,
    PYTHON: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.m = OrderedDict()

    def get(self, key):
        if key not in self.m:
            return -1
        self.m.move_to_end(key)
        return self.m[key]

    def put(self, key, value):
        if key in self.m:
            self.m.move_to_end(key)
        self.m[key] = value
        if len(self.m) > self.cap:
            self.m.popitem(last=False)`,
    JAVA: `class LRUCache {
    private final int cap;
    private final LinkedHashMap<Integer, Integer> m = new LinkedHashMap<>();

    LRUCache(int capacity) {
        this.cap = capacity;
    }

    int get(int key) {
        if (!m.containsKey(key)) return -1;
        int v = m.remove(key);
        m.put(key, v);
        return v;
    }

    void put(int key, int value) {
        if (m.containsKey(key)) m.remove(key);
        m.put(key, value);
        if (m.size() > cap) {
            int oldest = m.keySet().iterator().next();
            m.remove(oldest);
        }
    }
}`,
    CPP: `class LRUCache {
public:
    int cap;
    list<int> order;
    unordered_map<int, pair<int, list<int>::iterator>> m;

    LRUCache(int capacity) : cap(capacity) {}

    int get(int key) {
        auto it = m.find(key);
        if (it == m.end()) return -1;
        order.erase(it->second.second);
        order.push_front(key);
        it->second.second = order.begin();
        return it->second.first;
    }

    void put(int key, int value) {
        auto it = m.find(key);
        if (it != m.end()) order.erase(it->second.second);
        order.push_front(key);
        m[key] = { value, order.begin() };
        if ((int)m.size() > cap) {
            int oldest = order.back();
            order.pop_back();
            m.erase(oldest);
        }
    }
};`,
    GO: `type LRUCache struct {
	cap   int
	m     map[int]int
	order []int
}

func Constructor(capacity int) LRUCache {
	return LRUCache{cap: capacity, m: map[int]int{}}
}

func (this *LRUCache) touch(key int) {
	for i, v := range this.order {
		if v == key {
			this.order = append(this.order[:i], this.order[i+1:]...)
			break
		}
	}
	this.order = append(this.order, key)
}

func (this *LRUCache) Get(key int) int {
	v, ok := this.m[key]
	if !ok {
		return -1
	}
	this.touch(key)
	return v
}

func (this *LRUCache) Put(key int, value int) {
	this.m[key] = value
	this.touch(key)
	if len(this.m) > this.cap {
		oldest := this.order[0]
		this.order = this.order[1:]
		delete(this.m, oldest)
	}
}`,
  },
};

// --- a free-function fixture ------------------------------------------------
//
// Covers the other driver family and, incidentally, the int-array-in and
// int-array-out codecs, which between them carry most of the corpus.

const twoSum: Fixture = {
  signatureId: 'fn:ints,int->ints',
  note: 'free-function driver: one parameter per line, array in and array out',
  cases: [
    { stdin: '2 7 11 15\n9', expected: '0 1' },
    { stdin: '3 2 4\n6', expected: '1 2' },
  ],
  solutions: {
    JAVASCRIPT: `function solve(a, b) {
  const seen = new Map();
  for (let i = 0; i < a.length; i++) {
    if (seen.has(b - a[i])) return [seen.get(b - a[i]), i];
    seen.set(a[i], i);
  }
  return [];
}`,
    TYPESCRIPT: `function solve(a: number[], b: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < a.length; i++) {
    if (seen.has(b - a[i])) return [seen.get(b - a[i]) as number, i];
    seen.set(a[i], i);
  }
  return [];
}`,
    PYTHON: `def solve(a, b):
    seen = {}
    for i, v in enumerate(a):
        if b - v in seen:
            return [seen[b - v], i]
        seen[v] = i
    return []`,
    JAVA: `    static int[] solve(int[] a, int b) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < a.length; i++) {
            if (seen.containsKey(b - a[i])) return new int[] { seen.get(b - a[i]), i };
            seen.put(a[i], i);
        }
        return new int[0];
    }`,
    CPP: `vector<int> solve(vector<int> a, int b) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)a.size(); i++) {
        auto it = seen.find(b - a[i]);
        if (it != seen.end()) return { it->second, i };
        seen[a[i]] = i;
    }
    return {};
}`,
    GO: `func solve(a []int, b int) []int {
	seen := map[int]int{}
	for i, v := range a {
		if j, ok := seen[b-v]; ok {
			return []int{j, i}
		}
		seen[v] = i
	}
	return []int{}
}`,
  },
};

const FIXTURES: Fixture[] = [lruCache, twoSum];

// --- judge plumbing ---------------------------------------------------------

const b64 = (s: string): string => Buffer.from(s, 'utf8').toString('base64');
const unb64 = (s: string | null | undefined): string =>
  s ? Buffer.from(s, 'base64').toString('utf8') : '';

interface Submission {
  token: string;
  /** Judge0 reports `{ id, description }`, not a bare number. */
  status?: { id: number; description?: string } | number;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
}

const statusId = (s: Submission): number =>
  typeof s.status === 'number' ? s.status : (s.status?.id ?? 0);

const statusName = (s: Submission): string =>
  typeof s.status === 'number' ? String(s.status) : (s.status?.description ?? 'unknown');

/**
 * Compile-sized limits, not solve-sized ones.
 *
 * The sandbox runs `--memory <limit>` and the *compiler* lives inside it. At the
 * 256 MB default, `g++ -O2` on <bits/stdc++.h> and `go run` are both killed
 * outright — which reads as "your driver is broken" when nothing is broken but
 * the budget. This script is checking correctness, not speed, so it asks for
 * room. (Worth knowing: `Problem.memoryLimitKb` defaults to 128000 — 125 MB —
 * which is below what those two toolchains need to *build*. See the note in
 * docs/CORPUS-SOURCES.md follow-ups.)
 */
const CPU_TIME_LIMIT = 20;
const MEMORY_LIMIT_KB = 1_048_576;

async function submit(
  batch: Array<{
    language_id: number;
    source_code: string;
    stdin: string;
    cpu_time_limit: number;
    memory_limit: number;
  }>,
): Promise<string[]> {
  const res = await fetch(`${JUDGE_URL}/submissions/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissions: batch }),
  });
  if (!res.ok) throw new Error(`judge rejected the batch: ${res.status} ${await res.text()}`);
  return ((await res.json()) as Array<{ token: string }>).map((s) => s.token);
}

/** Poll until every token is out of the queue. Compiled languages are slow. */
async function collect(tokens: string[], timeoutMs = 15 * 60_000): Promise<Submission[]> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await fetch(`${JUDGE_URL}/submissions/batch?tokens=${tokens.join(',')}`);
    const { submissions } = (await res.json()) as { submissions: Submission[] };
    const pending = submissions.filter((s) => statusId(s) === 1 || statusId(s) === 2).length;
    if (pending === 0) return submissions;
    if (Date.now() > deadline) throw new Error(`timed out with ${pending} submissions still running`);
    process.stdout.write(`\r  waiting on ${pending}/${tokens.length} ...    `);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

// --- main -------------------------------------------------------------------

interface Row {
  signature: string;
  language: Lang;
  caseIndex: number;
  ok: boolean;
  detail: string;
}

async function main(): Promise<void> {
  const only = process.argv[2];
  const fixtures = only ? FIXTURES.filter((f) => f.signatureId === only) : FIXTURES;
  if (fixtures.length === 0) {
    throw new Error(`no fixture for "${only}". Known: ${FIXTURES.map((f) => f.signatureId).join(', ')}`);
  }

  const health = await fetch(`${JUDGE_URL}/healthz`).catch(() => null);
  if (!health?.ok) {
    throw new Error(`judge is not answering at ${JUDGE_URL}. Start it with: npm run dev:judge`);
  }

  const batch: Array<{
    language_id: number;
    source_code: string;
    stdin: string;
    cpu_time_limit: number;
    memory_limit: number;
  }> = [];
  const index: Array<{ fixture: Fixture; language: Lang; caseIndex: number; expected: string }> = [];

  for (const fixture of fixtures) {
    const drivers = driversFor(fixture.signatureId);
    for (const language of Object.keys(LANGUAGE_IDS) as Lang[]) {
      const source = drivers[language].replace('{{SOLUTION}}', fixture.solutions[language]);
      fixture.cases.forEach((c, caseIndex) => {
        batch.push({
          language_id: LANGUAGE_IDS[language],
          source_code: b64(source),
          stdin: b64(c.stdin),
          cpu_time_limit: CPU_TIME_LIMIT,
          memory_limit: MEMORY_LIMIT_KB,
        });
        index.push({ fixture, language, caseIndex, expected: c.expected });
      });
    }
  }

  console.log(`Submitting ${batch.length} runs to ${JUDGE_URL}\n`);
  const results = await collect(await submit(batch));
  process.stdout.write('\r');

  const rows: Row[] = results.map((result, i) => {
    const { fixture, language, caseIndex, expected } = index[i];
    const stdout = unb64(result.stdout).replace(/\r/g, '').trimEnd();
    const ok = stdout === expected.trimEnd();
    const compile = unb64(result.compile_output).trim();
    const stderr = unb64(result.stderr).trim();
    const detail = ok
      ? ''
      : compile
        ? `compile error: ${compile.split('\n').slice(0, 3).join(' | ')}`
        : stderr
          ? `runtime error: ${stderr.split('\n').slice(0, 3).join(' | ')}`
          : `[${statusName(result)}] expected ${JSON.stringify(expected)} got ${JSON.stringify(stdout)}`;
    return { signature: fixture.signatureId, language, caseIndex, ok, detail };
  });

  let lastSignature = '';
  for (const row of rows) {
    if (row.signature !== lastSignature) {
      const fixture = fixtures.find((f) => f.signatureId === row.signature)!;
      console.log(`\n${row.signature} - ${fixture.note}`);
      lastSignature = row.signature;
    }
    const mark = row.ok ? 'PASS' : 'FAIL';
    console.log(`  ${mark}  ${row.language.padEnd(11)} case ${row.caseIndex}${row.detail ? `  ${row.detail}` : ''}`);
  }

  const failed = rows.filter((r) => !r.ok);
  console.log(`\n${rows.length - failed.length}/${rows.length} passed`);

  if (failed.length > 0) {
    // Loud, and non-zero: this gate stands in front of Tier 0.5 authoring.
    console.error(`\n${failed.length} failing. Do not author against a signature until its driver is green.`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
