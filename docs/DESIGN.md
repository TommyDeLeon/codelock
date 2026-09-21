# CodeLock design system

Ink on paper, with colour held in reserve.

This document exists because the last attempt at recording these decisions was
a set of careful comments inside `tokens.css`, and the comments lost. That file
argued at length for a pine-green brand while the marketing site and the
desktop dashboard had both moved to brick red without telling it, and the dark
lock screen used a peach nothing else in the product used. Four palettes, one
of them insisting it was the only one.

So: the rules are here, the values are in one file, and
[`scripts/check-palette.mjs`](../scripts/check-palette.mjs) fails CI if any
stylesheet declares a colour of its own.

---

## The rule

**Colour is rare.** The page is cream, the type is near-black, and most screens
show no saturated colour at all. That restraint is the design, not the absence
of one.

Three colours, three jobs, no overlap:

| Colour | Means | Where it appears |
|---|---|---|
| **Bronze** `--cl-accent` | the brand | the single thing on a screen that most wants attention |
| **Pine** `--cl-success` | you cleared it | the moment a lock opens, and essentially nowhere else |
| **Red** `--cl-danger` | this failed | failures only; never borrowed |

If two things on a screen are bronze, one of them is wrong.

Two consequences that look like restrictions and are actually the point:

- **Primary buttons take ink, not bronze.** A page with three primary buttons
  would spend the reserved colour three times. Ink is the strongest thing on
  cream anyway.
- **Difficulty badges carry no colour.** They were green for EASY and red for
  HARD, which spent two of the three reserved colours on a label seen on every
  screen — and told a beginner in red that the problem ahead was dangerous.
  They are typographic now: the same mark, getting darker.

## Where the values live

[`packages/ui/src/palette.css`](../packages/ui/src/palette.css), and nowhere
else. It is plain CSS on purpose: the web apps read colour through Tailwind's
`@theme`, but the Electron renderer is a Vite app with no Tailwind at all, and
`@theme` is a directive it would silently ignore. A palette that only one of
the two can read is exactly how this project ended up with four.

Everything else refers to it:

```css
--color-accent: var(--cl-accent);   /* packages/ui/src/tokens.css — the Tailwind theme */
--accent: var(--cl-accent);         /* apps/desktop/renderer/theme.css — an alias */
```

The palette answers to all three ways a theme gets selected — next-themes'
`.dark` class, the desktop's `data-theme` attribute, and the `system` media
query — with each dark value **authored exactly once**.

## Contrast

Every value is measured against the surface it actually sits on, at the
tightest case rather than the average one. Two were caught by measuring rather
than by eye:

- Bronze `#8a6a3b` read as the obvious brand colour and measured **4.38:1** on
  cream — below AA, the same failure `--color-faint` had already had to be
  fixed for once. `#7a5c30` is 5.42:1.
- The dark bronze `#a8874f` measured **4.30:1** against `--cl-surface-2`, so it
  failed on exactly the raised panels it sits on. `#bb9a62` is 4.95:1 there.

Nothing goes in the palette without a ratio.

## Type

Three registers, and they do not overlap:

| Family | Role |
|---|---|
| **Literata** (`--font-display`) | headings, and anything read rather than scanned |
| **Source Sans 3** (`--font-sans`) | interface text |
| **IBM Plex Mono** (`--font-mono`) | labels, measurements, code, anything with a number in it |

Two conventions carry most of the product's texture:

- **Eyebrows are mono**, uppercase, about 10.5px, letter-spaced `0.12–0.14em`.
  Section labels, field labels, units. They read as instrument markings.
- **Numbers are tabular.** Runtimes, budgets and counts change without the
  layout moving under them.

The lock screen is mono-forward: it is where someone reads a statement and
writes code under a clock, so the measuring parts lead.

## Surfaces

| Surface | Themes | Notes |
|---|---|---|
| Marketing site | light, dark, system — light by default | A first impression, so it opens in the theme it was designed in |
| Lock screen | follows the profile | Was hard-coded dark; see below |
| Desktop dashboard | follows the profile | Where the shared preference is written |

The theme lives on the profile (`TimerConfig.theme`), not in local storage. The
dashboard and the lock screen are different origins with different storage, so
a choice made in one used to be invisible to the other — the shell could be
light while the screen it opened was dark.

**The lock screen used to be dark unconditionally**, and the argument was good:
it is the one screen the user did not choose to open, it arrives full screen and
often at night, and in light mode that is a white rectangle taking over the
display. A takeover should not also be a flashbang. It now follows the
preference, because a theme control that quietly refuses on one surface makes
the setting untrustworthy everywhere. It still *starts* dark for the moment
before the profile answers: guessing dark and correcting to light is a screen
getting brighter, while guessing the other way is the flashbang, delivered to
someone who asked not to have one.

## Adding to this

1. Need a colour? Use one that already exists. The palette is small on purpose.
2. Genuinely need a new one? Add it to `palette.css`, with its measured ratio in
   a comment, and a sentence on what it *means* — not on where you used it.
3. Never declare a colour in a component or an app stylesheet. CI will catch it,
   but the reason is not the check: it is that the next person will copy
   whatever they find nearby.
