import { z } from 'zod';

/**
 * Fail fast on boot rather than at the first request that touches a missing
 * variable. A misconfigured secret in a lock app means either "nobody can
 * unlock" or "everybody can" — neither should be discovered in production.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_UNLOCK_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  JUDGE0_URL: z.string().url(),
  JUDGE0_KEY: z.string().optional().default(''),
  JUDGE0_HOST: z.string().optional().default(''),
  JUDGE0_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
  // Language ids differ per Judge0 release; defaults match judge0:1.13.1 as
  // pinned in docker-compose.yml. See services/judge0.ts.
  JUDGE0_LANG_JAVASCRIPT: z.coerce.number().int().positive().default(63),
  JUDGE0_LANG_TYPESCRIPT: z.coerce.number().int().positive().default(74),
  JUDGE0_LANG_PYTHON: z.coerce.number().int().positive().default(71),
  JUDGE0_LANG_JAVA: z.coerce.number().int().positive().default(62),
  JUDGE0_LANG_CPP: z.coerce.number().int().positive().default(54),
  JUDGE0_LANG_GO: z.coerce.number().int().positive().default(60),

  DIFFICULTY_MODE: z.enum(['rules', 'hybrid']).default('rules'),

  // --- performance gate ---
  /// Multiplier on the best known runtime. 1.35 = 'within 35% of the best'.
  PERF_TOLERANCE: z.coerce.number().min(1).max(10).default(1.35),
  /// Added to every budget to absorb judge jitter on very fast problems.
  PERF_FLOOR_MS: z.coerce.number().int().min(0).max(5000).default(40),
  /// Timed runs for an otherwise-passing submission; the fastest one counts.
  PERF_BEST_OF: z.coerce.number().int().min(1).max(5).default(2),
  OPENAI_API_KEY: z.string().optional().default(''),

  // --- admission control ---
  /// Concurrent grades across this process. Each one is a container holding a
  /// full core, so this is a CPU budget for the host, not a throughput dial.
  GRADE_CONCURRENCY: z.coerce.number().int().min(1).max(64).default(4),
  /// How many requests may wait for a slot before we start refusing. An
  /// unbounded queue only converts CPU exhaustion into memory exhaustion.
  GRADE_QUEUE_DEPTH: z.coerce.number().int().min(0).max(500).default(20),

  // --- observability ---
  /// Error tracking. Everything stays local when unset; nothing is sent.
  SENTRY_DSN: z.string().optional().default(''),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  /// Shown in Sentry and in the health endpoint, so a report can be tied to a
  /// deployment. CI passes the git sha.
  RELEASE_SHA: z.string().optional().default('dev'),

  // --- integrations ---
  /// Encrypts third-party OAuth tokens at rest. Rotating it invalidates every
  /// stored token, forcing users to reconnect — it is not a routine rotation.
  ENCRYPTION_KEY: z.string().min(32),
  GITHUB_API_URL: z.string().url().default('https://api.github.com'),
  GITHUB_CLIENT_ID: z.string().optional().default(''),
  GITHUB_CLIENT_SECRET: z.string().optional().default(''),
  /// Must exactly match the callback registered on the GitHub OAuth app.
  GITHUB_CALLBACK_URL: z.string().optional().default(''),
  /// Where to bounce the browser once the OAuth dance finishes.
  APP_URL: z.string().url().default('http://localhost:3000'),
  /// This API's own public origin. Identity-provider redirect URIs are built
  /// from it, and they must match what is registered with the provider exactly
  /// — a mismatch is rejected by the provider rather than by us.
  API_URL: z.string().url().default('http://localhost:4000'),
  /// Sign in with Google. Empty disables the button rather than breaking it:
  /// the login screen only offers providers this deployment can complete.
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

const raw = parsed.data;

if (raw.NODE_ENV === 'production') {
  const secrets = [raw.JWT_ACCESS_SECRET, raw.JWT_REFRESH_SECRET, raw.JWT_UNLOCK_SECRET];
  if (new Set(secrets).size !== secrets.length) {
    console.error('JWT secrets must be distinct in production.');
    process.exit(1);
  }
  if (secrets.some((s) => s.startsWith('change-me'))) {
    console.error('Refusing to boot with placeholder JWT secrets.');
    process.exit(1);
  }
}

export const env = {
  ...raw,
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  isProd: raw.NODE_ENV === 'production',
} as const;
