import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LeanIt - Learn smarter, not longer',
  description:
    'Extract key insights from YouTube podcasts, interviews, and lectures. LeanIt turns long videos into concise, actionable learning cards.',
  keywords: [
    'YouTube',
    'podcasts',
    'learning',
    'insights',
    'summary',
    'AI',
    'education',
  ],
  authors: [{ name: 'LeanIt' }],
  openGraph: {
    title: 'LeanIt - Learn smarter, not longer',
    description:
      'Extract key insights from YouTube podcasts, interviews, and lectures.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
