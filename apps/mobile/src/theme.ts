/**
 * The same tokens as the web app's `@theme` block, transcribed for React
 * Native. Kept in sync by hand — RN cannot consume CSS custom properties, and
 * a build step to generate them would be more machinery than four colours
 * justify.
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

export const radius = { xs: 3, sm: 5, md: 8, lg: 12 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
