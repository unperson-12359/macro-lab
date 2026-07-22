import type { Metadata } from 'next';
import { Suspense } from 'react';
import CatalogGrid from '@/components/CatalogGrid';
import { buildChartCards } from '@/lib/cards';
import { loadStatus } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Charts — Macro Lab',
};

export default function ChartsPage() {
  const status = loadStatus();
  const cards = buildChartCards();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl">Charts</h1>
        <p className="mt-2 text-sm text-muted">
          Each chart pairs BTC with something it probably shouldn&rsquo;t predict. We compute the
          correlation on daily returns and tell you what it&rsquo;s worth. Data updated{' '}
          <time dateTime={status.updatedAt} className="numbers">
            {status.updatedAt.slice(0, 10)}
          </time>
          .
        </p>
      </div>
      <Suspense>
        <CatalogGrid cards={cards} />
      </Suspense>
    </div>
  );
}
