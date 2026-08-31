import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { loadConfig } from './api';
import './theme.css';

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
