import { normalizeBaseline, emptyVisit, diffVisit, mergeBaseline, trustItem, countDiff, isThirdParty, scriptKey } from './diff.js';

const MAX_SCRIPT_BYTES = 3 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10000;

// All read-modify-write on storage goes through one queue: request events arrive concurrently
// and would otherwise overwrite each other's updates.
let chain = Promise.resolve();
const serial = fn => { const p = chain.then(fn); chain = p.catch(() => {}); return p; };

const getVisit = async tabId => (await chrome.storage.session.get('v' + tabId))['v' + tabId] || null;
const setVisit = (tabId, v) => chrome.storage.session.set({ ['v' + tabId]: v });
const getBaseline = async site => normalizeBaseline((await chrome.storage.local.get('b:' + site))['b:' + site]);
const setBaseline = (site, b) => chrome.storage.local.set({ ['b:' + site]: b });
const isMuted = async site => !!(await chrome.storage.local.get('m:' + site))['m:' + site];

async function refresh(tabId, v) {
  v.diff = diffVisit(await getBaseline(v.site), v);
  await setVisit(tabId, v);
  const n = (await isMuted(v.site)) ? 0 : countDiff(v.diff);
  chrome.action.setBadgeText({ tabId, text: n ? String(n) : '' });
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#c0392b' });
}

const commit = tabId => serial(async () => {
  const v = await getVisit(tabId);
  if (!v) return;
  await setBaseline(v.site, mergeBaseline(await getBaseline(v.site), v));
  await chrome.storage.session.remove('v' + tabId);
});

const observe = (tabId, kind, value) => serial(async () => {
  const v = await getVisit(tabId);
  if (!v || v[kind].includes(value)) return;
  v[kind].push(value);
  await refresh(tabId, v);
});

const observeScript = (tabId, key, hash) => serial(async () => {
  const v = await getVisit(tabId);
  if (!v || v.scripts[key] === hash) return;
  v.scripts[key] = hash;
  await refresh(tabId, v);
});

chrome.webNavigation.onCommitted.addListener(d => {
  if (d.frameId !== 0 || !/^https?:/.test(d.url)) return;
  serial(async () => {
    const v = await getVisit(d.tabId);
    if (v) { await setBaseline(v.site, mergeBaseline(await getBaseline(v.site), v)); }
    await setVisit(d.tabId, { site: new URL(d.url).hostname, ...emptyVisit(), diff: { thirdParties: [], capabilities: [], scripts: [] } });
    chrome.action.setBadgeText({ tabId: d.tabId, text: '' });
  });
});
chrome.tabs.onRemoved.addListener(commit);

chrome.webRequest.onBeforeRequest.addListener(d => {
  if (d.tabId < 0) return;
  getVisit(d.tabId).then(v => {
    if (!v) return;
    const host = new URL(d.url).hostname;
    if (isThirdParty(v.site, host)) observe(d.tabId, 'thirdParties', host);
  });
}, { urls: ['http://*/*', 'https://*/*'] });

// External scripts: hash the body. Chrome cannot read response bodies, so the script is requested
// again from the browser cache (usually no network traffic), without cookies. Only the hash is kept.
async function sha256Short(url) {
  const res = await fetch(url, { cache: 'force-cache', credentials: 'omit', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) return null;
  if (Number(res.headers.get('content-length')) > MAX_SCRIPT_BYTES) return null;
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_SCRIPT_BYTES) return null;
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  return Array.from(h.slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');
}
chrome.webRequest.onCompleted.addListener(d => {
  if (d.tabId < 0 || d.statusCode !== 200) return;
  const key = scriptKey(d.url);
  if (!key) return;
  sha256Short(d.url).then(hash => hash && observeScript(d.tabId, key, hash)).catch(() => {});
}, { urls: ['http://*/*', 'https://*/*'], types: ['script'] });

chrome.runtime.onMessage.addListener((m, sender, respond) => {
  if (m.type === 'cap' && sender.tab) { observe(sender.tab.id, 'capabilities', m.cap); return; }
  if (m.type === 'popup') { popupState(m.tabId).then(respond); return true; }
  if (m.type === 'trust') { trust(m.tabId, m.kind, m.value).then(respond); return true; }
  if (m.type === 'mute') { mute(m.tabId, m.muted).then(respond); return true; }
});

async function popupState(tabId) {
  const v = await getVisit(tabId);
  if (!v) return null;
  return { site: v.site, diff: v.diff, baseline: await getBaseline(v.site), muted: await isMuted(v.site) };
}

const trust = (tabId, kind, value) => serial(async () => {
  const v = await getVisit(tabId);
  if (!v || !['thirdParties', 'capabilities', 'scripts', 'all'].includes(kind)) return null;
  let b = await getBaseline(v.site);
  const items = kind === 'all'
    ? ['thirdParties', 'capabilities', 'scripts'].flatMap(k => v.diff[k].map(x => [k, x]))
    : [[kind, value]];
  for (const [k, x] of items) b = trustItem(b, v, k, x);
  await setBaseline(v.site, b);
  await refresh(tabId, v);
  return popupState(tabId);
});

const mute = (tabId, muted) => serial(async () => {
  const v = await getVisit(tabId);
  if (!v) return null;
  if (muted) await chrome.storage.local.set({ ['m:' + v.site]: true });
  else await chrome.storage.local.remove('m:' + v.site);
  await refresh(tabId, v);
  return popupState(tabId);
});
