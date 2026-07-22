import type { ChartPoint, SeriesPoint, Verdict } from './types';

/** Daily % returns: r_i = v_i / v_{i-1} - 1, dated at v_i. */
export function dailyReturns(points: SeriesPoint[]): { d: string; r: number }[] {
  const out: { d: string; r: number }[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].v;
    const cur = points[i].v;
    if (prev > 0 && Number.isFinite(cur)) {
      out.push({ d: points[i].d, r: cur / prev - 1 });
    }
  }
  return out;
}

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return NaN;
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i++) {
    mx += xs[i];
    my += ys[i];
  }
  mx /= n;
  my /= n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  const denom = Math.sqrt(sxx * syy);
  return denom === 0 ? NaN : sxy / denom;
}

/**
 * Pearson r over the daily returns of two series, inner-joined on date.
 * Returns the coefficient and n, the number of overlapping return days.
 */
export function correlationOnReturns(
  a: SeriesPoint[],
  b: SeriesPoint[]
): { r: number; n: number } {
  const ra = new Map(dailyReturns(a).map((p) => [p.d, p.r]));
  const rb = new Map(dailyReturns(b).map((p) => [p.d, p.r]));
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [d, r] of ra) {
    const other = rb.get(d);
    if (other !== undefined) {
      xs.push(r);
      ys.push(other);
    }
  }
  return { r: pearson(xs, ys), n: xs.length };
}

export function verdictFromR(r: number): Verdict {
  const a = Math.abs(r);
  if (a >= 0.6) return 'SIGNAL';
  if (a >= 0.3) return 'SPURIOUS';
  return 'ENTERTAINMENT';
}

export function toChartPoints(points: SeriesPoint[]): ChartPoint[] {
  return points.map((p) => ({ time: p.d, value: p.v }));
}

/* ---- Oscillator transforms (display-only; headline stats use raw series) ---- */

/**
 * Rolling Pearson correlation of the two series' daily returns, inner-joined
 * on date, over a trailing `window` of overlapping return days. Each output
 * point is dated at the end of its window; days before the first full window
 * are omitted. Bounded −1…1.
 */
export function rollingCorrelation(
  a: SeriesPoint[],
  b: SeriesPoint[],
  window = 90
): SeriesPoint[] {
  const ra = new Map(dailyReturns(a).map((p) => [p.d, p.r]));
  const rb = new Map(dailyReturns(b).map((p) => [p.d, p.r]));
  const shared = [...ra.keys()].filter((d) => rb.has(d)).sort();
  if (shared.length < window) return [];

  const out: SeriesPoint[] = [];
  for (let i = window - 1; i < shared.length; i++) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let j = i - window + 1; j <= i; j++) {
      xs.push(ra.get(shared[j])!);
      ys.push(rb.get(shared[j])!);
    }
    out.push({ d: shared[i], v: pearson(xs, ys) });
  }
  return out;
}

/**
 * Seasonal anomaly: each value minus the mean of its calendar day
 * (month-day) across the whole series. Oscillates around 0.
 */
export function seasonalAnomaly(points: SeriesPoint[]): SeriesPoint[] {
  const sums = new Map<string, { sum: number; n: number }>();
  for (const p of points) {
    const key = p.d.slice(5); // MM-DD
    const cur = sums.get(key) ?? { sum: 0, n: 0 };
    cur.sum += p.v;
    cur.n += 1;
    sums.set(key, cur);
  }
  return points.map((p) => {
    const c = sums.get(p.d.slice(5))!;
    return { d: p.d, v: p.v - c.sum / c.n };
  });
}

/**
 * Simple moving average over the trailing `days` values (partial window at the
 * series start). Display smoothing only — statistics use the raw series.
 */
export function movingAverage(points: SeriesPoint[], days: number): SeriesPoint[] {
  if (days <= 1) return points;
  const out: SeriesPoint[] = [];
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    sum += points[i].v;
    if (i >= days) sum -= points[i - days].v;
    const w = Math.min(i + 1, days);
    out.push({ d: points[i].d, v: sum / w });
  }
  return out;
}

/* ---- Event overlay stats ---- */

const EVENT_WINDOW_DAYS = 180;
const NEAR_TOP_PCT = 0.95; // within 5% of trailing 180d high
const NEAR_BOTTOM_PCT = 1.05; // within 5% of trailing 180d low
const FWD_DAYS = 90;

export interface EventStatRow {
  d: string;
  label: string;
  nearTop: boolean;
  nearBottom: boolean;
  /** 90-day forward return, null if fewer than 90 days of data follow */
  fwd90: number | null;
}

export interface EventSetStats {
  rows: EventStatRow[];
  /** fraction of all days (with >=180d history) within 5% of the trailing 180d high */
  baseTopRate: number;
  /** same for the trailing 180d low */
  baseBottomRate: number;
  /** median 90-day forward return across events with enough future data (null if none) */
  medianFwd90: number | null;
  /** median 90-day forward return across all days */
  allMedianFwd90: number;
}

function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

/**
 * For each event date: was BTC near a trailing-180-day extreme, and what did
 * it do over the next 90 days — compared against the base rate / median of
 * any random day. Events before the series start are skipped; an event with
 * no exact price date uses the next available day.
 */
export function eventStats(
  points: SeriesPoint[],
  events: { d: string; label: string }[]
): EventSetStats {
  const n = points.length;
  const dateIndex = new Map(points.map((p, i) => [p.d, i]));

  // Precompute trailing-180d high/low flags and 90d forward returns for all days.
  const topFlag = new Array<boolean>(n).fill(false);
  const bottomFlag = new Array<boolean>(n).fill(false);
  const fwd = new Array<number | null>(n).fill(null);
  for (let i = 0; i < n; i++) {
    if (i >= EVENT_WINDOW_DAYS) {
      let hi = -Infinity;
      let lo = Infinity;
      for (let j = i - EVENT_WINDOW_DAYS; j <= i; j++) {
        if (points[j].v > hi) hi = points[j].v;
        if (points[j].v < lo) lo = points[j].v;
      }
      topFlag[i] = points[i].v >= NEAR_TOP_PCT * hi;
      bottomFlag[i] = points[i].v <= NEAR_BOTTOM_PCT * lo;
    }
    if (i + FWD_DAYS < n) fwd[i] = points[i + FWD_DAYS].v / points[i].v - 1;
  }

  const base = points.slice(EVENT_WINDOW_DAYS);
  const baseTopRate = base.filter((_, k) => topFlag[k + EVENT_WINDOW_DAYS]).length / base.length;
  const baseBottomRate =
    base.filter((_, k) => bottomFlag[k + EVENT_WINDOW_DAYS]).length / base.length;
  const allMedianFwd90 = median(fwd.filter((x): x is number => x !== null));

  const rows: EventStatRow[] = [];
  for (const e of events) {
    let i = dateIndex.get(e.d);
    if (i === undefined) {
      // fall forward to the next trading day with data
      i = points.findIndex((p) => p.d >= e.d);
      if (i === -1) continue; // event beyond data end
    }
    rows.push({ d: points[i].d, label: e.label, nearTop: topFlag[i], nearBottom: bottomFlag[i], fwd90: fwd[i] });
  }

  const fwdEvents = rows.map((r) => r.fwd90).filter((x): x is number => x !== null);
  return {
    rows,
    baseTopRate,
    baseBottomRate,
    medianFwd90: fwdEvents.length > 0 ? median(fwdEvents) : null,
    allMedianFwd90,
  };
}
