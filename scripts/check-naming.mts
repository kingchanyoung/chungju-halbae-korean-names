import assert from 'node:assert/strict';
import { generateCandidates, validateNameRequest } from '../lib/names';
import { calculateSaju } from '../lib/saju';
import type { NameFeel, NameStyle } from '../lib/names';

function names(name: string, birthDate: string, meaningHint: string, style: NameStyle, nameFeel: NameFeel, pronunciationHint: string | null = null) {
  const chart = calculateSaju({ birthDate, birthTime: null, birthZone: null });
  return generateCandidates({ name, pronunciationHint, meaningHint, style, nameFeel }, chart);
}

const examples: [string, string, string, NameStyle, NameFeel][] = [
  ['Emma', 'EH-ma', 'peace', 'gentle', 'feminine'],
  ['James', 'JAYMZ', 'strength', 'classic', 'masculine'],
  ['Sophia', 'so-FEE-uh', 'wisdom', 'gentle', 'feminine'],
  ['Olivia', 'o-LIV-ee-uh', 'nature', 'modern', 'feminine'],
  ['Liam', 'LEE-um', 'hope', 'modern', 'masculine'],
  ['Noah', 'NO-uh', 'light', 'gentle', 'masculine'],
  ['Ava', 'AY-vuh', 'kindness', 'bright', 'feminine'],
  ['Isabella', 'iz-uh-BEL-uh', 'creativity', 'classic', 'feminine'],
  ['Lucas', 'LOO-kus', 'strength', 'classic', 'masculine'],
  ['Mia', 'MEE-uh', 'peace', 'gentle', 'feminine'],
];
for (const [name, hint, meaning, style, feel] of examples) {
  const result = names(name, '1995-03-16', meaning, style, feel, hint);
  assert.equal(result.length, 5);
  assert.equal(new Set(result.map(candidate => candidate.hangul[0])).size, 5);
  assert(result.every(candidate => candidate.presentation === feel));
  assert(result.every(candidate => candidate.evidence));
  assert(result.every(candidate => !candidate.evidence?.meaning.matched || !!candidate.hanja));
  assert(result.every(candidate => !candidate.evidence?.birth.matched || !!candidate.hanja));
  console.log(name.padEnd(10), result.map(candidate => candidate.hangul + '[' +
    (candidate.evidence?.sound.matched ? 'S' : '') +
    (candidate.evidence?.meaning.matched ? 'M' : '') +
    (candidate.evidence?.birth.matched ? 'B' : '') + ']').join(' '));
}
const valid = validateNameRequest({ name: 'Sofía', birthDate: '1995-03-16', style: 'any', nameFeel: 'any', meaningHint: 'wisdom' });
assert.equal(valid.ok, true);
const invalid = validateNameRequest({ name: 'Sofía', birthDate: 'not-a-date' });
assert.equal(invalid.ok, false);
assert.equal(calculateSaju({ birthDate: '1995-03-16', birthTime: null, birthZone: null }).hour, null);
assert(calculateSaju({ birthDate: '1995-03-16', birthTime: '13:20', birthZone: 'America/New_York' }).hour);
const dates = Array.from({ length: 20 }, (_, index) => `1995-03-${String(index + 1).padStart(2, '0')}`);
const birthFingerprints = new Set(dates.map(date => names('Emma', date, 'peace', 'gentle', 'feminine', 'EH-ma').map(candidate => candidate.hangul).join(',')));
console.log('Distinct Emma top-five sets across 20 birth dates:', birthFingerprints.size);
assert(birthFingerprints.size > 1, 'Birth date should affect at least some recommendations when a checked Hanja link is available.');
assert.notDeepEqual(
  names('Emma', '1995-03-16', 'peace', 'gentle', 'feminine', 'EH-ma').map(candidate => candidate.hangul),
  names('Emma', '1995-03-16', 'wisdom', 'gentle', 'feminine', 'EH-ma').map(candidate => candidate.hangul),
  'A recognized personal meaning should affect the recommendation.'
);
