import { spawn, spawnSync } from 'node:child_process';
import { env } from './env.js';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile, readFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { LANGUAGES, STATUS, type LanguageSpec } from './languages.js';
import { logger } from './logger.js';

/**
 * Sandboxed execution using one throwaway container per run.
 *
 * Judge0 uses `isolate`, which needs cgroup v1 and therefore cannot run on
 * Docker Desktop or any cgroup-v2-only host. Docker's own container isolation
 * works fine on cgroup v2, so this achieves the same goal through the runtime
 * that is already present.
 *
 * The containment, and why each part is there:
 *
 *   --network none          Submitted code cannot phone home, exfiltrate the
 *                           problem set, or attack the rest of the network.
 *   --memory / --memory-swap Equal values disable swap, so a memory bomb is
 *                           OOM-killed instead of thrashing the host.
 *   --cpus                  One core, so a spin loop cannot starve other runs.
 *   --pids-limit            Caps fork bombs.
 *   --read-only + tmpfs     The image is immutable; only a small capped tmpfs
 *                           is writable, and it dies with the container.
 *   --cap-drop ALL          No capabilities at all.
 *   --security-opt no-new-privileges  setuid binaries cannot escalate.
 *   --user 65534:65534      Runs as nobody, never root.
 *   source mounted :ro      Code cannot rewrite itself mid-run.
 *
 * The honest caveat: this is container isolation, not a hardened
 * microVM. A kernel-level container escape would defeat it, as it would defeat
 * Judge0. For untrusted public submissions, run this service on a dedicated
 * host — see SECURITY in apps/judge/README.md.
 */

export interface RunRequest {
  languageId: number;
  source: string;
  stdin: string;
  expectedOutput: string | null;
  cpuTimeLimit: number;
  memoryLimitKb: number;
}

export interface RunResult {
  status: { id: number; description: string };
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  /** Wall-clock seconds, as a string, matching Judge0's shape. */
  time: string;
  memory: number;
}

const DOCKER = env.DOCKER_BIN;
/** Grace added to the CPU limit before the host force-kills the container. */
const KILL_GRACE_MS = 5_000;
/** Output beyond this is truncated; a print loop must not exhaust our memory. */
const MAX_OUTPUT_BYTES = 256 * 1024;

