const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

const CAPS = {
  'geolocation': ['Location', 'Asked for your position'],
  'camera/microphone': ['Camera or microphone', 'Asked to record from your devices'],
  'screen-capture': ['Screen capture', 'Asked to record your screen'],
  'clipboard-read': ['Clipboard read', 'Read what you copied'],
  'service-worker': ['Service worker', 'Registered a background script for this site'],
  'notifications': ['Notifications', 'Asked to show notifications'],
  'webrtc': ['WebRTC', 'Opened a peer-to-peer connection (can reveal your IP address)'],
};

// Firefox MV3 treats host permissions as optional: ask from a user gesture.
const ALL = { origins: ['<all_urls>'] };
chrome.permissions.contains(ALL).then(ok => {
  if (ok) return;
  $('grant').hidden = false;
  $('grant-btn').onclick = () => chrome.permissions.request(ALL).then(g => { if (g) location.reload(); });
});

// Two-step clear without a blocking confirm() dialog.
let armed = false;
$('clear').onclick = async e => {
  if (!armed) { armed = true; e.target.textContent = 'Click again to delete all data'; e.target.classList.add('armed'); return; }
  await chrome.storage.local.clear(); await chrome.storage.session.clear(); location.reload();
};

let tabId = null;
const send = msg => chrome.runtime.sendMessage({ ...msg, tabId });
const trust = (kind, value) => send({ type: 'trust', kind, value }).then(render);

function section(title, kind, items, rowText) {
  const s = el('div', 'section');
  const head = el('div', 'sechead'); head.append(el('h2', null, `${title} (${items.length})`));
  if (items.length > 1) { const b = el('button', 'trustall', 'Trust all'); b.onclick = async () => { for (const i of items) await send({ type: 'trust', kind, value: i }); send({ type: 'popup' }).then(render); }; head.append(b); }
  s.append(head);
  for (const i of items) {
    const [name, desc] = rowText(i);
    const r = el('div', 'item'); const t = el('div', 'txt'); t.append(el('b', null, name)); if (desc) t.append(el('small', null, desc));
    const b = el('button', 'trust', 'Trust'); b.title = 'Treat as expected for this site'; b.onclick = () => trust(kind, i);
    r.append(el('span', 'dot'), t, b); s.append(r);
  }
  return s;
}
const capText = c => CAPS[c] || [c, 'Used by the page'];
const domText = d => [d, null];
const scriptText = k => [k, 'Script content changed since your last visit'];

function known(base) {
  const items = [...base.thirdParties, ...base.capabilities, ...Object.keys(base.scripts || {}).map(k => k + ' (script)')];
  if (!items.length) return null;
  const d = el('details'); d.append(el('summary', null, `Already known for this site (${items.length})`));
  const ul = el('ul'); for (const x of items) ul.append(el('li', null, x));
  d.append(ul); return d;
}

function render(r) {
  const out = $('out'); out.textContent = '';
  const pill = $('pill'); pill.hidden = true; pill.className = 'pill';
  $('mute').hidden = !r;
  if (!r) { out.append(el('div', 'hint', 'Nothing to show for this tab. Open a regular web page (http or https) and reload it.')); return; }
  const { site, diff, baseline, muted } = r;
  const n = diff.thirdParties.length + diff.capabilities.length + diff.scripts.length;
  $('mute').textContent = muted ? 'Unmute this site' : 'Mute this site';
  $('mute').onclick = () => send({ type: 'mute', muted: !muted }).then(render);
  out.append(el('div', 'site', site));
  pill.hidden = false;
  if (muted) {
    pill.textContent = 'Muted'; pill.classList.add('mute');
    out.append(el('div', 'sub', 'Changes are still recorded, but the badge stays quiet for this site.'));
    if (n) out.append(el('div', 'muted-note', `${n} change${n > 1 ? 's' : ''} hidden while muted.`));
    return;
  }
  if (baseline.visits === 0) {
    out.append(el('div', 'sub', 'First visit: building a baseline. Changes are flagged from the next visit.'));
    pill.textContent = 'Baseline'; const k = known(baseline); if (k) out.append(k); return;
  }
  out.append(el('div', 'sub', `Compared with ${baseline.visits} earlier visit${baseline.visits > 1 ? 's' : ''}`));
  pill.textContent = n ? `${n} new` : 'No changes'; pill.classList.add(n ? 'bad' : 'ok');
  if (!n) out.append(el('div', 'empty', '✓ Nothing new since your earlier visits'));
  if (diff.capabilities.length) out.append(section('New capabilities', 'capabilities', diff.capabilities, capText));
  if (diff.scripts.length) out.append(section('Changed scripts', 'scripts', diff.scripts, scriptText));
  if (diff.thirdParties.length) out.append(section('New third-party domains', 'thirdParties', diff.thirdParties, domText));
  const k = known(baseline); if (k) out.append(k);
}

chrome.tabs.query({ active: true, currentWindow: true })
  .then(([tab]) => { tabId = tab.id; return send({ type: 'popup' }); })
  .then(render)
  .catch(() => { $('out').textContent = 'Could not read data for this tab.'; });
