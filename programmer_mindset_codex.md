# The Programmer's Mindset — A Living Codex

> A record of *how a programmer thinks*, not what they type.
> Language-agnostic. Built one phase at a time.

**Chosen problem:** FizzBuzz
**Status:** Phase 1 complete → Phases 2–4 pending

---

## The Problem (as it is usually handed to you)

> "Print the numbers from 1 to 100. But for multiples of 3, print `Fizz` instead.
> For multiples of 5, print `Buzz` instead. For multiples of both 3 and 5, print `FizzBuzz`."

That paragraph is not a specification. It is a *rumor* of a specification.
Phase 1 is the work of turning a rumor into something you can build against.

---

## Phase 1 — Understanding and Constraints

### The core mental move
A beginner reads the problem and asks: *"What code do I write?"*
An experienced programmer reads the problem and asks: **"What exactly am I being
asked to produce, and what is the complete set of situations I must survive?"**

Code is the last thing you think about, because code is cheap to write and
expensive to write *twice*. Understanding is the opposite.

### Step 1.1 — Name the input and the output precisely

Every program is a machine that turns one shape of data into another shape of data.
Until you can state both shapes in one sentence each, you cannot build the machine.

- **Input:** an upper bound `n` (a whole number). The "100" in the prompt is an
  example, not a law. Notice how the prompt hid the input inside a sentence.
- **Output:** a sequence of `n` lines, in order, each line being either a number
  or one of three words.

*Why this step matters:* the moment you write "the input is `n`, not 100", you have
turned a one-off script into a reusable function. Beginners hard-code the example.
Professionals notice which parts of the example are **data** and which are **rules**.

### Step 1.2 — Restate the rules as a decision, not as prose

Prose lists things in the order that reads nicely. Machines need the order that is
*logically correct*. Rewrite the rules as a set of conditions:

| Condition                     | Output     |
|-------------------------------|------------|
| divisible by 3 **and** by 5   | `FizzBuzz` |
| divisible by 3 only           | `Fizz`     |
| divisible by 5 only           | `Buzz`     |
| neither                       | the number |

*Why this step matters:* notice the both-case had to be lifted to the **top**.
The prose mentioned it last. If you follow prose order, 15 prints `Fizz` and you
have written the single most common bug in this problem — before writing any code.
This is the payoff of Phase 1: bugs found in a table cost seconds; the same bug
found in running code costs an hour.

### Step 1.3 — Interrogate the ambiguities

Ask the questions the prompt refuses to answer. A programmer who does not ask
these is not being efficient — they are guessing and calling it a decision.

1. Is the range inclusive of `n`? (Assume **yes**: 1..n inclusive.)
2. What if `n` is 0, or negative? (Produce **nothing**. No error — an empty
   sequence is the honest answer to "count to zero".)
3. What if `n` is huge (a billion)? Must the whole answer fit in memory?
   (This decides *emit-as-you-go* vs *build-a-list*.)
4. "Print" — to a screen? Or **return** the lines so a caller can use them?
   (Return, almost always. A function that prints can only ever be used one way.)
5. Are the words case-sensitive and exactly spelled? (Yes. In real work, output
   strings are a contract, and someone downstream is matching on them.)

*Why this step matters:* each question you ask before coding is a rewrite you don't
do later. Question 4 in particular is the difference between a toy and a component.

### Step 1.4 — Write down the edge cases *as tests you will run later*

These are not trivia. They are the list you will walk through in Phase 4 with your
finger on the screen.

- `n = 0` → nothing
- `n = 1` → `1`
- `n = 3` → `Fizz` appears
- `n = 5` → `Buzz` appears
- `n = 15` → `FizzBuzz` appears (**the case that catches the ordering bug**)
- `n = -4` → nothing, no crash
- `n = 100` → last line is `Buzz` (100 is divisible by 5, not 3)

*Why this step matters:* you have now written the definition of "done". Without it,
"done" means "I got bored", and that is how bugs ship.

### Phase 1 exit criteria
You may leave Phase 1 when you can answer, without looking at the prompt:
- what goes in, what comes out, in what shape;
- the rules as an *ordered* decision;
- what happens at the boundaries;
- how you will know you were right.

Only now is thinking about code allowed.

---

## Phase 2 — The Pseudo-code Blueprint
*(pending — next)*

## Phase 3 — Translation
*(pending)*

## Phase 4 — Debugging and Optimization
*(pending)*

---
---

# Part II — The Same Mindset, On Real Work

FizzBuzz taught the *shape* of the thinking. But FizzBuzz lies to you in one way:
its rules are already true. Real requirements arrive **wrong**, and the programmer's
job in Phase 1 is largely to discover *in what way* they are wrong.

**The real task (as a real person would hand it to you):**

> "Hey — can you make it so customers get an email a few days before their
> subscription renews? Legal wants us to warn people before we charge them."

One sentence. A week of work. Let's take it apart.

---

## Phase 1 — Understanding and Constraints (real-world edition)

### The core mental move
In FizzBuzz, Phase 1 meant *reading carefully*. Here it means something bigger:
**find the real-world facts the sentence assumes but does not state.** Every one of
those assumptions is a place the software will break, and each break is a real
person getting a wrong email — or getting charged with no warning at all.

The question is no longer "what does this say?" It is:
> **"What is actually true about the world this code will run in?"**

