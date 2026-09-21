/**
 * The absolute base for canonical URLs, Open Graph images and the sitemap.
 *
 * Three sources, in order. An explicit `NEXT_PUBLIC_SITE_URL` wins, because a
 * custom domain is the answer whenever there is one. Failing that, Vercel's own
 * production hostname, so a deployment is correct before anyone has set a
 * variable — that is the case that would otherwise ship Open Graph tags
 * pointing at localhost, which crawlers drop silently. Failing both, the dev
 * port.
 *
 * `||` rather than `??` throughout: an unset build arg arrives as the empty
 * string, not as undefined, and `new URL('')` throws.
 *
 * One definition, imported by the layout, the sitemap and robots.txt, so a
 * deployment cannot end up advertising two different origins for itself.
 */
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (vercelHost ? `https://${vercelHost}` : '') ||
  'http://localhost:3100';

/** Every route worth listing. Kept by hand: seven pages do not need a crawler. */
export const SITE_ROUTES = [
  '/',
  '/how-it-works',
  '/demo',
  '/install',
  '/limits',
  '/support',
] as const;
