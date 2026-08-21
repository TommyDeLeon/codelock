import type { Metadata } from 'next';

// Pages under this route are client components and cannot export metadata
// themselves, so each segment carries its own here.
export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Track your solve rate, difficulty level, and recent locks.',
  openGraph: { title: 'Dashboard · CodeLock', description: 'Track your solve rate, difficulty level, and recent locks.' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
