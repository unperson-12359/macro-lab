import type { MetadataRoute } from 'next';
import { loadCharts } from '@/lib/data';

export const dynamic = 'force-static';

const BASE = 'https://unperson-12359.github.io/macro-lab';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/charts', '/events', '/methodology'].map((p) => ({
    url: `${BASE}${p}`,
  }));
  const chartRoutes = loadCharts().map((c) => ({
    url: `${BASE}/charts/${c.slug}`,
  }));
  return [...staticRoutes, ...chartRoutes];
}
