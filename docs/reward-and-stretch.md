# Reward and stretch

Design for serving problems at the edge of the learner's reach and rewarding
growth they did not expect. Evidence and its limits are in
`RESEARCH.md` under "Reward and difficulty (2026-09-16)"; this document only
turns that into decisions.

The test every decision has to pass: **does it reward growth the learner did
not expect, at a difficulty they can just barely reach?**

## Why

On 2026-09-15 the owner's own history shows thirteen locks, eight distinct
problems, every one solved first-try or with a hint, three of them served
twice or three times the same day. The skill snapshot after all of it: four
skills demonstrated, `lists` not yet met, and the two problems that would
introduce it never served. The repeats were a bug (fixed in
`apps/api/src/services/repetition.ts`); the standing still was a design gap.
Selection filtered on "fair" and then picked by problem value, so a mastered
problem and a frontier problem had the same chance. Replay of 200 picks against
that history: 69% needed only demonstrated skills, 32% needed the frontier.

## 1. Difficulty targeting

**Decision.** `pickProblem` splits the eligible pool into three:

- **stretch** — needs at least one skill not yet `demonstrated`
  (`fitForLearner` reports `introducible` or `weak`, or a required skill is
  `practised_with_help`);
- **consolidating** — every required skill is demonstrated, and the problem is
  unsolved;
- **review** — solved before, every required skill was demonstrated, and at
  least one is now `due_for_review`.

Targets, over a rolling window of locks:

| share | pool | why |
|---|---|---|
| ≥ 70% | stretch | the frontier is where prediction error and learning both live |
| ≤ 30% | consolidating | interleaving; a breather that is still new material |
| 0% | review | never a lock; offered after a solve, see below |

The split is enforced by the pick, not by hoping: when the stretch pool is
non-empty it is chosen with a fixed probability of 0.8 (so the long-run share
clears 70% even when a consolidating pool exists), otherwise consolidating.
Within a pool the existing `bucketedPick` by value score still applies, so the
next problem stays unguessable. The weight is **static**; nothing tunes it
(Gemini point 1, adopted).

**Relief after a hard run** (Gemini point 2, adopted). If the last two locks
were both stretch and both ended with the worked solution, a bypass or an
abandon, the next lock draws from consolidating. One lock, then back to the
weight above. This is the anxiety-side guard from the flow account; it is not
a demotion and it touches no ladder.

**Review is never a full lock, and it is a real retrieval.** A review item is
the solved problem itself, graded, but it never gates the screen. It is
offered in the slot the success moment already has for a follow-up
(`variation`): after the stretch lock opens, "One from last week, if you want
it: *Shout It*. Your *text* skill is due." One attempt, optional, recorded as
a `recall` solve if it passes. That is testing rather than restudy (Roediger &
Karpicke; Gemini point 4, adopted in substance: the earlier draft offered a
one-question warm-up, which is closer to restudy and was dropped). The gap
grows: a skill that holds on review is next due after twice the previous
interval, capped at eight weeks. Mastered problems therefore come back,
briefly, and never as the thing standing between the learner and the screen.

**Expected first-try pass rate near 75–85%.** This is not tuned — there is no
model of pass probability, and the 85% figure is an analogy from
gradient-descent classifiers (Gemini point 1). It is approached by
construction: one new idea at a time (`MAX_NEW_SKILLS_PER_PROBLEM = 1`,
unchanged), the hint ladder available, and the frontier pool preferred. The
rate is *measured* per lock (first submission `ACCEPTED` or not) and shown in
the Progress tab as an observable, with the band beside it. If it sits
outside the band for a long stretch, that is a signal for the owner to change
the weight by hand, not for the app to change it.

**Invariant kept.** Every fallback rung in `pickProblem` stays. When no pool
has a problem, the ladder relaxes exactly as before and the lock opens.

**Swaps.** `too_hard` draws from stretch by fewest skills first — a different
single new idea, smaller — and from consolidating only when no stretch problem
fits (Gemini point 7, adopted in part: the fallback prefers stretch; a cap on
swaps is rejected, see the critique). `too_easy` draws from stretch by most
new ideas. Both exclude what the repetition rule excludes (already fixed).

## 2. Reward anchored on prediction error

**Decision.** A pure function `deriveRewardEvents(input)` in
`apps/api/src/services/tutor/reward.ts` returns a list of typed events from
the same input `deriveAccomplishment` already receives, plus the attempt
history for the session. Events, in the order they outrank each other:

