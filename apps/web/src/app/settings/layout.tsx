import { ConnectionBanner } from '@/components/connection-banner';
import type { Metadata } from 'next';

// Pages under this route are client components and cannot export metadata
// themselves, so each segment carries its own here.
export const metadata: Metadata = {
  title: 'Connections',
  description: 'Connect GitHub to mirror solved problems, and import your LeetCode stats.',
  openGraph: { title: 'Connections · CodeLock', description: 'Connect GitHub to mirror solved problems, and import your LeetCode stats.' },
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
  return (
    <>
      <ConnectionBanner />
      {children}
    </>
  );
}
