# CodeLock — design

The design system, then one section per screen. §1 is the system every screen
inherits; it is what stops eight screens looking like eight different products.
Read it first, then the section for the screen you are working on.

---

## 1. Design system

DESIGN SYSTEM (REQUIRED — do not substitute):

Platform: Responsive web. Design desktop-first at 1280px, then define the 768px
and 375px behaviour explicitly. Every screen must be usable at 320px.

Theme: Dual light and dark, both first-class. Consumer-retail structure, in the
family of a large storefront: a promotional band pinned above the brand row on
every page, a dark category strip beneath it, bright surfaces, illustrated hero
bands and friendly rounded blocks.

The palette is unchanged — pine green is still the brand. What changed is that
colour is now decorative as well as functional, rather than being held in
reserve for a passing verdict.

It is also a GAME, and the game may now be rendered playfully: illustrated
challenge cards, badges and characters are permitted. See THE GAME LAYER below
for the rule that still holds — the numbers themselves must stay real.

COLOR
- Background (light): Warm Paper #fbfaf8 · (dark) Near Black #0e0e0d
- Surface (light): White #ffffff · (dark) Charcoal #171716
- Surface raised (light): Bone #f4f2ee · (dark) #1f1f1d
- Hairline rule (light): #ded9d0 · (dark) #302f2b
- Text primary (light): Ink #171614 · (dark) #f2f0ec
- Text secondary (light): #6b6862 · (dark) #9a968e
- Text faint (light): #98948c · (dark) #706c65
- ACCENT — Pine #1b6b4a light / Spring #4ed18f dark.
  Accent foreground: #ffffff light, #0d1a13 dark.
  Soft tint: #e4efe9 light, #10241b dark.
  This is the BRAND colour and it also means "you cleared it". Use it for the
  mark, primary buttons, links, focus rings, a passing verdict, and decorative
  illustration accents.
- PROMO band — #14523a light / #12503a dark, white text, full bleed, pinned
  above the brand row on every page. A deeper pine than the accent so white
  clears AA on it comfortably and it reads as a band rather than a button.
- Success (passed / within budget): the SAME green, #1b6b4a / #4ed18f.
  One green, one meaning. Two greens a shade apart measure 1.08:1 against each
  other — indistinguishable — so do not introduce a second one.
- Warning (a caveat — "this escape defeats it"): #8a6410 light, #d5a03f dark.
  Rare. Documentation pages only, never on the lock screen.
- Danger (wrong answer): #a12d20 light, #e0685a dark

- The locked state may use colour. The earlier rule that "locked has no hue"
  is withdrawn along with the monochrome system it belonged to; use the danger
  and warning tokens where they read most clearly.

Gradients, illustration and decorative shapes are permitted. Keep purple out —
the brand is green. Keep glassmorphism out — it fails contrast on bright
surfaces.

TYPOGRAPHY
- Display / headings: the sans stack at bold weight, tight tracking. A heavy
  grotesque rather than a serif, matching the storefront register.
- Interface / body: Inter.
- Numbers, runtimes, code, labels: JetBrains Mono. Every millisecond figure,
  every gate value, every case label is mono. The numbers are this product's
  evidence and must look like measurements.
- Section eyebrows: mono, 11px, uppercase, 0.14em tracking, faint colour.
- Body measure never exceeds 66 characters.

STRUCTURE
- Illustrated blocks and cards carry the marketing pages, with hairline rules
  separating the long-form sections beneath them.
- Varied corner radii by element weight: 4px chips, 8px inputs, 12px buttons,
  20px large containers. Do not round everything to the same value.
- Asymmetric editorial grids (12-column, 5/7 or 4/8 splits) rather than centred
  hero-plus-three-cards layouts.
- Generous vertical rhythm on marketing pages; dense and scannable on app
  screens. Those are different jobs and should not look alike.

MOTION — two registers, and they must not be confused

- On TOOL surfaces — the lock screen, the desktop dashboard, the mobile
  Progress and Settings screens — motion is limited to state changes: a bar
  filling, a tier advancing, the record-break flash. Nothing ambient, nothing
  scroll-linked, nothing that costs a frame while the judge is grading. These
  are opened many times a day and cinema on a tool is friction.