export async function runInSandbox(request: RunRequest): Promise<RunResult> {
  const spec = LANGUAGES[request.languageId];
  if (!spec) {
    return internal(`Unsupported language id ${request.languageId}`);
  }

  // A host temp dir holds the source; it is bind-mounted read-only and removed
  // in the finally block whatever happens.
  const workdir = await mkdtemp(path.join(tmpdir(), 'codelock-run-'));
  try {
    await writeFile(path.join(workdir, spec.filename), request.source, 'utf8');
    // mkdtemp creates 0700 and writeFile 0600, both owned by the uid the judge
    // runs as. The sandbox runs as --user 65534:65534, so without this it
    // cannot traverse the directory or read the source, and every language
    // fails identically with a permission error that looks like broken code.
    await chmod(workdir, 0o755);
    await chmod(path.join(workdir, spec.filename), 0o644);
    return await execute(spec, workdir, request);
  } catch (err) {
    logger.error({ err }, 'sandbox run failed');
    return internal(err instanceof Error ? err.message : 'Unknown sandbox failure');
  } finally {
    await rm(workdir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function execute(
  spec: LanguageSpec,
  workdir: string,
  request: RunRequest,
): Promise<RunResult> {
  const memoryMb = Math.max(64, Math.ceil(request.memoryLimitKb / 1024));

  // Naming the container is what makes cleanup possible. '--rm' is executed by
  // the docker *client*, so when the host backstop below has to SIGKILL that
  // client, --rm never runs and the container keeps executing — one leaked
  // CPU-bound container per timed-out submission, forever. Found exactly that
  // way: two node containers still spinning 24 minutes after the test run.
  const containerName = `codelock-run-${randomUUID()}`;

  const args = [
    'run',
    '--rm',
    '-i',
    '--name', containerName,
    '--network', 'none',
    '--memory', `${memoryMb}m`,
    '--memory-swap', `${memoryMb}m`,
    '--cpus', '1',
    '--pids-limit', '128',
    '--read-only',
    // exec is required: compilers and `go run` write and execute binaries here.
    '--tmpfs', '/tmp:rw,exec,nosuid,size=256m',
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges',
    '--user', '65534:65534',
    '-v', `${toDockerPath(workdir)}:/work:ro`,
    '-w', '/tmp',
    '-e', 'HOME=/tmp',
    spec.image,
    'sh', '-c',
    timedCommand(spec.command, request.cpuTimeLimit),
  ];

  const wallStarted = process.hrtime.bigint();
  const outcome = await spawnCollect(DOCKER, args, request.stdin, request.cpuTimeLimit, containerName);
  const wallSeconds = Number(process.hrtime.bigint() - wallStarted) / 1e9;

  // Prefer the in-container measurement. Wall time includes ~0.5-1s of image
  // start-up that varies run to run, which would swamp the algorithmic
  // difference the speed gate exists to detect.
  const probed = extractProbedMs(outcome);
  const elapsedSeconds = probed !== null ? probed / 1000 : wallSeconds;

  // g++ redirects its diagnostics here so a compile error is reportable
  // separately from the program's own stderr.
  const compileLog = await readFile(path.join(workdir, 'cc.log'), 'utf8').catch(() => null);

  return classify(spec, request, outcome, elapsedSeconds, compileLog);
}

interface SpawnOutcome {
  stdout: string;
  stderr: string;
  code: number | null;
  killedByHost: boolean;
}

/** Force-remove a container the client may have left behind. */
function forceRemove(containerName: string): void {
  // Synchronous and best-effort: this runs on a kill path where we cannot rely
  // on the event loop still servicing this job.
  spawnSync(DOCKER, ['rm', '-f', containerName], { stdio: 'ignore', timeout: 10_000 });
}

function spawnCollect(
  command: string,
  args: string[],
  stdin: string,
  cpuTimeLimit: number,
  containerName: string,
): Promise<SpawnOutcome> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let killedByHost = false;

    const timer = setTimeout(
      () => {
        killedByHost = true;
        child.kill('SIGKILL');
        // The container outlives its client, so remove it explicitly.
        forceRemove(containerName);
      },
      cpuTimeLimit * 1000 + KILL_GRACE_MS,
    );

    const cap = (current: string, chunk: Buffer): string =>
      current.length >= MAX_OUTPUT_BYTES ? current : current + chunk.toString('utf8');

    child.stdout.on('data', (c: Buffer) => (stdout = cap(stdout, c)));
    child.stderr.on('data', (c: Buffer) => (stderr = cap(stderr, c)));
    // A program that never reads stdin makes this pipe fail; that is not an error.
    child.stdin.on('error', () => undefined);
    child.stdin.end(stdin);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code, killedByHost });
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      forceRemove(containerName);
      resolve({ stdout: '', stderr: String(err), code: null, killedByHost });
    });
  });
}

