import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Find Your Korean Name | Chungju Halbae',
  description: 'Chungju Halbae offers five Korean names inspired by your name, sound and style. Free to explore.',
  icons: { icon: '/favicon.png' },
  metadataBase: new URL('https://chungju-halbae-korean-names.ysp106.chatgpt.site'),
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    url: 'https://chungju-halbae-korean-names.ysp106.chatgpt.site',
    title: 'Chungju Halbae · Korean Names',
    description: 'Five Korean names, free to explore.',
    images: [{ url: '/og.png', width: 1730, height: 909, alt: 'Chungju Halbae Names' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chungju Halbae · Korean Names',
    description: 'Five Korean names, free to explore.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
