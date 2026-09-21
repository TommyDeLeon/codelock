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
  /**
   * The rules this session was armed with, snapshotted so that changing them
   * mid-lock cannot affect the lock holding the screen. The lock screen shows
   * them read-only. Optional for older servers.
   */
  speedGateMode?: SpeedGateMode;
  timeBudgetMinutes?: number | null;
  /**
   * True when nothing fitting the budget could be served and the selector
   * relaxed past it. Such a session opens the lock but does not move the
   * ladder.
   */
  overBudget?: boolean;
  id: string;
  state: LockState;
  difficulty: Difficulty;
  /**
   * Where `difficulty` came from, snapshotted at arm time. MANUAL sessions
   * never move the automatic ladder. Optional for older servers.
   */
  difficultySource?: DifficultyMode;
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
  /**
   * Why this problem was chosen, in plain words, and whether its prerequisites
   * were actually met.
   *
   * `skillEligible: false` means the selector found nothing the learner was
   * ready for and served this anyway rather than leave the lock unopenable.
   * Both are recorded when the lock engages and read back unchanged, so the
   * screen says what was true at the time rather than recomputing a kinder
   * answer later. Null on a session served before this was recorded.
   */
  skillEligible: boolean | null;
  skillNote: string | null;
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
  /**
   * Difficulty focus. AUTOMATIC follows the adaptive ladder; MANUAL pins new
   * locks to `focusDifficulty`. Changed through PUT /settings/difficulty and
   * applied from the next armed session. Optional for older servers.
   */
  difficultyMode?: DifficultyMode;
  /**
   * The time budget, in minutes: a ceiling on how long a served problem is
   * expected to take, not a target. Snapshotted onto the session at arm time,
   * so a session already running keeps the budget it was armed with.
   * Optional for older servers.
   */
  timeBudgetMinutes?: number;
  /**
   * Whether the speed gate applies to a problem never solved before.
   * AFTER_FIRST_SOLVE is the default. Optional for older servers, which only
   * ever behaved as ALWAYS.
   */
  speedGateMode?: SpeedGateMode;
  /**
   * The palette, shared by the dashboard and the lock screen so a choice made
   * in one is honoured by the other. Optional for older servers, which had no
   * shared value and left each surface to remember its own.
   */
  theme?: ThemePreference;
  focusDifficulty?: Difficulty | null;
}

export type DifficultyMode = 'AUTOMATIC' | 'MANUAL';

/** Body of PUT /settings/difficulty. */
export type DifficultyFocusInput =
  | { mode: 'AUTOMATIC' }
  | { mode: 'MANUAL'; difficulty: Difficulty };

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
  /**
   * Not sent with the grade: the unlock must never wait on it. An accepted
   * solve's success moment is recorded just afterwards and read from
   * `GET /v1/progress/accomplishment/:submissionId`.
   */
  accomplishment?: Accomplishment | null;
  /** A failed attempt that passed more cases than the previous one. Failures only. */
  nearMiss?: NearMiss | null;
}

export interface ProgressUpdate extends Omit<UserProgress, 'promoteAfterFastSolves' | 'demoteAfterFailures'> {
  transition: 'promoted' | 'demoted' | 'held';
  /**
   * The difficulty this update moved away from. Optional for older servers;
   * `currentDifficulty` is where it landed.
   */
  previousDifficulty?: Difficulty;
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
  /**
   * The runtime was measured and shown, but not enforced: a first solve under
   * the AFTER_FIRST_SOLVE gate mode. Optional so older clients and stored
   * verdicts read as enforced, which is what they were.
   */
  waived?: boolean;
}

/**
 * One selectable time budget and whether the learner can actually use it.
 *
 * `available` is false when nothing in their curriculum fits under it. The
 * dashboard greys those out rather than letting a band be chosen and then
 * quietly relaxed by the selector.
 */
export interface TimeBudgetOption {
  minutes: number;
  problemCount: number;
  available: boolean;
}

/**
 * Which palette every surface shows. Mirrors the Prisma enum.
 *
 * SYSTEM means "keep following the operating system", which is not the same
 * as having picked whatever the OS is right now: the OS can change later, and
 * a stored SYSTEM follows it while a stored DARK does not.
 */
export type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM';

