import { describe, expect, it, vi } from 'vitest';
import { diagnose, ensureBackend, readBackendStatus, splitCommand } from './backend.js';

/**
 * This function starts a process on the user's machine at app launch, so the
 * cases that matter most are the ones where it must NOT.
 */

const ok = () => new Response('{"ok":true}', { status: 200 });
const dead = () => {
  throw new Error('ECONNREFUSED');
};

function spawnStub() {
  const calls: { file: string; args: string[] }[] = [];
  const fn = vi.fn((file: string, args: string[]) => {
    calls.push({ file, args });
    return { unref: vi.fn() };
  });
  return { fn: fn as unknown as typeof import('node:child_process').spawn, calls };
}

describe('ensureBackend', () => {
  it('does nothing when the API already answers', async () => {
    const spawn = spawnStub();
    const outcome = await ensureBackend({
      apiUrl: 'http://localhost:4000',
      command: 'powershell.exe -File serve.ps1',
      fetchFn: vi.fn(ok) as unknown as typeof fetch,
      spawnFn: spawn.fn,
    });

    expect(outcome).toBe('already-running');
    expect(spawn.calls).toHaveLength(0);
  });

  // The default. An installed app that runs commands nobody asked it to run is
  // a different and much worse product than this one.
  it('does nothing when no command is configured, even with the API down', async () => {
    const spawn = spawnStub();
    const outcome = await ensureBackend({
      apiUrl: 'http://localhost:4000',
      command: '',
      fetchFn: vi.fn(dead) as unknown as typeof fetch,
      spawnFn: spawn.fn,
    });

    expect(outcome).toBe('not-configured');
    expect(spawn.calls).toHaveLength(0);
  });

  it('treats whitespace as no command', async () => {
    const spawn = spawnStub();
    const outcome = await ensureBackend({
      apiUrl: 'http://localhost:4000',
      command: '   ',
      fetchFn: vi.fn(dead) as unknown as typeof fetch,
      spawnFn: spawn.fn,
    });

    expect(outcome).toBe('not-configured');
    expect(spawn.calls).toHaveLength(0);
  });

  it('launches the configured command when the API is down', async () => {
    const spawn = spawnStub();
    const outcome = await ensureBackend({
      apiUrl: 'http://localhost:4000',
      command: 'powershell.exe -NoProfile -File "D:\\my repo\\serve.ps1"',
      fetchFn: vi.fn(dead) as unknown as typeof fetch,
      spawnFn: spawn.fn,
    });

    expect(outcome).toBe('started');
    expect(spawn.calls).toHaveLength(1);
    expect(spawn.calls[0]).toEqual({
      file: 'powershell.exe',
      // The quoted path stays one argument; a repo under "Program Files" would
      // otherwise arrive as three.
      args: ['-NoProfile', '-File', 'D:\\my repo\\serve.ps1'],
    });
  });

  it('reports failure instead of throwing when the command cannot start', async () => {
    const outcome = await ensureBackend({
      apiUrl: 'http://localhost:4000',
      command: 'does-not-exist.exe',
      fetchFn: vi.fn(dead) as unknown as typeof fetch,
      spawnFn: (() => {
        throw new Error('ENOENT');
      }) as unknown as typeof import('node:child_process').spawn,
    });

    expect(outcome).toBe('failed');
  });

  it('treats a non-ok health response as down', async () => {
    const spawn = spawnStub();
    const outcome = await ensureBackend({
      apiUrl: 'http://localhost:4000',
      command: 'serve.exe',
      fetchFn: vi.fn(async () => new Response('nope', { status: 503 })) as unknown as typeof fetch,
      spawnFn: spawn.fn,
    });

    expect(outcome).toBe('started');
  });
});

describe('diagnose', () => {
  it('offers to install Docker only when it is genuinely absent', () => {
    const missing = diagnose({ docker: 'not-installed', services: {}, checkedAt: '' });
    expect(missing.installDocker).toBe(true);
    expect(missing.detail).toMatch(/Install Docker Desktop/i);

    for (const docker of ['not-running', 'no-container', 'running']) {
      expect(diagnose({ docker, services: {}, checkedAt: '' }).installDocker).toBe(false);
    }
  });

  // Telling someone to install software they already have is worse than saying
  // nothing: they go and check, find it there, and stop trusting the message.
  it('tells the user to wait when Docker is merely starting', () => {
    const starting = diagnose({ docker: 'not-running', services: {}, checkedAt: '' });
    expect(starting.title).toMatch(/Waiting for Docker/i);
    // The copy may say Docker "is installed"; what it must never say is go and
    // install it.
    expect(starting.detail).not.toMatch(/install docker desktop/i);
    expect(starting.installDocker).toBe(false);
  });

  it('falls back to a generic message when there is no status to read', () => {
    const unknown = diagnose(null);
    expect(unknown.installDocker).toBe(false);
    expect(unknown.detail).toMatch(/logs/i);
  });
});

describe('readBackendStatus', () => {
  it('reads a status the launcher wrote', () => {
    const status = readBackendStatus('any', () =>
      JSON.stringify({
        docker: 'not-installed',
        services: { api: false, web: false, judge: false },
        checkedAt: '2026-08-30T03:00:00.000Z',
      }),
    );
    expect(status?.docker).toBe('not-installed');
    expect(status?.services.api).toBe(false);
  });

  it('returns null rather than guessing when the file is missing or corrupt', () => {
    expect(
      readBackendStatus('any', () => {
        throw new Error('ENOENT');
      }),
    ).toBeNull();
    expect(readBackendStatus('any', () => 'not json')).toBeNull();
    expect(readBackendStatus('any', () => '{"services":{}}')).toBeNull();
  });
});

describe('splitCommand', () => {
  it('keeps quoted paths together', () => {
    expect(splitCommand('"C:\\Program Files\\x.exe" -a "b c"')).toEqual({
      file: 'C:\\Program Files\\x.exe',
      args: ['-a', 'b c'],
    });
  });

  it('returns null for an empty command', () => {
    expect(splitCommand('   ')).toBeNull();
  });
});
