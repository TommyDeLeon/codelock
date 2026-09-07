-- One active lock session per user, enforced by the database.
--
-- `armSession` reads for an existing active session and then creates one
-- unconditionally. That is a check-then-act race like the ones on the ending
-- paths: two concurrent /arm requests both find nothing and both create a
-- session. The lookup was also scoped per device, so two device ids produced
-- two active sessions with no race needed at all.
--
-- Two active sessions matter beyond tidiness. The daily skip allowance is
-- counted per user but spent per session, so the atomic guard on a session's
-- transition bounds one lock rather than the allowance: with two locked
-- sessions and one skip left, both could be skipped. GET /lock/active also
-- returns only the newest, and the desktop watchdog reads "a different active
-- session" as evidence that the one it holds has ended.
--
-- A partial unique index is the right shape here: it constrains only the states
-- that mean "live", so the many resolved sessions a user accumulates are
-- unaffected. Prisma's schema language cannot express a WHERE clause on an
-- index, which is why this is hand-written SQL and why schema.prisma carries a
-- comment pointing here.
--
-- Safe to apply: verified before writing that no user currently holds more than
-- one ARMED or LOCKED session.
CREATE UNIQUE INDEX "lock_sessions_one_active_per_user"
  ON "lock_sessions" ("userId")
  WHERE "state" IN ('ARMED', 'LOCKED');
