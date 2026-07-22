/**
 * Fetch barn swallow (Hirundo rustica) occurrence counts from the GBIF API
 * (free, no key) — one request per year, monthly facets.
 *
 * - usageKey 9515886 = Hirundo rustica (verified via /species/match).
 * - Monthly counts are stored on the 1st of each month from 2010 onward.
 *   The correlation inner-joins BTC returns on those dates, so overlap n is
 *   ~12/year — small, and shown honestly on the chart page.
 * - Counts cover all GBIF occurrence types (citizen science, museum
 *   records, eBird imports); it's an index of recorded activity, and the
 *   seasonal migration wave is unmistakable in it.
 * - On any error: record it in data/status.json and exit 0. Never fake data.
 */
import path from 'node:path';
import type { Series, SeriesPoint } from '../lib/types';
import {
  SERIES_DIR,
  mergePoints,
  readSeriesFile,
  sleep,
  statusError,
  statusOk,
  writeSeriesFile,
  writeStatus,
} from './lib/series-io';

const SOURCE = 'gbif';
const SOURCE_URL = 'https://api.gbif.org/v1/occurrence/search?taxon_key=9515886&facet=month';
const SERIES_PATH = path.join(SERIES_DIR, 'swallow-sightings.json');
const FIRST_YEAR = 2010;
const TAXON_KEY = 9515886; // Hirundo rustica

interface FacetResponse {
  count: number;
  facets?: { field: string; counts?: { name: string; count: number }[] }[];
}

async function fetchYear(year: number): Promise<SeriesPoint[]> {
  const url =
    `https://api.gbif.org/v1/occurrence/search` +
    `?taxon_key=${TAXON_KEY}&year=${year}&facet=month&facetLimit=12&limit=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GBIF HTTP ${res.status} for ${year}`);
  const json = (await res.json()) as FacetResponse;
  const counts = json.facets?.[0]?.counts ?? [];
  return counts
    .map((c) => ({
      d: `${year}-${c.name.padStart(2, '0')}-01`,
      v: c.count,
    }))
    .sort((a, b) => (a.d < b.d ? -1 : 1));
}

async function fetchAllPoints(): Promise<SeriesPoint[]> {
  const now = new Date();
  const thisYear = now.getUTCFullYear();
  const thisMonth = now.getUTCMonth() + 1;
  const byDate = new Map<string, number>();

  for (let year = FIRST_YEAR; year <= thisYear; year++) {
    for (const p of await fetchYear(year)) {
      const month = Number(p.d.slice(5, 7));
      if (year === thisYear && month > thisMonth) continue; // future months
      byDate.set(p.d, p.v);
    }
    await sleep(400);
  }
  return [...byDate.entries()]
    .map(([d, v]) => ({ d, v }))
    .sort((a, b) => (a.d < b.d ? -1 : 1));
}

async function main(): Promise<void> {
  const incoming = await fetchAllPoints();
  if (incoming.length === 0) throw new Error('GBIF returned no monthly counts');

  const existing = readSeriesFile(SERIES_PATH);
  const points = mergePoints(existing?.points ?? [], incoming);

  const series: Series = {
    id: 'swallow-sightings',
    name: 'Barn swallow sightings (GBIF)',
    unit: 'records per month',
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    cadence: 'monthly',
    points,
  };
  writeSeriesFile(SERIES_PATH, series);
  writeStatus('swallow-sightings', statusOk(SOURCE, SOURCE_URL, points));
  console.log(`swallow-sightings: ${points.length} points, last ${points[points.length - 1]?.d ?? 'n/a'}`);
}

main().catch((err) => {
  console.error('bird migration fetch failed:', err);
  writeStatus('swallow-sightings', statusError(SOURCE, SOURCE_URL, err));
  process.exit(0); // pipeline must never crash
});
