import Link from 'next/link';

/**
 * The contact address is configuration, not content.
 *
 * Hard-coding a personal address into a public page is the owner's decision to
 * make, so the contact line only renders once this is set. Nothing here invents
 * a plausible-looking address to fill the gap.
 */
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-5 text-[13px] text-muted sm:flex-row sm:items-center">
        {/* Computed per render: a hard-coded year is wrong every January. */}
        <p>© {new Date().getFullYear()} CodeLock</p>

        <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:ml-auto">
          <Link href="/privacy" className="hover:text-fg">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-fg">
            Terms
          </Link>
          {CONTACT_EMAIL && (
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-fg">
              Contact
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
