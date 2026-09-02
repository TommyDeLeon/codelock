import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { loadConfig } from './api';
import { applyTheme, readPreference } from './theme';
import './theme.css';

// Before anything renders, and before the config round trip: the attribute only
// re-points CSS variables, so applying it first costs nothing and avoids a
// visible flash of the OS palette on a machine whose owner chose the other one.
applyTheme(readPreference());

/**
 * Bootstrap.
 *
 * The API origin comes from the main process, so config has to resolve before
 * anything renders — otherwise the first request goes to the default localhost
 * and fails on an installed build pointed at a real server.
 */
void loadConfig().finally(() => {

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
