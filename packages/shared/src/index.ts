/**
 * The API contract, shared by every client.
 *
 * Consumed as TypeScript source (no build step) so the web, desktop, and
 * mobile apps cannot drift from each other. These mirror the Prisma enums and
 * the JSON the API actually returns — if you change a route's response, change
 * it here in the same commit.
 */

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const LANGUAGES = ['JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CPP', 'GO'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LOCK_STATES = ['ARMED', 'LOCKED', 'UNLOCKED', 'BYPASSED', 'ABANDONED'] as const;
export type LockState = (typeof LOCK_STATES)[number];

export type SubmissionStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'ACCEPTED'
  | 'ACCEPTED_TOO_SLOW'
  | 'WRONG_ANSWER'
  | 'COMPILE_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

export type Platform = 'WEB' | 'WINDOWS' | 'MACOS' | 'LINUX' | 'ANDROID' | 'IOS';

/** Human-facing labels. Keeps enum-to-copy mapping in one place. */
export const LANGUAGE_LABELS: Record<Language, string> = {
  JAVASCRIPT: 'JavaScript',
  TYPESCRIPT: 'TypeScript',
  PYTHON: 'Python',
  JAVA: 'Java',
  CPP: 'C++',
  GO: 'Go',
};

/** Monaco language ids, which differ from ours for two of the five. */
export const MONACO_LANGUAGE_IDS: Record<Language, string> = {
  JAVASCRIPT: 'javascript',
  TYPESCRIPT: 'typescript',
  PYTHON: 'python',
  JAVA: 'java',
  CPP: 'cpp',
  GO: 'go',
};

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  QUEUED: 'Queued',
  RUNNING: 'Running',
  ACCEPTED: 'Accepted',
  ACCEPTED_TOO_SLOW: 'Correct, but too slow',
  WRONG_ANSWER: 'Wrong answer',
  COMPILE_ERROR: 'Compile error',
  RUNTIME_ERROR: 'Runtime error',
  TIME_LIMIT_EXCEEDED: 'Time limit exceeded',
  MEMORY_LIMIT_EXCEEDED: 'Memory limit exceeded',
  INTERNAL_ERROR: 'Judge error',
};

// --- entities --------------------------------------------------------------

export interface PublicProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  promptMarkdown: string;
  starterCode: Partial<Record<Language, string>>;
  sampleCases: Array<{ ordinal: number; stdin: string; expectedStdout: string }>;
  avgSolveSeconds: number;
}

export interface LockSessionView {
  id: string;
  state: LockState;
  difficulty: Difficulty;
  fireAt: string;
  /** Server clock at response time. Clients render countdowns from this. */
  serverNow: string;
  secondsRemaining: number;
  /**
   * Set while an armed countdown is paused. `secondsRemaining` freezes for as
   * long as it is, and `fireAt` is only meaningful again once resumed.
   */
  pausedAt: string | null;
  attempts: number;
  problem: PublicProblem | null;
}

export interface UserProgress {
  currentDifficulty: Difficulty;
  consecutiveFastSolves: number;
  consecutiveFailures: number;
  totalSolved: number;
  totalFailed: number;
  emaSolveSeconds: number;
  firstTryRate: number;
  lastPromotedAt: string | null;
  lastDemotedAt: string | null;
  promoteAfterFastSolves: number;
  demoteAfterFailures: number;
}

export interface TimerConfig {
  enabled: boolean;
  durationMinutes: number;
  graceSeconds: number;
  activeDaysMask: number;
  activeFromMinute: number;
  activeToMinute: number;
  dailySkipAllowance: number;
  /**
   * The recurring timer: start the next countdown as soon as a lock ends. A
   * solve and a spent skip both re-arm — never the kill switch, or the escape
   * hatch would buy ten seconds before the next timer. The active-hours window
   * still applies, so it stops on its own at the end of the day.
   */
  autoRearm: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  /** Which language the editor should open in. Set at registration. */
  preferredLanguage?: Language;
}

