export interface SeriesPoint {
  /** ISO date, YYYY-MM-DD */
  d: string;
  v: number;
}

export interface Series {
  id: string;
  name: string;
  unit: string;
  source: string;
  sourceUrl: string;
  cadence: string;
  points: SeriesPoint[];
}

export interface ChartConfig {
  slug: string;
  title: string;
  subtitle: string;
  primarySeriesId: string;
  overlaySeriesId: string;
  oneLiner: string;
  /** 2–4 sentences shown in the "About this pairing" section on the detail page. */
  explanation: string;
  /** Catalog grouping: goods = things humans buy, markets = financial instruments, nature = things the universe does. */
  category: 'goods' | 'markets' | 'nature';
  /** Display-only hints; statistics always use the raw series. */
  display?: {
    /** moving-average window (days) for drawing the overlay */
    overlaySmaDays?: number;
    /** false keeps the overlay linear even when log scale is on (default true) */
    overlayLog?: boolean;
    /** 'markers' drops the overlay line and plots occurrences on the primary line */
    overlayMode?: 'markers';
    /** oscillator view: rolling 90d correlation chart, or seasonal-anomaly overlay */
    mode?: 'rolling-corr' | 'seasonal-anomaly';
  };
}

export interface SourceStatus {
  ok: boolean;
  source: string;
  sourceUrl: string;
  points: number;
  lastPoint: string | null;
  error?: string;
}

export interface StatusFile {
  updatedAt: string;
  sources: Record<string, SourceStatus>;
}

export type Verdict = 'SIGNAL' | 'SPURIOUS' | 'ENTERTAINMENT';

export interface EventMarker {
  /** ISO date, YYYY-MM-DD */
  d: string;
  label: string;
}

export interface EventSet {
  id: string;
  name: string;
  /** marker color, hex */
  color: string;
  events: EventMarker[];
}

export interface ChartPoint {
  time: string;
  value: number;
}
