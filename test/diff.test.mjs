import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyBaseline, emptyVisit, diffVisit, mergeBaseline, isThirdParty, registrableHost, scriptKey, trustItem, normalizeBaseline, countDiff, MAX_SCRIPTS } from '../diff.js';

const visit = o => ({ ...emptyVisit(), ...o });

test('first visit yields no alerts', () => {
  assert.deepEqual(diffVisit(emptyBaseline(), visit({ thirdParties: ['x.com'], capabilities: ['geolocation'], scripts: { 'a/x.js': '1' } })),
    { thirdParties: [], capabilities: [], scripts: [] });
});
test('new domain and capability after baseline are flagged', () => {
  const b = mergeBaseline(emptyBaseline(), visit({ thirdParties: ['cdn.a.com'] }));
  assert.deepEqual(diffVisit(b, visit({ thirdParties: ['cdn.a.com', 'evil.io'], capabilities: ['clipboard-read'] })),
    { thirdParties: ['evil.io'], capabilities: ['clipboard-read'], scripts: [] });
});
test('third-party detection uses registrable domain', () => {
  assert.equal(isThirdParty('www.example.com', 'static.example.com'), false);
  assert.equal(isThirdParty('www.example.co.uk', 'cdn.other.co.uk'), true);
  assert.equal(registrableHost('a.b.example.co.uk'), 'example.co.uk');
});
test('scriptKey drops the query string and fragment', () => {
  assert.equal(scriptKey('https://cdn.a.com/lib/app.js?v=3#x'), 'cdn.a.com/lib/app.js');
  assert.equal(scriptKey('not a url'), null);
});
test('a script whose content hash changed is flagged; a new script is not', () => {
  const b = mergeBaseline(emptyBaseline(), visit({ scripts: { 'cdn.a.com/app.js': 'aaa' } }));
  const d = diffVisit(b, visit({ scripts: { 'cdn.a.com/app.js': 'bbb', 'cdn.a.com/new.js': 'ccc' } }));
  assert.deepEqual(d.scripts, ['cdn.a.com/app.js']);
});
test('an unchanged script is not flagged', () => {
  const b = mergeBaseline(emptyBaseline(), visit({ scripts: { 'k': 'aaa' } }));
  assert.deepEqual(diffVisit(b, visit({ scripts: { k: 'aaa' } })).scripts, []);
});
test('merge keeps the latest hash, so a change is flagged once', () => {
  let b = mergeBaseline(emptyBaseline(), visit({ scripts: { k: 'aaa' } }));
  b = mergeBaseline(b, visit({ scripts: { k: 'bbb' } }));
  assert.deepEqual(diffVisit(b, visit({ scripts: { k: 'bbb' } })).scripts, []);
});
test('baselines from older versions (no scripts field) still work', () => {
  const old = { visits: 2, thirdParties: ['a.com'], capabilities: [] };
  assert.deepEqual(normalizeBaseline(old).scripts, {});
  assert.deepEqual(diffVisit(old, visit({ thirdParties: ['b.com'], scripts: { k: 'x' } })),
    { thirdParties: ['b.com'], capabilities: [], scripts: [] });
});
test('trusting an item removes it from the next diff without counting a visit', () => {
  const b0 = mergeBaseline(emptyBaseline(), visit({ thirdParties: ['a.com'], scripts: { k: 'aaa' } }));
  const v = visit({ thirdParties: ['a.com', 'evil.io'], capabilities: ['webrtc'], scripts: { k: 'bbb' } });
  let b = trustItem(b0, v, 'thirdParties', 'evil.io');
  b = trustItem(b, v, 'capabilities', 'webrtc');
  b = trustItem(b, v, 'scripts', 'k');
  assert.equal(b.visits, b0.visits);
  assert.equal(countDiff(diffVisit(b, v)), 0);
});
test('trusting a script that was not seen this visit changes nothing', () => {
  const b0 = mergeBaseline(emptyBaseline(), visit({ scripts: { k: 'aaa' } }));
  assert.deepEqual(trustItem(b0, visit(), 'scripts', 'k').scripts, { k: 'aaa' });
});
test('script map is capped', () => {
  const scripts = Object.fromEntries(Array.from({ length: MAX_SCRIPTS + 20 }, (_, i) => ['h/s' + i + '.js', 'x']));
  assert.equal(Object.keys(mergeBaseline(emptyBaseline(), visit({ scripts })).scripts).length, MAX_SCRIPTS);
});
