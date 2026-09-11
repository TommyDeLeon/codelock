# Evidence behind the learning design

Every learning mechanism in CodeLock is listed here with the evidence it rests
on, what that evidence does not cover, and the code that implements it.

The distinction this document exists to hold: **evidence for a principle is not
evidence for our implementation of it.** Retrieval practice is well supported;
our particular interval schedule is not. Gamification has a measured average
effect; that says nothing about whether our specific points help.

## Sources, and how much of each was actually read

Browsing was available. Four of the five starting sources were read in full or
from an authoritative record; one was not. That distinction is preserved
throughout, and nothing here is cited from memory.

| Source | Access | Status |
|---|---|---|
| Ryan & Deci 2000, *Self-Determination Theory and the Facilitation of Intrinsic Motivation, Social Development, and Well-Being*, American Psychologist 55(1) 68–78 | PDF from selfdeterminationtheory.org, text extracted locally | **Read in full** |
| Roediger & Karpicke 2006, *Test-Enhanced Learning*, Psychological Science 17(3) 249–255 | Publisher and PubMed blocked; full PDF read from a mirror | **Read in full**, figures taken from the results section |
| Dunlosky, Rawson, Marsh, Nathan & Willingham 2013, *Improving Students' Learning With Effective Learning Techniques*, Psychological Science in the Public Interest 14(1) 4–58 | psychologicalscience.org returned 403; full PDF read from a mirror | **Read in full** for the utility ratings |
| Sailer & Homner 2020, *The Gamification of Learning: a Meta-Analysis*, Educational Psychology Review 32 77–112 | Springer paywalled; abstract retrieved verbatim from the Semantic Scholar API | **Abstract only.** The effect sizes below are the authors' own; the methods were not read. |
| Lally, van Jaarsveld, Potts & Wardle 2010, *How are habits formed: Modelling habit formation in the real world*, European Journal of Social Psychology 40(6) 998–1009 | Wiley returned 403; no accessible full text or abstract found | **Not read.** Any figure attributed to it is second-hand and marked unverified. |

One further claim, from search results rather than a paper that was read, is
flagged unverified where it appears: that gamification effects decline after
roughly four weeks.

## Mechanism by mechanism

### Graduated hints that name the idea and never write the code

**Evidence.** Dunlosky rates practice testing high utility, holding "across an
impressive range of practice-test formats, kinds of material, learner ages,
outcome measures, and retention intervals". Ryan & Deci report that students
"taught with a more controlling approach not only lose initiative but learn
less effectively, especially when learning requires conceptual, creative
processing", which is the argument for a hint that unblocks rather than a
solution that replaces the attempt.

**Limitation.** Neither source specifies a three-step hint ladder. The number
three, the ordering, and the decision that hints cost nothing are product
choices.

**Implementation.** `apps/api/src/services/hints.ts`. Three hints from three
different per-problem sources: the most specific pattern tag, the problem's
signature, and a check taken from the problem's own test data. Measured across
the 695-problem corpus by `apps/api/scripts/verify-hints.ts`: 611 distinct hint
trios, up from 266 before the change. Hints are free and never affect
difficulty.

### Capability statements, with the level of help recorded

**Evidence.** Ryan & Deci treat competence as one of three basic needs whose
satisfaction "yield[s] enhanced self-motivation and mental health", and report
that autonomy-supportive teachers "catalyze in their students greater intrinsic
motivation, curiosity, and desire for challenge".

**Limitation.** That a one-sentence capability statement is the right way to
communicate competence is a design inference, not a tested finding.

**Implementation.** `apps/api/src/services/capabilities.ts`. Three levels that
are never merged: solved with nothing revealed, solved after hints, solved
after the editorial was opened. The third is never recorded as demonstrated
mastery under any wording, and the evidence window is bounded by the
submission's own timestamp so that reading the editorial afterwards cannot
retroactively demote a solve it had no part in.

### Feedback grounded in execution, not inference

**Evidence.** Roediger & Karpicke's effects occurred "even though the tests
included no feedback", which is a claim about retrieval rather than an argument
against feedback. Dunlosky rates self-explanation moderate utility, strong
across materials and domains but with its value for the effort unsettled.

**Limitation.** No source here specifies what a failure message should say.

**Implementation.** `apps/web/src/components/lock/test-case-row.tsx`. Every
reviewable case shows the input, the expected output, the actual output, the
status and any error. Empty strings and empty outputs are named rather than
rendered as nothing, because a blank block is indistinguishable from a bug.
`describeMismatch` states the observed difference as fact and marks any cause
as an inference: printing `undefined` is reported as the fact, with "usually
that means either the function returned nothing for this input, or it asked for
a position that does not exist" worded as the likely rather than the known
cause.

