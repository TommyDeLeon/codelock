import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { loadConfig, shareSessionWithShell } from './api';
import './theme.css';

/**
 * Bootstrap.
 *
 * The API origin comes from the main process, so config has to resolve before
 * anything renders — otherwise the first request goes to the default localhost
 * and fails on an installed build pointed at a real server.
 */
void loadConfig().finally(() => {
  // A signed-in dashboard on a fresh process means this origin's localStorage
  // survived but the shell's copy did not, and only a *login* used to share
  // one. Reconcile before anything renders: the lock screen borrows the
  // shell's copy, and discovering it is missing behind an overlay is the worst
  // possible moment.
  shareSessionWithShell();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
