import { NextResponse } from 'next/server';
import { browserVoteHash, readJsonBody, RequestTooLarge, withinBetaLimit } from '@/lib/beta-guard';
import { readNamePoll } from '@/lib/poll-store';
import { sha256 } from '@/lib/names';
import { UUID } from '@/lib/poll-types';

export async function POST(request: Request) {
  let value: unknown;
  try { value = await readJsonBody(request, 1024); }
  catch (error) { return NextResponse.json({ error: 'Invalid poll link.' }, { status: error instanceof RequestTooLarge ? 413 : 400 }); }
  const body = value as Record<string, unknown>;
  if (!body || typeof body.id !== 'string' || !UUID.test(body.id) || typeof body.token !== 'string' || body.token.length > 160 || (body.browserId !== undefined && (typeof body.browserId !== 'string' || !UUID.test(body.browserId)))) return NextResponse.json({ error: 'Invalid poll link.' }, { status: 400 });
  try {
    if (!await withinBetaLimit(request, 'poll-read', 180, 3600_000)) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    const voterHash = typeof body.browserId === 'string' ? await browserVoteHash(request, body.id, body.browserId) : null;
    const poll = await readNamePoll(body.id, await sha256(body.token), voterHash);
    if (!poll) return NextResponse.json({ error: 'This poll has expired or is unavailable.' }, { status: 404 });
    return NextResponse.json({ poll }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'We could not open this poll. Please try again.' }, { status: 503 }); }
}
