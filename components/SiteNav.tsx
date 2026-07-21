'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/charts', label: 'Charts' },
  { href: '/events', label: 'Events' },
  { href: '/methodology', label: 'Methodology' },
];

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/80 backdrop-blur">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:border focus:border-line focus:bg-ink focus:px-3 focus:py-1.5 focus:text-sm"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="rounded-sm text-sm font-semibold tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7931a]"
        >
          Macro Lab
        </Link>
        <nav aria-label="Main" className="flex gap-6 text-sm">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-sm underline-offset-8 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7931a] ${
                  active
                    ? 'text-paper underline decoration-[#f7931a] decoration-2'
                    : 'text-muted hover:text-paper'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
