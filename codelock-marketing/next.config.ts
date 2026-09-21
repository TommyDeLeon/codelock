import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Traced output, so the deployed image carries only the modules actually
  // reached. Off on Vercel, which builds its own output format.
  output: process.env.VERCEL ? undefined : 'standalone',
  agentRules: false,
  // The shared packages ship TypeScript source, not a build.
  transpilePackages: ['@codelock/shared', '@codelock/ui'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Nothing here is a lock surface, but there is also no reason for a
          // page of ours to be framed by anyone.
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default config;
