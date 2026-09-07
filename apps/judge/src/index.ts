import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { LANGUAGES, STATUS } from './languages.js';
import { runInSandbox, type RunResult } from './sandbox.js';
import { logger } from './logger.js';
import { env } from './env.js';

/**
 * A Judge0-compatible execution service backed by Docker.
 *
 * Speaks the subset of the Judge0 API that CodeLock uses — batch submit, batch
 * poll, and /languages — with the same ids and status codes, so `JUDGE0_URL`
 * can point at either this or a real Judge0 with no other change.
 *
 * Submissions are queued and worked by a small pool rather than run on arrival:
 * each run is a container, and letting an unbounded number start at once would
 * take the host down more reliably than any single submission could.
 */

const PORT = env.PORT;
const HOST = env.HOST;
/** Concurrent containers. Each one gets a full core, so this is a CPU budget. */
const CONCURRENCY = env.JUDGE_CONCURRENCY;
/** Finished results are kept this long for polling, then dropped. */
const RESULT_TTL_MS = 10 * 60_000;
/** Queued work older than this can no longer be useful to a polling client. */
const QUEUE_TTL_MS = 10 * 60_000;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_BATCH_SIZE = 250;
const MAX_SOURCE_BYTES = 256 * 1024;
const MAX_STDIN_BYTES = 256 * 1024;
const MAX_EXPECTED_OUTPUT_BYTES = 256 * 1024;
const MAX_QUEUED_JOBS = 5_000;
const MAX_RETAINED_JOBS = 2_000;
const MAX_IN_FLIGHT_PAYLOAD_BYTES = 64 * 1024 * 1024;
const MAX_RETAINED_RESULT_BYTES = 64 * 1024 * 1024;

interface Job {
  token: string;
  request: Parameters<typeof runInSandbox>[0] | null;
  payloadBytes: number;
  resultBytes: number;
  result: RunResult | null;
  createdAt: number;
  phase: 'queued' | 'active' | 'complete';
  /**
   * 'bulk' is corpus measurement; 'interactive' is a person waiting.
   *
   * One FIFO queue is wrong here because the two workloads differ by three
   * orders of magnitude: a measurement run enqueues thousands of jobs at once,
   * and a submission arriving behind them waited past its 60s timeout and came
   * back "Judging took too long. Your code was not graded." — while the user
   * was locked out of their own machine.
   */
  priority: 'interactive' | 'bulk';
}

const jobs = new Map<string, Job>();
/** Two queues, not a sort: bulk must never delay a person, however long it waits. */
const interactiveQueue: Job[] = [];
const bulkQueue: Job[] = [];
let interactiveHead = 0;
let bulkHead = 0;
let active = 0;
let inFlightPayloadBytes = 0;
let retainedResultBytes = 0;

const queued = (): number =>
  interactiveQueue.length - interactiveHead + bulkQueue.length - bulkHead;

function nextJob(): Job | undefined {
  const now = Date.now();
  for (;;) {
    const queue = interactiveHead < interactiveQueue.length ? interactiveQueue : bulkQueue;
    const isInteractive = queue === interactiveQueue;
    const head = isInteractive ? interactiveHead : bulkHead;
    if (head >= queue.length) return undefined;
    const job = queue[head];
    if (isInteractive) interactiveHead += 1;
    else bulkHead += 1;

    if (job && job.phase === 'queued' && now - job.createdAt <= QUEUE_TTL_MS) {
      compactQueues();
      return job;
    }
    if (job?.phase === 'queued') expireJob(job);
  }
}

function compactQueues(): void {
  if (interactiveHead > 1_000 && interactiveHead * 2 > interactiveQueue.length) {
    interactiveQueue.splice(0, interactiveHead);
    interactiveHead = 0;
  }
  if (bulkHead > 1_000 && bulkHead * 2 > bulkQueue.length) {
    bulkQueue.splice(0, bulkHead);
    bulkHead = 0;
  }
}

function expireJob(job: Job): void {
  job.phase = 'complete';
  releasePayload(job);
  storeResult(job, {
    status: STATUS.INTERNAL_ERROR,
    stdout: null,
    stderr: 'Submission expired while waiting for capacity',
    compileOutput: null,
    time: '0.000',
    memory: 0,
  });
}

function releasePayload(job: Job): void {
  if (job.request === null) return;
  inFlightPayloadBytes = Math.max(0, inFlightPayloadBytes - job.payloadBytes);
  job.request = null;
  job.payloadBytes = 0;
}

