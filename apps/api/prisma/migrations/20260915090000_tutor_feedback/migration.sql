-- Two additive event kinds for the tutor and the success moment.
--
-- ACCOMPLISHMENT records how a solve was reached — independent, assisted,
-- reproduced from a worked solution, a later recall, or a transfer to a new
-- problem — so the progress page can show those apart after a restart.
--
-- FEEDBACK records optional, dismissible answers: whether a hint helped, and
-- how a solve felt. Nothing reads it to change difficulty or reward.
--
-- Additive and idempotent, like 20260911120000_capability_recorded.
ALTER TYPE "LearningEventKind" ADD VALUE IF NOT EXISTS 'ACCOMPLISHMENT';
ALTER TYPE "LearningEventKind" ADD VALUE IF NOT EXISTS 'FEEDBACK';
