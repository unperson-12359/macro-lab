import type { Metadata } from 'next';
import SiteNav from '@/components/SiteNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Macro Lab',
  description: 'Unconventional Bitcoin indicators. Honestly labeled.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-paper antialiased">
        <SiteNav />
        <main id="content" className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted">
            Macro Lab — observation, not alpha.
          </div>
        </footer>
      </body>
    </html>
  );
}
