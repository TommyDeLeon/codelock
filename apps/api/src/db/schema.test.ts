import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Migration tests against a real Postgres engine.
 *
 * PGlite is Postgres compiled to WASM — the actual server, not an emulation —
 * so this catches invalid DDL, broken cascades, and missing constraints without
 * needing a database service. That matters here because several guarantees the
 * API depends on live only in the schema:
 *
 *   - `upsert(where: { userId_provider })` requires that compound unique to
 *     exist, or two GitHub connections silently coexist and sync twice.
 *   - Deleting a user must not strand submissions or encrypted OAuth tokens.
 *   - The activity endpoint runs hand-written SQL that TypeScript cannot check.
 *
 * Each describe block gets its own in-memory database via freshDb(), so the
 * fixed UUIDs below cannot collide across blocks and nothing needs cleanup.
 */

const MIGRATION = path.join(
  __dirname,
  '..',
  '..',
  'prisma',
  'migrations',
  '20260821000000_init',
  'migration.sql',
);

const USER = '11111111-1111-1111-1111-111111111111';
const PROBLEM = '22222222-2222-2222-2222-222222222222';
const SESSION = '33333333-3333-3333-3333-333333333333';
const SUBMISSION = '44444444-4444-4444-4444-444444444444';
const INTEGRATION = '55555555-5555-5555-5555-555555555555';

/**
 * A new Postgres per describe block. Startup is ~200 ms, cheap enough that
 * isolation beats sharing — and sharing is what makes fixed-UUID fixtures
 * collide.
 */
async function freshDb(): Promise<PGlite> {
  const instance = new PGlite();
  await instance.exec(readFileSync(MIGRATION, 'utf8'));
  return instance;
}

let db: PGlite;

async function seedUserGraph(): Promise<void> {
  await db.exec(`
    INSERT INTO users (id,email,"passwordHash","displayName","updatedAt")
      VALUES ('${USER}','a@b.co','hash','Jane',NOW());
    INSERT INTO user_progress (id,"userId","updatedAt")
      VALUES (gen_random_uuid(),'${USER}',NOW());
    INSERT INTO timer_configs (id,"userId","updatedAt")
      VALUES (gen_random_uuid(),'${USER}',NOW());
    INSERT INTO problems (id,slug,title,difficulty,"promptMarkdown","starterCode","driverCode","referenceRuntimeMs")
      VALUES ('${PROBLEM}','two-sum','Two Sum','EASY','md','{"JAVASCRIPT":"s"}','{"JAVASCRIPT":"d"}',
              '{"JAVASCRIPT":95,"CPP":12}');
    INSERT INTO test_cases (id,"problemId",ordinal,stdin,"expectedStdout")
      VALUES (gen_random_uuid(),'${PROBLEM}',0,'in','out');
    INSERT INTO lock_sessions (id,"userId","problemId",state,difficulty,"fireAt","lockedAt")
      VALUES ('${SESSION}','${USER}','${PROBLEM}','LOCKED','EASY',NOW(),NOW());
  `);
}

afterAll(async () => {
  await db?.close();
});

