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
import type { ChartPoint, EventSet } from '@/lib/types';

interface Props {
  primary: ChartPoint[];
  primaryLabel: string;
  eventSets: EventSet[];
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
  'rounded-full border px-3.5 py-1.5 font-mono text-xs font-medium transition-all active:scale-95';
const CONTROL_ACTIVE = 'border-[#f7931a]/60 text-[#f7931a]';
const CONTROL_IDLE = 'border-line text-muted hover:border-[#333333] hover:text-paper';

export default function EventChart({ primary, primaryLabel, eventSets }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const primarySeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeId>('Max');
  const [logScale, setLogScale] = useState(false);
  // Bumped by the reset button to force the effects to re-apply even when the
  // state values are unchanged (manual pan/zoom doesn't touch React state).
  const [resetTick, setResetTick] = useState(0);
  const [activeSets, setActiveSets] = useState<string[]>(eventSets.map((s) => s.id));

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
      rightPriceScale: { borderColor: AXIS.borderColor, mode: PriceScaleMode.Normal },
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
      priceScaleId: 'right',
      title: primaryLabel,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });
    primarySeries.setData(primary);
    primarySeriesRef.current = primarySeries;

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
  // Also recenters the price scale (undoes manual vertical stretch).
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || primary.length === 0) return;
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

  // Apply price-scale mode.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart
      .priceScale('right')
      .applyOptions({ mode: logScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal });
  }, [logScale, resetTick]);

  // Draw markers for the toggled event sets on the BTC series.
  useEffect(() => {
    const series = primarySeriesRef.current;
    if (!series) return;
    if (primary.length === 0) {
      series.setMarkers([]);
      return;
    }
    const first = primary[0].time;
    const last = primary[primary.length - 1].time;
    const markers: SeriesMarker<Time>[] = eventSets
      .filter((s) => activeSets.includes(s.id))
      .flatMap((s) =>
        s.events
          .filter((e) => e.d >= first && e.d <= last)
          .map((e) => ({
            time: e.d as Time,
            position: 'aboveBar' as const,
            color: s.color,
            shape: 'arrowDown' as const,
            text: e.label,
          }))
      )
      .sort((a, b) => (a.time < b.time ? -1 : 1));
    series.setMarkers(markers);
  }, [activeSets, eventSets, primary]);

  function toggleSet(id: string) {
    setActiveSets((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));
  }

  function resetView() {
    setTimeframe('Max');
    setLogScale(false);
    setActiveSets(eventSets.map((s) => s.id));
    setResetTick((t) => t + 1);
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {eventSets.map((s) => {
            const active = activeSets.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSet(s.id)}
                className={`${CONTROL_BTN} ${active ? CONTROL_ACTIVE : CONTROL_IDLE}`}
                title={`Overlay ${s.name} on the chart`}
              >
                <span
                  className="mr-1 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </button>
            );
          })}
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
            title="Reset to the default view (Max, linear scale, all events on)"
          >
            reset
          </button>
        </div>
      </div>
      <div ref={containerRef} className="h-[480px] w-full" data-testid="event-chart" />
    </div>
  );
}
