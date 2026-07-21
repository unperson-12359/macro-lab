/**
 * Build a daily lunar illumination series — pure astronomy, no network.
 *
 * Standard lunation approximation: age of the moon from the 2000-01-06 18:14 UTC
 * new moon over the mean synodic month (29.530588853 days), then
 * illumination = (1 - cos(2π · age / period)) / 2.
 * Accurate to a few hours against full ephemeris — irrelevant for testing
 * full-moon trading folklore, and noted as such in /methodology.
 *
 * Deterministic and idempotent: regenerates 2010-08-18 → today on every run.
 */
import path from 'node:path';
import type { Series, SeriesPoint } from '../lib/types';
import { SERIES_DIR, statusOk, writeSeriesFile, writeStatus } from './lib/series-io';

const SOURCE = 'computed';
const SOURCE_URL = 'mean synodic month 29.530588853d, anchor new moon 2000-01-06T18:14Z';
const SERIES_PATH = path.join(SERIES_DIR, 'moon-illumination.json');
const GENESIS = '2010-08-18';
const DAY_MS = 24 * 60 * 60 * 1000;
const SYNODIC_MS = 29.530588853 * DAY_MS;
const ANCHOR_MS = Date.UTC(2000, 0, 6, 18, 14); // 2000-01-06 18:14 UTC new moon

function illumination(t: number): number {
  const age = ((t - ANCHOR_MS) % SYNODIC_MS + SYNODIC_MS) % SYNODIC_MS;
  return ((1 - Math.cos((2 * Math.PI * age) / SYNODIC_MS)) / 2) * 100;
}

function main(): void {
  const points: SeriesPoint[] = [];
  const today = Date.now();
  for (let t = Date.parse(GENESIS); t <= today; t += DAY_MS) {
    points.push({
      d: new Date(t).toISOString().slice(0, 10),
      v: Number(illumination(t).toFixed(2)),
    });
  }

  const series: Series = {
    id: 'moon-illumination',
    name: 'Moon illumination',
    unit: '% illuminated',
    source: SOURCE,
    sourceUrl: SOURCE_URL,
    cadence: 'daily',
    points,
  };
  writeSeriesFile(SERIES_PATH, series);
  writeStatus('moon-illumination', statusOk(SOURCE, SOURCE_URL, points));
  console.log(`moon-illumination: ${points.length} points, last ${points[points.length - 1]?.d ?? 'n/a'}`);
}

try {
  main();
} catch (err) {
  console.error('moon phase build failed:', err);
  process.exit(0); // pipeline must never crash
}
