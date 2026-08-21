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

export const LANGUAGES = ['JAVASCRIPT', 'PYTHON', 'JAVA', 'CPP', 'GO'] as const;
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
  PYTHON: 'Python',
  JAVA: 'Java',
  CPP: 'C++',
  GO: 'Go',
};

/** Monaco language ids, which differ from ours for two of the five. */
export const MONACO_LANGUAGE_IDS: Record<Language, string> = {
  JAVASCRIPT: 'javascript',
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
  tags: string[];
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
  }>;
  /** Every test passed. Necessary for an unlock, but not sufficient. */
  correct: boolean;
  /** How the solution fared against the speed budget. Null if it was wrong. */
  performance: PerformanceVerdict | null;
  /** Correct AND within the speed budget. Only this releases the lock. */
  accepted: boolean;
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
export interface PerformanceVerdict {
  runtimeMs: number;
  targetMs: number;
  gateMs: number;
  passed: boolean;
  /** 1.0 = exactly on target, 2.0 = twice as slow as the best known answer. */
  ratio: number;
  reason: string;
}

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
