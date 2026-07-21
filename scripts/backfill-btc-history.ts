/**
 * One-time backfill: extend data/series/btc-usd.json backwards to ~2010 using
 * the blockchain.info market-price chart (free, no API key).
 *
 * - The API downsamples long ranges, so we paginate 1-year windows, which
 *   return daily resolution.
 * - Binance stays the authority from 2017-08-17 onward: on overlapping dates
 *   the existing (Binance) values win.
 * - Historical points are dropped at the Binance genesis date.
 * - Early data is thin, Mt. Gox-era market price — see /methodology.
 * - On any error: record it in data/status.json and exit 0. Never fake data.
 */
import type { SeriesPoint } from '../lib/types';
import {
  mergePoints,
  readSeriesFile,
  sleep,
  statusError,
  statusOk,
  writeSeriesFile,
  writeStatus,
} from './lib/series-io';

const SOURCE = 'blockchain.info';
const SOURCE_URL = 'https://api.blockchain.info/charts/market-price?timespan=all&format=json';
const SERIES_ID = 'btc-usd';
const FIRST_YEAR = 2010; // blockchain.info market price starts 2010-08
const BINANCE_GENESIS = '2017-08-17'; // first Binance BTCUSDT daily candle

interface MarketPricePoint {
  x: number; // unix seconds
  y: number; // USD price
}

async function fetchYear(year: number): Promise<MarketPricePoint[]> {
  const url =
    `https://api.blockchain.info/charts/market-price` +
    `?timespan=1year&start=${year}-01-01&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`blockchain.info HTTP ${res.status} for ${year}`);
  const json = await res.json();
  return (json?.values ?? []) as MarketPricePoint[];
}

async function fetchHistory(): Promise<SeriesPoint[]> {
  const byDate = new Map<string, number>();
  const lastYear = Number(BINANCE_GENESIS.slice(0, 4));

  for (let year = FIRST_YEAR; year <= lastYear; year++) {
    const values = await fetchYear(year);
    if (year === FIRST_YEAR && values.length === 0) {
      throw new Error('blockchain.info returned no values');
    }
    for (const p of values) {
      const d = new Date(p.x * 1000).toISOString().slice(0, 10);
      if (d >= BINANCE_GENESIS) continue; // Binance owns this range
      if (!Number.isFinite(p.y) || p.y <= 0) continue;
      byDate.set(d, p.y); // chunk overlaps: latest-wins
    }
    await sleep(400); // one request at a time, gently
  }

  return [...byDate.entries()]
    .map(([d, v]) => ({ d, v }))
    .sort((a, b) => (a.d < b.d ? -1 : 1));
}

async function main(): Promise<void> {
  const existing = readSeriesFile(`${process.cwd()}/data/series/${SERIES_ID}.json`);
  if (!existing) throw new Error(`${SERIES_ID}.json missing — run fetch-btc first`);

  const historical = await fetchHistory();
  const points = mergePoints(historical, existing.points ?? []); // existing wins overlaps

  writeSeriesFile(`${process.cwd()}/data/series/${SERIES_ID}.json`, { ...existing, points });
  writeStatus('btc-usd-history', statusOk(SOURCE, SOURCE_URL, historical));
  console.log(
    `btc-usd-history: ${historical.length} points, ${historical[0]?.d ?? 'n/a'} → ` +
      `${historical[historical.length - 1]?.d ?? 'n/a'}; merged total ${points.length}`
  );
}

main().catch((err) => {
  console.error('btc history backfill failed:', err);
  writeStatus('btc-usd-history', statusError(SOURCE, SOURCE_URL, err));
  process.exit(0); // pipeline must never crash
});
