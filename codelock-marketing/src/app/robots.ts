import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Indexable, deliberately.
 *
 * The app sets `robots: { index: false }` and is right to: it is served to an
 * installed shell on someone's own machine and has nothing to offer a search
 * engine. This site is the opposite — being found is the entire reason it is a
 * separate deployment.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
