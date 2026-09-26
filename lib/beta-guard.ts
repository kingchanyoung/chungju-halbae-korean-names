import { env } from 'cloudflare:workers';

export class RequestTooLarge extends Error {}

export async function readJsonBody(request: Request, maxBytes = 4096): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > maxBytes) throw new RequestTooLarge('Request too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Empty request.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestTooLarge('Request too large.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

export async function withinBetaLimit(request: Request, purpose: 'names' | 'feedback' | 'poll-create' | 'poll-vote' | 'poll-read', limit: number, windowMs: number) {
  const hostname = new URL(request.url).hostname;
  const secret = env.BETA_RATE_SECRET;
  if (!secret) {
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    throw new Error('Beta request protection is unavailable.');
  }
  if (!env.DB) throw new Error('The beta database is unavailable.');
  const address = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
  const bucket = Math.floor(Date.now() / windowMs);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${purpose}:${bucket}:${address}`));
  const visitorKey = Array.from(new Uint8Array(signed), byte => byte.toString(16).padStart(2, '0')).join('');
  const resetAt = (bucket + 1) * windowMs;
  await env.DB.prepare('DELETE FROM beta_rate_limits WHERE reset_at <= ?').bind(Date.now()).run();
  const attempt = await env.DB.prepare(
    'INSERT INTO beta_rate_limits (visitor_key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(visitor_key) DO UPDATE SET count = count + 1 WHERE count < ?'
  ).bind(visitorKey, resetAt, limit).run();
  return (attempt.meta.changes || 0) > 0;
}

export async function browserVoteHash(request: Request, pollId: string, browserId: string) {
  const hostname = new URL(request.url).hostname;
  const secret = env.BETA_RATE_SECRET || ((hostname === 'localhost' || hostname === '127.0.0.1') ? 'local-beta-only' : '');
  if (!secret) throw new Error('Vote protection is unavailable.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`poll-voter:${pollId}:${browserId}`));
  return Array.from(new Uint8Array(signed), byte => byte.toString(16).padStart(2, '0')).join('');
}
