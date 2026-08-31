import { Language } from '@prisma/client';
import { env } from '../env.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

/**
 * Judge0 language ids.
 *
 * These are NOT stable across Judge0 releases — the same number means different
 * runtimes in different versions, and an id that does not exist yields a bare
 * 422 with no hint about why. Defaults below match judge0/judge0:1.13.1, the
 * version pinned in docker-compose.yml.
 *
 * Newer hosted Judge0 CE (the RapidAPI instance) renumbers these: JavaScript is
 * 93, Java 91, C++ 105, Go 95. Override per language via env rather than
 * editing this file, and call verifyLanguageIds() to find out at boot instead
 * of at the first submission.
 */
export const JUDGE0_LANGUAGE_IDS: Record<Language, number> = {
  JAVASCRIPT: env.JUDGE0_LANG_JAVASCRIPT, // 1.13.1: 63 = Node.js 12.14.0
  TYPESCRIPT: env.JUDGE0_LANG_TYPESCRIPT, // 1.13.1: 74 = TypeScript 3.7.4
  PYTHON: env.JUDGE0_LANG_PYTHON, // 71 = Python 3.8.1
  JAVA: env.JUDGE0_LANG_JAVA, // 62 = OpenJDK 13.0.1
  CPP: env.JUDGE0_LANG_CPP, // 54 = GCC 9.2.0
  GO: env.JUDGE0_LANG_GO, // 60 = Go 1.13.5
};

/**
 * Compare the configured ids against what the judge actually offers.
 *
 * Non-fatal by design: a judge that is merely slow to start should not stop the
 * API from booting. But a mismatch means every submission in that language will
 * 422, so it is logged loudly.
 */
export async function verifyLanguageIds(): Promise<void> {
  try {
    const res = await fetch(`${env.JUDGE0_URL}/languages`, { headers: headers() });
    if (!res.ok) return;
    const languages = (await res.json()) as Array<{ id: number; name: string }>;
    const byId = new Map(languages.map((l) => [l.id, l.name]));

    for (const [language, id] of Object.entries(JUDGE0_LANGUAGE_IDS)) {
      const name = byId.get(id);
      if (name) logger.info({ language, id, judge0: name }, 'judge0 language mapped');
      else logger.error({ language, id }, 'judge0 language id not offered by this judge');
    }
  } catch (err) {
    logger.warn({ err }, 'could not verify judge0 language ids');
  }
}

/** Judge0 status ids we care about. */
const STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
} as const;

export interface Judge0Case {
  stdin: string;
  expectedOutput: string;
}

export interface CaseResult {
  passed: boolean;
  statusId: number;
  statusDescription: string;
  /**
   * What the program actually printed.
   *
   * Judge0 already returns this and we already ask for it; it used to be
   * dropped because grading only needs the verdict. The learning log needs the
   * output itself — "expected 3, got 5" is the whole lesson, and without it a
   * failed attempt records only that it failed. Capped, because a runaway loop
   * can print megabytes.
   */
  stdout: string | null;
  timeMs: number;
  memoryKb: number;
  stderr: string | null;
  compileOutput: string | null;
}

export interface BatchResult {
  token: string[];
  results: CaseResult[];
}

