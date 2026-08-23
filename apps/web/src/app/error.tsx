'use client';

import { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Route-level error boundary.
 *
 * Without this, a render-time throw anywhere under the app router shows Next's
 * default error screen — which in production is an unstyled "Application error"
 * with no way back. This keeps the user inside the product and gives them a
 * retry, which for a transient API failure is usually all that is needed.
 *
 * `digest` is the only detail shown: the real message may contain internals,
 * and Next deliberately withholds it in production builds anyway.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replace with a real reporter (Sentry et al.) before launch; the console
    // is where this goes today and nobody is watching it in production.
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
      <span className="flex size-9 items-center justify-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert className="size-4" aria-hidden />
      </span>
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-center text-sm text-muted">
        This part of CodeLock failed to load. Your session and progress are unaffected.
      </p>
      {error.digest && (
        <p className="tabular text-[13px] text-faint">Reference: {error.digest}</p>
      )}
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Back to CodeLock
        </Button>
      </div>
    </main>
  );
}
