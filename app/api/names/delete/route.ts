import { NextResponse } from 'next/server';
import { readJsonBody, RequestTooLarge } from '@/lib/beta-guard';
import { sha256 } from '@/lib/names';
import { deleteResult } from '@/lib/result-store';

export async function POST(request: Request) {
  let value: unknown;
  try { value = await readJsonBody(request, 1024); }
  catch (error) { return NextResponse.json({ error: error instanceof RequestTooLarge ? 'Request too large.' : 'Invalid request.' }, { status: error instanceof RequestTooLarge ? 413 : 400 }); }
  const body = value as Record<string, unknown>;
  if (!body || typeof body.id !== 'string' || typeof body.deleteToken !== 'string' || body.id.length > 80 || body.deleteToken.length > 160)
    return NextResponse.json({ error: 'Invalid result link.' }, { status: 400 });
  let deleted: boolean;
  try { deleted = await deleteResult(body.id, await sha256(body.deleteToken)); }
  catch { return NextResponse.json({ error: 'We could not delete this result. Please try again.' }, { status: 503 }); }
  if (!deleted) return NextResponse.json({ error: 'This result is unavailable or cannot be deleted from this browser.' }, { status: 404 });
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
