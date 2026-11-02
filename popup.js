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

function section(title, items, render) {
  const s = el('div', 'section'); s.append(el('h2', null, `${title} (${items.length})`));
  for (const i of items) s.append(render(i));
  return s;
}
const domainRow = d => { const r = el('div', 'item'); r.append(el('span', 'dot'), el('b', null, d)); return r; };
const capRow = c => {
  const [name, desc] = CAPS[c] || [c, 'Used by the page'];
  const r = el('div', 'item'); const t = el('div'); t.append(el('b', null, name), el('small', null, desc));
  r.append(el('span', 'dot'), t); return r;
};
function known(base) {
  const n = base.thirdParties.length + base.capabilities.length;
  if (!n) return null;
  const d = el('details'); d.append(el('summary', null, `Already known for this site (${n})`));
  const ul = el('ul');
  for (const x of [...base.thirdParties, ...base.capabilities]) ul.append(el('li', null, x));
  d.append(ul); return d;
}

chrome.tabs.query({ active: true, currentWindow: true })
  .then(([tab]) => chrome.runtime.sendMessage({ type: 'popup', tabId: tab.id }))
  .then(r => {
    const out = $('out'); out.textContent = '';
    if (!r) { out.append(el('div', 'hint', 'Nothing to show for this tab. Open a regular web page (http or https) and reload it.')); return; }
    const { site, diff, baseline } = r;
    const n = diff.thirdParties.length + diff.capabilities.length;
    out.append(el('div', 'site', site));
    const pill = $('pill'); pill.hidden = false;
    if (baseline.visits === 0) {
      out.append(el('div', 'sub', 'First visit: building a baseline. Changes are flagged from the next visit.'));
      pill.textContent = 'Baseline'; out.append(...[known(baseline)].filter(Boolean)); return;
    }
    out.append(el('div', 'sub', `Compared with ${baseline.visits} earlier visit${baseline.visits > 1 ? 's' : ''}`));
    pill.textContent = n ? `${n} new` : 'No changes'; pill.className = 'pill ' + (n ? 'bad' : 'ok');
    if (!n) { out.append(el('div', 'empty', '✓ Nothing new since your earlier visits')); }
    if (diff.capabilities.length) out.append(section('New capabilities', diff.capabilities, capRow));
    if (diff.thirdParties.length) out.append(section('New third-party domains', diff.thirdParties, domainRow));
    const k = known(baseline); if (k) out.append(k);
  })
  .catch(() => { $('out').textContent = 'Could not read data for this tab.'; });
