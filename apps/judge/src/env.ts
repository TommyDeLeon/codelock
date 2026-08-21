/**
 * Fail fast on boot rather than at the first submission.
 *
 * The judge has few settings, but every one of them is a number parsed out of a
 * string, and `Number('four')` is `NaN` rather than an error. A `NaN`
 * concurrency means the worker pool never starts a job and the service looks
 * hung; a `NaN` port means `listen` picks a random one. Both are far harder to
 * diagnose from a running container than from a refusal to start.
 *
 * No zod here on purpose — the judge deliberately has no dependencies beyond
 * Node, so a compromised sandbox has the smallest possible surface to reach.
 */

interface JudgeEnv {
  PORT: number;
  JUDGE_CONCURRENCY: number;
  DOCKER_BIN: string;
  LOG_LEVEL: string;
}

const problems: string[] = [];

function intVar(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    problems.push(`  - ${name}: expected a whole number, got ${JSON.stringify(raw)}`);
    return fallback;
  }
  if (parsed < min || parsed > max) {
    problems.push(`  - ${name}: must be between ${min} and ${max}, got ${parsed}`);
    return fallback;
  }
  return parsed;
}

function stringVar(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw === undefined || raw === '' ? fallback : raw;
}

const parsed: JudgeEnv = {
  PORT: intVar('PORT', 2358, 1, 65_535),
  // Each concurrent run gets a full core, so this is a CPU budget. Above 64 the
  // host is being asked for more than it has on any plausible box.
  JUDGE_CONCURRENCY: intVar('JUDGE_CONCURRENCY', 4, 1, 64),
  DOCKER_BIN: stringVar('DOCKER_BIN', 'docker'),
  LOG_LEVEL: stringVar('LOG_LEVEL', 'info'),
};

if (problems.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`Invalid judge environment:\n${problems.join('\n')}`);
  process.exit(1);
}

export const env: JudgeEnv = parsed;
