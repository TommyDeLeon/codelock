'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

/**
 * CodeLock keeps working while nobody is looking at it.
 *
 * query-core pauses a *retry* unless `focusManager.isFocused()`, and its default
 * focus manager reports `document.visibilityState !== 'hidden'`. A backgrounded
 * tab that fails one request therefore parks at `status: 'pending'`,
 * `fetchStatus: 'paused'`, `error: null` — forever, until someone looks at it.
 * `networkMode: 'always'` cannot override this: focus is AND-ed outside the
 * networkMode clause in `canContinue()`.
 *
 * That is wrong for this product. A lock timer runs in the background by
 * definition, so pinning "focused" true is the accurate description of the app,
 * not a workaround. Refetch-on-return is re-implemented below against
 * `visibilitychange`, which is what we actually wanted from it.
 */
focusManager.setFocused(true);

export function Providers({ children }: { children: React.ReactNode }) {
  // One client per browser session, created lazily so it is never shared
  // across requests during SSR.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            // Handled by the visibility effect below, since focusManager is
            // pinned and will never fire a focus change.
            refetchOnWindowFocus: false,
            retry: 1,
            // Never pause on a perceived offline state: a paused query reports
            // `data: undefined, error: null, isLoading: false`, which is
            // indistinguishable from "loaded fine, nothing to show".
            networkMode: 'always',
          },
          mutations: { networkMode: 'always' },
        },
      }),
  );

  // A tab that slept for an hour must not render a stale "45:00 remaining".
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void queryClient.refetchQueries({ type: 'active' });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [queryClient]);

  /*
    The profile is NOT hydrated here any more, and that is the point.

    Providers wraps every route, so this effect fired a request to
    /v1/settings/profile on every marketing page load — the landing page, the
    limits ledger, the demo. Those pages are served publicly and have no
    business talking to a private, unauthenticated API that a visitor's browser
    cannot reach in the first place. The visible symptom was a console full of
    connection failures on a page that appeared to work; the real cost was that
    the public site had a hard dependency on infrastructure nobody had told the
    reader about.

    Only the lock workspace uses the profile, so it hydrates it on mount. The
    marketing site now makes no API call at all.
  */

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
