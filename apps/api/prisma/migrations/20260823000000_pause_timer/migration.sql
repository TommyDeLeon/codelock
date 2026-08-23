-- Pausing an armed countdown.
--
-- Nullable, so every existing row is "not paused" and no backfill is needed.
-- Resuming shifts "fireAt" forward by the time spent paused, which keeps the
-- remaining interval exact without storing it separately.
ALTER TABLE "lock_sessions" ADD COLUMN "pausedAt" TIMESTAMP(3);
