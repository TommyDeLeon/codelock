/**
 * The "leaves this place" arrow.
 *
 * This was U+2197 NORTH EAST ARROW, which carries Emoji_Presentation on iOS and
 * Android: the system swapped in the colour emoji font and the mark rendered as
 * a blue tile in the middle of the type. Drawing it means it inherits the text
 * colour and the type's weight on every platform.
 */
export function ArrowOut({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`arrow-out ${className}`}
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
      aria-hidden
      focusable="false"
    >
      <path d="M2.4 7.6 7.6 2.4" />
      <path d="M3.6 2.4h4v4" />
    </svg>
  );
}
