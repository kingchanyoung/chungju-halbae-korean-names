import { env } from 'cloudflare:workers';
import { sha256, type NameCandidate } from './names';
import { publicPollCandidate, type NamePoll, type PollCandidate } from './poll-types';

function db() { if (!env.DB) throw new Error('Poll database unavailable.'); return env.DB; }
type PollRow = { id: string; candidates_json: string; expires_at: number };

export async function createNamePoll(sourceId: string, ownerHash: string, selectedNames: string[]) {
  const source = await db().prepare('SELECT candidates_json, expires_at FROM name_results WHERE id = ? AND delete_token_hash = ? AND expires_at > ?')
    .bind(sourceId, ownerHash, Date.now()).first<{ candidates_json: string; expires_at: number }>();
  if (!source) return { error: 'This result is unavailable or this browser does not own it.', status: 404 } as const;
  const original = JSON.parse(source.candidates_json) as NameCandidate[];
  const candidates = selectedNames.map(hangul => original.find(item => item.hangul === hangul));
  if (candidates.some(item => !item)) return { error: 'Choose only names from your saved result.', status: 400 } as const;
  const token = crypto.randomUUID() + crypto.randomUUID();
  const id = crypto.randomUUID();
  const inserted = await db().prepare(`INSERT INTO name_polls (id, source_result_id, access_token_hash, candidates_json, created_at, expires_at)
    SELECT ?, id, ?, ?, ?, expires_at FROM name_results
    WHERE id = ? AND delete_token_hash = ? AND expires_at > ? ON CONFLICT(source_result_id) DO NOTHING`)
    .bind(id, await sha256(token), JSON.stringify(candidates.map(item => publicPollCandidate(item!))), Date.now(), sourceId, ownerHash, Date.now()).run();
  if (!inserted.meta.changes) return { error: 'A poll already exists for this result, or the result has expired. Close your existing poll before creating another.', status: 409 } as const;
  return { id, token, expiresAt: source.expires_at };
}

export async function readNamePoll(id: string, tokenHash: string, voterHash: string | null): Promise<NamePoll | null> {
  const row = await db().prepare(`SELECT p.id, p.candidates_json, p.expires_at FROM name_polls p
    JOIN name_results r ON r.id = p.source_result_id
    WHERE p.id = ? AND p.access_token_hash = ? AND p.expires_at > ? AND r.expires_at > ?`)
    .bind(id, tokenHash, Date.now(), Date.now()).first<PollRow>();
  if (!row) return null;
  const counts = await db().prepare('SELECT selected_name, count(*) AS count FROM name_poll_votes WHERE poll_id = ? GROUP BY selected_name')
    .bind(id).all<{ selected_name: string; count: number }>();
  const myVote = voterHash ? await db().prepare('SELECT selected_name FROM name_poll_votes WHERE poll_id = ? AND voter_key_hash = ?').bind(id, voterHash).first<{ selected_name: string }>() : null;
  const candidates = JSON.parse(row.candidates_json) as PollCandidate[];
  return { id: row.id, expiresAt: row.expires_at, candidates: candidates.map(candidate => ({ ...candidate, votes: counts.results.find(item => item.selected_name === candidate.hangul)?.count || 0 })), myVote: myVote?.selected_name || null };
}

export async function voteNamePoll(id: string, tokenHash: string, voterHash: string, selectedName: string) {
  const poll = await readNamePoll(id, tokenHash, voterHash);
  if (!poll) return { error: 'This poll has expired or is unavailable.', status: 404 } as const;
  if (!poll.candidates.some(item => item.hangul === selectedName)) return { error: 'Choose a name from this poll.', status: 400 } as const;
  await db().prepare(`INSERT INTO name_poll_votes (id, poll_id, voter_key_hash, selected_name, created_at)
    SELECT ?, p.id, ?, ?, ? FROM name_polls p JOIN name_results r ON r.id = p.source_result_id
    WHERE p.id = ? AND p.access_token_hash = ? AND p.expires_at > ? AND r.expires_at > ?
    ON CONFLICT(poll_id, voter_key_hash) DO NOTHING`)
    .bind(crypto.randomUUID(), voterHash, selectedName, Date.now(), id, tokenHash, Date.now(), Date.now()).run();
  const updated = await readNamePoll(id, tokenHash, voterHash);
  if (!updated) return { error: 'This poll has expired or is unavailable.', status: 404 } as const;
  return { poll: updated };
}

export async function deleteNamePoll(sourceId: string, ownerHash: string) {
  const deleted = await db().prepare('DELETE FROM name_polls WHERE source_result_id = ? AND EXISTS (SELECT 1 FROM name_results WHERE id = ? AND delete_token_hash = ?)')
    .bind(sourceId, sourceId, ownerHash).run();
  return !!deleted.meta.changes;
}
