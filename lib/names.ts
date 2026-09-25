import seed from './korean_given_names.seed.json';
import corpus from './korean_name_corpus.json';
import verifiedHanja from './hanja_verified.json';
import { romanizeGivenName } from './romanize';
import { validateBirthInput, type BirthInput, type SajuSummary } from './saju';

export type NameStyle = 'gentle' | 'bright' | 'distinctive' | 'classic' | 'modern';
export type NamePresentation = 'masculine' | 'feminine' | 'neutral';
export type NameFeel = NamePresentation | 'any';
export type NameCandidate = {
  hangul: string; romanization: string; syllables: string; impression: string;
  presentation: NamePresentation;
  reason: string; soundConnection: boolean; meaningConnection: boolean;
  birthConnection: { element: SajuSummary['dayElement']; character: string; image: string } | null;
  hanja: {
    pair: string;
    characters: { character: string; reading: string; gloss: string; officialUrl: string }[];
  } | null;
};
export type NameResult = {
  id: string; originalName: string; pronunciationHint: string | null;
  meaningHint: string | null; style: NameStyle; nameFeel: NameFeel; candidates: NameCandidate[];
  saju: SajuSummary | null;
  createdAt: number; expiresAt: number; algorithmVersion: string;
};
type SeedName = {
  hangul: string; romanization: string; romanization_hyphenated: string;
  style: NamePresentation; vibe_en: string;
};
type CatalogName = SeedName & {
  youngUses: number; allUses: number; courtBirths: number; editorial: boolean;
};
const extraNames: SeedName[] = [
  { hangul: '민서', romanization: 'Minseo', romanization_hyphenated: 'Min-seo', style: 'neutral', vibe_en: 'thoughtful, classic' },
  { hangul: '수빈', romanization: 'Subin', romanization_hyphenated: 'Su-bin', style: 'neutral', vibe_en: 'bright, polished' },
  { hangul: '은서', romanization: 'Eunseo', romanization_hyphenated: 'Eun-seo', style: 'feminine', vibe_en: 'warm, gentle' },
  { hangul: '예림', romanization: 'Yerim', romanization_hyphenated: 'Ye-rim', style: 'feminine', vibe_en: 'gentle, natural' },
  { hangul: '지성', romanization: 'Jiseong', romanization_hyphenated: 'Ji-seong', style: 'masculine', vibe_en: 'steady, grounded' },
  { hangul: '지은', romanization: 'Jieun', romanization_hyphenated: 'Ji-eun', style: 'feminine', vibe_en: 'clear, refined' },
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
// Editorial review of name impression; this is not a statement about a person's gender.
const presentationOverrides: Partial<Record<string, NamePresentation>> = {
  '이안': 'masculine', '이현': 'masculine', '시원': 'masculine',
  '지율': 'feminine', '하율': 'feminine',
};
const editorialNames = new Map([...seed.names as SeedName[], ...extraNames].map(name => [name.hangul, name]));
function corpusImpression(name: string, youngUses: number, allUses: number, courtBirths: number) {
  const ageShare = allUses ? youngUses / allUses : 1;
  const tags: string[] = [];
  if (ageShare >= .7 || courtBirths >= 10) tags.push('modern');
  else if (allUses >= 100) tags.push('classic');
  else tags.push('distinctive');
  if (/[아연은윤림유]$/.test(name)) tags.push('gentle');
  else if (/^[하나예아라소]/.test(name)) tags.push('bright');
  else tags.push('familiar');
  return tags.join(', ');
}
const catalog: CatalogName[] = corpus.names.map(entry => {
  const editorial = editorialNames.get(entry.hangul);
  const guide = romanizeGivenName(entry.hangul);
  return {
    hangul: entry.hangul,
    romanization: editorial?.romanization ?? guide.romanization,
    romanization_hyphenated: editorial?.romanization_hyphenated ?? guide.romanization_hyphenated,
    style: presentationOverrides[entry.hangul] ?? (entry.presentation as NamePresentation),
    vibe_en: editorial?.vibe_en ?? corpusImpression(entry.hangul, entry.syntheticYoungUses, entry.syntheticAllUses, entry.courtSeoulTop20Births),
    youngUses: entry.syntheticYoungUses,
    allUses: entry.syntheticAllUses,
    courtBirths: entry.courtSeoulTop20Births,
    editorial: !!editorial,
  };
});
export const CATALOG_COUNT = catalog.length;
const descriptors: Record<NameStyle, string[]> = {
  gentle: ['gentle', 'soft', 'warm', 'calm', 'delicate', 'thoughtful'],
  bright: ['bright', 'fresh', 'lively', 'light', 'open'],
  distinctive: ['distinctive', 'clear', 'lyrical', 'bold', 'vivid'],
  classic: ['classic', 'timeless', 'refined', 'composed', 'elegant'],
  modern: ['modern', 'contemporary', 'simple', 'fresh', 'understated'],
};
export const styles: NameStyle[] = ['gentle', 'bright', 'distinctive', 'classic', 'modern'];
export const nameFeels: NameFeel[] = ['any', 'masculine', 'feminine', 'neutral'];
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
function spellingFit(original: string, romanization: string) {
  if (!original || !romanization) return 0;
  let score = original[0] === romanization[0] ? 8 : 0;
  if (original.slice(0, 2) === romanization.slice(0, 2)) score += 5;
  const pairs = new Set(Array.from({ length: Math.max(0, original.length - 1) }, (_, i) => original.slice(i, i + 2)));
  const sharedPairs = new Set(Array.from({ length: Math.max(0, romanization.length - 1) }, (_, i) => romanization.slice(i, i + 2)).filter(pair => pairs.has(pair)));
  score += Math.min(sharedPairs.size, 3) * 2;
  const vowels = new Set(original.match(/[aeiou]/g) ?? []);
  score += Math.min(new Set((romanization.match(/[aeiou]/g) ?? []).filter(vowel => vowels.has(vowel))).size, 2);
  return score;
}
function stableVariation(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}
export function validateNameRequest(value: unknown):
  | { ok: true; input: { name: string; pronunciationHint: string | null; meaningHint: string | null; style: NameStyle; nameFeel: NameFeel } & BirthInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== 'object') return { ok: false, error: 'Please enter your name.' };
  const record = value as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim().normalize('NFC') : '';
  const pronunciationHint = typeof record.pronunciationHint === 'string' ? record.pronunciationHint.trim() : '';
  const meaningHint = typeof record.meaningHint === 'string' ? record.meaningHint.trim() : '';
  const style = styles.includes(record.style as NameStyle) ? record.style as NameStyle : 'gentle';
  const nameFeel = record.nameFeel === undefined ? 'any' : record.nameFeel as NameFeel;
  if (!nameFeels.includes(nameFeel)) return { ok: false, error: 'Choose a valid name impression.' };
  if (name.length < 1 || name.length > 80 || /[\p{C}]/u.test(name)) return { ok: false, error: 'Enter a name of 1–80 characters.' };
  if (pronunciationHint.length > 100 || meaningHint.length > 180) return { ok: false, error: 'One of the optional details is too long.' };
  if (pronunciationHint && !normalized(pronunciationHint))
    return { ok: false, error: 'Write your pronunciation hint with Roman letters, such as EH-ma.' };
  if (/[^\p{Script=Latin}\p{M}\p{Zs}'’-]/u.test(name) && !pronunciationHint)
    return { ok: false, error: 'Please add a Roman-letter pronunciation hint for this script.' };
  const birth = validateBirthInput(record);
  if (!birth.ok) return birth;
  return { ok: true, input: { name, pronunciationHint: pronunciationHint || null, meaningHint: meaningHint || null, style, nameFeel, ...birth.input } };
}
export function generateCandidates(input: { name: string; pronunciationHint: string | null; meaningHint?: string | null; style: NameStyle; nameFeel: NameFeel }, saju: SajuSummary): NameCandidate[] {
  const sound = normalized(input.pronunciationHint || input.name);
  const words = descriptors[input.style];
  const eligible = input.nameFeel === 'any' ? catalog : catalog.filter(item => item.style === input.nameFeel);
  const variationKey = [sound, saju.day.hanja, input.style, input.nameFeel].join('|');
  const ranked = eligible.map(item => {
    const roman = normalized(item.romanization);
    const vibe = item.vibe_en.toLowerCase();
    const fit = words.some(word => vibe.split(/[, ]+/).includes(word)) ? 2 : 0;
    const soundConnection = !!sound && sound[0] === roman[0];
    const pair = checkedPairFor(item.hangul);
    const possibleGlosses = pair?.characterReferences.map(reference =>
      verifiedHanja.characters.find(character => character.unicode === reference)?.englishGloss || ''
    ).join(' ').toLowerCase() || '';
    const meaningWords = (input.meaningHint || '').toLowerCase().match(/[a-z]{4,}/g) || [];
    const meaningConnection = meaningWords.some(word => possibleGlosses.includes(word) || vibe.includes(word));
    const meaningFit = meaningConnection ? (pair ? 6 : 2) : 0;
    const birthConnection = [...(pair?.hanja || '')].map(character => {
      const image = elementImages[character];
      return image?.element === saju.dayElement ? { character, ...image } : null;
    }).find(Boolean) || null;
    // Synthetic frequency is a conservative naturalness signal, not a claim
    // about actual registrations. The date only resolves close ranks.
    const familiarity = Math.min(5, Math.log2(1 + item.youngUses / 10) * 1.2);
    const courtSignal = Math.min(2, Math.log2(1 + item.courtBirths) * .4);
    const variation = stableVariation(variationKey + '|' + item.hangul) * 6;
    const rarePenalty = item.youngUses < 20 && item.courtBirths < 5 ? 5 : item.youngUses < 40 && item.courtBirths < 5 ? 2 : 0;
    const score = fit + meaningFit + spellingFit(sound, roman) + familiarity + courtSignal + variation + (birthConnection ? 1 : 0) - rarePenalty;
    return { item, score, soundConnection, meaningConnection, birthConnection };
  }).sort((a, b) => b.score - a.score || a.item.hangul.localeCompare(b.item.hangul));
  const chosen: typeof ranked = [];
  if (input.nameFeel === 'any') {
    for (const impression of ['neutral', 'masculine', 'feminine'] as const) {
      const match = ranked.find(entry => entry.item.style === impression &&
        !chosen.some(pick => pick.item.hangul[0] === entry.item.hangul[0]) &&
        chosen.filter(pick => pick.item.hangul[1] === entry.item.hangul[1]).length < 2);
      if (match) chosen.push(match);
    }
  }
  for (const entry of ranked) {
    if (chosen.some(pick => pick.item.hangul === entry.item.hangul)) continue;
    if (chosen.some(pick => pick.item.hangul[0] === entry.item.hangul[0])) continue;
    if (chosen.filter(pick => pick.item.hangul[1] === entry.item.hangul[1]).length >= 2) continue;
    chosen.push(entry);
    if (chosen.length === 5) break;
  }
  chosen.sort((a, b) => b.score - a.score || a.item.hangul.localeCompare(b.item.hangul));
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
    presentation: item.style,
    impression: item.vibe_en.replace(/^./, c => c.toUpperCase()),
    reason: meaningConnection
      ? 'Its Hanja meaning or overall feeling connects with what you shared.'
      : soundConnection
      ? 'Its Roman spelling begins with the same letter as your name.'
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
