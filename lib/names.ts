import seed from './korean_given_names.seed.json';
import verifiedHanja from './hanja_verified.json';
import { validateBirthInput, type BirthInput, type SajuSummary } from './saju';

export type NameStyle = 'gentle' | 'bright' | 'distinctive' | 'classic' | 'modern';
export type NameCandidate = {
  hangul: string; romanization: string; syllables: string; impression: string;
  reason: string; soundConnection: boolean; meaningConnection: boolean;
  birthConnection: { element: SajuSummary['dayElement']; character: string; image: string } | null;
  hanja: {
    pair: string;
    characters: { character: string; reading: string; gloss: string; officialUrl: string }[];
  } | null;
};
export type NameResult = {
  id: string; originalName: string; pronunciationHint: string | null;
  meaningHint: string | null; style: NameStyle; candidates: NameCandidate[];
  saju: SajuSummary | null;
  createdAt: number; expiresAt: number; algorithmVersion: string;
};
type SeedName = {
  hangul: string; romanization: string; romanization_hyphenated: string;
  style: string; vibe_en: string;
};
const extraNames: SeedName[] = [
  { hangul: '민서', romanization: 'Minseo', romanization_hyphenated: 'Min-seo', style: 'neutral', vibe_en: 'thoughtful, classic' },
  { hangul: '수빈', romanization: 'Subin', romanization_hyphenated: 'Su-bin', style: 'neutral', vibe_en: 'bright, polished' },
  { hangul: '은서', romanization: 'Eunseo', romanization_hyphenated: 'Eun-seo', style: 'neutral', vibe_en: 'warm, gentle' },
  { hangul: '예림', romanization: 'Yerim', romanization_hyphenated: 'Ye-rim', style: 'neutral', vibe_en: 'gentle, natural' },
  { hangul: '지성', romanization: 'Jiseong', romanization_hyphenated: 'Ji-seong', style: 'neutral', vibe_en: 'steady, grounded' },
  { hangul: '지은', romanization: 'Jieun', romanization_hyphenated: 'Ji-eun', style: 'neutral', vibe_en: 'clear, refined' },
];
function checkedPairFor(hangul: string) {
  const pair = verifiedHanja.names.find(name => name.hangul === hangul);
  const syllables = [...hangul];
  const glyphs = [...(pair?.hanja || '')];
  if (!pair || pair.characterAndReadingCheck !== 'passed' || syllables.length !== 2 ||
      glyphs.length !== 2 || pair.characterReferences.length !== 2) return null;
  const valid = pair.characterReferences.every((reference, index) => {
    const character = verifiedHanja.characters.find(entry => entry.unicode === reference);
    return character?.character === glyphs[index] &&
      character.officialFields.isinmyung === 1 && character.officialFields.use &&
      character.designatedReadings.includes(syllables[index]);
  });
  return valid ? pair : null;
}
const catalog = [...seed.names as SeedName[], ...extraNames].filter(name => checkedPairFor(name.hangul));
const descriptors: Record<NameStyle, string[]> = {
  gentle: ['gentle', 'soft', 'warm', 'calm', 'delicate', 'thoughtful'],
  bright: ['bright', 'fresh', 'lively', 'light', 'open'],
  distinctive: ['distinctive', 'clear', 'lyrical', 'bold', 'vivid'],
  classic: ['classic', 'timeless', 'refined', 'composed', 'elegant'],
  modern: ['modern', 'contemporary', 'simple', 'fresh', 'understated'],
};
export const styles: NameStyle[] = ['gentle', 'bright', 'distinctive', 'classic', 'modern'];
export const PRICE_KRW = 9900;
// Editorial literal imagery, not a court-approved Hanja element classification.
const elementImages: Record<string, { element: SajuSummary['dayElement']; image: string }> = {
  '林': { element: '木', image: 'forest' },
  '炫': { element: '火', image: 'radiance' },
  '城': { element: '土', image: 'fortress' },
  '銀': { element: '金', image: 'silver' },
  '河': { element: '水', image: 'river' },
};

