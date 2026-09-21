/**
 * Shared chrome for the legal pages.
 *
 * They carry their own header rather than the marketing nav. They used to use
 * EditorialShell, which was right while one Next app served both the site and
 * the lock surface; it is wrong now that the marketing site is its own
 * deployment, because every link in that nav — how it works, install, limits —
 * points at routes this deployment does not serve. A shell that renders four
 * dead links is worse than no shell.
 *
 * Deliberately plain: these are the notices an installed copy shows about
 * itself, reachable offline on a machine with no marketing site in front of it.
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
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border px-4 py-3">
        <p className="text-[13px] font-semibold tracking-tight">CodeLock</p>
      </header>

      {/*
        Utilities rather than the `.legal-main` class these pages used to wear.
        That rule is scoped under `.marketing-site` in the marketing app's own
        stylesheet, so it no longer reaches here at all — the pages would have
        rendered unstyled, and nothing in a typecheck would have said so. The
        unscoped `.legal` and `.display` rules in the shared tokens still apply.
      */}
      <main id="main" className="mx-auto w-full max-w-[900px] px-5 pb-24 pt-12">
        <h1 className="display text-4xl">{title}</h1>
        <p className="mt-1 text-[13px] text-faint">Last updated {updated}</p>
        <div className="legal mt-7">{children}</div>
      </main>
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
