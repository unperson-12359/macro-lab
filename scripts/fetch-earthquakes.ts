/**
 * Fetch magnitude 6+ earthquakes from the USGS fdsnws event API (free, no key)
 * and build a daily 7-day rolling count series.
 *
 * - Paginated in 5-year windows from 2010-08-18 (BTC data start).
 * - Raw daily counts are ~60% zeros, which would silently shrink the returns
 *   overlap in the correlation, so the stored series is the rolling 7-day
 *   count (documented in /methodology).
 * - Merge is latest-wins per date, sorted. On error: status.json + exit 0.
 */
import path from 'node:path';
import fs from 'node:fs';
import type { Series, SeriesPoint } from '../lib/types';
import {
  DATA_DIR,
  SERIES_DIR,
  mergePoints,
  readSeriesFile,
  sleep,
  statusError,
  statusOk,
  writeSeriesFile,
  writeStatus,
} from './lib/series-io';

const SOURCE = 'usgs';
const SOURCE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=6';
const SERIES_PATH = path.join(SERIES_DIR, 'earthquakes-m6.json');
const EVENTS_PATH = path.join(DATA_DIR, 'events-earthquakes.json');
const GENESIS = '2010-08-18';
const WINDOW_MS = 5 * 365.25 * 24 * 60 * 60 * 1000; // ~5 years
const DAY_MS = 24 * 60 * 60 * 1000;

interface QuakeResponse {
  features: { properties: { time: number; mag: number | null; place: string | null } }[];
}

export interface QuakeEvent {
  d: string;
  mag: number;
  place: string;
}

async function fetchWindow(start: number, end: number): Promise<QuakeResponse> {
  const url =
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson` +
    `&starttime=${new Date(start).toISOString().slice(0, 10)}` +
    `&endtime=${new Date(end).toISOString().slice(0, 10)}` +
    `&minmagnitude=6&orderby=time&limit=20000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
  return (await res.json()) as QuakeResponse;
}

function utcDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

async function fetchDailyCounts(): Promise<{ counts: Map<string, number>; events: QuakeEvent[] }> {
  const counts = new Map<string, number>();
  const events: QuakeEvent[] = [];
  const now = Date.now();
  for (let start = Date.parse(GENESIS); start < now; start += WINDOW_MS) {
    const end = Math.min(start + WINDOW_MS, now);
    const json = await fetchWindow(start, end);
    for (const f of json.features ?? []) {
      const d = utcDate(f.properties.time);
      counts.set(d, (counts.get(d) ?? 0) + 1);
      const mag = f.properties.mag;
      if (mag !== null && mag >= 7) {
        events.push({ d, mag, place: f.properties.place ?? '' });
      }
    }
    await sleep(400);
  }
  return { counts, events };
}

/** Fill every day with a count (zeros included), then 7-day rolling sum. */
function rolling7(counts: Map<string, number>): SeriesPoint[] {
  const today = utcDate(Date.now());
  const days: string[] = [];
  for (let t = Date.parse(GENESIS); t <= Date.parse(today); t += DAY_MS) {
    days.push(utcDate(t));
  }
  return days.map((d, i) => {
    let sum = 0;
    for (let j = Math.max(0, i - 6); j <= i; j++) sum += counts.get(days[j]) ?? 0;
    return { d, v: sum };
  });
}

async function main(): Promise<void> {
  const { counts, events } = await fetchDailyCounts();
  const incoming = rolling7(counts);
  const existing = readSeriesFile(SERIES_PATH);
  const points = mergePoints(existing?.points ?? [], incoming);

  const series: Series = {
    id: 'earthquakes-m6',
    name: 'Earthquakes M6+ (7-day count)',
    unit: 'quakes per 7 days',
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    cadence: 'daily',
    points,
  };
  writeSeriesFile(SERIES_PATH, series);
  writeStatus('earthquakes-m6', statusOk(SOURCE, SOURCE_URL, points));

  // Notable occurrences (M7+) for chart markers, latest-wins per date+mag.
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(EVENTS_PATH, JSON.stringify(events, null, 2) + '\n');
  console.log(`earthquakes-m6: ${points.length} points, last ${points[points.length - 1]?.d ?? 'n/a'}; ${events.length} M7+ events`);
}

main().catch((err) => {
  console.error('earthquake fetch failed:', err);
  writeStatus('earthquakes-m6', statusError(SOURCE, SOURCE_URL, err));
  process.exit(0); // pipeline must never crash
});
