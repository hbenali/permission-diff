import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyBaseline, diffVisit, mergeBaseline, isThirdParty, registrableHost } from '../diff.js';

test('first visit yields no alerts', () => {
  assert.deepEqual(diffVisit(emptyBaseline(), { thirdParties: ['x.com'], capabilities: ['geolocation'] }), { thirdParties: [], capabilities: [] });
});
test('new domain and capability after baseline are flagged', () => {
  const b = mergeBaseline(emptyBaseline(), { thirdParties: ['cdn.a.com'], capabilities: [] });
  assert.deepEqual(diffVisit(b, { thirdParties: ['cdn.a.com', 'evil.io'], capabilities: ['clipboard-read'] }),
    { thirdParties: ['evil.io'], capabilities: ['clipboard-read'] });
});
test('third-party detection uses registrable domain', () => {
  assert.equal(isThirdParty('www.example.com', 'static.example.com'), false);
  assert.equal(isThirdParty('www.example.co.uk', 'cdn.other.co.uk'), true);
  assert.equal(registrableHost('a.b.example.co.uk'), 'example.co.uk');
});
