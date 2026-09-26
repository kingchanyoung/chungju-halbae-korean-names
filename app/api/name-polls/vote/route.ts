import { NextResponse } from 'next/server';
import { browserVoteHash, readJsonBody, RequestTooLarge, withinBetaLimit } from '@/lib/beta-guard';
import { voteNamePoll } from '@/lib/poll-store';
import { sha256 } from '@/lib/names';
import { UUID } from '@/lib/poll-types';

export async function POST(request: Request) {
  let value: unknown;
  try { value = await readJsonBody(request, 1024); }
  catch (error) { return NextResponse.json({ error: 'Invalid vote.' }, { status: error instanceof RequestTooLarge ? 413 : 400 }); }
  const body = value as Record<string, unknown>;
  if (!body || typeof body.id !== 'string' || !UUID.test(body.id) || typeof body.token !== 'string' || body.token.length > 160 || typeof body.browserId !== 'string' || !UUID.test(body.browserId) || typeof body.selectedName !== 'string' || !/^[가-힣]{2}$/.test(body.selectedName)) return NextResponse.json({ error: 'Choose a name from this poll.' }, { status: 400 });
  try {
    if (!await withinBetaLimit(request, 'poll-vote', 30, 86400_000)) return NextResponse.json({ error: 'You have sent several votes today. Please try again tomorrow.' }, { status: 429 });
    const result = await voteNamePoll(body.id, await sha256(body.token), await browserVoteHash(request, body.id, body.browserId), body.selectedName);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'Your vote could not be saved. Please try again.' }, { status: 503 }); }
}
