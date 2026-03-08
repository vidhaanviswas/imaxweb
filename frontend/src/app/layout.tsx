import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'AK IMAX - Movie Discovery Platform',
  description: 'Discover movies with critic and audience ratings. Browse, search, and explore the best films.',
  openGraph: {
    title: 'AK IMAX - Movie Discovery Platform',
    description: 'Discover movies with critic and audience ratings.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AK IMAX - Movie Discovery Platform',
    description: 'Discover movies with critic and audience ratings.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans min-h-screen bg-background overflow-x-hidden`}>
        <Header />
        <main className="pt-14 sm:pt-16 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