/** When the speed gate applies. Mirrors the Prisma enum of the same name. */
export type SpeedGateMode = 'AFTER_FIRST_SOLVE' | 'ALWAYS';

/**
 * The time budget a learner may choose, in minutes, as a ceiling on how long
 * a served problem is expected to take.
 *
 * A fixed ladder rather than free entry: these are the bands the corpus is
 * authored against, and a free number invites 1-minute budgets that no problem
 * can satisfy. The dashboard greys out any band with nothing under it.
 */
export const TIME_BUDGET_CHOICES = [3, 10, 30, 60] as const;
export type TimeBudgetMinutes = (typeof TIME_BUDGET_CHOICES)[number];

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
  /**
   * A worked solution per language, populated on the same rule as `editorial`:
   * empty while the session runs, filled once it has ended. Keyed by
   * `Language`, and not every language is always present.
   */
  referenceSolution: Partial<Record<Language, string>>;
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

// ---------------------------------------------------------------------------
// Tutor: graduated hints
// ---------------------------------------------------------------------------

/**
 * Five levels of help, weakest to strongest. Any level can be asked for
 * directly: nobody has to fail repeatedly to unlock an explanation.
 */
export const HINT_LEVELS = [1, 2, 3, 4, 5] as const;
export type HintLevel = (typeof HINT_LEVELS)[number];

export const HINT_LEVEL_LABELS: Record<HintLevel, string> = {
  1: 'A question to focus on',
  2: 'Step through an example',
  3: 'Explain the idea',
  4: 'Outline with one gap',
  5: 'Full worked solution',
};

export type HintRequestKind =
  | 'next'
  | 'level'
  | 'didnt_help'
  | 'explain_word'
  | 'step_by_step'
  | 'smaller_example'
  | 'different_explanation';

/**
 * Where the values in a trace came from. `executed` is your code on the judge;
 * `reference` is a checked reference solution; `illustrative` is an example
 * that nobody ran.
 */
export type HintGrounding = 'executed' | 'reference' | 'illustrative';

export interface HintTrace {
  title: string;
  grounding: HintGrounding;
  groundingNote: string;
  columns: string[];
  rows: string[][];
  divergence: string | null;
}

export interface HintEvidence {
  /** True only when the current code was actually executed for this hint. */
  ran: boolean;
  summary: string;
  /** Things known from execution or from the tests themselves. */
  facts: string[];
  /** A likely cause. Never stated as fact unless execution confirms it. */
  suspicion: { text: string; confidence: 'confirmed' | 'likely' | 'possible' } | null;
}

export interface HintView {
  level: HintLevel;
  levelLabel: string;
  strategy: string;
  request: HintRequestKind;
  diagnosis: string;
  notice: string | null;
  explain: string | null;
  tryThis: string | null;
  body: string | null;
  code: { label: string; text: string; language: string } | null;
  trace: HintTrace | null;
  evidence: HintEvidence;
  terms: Array<{ term: string; definition: string }>;
  /** Honest statement of what produced this hint. */
  analysisNote: string;
  /** Set when the code changed and the issue discussed last time is gone. */
  resolvedNote: string | null;
  /** Set when "that didn't help" moved to a different or stronger approach. */
  escalationNote: string | null;
  checkUnderstanding: { slug: string; title: string; why: string } | null;
  nextLevel: HintLevel | null;
}

export interface HintRequestInput {
  problemId: string;
  lockSessionId?: string;
  language: Language;
  sourceCode: string;
  request: HintRequestKind;
  level?: HintLevel;
  term?: string;
  /** A hidden case the last submission failed, as that response showed it. */
  hiddenFailure?: { ordinal: number; actualStdout?: string | null; stderr?: string | null };
}

// ---------------------------------------------------------------------------
// Success and progress
// ---------------------------------------------------------------------------

/**
 * How a solve was reached. Kept distinct on purpose: assisted work and a
 * reproduced worked solution are real progress, and neither is evidence of
 * independent mastery.
 */
export type AccomplishmentKind = 'independent' | 'assisted' | 'worked_solution' | 'recall' | 'transfer';

/**
 * What a solve, or a failed attempt, showed that the learner could not do
 * before. Ordered rarest first; `solved` is always last and always present on
 * an accepted submission. See docs/reward-and-stretch.md.
 */
