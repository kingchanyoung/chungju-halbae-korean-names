import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { NameResult } from '@/lib/names';
import { buildReport } from '@/lib/report';
import { calculateSaju } from '@/lib/saju';
import { PrintButton } from './print-button';

export const metadata: Metadata = {
  title: 'Sample Korean Name Report | Chungju Halbae Names',
  description: 'Preview the planned Korean name report, with checked Hanja characters and a five-name comparison.',
  openGraph: {
    title: 'Sample Korean Name Report',
    description: 'A sample five-name comparison and checked Hanja character explanation.',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'Sample Korean Name Report',
    description: 'A sample five-name comparison and checked Hanja character explanation.',
    images: [],
  },
};
const alternatives = [
  ['지안', 'Jian', 'Warm, balanced', 'Short and easy to carry between languages.'],
  ['서윤', 'Seoyun', 'Gentle, refined', 'A softer direction with a flowing rhythm.'],
  ['도윤', 'Doyun', 'Calm, assured', 'A steady, confident sounding option.'],
  ['하준', 'Hajun', 'Clear, confident', 'A crisp and familiar two-syllable shape.'],
  ['은서', 'Eunseo', 'Warm, gentle', 'A gentle sound with a warm impression.'],
];
const sampleResult: NameResult = {
  id: 'sample', originalName: 'Emma', pronunciationHint: 'EH-ma',
  meaningHint: null, style: 'gentle', nameFeel: 'any',
  candidates: alternatives.map(([hangul, romanization, impression, reason]) => ({
    hangul, romanization, syllables: romanization, impression, reason,
    soundConnection: false, meaningConnection: false, birthConnection: null, presentation: 'neutral', hanja: null,
  })),
  saju: calculateSaju({ birthDate: '1995-03-16', birthTime: null, birthZone: null }),
  algorithmVersion: 'sample', createdAt: 0, expiresAt: 0,
};
const report = buildReport(sampleResult, '지안');
const example = report.selectedName;
const characters = example.characters;

export default function SampleReport() {
  return <main className="report-page">
    <div className="report-top"><a href="/" className="report-back"><ArrowLeft size={16}/> Back to names</a><PrintButton/></div>
    <article className="report-paper">
      <div className="report-head"><p className="eyebrow">CHUNGJU HALBAE NAMES · SAMPLE</p><span>EXAMPLE ONLY</span></div>
      <div className="report-title-row"><div><p className="report-overline">A KOREAN NAME FOR</p><h1>Emma</h1><p>This fictional example shows the kind of detail planned for the US$7.99 one-time report. The example birth date is 16 March 1995.</p></div><div className="report-name"><strong lang="ko">지안</strong><span>Jian · Ji-an</span></div></div>
      <div className="report-divider"/>
      <section className="report-section"><span className="report-number">01</span><div><h2>Your five-name comparison</h2><p>All five names and their basic Hanja meanings are free. The report brings the sound, feel, and selection reasons together so you can compare them deliberately.</p><div className="comparison-list">{alternatives.map(([hangul, roman, impression, reason], i) => <div className="comparison-item" key={hangul}><span>{String(i+1).padStart(2, '0')}</span><strong lang="ko">{hangul}</strong><b>{roman}</b><em>{impression}</em><small>{reason}</small></div>)}</div></div></section>
      <section className="report-section"><span className="report-number">02</span><div><h2>A closer look at 지안</h2><p>Jian is a two-syllable given name. Its short shape is easy to say, while the two syllables leave room for several possible Hanja choices. The impression “warm, balanced” describes the name’s feel, not a fixed dictionary meaning.</p><div className="hanja-block"><div><span>ONE CHECKED CHARACTER PAIRING</span><strong lang="ko">{example.hanja}</strong><small>Possible Hanja for 지안</small></div><p>Hanja changes the literal meaning. This pairing is one possible choice for the Hangul name; we checked each character and its Korean reading in the Supreme Court’s personal-name character lookup.</p></div><div className="character-grid">{characters.map(character => <div className="character-card" key={character.character}><strong lang="ko">{character.character}</strong><div><b>{character.reading.join(', ')}</b><p>{character.englishGloss}</p><a href={character.officialRecordUrl} target="_blank" rel="noopener noreferrer">Official character record <ExternalLink size={12}/></a></div></div>)}</div><p className="report-caveat">Character eligibility and designated readings were checked. The full name’s legal registration eligibility has not been checked. English glosses are editorial translations of the official Korean character descriptions.</p></div></section>
      <section className="report-section"><span className="report-number">03</span><div><h2>The example birth-date chart</h2><p>For 16 March 1995, the calculated day pillar is <span lang="ko">{report.saju?.day.hanja}</span>, and the day-stem element is {report.saju?.dayElementEnglish}. The year and month pillars are <span lang="ko">{report.saju?.year?.hanja}</span> and <span lang="ko">{report.saju?.month?.hanja}</span>. With no birth time, the hour pillar is unknown.</p><p>The chart uses the traditional local-midnight day convention. Our first naming method uses literal Hanja imagery to inform ranking; it does not determine a missing element or prove that this example name is the optimal match.</p></div></section>
      <section className="report-section"><span className="report-number">04</span><div><h2>Using your name</h2><p>Introduce yourself as “Jian” and write your given name as 지안. With Emma, this example offers a shorter Korean rhythm while keeping a gentle impression. That is a naming choice, not a translation of Emma’s meaning.</p><p>A Korean family name is optional and is not assigned automatically. For a cultural nickname, 김지안 (Kim Jian) shows the family-name-first order. Using 김 here does not imply Kim family ancestry or give you a legal surname. You can keep your own family name instead.</p><p>Your preferred Roman spelling may differ from the standard joined or hyphenated form. For passports, residence documents, and contracts, use your registered name.</p></div></section>
      <div className="report-end"><span>CHUNGJU HALBAE NAMES</span><span>Personal and cultural exploration · Not a legal name-change document</span></div>
    </article>
  </main>;
}
