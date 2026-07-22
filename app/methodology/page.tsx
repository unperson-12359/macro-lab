import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology — Macro Lab',
};

export default function Methodology() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl">Methodology</h1>
      <p className="mt-2 text-sm text-muted">
        How the numbers on this site are produced, and why you shouldn&rsquo;t trade on them.
      </p>

      <hr className="divider-glow mt-8" />

      <section className="mt-8">
        <h2 className="font-display text-lg">Data</h2>
        <p className="mt-2 text-sm text-muted">
          Everything comes from free public endpoints — exchange APIs, market-data APIs, and
          government or scientific agencies (USGS, NOAA, SILSO and the like). No API keys, no
          scraping, daily cadence, merged latest-wins into plain JSON files checked into the
          repo. If a fetch fails, the stale file stays and the failure is recorded in{' '}
          <code>data/status.json</code> — nothing is ever fabricated to fill a gap. Bitcoin
          itself blends exchange daily closes (2017 onward) with a one-time public backfill
          reaching 2010. What each chart pairs with what is documented on the chart&rsquo;s own
          page, not here.
        </p>
      </section>

      <hr className="divider-glow mt-8" />

      <section className="mt-8">
        <h2 className="font-display text-lg">Correlation on daily returns</h2>
        <p className="mt-2 text-sm text-muted">
          We never correlate price levels — two trending lines will look &ldquo;correlated&rdquo; no
          matter what they measure. Instead, each series is converted to daily percentage returns,
          the two return series are inner-joined on date (only days where both have data count), and
          we compute the Pearson correlation coefficient r over those overlapping returns.
        </p>
      </section>

      <hr className="divider-glow mt-8" />

      <section className="mt-8">
        <h2 className="font-display text-lg">The verdicts</h2>
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

      <hr className="divider-glow mt-8" />

      <section className="mt-8">
        <h2 className="font-display text-lg">How the charts are drawn</h2>
        <p className="mt-2 text-sm text-muted">
          Each chart declares its own display rules. Some charts draw individual occurrences as
          markers along the BTC price, while their correlations run against a rolling count of
          those occurrences (raw daily counts are mostly zeros, which would quietly shrink the
          return overlap). Count and percentage overlays stay on a linear axis even when log
          scale is on, because zeros and logarithms do not mix. This is all display-only: every
          statistic on the site is computed from the raw daily files, because smoothing before
          correlating would manufacture agreement that is not there.
        </p>
      </section>

      <hr className="divider-glow mt-8" />

      <section className="mt-8">
        <h2 className="font-display text-lg">Event markers</h2>
        <p className="mt-2 text-sm text-muted">
          The <code>/events</code> page overlays static event dates — sports finals, elections,
          ceremonies, whatever the config file currently holds — on the BTC price. These are
          historical facts, not data feeds; there is nothing to maintain. For each event we report
          two honest numbers: whether BTC closed within 5% of its trailing 180-day high (a
          &ldquo;top&rdquo;) or low (a &ldquo;bottom&rdquo;) on the event day, and the median 90-day
          forward return after events — each compared against the base rate or median across all
          days. With a handful of events per set, no conclusion is statistically possible, and the
          strips say so.
        </p>
      </section>

      <hr className="divider-glow mt-8" />

      <section className="mt-8">
        <h2 className="font-display text-lg">Honest labeling</h2>
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
