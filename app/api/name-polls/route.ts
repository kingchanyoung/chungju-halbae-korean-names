import { NextResponse } from 'next/server';
import { readJsonBody, RequestTooLarge, withinBetaLimit } from '@/lib/beta-guard';
import { createNamePoll } from '@/lib/poll-store';
import { sha256 } from '@/lib/names';
import { UUID } from '@/lib/poll-types';

export async function POST(request: Request) {
  let value: unknown;
  try { value = await readJsonBody(request, 1024); }
  catch (error) { return NextResponse.json({ error: 'Check your shortlist and try again.' }, { status: error instanceof RequestTooLarge ? 413 : 400 }); }
  const body = value as Record<string, unknown>;
  if (!body || typeof body.sourceId !== 'string' || !UUID.test(body.sourceId) || typeof body.deleteToken !== 'string' || body.deleteToken.length > 160 || !Array.isArray(body.names) || body.names.length < 2 || body.names.length > 3 || new Set(body.names).size !== body.names.length || body.names.some(name => typeof name !== 'string' || !/^[가-힣]{2}$/.test(name)))
    return NextResponse.json({ error: 'Choose two or three different names from your result.' }, { status: 400 });
  try {
    if (!await withinBetaLimit(request, 'poll-create', 10, 3600_000)) return NextResponse.json({ error: 'Please wait about an hour before creating another poll.' }, { status: 429 });
    const result = await createNamePoll(body.sourceId, await sha256(body.deleteToken), body.names as string[]);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'We could not create your poll. Please try again.' }, { status: 503 }); }
}
