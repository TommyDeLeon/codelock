'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Cinematic page transitions for the marketing site.
 *
 * The View Transitions API is driven by hand here rather than through the
 * framework, because the framework cannot do it on the versions this app is
 * pinned to: `startViewTransition` appears only in Next's *experimental*
 * runtime, and React 19.2 stable exports no `ViewTransition`. Moving to the
 * experimental channel to get an animation would be a poor trade for a product
 * whose job is to stay locked reliably. The native API needs no dependency.
 *
 * Mounted only in the (site) layout, which is what keeps it away from /lock —
 * that route has its own layout and never renders this. The lock screen appears
 * at the user's least patient moment and must not animate on arrival.
 *
 * The animation itself is in globals.css under "moving between pages".
 */
export function CinematicNav({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Resolves the transition's callback once the new route has committed.
   *
   * startViewTransition holds the old frame frozen until its callback settles,
   * so this is the one piece that must never fail to run — a promise that never
   * resolves is a page that never comes back.
   */
  const settle = useRef<(() => void) | null>(null);

  useEffect(() => {
    settle.current?.();
    settle.current = null;
  }, [pathname]);

  // Anything still pending when this unmounts would strand the frozen frame.
  useEffect(() => () => settle.current?.(), []);

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.defaultPrevented || event.button !== 0) return;
      // Modified clicks belong to the browser: new tab, new window, download.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as HTMLElement | null)?.closest('a');
      if (!link) return;
      if (link.target && link.target !== '_self') return;
      if (link.hasAttribute('download')) return;

      const href = link.getAttribute('href');
      // Same-origin app routes only. Anything else — external, hash, mailto —
      // is left to the browser.
      if (!href || !href.startsWith('/') || href.startsWith('//')) return;
      if (href === pathname) return;
      // Belt and braces. Nothing on the marketing site links to the lock
      // screen, and if that ever changes it must still arrive without motion.
      if (href === '/lock' || href.startsWith('/lock/')) return;

      if (typeof document.startViewTransition !== 'function') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      event.preventDefault();

      document.startViewTransition(async () => {
        router.push(href);
        await new Promise<void>((resolve) => {
          settle.current = resolve;
          // A hard ceiling, not a fallback. If the route is slow, or the effect
          // above never fires because the pathname did not change, the old
          // frame unfreezes anyway and the user gets an ordinary navigation
          // rather than a page that appears to have hung.
          window.setTimeout(resolve, 600);
        });
      });
    },
    [pathname, router],
  );

  // Capture, so a link's own handler cannot consume the click first.
  return (
    <div className={className} onClickCapture={onClick}>
      {children}
    </div>
  );
}
