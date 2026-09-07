import { afterEach, expect, it, vi } from 'vitest';
import { runBatch } from './judge0.js';

const token = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const params = {
  language: 'PYTHON' as const,
  sourceCode: 'print(42)',
  cases: [{ stdin: '', expectedOutput: '42' }],
  cpuTimeLimit: 2,
  memoryLimitKb: 262144,
};
const accepted = { token, status: { id: 3, description: 'Accepted' }, time: '0.012', memory: 1024 };
function responses(created: unknown, polled: unknown) {
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => created })
    .mockResolvedValueOnce({ ok: true, json: async () => polled }));
}
afterEach(() => vi.unstubAllGlobals());

it('rejects an empty creation response', async () => {
  responses([], {});
  await expect(runBatch(params)).rejects.toThrow('invalid submission batch');
});
it('rejects empty results instead of treating them as all passed', async () => {
  responses([{ token }], { submissions: [] });
  await expect(runBatch(params)).rejects.toThrow('invalid or incomplete');
});
it('rejects a result from another submission', async () => {
  responses([{ token }], { submissions: [{ ...accepted, token: other }] });
  await expect(runBatch(params)).rejects.toThrow('do not match');
});
it('rejects an accepted result without timing', async () => {
  responses([{ token }], { submissions: [{ ...accepted, time: null }] });
  await expect(runBatch(params)).rejects.toThrow('invalid or incomplete');
});
it('normalizes out of order results by token', async () => {
  responses([{ token }, { token: other }], { submissions: [{ ...accepted, token: other, time: '0.022' }, accepted] });
  const result = await runBatch({ ...params, cases: [...params.cases, ...params.cases] });
  expect(result.results.map((r) => r.timeMs)).toEqual([12, 22]);
});
it('rejects duplicate result tokens', async () => {
  responses([{ token }, { token: other }], { submissions: [accepted, accepted] });
  await expect(runBatch({ ...params, cases: [...params.cases, ...params.cases] })).rejects.toThrow('do not match');
});
it('accepts a complete, measured result', async () => {
  responses([{ token }], { submissions: [accepted] });
  const result = await runBatch(params);
  expect(result.results[0]).toMatchObject({ passed: true, timeMs: 12, memoryKb: 1024 });
});
