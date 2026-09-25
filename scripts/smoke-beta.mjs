import assert from 'node:assert/strict';

const base = (process.argv[2] || 'http://localhost:3001').replace(/\/$/, '');

async function post(path, body) {
  const response = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}

const homepage = await fetch(base + '/');
assert.equal(homepage.status, 200, 'homepage should be reachable without sign-in');
const privacy = await fetch(base + '/beta-privacy');
assert.equal(privacy.status, 200, 'privacy page should be reachable');

const generated = await post('/api/names/generate', {
  name: 'Emma', pronunciationHint: 'EH-ma', meaningHint: 'peace and kindness',
  birthDate: '1995-03-16', style: 'gentle', nameFeel: 'feminine',
});
assert.equal(generated.status, 200, JSON.stringify(generated.body));
const { result, token, deleteToken } = generated.body;
assert.equal(result.candidates.length, 5);
assert.equal(new Set(result.candidates.map(candidate => candidate.hangul)).size, 5);
assert.ok(token && deleteToken && token !== deleteToken, 'read and delete keys must differ');
assert.ok(!JSON.stringify(result).includes('1995-03-16'), 'exact birth date must not be saved in result');

const sharedRead = await post('/api/names/read', { id: result.id, token });
assert.equal(sharedRead.status, 200, JSON.stringify(sharedRead.body));
assert.equal(sharedRead.body.result.id, result.id);

const sharedDelete = await post('/api/names/delete', { id: result.id, deleteToken: token });
assert.equal(sharedDelete.status, 404, 'read-only shared link must not delete result');

const feedback = await post('/api/beta-feedback', {
  rating: 5, selectedName: result.candidates[0].hangul, comment: 'Beta smoke test',
});
assert.equal(feedback.status, 200, JSON.stringify(feedback.body));

const ownerDelete = await post('/api/names/delete', { id: result.id, deleteToken });
assert.equal(ownerDelete.status, 204, JSON.stringify(ownerDelete.body));
const afterDelete = await post('/api/names/read', { id: result.id, token });
assert.equal(afterDelete.status, 404);

console.log('Beta smoke check passed: anonymous pages, five names, read-only share, feedback, owner deletion.');
