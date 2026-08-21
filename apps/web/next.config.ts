import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
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
        ],
      },
    ];
  },
};

export default config;
