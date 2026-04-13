import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { AppProviders } from '@/providers/providers';
import './globals.css';

const fontSans = Geist({ subsets: ['latin'], variable: '--font-sans' });

const fontMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Audio AI',
  description: 'Audio AI',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`min-h-screen bg-background text-foreground ` + cn('antialiased', fontMono.variable, 'font-sans', fontSans.variable)}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
