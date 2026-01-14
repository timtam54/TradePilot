import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import PWAInstall from '@/components/pwa-install';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'TradePilot - Job Management for Tradespeople',
    template: '%s | TradePilot',
  },
  description:
    'AI-powered job management platform for electricians, plumbers, builders, and all trades professionals.',
  manifest: '/manifest.json',
  keywords: [
    'job management',
    'trades',
    'electrician',
    'plumber',
    'builder',
    'quoting',
    'invoicing',
    'tradesperson',
    'contractor',
    'field service',
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TradePilot',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    siteName: 'TradePilot',
    title: 'TradePilot - Job Management for Tradespeople',
    description:
      'AI-powered job management platform for electricians, plumbers, builders, and all trades professionals.',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <PWAInstall />
        </Providers>
      </body>
    </html>
  );
}
