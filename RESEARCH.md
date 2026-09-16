# Research behind the tutor and the success moment

This separates what research establishes from what CodeLock is betting on.
Individual ingredients below have supporting evidence. **The combined design has
not been tested, and nothing here shows that it works for CodeLock's learners.**

## How sources were checked

Checked on 2026-09-15.

- **Full text:** Ryan & Deci (2000) and Dunlosky et al. (2013).
- **Abstracts, via Europe PMC:** Ryan & Deci and Roediger & Karpicke (2006).
- **Abstract figures from index pages (ERIC/Mendeley):** Sailer & Homner
  (2020). The Springer page required sign-in.
- **Summary level only:** Wood, Bruner & Ross (1976), VanLehn (2011),
  Sweller & Cooper (1985), Hattie & Timperley (2007) and Shute (2008). These
  were checked through abstracts or index summaries, not full text, and are
  marked *summary-level* below. Re-check them against the originals before
  relying on specifics.

## Established findings

### Motivation needs

**Ryan & Deci, 2000, *American Psychologist*, 55, 68–78.**

- Self-determination theory proposes three needs: competence, autonomy and
  relatedness. When they are satisfied, motivation increases; when they are
  thwarted, it decreases.
- The paper cites a meta-analysis (Deci, Koestner & Ryan, 1999): expected
  tangible rewards made contingent on task performance reliably undermine
  intrinsic motivation. So do threats, deadlines and pressured evaluations.
- Choice, acknowledgment of feelings and opportunities for self-direction
  enhance intrinsic motivation. Autonomy-supportive teachers see more curiosity
  and desire for challenge in their students.

### Gamification

**Sailer & Homner, 2020, *Educational Psychology Review*, 32, 77–112.**

- The meta-analysis found small, significant effects on three kinds of outcome:
  - cognitive: g = 0.49
  - motivational: g = 0.36
  - behavioural: g = 0.25
- Only the cognitive effect held up in the studies with high methodological
  rigor. The motivational and behavioural effects were less stable.

### Learning techniques

**Dunlosky, Rawson, Marsh, Nathan & Willingham, 2013, *Psychological Science in
the Public Interest*, 14, 4–58.**

- The review rated practice testing and distributed (spaced) practice as high
  utility. Both help learners of different ages and abilities, on many kinds of
  test, including in real classrooms.
- It rated self-explanation, elaborative interrogation and interleaving as
  moderate: promising, but with more limited evidence.

### Retrieval practice

**Roediger & Karpicke, 2006, *Psychological Science*, 17, 249–255.**

- On a test 5 minutes later, restudying beat testing.
- On tests 2 days and 1 week later, having been tested produced substantially
  better retention, even though restudying made students more confident.

### Scaffolding (*summary-level*)

**Wood, Bruner & Ross, 1976.**

- The tutor controls the parts of a task that are beyond the learner, so the
  learner can complete the parts within their reach.
- The support is temporary.

### Tutoring granularity (*summary-level*)

**VanLehn, 2011, *Educational Psychologist*, 46(4).**

- Human tutoring showed an effect of about d = 0.79; step-based intelligent
  tutoring, about 0.76.
- Tutoring that responds at the level of individual steps came close to human
  tutoring. Tutoring that only checks the final answer did less well.

### Worked examples (*summary-level*)

**Sweller & Cooper, 1985, and later work.**

- For novices, studying worked examples often beats pure problem solving, for
  both learning and transfer.
- The benefit fades as expertise grows.

### Feedback (*summary-level*)

**Hattie & Timperley, 2007; Shute, 2008.**

- Feedback is powerful, but its effect can be positive or negative.
- Useful feedback answers three questions: where the learner is going, how they
  are doing, and what to do next.
- Formative feedback works best when it is specific, timely, supportive and
  nonevaluative. Hints and worked examples are recognised forms of it.

## CodeLock's product hypotheses (not established here)

1. **Hints built from the learner's own code and real test results help more
   than generic hints.**
   - *Grounded in:* VanLehn's granularity finding and feedback specificity.
   - *How to test:* hint-helpful ratings, and whether the next submission
     passes.
2. **A five-level ladder that allows direct access to any level avoids both
   stuck learners and premature answers.**
   - *Grounded in:* scaffolding, and worked examples for novices.
   - *Risk:* jumping to level 5 too early. Watch how often level 5 is requested
     first, and what later unaided performance looks like.
