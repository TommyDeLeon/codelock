'use client';

import { ThemeProvider } from 'next-themes';

/**
 * Everything this site needs at the root, which is one thing.
 *
 * The app's providers carry a query client and a toaster because the app talks
 * to an API. This one does not: the demo grades in the browser and no page here
 * makes a request. Copying the app's Providers across would have given the
 * marketing site a hard dependency on infrastructure its readers cannot reach
 * — the exact bug the app's own comments record having fixed.
 *
 * Light is the default rather than the system's choice, for the same reason as
 * in the app: these pages are read, and a first impression should be the one
 * that was designed. enableSystem stays on, so the System segment in the
 * toggle still resolves against the OS for anyone who picks it.
 *
 * What is no longer here is a palette. Dark mode on this site used to be
 * seventeen colour tokens redefined in site.css, which is how the marketing
 * site ended up advertising a product it did not resemble. It now takes the
 * same .dark tokens as the dashboard and the lock screen.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
