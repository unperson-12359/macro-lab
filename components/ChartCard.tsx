'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ColorType, createChart } from 'lightweight-charts';
import VerdictBadge from './VerdictBadge';
import type { ChartPoint, Verdict } from '@/lib/types';

interface Props {
  slug: string;
  title: string;
  subtitle: string;
  oneLiner: string;
  verdict: Verdict;
  points: ChartPoint[];
  lastUpdated: string;
}

export default function ChartCard({
  slug,
  title,
  subtitle,
  oneLiner,
  verdict,
  points,
  lastUpdated,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
      autoSize: true,
    });

    const series = chart.addAreaSeries({
      lineColor: '#f7931a',
      topColor: 'rgba(247, 147, 26, 0.15)',
      bottomColor: 'rgba(247, 147, 26, 0)',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });
    series.setData(points);
    chart.timeScale().fitContent();

    return () => chart.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Link
      href={`/charts/${slug}`}
      className="block min-w-0 rounded-lg border border-line bg-[#111111] p-4 transition-colors hover:border-[#333333]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          <p className="mt-0.5 truncate text-xs text-muted" title={subtitle}>
            {subtitle}
          </p>
        </div>
        <VerdictBadge verdict={verdict} />
      </div>
      <div ref={containerRef} className="mt-3 h-20 w-full" data-testid="chart-card-sparkline" />
      <p className="mt-2 truncate text-xs italic text-muted" title={oneLiner}>
        {oneLiner}
      </p>
      <p className="mt-1.5 font-mono text-[11px] text-muted numbers">
        updated <time dateTime={lastUpdated}>{lastUpdated}</time>
      </p>
    </Link>
  );
}
