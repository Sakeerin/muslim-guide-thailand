import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // admin is not for indexing; search results are user-specific
      disallow: ['/admin', '/api/', '/en/search', '/th/search', '/ms/search', '/id/search', '/ar/search'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