describe('migration', () => {
  beforeAll(async () => {
    db = await freshDb();
  });

  it('applies cleanly to Postgres', async () => {
    const tables = await db.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema='public' ORDER BY table_name`,
    );
    expect(tables.rows.map((r) => r.table_name)).toEqual([
      'devices',
      'integrations',
      'lock_sessions',
      'problems',
      'refresh_tokens',
      'submissions',
      'sync_records',
      'test_cases',
      'timer_configs',
      'user_progress',
      'users',
    ]);
  });

  it('includes ACCEPTED_TOO_SLOW, the verdict the speed gate depends on', async () => {
    const result = await db.query<{ labels: string[] }>(
      `SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
       FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
       WHERE t.typname = 'SubmissionStatus' GROUP BY t.typname`,
    );
    expect(result.rows[0]?.labels).toContain('ACCEPTED_TOO_SLOW');
  });
});

describe('defaults', () => {
  beforeAll(async () => {
    db = await freshDb();
    await seedUserGraph();
  });

  it('starts every user at EASY with a 10 minute solve estimate', async () => {
    const result = await db.query<{ currentDifficulty: string; emaSolveSeconds: number }>(
      `SELECT "currentDifficulty","emaSolveSeconds" FROM user_progress WHERE "userId"=$1`,
      [USER],
    );
    expect(result.rows[0]?.currentDifficulty).toBe('EASY');
    expect(result.rows[0]?.emaSolveSeconds).toBe(600);
  });

  it('gives a new problem an empty best-runtime map', async () => {
    // Not null: the gate reads this as an object and would crash on null.
    const result = await db.query<{ bestRuntimeMs: unknown }>(
      `SELECT "bestRuntimeMs" FROM problems WHERE id=$1`,
      [PROBLEM],
    );
    expect(result.rows[0]?.bestRuntimeMs).toEqual({});
  });

  it('round-trips a correct-but-too-slow submission with its budget', async () => {
    await db.exec(`
      INSERT INTO submissions (id,"userId","problemId","lockSessionId",language,"sourceCode",
        status,"passedCount","totalCount","runtimeMs","gateMs","elapsedSeconds")
      VALUES ('${SUBMISSION}','${USER}','${PROBLEM}','${SESSION}','JAVASCRIPT','code',
        'ACCEPTED_TOO_SLOW',5,5,900,168,300)`);

    const result = await db.query<{ status: string; gateMs: number }>(
      `SELECT status,"gateMs" FROM submissions WHERE id=$1`,
      [SUBMISSION],
    );
    expect(result.rows[0]).toMatchObject({ status: 'ACCEPTED_TOO_SLOW', gateMs: 168 });
  });
});

describe('constraints the API relies on', () => {
  beforeAll(async () => {
    db = await freshDb();
    await seedUserGraph();
  });

  it('allows only one integration per provider per user', async () => {
    await db.exec(`INSERT INTO integrations (id,"userId",provider,"externalUsername","updatedAt")
        VALUES ('${INTEGRATION}','${USER}','GITHUB','jane',NOW())`);
    // Without this, upsert-by-userId_provider breaks and solutions sync twice.
    await expect(
      db.exec(`INSERT INTO integrations (id,"userId",provider,"externalUsername","updatedAt")
          VALUES (gen_random_uuid(),'${USER}','GITHUB','jane2',NOW())`),
    ).rejects.toThrow();
  });

  it('records each submission at most once per integration', async () => {
    await db.exec(`INSERT INTO submissions (id,"userId","problemId",language,"sourceCode","totalCount")
        VALUES ('${SUBMISSION}','${USER}','${PROBLEM}','JAVASCRIPT','code',1)`);
    await db.exec(`INSERT INTO sync_records (id,"integrationId","submissionId","updatedAt")
        VALUES (gen_random_uuid(),'${INTEGRATION}','${SUBMISSION}',NOW())`);
    await expect(
      db.exec(`INSERT INTO sync_records (id,"integrationId","submissionId","updatedAt")
          VALUES (gen_random_uuid(),'${INTEGRATION}','${SUBMISSION}',NOW())`),
    ).rejects.toThrow();
  });

  it('rejects duplicate test case ordinals', async () => {
    await expect(
      db.exec(`INSERT INTO test_cases (id,"problemId",ordinal,stdin,"expectedStdout")
          VALUES (gen_random_uuid(),'${PROBLEM}',0,'dup','dup')`),
    ).rejects.toThrow();
  });

  it('rejects duplicate emails', async () => {
    await expect(
      db.exec(`INSERT INTO users (id,email,"passwordHash","displayName","updatedAt")
          VALUES (gen_random_uuid(),'a@b.co','x','Dupe',NOW())`),
    ).rejects.toThrow();
  });
});

describe('activity query in stats.ts', () => {
  beforeAll(async () => {
    db = await freshDb();
    await seedUserGraph();
  });

  it('runs and groups by day', async () => {
    // Hand-written SQL, so TypeScript cannot catch a typo here. This is the
    // only thing that does.
    await db.exec(`INSERT INTO submissions (id,"userId","problemId",language,"sourceCode",status,"totalCount")
        VALUES (gen_random_uuid(),'${USER}','${PROBLEM}','JAVASCRIPT','c','ACCEPTED',1),
               (gen_random_uuid(),'${USER}','${PROBLEM}','JAVASCRIPT','c','WRONG_ANSWER',1)`);

    const result = await db.query<{ day: Date; solved: bigint; attempted: bigint }>(
      `SELECT date_trunc('day', "createdAt") AS day,
              COUNT(*) FILTER (WHERE status = 'ACCEPTED') AS solved,
              COUNT(*) AS attempted
       FROM submissions
       WHERE "userId" = $1::uuid AND "createdAt" >= NOW() - INTERVAL '90 days'
       GROUP BY 1 ORDER BY 1 ASC`,
      [USER],
    );

    expect(result.rows).toHaveLength(1);
    expect(Number(result.rows[0]?.solved)).toBe(1);
    expect(Number(result.rows[0]?.attempted)).toBe(2);
  });
});

describe('deleting a user', () => {
  beforeAll(async () => {
    db = await freshDb();
    await seedUserGraph();
    await db.exec(`
      INSERT INTO integrations (id,"userId",provider,"externalUsername","accessTokenCipher","updatedAt")
        VALUES ('${INTEGRATION}','${USER}','GITHUB','jane','cipher',NOW());
      INSERT INTO submissions (id,"userId","problemId",language,"sourceCode","totalCount")
        VALUES ('${SUBMISSION}','${USER}','${PROBLEM}','JAVASCRIPT','code',1);
      INSERT INTO sync_records (id,"integrationId","submissionId","updatedAt")
        VALUES (gen_random_uuid(),'${INTEGRATION}','${SUBMISSION}',NOW());
    `);
    await db.exec(`DELETE FROM users WHERE id='${USER}'`);
  });

  // An orphaned `integrations` row would leave an encrypted GitHub token in the
  // database belonging to an account that no longer exists.
  it.each([
    'user_progress',
    'timer_configs',
    'lock_sessions',
    'submissions',
    'integrations',
    'sync_records',
  ])('cascades to %s', async (table) => {
    const result = await db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM ${table}`);
    expect(result.rows[0]?.n).toBe(0);
  });

  it('leaves shared problems alone', async () => {
    const result = await db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM problems`);
    expect(result.rows[0]?.n).toBeGreaterThan(0);
  });
});
