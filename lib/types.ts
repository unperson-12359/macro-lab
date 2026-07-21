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

export interface ChartPoint {
  time: string;
  value: number;
}
