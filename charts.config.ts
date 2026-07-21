import type { ChartConfig } from '@/lib/types';

export const charts: ChartConfig[] = [
  {
    slug: 'btc-vs-luxury-watches',
    title: 'BTC vs Luxury Watches',
    subtitle: 'Bitcoin against an equal-weighted basket of LVMH, Richemont and Swatch.',
    primarySeriesId: 'btc-usd',
    overlaySeriesId: 'luxury-watch-basket',
    oneLiner: 'Do people buy watches when number go up? The data shrugs.',
    explanation:
      'The overlay is an equal-weighted basket of LVMH, Richemont and Swatch Group, each normalized to 100 at the earliest shared trading date (2000-01-03) and then averaged — a rough proxy for high-end watch demand, pulled from Yahoo Finance. Bitcoin is daily closes from Binance (2017-08-17 onward) with a blockchain.info backfill to 2010-08. The working theory is that crypto windfalls end up on wrists. Read both lines as an index of feeling rich; if the correlation below is small, the wrists disagree.',
  },
  {
    slug: 'btc-vs-ferrari',
    title: 'BTC vs Ferrari',
    subtitle: 'Bitcoin against Ferrari N.V. (RACE), purveyor of the official car of imaginary wealth.',
    primarySeriesId: 'btc-usd',
    overlaySeriesId: 'ferrari-race',
    oneLiner: 'Do newly-rich crypto bros buy Ferraris? Enzo is not telling.',
    explanation:
      'The overlay is Ferrari N.V. (RACE) from Yahoo Finance, covering its life as a listed company since 2015. Bitcoin is Binance daily closes with the pre-2017 blockchain.info backfill. The pairing asks whether new crypto money and old Italian metal share a mood, or at least a buyer. Compare the shapes, then let r below settle the argument.',
  },
  {
    slug: 'btc-vs-live-cattle',
    title: 'BTC vs Live Cattle',
    subtitle: 'Bitcoin against front-month live cattle futures (LE=F), in cents per pound.',
    primarySeriesId: 'btc-usd',
    overlaySeriesId: 'live-cattle',
    oneLiner: 'Digital scarcity vs 1,200 lbs of actual scarcity.',
    explanation:
      'The overlay is front-month live cattle futures (LE=F) from Yahoo Finance, quoted in cents per pound — the analog kind of scarcity, deliverable by truck. Bitcoin is Binance daily closes plus the blockchain.info backfill to 2010. If the daily returns of these two correlate, something in macro is broken; if they don’t, the cattle are fine. The chart exists so you can check.',
  },
  {
    slug: 'btc-vs-gamestop',
    title: 'BTC vs GameStop',
    subtitle: 'Bitcoin against GameStop (GME). The two assets Wall Street hates, one chart.',
    primarySeriesId: 'btc-usd',
    overlaySeriesId: 'gamestop-gme',
    oneLiner: 'Meme recognizes meme. Whether they move together is another question.',
    explanation:
      'The overlay is GameStop (GME) from Yahoo Finance, with history back to 2002 — long before the ticker became a personality. Bitcoin is Binance daily closes with the pre-2017 blockchain.info backfill. The two best-known assets Wall Street never asked for, plotted together to test whether “meme” is a factor. Watch 2021: both lines have opinions about that year.',
  },
  {
    slug: 'btc-vs-earthquakes',
    title: 'BTC vs Earthquakes',
    subtitle: 'Bitcoin against the 7-day count of magnitude 6+ earthquakes worldwide (USGS).',
    primarySeriesId: 'btc-usd',
    overlaySeriesId: 'earthquakes-m6',
    oneLiner: 'Does the earth move for Bitcoin? Seismology says no, seismology has not checked.',
    explanation:
      'There is no overlay line here: orange dots mark magnitude 7+ earthquakes from the USGS event API (red and labeled for M8+), plotted along the BTC price from Binance and the blockchain.info backfill. The correlation above is instead computed against the 7-day rolling count of M6+ quakes, because raw daily counts are mostly zeros and zeros make for boring statistics. The hypothesis is that the earth reacts to Bitcoin. Read the dots as decoration with metadata.',
    display: { overlayMode: 'markers' },
  },
  {
    slug: 'btc-vs-sunspots',
    title: 'BTC vs Sunspots',
    subtitle: 'Bitcoin against the daily sunspot number (SILSO, Royal Observatory of Belgium).',
    primarySeriesId: 'btc-usd',
    overlaySeriesId: 'sunspots-daily',
    oneLiner: 'The 11-year solar cycle meets the 4-year halving cycle. Astronomy for people who own telescopes.',
    explanation:
      'The overlay is the daily sunspot number from SILSO (Royal Observatory of Belgium) — one of the longest continuously recorded quantities in science. Bitcoin is Binance daily closes with the pre-2017 blockchain.info backfill. The pitch is the 11-year solar cycle against the 4-year halving cycle: two clocks that have never met. The line stays on a linear axis, because sunspots can be zero and logarithms disapprove of zero.',
    display: { overlayLog: false },
  },
  {
    slug: 'btc-vs-moon',
    title: 'BTC vs the Moon',
    subtitle: 'Bitcoin against lunar illumination, computed from the mean synodic month.',
    primarySeriesId: 'btc-usd',
    overlaySeriesId: 'moon-illumination',
    oneLiner: 'Full-moon trading lore, quantified at last.',
    explanation:
      'The overlay is lunar illumination — 0% at new moon, 100% at full — computed locally from the mean synodic month. No API is involved; the astronomy is accurate to a few hours, which is plenty for folklore. Bitcoin is Binance daily closes with the pre-2017 blockchain.info backfill. Full-moon trading lore has circulated for decades without anyone checking; this chart is the checking. The oscillation is exact; the Bitcoin part is not.',
    display: { overlayLog: false },
  },
  {
    slug: 'btc-vs-hurricanes',
    title: 'BTC vs Hurricanes',
    subtitle: 'Bitcoin against major Atlantic hurricanes (NOAA HURDAT2), at peak intensity.',
    primarySeriesId: 'btc-usd',
    overlaySeriesId: 'hurricane-days',
    oneLiner: 'Does the market weather the weather? The tropics decline to comment.',
    explanation:
      'Each dot is a major Atlantic hurricane at its peak-intensity day from the NOAA HURDAT2 database — amber for category 3, red and named for category 4–5 — plotted along the BTC price. The correlation is computed against the 7-day count of active hurricanes, because raw daily counts are zero all winter. HURDAT2 currently runs through the 2024 season, so recent dots appear only after NOAA updates the file. Hurricane season and bull markets both peak in autumn; whether that sentence means anything is exactly what the number above is for.',
    display: { overlayMode: 'markers' },
  },
  {
    slug: 'btc-vs-temperature',
    title: 'BTC vs Temperature',
    subtitle: 'Bitcoin against the daily maximum temperature in Phoenix, Arizona (Open-Meteo ERA5).',
    primarySeriesId: 'btc-usd',
    overlaySeriesId: 'phoenix-tmax',
    oneLiner: 'Both are accused of boiling the planet. Only one of them tracks summer.',
    display: { overlayLog: false },
    explanation:
      'The overlay is the daily maximum air temperature in Phoenix, Arizona, from the Open-Meteo ERA5 reanalysis archive — chosen because if heatwaves are going to show up anywhere, it is there. Bitcoin is Binance daily closes with the pre-2017 blockchain.info backfill. The theory being tested is roughly "risk appetite is seasonal", which the number above evaluates without mercy. The summer spikes are weather; the other line is weather of a different kind.',
  },
];
