import { NextResponse } from 'next/server';
import { sha256 } from '@/lib/names';
import { readResult } from '@/lib/result-store';
import { readJsonBody, RequestTooLarge } from '@/lib/beta-guard';

export async function POST(request: Request) {
  let value: unknown;
  try { value = await readJsonBody(request, 1024); }
  catch (error) { return NextResponse.json({ error: error instanceof RequestTooLarge ? 'Request too large.' : 'Invalid request.' }, { status: error instanceof RequestTooLarge ? 413 : 400 }); }
  const body = value as Record<string, unknown>;
  if (!body || typeof body.id !== 'string' || typeof body.token !== 'string' || body.id.length > 80 || body.token.length > 160)
    return NextResponse.json({ error: 'Invalid result link.' }, { status: 400 });
  const result = await readResult(body.id, await sha256(body.token));
  if (!result) return NextResponse.json({ error: 'This result link has expired or is invalid.' }, { status: 404 });
  return NextResponse.json({ result }, { headers: { 'Cache-Control': 'no-store' } });
}
