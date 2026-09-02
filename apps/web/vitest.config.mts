import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@codelock/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // Without an explicit URL jsdom serves an opaque origin, and an opaque
    // origin has no localStorage — `window.localStorage` is undefined rather
    // than throwing something recognisable. Every request then dies inside
    // `tokenStore.access` before fetch is reached, so a spec that stubs a
    // successful response still sees an outage. A spec asserting failure then
    // passes for entirely the wrong reason, and one asserting success fails
    // with no clue why.
    environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
