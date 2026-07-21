import Link from 'next/link';
import { buildChartCards } from '@/lib/cards';
import { loadStatus } from '@/lib/data';
import type { Verdict } from '@/lib/types';

const VERDICT_DOT: Record<Verdict, string> = {
  SIGNAL: '#34d399',
  SPURIOUS: '#fbbf24',
  ENTERTAINMENT: '#c084fc',
};

const METHOD = [
  { n: '01', text: 'Take two series that should have nothing to do with each other.' },
  { n: '02', text: 'Correlate daily returns over every overlapping day. One number, no tuning.' },
  { n: '03', text: 'Print the verdict next to the chart. Especially when it is nothing.' },
];

const HOMEPAGE_READINGS = 6;

export default function Home() {
  const status = loadStatus();
  const readings = buildChartCards().slice(0, HOMEPAGE_READINGS);

  return (
    <div>
      <section className="pt-6 sm:pt-10">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Macro Lab — observation, not alpha
        </p>
        <h1 className="mt-4 max-w-4xl text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[1.02] tracking-tight">
          Unconventional Bitcoin indicators.
          <span className="block text-muted">Honestly labeled.</span>
        </h1>
        <p className="mt-5 max-w-md text-base text-muted">
          We pair BTC with things it probably shouldn&rsquo;t predict, compute the actual
          correlation, and print the verdict next to the chart — even when the verdict is that
          there is nothing there.
        </p>
      </section>

      <section className="mt-10 sm:mt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
            Latest readings
          </h2>
          <p className="font-mono text-xs text-muted numbers">
            data through {status.updatedAt.slice(0, 10)}
          </p>
        </div>
        <div className="mt-3">
          {readings.map(({ chart, r, verdict }, i) => (
            <Link
              key={chart.slug}
              href={`/charts/${chart.slug}`}
              className="group flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded px-2 py-3 transition-colors duration-150 hover:bg-[#111111]"
            >
              <span className="font-mono text-xs text-muted numbers">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-medium">{chart.title}</span>
              <span className="hidden flex-1 truncate text-sm text-muted md:block">
                {chart.oneLiner}
              </span>
              <span className="ml-auto font-mono text-sm numbers sm:ml-0">
                r&nbsp;{r.toFixed(3)}
              </span>
              <span className="flex items-center gap-2 font-mono text-xs text-muted">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: VERDICT_DOT[verdict] }}
                />
                {verdict}
              </span>
              <span className="w-4 -translate-x-1 text-muted opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 sm:mt-14">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Method</h2>
        <div className="mt-3 space-y-1">
          {METHOD.map((s) => (
            <div key={s.n} className="flex items-baseline gap-6 px-2 py-2">
              <span className="font-mono text-xs text-[#f7931a] numbers">{s.n}</span>
              <p className="text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 pb-4">
        <div className="flex gap-8 text-sm">
          <Link href="/charts" className="group text-paper transition-colors hover:text-[#f7931a]">
            Browse the full index{' '}
            <span className="inline-block transition-transform duration-150 group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link href="/methodology" className="group text-muted transition-colors hover:text-paper">
            Methodology{' '}
            <span className="inline-block transition-transform duration-150 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
