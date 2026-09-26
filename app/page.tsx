'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Copy, Heart, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { NameFeel, NamePriority, NameResult, NameStyle } from '@/lib/names';
import { BirthZonePicker } from '@/components/birth-zone-picker';
import { downloadNameCard, NO_FAMILY, type FamilyPreview } from '@/lib/name-card';
import { directionLabels, nameDirections, type NameDirection } from '@/lib/name-direction';
import { NamePollBuilder } from '@/components/name-poll-builder';
import { NameReviewStatus } from '@/components/name-review-status';

const styles: NameStyle[] = ['any', 'gentle', 'bright', 'distinctive', 'classic', 'modern'];
const priorityOptions: { value: NamePriority; label: string }[] = [
  { value: 'balanced', label: 'A balance of everything' }, { value: 'sound', label: 'My original name’s sound' },
  { value: 'meaning', label: 'The meaning I chose' }, { value: 'style', label: 'My preferred style' },
];
const meaningSuggestions = ['Peace', 'Wisdom', 'Kindness', 'Hope', 'Nature', 'Light', 'Strength', 'Creativity'];
const nameFeelOptions: { value: NameFeel; label: string }[] = [
  { value: 'any', label: 'Show me a mix' },
  { value: 'feminine', label: 'More feminine' },
  { value: 'masculine', label: 'More masculine' },
  { value: 'neutral', label: 'Gender-neutral' },
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
  const generationSequence = useRef(0);
  const [name, setName] = useState('');
  const [pronunciationHint, setPronunciationHint] = useState('');
  const [meaningHint, setMeaningHint] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthZone, setBirthZone] = useState('');
  const [style, setStyle] = useState<NameStyle>('any');
  const [nameFeel, setNameFeel] = useState<NameFeel | null>(null);
  const [priority, setPriority] = useState<NamePriority>('balanced');
  const [direction, setDirection] = useState<NameDirection>('any');
  const [avoidText, setAvoidText] = useState('');
  const [readKey, setReadKey] = useState('');
  const [excludedNames, setExcludedNames] = useState<string[]>([]);
  const [result, setResult] = useState<NameResult | null>(null);
  const [selected, setSelected] = useState('');
  const [deleteToken, setDeleteToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [surnameMode, setSurnameMode] = useState<'none' | 'own' | 'korean'>('none');
  const [ownSurname, setOwnSurname] = useState('');
  const [koreanSurname, setKoreanSurname] = useState(koreanSurnames[0]);
  const birthDate = birthYear && birthMonth && birthDay
    ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
    : '';

  function setBirthDateParts(value: string) {
    const [year = '', month = '', day = ''] = value.split('-');
    setBirthYear(year); setBirthMonth(month); setBirthDay(day);
  }

  const generate = useCallback(async (input: { name: string; birthDate: string; birthTime?: string; birthZone?: string; pronunciationHint?: string; meaningHint?: string; style?: NameStyle; nameFeel?: NameFeel; priority?: NamePriority; direction?: NameDirection; excludeNames?: string[]; avoidTerms?: string[] }) => {
    const sequence = ++generationSequence.current;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/names/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const body = await response.json().catch(() => ({})) as { error?: string; result?: NameResult; token?: string; deleteToken?: string };
      if (!response.ok || !body.result || !body.token || !body.deleteToken) throw new Error(body.error || 'Please try again.');
      const next = body.result;
      if (sequence !== generationSequence.current) return next;
      setResult(next); setSelected(next.candidates[0].hangul);
      setReadKey(next.id + '.' + body.token);
      setExcludedNames(input.excludeNames || []);
      setDeleteToken(body.deleteToken);
      setFeedbackRating(0); setFeedbackComment(''); setFeedbackMessage('');
      try { localStorage.setItem(`chungju-halbae-delete:${next.id}`, body.deleteToken); } catch { /* deletion remains available in this tab */ }
      history.replaceState(null, '', '#result=' + next.id + '.' + body.token);
      return next;
    } catch (caught) {
      if (sequence === generationSequence.current) setError(caught instanceof SyntaxError ? 'Something went wrong. Please try again.' : caught instanceof Error ? caught.message : 'Please try again.');
      throw caught;
    } finally { if (sequence === generationSequence.current) setBusy(false); }
  }, []);

  useEffect(() => {
    if (!result) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('results-heading')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [result]);

  useEffect(() => {
    const match = location.hash.match(/^#result=([a-f0-9-]+)\.([a-f0-9-]+)(?:&selected=([^&]+))?$/);
    if (!match) return;
    const sequence = generationSequence.current;
    const controller = new AbortController();
    fetch('/api/names/read', {
      signal: controller.signal,
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: match[1], token: match[2] }),
    }).then(async response => {
      const body = await response.json().catch(() => ({})) as { error?: string; result?: NameResult };
      if (!response.ok || !body.result) throw new Error(body.error || 'This result link is unavailable.');
      const restored = body.result;
      if (sequence !== generationSequence.current || controller.signal.aborted) return;
      setResult(restored); setName(restored.originalName);
      try { setDeleteToken(localStorage.getItem(`chungju-halbae-delete:${restored.id}`) || ''); } catch { setDeleteToken(''); }
      setPronunciationHint(restored.pronunciationHint || '');
      setMeaningHint(restored.meaningHint || '');
      setStyle(restored.style === 'classic' || restored.style === 'modern' ? 'any' : restored.style); setNameFeel(restored.nameFeel || 'any');
      setDirection(restored.direction || (restored.style === 'classic' ? 'timeless' : restored.style === 'modern' ? 'contemporary' : 'any'));
      setPriority(restored.priority || 'balanced'); setReadKey(restored.id + '.' + match[2]);
      setAvoidText((restored.avoidTerms || []).join(', '));
      try {
        const family = JSON.parse(localStorage.getItem(`chungju-halbae-family:${restored.id}`) || 'null') as FamilyPreview | null;
        if (family?.mode === 'own' && typeof family.hangul === 'string' && family.hangul.length <= 80) { setSurnameMode('own'); setOwnSurname(family.hangul); }
        if (family?.mode === 'korean') { const surname = koreanSurnames.find(item => item.hangul === family.hangul); if (surname) { setSurnameMode('korean'); setKoreanSurname(surname); } }
      } catch { /* optional device-only preference */ }
      let savedChoice = '';
      try { savedChoice = match[3] ? decodeURIComponent(match[3]) : ''; } catch { /* use the first name */ }
      setSelected(restored.candidates.some(candidate => candidate.hangul === savedChoice) ? savedChoice : restored.candidates[0].hangul);
    }).catch(caught => { if (sequence === generationSequence.current && !controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'This result link is unavailable.'); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!result) return;
    const family: FamilyPreview = surnameMode === 'none' ? NO_FAMILY : surnameMode === 'own'
      ? { mode: 'own', hangul: ownSurname.trim(), romanization: ownSurname.trim() }
      : { mode: 'korean', ...koreanSurname };
    try { localStorage.setItem(`chungju-halbae-family:${result.id}`, JSON.stringify(family)); } catch { /* preview still works without local storage */ }
  }, [result, surnameMode, ownSurname, koreanSurname]);

  useEffect(() => {
    type ToolInput = { name?: string; birthDate?: string; birthTime?: string; birthZone?: string; pronunciationHint?: string; meaningHint?: string; style?: NameStyle; nameFeel?: NameFeel; priority?: NamePriority; direction?: NameDirection; avoidTerms?: string[] };
    type Tool = { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: Tool }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'generate_korean_names',
      title: 'Find Korean names',
      description: 'Explore Korean given names using an approximate name-sound match, personal meaning, preferred mood and a limited birth-date reading for checked Hanja.',
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
          priority: { type: 'string', enum: priorityOptions.map(option => option.value) },
          direction: { type: 'string', enum: nameDirections },
          avoidTerms: { type: 'array', maxItems: 10, items: { type: 'string', maxLength: 20 }, description: 'Given names or syllables to avoid, in Hangul or the service’s Roman spelling' },
        }, required: ['name', 'birthDate'], additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(value: ToolInput) {
        if (!value || typeof value.name !== 'string' || typeof value.birthDate !== 'string') throw new Error('A given name and birth date are required.');
        setName(value.name); setPronunciationHint(value.pronunciationHint || '');
        setMeaningHint(value.meaningHint || ''); setStyle(value.style === 'classic' || value.style === 'modern' ? 'any' : value.style || 'any'); setNameFeel(value.nameFeel || 'any');
        setPriority(value.priority || 'balanced'); setDirection(value.direction || (value.style === 'classic' ? 'timeless' : value.style === 'modern' ? 'contemporary' : 'any')); setAvoidText((value.avoidTerms || []).join(', '));
        setBirthDateParts(value.birthDate); setBirthTime(value.birthTime || ''); setBirthZone(value.birthZone || '');
        const next = await generate({ name: value.name, birthDate: value.birthDate, birthTime: value.birthTime, birthZone: value.birthZone, pronunciationHint: value.pronunciationHint, meaningHint: value.meaningHint, style: value.style, nameFeel: value.nameFeel, priority: value.priority, direction: value.direction, avoidTerms: value.avoidTerms });
        return { resultId: next.id, names: next.candidates.map(candidate => ({ hangul: candidate.hangul, romanization: candidate.romanization })) };
      },
    }, { signal: lifecycle.signal })).catch(() => {});
    return () => lifecycle.abort();
  }, [generate]);

  async function pronounce(hangul: string) {
    if (!('speechSynthesis' in window)) { setNotice('Audio is not available in this browser.'); return; }
    if (!window.speechSynthesis.getVoices().length) await new Promise<void>(resolve => {
      const done = () => { clearTimeout(timer); window.speechSynthesis.removeEventListener('voiceschanged', done); resolve(); };
      const timer = setTimeout(done, 1000); window.speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    });
    const voice = window.speechSynthesis.getVoices().find(item => /^ko(?:-|_)/i.test(item.lang));
    if (!voice) { setNotice('A Korean voice is not available on this device. Check its language or speech settings, or ask a Korean speaker for pronunciation.'); return; }
    const speech = new SpeechSynthesisUtterance(hangul);
    speech.voice = voice;
    speech.lang = 'ko-KR'; speech.rate = 0.8;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(speech);
  }
  async function copyName(hangul: string, romanization: string) {
    try { await navigator.clipboard.writeText(hangul + ' · ' + romanization); setNotice('Name copied.'); }
    catch { setNotice('Copy is unavailable in this browser.'); }
  }
  function chooseName(hangul: string) {
    setSelected(hangul);
    const match = location.hash.match(/^#result=([a-f0-9-]+)\.([a-f0-9-]+)/);
    if (match) history.replaceState(null, '', `#result=${match[1]}.${match[2]}&selected=${encodeURIComponent(hangul)}`);
  }
  async function copyResultLink() {
    try { await navigator.clipboard.writeText(location.href); setNotice('Private result link copied. Anyone with this link can view your names.'); }
    catch { setNotice('Copy is unavailable. You can copy this page address from your browser.'); }
  }
  async function deleteMyResult() {
    if (!result || !deleteToken) { setNotice('Deletion is available only in the browser that created this result.'); return; }
    const deletingId = result.id;
    const sequence = generationSequence.current;
    try {
      const response = await fetch('/api/names/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: result.id, deleteToken }) });
      if (!response.ok) throw new Error('We could not delete this result. Please try again.');
      try { localStorage.removeItem(`chungju-halbae-delete:${deletingId}`); localStorage.removeItem(`chungju-halbae-family:${deletingId}`); } catch { /* already deleted on server */ }
      if (sequence !== generationSequence.current) return;
      setResult(null); setSelected(''); setFeedbackRating(0); setFeedbackComment('');
      setDeleteToken('');
      history.replaceState(null, '', location.pathname);
      setNotice('Your saved result has been deleted.');
    } catch (caught) { setNotice(caught instanceof Error ? caught.message : 'Please try again.'); }
  }
  async function sendFeedback() {
    if (!feedbackRating || !result) { setFeedbackMessage('Choose a rating first.'); return; }
    setFeedbackBusy(true); setFeedbackMessage('');
    try {
      const response = await fetch('/api/beta-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating: feedbackRating, selectedName: selected, comment: feedbackComment }) });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Your feedback could not be saved. Please try again.');
      setFeedbackMessage('Thank you. Your feedback will help us improve the names.');
      setFeedbackRating(0); setFeedbackComment('');
    } catch (caught) { setFeedbackMessage(caught instanceof Error ? caught.message : 'Please try again.'); }
    finally { setFeedbackBusy(false); }
  }
  function addMeaningTheme(theme: string) {
    setMeaningHint(current => current.toLowerCase().includes(theme.toLowerCase()) ? current : [current.trim(), theme.toLowerCase()].filter(Boolean).join(' · '));
  }
  function avoidTerms() { return avoidText.split(/[,\n]/).map(term => term.trim()).filter(Boolean); }

  async function saveSelectedCard() {
    const candidate = result?.candidates.find(item => item.hangul === selected);
    if (!candidate) return;
    const family: FamilyPreview = surnameMode === 'none' ? NO_FAMILY : surnameMode === 'own'
      ? { mode: 'own', hangul: ownSurname.trim(), romanization: ownSurname.trim() } : { mode: 'korean', ...koreanSurname };
    try { await downloadNameCard(candidate, family); setNotice('Name card saved. Your original given name, birth chart, and private link are not on the image.'); }
    catch (caught) { setNotice(caught instanceof Error ? caught.message : 'The image could not be saved.'); }
  }
  async function findDifferentNames() {
    if (!nameFeel || !birthDate) { setNotice('Enter your birth date again to find different options. We do not save the original date.'); document.getElementById('birth-year')?.focus(); return; }
    const excludeNames = [...new Set([...excludedNames, ...(result?.candidates.map(item => item.hangul) || [])])];
    if (excludeNames.length > 30) { setNotice('You have explored several directions. Change your preferences and start a fresh reading.'); return; }
    await generate({ name, birthDate, birthTime, birthZone, pronunciationHint, meaningHint, style, nameFeel, priority, direction, excludeNames, avoidTerms: avoidTerms() }).catch(() => {});
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
        <p className="subtitle">“Tell me your name, date of birth, and the meaning you hope to carry. I&apos;ll look for a Korean name that feels like you.”</p>
        <div className="promises"><span><Check size={15}/> Free name reading</span><span><Check size={15}/> No sign-up</span><span><Check size={15}/> No credit card</span></div>
        <a className="hero-cta" href="#find-your-name">Begin your name reading <ArrowRight size={17}/></a>
      </div>
      <div className="form-frame" id="find-your-name">
        <div className="form-top"><span>01 · YOUR STORY</span><span>FREE BETA</span></div>
        <div className="form-heading"><span className="form-icon"><Heart size={20}/></span><div><h2>What should I call you?</h2><p>I&apos;ll look for links to your name, preferences, and birth chart. If a checked Hanja meaning fits your story, I&apos;ll show that too.</p></div></div>
        <form onSubmit={event => { event.preventDefault(); if (!nameFeel) { setError('Choose how you would like your Korean name to come across.'); return; } void generate({ name, birthDate, birthTime, birthZone, pronunciationHint, meaningHint, style, nameFeel, priority, direction, avoidTerms: avoidTerms() }).catch(() => {}); }}>
          <label htmlFor="given-name">Your given name <b>*</b></label>
          <Input id="given-name" className="form-input" autoComplete="given-name" required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="The name people call you"/>
          <p className="field-help">Your original name, in any language or script.</p>
          <fieldset className="birth-date-fields" aria-describedby="birth-date-help">
            <legend>Your birth date <b>*</b></legend>
            <div className="birth-date-grid">
              <div><label htmlFor="birth-year">Year</label><Input id="birth-year" type="text" inputMode="numeric" autoComplete="bday-year" className="form-input" required maxLength={4} pattern="[0-9]{4}" title="Enter a four-digit year" placeholder="1990" value={birthYear} onChange={event => setBirthYear(event.target.value.replace(/\D/g, '').slice(0, 4))}/></div>
              <div><label htmlFor="birth-month">Month</label><Input id="birth-month" type="text" inputMode="numeric" autoComplete="bday-month" className="form-input" required maxLength={2} pattern="0?[1-9]|1[0-2]" title="Enter a month from 1 to 12" placeholder="03" value={birthMonth} onChange={event => setBirthMonth(event.target.value.replace(/\D/g, '').slice(0, 2))} onBlur={() => setBirthMonth(current => current.length === 1 ? current.padStart(2, '0') : current)}/></div>
              <div><label htmlFor="birth-day">Day</label><Input id="birth-day" type="text" inputMode="numeric" autoComplete="bday-day" className="form-input" required maxLength={2} pattern="0?[1-9]|[12][0-9]|3[01]" title="Enter a day from 1 to 31" placeholder="16" value={birthDay} onChange={event => setBirthDay(event.target.value.replace(/\D/g, '').slice(0, 2))} onBlur={() => setBirthDay(current => current.length === 1 ? current.padStart(2, '0') : current)}/></div>
            </div>
          </fieldset>
          <p className="field-help" id="birth-date-help">Type the year, month, and day using the Gregorian calendar. Use the local date where you were born. It&apos;s fine if you don&apos;t know your birth time.</p>
          <details className="birth-calendar"><summary>Prefer a calendar?</summary><label htmlFor="birth-calendar-date">Choose your birth date</label><Input id="birth-calendar-date" type="date" className="form-input" value={birthDate} onChange={event => setBirthDateParts(event.target.value)}/></details>
          <details className="birth-details">
            <summary>Know your birth time? Add it for a more detailed birth-chart reading</summary>
            <label htmlFor="birth-time">Local birth time <small>Optional</small></label>
            <Input id="birth-time" type="time" className="form-input" value={birthTime} onChange={event => { setBirthTime(event.target.value); if (!event.target.value) setBirthZone(''); }}/>
            <BirthZonePicker value={birthZone} onChange={setBirthZone} enabled={!!birthTime}/>
          </details>
          <label htmlFor="pronunciation">How do you pronounce it? <small>Use English letters if your name is written in another script</small></label>
          <Input id="pronunciation" className="form-input" maxLength={100} value={pronunciationHint} onChange={event => setPronunciationHint(event.target.value)} placeholder="e.g. EH-ma"/>
          <p className="field-help">For example, write “EH-ma.” This guides an approximate sound comparison.</p>
          <label htmlFor="meaning">What meaning would you like your Korean name to carry? <small>Optional; please write in English</small></label>
          <Textarea id="meaning" className="form-input meaning-input" maxLength={500} value={meaningHint} onChange={event => setMeaningHint(event.target.value)} placeholder="The meaning of your name, a memory, or something you hope to carry"/>
          <p className="field-help">Share a meaning or story. Some themes can be linked to checked Hanja; other notes won&apos;t change the ranking.</p>
          <div className="meaning-chips" role="group" aria-label="Meaning themes">{meaningSuggestions.map(theme => <Button key={theme} type="button" variant="outline" onClick={() => addMeaningTheme(theme)}>{theme}</Button>)}</div>
          <p className="choice-label">What style do you like?</p>
          <div className="style-chips" role="group" aria-label="Name feeling">{styles.filter(choice => choice !== 'classic' && choice !== 'modern').map(choice => <Button key={choice} type="button" variant="outline" className={style === choice ? 'active' : ''} aria-pressed={style === choice} onClick={() => setStyle(choice)}>{choice === 'any' ? 'Surprise me' : choice[0].toUpperCase()+choice.slice(1)}</Button>)}</div>
          <p className="choice-label">Which name direction feels like you?</p>
          <div className="style-chips direction-chips" role="group" aria-label="Name direction">{nameDirections.map(choice => <Button key={choice} type="button" variant="outline" className={direction === choice ? 'active' : ''} aria-pressed={direction === choice} onClick={() => setDirection(choice)}>{directionLabels[choice]}</Button>)}</div>
          <p className="field-help">Choose a familiar feel, a classic feel, or something contemporary. These are preferences, not a match to your age. Our sources are limited.</p>
          <p className="choice-label">How would you like your name to be perceived? <b>*</b></p>
          <div className="style-chips feel-chips" role="group" aria-label="Name impression">{nameFeelOptions.map(option => <Button key={option.value} type="button" variant="outline" className={nameFeel === option.value ? 'active' : ''} aria-pressed={nameFeel === option.value} onClick={() => setNameFeel(option.value)}>{option.label}</Button>)}</div>
          <p className="field-help">This describes a name&apos;s common impression, not your gender. Anyone may use a name they like.</p>
          <details className="focus-details"><summary>Want Halbae to focus on something?</summary><div className="style-chips" role="group" aria-label="Naming focus">{priorityOptions.map(option => <Button key={option.value} type="button" variant="outline" className={priority === option.value ? 'active' : ''} aria-pressed={priority === option.value} onClick={() => setPriority(option.value)}>{option.label}</Button>)}</div><p className="field-help">Your birth-date reading remains part of the method where checked Hanja supports a connection. A meaning focus works only with themes we can recognize.</p><label htmlFor="avoid-names">Any Korean names or syllables to avoid? <small>Optional</small></label><Input id="avoid-names" className="form-input" value={avoidText} onChange={event => setAvoidText(event.target.value)} maxLength={200} placeholder="e.g. Jian, Jun, 민"/><p className="field-help">Separate up to ten entries with commas. We match a full given name or one syllable, using Hangul or our Roman spelling. This can help avoid a name already used by someone you know.</p></details>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button type="submit" className="submit-button" disabled={busy}>{busy ? 'Halbae is looking…' : 'Find my Korean name'} <ArrowRight size={18}/></Button>
        </form>
        <p className="privacy-line">Your name, pronunciation hint, meaning note, and chart summary are saved with a private result link for seven days. Your exact birth date and time are not saved. Anyone with the link can open it. <a href="/beta-privacy">Beta privacy details</a></p>
      </div>
    </section>
    <p className="preview-truth"><strong>How this reading works</strong> We compare your name&apos;s sound and preferences with a screened shortlist of Korean given names. For names with checked Hanja, your meaning and birth chart may also affect the order. This is a limited traditional reading.</p>
    {result && <section className="preview-section" id="how-it-works">
      <div className="section-heading"><div><p className="eyebrow">02 · YOUR NAME READING</p><h2 id="results-heading" tabIndex={-1}>{'Names for ' + result.originalName}</h2><p>{`${nameFeelSummary[result.nameFeel || 'any']}. Choose the one that feels most like you. Your private result link works for seven days.`}</p></div></div>
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
        <p className="method-note">We use the birth-chart information we can calculate reliably. Names with checked Hanja may reflect it through a symbolic character image. We don&apos;t determine your most favorable element or predict your fortune.</p>
      </div>}
      <div className="name-grid">{result.candidates.map((candidate, i) => <article className={'name-card' + (selected === candidate.hangul ? ' selected-card' : '')} key={candidate.hangul}>
            <div className="card-meta"><span>{candidate.meaningConnection ? 'A MEANING CONNECTION' : candidate.soundConnection ? 'A SOUND CONNECTION' : candidate.evidence?.birth.matched ? 'A BIRTH-CHART IMAGE' : 'ANOTHER DIRECTION'}</span>{i===0 && <span className="pick">START HERE</span>}</div>
            <div className="hangul" lang="ko">{candidate.hangul}</div><div className="roman"><small>Split spelling</small> {candidate.syllables} <small>Joined spelling</small> {candidate.romanization}</div>
            {candidate.presentation && <div className="presentation-label">{candidate.presentation[0].toUpperCase() + candidate.presentation.slice(1)} impression (approximate)</div>}
            <div className="card-actions"><Button type="button" variant="ghost" size="icon-sm" aria-label={'Hear ' + candidate.hangul} onClick={() => pronounce(candidate.hangul)}><Volume2 size={16}/></Button><Button type="button" variant="ghost" size="icon-sm" aria-label={'Copy ' + candidate.hangul} onClick={() => void copyName(candidate.hangul, candidate.romanization)}><Copy size={15}/></Button></div>
            <div className="card-line"/><strong>{candidate.impression}</strong>
            {candidate.evidence ? <div className="evidence-list">{([
              ['NAME SOUND', candidate.evidence.sound],
              ['YOUR MEANING', candidate.evidence.meaning],
              ['CHOSEN FEELING', candidate.evidence.feeling],
              ['BIRTH-DATE READING', candidate.evidence.birth],
            ] as const).map(([label, item]) => <div className={'evidence-row' + (item.matched ? ' evidence-match' : '')} key={label}><span>{label}</span><p>{item.detail}</p></div>)}</div> : <p>{candidate.reason}</p>}
            {!candidate.evidence && candidate.birthConnection && result.saju && <p className="birth-link"><span lang="ko">{candidate.birthConnection.character}</span> evokes {candidate.birthConnection.image}, an image we connect with your {result.saju.dayElementEnglish} day stem.</p>}
            {candidate.hanja && <div className="basic-meaning"><span>ONE POSSIBLE HANJA SPELLING</span><b lang="ko">{candidate.hanja.pair}</b><small>{candidate.hanja.characters.map(character => character.character + ' ' + character.gloss).join(' · ')}</small></div>}
            {!candidate.hanja && <div className="basic-meaning"><span>HANJA SPELLING</span><small>No characters have been checked for this name yet. Its Hangul spelling does not have one fixed character meaning.</small></div>}
            {candidate.evidence?.direction && result.direction !== 'any' && <div className="direction-evidence"><b>NAME DIRECTION</b><p>{candidate.evidence.direction.detail}</p></div>}
            <NameReviewStatus hasHanja={!!candidate.hanja}/>
            <Button type="button" variant={selected === candidate.hangul ? 'default' : 'outline'} className="choose-button" onClick={() => chooseName(candidate.hangul)}>{selected === candidate.hangul ? 'Your choice ✓' : 'Choose this name'}</Button>
          </article>)}</div>
      <p className="disclaimer">Hanja are characters sometimes used to write Korean given names. We checked individual character readings against the Korean Supreme Court lookup, but not the full name’s registration eligibility or its element interpretation. English meanings are editorial translations. Audio uses your browser’s Korean voice.</p>
      <NamePollBuilder key={result.id} result={result} deleteToken={deleteToken}/>
      <div className="keep-name-panel"><p className="eyebrow">MAKE IT YOURS</p><h3 lang="ko">{selected}</h3><p>Open your selected name&apos;s story, copy a Korean introduction, or keep a name card. All free during the beta.</p><a className="hero-cta" href={'/my-report#result=' + readKey + '&selected=' + encodeURIComponent(selected)}>Read my name story <ArrowRight size={16}/></a><div className="keep-name-actions"><Button type="button" variant="outline" onClick={() => void saveSelectedCard()}><Copy size={15}/> Save name card</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void findDifferentNames()}><RotateCcw size={15}/>{busy ? 'Looking…' : 'Find different options'}</Button></div><p className="field-help">Your card shows your chosen name, optional surname preview, and available Hanja spelling. It excludes birth details, your personal note, and the private link. Different options exclude names already shown in this session.</p>{error && <p className="form-error" role="alert">{error}</p>}</div>
      {result && <div className="surname-panel">
        <div><p className="eyebrow">OPTIONAL FULL-NAME PREVIEW</p><h3>What about a family name?</h3><p>Korean names usually put the family name first. Your own surname remains yours; a Korean-style surname here is only a nickname example.</p></div>
        <div className="surname-options" role="group" aria-label="Family name preview">
          <Button type="button" variant={surnameMode === 'none' ? 'default' : 'outline'} onClick={() => setSurnameMode('none')}>Given name only</Button>
          <Button type="button" variant={surnameMode === 'own' ? 'default' : 'outline'} onClick={() => setSurnameMode('own')}>Use my surname</Button>
          <Button type="button" variant={surnameMode === 'korean' ? 'default' : 'outline'} onClick={() => setSurnameMode('korean')}>Try a Korean-style surname</Button>
        </div>
        {surnameMode === 'own' && <div className="surname-detail"><label htmlFor="own-surname">Your family name as you write it</label><Input id="own-surname" className="form-input" value={ownSurname} maxLength={80} onChange={event => setOwnSurname(event.target.value)} placeholder="e.g. Smith"/><p>We will not guess its Hangul spelling. If you want one, ask a Korean speaker to check it.</p>{ownSurname.trim() && <strong className="full-name-preview">{ownSurname.trim()} · {selected}</strong>}</div>}
        {surnameMode === 'korean' && <div className="surname-detail"><p>Choose one to see how the full name looks:</p><div className="surname-picks">{koreanSurnames.map(surname => <Button type="button" key={surname.hangul} variant={koreanSurname.hangul === surname.hangul ? 'default' : 'outline'} onClick={() => setKoreanSurname(surname)}>{surname.hangul} <small>{surname.romanization}</small></Button>)}</div><strong className="full-name-preview" lang="ko">{koreanSurname.hangul}{selected}</strong><span className="full-name-roman">{koreanSurname.romanization} {result.candidates.find(candidate => candidate.hangul === selected)?.romanization}</span><p>This is a cultural nickname preview. It does not imply family ancestry or change your legal name.</p></div>}
      </div>}
      {result && <div className="feedback-panel" id="beta-feedback"><p className="eyebrow">HELP HALBAE IMPROVE</p><h3>Did these names feel right?</h3><p>We store feedback separately from your original name and birth chart. Please leave out personal details.</p><div className="rating-buttons" role="group" aria-label="Rate these names from one to five">{[1,2,3,4,5].map(value => <Button type="button" key={value} variant={feedbackRating === value ? 'default' : 'outline'} aria-pressed={feedbackRating === value} aria-label={`${value} out of 5`} onClick={() => setFeedbackRating(value)}>{value}</Button>)}</div><label htmlFor="feedback-comment">What worked or felt off? <small>Optional</small></label><Textarea id="feedback-comment" className="form-input meaning-input" maxLength={500} value={feedbackComment} onChange={event => setFeedbackComment(event.target.value)} placeholder="For example: a name felt too formal, or its meaning fit perfectly"/><Button type="button" className="feedback-submit" disabled={feedbackBusy} onClick={() => void sendFeedback()}>{feedbackBusy ? 'Sending…' : 'Send feedback'}</Button>{feedbackMessage && <p role="status" className="feedback-message">{feedbackMessage}</p>}</div>}
      {result && <div className="result-footer"><span>Bookmark or copy your private link to revisit these names within seven days. Anyone with the link can view them.</span><div className="result-actions"><Button type="button" variant="outline" onClick={() => void copyResultLink()}><Copy size={15}/> Copy result link</Button><Button type="button" variant="outline" disabled={busy} onClick={() => { generationSequence.current++; setResult(null); setSelected(''); setDeleteToken(''); history.replaceState(null, '', location.pathname); document.getElementById('find-your-name')?.scrollIntoView({ behavior: 'smooth' }); }}><RotateCcw size={15}/> Try another name</Button>{deleteToken && <Button type="button" variant="outline" className="delete-result" disabled={busy} onClick={() => void deleteMyResult()}>Delete my result</Button>}</div></div>}
    </section>}
    {notice && <p className="notice result-notice" role="status">{notice}</p>}
    <section className="method-section" id="about">
      <p className="eyebrow">HOW HALBAE CHOOSES</p>
      <h2>What goes into a name?</h2>
      <div className="method-row"><span>一</span><p><strong>Your name and preferences.</strong> We compare your pronunciation hint, when provided, with Korean name spellings. Your chosen style and name impression guide the shortlist. Sound matching is approximate.</p></div>
      <div className="method-row"><span>二</span><p><strong>Your meaning or story.</strong> We look for themes in your English note. If a name has a checked Hanja character with a related meaning, we show that link. Notes we cannot connect do not change the order.</p></div>
      <div className="method-row"><span>三</span><p><strong>Your birth chart.</strong> Your date gives a partial traditional reading. If you know your birth time and birthplace time zone, we can calculate one more part. For checked Hanja names, a character image may symbolically connect to the chart and affect the order. We do not calculate a definitive best element.</p></div>
      <div className="method-row"><span>四</span><p><strong>Korean name options.</strong> We screen more than 2,000 two-syllable forms. Our current default shortlist uses 796 forms with stronger source-count support, retaining adult and recent names. These counts are not a national popularity ranking or expert review. Suggestions have different opening syllables. Only 51 forms currently have a checked possible Hanja spelling.</p></div>
      <div className="saju-future"><strong>ABOUT THIS BETA</strong><p>Most options come from a synthetic Korean persona dataset, with a smaller set informed by published birth-name data. The full list and every interpretation have not been reviewed by a Korean naming expert. Character meanings and birth-chart links are limited, so please tell us when a name feels unnatural.</p><p><a href="https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea" target="_blank" rel="noopener noreferrer">NVIDIA Nemotron-Personas-Korea</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · <a href="https://stfamily.scourt.go.kr/st/StFrrStatcsView.do?pgmId=090000000025" target="_blank" rel="noopener noreferrer">Korean court birth-name table</a>.</p></div>
    </section>
    {result && <section className="premium-section"><div><p className="eyebrow">FREE NOW · OPTIONAL LATER</p><h2>Choose freely. Understand your name.</h2><p>Suggestions, available Hanja basics, pronunciation, your personal story, and a name card are free during this beta. We are considering a separate expert-reviewed Hanja story after review and payment setup are ready.</p><a className="sample-link" href="/plans">What is free, and what might be paid? <ArrowRight size={16}/></a></div><div className="price-box"><small>OPEN BETA</small><strong>Free</strong><span>No payment or subscription</span></div></section>}
    <footer><a href="https://gwimunsaju.com/" target="_blank" rel="noopener noreferrer" lang="ko">충주 할배 · 귀문사주</a><span>For cultural exploration. Name suggestions are not legal name changes or promises about the future.</span><div className="footer-links"><a href="/plans">Free & future plans</a><a href="/beta-privacy">Beta privacy</a><a href="mailto:shj2331@chansworld.co.kr?subject=Korean%20name%20beta">Contact</a></div><small>© 2026 Chungju Halbae Names</small></footer>
  </main>;
}
