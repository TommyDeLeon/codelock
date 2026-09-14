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