function resultSize(result: RunResult): number {
  return Buffer.byteLength(result.stdout ?? '', 'utf8')
    + Buffer.byteLength(result.stderr ?? '', 'utf8')
    + Buffer.byteLength(result.compileOutput ?? '', 'utf8');
}

function storeResult(job: Job, result: RunResult): void {
  retainedResultBytes -= job.resultBytes;
  job.result = result;
  job.resultBytes = resultSize(result);
  retainedResultBytes += job.resultBytes;
  trimRetainedResults(job.token);
}

function deleteJob(token: string, job: Job): void {
  retainedResultBytes = Math.max(0, retainedResultBytes - job.resultBytes);
  jobs.delete(token);
}

function trimRetainedResults(protectedToken?: string): void {
  if (retainedResultBytes <= MAX_RETAINED_RESULT_BYTES) return;
  for (const [token, job] of jobs) {
    if (token === protectedToken || job.phase !== 'complete') continue;
    deleteJob(token, job);
    if (retainedResultBytes <= MAX_RETAINED_RESULT_BYTES) break;
  }
}

const b64d = (value: string | null | undefined): string =>
  value ? Buffer.from(value, 'base64').toString('utf8') : '';
const b64e = (value: string | null): string | null =>
  value === null ? null : Buffer.from(value, 'utf8').toString('base64');

function pump(): void {
  while (active < CONCURRENCY && queued() > 0) {
    const job = nextJob();
    if (!job) break;
    const request = job.request;
    if (!request) continue;
    job.phase = 'active';
    active += 1;
    void runInSandbox(request)
      .then((result) => {
        storeResult(job, result);
      })
      .catch((err) => {
        logger.error({ err, token: job.token }, 'job failed');
        storeResult(job, {
          status: STATUS.INTERNAL_ERROR,
          stdout: null,
          stderr: 'Judge failure',
          compileOutput: null,
          time: '0.000',
          memory: 0,
        });
      })
      .finally(() => {
        job.phase = 'complete';
        releasePayload(job);
        trimRetainedResults(job.token);
        active -= 1;
        pump();
      });
  }
}

// Without this, a long-lived judge accumulates every result it ever produced.
setInterval(() => {
  const cutoff = Date.now() - RESULT_TTL_MS;
  for (const [token, job] of jobs) {
    if (job.phase === 'queued' && Date.now() - job.createdAt > QUEUE_TTL_MS) expireJob(job);
    if (job.phase === 'complete' && job.createdAt < cutoff) deleteJob(token, job);
  }
  compactQueues();
}, 60_000).unref();

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new RequestError(413, 'Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const json = (res: ServerResponse, status: number, body: unknown): void => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

class RequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

const requireFinite = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isFinite(parsed)) throw new RequestError(400, 'Resource limits must be finite numbers');
  return Math.min(max, Math.max(min, parsed));
};

const requireBase64 = (
  value: unknown,
  field: string,
  maxBytes: number,
  optional = false,
  allowEmpty = true,
): string => {
  if (value === undefined && optional) return '';
  if (typeof value !== 'string') throw new RequestError(400, `${field} must be base64 text`);
  if (value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new RequestError(400, `${field} is not valid base64`);
  }
  const decoded = b64d(value);
  if (!allowEmpty && decoded.length === 0) throw new RequestError(400, `${field} cannot be empty`);
  if (Buffer.byteLength(decoded, 'utf8') > maxBytes) {
    throw new RequestError(413, `${field} is too large`);
  }
  return decoded;
};

function serialize(job: Job): Record<string, unknown> {
  if (job.result === null) {
    return {
      token: job.token,
      status: job.phase === 'active' ? STATUS.PROCESSING : STATUS.IN_QUEUE,
    };
  }
  return {
    token: job.token,
    status: job.result.status,
    stdout: b64e(job.result.stdout),
    stderr: b64e(job.result.stderr),
    compile_output: b64e(job.result.compileOutput),
    time: job.result.time,
    memory: job.result.memory,
  };
}

