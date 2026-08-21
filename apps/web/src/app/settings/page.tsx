'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AppHeader } from '@/components/app-header';
import { SiteFooter } from '@/components/site-footer';
import { GitHubCard } from '@/components/settings/github-card';
import { LeetCodeCard } from '@/components/settings/leetcode-card';
import { Skeleton } from '@/components/ui/primitives';

export default function SettingsPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-7">
        <h1 className="text-xl font-semibold tracking-tight">Connections</h1>
        <p className="mt-1 text-sm text-muted">
          Mirror your solved problems outward so the work counts where you already track it.
        </p>

        {/* useSearchParams forces a suspense boundary during prerender. */}
        <Suspense fallback={null}>
          <OAuthResultToast />
        </Suspense>

        <div className="mt-6 space-y-4">
          <Suspense fallback={<Skeleton className="h-52" />}>
            <GitHubCard />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-52" />}>
            <LeetCodeCard />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/** The GitHub callback bounces back here with ?github=<outcome>. */
function OAuthResultToast() {
  const params = useSearchParams();
  const outcome = params.get('github');

  useEffect(() => {
    if (!outcome) return;
    if (outcome === 'connected') toast.success('GitHub connected.');
    if (outcome === 'expired') toast.error('That authorization link expired. Try again.');
    if (outcome === 'error') toast.error('GitHub declined the connection.');
    // Strip the parameter so a refresh does not replay the toast.
    window.history.replaceState({}, '', '/settings');
  }, [outcome]);

  return null;
}
