import assert from 'node:assert/strict';
const base = (process.argv[2] || 'http://localhost:3001').replace(/\/$/, '');
async function post(path, body) {
  const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}
for (const input of [
  { name: 'Jason', expected: 'masculine' },
  { name: 'Emma', expected: 'feminine' },
  { name: 'Alex', expected: 'any' },
  { name: 'Jason', nameFeel: 'feminine', expected: 'feminine' },
  { name: 'Jason', nameFeel: 'any', expected: 'any' },
]) {
  const created = await post('/api/names/generate', { ...input, birthDate: '1995-03-16', style: 'gentle' });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const { result, token, deleteToken } = created.body;
  try {
    assert.equal(result.nameFeel, input.nameFeel || 'auto');
    assert.equal(result.impressionBasis.resolved, input.expected);
    assert.equal(result.candidates.length, 5);
    assert(input.expected === 'any' ? new Set(result.candidates.map(item => item.presentation)).size === 3 : result.candidates.every(item => item.presentation === input.expected));
    const read = await post('/api/names/read', { id: result.id, token });
    assert.equal(read.status, 200);
    assert.deepEqual(read.body.result.impressionBasis, result.impressionBasis, 'The original basis must survive reload');
    assert.equal(read.body.result.nameFeel, input.nameFeel || 'auto');
    console.log(input.name, input.nameFeel || 'default', result.candidates.map(item => item.hangul).join(' '));
  } finally {
    assert.equal((await post('/api/names/delete', { id: result.id, deleteToken })).status, 204);
  }
}
console.log('Live automatic defaults, manual overrides, mixed options, and saved explanation passed.');
