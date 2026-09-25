// Default reading guide based on the National Institute of Korean Language's
// Revised Romanization tables. Personal spellings may differ by preference.
const onset = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const vowel = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const coda = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
const linkedCoda: Record<number, string> = {
  1: 'g', 2: 'kk', 4: 'n', 7: 'd', 8: 'r', 16: 'm', 17: 'b',
  19: 's', 20: 'ss', 22: 'j', 23: 'ch', 24: 'k', 25: 't', 26: 'p',
};

function split(syllable: string) {
  const value = syllable.codePointAt(0)! - 0xac00;
  if (value < 0 || value >= 11172) throw new Error('Expected a Hangul syllable.');
  return { onset: Math.floor(value / 588), vowel: Math.floor((value % 588) / 28), coda: value % 28 };
}

export function romanizeGivenName(hangul: string) {
  const characters = [...hangul];
  if (characters.length !== 2) throw new Error('Expected a two-syllable given name.');
  const first = split(characters[0]);
  const second = split(characters[1]);
  const literal = [
    onset[first.onset] + vowel[first.vowel] + coda[first.coda],
    onset[second.onset] + vowel[second.vowel] + coda[second.coda],
  ];
  const link = second.onset === 11 ? linkedCoda[first.coda] : undefined;
  const continuous = link
    ? onset[first.onset] + vowel[first.vowel] + link + vowel[second.vowel] + coda[second.coda]
    : literal.join('');
  return {
    romanization: continuous[0].toUpperCase() + continuous.slice(1),
    romanization_hyphenated: literal[0][0].toUpperCase() + literal[0].slice(1) + '-' + literal[1],
  };
}
