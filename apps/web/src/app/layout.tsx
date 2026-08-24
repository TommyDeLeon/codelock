import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

/**
 * Two families, each with a job.
 *
 * The default stack was system-ui everywhere, which is the single loudest
 * signal that nobody chose anything. Inter carries both the interface and the
 * display type — the rebrand replaced the display serif with a grotesque, and
 * that is Inter at bold weight, not a third family. The mono is finally a real
 * face rather than a fallback chain, which matters because runtimes and gate
 * figures are the product's evidence.
 *
 * There were three. Instrument Serif survived the rebrand as a dead import:
 * still fetched, still preloaded at the highest priority, referenced by no CSS
 * rule at all — 30 KB of the render-blocking budget spent on a face that never
 * appeared on screen.
 *
 * next/font self-hosts and inlines the metrics, so there is no layout shift and
 * no request to Google at runtime.
 */
const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans-loaded',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-loaded',
  display: 'swap',
});

// Set NEXT_PUBLIC_SITE_URL in production so Open Graph image URLs resolve
// absolutely; relative ones are ignored by most crawlers.
//
// `||` rather than `??`: an unset build arg arrives as the empty string, not as
// undefined, and `new URL('')` throws. That failed the Docker build with
// "Failed to collect page data for /lock" and no mention of the variable.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'CodeLock — earn your screen time', template: '%s · CodeLock' },
  description:
    'A focus timer that locks your device until you solve a programming problem — correctly and fast enough.',
  manifest: '/manifest.webmanifest',
  applicationName: 'CodeLock',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'CodeLock' },
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
  // The app is behind auth and has nothing to index; the marketing site, if
  // there ever is one, would be a separate deployment.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // The lock screen fills the display and sits under the notch. Zoom is left
  // enabled deliberately: capping maximum-scale fails WCAG 1.4.4, and iOS has
  // ignored it since iOS 10 regardless. Zoom-on-focus is prevented by sizing
  // inputs at 16px on small screens instead.
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
      className={`${sans.variable} ${mono.variable}`}
    >
      <head>
        {/*
          Deliberately a plain blocking script, not next/script.

          It defines window.__CODELOCK__, which lib/api.ts reads at module
          scope, so it must have run before any client bundle evaluates —
          next/script's default strategy does not guarantee that. It is a few
          dozen bytes from the same origin, so the cost is a parse.
        */}
        <script src="/runtime-config.js" />
      </head>
      <body className="min-h-dvh antialiased">
        {/* First stop for keyboard users; required for WCAG 2.4.1. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50
                     focus:rounded-sm focus:bg-fg focus:px-4 focus:py-2 focus:text-bg"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
