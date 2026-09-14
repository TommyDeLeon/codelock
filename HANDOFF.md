# Handoff — tutor hints and success moment (2026-09-15)

## What exists

### Hints

All hint logic lives in `apps/api/src/services/tutor/`. It is rule-based and
needs no AI connection.

- **`diagnose.ts`** reads the current code and the real results on sample
  cases, and labels each finding confirmed, likely or possible.
- **`ladder.ts`** builds five levels: question, trace, concept, outline with
  one gap, worked solution. It also handles "didn't help", "explain word",
  "step by step", "smaller example" and "different explanation".
- **`starter.ts`** holds reviewed content and reference tracers for 6 starter
  problems. Every tracer is tested against every test case.
- **`POST /v1/tutor/hint`** runs the current code on sample cases only. It
  re-runs a hidden failure against the current code, and records the hint
  (awaited) before responding.
- **`POST /v1/tutor/feedback`** stores optional feedback.

### Success moment

- **`successMoment.ts` and `accomplishment.ts`** work out what the solve
  showed. They run after the unlock and never delay it.
- The result is saved as an `ACCOMPLISHMENT` event and read from
  `GET /v1/progress/accomplishment/:id`.

### Project

- **`projects.ts`** defines the Game Night Scoreboard. It is built from four
  problems: sum-of-array, largest-number, count-greater-than and
  index-of-target.
- **`POST /v1/progress/project/run`** runs the learner's own accepted code.

### Web

- `hints-panel.tsx` rewritten; `success-moment.tsx` added.
- New pages: `/progress` and `/practice/[slug]`.

### Recording fixes

- Practice help and a recently opened debrief now count as help.
- The legacy lock hint is recorded awaited.
- A solve after hints no longer counts as mastery.
- A level-5 worked solution now counts as seeing the editorial.

### Database

Migration `20260915090000_tutor_feedback` adds `ACCOMPLISHMENT` and `FEEDBACK`.

## Providers

- **Claude (Opus 5):** coordinated and implemented.
- **OpenAI Codex** (`gpt-5.6-sol`, medium, read-only):
  - Inspected the runner and learning logic before implementation.
  - Reviewed the implementation afterwards and raised 7 actionable findings.
    All 7 are fixed.
- **Gemini** (`gemini-3.1-pro-low` via `agy`, plan mode):
  - Critiqued the baseline hints, then the real generated hints and the success
    copy.
  - Its jargon and pressure fixes were adopted.
  - One suggestion was rejected: "NEW FEATURE UNLOCKED", as gamified.

## Verify

Unit tests, including the real-judge evaluation set:

```bash
npm test -w @codelock/api
```

Typecheck the API:

```bash
npm run typecheck -w @codelock/api
```

Typecheck the web app:

```bash
npm run typecheck -w @codelock/web
```

Re-record the real judge runs (needs the Docker stack up):

```bash
npm run record:hint-fixtures -w @codelock/api
```

Print real hint ladders for review:

```bash
npm run hints:samples -w @codelock/api -- samples.md
```

## Open limitations

- **Desktop shell:** it drops the overlay straight to its bundled dashboard, so
  the success screen only appears in the browser flow. Progress is still saved
  and shown at `/progress`.
- **Understanding:** nobody has measured whether beginners actually understand
  the hints.
- **Coverage:** reviewed starter content exists for 6 problems only. The rest
  get rule-based hints.
- **Traces:** they come from a checked reference solution, not a step trace of
  the learner's own code.
- **Languages:** the evaluation uses Python, JavaScript and Java only.
- **Legacy route:** `/lock/:id/hint` still exists but the web app no longer
  uses it.