| event | fires when | expected? |
|---|---|---|
| `skill_demonstrated` | a required skill moves to `demonstrated` on this solve | no — needs two separate unaided solves, the learner rarely tracks the count |
| `first_unaided` | first solve without any hint on a skill previously only practised with help (this also covers "fewer hints than last time on this skill", which was a separate event in the first draft — Gemini point 9) | no |
| `review_held` | a due skill returns to `demonstrated` after a gap | partly |
| `near_miss_improved` | a *failed* attempt that passed more cases than the previous attempt in this session; at most once per problem per session (Gemini point 6) | no — it is a failure |
| `transfer` / `recall` | as `deriveAccomplishment` already derives | partly |
| `solved` | any accepted submission | yes |

Dropped from the first draft: `faster_than_own` (rewards rushing; Bjork &
Bjork — Gemini point 8) and `fewer_hints` (invites using hints on the first
solve to bank the event — Gemini point 9). Personal-best timing stays where it
already is, in the performance panel, as a fact and not a reward.

`Accomplishment` gains `events: RewardEvent[]` and `surface: 'full' | 'quiet'`.

**Surface.** The full success moment (existing motion + soft chime, respecting
reduce-motion and the chime setting) is shown **only** when an event above
`solved` fired. A plain solve gets the `quiet` surface: the headline and the
one most informative detail, no motion, no chime, and "Finish" exactly where
it always is.

The first draft added a seeded 0.3 draw so some plain solves got the full
moment. Gemini (point 3) called that a variable-ratio schedule — a
slot-machine — and under Deci, Koestner & Ryan a controlling one. Adopted:
there is no random draw. Variation now comes only from the events themselves,
which the learner cannot predict without counting solves per skill, and which
are genuinely rarer than solves. That is what keeps the full moment from
becoming fully predicted (Schultz) and from fading through repetition
(Frederick & Loewenstein), without inventing a lottery. The variability is on
the *surface*, never on the truth: the recorded accomplishment is identical.

**Copy stays informational.** Every headline names what the learner can now
do or did differently: "You solved this without a hint; last time on
*Loops* you needed three." Nothing praises the person, nothing awards, nothing
counts up. Existing `deriveAccomplishment` copy is kept and extended.

## 3. Progress that shows the frontier

**Decision.** `GET /v1/progress` gains a `frontier` block, derived by a pure
`describeFrontier(snapshot, recentAttempts)`:

- `next`: the skill `nextSkillToLearn` returns, with its label.
- `distance`: shown as words, not a counter (Gemini point 5, adopted in
  part): "not met yet", "practised with help", or "one unaided solve away".
  The exact count is never a bar to fill; the one-step case is named because
  that is where the information is actionable.
