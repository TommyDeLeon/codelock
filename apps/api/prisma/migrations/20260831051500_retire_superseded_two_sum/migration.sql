-- Retire `two-sum`, the last of the three pre-taxonomy seed rows.
--
-- The other two were re-authored as full definitions and keep their slugs
-- (`valid-parentheses` is now Tier 1 Stack, `longest-unique-substring` is Tier 1
-- Sliding Window). This one cannot be: `pair-with-target-sum` in
-- src/corpus/problems/tier1-arrays-hashing.ts is the same task, on the same
-- signature (`fn:ints,int->ints`), authored from scratch with an editorial and
-- six reference solutions. Re-authoring `two-sum` would put the same problem in
-- the corpus twice under two slugs.
--
-- Deactivating rather than deleting: submissions reference problems, and a user
-- who solved this row should keep their history. `isActive = false` removes it
-- from every selection path while leaving the foreign keys intact.
--
-- Why it cannot simply be left alone. It has no editorial and no reference
-- solution, so `eligibleForUnlock` is false and normal selection skips it — but
-- pickProblem's last-resort fallback filters on `isActive` alone:
--
--     where: { isActive: true }, take: 25
--
-- so the row was reachable after all, and a user who failed it got an empty
-- debrief. That is precisely the outcome the debrief exists to prevent, and it
-- is why "inactive" is the correct state rather than a tidy-up.
--
-- The guards matter: this must not fire if someone later re-authors the slug
-- into a complete problem. An authored row has an editorial and is eligible.
UPDATE "problems"
SET "isActive" = false
WHERE "slug" = 'two-sum'
  AND "eligibleForUnlock" = false
  AND ("editorialMarkdown" IS NULL OR "editorialMarkdown" = '');
