import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'CodeLock', template: '%s · CodeLock' },
  description: 'Earn your screen time. Solve a problem to unlock.',
  manifest: '/manifest.webmanifest',
  applicationName: 'CodeLock',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'CodeLock' },
};

export const viewport: Viewport = {
  // The lock screen must fill the display and sit under the notch, and users
  // must not be able to pinch-zoom their way out of a full-screen overlay.
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