3. **"That hint didn't help" switching strategy reduces frustration.**
   - *Grounded in:* nothing directly; this is a design choice.
   - *How to test:* feedback after escalations.
4. **Specific, factual success statements feel more meaningful than "Correct".**
   - *Grounded in:* competence support, and informational rather than
     controlling feedback.
   - *Design consequence:* no performance-contingent tangible rewards, given
     the undermining evidence.
5. **Recording assisted, independent, recall and transfer separately gives
   honest progress, and later review helps retention.**
   - *Grounded in:* spacing and retrieval practice.
   - *Unknown:* whether learners actually return for reviews.
6. **A clear "Finish" after every solve, no streaks, and gentle restarts
   support voluntary return without pressure.**
   - *Grounded in:* self-determination theory on choice versus pressure.
   - *Unknown:* the effect on return rates.

## Measurement

**What gets collected.** Everything optional is dismissible:

- hint helpfulness (thumbs up/down, "that didn't help")
- how a solve felt, asked at most once every 3 days

Accomplishment kind is derived from the record, as are later independent solves
and return after absence.

**What the checks can show.** The automated hint evaluation
(`apps/api/src/services/tutor/eval.test.ts`) checks correctness, grounding,
actionability, escalation and honesty about evidence, against real judge runs.

**What they cannot show.** Whether beginners find the hints understandable. Two
AI reviewers critiqued real outputs; that is not learner evidence either.

**What is not optimised.** Time on screen.

## Reward and difficulty (2026-09-16)

Why this section exists: after the success moment shipped, the app re-served
solved problems and the learner's level stopped moving. The fix in
`apps/api/src/services/repetition.ts` is a bug fix; what follows is the
evidence for the difficulty and reward redesign in `docs/reward-and-stretch.md`.

Working definition used throughout: "dopamine" means **reward prediction
error** — the signal fires on *unexpected* progress, not on completion.

### How these sources were checked

Checked on 2026-09-16. Twelve sources, none of them re-used from above except
where noted.

- **Full text:** Schultz (2016), via PubMed Central.
- **Abstract:** Schultz, Dayan & Montague (1997) via PubMed; Wilson, Shenhav,
  Straccia & Cohen (2019) via Europe PMC; Cepeda et al. (2006); Deci, Koestner
  & Ryan (1999); Kang et al. (2009); Loewenstein (1994); Nunes & Drèze (2006);
  Kivetz, Urminsky & Zheng (2006); Frederick & Loewenstein (1999).
- **Summary level only:** Bjork & Bjork (2011), Nakamura & Csikszentmihalyi
  (2002) and Rohrer & Taylor (2007). Checked through index pages and search
  summaries; re-check against the originals before relying on specifics.
- **Not newly sourced:** Vygotsky's zone of proximal development is used here
  only through Wood, Bruner & Ross (1976), already listed above at summary
  level. Sailer & Homner (2020) and Ryan & Deci (2000) are cited from above.

### Established findings

#### Reward prediction error

**Schultz, Dayan & Montague, 1997, *Science*, 275, 1593–1599** (*abstract*)
and **Schultz, 2016, *Dialogues in Clinical Neuroscience*, 18, 23–32**
(*full text*).

- Most midbrain dopamine neurons signal the difference between received and
  predicted reward. More than predicted: activation. Exactly as predicted: no
  response — Schultz's phrase is that with no prediction error "we learn
  nothing". Less than predicted: depression below baseline.
- The response transfers backwards to the earliest reliable predictor of the
  reward, so a fully predictable sequence stops producing a signal at the
  reward itself.
- Dopamine neurons respond more to risky than to safe rewards in the low range;
  the response scales with utility, not with the raw size of the reward.
- *What this means for CodeLock:* a celebration that fires identically on
  every solve becomes fully predicted and stops carrying signal. Reward has to
  attach to outcomes the learner did not expect — a first unaided solve, a
  skill changing state, a faster time — and not be certain in advance.
- *Limit:* this is single-neuron and imaging work on primates and humans in
  simple reward tasks. Nothing here measures how a celebration screen in a
  learning app maps onto that signal.

#### The optimal error rate

**Wilson, Shenhav, Straccia & Cohen, 2019, *Nature Communications*, 10, 4646**
(*abstract*).

