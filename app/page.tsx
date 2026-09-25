'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, Heart, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { NameFeel, NameResult, NameStyle } from '@/lib/names';

const examples = [
  ['지안', 'Jian', 'Warm, balanced'],
  ['서윤', 'Seoyun', 'Gentle, refined'],
  ['도윤', 'Doyun', 'Calm, assured'],
  ['하준', 'Hajun', 'Clear, confident'],
  ['은서', 'Eunseo', 'Warm, gentle'],
];
const styles: NameStyle[] = ['any', 'gentle', 'bright', 'distinctive', 'classic', 'modern'];
const meaningSuggestions = ['Peace', 'Wisdom', 'Kindness', 'Hope', 'Nature', 'Light', 'Strength', 'Creativity'];
const nameFeelOptions: { value: NameFeel; label: string }[] = [
  { value: 'any', label: 'Show me a mix' },
  { value: 'feminine', label: 'More feminine' },
  { value: 'masculine', label: 'More masculine' },
  { value: 'neutral', label: 'Gender neutral' },
];
const nameFeelSummary: Record<NameFeel, string> = {
  any: 'A mix of name impressions',
  feminine: 'A more feminine impression',
  masculine: 'A more masculine impression',
  neutral: 'A gender-neutral impression',
};
const koreanSurnames = [
  { hangul: '김', romanization: 'Kim' },
  { hangul: '이', romanization: 'Lee' },
  { hangul: '박', romanization: 'Park' },
  { hangul: '최', romanization: 'Choi' },
  { hangul: '정', romanization: 'Jung' },
];

