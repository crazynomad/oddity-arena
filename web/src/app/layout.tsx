import type { Metadata } from 'next';
import {
  Special_Elite,
  Courier_Prime,
  Noto_Serif_SC,
  Noto_Sans_SC,
  Black_Ops_One,
} from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const specialElite = Special_Elite({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-typewriter',
  display: 'swap',
});

const courierPrime = Courier_Prime({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-serif-cn',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-sans-cn',
  display: 'swap',
});

const blackOpsOne = Black_Ops_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-stamp',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '不现实竞技场 | Oddity Arena',
  description: 'AI models compete blind. You be the judge.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body
        className={`${specialElite.variable} ${courierPrime.variable} ${notoSerifSC.variable} ${notoSansSC.variable} ${blackOpsOne.variable}`}
        style={{
          fontFamily: "'Noto Serif SC', 'Noto Sans SC', serif",
          background: '#F5F0E1',
          color: '#1A1A1A',
          minHeight: '100vh',
          overflowX: 'hidden',
        }}
      >
        <Providers>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
