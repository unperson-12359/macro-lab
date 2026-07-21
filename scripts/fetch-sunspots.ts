/**
 * Fetch the daily total sunspot number from SILSO (Royal Observatory of
 * Belgium) — a single keyless CSV covering 1818 to the current month.
 *
 * - Format: year;month;day;yearfraction;sunspot number;stddev;observations;provisional
 * - Missing values are -1 and skipped; dates before 2010-08-18 are dropped.
 * - Merge is latest-wins per date, sorted. On error: status.json + exit 0.
 */
import path from 'node:path';
import type { Series, SeriesPoint } from '../lib/types';
import {
  SERIES_DIR,
  mergePoints,
  readSeriesFile,
  statusError,
  statusOk,
  writeSeriesFile,
  writeStatus,
} from './lib/series-io';

const SOURCE = 'silso';
const SOURCE_URL = 'https://www.sidc.be/SILSO/INFO/sndtotcsv.php';
const SERIES_PATH = path.join(SERIES_DIR, 'sunspots-daily.json');
const GENESIS = '2010-08-18';

function parseCsv(text: string): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (const line of text.split('\n')) {
    const cols = line.trim().split(';');
    if (cols.length < 5) continue;
    const [year, month, day, , sn] = cols;
    const v = Number(sn);
    if (!Number.isFinite(v) || v < 0) continue; // -1 = missing
    const d = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    if (d < GENESIS) continue;
    out.push({ d, v });
  }
  return out;
}

async function main(): Promise<void> {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`SILSO HTTP ${res.status}`);
  const incoming = parseCsv(await res.text());
  if (incoming.length === 0) throw new Error('SILSO CSV parsed to zero rows');

  const existing = readSeriesFile(SERIES_PATH);
  const points = mergePoints(existing?.points ?? [], incoming);

  const series: Series = {
    id: 'sunspots-daily',
    name: 'Sunspot number (daily)',
    unit: 'sunspots',
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    cadence: 'daily',
    points,
  };
  writeSeriesFile(SERIES_PATH, series);
  writeStatus('sunspots-daily', statusOk(SOURCE, SOURCE_URL, points));
  console.log(`sunspots-daily: ${points.length} points, last ${points[points.length - 1]?.d ?? 'n/a'}`);
}

main().catch((err) => {
  console.error('sunspot fetch failed:', err);
  writeStatus('sunspots-daily', statusError(SOURCE, SOURCE_URL, err));
  process.exit(0); // pipeline must never crash
});
