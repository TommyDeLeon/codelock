import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Account-enumeration regression tests for POST /auth/register.
 *
 * The oracle these guard against is a timing one, not a wording one. Register
 * used to return its 409 before ever hashing a password, so a taken email
 * answered in about a millisecond while a free one paid the full argon2 cost —
 * a difference an anonymous caller can measure without reading a single byte
 * of the response body. Equalising it means the hash happens on both paths,
 * which is what `calls` below records.
 *
 * argon2 and prisma are mocked rather than exercised: what matters is the
 * *order and presence* of the work, and a real argon2 hash would add ~50 ms
 * per case for no extra signal.
 */

/**
 * Every observable operation, in the order the handler performed it, plus the
 * set of emails the fake database already knows about.
 */
const { calls, takenEmails } = vi.hoisted(() => ({
  calls: [] as string[],
  takenEmails: new Set<string>(),
}));

vi.mock('argon2', () => ({
  default: {
    argon2id: 2,
    hash: vi.fn(async () => {
      calls.push('argon2.hash');
      return '$argon2id$fake';
    }),
    verify: vi.fn(async () => {
      calls.push('argon2.verify');
      return false;
    }),
  },
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { email?: string } }) => {
        calls.push('user.findUnique');
        return where.email && takenEmails.has(where.email)
          ? { id: 'existing-user', email: where.email, displayName: 'Taken', passwordHash: 'x' }
          : null;
      }),
      create: vi.fn(async ({ data }: { data: { email: string; displayName: string } }) => {
        calls.push('user.create');
        return { id: 'new-user', email: data.email, displayName: data.displayName };
      }),
    },
    refreshToken: {
      create: vi.fn(async () => {
        calls.push('refreshToken.create');
        return {};
      }),
    },
  },
}));

import { authRouter } from './auth.js';
import { errorHandler } from '../middleware/error.js';

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use('/auth', authRouter);
  instance.use(errorHandler);
  return instance;
}

function registerBody(email: string) {
  return { email, password: 'a-long-enough-password', displayName: 'Someone' };
}

beforeEach(() => {
  calls.length = 0;
  takenEmails.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /auth/register does not leak which emails exist', () => {
  it('pays the password-hashing cost even when the email is already taken', async () => {
    takenEmails.add('taken@example.com');

    const res = await request(app()).post('/auth/register').send(registerBody('taken@example.com'));

    expect(res.status).toBe(409);
    // The whole point: the rejected path did the expensive work too.
    expect(calls).toContain('argon2.hash');
  });

  it('hashes before it looks the email up, so the lookup cannot short-circuit it', async () => {
    takenEmails.add('taken@example.com');

    await request(app()).post('/auth/register').send(registerBody('taken@example.com'));

    expect(calls.indexOf('argon2.hash')).toBeGreaterThanOrEqual(0);
    expect(calls.indexOf('argon2.hash')).toBeLessThan(calls.indexOf('user.findUnique'));
  });

  it('performs the same work, in the same order, up to the point the paths diverge', async () => {
    takenEmails.add('taken@example.com');
    await request(app()).post('/auth/register').send(registerBody('taken@example.com'));
    const rejected = [...calls];

    calls.length = 0;
    const accepted = await request(app())
      .post('/auth/register')
      .send(registerBody('free@example.com'));

    expect(accepted.status).toBe(201);
    // The free-email path is the taken-email path plus the writes that only a
    // real registration performs. Any operation the taken path skips ahead of
    // the divergence point is a timing signal.
    expect(calls.slice(0, rejected.length)).toEqual(rejected);
    expect(calls).toEqual(['argon2.hash', 'user.findUnique', 'user.create', 'refreshToken.create']);
  });
});
