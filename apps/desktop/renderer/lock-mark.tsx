/**
 * The same padlock the web app draws, transcribed for the desktop bundle.
 *
 * Kept in sync by hand, like the theme tokens beside it: sharing one component
 * would mean pulling the Next.js build into the Electron bundle to render twenty
 * lines of SVG. The geometry is identical to
 * apps/web/src/components/ui/lock-mark.tsx — change one, change the other.
 *
 * Green because the accent is the brand and the success colour at once: the mark
 * is the thing the user is working to make appear.
 */
export function LockMark({ size = 19 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="none"
      width={size}
      height={size}
      strokeLinecap="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" stroke="var(--accent)" strokeWidth="1.6" />
      <rect
        x="3.5"
        y="8.5"
        width="13"
        height="8.5"
        rx="2"
        stroke="var(--accent)"
        strokeWidth="1.6"
      />
      <circle cx="10" cy="12.75" r="1.15" fill="var(--accent)" />
    </svg>
  );
}