- On MARKETING surfaces — everything under app/(site)/ plus the login
  backdrop — motion is cinematic: scroll-linked rather than decorative. See
  §4a.
- Respect prefers-reduced-motion on both. Note that the global rule in
  globals.css only collapses animation-duration, which does NOT stop a
  scroll-driven animation — those have no duration, and their progress comes
  from scroll position. Every scroll-linked effect needs its own explicit
  opt-out, and it must be verified in a browser rather than assumed.

ACCESSIBILITY (non-negotiable — this is a lock screen)
- Visible keyboard focus everywhere. A user who cannot see focus on a lock
  screen cannot escape it.
- WCAG AA contrast in both themes.
- Touch targets minimum 44px on mobile; inputs at least 16px so iOS does not
  zoom the viewport on focus.
- Countdowns announce per minute, not per second.

---

## 1b. THE GAME LAYER

The most important section in this document. CodeLock is a game about getting
faster, and the interface should make that legible — but every mechanic below
already exists in the data model. **Do not invent currency.** Points, coins,
gems and XP with no referent are what makes gamified products feel cheap, and
this product's entire proposition is that its numbers mean something.

THE FIVE REAL MECHANICS — render these, invent nothing else:

1. TIER (a real field: Easy / Medium / Hard)
   A three-segment horizontal ladder, current segment filled green, future
   segments hairline-outlined. Mono label. No stars, no gem icons.

2. STREAK (a real counter: consecutive fast solves, 3 promotes)
   Three pips. Filled pips green, empty ones hairline circles. Beside them, in
   mono: "2 / 3 fast solves to Medium". The rule is always stated in words next
   to the indicator — this product never shows a number you cannot interrogate.
   One slow solve empties it. State that plainly; do NOT dramatise the loss.

3. RANK (real: bestRuntimeMs, a global best per problem per language)
   A genuine leaderboard, and the best mechanic in the product. Show:
   "your 110ms · best known 89ms · you are 1.24x off the record".
   Rank PROBLEMS, never people. Nobody is ranked by volume or hours.

4. PERSONAL BEST (real: the user's own previous runtime on that problem)
   When a re-solve beats their own time, show the delta in green: "-38ms on
   your previous best". Small, precise, earned.

5. THE RECORD BREAK (real: beating bestRuntimeMs ratchets the gate for everyone)
   The ONE moment that deserves celebration — genuinely rare, and it makes the
   problem harder for every future solver. A brief restrained full-width flash
   and a mono line: "New best. The budget for this problem just moved to 160ms."
   No confetti. A precise, cold, impressive moment.

VISUAL LANGUAGE FOR THE GAME LAYER
- Progress may be drawn as bars, rings, pips or illustrated meters.
- Every number stays in JetBrains Mono with tabular figures. The figures are
  this product's evidence and must still look like measurements.
- Achievement chips, badges and medallions are all fine.

STILL FORBIDDEN (these break the product, not merely the aesthetic)
- No invented currency: no XP, coins, gems, hearts, or levels beyond the three
  real tiers. Illustrate the real mechanics as playfully as you like, but never
  add a number that refers to nothing — that is the one thing this product
  cannot do and still mean what it says.
- No loss-aversion pressure. This app can take a user's screen away; "don't
  lose your 12-day streak!" attached to a device lock is coercive rather than
  motivating. State streaks as facts, never as threats.
- No leaderboard ranking people by volume, hours or sessions — that rewards
  grinding, and this tool exists to get someone back to work, not into it.
- No daily-login rewards.

NOW PERMITTED (previously forbidden; changed with the retail direction)
- Mascots, characters and illustrated scenes.
- Badges, trophies and medallions for the real mechanics.
- Celebration on an ordinary solve.

---

## 2. The lock screen — design this first

The product's centre of gravity, seen at the user's least patient moment. Every
other screen can be merely adequate; this one cannot.

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
     product. Every test case shows PASS in green, and the screen still says
     locked — in DANGER RED. Show a horizontal meter: a green-tinted budget
     region, a labelled "gate" threshold line, and the user's runtime bar
     overshooting it in red. The green stops exactly where the budget ends and
     the red carries on past it: the picture is "you ran out of green".

     Two rules this state got wrong once and must not again:
     - The threshold line paints ON TOP of the runtime bar, never beneath it.
       Drawn underneath, it is hidden by the bar in exactly the case that
       matters — an overshooting run — leaving the reader with a coloured block
       and no visible budget edge.
     - The overshoot is red, not plain ink. Ink was specified when the system
       was monochrome; on the dark theme it resolves to near-white and reads as
       a neutral block rather than as a verdict. §1 withdrew the "locked has no
       hue" rule and this is the state it was withdrawn for.

     Beneath it, in mono:
     "412 ms against a 189 ms budget. Correct, but roughly 2.2x slower than the
     best known solution. Look for a better algorithm."
     This must read as FAIR AND ACTIONABLE, never arbitrary or punitive. The
     user should immediately understand it is a complexity problem rather than
     bad luck or a micro-optimisation puzzle.

  d) ACCEPTED — green, restrained. A brief confirmation, the run's readouts
     (runtime, ratio to the record, and a personal-best delta when there is one)
     and a single Continue button. NO confetti and NO sound on an ordinary
     solve — the reward is the colour arriving and the machine returning.
     Only a RECORD BREAK (game layer, mechanic 5) earns a moment of its own.

