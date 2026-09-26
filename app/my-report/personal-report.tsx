'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Download, ExternalLink, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildReport, type Report } from '@/lib/report';
import type { NameResult } from '@/lib/names';
import { displayName, downloadNameCard, NO_FAMILY, type FamilyPreview } from '@/lib/name-card';

const priorityLabel = { balanced: 'A balanced recommendation', sound: 'Connection to your original name’s sound', meaning: 'Your meaning theme', style: 'Your chosen style' };
export function PersonalReport() {
  const [result, setResult] = useState<NameResult | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [family, setFamily] = useState<FamilyPreview>(NO_FAMILY);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [backLink, setBackLink] = useState('/');
  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    const match = params.get('result')?.match(/^([a-f0-9-]+)\.([a-f0-9-]+)$/);
    if (!match) { setError('Open your personal story from a name result.'); return; }
    setBackLink('/' + location.hash);
    let active = true;
    fetch('/api/names/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: match[1], token: match[2] }) })
      .then(async response => {
        const body = await response.json().catch(() => ({})) as { result?: NameResult; error?: string };
        if (!response.ok || !body.result) throw new Error(body.error || 'This result has expired or is unavailable.');
        const savedChoice = params.get('selected');
        const choice = body.result.candidates.some(item => item.hangul === savedChoice) ? savedChoice! : body.result.candidates[0].hangul;
        const next = buildReport(body.result, choice);
        if (!active) return;
        setResult(body.result); setReport(next);
        // Surname preferences stay on this device and never enter a shared link.
        try {
          const stored = JSON.parse(localStorage.getItem(`chungju-halbae-family:${body.result.id}`) || 'null') as FamilyPreview | null;
          if (stored && ['none', 'own', 'korean'].includes(stored.mode) && typeof stored.hangul === 'string' && stored.hangul.length <= 80 && typeof stored.romanization === 'string' && stored.romanization.length <= 80) setFamily(stored);
        } catch { /* a surname is optional */ }
      }).catch(caught => { if (active) setError(caught instanceof Error ? caught.message : 'Please try again.'); });
    return () => { active = false; };
  }, []);
  const candidate = result?.candidates.find(item => item.hangul === report?.selectedName.hangul);
  const full = candidate ? displayName(candidate, family) : null;
  async function copyIntro() {
    if (!report) return;
    try { await navigator.clipboard.writeText(report.introduction.korean + '\n' + report.introduction.english); setNotice('Introduction copied.'); }
    catch { setNotice('Select the introduction text to copy it.'); }
  }
  async function saveCard() {
    if (!candidate) return;
    try { await downloadNameCard(candidate, family); setNotice('Your name card is ready. It contains no birth information, original given name, or private link.'); }
    catch (caught) { setNotice(caught instanceof Error ? caught.message : 'The image could not be saved.'); }
  }
  if (!report || !result || !candidate || !full) return <main className="names-site beta-info-page"><article className="beta-info-card"><p className="eyebrow">YOUR NAME STORY</p><h1>{error ? 'Let’s find your names' : 'Opening your name story…'}</h1><p role={error ? 'alert' : 'status'}>{error || 'Loading your saved result.'}</p><a className="beta-back" href="/">Back to the name finder</a></article></main>;
  const example = report.selectedName;
  return <main className="report-page personal-report">
    <div className="report-top"><a href={backLink} className="report-back"><ArrowLeft size={16}/> Back to my names</a><div className="report-actions"><Button variant="outline" onClick={() => void saveCard()}><Download size={15}/> Save name card</Button><Button onClick={() => window.print()}><Printer size={15}/> Print / Save PDF</Button></div></div>
    {notice && <p className="report-notice" role="status">{notice}</p>}
    <article className="report-paper">
      <div className="report-head"><p className="eyebrow">CHUNGJU HALBAE NAMES</p><span>FREE BETA · PERSONAL STORY</span></div>
      <div className="report-title-row"><div><p className="report-overline">A NAME CHOSEN BY YOU</p><h1>{full.romanization}</h1><p>A Korean name to explore, understand, and use. This story brings together the evidence behind your chosen name.</p></div><div className="report-name"><strong lang="ko">{full.hangul}</strong><span>{example.syllables}</span></div></div>
      <div className="report-divider"/>
      <section className="report-section"><span className="report-number">01</span><div><h2>Why this name appeared</h2><p>Your naming focus: {priorityLabel[report.priority]}. Its approximate impression is {example.presentation}; we describe its style as {example.impression.toLowerCase()}. These descriptions are impressions, not literal meanings.</p>
        <div className="report-evidence">{example.evidence && Object.entries(example.evidence).map(([key, value]) => <div key={key}><b>{({ sound: 'Your name’s sound', meaning: 'Your meaning note', feeling: 'Your chosen style', birth: 'Your birth-date reading' } as Record<string, string>)[key]}</b><p>{value.detail}</p></div>)}</div>
        {report.meaningHint && <details className="report-input-note"><summary>Your meaning note</summary><p>{report.meaningHint}</p></details>}
        {report.avoidTerms.length > 0 && <p>Names or syllables you asked us to avoid: {report.avoidTerms.join(', ')}.</p>}
        <p>Names with no close sound or meaning match are shown as alternative directions. We do not infer the origin or meaning of your original name.</p></div></section>
      <section className="report-section"><span className="report-number">02</span><div><h2>Understanding the spelling</h2><p><span lang="ko">{example.hangul}</span> is a two-syllable given name. You can write it as {example.romanization} or {example.syllables} in Roman letters. Roman spellings are a guide; they do not fully capture Korean pronunciation.</p>
        {example.hanja ? <><div className="hanja-block"><div><span>ONE POSSIBLE HANJA SPELLING</span><strong lang="ko">{example.hanja}</strong><small>Characters and readings checked</small></div><p>Hanja are characters sometimes used to write Korean names. This is one possible spelling, not the only meaning of the Hangul name.</p></div><div className="character-grid">{example.characters.map(character => <div className="character-card" key={character.character}><strong lang="ko">{character.character}</strong><div><b lang="ko">{character.reading.join(', ')} · {character.koreanDefinition}</b><p>{character.englishGloss}</p><a href={character.officialRecordUrl} target="_blank" rel="noopener noreferrer">Official character record <ExternalLink size={12}/></a></div></div>)}</div><p className="report-caveat">Individual characters and designated readings were checked against the Korean Supreme Court lookup on {String(report.verification.checkedAtUtc).slice(0, 10)}. English glosses are editorial translations. The combined interpretation, full name’s registration eligibility, and element classification have not been professionally verified.</p></> : <div className="report-no-hanja"><h3>Hangul name · Hanja not assigned</h3><p>We have not checked a Hanja spelling for this name. We cannot give it a literal character meaning. You may use the Hangul spelling as a cultural nickname; Hanja is optional for that purpose.</p></div>}</div></section>
      <section className="report-section"><span className="report-number">03</span><div><h2>Your birth-date reading</h2>{report.saju ? <><p>The calculated day pillar is <span lang="ko">{report.saju.day.hanja}</span>, and its day stem is {report.saju.dayElementEnglish}. {report.saju.basis === 'date' ? 'Your birth time is unknown, so no hour pillar is assigned.' : 'Your local birth time and historical birthplace time-zone offset were used.'}</p><div className="report-pillars">{[['Year', report.saju.year?.hanja], ['Month', report.saju.month?.hanja], ['Day', report.saju.day.hanja], ['Hour', report.saju.hour?.hanja]].map(([label, pillar]) => <div key={label}><small>{label}</small><strong lang="ko">{pillar || (label === 'Hour' ? 'Unknown' : 'Boundary uncertain')}</strong></div>)}</div>{report.saju.boundaryUncertain && <p>A seasonal boundary may fall on your date. We leave uncertain year or month pillars unassigned.</p>}<p>{example.evidence?.birth.detail}</p><p className="report-caveat">This is a limited traditional reading using a local-midnight day convention. Character imagery is an editorial association. We do not determine your best element, correct a missing element, or guarantee good fortune. Longitude-based solar-time correction is not applied.</p></> : <p>No birth-chart reading is available for this saved result.</p>}</div></section>
      <section className="report-section"><span className="report-number">04</span><div><h2>Make it part of your introduction</h2><div className="introduction-card"><p lang="ko">{report.introduction.korean}</p><p>{report.introduction.english}</p><Button variant="outline" className="no-print" onClick={() => void copyIntro()}><Copy size={15}/> Copy introduction</Button></div><p>The sentence introduces your Korean given name. {family.mode === 'korean' ? `Your chosen full-name preview is ${full.hangul} (${full.romanization}). This surname is a nickname choice and does not imply ancestry.` : family.mode === 'own' ? 'Your own family name is shown as you entered it; we have not guessed a Hangul spelling.' : 'You can keep your own family name. A Korean family name is optional for a nickname.'} Korean family names usually come before given names.</p><p>Ask a Korean speaker to check your pronunciation. Use your registered legal name on passports, contracts, and official documents.</p><p className="report-caveat">Surname preferences stay in your current browser. They are not included in a shared result link. A downloaded card includes the surname only if you selected one.</p></div></section>
      <section className="report-section"><span className="report-number">05</span><div><h2>Your other directions</h2><div className="comparison-list">{report.comparison.map(item => <div className="comparison-item" key={item.hangul}><span>{item.selected ? '✓' : '·'}</span><strong lang="ko">{item.hangul}</strong><b>{item.romanization}</b><em>{item.impression}</em><small>{item.reason}</small></div>)}</div><p>These are suggestions, not a best-to-worst judgement. Return to your names to make another choice.</p></div></section>
      <section className="report-section"><span className="report-number">06</span><div><h2>Sources and scope</h2><p>We screen a corpus of 2,119 name forms, with a more conservative shortlist based on source counts. Most data is synthetic; a smaller sample comes from 2025 Seoul birth-name tables. Source counts are not nationwide popularity rankings. The full list and explanations have not been reviewed by a naming expert.</p><p><a href="https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea" target="_blank" rel="noopener noreferrer">NVIDIA name-source dataset</a> · <a href="https://stfamily.scourt.go.kr/st/StFrrStatcsView.do?pgmId=090000000025" target="_blank" rel="noopener noreferrer">Court birth-name data</a> · <a href="https://www.korean.go.kr/front_eng/roman/roman_01.do" target="_blank" rel="noopener noreferrer">Romanization guide</a></p><p className="report-caveat">Method version: {report.sourceAlgorithmVersion}. This private story may contain your personal meaning note and chart summary. The share card shows your selected name, optional surname preview, and available Hanja spelling. It excludes birth details, your personal note, and the private link.</p></div></section>
      <div className="report-end"><span>CHUNGJU HALBAE NAMES</span><span>Cultural nickname · Not a legal certificate or expert-reviewed naming decision</span></div>
    </article>
    <p className="report-print-help no-print">To keep a PDF, choose “Save as PDF” in your browser’s print dialog. Your saved link expires after seven days.</p>
  </main>;
}
