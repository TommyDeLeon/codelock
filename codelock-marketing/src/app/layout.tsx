import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Literata, Source_Sans_3 } from 'next/font/google';
import { EditorialShell } from '@/components/site/editorial-shell';
import { Providers } from './providers';
import { SITE_URL } from '@/lib/site';
import './globals.css';

/**
 * The public face of CodeLock.
 *
 * Separate from the app on purpose. The lock surface is served to an installed
 * desktop shell on someone's own machine; this is served to strangers and is
 * meant to be found. They share a design system — the tokens come from
 * `@codelock/ui` — and share the demo's components, so the demo stays the same
 * editor and the same results the real thing uses. What they do not share is a
 * deployment, an API client, or any code that could release a lock.
 *
 * Two differences from the app's root layout, both deliberate: there is no
 * runtime-config script, because nothing here talks to the API (the demo
 * grades in the browser), and this site is indexable, because being found is
 * the entire point of it.
 */

/** Three registers: editorial display, quiet reading, and measured evidence. */
const sans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans-loaded',
  display: 'swap',
  fallback: ['Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

const display = Literata({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-display-loaded',
  display: 'swap',
  // Keep a serif fallback; an automatically inserted Arial would erase the register.
  adjustFontFallback: false,
  fallback: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono-loaded',
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['Cascadia Mono', 'Consolas', 'Menlo', 'Courier New', 'monospace'],
});

// Resolved once in lib/site.ts, shared with the sitemap and robots.txt.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'CodeLock — earn your screen time', template: '%s · CodeLock' },
  description:
    'A focus timer that locks your device until you solve a programming problem — correctly and fast enough. Free, open source, and runs entirely on your own machine.',
  applicationName: 'CodeLock',
  openGraph: {
    type: 'website',
    siteName: 'CodeLock',
    title: 'CodeLock — earn your screen time',
    description:
      'A focus timer that locks your device until you solve a programming problem — correctly and fast enough.',
    images: [{ url: '/og.png', width: 512, height: 512, alt: 'CodeLock' }],
  },
  twitter: {
    card: 'summary',
    title: 'CodeLock — earn your screen time',
    description: 'Solve a programming problem, fast enough, to unlock your device.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf8' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0e0d' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh antialiased">
        {/* First stop for keyboard users; required for WCAG 2.4.1. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50
                     focus:rounded-sm focus:bg-fg focus:px-4 focus:py-2 focus:text-bg"
        >
          Skip to content
        </a>
        <Providers>
          <EditorialShell>
            <main id="main" className="flex-1">
              {children}
            </main>
          </EditorialShell>
        </Providers>
      </body>
    </html>
  );
}
