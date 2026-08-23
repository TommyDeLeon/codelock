import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * The bundled renderer.
 *
 * Built to `dist-renderer` and served by the main process over the app://
 * scheme, so the desktop dashboard and settings work without the web app being
 * reachable. Relative asset paths are required: app://codelock/index.html has
 * no server to resolve a root-absolute /assets/… against.
 */
export default defineConfig({
  root: path.join(import.meta.dirname, 'renderer'),
  base: './',
  plugins: [react()],
  build: {
    outDir: path.join(import.meta.dirname, 'dist-renderer'),
    emptyOutDir: true,
    // A single file per kind keeps the app:// handler trivial and the startup
    // free of waterfall requests.
    target: 'chrome128',
  },
  server: { port: 5174, strictPort: true },
});
