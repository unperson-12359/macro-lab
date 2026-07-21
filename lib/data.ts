import fs from 'node:fs';
import path from 'node:path';
import { charts } from '@/charts.config';
import type { ChartConfig, Series, StatusFile } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

export function loadSeries(id: string): Series {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'series', `${id}.json`), 'utf8');
  return JSON.parse(raw) as Series;
}

export function loadCharts(): ChartConfig[] {
  return charts;
}

export function loadStatus(): StatusFile {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'status.json'), 'utf8');
  return JSON.parse(raw) as StatusFile;
}
