import type { Metadata } from 'next';
import { PersonalReport } from './personal-report';

export const metadata: Metadata = {
  title: 'My Korean Name Story | Chungju Halbae Names',
  description: 'Your chosen Korean name, its reading, and a card to keep.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  openGraph: { title: 'My Korean Name Story | Chungju Halbae Names', description: 'Open your private chosen-name story with your result link.', images: [] },
  twitter: { card: 'summary', title: 'My Korean Name Story | Chungju Halbae Names', description: 'Open your private chosen-name story with your result link.', images: [] },
};
export default function MyReport() { return <PersonalReport/>; }
