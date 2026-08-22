# CodeLock — design prompts

Copy-paste prompts for a UI generator (Stitch, v0, Lovable, Figma AI) or for a
human designer. Structured with the `enhance-prompt` pipeline: design system
first, then one numbered structure per screen.

**Use it like this:** paste §1 unchanged at the top of every screen prompt, then
append the one screen you want. The system block is what stops eight screens
looking like eight different products.

---

## 1. Design system — prepend to every prompt

```
DESIGN SYSTEM (REQUIRED — do not substitute):

Platform: Responsive web. Design desktop-first at 1280px, then define the 768px
and 375px behaviour explicitly. Every screen must be usable at 320px.

Theme: Dual light and dark, both first-class. Warm and editorial rather than
cold and corporate. Technical, calm, confident — a well-set technical
publication, not a SaaS landing page.

COLOR
- Background (light): Warm Paper #fbfaf8 · (dark) Near Black #0e0e0d
- Surface (light): White #ffffff · (dark) Charcoal #171716
- Surface raised (light): Bone #f4f2ee · (dark) #1f1f1d
- Hairline rule (light): #ded9d0 · (dark) #302f2b
- Text primary (light): Ink #171614 · (dark) #f2f0ec
- Text secondary (light): #6b6862 · (dark) #9a968e
- Text faint (light): #98948c · (dark) #706c65
- ACCENT — Terracotta #b3441b light / #e2653a dark.
  RESERVED MEANING: this colour means "locked". Never use it for ordinary
  emphasis, links or decoration. Seeing it must tell the user something.
- Success (passed / within budget): #2f6f4e light, #56b283 dark
- Warning: #8a6410 light, #d5a03f dark
- Danger (wrong answer): #a12d20 light, #e0685a dark

NO gradients. NO purple. NO glassmorphism. NO decorative blobs.

TYPOGRAPHY
- Display / headings: Instrument Serif, weight 400. Tighten tracking as size
  grows (-0.028em at hero scale). Use the italic for one emphasised clause per
  heading — that italic is the brand's single expressive gesture.
- Interface / body: Inter.
- Numbers, runtimes, code, labels: JetBrains Mono. Every millisecond figure,
  every gate value, every case label is mono. The numbers are this product's
  evidence and must look like measurements.
- Section eyebrows: mono, 11px, uppercase, 0.14em tracking, faint colour.
- Body measure never exceeds 66 characters.

STRUCTURE
- Hairline rules, not stacked cards. A page of rounded boxes is exactly the look
  being avoided. Separation comes from 1px rules and whitespace.
- NEVER nest a card inside a card.
- Varied corner radii by element weight: 3px chips, 5px inputs, 8px buttons,
  12px large containers. Do not round everything to the same value.
- Asymmetric editorial grids (12-column, 5/7 or 4/8 splits) rather than centred
  hero-plus-three-cards layouts.
- Generous vertical rhythm on marketing pages; dense and scannable on app
  screens. Those are different jobs and should not look alike.

MOTION
- Sparing and functional. Transitions clarify a state change; nothing is
  decorative. Respect prefers-reduced-motion.

ACCESSIBILITY (non-negotiable — this is a lock screen)
- Visible keyboard focus everywhere. A user who cannot see focus on a lock
  screen cannot escape it.
- WCAG AA contrast in both themes.
- Touch targets minimum 44px on mobile; inputs at least 16px so iOS does not
  zoom the viewport on focus.
- Countdowns announce per minute, not per second.
```

---

## 2. The lock screen — design this first

The product's centre of gravity, seen at the user's least patient moment. Every
other screen can be merely adequate; this one cannot.

