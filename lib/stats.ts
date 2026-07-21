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
