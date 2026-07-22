/**
 * Fetch daily tidal range at The Battery, NY (station 8518750) from the
 * NOAA CO-OPS API (free, no key), one year per request.
 *
 * - Daily range = highest high-water minus lowest low-water that day (meters).
 * - Merge is latest-wins per date, sorted. On error: status.json + exit 0.
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

const SOURCE = 'noaa-coops';
const SOURCE_URL =
  'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=8518750&product=high_low';
const SERIES_PATH = path.join(SERIES_DIR, 'tidal-range.json');
const GENESIS = '2010-08-18';

interface HiloResponse {
  data?: { t: string; v: string; ty: string }[];
  error?: { message: string };
}

async function fetchYear(year: number): Promise<HiloResponse> {
  const url =
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
    `?begin_date=${year}0101&end_date=${year}1231&station=8518750` +
    `&product=high_low&datum=MLLW&time_zone=gmt&units=metric&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NOAA HTTP ${res.status} for ${year}`);
  const json = (await res.json()) as HiloResponse;
  if (json.error) throw new Error(`NOAA error for ${year}: ${json.error.message}`);
  return json;
}

async function fetchAllPoints(): Promise<SeriesPoint[]> {
  const thisYear = new Date().getUTCFullYear();
  const firstYear = Number(GENESIS.slice(0, 4));
  const byDate = new Map<string, { hi: number; lo: number }>();

  for (let year = firstYear; year <= thisYear; year++) {
    const json = await fetchYear(year);
    for (const rec of json.data ?? []) {
      const d = rec.t.slice(0, 10);
      const v = Number(rec.v);
      if (d < GENESIS || !Number.isFinite(v)) continue;
      const cur = byDate.get(d) ?? { hi: -Infinity, lo: Infinity };
      cur.hi = Math.max(cur.hi, v);
      cur.lo = Math.min(cur.lo, v);
      byDate.set(d, cur);
    }
    await sleep(400);
  }

  return [...byDate.entries()]
    .filter(([, r]) => r.hi > -Infinity && r.lo < Infinity && r.hi > r.lo)
    .map(([d, r]) => ({ d, v: Number((r.hi - r.lo).toFixed(4)) }))
    .sort((a, b) => (a.d < b.d ? -1 : 1));
}

async function main(): Promise<void> {
  const incoming = await fetchAllPoints();
  if (incoming.length === 0) throw new Error('NOAA returned no tidal data');

  const existing = readSeriesFile(SERIES_PATH);
  const points = mergePoints(existing?.points ?? [], incoming);

  const series: Series = {
    id: 'tidal-range',
    name: 'Tidal range at The Battery, NY',
    unit: 'meters',
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    cadence: 'daily',
    points,
  };
  writeSeriesFile(SERIES_PATH, series);
  writeStatus('tidal-range', statusOk(SOURCE, SOURCE_URL, points));
  console.log(`tidal-range: ${points.length} points, last ${points[points.length - 1]?.d ?? 'n/a'}`);
}

main().catch((err) => {
  console.error('tides fetch failed:', err);
  writeStatus('tidal-range', statusError(SOURCE, SOURCE_URL, err));
  process.exit(0); // pipeline must never crash
});
