/**
 * The same tokens as the web app's `@theme` block, transcribed for React
 * Native. Kept in sync by hand — RN cannot consume CSS custom properties, and
 * a build step to generate them would be more machinery than a dozen colours
 * justify.
 *
 * Follows the web app's retail direction: a green promotional band, softer
 * corners, bold display type. Pine green remains the brand.
 */
export const colors = {
  light: {
    bg: '#fbfaf8',
    surface: '#ffffff',
    surface2: '#f4f2ee',
    border: '#ded9d0',
    fg: '#171614',
    muted: '#6b6862',
    faint: '#98948c',
    accent: '#1b6b4a',
    accentFg: '#ffffff',
    accentSoft: '#e4efe9',
    // The promotional band: a deeper pine so white on it clears AA comfortably.
    promo: '#14523a',
    promoFg: '#ffffff',
    // The same green as the accent, deliberately. One green, one meaning.
    success: '#1b6b4a',
    danger: '#a12d20',
    warning: '#8a6410',
  },
  dark: {
    bg: '#0e0e0d',
    surface: '#171716',
    surface2: '#1f1f1d',
    border: '#302f2b',
    fg: '#f2f0ec',
    muted: '#9a968e',
    faint: '#706c65',
    accent: '#4ed18f',
    accentFg: '#0d1a13',
    accentSoft: '#10241b',
    promo: '#12503a',
    promoFg: '#eafff4',
    success: '#4ed18f',
    danger: '#e0685a',
    warning: '#d5a03f',
  },
} as const;

/**
 * Widened to plain strings deliberately. The `as const` above gives every hex a
 * literal type, which makes the light and dark objects mutually unassignable
 * and stops a resolved theme from being passed to a component as a prop.
 */
export type ThemeColors = { [K in keyof (typeof colors)['light']]: string };

/** Matching the web app: varied by element weight, not one value everywhere. */
export const radius = { xs: 4, sm: 8, md: 12, lg: 20 } as const;

/**
 * xxxl exists for the cinematic direction: the marketing surfaces on the web
 * doubled their vertical breathing room, and a phone that keeps the old
 * spacing beside the new type scale reads as cramped rather than as calm.
 */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/**
 * One type scale, shared.
 *
 * Sizes were previously written inline per screen — 24 for the sign-in title,
 * 20 for the progress heading, 15 and 14 and 13.5 for body copy scattered
 * across three files. That is not a hierarchy, it is three separate guesses,
 * and it is why the phone screens do not read as the same product as the web.
 *
 * display is the mobile counterpart of the web's .display-hero, and it is
 * deliberately not the web number. The web hero has a 1280px column to fill;
 * this has 390. It matches the LOWER bound of the web clamp — the size that
 * face already resolves to on a phone — so the two platforms agree at the
 * width where they can actually be compared.
 */
export const type = {
  /** Marketing and entry surfaces only. Never on a tool screen. */
  display: { fontSize: 34, fontWeight: '700', letterSpacing: -0.9, lineHeight: 38 },
  heading: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, lineHeight: 27 },
  subheading: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 13.5, lineHeight: 19 },
  /** Section labels. The web moved these off the mono for the same reason. */
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.1 },
  /** Figures only: runtimes, gates, countdowns. These are the evidence. */
  figure: { fontSize: 48, fontWeight: '600', letterSpacing: -1, fontVariant: ['tabular-nums'] },
} as const;