export type RewardEventKind =
  | 'skill_demonstrated'
  | 'first_unaided'
  | 'review_held'
  | 'near_miss_improved'
  | 'transfer'
  | 'recall'
  | 'solved';

export interface RewardEvent {
  kind: RewardEventKind;
  /** The skill concerned, when the event is about one. */
  skill?: string;
  /** One plain sentence. Informational, never praise. */
  note: string;
}

/** Full: the existing motion and chime. Quiet: headline and one detail, still. */
export type RewardSurface = 'full' | 'quiet';

/** A failed attempt that passed more cases than the previous one. */
export interface NearMiss {
  passed: number;
  total: number;
  previousPassed: number;
}

export interface SkillProgressView {
  skill: string;
  label: string;
  state: string;
  stateLabel: string;
  independent: number;
  assisted: number;
}

/** How a growth rate compares with the editorial's stated standard. */
export type ComplexityVerdict = 'matches' | 'slower' | 'faster' | 'unknown';

/**
 * GET /progress/complexity/:submissionId — how a passing solution scales, and
 * the standard approach to practise.
 *
 * `yours` is a static estimate from the submitted code, never a measurement:
 * it carries its reasons and a confidence so it can be checked. `standard` is
 * what the problem's editorial states, or null where it states nothing
 * readable. Available only after the lock is over, because the standard
 * solution is the answer.
 */
export interface ComplexityFeedback {
  language: Language;
  yours: {
    time: string;
    space: string;
    confidence: 'medium' | 'low';
    reasons: string[];
  };
  standard: { time: string | null; space: string | null };
  verdict: { time: ComplexityVerdict; space: ComplexityVerdict };
  /** One plain sentence comparing the two. */
  summary: string;
  standardSolution: {
    language: Language;
    code: string;
    /** The editorial's name for the approach, e.g. "Sliding Window". */
    approach: string | null;
    /** Set when the solution shown is not in the learner's language, and why. */
    note: string | null;
  } | null;
  editorialMarkdown: string | null;
  editorialUrl: string | null;
}

export interface Accomplishment {
  kind: AccomplishmentKind;
  headline: string;
  details: string[];
  helpSummary: string;
  skills: SkillProgressView[];
  variation: { slug: string; title: string; why: string } | null;
  /** Occasional and dismissible. */
  askFeedback: boolean;
  /** Rarest first, `solved` last. Older rows may lack this. */
  events?: RewardEvent[];
  /** Which success moment to show. Older rows may lack this; treat as full. */
  surface?: RewardSurface;
  /**
   * Where this solve left the difficulty ladder.
   *
   * Recorded with the accomplishment rather than read live, for the same
   * reason the rest of this object is: it describes the moment of the solve,
   * and a later session must not rewrite it. Older rows lack it, and a
   * `held` move is worth saying nothing about, so both read as absent.
   */
  ladder?: LadderMove | null;
}

/**
 * The curriculum's pattern families, and what to call them on screen.
 *
 * The enum values are the database's; these are the words a learner reads.
 * Defined here rather than in either front end so the family map, the lock
 * screen and anything later all name a family the same way.
 *
 * Order is the order they are met, not alphabetical — the map reads as a route
 * through the curriculum, and sorting it by name would hide that.
 */
export const PATTERN_FAMILIES = [
  'FOUNDATIONS',
  'ARRAYS_HASHING',
  'TWO_POINTERS',
  'SLIDING_WINDOW',
  'STACK',
  'BINARY_SEARCH',
  'LINKED_LIST',
  'TREES',
  'TRIES',
  'HEAP_PRIORITY_QUEUE',
  'BACKTRACKING',
  'GRAPHS',
  'ADVANCED_GRAPHS',
  'DP_1D',
  'DP_2D',
  'GREEDY',
  'INTERVALS',
  'MATH_GEOMETRY',
  'BIT_MANIPULATION',
] as const;

export type PatternFamily = (typeof PATTERN_FAMILIES)[number];

