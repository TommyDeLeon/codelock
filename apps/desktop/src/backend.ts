import { spawn } from 'node:child_process';

/**
 * Bring the backend up when the app opens.
 *
 * CodeLock is three services and a database, and on a self-hosted install they
 * live on the same machine as this window. Without them the app is a shell with
 * nothing behind it: the dashboard cannot load, and — much worse — a timer that
 * fires cannot be solved out of, because grading a submission needs the API and
 * the judge. Expecting the user to remember a terminal first is expecting them
 * to remember it at the moment they are locked out.
 *
 * Two rules keep this from being reckless. It never runs unless the user put a
 * command in their own config, and it never runs while the API is already
 * answering — so opening a second window, or opening the app on a machine where
 * a service manager already handles this, does nothing at all.
 */

export interface BackendDeps {
  apiUrl: string;
  command: string;
  fetchFn?: typeof fetch;
  spawnFn?: typeof spawn;
  /** How long to wait for the health probe before deciding it is down. */
  probeTimeoutMs?: number;
}

export type BackendOutcome =
  /** Already answering; nothing was started. */
  | 'already-running'
  /** No command configured, so nothing could be started. */
  | 'not-configured'
  /** The command was launched. It is detached; we do not wait for it. */
  | 'started'
  /** A command was configured but could not be launched. */
  | 'failed';

/** `/healthz` is the cheap liveness route; it touches no database. */
export async function isBackendUp(
  apiUrl: string,
  fetchFn: typeof fetch = fetch,
  timeoutMs = 2_000,
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(`${apiUrl}/healthz`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Split a command string into an executable and arguments.
 *
 * Quoted segments stay together, because the common case here is a path with
 * spaces — `-File "C:\Program Files\...\serve.ps1"` must not become three
 * arguments. This is deliberately not a shell: nothing is expanded, and the
 * command is never handed to cmd for interpretation.
 */
export function splitCommand(command: string): { file: string; args: string[] } | null {
  const parts = command.match(/"[^"]*"|\S+/g);
  if (!parts || parts.length === 0) return null;
  const unquote = (s: string) => (s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s);
  return { file: unquote(parts[0]!), args: parts.slice(1).map(unquote) };
}

/**
 * What the launcher last concluded, if it left a note.
 *
 * The app can see that the API is not answering, and that is the symptom of
 * every possible cause. Only the launcher knows whether Docker is missing,
 * stopped, or fine — and "install Docker Desktop" and "wait, it is starting"
 * are messages a user must not have to guess between.
 */
export interface BackendStatus {
  docker: 'running' | 'not-running' | 'not-installed' | 'no-container' | string;
  services: Record<string, boolean>;
  checkedAt: string;
}

export function readBackendStatus(
  statusPath: string,
  readFile: (p: string) => string,
): BackendStatus | null {
  try {
    const parsed = JSON.parse(readFile(statusPath)) as Partial<BackendStatus>;
    if (typeof parsed.docker !== 'string') return null;
    return {
      docker: parsed.docker,
      services: parsed.services ?? {},
      checkedAt: parsed.checkedAt ?? '',
    };
  } catch {
    // No note, or an unreadable one. Absence is not a diagnosis; the caller
    // falls back to a generic message rather than inventing a specific one.
    return null;
  }
}

/** The message to show when the backend never came up. */
export function diagnose(status: BackendStatus | null): {
  title: string;
  detail: string;
  installDocker: boolean;
} {
  switch (status?.docker) {
    case 'not-installed':
      return {
        title: 'CodeLock needs Docker',
        detail:
          'The database and the sandbox that runs your submissions both run in Docker, and it is not installed on this machine.\n\n' +
          'Install Docker Desktop, then open CodeLock again. Nothing else needs setting up — CodeLock creates its own database container on first run.',
        installDocker: true,
      };
    case 'not-running':
      return {
        title: 'Waiting for Docker',
        detail:
          'Docker Desktop is installed but was not running, so CodeLock started it. It can take a minute or two to be ready.\n\n' +
          'Leave CodeLock open; it will connect as soon as Docker is up.',
        installDocker: false,
      };
    case 'no-container':
      return {
        title: 'Setting up the database',
        detail:
          'Docker is running and CodeLock is creating its database container. This only happens once, and it can take a moment.',
        installDocker: false,
      };
    default:
      return {
        title: 'CodeLock cannot reach its server',
        detail:
          'The API is not answering. If you host it yourself, check that it is running; the logs are in %LOCALAPPDATA%\\CodeLock\\logs.',
        installDocker: false,
      };
  }
}

export async function ensureBackend(deps: BackendDeps): Promise<BackendOutcome> {
  const fetchFn = deps.fetchFn ?? fetch;
  const spawnFn = deps.spawnFn ?? spawn;

  if (await isBackendUp(deps.apiUrl, fetchFn, deps.probeTimeoutMs)) return 'already-running';

  const command = deps.command.trim();
  if (!command) return 'not-configured';

  const parsed = splitCommand(command);
  if (!parsed) return 'failed';

  try {
    // Detached and unref'd: the services must outlive this window, or closing
    // it to the tray would take the backend down with it.
    const child = spawnFn(parsed.file, parsed.args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();
    return 'started';
  } catch {
    return 'failed';
  }
}
