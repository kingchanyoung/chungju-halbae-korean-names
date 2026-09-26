import verified from './hanja_verified.json';
import type { NameResult } from './names';

export type Report = ReturnType<typeof buildReport>;

export function buildReport(result: NameResult, selectedHangul: string) {
  const selected = result.candidates.find(candidate => candidate.hangul === selectedHangul);
  if (!selected) throw new Error('Choose a name from this result.');
  const pair = verified.names.find(name => name.hangul === selectedHangul);
  const checkedPair = pair?.characterAndReadingCheck === 'passed' ? pair : null;
  const syllables = [...selectedHangul];
  const glyphs = [...(checkedPair?.hanja || '')];
  const characters = (checkedPair?.characterReferences || []).map((reference, index) => {
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
  if (checkedPair && characters.length !== 2) throw new Error('The name needs two verified characters.');
  return {
    productId: 'korean_name_report_v1',
    reportVersion: '2.0.0',
    originalName: result.originalName,
    pronunciationHint: result.pronunciationHint,
    meaningHint: result.meaningHint,
    requestedStyle: result.style,
    requestedNameFeel: result.nameFeel,
    requestedDirection: result.direction || (result.style === 'classic' ? 'timeless' : result.style === 'modern' ? 'contemporary' : 'any'),
    saju: result.saju,
    selectedName: { ...selected, hanja: checkedPair?.hanja || null, characters },
    introduction: {
      korean: `안녕하세요, 제 한국 이름은 ${selectedHangul}입니다.`,
      english: `Hello, my Korean name is ${selected.romanization}.`,
    },
    priority: result.priority || 'balanced',
    avoidTerms: result.avoidTerms || [],
    comparison: result.candidates.map((candidate, index) => ({
      rank: index + 1, hangul: candidate.hangul,
      romanization: candidate.romanization, impression: candidate.impression,
      reason: candidate.reason, selected: candidate.hangul === selectedHangul,
    })),
    sourceResultId: result.id,
    sourceAlgorithmVersion: result.algorithmVersion,
    verification: {
      checkedAtUtc: checkedPair ? verified.retrievedAtUtc : null,
      characterAndReadingCheck: checkedPair ? 'passed' : 'not assigned',
      wholeNameCourtValidation: 'not checked',
      englishGlossStatus: 'editorial translation of official Korean hun',
      officialLookupPage: verified.officialLookupPage,
    },
    notes: [
      'This is a Korean given name. A family name is not assigned.',
      checkedPair ? 'A Hangul name can have multiple possible Hanja pairings; this report presents one checked character pairing.' : 'No Hanja spelling has been assigned to this name. Its Hangul spelling has no single fixed character meaning.',
      checkedPair ? 'The individual characters and readings were checked, but legal registration of the whole name was not verified.' : 'Character meanings and birth-chart imagery cannot be assigned without a checked Hanja spelling.',
      'This report is for personal and cultural exploration, not a legal name-change document.',
      result.saju
        ? 'Available day, month, year and hour stem elements can inform ranking for checked Hanja images. This editorial association is not a yongshin calculation or certified missing-element remedy.'
        : 'This example has no birth-chart calculation.',
    ],
  };
}
