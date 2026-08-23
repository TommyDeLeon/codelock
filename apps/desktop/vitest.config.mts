import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Two kinds of test in one workspace, deliberately.
    //
    // src/ holds pure modules — the lock state machine and the kill switch —
    // which must stay testable without booting Electron, and which are the
    // main process, not the renderer. They run on `node` and get no DOM.
    //
    // renderer/ is React and needs one. environmentMatchGlobs keeps the split
    // declarative rather than making every renderer file carry a docblock
    // pragma that is easy to forget on the next file added.
    include: ['src/**/*.test.ts', 'renderer/**/*.test.{ts,tsx}'],
    environment: 'node',
    environmentMatchGlobs: [['renderer/**', 'jsdom']],
    restoreMocks: true,
  },
});
