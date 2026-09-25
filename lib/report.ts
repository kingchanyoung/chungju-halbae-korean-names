import verified from './hanja_verified.json';
import type { NameResult } from './names';

export type Report = ReturnType<typeof buildReport>;

export function buildReport(result: NameResult, selectedHangul: string) {
  const selected = result.candidates.find(candidate => candidate.hangul === selectedHangul);
  if (!selected) throw new Error('Choose a name from this result.');
  const pair = verified.names.find(name => name.hangul === selectedHangul);
  if (!pair || pair.characterAndReadingCheck !== 'passed') throw new Error('Hanja is not ready for this name.');
  const syllables = [...selectedHangul];
  const glyphs = [...pair.hanja];
  const characters = pair.characterReferences.map((reference, index) => {
    const character = verified.characters.find(item => item.unicode === reference);
    const reading = syllables[index];
    if (!character || !reading || character.character !== glyphs[index] ||
        !character.designatedReadings.includes(reading) ||
        character.officialFields.isinmyung !== 1 || !character.officialFields.use)
      throw new Error('A Hanja character is not verified.');
    return {
      character: character.character,
      reading: [reading],
      englishGloss: character.englishGloss,
      koreanDefinition: character.officialKoreanHun,
      officialRecordUrl: character.sourceUrl,
    };
  });
  if (characters.length !== 2) throw new Error('The name needs two verified characters.');
  return {
    productId: 'korean_name_report_v1',
    reportVersion: '1.1.0',
    originalName: result.originalName,
    pronunciationHint: result.pronunciationHint,
    meaningHint: result.meaningHint,
    requestedStyle: result.style,
    saju: result.saju,
    selectedName: { ...selected, hanja: pair.hanja, characters },
    comparison: result.candidates.map((candidate, index) => ({
      rank: index + 1, hangul: candidate.hangul,
      romanization: candidate.romanization, impression: candidate.impression,
      reason: candidate.reason, selected: candidate.hangul === selectedHangul,
    })),
    sourceResultId: result.id,
    sourceAlgorithmVersion: result.algorithmVersion,
    verification: {
      checkedAtUtc: verified.retrievedAtUtc,
      characterAndReadingCheck: 'passed',
      wholeNameCourtValidation: 'not checked',
      englishGlossStatus: 'editorial translation of official Korean hun',
      officialLookupPage: verified.officialLookupPage,
    },
    notes: [
      'This is a Korean given name. A family name is not assigned.',
      'A Hangul name can have multiple possible Hanja pairings; this report presents one checked character pairing.',
      'The individual characters and readings were checked, but legal registration of the whole name was not verified.',
      'This report is for personal and cultural exploration, not a legal name-change document.',
      result.saju
        ? 'The day-stem element was calculated from a traditional Four Pillars chart. Hanja imagery used for ranking is editorial, not a certified missing-element remedy.'
        : 'This example has no birth-chart calculation.',
    ],
  };
}
