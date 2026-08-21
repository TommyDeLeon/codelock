import { describe, expect, it, beforeAll } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { runInSandbox, type RunResult } from './sandbox.js';
import { STATUS } from './languages.js';

const exec = promisify(execFile);

/**
 * The containment checks.
 *
 * These are the claims apps/judge/README.md makes about the sandbox, executed
 * rather than asserted in prose. They were verified by hand once; a hand
 * verification is only true on the day it happened, and every one of these
 * flags is one careless edit away from disappearing.
 *
 * They run real containers, so they need a Docker daemon and they are slow.
 * CI runs them on every tag; locally they skip when Docker is absent rather
 * than failing and teaching everyone to ignore a red suite.
 *
 * JavaScript (id 63) throughout: node:24-alpine is small, starts fast, and
 * needs no compile step, so each check times out on the thing being tested
 * rather than on a toolchain.
 */

const JS = 63;
let dockerAvailable = false;

async function run(source: string, overrides: Partial<Parameters<typeof runInSandbox>[0]> = {}) {
  return runInSandbox({
    languageId: JS,
    source,
    stdin: '',
    expectedOutput: null,
    cpuTimeLimit: 5,
    memoryLimitKb: 256 * 1024,
    ...overrides,
  });
}

/** Everything the container printed, whichever stream it chose. */
const output = (result: RunResult): string =>
  `${result.stdout ?? ''}\n${result.stderr ?? ''}\n${result.compileOutput ?? ''}`;

beforeAll(async () => {
  try {
    await exec('docker', ['version', '--format', '{{.Server.Version}}']);
    dockerAvailable = true;
    // Pre-pull so the first check does not time out on an image download.
    await exec('docker', ['pull', 'node:24-alpine'], { timeout: 300_000 });
  } catch {
    dockerAvailable = false;
  }
}, 360_000);

const check = (name: string, fn: () => Promise<void>, timeout = 90_000) =>
  it(name, async (ctx) => {
    if (!dockerAvailable) return ctx.skip();
    await fn();
  }, timeout);