const server = createServer((req, res) => {
  void handle(req, res).catch((err) => {
    logger.error({ err }, 'request failed');
    if (!res.headersSent) {
      const status = err instanceof RequestError ? err.status : 500;
      json(res, status, { error: status === 500 ? 'internal' : err instanceof Error ? err.message : 'invalid request' });
    }
  });
});

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (url.pathname === '/healthz') {
    return json(res, 200, {
      ok: true,
      queued: queued(),
      interactive: interactiveQueue.length,
      bulk: bulkQueue.length,
      active,
      inFlightPayloadBytes,
      retainedResultBytes,
    });
  }

  if (url.pathname === '/languages' && req.method === 'GET') {
    return json(
      res,
      200,
      Object.values(LANGUAGES).map((l) => ({ id: l.id, name: l.name })),
    );
  }

  if (url.pathname === '/submissions/batch' && req.method === 'POST') {
    let body: {
      submissions: Array<{
        language_id: number;
        source_code: string;
        stdin?: string;
        expected_output?: string;
        cpu_time_limit?: number;
        memory_limit?: number;
      }>;
      /** Set by the corpus importer so measurement yields to real submissions. */
      priority?: 'interactive' | 'bulk';
    };
    try {
      body = JSON.parse(await readBody(req)) as typeof body;
    } catch (err) {
      if (err instanceof RequestError) throw err;
      throw new RequestError(400, 'request body must be valid JSON');
    }
    if (!body || !Array.isArray(body.submissions)) {
      throw new RequestError(400, 'submissions must be an array');
    }
    if (body.submissions.length < 1 || body.submissions.length > MAX_BATCH_SIZE) {
      throw new RequestError(400, `batch must contain 1-${MAX_BATCH_SIZE} submissions`);
    }
    if (queued() + body.submissions.length > MAX_QUEUED_JOBS) {
      throw new RequestError(503, 'judge queue is full');
    }
    if (jobs.size + body.submissions.length > MAX_RETAINED_JOBS) {
      throw new RequestError(503, 'judge result capacity is full; retry later');
    }
    const priority = body.priority === 'bulk' ? 'bulk' : 'interactive';

    // Validate the complete batch before mutating queues. A bad final entry must
    // not strand earlier entries from the same request in memory.
    const requests = body.submissions.map((s) => {
      if (!s || typeof s !== 'object' || !Number.isInteger(s.language_id)) {
        throw new RequestError(400, 'each submission needs an integer language_id');
      }
      return {
        languageId: s.language_id,
        source: requireBase64(s.source_code, 'source_code', MAX_SOURCE_BYTES, false, false),
        stdin: requireBase64(s.stdin, 'stdin', MAX_STDIN_BYTES, true),
        expectedOutput: s.expected_output === undefined
          ? null
          : requireBase64(s.expected_output, 'expected_output', MAX_EXPECTED_OUTPUT_BYTES),
        cpuTimeLimit: requireFinite(s.cpu_time_limit, 5, 1, 20),
        memoryLimitKb: requireFinite(s.memory_limit, 262_144, 64 * 1024, 1_048_576),
      };
    });
    const batchPayloadBytes = requests.reduce(
      (sum, request) => sum
        + Buffer.byteLength(request.source, 'utf8')
        + Buffer.byteLength(request.stdin, 'utf8')
        + Buffer.byteLength(request.expectedOutput ?? '', 'utf8'),
      0,
    );
    if (inFlightPayloadBytes + batchPayloadBytes > MAX_IN_FLIGHT_PAYLOAD_BYTES) {
      throw new RequestError(503, 'judge payload capacity is full; retry later');
    }

    const created = requests.map((request) => {
      const payloadBytes = Buffer.byteLength(request.source, 'utf8')
        + Buffer.byteLength(request.stdin, 'utf8')
        + Buffer.byteLength(request.expectedOutput ?? '', 'utf8');
      const job: Job = {
        token: randomUUID(),
        createdAt: Date.now(),
        result: null,
        payloadBytes,
        resultBytes: 0,
        phase: 'queued',
        priority,
        request,
      };
      jobs.set(job.token, job);
      inFlightPayloadBytes += payloadBytes;
      (priority === 'bulk' ? bulkQueue : interactiveQueue).push(job);
      return { token: job.token };
    });

    pump();
    return json(res, 201, created);
  }

  if (url.pathname === '/submissions/batch' && req.method === 'GET') {
    const tokens = (url.searchParams.get('tokens') ?? '').split(',').filter(Boolean);
    if (tokens.length < 1 || tokens.length > MAX_BATCH_SIZE) {
      throw new RequestError(400, `tokens must contain 1-${MAX_BATCH_SIZE} entries`);
    }
    const submissions = tokens.map((token) => {
      const job = jobs.get(token);
      return job
        ? serialize(job)
        : { token, status: STATUS.INTERNAL_ERROR, stderr: b64e('Unknown token') };
    });
    return json(res, 200, { submissions });
  }

  json(res, 404, { error: 'not found' });
}

server.listen(PORT, HOST, () => {
  logger.info(
    { host: HOST, port: PORT, concurrency: CONCURRENCY, languages: Object.keys(LANGUAGES).length },
    'CodeLock judge listening',
  );
});

const shutdown = (signal: string): void => {
  logger.info({ signal }, 'shutting down');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
