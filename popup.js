const out = document.getElementById('out');
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
