import seed from './korean_given_names.seed.json';
import corpus from './korean_name_corpus.json';
import verifiedHanja from './hanja_verified.json';
import { romanizeGivenName } from './romanize';
import { STEM_ELEMENT } from 'k-saju';
import { validateBirthInput, type BirthInput, type SajuSummary } from './saju';
import { nameDirections, type NameDirection } from './name-direction';

export type NameStyle = 'any' | 'gentle' | 'bright' | 'distinctive' | 'classic' | 'modern';
export type NamePresentation = 'masculine' | 'feminine' | 'neutral';
export type NameFeel = NamePresentation | 'any';
export type NamePriority = 'balanced' | 'sound' | 'meaning' | 'style';
export type CandidateEvidence = {
  sound: { matched: boolean; detail: string };
  meaning: { matched: boolean; detail: string };
  feeling: { matched: boolean; detail: string };
  birth: { matched: boolean; detail: string };
  direction?: { matched: boolean; detail: string };
};
export type NameCandidate = {
  hangul: string; romanization: string; syllables: string; impression: string;
  presentation: NamePresentation;
  reason: string; soundConnection: boolean; meaningConnection: boolean;
  birthConnection: { element: SajuSummary['dayElement']; character: string; image: string } | null;
  evidence?: CandidateEvidence;
  hanja: {
    pair: string;
    characters: { character: string; reading: string; gloss: string; officialUrl: string }[];
  } | null;
};
export type NameResult = {
  id: string; originalName: string; pronunciationHint: string | null;
  meaningHint: string | null; style: NameStyle; nameFeel: NameFeel; candidates: NameCandidate[];
  saju: SajuSummary | null;
  priority?: NamePriority;
  avoidTerms?: string[];
  direction?: NameDirection;
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
  any: [],
  gentle: ['gentle', 'soft', 'warm', 'calm', 'delicate', 'thoughtful'],
  bright: ['bright', 'fresh', 'lively', 'light', 'open'],
  distinctive: ['distinctive', 'clear', 'lyrical', 'bold', 'vivid'],
  classic: ['classic', 'timeless', 'refined', 'composed', 'elegant'],
  modern: ['modern', 'contemporary', 'simple', 'fresh', 'understated'],
};
export const styles: NameStyle[] = ['any', 'gentle', 'bright', 'distinctive', 'classic', 'modern'];
export const nameFeels: NameFeel[] = ['any', 'masculine', 'feminine', 'neutral'];
export const namePriorities: NamePriority[] = ['balanced', 'sound', 'meaning', 'style'];
export const PRICE_KRW = 9900;
function directionFit(item: CatalogName, direction: NameDirection) {
  const editorial = editorialNames.get(item.hangul)?.vibe_en.toLowerCase() || '';
  if (direction === 'any') return { score: 0, matched: false, detail: 'You left the name direction open.' };
  if (direction === 'familiar') {
    const matched = item.allUses >= 300;
    return { score: Math.min(3, Math.log2(1 + item.allUses / 100)), matched,
      detail: matched ? 'This name has a stronger frequency signal in our synthetic name sample. That is not a real-world popularity ranking.' : 'This name has a weaker familiarity signal in our synthetic sample; other connections helped it appear.' };
  }
  const matched = direction === 'timeless'
    ? /\b(classic|timeless|refined|composed|elegant)\b/.test(editorial)
    : item.courtBirths >= 3 || /\b(modern|contemporary|fresh)\b/.test(editorial);
  return { score: matched ? 3 : 0, matched,
    detail: direction === 'timeless'
      ? matched ? 'Our editorial name notes describe this as a classic or refined direction. This is not a measured generational match.' : 'We do not have a timeless editorial tag for this name; other connections helped it appear.'
      : matched ? 'This name appears in our limited recent Seoul birth-name sample or has a contemporary editorial tag. Neither establishes a nationwide trend.' : 'We do not have a recent sample signal or contemporary editorial tag for this name; other connections helped it appear.' };
}
// Literal imagery from checked character glosses. This is an editorial
// association, not an official Hanja element classification or yongshin.
const elementImages: Record<string, { element: SajuSummary['dayElement']; image: string }> = {
  '林': { element: '木', image: 'forest' },
  '炫': { element: '火', image: 'radiance' },
  '昭': { element: '火', image: 'brightness' },
  '城': { element: '土', image: 'fortress' },
  '銀': { element: '金', image: 'silver' },
  '河': { element: '水', image: 'river' },
  '源': { element: '水', image: 'source' },
};

