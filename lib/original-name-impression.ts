import reference from './original-name-usage.json';
import type { NameFeel } from './names';

export type NameImpressionBasis = {
  mode: 'automatic' | 'explicit'; resolved: Exclude<NameFeel, 'auto'>;
  detail: string; sourceUrl: string | null;
  matchedName?: string; reportedCount?: number; dominantShare?: number;
  referenceYears?: number[];
};
// A conservative editorial hold list for widely shared or cross-cultural forms.
// These are not classified from US totals alone, even when one share is high.
const ambiguousNames = new Set([
  'alex', 'sam', 'charlie', 'taylor', 'jordan', 'casey', 'jamie', 'robin',
  'avery', 'riley', 'morgan', 'quinn', 'ashley', 'leslie', 'kim', 'sasha',
  'andrea', 'jean', 'nicola', 'michele', 'rene', 'renee', 'francis', 'frances',
  'carmen', 'jan', 'toni', 'tony', 'sandy', 'pat', 'lee', 'jules', 'noa',
]);
const explicitLabels = { any: 'a mix of name impressions', masculine: 'a masculine impression', feminine: 'a feminine impression', neutral: 'a gender-neutral impression' };
function nameKey(name: string) {
  const trimmed = name.trim();
  if (!/^[\p{Script=Latin}\p{M}\s'’-]+$/u.test(trimmed)) return '';
  // Match the entire supplied given name. Do not treat the first word as a
  // person's name, expand nicknames, or guess from a pronunciation hint.
  return trimmed.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[\s'’-]/g, '').toLowerCase();
}
export function resolveNameImpression(name: string, choice: NameFeel = 'auto'): NameImpressionBasis {
  if (choice !== 'auto') return { mode: 'explicit', resolved: choice,
    detail: `You chose ${explicitLabels[choice]}. Your choice takes priority over your original name’s usage pattern.`, sourceUrl: null };
  const key = nameKey(name);
  const counts = (reference.names as Record<string, number[]>)[key];
  const base: NameImpressionBasis = { mode: 'automatic', resolved: 'any',
    detail: 'We do not have a clear name-use pattern for this spelling, so we show a mix. You can choose an impression yourself.', sourceUrl: null };
  if (!counts || counts.length !== 8) return base;
  const total = counts[0] + counts[1];
  const male = counts[0] >= counts[1];
  const index = male ? 0 : 1;
  const share = counts[index] / total;
  const stable = [2, 4, 6].every(offset => {
    const bucketTotal = counts[offset] + counts[offset + 1];
    return bucketTotal < 100 || counts[offset + index] / bucketTotal >= .8;
  });
  const evidence = { sourceUrl: reference.sourceUrl, matchedName: key, reportedCount: total, dominantShare: share, referenceYears: reference.years };
  if (total < 1000 || share < .95 || !stable || ambiguousNames.has(key)) return { ...base, ...evidence,
    detail: 'This spelling has shared, changing, or culturally variable usage, so we show a mix. Choose an impression if you prefer a particular direction.' };
  const resolved = male ? 'masculine' : 'feminine';
  return { ...base, ...evidence, resolved,
    detail: `In our ${reference.years[0]}–${reference.years[1]} U.S. birth-name reference, this spelling was overwhelmingly used for ${male ? 'boys' : 'girls'}, so we favor ${resolved} Korean given names. You can change this preference.` };
}