- For a broad class of stochastic-gradient-descent learners on **binary
  classification** tasks, learning is fastest at a training error rate of
  about 15.87%, that is, about 85% accuracy. Demonstrated on artificial neural
  networks and on biologically plausible networks used to model animal
  learning.
- *What this means for CodeLock:* a target first-try pass rate near 75–85% is
  a defensible starting point for "hard enough to learn, easy enough to keep
  going". The lock should not be solved first-try nearly every time, which is
  what the 09-15 history shows.
- *Limit, stated plainly:* the abstract describes a derivation for gradient
  descent on binary classification and demonstrations on networks. It reports
  no human behavioural experiment. Applying 85% to a person solving coding
  problems is an **analogy**, not a finding.

#### Desirable difficulties: spacing, interleaving, retrieval

**Bjork & Bjork, 2011** (*summary-level*), in *Psychology and the Real World*.

- Conditions that make practice feel harder and slower — varying conditions,
  interleaving topics, spacing sessions, testing instead of restudying — tend
  to improve long-term retention and transfer, while conditions that make
  practice feel smooth tend to inflate confidence more than learning.

**Cepeda, Pashler, Vul, Wixted & Rohrer, 2006, *Psychological Bulletin*, 132,
354–380** (*abstract*).

- Meta-analysis of 839 assessments from 317 experiments. Spaced learning
  episodes beat massed ones, and the gap between episodes that produces the
  best retention grows as the retention interval grows.

**Rohrer & Taylor, 2007, *Instructional Science*, 35, 481–498**
(*summary-level*).

- Mixing mathematics problem types in practice lowered performance *during*
  practice and raised it on a later test, compared with blocking by type.
- *What these three mean for CodeLock:* solved, mastered material should come
  back — but as brief spaced retrieval with a growing gap, not as the same full
  lock. Practice that feels effortless is the warning sign. Serving the frontier
  skill mixed with retrieval of earlier ones is the interleaving that the
  evidence supports; serving the same family ten times in a row is not.
- *Limit:* the strongest evidence is verbal recall and mathematics procedures.
  Transfer to writing code is assumed, not measured.

#### Flow: challenge and skill

**Nakamura & Csikszentmihalyi, 2002**, in *Handbook of Positive Psychology*
(*summary-level*).

- Flow is reported when perceived challenge and perceived skill are both high
  and in balance, with the person's skills stretched. Challenge well above
  skill reads as anxiety; well below, as boredom.
- *What this means for CodeLock:* the target is a problem the learner can
  *just* reach, which is the same target as the ZPD and the 85% analogy above.
  The 09-15 history — mastered problems at 100% first-try — sits in the boredom
  region by this account.
- *Limit:* flow is measured by self-report (experience sampling). It describes
  an experience, not a learning outcome, and the evidence that flow *causes*
  learning is weaker than the evidence that it correlates with enjoyment.

#### Zone of proximal development and fading scaffolds

Used through **Wood, Bruner & Ross (1976)**, above (*summary-level*).

- The tutor takes the parts beyond the learner's reach and hands them back as
  the learner grows; support is temporary by design.
- *What this means for CodeLock:* the hint ladder is the scaffold and is
  already built. What was missing is the *problem* being at the edge of reach
  in the first place. A problem needing one skill not yet demonstrated, with
  the ladder available, is the ZPD in this product.

#### Competence feedback versus controlling rewards

**Deci, Koestner & Ryan, 1999, *Psychological Bulletin*, 125, 627–668**
(*abstract*). Cited above through Ryan & Deci (2000); checked directly here.

- Meta-analysis of 128 experiments. Expected tangible rewards undermined
  free-choice intrinsic motivation: engagement-contingent d = −0.40,
  completion-contingent d = −0.36, performance-contingent d = −0.28.
- *What this means for CodeLock:* the reward redesign must stay informational
  — "here is what you can now do" — and must not become a tangible or expected
  payoff for performance. A streak that can be lost is a pressure, not
  information, and is ruled out on the same grounds.
- *Limit:* the meta-analysis is about tangible rewards and verbal feedback in
  lab and classroom tasks; it does not test celebration screens as such.

#### Curiosity, information gaps and uncertain reward

**Loewenstein, 1994, *Psychological Bulletin*, 116, 75–98** (*abstract*).

- Curiosity is proposed as a form of deprivation arising from a perceived gap
  between what one knows and what one wants to know.

