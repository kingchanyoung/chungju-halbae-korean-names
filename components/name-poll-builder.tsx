'use client';

import { useEffect, useState } from 'react';
import { Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NameResult } from '@/lib/names';

export function NamePollBuilder({ result, deleteToken }: { result: NameResult; deleteToken: string }) {
  const [names, setNames] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const storageKey = `chungju-halbae-poll:${result.id}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as { key?: string; names?: string[] } | null;
      if (saved?.key && /^[a-f0-9-]+\.[a-f0-9-]+$/.test(saved.key) && saved.key.length < 180) {
        setLink(location.origin + '/name-vote#poll=' + saved.key);
        setNames((saved.names || []).filter(name => result.candidates.some(item => item.hangul === name)).slice(0, 3));
      }
    } catch { /* this browser can still make a new poll */ }
  }, [storageKey, result.candidates]);

  async function createPoll() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/name-polls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceId: result.id, deleteToken, names }) });
      const body = await response.json() as { id?: string; token?: string; error?: string };
      if (!response.ok || !body.id || !body.token) throw new Error(body.error || 'Please try again.');
      const key = body.id + '.' + body.token;
      setLink(location.origin + '/name-vote#poll=' + key);
      try { localStorage.setItem(storageKey, JSON.stringify({ key, names })); } catch { /* copy the link before closing this tab */ }
      setMessage('Your friends can now vote. Only the shortlisted names and Roman spellings appear on this link.');
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function closePoll() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/name-polls/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceId: result.id, deleteToken }) });
      if (!response.ok && response.status !== 404) throw new Error('We could not close your poll. Please try again.');
      setLink('');
      try { localStorage.removeItem(storageKey); } catch { /* server is authoritative */ }
      setMessage(response.status === 404 ? 'There is no active poll to close.' : 'Poll closed. The old link no longer works. You can choose another shortlist.');
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function sharePoll(useShare: boolean) {
    try {
      if (useShare && navigator.share) await navigator.share({ title: 'Help me choose a Korean name', text: 'Which Korean name do you like best? Listen and cast your vote.', url: link });
      else { await navigator.clipboard.writeText(link); setMessage('Friend-vote link copied.'); }
    } catch (caught) { if (!(caught instanceof DOMException && caught.name === 'AbortError')) setMessage('You can select and copy the link below.'); }
  }
  return <section className="friend-poll-panel" aria-labelledby="friend-poll-heading">
    <p className="eyebrow">ASK YOUR FRIENDS</p><h3 id="friend-poll-heading">Which name would they pick?</h3>
    <p>Choose two or three names for a separate vote link. Your original name, birth chart, personal note, and private result link stay off this page.</p>
    <div className="poll-shortlist" role="group" aria-label="Names to share">{result.candidates.map(candidate => <Button type="button" key={candidate.hangul} variant={names.includes(candidate.hangul) ? 'default' : 'outline'} aria-pressed={names.includes(candidate.hangul)} disabled={!!link || busy || (!names.includes(candidate.hangul) && names.length >= 3) || !deleteToken} onClick={() => setNames(current => current.includes(candidate.hangul) ? current.filter(name => name !== candidate.hangul) : [...current, candidate.hangul])}><span lang="ko">{candidate.hangul}</span><small>{candidate.romanization}</small></Button>)}</div>
    {!deleteToken ? <p className="field-help">Create a poll in the browser where you generated this result. A shared result link cannot create or close a poll.</p> : <>
      {link ? <><div className="poll-builder-actions"><Button type="button" variant="outline" onClick={() => void sharePoll(false)}><Copy size={15}/> Copy vote link</Button><Button type="button" variant="outline" onClick={() => void sharePoll(true)}><Share2 size={15}/> Share</Button><a href={link} target="_blank" rel="noopener noreferrer">View votes ↗</a></div><label htmlFor="friend-poll-link">Friend-vote link</label><input id="friend-poll-link" className="form-input" value={link} readOnly onFocus={event => event.target.select()}/></> : <Button type="button" className="poll-create" disabled={busy || names.length < 2} onClick={() => void createPoll()}>{busy ? 'Working…' : 'Create friend-vote link'}</Button>}
      <p className="field-help">The poll expires with this result, within seven days. Deleting your result also removes its poll and votes. One active poll per result.</p>
      <Button type="button" variant="ghost" className="poll-close" disabled={busy} onClick={() => void closePoll()}>{link ? 'Close this poll' : 'Close an existing poll'}</Button>
    </>}
    {message && <p role="status" className="poll-message">{message}</p>}
  </section>;
}
