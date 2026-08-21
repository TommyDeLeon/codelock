import type { Metadata } from 'next';

// Pages under this route are client components and cannot export metadata
// themselves, so each segment carries its own here.
export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to CodeLock to manage your focus sessions and coding challenges.',
  openGraph: { title: 'Sign in · CodeLock', description: 'Sign in to CodeLock to manage your focus sessions and coding challenges.' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