const b64 = (s: string): string => Buffer.from(s, 'utf8').toString('base64');
const unb64 = (s: string | null | undefined): string | null =>
  s ? Buffer.from(s, 'base64').toString('utf8') : null;

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.JUDGE0_KEY) {
    // RapidAPI-hosted Judge0. Self-hosted instances need neither header.
    h['X-RapidAPI-Key'] = env.JUDGE0_KEY;
    if (env.JUDGE0_HOST) h['X-RapidAPI-Host'] = env.JUDGE0_HOST;
  }
  return h;
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.JUDGE0_TIMEOUT_MS);
  try {
    const res = await fetch(`${env.JUDGE0_URL}${path}`, {
      ...init,
      headers: { ...headers(), ...(init.headers ?? {}) },
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.error({ status: res.status, path, body: body.slice(0, 500) }, 'judge0 error');
      throw ApiError.upstream(`Judge0 responded ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw ApiError.upstream('Judge0 timed out');
    }
    logger.error({ err }, 'judge0 request failed');
    throw ApiError.upstream('Could not reach the code execution service');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Run one source file against every test case as a single Judge0 batch, then
 * poll until all verdicts land.
 *
 * Everything crosses the wire base64-encoded (`base64_encoded=true`) because
 * raw stdin/stdout routinely contains characters that break Judge0's JSON.
 */
export async function runBatch(params: {
  language: Language;
  sourceCode: string;
  cases: Judge0Case[];
  cpuTimeLimit: number;
  memoryLimitKb: number;
  /**
   * 'bulk' yields the judge to anyone actually waiting on a submission.
   *
   * Defaults to interactive precisely because forgetting it must fail safe:
   * the cost of mislabelling corpus measurement as interactive is a slower
   * import, and the cost of the reverse is a locked-out user whose submission
   * times out.
   */
  priority?: 'interactive' | 'bulk';
}): Promise<BatchResult> {
  const { language, sourceCode, cases, cpuTimeLimit, memoryLimitKb } = params;

  const submissions = cases.map((c) => ({
    language_id: JUDGE0_LANGUAGE_IDS[language],
    source_code: b64(sourceCode),
    stdin: b64(c.stdin),
    expected_output: b64(c.expectedOutput),
    cpu_time_limit: cpuTimeLimit,
    memory_limit: memoryLimitKb,
    // Judge0 trims trailing whitespace when comparing, which is what we want:
    // "42\n" and "42" are the same answer.
  }));

  const created = await call<Array<{ token: string }>>(
    '/submissions/batch?base64_encoded=true',
    {
      method: 'POST',
      body: JSON.stringify({ submissions, priority: params.priority ?? 'interactive' }),
    },
  );

  const tokens = created.map((c) => c.token);
  const results = await pollBatch(tokens);
  return { token: tokens, results };
}

const FIELDS = 'token,status,stdout,stderr,compile_output,time,memory';

/** A wrong answer is worth reading; a runaway print loop is not. */
const MAX_STDOUT_CHARS = 2_000;

interface RawResult {
  status: { id: number; description: string };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | null;
  memory?: number | null;
}

async function pollBatch(tokens: string[]): Promise<CaseResult[]> {
  const query = `tokens=${tokens.join(',')}&base64_encoded=true&fields=${FIELDS}`;
  const deadline = Date.now() + env.JUDGE0_TIMEOUT_MS;
  let delay = 300;

  while (Date.now() < deadline) {
    const body = await call<{ submissions: RawResult[] }>(
      `/submissions/batch?${query}`,
      { method: 'GET' },
    );
    const pending = body.submissions.some(
      (s) => s.status.id === STATUS.IN_QUEUE || s.status.id === STATUS.PROCESSING,
    );
    if (!pending) return body.submissions.map(toCaseResult);

    await sleep(delay);
    delay = Math.min(delay * 1.5, 2_000); // back off; Judge0 queues can be slow
  }

  throw ApiError.upstream('Judging took too long. Your code was not graded.');
}

function toCaseResult(raw: RawResult): CaseResult {
  return {
    passed: raw.status.id === STATUS.ACCEPTED,
    statusId: raw.status.id,
    statusDescription: raw.status.description,
    stdout: unb64(raw.stdout)?.slice(0, MAX_STDOUT_CHARS) ?? null,
    timeMs: Math.round(Number(raw.time ?? 0) * 1000),
    memoryKb: raw.memory ?? 0,
    stderr: unb64(raw.stderr),
    compileOutput: unb64(raw.compile_output),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export { STATUS as JUDGE0_STATUS };
