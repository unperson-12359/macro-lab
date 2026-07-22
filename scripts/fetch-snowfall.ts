/**
 * Fetch daily snowfall for Chamonix, France from the Open-Meteo historical
 * archive (free, no key) — same pattern as fetch-temperature.ts.
 *
 * - Paginated in 5-year windows from 2010-08-18.
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

const SOURCE = 'open-meteo';
const SOURCE_URL =
  'https://archive-api.open-meteo.com/v1/archive?latitude=45.92&longitude=6.87&daily=snowfall_sum';
const SERIES_PATH = path.join(SERIES_DIR, 'alpine-snowfall.json');
const GENESIS = '2010-08-18';
const WINDOW_MS = 5 * 365.25 * 24 * 60 * 60 * 1000; // ~5 years

interface ArchiveResponse {
  daily?: { time?: string[]; snowfall_sum?: (number | null)[] };
}

function utcDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

async function fetchWindow(start: string, end: string): Promise<ArchiveResponse> {
  const url =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=45.92&longitude=6.87&start_date=${start}&end_date=${end}` +
    `&daily=snowfall_sum&timezone=UTC`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  return (await res.json()) as ArchiveResponse;
}

async function fetchAllPoints(): Promise<SeriesPoint[]> {
  const byDate = new Map<string, number>();
  for (let start = Date.parse(GENESIS); start < Date.now(); start += WINDOW_MS) {
    const end = utcDate(Math.min(start + WINDOW_MS, Date.now()));
    const json = await fetchWindow(utcDate(start), end);
    const times = json.daily?.time ?? [];
    const snow = json.daily?.snowfall_sum ?? [];
    if (times.length === 0 && start === Date.parse(GENESIS)) {
      throw new Error('Open-Meteo returned no data');
    }
    for (let i = 0; i < times.length; i++) {
      const v = snow[i];
      if (v == null || !Number.isFinite(v)) continue;
      byDate.set(times[i], v);
    }
    await sleep(400);
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
    id: 'alpine-snowfall',
    name: 'Chamonix daily snowfall',
    unit: 'cm',
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    cadence: 'daily',
    points,
  };
  writeSeriesFile(SERIES_PATH, series);
  writeStatus('alpine-snowfall', statusOk(SOURCE, SOURCE_URL, points));
  console.log(`alpine-snowfall: ${points.length} points, last ${points[points.length - 1]?.d ?? 'n/a'}`);
}

main().catch((err) => {
  console.error('snowfall fetch failed:', err);
  writeStatus('alpine-snowfall', statusError(SOURCE, SOURCE_URL, err));
  process.exit(0); // pipeline must never crash
});