function normalized(input: string) {
  return input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/gi, '').toLowerCase();
}
function soundKey(value: string) {
  return normalized(value)
    .replace(/ph/g, 'f').replace(/ck/g, 'k').replace(/qu/g, 'kw')
    .replace(/sh/g, 's').replace(/ch/g, 'j')
    .replace(/yeo/g, 'yo').replace(/eo/g, 'o').replace(/eu/g, 'u')
    .replace(/ae/g, 'e').replace(/ee/g, 'i').replace(/oo/g, 'u')
    .replace(/ou/g, 'u').replace(/y/g, 'i')
    .replace(/([a-z])\1+/g, '$1');
}
function editDistance(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = old;
    }
  }
  return previous[b.length];
}
function soundFit(original: string, candidate: string, hasHint: boolean) {
  const source = soundKey(original);
  const target = soundKey(candidate);
  if (!source || !target) return { score: 0, matched: false, detail: 'We need an English-letter pronunciation hint to compare sounds.' };
  const similarity = 1 - editDistance(source, target) / Math.max(source.length, target.length);
  const opening = source.slice(0, 2) === target.slice(0, 2) ? 3 : source[0] === target[0] ? 1 : 0;
  const score = Math.max(0, similarity * 7 + opening);
  const matched = similarity >= .55 || (opening === 3 && similarity >= .35);
  return {
    score: matched ? score : Math.min(score, 1),
    matched,
    detail: matched
      ? `Its Roman spelling sounds somewhat like your ${hasHint ? 'pronunciation hint' : 'written name'}. This is an approximate match.`
      : `We did not find a close sound match with your ${hasHint ? 'pronunciation hint' : 'written name'}.`,
  };
}

