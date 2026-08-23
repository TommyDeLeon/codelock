import Link from 'next/link';
import { LockMark } from '@/components/ui/lock-mark';
import { SiteFooter } from '@/components/site-footer';

/**
 * Shared chrome for the legal pages.
 *
 * These are the only routes reachable while signed out apart from login, so
 * they carry their own minimal header rather than AppHeader, which assumes an
 * authenticated user.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Link
            href="/"
            aria-label="CodeLock home"
            className="flex items-center gap-2 py-2 hover:opacity-80"
          >
            <LockMark className="size-[19px] shrink-0" />
            <span className="text-sm font-semibold tracking-tight">CodeLock</span>
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-[13px] text-faint">Last updated {updated}</p>
        <div className="legal mt-7">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="mb-2 text-sm font-semibold tracking-tight">{heading}</h2>
      <div className="space-y-2.5 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}
