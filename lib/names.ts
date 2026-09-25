import seed from './korean_given_names.seed.json';
import verifiedHanja from './hanja_verified.json';

export type NameStyle = 'gentle' | 'bright' | 'distinctive' | 'classic' | 'modern';
export type NameCandidate = {
  hangul: string; romanization: string; syllables: string; impression: string;
  reason: string; soundConnection: boolean; meaningConnection: boolean; hanja: null;
};
export type NameResult = {
  id: string; originalName: string; pronunciationHint: string | null;
  meaningHint: string | null; style: NameStyle; candidates: NameCandidate[];
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
];
const verifiedNameSet = new Set(verifiedHanja.names.map(name => name.hangul));
const catalog = [...seed.names as SeedName[], ...extraNames].filter(name => verifiedNameSet.has(name.hangul));
const descriptors: Record<NameStyle, string[]> = {
  gentle: ['gentle', 'soft', 'warm', 'calm', 'delicate', 'thoughtful'],
  bright: ['bright', 'fresh', 'lively', 'light', 'open'],
  distinctive: ['distinctive', 'clear', 'lyrical', 'bold', 'vivid'],
  classic: ['classic', 'timeless', 'refined', 'composed', 'elegant'],
  modern: ['modern', 'contemporary', 'simple', 'fresh', 'understated'],
};
export const styles: NameStyle[] = ['gentle', 'bright', 'distinctive', 'classic', 'modern'];
export const PRICE_KRW = 9900;

function normalized(input: string) {
  return input.normalize('NFKD').replace(/[^a-z]/gi, '').toLowerCase();
}
function hash(input: string) {
  let value = 2166136261;
  for (const char of input) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}
function overlap(a: string, b: string) {
  const left = [...new Set(a.match(/[aeiou]/g) ?? [])];
  const right = new Set(b.match(/[aeiou]/g) ?? []);
  return left.filter(v => right.has(v)).length;
}
export function validateNameRequest(value: unknown):
  | { ok: true; input: { name: string; pronunciationHint: string | null; meaningHint: string | null; style: NameStyle } }
  | { ok: false; error: string } {
  if (!value || typeof value !== 'object') return { ok: false, error: 'Please enter your name.' };
  const record = value as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim().normalize('NFC') : '';
  const pronunciationHint = typeof record.pronunciationHint === 'string' ? record.pronunciationHint.trim() : '';
  const meaningHint = typeof record.meaningHint === 'string' ? record.meaningHint.trim() : '';
  const style = styles.includes(record.style as NameStyle) ? record.style as NameStyle : 'gentle';
  if (name.length < 1 || name.length > 80 || /[\p{C}]/u.test(name)) return { ok: false, error: 'Enter a name of 1–80 characters.' };
  if (pronunciationHint.length > 100 || meaningHint.length > 180) return { ok: false, error: 'One of the optional details is too long.' };
  if (/[^\p{Script=Latin}\p{M}\p{Zs}'’-]/u.test(name) && !pronunciationHint)
    return { ok: false, error: 'Please add a pronunciation hint for this script.' };
  return { ok: true, input: { name, pronunciationHint: pronunciationHint || null, meaningHint: meaningHint || null, style } };
}
export function generateCandidates(input: { name: string; pronunciationHint: string | null; meaningHint?: string | null; style: NameStyle }): NameCandidate[] {
  const sound = normalized(input.pronunciationHint || input.name);
  const words = descriptors[input.style];
  const ranked = catalog.map(item => {
    const roman = normalized(item.romanization);
    const vibe = item.vibe_en.toLowerCase();
    const fit = words.reduce((sum, word) => sum + (vibe.includes(word) ? 9 : 0), 0);
    const soundConnection = !!sound && sound[0] === roman[0];
    const pair = verifiedHanja.names.find(name => name.hangul === item.hangul);
    const possibleGlosses = pair?.characterReferences.map(reference =>
      verifiedHanja.characters.find(character => character.unicode === reference)?.englishGloss || ''
    ).join(' ').toLowerCase() || '';
    const meaningWords = (input.meaningHint || '').toLowerCase().match(/[a-z]{4,}/g) || [];
    const meaningConnection = meaningWords.some(word => possibleGlosses.includes(word) || vibe.includes(word));
    const meaningFit = meaningConnection ? 8 : 0;
    const score = fit + meaningFit + (soundConnection ? 8 : 0) + overlap(sound, roman) * 2 + hash(input.name + input.style + item.hangul) % 7;
    return { item, score, soundConnection, meaningConnection };
  }).sort((a, b) => b.score - a.score || a.item.hangul.localeCompare(b.item.hangul));
  const chosen: typeof ranked = [];
  for (const entry of ranked) {
    if (chosen.some(pick => pick.item.hangul[0] === entry.item.hangul[0])) continue;
    chosen.push(entry);
    if (chosen.length === 5) break;
  }
  return chosen.map(({ item, soundConnection, meaningConnection }, index) => ({
    hangul: item.hangul,
    romanization: item.romanization,
    syllables: item.romanization_hyphenated,
    impression: item.vibe_en.replace(/^./, c => c.toUpperCase()),
    reason: meaningConnection
      ? 'A possible checked Hanja pairing connects with the meaning you shared.'
      : soundConnection
      ? 'Its opening sound echoes your name, while offering a natural Korean rhythm.'
      : item.vibe_en.toLowerCase().includes(input.style)
        ? 'Its ' + input.style + ' feel matches the direction you chose.'
        : index === 0
          ? 'A balanced place to start your Korean name journey.'
          : 'A different ' + item.vibe_en.split(',')[0] + ' direction to compare.',
    soundConnection, meaningConnection, hanja: null,
  }));
}
export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
