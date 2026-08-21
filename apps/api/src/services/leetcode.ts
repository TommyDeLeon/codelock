import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

/**
 * LeetCode import — read only, by design and by necessity.
 *
 * LeetCode publishes no public API. There is no supported way to write progress
 * *into* LeetCode: solving a problem in CodeLock cannot mark it solved there,
 * and any product claiming otherwise is either scraping an authenticated
 * session or lying. What we can do is read a user's public profile through the
 * same GraphQL endpoint the website uses, and show it alongside CodeLock stats.
 *
 * Because that endpoint is unofficial it can change without notice, so every
 * failure here is non-fatal: the integration degrades to "stats unavailable"
 * and never blocks an unlock or breaks the dashboard.
 */

const ENDPOINT = 'https://leetcode.com/graphql';
const TIMEOUT_MS = 8_000;

const PROFILE_QUERY = `
  query codelockProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile { ranking reputation }
      submitStatsGlobal {
        acSubmissionNum { difficulty count }
      }
      userCalendar { streak totalActiveDays submissionCalendar }
    }
  }
`;

export interface LeetCodeStats {
  username: string;
  ranking: number | null;
  solved: { easy: number; medium: number; hard: number; total: number };
  streakDays: number;
  totalActiveDays: number;
  /** Unix-day timestamp -> submissions, as LeetCode reports it. */
  calendar: Record<string, number>;
  fetchedAt: string;
}

interface GraphQlResponse {
  data?: {
    matchedUser: {
      username: string;
      profile: { ranking: number | null } | null;
      submitStatsGlobal: {
        acSubmissionNum: Array<{ difficulty: string; count: number }>;
      } | null;
      userCalendar: {
        streak: number | null;
        totalActiveDays: number | null;
        submissionCalendar: string | null;
      } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
}

export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        // LeetCode rejects requests without a browser-ish Referer.
        Referer: `https://leetcode.com/${username}/`,
        'User-Agent': 'CodeLock/1.0',
      },
      body: JSON.stringify({ query: PROFILE_QUERY, variables: { username } }),
    });

    if (!res.ok) throw ApiError.upstream(`LeetCode returned ${res.status}`);

    const body = (await res.json()) as GraphQlResponse;
    if (body.errors?.length) {
      const message = body.errors[0]!.message;
      // LeetCode reports an unknown username as a GraphQL error, not an empty
      // result. Surfacing that as 502 would blame our server for the user's
      // typo, so it becomes a 404 the settings form can render inline.
      if (/does not exist|not found/i.test(message)) {
        throw ApiError.notFound(`No public LeetCode profile for "${username}"`);
      }
      throw ApiError.upstream(message);
    }

    const user = body.data?.matchedUser;
    if (!user) throw ApiError.notFound(`No public LeetCode profile for "${username}"`);

    const counts = new Map(
      (user.submitStatsGlobal?.acSubmissionNum ?? []).map((row) => [
        row.difficulty.toLowerCase(),
        row.count,
      ]),
    );

    return {
      username: user.username,
      ranking: user.profile?.ranking ?? null,
      solved: {
        easy: counts.get('easy') ?? 0,
        medium: counts.get('medium') ?? 0,
        hard: counts.get('hard') ?? 0,
        total: counts.get('all') ?? 0,
      },
      streakDays: user.userCalendar?.streak ?? 0,
      totalActiveDays: user.userCalendar?.totalActiveDays ?? 0,
      calendar: parseCalendar(user.userCalendar?.submissionCalendar),
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === 'AbortError') throw ApiError.upstream('LeetCode timed out');
    logger.warn({ err, username }, 'leetcode profile fetch failed');
    throw ApiError.upstream('Could not reach LeetCode');
  } finally {
    clearTimeout(timer);
  }
}

/** The calendar arrives as a JSON *string* of {"unixDay": count}. */
function parseCalendar(raw: string | null | undefined): Record<string, number> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

/**
 * Verify a username exists before saving it, so a typo surfaces immediately
 * instead of as a permanently broken card on the dashboard.
 */
export async function verifyUsername(username: string): Promise<boolean> {
  try {
    await fetchLeetCodeStats(username);
    return true;
  } catch {
    return false;
  }
}
