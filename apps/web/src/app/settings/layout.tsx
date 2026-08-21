import type { Metadata } from 'next';

// Pages under this route are client components and cannot export metadata
// themselves, so each segment carries its own here.
export const metadata: Metadata = {
  title: 'Connections',
  description: 'Connect GitHub to mirror solved problems, and import your LeetCode stats.',
  openGraph: { title: 'Connections · CodeLock', description: 'Connect GitHub to mirror solved problems, and import your LeetCode stats.' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
