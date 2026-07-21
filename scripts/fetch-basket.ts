/**
 * Fetch daily closes for the luxury-watch basket constituents from the Yahoo
 * Finance v8 chart API (no API key) and rebuild the equal-weighted basket.
 *
 * Constituents: LVMH (MC.PA, EUR), Richemont (CFR.SW, CHF), Swatch (UHR.SW, CHF).
 *
 * Quirks handled:
 * - range=max silently downsamples, so we paginate explicit period1/period2
 *   windows of 5 years from meta.firstTradeDate to now.
 * - Dates are derived in the exchange timezone (meta.timezone), not UTC.
 * - Null closes are skipped; merges are latest-wins per date.
 * - Any per-constituent failure is recorded in data/status.json and the
 *   script still exits 0. It never writes fake rows.
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

const SOURCE = 'yahoo';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const WINDOW_MS = 5 * 365.25 * 24 * 60 * 60 * 1000; // ~5 years
const BASKET_PATH = path.join(SERIES_DIR, 'luxury-watch-basket.json');

const CONSTITUENTS = [
  { id: 'lvmh', symbol: 'MC.PA', name: 'LVMH (MC.PA)' },
  { id: 'richemont', symbol: 'CFR.SW', name: 'Richemont (CFR.SW)' },
  { id: 'swatch', symbol: 'UHR.SW', name: 'Swatch Group (UHR.SW)' },
] as const;

function sourceUrl(symbol: string): string {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`;
}

interface ChartResult {
  meta: { firstTradeDate?: number; timezone?: string; exchangeTimezoneName?: string };
  timestamp?: number[];
  indicators?: { quote?: { close?: (number | null)[] }[] };
}

async function fetchChart(symbol: string, period1: number, period2: number): Promise<ChartResult> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
    `?period1=${Math.floor(period1 / 1000)}&period2=${Math.floor(period2 / 1000)}&interval=1d`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${symbol}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const error = json?.chart?.error;
  if (!result) throw new Error(`Yahoo error for ${symbol}: ${JSON.stringify(error)}`);
  return result as ChartResult;
}

function dateInTz(unixSeconds: number, timeZone: string): string {
  const fmt = (tz: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(unixSeconds * 1000));
  try {
    return fmt(timeZone);
  } catch {
    return fmt('UTC');
  }
}

async function fetchConstituent(symbol: string): Promise<SeriesPoint[]> {
  // Small probe request to read meta.firstTradeDate / meta.timezone.
  const now = Date.now();
  const probe = await fetchChart(symbol, now - 7 * 24 * 60 * 60 * 1000, now);
  const firstTrade = (probe.meta.firstTradeDate ?? 0) * 1000;
  if (!firstTrade) throw new Error(`no firstTradeDate for ${symbol}`);
  const timeZone = probe.meta.exchangeTimezoneName ?? 'UTC';

  const byDate = new Map<string, number>();
  for (let start = firstTrade; start < now; start += WINDOW_MS) {
    const end = Math.min(start + WINDOW_MS, now);
    const chunk = await fetchChart(symbol, start, end);
    const tz = chunk.meta.exchangeTimezoneName ?? timeZone;
    const timestamps = chunk.timestamp ?? [];
    const closes = chunk.indicators?.quote?.[0]?.close ?? [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close == null || !Number.isFinite(close)) continue;
      byDate.set(dateInTz(timestamps[i], tz), close);
    }
    await sleep(400); // one request at a time, gently
  }

  return [...byDate.entries()]
    .map(([d, v]) => ({ d, v }))
    .sort((a, b) => (a.d < b.d ? -1 : 1));
}

/** Inner-join raw series on date, normalize each to 100 at the earliest
 *  shared date, equal-weight average. */
function buildBasket(rawSeries: Series[]): SeriesPoint[] {
  const maps = rawSeries.map((s) => new Map(s.points.map((p) => [p.d, p.v])));
  const shared = [...maps[0].keys()]
    .filter((d) => maps.every((m) => m.has(d)))
    .sort();
  if (shared.length === 0) return [];
  const d0 = shared[0];
  const bases = maps.map((m) => m.get(d0)!);
  return shared.map((d) => {
    const avg =
      maps.reduce((sum, m, i) => sum + ((m.get(d)! / bases[i]) * 100) / maps.length, 0);
    return { d, v: Number(avg.toFixed(6)) };
  });
}

async function main(): Promise<void> {
  const rawSeries: Series[] = [];

  for (const c of CONSTITUENTS) {
    const rawPath = path.join(SERIES_DIR, 'raw', `${c.id}.json`);
    try {
      const incoming = await fetchConstituent(c.symbol);
      const existing = readSeriesFile(rawPath);
      const points = mergePoints(existing?.points ?? [], incoming);
      const series: Series = {
        id: c.id,
        name: c.name,
        unit: 'local currency',
        source: SOURCE,
        sourceUrl: sourceUrl(c.symbol),
        cadence: 'daily',
        points,
      };
      writeSeriesFile(rawPath, series);
      writeStatus(c.id, statusOk(SOURCE, sourceUrl(c.symbol), points));
      console.log(`${c.id}: ${points.length} points, last ${points[points.length - 1]?.d ?? 'n/a'}`);
      rawSeries.push(series);
    } catch (err) {
      console.error(`${c.id} (${c.symbol}) failed:`, err);
      writeStatus(c.id, statusError(SOURCE, sourceUrl(c.symbol), err));
      const existing = readSeriesFile(rawPath);
      if (existing) rawSeries.push(existing); // stale beats absent
    }
    await sleep(400);
  }

  if (rawSeries.length === CONSTITUENTS.length) {
    const points = buildBasket(rawSeries);
    if (points.length > 0) {
      const basket: Series = {
        id: 'luxury-watch-basket',
        name: 'Luxury watch basket (LVMH, Richemont, Swatch, equal weighted)',
        unit: 'index (base 100)',
        source: SOURCE,
        sourceUrl: CONSTITUENTS.map((c) => sourceUrl(c.symbol)).join(', '),
        cadence: 'daily',
        points,
      };
      writeSeriesFile(BASKET_PATH, basket);
      console.log(`luxury-watch-basket: ${points.length} points, last ${points[points.length - 1].d}`);
    }
  } else {
    console.error('basket not rebuilt: missing constituents');
  }
}

main().catch((err) => {
  console.error('basket fetch failed:', err);
  process.exit(0); // pipeline must never crash
});
