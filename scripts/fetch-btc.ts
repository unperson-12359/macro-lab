/**
 * Fetch daily BTC/USDT closes from the Binance public klines API and append
 * them to data/series/btc-usd.json.
 *
 * - Paginates with startTime from 2017-08-17 (first BTCUSDT daily candle).
 * - Close price only; the final still-open UTC candle is dropped.
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

const SOURCE = 'binance';
const SOURCE_URL = 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d';
const SERIES_PATH = path.join(SERIES_DIR, 'btc-usd.json');
const GENESIS = Date.UTC(2017, 7, 17); // 2017-08-17

function utcDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

async function fetchKlines(startTime: number): Promise<unknown[][]> {
  const url =
    `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d` +
    `&limit=1000&startTime=${startTime}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
  return (await res.json()) as unknown[][];
}

async function fetchAllPoints(): Promise<SeriesPoint[]> {
  const todayUtc = utcDate(Date.now());
  const points: SeriesPoint[] = [];
  let start = GENESIS;

  for (;;) {
    const klines = await fetchKlines(start);
    if (klines.length === 0) break;

    for (const k of klines) {
      const openTime = Number(k[0]);
      const close = Number(k[4]);
      const d = utcDate(openTime);
      if (d === todayUtc) continue; // in-progress UTC candle
      if (!Number.isFinite(close)) continue;
      points.push({ d, v: close });
    }

    const lastOpen = Number(klines[klines.length - 1][0]);
    if (klines.length < 1000) break;
    start = lastOpen + 24 * 60 * 60 * 1000;
    await sleep(250);
  }

  return points;
}

async function main(): Promise<void> {
  const incoming = await fetchAllPoints();
  const existing = readSeriesFile(SERIES_PATH);
  const points = mergePoints(existing?.points ?? [], incoming);

  const series: Series = {
    id: 'btc-usd',
    name: 'Bitcoin (BTC/USDT)',
    unit: 'USD',
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    cadence: 'daily',
    points,
  };
  writeSeriesFile(SERIES_PATH, series);
  writeStatus('btc-usd', statusOk(SOURCE, SOURCE_URL, points));
  console.log(`btc-usd: ${points.length} points, last ${points[points.length - 1]?.d ?? 'n/a'}`);
}

main().catch((err) => {
  console.error('btc fetch failed:', err);
  writeStatus('btc-usd', statusError(SOURCE, SOURCE_URL, err));
  process.exit(0); // pipeline must never crash
});
