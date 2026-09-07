import { z } from 'zod';
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
    const res = await fetch(`${env.JUDGE0_URL}/languages`, { headers: headers(), signal: AbortSignal.timeout(env.JUDGE0_TIMEOUT_MS), redirect: 'error' });
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
  return { 'Content-Type': 'application/json' };
}

async function call(path: string, init: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.JUDGE0_TIMEOUT_MS);
  try {
    const res = await fetch(`${env.JUDGE0_URL}${path}`, {
      ...init,
      headers: { ...headers(), ...(init.headers ?? {}) },
      signal: controller.signal,
      redirect: 'error',
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.error({ status: res.status, path, body: body.slice(0, 500) }, 'judge0 error');
      throw ApiError.upstream(`Judge0 responded ${res.status}`);
    }
    return await res.json();
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

  if (cases.length === 0 || cases.length > 250) {
    throw ApiError.upstream('A grade requires between 1 and 250 test cases');
  }

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

  const response = await call(
    '/submissions/batch?base64_encoded=true',
    {
      method: 'POST',
      body: JSON.stringify({ submissions, priority: params.priority ?? 'interactive' }),
    },
  );

  const created = z.array(z.object({ token: z.string().uuid() })).length(cases.length).safeParse(response);
  if (!created.success) throw ApiError.upstream('Execution service returned an invalid submission batch');
  const tokens = created.data.map((c) => c.token);
  if (new Set(tokens).size !== tokens.length) throw ApiError.upstream('Execution service returned duplicate tokens');
  const results = await pollBatch(tokens);
  return { token: tokens, results };
}

const FIELDS = 'token,status,stdout,stderr,compile_output,time,memory';

/** A wrong answer is worth reading; a runaway print loop is not. */
const MAX_STDOUT_CHARS = 2_000;

const outputSchema = z.string().max(1_500_000).nullable().optional();
const rawResultSchema = z.object({
  token: z.string().uuid(),
  status: z.object({ id: z.number().int().min(1).max(14), description: z.string().max(200) }),
  stdout: outputSchema,
  stderr: outputSchema,
  compile_output: outputSchema,
  time: z.string().regex(/^\d+(?:\.\d+)?$/).refine((value) => Number.isFinite(Number(value))).nullable().optional(),
  memory: z.number().finite().nonnegative().nullable().optional(),
}).superRefine((result, ctx) => {
  if (result.status.id === STATUS.ACCEPTED && (result.time == null || result.memory == null)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Accepted results require timing and memory' });
  }
});
type RawResult = z.infer<typeof rawResultSchema>;

async function pollBatch(tokens: string[]): Promise<CaseResult[]> {
  const query = `tokens=${tokens.join(',')}&base64_encoded=true&fields=${FIELDS}`;
  const deadline = Date.now() + env.JUDGE0_TIMEOUT_MS;
  let delay = 300;

  while (Date.now() < deadline) {
    const response = await call(
      `/submissions/batch?${query}`,
      { method: 'GET' },
    );
    const body = z.object({ submissions: z.array(rawResultSchema).length(tokens.length) }).safeParse(response);
    if (!body.success) throw ApiError.upstream('Execution service returned invalid or incomplete results');
    const byToken = new Map(body.data.submissions.map((result) => [result.token, result]));
    if (byToken.size !== tokens.length || tokens.some((token) => !byToken.has(token))) {
      throw ApiError.upstream('Execution results do not match the requested tests');
    }
    const ordered = tokens.map((token) => byToken.get(token)!);
    const pending = ordered.some(
      (s) => s.status.id === STATUS.IN_QUEUE || s.status.id === STATUS.PROCESSING,
    );
    if (!pending) return ordered.map(toCaseResult);

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