```
A full-screen coding workspace that has taken over the user's device at the
moment a focus timer expired. Dense, calm and scannable — the user is mildly
annoyed and needs to act immediately with no navigation available.

Page Structure:
1. Two-pane split, roughly 26rem left pane and a flexible right pane, divided by
   a single hairline rule. No card borders, no drop shadows.
2. LEFT — Problem panel: difficulty chip (mono, small, coloured by tier),
   problem title in display serif, the problem statement in comfortable body
   type, then sample input/output pairs in mono blocks.
3. RIGHT TOP — Code editor filling the available height. Minimal chrome: the
   language selector is plain text with a caret, not a heavy dropdown.
4. RIGHT MIDDLE — Action bar: one line of faint helper text on the left ("Two
   visible cases, one hidden case of 30,000 values"), primary Submit button
   right-aligned. The button shows an inline spinner while grading and its width
   must not change when it does.
5. RIGHT BOTTOM — Verdict area. See the four states below.
6. PERSISTENT FOOTER PILL — centred, low contrast, always visible:
   "Stuck? Hold Esc for 10 seconds to abandon. It counts as a failed session."
   While Esc is held it turns danger-coloured with a filling progress bar and a
   live countdown. Never hide this. A lock screen with no visible exit is what
   makes people uninstall software at 2am.

THE FOUR VERDICT STATES — design all four. They must be distinguishable at a
glance, before any text is read:

  a) GRADING — per-case rows with pulsing placeholders, resolving one at a time.
     Takes 5-30 seconds. Do not use a bare indeterminate spinner; show which
     cases have already returned.

  b) WRONG ANSWER — danger colour. Per-case pass/fail marks with the failing
     case named. Compiler or stderr output in a truncated mono block.

  c) CORRECT BUT TOO SLOW — the hardest and most important state in the entire
     product. Every test case shows PASS in success colour, and the screen still
     says locked in the accent colour. Show a horizontal meter: a success-tinted
     budget region, a labelled "gate" threshold line, and the user's runtime bar
     overshooting it in accent. Beneath it, in mono:
     "412 ms against a 189 ms budget. Correct, but roughly 2.2x slower than the
     best known solution. Look for a better algorithm."
     This must read as FAIR AND ACTIONABLE, never arbitrary or punitive. The
     user should immediately understand it is a complexity problem rather than
     bad luck or a micro-optimisation puzzle.

  d) ACCEPTED — success colour, restrained. A brief confirmation and a single
     Continue button. NO confetti, NO celebration animation, NO sound. The
     reward is getting the machine back.

Also design SERVER UNREACHABLE: the lock stays on and says "Cannot reach
CodeLock. Staying locked until it answers — retrying," with a retry affordance.
This must read as deliberate, not as a crash.
```

---

## 3. Dashboard

```
A quiet, scannable home screen for a focus tool opened several times a day.
Dense rather than airy. The timer is what most visits are for and must lead.

Page Structure:
1. Slim app header: wordmark, two nav items, theme toggle, account menu.
2. Greeting line in display serif with one faint sentence beneath it.
3. TIMER PANEL, spanning two-thirds and leading the page. Three states, all
   designed:
   - Idle: "No active session", a row of duration chips (15 / 30 / 60 / 90
     minutes), and a line explaining that double-clicking sets the default.
   - Armed: a very large mono countdown with tabular figures so digits do not
     jitter, a thin horizontal progress rule, and the wall-clock time it fires.
     Turns accent-coloured in the final minute.
   - Fired: accent-bordered, "Time is up", one button into the lock screen.
4. PROGRESS PANEL, right column, full height: current difficulty tier and the
   ladder rule stated in words — "2 of 3 fast solves to Medium" — with a small
   segmented indicator. Never show an opaque score. The user must always be able
   to tell what happens next.
5. THREE STAT TILES: problems solved, locks cleared, median unlock time. Large
   mono figures with a faint one-line explanation beneath each. Plain — no
   sparklines, no percentage-change badges.
6. SESSION HISTORY: a rules-separated list, newest first. Each row carries date,
   problem title, an outcome chip (solved / too slow / abandoned) and the
   runtime in mono.

Also design: loading skeletons, an empty history state for a new account, and a
full-width error state for an unreachable server.
```

---

## 4. Landing page

```
A landing page aimed at developers who distrust productivity software. It must
read as an argument rather than a brochure: the mechanism stated plainly, and
the product's limits admitted before the visitor discovers them.

Page Structure:
1. Sticky slim navigation: wordmark with a small drawn mark (two horizontal
   rules and one accent rule — a bar to get under, not a padlock icon), four
   text links, one Download button.
2. HERO — asymmetric 6/6 split, NOT centred. Left: mono eyebrow, a three-line
   display-serif headline whose final clause is italic ("Your device stays
   locked until the code is / correct and fast."), one short paragraph, two
   buttons. Right: a live speed-gate meter (see §2c) cycling through
   O(n^2) -> O(n log n) -> O(n) with real measured numbers, pausing on hover,
   with manual dot controls. This component is the page's memorable idea — the
   entire product thesis rendered as an instrument rather than described. A
   faint dot-grid sits behind the hero only, masked so it fades out.
3. THREE IDEAS — one row divided by vertical hairline rules, NOT three cards.
   Numbered mono eyebrows (01 / 02 / 03), serif sub-headings, two short
   paragraphs each.
4. LIMITS — 5/7 split on a subtly tinted background. Left: serif heading "It is
   a commitment device, not a parental control", a short paragraph, a link.
   Right: a definition list, one row per platform, each stating what it enforces
   and then — in accent colour — how it can be defeated. Admitting this is the
   trust-building move; do not soften it.
5. CLOSING — heading, one paragraph, one button. No newsletter capture, no
   testimonials, no logo wall, no pricing table.
```

