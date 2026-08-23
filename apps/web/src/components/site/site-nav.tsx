'use client';

import Link from 'next/link';
import { LockMark } from '@/components/ui/lock-mark';
import { AnnouncementBar } from '@/components/site/announcement-bar';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

/**
 * Navigation for the public site.
 *
 * This is the only navigation the web app has. It used to sit alongside an
 * AppHeader for the signed-in dashboard; that dashboard now lives in the
 * desktop and mobile shells, so this nav's job is simply to orient a stranger.
 *
 * Called by: src/app/(site)/layout.tsx
 */

const LINKS = [
  { href: '/demo', label: 'Demo' },
  { href: '/how-it-works', label: 'How it works' },
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
    <header className="sticky top-0 z-40">
      <AnnouncementBar />

      {/* Brand row: mark and wordmark left, utilities right — the storefront
          arrangement, minus a search field and a basket, because this product
          sells nothing and has nothing to search. */}
      <div className="rule-b bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-[17px] font-bold tracking-tight">
          <LockMark className="size-[22px] shrink-0" />
          CodeLock
        </Link>

        {/* Utilities only. The sections live in the category strip below, and
            listing them here as well would give a keyboard or screen-reader
            user the same eight links twice before reaching any content. */}
        <div className="ml-auto hidden items-center gap-4 sm:flex">
          <ThemeToggle />
          {/* A styled Link, not <Button asChild> — this Button is a plain
              <button> with no Slot support. */}
          <Link
            href="/install"
            className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-[13px]
                       font-semibold text-accent-fg transition-opacity hover:opacity-90"
          >
            Download
          </Link>
        </div>

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
      </div>

      {/* Category strip: the dark full-width row of sections directly under the
          brand row. Hidden on mobile, where the hamburger already carries it. */}
      <nav
        aria-label="Sections"
        className="hidden bg-fg text-bg sm:block"
      >
        <ul className="mx-auto flex max-w-6xl items-center gap-7 px-5 py-2.5 text-[12.5px] font-semibold sm:px-8">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={`transition-opacity hover:opacity-70 ${
                  pathname === link.href ? 'underline underline-offset-4' : ''
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="ml-auto">
            <Link href="/login" className="transition-opacity hover:opacity-70">
              Sign in
            </Link>
          </li>
        </ul>
      </nav>

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
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[13px] text-muted">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
