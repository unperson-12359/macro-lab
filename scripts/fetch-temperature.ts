/**
 * Fetch daily maximum temperature for Phoenix, AZ from the Open-Meteo
 * historical archive (ERA5 reanalysis) — free, no API key.
 *
 * - Paginated in 5-year windows from 2010-08-18 (BTC data start).
 * - Merge is latest-wins per date, sorted — rerunning the same day is a no-op.
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

const SOURCE = 'open-meteo';
const SOURCE_URL =
  'https://archive-api.open-meteo.com/v1/archive?latitude=33.45&longitude=-112.07&daily=temperature_2m_max';
const SERIES_PATH = path.join(SERIES_DIR, 'phoenix-tmax.json');
const GENESIS = '2010-08-18';
const WINDOW_MS = 5 * 365.25 * 24 * 60 * 60 * 1000; // ~5 years

interface ArchiveResponse {
  daily?: { time?: string[]; temperature_2m_max?: (number | null)[] };
}

async function fetchWindow(start: string, end: string): Promise<ArchiveResponse> {
  const url =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=33.45&longitude=-112.07&start_date=${start}&end_date=${end}` +
    `&daily=temperature_2m_max&timezone=UTC&temperature_unit=celsius`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  return (await res.json()) as ArchiveResponse;
}

function utcDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

async function fetchAllPoints(): Promise<SeriesPoint[]> {
  const byDate = new Map<string, number>();
  const today = utcDate(Date.now());
  for (let start = Date.parse(GENESIS); start < Date.now(); start += WINDOW_MS) {
    const end = utcDate(Math.min(start + WINDOW_MS, Date.now()));
    const json = await fetchWindow(utcDate(start), end);
    const times = json.daily?.time ?? [];
    const temps = json.daily?.temperature_2m_max ?? [];
    if (times.length === 0 && start === Date.parse(GENESIS)) {
      throw new Error('Open-Meteo returned no data');
    }
    for (let i = 0; i < times.length; i++) {
      const v = temps[i];
      if (v == null || !Number.isFinite(v)) continue;
      byDate.set(times[i], v);
    }
    await sleep(400); // one request at a time, gently
  }
  return [...byDate.entries()]
    .map(([d, v]) => ({ d, v }))
    .sort((a, b) => (a.d < b.d ? -1 : 1));
}

async function main(): Promise<void> {
  const incoming = await fetchAllPoints();
  const existing = readSeriesFile(SERIES_PATH);
  const points = mergePoints(existing?.points ?? [], incoming);

  const series: Series = {
    id: 'phoenix-tmax',
    name: 'Phoenix daily max temperature',
    unit: '°C',
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    cadence: 'daily',
    points,
  };
  writeSeriesFile(SERIES_PATH, series);
  writeStatus('phoenix-tmax', statusOk(SOURCE, SOURCE_URL, points));
  console.log(`phoenix-tmax: ${points.length} points, last ${points[points.length - 1]?.d ?? 'n/a'}`);
}

main().catch((err) => {
  console.error('temperature fetch failed:', err);
  writeStatus('phoenix-tmax', statusError(SOURCE, SOURCE_URL, err));
  process.exit(0); // pipeline must never crash
});
