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
        ],
      },
    ];
  },
};

export default config;