### Step 1.1 — Find the nouns, and ask what they *really* are

The sentence contains four innocent-looking nouns. Each one is a trap.

| The word | The question a programmer asks | Why it matters |
|---|---|---|
| "customers" | All of them? Including cancelled, paused, trialing, refunded, already-churned? | Emailing a cancelled customer "you'll be charged Friday" is a support ticket and a trust loss. |
| "an email" | Which email address? The billing one or the login one? What if it's bounced before? | The wrong address means the warning legally didn't happen. |
| "renews" | Renewal *date* — in whose timezone? Ours, or the customer's? | A "3 days before" window is off by a full day for half the planet if you get this wrong. |
| "a few days" | Three? Seven? Is it a business decision or your guess? | This is not yours to decide. Go ask. Guessing here is how you get blamed later. |

*The lesson:* a beginner sees a sentence. A programmer sees a set of **entities**
whose boundaries nobody has drawn yet, and goes and draws them — usually by asking
a human, not by inventing an answer.

### Step 1.2 — Name the input and output, exactly as before

The move is identical to FizzBuzz. Only the nouns got heavier.

- **Input:** the set of active subscriptions whose next charge date falls inside a
  window — plus, critically, **a record of which warnings we already sent.**
- **Output:** *not* "an email". The output is **a decision plus an effect**:
  for each subscription, either "send this specific message to this address" or
  "skip, for this stated reason" — and a durable note that we did it.

*Why this reframing is the whole ballgame:* the moment you say the output includes
"a record that we sent it", you have discovered the hard part of the problem before
writing code. Read on.

### Step 1.3 — The ordering trap, real-world version

Remember FizzBuzz: the prompt listed the `FizzBuzz` case last, and following prose
order gave you a wrong answer at 15. There is an exact analogue here, and it is the
single most common real-world bug in code like this:

> **This job will run more than once.**

Nobody said that. The sentence implies a thing that happens once, cleanly. Reality:
the job runs nightly on a schedule. It might crash halfway and be retried. It might
be deployed twice. Someone might run it by hand to test it.

If your logic is "find everyone renewing in 3 days → email them", then running the
job twice sends two emails. Running it in a retry loop after a crash sends emails to
everyone who already got one. Customers get four copies of a billing warning.

The fix isn't clever code — it's a Phase 1 realization, expressed as a rule that
must be lifted to the **top** of your decision, exactly like the FizzBuzz both-case:

| Condition (checked in this order) | Action |
|---|---|
| we already recorded a warning for this renewal | **skip** |
| subscription is not active (cancelled/paused) | skip |
| no usable email address | skip, and log it loudly |
| renewal date is inside the warning window | send, then record it |
| otherwise | skip |

That first row has a name: **idempotency** — running it twice does the same thing as
running it once. You did not learn it from the requirement. You derived it by asking
"what is actually true about the world this runs in?"

### Step 1.4 — Interrogate the ambiguities (the ones that cost money)

1. **Send-then-record, or record-then-send?** If you send and then crash before
   recording, you'll re-send. If you record and then crash before sending, the
   customer gets nothing. There is no perfect answer — you must *choose which
   failure you prefer* and say so out loud. (Usually: record first. A missing
   warning is bad; four duplicate billing emails is worse and unfixable.)
2. **What is "3 days before" when the job runs at 02:00 UTC?** Define the window as
   a *date range*, not a moment, or customers on window edges get missed entirely.
3. **What if the email service is down?** Does the whole run abort, or does it skip
   that one and continue? (Continue — one bad address must not block 5,000 warnings.)
4. **What if the renewal is cancelled after we warn them?** Nothing to do — but
   know the answer before support asks you at 5pm on a Friday.
5. **How do we prove to Legal that we sent it?** That's the *record* again — now
   doing double duty as an audit trail. Requirements often converge like this.

### Step 1.5 — Edge cases, written as the tests you will actually run

- Run the job twice in a row → **second run sends zero emails** (the idempotency test)
- Customer cancelled yesterday, renews in 3 days → no email
- Customer with a bounced/missing email → skipped, and visible in the logs
- Customer in Auckland vs Los Angeles, same renewal date → both warned, neither twice
- Email provider returns an error for customer #7 → customers #8..#5000 still get theirs
- Zero customers renewing → job succeeds quietly, does nothing

### What Part II adds to the mindset

FizzBuzz Phase 1 was: *read the rules, order them correctly, find the boundaries.*
Real-world Phase 1 is the same four moves, plus one:

> **Ask what is true about the environment the code lives in** — it runs repeatedly,
> it runs while things fail, it runs against data made by humans, and it has
> consequences outside the program.

The FizzBuzz `15` bug and the duplicate-email bug are *the same bug*: a case that the
prose mentioned late, or not at all, that must be checked first.

### Phase 1 exit criteria (real-world)
- You can name every entity and its boundary ("active" means exactly what?).
- Your rules are an ordered decision, with the "already done" case first.
- You have chosen, deliberately, which failure mode you prefer.
- You have a test list, and the first test is "run it twice".
- You have written down the questions only a human can answer — and asked them.

## Part II · Phase 2 — Blueprint
*(pending)*

## Part II · Phase 3 — Translation
*(pending)*

## Part II · Phase 4 — Debugging and Optimization
*(pending)*
