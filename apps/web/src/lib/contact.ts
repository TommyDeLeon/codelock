/**
 * Where to reach the person who maintains this.
 *
 * The footer, the support page and the privacy page each read
 * NEXT_PUBLIC_CONTACT_EMAIL separately, and each rendered nothing because it
 * was never set — three copies of one conditional, all silently off. A single
 * value here instead, so they cannot drift or end up half-configured.
 *
 * site-footer.tsx used to note that hard-coding a personal address into a
 * public page is the owner's decision to make. He has now made it and asked for
 * it (2026-09-08), and the address is already published on tommydeleon.com, so
 * this is not a new disclosure. The environment variable still wins wherever it
 * is set, which is what a self-hosted install needs.
 */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'tommydeleon104@gmail.com';

/** The maintainer, for pages that name a person rather than an inbox. */
export const MAINTAINER = {
  name: 'Tommy De Leon',
  site: 'https://tommydeleon.com',
  github: 'https://github.com/TommyDeLeon',
  linkedin: 'https://www.linkedin.com/in/tommydeleon/',
} as const;
