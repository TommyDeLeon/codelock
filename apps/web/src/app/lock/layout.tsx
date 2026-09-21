import { ConnectionBanner } from '@/components/connection-banner';
import type { Metadata } from 'next';
import './lock.css';
import { LockSurface } from '@/components/lock/lock-surface';

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
 *
 * The palette comes from LockSurface, which reads it from the profile so that
 * this page and the dashboard cannot disagree about the theme.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LockSurface>
      <ConnectionBanner />
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </LockSurface>
  );
}