export const FAMILY_LABELS: Record<PatternFamily, string> = {
  FOUNDATIONS: 'Foundations',
  ARRAYS_HASHING: 'Arrays & hashing',
  TWO_POINTERS: 'Two pointers',
  SLIDING_WINDOW: 'Sliding window',
  STACK: 'Stack',
  BINARY_SEARCH: 'Binary search',
  LINKED_LIST: 'Linked list',
  TREES: 'Trees',
  TRIES: 'Tries',
  HEAP_PRIORITY_QUEUE: 'Heap & priority queue',
  BACKTRACKING: 'Backtracking',
  GRAPHS: 'Graphs',
  ADVANCED_GRAPHS: 'Advanced graphs',
  DP_1D: 'Dynamic programming, 1D',
  DP_2D: 'Dynamic programming, 2D',
  GREEDY: 'Greedy',
  INTERVALS: 'Intervals',
  MATH_GEOMETRY: 'Maths & geometry',
  BIT_MANIPULATION: 'Bit manipulation',
};

/**
 * One family's standing: how much of it the learner has met, and how their
 * times sat against the bar while meeting it.
 *
 * `solved` counts distinct problems, never submissions — solving one problem
 * six times is one problem met, and counting attempts would let a learner fill
 * the map by repeating the easiest thing they know.
 */
export interface FamilyProgress {
  family: PatternFamily;
  label: string;
  /** Whether the progression gate has opened this family yet. */
  unlocked: boolean;
  /** Distinct problems in this family with at least one correct solve. */
  solved: number;
  /** Active problems in the family. The denominator the map fills against. */
  total: number;
  /** ISO timestamp of the most recent solve here, or null. */
  lastSolvedAt: string | null;
  /**
   * Median of runtime divided by budget across solves here, or null when
   * nothing has been measured. Below 1 means comfortably inside the bar; above
   * it means correct answers slower than the gate would allow today.
   */
  typicalRatio: number | null;
}

/**
 * A move on the difficulty ladder, as the success screen says it.
 *
 * `held` is included so the type can describe every outcome, but the screens
 * only render a move that actually happened: a line saying "you stayed where
 * you were" after every ordinary solve is noise, and it would make the two
 * moves that matter easy to miss.
 */
export interface LadderMove {
  transition: 'promoted' | 'demoted' | 'held';
  from: Difficulty;
  to: Difficulty;
  /** The ladder's own sentence, already written for a reader. */
  reason: string;
}

/**
 * Where the learner's edge is. Informational: it names the next skill and
 * how close it is in words, and shows the first-try pass rate beside the
 * band the app aims for. Nothing here is a counter or a bar.
 */
export interface FrontierView {
  next: { skill: string; label: string } | null;
  /** "not met yet" | "practised with help" | "one unaided solve away" | "". */
  distance: string;
  /** One sentence about the most recent attempt on the next skill, or null. */
  lastProved: string | null;
  /**
   * The closest interview-level (Tier 1) problem and the skills still between
   * the learner and it. Null once nothing stands in the way.
   */
  nearestInterview?: { title: string; missing: string[] } | null;
  passRate: {
    /** Fraction of recent locks solved on the first submission. Null with no locks. */
    rate: number | null;
    /** How many locks the rate is over. */
    locks: number;
    /** The band the app aims for, as fractions. */
    band: [number, number];
  };
}

export interface ProgressView {
  skills: SkillProgressView[];
  /** Absent on older servers. */
  frontier?: FrontierView;
  recent: Array<{ at: string; title: string; kind: AccomplishmentKind; headline: string }>;
  counts: Record<AccomplishmentKind, number>;
  welcomeBack: string | null;
  lastActiveAt: string | null;
}

export type FeedbackFeeling = 'satisfying' | 'fine' | 'flat' | 'frustrating';

