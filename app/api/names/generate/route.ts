import { NextResponse } from 'next/server';
import { generateCandidates, sha256, validateNameRequest, type NameResult } from '@/lib/names';
import { saveResult } from '@/lib/result-store';
import { calculateSaju } from '@/lib/saju';
import { readJsonBody, RequestTooLarge, withinBetaLimit } from '@/lib/beta-guard';

export async function POST(request: Request) {
  let body: unknown;
  try { body = await readJsonBody(request); }
  catch (error) { return NextResponse.json({ error: error instanceof RequestTooLarge ? 'Your request is too long.' : 'Please check your answers and try again.' }, { status: error instanceof RequestTooLarge ? 413 : 400 }); }
  const checked = validateNameRequest(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  try {
    if (!await withinBetaLimit(request, 'names', 30, 60 * 60_000))
      return NextResponse.json({ error: 'You have tried many names in a short time. Please try again in about an hour.' }, { status: 429, headers: { 'Retry-After': '3600' } });
  } catch {
    return NextResponse.json({ error: 'The beta is temporarily unavailable. Please try again soon.' }, { status: 503 });
  }
  let saju: NameResult['saju'];
  try { saju = calculateSaju(checked.input); }
  catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The birth chart could not be calculated.' }, { status: 400 });
  }
  const now = Date.now();
  const token = crypto.randomUUID() + crypto.randomUUID();
  const deleteToken = crypto.randomUUID() + crypto.randomUUID();
  const candidates = generateCandidates(checked.input, saju);
  if (candidates.length !== 5 || (checked.input.nameFeel === 'any' && new Set(candidates.map(item => item.presentation)).size !== 3)) {
    return NextResponse.json({ error: 'There are too few options for these preferences. Remove an exclusion or choose another direction.' }, { status: 422 });
  }
  const result: NameResult = {
    id: crypto.randomUUID(), originalName: checked.input.name,
    pronunciationHint: checked.input.pronunciationHint, meaningHint: checked.input.meaningHint,
    style: checked.input.style, nameFeel: checked.input.nameFeel, saju, candidates,
    priority: checked.input.priority,
    avoidTerms: checked.input.avoidTerms,
    direction: checked.input.direction,
    algorithmVersion: 'name-direction-beta-12', createdAt: now, expiresAt: now + 7 * 86400_000,
  };
  try { await saveResult(result, await sha256(token), await sha256(deleteToken)); }
  catch { return NextResponse.json({ error: 'We could not save your names. Please try again.' }, { status: 503 }); }
  return NextResponse.json({ result, token, deleteToken }, { headers: { 'Cache-Control': 'no-store' } });
}
