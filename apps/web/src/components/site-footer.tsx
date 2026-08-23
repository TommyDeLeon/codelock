import Link from 'next/link';

/**
 * The contact address is configuration, not content.
 *
 * Hard-coding a personal address into a public page is the owner's decision to
 * make, so the contact line only renders once this is set. Nothing here invents
 * a plausible-looking address to fill the gap.
 */
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '';

/**
 * Every link here is its own tap target, sized to 44px.
 *
 * As plain inline text these were about 18px tall — inside WCAG 2.2's 24px
 * minimum (2.5.8) let alone the 44px enhanced bar (2.5.5), and small enough on
 * a phone that "Privacy" and "Terms" sit within one thumb of each other. The
 * height comes from the link itself rather than from padding on the row, so the
 * target and the thing the user can see are the same rectangle. min-w matters
 * as much as min-h: "Terms" renders 38px wide, which fails 2.5.5 on the other
 * axis even once the height is right.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-2 text-[13px] text-muted sm:flex-row sm:items-center">
        {/* Computed per render: a hard-coded year is wrong every January. */}
        <p className="flex min-h-11 items-center">© {new Date().getFullYear()} CodeLock</p>

        <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 sm:ml-auto">
          <Link href="/support" className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-fg">
            Support
          </Link>
          <Link href="/privacy" className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-fg">
            Privacy
          </Link>
          <Link href="/terms" className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-fg">
            Terms
          </Link>
          {CONTACT_EMAIL && (
            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-11 min-w-11 items-center justify-center hover:text-fg">
              Contact
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
