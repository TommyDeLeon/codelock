import { CinematicNav } from '@/components/site/cinematic-nav';
import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site-footer';

/**
 * Chrome for the public site.
 *
 * A route group rather than a path segment, so these pages keep their short
 * URLs — `(site)` contributes nothing to the address. The authenticated app
 * keeps its own layout and its own header; the two never share chrome.
 *
 * That separation is also what scopes the cinematic treatment. CinematicNav
 * wraps only these pages, so /lock arrives as an instant cut however it is
 * reached — which is the point of the lock screen.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CinematicNav className="flex min-h-dvh flex-col">
      <SiteNav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </CinematicNav>
  );
}
