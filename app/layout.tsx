import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'MacroPulse Labs',
  description: 'Unconventional Bitcoin indicators. Honestly labeled.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-paper antialiased">
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
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted">
            MacroPulse Labs — observation, not alpha.
          </div>
        </footer>
      </body>
    </html>
  );
}
