import { loadCharts, loadSeries } from './data';
import { correlationOnReturns, toChartPoints, verdictFromR } from './stats';
import type { ChartConfig, ChartPoint, Verdict } from './types';

export const CHARTS_PAGE_SIZE = 6;

export interface ChartCardData {
  chart: ChartConfig;
  r: number;
  verdict: Verdict;
  points: ChartPoint[];
  lastUpdated: string;
}

/** Thin a series to at most `max` evenly spaced points for sparklines. */
function downsample(points: ChartPoint[], max = 200): ChartPoint[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const out: ChartPoint[] = [];
  for (let i = 0; i < max; i++) {
    out.push(points[Math.round(i * step)]);
  }
  return out;
}

/** Everything the catalog grid / homepage readings need, computed once. */
export function buildChartCards(): ChartCardData[] {
  return loadCharts().map((chart) => {
    const primary = loadSeries(chart.primarySeriesId);
    const overlay = loadSeries(chart.overlaySeriesId);
    const { r } = correlationOnReturns(primary.points, overlay.points);
    return {
      chart,
      r,
      verdict: verdictFromR(r),
      points: downsample(toChartPoints(primary.points)),
      lastUpdated: primary.points[primary.points.length - 1]?.d ?? 'unknown',
    };
  });
}

export function paginate<T>(items: T[], page: number, size = CHARTS_PAGE_SIZE): T[] {
  return items.slice((page - 1) * size, page * size);
}

export function totalPages(count: number, size = CHARTS_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(count / size));
}