export default function Home() {
  const [name, setName] = useState('');
  const [pronunciationHint, setPronunciationHint] = useState('');
  const [meaningHint, setMeaningHint] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthZone, setBirthZone] = useState('');
  const [style, setStyle] = useState<NameStyle>('any');
  const [nameFeel, setNameFeel] = useState<NameFeel | null>(null);
  const [result, setResult] = useState<NameResult | null>(null);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [surnameMode, setSurnameMode] = useState<'none' | 'own' | 'korean'>('none');
  const [ownSurname, setOwnSurname] = useState('');
  const [koreanSurname, setKoreanSurname] = useState(koreanSurnames[0]);

  const generate = useCallback(async (input: { name: string; birthDate: string; birthTime?: string; birthZone?: string; pronunciationHint?: string; meaningHint?: string; style?: NameStyle; nameFeel?: NameFeel }) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/names/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const body = await response.json() as { error?: string; result?: NameResult; token?: string };
      if (!response.ok || !body.result || !body.token) throw new Error(body.error || 'Please try again.');
      const next = body.result;
      setResult(next); setSelected(next.candidates[0].hangul);
      history.replaceState(null, '', '#result=' + next.id + '.' + body.token);
      setTimeout(() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }), 80);
      return next;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please try again.');
      throw caught;
    } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    const match = location.hash.match(/^#result=([a-f0-9-]+)\.([a-f0-9-]+)$/);
    if (!match) return;
    fetch('/api/names/read', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: match[1], token: match[2] }),
    }).then(async response => {
      const body = await response.json() as { error?: string; result?: NameResult };
      if (!response.ok || !body.result) throw new Error(body.error || 'This result link is unavailable.');
      const restored = body.result;
      setResult(restored); setName(restored.originalName);
      setPronunciationHint(restored.pronunciationHint || '');
      setMeaningHint(restored.meaningHint || '');
      setStyle(restored.style); setNameFeel(restored.nameFeel || 'any');
      setSelected(restored.candidates[0].hangul);
    }).catch(caught => setError(caught instanceof Error ? caught.message : 'This result link is unavailable.'));
  }, []);

  useEffect(() => {
    type ToolInput = { name?: string; birthDate?: string; birthTime?: string; birthZone?: string; pronunciationHint?: string; meaningHint?: string; style?: NameStyle; nameFeel?: NameFeel };
    type Tool = { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: Tool }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'generate_korean_names',
      title: 'Find five Korean names',
      description: 'Generate five free Korean given names from an approximate name-sound match, personal meaning, preferred mood and a limited birth-date reading for checked Hanja.',
      inputSchema: {
        type: 'object', properties: {
          name: { type: 'string', minLength: 1 },
          birthDate: { type: 'string', description: 'Gregorian birth date, YYYY-MM-DD' },
          birthTime: { type: 'string', description: 'Optional birthplace local time, HH:mm' },
          birthZone: { type: 'string', description: 'Required with birthTime: IANA birthplace time zone, e.g. America/New_York' },
          pronunciationHint: { type: 'string' },
          meaningHint: { type: 'string' },
          style: { type: 'string', enum: styles },
          nameFeel: { type: 'string', enum: nameFeelOptions.map(option => option.value), description: 'Optional desired name impression; not the user’s gender' },
        }, required: ['name', 'birthDate'], additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(value: ToolInput) {
        if (!value || typeof value.name !== 'string' || typeof value.birthDate !== 'string') throw new Error('A given name and birth date are required.');
        setName(value.name); setPronunciationHint(value.pronunciationHint || '');
        setMeaningHint(value.meaningHint || ''); setStyle(value.style || 'any'); setNameFeel(value.nameFeel || 'any');
        setBirthDate(value.birthDate); setBirthTime(value.birthTime || ''); setBirthZone(value.birthZone || '');
        const next = await generate({ name: value.name, birthDate: value.birthDate, birthTime: value.birthTime, birthZone: value.birthZone, pronunciationHint: value.pronunciationHint, meaningHint: value.meaningHint, style: value.style, nameFeel: value.nameFeel });
        return { resultId: next.id, names: next.candidates.map(candidate => ({ hangul: candidate.hangul, romanization: candidate.romanization })) };
      },
    }, { signal: lifecycle.signal })).catch(() => {});
    return () => lifecycle.abort();
  }, [generate]);

  function pronounce(hangul: string) {
    if (!('speechSynthesis' in window)) { setNotice('Audio is not available in this browser.'); return; }
    const speech = new SpeechSynthesisUtterance(hangul);
    speech.lang = 'ko-KR'; speech.rate = 0.8;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(speech);
  }
  async function copyName(hangul: string, romanization: string) {
    try { await navigator.clipboard.writeText(hangul + ' · ' + romanization); setNotice('Name copied.'); }
    catch { setNotice('Copy is unavailable in this browser.'); }
  }
  function addMeaningTheme(theme: string) {
    setMeaningHint(current => current.toLowerCase().includes(theme.toLowerCase()) ? current : [current.trim(), theme.toLowerCase()].filter(Boolean).join(' · '));
  }

  return <main className="names-site">
    <header className="site-header">
      <a className="brand" href="/" aria-label="Chungju Halbae Names home"><span><strong lang="ko">충주 할배</strong><small>· GWIMUN SAJU ·</small></span></a>
      <nav className="header-nav" aria-label="Main navigation"><a href="https://gwimunsaju.com/" target="_blank" rel="noopener noreferrer">Main site ↗</a></nav>
    </header>
    <section className="intro-layout">
      <div className="intro-copy">
        <p className="eyebrow">· KOREAN NAME READING ·</p>
        <div className="portrait-wrap"><img src="/halbae.jpg" alt="Portrait of Chungju Halbae in traditional clothing"/></div>
        <h1>Come closer.<br/><em>Let&apos;s find your Korean name.</em></h1>
        <p className="subtitle">“Tell me your name, birthday, and the meaning you hope to carry. I&apos;ll look for a Korean name that feels like you.”</p>
        <div className="promises"><span><Check size={15}/> Five names free</span><span><Check size={15}/> No sign-up</span><span><Check size={15}/> No card</span></div>
        <a className="hero-cta" href="#find-your-name">Begin your name reading <ArrowRight size={17}/></a>
      </div>
      <div className="form-frame" id="find-your-name">
        <div className="form-top"><span>01 · YOUR STORY</span><span>FREE</span></div>
        <div className="form-heading"><span className="form-icon"><Heart size={20}/></span><div><h2>What should I call you?</h2><p>Your story and the birth-date reading both guide the names.</p></div></div>
        <form onSubmit={event => { event.preventDefault(); if (!nameFeel) { setError('Choose how you would like your Korean name to come across.'); return; } void generate({ name, birthDate, birthTime, birthZone, pronunciationHint, meaningHint, style, nameFeel }).catch(() => {}); }}>
          <label htmlFor="given-name">Your given name <b>*</b></label>
          <Input id="given-name" className="form-input" autoComplete="given-name" required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="The name people call you"/>
          <p className="field-help">Your original name, in any language or script.</p>
          <label htmlFor="birth-date">Your birth date <b>*</b></label>
          <Input id="birth-date" type="date" className="form-input" autoComplete="bday" required min="1901-01-01" value={birthDate} onChange={event => setBirthDate(event.target.value)}/>
          <p className="field-help">Use the local date where you were born. A date alone is enough to begin; birth time is unknown by default.</p>
          <details className="birth-details">
            <summary>Know your birth time? Add it for a fuller reading</summary>
            <label htmlFor="birth-time">Local birth time <small>Optional</small></label>
            <Input id="birth-time" type="time" className="form-input" value={birthTime} onChange={event => { setBirthTime(event.target.value); if (!event.target.value) setBirthZone(''); }}/>
            <label htmlFor="birth-zone">Birthplace time zone <small>Required with time</small></label>
            <Input id="birth-zone" className="form-input" list="birth-zone-options" required={!!birthTime} disabled={!birthTime} maxLength={80} value={birthZone} onChange={event => setBirthZone(event.target.value)} placeholder="e.g. America/New_York"/>
            <datalist id="birth-zone-options">{['Asia/Seoul', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Asia/Manila', 'Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'Australia/Sydney', 'Pacific/Auckland'].map(zone => <option key={zone} value={zone}/>)}</datalist>
            <p className="field-help">Use the time zone of the place you were born, including its city/region. The historic clock offset is applied automatically.</p>
          </details>
          <label htmlFor="pronunciation">How do you pronounce it? <small>Roman-letter hint; required for other scripts</small></label>
          <Input id="pronunciation" className="form-input" maxLength={100} value={pronunciationHint} onChange={event => setPronunciationHint(event.target.value)} placeholder="e.g. EH-ma"/>
          <p className="field-help">For example, write “EH-ma.” This guides an approximate sound comparison.</p>
          <label htmlFor="meaning">What does your name mean to you? <small>What should the new one carry? Optional; English</small></label>
          <Textarea id="meaning" className="form-input meaning-input" maxLength={500} value={meaningHint} onChange={event => setMeaningHint(event.target.value)} placeholder="The meaning of your name, a memory, or something you hope to carry"/>
          <p className="field-help">Choose a theme or write your own story. We connect it to a name only when the Hanja meaning has been checked.</p>
          <div className="meaning-chips" role="group" aria-label="Meaning themes">{meaningSuggestions.map(theme => <Button key={theme} type="button" variant="outline" onClick={() => addMeaningTheme(theme)}>{theme}</Button>)}</div>
          <label>What feeling would you like your Korean name to have?</label>
          <div className="style-chips" role="group" aria-label="Name feeling">{styles.map(choice => <Button key={choice} type="button" variant="outline" className={style === choice ? 'active' : ''} aria-pressed={style === choice} onClick={() => setStyle(choice)}>{choice === 'any' ? 'Surprise me' : choice[0].toUpperCase()+choice.slice(1)}</Button>)}</div>
          <label>How would you like your Korean name to come across? <b>*</b></label>
          <div className="style-chips feel-chips" role="group" aria-label="Name impression">{nameFeelOptions.map(option => <Button key={option.value} type="button" variant="outline" className={nameFeel === option.value ? 'active' : ''} aria-pressed={nameFeel === option.value} onClick={() => setNameFeel(option.value)}>{option.label}</Button>)}</div>
          <p className="field-help">Choose a direction, or see a mix. This does not ask for your gender, and anyone may use a name they like.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button type="submit" className="submit-button" disabled={busy}>{busy ? 'Halbae is looking…' : 'Show me five names'} <ArrowRight size={18}/></Button>
        </form>
        <p className="privacy-line">All five names are free. Your result link expires in seven days. It stores your name, story and chart summary, but not your raw birth date or time.</p>
      </div>
    </section>
    <p className="preview-truth"><strong>How this reading works</strong> Halbae compares your name&apos;s approximate sound, your meaning and your chosen feeling across more than 2,000 Korean name forms. Birth-date stem imagery helps order names only where a Hanja pairing has been checked. This is a limited traditional reading, not a complete saju naming judgment.</p>
    <section className="preview-section" id="how-it-works">
      <div className="section-heading"><div><p className="eyebrow">{result ? '02 · YOUR FREE NAMES' : '02 · A FIRST LOOK'}</p><h2>{result ? 'Names for ' + result.originalName : 'A glimpse of your names'}</h2><p>{result ? `${nameFeelSummary[result.nameFeel || 'any']}. Choose the one that feels most like you. Your result link stays valid for seven days.` : 'These are examples. Tell Halbae your name to see your own five.'}</p></div><span className="step-badge">FIVE FREE</span></div>
      {result?.saju && <div className="saju-reading">
        <p className="eyebrow">YOUR BIRTH-DATE READING</p>
        <h3>Day stem: <span lang="ko">{result.saju.day.stem}</span> · {result.saju.dayElementEnglish}</h3>
        <p>{result.saju.basis === 'date' ? 'Calculated from your birth date. Your birth hour is unknown, so the hour pillar is omitted.' : 'Calculated from your birthplace local date, time and historical time-zone offset.'}</p>
        <div className="pillar-list">
          <span>YEAR <strong lang="ko">{result.saju.year?.hanja || 'Boundary uncertain'}</strong></span>
          <span>MONTH <strong lang="ko">{result.saju.month?.hanja || 'Boundary uncertain'}</strong></span>
          <span>DAY <strong lang="ko">{result.saju.day.hanja}</strong></span>
          {result.saju.hour && <span>HOUR <strong lang="ko">{result.saju.hour.hanja}</strong></span>}
        </div>
        {result.saju.boundaryUncertain && <p className="boundary-note">A seasonal boundary may occur on this date. Add your local birth time and birthplace time zone to resolve the year or month pillar.</p>}
        <p className="method-note">We use the local-midnight day convention. Available day, month, year and hour stem elements can help order names with checked Hanja imagery. Unknown or boundary-uncertain pillars are skipped. This is a symbolic comparison, not a missing-element diagnosis or a full yongshin reading.</p>
      </div>}
      <div className="name-grid">{result
        ? result.candidates.map((candidate, i) => <article className={'name-card' + (selected === candidate.hangul ? ' selected-card' : '')} key={candidate.hangul}>
            <div className="card-meta"><span>NAME {String(i+1).padStart(2,'0')}</span>{i===0 && <span className="pick">START HERE</span>}</div>
            <div className="hangul" lang="ko">{candidate.hangul}</div><div className="roman">{candidate.syllables} <small>{candidate.romanization}</small></div>
            {candidate.presentation && <div className="presentation-label">{candidate.presentation} feel · approximate usage guide</div>}
            <div className="card-actions"><Button type="button" variant="ghost" size="icon-sm" aria-label={'Hear ' + candidate.hangul} onClick={() => pronounce(candidate.hangul)}><Volume2 size={16}/></Button><Button type="button" variant="ghost" size="icon-sm" aria-label={'Copy ' + candidate.hangul} onClick={() => void copyName(candidate.hangul, candidate.romanization)}><Copy size={15}/></Button></div>
            <div className="card-line"/><strong>{candidate.impression}</strong>
            {candidate.evidence ? <div className="evidence-list">{([
              ['NAME SOUND', candidate.evidence.sound],
              ['YOUR MEANING', candidate.evidence.meaning],
              ['CHOSEN FEELING', candidate.evidence.feeling],
              ['BIRTH-DATE READING', candidate.evidence.birth],
            ] as const).map(([label, item]) => <div className={'evidence-row' + (item.matched ? ' evidence-match' : '')} key={label}><span>{label}</span><p>{item.detail}</p></div>)}</div> : <p>{candidate.reason}</p>}
            {!candidate.evidence && candidate.birthConnection && result.saju && <p className="birth-link"><span lang="ko">{candidate.birthConnection.character}</span> evokes {candidate.birthConnection.image}, an image we connect with your {result.saju.dayElementEnglish} day stem.</p>}
            {candidate.hanja && <div className="basic-meaning"><span>ONE POSSIBLE HANJA · BASIC MEANING</span><b lang="ko">{candidate.hanja.pair}</b><small>{candidate.hanja.characters.map(character => character.character + ' ' + character.gloss).join(' · ')}</small></div>}
            {!candidate.hanja && <div className="basic-meaning"><span>HANJA PAIRING</span><small>No pairing has been checked for this name yet. Its Hangul sound does not have one fixed character meaning.</small></div>}
            <Button type="button" variant={selected === candidate.hangul ? 'default' : 'outline'} className="choose-button" onClick={() => setSelected(candidate.hangul)}>{selected === candidate.hangul ? 'Your choice ✓' : 'Choose this name'}</Button>
          </article>)
        : examples.map(([hangul, roman, mood], i) => <article className="name-card" key={hangul}><div className="card-meta"><span>EXAMPLE {String(i+1).padStart(2,'0')}</span>{i===0 && <span className="pick">START HERE</span>}</div><div className="hangul" lang="ko">{hangul}</div><div className="roman">{roman}</div><div className="card-line"/><strong>{mood}</strong><p>A natural Korean sound with its own distinct character.</p></article>)}</div>
      <p className="disclaimer">{result ? 'Hanja appears only where a possible character pairing has been checked. For those pairings, individual characters and readings were checked; full-name legal registration and element imagery were not certified by the court. English meanings are editorial translations. Audio uses your browser’s Korean voice.' : 'Example names shown. Generate yours to see the birth-date chart, five name forms and any Hanja pairings already checked.'}</p>
      {result && <div className="surname-panel">
        <div><p className="eyebrow">OPTIONAL FULL-NAME PREVIEW</p><h3>What about a family name?</h3><p>Korean names usually put the family name first. Your own surname remains yours; a Korean-style surname here is only a nickname example.</p></div>
        <div className="surname-options" role="group" aria-label="Family name preview">
          <Button type="button" variant={surnameMode === 'none' ? 'default' : 'outline'} onClick={() => setSurnameMode('none')}>Given name only</Button>
          <Button type="button" variant={surnameMode === 'own' ? 'default' : 'outline'} onClick={() => setSurnameMode('own')}>Use my surname</Button>
          <Button type="button" variant={surnameMode === 'korean' ? 'default' : 'outline'} onClick={() => setSurnameMode('korean')}>Try a Korean-style surname</Button>
        </div>
        {surnameMode === 'own' && <div className="surname-detail"><label htmlFor="own-surname">Your family name as you write it</label><Input id="own-surname" className="form-input" value={ownSurname} maxLength={80} onChange={event => setOwnSurname(event.target.value)} placeholder="e.g. Smith"/><p>We will not guess its Hangul spelling. If you know it, a Korean speaker can help check it.</p>{ownSurname.trim() && <strong className="full-name-preview">{ownSurname.trim()} · {selected}</strong>}</div>}
        {surnameMode === 'korean' && <div className="surname-detail"><p>Choose one to hear the full-name rhythm:</p><div className="surname-picks">{koreanSurnames.map(surname => <Button type="button" key={surname.hangul} variant={koreanSurname.hangul === surname.hangul ? 'default' : 'outline'} onClick={() => setKoreanSurname(surname)}>{surname.hangul} <small>{surname.romanization}</small></Button>)}</div><strong className="full-name-preview" lang="ko">{koreanSurname.hangul}{selected}</strong><span className="full-name-roman">{koreanSurname.romanization} {result.candidates.find(candidate => candidate.hangul === selected)?.romanization}</span><p>This is a cultural nickname preview. It does not imply family ancestry or change your legal name.</p></div>}
      </div>}
      {notice && <p className="notice" role="status">{notice}</p>}
      {result && <div className="result-footer"><span>Saved for seven days in this browser link.</span><Button type="button" variant="outline" onClick={() => { setResult(null); setSelected(''); history.replaceState(null, '', location.pathname); document.getElementById('find-your-name')?.scrollIntoView({ behavior: 'smooth' }); }}><RotateCcw size={15}/> Try another name</Button></div>}
    </section>
    <section className="method-section" id="about">
      <p className="eyebrow">03 · HOW HALBAE CHOOSES</p>
      <h2>What goes into a name?</h2>
      <div className="method-row"><span>一</span><p><strong>Your name and the feeling you choose.</strong> We compare your Roman-letter pronunciation hint, when supplied, with each name&apos;s Roman spelling using a rough sound key and edit distance. Your chosen name impression filters the pool; the mood tag helps rank it. These are guides, not rules about who may use a name.</p></div>
      <div className="method-row"><span>二</span><p><strong>Your meaning or story.</strong> We look for a theme in your English note and connect it only with a checked Hanja character whose translated meaning supports that theme. A story without a direct match remains your story; we do not invent a meaning for the name.</p></div>
      <div className="method-row"><span>三</span><p><strong>Your birth-date pillars.</strong> We calculate the day stem and the year and month stems when seasonal boundaries are clear. Birth time and birthplace time zone add the hour stem. Literal images in checked Hanja can reflect these available elements and affect ranking, with the day carrying the most weight. This is not a complete yongshin calculation.</p></div>
      <div className="method-row"><span>四</span><p><strong>Natural Korean name forms.</strong> We screen more than 2,000 two-syllable forms and favor familiar ones. Five names have different opening syllables. Only 51 forms currently have a checked possible Hanja pairing, so each card shows clearly which meaning and birth-date links were actually available.</p></div>
      <div className="saju-future"><strong>THE LIMIT OF THIS METHOD</strong><p>The large pool comes mostly from synthetic personas plus a limited actual birth-name table. It is not a court-certified dictionary. The Hanja imagery is an editorial comparison to chart stems, not an official element classification, a missing-element remedy or a prediction. A Korean naming and Four Pillars expert should review pair meanings, naturalness and interpretation before this can be called full saju naming.</p><p><a href="https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea" target="_blank" rel="noopener noreferrer">NVIDIA Nemotron-Personas-Korea</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · <a href="https://stfamily.scourt.go.kr/st/StFrrStatcsView.do?pgmId=090000000025" target="_blank" rel="noopener noreferrer">Court birth-name table</a>. We extracted name forms, screened them by age and frequency, and added ranking rules.</p></div>
    </section>
    <section className="premium-section"><div><p className="eyebrow">WHEN YOU FIND THE ONE</p><h2>A deeper name story.</h2><p>All five name forms are free, along with any Hanja meanings already checked. The planned one-time report adds a focused story for your choice, a side-by-side comparison, character sources, full-name considerations, and a printable keepsake.</p><a className="sample-link" href="/sample-report">Explore a sample report <ArrowRight size={16}/></a></div><div className="price-box"><small>PLANNED ONE-TIME REPORT</small><strong>US$7.99</strong><span>Not on sale yet · no subscription</span></div></section>
    <footer><a href="https://gwimunsaju.com/" target="_blank" rel="noopener noreferrer" lang="ko">충주 할배 · 귀문사주</a><span>Traditional birth-chart calculation and an editorial naming method for cultural exploration. This is not a legal name change or a guarantee of fortune.</span><small>© 2026 Chungju Halbae Names</small></footer>
  </main>;
}
