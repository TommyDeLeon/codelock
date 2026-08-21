import Link from 'next/link';
import { Lock } from 'lucide-react';

export const metadata = {
  title: 'Page not found',
  description: 'That page does not exist.',
};

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
      <span className="flex size-9 items-center justify-center rounded-sm bg-fg text-bg">
        <Lock className="size-4" aria-hidden />
      </span>
      <p className="tabular text-[13px] uppercase tracking-wider text-faint">404</p>
      <h1 className="text-xl font-semibold tracking-tight">That page does not exist</h1>
      <p className="max-w-xs text-center text-sm text-muted">
        The link may be out of date, or the page may have moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex h-11 items-center rounded-md bg-fg px-6 text-[15px] font-medium text-bg hover:bg-fg/90"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
