import Link from 'next/link';

export default function SiteNav() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-sm font-semibold tracking-wide">
          Macro Lab
        </Link>
        <nav className="flex gap-6 text-sm text-muted">
          <Link href="/charts" className="hover:text-paper">
            Charts
          </Link>
          <Link href="/events" className="hover:text-paper">
            Events
          </Link>
          <Link href="/methodology" className="hover:text-paper">
            Methodology
          </Link>
        </nav>
      </div>
    </header>
  );
}