Also design SERVER UNREACHABLE: the lock stays on and says "Cannot reach
CodeLock. Staying locked until it answers — retrying," with a retry affordance.
This must read as deliberate, not as a crash.

---

## 3. Dashboard

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
4. PROGRESS PANEL, right column, full height. This is the game's home and
   should be the most satisfying block on the page:
   - The three-segment TIER ladder, current segment filled.
   - STREAK pips with the rule in words: "2 / 3 fast solves to Medium".
   - A compact RANK readout: the user's median ratio to the best known answer,
     as one mono figure with a thin bar.
   Never show an opaque score. The user must always be able to tell exactly what
   happens next and why.
5. THREE STAT TILES as structured modular blocks in the Linear register:
   problems solved, locks cleared, median unlock time. Large mono figures with a
   faint one-line explanation beneath each, and a thin trend rule only where a
   trend is real. Equal heights, hairline dividers, no card shadows. No
   sparklines as decoration, no percentage-change badges.
6. RUN LOG: a rules-separated list, newest first — read as a race history, not
   an audit table. Each row carries date, problem title, a small mono outcome
   chip (solved / too slow / abandoned), the runtime, and the ratio to the
   record. Rows that set a personal best carry a single green marker in the
   gutter. Dense, scannable, one line each.

Also design: loading skeletons, an empty history state for a new account, and a
full-width error state for an unreachable server.

---

## 4. Landing page

A landing page aimed at developers who distrust productivity software. It must
read as an argument rather than a brochure: the mechanism stated plainly, and
the product's limits admitted before the visitor discovers them.

Page Structure:
1. Sticky slim navigation: wordmark with a small drawn mark (two horizontal
   rules and one accent rule — a bar to get under, not a padlock icon), four
   text links, one Download button.
2. HERO — asymmetric 6/6 split, NOT centred, and the one place on the site
   that gets to be a statement. Left: mono eyebrow, the headline at
   `.display-hero` scale (clamp 2.5rem -> 5rem, well past the 3.4rem the rest
   of the type system offers) with its final clause in the brand green, one
   short paragraph, two buttons. Deep vertical space around all of it — the
   negative space is the point, not padding left over.
   Right: the live speed-gate meter (see §2c) cycling through
   O(n^2) -> O(n log n) -> O(n) with real measured numbers, pausing on hover,
   with manual dot controls. This component is the page's memorable idea and
   its single focal object — the entire product thesis rendered as an
   instrument rather than described. It is given depth rather than replaced by
   an invented hero graphic. A faint dot-grid sits behind the hero only, masked
   so it fades out.
### 4a. Cinematic technique, marketing surfaces only

