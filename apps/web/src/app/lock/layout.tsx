import { ConnectionBanner } from '@/components/connection-banner';
import type { Metadata } from 'next';

// Pages under this route are client components and cannot export metadata
// themselves, so each segment carries its own here.
export const metadata: Metadata = {
  title: 'Locked',
  description: 'Solve the assigned problem, fast enough, to unlock your device.',
  openGraph: { title: 'Locked · CodeLock', description: 'Solve the assigned problem, fast enough, to unlock your device.' },
  robots: { index: false, follow: false },
};

/**
 * The outage banner belongs to the signed-in app, not the public site.
 *
 * It used to live in Providers, which put it on the marketing pages too — so a
 * stranger reading the landing page was told the database was unreachable, and
 * the demo (which is deliberately database-free and works fine without one)
 * carried an alarming banner about a failure that did not affect it.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  /**
   * The lock screen is always dark, whatever the theme preference says.
   *
   * This is the one page the user did not choose to open. It arrives full
   * screen, unannounced, and often at night — and in light mode that is a
   * white rectangle taking over the whole display. The rest of the site
   * honours light, dark and system; this page is a takeover, and a takeover
   * should not also be a flashbang.
   *
   * `dark` is a class variant here (`@custom-variant dark (&:where(.dark,
   * .dark *))` in globals.css), so scoping it to a wrapper flips both the
   * tokens and every `dark:` utility inside without touching the user's saved
   * preference. The explicit background and min-height matter: the tokens only
   * apply inside this subtree, so the light page background would otherwise
   * still show through around it.
   */
  return (
    <div className="dark min-h-screen bg-bg text-fg">
      <ConnectionBanner />
      {children}
    </div>
  );
}
