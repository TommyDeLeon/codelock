import { LockState, type Prisma } from '@prisma/client';

/**
 * Sessions that are not runs, and must stay out of any history the user reads.
 *
 * `/cancel` has no state of its own: stopping a countdown before it fires
 * resolves the session as ABANDONED, the same value a genuine surrender gets.
 * Listed unfiltered, a timer the user simply reset appears beside real
 * give-ups as 'Session — 0 attempts — abandoned', which is the log accusing
 * them of quitting something that never started.
 *
 * Keyed on the missing problem rather than on the state, because that is the
 * fact that actually separates the two. The reaper only ever resolves sessions
 * that reached LOCKED, and a LOCKED session always has a problem assigned — so
 * ABANDONED with no problem is reachable from `/cancel` and nowhere else.
 *
 * One exported predicate because it is needed in more than one query, and the
 * first version of this fix filtered `sessionsIndex` alone. The dashboard's run
 * log is built from `/stats/summary`, which has its own query, so the reset
 * timers went on showing in the one place the user was actually looking.
 *
 * It lives here, in a module that imports nothing of ours, rather than beside
 * the session service: `lockSessions` already imports `recordStep` from
 * `learningLog`, so putting it there and importing it back would close a cycle
 * for the sake of one constant.
 */
export const NOT_A_RUN: Prisma.LockSessionWhereInput = {
  NOT: { state: LockState.ABANDONED, problemId: null },
};
