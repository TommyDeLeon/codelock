import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { LANGUAGES, STATUS } from './languages.js';
import { runInSandbox, type RunResult } from './sandbox.js';
import { logger } from './logger.js';

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

const PORT = Number(process.env.PORT ?? 2358);
/** Concurrent containers. Each one gets a full core, so this is a CPU budget. */
const CONCURRENCY = Number(process.env.JUDGE_CONCURRENCY ?? 4);
/** Finished results are kept this long for polling, then dropped. */
const RESULT_TTL_MS = 10 * 60_000;
const MAX_BODY_BYTES = 2 * 1024 * 1024;

interface Job {
  token: string;
  request: Parameters<typeof runInSandbox>[0];
  result: RunResult | null;
  createdAt: number;
}

const jobs = new Map<string, Job>();
const queue: Job[] = [];
let active = 0;

const b64d = (value: string | null | undefined): string =>
  value ? Buffer.from(value, 'base64').toString('utf8') : '';
const b64e = (value: string | null): string | null =>
  value === null ? null : Buffer.from(value, 'utf8').toString('base64');

function pump(): void {
  while (active < CONCURRENCY && queue.length > 0) {
    const job = queue.shift()!;
    active += 1;
    void runInSandbox(job.request)
      .then((result) => {
        job.result = result;
      })
      .catch((err) => {
        logger.error({ err, token: job.token }, 'job failed');
        job.result = {
          status: STATUS.INTERNAL_ERROR,
          stdout: null,
          stderr: 'Judge failure',
          compileOutput: null,
          time: '0.000',
          memory: 0,
        };
      })
      .finally(() => {
        active -= 1;
        pump();
      });
  }
}

// Without this, a long-lived judge accumulates every result it ever produced.
setInterval(() => {
  const cutoff = Date.now() - RESULT_TTL_MS;
  for (const [token, job] of jobs) {
    if (job.result !== null && job.createdAt < cutoff) jobs.delete(token);
  }
}, 60_000).unref();

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
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

function serialize(job: Job): Record<string, unknown> {
  if (job.result === null) {
    return { token: job.token, status: active > 0 ? STATUS.PROCESSING : STATUS.IN_QUEUE };
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
    if (!res.headersSent) json(res, 500, { error: 'internal' });
  });
});

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (url.pathname === '/healthz') {
    return json(res, 200, { ok: true, queued: queue.length, active });
  }

  if (url.pathname === '/languages' && req.method === 'GET') {
    return json(
      res,
      200,
      Object.values(LANGUAGES).map((l) => ({ id: l.id, name: l.name })),
    );
  }

  if (url.pathname === '/submissions/batch' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req)) as {
      submissions: Array<{
        language_id: number;
        source_code: string;
        stdin?: string;
        expected_output?: string;
        cpu_time_limit?: number;
        memory_limit?: number;
      }>;
    };

    const created = body.submissions.map((s) => {
      const job: Job = {
        token: randomUUID(),
        createdAt: Date.now(),
        result: null,
        request: {
          languageId: s.language_id,
          source: b64d(s.source_code),
          stdin: b64d(s.stdin),
          expectedOutput: s.expected_output ? b64d(s.expected_output) : null,
          cpuTimeLimit: Math.min(20, Math.max(1, Number(s.cpu_time_limit ?? 5))),
          memoryLimitKb: Math.min(1_048_576, Number(s.memory_limit ?? 262_144)),
        },
      };
      jobs.set(job.token, job);
      queue.push(job);
      return { token: job.token };
    });

    pump();
    return json(res, 201, created);
  }

  if (url.pathname === '/submissions/batch' && req.method === 'GET') {
    const tokens = (url.searchParams.get('tokens') ?? '').split(',').filter(Boolean);
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

server.listen(PORT, () => {
  logger.info(
    { port: PORT, concurrency: CONCURRENCY, languages: Object.keys(LANGUAGES).length },
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
