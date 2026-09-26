import type { Metadata } from 'next';
import { NameVote } from './name-vote';

const title = 'Help Choose a Korean Name | Chungju Halbae';
const description = 'Listen to a shortlist of Korean given names and vote for your favorite.';
export const metadata: Metadata = {
  title, description, robots: { index: false, follow: false }, referrer: 'no-referrer',
  openGraph: { title, description, url: 'https://chungju-halbae-korean-names.ysp106.chatgpt.site/name-vote', images: [] },
  twitter: { card: 'summary', title, description, images: [] },
};
export default function Page() { return <NameVote/>; }
