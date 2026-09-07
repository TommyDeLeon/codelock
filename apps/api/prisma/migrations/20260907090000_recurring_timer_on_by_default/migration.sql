-- Turn the recurring timer on, and make it the default for new installs.
--
-- The column shipped with `DEFAULT false` and no way to change it: the PATCH
-- validator never listed `autoRearm`, so every client's request to set it was
-- stripped before it reached the database. The feature was read on every solve
-- and could never be true.
--
-- Now that it is settable, the default is inverted. A commitment device whose
-- timer stops after one session is a timer the user has to re-arm by hand each
-- time — which reintroduces exactly the per-session decision the product
-- exists to remove. Existing rows are updated too: they are all sitting on a
-- default nobody could have chosen.
--
-- Off remains one click away, in Settings and on the dashboard, and a lock
-- forced open with the kill switch still never re-arms.
ALTER TABLE "timer_configs" ALTER COLUMN "autoRearm" SET DEFAULT true;
UPDATE "timer_configs" SET "autoRearm" = true;