The reference is an Apple product page read correctly: enormous type, deep
negative space, ONE focal object per section, and motion tied to scroll
position rather than sprinkled over the page. Restraint plus a few earned
moments — not 3D everywhere.

Where this conflicts with the retail-storefront register in §1, cinematic wins
on marketing surfaces and only there. The green brand and the promo band stay.

WEB AND DESKTOP (both Chromium, sharing this CSS)
- CSS scroll-driven animations (`animation-timeline: view()`) are the default.
  No JS scroll listeners: a scroll handler runs on the main thread on every
  scroll event, which is a frame each time.
- Above the fold gets a LOAD reveal, not a scroll one. A view() entry animation
  on a hero is already at 100% before first paint and does nothing. Scroll
  drives what happens as a section LEAVES.
- CSS 3D with `perspective` on the ancestor for depth. Animate transform and
  opacity ONLY — never width, height, top or left, which force layout per frame.
- Every scroll-driven rule sits inside `@supports (animation-timeline: view())`.
  Firefox and Safari do not support it, and applying the start state unguarded
  leaves the content invisible there.
- WebGL/Three.js only if a section genuinely cannot be done in CSS, justified in
  the commit message and lazy-loaded behind an IntersectionObserver.

MOBILE (React Native — cannot run the above at all)
- react-native-reanimated for scroll-linked transforms on the UI thread.
- expo-linear-gradient for depth. react-native-skia only if a specific effect
  needs it, and justified.
- Do not attempt WebGL parity. Match the DIRECTION — space, type scale, focal
  hierarchy — not the literal effects.

BUDGETS — gates, not aspirations. Measured, never estimated.
- Route JS for (site) pages grows by no more than 150 KB gzipped in total.
- LCP under 2.5s and CLS under 0.1 on a simulated mid-tier mobile device.
- Scroll holds 60fps on the landing page.
- No animation runs on any screen while a lock session is LOCKED.

ACCESSIBILITY — a completion gate, not a follow-up
- Every effect disabled or reduced to a fade under prefers-reduced-motion, and
  verified per effect rather than assumed to inherit the global rule.
- Text contrast stays WCAG AA against every new background, including
  mid-animation states.
- Focus outlines remain visible against new backgrounds.
- Nothing becomes keyboard-inaccessible because it moved.

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

### 4b. The code field — the ambient background

One ambient background, on marketing surfaces only: source code seen from too
far away to read. The ragged indent ladder of a file, drifting slowly upward in
two parallax layers at different scales and speeds.

The point is that it renders the SHAPE of code rather than characters. There is
no second alphabet on the page competing with the type, and no glyph is ever
legible enough to be read instead of the headline.

It is deliberately NOT falling glyphs. "Matrix rain" is the most templated
programming background there is, and §8 already rules out that kind of
decoration. It is also not a generic particle field or an atmospheric blob —
this is a product about source code and its running time, so the background is
source code, or it is nothing.

WHERE IT GOES
- Bounded to the HERO BAND of each `(site)` page, and to the login backdrop.
  Not the full page. One ambient idea, in the one section that is allowed to be
  a statement — a pattern running under the reading column is decoration
  competing with content, which is the thing §4a's "one focal object per
  section" exists to prevent.
- Bounding it is also what makes its pause real. A full-page fixed backdrop is
  always intersecting the viewport and could never pause on scroll.
- Never on /lock, the desktop dashboard, or the mobile Progress and Settings
  screens. §1 MOTION allows those state changes and nothing else.

HOW IT IS BUILT — `.code-field` in globals.css, mounted by
`components/site/code-field`
- CSS, not canvas. The effect is a uniform vertical translation of a repeating
  pattern, which is what the compositor does for free; a canvas would put the
  same two layers on the main thread behind a rAF loop, a resize path and a
  device-pixel-ratio path. Transform only — never width, height, top or left.
- The pattern is an SVG MASK over `background-color: var(--color-rule)`, so it
  follows the theme with no second asset and no JS.
