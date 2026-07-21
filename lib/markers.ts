import fs from 'node:fs';
import path from 'node:path';
import type { PrimaryMarker } from '@/components/DualSeriesChart';

export interface MarkerData {
  markers: PrimaryMarker[];
  /** legend line shown under the chart */
  legend: string;
}

interface QuakeEvent {
  d: string;
  mag: number;
}

interface HurricaneEvent {
  d: string;
  name: string;
  wind: number; // knots
}

const AMBER = '#fbbf24';
const RED = '#ef4444';

function readJson<T>(file: string): T[] {
  const p = path.join(process.cwd(), 'data', file);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T[];
}

/** Occurrence markers for charts in `display.overlayMode: 'markers'`, keyed by slug. */
export function loadMarkersForChart(slug: string): MarkerData | null {
  if (slug === 'btc-vs-earthquakes') {
    const events = readJson<QuakeEvent>('events-earthquakes.json');
    return {
      markers: events.map((e) => ({
        d: e.d,
        color: e.mag >= 8 ? RED : AMBER,
        ...(e.mag >= 8 ? { label: `M${e.mag.toFixed(1)}` } : {}),
      })),
      legend:
        'M7+ earthquake · red + labeled = M8+ — occurrences along the BTC price; correlation is vs the 7-day M6+ count.',
    };
  }

  if (slug === 'btc-vs-hurricanes') {
    const events = readJson<HurricaneEvent>('events-hurricanes.json');
    return {
      markers: events.map((e) => ({
        d: e.d,
        color: e.wind >= 113 ? RED : AMBER, // cat 4+ red, cat 3 amber
        ...(e.wind >= 113 ? { label: e.name } : {}),
      })),
      legend:
        'Category 3 hurricane (amber) · category 4–5 named in red — peak-intensity day along the BTC price; correlation is vs the 7-day active-hurricane count.',
    };
  }

  return null;
}