const meaningThemes = [
  { key: 'peace', cues: /\b(peace|peaceful|calm|seren(?:e|ity)|quiet|comfort|tranquil)\b/i, characters: '安舒' },
  { key: 'wisdom', cues: /\b(wisdom|wise|knowledge|learn|learning|insight|understand)\b/i, characters: '智知賢悟' },
  { key: 'kindness', cues: /\b(kind|kindness|care|caring|grace|help|helpful|goodness|love|loving)\b/i, characters: '恩善佑' },
  { key: 'hope', cues: /\b(hope|hopeful|grow|growth|flourish|new beginning|future|blessing)\b/i, characters: '瑞潤' },
  { key: 'nature', cues: /\b(nature|forest|tree|wood|river|water|sky|summer|earth)\b/i, characters: '林河源旻夏' },
  { key: 'light', cues: /\b(light|bright|brightness|shine|shining|radiance|sun)\b/i, characters: '炫昭彬' },
  { key: 'strength', cues: /\b(strength|strong|courage|brave|resilien\w*|stead\w*)\b/i, characters: '健' },
  { key: 'creativity', cues: /\b(art|artist|creative|creativity|poem|poetry|beauty|beautiful)\b/i, characters: '藝詩彩雅' },
] as const;
function meaningFit(hint: string | null | undefined, pair: ReturnType<typeof checkedPairFor>) {
  if (!hint) return { score: 0, matched: false, detail: 'You did not add a personal meaning or story.' };
  // A conservative keyword screen. Clearly negated mentions do not count as
  // preferences; this still does not claim to understand arbitrary prose.
  const clauses = hint.split(/[.!?;\n]|\bbut\b/i);
  const requested = meaningThemes.filter(theme => clauses.some(clause => {
    const match = theme.cues.exec(clause);
    if (!match) return false;
    const before = clause.slice(0, match.index).slice(-45);
    const after = clause.slice(match.index + match[0].length);
    return !/\b(?:not|no|avoid|without|never|don't|dislike)\b[^,]{0,35}$/i.test(before) && !/^\s+(?:is|are|was|would be)\s+not\b/i.test(after);
  }));
  if (!requested.length) return { score: 0, matched: false, detail: 'We could not connect your note to a checked Hanja meaning in this beta.' };
  if (!pair) return { score: 0, matched: false, detail: 'This name has no checked Hanja spelling yet, so we cannot compare its literal meaning.' };
  for (const theme of requested) {
    const character = [...pair.hanja].find(glyph => theme.characters.includes(glyph));
    if (character) {
      const verified = verifiedHanja.characters.find(entry => entry.character === character);
      return { score: 7, matched: true, detail: `${character} can mean ${verified?.englishGloss || 'a related idea'}. Your note mentions a word in our ${theme.key} theme, so we show this possible connection. This is one possible Hanja spelling.` };
    }
  }
  return { score: 0, matched: false, detail: 'These checked characters do not directly reflect the meaning theme you chose.' };
}
function birthFit(pair: ReturnType<typeof checkedPairFor>, saju: SajuSummary) {
  const stems = [
    { label: 'day', element: saju.dayElement, weight: 5 },
    { label: 'month', element: saju.month ? STEM_ELEMENT[saju.month.stem] : null, weight: 2 },
    { label: 'year', element: saju.year ? STEM_ELEMENT[saju.year.stem] : null, weight: 1 },
    { label: 'hour', element: saju.hour ? STEM_ELEMENT[saju.hour.stem] : null, weight: 1 },
  ];
  const matches = [...(pair?.hanja || '')].flatMap(character => {
    const image = elementImages[character];
    return image ? stems.filter(stem => stem.element === image.element).map(stem => ({ ...stem, character, image })) : [];
  }).sort((a, b) => b.weight - a.weight);
  const best = matches[0];
  if (!best) return {
    score: 0, matched: false, connection: null,
    detail: pair
      ? 'We found no clear birth-chart link in these checked characters.'
      : 'No checked Hanja spelling yet, so we cannot score a birth-chart link for this name.',
  };
  return {
    score: Math.min(7, matches.reduce((sum, match) => sum + match.weight, 0)),
    matched: true,
    connection: best.label === 'day' ? { element: best.image.element, character: best.character, image: best.image.image } : null,
    detail: `${best.character} evokes ${best.image.image}, which we symbolically link to the ${best.label} part of your birth chart. This does not predict your fortune.`,
  };
}
export function validateNameRequest(value: unknown):
  | { ok: true; input: { name: string; pronunciationHint: string | null; meaningHint: string | null; style: NameStyle; nameFeel: NameFeel; priority: NamePriority; direction: NameDirection; excludeNames: string[]; avoidTerms: string[] } & BirthInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== 'object') return { ok: false, error: 'Please enter your name.' };
  const record = value as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim().normalize('NFC') : '';
  const pronunciationHint = typeof record.pronunciationHint === 'string' ? record.pronunciationHint.trim() : '';
  const meaningHint = typeof record.meaningHint === 'string' ? record.meaningHint.trim() : '';
  const style = styles.includes(record.style as NameStyle) ? record.style as NameStyle : 'any';
  const direction = record.direction === undefined ? (style === 'classic' ? 'timeless' : style === 'modern' ? 'contemporary' : 'any') : record.direction as NameDirection;
  if (!nameDirections.includes(direction)) return { ok: false, error: 'Choose a valid name direction.' };
  const nameFeel = record.nameFeel === undefined ? 'any' : record.nameFeel as NameFeel;
  if (!nameFeels.includes(nameFeel)) return { ok: false, error: 'Choose a valid name impression.' };
  const priority = record.priority === undefined ? 'balanced' : record.priority as NamePriority;
  if (!namePriorities.includes(priority)) return { ok: false, error: 'Choose a valid naming focus.' };
  const excludeNames = record.excludeNames === undefined ? [] : record.excludeNames;
  if (!Array.isArray(excludeNames) || excludeNames.length > 30 || excludeNames.some(value => typeof value !== 'string' || !/^[가-힣]{2}$/.test(value)))
    return { ok: false, error: 'Please refine a smaller set of name options.' };
  const avoidTerms = record.avoidTerms === undefined ? [] : record.avoidTerms;
  if (!Array.isArray(avoidTerms) || avoidTerms.length > 10 || avoidTerms.some(term => typeof term !== 'string' || !term.trim() || term.length > 20 || !(/^[가-힣]{1,2}$/.test(term.trim()) || (/^[\p{Script=Latin}\p{M}\s'-]+$/u.test(term) && normalized(term)))))
    return { ok: false, error: 'Use up to ten names or syllables to avoid, in Hangul or Roman letters.' };
  if (name.length < 1 || name.length > 80 || /[\p{C}]/u.test(name)) return { ok: false, error: 'Enter a name of 1–80 characters.' };
  if (pronunciationHint.length > 100 || meaningHint.length > 500) return { ok: false, error: 'One of the optional details is too long.' };
  if (pronunciationHint && !normalized(pronunciationHint))
    return { ok: false, error: 'Write your pronunciation hint with Roman letters, such as EH-ma.' };
  if (/[^\p{Script=Latin}\p{M}\p{Zs}'’-]/u.test(name) && !pronunciationHint)
    return { ok: false, error: 'Please add a Roman-letter pronunciation hint for this script.' };
  const birth = validateBirthInput(record);
  if (!birth.ok) return birth;
  return { ok: true, input: { name, pronunciationHint: pronunciationHint || null, meaningHint: meaningHint || null, style, nameFeel, priority, direction, excludeNames, avoidTerms: avoidTerms.map(term => term.trim().normalize('NFC')), ...birth.input } };
}
export function generateCandidates(input: { name: string; pronunciationHint: string | null; meaningHint?: string | null; style: NameStyle; nameFeel: NameFeel; priority?: NamePriority; direction?: NameDirection; excludeNames?: string[]; avoidTerms?: string[] }, saju: SajuSummary): NameCandidate[] {
  const words = descriptors[input.style];
  // Use a stronger source signal for the default shortlist. Synthetic counts
  // are a screening heuristic, never a population ranking or native review.
  const eligible = catalog.filter(item => (item.courtBirths >= 3 || item.youngUses >= 100) && (input.nameFeel === 'any' || item.style === input.nameFeel) && !input.excludeNames?.includes(item.hangul) && !input.avoidTerms?.some(term => {
    if (/^[가-힣]+$/.test(term)) return term.length === 1 ? item.hangul.includes(term) : item.hangul === term;
    const key = normalized(term);
    return !!key && (normalized(item.romanization) === key || normalized(item.romanization_hyphenated) === key || item.romanization_hyphenated.split('-').some(syllable => normalized(syllable) === key));
  }));
  const ranked = eligible.map(item => {
    const vibe = item.vibe_en.toLowerCase();
    const feelingMatched = words.some(word => vibe.split(/[, ]+/).includes(word));
    const feeling = {
      matched: feelingMatched,
      detail: input.style === 'any'
        ? `You left the style open. We describe this name as ${vibe}.`
        : feelingMatched
          ? `We describe this name as ${vibe}, fitting the ${input.style} style you chose.`
          : `We describe this name as ${vibe}, a different direction from the ${input.style} style you chose.`,
    };
    const sound = soundFit(input.pronunciationHint || input.name, item.romanization, !!input.pronunciationHint);
    const pair = checkedPairFor(item.hangul);
    const meaning = meaningFit(input.meaningHint, pair);
    const birth = birthFit(pair, saju);
    const direction = directionFit(item, input.direction || 'any');
    // Synthetic frequency is a conservative naturalness signal, not a claim
    // about actual registrations. No random factor is used in ranking.
    const familiarity = Math.min(5, Math.log2(1 + item.youngUses / 10) * 1.2);
    const courtSignal = Math.min(2, Math.log2(1 + item.courtBirths) * .4);
    const rarePenalty = item.youngUses < 20 && item.courtBirths < 5 ? 5 : item.youngUses < 40 && item.courtBirths < 5 ? 2 : 0;
    const score = (feelingMatched ? (input.priority === 'style' ? 8 : 3) : 0) + sound.score * (input.priority === 'sound' ? 1.8 : 1) + meaning.score * (input.priority === 'meaning' ? 1.8 : 1) + birth.score + familiarity + courtSignal - rarePenalty + direction.score;
    return { item, score, sound, meaning, feeling, birth, direction };
  }).sort((a, b) => b.score - a.score || a.item.hangul.localeCompare(b.item.hangul));
  const chosen: typeof ranked = [];
  const canAdd = (entry: (typeof ranked)[number]) => !chosen.some(pick => pick.item.hangul[0] === entry.item.hangul[0]) && chosen.filter(pick => pick.item.hangul[1] === entry.item.hangul[1]).length < 2;
  // Reserve at most one defensible, checked-character connection when it is
  // reasonably close to the strongest overall match. The broad Hangul corpus
  // still supplies the other names, avoiding a 51-name-only experience.
  const grounded = ranked.find(entry => (entry.birth.matched || entry.meaning.matched) && entry.score >= (ranked[0]?.score ?? 0) - 8);
  if (grounded) chosen.push(grounded);
  // A requested mix actually includes all three presentation categories.
  if (input.nameFeel === 'any') {
    for (const presentation of ['feminine', 'masculine', 'neutral'] as const) {
      if (chosen.some(entry => entry.item.style === presentation)) continue;
      const next = ranked.find(entry => entry.item.style === presentation && canAdd(entry));
      if (next) chosen.push(next);
    }
  }
  for (const entry of ranked) {
    if (chosen.some(pick => pick.item.hangul === entry.item.hangul)) continue;
    if (!canAdd(entry)) continue;
    chosen.push(entry);
    if (chosen.length === 5) break;
  }
  chosen.sort((a, b) => b.score - a.score || a.item.hangul.localeCompare(b.item.hangul));
  return chosen.map(({ item, sound, meaning, feeling, birth, direction }) => {
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
      impression: item.vibe_en.replace(/^./, character => character.toUpperCase()),
      reason: meaning.matched ? meaning.detail : birth.matched ? birth.detail : sound.matched ? sound.detail : feeling.detail,
      soundConnection: sound.matched,
      meaningConnection: meaning.matched,
      birthConnection: birth.connection,
      evidence: { sound: { matched: sound.matched, detail: sound.detail }, meaning: { matched: meaning.matched, detail: meaning.detail }, feeling, birth: { matched: birth.matched, detail: birth.detail }, direction: { matched: direction.matched, detail: direction.detail } },
      hanja,
    };
  });
}
export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
