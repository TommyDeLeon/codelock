import { SiteNav } from '@/components/site/site-nav';
import { SiteFooter } from '@/components/site-footer';

/**
 * Chrome for the public site.
 *
 * A route group rather than a path segment, so these pages keep their short
 * URLs — `(site)` contributes nothing to the address. The authenticated app
 * keeps its own layout and its own header; the two never share chrome.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
