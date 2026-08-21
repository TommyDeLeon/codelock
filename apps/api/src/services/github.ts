import { Language } from '@prisma/client';
import { env } from '../env.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { decryptSecret } from '../lib/crypto.js';

/**
 * GitHub mirror.
 *
 * Accepted solutions are committed to a repo the user nominates. This is the
 * only integration that *writes* anywhere: a commit authored by the user is
 * what produces contribution-graph activity, which is the point.
 *
 * Scope is deliberately `public_repo`, not `repo`. CodeLock never needs access
 * to private code, and asking for less means a leaked token does less damage.
 */

// Configurable for GitHub Enterprise, and so the mirror path can be tested
// against a stub without touching a real account.
const API = env.GITHUB_API_URL;
const USER_AGENT = 'CodeLock';
export const GITHUB_SCOPES = ['public_repo', 'read:user'] as const;

const FILE_EXTENSIONS: Record<Language, string> = {
  JAVASCRIPT: 'js',
  TYPESCRIPT: 'ts',
  PYTHON: 'py',
  JAVA: 'java',
  CPP: 'cpp',
  GO: 'go',
};

export function authorizeUrl(state: string): string {
  if (!env.GITHUB_CLIENT_ID) {
    throw new ApiError(503, 'INTEGRATION_UNCONFIGURED', 'GitHub integration is not configured');
  }
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: GITHUB_SCOPES.join(' '),
    state,
    allow_signup: 'false',
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<{ token: string; scopes: string[] }> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    scope?: string;
    error_description?: string;
  };

  if (!res.ok || !body.access_token) {
    throw ApiError.upstream(body.error_description ?? 'GitHub refused the authorization code');
  }
  return { token: body.access_token, scopes: (body.scope ?? '').split(',').filter(Boolean) };
}

async function gh<T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': USER_AGENT,
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) {
    return { ok: false, status: res.status, message: data.message ?? `GitHub returned ${res.status}` };
  }
  return { ok: true, data };
}

export async function fetchViewer(token: string): Promise<{ login: string; avatarUrl: string }> {
  const result = await gh<{ login: string; avatar_url: string }>(token, '/user');
  if (!result.ok) throw ApiError.upstream(result.message);
  return { login: result.data.login, avatarUrl: result.data.avatar_url };
}

export async function listRepos(
  tokenCipher: string,
): Promise<Array<{ fullName: string; private: boolean; defaultBranch: string }>> {
  const token = decryptSecret(tokenCipher);
  const result = await gh<Array<{ full_name: string; private: boolean; default_branch: string }>>(
    token,
    '/user/repos?per_page=100&sort=updated&affiliation=owner',
  );
  if (!result.ok) throw ApiError.upstream(result.message);
  return result.data.map((r) => ({
    fullName: r.full_name,
    private: r.private,
    defaultBranch: r.default_branch,
  }));
}

/** Create the solutions repo if the user does not already have one. */
export async function createSolutionsRepo(
  tokenCipher: string,
  name: string,
): Promise<{ fullName: string; defaultBranch: string }> {
  const token = decryptSecret(tokenCipher);
  const result = await gh<{ full_name: string; default_branch: string }>(token, '/user/repos', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description: 'Solutions committed automatically by CodeLock',
      private: false,
      auto_init: true,
    }),
  });
  if (!result.ok) throw ApiError.upstream(result.message);
  return { fullName: result.data.full_name, defaultBranch: result.data.default_branch };
}

export interface CommitInput {
  tokenCipher: string;
  repoFullName: string;
  branch: string;
  problemSlug: string;
  problemTitle: string;
  difficulty: string;
  language: Language;
  sourceCode: string;
  runtimeMs: number | null;
  gateMs: number | null;
  leetcodeSlug: string | null;
}

/**
 * Commit one accepted solution.
 *
 * Uses the Contents API rather than the raw Git plumbing: one request for a
 * single file, and GitHub handles the tree and parent commit. Idempotent by
 * path — resubmitting the same problem in the same language updates the file
 * instead of failing, which is what a user who improved their runtime wants.
 */
export async function commitSolution(
  input: CommitInput,
): Promise<{ sha: string; url: string }> {
  const token = decryptSecret(input.tokenCipher);
  const path = `${input.difficulty.toLowerCase()}/${input.problemSlug}.${FILE_EXTENSIONS[input.language]}`;

  // An update needs the blob's current sha; a create must omit it entirely.
  const existing = await gh<{ sha: string }>(
    token,
    `/repos/${input.repoFullName}/contents/${encodeURIComponent(path)}?ref=${input.branch}`,
  );
  const sha = existing.ok ? existing.data.sha : undefined;

  const content = Buffer.from(renderFile(input), 'utf8').toString('base64');
  const result = await gh<{ commit: { sha: string; html_url: string } }>(
    token,
    `/repos/${input.repoFullName}/contents/${encodeURIComponent(path)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        message: `${sha ? 'Improve' : 'Solve'} ${input.problemTitle}${
          input.runtimeMs !== null ? ` (${input.runtimeMs} ms)` : ''
        }`,
        content,
        branch: input.branch,
        ...(sha ? { sha } : {}),
      }),
    },
  );

  if (!result.ok) {
    logger.warn({ status: result.status, repo: input.repoFullName }, 'github commit failed');
    throw ApiError.upstream(result.message);
  }
  return { sha: result.data.commit.sha, url: result.data.commit.html_url };
}

/** Header comment carrying the metadata the repo would otherwise lose. */
function renderFile(input: CommitInput): string {
  const link = input.leetcodeSlug
    ? `https://leetcode.com/problems/${input.leetcodeSlug}/`
    : null;
  const lines = [
    input.problemTitle,
    `Difficulty: ${input.difficulty}`,
    input.runtimeMs !== null ? `Runtime: ${input.runtimeMs} ms (budget ${input.gateMs} ms)` : null,
    link,
    'Committed by CodeLock',
  ].filter(Boolean) as string[];

  const body = input.sourceCode.endsWith('\n') ? input.sourceCode : `${input.sourceCode}\n`;
  return `${commentBlock(input.language, lines)}\n${body}`;
}

function commentBlock(language: Language, lines: string[]): string {
  // Python has no block comment; everything else here shares C-style syntax.
  if (language === Language.PYTHON) return lines.map((l) => `# ${l}`).join('\n');
  return `/*\n${lines.map((l) => ` * ${l}`).join('\n')}\n */`;
}
