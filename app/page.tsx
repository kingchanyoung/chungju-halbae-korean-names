'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, Heart, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { NameResult, NameStyle } from '@/lib/names';

const examples = [
  ['지안', 'Jian', 'Warm, balanced'],
  ['서윤', 'Seoyun', 'Gentle, refined'],
  ['도윤', 'Doyun', 'Calm, assured'],
  ['하준', 'Hajun', 'Clear, confident'],
  ['은서', 'Eunseo', 'Warm, gentle'],
];
const styles: NameStyle[] = ['gentle', 'bright', 'distinctive', 'classic', 'modern'];
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
  const [style, setStyle] = useState<NameStyle>('gentle');
  const [result, setResult] = useState<NameResult | null>(null);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [surnameMode, setSurnameMode] = useState<'none' | 'own' | 'korean'>('none');
  const [ownSurname, setOwnSurname] = useState('');
  const [koreanSurname, setKoreanSurname] = useState(koreanSurnames[0]);

  const generate = useCallback(async (input: { name: string; pronunciationHint?: string; meaningHint?: string; style?: NameStyle }) => {
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
      setStyle(restored.style); setSelected(restored.candidates[0].hangul);
    }).catch(caught => setError(caught instanceof Error ? caught.message : 'This result link is unavailable.'));
  }, []);

  useEffect(() => {
    type ToolInput = { name?: string; pronunciationHint?: string; meaningHint?: string; style?: NameStyle };
    type Tool = { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: Tool }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'generate_korean_names',
      title: 'Find five Korean names',
      description: 'Generate and show five free Korean given names from the provided name and style.',
      inputSchema: {
        type: 'object', properties: {
          name: { type: 'string', minLength: 1 },
          pronunciationHint: { type: 'string' },
          meaningHint: { type: 'string' },
          style: { type: 'string', enum: styles },
        }, required: ['name'], additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(value: ToolInput) {
        if (!value || typeof value.name !== 'string') throw new Error('A given name is required.');
        setName(value.name); setPronunciationHint(value.pronunciationHint || '');
        setMeaningHint(value.meaningHint || ''); setStyle(value.style || 'gentle');
        const next = await generate({ name: value.name, pronunciationHint: value.pronunciationHint, meaningHint: value.meaningHint, style: value.style });
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
        <p className="subtitle">“Tell this old man what they call you. I&apos;ll find a Korean name with a sound and feeling you can carry.”</p>
        <div className="promises"><span><Check size={15}/> Five names free</span><span><Check size={15}/> No sign-up</span><span><Check size={15}/> No card</span></div>
        <a className="hero-cta" href="#find-your-name">Tell Halbae your name <ArrowRight size={17}/></a>
      </div>
      <div className="form-frame" id="find-your-name">
        <div className="form-top"><span>01 · YOUR STORY</span><span>FREE</span></div>
        <div className="form-heading"><span className="form-icon"><Heart size={20}/></span><div><h2>What should I call you?</h2><p>A few words will guide this first reading.</p></div></div>
        <form onSubmit={event => { event.preventDefault(); void generate({ name, pronunciationHint, meaningHint, style }).catch(() => {}); }}>
          <label htmlFor="given-name">Your given name <b>*</b></label>
          <Input id="given-name" className="form-input" autoComplete="given-name" required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="The name people call you"/>
          <p className="field-help">Your original name, in any language or script.</p>
          <label htmlFor="pronunciation">How do you pronounce it? <small>Optional for Latin-script names</small></label>
          <Input id="pronunciation" className="form-input" maxLength={100} value={pronunciationHint} onChange={event => setPronunciationHint(event.target.value)} placeholder="e.g. EH-ma"/>
          <p className="field-help">Please add a pronunciation hint if your name uses another script.</p>
          <label htmlFor="meaning">What does your name mean to you? <small>Optional</small></label>
          <Input id="meaning" className="form-input" maxLength={180} value={meaningHint} onChange={event => setMeaningHint(event.target.value)} placeholder="A feeling, memory, or meaning"/>
          <label>What feeling would you like your Korean name to have?</label>
          <div className="style-chips" role="group" aria-label="Name feeling">{styles.map(choice => <Button key={choice} type="button" variant="outline" className={style === choice ? 'active' : ''} aria-pressed={style === choice} onClick={() => setStyle(choice)}>{choice[0].toUpperCase()+choice.slice(1)}</Button>)}</div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button type="submit" className="submit-button" disabled={busy}>{busy ? 'Halbae is looking…' : 'Show me five names'} <ArrowRight size={18}/></Button>
        </form>
        <p className="privacy-line">All five names are free. No payment needed.</p>
      </div>
    </section>
    <p className="preview-truth"><strong>About this preview</strong> These names use your name&apos;s sound, your chosen feeling and checked Hanja. Birth-chart calculation is not active yet.</p>
    <section className="preview-section" id="how-it-works">
      <div className="section-heading"><div><p className="eyebrow">{result ? '02 · YOUR FREE NAMES' : '02 · A FIRST LOOK'}</p><h2>{result ? 'Names for ' + result.originalName : 'A glimpse of your names'}</h2><p>{result ? 'Choose the one that feels most like you. Your result link stays valid for seven days.' : 'These are examples. Tell Halbae your name to see your own five.'}</p></div><span className="step-badge">FIVE FREE</span></div>
      <div className="name-grid">{result
        ? result.candidates.map((candidate, i) => <article className={'name-card' + (selected === candidate.hangul ? ' selected-card' : '')} key={candidate.hangul}>
            <div className="card-meta"><span>NAME {String(i+1).padStart(2,'0')}</span>{i===0 && <span className="pick">START HERE</span>}</div>
            <div className="hangul" lang="ko">{candidate.hangul}</div><div className="roman">{candidate.romanization} <small>{candidate.syllables}</small></div>
            <div className="card-actions"><Button type="button" variant="ghost" size="icon-sm" aria-label={'Hear ' + candidate.hangul} onClick={() => pronounce(candidate.hangul)}><Volume2 size={16}/></Button><Button type="button" variant="ghost" size="icon-sm" aria-label={'Copy ' + candidate.hangul} onClick={() => void copyName(candidate.hangul, candidate.romanization)}><Copy size={15}/></Button></div>
            <div className="card-line"/><strong>{candidate.impression}</strong><p>{candidate.reason}</p>
            {candidate.hanja && <div className="basic-meaning"><span>ONE POSSIBLE HANJA · BASIC MEANING</span><b lang="ko">{candidate.hanja.pair}</b><small>{candidate.hanja.characters.map(character => character.character + ' ' + character.gloss).join(' · ')}</small></div>}
            <Button type="button" variant={selected === candidate.hangul ? 'default' : 'outline'} className="choose-button" onClick={() => setSelected(candidate.hangul)}>{selected === candidate.hangul ? 'Your choice ✓' : 'Choose this name'}</Button>
          </article>)
        : examples.map(([hangul, roman, mood], i) => <article className="name-card" key={hangul}><div className="card-meta"><span>EXAMPLE {String(i+1).padStart(2,'0')}</span>{i===0 && <span className="pick">START HERE</span>}</div><div className="hangul" lang="ko">{hangul}</div><div className="roman">{roman}</div><div className="card-line"/><strong>{mood}</strong><p>A natural Korean sound with its own distinct character.</p></article>)}</div>
      <p className="disclaimer">{result ? 'Each Hanja line shows one possible pairing, not the only meaning of its Hangul name. Individual characters and readings were checked; the full name’s legal registration was not checked. English meanings are editorial translations. Audio uses your browser’s Korean voice.' : 'Example names shown. Generate your names to see one possible checked Hanja pairing and its basic meaning for each.'}</p>
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
      <div className="method-row"><span>一</span><p><strong>Your name and its sound.</strong> The first sound and shared vowels guide the match.</p></div>
      <div className="method-row"><span>二</span><p><strong>The feeling you want.</strong> Your style and meaning words help order the options.</p></div>
      <div className="method-row"><span>三</span><p><strong>Checked Hanja.</strong> We show one possible pairing from a small 11-name catalog. We avoid repeating the same opening Hangul syllable.</p></div>
      <div className="saju-future"><strong>FOUR PILLARS · IN DEVELOPMENT</strong><p>A true birth-chart reading will need your birth date, local time and birthplace, accurate seasonal-term calculations and reviewed naming rules. It is not part of these results yet.</p></div>
    </section>
    <section className="premium-section"><div><p className="eyebrow">WHEN YOU FIND THE ONE</p><h2>A deeper name story.</h2><p>All five names and their basic Hanja meanings stay free. The planned one-time report adds a focused story for your choice, a side-by-side comparison, character sources, full-name considerations, and a printable keepsake.</p><a className="sample-link" href="/sample-report">Explore a sample report <ArrowRight size={16}/></a></div><div className="price-box"><small>PLANNED ONE-TIME REPORT</small><strong>US$7.99</strong><span>Not on sale yet · no subscription</span></div></section>
    <footer><a href="https://gwimunsaju.com/" target="_blank" rel="noopener noreferrer" lang="ko">충주 할배 · 귀문사주</a><span>Names are for cultural exploration. This preview does not provide a birth-chart reading or a legal name change.</span><small>© 2026 Chungju Halbae Names</small></footer>
  </main>;
}
