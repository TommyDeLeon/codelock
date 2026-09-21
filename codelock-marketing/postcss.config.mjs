// Tailwind v4 is a PostCSS plugin; there is no tailwind.config.js.
// Tokens live in packages/ui/src/tokens.css, imported by src/app/globals.css.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