export interface GradeResult {
  submissionId: string;
  status: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  runtimeMs: number | null;
  memoryKb: number | null;
  message: string | null;
  cases: Array<{
    ordinal: number;
    isSample: boolean;
    passed: boolean;
    status: string;
    timeMs: number;
    /**
     * What the case actually ran, so it can be reviewed afterwards.
     *
     * Three tiers, and the difference between them is the whole policy:
     *
     * - A **sample** carries everything. The statement already showed both
     *   sides, so there is nothing left to protect.
     * - A **failed hidden case** carries `stdin`, `actualStdout` and `stderr`,
     *   but never `expectedStdout`. "Case 4 failed" on its own is not a bug
     *   report, it is a shrug; the input is what makes a failure something you
     *   can reason about, and working out the right answer is still yours.
     * - A **passed hidden case** carries nothing. Nothing to debug, so handing
     *   over its input would be leak without teaching.
     *
     * Fields are absent rather than nulled when withheld: a value sent for the
     * client to hide is a value in the response body for anyone with the
     * network tab open. Expected outputs for hidden cases appear only in the
     * debrief, once the session has resolved.
     */
    stdin?: string;
    expectedStdout?: string;
    /** What the submission printed. Null when it produced nothing at all. */
    actualStdout?: string | null;
    /** A traceback or compiler diagnostic, when the case errored. */
    stderr?: string | null;
  }>;
  /** Every test passed. Necessary for an unlock, but not sufficient. */
  correct: boolean;
  /** How the solution fared against the speed budget. Null if it was wrong. */
  performance: PerformanceVerdict | null;
  /** Correct AND within the speed budget. Only this releases the lock. */
  accepted: boolean;
  /** Rank, personal best and record break. Present whenever the answer was correct. */
  standing: SolveStanding | null;
  /** Present only when this submission resolved a lock session. */
  unlockToken: string | null;
  progress: ProgressUpdate | null;
}

export interface ProgressUpdate extends Omit<UserProgress, 'promoteAfterFastSolves' | 'demoteAfterFailures'> {
  transition: 'promoted' | 'demoted' | 'held';
  reason: string;
}

