'use client';

import { useEffect, useRef } from 'react';
import { ColorType, createChart, type IChartApi } from 'lightweight-charts';
import type { ChartPoint } from '@/lib/types';

interface Props {
  primary: ChartPoint[];
  overlay: ChartPoint[];
  primaryLabel: string;
  overlayLabel: string;
}

const AXIS = {
  borderColor: '#1f1f1f',
  textColor: '#8a8a8a',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 11,
};

export default function DualSeriesChart({ primary, overlay, primaryLabel, overlayLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#8a8a8a',
        fontFamily: AXIS.fontFamily,
        fontSize: AXIS.fontSize,
      },
      grid: {
        vertLines: { color: '#141414' },
        horzLines: { color: '#141414' },
      },
      rightPriceScale: { borderColor: AXIS.borderColor },
      leftPriceScale: { borderColor: AXIS.borderColor, visible: true },
      timeScale: { borderColor: AXIS.borderColor, timeVisible: false },
      crosshair: {
        vertLine: { color: '#333333' },
        horzLine: { color: '#333333' },
      },
      autoSize: true,
    });
    chartRef.current = chart;

    const primarySeries = chart.addLineSeries({
      color: '#f7931a',
      lineWidth: 2,
      priceScaleId: 'left',
      title: primaryLabel,
      priceFormat: { type: 'price', precision: 0, minMove: 1 },
    });
    primarySeries.setData(primary);

    const overlaySeries = chart.addLineSeries({
      color: '#7dd3fc',
      lineWidth: 2,
      priceScaleId: 'right',
      title: overlayLabel,
      priceFormat: { type: 'price', precision: 1, minMove: 0.1 },
    });
    overlaySeries.setData(overlay);

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
    // Data is static build-time JSON; mount once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-2 flex gap-6 font-mono text-xs text-muted">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#f7931a]" />
          {primaryLabel} (left)
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#7dd3fc]" />
          {overlayLabel} (right)
        </span>
      </div>
      <div ref={containerRef} className="h-[420px] w-full" data-testid="dual-series-chart" />
    </div>
  );
}
