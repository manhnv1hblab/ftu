import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  const paths = ['', '/partners', '/planner', '/compare', '/handbook', '/reviews', '/print'];
  return paths.map(path => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date('2026-09-21')
  }));
}
