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
  title: 'Find Your Korean Name | Chungju Halbae Names',
  description: 'Discover five Korean names inspired by you. Free to explore, with no sign-up or card required.',
  icons: { icon: '/favicon.svg' },
  metadataBase: new URL('https://chungju-halbae-korean-names.ysp106.chatgpt.site'),
  openGraph: {
    type: 'website',
    url: 'https://chungju-halbae-korean-names.ysp106.chatgpt.site',
    title: 'Find a Korean name that feels like you.',
    description: 'Five Korean given names. Free to explore.',
    images: [{ url: '/og.png', width: 1730, height: 909, alt: 'Chungju Halbae Names' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find a Korean name that feels like you.',
    description: 'Five Korean given names. Free to explore.',
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
