import type { NameCandidate } from './names';

export type FamilyPreview = { mode: 'none' | 'own' | 'korean'; hangul: string; romanization: string };
export const NO_FAMILY: FamilyPreview = { mode: 'none', hangul: '', romanization: '' };

export function displayName(candidate: Pick<NameCandidate, 'hangul' | 'romanization'>, family: FamilyPreview = NO_FAMILY) {
  if (family.mode === 'korean') return { hangul: family.hangul + candidate.hangul, romanization: family.romanization + ' ' + candidate.romanization };
  if (family.mode === 'own' && family.hangul.trim()) return { hangul: family.hangul.trim() + ' · ' + candidate.hangul, romanization: family.hangul.trim() + ' · ' + candidate.romanization };
  return { hangul: candidate.hangul, romanization: candidate.romanization };
}

// An allowlist keeps birth information, source names and access tokens out of
// the exported image. Family previews are supplied only by the user.
export function shareCardText(candidate: Pick<NameCandidate, 'hangul' | 'romanization' | 'syllables' | 'hanja'>, family: FamilyPreview = NO_FAMILY) {
  return { ...displayName(candidate, family), syllables: candidate.syllables, hanja: candidate.hanja?.pair || null };
}

export async function downloadNameCard(candidate: NameCandidate, family: FamilyPreview = NO_FAMILY) {
  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image download is unavailable in this browser.');
  const card = shareCardText(candidate, family);
  ctx.fillStyle = '#090909'; ctx.fillRect(0, 0, 1200, 1200);
  ctx.strokeStyle = '#bba16b'; ctx.lineWidth = 2; ctx.strokeRect(58, 58, 1084, 1084);
  ctx.textAlign = 'center'; ctx.fillStyle = '#cdb27a';
  ctx.font = '500 24px Arial'; ctx.fillText('MY KOREAN NAME', 600, 218);
  ctx.fillStyle = '#f4eddc';
  let fontSize = 164;
  do { ctx.font = `400 ${fontSize}px "Gowun Batang", serif`; fontSize -= 4; } while (ctx.measureText(card.hangul).width > 1000 && fontSize > 8);
  ctx.fillText(card.hangul, 600, 500);
  ctx.fillStyle = '#ddc58e';
  let romanSize = 50;
  do { ctx.font = `400 ${romanSize}px Arial`; romanSize -= 2; } while (ctx.measureText(card.romanization).width > 1000 && romanSize > 12);
  ctx.fillText(card.romanization, 600, 590);
  ctx.font = '400 28px Arial'; ctx.fillStyle = '#9e9788'; ctx.fillText(candidate.syllables, 600, 646);
  if (card.hanja) { ctx.font = '400 66px "Gowun Batang", serif'; ctx.fillStyle = '#cdb27a'; ctx.fillText(card.hanja, 600, 790); }
  ctx.font = '400 21px Arial'; ctx.fillStyle = '#bca777'; ctx.fillText('CHUNGJU HALBAE NAMES', 600, 995);
  ctx.font = '400 17px Arial'; ctx.fillStyle = '#837e73'; ctx.fillText('A cultural nickname · Not a legal name certificate', 600, 1042);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('The image could not be saved.')), 'image/png'));
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `my-korean-name-${candidate.romanization}.png`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