export interface StatsSummary {
  progress: UserProgress;
  submissions: {
    total: number;
    accepted: number;
    acceptanceRate: number;
    last30DaysByStatus: Partial<Record<SubmissionStatus, number>>;
  };
  /**
   * The rank mechanic: how close this user runs to the best known answer.
   *
   * Real numbers, not a score. `bestRuntimeMs` on a problem is a genuine global
   * record that ratchets down whenever anyone beats it, so a ratio against it
   * means something and can be checked.
   */
  /**
   * One row per problem and language the user has solved, carrying their own
   * fastest time and how it sits against the record. Records first.
   */
  personalBests: Array<{
    slug: string;
    title: string;
    language: string;
    runtimeMs: number;
    /** Null when nobody has set a record in this language yet. */
    bestKnownMs: number | null;
    ratio: number | null;
    holdsRecord: boolean;
  }>;
  speed: {
    /** Median of runtime / best-known across recent accepted solves. */
    medianRatio: number | null;
    /** Accepted solves that currently match or hold the record. */
    recordsHeld: number;
    /** How many solves the ratio was computed from. */
    sampleSize: number;
  };
  locks: {
    recent: Array<{
      id: string;
      state: LockState;
      difficulty: Difficulty;
      lockedAt: string | null;
      resolvedAt: string | null;
      attempts: number;
      problem: { slug: string; title: string } | null;
    }>;
    unlockedCount: number;
    medianUnlockSeconds: number | null;
  };
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

/**
 * The speed budget a correct solution must also beat.
 *
 * CodeLock does not unlock on correctness alone: a working but quadratic
 * answer leaves the device locked. `targetMs` is the best known runtime for
 * this problem in this language, and `gateMs` is that plus a tolerance band,
 * which exists because judge timings are noisy.
 */
/**
 * Where one correct run stands: against the record, and against the user's own
 * previous attempt at the same problem.
 *
 * Every field is a measurement, not a score. This is the whole of the game
 * layer's reward vocabulary — there is deliberately no XP, currency or level
 * here, because a number with no referent is exactly what this product is not.
 */
export interface SolveStanding {
  /** The best known time before this run — the bar it was measured against. */
  bestKnownMs: number;
  /** runtimeMs / bestKnownMs. 1.24 means 24% off the record. */
  ratio: number;
  /** The user's own fastest correct run before this one, if there was one. */
  previousBestMs: number | null;
  /** Signed: negative is an improvement. Null when there was no previous run. */
  personalBestDeltaMs: number | null;
  /** This run is the user's fastest correct answer to this problem so far. */
  personalBest: boolean;
  /** This run beat the global record, so the gate just moved for everyone. */
  recordBroken: boolean;
  /** The budget every future solver now faces. Null unless the record broke. */
  newGateMs: number | null;
}

export interface PerformanceVerdict {
  runtimeMs: number;
  targetMs: number;
  gateMs: number;
  passed: boolean;
  /** 1.0 = exactly on target, 2.0 = twice as slow as the best known answer. */
  ratio: number;
  reason: string;
}

/**
 * Identity providers this product can sign users in with.
 *
 * LeetCode is deliberately absent: it publishes no OAuth or OIDC endpoints, so
 * "sign in with LeetCode" could only be built by collecting a LeetCode
 * password, which is phishing with extra steps. It stays linkable from Settings
 * after sign-in, which is the honest version of the same feature.
 */
export type OAuthProviderName = 'GITHUB' | 'GOOGLE';

export const OAUTH_PROVIDER_LABELS: Record<OAuthProviderName, string> = {
  GITHUB: 'GitHub',
  GOOGLE: 'Google',
};

// --- integrations ----------------------------------------------------------

export type IntegrationProvider = 'GITHUB' | 'LEETCODE';
export type SyncStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'DISABLED';

export interface Integration {
  provider: IntegrationProvider;
  externalUsername: string;
  repoFullName: string | null;
  repoBranch: string;
  enabled: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  scopes: string[];
}

export interface LeetCodeStats {
  username: string;
  ranking: number | null;
  solved: { easy: number; medium: number; hard: number; total: number };
  streakDays: number;
  totalActiveDays: number;
  calendar: Record<string, number>;
  fetchedAt: string;
}

export interface SyncRecord {
  id: string;
  status: SyncStatus;
  externalUrl: string | null;
  detail: string | null;
  createdAt: string;
  submission: { language: Language; problem: { title: string; slug: string } };
}

// --- client result contract ------------------------------------------------

/**
 * Every failure a client can encounter, named.
 *
 * `UNREACHABLE` is deliberately distinct from every server-side code: it means
 * the client never got an answer, so it knows nothing about the user's state.
 * Collapsing that into "no data" is what let a running lock session render as
 * "No active session" (PRE-LAUNCH-CHECKLIST 3.5).
 */
export type ApiFailureCode =
  /** No answer at all: DNS, TLS, CORS, offline, or a paused retry. */
  | 'UNREACHABLE'
  /** An answer was coming but took too long. */
  | 'TIMEOUT'
  /** The API answered, but not with a success. `status` carries the code. */
  | 'SERVICE_UNAVAILABLE'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN';

export interface ApiFailure {
  ok: false;
  code: ApiFailureCode;
  message: string;
  /** HTTP status, or 0 when no response was received. */
  status: number;
  /**
   * True when trying again later could plausibly succeed without the user
   * changing anything. Drives "retrying…" copy and automatic re-polling; a
   * non-retryable failure needs a human decision.
   */
  retryable: boolean;
  details?: unknown;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

/** HTTP statuses that are worth trying again on their own. */
export function isRetryableStatus(status: number): boolean {
  // 0 = never reached the server. 408/425/429 are explicitly "try later".
  // 5xx other than 501 are transient by convention.
  if (status === 0) return true;
  if (status === 408 || status === 425 || status === 429) return true;
  return status >= 500 && status !== 501;
}

/** Map an API error code + status onto the client-facing failure code. */
export function toFailureCode(status: number, serverCode?: string): ApiFailureCode {
  const known: ApiFailureCode[] = [
    'UNREACHABLE',
    'TIMEOUT',
    'SERVICE_UNAVAILABLE',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'CONFLICT',
    'VALIDATION_FAILED',
    'RATE_LIMITED',
    'INTERNAL_ERROR',
  ];
  if (serverCode && (known as string[]).includes(serverCode)) {
    return serverCode as ApiFailureCode;
  }
  switch (status) {
    case 0:
      return 'UNREACHABLE';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'RATE_LIMITED';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN';
  }
}

export function apiFailure(
  status: number,
  message: string,
  serverCode?: string,
  details?: unknown,
): ApiFailure {
  return {
    ok: false,
    code: toFailureCode(status, serverCode),
    message,
    status,
    retryable: isRetryableStatus(status),
    details,
  };
}

// --- demo ------------------------------------------------------------------

/**
 * The verdict from the public demo.
 *
 * Deliberately **not** `GradeResult`. That type carries `unlockToken` and
 * `progress`; this one has no such fields, so a demo response cannot carry an
 * unlock token even by accident — the compiler rejects it rather than a code
 * review having to catch it. The `demo` discriminant is always true, so any
 * client that mixes the two up fails to typecheck as well.
 *
 * Nothing here touches a lock session, because the demo has none.
 */
export interface DemoGradeResult {
  readonly demo: true;
  status: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  runtimeMs: number | null;
  message: string | null;
  cases: Array<{
    ordinal: number;
    isSample: boolean;
    passed: boolean;
    status: string;
    timeMs: number;
    /**
     * What the case actually ran, so it can be reviewed afterwards.
     *
     * Present on sample cases only, and absent rather than blanked on hidden
     * ones. A hidden case's expected output *is* the answer, so returning it
     * would turn the verdict panel into a cheat sheet — the same rule the
     * learning log already applies to failed samples. For a sample these leak
     * nothing: the problem statement has already shown both sides.
     */
    stdin?: string;
    expectedStdout?: string;
    /** What the submission printed. Null when it produced nothing at all. */
    actualStdout?: string | null;
    /** A traceback or compiler diagnostic, when the case errored. */
    stderr?: string | null;
  }>;
  /** Every test passed, whatever the clock said. */
  correct: boolean;
  performance: PerformanceVerdict | null;
  /** Correct and inside the speed budget. In the demo this unlocks nothing. */
  accepted: boolean;
}

/**
 * The result of *running* code, as opposed to submitting it.
 *
 * Deliberately not a `GradeResult`. Running exists so that trying something out
 * costs nothing: no submission row, no attempt against the session, no movement
 * on the difficulty ladder, and — the reason it is a separate type rather than
 * a flag — no `unlockToken` field for a run to accidentally carry. There is
 * nothing here that can end a lock, and the compiler is what guarantees that.
 *
 * A run sees only what the learner is already allowed to see: the sample cases
 * from the statement, or input they typed themselves. Hidden cases never run
 * here, because a run reports actual output verbatim, and reporting actual
 * output on a hidden input turns Run into a way to farm the answer one case at
 * a time.
 */
export interface RunResult {
  readonly ran: true;
  /** One entry per case executed, in the order they were sent. */
  cases: RunCase[];
  /**
   * A compiler diagnostic, when the source did not build.
   *
   * Hoisted out of the cases because a compile error is a property of the
   * program, not of any one input — every case fails identically and showing
   * the same wall of text five times buries the one line that matters.
   */
  compileError: string | null;
}

export interface RunCase {
  /**
   * Which sample this was, or null for input the learner typed.
   *
   * The ordinal matches the numbering in the test-results panel, so "Case 2"
   * means the same thing in both places.
   */
  ordinal: number | null;
  /** The input the program received. Always known: it is public either way. */
  stdin: string;
  /** What the program printed. Null when it printed nothing at all. */
  stdout: string | null;
  /** A traceback, when it crashed. */
  stderr: string | null;
  /** The judge's own words: 'Accepted', 'Runtime Error (NZEC)', and so on. */
  status: string;
  timeMs: number;
  /**
   * The expected output, for a sample only — and `null` for typed input,
   * where there is nothing to be right about. A run against your own input is
   * not a verdict, and pretending otherwise would teach the wrong lesson.
   */
  expectedStdout: string | null;
  /** Whether output matched, for a sample. Null when there is nothing to match. */
  matched: boolean | null;
}


/**
 * One lock session read back afterwards: what happened, in order.
 *
 * The privacy rule lives on the server (`sessionReview` in the API's
 * learningLog service) and is visible in this shape: `editorial` is null and
 * `withheld` is non-empty while the session is unresolved, because a review is
 * readable from outside the lock screen and the editorial names the pattern.
 * Hints appear as an index, never as text.
 */
export interface SessionReviewView {
  session: {
    id: string;
    state: LockState;
    difficulty: Difficulty;
    armedAt: string;
    lockedAt: string | null;
    resolvedAt: string | null;
    attempts: number;
    escapeReason: string | null;
  };
  /** The session has ended. Solution-bearing fields are populated only then. */
  resolved: boolean;
  problem: {
    slug: string;
    title: string;
    difficulty: Difficulty;
    tier: string | null;
    patternFamily: string | null;
    patternTags: string[];
  } | null;
  editorial: string | null;
  steps: SessionReviewStep[];
  /** No attributable steps: the session predates session-scoped logging. */
  partial: boolean;
  /** Plain-language notes about what was left out, and why. */
  withheld: string[];
}

export interface SessionReviewStep {
  at: string;
  kind: string;
  attempt: number | null;
  language: Language | null;
  elapsedSeconds: number | null;
  /** The learner's own submission. Never withheld — it is theirs. */
  sourceCode: string | null;
  minutes?: number | null;
  engagedDifficulty?: string | null;
  verdict?: string | null;
  passedCount?: number | null;
  totalCount?: number | null;
  hiddenFailures?: number | null;
  failedSamples?: Array<{
    ordinal: number | null;
    stdin: string | null;
    expected: string | null;
    actual: string | null;
    status: string | null;
  }>;
  runtimeMs?: number | null;
  gateMs?: number | null;
  /** Which hint was spent. The text is never sent. */
  hintIndex?: number | null;
  skipsRemaining?: number | null;
  transition?: string | null;
  reason?: string | null;
}
