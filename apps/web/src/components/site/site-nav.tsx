'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

/**
 * Navigation for the public site.
 *
 * Separate from AppHeader on purpose: that one belongs to a signed-in tool —
 * it reads the auth store, offers sign-out, and links to the dashboard — and is
 * built to get out of the way. This one has the opposite job, orienting a
 * stranger, and merging the two would force both to compromise.
 *
 * Called by: src/app/(site)/layout.tsx
 */

/**
 * Only routes that exist. /demo and /how-it-works are the next slice of the
 * re-scope; linking to them before they are built would ship a nav full of
 * 404s, which is worse than a short nav.
 */
const LINKS = [
  { href: '/limits', label: 'Limits' },
  { href: '/install', label: 'Install' },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Route changes must close the panel; otherwise tapping a link navigates
  // underneath a menu that is still covering the page.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="rule-b sticky top-0 z-40 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-baseline gap-2 text-[15px] font-semibold tracking-tight"
        >
          {/* A drawn mark rather than a padlock from an icon set. The product is
              about a bar you have to get under, so the mark is that bar: two
              rules and the accent one you have to cross. */}
          <span aria-hidden className="relative inline-block h-3 w-4">
            <span className="absolute inset-x-0 top-0 h-px bg-fg" />
            <span className="absolute inset-x-0 top-1.5 h-px bg-accent" />
            <span className="absolute bottom-0 left-0 h-1.5 w-px bg-fg" />
          </span>
          CodeLock
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-7 sm:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`text-[13.5px] transition-colors ${
                  active ? 'text-fg' : 'text-muted hover:text-fg'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {/* A styled Link, not <Button asChild> — this Button is a plain
              <button> with no Slot support. */}
          <Link
            href="/install"
            className="inline-flex h-8 items-center rounded-sm bg-fg px-3.5 text-[13px]
                       font-medium text-bg transition-colors hover:bg-fg/90"
          >
            Download
          </Link>
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="-mr-2 ml-auto grid size-11 place-items-center text-muted hover:text-fg sm:hidden"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      {open && (
        <div
          id="site-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="rule-t bg-bg px-5 pb-6 pt-2 sm:hidden"
        >
          <nav aria-label="Main" className="flex flex-col">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="rule-b py-3.5 text-[15px] text-fg">
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/install"
            className="mt-5 flex h-11 items-center justify-center rounded-md bg-fg
                       text-[15px] font-medium text-bg"
          >
            Download
          </Link>
        </div>
      )}
    </header>
  );
}
