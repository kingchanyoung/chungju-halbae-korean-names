import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { readJsonBody, RequestTooLarge, withinBetaLimit } from '@/lib/beta-guard';

export async function POST(request: Request) {
  let value: unknown;
  try { value = await readJsonBody(request, 2048); }
  catch (error) { return NextResponse.json({ error: error instanceof RequestTooLarge ? 'Your feedback is too long.' : 'Please check your feedback and try again.' }, { status: error instanceof RequestTooLarge ? 413 : 400 }); }
  if (!value || typeof value !== 'object') return NextResponse.json({ error: 'Choose a rating first.' }, { status: 400 });
  const body = value as Record<string, unknown>;
  const rating = body.rating;
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  const selectedName = typeof body.selectedName === 'string' ? body.selectedName : '';
  if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5)
    return NextResponse.json({ error: 'Choose a rating from 1 to 5.' }, { status: 400 });
  if (comment.length > 500 || /[\p{C}]/u.test(comment))
    return NextResponse.json({ error: 'Keep your comment under 500 characters.' }, { status: 400 });
  if (selectedName && !/^[가-힣]{2}$/.test(selectedName))
    return NextResponse.json({ error: 'Choose a name from your result.' }, { status: 400 });
  try {
    if (!await withinBetaLimit(request, 'feedback', 5, 24 * 60 * 60_000))
      return NextResponse.json({ error: 'Thanks for testing. You can send more feedback tomorrow.' }, { status: 429 });
    await env.DB.prepare('INSERT INTO beta_feedback (id, rating, selected_name, comment, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), rating, selectedName || null, comment, Date.now()).run();
  } catch {
    return NextResponse.json({ error: 'Your feedback could not be saved. Please try again.' }, { status: 503 });
  }
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
