import { NextResponse, type NextRequest } from 'next/server';
import { apiOrigin } from '@/lib/runtime-config';

/**
 * The Content-Security-Policy, built per request.
 *
 * It used to live in `next.config.ts`, which cannot work for a prebuilt image:
 * that config is serialised at build time, so `connect-src` was frozen to
 * whatever API origin CI happened to have — `http://localhost:4000` — and every
 * real deployment would have had its own API blocked by its own policy.
 *
 * Middleware runs on each request, so the origin comes from the container's
 * environment instead. The remaining security headers stay in next.config.ts,
 * because none of them depend on configuration.
 *
 * `unsafe-inline` on styles is required by Next's inlined critical CSS.
 * `worker-src blob:` is required by the Monaco editor, which is bundled rather
 * than fetched from a CDN.
 */
export function middleware(_request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // React's development build uses eval() for Fast Refresh and callstack
  // reconstruction, so a dev server under the production policy never hydrates.
  // Production React never calls eval, so the allowance is scoped to
  // development and never ships.
  const scriptSrc =
    process.env.NODE_ENV === 'development'
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "worker-src 'self' blob:",
      `connect-src 'self' ${apiOrigin()}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  );

  return response;
}

export const config = {
  // Everything except Next's own immutable static output, which gains nothing
  // from a policy header on each asset.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
