import { NextResponse } from 'next/server';
import { generateCandidates, sha256, validateNameRequest, type NameResult } from '@/lib/names';
import { saveResult } from '@/lib/result-store';
import { calculateSaju } from '@/lib/saju';

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 }); }
  const checked = validateNameRequest(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  let saju: NameResult['saju'];
  try { saju = calculateSaju(checked.input); }
  catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The birth chart could not be calculated.' }, { status: 400 });
  }
  const now = Date.now();
  const token = crypto.randomUUID() + crypto.randomUUID();
  const candidates = generateCandidates(checked.input, saju);
  if (candidates.length !== 5) {
    return NextResponse.json({ error: 'This name direction needs more reviewed names. Choose another direction for now.' }, { status: 503 });
  }
  const result: NameResult = {
    id: crypto.randomUUID(), originalName: checked.input.name,
    pronunciationHint: checked.input.pronunciationHint, meaningHint: checked.input.meaningHint,
    style: checked.input.style, nameFeel: checked.input.nameFeel, saju, candidates,
    algorithmVersion: 'saju-feel-catalog-4', createdAt: now, expiresAt: now + 7 * 86400_000,
  };
  try { await saveResult(result, await sha256(token)); }
  catch { return NextResponse.json({ error: 'We could not save your names. Please try again.' }, { status: 503 }); }
  return NextResponse.json({ result, token }, { headers: { 'Cache-Control': 'no-store' } });
}
