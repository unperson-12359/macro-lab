import Link from 'next/link';

export default function SiteNav() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-sm font-semibold tracking-wide">
          MacroPulse Labs
        </Link>
        <nav className="flex gap-6 text-sm text-muted">
          <Link href="/" className="hover:text-paper">
            Charts
          </Link>
          <Link href="/methodology" className="hover:text-paper">
            Methodology
          </Link>
        </nav>
      </div>
    </header>
  );
}
