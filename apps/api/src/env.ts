import { z } from 'zod';

/**
 * Fail fast on boot rather than at the first request that touches a missing
 * variable. A misconfigured secret in a lock app means either "nobody can
 * unlock" or "everybody can" — neither should be discovered in production.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default('127.0.0.1'),
  TRUST_PROXY: z.string().default(''),

  DATABASE_URL: z.string().url(),

  JWT_UNLOCK_SECRET: z.string().min(32),

  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Only the bundled loopback/Compose judge is supported; no metered endpoint.
  JUDGE0_URL: z.string().url().refine((value) => {
    const url = new URL(value);
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]', 'judge'].includes(url.hostname)
      && !url.username && !url.password && !url.search && !url.hash
      && url.pathname === '/';
  }, 'Use the bundled judge at http://127.0.0.1:2358 or http://judge:2358')
    .default('http://127.0.0.1:2358'),
  JUDGE0_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
  // Language ids differ per Judge0 release; defaults match judge0:1.13.1 as
  // pinned in docker-compose.yml. See services/judge0.ts.
  JUDGE0_LANG_JAVASCRIPT: z.coerce.number().int().positive().default(63),
  JUDGE0_LANG_TYPESCRIPT: z.coerce.number().int().positive().default(74),
  JUDGE0_LANG_PYTHON: z.coerce.number().int().positive().default(71),
  JUDGE0_LANG_JAVA: z.coerce.number().int().positive().default(62),
  JUDGE0_LANG_CPP: z.coerce.number().int().positive().default(54),
  JUDGE0_LANG_GO: z.coerce.number().int().positive().default(60),


  // --- performance gate ---
  /// Multiplier on the best known runtime. 1.35 = 'within 35% of the best'.
  PERF_TOLERANCE: z.coerce.number().min(1).max(10).default(1.35),
  /// Added to every budget to absorb judge jitter on very fast problems.
  PERF_FLOOR_MS: z.coerce.number().int().min(0).max(5000).default(40),
  /// Timed runs for an otherwise-passing submission; the fastest one counts.
  PERF_BEST_OF: z.coerce.number().int().min(1).max(5).default(2),

  // --- admission control ---
  /// Concurrent grades across this process. Each one is a container holding a
  /// full core, so this is a CPU budget for the host, not a throughput dial.
  GRADE_CONCURRENCY: z.coerce.number().int().min(1).max(64).default(4),
  /// How many requests may wait for a slot before we start refusing. An
  /// unbounded queue only converts CPU exhaustion into memory exhaustion.
  GRADE_QUEUE_DEPTH: z.coerce.number().int().min(0).max(500).default(20),

  // Nothing else belongs here.
  //
  // RELEASE_SHA, APP_URL and ENCRYPTION_KEY used to sit below this line, left
  // behind by the accounts-and-integrations era. The first two were read by
  // nothing. The third was worse than dead: it was *required*, with no default,
  // to feed an OAuth-token encryption helper that nothing imported — and it was
  // absent from .env.example, so following the README's own setup produced an
  // API that exited with "ENCRYPTION_KEY: Required" and never booted.
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
  if (raw.JWT_UNLOCK_SECRET.startsWith('change-me')) {
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
