import type { Metadata } from 'next';
import { Archivo_Black, Inter } from 'next/font/google';
import SiteNav from '@/components/SiteNav';
import './globals.css';

const display = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://unperson-12359.github.io/macro-lab'),
  title: {
    default: 'Macro Lab',
    template: '%s — Macro Lab',
  },
  description: 'Unconventional Bitcoin indicators. Honestly labeled.',
  openGraph: {
    title: 'Macro Lab',
    description: 'Unconventional Bitcoin indicators. Honestly labeled.',
    url: 'https://unperson-12359.github.io/macro-lab',
    siteName: 'Macro Lab',
    images: [{ url: '/macro-lab/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Macro Lab',
    description: 'Unconventional Bitcoin indicators. Honestly labeled.',
    images: ['/macro-lab/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-ink font-sans text-paper antialiased">
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
