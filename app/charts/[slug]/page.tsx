import { notFound } from 'next/navigation';
import Link from 'next/link';
import DualSeriesChart from '@/components/DualSeriesChart';
import OscillatorChart from '@/components/OscillatorChart';
import { loadCharts, loadSeries } from '@/lib/data';
import { loadMarkersForChart } from '@/lib/markers';
import {
  correlationOnReturns,
  movingAverage,
  rollingCorrelation,
  seasonalAnomaly,
  toChartPoints,
} from '@/lib/stats';

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

  const primaryLast = primary.points[primary.points.length - 1]?.d ?? '—';
  const overlayLast = overlay.points[overlay.points.length - 1]?.d ?? '—';

  // Display-only transforms; stats above use the raw series.
  const mode = chart.display?.mode;
  const smaDays = chart.display?.overlaySmaDays;
  let overlayDisplay = smaDays ? movingAverage(overlay.points, smaDays) : overlay.points;
  let overlayLabel = smaDays ? `${overlay.name} · ${smaDays}-day avg` : overlay.name;
  if (mode === 'seasonal-anomaly') {
    overlayDisplay = seasonalAnomaly(overlay.points);
    overlayLabel = `${overlay.name} · anomaly`;
  }
  const rolling = mode === 'rolling-corr' ? rollingCorrelation(primary.points, overlay.points) : null;
  const markerMode = chart.display?.overlayMode === 'markers';
  const markerData = markerMode ? loadMarkersForChart(chart.slug) : null;

  const all = loadCharts();
  const idx = all.findIndex((c) => c.slug === chart.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl">{chart.title}</h1>
        <p className="mt-1 text-sm text-muted">{chart.subtitle}</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-2xl border border-line bg-gradient-to-b from-[#141414] to-[#0d0d0d] p-5 sm:grid-cols-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted">correlation r</p>
          <p className="mt-1 font-display text-2xl text-paper numbers">{r.toFixed(3)}</p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted">overlap days</p>
          <p className="mt-1 font-display text-2xl text-paper numbers">{n}</p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted">{primary.name} through</p>
          <p className="mt-1 font-display text-2xl text-paper numbers">{primaryLast}</p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-muted">{overlay.name} through</p>
          <p className="mt-1 font-display text-2xl text-paper numbers">{overlayLast}</p>
        </div>
      </div>

      {rolling ? (
        <>
          <OscillatorChart
            primary={toChartPoints(primary.points)}
            primaryLabel={primary.name}
            oscillator={toChartPoints(rolling)}
            oscillatorLabel={`90-day rolling r vs ${overlay.name}`}
          />
          <p className="mt-2 font-mono text-xs text-muted">
            <span className="mr-1 inline-block h-2 w-px bg-[#fbbf24]" /> ±0.3 spurious zone ·{' '}
            <span className="mr-1 inline-block h-2 w-px bg-[#34d399]" /> ±0.6 signal zone — how the
            coupling moves over time; the headline r above is the full-window number.
          </p>
        </>
      ) : (
        <DualSeriesChart
          primary={toChartPoints(primary.points)}
          primaryLabel={primary.name}
          overlay={markerMode ? undefined : toChartPoints(overlayDisplay)}
          overlayLabel={overlayLabel}
          overlayLog={chart.display?.overlayLog ?? true}
          primaryMarkers={markerData?.markers}
        />
      )}

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

      <section className="mt-8 max-w-2xl">
        <h2 className="font-display text-sm">About this pairing</h2>
        <p className="mt-2 text-sm text-muted">{chart.explanation}</p>
      </section>

      <nav aria-label="More charts" className="mt-14 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        {prev ? (
          <Link rel="prev" href={`/charts/${prev.slug}`} className="group rounded-full border border-line px-4 py-2 text-sm text-muted transition-all hover:border-[#f7931a]/60 hover:text-paper active:scale-95">
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
          <Link rel="next" href={`/charts/${next.slug}`} className="group rounded-full border border-line px-4 py-2 text-sm text-muted transition-all hover:border-[#f7931a]/60 hover:text-paper active:scale-95 sm:text-right">
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
