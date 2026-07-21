'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChartCard from '@/components/ChartCard';
import type { ChartCardData } from '@/lib/cards';
import type { Verdict } from '@/lib/types';

const PAGE_SIZE = 6;

type Category = 'all' | 'goods' | 'nature';
type Sort = 'curated' | 'r-desc' | 'r-asc' | 'name';
type VerdictFilter = 'all' | Verdict;

const CHIP = 'rounded border px-2 py-0.5 font-mono text-xs transition-colors';
const CHIP_ACTIVE = 'border-[#f7931a]/50 bg-[#f7931a]/10 text-[#f7931a]';
const CHIP_IDLE = 'border-line text-muted hover:border-[#333333] hover:text-paper';

const SORTS: { id: Sort; label: string }[] = [
  { id: 'curated', label: 'curated' },
  { id: 'r-desc', label: '|r| ↓' },
  { id: 'r-asc', label: '|r| ↑' },
  { id: 'name', label: 'a–z' },
];

function valid<T extends string>(v: string | null, options: readonly T[], fallback: T): T {
  return v !== null && options.includes(v as T) ? (v as T) : fallback;
}

export default function CatalogGrid({ cards }: { cards: ChartCardData[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const category = valid(params.get('cat'), ['all', 'goods', 'nature'] as const, 'all');
  const verdict = valid(params.get('verdict'), ['all', 'SIGNAL', 'SPURIOUS', 'ENTERTAINMENT'] as const, 'all');
  const sort = valid(params.get('sort'), SORTS.map((s) => s.id) as Sort[], 'curated');
  const page = Math.max(1, Number(params.get('page')) || 1);

  // Local mirror so clicks feel instant; URL is the shareable source of truth.
  const [, setTick] = useState(0);

  function setParam(key: string, value: string) {
    const q = new URLSearchParams(params.toString());
    const isDefault =
      (key === 'cat' && value === 'all') ||
      (key === 'verdict' && value === 'all') ||
      (key === 'sort' && value === 'curated') ||
      (key === 'page' && value === '1');
    if (isDefault) q.delete(key);
    else q.set(key, value);
    if (key !== 'page') q.delete('page'); // filter change resets pagination
    router.replace(`/charts${q.size > 0 ? `?${q.toString()}` : ''}`, { scroll: false });
    setTick((t) => t + 1);
  }

  const filtered = useMemo(() => {
    let out = cards;
    if (category !== 'all') out = out.filter((c) => c.chart.category === category);
    if (verdict !== 'all') out = out.filter((c) => c.verdict === verdict);
    switch (sort) {
      case 'r-desc':
        return [...out].sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
      case 'r-asc':
        return [...out].sort((a, b) => Math.abs(a.r) - Math.abs(b.r));
      case 'name':
        return [...out].sort((a, b) => a.chart.title.localeCompare(b.chart.title));
      default:
        return out;
    }
  }, [cards, category, verdict, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const verdictCounts = useMemo(() => {
    const m = new Map<Verdict, number>();
    for (const c of cards) m.set(c.verdict, (m.get(c.verdict) ?? 0) + 1);
    return m;
  }, [cards]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-xs text-muted">type:</span>
          {(['all', 'goods', 'nature'] as const).map((c) => (
            <button key={c} type="button" onClick={() => setParam('cat', c)} className={`${CHIP} ${category === c ? CHIP_ACTIVE : CHIP_IDLE}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-xs text-muted">verdict:</span>
          <button type="button" onClick={() => setParam('verdict', 'all')} className={`${CHIP} ${verdict === 'all' ? CHIP_ACTIVE : CHIP_IDLE}`}>
            all
          </button>
          {(['SIGNAL', 'SPURIOUS', 'ENTERTAINMENT'] as const).map((v) => (
            <button key={v} type="button" onClick={() => setParam('verdict', v)} className={`${CHIP} ${verdict === v ? CHIP_ACTIVE : CHIP_IDLE}`}>
              {v.toLowerCase()} ({verdictCounts.get(v) ?? 0})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-xs text-muted">sort:</span>
          {SORTS.map((s) => (
            <button key={s.id} type="button" onClick={() => setParam('sort', s.id)} className={`${CHIP} ${sort === s.id ? CHIP_ACTIVE : CHIP_IDLE}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="border-t border-line py-10 text-sm text-muted">
          Nothing matches. Even we don&rsquo;t have a chart for that combination.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ chart, verdict: v, points, lastUpdated }) => (
            <ChartCard
              key={chart.slug}
              slug={chart.slug}
              title={chart.title}
              subtitle={chart.subtitle}
              oneLiner={chart.oneLiner}
              verdict={v}
              points={points}
              lastUpdated={lastUpdated}
            />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-between font-mono text-sm">
          {safePage > 1 ? (
            <button type="button" onClick={() => setParam('page', String(safePage - 1))} className="group text-muted hover:text-paper">
              <span className="inline-block transition-transform duration-150 group-hover:-translate-x-1">←</span> prev
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-4">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) =>
              p === safePage ? (
                <span key={p} aria-current="page" className="text-[#f7931a] numbers">{p}</span>
              ) : (
                <button key={p} type="button" onClick={() => setParam('page', String(p))} className="text-muted numbers hover:text-paper">
                  {p}
                </button>
              )
            )}
          </div>
          {safePage < pages ? (
            <button type="button" onClick={() => setParam('page', String(safePage + 1))} className="group text-muted hover:text-paper">
              next <span className="inline-block transition-transform duration-150 group-hover:translate-x-1">→</span>
            </button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