function normalized(input: string) {
  return input.normalize('NFKD').replace(/[^a-z]/gi, '').toLowerCase();
}
function overlap(a: string, b: string) {
  const left = [...new Set(a.match(/[aeiou]/g) ?? [])];
  const right = new Set(b.match(/[aeiou]/g) ?? []);
  return left.filter(v => right.has(v)).length;
}
export function validateNameRequest(value: unknown):
  | { ok: true; input: { name: string; pronunciationHint: string | null; meaningHint: string | null; style: NameStyle } & BirthInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== 'object') return { ok: false, error: 'Please enter your name.' };
  const record = value as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim().normalize('NFC') : '';
  const pronunciationHint = typeof record.pronunciationHint === 'string' ? record.pronunciationHint.trim() : '';
  const meaningHint = typeof record.meaningHint === 'string' ? record.meaningHint.trim() : '';
  const style = styles.includes(record.style as NameStyle) ? record.style as NameStyle : 'gentle';
  if (name.length < 1 || name.length > 80 || /[\p{C}]/u.test(name)) return { ok: false, error: 'Enter a name of 1–80 characters.' };
  if (pronunciationHint.length > 100 || meaningHint.length > 180) return { ok: false, error: 'One of the optional details is too long.' };
  if (pronunciationHint && !normalized(pronunciationHint))
    return { ok: false, error: 'Write your pronunciation hint with Roman letters, such as EH-ma.' };
  if (/[^\p{Script=Latin}\p{M}\p{Zs}'’-]/u.test(name) && !pronunciationHint)
    return { ok: false, error: 'Please add a Roman-letter pronunciation hint for this script.' };
  const birth = validateBirthInput(record);
  if (!birth.ok) return birth;
  return { ok: true, input: { name, pronunciationHint: pronunciationHint || null, meaningHint: meaningHint || null, style, ...birth.input } };
}
export function generateCandidates(input: { name: string; pronunciationHint: string | null; meaningHint?: string | null; style: NameStyle }, saju: SajuSummary): NameCandidate[] {
  const sound = normalized(input.pronunciationHint || input.name);
  const words = descriptors[input.style];
  const ranked = catalog.map(item => {
    const roman = normalized(item.romanization);
    const vibe = item.vibe_en.toLowerCase();
    const fit = words.reduce((sum, word) => sum + (vibe.includes(word) ? 9 : 0), 0);
    const soundConnection = !!sound && sound[0] === roman[0];
    const pair = checkedPairFor(item.hangul);
    const possibleGlosses = pair?.characterReferences.map(reference =>
      verifiedHanja.characters.find(character => character.unicode === reference)?.englishGloss || ''
    ).join(' ').toLowerCase() || '';
    const meaningWords = (input.meaningHint || '').toLowerCase().match(/[a-z]{4,}/g) || [];
    const meaningConnection = meaningWords.some(word => possibleGlosses.includes(word) || vibe.includes(word));
    const meaningFit = meaningConnection ? 8 : 0;
    const birthConnection = [...(pair?.hanja || '')].map(character => {
      const image = elementImages[character];
      return image?.element === saju.dayElement ? { character, ...image } : null;
    }).find(Boolean) || null;
    const score = fit + meaningFit + (soundConnection ? 8 : 0) + overlap(sound, roman) * 2 + (birthConnection ? 18 : 0);
    return { item, score, soundConnection, meaningConnection, birthConnection };
  }).sort((a, b) => b.score - a.score || a.item.hangul.localeCompare(b.item.hangul));
  const chosen: typeof ranked = [];
  for (const entry of ranked) {
    if (chosen.some(pick => pick.item.hangul[0] === entry.item.hangul[0])) continue;
    chosen.push(entry);
    if (chosen.length === 5) break;
  }
  return chosen.map(({ item, soundConnection, meaningConnection, birthConnection }, index) => {
    const pairing = checkedPairFor(item.hangul);
    const characters = pairing?.characterReferences.map((reference, index) => {
      const character = verifiedHanja.characters.find(entry => entry.unicode === reference);
      const reading = [...item.hangul][index];
      if (!character || !reading || !character.designatedReadings.includes(reading)) return null;
      return { character: character.character, reading, gloss: character.englishGloss, officialUrl: character.sourceUrl };
    }) ?? [];
    const hanja = pairing && pairing.characterAndReadingCheck === 'passed' && characters.length === 2 && characters.every(Boolean)
      ? { pair: pairing.hanja, characters: characters as NonNullable<NameCandidate['hanja']>['characters'] }
      : null;
    return {
    hangul: item.hangul,
    romanization: item.romanization,
    syllables: item.romanization_hyphenated,
    impression: item.vibe_en.replace(/^./, c => c.toUpperCase()),
    reason: meaningConnection
      ? 'Its Hanja meaning or overall feeling connects with what you shared.'
      : soundConnection
      ? 'Its opening sound echoes your name, while offering a natural Korean rhythm.'
      : item.vibe_en.toLowerCase().includes(input.style)
        ? 'Its ' + input.style + ' feel matches the direction you chose.'
        : index === 0
          ? 'A balanced place to start your Korean name journey.'
          : 'A different ' + item.vibe_en.split(',')[0] + ' direction to compare.',
    soundConnection, meaningConnection, birthConnection, hanja,
  };
  });
}
export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
