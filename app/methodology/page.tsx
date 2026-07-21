import type { Metadata } from 'next';
import { loadCharts, loadSeries } from '@/lib/data';
import type { Series } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Methodology — Macro Lab',
};

function lastDate(series: Series): string {
  return series.points[series.points.length - 1]?.d ?? '—';
}

export default function Methodology() {
  const chartSeries = loadCharts().map((chart) => ({
    chart,
    series: [loadSeries(chart.primarySeriesId), loadSeries(chart.overlaySeriesId)],
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Methodology</h1>
      <p className="mt-2 text-sm text-muted">
        How the numbers on this site are produced, and why you shouldn&rsquo;t trade on them.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Data sources</h2>
        <p className="mt-2 text-sm text-muted">
          Bitcoin itself blends Binance daily closes (2017-08-17 onward) with a one-time
          blockchain.info backfill (2010-08 → 2017). Everything else is listed below, generated
          from the actual data files at build time — add a chart and it lists itself.
        </p>
        <div className="mt-4 border-b border-line">
          {chartSeries.map(({ chart, series }) => (
            <div key={chart.slug} className="border-t border-line px-2 py-4">
              <p className="text-sm font-medium">{chart.title}</p>
              {series.map((s) => (
                <div
                  key={s.id}
                  className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted"
                >
                  <span className="text-paper">{s.name}</span>
                  <span>{s.source}</span>
                  <span>
                    {s.cadence} · {s.unit}
                  </span>
                  <span className="numbers font-mono">
                    {s.points.length.toLocaleString('en-US')} points · through {lastDate(s)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          No API keys, no adjustments beyond what the venues publish, no fabricated rows: if a
          fetch fails, the stale file stays and the failure is recorded in{' '}
          <code>data/status.json</code>.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Correlation on daily returns</h2>
        <p className="mt-2 text-sm text-muted">
          We never correlate price levels — two trending lines will look &ldquo;correlated&rdquo; no
          matter what they measure. Instead, each series is converted to daily percentage returns,
          the two return series are inner-joined on date (only days where both have data count), and
          we compute the Pearson correlation coefficient r over those overlapping returns.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">The verdicts</h2>
        <ul className="mt-2 space-y-2 text-sm text-muted">
          <li>
            <span className="font-mono text-emerald-400">SIGNAL</span> — |r| ≥ 0.6. Strong
            co-movement. Still not necessarily causation, but worth a second look.
          </li>
          <li>
            <span className="font-mono text-amber-400">SPURIOUS</span> — 0.3 ≤ |r| &lt; 0.6. The
            classic zone of coincidence with good marketing.
          </li>
          <li>
            <span className="font-mono text-purple-400">ENTERTAINMENT</span> — |r| &lt; 0.3. There
            is nothing here. Enjoy the chart anyway.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">How the charts are drawn</h2>
        <p className="mt-2 text-sm text-muted">
          Each chart declares its own display rules. Earthquakes and hurricanes are drawn as
          markers along the BTC price (M7+/M8+ quakes, category 3–5 hurricanes at peak intensity),
          while their correlations run against 7-day rolling counts (raw
          daily counts are mostly zeros, which would quietly shrink the return overlap).
          Count and percentage overlays — quakes, sunspots, moon — stay on a linear axis even
          when log scale is on, because zeros and logarithms do not mix. This is all
          display-only: every statistic on the site is computed from the raw daily files,
          because smoothing before correlating would manufacture agreement that is not there.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Event markers</h2>
        <p className="mt-2 text-sm text-muted">
          The <code>/events</code> page overlays static event dates — World Cup finals, US
          presidential elections and Summer Olympics opening ceremonies — on the BTC price. These are historical facts, not data feeds; there is
          nothing to maintain. For each event we report two honest numbers: whether BTC closed
          within 5% of its trailing 180-day high (a &ldquo;top&rdquo;) or low (a
          &ldquo;bottom&rdquo;) on the event day, and the median 90-day forward return after events
          — each compared against the base rate or median across all days. With four or five events
          per set, no conclusion is statistically possible, and the strips say so.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Honest labeling</h2>
        <p className="mt-2 text-sm text-muted">
          These pairs were chosen because they are amusing, not because they are predictive. With
          enough candidate series, some will correlate by pure chance, and nothing here accounts for
          multiple testing, regime changes, or survivorship. Macro Lab is observation, not
          alpha.
        </p>
      </section>
    </div>
  );
}
