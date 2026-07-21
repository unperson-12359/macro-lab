import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ChartCard from '@/components/ChartCard';
import Pager from '@/components/Pager';
import { buildChartCards, paginate, totalPages } from '@/lib/cards';

interface Props {
  params: { page: string };
}

export function generateStaticParams() {
  const pages = totalPages(buildChartCards().length);
  // Page 1 is /charts; this route covers 2..N.
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ page: String(i + 2) }));
}

export const metadata: Metadata = {
  title: 'Charts — Macro Lab',
};

export default function ChartsPageN({ params }: Props) {
  const page = Number(params.page);
  const cards = buildChartCards();
  const pages = totalPages(cards.length);
  if (!Number.isInteger(page) || page < 2 || page > pages) notFound();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Charts</h1>
        <p className="mt-2 font-mono text-sm text-muted numbers">
          page {page} of {pages}
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {paginate(cards, page).map(({ chart, verdict, points, lastUpdated }) => (
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
      <Pager basePath="/charts" page={page} totalPages={pages} />
    </div>
  );
}
