import { NextResponse } from 'next/server';
import { readJsonBody, RequestTooLarge } from '@/lib/beta-guard';
import { deleteNamePoll } from '@/lib/poll-store';
import { sha256 } from '@/lib/names';
import { UUID } from '@/lib/poll-types';

export async function POST(request: Request) {
  let value: unknown;
  try { value = await readJsonBody(request, 1024); }
  catch (error) { return NextResponse.json({ error: 'Invalid request.' }, { status: error instanceof RequestTooLarge ? 413 : 400 }); }
  const body = value as Record<string, unknown>;
  if (!body || typeof body.sourceId !== 'string' || !UUID.test(body.sourceId) || typeof body.deleteToken !== 'string' || body.deleteToken.length > 160) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    if (!await deleteNamePoll(body.sourceId, await sha256(body.deleteToken))) return NextResponse.json({ error: 'This poll is unavailable or this browser does not own it.' }, { status: 404 });
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ error: 'We could not close the poll. Please try again.' }, { status: 503 }); }
}