---

## 5. Interactive demo

```
A no-account sandbox that runs the visitor's real code and returns a real
verdict, while making unmistakably clear that nothing is locked.

Page Structure:
1. PERSISTENT NON-DISMISSIBLE BANNER directly beneath the nav, warning-tinted,
   present in every phase: "Demo — your code really runs in the sandbox and the
   verdict is real. Nothing is locked, and solving this cannot unlock anything,"
   with a right-aligned link to Install. It must never be closable.
2. PHASE ONE — Intro: 7/5 split. Left: serif headline, two paragraphs, an "Arm
   the timer" button. Right: a three-row definition list — runs your code /
   times it honestly / unlocks nothing.
3. PHASE TWO — Countdown: centred, very large mono numerals, one calm sentence,
   a "Skip the wait" button. Eight seconds.
4. PHASE THREE — the lock screen from §2, embedded in the page rather than
   full-screen, banner still above it.
5. ON SUCCESS — a success-tinted panel that is careful with its wording: "That
   would have unlocked a real session. Here it unlocks nothing — this is a
   browser tab, and a tab you can close was never a lock," plus an Install
   button. Do not render a triumphant "Unlocked" state; it would be a lie.
```

---

## 6. Settings

```
A quiet configuration screen. Three independent panels separated by rules, each
self-contained and each showing its own connected or disconnected state.

Page Structure:
1. Page heading in display serif with one faint sentence.
2. GITHUB PANEL: a connect button when disconnected; when connected, the
   account, a repository selector, a branch field, a recent-sync list with
   per-item status, and a disconnect action styled as a quiet text button rather
   than a red block. Copy notes that accepted solutions are committed and that a
   failed push never blocks an unlock.
3. LEETCODE PANEL: username input and link button; when linked, a four-figure
   mono stat row and a refresh control. Include the stale state — "showing the
   last successful snapshot" — because the upstream endpoint is unofficial and
   breaks periodically.
4. SCHEDULE PANEL: seven day toggles as a horizontal segmented row, a from/to
   time range, and Weekdays / Every day presets.

Every panel needs loading, empty, connected and error states.
```

---

## 7. Mobile — 375px

Not an afterthought. Specify these explicitly or the generator will squash the
desktop layout.

```
- Lock screen: the two panes stack. The problem statement collapses to a header
  carrying the title and difficulty chip, expandable on tap. The editor takes
  the remaining viewport above a fixed action bar. The verdict opens as a bottom
  sheet over the editor rather than pushing it off screen.
- The hold-Escape footer pill becomes a persistent bar; on Android the
  equivalent recovery is documented text rather than a gesture.
- Dashboard: single column. Timer first, progress second, stats as a horizontal
  scroll row, history last.
- Landing: the hero stacks with the gate meter beneath the copy, still
  full-width. The three-idea row becomes three rule-separated blocks.
- Navigation collapses to a hamburger opening a full-height panel with 44px rows.
- Nothing may scroll horizontally at 320px.
```

---

## 8. What to avoid

Hard constraints. These are the difference between looking designed and looking
generated.

```
- No purple, no gradient meshes, no glassmorphism, no decorative blobs.
- No cards inside cards.
- No uniform 16px border-radius on everything.
- No centred hero with three feature cards beneath it.
- No stock photography, no 3D illustrations, no abstract atmospheric imagery.
- No emoji used as iconography.
- No confetti or celebration animation anywhere — this is a discipline tool.
- No streak-guilt copy and no dark patterns that keep the user locked.
- No fabricated testimonials, no logo wall, no "trusted by" strip.
- Do not describe a feature in the UI when the control already says it.
```

---

## Voice

Dry, plain, technically literate. The product's trust proposition is that it
admits what it cannot do — there is an entire page listing every way to defeat
it. Marketing language anywhere contradicts the thing being sold.

Write like a good README, not like a landing page.

---

For consistency across many generated screens, promote §1 into a `DESIGN.md` at
the repository root using the `design-md` skill and reference it, rather than
pasting it into every prompt.
