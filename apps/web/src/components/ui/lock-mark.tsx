/**
 * The mark. One of them, everywhere.
 *
 * There used to be three: an abstract pair of rules on the marketing nav, and a
 * lucide padlock in an ink-filled square on the app header and the legal pages.
 * Three marks is not a brand, it is three products that happen to share a name.
 *
 * This is a padlock drawn to the design system's own rules — hairline stroke,
 * accent green, nothing filled behind it. Green because the accent is the brand
 * *and* the success colour: the mark is the thing the user is working to make
 * appear.
 *
 * Drawn rather than imported from an icon set so the stroke weight and the
 * shackle proportion stay legible at 16px, where lucide's padlock closes up.
 */
export function LockMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="none"
      className={className ?? 'size-5'}
      strokeLinecap="round"
    >
      {/* Shackle: an arc, open at the bottom, sitting on the body. */}
      <path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" className="stroke-accent" strokeWidth="1.6" />
      {/* Body. */}
      <rect
        x="3.5"
        y="8.5"
        width="13"
        height="8.5"
        rx="2"
        className="stroke-accent"
        strokeWidth="1.6"
      />
      {/* Keyhole, as a single dot — anything more disappears at 16px. */}
      <circle cx="10" cy="12.75" r="1.15" className="fill-accent" />
    </svg>
  );
}

/** The mark plus the name, which is how it appears in every header. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className ?? ''}`}>
      <LockMark className="size-[18px] shrink-0" />
      <span className="text-sm font-semibold tracking-tight">CodeLock</span>
    </span>
  );
}
