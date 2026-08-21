import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import './globals.css';

// Set NEXT_PUBLIC_SITE_URL in production so Open Graph image URLs resolve
// absolutely; relative ones are ignored by most crawlers.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

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
    <html lang="en" suppressHydrationWarning>
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
