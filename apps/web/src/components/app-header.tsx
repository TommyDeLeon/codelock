'use client';

import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-store';

export function AppHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <span className="flex size-7 items-center justify-center rounded-sm bg-fg text-bg">
          <Lock className="size-3.5" aria-hidden />
        </span>
        <span className="hidden text-sm font-semibold tracking-tight min-[400px]:inline">CodeLock</span>

        <nav aria-label="Main" className="flex min-w-0 items-center gap-0.5 sm:ml-2 sm:gap-1">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/settings">Connections</NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {user && (
            <>
              <span className="hidden px-2 text-[13px] text-muted sm:inline">
                {user.displayName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await logout();
                  router.replace('/login');
                }}
              >
                Sign out
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
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
      className={`shrink-0 rounded-sm px-2 py-1.5 text-[13px] transition-colors sm:px-2.5 ${
        active ? 'bg-surface-2 font-medium text-fg' : 'text-muted hover:text-fg'
      }`}
    >
      {children}
    </Link>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The server cannot know the resolved theme, so rendering the icon before
  // mount guarantees a hydration mismatch.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      // The label depends on the resolved theme, which the server cannot know.
      // Gating it on `mounted` alongside the icon keeps the markup identical on
      // both sides — otherwise React logs a hydration mismatch on every load.
      aria-label={
        mounted ? (isDark ? 'Switch to light theme' : 'Switch to dark theme') : 'Toggle theme'
      }
    >
      {mounted ? (
        isDark ? (
          <Sun aria-hidden />
        ) : (
          <Moon aria-hidden />
        )
      ) : (
        <span className="size-4" />
      )}
    </Button>
  );
}