function classify(
  spec: LanguageSpec,
  request: RunRequest,
  outcome: SpawnOutcome,
  elapsedSeconds: number,
  compileLog: string | null,
): RunResult {
  const base = {
    stdout: outcome.stdout || null,
    stderr: outcome.stderr || null,
    compileOutput: compileLog,
    time: elapsedSeconds.toFixed(3),
    // Docker does not report peak RSS after the container is gone. Reporting
    // the ceiling is honest about that rather than inventing a number, and
    // CodeLock's gate is time-based regardless.
    memory: request.memoryLimitKb,
  };

  // 137 = SIGKILL, which `timeout -s KILL` and the OOM killer both produce.
  if (outcome.killedByHost || outcome.code === 124 || outcome.code === 137) {
    // Distinguishing OOM from timeout: an OOM kill leaves elapsed well under
    // the limit, whereas a timeout runs right up to it.
    const overTime = elapsedSeconds >= request.cpuTimeLimit * 0.9;
    return {
      ...base,
      status: overTime ? STATUS.TIME_LIMIT_EXCEEDED : STATUS.MEMORY_LIMIT_EXCEEDED,
    };
  }

  if (outcome.code !== 0) {
    const looksLikeCompileError =
      spec.compiled && (compileLog !== null || /error:|cannot find symbol/i.test(outcome.stderr));
    return {
      ...base,
      status: looksLikeCompileError ? STATUS.COMPILATION_ERROR : STATUS.RUNTIME_ERROR,
      compileOutput: looksLikeCompileError ? (compileLog ?? outcome.stderr) : compileLog,
    };
  }

  if (request.expectedOutput === null) return { ...base, status: STATUS.ACCEPTED };

  // Judge0 trims trailing whitespace before comparing, so "42\n" === "42".
  const got = outcome.stdout.replace(/\s+$/, '');
  const want = request.expectedOutput.replace(/\s+$/, '');
  return { ...base, status: got === want ? STATUS.ACCEPTED : STATUS.WRONG_ANSWER };
}

function internal(message: string): RunResult {
  return {
    status: STATUS.INTERNAL_ERROR,
    stdout: null,
    stderr: message,
    compileOutput: null,
    time: '0.000',
    memory: 0,
  };
}

const PROBE_MARKER = '__CODELOCK_MS__';

/**
 * Wrap the language command so the container reports its own elapsed time.
 *
 * Timing the `docker run` from outside measures image start-up too, which on
 * this host is 0.5-1s and varies by more than the algorithmic difference we are
 * trying to measure. Timing inside gives the program's own duration.
 *
 * Portability: GNU `date +%s%N` gives nanoseconds, but busybox (Alpine) ignores
 * %N and returns seconds only. Detect that by digit count and fall back to
 * /proc/uptime, which exists on every Linux at centisecond resolution. Both
 * ends of a measurement use the same source, so the difference is consistent.
 */
function timedCommand(command: string, cpuTimeLimit: number): string {
  return [
    '_now_ms() {',
    '  n=$(date +%s%N 2>/dev/null);',
    '  if [ ${#n} -ge 16 ]; then echo $((n/1000000));',
    "  else awk '{printf \"%d\\n\", $1*1000}' /proc/uptime; fi;",
    '};',
    '_s=$(_now_ms);',
    // The in-container timeout is the real CPU guard; the host-side kill is a
    // backstop for a container that ignores it.
    `timeout -s KILL ${cpuTimeLimit} sh -c ${shellQuote(command)};`,
    '_rc=$?;',
    '_e=$(_now_ms);',
    `echo "${PROBE_MARKER}$((_e-_s))" >&2;`,
    'exit $_rc',
  ].join(' ');
}

/**
 * Pull the probe out of stderr and strip it, so a program's real stderr is
 * reported unchanged. Mutates `outcome.stderr` deliberately: the marker is our
 * own bookkeeping and must never reach the user.
 */
function extractProbedMs(outcome: SpawnOutcome): number | null {
  const match = new RegExp(`${PROBE_MARKER}(\\d+)\\s*$`, 'm').exec(outcome.stderr);
  if (!match) return null;
  outcome.stderr = outcome.stderr.replace(match[0], '').replace(/\s+$/, '');
  return Number(match[1]);
}

/** Single-quote for `sh -c`, escaping embedded quotes. */
function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

/**
 * Docker on Windows needs a POSIX-style path for bind mounts:
 * C:\Users\x -> /c/Users/x. A no-op everywhere else.
 */
function toDockerPath(hostPath: string): string {
  const match = /^([A-Za-z]):[\\/](.*)$/.exec(hostPath);
  if (!match) return hostPath;
  return `/${match[1]!.toLowerCase()}/${match[2]!.replaceAll('\\', '/')}`;
}
