import type { Metadata } from 'next';
import ChartCard from '@/components/ChartCard';
import Pager from '@/components/Pager';
import { buildChartCards, paginate, totalPages } from '@/lib/cards';
import { loadStatus } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Charts — Macro Lab',
};

export default function ChartsPage() {
  const status = loadStatus();
  const cards = buildChartCards();

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginate(cards, 1).map(({ chart, verdict, points, lastUpdated }) => (
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
      <Pager basePath="/charts" page={1} totalPages={totalPages(cards.length)} />
    </div>
  );
}
