import type { Metadata } from 'next';
import { PersonalReport } from './personal-report';

export const metadata: Metadata = {
  title: 'My Korean Name Story | Chungju Halbae Names',
  description: 'Your chosen Korean name, its reading, and a card to keep.',
  robots: { index: false, follow: false },
};
export default function MyReport() { return <PersonalReport/>; }
