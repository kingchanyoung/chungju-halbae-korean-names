import { env } from 'cloudflare:workers';
import type { NameResult } from './names';

type Row = {
  id: string; access_token_hash: string; original_name: string; pronunciation_hint: string | null;
  meaning_hint: string | null; style: string; name_feel: string | null; candidates_json: string; algorithm_version: string;
  saju_json: string | null;
  preferences_json: string | null;
  created_at: number; expires_at: number;
};
function db() {
  if (!env.DB) throw new Error('The name database is unavailable.');
  return env.DB;
}
export async function saveResult(result: NameResult, tokenHash: string, deleteTokenHash: string) {
  await db().batch([
    db().prepare('DELETE FROM name_results WHERE expires_at <= ?').bind(Date.now()),
    db().prepare('DELETE FROM beta_feedback WHERE created_at <= ?').bind(Date.now() - 30 * 86400_000),
    db().prepare('INSERT INTO name_results (id, access_token_hash, delete_token_hash, original_name, pronunciation_hint, meaning_hint, style, name_feel, candidates_json, saju_json, algorithm_version, created_at, expires_at, preferences_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(result.id, tokenHash, deleteTokenHash, result.originalName, result.pronunciationHint, result.meaningHint, result.style, result.nameFeel, JSON.stringify(result.candidates), result.saju ? JSON.stringify(result.saju) : null, result.algorithmVersion, result.createdAt, result.expiresAt, JSON.stringify({ priority: result.priority || 'balanced' })),
  ]);
}
export async function deleteResult(id: string, deleteTokenHash: string) {
  const deleted = await db().prepare('DELETE FROM name_results WHERE id = ? AND delete_token_hash = ?')
    .bind(id, deleteTokenHash).run();
  return (deleted.meta.changes || 0) > 0;
}
export async function readResult(id: string, tokenHash: string): Promise<NameResult | null> {
  const row = await db().prepare('SELECT * FROM name_results WHERE id = ? AND access_token_hash = ? AND expires_at > ?')
    .bind(id, tokenHash, Date.now()).first<Row>();
  if (!row) return null;
  return {
    id: row.id, originalName: row.original_name, pronunciationHint: row.pronunciation_hint,
    meaningHint: row.meaning_hint, style: row.style as NameResult['style'], nameFeel: (row.name_feel || 'any') as NameResult['nameFeel'],
    candidates: JSON.parse(row.candidates_json), saju: row.saju_json ? JSON.parse(row.saju_json) : null,
    algorithmVersion: row.algorithm_version,
    priority: row.preferences_json ? JSON.parse(row.preferences_json).priority : 'balanced',
    createdAt: row.created_at, expiresAt: row.expires_at,
  };
}
