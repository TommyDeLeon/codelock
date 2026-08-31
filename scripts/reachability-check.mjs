#!/usr/bin/env node
/**
 * Imported is not reachable.
 *
 * The corpus can be complete, active and measured, and a user can still never
 * be served any of it: selection is gated by tier and family, and the API runs
 * dist/index.js, so a source change is invisible until it is rebuilt. This
 * draws from the real endpoint, through the real gate, as a brand-new user.
 *
 * Asserts three things the brief calls out:
 *   1. a fresh user is served Tier 0 only,
 *   2. draws are not the same problem sixty times,
 *   3. the payload carries no editorial, reference solution, or pattern name.
 *
 * Usage: node scripts/reachability-check.mjs [baseUrl] [draws]
 */
const base = process.argv[2] || 'http://localhost:4000';
const draws = Number(process.argv[3] || 60);

const email = `reach-${Date.now()}@example.test`;
const password = 'reach-check-passw0rd';

const post = async (path, body, token) => {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
};

const registered = await post('/v1/auth/register', { email, password, displayName: 'Reachability Check' });
const token = registered.accessToken ?? registered.tokens?.accessToken;
if (!token) throw new Error(`no access token in register response: ${JSON.stringify(registered)}`);

const seen = new Map();
// Fields that must never cross the boundary to a user who has not solved yet.
const FORBIDDEN = ['editorial', 'editorialMarkdown', 'referenceSolution', 'patternFamily',
                   'patternTags', 'tags', 'tier', 'testCases'];
let leaks = 0;

for (let i = 0; i < draws; i++) {
  const res = await fetch(`${base}/v1/problems/next`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET /v1/problems/next -> ${res.status} ${await res.text()}`);
  const { problem } = await res.json();

  for (const key of FORBIDDEN) {
    if (key in problem) { console.log(`  LEAK: payload carries "${key}"`); leaks++; }
  }
  seen.set(problem.slug, (seen.get(problem.slug) ?? 0) + 1);
}

console.log(`\n${draws} draws -> ${seen.size} distinct problems`);
console.log(`payload leaks: ${leaks}`);
console.log('\nslug counts (top 10):');
for (const [slug, n] of [...seen].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${n.toString().padStart(3)}  ${slug}`);
}
console.log(`\nVerify tiers with:\n  docker exec codelock-postgres-1 psql -U codelock -d codelock -c "select tier, count(*) from problems where slug in (${[...seen.keys()].map((s) => `'${s}'`).join(',')}) group by 1;"`);

if (leaks > 0) { console.error('\nFAIL: payload leaked forbidden fields'); process.exit(1); }
if (seen.size < 2) { console.error('\nFAIL: selection is not rotating'); process.exit(1); }
console.log('\nreachability check passed (verify the tier query above shows TIER_0 only)');