- The component's only job is to stop it: an IntersectionObserver for "scrolled
  past" and `visibilitychange` for a hidden tab, both resolving to one attribute
  that the CSS turns into `animation-play-state: paused`. An animation ticking
  under a tab nobody is looking at is a bug, not a flourish.
- Absolutely positioned, `aria-hidden`, out of flow: it cannot move layout, so
  it cannot contribute to CLS.

CONTRAST — the binding constraint, measured rather than assumed
The bars paint in the hairline colour at a per-layer alpha of 0.07 (near) and
0.05 (far). The worst frame is a glyph sitting fully on a bar of BOTH layers at
once, an effective 0.116, which moves every text role by under 0.2:1:

| role  | light, no field | light, worst frame | dark, no field | dark, worst frame |
|-------|-----------------|--------------------|----------------|-------------------|
| fg    | 17.34:1         | 16.76:1            | 16.97:1        | 16.48:1           |
| prose | 14.25:1         | 13.78:1            | 13.20:1        | 12.82:1           |
| muted | 5.32:1          | 5.15:1             | 6.55:1         | 6.37:1            |
| faint | 4.33:1          | 4.19:1             | 3.70:1         | 3.59:1            |

Nothing crosses AA that was not already across it. Note the last row: **the
`--color-faint` token already fails AA on its own, before any background** —
4.33:1 light and 3.70:1 dark against a 4.5:1 bar. That is a pre-existing defect
in the token, not something the field introduced, and it is why the field's
alpha is held this low rather than at the 0.34 that `muted` alone would allow.
Fixing the token is a separate change; until it happens, no new background may
spend the headroom that is not there.

REDUCED MOTION
The field stays, the drift stops. The global rule at the top of globals.css sets
`animation-duration`, which for an INFINITE animation is not the same as
stopping it — at 0.01ms it would run the whole loop every frame, which is worse
than leaving it alone. It is switched off by name, and verified in a browser.

MEASURING THE BUDGET
`scripts/route-js-budget.mjs` gzips each route's client chunks off the build
output. Next 16 with Turbopack no longer prints a "First Load JS" column, so the
150 KB gate in §4a had nothing to be checked against. Run it after a build:

    node scripts/route-js-budget.mjs --baseline .perf/baseline-route-js.json


---

## 5. Interactive demo

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

---

## 6. Settings

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

---

## 7. Mobile — 375px

Not an afterthought. These are specified explicitly because the desktop layout
does not squash cleanly into a phone.

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

MOBILE TYPE SCALE — apps/mobile/src/theme.ts

React Native cannot read the web tokens, so the scale is transcribed there as
`type`. Use it; do not write a fontSize inline. The three screens each used to
guess their own, which is why they did not look like one product.

- `display` (34) is for ENTRY and marketing surfaces only — the sign-in
  screen, not the timer. It is the mobile counterpart of the web .display-hero
  and matches the lower bound of that clamp, which is what the web already
  resolves to at phone width.
- `figure` (48, tabular) is for runtimes, gates and countdowns. Those are the
  product evidence and are the one thing allowed to be large on a tool screen.
- Progress and Settings stay on `heading`/`body`/`small`. They are tools opened
  many times a day and get no display type and no cinematic motion — only
  state-change motion, as §1 MOTION requires.

---

## 8. What to avoid

Hard constraints. These are the difference between looking designed and looking
templated.

- No purple. The brand is green.
- No glassmorphism — it fails contrast on bright surfaces.
- No uniform border-radius on everything; vary it by element weight.
- No stock photography. Illustration yes, photography no.
- No emoji used as iconography.
- No invented currency: no XP, coins, gems or hearts.
- No streak-guilt copy and no dark patterns that keep the user locked.
- No fabricated testimonials, no logo wall, no "trusted by" strip, and no
  invented promotional offer. The product is free; a "30% off today only" band
  would be the retail aesthetic copied past the point where it means anything.
- Do not describe a feature in the UI when the control already says it.

---

## Voice

Dry, plain, technically literate. The product's trust proposition is that it
admits what it cannot do — there is an entire page listing every way to defeat
it. Marketing language anywhere contradicts the thing being sold.

Write like a good README, not like a landing page.

