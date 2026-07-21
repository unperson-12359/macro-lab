import type { Metadata } from 'next';
import ChartCard from '@/components/ChartCard';
import { loadCharts, loadSeries, loadStatus } from '@/lib/data';
import { correlationOnReturns, toChartPoints, verdictFromR } from '@/lib/stats';
import type { ChartPoint } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Charts — Macro Lab',
};

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

export default function ChartsPage() {
  const status = loadStatus();
  const cards = loadCharts().map((chart) => {
    const primary = loadSeries(chart.primarySeriesId);
    const overlay = loadSeries(chart.overlaySeriesId);
    const { r } = correlationOnReturns(primary.points, overlay.points);
    return {
      chart,
      verdict: verdictFromR(r),
      points: downsample(toChartPoints(primary.points)),
      lastUpdated: primary.points[primary.points.length - 1]?.d ?? 'unknown',
    };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Charts</h1>
        <p className="mt-2 text-sm text-muted">
          Each chart pairs BTC with something it probably shouldn&rsquo;t predict. We compute the
          correlation on daily returns and tell you what it&rsquo;s worth. Data updated{' '}
          <time dateTime={status.updatedAt} className="numbers">
            {status.updatedAt.slice(0, 10)}
          </time>
          .
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {cards.map(({ chart, verdict, points, lastUpdated }) => (
          <ChartCard
            key={chart.slug}
            slug={chart.slug}
            title={chart.title}
            subtitle={chart.subtitle}
            oneLiner={chart.oneLiner}
            verdict={verdict}
            points={points}
            lastUpdated={lastUpdated}
          />
        ))}
      </div>
    </div>
  );
}