describe('sandbox containment', () => {
  // 1-2: --network none
  check('1. cannot resolve a hostname', async () => {
    // `dns.lookup` does not fail fast with no network — getaddrinfo simply
    // never returns, and an earlier version of this check was killed by the
    // time limit before it printed anything. Race it against our own timer so
    // the probe reports rather than hangs.
    const result = await run(`
      const dns = require('node:dns');
      let done = false;
      const finish = (msg) => { if (!done) { done = true; console.log(msg); process.exit(0); } };
      setTimeout(() => finish('BLOCKED:timeout'), 2000);
      dns.lookup('example.com', (err) => finish(err ? 'BLOCKED:' + err.code : 'RESOLVED'));
    `);
    expect(output(result)).toContain('BLOCKED');
    expect(output(result)).not.toContain('RESOLVED');
  });

  check('2. cannot open a socket to a raw IP', async () => {
    const result = await run(`
      const net = require('node:net');
      const s = net.connect(53, '1.1.1.1');
      s.setTimeout(3000);
      s.on('connect', () => { console.log('CONNECTED'); process.exit(0); });
      s.on('error', () => { console.log('BLOCKED'); process.exit(0); });
      s.on('timeout', () => { console.log('BLOCKED'); process.exit(0); });
    `);
    expect(output(result)).toContain('BLOCKED');
    expect(output(result)).not.toContain('CONNECTED');
  });

  // 3-4: --read-only
  check('3. cannot write to /etc', async () => {
    const result = await run(`
      const fs = require('node:fs');
      try { fs.writeFileSync('/etc/codelock', 'x'); console.log('WROTE'); }
      catch (e) { console.log('BLOCKED', e.code); }
    `);
    expect(output(result)).toContain('BLOCKED');
    expect(output(result)).not.toContain('WROTE');
  });

  check('4. cannot write anywhere on the root filesystem', async () => {
    const result = await run(`
      const fs = require('node:fs');
      const targets = ['/x', '/usr/x', '/var/x', '/root/x'];
      const wrote = targets.filter((t) => {
        try { fs.writeFileSync(t, 'x'); return true; } catch { return false; }
      });
      console.log('WROTE:' + JSON.stringify(wrote));
    `);
    expect(output(result)).toContain('WROTE:[]');
  });

  // 5: --user 65534:65534
  check('5. runs as uid 65534, never root', async () => {
    const result = await run(`console.log('UID:' + process.getuid() + ' GID:' + process.getgid());`);
    expect(output(result)).toContain('UID:65534');
    expect(output(result)).toContain('GID:65534');
  });

  // 6: --cap-drop ALL
  check('6. holds no Linux capabilities', async () => {
    const result = await run(`
      const fs = require('node:fs');
      // CapEff is the effective capability set as a hex mask. All dropped = 0.
      const status = fs.readFileSync('/proc/self/status', 'utf8');
      const line = status.split('\\n').find((l) => l.startsWith('CapEff'));
      console.log('CAPEFF:' + line.split(/\\s+/)[1]);
    `);
    expect(output(result)).toMatch(/CAPEFF:0+\b/);
  });

  // 7: --security-opt no-new-privileges
  check('7. cannot acquire new privileges', async () => {
    const result = await run(`
      const fs = require('node:fs');
      const status = fs.readFileSync('/proc/self/status', 'utf8');
      const line = status.split('\\n').find((l) => l.startsWith('NoNewPrivs'));
      console.log('NNP:' + line.split(/\\s+/)[1]);
    `);
    expect(output(result)).toContain('NNP:1');
  });

  // 8: source bind-mounted :ro
  check('8. cannot rewrite its own source mid-run', async () => {
    const result = await run(`
      const fs = require('node:fs');
      try { fs.writeFileSync('/work/main.js', 'console.log("hijacked")'); console.log('WROTE'); }
      catch (e) { console.log('BLOCKED', e.code); }
    `);
    expect(output(result)).toContain('BLOCKED');
    expect(output(result)).not.toContain('WROTE');
  });

  // 9: one submission cannot see another
  check('9. sees only its own source in /work', async () => {
    const result = await run(`
      const fs = require('node:fs');
      console.log('WORK:' + JSON.stringify(fs.readdirSync('/work')));
    `);
    expect(output(result)).toContain('WORK:["main.js"]');
  });

  // 10: --memory == --memory-swap
  check('10. a memory bomb is killed, not swapped', async () => {
    const result = await run(
      `
      const held = [];
      // 512MB in 8MB steps, against a 128MB limit.
      for (let i = 0; i < 64; i++) held.push(Buffer.alloc(8 * 1024 * 1024, 1));
      console.log('SURVIVED');
      `,
      { memoryLimitKb: 128 * 1024 },
    );
    expect(output(result)).not.toContain('SURVIVED');
    expect(result.status.id).not.toBe(STATUS.ACCEPTED.id);
  }, 120_000);

  // 11: --pids-limit
  check('11. a fork bomb hits the pid cap', async () => {
    // Assert the cgroup limit directly. Counting spawns was the obvious probe
    // and the wrong one: node's `spawn` is asynchronous, so a refused fork
    // arrives as an 'error' event later and the loop cheerfully counted 400
    // attempts as 400 successes while the cap was working perfectly.
    const result = await run(`
      const fs = require('node:fs');
      let cap = 'none';
      try { cap = fs.readFileSync('/sys/fs/cgroup/pids.max', 'utf8').trim(); } catch (e) {}
      console.log('PIDSMAX:' + cap);
    `);
    const cap = /PIDSMAX:(\d+)/.exec(output(result));
    expect(cap, 'pids.max should be readable from the container cgroup').not.toBeNull();
    // The cap applies to the whole container, node's own threads included.
    expect(Number(cap![1])).toBeLessThanOrEqual(128);
  }, 120_000);

  // 12: the CPU limit is enforced
  check('12. an infinite loop is stopped by the time limit', async () => {
    const result = await run(`while (true) {} `, { cpuTimeLimit: 2 });
    expect(result.status.id).toBe(STATUS.TIME_LIMIT_EXCEEDED.id);
  }, 120_000);

  // 13: the writable tmpfs is capped
  check('13. cannot fill the host disk through /tmp', async () => {
    const result = await run(`
      const fs = require('node:fs');
      const chunk = Buffer.alloc(16 * 1024 * 1024, 7);
      let written = 0;
      try {
        const fd = fs.openSync('/tmp/fill', 'w');
        // 1GB attempted against a 256MB tmpfs.
        for (let i = 0; i < 64; i++) { fs.writeSync(fd, chunk); written += chunk.length; }
        console.log('FILLED:' + written);
      } catch (e) { console.log('CAPPED:' + written + ':' + e.code); }
    `);
    // Two acceptable outcomes, and the sandbox picks the second: a tmpfs is
    // memory-backed, so its pages are charged to the memory cgroup and the
    // container is OOM-killed before it ever sees ENOSPC. Either way the host
    // disk is untouched, which is the claim being made.
    const text = output(result);
    expect(text).not.toContain('FILLED');
    expect(text === '' || /CAPPED|Killed|out of memory/i.test(text)).toBe(true);
    expect(result.status.id).not.toBe(STATUS.ACCEPTED.id);
  }, 120_000);

  // 14: no host filesystem
  check('14. cannot see the host filesystem', async () => {
    const result = await run(`
      const fs = require('node:fs');
      // The host's docker socket is the thing that would matter most.
      const leaks = ['/var/run/docker.sock', '/host', '/mnt/host']
        .filter((p) => fs.existsSync(p));
      console.log('LEAKS:' + JSON.stringify(leaks));
    `);
    expect(output(result)).toContain('LEAKS:[]');
  });

  // 15: no leaked containers
  check('15. leaves no container behind, even on timeout', async () => {
    await run(`while (true) {}`, { cpuTimeLimit: 2 });
    // --rm runs in the docker *client*, so a client the host had to SIGKILL
    // never executes it. Naming the container is what makes this checkable —
    // and it caught two node containers still spinning 24 minutes after a run.
    const { stdout } = await exec('docker', [
      'ps', '-a', '--filter', 'name=codelock-run-', '--format', '{{.Names}}',
    ]);
    expect(stdout.trim()).toBe('');
  }, 120_000);
});
