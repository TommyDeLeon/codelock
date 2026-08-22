import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Standalone output is what makes the self-hosted image small: Next traces
  // the modules actually reached and copies only those, so the runtime stage
  // carries no toolchain and no node_modules tree.
  output: 'standalone',
  // Next 16 drops generated tooling docs into the app directory on dev and
  // build. They are not part of this project, so opt out at the source rather
  // than ignoring the files after the fact.
  agentRules: false,
  // The shared contract package ships TypeScript source, not a build.
  transpilePackages: ['@codelock/shared'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The lock screen must never be embeddable: a hostile iframe host
          // could otherwise overlay a fake "unlock" control.
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy() },
        ],
      },
    ];
  },
};

/**
 * The CSP, built from the API origin this bundle was compiled against.
 *
 * It used to live in vercel.json with `connect-src https://api.codelock.app`
 * hardcoded — a domain that does not exist. Deployed anywhere real, the browser
 * would have blocked every API call, and the only clue would have been a
 * console warning. Static JSON cannot read an environment variable; this can.
 *
 * `unsafe-inline` on styles is required by Next's inlined critical CSS, and
 * `worker-src blob:` by the Monaco editor.
 */
function contentSecurityPolicy(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Only an origin belongs in a CSP directive; a path would be ignored, and a
  // malformed value would silently produce a policy that blocks everything.
  let apiOrigin = 'http://localhost:4000';
  try {
    apiOrigin = new URL(configured).origin;
  } catch {
    // Fall through to the local default rather than emitting a broken policy.
  }

  // React's development build uses eval() to reconstruct callstacks and to power
  // Fast Refresh, so a dev server under this policy throws "eval() is not
  // supported in this environment" and the page never hydrates. Production React
  // never calls eval, so the allowance is scoped to development and never ships.
  const scriptSrc =
    process.env.NODE_ENV === 'development'
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    `connect-src 'self' ${apiOrigin}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

export default config;
