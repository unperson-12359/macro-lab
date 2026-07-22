/**
 * Fetch full daily-close history for single Yahoo Finance tickers (no API key)
 * and append them to data/series/<id>.json.
 *
 * - Merge is latest-wins per date, sorted — rerunning the same day is a no-op.
 * - On any per-ticker error: record it in data/status.json and keep going.
 *   The script still exits 0. It never writes fake rows.
 */
import path from 'node:path';
import type { Series } from '../lib/types';
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
import { fetchYahooDailyCloses, yahooSourceUrl } from './lib/yahoo';

const SOURCE = 'yahoo';

const TICKERS = [
  { id: 'ferrari-race', symbol: 'RACE', name: 'Ferrari (RACE)', unit: 'USD' },
  { id: 'live-cattle', symbol: 'LE=F', name: 'Live cattle futures (LE=F)', unit: 'cents per lb' },
  { id: 'gamestop-gme', symbol: 'GME', name: 'GameStop (GME)', unit: 'USD' },
  { id: 'nasdaq-100', symbol: '^NDX', name: 'Nasdaq 100 (^NDX)', unit: 'index points' },
  { id: 'dollar-index', symbol: 'DX-Y.NYB', name: 'US dollar index (DXY)', unit: 'index points' },
  { id: 'gold-futures', symbol: 'GC=F', name: 'Gold futures (GC=F)', unit: 'USD per oz' },
] as const;

async function main(): Promise<void> {
  for (const t of TICKERS) {
    const filePath = path.join(SERIES_DIR, `${t.id}.json`);
    try {
      const incoming = await fetchYahooDailyCloses(t.symbol);
      const existing = readSeriesFile(filePath);
      const points = mergePoints(existing?.points ?? [], incoming);
      const series: Series = {
        id: t.id,
        name: t.name,
        unit: t.unit,
        source: SOURCE,
        sourceUrl: yahooSourceUrl(t.symbol),
        cadence: 'daily',
        points,
      };
      writeSeriesFile(filePath, series);
      writeStatus(t.id, statusOk(SOURCE, yahooSourceUrl(t.symbol), points));
      console.log(`${t.id}: ${points.length} points, last ${points[points.length - 1]?.d ?? 'n/a'}`);
    } catch (err) {
      console.error(`${t.id} (${t.symbol}) failed:`, err);
      writeStatus(t.id, statusError(SOURCE, yahooSourceUrl(t.symbol), err));
    }
    await sleep(400);
  }
}

main().catch((err) => {
  console.error('yahoo series fetch failed:', err);
  process.exit(0); // pipeline must never crash
});
