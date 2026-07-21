import type { Verdict } from '@/lib/types';

const STYLES: Record<Verdict, { label: string; className: string }> = {
  SIGNAL: {
    label: 'SIGNAL',
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  },
  SPURIOUS: {
    label: 'SPURIOUS',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  },
  ENTERTAINMENT: {
    label: 'ENTERTAINMENT',
    className: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  },
};

export default function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const s = STYLES[verdict];
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 font-mono text-xs tracking-wider ${s.className}`}
    >
      {s.label}
    </span>
  );
}
