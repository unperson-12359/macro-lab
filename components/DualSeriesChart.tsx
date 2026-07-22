'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ColorType,
  createChart,
  PriceScaleMode,
  type IChartApi,
  type ISeriesApi,
  type SeriesMarker,
  type Time,
} from 'lightweight-charts';
import type { ChartPoint } from '@/lib/types';

export interface PrimaryMarker {
  d: string;
  label?: string;
  color: string;
}

interface Props {
  primary: ChartPoint[];
  primaryLabel: string;
  /** Omit both to render the primary series alone (marker mode). */
  overlay?: ChartPoint[];
  overlayLabel?: string;
  /** false keeps the overlay on a linear scale even when log is on (counts, percents). */
  overlayLog?: boolean;
  /** Occurrence markers drawn on the primary series. */
  primaryMarkers?: PrimaryMarker[];
}

const AXIS = {
  borderColor: '#1f1f1f',
  textColor: '#8a8a8a',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 11,
};

const TIMEFRAMES = [
  { id: '1Y', years: 1 },
  { id: '5Y', years: 5 },
  { id: '10Y', years: 10 },
  { id: 'Max', years: null },
] as const;

type TimeframeId = (typeof TIMEFRAMES)[number]['id'];

const CONTROL_BTN =
  'rounded-full border px-3.5 py-1.5 font-mono text-xs font-medium transition-colors';
const CONTROL_ACTIVE = 'border-[#f7931a]/60 text-[#f7931a]';
const CONTROL_IDLE = 'border-line text-muted hover:border-[#333333] hover:text-paper';

export default function DualSeriesChart({ primary, overlay, primaryLabel, overlayLabel, overlayLog = true, primaryMarkers = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const primarySeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeId>('10Y');
  const [logScale, setLogScale] = useState(true);
  // Bumped by the reset button to force the effects to re-apply even when the
  // state values are unchanged (manual pan/zoom doesn't touch React state).
  const [resetTick, setResetTick] = useState(0);

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
      rightPriceScale: { borderColor: AXIS.borderColor, visible: !!overlay, mode: overlayLog ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal },
      leftPriceScale: { borderColor: AXIS.borderColor, visible: true, mode: PriceScaleMode.Logarithmic },
      timeScale: { borderColor: AXIS.borderColor, timeVisible: false, minBarSpacing: 0.01 },
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
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });
    primarySeries.setData(primary);
    primarySeriesRef.current = primarySeries;

    if (overlay) {
      const overlaySeries = chart.addLineSeries({
        color: '#7dd3fc',
        lineWidth: overlayLog ? 2 : 1,
        priceScaleId: 'right',
        title: overlayLabel,
        priceFormat: { type: 'price', precision: 1, minMove: 0.1 },
      });
      overlaySeries.setData(overlay);
    }

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
      primarySeriesRef.current = null;
    };
    // Data is static build-time JSON; mount once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply timeframe by setting the visible time range; data stays loaded.
  // Also recenters both price scales (undoes manual vertical stretch).
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || primary.length === 0) return;
    chart.priceScale('left').applyOptions({ autoScale: true });
    chart.priceScale('right').applyOptions({ autoScale: true });
    const tf = TIMEFRAMES.find((t) => t.id === timeframe);
    if (!tf || tf.years === null) {
      chart.timeScale().fitContent();
      return;
    }
    const to = primary[primary.length - 1].time as Time;
    const fromDate = new Date(`${primary[primary.length - 1].time}T00:00:00Z`);
    fromDate.setUTCFullYear(fromDate.getUTCFullYear() - tf.years);
    const from = fromDate.toISOString().slice(0, 10) as Time;
    chart.timeScale().setVisibleRange({ from, to });
  }, [timeframe, primary, resetTick]);

  // Apply price-scale mode to both axes. The overlay stays linear when the
  // chart config opts out of log (counts and percents distort under log).
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.priceScale('left').applyOptions({
      mode: logScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
    });
    chart.priceScale('right').applyOptions({
      mode: logScale && overlayLog ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
    });
  }, [logScale, overlayLog, resetTick]);

  // Occurrence markers on the primary series (e.g. earthquakes along BTC).
  useEffect(() => {
    const series = primarySeriesRef.current;
    if (!series) return;
    const markers: SeriesMarker<Time>[] = primaryMarkers
      .map((m) => ({
        time: m.d as Time,
        position: 'aboveBar' as const,
        color: m.color,
        shape: 'circle' as const,
        ...(m.label ? { text: m.label } : {}),
      }))
      .sort((a, b) => (a.time < b.time ? -1 : 1));
    series.setMarkers(markers);
  }, [primaryMarkers]);

  function resetView() {
    setTimeframe('10Y');
    setLogScale(true);
    setResetTick((t) => t + 1);
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-6 font-mono text-xs text-muted">
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#f7931a]" />
            {primaryLabel} (left)
          </span>
          {overlay && (
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#7dd3fc]" />
              {overlayLabel} (right)
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframe(tf.id)}
                className={`${CONTROL_BTN} ${timeframe === tf.id ? CONTROL_ACTIVE : CONTROL_IDLE}`}
              >
                {tf.id}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLogScale((v) => !v)}
            className={`${CONTROL_BTN} ${logScale ? CONTROL_ACTIVE : CONTROL_IDLE}`}
            title="Toggle logarithmic price scale"
          >
            log
          </button>
          <button
            type="button"
            onClick={resetView}
            className={`${CONTROL_BTN} ${CONTROL_IDLE}`}
            title="Reset to the default view (10Y, log scale, centered)"
          >
            reset
          </button>
        </div>
      </div>
      <div ref={containerRef} className="h-[420px] w-full" data-testid="dual-series-chart" />
    </div>
  );
}
