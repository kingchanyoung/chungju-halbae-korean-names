'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NamePoll } from '@/lib/poll-types';
import { pronounceKorean } from '@/lib/pronounce';

export function NameVote() {
  const [poll, setPoll] = useState<NamePoll | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const access = useRef<{ id: string; token: string; browserId: string } | null>(null);
  useEffect(() => {
    const match = new URLSearchParams(location.hash.slice(1)).get('poll')?.match(/^([a-f0-9-]+)\.([a-f0-9-]+)$/);
    if (!match) { setError('Open the full vote link your friend shared with you.'); return; }
    let browserId = crypto.randomUUID() as string;
    try {
      const key = `chungju-halbae-voter:${match[1]}`;
      const saved = localStorage.getItem(key);
      if (saved && /^[a-f0-9-]{36}$/.test(saved)) browserId = saved;
      else localStorage.setItem(key, browserId);
    } catch { /* the identifier stays available in this tab */ }
    access.current = { id: match[1], token: match[2], browserId };
    const controller = new AbortController();
    fetch('/api/name-polls/read', { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(access.current) }).then(async response => {
      const body = await response.json() as { poll?: NamePoll; error?: string };
      if (!response.ok || !body.poll) throw new Error(body.error || 'This poll is unavailable.');
      if (!controller.signal.aborted) setPoll(body.poll);
    }).catch(caught => { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Please try again.'); });
    return () => controller.abort();
  }, []);
  async function refresh() {
    if (!access.current) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/name-polls/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(access.current) });
      const body = await response.json() as { poll?: NamePoll; error?: string };
      if (!response.ok || !body.poll) { if (response.status === 404) setPoll(null); throw new Error(body.error || 'Please try again.'); }
      setPoll(body.poll);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function vote(selectedName: string) {
    if (!access.current || poll?.myVote) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/name-polls/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...access.current, selectedName }) });
      const body = await response.json() as { poll?: NamePoll; error?: string };
      if (!response.ok || !body.poll) { if (response.status === 404) setPoll(null); throw new Error(body.error || 'Please try again.'); }
      setPoll(body.poll); setNotice('Your vote is saved. Thank you for helping your friend choose.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  const total = poll?.candidates.reduce((sum, item) => sum + item.votes, 0) || 0;
  return <main className="names-site beta-info-page friend-vote-page">
    <header className="site-header"><a className="brand" href="/"><span><strong lang="ko">충주 할배</strong><small>· GWIMUN SAJU ·</small></span></a></header>
    <article className="beta-info-card"><p className="eyebrow">A FRIEND WANTS YOUR OPINION</p><h1>Which Korean name do you like best?</h1><p>Listen to the names and choose your favorite. This page shows only a shortlist and Roman spellings. It does not show your friend&apos;s original name or birth details.</p>
      {!poll && !error && <p role="status">Opening the shortlist…</p>}
      {poll && <><div className="vote-cards">{poll.candidates.map(candidate => <section className="vote-card" key={candidate.hangul}><h2 lang="ko">{candidate.hangul}</h2><p>{candidate.romanization} · {candidate.syllables}</p><Button type="button" variant="outline" onClick={() => void pronounceKorean(candidate.hangul).then(message => { if (message) setNotice(message); })}><Volume2 size={15}/> Listen</Button><Button type="button" disabled={busy || !!poll.myVote} onClick={() => void vote(candidate.hangul)}>{poll.myVote === candidate.hangul ? 'Your vote ✓' : poll.myVote ? 'Vote saved' : 'Vote for this name'}</Button><p className="vote-count">{candidate.votes} {candidate.votes === 1 ? 'vote' : 'votes'}</p></section>)}</div><div className="vote-refresh"><span>{total} {total === 1 ? 'vote' : 'votes'} so far</span><Button type="button" variant="outline" disabled={busy} onClick={() => void refresh()}><RotateCcw size={14}/> Refresh votes</Button></div><p className="field-help">One vote per browser; your first choice is kept. This is an informal poll, not a verified count of people. Audio requires a Korean voice on your device. Link expires {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(poll.expiresAt)}.</p></>}
      {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="poll-message" role="status">{notice}</p>}
      <div className="vote-own-name"><h2>Curious about your own Korean name?</h2><p>Tell Halbae your name, birth date, and the meaning you hope to carry. It&apos;s free, with no sign-up.</p><a className="hero-cta" href="/">Find my Korean name →</a></div><p><a href="/beta-privacy">Privacy details</a></p>
    </article>
  </main>;
}
