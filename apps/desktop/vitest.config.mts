import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Pure modules only: the lock state machine and the kill switch must be
  // testable without booting Electron, which is why neither imports it.
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
