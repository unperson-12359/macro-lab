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
      <section className="relative pt-6 sm:pt-10">
        <div className="hero-glow pointer-events-none absolute inset-x-0 -top-8 h-96" aria-hidden="true" />
        <div className="relative">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Macro Lab — observation, not alpha
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[1.02] tracking-tight">
            Unconventional Bitcoin indicators.
            <span className="block bg-gradient-to-r from-[#f7931a] via-muted to-muted bg-clip-text text-transparent">
              Honestly labeled.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted">
            We pair BTC with things it probably shouldn&rsquo;t predict, compute the actual
            correlation, and print the verdict next to the chart — even when the verdict is that
            there is nothing there.
          </p>
        </div>
      </section>

      <hr className="divider-glow mt-12" />

      <section className="mt-10 sm:mt-14">
        <div className="flex items-baseline justify-between">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
            Latest readings
          </h2>
          <p className="font-mono text-xs text-muted numbers">
            data through {status.updatedAt.slice(0, 10)}
          </p>
        </div>
        <div className="mt-4 space-y-3">
          {readings.map(({ chart, r, verdict }, i) => (
            <Link
              key={chart.slug}
              href={`/charts/${chart.slug}`}
              style={{ animationDelay: `${i * 60}ms` }}
              className="group flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded-2xl border border-line bg-gradient-to-b from-[#141414] to-[#0d0d0d] px-4 py-3.5 animate-fade-up transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f7931a]/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            >
              <span className="font-mono text-xs text-muted numbers">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-display text-sm">{chart.title}</span>
              <span className="hidden flex-1 truncate text-sm text-muted md:block">
                {chart.oneLiner}
              </span>
              <span className="ml-auto font-display text-sm numbers sm:ml-0">
                r&nbsp;{r.toFixed(3)}
              </span>
              <span className="flex items-center gap-2 font-mono text-xs text-muted">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]"
                  style={{ backgroundColor: VERDICT_DOT[verdict], color: VERDICT_DOT[verdict] }}
                />
                {verdict}
              </span>
              <span className="w-4 -translate-x-1 text-[#f7931a] opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <hr className="divider-glow mt-12" />

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">Method</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {METHOD.map((s, i) => (
            <div
              key={s.n}
              style={{ animationDelay: `${200 + i * 60}ms` }}
              className="rounded-2xl border border-line bg-gradient-to-b from-[#141414] to-[#0d0d0d] p-4 animate-fade-up transition-all duration-200 hover:-translate-y-0.5 hover:border-[#f7931a]/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            >
              <p className="font-display text-lg text-[#f7931a] numbers">{s.n}</p>
              <p className="mt-2 text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider-glow mt-12" />

      <section className="mt-8 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/charts"
            className="rounded-full bg-[#f7931a] px-5 py-2 text-sm font-medium text-black transition hover:bg-[#ffab3d] active:scale-95"
          >
            Browse the full index →
          </Link>
          <Link
            href="/methodology"
            className="rounded-full border border-line px-4 py-2 text-sm font-medium text-muted transition hover:border-[#333333] hover:text-paper active:scale-95"
          >
            Methodology
          </Link>
        </div>
      </section>
    </div>
  );
}