- `lastProved`: one sentence about the most recent attempt on that skill,
  built from its reward events ("Your last attempt on *Lists* passed 4 of 6
  cases, up from 2").
- `passRate`: first-try pass rate over the last 20 locks, shown as a plain
  number with the target band beside it, so the learner can see when the app
  is serving too easy or too hard.

Web lock screen: one line above the problem, "This one builds on one new idea:
*Lists*" (already produced by `fitForLearner.reason`; now shown). Progress
tab, web and desktop: the frontier block above the skill map.

This is the goal gradient used honestly (Kivetz; Nunes & Drèze): real
distance, never endowed progress, and expressed as information rather than as
a bar to fill.

## 4. Near-miss handling

**Decision.** On a failed attempt, the grading path already records
`ATTEMPT_FAILED` with `passedCount` and `totalCount`. `deriveRewardEvents`
runs on failures too, comparing with the previous attempt in the same session
on the same problem. When `near_miss_improved` fires, the lock screen shows
one line under the result: "4 of 6 cases now, up from 2. The two left are the
empty-list ones." — the second sentence only when `coveredFeatures`-style
detection can name the failing group. No motion, no chime: it is a failed
attempt, and dressing it up would be dishonest. It fires at most once per
problem per session, so resubmitting broken code one case at a time earns
nothing after the first improvement (Gemini point 6). The event is recorded as
a learning event so the frontier's `lastProved` can use it.

This is the moment the research most clearly supports acknowledging (Kang et
al.: memory is enhanced for surprising wrong guesses), and it is the moment
the current app says nothing.

## 5. Non-goals

- **No streak-loss penalties.** Pressure, not information (Deci, Koestner &
  Ryan). The existing "no streaks" decision stands.
- **No leaderboards.** Single-user tool; relatedness is not served by ranking
  against nobody.
- **No expected tangible rewards contingent on performance.** Undermining
  effect, d ≈ −0.28 to −0.40.
- **No XP, points, badges or unlockable cosmetics.** Gamification effects are
  small and the robust one is cognitive, which the problems already provide.
- **No manufactured head starts.** Endowed progress works on persistence, but
  it is a lie about where the learner is, and the product's value is honesty
  about that.
- **No changes to the hint ladder, `diagnose.ts`, `starter.ts`, the DB schema
  or `apps/mobile`** in this pass. Reward events are derived from data already
  recorded.

## What is measured

Per lock, derived from rows that already exist (no schema change):

- pool served (stretch / consolidating / review) and first-try pass;
- time to first accepted submission and max hint level, **per pool** — the
  anxiety signal Gemini asked for (point 10): a stretch pool whose median
  time or hint level runs far above consolidating is too far from reach;
- per problem, first-try pass rate when served as stretch, so a problem that
  fails nearly everyone on its "one new idea" can be re-tagged (point 12);
- active days per week, computed by the replay script and kept out of the UI
  so it never becomes a streak (point 11);
- the distribution of reward event kinds, so "full" surfaces can be checked
  to be genuinely rarer than solves.

`scripts/replay-selection.ts` reports the first three against real history.
Time on screen is measured as a diagnostic and still not optimised.

## What is a bet

Everything in sections 1–4 is a bet grounded in the research, not a result.
The bets and how each is measured are listed at the end of the research
section. The numbers 70%, 0.8 and 75–85% are product choices; only the 85%
figure has a source, and that source is about gradient-descent classifiers.

## Adversarial critique (Gemini, 2026-09-16)

`gemini-3.1-pro-low` via `agy`, plan mode, read-only, given this document and
the research section. Twelve points. Each is adopted or rebutted here; the
sections above already reflect the adopted ones.

1. **85% rule drives automatic weight tuning — over-reads Wilson et al.**
   *Adopted.* The 0.8 weight is static. Pass rate is shown, not acted on.
2. **70% stretch can tip into anxiety / learned helplessness.** *Adopted.*
   Relief rule: two consecutive stretch locks ending in worked solution,
   bypass or abandon force one consolidating lock.
3. **0.3 random full-surface draw is a variable-ratio schedule.** *Adopted.*
   Dropped. Full surface is strictly event-contingent.
4. **Warm-up review weakens retrieval (Roediger & Karpicke).** *Adopted in
   substance.* Review is now a graded solve of the due problem, offered in the
   existing post-solve `variation` slot: real testing, optional, never gating.
   The "never a full lock" requirement is kept; what changed is that the
   retrieval is a real one.
5. **Counting down unaided solves is a chore-frame, not competence
   feedback.** *Adopted in part.* Distance is shown in words and only the
   one-step case is named. *Rebutted in part:* naming the next skill at all
   is competence information under Ryan & Deci and stays.
6. **Near-miss acknowledgment trains submission spam.** *Adopted.* At most
   once per problem per session.
7. **Unbounded `too_hard` swaps let learners hide from stretch.** *Adopted in
   part:* the swap now prefers a smaller stretch problem over a consolidating
   one. *Rebutted:* a cap on swaps. A bounded allowance "is a punishment with
   a counter on it" — the owner's standing decision in `sessionFlow.ts` — and
   a learner who swaps ten times still has to solve something to open the
   lock. The repetition rule already stops the swap being a route back to
   solved work, which was the actual exploit.
8. **`faster_than_own` rewards rushing.** *Adopted.* Dropped as an event.
9. **`fewer_hints` invites banking hints on the first solve.** *Adopted.*
   Folded into `first_unaided`, which requires zero hints now and help before.
10. **Time on screen is the anxiety signal and is not measured.** *Adopted as
    measurement.* Time-to-first-success and hint level per pool are
    reported. *Rebutted as objective:* it is still not optimised, because
    optimising it is how a tool starts wanting attention.
11. **Return rate is claimed and not measured.** *Adopted.* Active days per
    week in the replay script, kept out of the UI.
12. **"One undemonstrated skill" is a static stand-in for ZPD/flow.**
    *Adopted as measurement.* Per-problem stretch pass rate flags problems
    whose "one new idea" fails nearly everyone. *Rebutted as design change:*
    there is no better per-learner capacity model available without more
    history than one learner has, and the static rule is what the existing
    gate can test today.
