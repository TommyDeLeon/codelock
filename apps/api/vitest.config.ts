import { defineConfig } from 'vitest/config';

/**
 * env.ts deliberately calls process.exit() on missing configuration, which is
 * right for a server and fatal for a test runner. Supplying throwaway values
 * here keeps that strictness in production while letting pure units — the
 * difficulty ladder, the performance gate — be tested without a real
 * environment. These values are never used to reach anything.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test?schema=public',
      JWT_ACCESS_SECRET: 'test-access-secret-that-is-long-enough-0000',
      JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-long-enough-000',
      JWT_UNLOCK_SECRET: 'test-unlock-secret-that-is-long-enough-0000',
      ENCRYPTION_KEY: 'test-encryption-key-that-is-long-enough-00',
      JUDGE0_URL: 'http://localhost:2358',
      // The performance tests assert exact gate values, so they must not
      // silently drift if the production defaults are retuned.
      PERF_TOLERANCE: '1.35',
      PERF_FLOOR_MS: '40',
      PERF_BEST_OF: '2',
    },
  },
});
