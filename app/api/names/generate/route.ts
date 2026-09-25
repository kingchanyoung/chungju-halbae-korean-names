import { NextResponse } from 'next/server';
import { generateCandidates, sha256, validateNameRequest, type NameResult } from '@/lib/names';
import { saveResult } from '@/lib/result-store';

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 }); }
  const checked = validateNameRequest(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const now = Date.now();
  const token = crypto.randomUUID() + crypto.randomUUID();
  const result: NameResult = {
    id: crypto.randomUUID(), originalName: checked.input.name,
    pronunciationHint: checked.input.pronunciationHint, meaningHint: checked.input.meaningHint,
    style: checked.input.style, candidates: generateCandidates(checked.input),
    algorithmVersion: 'court-character-checked-1', createdAt: now, expiresAt: now + 7 * 86400_000,
  };
  try { await saveResult(result, await sha256(token)); }
  catch { return NextResponse.json({ error: 'We could not save your names. Please try again.' }, { status: 503 }); }
  return NextResponse.json({ result, token }, { headers: { 'Cache-Control': 'no-store' } });
}
