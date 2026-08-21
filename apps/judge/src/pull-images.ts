import { spawnSync } from 'node:child_process';
import { env } from './env.js';
import { LANGUAGES } from './languages.js';

/**
 * Pre-pull every language image.
 *
 * Without this the first submission in a language pays the pull cost inside the
 * grading request, which on a cold host looks exactly like a hung judge.
 *
 *   npm run pull -w @codelock/judge
 */
const docker = env.DOCKER_BIN;
let failed = 0;

for (const spec of Object.values(LANGUAGES)) {
  process.stdout.write(`pulling ${spec.image} for ${spec.name} ... `);
  const result = spawnSync(docker, ['pull', '--quiet', spec.image], { encoding: 'utf8' });
  if (result.status === 0) {
    console.log('ok');
  } else {
    failed += 1;
    console.log(`FAILED: ${(result.stderr || '').trim().slice(0, 160)}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} image(s) failed to pull; those languages will error at runtime.`);
  process.exit(1);
}
