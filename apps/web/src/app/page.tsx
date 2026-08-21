'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';
import { Skeleton } from '@/components/ui/primitives';

export default function IndexPage() {
  const router = useRouter();
  const status = useAuth((s) => s.status);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
    if (status === 'anonymous') router.replace('/login');
  }, [status, router]);

  // Routing decision needs localStorage, so it cannot happen on the server.
  // Render the dashboard's shape meanwhile to avoid a flash of empty page.
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-10">
      <span className="sr-only" role="status">
        Loading CodeLock
      </span>
      <Skeleton className="h-8 w-48" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </main>
  );
}
