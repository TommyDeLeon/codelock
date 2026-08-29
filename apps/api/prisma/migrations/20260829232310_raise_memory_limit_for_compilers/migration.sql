-- The sandbox applies memoryLimitKb as the container's --memory, and the
-- compiler runs inside it. At the old 125 MB default, `g++ -O2` on
-- <bits/stdc++.h> and `go run` were killed before producing a binary: a
-- two-line "read two ints, add them" program failed to compile, so C++ and Go
-- users could not solve any problem at all. Measured on this judge: 256 MB
-- still fails, 500 MB passes.

-- AlterTable
ALTER TABLE "problems" ALTER COLUMN "memoryLimitKb" SET DEFAULT 512000;

-- Existing rows are the ones users are actually served, so a new default alone
-- fixes nothing. Only rows still sitting on the old default are moved; anything
-- deliberately tuned away from 128000 is left as it is.
UPDATE "problems" SET "memoryLimitKb" = 512000 WHERE "memoryLimitKb" = 128000;
