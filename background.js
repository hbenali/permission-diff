import { emptyBaseline, diffVisit, mergeBaseline, isThirdParty } from './diff.js';

// Per-tab current visit lives in session storage (service workers get suspended).
const getVisit = async tabId => (await chrome.storage.session.get('v' + tabId))['v' + tabId] || null;
const setVisit = (tabId, v) => chrome.storage.session.set({ ['v' + tabId]: v });
const getBaseline = async site => (await chrome.storage.local.get('b:' + site))['b:' + site] || emptyBaseline();

async function commit(tabId) {
  const v = await getVisit(tabId);
  if (!v) return;
  const base = await getBaseline(v.site);
  await chrome.storage.local.set({ ['b:' + v.site]: mergeBaseline(base, { thirdParties: v.thirdParties, capabilities: v.capabilities }) });
  await chrome.storage.session.remove('v' + tabId);
}

async function observe(tabId, kind, value) {
  const v = await getVisit(tabId);
  if (!v || !v[kind].includes(value)) {
    if (!v) return;
    v[kind].push(value);
    const d = diffVisit(await getBaseline(v.site), v);
    v.diff = d;
    await setVisit(tabId, v);
    const n = d.thirdParties.length + d.capabilities.length;
    chrome.action.setBadgeText({ tabId, text: n ? String(n) : '' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#c0392b' });
  }
}

chrome.webNavigation.onCommitted.addListener(async d => {
  if (d.frameId !== 0 || !/^https?:/.test(d.url)) return;
  await commit(d.tabId);
  await setVisit(d.tabId, { site: new URL(d.url).hostname, thirdParties: [], capabilities: [], diff: { thirdParties: [], capabilities: [] } });
  chrome.action.setBadgeText({ tabId: d.tabId, text: '' });
});
chrome.tabs.onRemoved.addListener(commit);

chrome.webRequest.onBeforeRequest.addListener(async d => {
  if (d.tabId < 0) return;
  const v = await getVisit(d.tabId);
  if (!v) return;
  const host = new URL(d.url).hostname;
  if (isThirdParty(v.site, host)) await observe(d.tabId, 'thirdParties', host);
}, { urls: ['http://*/*', 'https://*/*'] });

chrome.runtime.onMessage.addListener((m, sender) => {
  if (m.type === 'cap' && sender.tab) observe(sender.tab.id, 'capabilities', m.cap);
});

chrome.runtime.onMessage.addListener((m, _s, respond) => {
  if (m.type !== 'popup') return;
  getVisit(m.tabId).then(async v => respond(v ? { site: v.site, diff: v.diff, baseline: await getBaseline(v.site) } : null));
  return true;
});
