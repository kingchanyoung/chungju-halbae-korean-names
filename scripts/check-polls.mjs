import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
async function post(path, body) {
  const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json().catch(() => ({})) };
}
for (const path of ['/', '/beta-guide', '/name-vote', '/beta-privacy', '/plans']) assert.equal((await fetch(base + path)).status, 200, `${path} must be anonymously available`);
const generated = await post('/api/names/generate', { name: 'Emma', meaningHint: 'PRIVATE TEST NOTE peace', birthDate: '1995-03-16', style: 'gentle', nameFeel: 'any', direction: 'timeless', priority: 'meaning' });
assert.equal(generated.status, 200, JSON.stringify(generated.body));
const { result, token, deleteToken } = generated.body;
try {
  assert.equal(result.direction, 'timeless');
  const restored = await post('/api/names/read', { id: result.id, token });
  assert.equal(restored.body.result.direction, 'timeless');
  const names = result.candidates.slice(0, 3).map(item => item.hangul);
  const create = { sourceId: result.id, deleteToken, names };
  assert.equal((await post('/api/name-polls', { ...create, deleteToken: token })).status, 404, 'A shared read key must not create a poll');
  const unknown = ['가각', '가갂', '가갃'].find(name => !result.candidates.some(item => item.hangul === name));
  assert.equal((await post('/api/name-polls', { ...create, names: [names[0], unknown] })).status, 400, 'Only original candidate names may be published');
  const created = await post('/api/name-polls', create);
  assert.equal(created.status, 200, JSON.stringify(created.body));
  assert.equal((await post('/api/name-polls', create)).status, 409, 'A result has one active poll');
  const access = { id: created.body.id, token: created.body.token, browserId: randomUUID() };
  assert.notEqual(access.token, token);
  const read = await post('/api/name-polls/read', access);
  assert.equal(read.status, 200, JSON.stringify(read.body));
  assert.equal(read.body.poll.candidates.length, 3);
  for (const candidate of read.body.poll.candidates) assert.deepEqual(Object.keys(candidate).sort(), ['hangul', 'romanization', 'syllables', 'votes']);
  const publicBody = JSON.stringify(read.body);
  for (const value of [result.id, 'Emma', 'PRIVATE TEST NOTE', '1995-03-16', token, deleteToken]) assert(!publicBody.includes(value), 'Poll must not expose private source data');
  assert.equal((await post('/api/name-polls/vote', { ...access, selectedName: unknown })).status, 400);
  const vote = await post('/api/name-polls/vote', { ...access, selectedName: names[0] });
  assert.equal(vote.status, 200, JSON.stringify(vote.body));
  const retry = await post('/api/name-polls/vote', { ...access, selectedName: names[1] });
  assert.equal(retry.status, 200, JSON.stringify(retry.body));
  assert.equal(retry.body.poll.myVote, names[0], 'First vote is retained');
  assert.equal(retry.body.poll.candidates.reduce((sum, item) => sum + item.votes, 0), 1, 'Retry must not add a vote');
  const second = await post('/api/name-polls/vote', { ...access, browserId: randomUUID(), selectedName: names[1] });
  assert.equal(second.status, 200, JSON.stringify(second.body));
  assert.equal(second.body.poll.candidates.reduce((sum, item) => sum + item.votes, 0), 2);
  assert.equal((await post('/api/name-polls/delete', { sourceId: result.id, deleteToken: token })).status, 404, 'Shared key cannot close a poll');
  assert.equal((await post('/api/name-polls/delete', { sourceId: result.id, deleteToken })).status, 204);
  assert.equal((await post('/api/name-polls/read', access)).status, 404, 'Closing a poll invalidates its link');
  const reopened = await post('/api/name-polls', create);
  assert.equal(reopened.status, 200, JSON.stringify(reopened.body));
  const newAccess = { id: reopened.body.id, token: reopened.body.token };
  assert.equal((await post('/api/name-polls/read', newAccess)).body.poll.candidates.reduce((sum, item) => sum + item.votes, 0), 0, 'A new poll starts with no old votes');
  assert.equal((await post('/api/name-polls/vote', { ...newAccess, browserId: randomUUID(), selectedName: names[0] })).status, 200, 'A reopened poll can receive new votes');
  assert.equal((await post('/api/names/delete', { id: result.id, deleteToken })).status, 204);
  assert.equal((await post('/api/name-polls/read', newAccess)).status, 404, 'Deleting the source invalidates its poll');
  assert.equal((await post('/api/name-polls/vote', { ...newAccess, browserId: randomUUID(), selectedName: names[0] })).status, 404);
  console.log('Passed: anonymous team pages, saved direction, poll owner authorization, public field allowlist, idempotent votes, poll closure, source deletion.');
} finally {
  await post('/api/names/delete', { id: result.id, deleteToken });
}
