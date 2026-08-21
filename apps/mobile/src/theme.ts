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
    border: '#e4e1da',
    fg: '#171614',
    muted: '#6b6862',
    faint: '#98948c',
    accent: '#b3441b',
    accentFg: '#ffffff',
    success: '#2f6f4e',
    danger: '#a12d20',
    warning: '#8a6410',
  },
  dark: {
    bg: '#0e0e0d',
    surface: '#171716',
    surface2: '#1f1f1d',
    border: '#2b2b28',
    fg: '#f2f0ec',
    muted: '#9a968e',
    faint: '#706c65',
    accent: '#e2653a',
    accentFg: '#17120f',
    success: '#56b283',
    danger: '#e0685a',
    warning: '#d5a03f',
  },
} as const;

export type ThemeColors = (typeof colors)['light'];

export const radius = { xs: 3, sm: 5, md: 8, lg: 12 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
