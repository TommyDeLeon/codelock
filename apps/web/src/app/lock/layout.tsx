import type { Metadata } from 'next';

// Pages under this route are client components and cannot export metadata
// themselves, so each segment carries its own here.
export const metadata: Metadata = {
  title: 'Locked',
  description: 'Solve the assigned problem, fast enough, to unlock your device.',
  openGraph: { title: 'Locked · CodeLock', description: 'Solve the assigned problem, fast enough, to unlock your device.' },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
