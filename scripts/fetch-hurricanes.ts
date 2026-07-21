/**
 * Fetch the NOAA HURDAT2 Atlantic hurricane database (free, no key, plain text)
 * and build a daily 7-day rolling count of active hurricanes.
 *
 * - One request; the filename carries a version stamp that may rot over time.
 * - Raw daily counts are mostly zeros outside hurricane season, which would
 *   silently shrink the returns overlap in the correlation, so the stored
 *   series is the rolling 7-day count (same approach as fetch-earthquakes.ts).
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
  statusError,
  statusOk,
  writeSeriesFile,
  writeStatus,
} from './lib/series-io';

const SOURCE = 'noaa-hurdat2';
const SOURCE_URL = 'https://www.nhc.noaa.gov/data/hurdat/hurdat2-1851-2024-040425.txt';
const SERIES_PATH = path.join(SERIES_DIR, 'hurricane-days.json');
const EVENTS_PATH = path.join(DATA_DIR, 'events-hurricanes.json');
const GENESIS = '2010-08-18';
const DAY_MS = 24 * 60 * 60 * 1000;
/** Max sustained wind >= 100 kt = category 3+ ("major hurricane"). */
const MAJOR_KT = 100;

export interface HurricaneEvent {
  d: string;
  name: string;
  wind: number;
}

interface StormRecord {
  d: string; // YYYY-MM-DD
  status: string;
  wind: number; // knots
}

interface Storm {
  name: string;
  records: StormRecord[];
}

/** Parse HURDAT2 text defensively; malformed lines are skipped. */
function parseHurdat(text: string): Storm[] {
  const storms: Storm[] = [];
  let current: Storm | null = null;
  for (const line of text.split(/\r?\n/)) {
    const cols = line.split(',');
    const first = (cols[0] ?? '').trim();
    if (/^AL\d{6}$/.test(first)) {
      // Header: AL011851, UNNAMED, 14,
      current = { name: (cols[1] ?? '').trim() || 'UNNAMED', records: [] };
      storms.push(current);
      continue;
    }
    if (!/^\d{8}$/.test(first) || !current) continue;
    const status = (cols[3] ?? '').trim();
    const wind = Number((cols[6] ?? '').trim());
    if (!status || !Number.isFinite(wind)) continue;
    const d = `${first.slice(0, 4)}-${first.slice(4, 6)}-${first.slice(6, 8)}`;
    current.records.push({ d, status, wind });
  }
  return storms;
}

/** Active hurricanes per day: distinct storms with at least one HU record that day. */
function dailyCounts(storms: Storm[]): Map<string, number> {
  const byDay = new Map<string, Set<string>>();
  storms.forEach((storm, i) => {
    for (const r of storm.records) {
      if (r.d < GENESIS || r.status !== 'HU') continue;
      let set = byDay.get(r.d);
      if (!set) {
        set = new Set();
        byDay.set(r.d, set);
      }
      set.add(String(i));
    }
  });
  const counts = new Map<string, number>();
  for (const [d, set] of byDay) counts.set(d, set.size);
  return counts;
}

/** Fill every day with a count (zeros included), then 7-day rolling sum. */
function rolling7(counts: Map<string, number>): SeriesPoint[] {
  const today = new Date().toISOString().slice(0, 10);
  const days: string[] = [];
  for (let t = Date.parse(GENESIS); t <= Date.parse(today); t += DAY_MS) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days.map((d, i) => {
    let sum = 0;
    for (let j = Math.max(0, i - 6); j <= i; j++) sum += counts.get(days[j]) ?? 0;
    return { d, v: sum };
  });
}

/** Storms that reached category 3+ since 2010: date of first peak-wind day. */
function majorHurricanes(storms: Storm[]): HurricaneEvent[] {
  const events: HurricaneEvent[] = [];
  for (const storm of storms) {
    const records = storm.records.filter((r) => r.d >= GENESIS);
    if (records.length === 0) continue;
    const peak = Math.max(...records.map((r) => r.wind));
    if (peak < MAJOR_KT) continue;
    const first = records.find((r) => r.wind === peak);
    if (!first) continue;
    events.push({ d: first.d, name: storm.name, wind: peak });
  }
  return events.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
}

async function main(): Promise<void> {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`HURDAT2 HTTP ${res.status}`);
  const storms = parseHurdat(await res.text());

  const incoming = rolling7(dailyCounts(storms));
  const existing = readSeriesFile(SERIES_PATH);
  const points = mergePoints(existing?.points ?? [], incoming);

  const series: Series = {
    id: 'hurricane-days',
    name: 'Active Atlantic hurricanes (7-day count)',
    unit: 'hurricane-days per 7 days',
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    cadence: 'daily',
    points,
  };
  writeSeriesFile(SERIES_PATH, series);
  writeStatus('hurricane-days', statusOk(SOURCE, SOURCE_URL, points));

  // Major hurricanes (cat 3+) for chart markers, sorted by date.
  const events = majorHurricanes(storms);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(EVENTS_PATH, JSON.stringify(events, null, 2) + '\n');
  console.log(
    `hurricane-days: ${points.length} points, last ${points[points.length - 1]?.d ?? 'n/a'}; ${events.length} major hurricanes`
  );
}

main().catch((err) => {
  console.error('hurricane fetch failed:', err);
  writeStatus('hurricane-days', statusError(SOURCE, SOURCE_URL, err));
  process.exit(0); // pipeline must never crash
});