### Spaced retrieval afterwards

**Evidence.** The strongest claim in the system. Roediger & Karpicke Experiment
1: after 5 minutes restudying beat testing, 81% against 75%; after 2 days
testing beat restudying, 68% against 54%; after 1 week, 56% against 42%. In
Experiment 2 the repeated-testing group recalled 61% after a week against 40%
for repeated study, "even though students in the former condition read the
passage only 3.4 times and those in the latter condition read it 14.2 times".
Dunlosky rates both practice testing and distributed practice high utility,
distributed practice because "it works across students of different ages, with
a wide variety of materials, on the majority of standard laboratory measures,
and over long delays".

**Limitation.** Those experiments used prose passages and free recall with
undergraduates, not programming problems. The direction is well supported. The
specific intervals are not: 1, 3, 7, 16, 35 then 60 days is a documented,
configurable heuristic, not a finding.

**Implementation.** `apps/api/src/services/retrieval.ts`, with the schedule
arithmetic in pure functions so the heuristic is inspectable and adjustable
separately from the storage.

### Points, if enabled

**Evidence.** Sailer & Homner's abstract reports small significant effects of
gamification on cognitive (g = 0.49, 95% CI 0.30–0.69, k = 19, N = 1686),
motivational (g = 0.36, CI 0.18–0.54, k = 16, N = 2246) and behavioural
outcomes (g = 0.25, CI 0.04–0.46, k = 9, N = 951), and states that while the
cognitive effect "was stable in a subsplit analysis of studies employing high
methodological rigor, effects on motivational and behavioral outcomes were less
stable". Against that, Ryan & Deci cite the Deci, Koestner & Ryan 1999
meta-analysis concluding that "all expected tangible rewards made contingent on
task performance do reliably undermine intrinsic motivation".

**Limitation.** Only the abstract of Sailer & Homner was read, and its own
summary says the factors contributing to successful gamification remain
somewhat unresolved. Separately and unverified, secondary sources report
gamification effects declining after about four weeks. Those three facts
together are why points stay secondary to the capability record, and why
nothing is gated behind them.

### A configurable interruption, and a reliable way out

**Evidence.** Ryan & Deci report that "threats, deadlines, directives,
pressured evaluations, and imposed goals diminish intrinsic motivation" by
shifting the perceived locus of causality outward, while "choice,
acknowledgment of feelings, and opportunities for self-direction" enhance it.

**Limitation.** A commitment device is, by construction, a deadline the learner
imposed on themselves. That tension is real and is not resolved by citing the
paper. The design response is that every constraint is one the learner
configured, and that there is always an exit.

**Implementation.** The schedule, quiet hours, snooze, pause and skip paths in
`apps/api/src/services/schedule.ts` and `lockSessions.ts`, plus the kill switch
in `apps/desktop/src/kill-switch.ts`. Session completed, session exited or
skipped, and skill demonstrated are stored as separate facts, so taking the
exit never awards mastery.

### Habit cues

**Evidence.** Not verified. Wiley blocked the Lally paper and no accessible
full text or abstract was found. Secondary summaries report 96 volunteers, 82
providing usable data, a mean of 66 days to reach peak automaticity and a range
of 18 to 254 days to 95% of asymptote. **Treat every one of those numbers as
unverified.**

**Limitation.** Even as reported, that range is enormous, and the behaviours
studied were eating, drinking and simple activity, not learning to program.

**Implementation.** No timeframe is promised anywhere in the product, and no
feature claims a habit will form by any particular date.

## What this system deliberately does not claim

- That learning will be effortless, or that returning will become automatic.
- That any interval, duration or threshold here is optimal.
- Anything about dopamine. No mechanism was chosen on a neurochemical
  rationale and none is described in those terms anywhere in the code.
- That findings from prose recall by undergraduates transfer intact to
  programming practice by one adult beginner.

## What it refuses to do

No shame, no fabricated urgency, no punitive streak resets, no loot-box
mechanics, no deceptive notifications, and no endlessly extending sessions.
Viewing a solution is recorded honestly and never as mastery.

## Measuring whether it actually helps

Tracked: activity starts and completions; assisted versus independent
performance; later retrieval and unfamiliar-variation performance; and optional
enjoyment and frustration reports.

Not tracked, on purpose: time spent in the app, and anything else that would
improve by keeping someone here longer.

One person's usage over a few weeks is an observation, not evidence of
causation. If engagement rises while later retrieval does not, the instruction
is what needs changing, not the rewards.