**Kang, Hsu, Krajbich, Loewenstein, McClure, Wang & Camerer, 2009,
*Psychological Science*, 20, 963–973** (*abstract*).

- Reported curiosity about trivia questions correlated with activity in caudate
  regions associated with anticipated reward. Subjects spent scarce tokens and
  waiting time to see answers they were curious about. Curiosity raised memory
  activity when the guess was *wrong*, which the authors read as curiosity
  enhancing memory for surprising information.
- *What these mean for CodeLock:* a near miss — a wrong guess the learner
  cared about — is a high-value moment for memory, not a failure to hide. And
  the lock screen can show the gap ("this one needs one thing you have not
  used yet") rather than only the problem.
- *Limit:* trivia questions with a small scanner sample. The step from trivia
  curiosity to curiosity about a coding problem is an assumption.

#### Endowed progress and the goal gradient

**Nunes & Drèze, 2006, *Journal of Consumer Research*, 32, 504–512**
(*abstract*).

- Car-wash customers given a 10-stamp card with 2 stamps already on it
  completed it at 34%, against 19% for an 8-stamp blank card requiring the
  same 8 purchases.

**Kivetz, Urminsky & Zheng, 2006, *Journal of Marketing Research*, 43, 39–58**
(*abstract*).

- Effort rises as the goal nears: café customers bought more often as they
  approached a free coffee, and site users rated more songs and quit less as
  they neared a threshold.
- *What these mean for CodeLock:* showing "two unaided solves demonstrate a
  skill, you have one" is legitimate competence information *and* uses the
  goal gradient. Showing it honestly (real progress, not endowed) keeps it on
  the informational side of Deci et al. Manufactured head starts are not
  adopted.
- *Limit:* consumer loyalty behaviour, not learning. The effect on persistence
  is established; the effect on skill is not.

#### Gamification limits

**Sailer & Homner, 2020**, above.

- Small effects; only the cognitive effect survived the high-rigour subset.
  Nothing here justifies points, badges or leaderboards for their own sake.

#### Hedonic adaptation

**Frederick & Loewenstein, 1999**, in *Well-Being: The Foundations of Hedonic
Psychology*, 302–329 (*abstract*).

- Affective responses to favourable and unfavourable circumstances diminish
  with repeated exposure, across the domains reviewed (foods, wealth,
  appearance; noise, imprisonment, bereavement, disability).
- *What this means for CodeLock:* the same celebration for the same kind of
  event will fade. Varying which solves get the full moment, and reserving it
  for events that are genuinely rarer (state transitions, first unaided,
  personal bests), slows adaptation. This converges with the prediction-error
  account from a different literature.
- *Limit:* the domains reviewed are life circumstances, not UI events.

### What is established versus what CodeLock is betting on

**Established, with the limits above:**

- Prediction error, not receipt of reward, is what the dopamine signal codes.
- Spacing and retrieval beat massed restudy for retention; interleaving beats
  blocking on later tests.
- Expected tangible rewards contingent on performance reduce intrinsic
  motivation.
- Gamification effects are small and only the cognitive one is robust.
- Affective responses to repeated identical events fade.

**Bets — plausible, grounded in the above, not tested for this product:**

1. A first-try pass rate near 75–85% is the right difficulty target for lock
   problems. (85% comes from gradient-descent classifiers; the human number is
   unknown.)
2. Requiring one not-yet-demonstrated skill in at least 70% of locks keeps the
   learner at the frontier without the "three lessons at once" failure. The
   70% is a product choice, not a research figure.
3. Reserving the full success moment for state transitions, first unaided
   solves, personal bests and near-miss improvements — and giving plain solves
   a quieter acknowledgment — will keep the moment carrying signal. That is
   the prediction-error account applied to a screen; nobody has measured it.
4. Showing the frontier (which skill is next, how close, what the last attempt
   proved) supports competence without becoming controlling. This depends on
   wording staying informational, which is a matter of copy, not of evidence.
5. Acknowledging a failed attempt that improved (more cases passing, lower hint
   level) is the highest-prediction-error moment in the product. Grounded in
   Kang et al. on memory after wrong guesses; the "highest" claim is ours.

**What is measured to test the bets:** first-try pass rate per lock,
proportion of locks needing an undemonstrated skill, distribution of reward
event kinds, and the existing "how did that feel" prompt. Return rate is still
not measured, and time on screen is still not optimised.
