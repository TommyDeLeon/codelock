'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Menu, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/settings', label: 'Connections' },
] as const;

export function AppHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const signOut = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [logout, router]);

  // A route change must close the menu, or navigating from inside it leaves the
  // panel covering the page you just asked for.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
        {/* The logo is the conventional way home; it was previously an inert span. */}
        <Link
          href="/dashboard"
          aria-label="CodeLock home"
          className="flex items-center gap-2 rounded-sm py-2 hover:opacity-80"
        >
          <span className="flex size-7 items-center justify-center rounded-sm bg-fg text-bg">
            <Lock className="size-3.5" aria-hidden />
          </span>
          <span className="hidden text-sm font-semibold tracking-tight min-[400px]:inline">
            CodeLock
          </span>
        </Link>

        {/* Desktop navigation. Hidden below sm, where the menu takes over. */}
        <nav aria-label="Main" className="ml-2 hidden items-center gap-1 sm:flex">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {user && (
            <>
              <span className="hidden px-2 text-[13px] text-muted lg:inline">
                {user.displayName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="hidden min-h-11 sm:inline-flex"
                onClick={() => void signOut()}
              >
                Sign out
              </Button>
              <MobileMenu
                open={menuOpen}
                onOpenChange={setMenuOpen}
                displayName={user.displayName}
                onSignOut={signOut}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Mobile navigation.
 *
 * Implemented by hand rather than pulled in as a dependency, because the
 * behaviour that matters is small and specific: Escape closes it, focus is
 * trapped inside while open, focus returns to the trigger on close, and the
 * background is inert. Those are the parts people actually get wrong.
 */
function MobileMenu({
  open,
  onOpenChange,
  displayName,
  onSignOut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string;
  onSignOut: () => Promise<void>;
}) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Move focus in, so a keyboard user is not left behind the panel.
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;

      // Cycle within the panel: Tab off the last element wraps to the first,
      // Shift+Tab off the first wraps to the last.
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    // Stop the page behind from scrolling under the open panel.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="flex size-11 items-center justify-center rounded-sm text-muted hover:text-fg sm:hidden"
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-fg/20 sm:hidden"
            onClick={() => onOpenChange(false)}
            aria-hidden
          />
          <div
            id={panelId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-x-0 top-14 z-50 border-b border-border bg-surface p-3 shadow-raised sm:hidden"
          >
            <nav aria-label="Main" className="flex flex-col">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-11 items-center rounded-sm px-3 text-sm hover:bg-surface-2"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <span className="px-3 text-[13px] text-muted">{displayName}</span>
              <Button variant="ghost" size="sm" className="min-h-11" onClick={() => void onSignOut()}>
                Sign out
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      // aria-current is what tells a screen reader which page you are on;
      // the colour change alone conveys nothing.
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-11 items-center rounded-sm px-2.5 text-[13px] transition-colors',
        active ? 'bg-surface-2 font-medium text-fg' : 'text-muted hover:text-fg',
      )}
    >
      {children}
    </Link>
  );
}

