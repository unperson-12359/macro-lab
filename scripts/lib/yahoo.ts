/**
 * Shared Yahoo Finance v8 chart-API helpers (no API key).
 *
 * Quirks handled:
 * - range=max silently downsamples, so we paginate explicit period1/period2
 *   windows of 5 years from meta.firstTradeDate to now.
 * - Dates are derived in the exchange timezone (meta.timezone), not UTC.
 * - Null closes are skipped.
 */
import type { SeriesPoint } from '../../lib/types';
import { sleep } from './series-io';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const WINDOW_MS = 5 * 365.25 * 24 * 60 * 60 * 1000; // ~5 years

interface ChartResult {
  meta: { firstTradeDate?: number; timezone?: string; exchangeTimezoneName?: string };
  timestamp?: number[];
  indicators?: { quote?: { close?: (number | null)[] }[] };
}

export function yahooSourceUrl(symbol: string): string {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`;
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

/** Full daily-close history for a symbol, from meta.firstTradeDate to now. */
export async function fetchYahooDailyCloses(symbol: string): Promise<SeriesPoint[]> {
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
