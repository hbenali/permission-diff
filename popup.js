const out = document.getElementById('out');
// Firefox MV3 treats host permissions as optional: ask for them from a user gesture.
const ALL = { origins: ['<all_urls>'] };
chrome.permissions.contains(ALL).then(ok => {
  if (ok) return;
  const b = document.createElement('button');
  b.textContent = 'Grant access to all sites (required)';
  b.onclick = () => chrome.permissions.request(ALL).then(g => { if (g) location.reload(); });
  document.body.prepend(b);
});
const li = (items) => items.map(i => { const e = document.createElement('li'); const c = document.createElement('code'); c.textContent = i; e.append(c); return e; });
chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) =>
  chrome.runtime.sendMessage({ type: 'popup', tabId: tab.id })).then(r => {
  out.textContent = '';
  if (!r) { out.textContent = 'No data for this tab.'; return; }
  const p = document.createElement('p');
  p.textContent = r.baseline.visits === 0 ? `${r.site}: first visit, building baseline.` : `${r.site}: compared with ${r.baseline.visits} earlier visit(s).`;
  out.append(p);
  for (const [title, items] of [['New third-party domains', r.diff.thirdParties], ['Newly used capabilities', r.diff.capabilities]]) {
    if (!items.length) continue;
    const h = document.createElement('strong'); h.textContent = title;
    const ul = document.createElement('ul'); ul.append(...li(items)); out.append(h, ul);
  }
  if (!r.diff.thirdParties.length && !r.diff.capabilities.length && r.baseline.visits) out.append('No changes.');
});

// Clear everything the extension has stored (baselines and current visits).
const clear = document.createElement('button');
clear.textContent = 'Clear stored data';
clear.style.marginTop = '10px';
clear.onclick = async () => { await chrome.storage.local.clear(); await chrome.storage.session.clear(); location.reload(); };
document.body.append(clear);
