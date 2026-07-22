import type { Metadata } from 'next';
import EventChart from '@/components/EventChart';
import { eventSets } from '@/events.config';
import { loadSeries } from '@/lib/data';
import { eventStats, toChartPoints } from '@/lib/stats';

export const metadata: Metadata = {
  title: 'Events — Macro Lab',
};

function pct(x: number): string {
  return `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;
}

export default function EventsPage() {
  const btc = loadSeries('btc-usd');
  const setStats = eventSets.map((s) => ({ set: s, stats: eventStats(btc.points, s.events) }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl">BTC vs Events</h1>
        <p className="mt-1 text-sm text-muted">
          World Cup finals, US elections and Olympics, dropped on the Bitcoin price. Did they mark
          tops or bottoms? We counted — the answer is below the chart, and it is &ldquo;no&rdquo;.
        </p>
      </div>

      <EventChart
        primary={toChartPoints(btc.points)}
        primaryLabel={btc.name}
        eventSets={eventSets}
      />

      <div className="mt-6 space-y-3">
        {setStats.map(({ set, stats }) => {
          const tops = stats.rows.filter((r) => r.nearTop).length;
          const bottoms = stats.rows.filter((r) => r.nearBottom).length;
          return (
            <div key={set.id} className="rounded-2xl border border-line bg-[#111111] p-4 transition-colors hover:border-[#333333] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              <p className="text-sm">
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: set.color }}
                />
                <span className="font-display">{set.name}</span>{' '}
                <span className="font-mono text-xs text-muted numbers">(n={stats.rows.length})</span>
              </p>
              <p className="mt-2 font-mono text-xs text-muted numbers">
                {tops} near a 180-day top vs {(stats.baseTopRate * 100).toFixed(0)}% of all days ·{' '}
                {bottoms} near a bottom vs {(stats.baseBottomRate * 100).toFixed(0)}% · median +90d{' '}
                {stats.medianFwd90 !== null ? pct(stats.medianFwd90) : 'n/a'} vs{' '}
                {pct(stats.allMedianFwd90)} any day
              </p>
              <p className="mt-2 text-xs italic text-muted">
                n is tiny — this proves nothing, which is the point.
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-6 max-w-2xl text-xs text-muted">
        An event counts as &ldquo;near a top&rdquo; when BTC closes within 5% of its trailing
        180-day high on the event day (mirror image for bottoms). The comparison is the honest
        part: any random day has a {(setStats[0].stats.baseTopRate * 100).toFixed(0)}% chance of
        being near a top anyway. Observation, not alpha.
      </p>
    </div>
  );
}
