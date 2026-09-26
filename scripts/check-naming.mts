import assert from 'node:assert/strict';
import { generateCandidates, validateNameRequest } from '../lib/names';
import { calculateSaju } from '../lib/saju';
import type { NameFeel, NameStyle } from '../lib/names';
import { buildReport } from '../lib/report';
import { shareCardText } from '../lib/name-card';
import { nameDirections } from '../lib/name-direction';
import { publicPollCandidate } from '../lib/poll-types';

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
const chart = calculateSaju({ birthDate: '1995-03-16', birthTime: null, birthZone: null });
for (const name of ['Emma', 'James', 'Noah', 'Sophia']) {
  const input = { name, pronunciationHint: null, style: 'any' as const, nameFeel: 'any' as const };
  const first = generateCandidates(input, chart);
  assert.deepEqual(new Set(first.map(item => item.presentation)), new Set(['masculine', 'feminine', 'neutral']), 'A mix must contain all three impressions.');
  const next = generateCandidates({ ...input, excludeNames: first.map(item => item.hangul) }, chart);
  assert.equal(next.length, 5);
  assert(next.every(item => !first.some(old => old.hangul === item.hangul)), 'Refinement must not repeat excluded names.');
  const result = { id: 'test', originalName: name, pronunciationHint: null, meaningHint: 'Private note', style: 'any' as const, nameFeel: 'any' as const, candidates: first, saju: chart, createdAt: 1, expiresAt: 2, algorithmVersion: 'test' };
  for (const candidate of first) {
    const report = buildReport(result, candidate.hangul);
    assert.equal(report.selectedName.hangul, candidate.hangul, 'Every selected name must open a report.');
    assert.equal(report.selectedName.characters.length, candidate.hanja ? 2 : 0, 'Unchecked names must not acquire invented characters in reports.');
    const card = shareCardText({ ...candidate, ...result } as typeof candidate);
    assert.deepEqual(Object.keys(card).sort(), ['hangul', 'hanja', 'romanization', 'syllables'], 'The card must allowlist name fields only.');
    assert(!JSON.stringify(card).includes('Private note'));
  }
}
const focusDifferences = examples.filter(([name, pronunciationHint, meaningHint, style, nameFeel]) => {
  const input = { name, pronunciationHint, meaningHint, style, nameFeel };
  return generateCandidates({ ...input, priority: 'sound' }, chart).map(item => item.hangul).join() !== generateCandidates({ ...input, priority: 'meaning' }, chart).map(item => item.hangul).join();
});
assert(focusDifferences.length > 0, 'An explicit naming focus should affect scenarios with supported connections; it should not invent missing connections.');
assert.equal(validateNameRequest({ name: 'Emma', birthDate: '1995-03-16', priority: 'bogus' }).ok, false);
assert.equal(validateNameRequest({ name: 'Emma', birthDate: '1995-03-16', excludeNames: ['bad'] }).ok, false);
const negated = generateCandidates({ name: 'Emma', pronunciationHint: null, meaningHint: 'I do not want peace. I prefer something bold.', style: 'any', nameFeel: 'any', priority: 'meaning' }, chart);
assert(negated.every(item => !item.meaningConnection), 'Explicitly negated themes must not be claimed as requested meanings.');
const avoided = generateCandidates({ name: 'James', pronunciationHint: 'JAYMZ', style: 'any', nameFeel: 'any', avoidTerms: ['Jun', '민', 'Ji-an'] }, chart);
assert.equal(avoided.length, 5);
assert.equal(new Set(avoided.map(item => item.presentation)).size, 3);
assert(avoided.every(item => !item.hangul.includes('민') && item.hangul !== '지안' && !item.syllables.split('-').some(syllable => syllable.toLowerCase() === 'jun')));
assert.equal(validateNameRequest({ name: 'Emma', birthDate: '1995-03-16', avoidTerms: ['--'] }).ok, false);
assert.equal(validateNameRequest({ name: 'Emma', birthDate: '1995-03-16', avoidTerms: ['지안', 'Jun'] }).ok, true);
assert.equal(validateNameRequest({ name: 'Emma', birthDate: '1995-03-16', avoidTerms: Array(11).fill('Jun') }).ok, false);
console.log('Mixed impressions, distinct refinements, focus, all-name reports, and card data minimization passed.');
assert.equal(validateNameRequest({ name: 'Emma', birthDate: '1995-03-16', direction: 'my-age' }).ok, false);
const legacy = validateNameRequest({ name: 'Emma', birthDate: '1995-03-16', style: 'classic' });
assert(legacy.ok && legacy.input.direction === 'timeless', 'Legacy classic inputs need a compatible direction.');
const directionSets = new Set<string>();
for (const direction of nameDirections) {
  const input = { name: 'Emma', pronunciationHint: 'EH-ma', style: 'any' as const, nameFeel: 'any' as const, direction };
  const candidates = generateCandidates(input, chart);
  assert.equal(candidates.length, 5);
  assert.equal(new Set(candidates.map(item => item.presentation)).size, 3);
  assert.deepEqual(candidates, generateCandidates(input, chart), 'Directions must be reproducible.');
  directionSets.add(candidates.map(item => item.hangul).join(','));
  for (const candidate of candidates) {
    const share = publicPollCandidate(candidate);
    assert.deepEqual(Object.keys(share).sort(), ['hangul', 'romanization', 'syllables']);
    assert(!JSON.stringify(share).includes('birth'));
  }
}
assert(directionSets.size > 1, 'Direction should affect supported recommendation cases.');
console.log('Name direction, legacy inputs, determinism, mixed impressions, and poll field allowlist passed.');
