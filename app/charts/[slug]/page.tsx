import { notFound } from 'next/navigation';
import Link from 'next/link';
import DualSeriesChart from '@/components/DualSeriesChart';
import VerdictBadge from '@/components/VerdictBadge';
import { loadCharts, loadSeries } from '@/lib/data';
import { loadMarkersForChart } from '@/lib/markers';
import { correlationOnReturns, movingAverage, toChartPoints, verdictFromR } from '@/lib/stats';

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return loadCharts().map((chart) => ({ slug: chart.slug }));
}

export default function ChartPage({ params }: Props) {
  const chart = loadCharts().find((c) => c.slug === params.slug);
  if (!chart) notFound();

  const primary = loadSeries(chart.primarySeriesId);
  const overlay = loadSeries(chart.overlaySeriesId);
  const { r, n } = correlationOnReturns(primary.points, overlay.points);
  const verdict = verdictFromR(r);

  const primaryLast = primary.points[primary.points.length - 1]?.d ?? '—';
  const overlayLast = overlay.points[overlay.points.length - 1]?.d ?? '—';

  // Display-only smoothing for noisy overlays; stats above use the raw series.
  const smaDays = chart.display?.overlaySmaDays;
  const overlayDisplay = smaDays ? movingAverage(overlay.points, smaDays) : overlay.points;
  const overlayLabel = smaDays ? `${overlay.name} · ${smaDays}-day avg` : overlay.name;
  const markerMode = chart.display?.overlayMode === 'markers';
  const markerData = markerMode ? loadMarkersForChart(chart.slug) : null;

  const all = loadCharts();
  const idx = all.findIndex((c) => c.slug === chart.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{chart.title}</h1>
          <p className="mt-1 text-sm text-muted">{chart.subtitle}</p>
        </div>
        <VerdictBadge verdict={verdict} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 font-mono text-xs text-muted sm:grid-cols-4">
        <div>
          <p className="uppercase tracking-wider">correlation r</p>
          <p className="mt-1 text-base text-paper numbers">{r.toFixed(3)}</p>
        </div>
        <div>
          <p className="uppercase tracking-wider">overlap days</p>
          <p className="mt-1 text-base text-paper numbers">{n}</p>
        </div>
        <div>
          <p className="uppercase tracking-wider">{primary.name} through</p>
          <p className="mt-1 text-base text-paper numbers">{primaryLast}</p>
        </div>
        <div>
          <p className="uppercase tracking-wider">{overlay.name} through</p>
          <p className="mt-1 text-base text-paper numbers">{overlayLast}</p>
        </div>
      </div>

      <DualSeriesChart
        primary={toChartPoints(primary.points)}
        primaryLabel={primary.name}
        overlay={markerMode ? undefined : toChartPoints(overlayDisplay)}
        overlayLabel={overlayLabel}
        overlayLog={chart.display?.overlayLog ?? true}
        primaryMarkers={markerData?.markers}
      />

      {markerData && (
        <p className="mt-2 font-mono text-xs text-muted">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#fbbf24]" />
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ef4444]" />
          {markerData.legend}
        </p>
      )}

      <p className="mt-6 text-sm italic text-muted">{chart.oneLiner}</p>
      <p className="mt-4 max-w-2xl text-xs text-muted">
        Correlation is computed on daily returns over the {n} days where both series have data. Two
        lines moving together proves nothing about causation, and a high r on a hand-picked pair is
        usually a coincidence with good marketing. Observation, not alpha.
      </p>

      <section className="mt-6 max-w-2xl border-t border-line pt-4">
        <h2 className="text-sm font-semibold">About this pairing</h2>
        <p className="mt-2 text-sm text-muted">{chart.explanation}</p>
      </section>

      <nav aria-label="More charts" className="mt-12 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-baseline sm:justify-between">
        {prev ? (
          <Link rel="prev" href={`/charts/${prev.slug}`} className="group text-sm text-muted">
            <span className="font-mono text-xs uppercase tracking-widest">Previous</span>
            <span className="mt-1 block text-paper">
              <span className="inline-block transition-transform duration-150 group-hover:-translate-x-1">←</span>{' '}
              {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link rel="next" href={`/charts/${next.slug}`} className="group text-sm text-muted sm:text-right">
            <span className="font-mono text-xs uppercase tracking-widest">Next</span>
            <span className="mt-1 block text-paper">
              {next.title}{' '}
              <span className="inline-block transition-transform duration-150 group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
