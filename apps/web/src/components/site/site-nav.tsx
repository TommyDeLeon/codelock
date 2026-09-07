"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LockMark } from '@/components/ui/lock-mark';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const LINKS = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/limits', label: 'Limits' },
  { href: '/support', label: 'Support' },
  { href: '/demo', label: 'Demo' },
];

/** One navigation row; the mobile menu is an inline disclosure, not a modal. */
export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  return (
    <header className="marketing-nav" onKeyDown={(event) => {
      if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); }
    }}>
      <div className="site-frame nav-row">
        <Link href="/" className="brand"><LockMark className="size-6" />CodeLock</Link>
        <nav className="desktop-links" aria-label="Main">
          {LINKS.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>{link.label}</Link>)}
        </nav>
        <div className="desktop-theme"><ThemeToggle /></div>
        <Link href="/install" className="site-button nav-install" aria-current={pathname === '/install' ? 'page' : undefined}>Install</Link>
        <button ref={toggle} className="menu-toggle" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
      </div>
      {open && <nav id="site-menu" className="mobile-links site-frame" aria-label="Mobile navigation">
        {LINKS.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined} onClick={() => setOpen(false)}>{link.label}</Link>)}
        <div className="mobile-theme"><span>Appearance</span><ThemeToggle /></div>
      </nav>}
    </header>
  );
}
