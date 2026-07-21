import fs from 'node:fs';
import path from 'node:path';
import type { Series, SeriesPoint, SourceStatus, StatusFile } from '../../lib/types';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const SERIES_DIR = path.join(DATA_DIR, 'series');
export const STATUS_PATH = path.join(DATA_DIR, 'status.json');

export function readSeriesFile(filePath: string): Series | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Series;
}

/**
 * Merge incoming points into existing ones: latest-wins per date
 * (incoming overwrites a same-date value), then sort by date.
 * A second same-day run therefore changes zero rows.
 */
export function mergePoints(existing: SeriesPoint[], incoming: SeriesPoint[]): SeriesPoint[] {
  const byDate = new Map<string, number>();
  for (const p of existing) byDate.set(p.d, p.v);
  for (const p of incoming) byDate.set(p.d, p.v);
  return [...byDate.entries()]
    .map(([d, v]) => ({ d, v }))
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
}

export function writeSeriesFile(filePath: string, series: Series): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(series, null, 2) + '\n');
}

export function readStatus(): StatusFile {
  if (!fs.existsSync(STATUS_PATH)) {
    return { updatedAt: new Date(0).toISOString(), sources: {} };
  }
  return JSON.parse(fs.readFileSync(STATUS_PATH, 'utf8')) as StatusFile;
}

/** Merge one source entry into data/status.json. Never throws. */
export function writeStatus(key: string, entry: SourceStatus): void {
  const status = readStatus();
  status.sources[key] = entry;
  status.updatedAt = new Date().toISOString();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2) + '\n');
}

export function statusOk(
  source: string,
  sourceUrl: string,
  points: SeriesPoint[]
): SourceStatus {
  return {
    ok: true,
    source,
    sourceUrl,
    points: points.length,
    lastPoint: points.length > 0 ? points[points.length - 1].d : null,
  };
}

export function statusError(source: string, sourceUrl: string, error: unknown): SourceStatus {
  return {
    ok: false,
    source,
    sourceUrl,
    points: 0,
    lastPoint: null,
    error: error instanceof Error ? error.message : String(error),
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