export interface FeedbackInput {
  kind: 'hint' | 'success';
  problemSlug?: string;
  helpful?: boolean;
  feeling?: FeedbackFeeling;
  hintLevel?: HintLevel;
  strategy?: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Learn
// ---------------------------------------------------------------------------
// The desktop's Learn subview. Every field here is new and optional to the
// rest of the contract: an older client never asks for it, and an older
// server never sends it. Nothing in this section carries an answer key or a
// reference solution; those stay on the server.

export type LearnReasonCode =
  | 'resumed'
  | 'blocker'
  | 'problem'
  | 'pattern'
  | 'prerequisite'
  | 'frontier'
  | 'review'
  | 'consolidation'
  | 'content_gap'
  | 'history_unavailable';

export type LearnConfidence = 'confirmed' | 'likely' | 'possible';

export interface LearnSourceView {
  publisher: string;
  title: string;
  url: string;
  section: string;
  runtime: string;
  reviewedOn: string;
}

export interface LearnLessonSummary {
  id: string;
  skill: string;
  skillLabel: string;
  title: string;
  objective: string;
  prerequisites: string[];
  /** The learner's state on this lesson's skill, in the progress page's words. */
  skillState: string;
  skillStateLabel: string;
  /** Null for a foundation lesson; the pattern family for a lesson beyond them. */
  family?: string | null;
}

export interface LearnRecommendationView {
  lesson: LearnLessonSummary | null;
  reasonCode: LearnReasonCode;
  /** Plain words about what was observed. Never a verdict about the learner. */
  reason: string;
  confidence: LearnConfidence;
  language: Language;
  contentVersion: string;
  variantAvailable: boolean;
  fluencyNote: string | null;
}

export interface LearnResourceView {
  family: string;
  title: string;
  summary: string;
  coverage: 'resources_only';
  resources: LearnSourceView[];
}

export interface LessonCheckResultView {
  attemptId: string;
  checkId: string;
  kind: 'prediction' | 'task';
  correct: boolean;
  /** Shown after answering, whichever answer was given. */
  explanation: string | null;
  /** For a task: what the program printed, and any compiler or runtime message. */
  stdout: string | null;
  stderr: string | null;
  at: string;
}

export interface LessonSessionView {
  id: string;
  lessonId: string;
  language: Language;
  contentVersion: string;
  /** Which step is open. 0 = idea, 1 = example, 2 = prediction, 3 = task, 4 = practice, 5 = done. */
  step: number;
  status: 'active' | 'finished';
  /** Optimistic-concurrency token. Every write sends the version it read. */
  version: number;
  draft: Record<string, string>;
  checks: Record<string, LessonCheckResultView>;
  updatedAt: string;
}

export interface LearnView {
  language: Language;
  contentVersion: string;
  /** 'unavailable' means the history could not be read; it is not the same as 'empty'. */
  history: 'available' | 'empty' | 'unavailable';
  primary: LearnRecommendationView;
  review: LearnRecommendationView | null;
  topics: LearnLessonSummary[];
  resources: LearnResourceView[];
  active: LessonSessionView | null;
}

export interface LessonTraceStepView {
  label: string;
  text: string;
}

/** A prerequisite the learner has not met, explained in place. */
export interface LessonPrimerView {
  skill: string;
  label: string;
  title: string;
  explanation: string;
  smaller: { description: string; trace: LessonTraceStepView[] };
  /** The lesson to open for the full version; returns to the same position. */
  lessonId: string;
}

export interface LessonView {
  id: string;
  skill: string;
  skillLabel: string;
  title: string;
  objective: string;
  prerequisites: string[];
  /**
   * The depth inferred from the learner's evidence on this skill: 'beginner'
   * shows the full explanation first, 'concise' the refresher first, and
   * 'bridge' the refresher with the syntax card emphasised because the
   * concept is known but not in this language. Any of them can be overridden.
   */
  depth?: 'beginner' | 'concise' | 'bridge';
  explanation: string;
  /** Present on servers with the teach-first pass. */
  refresher?: string;
  /** Words in the explanation with plain definitions, for "explain this term". */
  terms?: Array<{ term: string; definition: string }>;
  /** Prerequisites the evidence says are unmet, explained in place. */
  primers?: LessonPrimerView[];
  alternate: string;
  trace: LessonTraceStepView[];
  smaller: { description: string; trace: LessonTraceStepView[] };
  check: { id: string; question: string; options: string[] };
  language: Language;
  variant: {
    example: { code: string; stdout: string };
    note: string | null;
    task: { prompt: string; starter: string; stdout: string };
    sources: LearnSourceView[];
    /** The constructs this lesson's techniques need in this language, as one code block. */
    syntax?: string | null;
  };
  sources: LearnSourceView[];
  contentVersion: string;
}

export interface LessonPracticeView {
  problem: PublicProblem;
  /** Why this problem, in the selector's own words. */
  fit: string;
  /** How a solve here is recorded, said up front. */
  note: string;
}
