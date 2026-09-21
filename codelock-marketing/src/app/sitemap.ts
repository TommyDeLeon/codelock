import type { MetadataRoute } from 'next';
import { SITE_ROUTES, SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return SITE_ROUTES.map((route) => ({
    url: new URL(route, SITE_URL).toString(),
    changeFrequency: 'monthly' as const,
    // The landing page is the entry point; everything else is equal to it in
    // the way that matters, so no elaborate priority ladder.
    priority: route === '/' ? 1 : 0.7,
  }));
}
